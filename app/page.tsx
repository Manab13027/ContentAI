'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import TrendingPanel from '@/components/TrendingPanel'
import NicheInput, { PipelineOptions } from '@/components/NicheInput'
import PipelineHeader from '@/components/PipelineHeader'
import AgentCard, { AgentStatus } from '@/components/AgentCard'
import Agent01Scraper from '@/components/Agent01Scraper'
import Agent02Validator from '@/components/Agent02Validator'
import Agent03Writer from '@/components/Agent03Writer'
import Agent04HookGen from '@/components/Agent04HookGen'
import Agent05VoiceGen from '@/components/Agent05VoiceGen'
import Agent06VideoAssembler from '@/components/Agent06VideoAssembler'
import Agent07YouTubePost from '@/components/Agent07YouTubePost'
import HistoryPanel from '@/components/HistoryPanel'
import {
  generatePlatformCounts,
  generateMockTopics,
  MockTopic,
  PlatformCounts,
} from '@/lib/mockData'

interface Hook {
  text: string
  pattern: string
  estimatedViews: string
}

interface PipelineResults {
  platformCounts: PlatformCounts
  topics: MockTopic[]
  script: string
  hooks: Hook[]
  audioPath: string
  videoPath: string
  youtubeUrl: string
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default function Home() {
  const [isRunning, setIsRunning]   = useState(false)
  const [niche, setNiche]           = useState('')
  const [historyKey, setHistoryKey] = useState(0)
  const [results, setResults]       = useState<Partial<PipelineResults>>({})
  const [ytAccount, setYtAccount] = useState<{ channelName: string; refreshToken: string } | null>(null)
  const [ytConnecting, setYtConnecting] = useState(false)
  const [ytError, setYtError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [loadedNiche, setLoadedNiche] = useState<string | undefined>()
  const [loadedSample, setLoadedSample] = useState<string | undefined>()
  const [pipelineError, setPipelineError] = useState('')

  const [a1Status, setA1Status] = useState<AgentStatus>('idle')
  const [a2Status, setA2Status] = useState<AgentStatus>('idle')
  const [a3Status, setA3Status] = useState<AgentStatus>('idle')
  const [a4Status, setA4Status] = useState<AgentStatus>('idle')
  const [a5Status, setA5Status] = useState<AgentStatus>('idle')
  const [a6Status, setA6Status] = useState<AgentStatus>('idle')
  const [a7Status, setA7Status] = useState<AgentStatus>('idle')
  const [a7Error, setA7Error] = useState('')
  const [postsScraped, setPostsScraped] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<PipelineOptions | null>(null)
  const [trendingOpen, setTrendingOpen] = useState(true)
  const [pendingUpload, setPendingUpload] = useState<{
    videoPath: string; title: string; description: string; tags: string[]
    script: string; hooks: Hook[]; topTopic: string; topicSignal: string
    avgViews: number; avgLikes: number; inputNiche: string; audioPath: string
  } | null>(null)
  const [topTopic, setTopTopic] = useState('')
  const [videoTitle, setVideoTitle] = useState('')
  const [runId, setRunId] = useState('')

  // Load YouTube account from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('yt_account')
      if (saved) setYtAccount(JSON.parse(saved))
    } catch {}
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const connectYouTube = async () => {
    setYtConnecting(true)
    setYtError('')
    try {
      const res = await fetch('/api/youtube/authurl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: window.location.origin }),
      })
      const data = await res.json() as { url: string; state: string; error?: string }
      if (data.error) { setYtError(data.error); setYtConnecting(false); return }

      window.open(data.url, 'youtube-auth', 'width=520,height=640,left=200,top=80')

      const pollStart = Date.now()
      pollRef.current = setInterval(async () => {
        // Timeout after 3 minutes
        if (Date.now() - pollStart > 180_000) {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
          setYtConnecting(false)
          setYtError('Authorization timed out. Please try again.')
          return
        }
        try {
          const pollRes  = await fetch(`/api/youtube/poll?state=${data.state}`)
          const pollData = await pollRes.json() as { status: string; refreshToken?: string; channelName?: string; error?: string }
          if (pollData.status === 'pending') return
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
          setYtConnecting(false)
          if (pollData.status === 'success' && pollData.refreshToken) {
            const acc = { refreshToken: pollData.refreshToken, channelName: pollData.channelName ?? 'YouTube' }
            localStorage.setItem('yt_account', JSON.stringify(acc))
            setYtAccount(acc)
          } else if (pollData.status === 'error') {
            setYtError(pollData.error ?? 'Authorization failed')
          } else if (pollData.status === 'not_found') {
            setYtError('Authorization expired or popup was closed. Please try again.')
          }
        } catch {}
      }, 2000)
    } catch (err) { setYtError(String(err)); setYtConnecting(false) }
  }

