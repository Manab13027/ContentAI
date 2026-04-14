'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AgentStatus } from '@/components/AgentCard'

interface Props { status: AgentStatus; script?: string }

const BARS = [4, 7, 5, 9, 6, 8, 4, 10, 6, 7, 5, 8, 3, 9, 7, 6, 8, 5, 10, 7]

export default function Agent05FullScreen({ status, script }: Props) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (status !== 'running') return
    const iv = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(iv)
  }, [status])

  const wordCount = script ? script.split(/\s+/).length : 0
  const estSeconds = Math.round(wordCount / 2.5) // ~150 wpm

  return (
    <motion.div className="fixed inset-0 z-50 bg-[#080b14] overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none" />
      <div className="relative z-10 h-full flex flex-col px-14 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/5">
            <motion.span className="w-2 h-2 rounded-full bg-purple-400"
              animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />
            <span className="text-xs font-mono text-purple-400 tracking-widest uppercase">
              Agent 05 / 07 · Voice Generator · {status === 'running' ? 'Running' : 'Done'}
            </span>
          </div>
          <span className="text-xs font-mono text-gray-500">ElevenLabs TTS · Rachel</span>
        </div>

        <h1 className="text-6xl font-bold mb-2 tracking-tight">
          {status === 'running'
            ? <>Generating <span className="text-purple-400">Voiceover</span></>
            : <><span className="text-purple-400">Voiceover</span> Ready</>
          }
        </h1>
        <p className="text-gray-400 font-mono mb-10">Converting script to natural speech · {wordCount} words · ~{estSeconds}s</p>

        {/* Waveform visualizer */}
        <div className="flex-1 flex flex-col items-center justify-center gap-12">
          <div className="flex items-end gap-2">
            {BARS.map((h, i) => (
              status === 'running' ? (
                <motion.div key={i}
                  className="w-3 rounded-full bg-purple-400"
                  animate={{ height: [h * 6, h * 10, h * 4, h * 8, h * 6] }}
                  transition={{ duration: 0.6 + i * 0.04, repeat: Infinity, ease: 'easeInOut', delay: i * 0.03 }}
                />
              ) : (
                <div key={i} className="w-3 rounded-full bg-purple-400/40" style={{ height: h * 6 }} />
              )
            ))}
          </div>

          {/* Stats row */}
          <div className="flex gap-16">
            <div className="text-center">
              <p className="text-4xl font-bold font-mono text-purple-400">{wordCount}</p>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider mt-1">Words</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold font-mono text-purple-400">~{estSeconds}s</p>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider mt-1">Duration</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold font-mono text-purple-400">{elapsed}s</p>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider mt-1">Elapsed</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-800/60 pt-4">
          <p className="text-xs font-mono text-gray-600">Model: eleven_turbo_v2 · Voice: Rachel · 128kbps MP3</p>
          <div className="flex items-center gap-2 px-5 py-2 rounded-lg border border-purple-500/30 bg-purple-500/5">
            <span className="text-sm font-mono text-purple-400 font-bold">
              {status === 'done' ? 'AUDIO READY ✓' : 'GENERATING...'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
