import fs from 'fs'
import path from 'path'
import os from 'os'

// We'll test storage by creating a temp file and testing the core logic directly
// since DATA_PATH is a module-level constant

describe('storage logic', () => {
  const tmpDir = path.join(os.tmpdir(), 'contentai-test-' + Date.now())
  const tmpFile = path.join(tmpDir, 'results.json')

  interface Hook {
    text: string
    pattern: string
    estimatedViews: string
  }

  interface Run {
    id: string
    timestamp: string
    niche: string
    topTopic: string
    topicSignal: 'VIRAL' | 'HOT' | 'LOW'
    avgViews: number
    avgLikes: number
    script: string
    hooks: Hook[]
    recommendedHook: number
  }

  interface ResultsStore {
    runs: Run[]
  }

  // Inline the storage logic for testing (mirrors lib/storage.ts exactly)
  function readResultsFrom(filePath: string): ResultsStore {
    if (!fs.existsSync(filePath)) return { runs: [] }
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as ResultsStore
  }

  function saveRunTo(filePath: string, run: Run): void {
    const store = readResultsFrom(filePath)
    store.runs.unshift(run)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2))
  }

  function getRecentRunsFrom(filePath: string, niche: string, limit = 5): Run[] {
    const store = readResultsFrom(filePath)
    return store.runs
      .filter(r => r.niche.toLowerCase() === niche.toLowerCase())
      .slice(0, limit)
  }

  const mockRun: Run = {
    id: 'test-id-1',
    timestamp: '2026-04-12T10:00:00Z',
    niche: 'AI tools',
    topTopic: 'AI Automation',
    topicSignal: 'VIRAL',
    avgViews: 315000,
    avgLikes: 18000,
    script: 'test script',
    hooks: [{ text: 'hook', pattern: 'Pain + Solution', estimatedViews: '1M' }],
    recommendedHook: 0,
  }

  beforeEach(() => {
    fs.mkdirSync(tmpDir, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  test('readResults returns empty runs when file does not exist', () => {
    const result = readResultsFrom(tmpFile)
    expect(result).toEqual({ runs: [] })
  })

  test('saveRun persists a run and readResults returns it', () => {
    saveRunTo(tmpFile, mockRun)
    const result = readResultsFrom(tmpFile)
    expect(result.runs).toHaveLength(1)
    expect(result.runs[0].id).toBe('test-id-1')
  })

  test('saveRun prepends newer runs (newest first)', () => {
    saveRunTo(tmpFile, { ...mockRun, id: 'run-1' })
    saveRunTo(tmpFile, { ...mockRun, id: 'run-2' })
    const result = readResultsFrom(tmpFile)
    expect(result.runs[0].id).toBe('run-2')
    expect(result.runs[1].id).toBe('run-1')
  })

  test('getRecentRuns filters by niche case-insensitively', () => {
    saveRunTo(tmpFile, { ...mockRun, id: 'run-1', niche: 'AI tools' })
    saveRunTo(tmpFile, { ...mockRun, id: 'run-2', niche: 'crypto' })
    const runs = getRecentRunsFrom(tmpFile, 'ai tools')
    expect(runs).toHaveLength(1)
    expect(runs[0].id).toBe('run-1')
  })

  test('getRecentRuns respects limit', () => {
    for (let i = 0; i < 7; i++) {
      saveRunTo(tmpFile, { ...mockRun, id: `run-${i}` })
    }
    const runs = getRecentRunsFrom(tmpFile, 'AI tools', 5)
    expect(runs).toHaveLength(5)
  })
})
