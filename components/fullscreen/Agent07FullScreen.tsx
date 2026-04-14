'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AgentStatus } from '@/components/AgentCard'

interface Props { status: AgentStatus; youtubeUrl?: string; title?: string; error?: string }

export default function Agent07FullScreen({ status, youtubeUrl, title, error }: Props) {
  const [progress, setProgress] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (status !== 'running') return
    const iv = setInterval(() => setElapsed(s => s + 1), 1000)
    const pv = setInterval(() => setProgress(p => Math.min(p + 1, 95)), 1200)
    return () => { clearInterval(iv); clearInterval(pv) }
  }, [status])

  useEffect(() => {
    if (status === 'done') setProgress(100)
  }, [status])

  return (
    <motion.div className="fixed inset-0 z-50 bg-[#080b14] overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none" />
      <div className="relative z-10 h-full flex flex-col px-14 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/5">
            <motion.span className="w-2 h-2 rounded-full bg-red-500"
              animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />
            <span className="text-xs font-mono text-red-400 tracking-widest uppercase">
              Agent 07 / 07 · YouTube Poster · {status === 'running' ? 'Uploading' : status === 'done' ? 'Done' : 'Ready'}
            </span>
          </div>
          <span className="text-xs font-mono text-gray-500">YouTube Data API v3 · OAuth 2.0</span>
        </div>

        <h1 className="text-6xl font-bold mb-2 tracking-tight">
          {status === 'idle' && <>YouTube <span className="text-red-500">Auto-Post</span></>}
          {status === 'running' && <>Uploading to <span className="text-red-500">YouTube</span></>}
          {status === 'done' && <><span className="text-red-500">Live</span> on YouTube</>}
        </h1>
        {title && <p className="text-gray-400 font-mono mb-10 truncate">{title}</p>}
        {!title && <p className="text-gray-400 font-mono mb-10">Publishing vertical video as YouTube Short</p>}

        {/* Main area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-10">

          {/* YouTube logo + progress */}
          <motion.div
            animate={status === 'running' ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}>
            <svg viewBox="0 0 24 24" className={`w-24 h-24 transition-all ${status === 'done' ? 'fill-red-500' : status === 'running' ? 'fill-red-500/70' : 'fill-gray-700'}`}>
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8z"/>
              <polygon points="9.6,15.6 15.8,12 9.6,8.4" fill="#080b14"/>
            </svg>
          </motion.div>

          {/* Progress bar */}
          <div className="w-full max-w-lg">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-mono text-gray-500">Upload progress</span>
              <span className="text-xs font-mono text-red-400">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div className="h-full bg-red-500 rounded-full"
                animate={{ width: `${progress}%` }} transition={{ ease: 'easeOut' }} />
            </div>
          </div>

          {/* URL when done */}
          {status === 'done' && youtubeUrl && (
            <motion.a href={youtubeUrl} target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="px-8 py-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 font-mono text-sm hover:bg-red-500/20 transition-colors">
              ▶ {youtubeUrl}
            </motion.a>
          )}
          {/* Error */}
          {status === 'done' && error && !youtubeUrl && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="px-8 py-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 text-yellow-400 font-mono text-sm text-center max-w-lg">
              ⚠ {error}
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-800/60 pt-4">
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-red-400">{elapsed}s</p>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Elapsed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-red-400">Shorts</p>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Format</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-5 py-2 rounded-lg border border-red-500/30 bg-red-500/5">
            <span className="text-sm font-mono text-red-400 font-bold">
              {status === 'done' ? 'LIVE ON YOUTUBE ✓' : status === 'running' ? 'UPLOADING...' : 'READY'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
