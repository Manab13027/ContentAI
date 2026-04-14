'use client'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

export type AgentStatus = 'idle' | 'running' | 'done'

interface AgentCardProps {
  number: number
  name: string
  title: string
  status: AgentStatus
  children?: ReactNode
}

const AGENT_COLORS: Record<number, { border: string; glow: string; text: string; bg: string }> = {
  1: { border: 'border-neon-cyan',   glow: 'glow-cyan',   text: 'text-neon-cyan',   bg: 'bg-neon-cyan/10'   },
  2: { border: 'border-neon-green',  glow: 'glow-green',  text: 'text-neon-green',  bg: 'bg-neon-green/10'  },
  3: { border: 'border-neon-orange', glow: 'glow-orange', text: 'text-neon-orange', bg: 'bg-neon-orange/10' },
  4: { border: 'border-neon-pink',   glow: 'glow-pink',   text: 'text-neon-pink',   bg: 'bg-neon-pink/10'   },
  5: { border: 'border-purple-500',  glow: 'glow-cyan',   text: 'text-purple-400',  bg: 'bg-purple-500/10'  },
  6: { border: 'border-amber-500',   glow: 'glow-orange', text: 'text-amber-400',   bg: 'bg-amber-500/10'   },
  7: { border: 'border-red-500',     glow: 'glow-pink',   text: 'text-red-400',     bg: 'bg-red-500/10'     },
}

const STATUS_BADGE: Record<AgentStatus, { label: string; color: string }> = {
  idle:    { label: 'WAITING', color: 'text-gray-500 border-gray-600'    },
  running: { label: 'RUNNING', color: 'text-neon-cyan border-neon-cyan'  },
  done:    { label: 'DONE ✓',  color: 'text-neon-green border-neon-green' },
}

export default function AgentCard({ number, name, title, status, children }: AgentCardProps) {
  const colors = AGENT_COLORS[number] ?? AGENT_COLORS[1]
  const badge  = STATUS_BADGE[status]
  const isActive = status === 'running'

  return (
    <motion.div
      className={`
        relative rounded-xl border bg-navy-800/60 backdrop-blur-sm p-4
        transition-all duration-500 overflow-hidden
        ${status === 'idle' ? 'border-gray-800' : colors.border}
        ${status === 'running' ? colors.glow : ''}
      `}
    >
      {/* Top accent line */}
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 ${isActive ? colors.bg + ' animate-pulse-glow' : 'bg-gray-800'}`}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-3 mt-1">
        <div>
          <p className={`text-xs font-mono tracking-widest uppercase ${status === 'idle' ? 'text-gray-600' : colors.text}`}>
            Agent 0{number} · {name}
          </p>
          <p className="text-sm font-bold text-white mt-0.5">{title}</p>
        </div>
        <span className={`text-xs font-mono px-2 py-0.5 rounded border shrink-0 ml-2 ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      {/* Content slot */}
      <div className={`transition-opacity duration-300 ${status === 'idle' && number < 5 ? 'opacity-30' : 'opacity-100'}`}>
        {children}
      </div>
    </motion.div>
  )
}
