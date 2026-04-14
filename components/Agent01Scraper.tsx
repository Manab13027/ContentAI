'use client'
import { useEffect, useState } from 'react'
import { AgentStatus } from './AgentCard'
import { PlatformCounts, generateMockPosts, formatNumber } from '@/lib/mockData'

interface Agent01ScraperProps {
  status: AgentStatus
  platformCounts?: PlatformCounts
  niche: string
}

function AnimatedCounter({ target, active }: { target: number; active: boolean }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active || target === 0) { setValue(0); return }
    const steps = 80
    const increment = target / steps
    let current = 0
    const interval = setInterval(() => {
      current = Math.min(current + increment, target)
      setValue(Math.floor(current))
      if (current >= target) clearInterval(interval)
    }, 6000 / steps)
    return () => clearInterval(interval)
  }, [active, target])

  return <span>{formatNumber(value)}</span>
}

const PLATFORM_CONFIG = [
  { key: 'instagram' as const, label: 'INSTAGRAM', color: 'text-neon-pink',   ring: 'border-neon-pink'   },
  { key: 'twitter'   as const, label: 'TWITTER/X', color: 'text-neon-cyan',   ring: 'border-neon-cyan'   },
  { key: 'youtube'   as const, label: 'YOUTUBE',   color: 'text-red-400',     ring: 'border-red-400'     },
  { key: 'reddit'    as const, label: 'REDDIT',    color: 'text-neon-orange', ring: 'border-neon-orange' },
]

export default function Agent01Scraper({ status, platformCounts, niche }: Agent01ScraperProps) {
  const active = status === 'running'
  const counts = platformCounts ?? { instagram: 0, twitter: 0, youtube: 0, reddit: 0 }
  const posts = generateMockPosts(niche || 'content', 8)
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-3">
      {/* Platform counters grid */}
      <div className="grid grid-cols-2 gap-2">
        {PLATFORM_CONFIG.map(p => (
          <div key={p.key} className="text-center">
            <div className={`w-8 h-8 mx-auto rounded-full border-2 ${p.ring} flex items-center justify-center mb-1`}>
              <span className="text-xs">●</span>
            </div>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-wider leading-tight">{p.label}</p>
            <p className={`text-base font-bold font-mono ${p.color}`}>
              <AnimatedCounter target={counts[p.key]} active={active} />
            </p>
          </div>
        ))}
      </div>

      {/* Scrolling post cards */}
      {(active || status === 'done') && (
        <div className="overflow-hidden h-16 rounded border border-gray-800">
          <div className={active ? 'animate-scroll-up' : ''}>
            {[...posts, ...posts].map((post, i) => (
              <div key={i} className="px-2 py-1 border-b border-gray-800/50">
                <p className="text-xs text-gray-400 truncate">{post.text}</p>
                <p className="text-xs font-mono text-gray-600">
                  {formatNumber(post.views)} views · {post.engagementRate}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status footer */}
      <div className="flex justify-between text-xs font-mono text-gray-500">
        <span>7 Days · 4 Platforms</span>
        <span className={active ? 'text-neon-cyan animate-pulse-glow' : status === 'done' ? 'text-neon-green' : ''}>
          {active ? 'FETCHING' : status === 'done' ? formatNumber(total) + ' scraped' : '—'}
        </span>
      </div>
    </div>
  )
}
