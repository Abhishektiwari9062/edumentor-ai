'use client'
import { useEffect, useState } from 'react'

export default function IntroScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0)
  const [fadingOut, setFadingOut] = useState(false)

  useEffect(() => {
    const start = Date.now()
    const duration = 2200

    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min(100, (elapsed / duration) * 100)
      setProgress(pct)
      if (pct >= 100) {
        clearInterval(interval)
        setFadingOut(true)
        setTimeout(onDone, 700)
      }
    }, 16)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#020208',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
        opacity: fadingOut ? 0 : 1,
        pointerEvents: fadingOut ? 'none' : 'auto',
        transition: 'opacity 0.7s ease',
      }}
    >
      <style>{`
        @keyframes introGlow {
          0%, 100% { text-shadow: 0 0 20px rgba(0,229,255,0.4), 0 0 40px rgba(168,85,247,0.2); }
          50% { text-shadow: 0 0 32px rgba(0,229,255,0.8), 0 0 60px rgba(168,85,247,0.5); }
        }
        @keyframes introFadeUp {
          from { opacity: 0; transform: translateY(16px); letter-spacing: 12px; }
          to { opacity: 1; transform: translateY(0); letter-spacing: 6px; }
        }
        @keyframes introSweep {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .intro-title {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 2.6rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #e2e8f0;
          animation: introFadeUp 1s ease-out forwards, introGlow 2.5s ease-in-out infinite 1s;
        }
        .intro-title span {
          background: linear-gradient(90deg, #00e5ff, #a855f7, #00e5ff);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: introSweep 2.5s linear infinite;
        }
        .intro-bar-track {
          width: 280px; height: 2px; background: rgba(255,255,255,0.08);
          border-radius: 2px; overflow: hidden;
        }
        .intro-bar-fill {
          height: 100%; background: linear-gradient(90deg, #00e5ff, #a855f7);
          box-shadow: 0 0 12px rgba(0,229,255,0.6);
          transition: width 0.05s linear;
        }
        .intro-status {
          font-size: 0.75rem; letter-spacing: 3px; text-transform: uppercase;
          color: #64748b; font-family: 'Inter', system-ui, sans-serif;
        }
      `}</style>

      <div className="intro-title">
        EDUMENTOR <span>AI</span>
      </div>

      <div className="intro-bar-track">
        <div className="intro-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="intro-status">
        {progress < 100 ? `Initializing systems... ${Math.floor(progress)}%` : 'Ready'}
      </div>
    </div>
  )
}