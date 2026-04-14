'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import type { TrendingTopic } from '@/app/api/trending/route'

interface Props {
  ytRefreshToken: string | null
  onUseTopic:  (niche: string, writingSample: string) => void
  onAutoRun:   (niche: string, writingSample: string) => void
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

export default function TrendingPanel({ ytRefreshToken, onUseTopic, onAutoRun }: Props) {
  const [niche,   setNiche]   = useState('')
  const [topics,  setTopics]  = useState<TrendingTopic[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [scanned, setScanned] = useState(false)

  const scan = async () => {
    if (!niche.trim()) return
    setLoading(true); setError(''); setTopics([])
    try {
      const params = new URLSearchParams({ niche: niche.trim() })
      if (ytRefreshToken) params.set('refreshToken', ytRefreshToken)
      const res  = await fetch(`/api/trending?${params}`)
      const data = await res.json() as { topics?: TrendingTopic[]; error?: string }
      if (data.error) { setError(data.error); return }
      setTopics(data.topics ?? [])
      setScanned(true)
    } catch (e) { setError(String(e)) }
    finally    { setLoading(false) }
  }

  const maxMetric = Math.max(...topics.map(t => t.viewCount ?? t.score ?? 0), 1)

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-3">
        <input
          value={niche}
          onChange={e => setNiche(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && scan()}
          placeholder="Enter niche — e.g. fitness, finance, AI tools"
          className="flex-1 bg-navy-800 border border-white/10 rounded-xl px-4 py-3
            font-mono text-sm text-white placeholder:text-gray-600
            focus:outline-none focus:border-neon-cyan/40 transition-colors"
        />
        <button
          onClick={scan}
          disabled={loading || !niche.trim()}
          className="px-6 py-3 rounded-xl bg-neon-cyan text-navy-900 font-mono font-bold
            text-sm uppercase tracking-widest hover:bg-white transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {loading ? 'SCANNING...' : 'SCAN'}
        </button>
      </div>

      {/* Source note */}
      <p className="text-[10px] font-mono text-gray-600 tracking-widest">
        {ytRefreshToken
          ? '▸ SCANNING YOUTUBE (LAST 14 DAYS) + REDDIT (THIS WEEK)'
          : '▸ SCANNING REDDIT ONLY — CONNECT YOUTUBE FOR MORE RESULTS'}
      </p>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 py-8 justify-center">
          <motion.div
            className="w-2 h-2 rounded-full bg-neon-cyan"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <motion.div
            className="w-2 h-2 rounded-full bg-neon-cyan"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-2 h-2 rounded-full bg-neon-cyan"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
          />
          <span className="text-xs font-mono text-neon-cyan tracking-widest">
            SCANNING VIRAL CONTENT...
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/5 font-mono text-xs text-red-400">
          ⚠ {error}
        </div>
      )}

      {/* Empty state */}
      {scanned && !loading && !topics.length && (
        <div className="py-10 text-center">
          <p className="font-mono text-xs text-gray-600 tracking-widest">
            NO TRENDING TOPICS FOUND — TRY A BROADER NICHE
          </p>
        </div>
      )}

      {/* Topic grid */}
      {topics.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {topics.map((t, i) => {
            const metric    = t.viewCount ?? t.score ?? 0
            const barWidth  = Math.round((metric / maxMetric) * 100)
            const isYT      = t.source === 'youtube'

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex flex-col gap-3 p-4 rounded-2xl border border-white/5 bg-navy-800
                  hover:border-white/10 transition-colors"
              >
                {/* Platform badge + source */}
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest uppercase border ${
                    isYT
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                  }`}>
                    {isYT ? 'YOUTUBE' : 'REDDIT'}
                  </span>
                  <span className="text-[10px] font-mono text-gray-600 truncate max-w-[120px]">
                    {t.channelOrSubreddit}
                  </span>
                </div>

                {/* Thumbnail */}
                {t.thumbnail ? (
                  <img
                    src={t.thumbnail}
                    alt={t.title}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ) : (
                  <div className={`w-full h-24 rounded-lg flex items-center justify-center
                    ${isYT ? 'bg-red-500/5' : 'bg-orange-500/5'}`}>
                    <span className="text-2xl">{isYT ? '▶' : '↑'}</span>
                  </div>
                )}

                {/* Title */}
                <p className="text-xs font-mono font-bold text-white leading-relaxed line-clamp-2">
                  {t.title}
                </p>

                {/* Metric + bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-500 tracking-widest">
                      {isYT ? 'VIEWS' : 'UPVOTES'}
                    </span>
                    <span className={`text-xs font-mono font-bold ${
                      isYT ? 'text-red-400' : 'text-orange-400'
                    }`}>
                      {fmt(metric)}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isYT ? 'bg-red-400' : 'bg-orange-400'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => {
                      onUseTopic(niche, t.title)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="flex-1 py-1.5 rounded-lg border border-neon-cyan/30 text-neon-cyan
                      font-mono text-[10px] font-bold tracking-widest uppercase
                      hover:bg-neon-cyan/10 transition-colors"
                  >
                    USE TOPIC
                  </button>
                  <button
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                      onAutoRun(niche, t.title)
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-neon-cyan text-navy-900
                      font-mono text-[10px] font-bold tracking-widest uppercase
                      hover:bg-white transition-colors"
                  >
                    AUTO-RUN →
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