  const disconnectYouTube = () => { localStorage.removeItem('yt_account'); setYtAccount(null) }

  const finishRun = async (upload: typeof pendingUpload, youtubeUrl?: string) => {
    if (!upload) return
    setResults(prev => ({ ...prev, youtubeUrl }))
    await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        niche: upload.inputNiche,
        topTopic: upload.topTopic,
        topicSignal: upload.topicSignal,
        avgViews: upload.avgViews,
        avgLikes: upload.avgLikes,
        script: upload.script,
        hooks: upload.hooks,
        recommendedHook: 0,
        audioPath: upload.audioPath,
        videoPath: upload.videoPath,
        youtubeUrl: youtubeUrl ?? null,
      }),
    })
    setPendingUpload(null)
    setHistoryKey(k => k + 1)
    setA7Status('done')
  }

  const confirmUpload = async () => {
    if (!pendingUpload || !ytAccount) return
    setA7Status('running')
    setA7Error('')
    try {
      const ytRes = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoPath: pendingUpload.videoPath,
          title: pendingUpload.title,
          description: pendingUpload.description,
          tags: pendingUpload.tags,
          refreshToken: ytAccount.refreshToken,
        }),
      })
      const ytData = (await ytRes.json()) as { youtubeUrl?: string; error?: string }
      if (ytData.youtubeUrl) {
        await finishRun(pendingUpload, ytData.youtubeUrl)
      } else {
        // Keep dialog open so user can retry
        setA7Error(ytData.error ?? 'Upload failed')
        setA7Status('idle')
      }
    } catch (e) {
      setA7Error(String(e))
      setA7Status('idle')
    }
  }

  const skipUpload = async () => {
    if (!pendingUpload) return
    await finishRun(pendingUpload)
  }

  const runPipeline = async (inputNiche: string, writingSample: string, options: PipelineOptions) => {
    try {
    const id = crypto.randomUUID()
    setRunId(id)
    setNiche(inputNiche)
    setIsRunning(true)
    setResults({})
    setA1Status('idle'); setA2Status('idle'); setA3Status('idle'); setA4Status('idle')
    setA5Status('idle'); setA6Status('idle'); setA7Status('idle')
    setA7Error(''); setPipelineError('')
    setSelectedOptions(options)

    // ── Agent 01 — mock scraping (8s) ──────────────────────────────────────
    setA1Status('running')
    const platformCounts = generatePlatformCounts(inputNiche)
    setResults(prev => ({ ...prev, platformCounts }))
    const total = Object.values(platformCounts).reduce((a, b) => a + b, 0)
    let scraped = 0
    const scrapeIv = setInterval(() => {
      scraped = Math.min(scraped + Math.floor(total / 60), total)
      setPostsScraped(scraped)
      if (scraped >= total) clearInterval(scrapeIv)
    }, 8000 / 60)
    await sleep(8000)
    clearInterval(scrapeIv)
    setPostsScraped(total)
    setA1Status('done')

    // ── Agent 02 — mock validation (5s) ───────────────────────────────────
    setA2Status('running')
    const topics = generateMockTopics(inputNiche)
    setResults(prev => ({ ...prev, topics }))
    if (topics[0]) setTopTopic(topics[0].name)
    await sleep(5000)
    setA2Status('done')

    const topTopicData: MockTopic = topics[0]

    // ── Agent 03 — Claude script generation ───────────────────────────────
    setA3Status('running')
    const genRes = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        niche: inputNiche,
        topTopic: topTopicData.name,
        avgViews: topTopicData.avgViews,
        writingSample,
        targetLength: options.targetLength,
        voice: options.voice,
      }),
    })
    const genData = (await genRes.json()) as { script?: string; error?: string }
    if (!genData.script) {
      setPipelineError(`Agent 03 (Writer) failed: ${genData.error ?? 'unknown error'}`)
      setA3Status('done'); setIsRunning(false); return
    }
    const script = genData.script
    setResults(prev => ({ ...prev, script }))
    setA3Status('done')

    // ── Agent 04 — Claude hook generation ─────────────────────────────────
    setA4Status('running')
    const hookRes = await fetch('/api/hooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script, niche: inputNiche }),
    })
    const hookData = (await hookRes.json()) as { hooks?: Hook[]; error?: string }
    if (!hookData.hooks) {
      setPipelineError(`Agent 04 (Hooks) failed: ${hookData.error ?? 'unknown error'}`)
      setA4Status('done'); setIsRunning(false); return
    }
    const hooks = hookData.hooks
    setResults(prev => ({ ...prev, hooks }))
    setA4Status('done')

    // ── Agent 05 — ElevenLabs voiceover ───────────────────────────────────
    setA5Status('running')
    const voiceRes = await fetch('/api/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script, runId: id, voice: options.voice }),
    })
    const voiceData = (await voiceRes.json()) as { audioPath?: string; error?: string }
    if (!voiceData.audioPath) {
      setPipelineError(`Agent 05 (Voice) failed: ${voiceData.error ?? 'unknown error'}`)
      setA5Status('done')
      setIsRunning(false)
      return
    }
    const audioPath = voiceData.audioPath
    setResults(prev => ({ ...prev, audioPath }))
    setA5Status('done')

    // ── Agent 06 — Pexels + FFmpeg video assembly ──────────────────────────
    setA6Status('running')
    const videoRes = await fetch('/api/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: topTopicData.name,
        niche: inputNiche,
        audioPath,
        runId: id,
        shortsOnly: options.shortsOnly,
        voice: options.voice,
      }),
    })
    const videoData = (await videoRes.json()) as { videoPath?: string; error?: string }
    if (!videoData.videoPath) {
      setPipelineError(`Agent 06 (Video) failed: ${videoData.error ?? 'unknown error'}`)
      setA6Status('done')
      setIsRunning(false)
      return
    }
    const videoPath = videoData.videoPath
    setResults(prev => ({ ...prev, videoPath }))
    setA6Status('done')

    // ── Agent 07 — pause and wait for user confirmation ───────────────────
    const title = `${topTopicData.name} | ${inputNiche}`
    setVideoTitle(title)
    setPendingUpload({
      videoPath,
      title,
      description: `${script}\n\nGenerated with ContentAI\n#shorts #${inputNiche.replace(/\s+/g, '')} #AIcontent`,
      tags: [inputNiche, topTopicData.name, 'shorts', 'AIcontent', 'contentcreator'],
      script,
      hooks,
      topTopic: topTopicData.name,
      topicSignal: topTopicData.signal,
      avgViews: topTopicData.avgViews,
      avgLikes: topTopicData.avgLikes,
      inputNiche,
      audioPath,
    })
    setIsRunning(false)
    } catch (e) {
      setPipelineError(`Unexpected error: ${String(e)}`)
      setIsRunning(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#080b14] text-white overflow-x-hidden">
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-start justify-between">
          <PipelineHeader isRunning={isRunning} />
          <Link href="/dashboard"
            className="px-4 py-2 rounded-xl border border-gray-700 text-gray-400 font-mono text-xs
              hover:border-neon-cyan/40 hover:text-neon-cyan transition-colors shrink-0">
            Analytics Dashboard →
          </Link>
        </div>
        {/* ── Viral Content Radar ───────────────────────────────────── */}
        <div className="max-w-5xl mx-auto w-full">
          <button
            onClick={() => setTrendingOpen(v => !v)}
            className="flex items-center gap-3 mb-3 group w-full"
          >
            <span className="text-[10px] font-mono font-bold tracking-widest text-gray-500 group-hover:text-neon-cyan transition-colors uppercase">
              ▸ Viral Content Radar
            </span>
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[10px] font-mono text-gray-700 group-hover:text-gray-500 transition-colors">
              {trendingOpen ? '▲ COLLAPSE' : '▼ EXPAND'}
            </span>
          </button>

          {trendingOpen && (
            <div className="rounded-2xl border border-white/5 bg-navy-800/50 p-5">
              <TrendingPanel
                ytRefreshToken={ytAccount?.refreshToken ?? null}
                onUseTopic={(topicNiche, writingSample) => {
                  setLoadedNiche(topicNiche)
                  setLoadedSample(writingSample)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                onAutoRun={(topicNiche, writingSample) => {
                  setLoadedNiche(topicNiche)
                  setLoadedSample(writingSample)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                  runPipeline(topicNiche, writingSample, {
                    targetLength: '60s',
                    shortsOnly:   true,
                    voice:        'bold',
                  })
                }}
              />
            </div>
          )}
        </div>

        <NicheInput
          onSubmit={runPipeline}
          isRunning={isRunning}
          initialNiche={loadedNiche}
          initialSample={loadedSample}
        />
        {/* Active run — format + length badge */}
        {selectedOptions && (
          <div className="max-w-3xl mx-auto flex items-center gap-3 flex-wrap">
            <span className={`px-3 py-1 rounded-full border font-mono text-xs font-bold uppercase tracking-widest ${
              selectedOptions.shortsOnly
                ? 'border-red-500/50 bg-red-500/10 text-red-400'
                : 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan'
            }`}>
              {selectedOptions.shortsOnly ? '▶ YouTube Short (≤60s)' : '▶ Long-Form Video'}
            </span>
            <span className="px-3 py-1 rounded-full border border-gray-700 bg-gray-800 font-mono text-xs text-gray-300 uppercase tracking-widest">
              {{
                '30s':  '30s — Hook Reel',
                '60s':  '60s — Standard',
                '90s':  '90s — Extended',
                '3min': '3min — Long-Form',
              }[selectedOptions.targetLength]}
            </span>
            <span className="px-3 py-1 rounded-full border border-gray-700 bg-gray-800 font-mono text-xs text-gray-300 uppercase tracking-widest">
              Voice: {selectedOptions.voice}
            </span>
          </div>
        )}

        {pipelineError && (
          <div className="max-w-3xl mx-auto px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 font-mono text-sm">
            ⚠ {pipelineError}
          </div>
        )}

        {/* Row 1: Content Intelligence */}
        <div className="grid grid-cols-4 gap-4">
          <AgentCard number={1} name="SCRAPER" title="Content Intelligence" status={a1Status}>
            <Agent01Scraper status={a1Status} platformCounts={results.platformCounts} niche={niche} />
          </AgentCard>
          <AgentCard number={2} name="VALIDATOR" title="Viral Intelligence" status={a2Status}>
            <Agent02Validator status={a2Status} topics={results.topics} />
          </AgentCard>
          <AgentCard number={3} name="WRITER" title="Script Generator" status={a3Status}>
            <Agent03Writer status={a3Status} script={results.script} />
          </AgentCard>
          <AgentCard number={4} name="HOOK GEN" title="Hook Variations" status={a4Status}>
            <Agent04HookGen status={a4Status} hooks={results.hooks} recommendedHook={0} />
          </AgentCard>
        </div>

        {/* YouTube connection banner */}
        <div className={`flex items-center justify-between px-5 py-3 rounded-xl border transition-all ${
          ytAccount ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
        }`}>
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" className={`w-5 h-5 shrink-0 ${ytAccount ? 'fill-green-400' : 'fill-red-400'}`}>
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8z"/>
              <polygon points="9.6,15.6 15.8,12 9.6,8.4" fill="#080b14"/>
            </svg>
            <div>
              <p className={`text-sm font-mono font-bold ${ytAccount ? 'text-green-400' : 'text-red-400'}`}>
                {ytAccount ? `✓ ${ytAccount.channelName}` : 'YouTube Not Connected'}
              </p>
              <p className="text-xs font-mono text-gray-500">
                {ytAccount
                  ? 'Agent 07 will auto-post your video after assembly'
                  : 'Connect your YouTube account so Agent 07 can auto-post your video'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ytError && <p className="text-xs text-red-400 font-mono max-w-xs">{ytError}</p>}
            {ytAccount ? (
              <button onClick={disconnectYouTube}
                className="shrink-0 px-4 py-1.5 rounded-lg border border-gray-600 text-gray-400 font-mono text-xs hover:border-red-500/40 hover:text-red-400 transition-colors">
                Switch Account
              </button>
            ) : (
              <button onClick={connectYouTube} disabled={ytConnecting}
                className="shrink-0 px-5 py-2 rounded-lg border border-red-500/60 bg-red-500/10 text-red-400 font-mono text-sm font-bold hover:bg-red-500/20 transition-colors disabled:opacity-40">
                {ytConnecting ? 'Connecting...' : 'Connect YouTube →'}
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Video Production */}
        <div className="grid grid-cols-3 gap-4">
          <AgentCard number={5} name="VOICE GEN" title="ElevenLabs TTS" status={a5Status}>
            <Agent05VoiceGen status={a5Status} audioPath={results.audioPath} />
          </AgentCard>
          <AgentCard number={6} name="VIDEO" title="Pexels + FFmpeg" status={a6Status}>
            <Agent06VideoAssembler status={a6Status} videoPath={results.videoPath} runId={runId} />
          </AgentCard>
          <AgentCard number={7} name="YOUTUBE" title="Auto-Post Short" status={a7Status}>
            <Agent07YouTubePost
              status={a7Status}
              youtubeUrl={results.youtubeUrl}
              ytConnected={!!ytAccount}
              error={a7Error}
              awaiting={!!pendingUpload}
            />
          </AgentCard>
        </div>

        {/* YouTube upload confirmation */}
        {pendingUpload && (
          <div className="max-w-3xl mx-auto rounded-2xl border border-red-500/40 bg-red-500/5 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-red-500/20 bg-red-500/10">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-red-500 shrink-0">
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8z"/>
                <polygon points="9.6,15.6 15.8,12 9.6,8.4" fill="#080b14"/>
              </svg>
              <p className="text-sm font-mono font-bold text-red-400">Ready to post — confirm before uploading</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">Title</p>
                <p className="text-sm font-mono text-white">{pendingUpload.title}</p>
              </div>
              <div>
                <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">Description preview</p>
                <p className="text-xs font-mono text-gray-400 leading-relaxed line-clamp-3">{pendingUpload.description}</p>
              </div>
              <div>
                <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {pendingUpload.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 rounded-full border border-gray-700 text-xs font-mono text-gray-400">#{t}</span>
                  ))}
                </div>
              </div>
            </div>
            {a7Error && (
              <div className="mx-5 mb-3 px-4 py-2.5 rounded-xl border border-red-500/40 bg-red-500/10">
                <p className="text-xs font-mono text-red-400 leading-relaxed">⚠ {a7Error}</p>
              </div>
            )}
            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={confirmUpload}
                disabled={!ytAccount || a7Status === 'running'}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-mono font-bold text-sm
                  hover:bg-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {a7Status === 'running'
                  ? '⬡ Uploading...'
                  : a7Error
                    ? 'Retry Upload →'
                    : ytAccount
                      ? 'Post to YouTube →'
                      : 'YouTube Not Connected'}
              </button>
              <button onClick={skipUpload} disabled={a7Status === 'running'}
                className="px-6 py-2.5 rounded-xl border border-gray-700 text-gray-400 font-mono text-sm
                  hover:border-gray-500 hover:text-white transition-colors disabled:opacity-40">
                Skip
              </button>
            </div>
          </div>
        )}

        <HistoryPanel
          refreshTrigger={historyKey}
          onLoadRun={run => {
            setLoadedNiche(run.niche)
            // Use the run's script as the writing sample so AI matches that voice
            setLoadedSample(run.script)
            // Scroll to top so user sees the form prefilled
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      </div>
    </main>
  )
}
