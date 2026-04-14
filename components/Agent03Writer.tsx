'use client'
import { useEffect, useState } from 'react'
import { AgentStatus } from './AgentCard'

interface Agent03WriterProps {
  status: AgentStatus
  script?: string
}

export default function Agent03Writer({ status, script }: Agent03WriterProps) {
  const [displayed, setDisplayed] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!script) { setDisplayed(''); return }
    setDisplayed('')
    let i = 0
    const interval = setInterval(() => {
      i += 4
      setDisplayed(script.slice(0, i))
      if (i >= script.length) {
        setDisplayed(script)
        clearInterval(interval)
      }
    }, 16)
    return () => clearInterval(interval)
  }, [script])

  const handleCopy = () => {
    if (!script) return
    navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (status === 'idle') {
    return (
      <div className="h-24 flex items-center justify-center">
        <p className="text-xs font-mono text-gray-600">Waiting for viral topic...</p>
      </div>
    )
  }

  if (status === 'running' && !script) {
    return (
      <div className="h-24 flex items-center justify-center gap-2">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-neon-orange animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-xs font-mono text-neon-orange">Writing in your voice...</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="h-28 overflow-y-auto rounded border border-gray-800 bg-navy-900/60 p-2">
        <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">
          {displayed}
          {status === 'running' && (
            <span className="animate-pulse-glow text-neon-orange">▋</span>
          )}
        </pre>
      </div>
      {status === 'done' && script && (
        <button
          onClick={handleCopy}
          className="w-full text-xs font-mono py-1.5 rounded border border-neon-orange/40 text-neon-orange hover:bg-neon-orange/10 transition-colors"
        >
          {copied ? '✓ COPIED!' : 'COPY SCRIPT'}
        </button>
      )}
      <div className="flex justify-between text-xs font-mono text-gray-600">
        <span>your_voice · viral_fmt</span>
        {status === 'done' && <span className="text-neon-orange">✓ ready</span>}
      </div>
    </div>
  )
}
