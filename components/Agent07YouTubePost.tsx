'use client'
import { motion } from 'framer-motion'
import { AgentStatus } from '@/components/AgentCard'

interface Props {
  status: AgentStatus
  youtubeUrl?: string
  ytConnected?: boolean
  error?: string
  awaiting?: boolean
}

const YTIcon = ({ className }: { className: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8z"/>
    <polygon points="9.6,15.6 15.8,12 9.6,8.4" fill="#080b14"/>
  </svg>
)

export default function Agent07YouTubePost({ status, youtubeUrl, ytConnected, error, awaiting }: Props) {
  if (awaiting) return (
    <div className="flex flex-col items-center justify-center h-32 gap-2">
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
        <YTIcon className="w-8 h-8 fill-red-500" />
      </motion.div>
      <p className="text-xs font-mono text-red-400 text-center">Waiting for your approval...</p>
      <p className="text-xs font-mono text-gray-500 text-center">See confirmation below</p>
    </div>
  )

  if (status === 'idle') return (
    <div className="flex flex-col items-center justify-center h-32 gap-2">
      <YTIcon className={`w-8 h-8 ${ytConnected ? 'fill-red-500' : 'fill-gray-600'}`} />
      <p className={`text-xs font-mono ${ytConnected ? 'text-green-400' : 'text-gray-500'}`}>
        {ytConnected ? '✓ Connected — ready to post' : 'Not connected — see banner above'}
      </p>
    </div>
  )

  if (status === 'running') return (
    <div className="flex flex-col items-center justify-center h-32 gap-3">
      <motion.div className="w-10 h-10" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
        <YTIcon className="w-full h-full fill-red-500" />
      </motion.div>
      <p className="text-xs font-mono text-red-400 animate-pulse">Uploading to YouTube...</p>
    </div>
  )

  // Done with error
  if (error) return (
    <div className="flex flex-col items-center justify-center h-32 gap-2 px-2">
      <YTIcon className="w-7 h-7 fill-yellow-500/50" />
      <p className="text-xs font-mono text-yellow-400 text-center leading-relaxed">⚠ {error}</p>
    </div>
  )

  // Done with URL
  return (
    <div className="flex flex-col items-center justify-center h-32 gap-2">
      <YTIcon className="w-8 h-8 fill-red-500" />
      {youtubeUrl ? (
        <a href={youtubeUrl} target="_blank" rel="noopener noreferrer"
          className="text-xs font-mono text-red-400 hover:text-red-300 underline truncate max-w-full px-2">
          View on YouTube →
        </a>
      ) : (
        <p className="text-xs font-mono text-red-400">✓ Posted</p>
      )}
    </div>
  )
}
