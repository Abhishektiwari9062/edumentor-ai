'use client'
import { useState, useEffect, useRef } from 'react'
import AnimatedBackground from '@/components/AnimatedBackground'
import AIFace from '@/components/AIFace'
import IntroScreen from '@/components/IntroScreen'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useVoice } from '@/hooks/useVoice'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useTypewriter } from '@/hooks/useTypewriter'

import { Home, BookOpen, MessageSquare, BarChart3, Send, Mic, Square, Zap, Settings, Radio, X, Upload, Pencil, Check, XCircle } from 'lucide-react'

interface Stats {
  total_conversations: number
  by_intent: { intent: string; count: number }[]
  recent: { question: string; intent: string; timestamp: string }[]
}

interface ChatEntry {
  id: string
  question: string
  answer: string
}

export default function HomePage() {
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showIntro, setShowIntro] = useState(true)
  const [wakeWordActive, setWakeWordActive] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard'>('chat')
  const [question, setQuestion] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [showAnswer, setShowAnswer] = useState(true)
  const [loading, setLoading] = useState(false)
  const [conversationMode, setConversationMode] = useState(false)
  const [tone, setTone] = useState<'jarvis' | 'formal' | 'human'>('jarvis')
  const [stats, setStats] = useState<Stats | null>(null)

  const lastEntry = chatHistory[chatHistory.length - 1]
  const displayedLastAnswer = useTypewriter(lastEntry?.answer || '', 15)
  const isRespondingToWakeWord = useRef(false)
  const threadEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  async function sendQuestion(text: string, editId?: string) {
    if (!text.trim()) return
    setLoading(true)
    setShowAnswer(true)

    const entryId = editId || `${Date.now()}-${Math.random().toString(36).slice(2)}`

    if (editId) {
      // update the existing entry's question, clear its old answer while re-fetching
      setChatHistory((prev) =>
        prev.map((e) => (e.id === editId ? { ...e, question: text, answer: '' } : e))
      )
    } else {
      setChatHistory((prev) => [...prev, { id: entryId, question: text, answer: '' }])
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, session_id: 'default', tone }),
      })
      const data = await res.json()

      setChatHistory((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, answer: data.answer } : e))
      )
      speak(data.answer, conversationMode ? () => startListening() : undefined)
      loadStats()
    } catch (err) {
      setChatHistory((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, answer: 'Connection to core processor failed.' } : e))
      )
      console.error(err)
    }
    setLoading(false)
    setQuestion('')
    setEditingId(null)
  }

  function startEdit(entry: ChatEntry) {
    setEditingId(entry.id)
    setEditingText(entry.question)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingText('')
  }

  function submitEdit(entryId: string) {
    if (!editingText.trim()) return
    sendQuestion(editingText, entryId)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadStatus('Only PDF files are supported.')
      return
    }

    setUploading(true)
    setUploadStatus(`Uploading "${file.name}"...`)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        setUploadStatus(data.detail || 'Upload failed.')
        setUploading(false)
        return
      }

      const jobId = data.job_id
      const poll = setInterval(async () => {
        try {
          const statusRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload-status/${jobId}`)
          const statusData = await statusRes.json()
          setUploadStatus(statusData.message)

          if (statusData.status === 'done' || statusData.status === 'error') {
            clearInterval(poll)
            setUploading(false)
            if (statusData.status === 'done') loadStats()
          }
        } catch (err) {
          clearInterval(poll)
          setUploading(false)
          setUploadStatus('Lost connection while checking upload progress.')
        }
      }, 3000)
    } catch (err) {
      setUploadStatus('Could not reach the backend to upload.')
      setUploading(false)
      console.error(err)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const { listening, speaking, startListening, speak, stopSpeaking, startWakeWordListening } = useVoice((spokenText) => {
    setQuestion(spokenText)
    sendQuestion(spokenText)
  })

  useEffect(() => {
    if (!wakeWordActive || listening || speaking || loading) return

    const recognition = startWakeWordListening(() => {
      if (isRespondingToWakeWord.current) return
      isRespondingToWakeWord.current = true
      setTimeout(() => {
        speak("Yess, boss!", () => {
          isRespondingToWakeWord.current = false
          startListening()
        })
      }, 200)
    })

    return () => {
      if (recognition) recognition.stop()
    }
  }, [wakeWordActive, listening, speaking, loading])

  async function loadStats(retryCount = 0) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats?session_id=default`)
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error(err)
      if (retryCount < 3) {
        setTimeout(() => loadStats(retryCount + 1), 5000)
      }
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  function switchTab(tab: 'chat' | 'dashboard') {
    setActiveTab(tab)
    if (tab === 'dashboard') {
      loadStats()
    }
    if (tab === 'chat' && chatHistory.length > 0) {
      setShowAnswer(true)
    }
  }

  function getFaceState(): 'idle' | 'listening' | 'speaking' | 'loading' {
    if (speaking) return 'speaking'
    if (listening) return 'listening'
    if (loading) return 'loading'
    return 'idle'
  }

  function askFromHistory(pastQuestion: string) {
    sendQuestion(pastQuestion)
  }

  function handleTilt(e: React.MouseEvent<HTMLDivElement>) {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -5
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 5
    el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
  }

  function resetTilt(e: React.MouseEvent<HTMLDivElement>) {
    e.currentTarget.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)'
  }

  function cycleTone() {
    if (tone === 'jarvis') setTone('formal')
    else if (tone === 'formal') setTone('human')
    else setTone('jarvis')
  }

  function getToneLabel() {
    if (tone === 'jarvis') return 'Mode: JARVIS'
    if (tone === 'formal') return 'Mode: Academic'
    return 'Mode: Empathetic'
  }

  const knowledgePercent = stats ? Math.min(100, stats.total_conversations * 5) : 5

  return (
    <>
      {showIntro && <IntroScreen onDone={() => setShowIntro(false)} />}

      <AnimatedBackground />

      <style>{`
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0, 229, 255, 0.3); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0, 229, 255, 0.7); }

        .ui-container {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          pointer-events: none; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; z-index: 10;
        }
        .interactive { pointer-events: auto; }

        .glass-panel {
          background: rgba(6, 2, 14, 0.6);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(0, 229, 255, 0.15);
          border-radius: 16px;
          box-shadow: inset 0 0 20px rgba(0, 229, 255, 0.02), 0 8px 32px rgba(0, 0, 0, 0.5);
          position: relative;
          transition: transform 0.15s ease-out;
          will-change: transform;
        }

        .close-btn {
          position: absolute; top: 14px; right: 14px;
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: #94a3b8; cursor: pointer; transition: 0.2s; z-index: 5;
        }
        .close-btn:hover { background: rgba(244, 63, 94, 0.15); color: #f43f5e; border-color: rgba(244, 63, 94, 0.3); }

        .sidebar {
          position: absolute; left: 0; top: 0; bottom: 0; width: 280px;
          border-right: 1px solid rgba(0, 229, 255, 0.15); border-radius: 0;
          display: flex; flex-direction: column; padding: 32px 24px;
        }
        .progress-title { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 12px; }
        .progress-bar-bg { width: 100%; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; margin-bottom: 40px;}
        .progress-bar-fill { height: 100%; background: #00e5ff; box-shadow: 0 0 10px #00e5ff; transition: width 0.5s ease; }
        .resource-list { display: flex; flex-direction: column; gap: 14px; }
        .resource-item {
          display: flex; align-items: flex-start; gap: 12px; font-size: 0.85rem; color: #94a3b8; cursor: pointer;
          transition: 0.3s; background: none; border: none; text-align: left; padding: 0; font-family: inherit;
        }
        .resource-item:hover { color: #00e5ff; transform: translateX(4px); }
        .resource-item span { overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .logo-bottom { margin-top: auto; display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 1.1rem; letter-spacing: 2px;}

        .main-flow {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 24px;
          padding: 24px 0;
          overflow-y: auto;
        }

        .top-nav {
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          flex-shrink: 0;
          position: relative;
        }
        .top-nav::before {
          content: '';
          position: absolute;
          top: -40px; left: 50%; transform: translateX(-50%);
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 70%);
          pointer-events: none;
          z-index: -1;
        }
        .main-title { font-size: 1.6rem; font-weight: 800; letter-spacing: 4px; text-transform: uppercase; margin-top: -20px; }
        .main-title span { color: #00e5ff; text-shadow: 0 0 15px rgba(0,229,255,0.5); }
        .nav-menu { display: flex; gap: 8px; padding: 6px 12px; border-radius: 20px; }
        .nav-item {
          padding: 8px 16px; border-radius: 12px; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: 0.3s;
          display: flex; align-items: center; gap: 8px; color: #64748b;
        }
        .nav-item:hover { color: #e2e8f0; background: rgba(255,255,255,0.05); }
        .nav-item.active {
          color: #00e5ff; background: rgba(168, 85, 247, 0.12);
          border: 1px solid rgba(168, 85, 247, 0.3);
          box-shadow: 0 0 12px rgba(168, 85, 247, 0.15);
        }
        .status-badge {
          display: flex; align-items: center; gap: 6px; color: #00e5ff; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;
          background: rgba(0, 229, 255, 0.05); padding: 6px 16px; border-radius: 20px; border: 1px solid rgba(0,229,255,0.2);
        }

        .chat-wrapper {
          width: 760px; max-width: 90vw; display: flex; flex-direction: column; gap: 20px;
        }

        .thread-panel {
          width: 100%; position: relative;
        }
        .thread-content {
          padding: 24px; padding-top: 48px; max-height: 50vh; overflow-y: auto;
          display: flex; flex-direction: column; gap: 20px;
        }

        .chat-bubble-user {
          background: rgba(168, 85, 247, 0.1);
          border: 1px solid rgba(168, 85, 247, 0.25);
          border-radius: 14px 14px 4px 14px;
          padding: 14px 18px;
          align-self: flex-end;
          max-width: 85%;
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .chat-bubble-user p { font-size: 0.9rem; color: #e2e8f0; margin: 0; flex: 1; }
        .edit-icon-btn {
          background: none; border: none; color: #94a3b8; cursor: pointer;
          padding: 2px; flex-shrink: 0; transition: 0.2s;
        }
        .edit-icon-btn:hover { color: #00e5ff; }

        .chat-bubble-ai {
          background: rgba(0, 229, 255, 0.05);
          border: 1px solid rgba(0, 229, 255, 0.15);
          border-radius: 14px 14px 14px 4px;
          padding: 18px 20px;
          align-self: flex-start;
          max-width: 90%;
          font-size: 0.92rem; line-height: 1.75; color: #cbd5e1;
        }
        .chat-bubble-ai p { margin-bottom: 0.8em; }
        .chat-bubble-ai p:last-child { margin-bottom: 0; }
        .chat-bubble-ai strong { color: #00e5ff; font-weight: 600; }

        .edit-input-row {
          display: flex; gap: 8px; align-items: center; width: 100%;
        }
        .edit-input {
          flex: 1; background: rgba(0,0,0,0.3); border: 1px solid rgba(0,229,255,0.3);
          border-radius: 8px; padding: 8px 12px; color: white; font-size: 0.88rem; outline: none;
        }
        .edit-action-btn {
          background: none; border: none; cursor: pointer; padding: 4px; flex-shrink: 0;
        }
        .edit-confirm { color: #00ff88; }
        .edit-cancel { color: #f43f5e; }

        .chat-container { padding: 24px; display: flex; flex-direction: column; gap: 20px; }

        .input-wrapper {
          width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px; display: flex; align-items: center; padding: 14px 20px; gap: 12px;
          transition: 0.3s;
        }
        .input-wrapper:focus-within { border-color: rgba(0, 229, 255, 0.4); box-shadow: 0 0 20px rgba(0, 229, 255, 0.1); }
        .chat-input { flex: 1; background: transparent; border: none; color: white; outline: none; font-size: 0.95rem; }
        .chat-input::placeholder { color: #475569; }

        .action-buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .action-btn {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255, 255, 255, 0.03); color: #94a3b8;
          border: 1px solid rgba(255, 255, 255, 0.08); padding: 10px 20px;
          border-radius: 30px; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: 0.3s;
        }
        .action-btn:hover { background: rgba(255, 255, 255, 0.08); color: white; }
        .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .action-btn.active-state {
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.12), rgba(168, 85, 247, 0.12));
          color: #00e5ff;
          border-color: rgba(168, 85, 247, 0.35);
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.25);
        }
        .action-btn.danger-state {
          background: rgba(244, 63, 94, 0.1); color: #f43f5e; border-color: rgba(244, 63, 94, 0.3);
        }

        .dashboard-container {
           width: 800px; max-width: 90vw;
        }
        .dashboard-panel {
           width: 100%; position: relative;
        }
        .dashboard-content {
           max-height: 75vh; overflow-y: auto; padding: 40px; padding-top: 56px;
        }

        .scanline-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none; z-index: 50; mix-blend-mode: overlay;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 229, 255, 0.025) 0px,
            rgba(0, 229, 255, 0.025) 1px,
            transparent 1px,
            transparent 3px
          );
          animation: scanMove 6s linear infinite, flicker 7s infinite;
        }
        @keyframes scanMove {
          from { background-position-y: 0; }
          to { background-position-y: 100px; }
        }
        @keyframes flicker {
          0%, 91%, 100% { opacity: 0.5; }
          92% { opacity: 0.15; }
          93% { opacity: 0.5; }
          95% { opacity: 0.25; }
          96% { opacity: 0.5; }
        }
      `}</style>

      <div className="ui-container">

        {/* LEFT SIDEBAR */}
        <div className="sidebar glass-panel interactive" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
          <div className="progress-title">System Load / Knowledge</div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${knowledgePercent}%` }}></div>
          </div>

          <div className="progress-title">Recent Threads</div>
          <div className="resource-list">
            {stats && stats.recent && stats.recent.length > 0 ? (
              stats.recent.slice(0, 5).map((item, i) => (
                <button key={i} className="resource-item" onClick={() => askFromHistory(item.question)}>
                  <BookOpen size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{item.question}</span>
                </button>
              ))
            ) : (
              <div className="resource-item" style={{ cursor: 'default' }}>
                <BookOpen size={14} /> <span>No threads yet — ask something</span>
              </div>
            )}
          </div>

          <div className="logo-bottom"><Zap size={24} color="#00e5ff" /> NEURON EDU</div>
        </div>

        {/* MAIN FLOW */}
        <div className="main-flow interactive">

          <div className="top-nav">
            <AIFace state={getFaceState()} />

            <div className="main-title">EDUMENTOR <span>AI</span></div>

            <div className="nav-menu glass-panel">
              <div className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => switchTab('chat')}>
                <Home size={16} /> Home
              </div>
              <div className="nav-item" onClick={() => window.open('https://github.com/Abhishektiwari9062/edumentor-ai', '_blank')}>
                <BookOpen size={16} /> Library
              </div>
              <div className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => switchTab('chat')}>
                <MessageSquare size={16} /> Comms
              </div>
              <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => switchTab('dashboard')}>
                <BarChart3 size={16} /> Telemetry
              </div>
            </div>

            <div className="status-badge">
              <Radio size={14} className={listening || loading ? 'animate-pulse' : ''} />
              {speaking ? 'Transmitting...' : listening ? 'Receiving Audio...' : loading ? 'Processing...' : 'System Online'}
            </div>
          </div>

          {/* --- CHAT TAB --- */}
          {activeTab === 'chat' && (
            <div className="chat-wrapper">

              {chatHistory.length > 0 && showAnswer && (
                <div className="glass-panel thread-panel" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
                  <div className="close-btn" onClick={() => setShowAnswer(false)}>
                    <X size={16} />
                  </div>
                  <div className="thread-content">
                    {chatHistory.map((entry, idx) => {
                      const isLast = idx === chatHistory.length - 1
                      const isEditing = editingId === entry.id
                      return (
                        <div key={entry.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {/* User question bubble */}
                          <div className="chat-bubble-user">
                            {isEditing ? (
                              <div className="edit-input-row">
                                <input
                                  className="edit-input"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') submitEdit(entry.id)
                                    if (e.key === 'Escape') cancelEdit()
                                  }}
                                  autoFocus
                                />
                                <button className="edit-action-btn edit-confirm" onClick={() => submitEdit(entry.id)}>
                                  <Check size={16} />
                                </button>
                                <button className="edit-action-btn edit-cancel" onClick={cancelEdit}>
                                  <XCircle size={16} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <p>{entry.question}</p>
                                <button className="edit-icon-btn" onClick={() => startEdit(entry)} title="Edit this question">
                                  <Pencil size={14} />
                                </button>
                              </>
                            )}
                          </div>

                          {/* AI answer bubble */}
                          {entry.answer && (
                            <div className="chat-bubble-ai">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {isLast ? displayedLastAnswer : entry.answer}
                              </ReactMarkdown>
                            </div>
                          )}
                          {!entry.answer && loading && isLast && (
                            <div className="chat-bubble-ai" style={{ color: '#64748b', fontStyle: 'italic' }}>
                              Thinking...
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <div ref={threadEndRef} />
                  </div>
                </div>
              )}

              <div className="chat-container glass-panel" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
                <div className="input-wrapper">
                  <MessageSquare size={18} color="#475569" />
                  <input
                    type="text"
                    className="chat-input"
                    placeholder="Initialize query..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendQuestion(question)}
                  />
                  <Settings size={18} color="#475569" style={{ cursor: 'pointer' }} onClick={() => setConversationMode(!conversationMode)} />
                </div>

                <div className="action-buttons">
                  <button className="action-btn" onClick={() => sendQuestion(question)}>
                    <Send size={16} /> {loading ? 'Computing' : 'Transmit'}
                  </button>

                  {speaking ? (
                    <button className="action-btn danger-state" onClick={stopSpeaking}>
                      <Square size={16} /> Override
                    </button>
                  ) : (
                    <button className={`action-btn ${listening ? 'active-state' : ''}`} onClick={startListening}>
                      <Mic size={16} /> {listening ? 'Listening...' : 'Voice Input'}
                    </button>
                  )}

                  <button className={`action-btn ${tone !== 'jarvis' ? 'active-state' : ''}`} onClick={cycleTone}>
                    <Zap size={16} /> {getToneLabel()}
                  </button>

                  <button className={`action-btn ${wakeWordActive ? 'active-state' : ''}`} onClick={() => setWakeWordActive(!wakeWordActive)}>
                    <Radio size={16} /> {wakeWordActive ? 'Wake Word: ACTIVE' : 'Enable Wake Word'}
                  </button>

                  <input
                    type="file"
                    accept=".pdf"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    className="action-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload size={16} /> {uploading ? 'Indexing...' : 'Upload PDF'}
                  </button>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                  <input type="checkbox" checked={conversationMode} onChange={(e) => setConversationMode(e.target.checked)} style={{ accentColor: '#00e5ff' }} />
                  Continuous Audio Link
                </label>

                {uploadStatus && (
                  <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4 }}>
                    {uploadStatus}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* --- DASHBOARD TAB --- */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-container">
              <div className="dashboard-panel glass-panel" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
                <div className="close-btn" onClick={() => switchTab('chat')}>
                  <X size={16} />
                </div>
                <div className="dashboard-content">
                  {!stats ? (
                    <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Gathering telemetry...</p>
                  ) : (
                    <>
                      <div style={{ marginBottom: 30 }}>
                        <p style={{ fontSize: 12, textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px' }}>Total Interactions</p>
                        <p style={{ fontSize: 42, fontWeight: 700, color: '#00e5ff', marginTop: 4 }}>{stats.total_conversations}</p>
                      </div>

                      <div style={{ marginBottom: 40 }}>
                        <p style={{ fontSize: 12, textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px', marginBottom: 16 }}>Intent Distribution</p>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={stats.by_intent}>
                            <defs>
                              <linearGradient id="volumetricBar" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00ffff" stopOpacity={0.95} />
                                <stop offset="50%" stopColor="#a855f7" stopOpacity={0.55} />
                                <stop offset="100%" stopColor="#00e5ff" stopOpacity={0.15} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="intent" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                            <Tooltip contentStyle={{ background: '#06020e', border: '1px solid rgba(0,229,255,0.2)', color: '#fff', borderRadius: '8px' }} />
                            <Bar dataKey="count" fill="url(#volumetricBar)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div>
                        <p style={{ fontSize: 12, textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px', marginBottom: 16 }}>Recent Log</p>
                        {stats.recent && stats.recent.length > 0 ? (
                          stats.recent.map((r, i) => (
                            <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <p style={{ fontSize: 14, color: '#cbd5e1' }}>{r.question}</p>
                              <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{r.intent} · {new Date(r.timestamp).toLocaleString()}</p>
                            </div>
                          ))
                        ) : (
                          <p style={{ fontSize: 13, color: '#64748b' }}>No conversations logged yet.</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="scanline-overlay" />

      </div>
    </>
  )
}