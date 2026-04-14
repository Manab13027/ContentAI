'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { AgentStatus } from '@/components/AgentCard'

interface Hook { text: string; pattern: string; estimatedViews: string }
interface Props { status: AgentStatus; hooks?: Hook[]; recommendedHook?: number; topTopic?: string }

const COLORS = [
  { border: '#00f5ff', text: 'text-neon-cyan'  },
  { border: '#00ff88', text: 'text-neon-green' },
  { border: '#4488ff', text: 'text-blue-400'   },
  { border: '#ff006e', text: 'text-neon-pink'  },
  { border: '#ffd700', text: 'text-yellow-400' },
]

export default function Agent04FullScreen({ status, hooks, recommendedHook = 0, topTopic }: Props) {
  const [copied, setCopied] = useState<number | null>(null)
  const copy = (text: string, i: number) => {
    navigator.clipboard.writeText(text); setCopied(i)
    setTimeout(() => setCopied(null), 2000)
  }
  return (
    <motion.div className="fixed inset-0 z-50 bg-[#080b14] overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none" />
      <div className="relative z-10 h-full flex flex-col px-14 py-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-neon-pink/30 bg-neon-pink/5">
            <motion.span className="w-2 h-2 rounded-full bg-neon-pink"
              animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />
            <span className="text-xs font-mono text-neon-pink tracking-widest uppercase">
              Agent 04 / 04 · Hook Generator · {status === 'running' ? 'Running' : 'Done'}
            </span>
          </div>
          {topTopic && <span className="text-xs font-mono text-gray-500">Topic: <span className="text-neon-pink">{topTopic}</span></span>}
        </div>
        <h1 className="text-6xl font-bold mb-2 tracking-tight">
          {hooks ? <><span className="text-neon-pink">5 Hooks</span> Generated</> : <>Generating <span className="text-neon-pink">5 Hooks</span></>}
        </h1>
        <p className="text-gray-400 font-mono mb-6">Pattern-matched to your best performing reels</p>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
          {!hooks && status === 'running' && (
            <div className="flex items-center gap-3 py-10">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <span key={i} className="w-2.5 h-2.5 rounded-full bg-neon-pink animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <span className="text-neon-pink font-mono text-lg">Generating hooks from viral patterns...</span>
            </div>
          )}
          {(hooks ?? []).map((hook, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.18 }}
              onClick={() => copy(hook.text, i)}
              className="group cursor-pointer rounded-xl border border-gray-800 bg-navy-800/30 hover:bg-navy-800/70 transition-all p-5"
              style={{ borderLeftColor: COLORS[i]?.border ?? '#888', borderLeftWidth: 3 }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-mono ${COLORS[i]?.text ?? 'text-gray-400'} uppercase tracking-widest mb-2`}>
                    Hook 0{i + 1}{i === recommendedHook ? ' · Recommended' : ''}
                  </p>
                  <p className="text-lg text-white leading-relaxed mb-2">&quot;{hook.text}&quot;</p>
                  <p className="text-xs font-mono text-gray-500">Pattern: &quot;{hook.pattern}&quot; · {hook.estimatedViews} views match</p>
                </div>
                <span className={`text-xs font-mono shrink-0 transition-colors ${copied === i ? 'text-neon-green' : 'text-gray-700 group-hover:text-gray-400'}`}>
                  {copied === i ? '✓ Copied' : 'click to copy'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
        {hooks?.[recommendedHook] && (
          <motion.div className="mt-4 px-6 py-4 rounded-xl border border-neon-pink/30 bg-neon-pink/5 flex items-start justify-between"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
            <div className="flex-1 min-w-0 mr-4">
              <p className="text-xs font-mono text-neon-pink tracking-widest uppercase mb-1">★ Hook · Recommended</p>
              <p className="text-base text-white truncate">&quot;{hooks[recommendedHook].text}&quot;</p>
              <p className="text-xs font-mono text-gray-500 mt-1">↑ {hooks[recommendedHook].estimatedViews} views pattern · your strongest hook format</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl font-bold font-mono text-neon-cyan">10s</p>
              <p className="text-xs font-mono text-gray-500">Generation Time</p>
            </div>
          </motion.div>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-gray-800/60 pt-4">
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-neon-cyan">{hooks?.length ?? 0}</p>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Hooks Generated</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-5 py-2 rounded-lg border border-neon-pink/30 bg-neon-pink/5">
            <span className="text-sm font-mono text-neon-pink font-bold">
              {status === 'done' ? 'TAIYAAR HAI ✓' : 'GENERATING...'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
