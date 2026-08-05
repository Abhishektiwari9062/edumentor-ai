'use client'
import { motion } from 'framer-motion'

export default function AICore({ active }: { active: boolean }) {
  return (
    <motion.div
      animate={{ scale: active ? [1, 1.15, 1] : 1, opacity: active ? [0.7, 1, 0.7] : 0.8 }}
      transition={{ repeat: active ? Infinity : 0, duration: 1.4 }}
      style={{
        width: 120,
        height: 120,
        borderRadius: '50%',
        margin: '0 auto',
        background: 'radial-gradient(circle, rgba(0,229,255,0.35), transparent 70%)',
        border: '2px solid var(--accent)',
        boxShadow: 'var(--accent-glow)',
      }}
    />
  )
}