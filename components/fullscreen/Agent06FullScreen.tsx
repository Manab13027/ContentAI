'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AgentStatus } from '@/components/AgentCard'

interface Props { status: AgentStatus; videoPath?: string; topic?: string }

const STEPS = [
  { label: 'Searching Pexels for clips', sub: 'Portrait videos · AI + tech' },
  { label: 'Downloading 5 clips', sub: 'Pexels free license' },
  { label: 'Scaling to 1080×1920', sub: '9:16 vertical format' },
  { label: 'Assembling with FFmpeg', sub: 'Concat + audio mix' },
  { label: 'Encoding final MP4', sub: 'H.264 · AAC audio' },
]

export default function Agent06FullScreen({ status, videoPath, topic }: Props) {
  const [step, setStep] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (status !== 'running') return
    const iv = setInterval(() => setElapsed(s => s + 1), 1000)
    const sv = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 8000)
    return () => { clearInterval(iv); clearInterval(sv) }
  }, [status])

  return (
    <motion.div className="fixed inset-0 z-50 bg-[#080b14] overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none" />
      <div className="relative z-10 h-full flex flex-col px-14 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/5">
            <motion.span className="w-2 h-2 rounded-full bg-amber-400"
              animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />
            <span className="text-xs font-mono text-amber-400 tracking-widest uppercase">
              Agent 06 / 07 · Video Assembler · {status === 'running' ? 'Running' : 'Done'}
            </span>
          </div>
          {topic && <span className="text-xs font-mono text-gray-500">Topic: <span className="text-amber-400">{topic}</span></span>}
        </div>

        <h1 className="text-6xl font-bold mb-2 tracking-tight">
          {status === 'running'
            ? <>Assembling <span className="text-amber-400">Video</span></>
            : <><span className="text-amber-400">Video</span> Ready</>
          }
        </h1>
        <p className="text-gray-400 font-mono mb-10">Pexels stock footage · FFmpeg · 9:16 vertical · YouTube Shorts format</p>

        {/* Steps */}
        <div className="flex-1 flex flex-col justify-center space-y-4 max-w-2xl">
          {STEPS.map((s, i) => {
            const isDone = status === 'done' || i < step
            const isCurrent = status === 'running' && i === step
            return (
              <motion.div key={i} className="flex items-center gap-5"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${isDone ? 'border-amber-400 bg-amber-400/10' : isCurrent ? 'border-amber-400' : 'border-gray-700'}`}>
                  {isDone ? (
                    <span className="text-amber-400 text-sm font-bold">✓</span>
                  ) : isCurrent ? (
                    <motion.span className="w-2 h-2 rounded-full bg-amber-400"
                      animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                  ) : (
                    <span className="text-gray-600 text-xs font-mono">{i + 1}</span>
                  )}
                </div>
                <div>
                  <p className={`font-mono text-sm ${isDone ? 'text-amber-400' : isCurrent ? 'text-white' : 'text-gray-600'}`}>{s.label}</p>
                  <p className="text-xs font-mono text-gray-600 mt-0.5">{s.sub}</p>
                </div>
                {isCurrent && (
                  <div className="ml-auto flex gap-1">
                    {[0,1,2].map(d => (
                      <motion.span key={d} className="w-1.5 h-1.5 rounded-full bg-amber-400"
                        animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.2 }} />
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-800/60 pt-4">
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-amber-400">{elapsed}s</p>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Elapsed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-amber-400">9:16</p>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Aspect Ratio</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-amber-400">1080p</p>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Resolution</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-5 py-2 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <span className="text-sm font-mono text-amber-400 font-bold">
              {status === 'done' ? 'VIDEO READY ✓' : 'ASSEMBLING...'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
