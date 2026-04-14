'use client'
import { motion } from 'framer-motion'
import { AgentStatus } from '@/components/AgentCard'

interface Props { status: AgentStatus; audioPath?: string }

export default function Agent05VoiceGen({ status, audioPath }: Props) {
  const bars = [4, 7, 5, 9, 6, 8, 4, 10, 6, 7, 5, 8]

  if (status === 'idle') return (
    <div className="flex flex-col items-center justify-center h-32 gap-2">
      <div className="flex items-end gap-1">
        {bars.map((h, i) => (
          <div key={i} className="w-1 rounded-full bg-gray-700" style={{ height: h * 3 }} />
        ))}
      </div>
      <p className="text-xs font-mono text-gray-600 uppercase tracking-wider">ElevenLabs TTS</p>
    </div>
  )

  if (status === 'running') return (
    <div className="flex flex-col items-center justify-center h-32 gap-3">
      <div className="flex items-end gap-1">
        {bars.map((h, i) => (
          <motion.div key={i} className="w-1 rounded-full bg-purple-400"
            animate={{ height: [h * 3, h * 5, h * 2, h * 4, h * 3] }}
            transition={{ duration: 0.8 + i * 0.05, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <p className="text-xs font-mono text-purple-400 animate-pulse">Generating voiceover...</p>
    </div>
  )

  return (
    <div className="flex flex-col items-center justify-center h-32 gap-3">
      <div className="flex items-end gap-1">
        {bars.map((h, i) => (
          <div key={i} className="w-1 rounded-full bg-purple-400/60" style={{ height: h * 3 }} />
        ))}
      </div>
      <p className="text-xs font-mono text-purple-400">✓ Audio ready</p>
    </div>
  )
}
