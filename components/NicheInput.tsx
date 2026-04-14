'use client'
import { useState, useEffect } from 'react'

export interface PipelineOptions {
  targetLength: '30s' | '60s' | '90s' | '3min'
  shortsOnly: boolean
  voice: string
}

interface NicheInputProps {
  onSubmit: (niche: string, writingSample: string, options: PipelineOptions) => void
  isRunning: boolean
  initialNiche?: string
  initialSample?: string
}

const LENGTHS: { value: PipelineOptions['targetLength']; label: string; sub: string }[] = [
  { value: '30s',  label: '30s',  sub: 'Hook reel' },
  { value: '60s',  label: '60s',  sub: 'Standard'  },
  { value: '90s',  label: '90s',  sub: 'Extended'  },
  { value: '3min', label: '3min', sub: 'Long-form' },
]

const VOICES = [
  { key: 'bold',            icon: '🎙️', label: 'Bold & Direct',     desc: 'High energy, no fluff',      gender: 'male',   group: 'western' },
  { key: 'storyteller',     icon: '🎙️', label: 'Storyteller',        desc: 'Narrative, personal',         gender: 'male',   group: 'western' },
  { key: 'educational',     icon: '🎙️', label: 'Educational',        desc: 'Calm, informative',           gender: 'male',   group: 'western' },
  { key: 'confident',       icon: '🎤', label: 'Confident & Sharp',  desc: 'Direct, assertive',           gender: 'female', group: 'western' },
  { key: 'warm',            icon: '🎤', label: 'Warm & Relatable',   desc: 'Friendly, conversational',    gender: 'female', group: 'western' },
  { key: 'hype',            icon: '🎤', label: 'Hype Energy',        desc: 'Upbeat, motivational',        gender: 'female', group: 'western' },
  { key: 'indian-male-en',  icon: '🎙️', label: 'Indian Male (EN)',   desc: 'English, Indian accent',      gender: 'male',   group: 'indian'  },
  { key: 'indian-male-hi',  icon: '🎙️', label: 'Indian Male (HI)',   desc: 'Hindi, male voice',           gender: 'male',   group: 'indian'  },
  { key: 'indian-female-en',icon: '🎤', label: 'Indian Female (EN)', desc: 'English, Indian accent',      gender: 'female', group: 'indian'  },
  { key: 'indian-female-hi',icon: '🎤', label: 'Indian Female (HI)', desc: 'Hindi, female voice',         gender: 'female', group: 'indian'  },
]

