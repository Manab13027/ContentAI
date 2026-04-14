'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

interface CountryRow { country: string; views: number; likes: number }

interface VideoStats {
  views: number; likes: number; comments: number
  title: string; publishedAt: string
}

interface DashboardRun {
  id: string
  timestamp: string
  niche: string
  topTopic: string
  topicSignal: string
  avgViews: number
  script: string
  youtubeUrl?: string
  videoId?: string | null
  stats: VideoStats | null
  countries: CountryRow[]
}

interface DashboardResponse {
  runs:     DashboardRun[]
  error:    string | null
  warnings: string[] | null
}

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', IN: 'India',        GB: 'United Kingdom', CA: 'Canada',
  AU: 'Australia',     DE: 'Germany',      FR: 'France',         BR: 'Brazil',
  MX: 'Mexico',        JP: 'Japan',        KR: 'South Korea',    NG: 'Nigeria',
  PK: 'Pakistan',      ID: 'Indonesia',    PH: 'Philippines',    ZA: 'South Africa',
  EG: 'Egypt',         SA: 'Saudi Arabia', AE: 'UAE',            SG: 'Singapore',
  MY: 'Malaysia',      TH: 'Thailand',     NL: 'Netherlands',    ES: 'Spain',
  IT: 'Italy',         PL: 'Poland',       SE: 'Sweden',         NO: 'Norway',
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function CountryBar({ rows }: { rows: CountryRow[] }) {
  if (!rows.length) return (
    <p className="text-xs font-mono text-gray-600 mt-2 uppercase tracking-widest">
      No country data yet — analytics data takes 24–48h to appear
    </p>
  )
  const max = Math.max(...rows.map(r => r.views), 1)
  return (
    <div className="mt-3 space-y-2">
      {rows.map(r => (
        <div key={r.country} className="flex items-center gap-3">
          <span className="text-xs font-mono text-gray-400 w-36 shrink-0 uppercase">
            {COUNTRY_NAMES[r.country] ?? r.country}
          </span>
          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-neon-cyan rounded-full" style={{ width: `${(r.views / max) * 100}%` }} />
          </div>
          <span className="text-xs font-mono text-neon-cyan w-12 text-right shrink-0">
            {fmt(r.views)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [runs,     setRuns]     = useState<DashboardRun[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [hasToken, setHasToken] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    let acc: { refreshToken: string; channelName: string } | null = null
    try {
      const raw = localStorage.getItem('yt_account')
      acc = raw ? JSON.parse(raw) : null
    } catch {}
    setHasToken(!!acc)

    const url = acc
      ? `/api/dashboard?refreshToken=${encodeURIComponent(acc.refreshToken)}`
      : '/api/dashboard'

    fetch(url)
      .then(r => r.json())
      .then((d: DashboardResponse) => {
        setRuns(d.runs ?? [])
        setError(d.error ?? null)
        setWarnings(d.warnings ?? [])
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const posted     = runs.filter(r => r.youtubeUrl)
  const totalViews = posted.reduce((s, r) => s + (r.stats?.views ?? 0), 0)
  const totalLikes = posted.reduce((s, r) => s + (r.stats?.likes ?? 0), 0)

  return (
    <main className="min-h-screen bg-[#080b14] text-white overflow-x-hidden">
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/"
              className="text-[10px] font-mono text-gray-500 hover:text-neon-cyan
                transition-colors mb-3 inline-block tracking-widest uppercase">
              ← Back to Pipeline
            </Link>
            <h1 className="text-3xl font-mono font-bold text-white tracking-widest uppercase">
              Analytics Dashboard
            </h1>
            <p className="text-xs font-mono text-gray-500 mt-1 tracking-widest uppercase">
              All pipeline runs · YouTube stats for posted videos
            </p>
          </div>

          <div className="flex items-center gap-3 mt-8">
            <button
              onClick={load}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-gray-700 text-gray-400 font-mono text-xs
                hover:border-neon-cyan/40 hover:text-neon-cyan transition-colors disabled:opacity-40 uppercase tracking-widest">
              {loading ? '↻ Loading...' : '↻ Refresh'}
            </button>
            <div className={`px-4 py-2 rounded-xl border font-mono text-xs tracking-widest uppercase ${
              hasToken
                ? 'border-green-500/20 bg-green-500/5 text-green-400'
                : 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400'
            }`}>
              {hasToken ? '✓ YouTube Connected' : '⚠ Not Connected'}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 py-3 rounded-xl border border-red-500/30 bg-red-500/5">
            <p className="text-xs font-mono text-red-400 tracking-widest">⚠ {error}</p>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="px-5 py-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 space-y-1">
            <p className="text-[10px] font-mono text-yellow-500 tracking-widest uppercase font-bold mb-1">API Warnings</p>
            {warnings.map((w, i) => (
              <p key={i} className="text-[10px] font-mono text-yellow-400/80">{w}</p>
            ))}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Runs',     value: String(runs.length),    color: 'text-white'      },
            { label: 'Posted to YT',   value: String(posted.length),  color: 'text-neon-cyan'  },
            { label: 'Total Views',    value: fmt(totalViews),        color: 'text-neon-green' },
            { label: 'Total Likes',    value: fmt(totalLikes),        color: 'text-neon-pink'  },
          ].map(card => (
            <div key={card.label} className="rounded-2xl border border-white/5 bg-[#0d1120] px-6 py-5">
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">{card.label}</p>
              <p className={`text-3xl font-mono font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-16 text-center">
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest animate-pulse">Loading...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !runs.length && (
          <div className="rounded-2xl border border-white/5 bg-[#0d1120] px-6 py-16 text-center">
            <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">No runs yet</p>
            <p className="text-xs font-mono text-gray-600 mt-2 tracking-wider">
              Run the pipeline to generate content and see it here.
            </p>
            <Link href="/"
              className="inline-block mt-6 px-6 py-2.5 rounded-xl bg-neon-cyan text-navy-900
                font-mono font-bold text-sm uppercase tracking-widest hover:bg-white transition-colors">
              Go to Pipeline →
            </Link>
          </div>
        )}

        {/* Run list */}
        {!loading && runs.length > 0 && (
          <div className="space-y-3">
            {runs.map(r => (
              <div key={r.id} className="rounded-2xl border border-white/5 bg-[#0d1120] overflow-hidden">

                <div className="flex items-center gap-4 px-5 py-4">

                  {/* Status badge / YT icon */}
                  {r.youtubeUrl ? (
                    <a href={r.youtubeUrl} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl
                        bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-red-500">
                        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8z"/>
                        <polygon points="9.6,15.6 15.8,12 9.6,8.4" fill="#080b14"/>
                      </svg>
                    </a>
                  ) : (
                    <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl
                      bg-gray-800 border border-gray-700">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8" fill="none" stroke="#6b7280" strokeWidth="2"/>
                      </svg>
                    </div>
                  )}

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {r.youtubeUrl ? (
                        <a href={r.youtubeUrl} target="_blank" rel="noopener noreferrer"
                          className="text-sm font-mono font-bold text-white truncate uppercase hover:text-red-400 transition-colors">
                          {r.stats?.title ?? r.topTopic}
                        </a>
                      ) : (
                        <p className="text-sm font-mono font-bold text-white truncate uppercase">
                          {r.topTopic}
                        </p>
                      )}
                      {r.youtubeUrl ? (
                        <span className="shrink-0 px-2 py-0.5 rounded-full border border-red-500/40 bg-red-500/10
                          text-[9px] font-mono text-red-400 uppercase tracking-widest">Posted</span>
                      ) : (
                        <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[9px] font-mono uppercase tracking-widest ${
                          r.topicSignal === 'VIRAL' ? 'border-neon-pink/40 bg-neon-pink/10 text-neon-pink' :
                          r.topicSignal === 'HOT'   ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400' :
                                                      'border-gray-700 bg-gray-800 text-gray-500'
                        }`}>{r.topicSignal ?? 'Generated'}</span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">
                      {r.niche} · {new Date(r.timestamp).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Stats */}
                  {r.youtubeUrl ? (
                    <div className="flex items-center gap-6 shrink-0">
                      {[
                        { value: r.stats ? fmt(r.stats.views)    : '—', label: 'VIEWS',    color: r.stats ? 'text-neon-cyan'  : 'text-gray-600' },
                        { value: r.stats ? fmt(r.stats.likes)    : '—', label: 'LIKES',    color: r.stats ? 'text-neon-green' : 'text-gray-600' },
                        { value: r.stats ? fmt(r.stats.comments) : '—', label: 'COMMENTS', color: r.stats ? 'text-gray-400'   : 'text-gray-600' },
                      ].map(s => (
                        <div key={s.label} className="text-center">
                          <p className={`text-lg font-mono font-bold ${s.color}`}>{s.value}</p>
                          <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center shrink-0">
                      <p className="text-lg font-mono font-bold text-gray-500">{fmt(r.avgViews)}</p>
                      <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Topic Avg</p>
                    </div>
                  )}

                  {/* Expand button */}
                  <button
                    onClick={() => setExpanded(r.id === expanded ? null : r.id)}
                    className="shrink-0 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-500
                      font-mono text-[10px] uppercase tracking-widest ml-2
                      hover:border-gray-500 hover:text-gray-300 transition-colors">
                    {r.id === expanded ? '▲ Hide' : r.youtubeUrl ? '▼ Countries' : '▼ Script'}
                  </button>
                </div>

                {/* Country breakdown */}
                {r.id === expanded && r.youtubeUrl && (
                  <div className="border-t border-white/5 px-5 pb-5 pt-4">
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                      Views by Country
                    </p>
                    <CountryBar rows={r.countries} />
                  </div>
                )}

                {/* Script preview for non-posted runs */}
                {r.id === expanded && !r.youtubeUrl && (
                  <div className="border-t border-white/5 px-5 pb-5 pt-4">
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Script Preview</p>
                    <p className="text-xs font-mono text-gray-400 leading-relaxed line-clamp-6 whitespace-pre-wrap">
                      {r.script}
                    </p>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
