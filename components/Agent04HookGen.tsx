'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { AgentStatus } from './AgentCard'

interface Hook {
  text: string
  pattern: string
  estimatedViews: string
}

interface Agent04HookGenProps {
  status: AgentStatus
  hooks?: Hook[]
  recommendedHook?: number
}

const HOOK_BORDER_COLORS = [
  'border-l-neon-cyan',
  'border-l-neon-green',
  'border-l-blue-400',
  'border-l-neon-pink',
  'border-l-yellow-400',
]

export default function Agent04HookGen({ status, hooks, recommendedHook = 0 }: Agent04HookGenProps) {
  const [copied, setCopied] = useState<number | null>(null)

  const handleCopy = (text: string, i: number) => {
    navigator.clipboard.writeText(text)
    setCopied(i)
    setTimeout(() => setCopied(null), 2000)
  }

  if (status === 'idle') {
    return (
      <div className="h-24 flex items-center justify-center">
        <p className="text-xs font-mono text-gray-600">Waiting for script...</p>
      </div>
    )
  }

  if (status === 'running' && !hooks) {
    return (
      <div className="h-24 flex items-center justify-center gap-2">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-neon-pink animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-xs font-mono text-neon-pink">Generating hooks...</p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {(hooks ?? []).map((hook, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.18 }}
          className={`border-l-2 ${HOOK_BORDER_COLORS[i] ?? 'border-l-gray-500'} pl-2 py-1 cursor-pointer hover:bg-white/5 rounded-r transition-colors`}
          onClick={() => handleCopy(hook.text, i)}
        >
          <div className="flex items-start justify-between gap-1">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                HOOK 0{i + 1}{i === recommendedHook ? ' · RECOMMENDED' : ''}
              </p>
              <p className="text-xs text-white mt-0.5 leading-relaxed line-clamp-2">"{hook.text}"</p>
              <p className="text-xs font-mono text-gray-600 mt-0.5">
                {hook.pattern} · {hook.estimatedViews} views match
              </p>
            </div>
            {copied === i && (
              <span className="text-xs text-neon-green font-mono shrink-0">✓</span>
            )}
          </div>
        </motion.div>
      ))}

      {status === 'done' && hooks && hooks.length > 0 && (
        <p className="text-xs font-mono text-gray-600 text-center pt-1">
          Click any hook to copy
        </p>
      )}
    </div>
  )
}
