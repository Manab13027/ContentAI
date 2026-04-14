'use client'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Run } from '@/lib/storage'
import { formatNumber } from '@/lib/mockData'

interface HistoryPanelProps {
  refreshTrigger: boolean | number
  onLoadRun?: (run: Run) => void
}

interface RunDetailProps {
  run: Run
  onClose: () => void
  onLoad: (run: Run) => void
}

function RunDetail({ run, onClose, onLoad }: RunDetailProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <motion.div
      className="fixed inset-0 z-[90] bg-black/80 flex items-center justify-center p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#0d1120] border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto"
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0d1120] border-b border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <p className="text-xs font-mono text-neon-cyan uppercase tracking-widest">{run.niche}</p>
            <p className="text-lg font-bold text-white mt-0.5">{run.topTopic}</p>
            <p className="text-xs font-mono text-gray-500 mt-0.5">
              {new Date(run.timestamp).toLocaleString()} ·{' '}
              <span className={run.topicSignal === 'VIRAL' ? 'text-neon-cyan' : run.topicSignal === 'HOT' ? 'text-neon-orange' : 'text-gray-500'}>
                {run.topicSignal}
              </span>
              {' · '}{formatNumber(run.avgViews)} avg views
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onLoad(run); onClose() }}
              className="text-neon-cyan font-mono text-sm px-3 py-1 border border-neon-cyan/40 bg-neon-cyan/5 rounded-lg hover:bg-neon-cyan/15 transition-colors"
            >
              ↩ Use as Input
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-white font-mono text-sm px-3 py-1 border border-gray-700 rounded-lg hover:border-gray-500 transition-colors">
              ✕ Close
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Script */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-mono text-neon-orange uppercase tracking-widest">Script</p>
              <button onClick={() => copy(run.script, 'script')}
                className="text-xs font-mono text-gray-500 hover:text-neon-cyan transition-colors">
                {copied === 'script' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-gray-900/50 rounded-xl p-4 border border-gray-800 leading-relaxed">
              {run.script}
            </pre>
          </div>

          {/* Hooks */}
          <div>
            <p className="text-xs font-mono text-neon-pink uppercase tracking-widest mb-3">Hooks</p>
            <div className="space-y-2">
              {run.hooks.map((hook, i) => (
                <div key={i}
                  onClick={() => copy(hook.text, `hook-${i}`)}
                  className="cursor-pointer rounded-xl border border-gray-800 bg-gray-900/40 hover:bg-gray-800/60 transition-all p-4 flex items-start justify-between gap-3"
                  style={{ borderLeftColor: ['#00f5ff','#00ff88','#4488ff','#ff006e','#ffd700'][i], borderLeftWidth: 3 }}>
                  <div>
                    <p className="text-xs font-mono text-gray-500 mb-1">
                      Hook {i + 1}{i === run.recommendedHook ? ' · ★ Recommended' : ''} · {hook.pattern}
                    </p>
                    <p className="text-sm text-white">&quot;{hook.text}&quot;</p>
                    <p className="text-xs font-mono text-gray-600 mt-1">{hook.estimatedViews} views</p>
                  </div>
                  <span className="text-xs font-mono text-gray-700 shrink-0">
                    {copied === `hook-${i}` ? '✓' : 'copy'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Video preview if available */}
          {run.videoPath && run.id && (
            <div>
              <p className="text-xs font-mono text-amber-400 uppercase tracking-widest mb-3">Video Preview</p>
              <video
                src={`/api/video/${run.id}`}
                controls
                className="w-full max-w-xs mx-auto rounded-xl border border-amber-500/30 bg-black block"
              />
            </div>
          )}

          {/* YouTube link if available */}
          {run.youtubeUrl && (
            <div>
              <p className="text-xs font-mono text-red-400 uppercase tracking-widest mb-2">YouTube</p>
              <a href={run.youtubeUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-mono hover:bg-red-500/20 transition-colors">
                ▶ {run.youtubeUrl}
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function HistoryPanel({ refreshTrigger, onLoadRun }: HistoryPanelProps) {
  const [runs, setRuns] = useState<Run[]>([])
  const [selectedRun, setSelectedRun] = useState<Run | null>(null)

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then((data: { runs: Run[] }) => setRuns(data.runs ?? []))
      .catch(() => {})
  }, [refreshTrigger])

  if (runs.length === 0) return null

  return (
    <>
      <div>
        <h2 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">
          Past Runs <span className="text-gray-700 normal-case">— click to view</span>
        </h2>
        <div className="grid grid-cols-5 gap-3">
          {runs.slice(0, 5).map(run => (
            <button
              key={run.id}
              onClick={() => setSelectedRun(run)}
              className="rounded-lg border border-gray-800 bg-navy-800/40 p-3 space-y-1 text-left hover:border-neon-cyan/40 hover:bg-navy-800/70 transition-all group"
            >
              <p className="text-xs font-mono text-neon-cyan truncate group-hover:text-neon-cyan">{run.niche}</p>
              <p className="text-xs text-white truncate font-medium">{run.topTopic}</p>
              <div className="flex items-center gap-1 flex-wrap">
                <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${
                  run.topicSignal === 'VIRAL'
                    ? 'text-neon-cyan border-neon-cyan/40'
                    : run.topicSignal === 'HOT'
                    ? 'text-neon-orange border-neon-orange/40'
                    : 'text-gray-500 border-gray-700'
                }`}>
                  {run.topicSignal}
                </span>
                <span className="text-xs font-mono text-gray-500">{formatNumber(run.avgViews)}v</span>
              </div>
              <p className="text-xs font-mono text-gray-600">{new Date(run.timestamp).toLocaleDateString()}</p>
              {run.videoPath && (
                <p className="text-xs font-mono text-amber-500/60">▶ video</p>
              )}
              {run.youtubeUrl && (
                <p className="text-xs font-mono text-red-500/60">▶ youtube</p>
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedRun && (
          <RunDetail
            run={selectedRun}
            onClose={() => setSelectedRun(null)}
            onLoad={run => { onLoadRun?.(run); setSelectedRun(null) }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
