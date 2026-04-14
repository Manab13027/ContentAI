'use client'
import { motion } from 'framer-motion'
import { AgentStatus } from './AgentCard'
import { MockTopic, formatNumber } from '@/lib/mockData'

interface Agent02ValidatorProps {
  status: AgentStatus
  topics?: MockTopic[]
}

const SIGNAL_STYLES: Record<string, string> = {
  VIRAL: 'text-neon-cyan  border-neon-cyan/50  bg-neon-cyan/5',
  HOT:   'text-neon-orange border-neon-orange/50 bg-neon-orange/5',
  LOW:   'text-gray-500   border-gray-600       bg-transparent',
}

const THRESHOLDS = [
  { label: 'Avg Views',   key: 'avgViews'    as keyof MockTopic, min: 60000 },
  { label: 'Avg Likes',   key: 'avgLikes'    as keyof MockTopic, min: 5000  },
  { label: 'Comments',    key: 'avgComments' as keyof MockTopic, min: 500   },
  { label: 'Post Volume', key: 'postCount'   as keyof MockTopic, min: 5     },
]

export default function Agent02Validator({ status, topics }: Agent02ValidatorProps) {
  const isActive = status === 'running' || status === 'done'
  const topTopic = topics?.[0]

  return (
    <div className="space-y-2">
      {/* Topic list */}
      <div className="space-y-1">
        {(topics ?? Array(4).fill(null) as null[]).slice(0, 4).map((topic: MockTopic | null, i) => (
          <motion.div
            key={i}
            className="flex items-center justify-between py-1 border-b border-gray-800/50"
            initial={{ opacity: 0, x: -8 }}
            animate={isActive && topic ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: i * 0.35, duration: 0.3 }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{topic?.name ?? '—'}</p>
              <p className="text-xs font-mono text-gray-500">
                {topic ? formatNumber(topic.avgViews) + ' avg views' : ''}
              </p>
            </div>
            {topic && (
              <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ml-2 shrink-0 ${SIGNAL_STYLES[topic.signal] ?? SIGNAL_STYLES.LOW}`}>
                {topic.signal}
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Threshold checklist for top topic */}
      {topTopic && (
        <div className="pt-1 space-y-0.5">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-1">Thresholds</p>
          {THRESHOLDS.map(t => {
            const value = topTopic[t.key] as number
            const passing = value >= t.min
            return (
              <div key={t.key as string} className="flex justify-between text-xs font-mono">
                <span className="text-gray-400">{t.label}</span>
                <span className={passing ? 'text-neon-green' : 'text-gray-600'}>
                  ≥{formatNumber(t.min)} {passing ? '✓' : '✗'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {!isActive && (
        <p className="text-xs font-mono text-gray-600 text-center py-2">Waiting for scraped data...</p>
      )}
    </div>
  )
}
