import fs from 'fs'
import path from 'path'

export interface Hook {
  text: string
  pattern: string
  estimatedViews: string
}

export interface Run {
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
  audioPath?: string
  videoPath?: string
  youtubeUrl?: string
}

export interface ResultsStore {
  runs: Run[]
}

export const DATA_PATH = path.join(process.cwd(), 'data', 'results.json')

export function readResults(): ResultsStore {
  if (!fs.existsSync(DATA_PATH)) return { runs: [] }
  const raw = fs.readFileSync(DATA_PATH, 'utf-8')
  return JSON.parse(raw) as ResultsStore
}

export function saveRun(run: Run): void {
  const store = readResults()
  store.runs.unshift(run)
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true })
  fs.writeFileSync(DATA_PATH, JSON.stringify(store, null, 2))
}

export function getRecentRuns(niche: string, limit = 5): Run[] {
  const store = readResults()
  return store.runs
    .filter(r => r.niche.toLowerCase() === niche.toLowerCase())
    .slice(0, limit)
}