export default function NicheInput({ onSubmit, isRunning, initialNiche, initialSample }: NicheInputProps) {
  const [niche, setNiche]                 = useState(initialNiche ?? '')
  const [writingSample, setWritingSample] = useState(initialSample ?? '')
  const [targetLength, setTargetLength]   = useState<PipelineOptions['targetLength']>('60s')
  const [shortsOnly, setShortsOnly]       = useState(true)
  const [voice, setVoice]                 = useState('bold')

  useEffect(() => { if (initialNiche  !== undefined) setNiche(initialNiche)         }, [initialNiche])
  useEffect(() => { if (initialSample !== undefined) setWritingSample(initialSample) }, [initialSample])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!niche.trim() || !writingSample.trim()) return
    onSubmit(niche.trim(), writingSample.trim(), { targetLength, shortsOnly, voice })
  }

  const inputClass = `
    w-full bg-navy-800 border border-neon-cyan/20 rounded-lg px-4 py-3
    text-white font-mono text-sm focus:outline-none focus:border-neon-cyan/60
    placeholder-gray-600 transition-colors disabled:opacity-50
  `

  const males        = VOICES.filter(v => v.gender === 'male'   && v.group === 'western')
  const females      = VOICES.filter(v => v.gender === 'female' && v.group === 'western')
  const indianMales  = VOICES.filter(v => v.gender === 'male'   && v.group === 'indian')
  const indianFemales= VOICES.filter(v => v.gender === 'female' && v.group === 'indian')

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-4">

      {/* Niche + Run */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono text-neon-cyan mb-2 uppercase tracking-widest">
            Your Niche
          </label>
          <input
            type="text"
            value={niche}
            onChange={e => setNiche(e.target.value)}
            placeholder="e.g. AI tools, crypto, fitness"
            className={inputClass}
            disabled={isRunning}
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={isRunning || !niche.trim() || !writingSample.trim()}
            className="w-full py-3 px-6 bg-neon-cyan text-navy-900 font-bold font-mono
              uppercase tracking-widest rounded-lg transition-all hover:bg-white
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isRunning ? '⬡ RUNNING...' : 'RUN PIPELINE →'}
          </button>
        </div>
      </div>

      {/* Writing sample */}
      <div>
        <label className="block text-xs font-mono text-neon-cyan mb-2 uppercase tracking-widest">
          Your Writing Sample{' '}
          <span className="text-gray-500 normal-case">(paste 1-2 past scripts so AI matches your voice)</span>
        </label>
        <textarea
          value={writingSample}
          onChange={e => setWritingSample(e.target.value)}
          placeholder="Paste your past script or caption here..."
          rows={3}
          className={inputClass + ' resize-none'}
          disabled={isRunning}
        />
      </div>

      {/* Voice style */}
      <div>
        <label className="block text-xs font-mono text-neon-cyan mb-3 uppercase tracking-widest">
          Voice Style
        </label>
        <div className="space-y-3">
          {/* Western voices */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-xs font-mono text-gray-500">🎙️ MALE</p>
              {males.map(v => (
                <button key={v.key} type="button" disabled={isRunning}
                  onClick={() => setVoice(v.key)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all disabled:opacity-40 ${
                    voice === v.key
                      ? 'border-neon-cyan bg-neon-cyan/10 text-white'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                  }`}>
                  <p className={`text-sm font-mono font-bold ${voice === v.key ? 'text-neon-cyan' : ''}`}>{v.label}</p>
                  <p className="text-xs text-gray-500">{v.desc}</p>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-mono text-gray-500">🎤 FEMALE</p>
              {females.map(v => (
                <button key={v.key} type="button" disabled={isRunning}
                  onClick={() => setVoice(v.key)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all disabled:opacity-40 ${
                    voice === v.key
                      ? 'border-neon-cyan bg-neon-cyan/10 text-white'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                  }`}>
                  <p className={`text-sm font-mono font-bold ${voice === v.key ? 'text-neon-cyan' : ''}`}>{v.label}</p>
                  <p className="text-xs text-gray-500">{v.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Indian voices */}
          <div>
            <p className="text-xs font-mono text-gray-500 mb-2">🇮🇳 INDIAN</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                {indianMales.map(v => (
                  <button key={v.key} type="button" disabled={isRunning}
                    onClick={() => setVoice(v.key)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all disabled:opacity-40 ${
                      voice === v.key
                        ? 'border-neon-cyan bg-neon-cyan/10 text-white'
                        : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                    }`}>
                    <p className={`text-sm font-mono font-bold ${voice === v.key ? 'text-neon-cyan' : ''}`}>{v.label}</p>
                    <p className="text-xs text-gray-500">{v.desc}</p>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {indianFemales.map(v => (
                  <button key={v.key} type="button" disabled={isRunning}
                    onClick={() => setVoice(v.key)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all disabled:opacity-40 ${
                      voice === v.key
                        ? 'border-neon-cyan bg-neon-cyan/10 text-white'
                        : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                    }`}>
                    <p className={`text-sm font-mono font-bold ${voice === v.key ? 'text-neon-cyan' : ''}`}>{v.label}</p>
                    <p className="text-xs text-gray-500">{v.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Length + Shorts row */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest shrink-0">Length</span>
          <div className="flex gap-1">
            {LENGTHS.map(l => (
              <button key={l.value} type="button" disabled={isRunning}
                onClick={() => setTargetLength(l.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all disabled:opacity-40 ${
                  targetLength === l.value
                    ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan'
                    : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                }`}>
                <span className="block font-bold">{l.label}</span>
                <span className="block text-[10px] opacity-60">{l.sub}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Shorts only</span>
          <button type="button" disabled={isRunning}
            onClick={() => setShortsOnly(v => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors disabled:opacity-40 ${shortsOnly ? 'bg-red-500' : 'bg-gray-700'}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${shortsOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
          {shortsOnly && <span className="text-xs font-mono text-red-400">≤ 60s</span>}
        </div>
      </div>

    </form>
  )
}
