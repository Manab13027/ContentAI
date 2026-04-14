'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AgentStatus } from '@/components/AgentCard'

interface Props { status: AgentStatus; videoPath?: string; runId?: string }

const STEPS = ['Searching Pexels', 'Downloading clips', 'Processing 9:16', 'Assembling video']

export default function Agent06VideoAssembler({ status, videoPath, runId }: Props) {
  const [showPreview, setShowPreview] = useState(false)

  if (status === 'idle') return (
    <div className="flex flex-col items-center justify-center h-32 gap-2">
      <div className="grid grid-cols-2 gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className="w-10 h-7 rounded bg-gray-800 border border-gray-700" />
        ))}
      </div>
      <p className="text-xs font-mono text-gray-600 uppercase tracking-wider">Pexels + FFmpeg</p>
    </div>
  )

  if (status === 'running') return (
    <div className="flex flex-col justify-center h-32 gap-2 px-1">
      {STEPS.map((step, i) => (
        <motion.div key={i} className="flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.6 }}>
          <motion.span className="w-1.5 h-1.5 rounded-full bg-amber-400"
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
          <span className="text-xs font-mono text-amber-300">{step}</span>
        </motion.div>
      ))}
    </div>
  )

  // Done state — show preview button
  return (
    <div className="flex flex-col items-center justify-center h-32 gap-2">
      <p className="text-xs font-mono text-amber-400">✓ Video assembled</p>
      {runId && (
        <button
          onClick={() => setShowPreview(true)}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400 text-xs font-mono hover:bg-amber-500/20 transition-colors"
        >
          ▶ Preview Video
        </button>
      )}

      {/* Fullscreen video modal */}
      <AnimatePresence>
        {showPreview && runId && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              className="relative max-w-sm w-full"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowPreview(false)}
                className="absolute -top-10 right-0 text-gray-400 hover:text-white font-mono text-sm"
              >
                ✕ Close
              </button>
              <video
                src={`/api/video/${runId}`}
                controls
                autoPlay
                className="w-full rounded-xl border border-amber-500/30 bg-black"
                style={{ maxHeight: '80vh' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
