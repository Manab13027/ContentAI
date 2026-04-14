'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AgentStatus } from '@/components/AgentCard'

interface Props { status: AgentStatus; script?: string; topTopic?: string }

export default function Agent03FullScreen({ status, script, topTopic }: Props) {
  const [displayed, setDisplayed] = useState('')
  const [copied, setCopied] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (status !== 'running') return
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [status])

  useEffect(() => {
    if (!script) { setDisplayed(''); return }
    let i = 0
    const t = setInterval(() => {
      i += 4
      setDisplayed(script.slice(0, i))
      if (i >= script.length) { setDisplayed(script); clearInterval(t) }
    }, 16)
    return () => clearInterval(t)
  }, [script])

  return (
    <motion.div className="fixed inset-0 z-50 bg-[#080b14] overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none" />
      <div className="relative z-10 h-full flex flex-col px-14 py-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-neon-orange/30 bg-neon-orange/5">
            <motion.span className="w-2 h-2 rounded-full bg-neon-orange"
              animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />
            <span className="text-xs font-mono text-neon-orange tracking-widest uppercase">
              Agent 03 · Writer · {status === 'running' ? 'Running' : 'Done'}
            </span>
          </div>
          {topTopic && <span className="text-xs font-mono text-gray-500">Topic: <span className="text-neon-orange">{topTopic}</span></span>}
        </div>
        <h1 className="text-6xl font-bold mb-2 tracking-tight">
          {status === 'running' ? 'Writing Your ' : 'Your '}<span className="text-neon-orange">Script</span>
        </h1>
        <p className="text-gray-400 font-mono mb-5">Matching your voice to the viral topic pattern</p>
        <div className="flex gap-2 mb-6">
          {['your_voice', 'viral_fmt', 'best_niche'].map(tag => (
            <span key={tag} className="text-xs font-mono px-3 py-1 rounded-full border border-neon-orange/30 bg-neon-orange/5 text-neon-orange">{tag}</span>
          ))}
        </div>
        <div className="flex-1 min-h-0 rounded-xl border border-gray-800 bg-navy-800/30 p-6 overflow-y-auto">
          {!script && status === 'running' && (
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <span key={i} className="w-2.5 h-2.5 rounded-full bg-neon-orange animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <span className="text-neon-orange font-mono">Writing in your voice...</span>
            </div>
          )}
          {displayed && (
            <pre className="text-base font-mono text-gray-200 whitespace-pre-wrap leading-relaxed">
              {displayed}
              {status === 'running' && <span className="animate-pulse-glow text-neon-orange">▋</span>}
            </pre>
          )}
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-gray-800/60 pt-4">
          <div className="text-center">
            <p className="text-3xl font-bold font-mono text-neon-cyan">{elapsed}s</p>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Total Generation Time</p>
          </div>
          <div className="flex gap-3">
            {status === 'done' && script && (
              <button onClick={() => { navigator.clipboard.writeText(script); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                className="px-6 py-3 rounded-xl border border-neon-orange text-neon-orange font-mono font-bold hover:bg-neon-orange/10 transition-colors">
                {copied ? '✓ COPIED!' : 'COPY SCRIPT'}
              </button>
            )}
            <div className="flex items-center gap-2 px-5 py-2 rounded-lg border border-neon-orange/30 bg-neon-orange/5">
              <span className="text-sm font-mono text-neon-orange font-bold">
                {status === 'done' ? 'DONE ✓' : 'WRITING...'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
