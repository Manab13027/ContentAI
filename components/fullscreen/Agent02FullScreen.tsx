'use client'
import { motion } from 'framer-motion'
import { AgentStatus } from '@/components/AgentCard'
import { MockTopic, formatNumber } from '@/lib/mockData'

interface Props { status: AgentStatus; topics?: MockTopic[] }

const SIG: Record<string, { text: string; border: string; bg: string }> = {
  VIRAL: { text: 'text-neon-cyan',   border: 'border-neon-cyan/40',   bg: 'bg-neon-cyan/5'   },
  HOT:   { text: 'text-neon-orange', border: 'border-neon-orange/40', bg: 'bg-neon-orange/5' },
  LOW:   { text: 'text-gray-500',    border: 'border-gray-700',       bg: 'bg-transparent'   },
}

const THRESHOLDS = [
  { label: 'Avg Views',   key: 'avgViews'    as keyof MockTopic, min: 60000, display: '≥ 60K'     },
  { label: 'Avg Likes',   key: 'avgLikes'    as keyof MockTopic, min: 5000,  display: '≥ 5K'      },
  { label: 'Comments',    key: 'avgComments' as keyof MockTopic, min: 500,   display: '≥ 500'     },
  { label: 'Post Volume', key: 'postCount'   as keyof MockTopic, min: 5,     display: '≥ 5 posts' },
]

export default function Agent02FullScreen({ status, topics }: Props) {
  const topTopic = topics?.[0]
  const viralCount = topics?.filter(t => t.signal === 'VIRAL').length ?? 0
  const isActive = status === 'running' || status === 'done'
  return (
    <motion.div className="fixed inset-0 z-50 bg-[#080b14] overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none" />
      <div className="relative z-10 h-full flex flex-col px-14 py-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-neon-green/30 bg-neon-green/5">
            <motion.span className="w-2 h-2 rounded-full bg-neon-green"
              animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />
            <span className="text-xs font-mono text-neon-green tracking-widest uppercase">
              Agent 02 · Validator · {status === 'running' ? 'Running' : 'Done'}
            </span>
          </div>
          {topTopic && <span className="text-xs font-mono text-gray-500">Topic: <span className="text-neon-orange">{topTopic.name}</span></span>}
        </div>
        <div className="flex gap-8 flex-1 min-h-0">
          <div className="w-72 shrink-0 flex flex-col gap-2 overflow-y-auto">
            <div className="flex justify-between text-xs font-mono text-gray-600 uppercase tracking-wider pb-2 border-b border-gray-800">
              <span>Avg Likes</span><span>Signal</span>
            </div>
            {(topics ?? (Array(7).fill(null) as null[])).map((topic: MockTopic | null, i) => {
              const s = topic ? SIG[topic.signal] ?? SIG.LOW : SIG.LOW
              return (
                <motion.div key={i}
                  className={`flex items-center justify-between p-3 rounded-lg border ${i === 0 && topic ? s.border + ' ' + s.bg : 'border-gray-800 bg-navy-800/30'}`}
                  initial={{ opacity: 0, x: -16 }} animate={isActive && topic ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: i * 0.25 }}>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{topic?.name ?? '—'}</p>
                    <p className="text-xs font-mono text-gray-500">{topic ? formatNumber(topic.avgLikes) + ' avg likes' : ''}</p>
                  </div>
                  {topic && (
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border shrink-0 ml-2 ${s.text} ${s.border} ${s.bg}`}>
                      {topic.signal === 'VIRAL' ? '🔥 VIRAL' : topic.signal}
                    </span>
                  )}
                </motion.div>
              )
            })}
          </div>
          <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-y-auto">
            {topTopic && (
              <motion.div className="rounded-xl border border-neon-cyan/25 bg-navy-800/50 p-6"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <p className="text-xs font-mono text-neon-cyan tracking-widest uppercase mb-1">Top Performer · Deep Score</p>
                <h2 className="text-3xl font-bold text-white mb-1">{topTopic.name}</h2>
                <p className="text-xs font-mono text-gray-500 mb-5">{topTopic.postCount} posts · #1 ranked topic</p>
                {[
                  { label: 'Avg Views',    value: topTopic.avgViews,    max: 500000, color: '#00f5ff' },
                  { label: 'Avg Likes',    value: topTopic.avgLikes,    max: 30000,  color: '#ff006e' },
                  { label: 'Avg Comments', value: topTopic.avgComments, max: 5000,   color: '#00ff88' },
                ].map((m, i) => (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-mono text-gray-400">● {m.label}</span>
                      <span className="text-sm font-bold font-mono" style={{ color: m.color }}>{formatNumber(m.value)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ backgroundColor: m.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((m.value / m.max) * 100, 100)}%` }}
                        transition={{ delay: 0.7 + i * 0.2, duration: 1.2, ease: 'easeOut' }} />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
            {topTopic && (
              <motion.div className="rounded-xl border border-gray-800 bg-navy-800/30 p-4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
                <p className="text-xs font-mono text-neon-orange tracking-widest uppercase mb-3">Thresholds</p>
                <div className="space-y-2">
                  {THRESHOLDS.map(t => {
                    const val = topTopic[t.key] as number
                    const ok = val >= t.min
                    return (
                      <div key={t.key as string} className="flex items-center justify-between px-3 py-2 rounded-lg bg-navy-900/60">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${ok ? 'bg-neon-green' : 'bg-gray-700'}`} />
                          <span className="text-sm text-gray-300">{t.label}</span>
                        </div>
                        <span className={`text-sm font-mono font-bold ${ok ? 'text-neon-green' : 'text-gray-600'}`}>
                          {t.display} {ok ? '✓' : '✗'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
            {topics && viralCount > 0 && (
              <motion.div className="rounded-xl border border-neon-green/30 bg-neon-green/5 p-6 text-center"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.3 }}>
                <p className="text-xs font-mono text-neon-green tracking-widest uppercase mb-2">Viral Topics Found</p>
                <p className="text-7xl font-bold text-neon-green">{viralCount}</p>
                <p className="text-gray-400 mt-2">{topTopic?.name} is your best bet</p>
              </motion.div>
            )}
          </div>
        </div>
        {topTopic && (
          <motion.div className="mt-4 flex items-center justify-between px-6 py-4 rounded-xl border border-neon-orange/30 bg-neon-orange/5"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }}>
            <div>
              <p className="text-lg font-bold text-neon-orange">{topTopic.name}</p>
              <p className="text-xs font-mono text-gray-500">Recommended Topic</p>
            </div>
            <span className="text-xs font-mono text-gray-500">↑ {formatNumber(topTopic.avgViews)} views pattern · your strongest signal</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
