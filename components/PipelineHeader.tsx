'use client'
import { motion } from 'framer-motion'

interface PipelineHeaderProps {
  isRunning: boolean
}

export default function PipelineHeader({ isRunning }: PipelineHeaderProps) {
  return (
    <div className="text-center space-y-3">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neon-cyan/30 bg-neon-cyan/5">
        <motion.span
          className="w-2 h-2 rounded-full bg-neon-cyan"
          animate={{ opacity: isRunning ? [1, 0.3, 1] : 1 }}
          transition={{ duration: 1.2, repeat: isRunning ? Infinity : 0 }}
        />
        <span className="text-xs font-mono text-neon-cyan tracking-widest uppercase">
          AI Agent Pipeline · {isRunning ? 'Running' : 'Ready'}
        </span>
      </div>

      <h1 className="text-4xl font-mono font-bold tracking-widest uppercase">
        <span className="text-white">AGENTIZED </span>
        <span className="text-neon-cyan">CONTENT CREATION </span>
        <span className="text-white">SYSTEM</span>
      </h1>

      <p className="text-gray-400 font-mono text-sm tracking-wider">
        Scrape → Validate → Write → Hook — fully automated
      </p>
    </div>
  )
}
