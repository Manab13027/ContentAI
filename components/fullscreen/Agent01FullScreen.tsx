'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { PlatformCounts, generateMockPosts, formatNumber } from '@/lib/mockData'
import { AgentStatus } from '@/components/AgentCard'

function AnimatedCounter({ target, active }: { target: number; active: boolean }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active || target === 0) return
    let current = 0
    const step = target / 80
    const iv = setInterval(() => {
      current = Math.min(current + step, target)
      setValue(Math.floor(current))
      if (current >= target) clearInterval(iv)
    }, 6000 / 80)
    return () => clearInterval(iv)
  }, [active, target])
  return <>{formatNumber(value)}</>
}

function PlatformRing({ count, maxCount, color, label, icon, active }: {
  count: number; maxCount: number; color: string; label: string; icon: string; active: boolean
}) {
  const size = 130; const sw = 5
  const r = (size - sw * 2) / 2
  const circ = 2 * Math.PI * r
  const progress = maxCount > 0 ? count / maxCount : 0
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={sw} />
          <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: active ? circ * (1 - progress) : circ }}
            transition={{ duration: 5.5, ease: 'easeOut' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-3xl">{icon}</div>
      </div>
      <div className="text-center">
        <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-bold font-mono" style={{ color }}>
          <AnimatedCounter target={count} active={active} />
        </p>
      </div>
    </div>
  )
}

interface Props {
  status: AgentStatus; platformCounts?: PlatformCounts; niche: string; postsScraped: number
}

export default function Agent01FullScreen({ status, platformCounts, niche, postsScraped }: Props) {
  const active = status === 'running'
  const counts = platformCounts ?? { instagram: 0, twitter: 0, youtube: 0, reddit: 0 }
  const maxCount = Math.max(...Object.values(counts), 1)
  const posts = generateMockPosts(niche || 'content', 14)
  const platforms = [
    { key: 'instagram' as const, label: 'INSTAGRAM',  icon: '📸', color: '#ff006e' },
    { key: 'twitter'   as const, label: 'TWITTER / X', icon: '✕',  color: '#00f5ff' },
    { key: 'youtube'   as const, label: 'YOUTUBE',    icon: '▶',  color: '#ff4040' },
    { key: 'reddit'    as const, label: 'REDDIT',     icon: '●',  color: '#ff6b00' },
  ]
  return (
    <motion.div className="fixed inset-0 z-50 bg-[#080b14] overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none" />
      <div className="relative z-10 h-full flex flex-col px-14 py-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-neon-cyan/30 bg-neon-cyan/5">
            <motion.span className="w-2 h-2 rounded-full bg-neon-cyan"
              animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />
            <span className="text-xs font-mono text-neon-cyan tracking-widest uppercase">Agent 01 · Scraper · Running</span>
          </div>
        </div>
        <h1 className="text-6xl font-bold mb-2 tracking-tight">
          Scraping <span className="text-neon-cyan">Viral Content</span>
        </h1>
        <p className="text-gray-400 font-mono mb-5">Pulling top posts from your niche across all platforms in real-time</p>
        <div className="flex gap-3 mb-8 flex-wrap">
          {platforms.map(p => (
            <div key={p.key} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-700 bg-navy-800/60">
              <span className="text-xs font-mono text-gray-300">{p.label}</span>
              <span className="text-sm font-bold font-mono px-2 py-0.5 rounded"
                style={{ color: p.color, background: p.color + '22' }}>
                <AnimatedCounter target={counts[p.key]} active={active} />
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-10 flex-1 min-h-0">
          <div className="flex items-center gap-10 shrink-0">
            {platforms.map(p => (
              <PlatformRing key={p.key} count={counts[p.key]} maxCount={maxCount}
                color={p.color} label={p.label} icon={p.icon} active={active} />
            ))}
          </div>
          <div className="flex-1 min-w-0 overflow-hidden rounded-xl border border-gray-800 bg-navy-800/20">
            <div className={active ? 'animate-scroll-up' : ''}>
              {[...posts, ...posts].map((post, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-gray-800/50">
                  <span className={`shrink-0 mt-0.5 text-xs font-mono px-2 py-0.5 rounded ${
                    post.platform === 'twitter' ? 'bg-neon-cyan/10 text-neon-cyan' :
                    post.platform === 'instagram' ? 'bg-neon-pink/10 text-neon-pink' :
                    post.platform === 'youtube' ? 'bg-red-900/30 text-red-400' :
                    'bg-orange-900/20 text-neon-orange'}`}>
                    {post.platform === 'twitter' ? 'TWITTER/X' : post.platform.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 leading-snug truncate">{post.text}</p>
                    <p className="text-xs font-mono text-gray-600 mt-0.5">
                      👁 {formatNumber(post.views)} &nbsp;❤ {formatNumber(post.likes)} &nbsp;💬 {post.engagementRate}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-gray-800/60 pt-4">
          <div className="flex gap-10">
            {[
              { label: 'Posts Scraped', value: formatNumber(postsScraped), color: '#00f5ff' },
              { label: 'Days Lookback', value: '7',  color: '#00ff88' },
              { label: 'Posts / Sec',   value: '5',  color: '#ffd700' },
              { label: 'Platforms',     value: '4',  color: '#ff6b00' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 px-5 py-2 rounded-lg border border-neon-cyan/30 bg-neon-cyan/5">
            <motion.span className="w-2 h-2 rounded-full bg-neon-cyan"
              animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.7, repeat: Infinity }} />
            <span className="text-sm font-mono text-neon-cyan font-bold tracking-widest">FETCHING</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
