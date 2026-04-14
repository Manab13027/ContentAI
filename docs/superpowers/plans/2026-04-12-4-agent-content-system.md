# 4-Agent Content System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page animated Next.js app with a 4-agent AI pipeline that scrapes (mock) viral content, validates topics, generates scripts, and produces hook variations using the Claude API.

**Architecture:** Single Next.js 14 app with client-side pipeline orchestration. Agents 01 and 02 run mock animations client-side. Agents 03 and 04 call server-side API routes that use the Claude API. Results persist to `data/results.json` and feed back into future runs for improvement.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Claude API (`claude-sonnet-4-6`), Node.js `fs` for JSON storage.

---

## File Map

| File | Responsibility |
|---|---|
| `app/layout.tsx` | Root layout, fonts, metadata |
| `app/globals.css` | Dark theme, grid background, neon glow utilities |
| `app/page.tsx` | Pipeline orchestration, state management |
| `app/api/generate/route.ts` | Claude script generation endpoint |
| `app/api/hooks/route.ts` | Claude hook generation endpoint |
| `app/api/save/route.ts` | Persist run to results.json |
| `app/api/history/route.ts` | Read recent runs for history panel |
| `lib/storage.ts` | Read/write data/results.json |
| `lib/mockData.ts` | Fake scraping data generator |
| `lib/claude.ts` | Claude API wrapper functions |
| `components/NicheInput.tsx` | Niche + writing sample form |
| `components/PipelineHeader.tsx` | "AI AGENT PIPELINE · LIVE" top bar |
| `components/AgentCard.tsx` | Reusable card shell (idle/running/done states) |
| `components/Agent01Scraper.tsx` | Animated platform counters + scrolling post cards |
| `components/Agent02Validator.tsx` | Topic list + VIRAL/HOT/LOW badges + threshold checklist |
| `components/Agent03Writer.tsx` | Typewriter script output + copy button |
| `components/Agent04HookGen.tsx` | 5 hooks with pattern labels + recommended badge |
| `components/HistoryPanel.tsx` | Last 5 runs display |
| `data/results.json` | Auto-created on first save |

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.env.local`

- [ ] **Step 1: Scaffold Next.js project in the existing directory**

```bash
cd "/Users/fighter/Documents/Projects Folder/ContentAI"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*" --yes
```

Expected output: `Success! Created project at ...`

- [ ] **Step 2: Install additional dependencies**

```bash
npm install framer-motion @anthropic-ai/sdk
```

Expected output: `added X packages`

- [ ] **Step 3: Create `.env.local` with your Claude API key**

Create file `.env.local` in project root:

```
ANTHROPIC_API_KEY=your_claude_api_key_here
```

Replace `your_claude_api_key_here` with your actual key from console.anthropic.com.

- [ ] **Step 4: Create data directory**

```bash
mkdir -p data
echo '{"runs":[]}' > data/results.json
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Expected: Server running at `http://localhost:3000`. Open browser, see default Next.js page. Stop server with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with dependencies"
```

---

## Task 2: Global Styles + Layout

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace `app/globals.css` with dark theme**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

:root {
  --cyan: #00f5ff;
  --pink: #ff006e;
  --orange: #ff6b00;
  --green: #00ff88;
  --navy: #080b14;
}

body {
  background-color: var(--navy);
  color: white;
  font-family: 'Space Grotesk', sans-serif;
}

.font-mono {
  font-family: 'JetBrains Mono', monospace;
}

.bg-grid-pattern {
  background-image:
    linear-gradient(rgba(0, 245, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 245, 255, 0.04) 1px, transparent 1px);
  background-size: 40px 40px;
}

.glow-cyan { box-shadow: 0 0 20px rgba(0, 245, 255, 0.3), 0 0 40px rgba(0, 245, 255, 0.1); }
.glow-pink  { box-shadow: 0 0 20px rgba(255, 0, 110, 0.3), 0 0 40px rgba(255, 0, 110, 0.1); }
.glow-orange{ box-shadow: 0 0 20px rgba(255, 107, 0, 0.3), 0 0 40px rgba(255, 107, 0, 0.1); }
.glow-green { box-shadow: 0 0 20px rgba(0, 255, 136, 0.3), 0 0 40px rgba(0, 255, 136, 0.1); }

.text-cyan   { color: var(--cyan); }
.text-pink   { color: var(--pink); }
.text-orange { color: var(--orange); }
.text-green  { color: var(--green); }

.border-cyan   { border-color: var(--cyan); }
.border-pink   { border-color: var(--pink); }
.border-orange { border-color: var(--orange); }
.border-green  { border-color: var(--green); }

@keyframes pulse-glow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.animate-pulse-glow {
  animation: pulse-glow 1.5s ease-in-out infinite;
}

@keyframes scroll-up {
  0%   { transform: translateY(0); }
  100% { transform: translateY(-50%); }
}

.animate-scroll-up {
  animation: scroll-up 6s linear infinite;
}
```

- [ ] **Step 2: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '4-Agent Content System',
  description: 'Scrape → Validate → Write → Hook — fully automated',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Update `tailwind.config.ts` to add custom colors**

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#080b14',
          800: '#0d1120',
          700: '#111827',
        },
        neon: {
          cyan:   '#00f5ff',
          pink:   '#ff006e',
          orange: '#ff6b00',
          green:  '#00ff88',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 4: Run dev server and verify dark background loads**

```bash
npm run dev
```

Open `http://localhost:3000`. Background should be dark navy. Stop with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx tailwind.config.ts
git commit -m "style: add dark cyberpunk theme, neon utilities, fonts"
```

---

## Task 3: Storage Library

**Files:**
- Create: `lib/storage.ts`
- Create: `lib/__tests__/storage.test.ts`

- [ ] **Step 1: Install Jest and testing deps**

```bash
npm install --save-dev jest @types/jest ts-jest
```

- [ ] **Step 2: Add Jest config to `package.json`**

Add this `jest` field to `package.json` (merge with existing content):

```json
{
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/$1"
    }
  },
  "scripts": {
    "test": "jest"
  }
}
```

- [ ] **Step 3: Create `lib/__tests__/storage.test.ts` — write failing tests first**

```ts
import fs from 'fs'
import path from 'path'

// Point storage at a temp file for tests
const TEST_DATA_PATH = path.join(__dirname, 'test-results.json')

// We'll mock the DATA_PATH in storage.ts via jest
jest.mock('../storage', () => {
  const actual = jest.requireActual('../storage')
  return { ...actual, DATA_PATH: TEST_DATA_PATH }
})

import { readResults, saveRun, getRecentRuns, Run } from '../storage'

const mockRun: Run = {
  id: 'test-id-1',
  timestamp: '2026-04-12T10:00:00Z',
  niche: 'AI tools',
  topTopic: 'AI Automation',
  topicSignal: 'VIRAL',
  avgViews: 315000,
  avgLikes: 18000,
  script: 'test script content',
  hooks: [{ text: 'hook 1', pattern: 'Pain + Solution', estimatedViews: '1M' }],
  recommendedHook: 0,
}

afterEach(() => {
  if (fs.existsSync(TEST_DATA_PATH)) fs.unlinkSync(TEST_DATA_PATH)
})

test('readResults returns empty runs when file does not exist', () => {
  const result = readResults()
  expect(result).toEqual({ runs: [] })
})

test('saveRun persists a run and readResults returns it', () => {
  saveRun(mockRun)
  const result = readResults()
  expect(result.runs).toHaveLength(1)
  expect(result.runs[0].id).toBe('test-id-1')
})

test('saveRun prepends newer runs', () => {
  saveRun({ ...mockRun, id: 'run-1' })
  saveRun({ ...mockRun, id: 'run-2' })
  const result = readResults()
  expect(result.runs[0].id).toBe('run-2')
})

test('getRecentRuns filters by niche case-insensitively', () => {
  saveRun({ ...mockRun, id: 'run-1', niche: 'AI tools' })
  saveRun({ ...mockRun, id: 'run-2', niche: 'crypto' })
  const runs = getRecentRuns('ai tools')
  expect(runs).toHaveLength(1)
  expect(runs[0].id).toBe('run-1')
})

test('getRecentRuns respects limit', () => {
  for (let i = 0; i < 7; i++) {
    saveRun({ ...mockRun, id: `run-${i}` })
  }
  const runs = getRecentRuns('AI tools', 5)
  expect(runs).toHaveLength(5)
})
```

- [ ] **Step 4: Run tests — verify they fail**

```bash
npx jest lib/__tests__/storage.test.ts
```

Expected: FAIL — `Cannot find module '../storage'`

- [ ] **Step 5: Create `lib/storage.ts`**

```ts
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
```

- [ ] **Step 6: Run tests — verify they pass**

```bash
npx jest lib/__tests__/storage.test.ts
```

Expected: PASS — 5 tests passing

- [ ] **Step 7: Commit**

```bash
git add lib/storage.ts lib/__tests__/storage.test.ts package.json
git commit -m "feat: add storage lib for persisting pipeline runs to JSON"
```

---

## Task 4: Mock Data Generator

**Files:**
- Create: `lib/mockData.ts`
- Create: `lib/__tests__/mockData.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/__tests__/mockData.test.ts`:

```ts
import {
  generatePlatformCounts,
  generateMockPosts,
  generateMockTopics,
  formatNumber,
} from '../mockData'

test('generatePlatformCounts returns counts for all 4 platforms', () => {
  const counts = generatePlatformCounts('AI tools')
  expect(counts).toHaveProperty('instagram')
  expect(counts).toHaveProperty('twitter')
  expect(counts).toHaveProperty('youtube')
  expect(counts).toHaveProperty('reddit')
  expect(counts.instagram).toBeGreaterThan(0)
})

test('generatePlatformCounts is deterministic for same niche', () => {
  const a = generatePlatformCounts('crypto')
  const b = generatePlatformCounts('crypto')
  expect(a).toEqual(b)
})

test('generateMockPosts returns requested count', () => {
  const posts = generateMockPosts('fitness', 8)
  expect(posts).toHaveLength(8)
})

test('generateMockPosts posts have required fields', () => {
  const posts = generateMockPosts('AI', 1)
  expect(posts[0]).toHaveProperty('platform')
  expect(posts[0]).toHaveProperty('text')
  expect(posts[0]).toHaveProperty('views')
  expect(posts[0]).toHaveProperty('likes')
  expect(posts[0]).toHaveProperty('engagementRate')
})

test('generateMockTopics returns topics sorted by avgViews descending', () => {
  const topics = generateMockTopics('crypto')
  for (let i = 0; i < topics.length - 1; i++) {
    expect(topics[i].avgViews).toBeGreaterThanOrEqual(topics[i + 1].avgViews)
  }
})

test('formatNumber formats thousands and millions correctly', () => {
  expect(formatNumber(315400)).toBe('315.4K')
  expect(formatNumber(1980000)).toBe('1.9M')
  expect(formatNumber(500)).toBe('500')
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx jest lib/__tests__/mockData.test.ts
```

Expected: FAIL — `Cannot find module '../mockData'`

- [ ] **Step 3: Create `lib/mockData.ts`**

```ts
export interface MockPost {
  platform: 'instagram' | 'twitter' | 'youtube' | 'reddit'
  text: string
  views: number
  likes: number
  comments: number
  engagementRate: number
}

export interface MockTopic {
  name: string
  postCount: number
  avgViews: number
  avgLikes: number
  avgComments: number
  signal: 'VIRAL' | 'HOT' | 'LOW'
}

export interface PlatformCounts {
  instagram: number
  twitter: number
  youtube: number
  reddit: number
}

// Deterministic pseudo-random based on string seed
function seededRandom(seed: number, offset: number): number {
  const x = Math.sin(seed + offset) * 10000
  return x - Math.floor(x)
}

export function generatePlatformCounts(niche: string): PlatformCounts {
  const seed = niche.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return {
    instagram: 500 + Math.floor(seededRandom(seed, 1) * 400),
    twitter:   900 + Math.floor(seededRandom(seed, 2) * 500),
    youtube:   600 + Math.floor(seededRandom(seed, 3) * 400),
    reddit:    400 + Math.floor(seededRandom(seed, 4) * 300),
  }
}

export function generateMockPosts(niche: string, count = 10): MockPost[] {
  const platforms: MockPost['platform'][] = ['instagram', 'twitter', 'youtube', 'reddit']
  const templates = [
    `Tired of guessing what ${niche} content to post? I automated the whole thing.`,
    `90% of creators don't realize you can do this with ${niche}.`,
    `This is what ${niche} content creation should feel like.`,
    `I spent 5 hours on ${niche} content. This agent does it in 10 minutes.`,
    `${niche} just changed forever — here's what most people missed.`,
    `The ${niche} strategy nobody talks about.`,
    `Most people spend 5 hours on ${niche}. This system does it in 10 minutes.`,
    `I gave 4 AI agents my ${niche} niche — and let them run. Here's what happened.`,
    `${niche} productivity unlocked — nobody told me this was possible.`,
    `Stop guessing ${niche} content. Let the data decide.`,
  ]

  return Array.from({ length: count }, (_, i) => {
    const views   = 50000 + Math.floor(seededRandom(i, 10) * 1500000)
    const likes   = Math.floor(views * (0.03 + seededRandom(i, 11) * 0.08))
    const comments = Math.floor(likes * (0.02 + seededRandom(i, 12) * 0.05))
    return {
      platform: platforms[i % 4],
      text: templates[i % templates.length],
      views,
      likes,
      comments,
      engagementRate: parseFloat(((likes / views) * 100).toFixed(1)),
    }
  })
}

export function generateMockTopics(niche: string): MockTopic[] {
  const seed = niche.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const names = [
    `${niche} Automation`,
    `AI-Powered ${niche}`,
    `${niche} Tools`,
    `${niche} Hacks`,
    `${niche} Strategy`,
    `${niche} Growth`,
    `${niche} Mistakes`,
    `${niche} Secrets`,
  ]

  return names
    .map((name, i) => {
      const avgViews    = 20000 + Math.floor(seededRandom(seed + i, 20) * 380000)
      const avgLikes    = Math.floor(avgViews * (0.04 + seededRandom(seed + i, 21) * 0.06))
      const avgComments = Math.floor(avgLikes * (0.02 + seededRandom(seed + i, 22) * 0.04))
      const postCount   = 3 + Math.floor(seededRandom(seed + i, 23) * 12)

      let signal: MockTopic['signal'] = 'LOW'
      if (avgViews >= 60000 && avgLikes >= 5000 && avgComments >= 500 && postCount >= 5) {
        signal = i < 2 ? 'VIRAL' : 'HOT'
      } else if (avgViews >= 30000) {
        signal = 'HOT'
      }

      return { name, postCount, avgViews, avgLikes, avgComments, signal }
    })
    .sort((a, b) => b.avgViews - a.avgViews)
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx jest lib/__tests__/mockData.test.ts
```

Expected: PASS — 6 tests passing

- [ ] **Step 5: Commit**

```bash
git add lib/mockData.ts lib/__tests__/mockData.test.ts
git commit -m "feat: add mock data generator for scraper and validator agents"
```

---

## Task 5: Claude API Wrapper

**Files:**
- Create: `lib/claude.ts`

- [ ] **Step 1: Create `lib/claude.ts`**

```ts
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generateScript(params: {
  niche: string
  topTopic: string
  avgViews: number
  writingSample: string
  pastScripts: string[]
}): Promise<string> {
  const pastScriptsText = params.pastScripts.length > 0
    ? `\n\nPast scripts you have already written (do NOT repeat these topics or structures):\n${params.pastScripts.slice(0, 3).join('\n---\n')}`
    : ''

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a short-form content script writer who mirrors the user's exact voice.

Niche: ${params.niche}
Viral topic: ${params.topTopic} (${(params.avgViews / 1000).toFixed(1)}K avg views on this topic)

User's writing style — match this voice exactly:
${params.writingSample}${pastScriptsText}

Write a 60-90 second reel script in the user's exact voice. Base it on the viral topic above.

Format your response EXACTLY like this (include the labels):
[HOOK]
<1-2 sentences that grab attention immediately>

[BODY]
<3-5 short punchy paragraphs — conversational, not corporate>

[CTA]
<1 sentence call to action>`,
    }],
  })

  return (message.content[0] as Anthropic.TextBlock).text
}

export async function generateHooks(params: {
  script: string
  niche: string
  pastHooks: string[]
}): Promise<Array<{ text: string; pattern: string; estimatedViews: string }>> {
  const pastHooksText = params.pastHooks.length > 0
    ? `\n\nAvoid repeating these past hooks:\n${params.pastHooks.slice(0, 5).join('\n')}`
    : ''

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a viral hook specialist for short-form video content.

Script:
${params.script}

Niche: ${params.niche}${pastHooksText}

Generate exactly 5 hook variations. Each must use a DIFFERENT pattern:
1. Pain + Solution
2. Curiosity Gap  
3. Time-Saving Claim
4. Contrarian Take
5. Personal Story

Respond ONLY with valid JSON — no markdown, no explanation, no code fences:
[
  {"text": "...", "pattern": "Pain + Solution", "estimatedViews": "1.2M"},
  {"text": "...", "pattern": "Curiosity Gap", "estimatedViews": "850K"},
  {"text": "...", "pattern": "Time-Saving Claim", "estimatedViews": "600K"},
  {"text": "...", "pattern": "Contrarian Take", "estimatedViews": "420K"},
  {"text": "...", "pattern": "Personal Story", "estimatedViews": "310K"}
]`,
    }],
  })

  const text = (message.content[0] as Anthropic.TextBlock).text
  return JSON.parse(text) as Array<{ text: string; pattern: string; estimatedViews: string }>
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/claude.ts
git commit -m "feat: add Claude API wrapper for script and hook generation"
```

---

## Task 6: API Routes

**Files:**
- Create: `app/api/generate/route.ts`
- Create: `app/api/hooks/route.ts`
- Create: `app/api/save/route.ts`
- Create: `app/api/history/route.ts`

- [ ] **Step 1: Create `app/api/generate/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { generateScript } from '@/lib/claude'
import { getRecentRuns } from '@/lib/storage'

export async function POST(req: NextRequest) {
  const { niche, topTopic, avgViews, writingSample } = await req.json()
  const pastScripts = getRecentRuns(niche).map(r => r.script)
  const script = await generateScript({ niche, topTopic, avgViews, writingSample, pastScripts })
  return NextResponse.json({ script })
}
```

- [ ] **Step 2: Create `app/api/hooks/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { generateHooks } from '@/lib/claude'
import { getRecentRuns } from '@/lib/storage'

export async function POST(req: NextRequest) {
  const { script, niche } = await req.json()
  const pastHooks = getRecentRuns(niche).flatMap(r => r.hooks.map(h => h.text))
  const hooks = await generateHooks({ script, niche, pastHooks })
  return NextResponse.json({ hooks })
}
```

- [ ] **Step 3: Create `app/api/save/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { saveRun, Run } from '@/lib/storage'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const run: Run = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    niche: body.niche,
    topTopic: body.topTopic,
    topicSignal: body.topicSignal,
    avgViews: body.avgViews,
    avgLikes: body.avgLikes,
    script: body.script,
    hooks: body.hooks,
    recommendedHook: body.recommendedHook,
  }
  saveRun(run)
  return NextResponse.json({ success: true, id: run.id })
}
```

- [ ] **Step 4: Create `app/api/history/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { readResults } from '@/lib/storage'

export async function GET() {
  const store = readResults()
  return NextResponse.json({ runs: store.runs.slice(0, 10) })
}
```

- [ ] **Step 5: Commit**

```bash
git add app/api/
git commit -m "feat: add API routes for generate, hooks, save, and history"
```

---

## Task 7: NicheInput Component

**Files:**
- Create: `components/NicheInput.tsx`

- [ ] **Step 1: Create `components/NicheInput.tsx`**

```tsx
'use client'
import { useState } from 'react'

interface NicheInputProps {
  onSubmit: (niche: string, writingSample: string) => void
  isRunning: boolean
}

export default function NicheInput({ onSubmit, isRunning }: NicheInputProps) {
  const [niche, setNiche] = useState('')
  const [writingSample, setWritingSample] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!niche.trim() || !writingSample.trim()) return
    onSubmit(niche.trim(), writingSample.trim())
  }

  const inputClass = `
    w-full bg-navy-800 border border-neon-cyan/20 rounded-lg px-4 py-3
    text-white font-mono text-sm focus:outline-none focus:border-neon-cyan/60
    placeholder-gray-600 transition-colors disabled:opacity-50
  `

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-4">
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
            className="
              w-full py-3 px-6 bg-neon-cyan text-navy-900 font-bold font-mono
              uppercase tracking-widest rounded-lg transition-all
              hover:bg-white hover:glow-cyan
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            {isRunning ? '⬡ RUNNING...' : 'RUN PIPELINE →'}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-xs font-mono text-neon-cyan mb-2 uppercase tracking-widest">
          Your Writing Sample <span className="text-gray-500">(paste 1-2 past scripts so AI matches your voice)</span>
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
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/NicheInput.tsx
git commit -m "feat: add NicheInput form component"
```

---

## Task 8: PipelineHeader Component

**Files:**
- Create: `components/PipelineHeader.tsx`

- [ ] **Step 1: Create `components/PipelineHeader.tsx`**

```tsx
'use client'
import { motion } from 'framer-motion'

interface PipelineHeaderProps {
  isRunning: boolean
}

export default function PipelineHeader({ isRunning }: PipelineHeaderProps) {
  return (
    <div className="text-center space-y-3">
      {/* Live pill */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neon-cyan/30 bg-neon-cyan/5">
        <motion.span
          className="w-2 h-2 rounded-full bg-neon-cyan"
          animate={{ opacity: isRunning ? [1, 0.3, 1] : 1 }}
          transition={{ duration: 1.2, repeat: isRunning ? Infinity : 0 }}
        />
        <span className="text-xs font-mono text-neon-cyan tracking-widest uppercase">
          AI Agent Pipeline · {isRunning ? 'Running' : 'Ready'}
        </span>
      </div>

      {/* Main title */}
      <h1 className="text-5xl font-bold tracking-tight">
        4-Agent{' '}
        <span className="text-neon-cyan">Content</span>{' '}
        System
      </h1>

      {/* Subtitle */}
      <p className="text-gray-400 font-mono text-sm tracking-wider">
        Scrape → Validate → Write → Hook — fully automated
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/PipelineHeader.tsx
git commit -m "feat: add PipelineHeader component"
```

---

## Task 9: AgentCard Base Component

**Files:**
- Create: `components/AgentCard.tsx`

- [ ] **Step 1: Create `components/AgentCard.tsx`**

```tsx
'use client'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

export type AgentStatus = 'idle' | 'running' | 'done'

interface AgentCardProps {
  number: number
  name: string
  title: string
  status: AgentStatus
  children?: ReactNode
}

const AGENT_COLORS = {
  1: { border: 'border-neon-cyan',   glow: 'glow-cyan',   text: 'text-neon-cyan',   bg: 'bg-neon-cyan/10'   },
  2: { border: 'border-neon-green',  glow: 'glow-green',  text: 'text-neon-green',  bg: 'bg-neon-green/10'  },
  3: { border: 'border-neon-orange', glow: 'glow-orange', text: 'text-neon-orange', bg: 'bg-neon-orange/10' },
  4: { border: 'border-neon-pink',   glow: 'glow-pink',   text: 'text-neon-pink',   bg: 'bg-neon-pink/10'   },
} as const

const STATUS_BADGE = {
  idle:    { label: 'WAITING',  color: 'text-gray-500  border-gray-600'  },
  running: { label: 'RUNNING',  color: 'text-neon-cyan border-neon-cyan' },
  done:    { label: 'DONE ✓',   color: 'text-neon-green border-neon-green' },
}

export default function AgentCard({ number, name, title, status, children }: AgentCardProps) {
  const colors = AGENT_COLORS[number as keyof typeof AGENT_COLORS]
  const badge  = STATUS_BADGE[status]
  const isActive = status === 'running'

  return (
    <motion.div
      className={`
        relative rounded-xl border bg-navy-800/60 backdrop-blur-sm p-4
        transition-all duration-500 overflow-hidden
        ${status === 'idle' ? 'border-gray-800' : colors.border}
        ${status === 'running' ? colors.glow : ''}
      `}
      animate={isActive ? { borderOpacity: [0.4, 1, 0.4] } : {}}
      transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
    >
      {/* Top accent line */}
      <motion.div
        className={`absolute top-0 left-0 right-0 h-0.5 ${isActive ? colors.bg : 'bg-gray-800'}`}
        animate={isActive ? { opacity: [0.5, 1, 0.5] } : {}}
        transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className={`text-xs font-mono tracking-widest uppercase ${status === 'idle' ? 'text-gray-600' : colors.text}`}>
            Agent 0{number} · {name}
          </p>
          <p className="text-sm font-bold text-white mt-0.5">{title}</p>
        </div>
        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      {/* Content slot */}
      <div className={`transition-opacity duration-300 ${status === 'idle' ? 'opacity-30' : 'opacity-100'}`}>
        {children}
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/AgentCard.tsx
git commit -m "feat: add reusable AgentCard component with idle/running/done states"
```

---

## Task 10: Agent01Scraper Component

**Files:**
- Create: `components/Agent01Scraper.tsx`

- [ ] **Step 1: Create `components/Agent01Scraper.tsx`**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
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
    if (!active || target === 0) return
    const duration = 6000
    const steps = 60
    const increment = target / steps
    let current = 0
    const interval = setInterval(() => {
      current = Math.min(current + increment, target)
      setValue(Math.floor(current))
      if (current >= target) clearInterval(interval)
    }, duration / steps)
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

  return (
    <div className="space-y-3">
      {/* Platform counters grid */}
      <div className="grid grid-cols-2 gap-2">
        {PLATFORM_CONFIG.map(p => (
          <div key={p.key} className="text-center">
            <div className={`w-10 h-10 mx-auto rounded-full border-2 ${p.ring} flex items-center justify-center mb-1`}>
              <span className="text-xs">●</span>
            </div>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">{p.label}</p>
            <p className={`text-lg font-bold font-mono ${p.color}`}>
              <AnimatedCounter target={counts[p.key]} active={active} />
            </p>
          </div>
        ))}
      </div>

      {/* Scrolling post cards */}
      {active && (
        <div className="overflow-hidden h-20 rounded-lg border border-gray-800">
          <div className="animate-scroll-up">
            {[...posts, ...posts].map((post, i) => (
              <div key={i} className="px-3 py-2 border-b border-gray-800/50">
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
        <span>7 Days Lookback</span>
        <span className={active ? 'text-neon-cyan animate-pulse-glow' : ''}>
          {active ? 'FETCHING' : status === 'done' ? formatNumber(Object.values(counts).reduce((a, b) => a + b, 0)) + ' posts' : '—'}
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/Agent01Scraper.tsx
git commit -m "feat: add Agent01Scraper with animated platform counters"
```

---

## Task 11: Agent02Validator Component

**Files:**
- Create: `components/Agent02Validator.tsx`

- [ ] **Step 1: Create `components/Agent02Validator.tsx`**

```tsx
'use client'
import { motion } from 'framer-motion'
import { AgentStatus } from './AgentCard'
import { MockTopic, formatNumber } from '@/lib/mockData'

interface Agent02ValidatorProps {
  status: AgentStatus
  topics?: MockTopic[]
}

const SIGNAL_STYLES = {
  VIRAL: 'text-neon-cyan  border-neon-cyan  bg-neon-cyan/10',
  HOT:   'text-neon-orange border-neon-orange bg-neon-orange/10',
  LOW:   'text-gray-500   border-gray-600   bg-gray-800/50',
}

const THRESHOLDS = [
  { label: 'Avg Views',    key: 'avgViews'    as const, min: 60000  },
  { label: 'Avg Likes',    key: 'avgLikes'    as const, min: 5000   },
  { label: 'Comments',     key: 'avgComments' as const, min: 500    },
  { label: 'Post Volume',  key: 'postCount'   as const, min: 5      },
]

export default function Agent02Validator({ status, topics }: Agent02ValidatorProps) {
  const active = status === 'running' || status === 'done'
  const topTopic = topics?.[0]

  return (
    <div className="space-y-2">
      {/* Topic list */}
      <div className="space-y-1">
        {(topics ?? Array(4).fill(null)).slice(0, 4).map((topic: MockTopic | null, i) => (
          <motion.div
            key={i}
            className="flex items-center justify-between py-1 border-b border-gray-800/50"
            initial={{ opacity: 0, x: -10 }}
            animate={active && topic ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: i * 0.4 }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{topic?.name ?? '—'}</p>
              <p className="text-xs font-mono text-gray-500">
                {topic ? formatNumber(topic.avgViews) + ' avg views' : ''}
              </p>
            </div>
            {topic && (
              <span className={`text-xs font-mono px-2 py-0.5 rounded border ml-2 shrink-0 ${SIGNAL_STYLES[topic.signal]}`}>
                {topic.signal}
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Threshold checklist for top topic */}
      {topTopic && (
        <div className="mt-2 space-y-1">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Thresholds</p>
          {THRESHOLDS.map(t => {
            const value = topTopic[t.key]
            const passing = value >= t.min
            return (
              <div key={t.key} className="flex justify-between text-xs font-mono">
                <span className="text-gray-400">{t.label}</span>
                <span className={passing ? 'text-neon-green' : 'text-gray-600'}>
                  ≥ {formatNumber(t.min)} {passing ? '✓' : '✗'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/Agent02Validator.tsx
git commit -m "feat: add Agent02Validator with topic list and threshold checklist"
```

---

## Task 12: Agent03Writer Component

**Files:**
- Create: `components/Agent03Writer.tsx`

- [ ] **Step 1: Create `components/Agent03Writer.tsx`**

```tsx
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
      setDisplayed(script.slice(0, i))
      i += 3
      if (i > script.length) { setDisplayed(script); clearInterval(interval) }
    }, 16)
    return () => clearInterval(interval)
  }, [script])

  const handleCopy = () => {
    if (!script) return
    navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-2">
      {status === 'idle' && (
        <div className="h-24 flex items-center justify-center">
          <p className="text-xs font-mono text-gray-600">Waiting for viral topic...</p>
        </div>
      )}

      {status === 'running' && !script && (
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
      )}

      {displayed && (
        <>
          <div className="h-28 overflow-y-auto rounded-lg bg-navy-900/60 border border-gray-800 p-2">
            <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">
              {displayed}
              {status === 'running' && <span className="animate-pulse-glow text-neon-orange">▋</span>}
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
        </>
      )}

      <div className="flex justify-between text-xs font-mono text-gray-600">
        <span>your_voice · viral_fmt</span>
        {status === 'done' && <span className="text-neon-orange">✓ ready</span>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/Agent03Writer.tsx
git commit -m "feat: add Agent03Writer with typewriter script output"
```

---

## Task 13: Agent04HookGen Component

**Files:**
- Create: `components/Agent04HookGen.tsx`

- [ ] **Step 1: Create `components/Agent04HookGen.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { AgentStatus } from './AgentCard'

interface Hook {
  text: string
  pattern: string
  estimatedViews: string
}

interface Agent04HookGenProps {
  status: AgentStatus
  hooks?: Hook[]
  recommendedHook?: number
}

const HOOK_COLORS = [
  'border-l-neon-cyan',
  'border-l-neon-green',
  'border-l-blue-400',
  'border-l-neon-pink',
  'border-l-yellow-400',
]

export default function Agent04HookGen({ status, hooks, recommendedHook = 0 }: Agent04HookGenProps) {
  const [copied, setCopied] = useState<number | null>(null)

  const handleCopy = (text: string, i: number) => {
    navigator.clipboard.writeText(text)
    setCopied(i)
    setTimeout(() => setCopied(null), 2000)
  }

  if (status === 'idle') {
    return (
      <div className="h-24 flex items-center justify-center">
        <p className="text-xs font-mono text-gray-600">Waiting for script...</p>
      </div>
    )
  }

  if (status === 'running' && !hooks) {
    return (
      <div className="h-24 flex items-center justify-center gap-2">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-neon-pink animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <p className="text-xs font-mono text-neon-pink">Generating hooks...</p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {(hooks ?? []).map((hook, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.2 }}
          className={`border-l-2 ${HOOK_COLORS[i]} pl-2 py-1 cursor-pointer hover:bg-white/5 rounded-r transition-colors`}
          onClick={() => handleCopy(hook.text, i)}
        >
          <div className="flex items-start justify-between gap-1">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                HOOK 0{i + 1}{i === recommendedHook ? ' · RECOMMENDED' : ''}
              </p>
              <p className="text-xs text-white mt-0.5 leading-relaxed line-clamp-2">"{hook.text}"</p>
              <p className="text-xs font-mono text-gray-600 mt-0.5">
                {hook.pattern} · {hook.estimatedViews} views match
              </p>
            </div>
            {copied === i && (
              <span className="text-xs text-neon-green font-mono shrink-0">✓</span>
            )}
          </div>
        </motion.div>
      ))}

      {status === 'done' && (
        <p className="text-xs font-mono text-gray-600 text-center pt-1">
          Click any hook to copy
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/Agent04HookGen.tsx
git commit -m "feat: add Agent04HookGen with 5 hook variations and copy-on-click"
```

---

## Task 14: HistoryPanel Component

**Files:**
- Create: `components/HistoryPanel.tsx`

- [ ] **Step 1: Create `components/HistoryPanel.tsx`**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { Run } from '@/lib/storage'
import { formatNumber } from '@/lib/mockData'

interface HistoryPanelProps {
  refreshTrigger: boolean
}

export default function HistoryPanel({ refreshTrigger }: HistoryPanelProps) {
  const [runs, setRuns] = useState<Run[]>([])

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(data => setRuns(data.runs ?? []))
      .catch(() => {})
  }, [refreshTrigger])

  if (runs.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">
        Past Runs
      </h2>
      <div className="grid grid-cols-5 gap-3">
        {runs.slice(0, 5).map(run => (
          <div
            key={run.id}
            className="rounded-lg border border-gray-800 bg-navy-800/40 p-3 space-y-1"
          >
            <p className="text-xs font-mono text-neon-cyan truncate">{run.niche}</p>
            <p className="text-xs text-white truncate">{run.topTopic}</p>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-mono px-1.5 rounded border ${
                run.topicSignal === 'VIRAL'
                  ? 'text-neon-cyan border-neon-cyan/40'
                  : run.topicSignal === 'HOT'
                  ? 'text-neon-orange border-neon-orange/40'
                  : 'text-gray-500 border-gray-700'
              }`}>
                {run.topicSignal}
              </span>
              <span className="text-xs font-mono text-gray-500">
                {formatNumber(run.avgViews)} views
              </span>
            </div>
            <p className="text-xs font-mono text-gray-600">
              {new Date(run.timestamp).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/HistoryPanel.tsx
git commit -m "feat: add HistoryPanel showing last 5 runs"
```

---

## Task 15: Main Page Orchestration

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx` with pipeline orchestration**

```tsx
'use client'
import { useState } from 'react'
import NicheInput from '@/components/NicheInput'
import PipelineHeader from '@/components/PipelineHeader'
import AgentCard, { AgentStatus } from '@/components/AgentCard'
import Agent01Scraper from '@/components/Agent01Scraper'
import Agent02Validator from '@/components/Agent02Validator'
import Agent03Writer from '@/components/Agent03Writer'
import Agent04HookGen from '@/components/Agent04HookGen'
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
}

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

export default function Home() {
  const [isRunning, setIsRunning]       = useState(false)
  const [niche, setNiche]               = useState('')
  const [historyKey, setHistoryKey]     = useState(0)
  const [results, setResults]           = useState<Partial<PipelineResults>>({})

  const [a1Status, setA1Status] = useState<AgentStatus>('idle')
  const [a2Status, setA2Status] = useState<AgentStatus>('idle')
  const [a3Status, setA3Status] = useState<AgentStatus>('idle')
  const [a4Status, setA4Status] = useState<AgentStatus>('idle')

  const runPipeline = async (inputNiche: string, writingSample: string) => {
    setNiche(inputNiche)
    setIsRunning(true)
    setResults({})
    setA1Status('idle'); setA2Status('idle'); setA3Status('idle'); setA4Status('idle')

    // Agent 01 — mock scraping (8s)
    setA1Status('running')
    const platformCounts = generatePlatformCounts(inputNiche)
    setResults(prev => ({ ...prev, platformCounts }))
    await sleep(8000)
    setA1Status('done')

    // Agent 02 — mock validation (5s)
    setA2Status('running')
    const topics = generateMockTopics(inputNiche)
    setResults(prev => ({ ...prev, topics }))
    await sleep(5000)
    setA2Status('done')

    const topTopic = topics[0]

    // Agent 03 — real Claude script generation
    setA3Status('running')
    const genRes = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        niche: inputNiche,
        topTopic: topTopic.name,
        avgViews: topTopic.avgViews,
        writingSample,
      }),
    })
    const { script } = await genRes.json()
    setResults(prev => ({ ...prev, script }))
    setA3Status('done')

    // Agent 04 — real Claude hook generation
    setA4Status('running')
    const hookRes = await fetch('/api/hooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script, niche: inputNiche }),
    })
    const { hooks } = await hookRes.json()
    setResults(prev => ({ ...prev, hooks }))
    setA4Status('done')

    // Save run to results.json
    await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        niche: inputNiche,
        topTopic: topTopic.name,
        topicSignal: topTopic.signal,
        avgViews: topTopic.avgViews,
        avgLikes: topTopic.avgLikes,
        script,
        hooks,
        recommendedHook: 0,
      }),
    })

    setHistoryKey(k => k + 1)
    setIsRunning(false)
  }

  return (
    <main className="min-h-screen bg-navy-900 text-white overflow-x-hidden">
      {/* Grid background */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <PipelineHeader isRunning={isRunning} />

        {/* Input form */}
        <NicheInput onSubmit={runPipeline} isRunning={isRunning} />

        {/* 4 Agent Cards */}
        <div className="grid grid-cols-4 gap-4">
          <AgentCard number={1} name="SCRAPER" title="Content Intelligence" status={a1Status}>
            <Agent01Scraper
              status={a1Status}
              platformCounts={results.platformCounts}
              niche={niche}
            />
          </AgentCard>

          <AgentCard number={2} name="VALIDATOR" title="Viral Intelligence" status={a2Status}>
            <Agent02Validator status={a2Status} topics={results.topics} />
          </AgentCard>

          <AgentCard number={3} name="WRITER" title="Script Generator" status={a3Status}>
            <Agent03Writer status={a3Status} script={results.script} />
          </AgentCard>

          <AgentCard number={4} name="HOOK GEN" title="Hook Variations" status={a4Status}>
            <Agent04HookGen
              status={a4Status}
              hooks={results.hooks}
              recommendedHook={0}
            />
          </AgentCard>
        </div>

        {/* History */}
        <HistoryPanel refreshTrigger={historyKey % 2 === 0} />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Run the dev server and do a full end-to-end test**

```bash
npm run dev
```

Open `http://localhost:3000`. Verify:
1. Dark navy background with grid pattern loads
2. "4-Agent Content System" header renders
3. Form accepts niche + writing sample input
4. Clicking "RUN PIPELINE →" triggers all 4 agents sequentially
5. Agent 01 shows animated counters for 8 seconds
6. Agent 02 shows topics with VIRAL/HOT/LOW badges
7. Agent 03 shows typewriter script output (real Claude)
8. Agent 04 shows 5 hook variations (real Claude)
9. Results panel shows after completion
10. `data/results.json` has a new entry after the run

- [ ] **Step 3: Run all tests**

```bash
npx jest
```

Expected: All tests passing.

- [ ] **Step 4: Final commit**

```bash
git add app/page.tsx
git commit -m "feat: wire main page pipeline orchestration — full 4-agent system complete"
```

---

## Self-Review Checklist

- [x] **Spec coverage:**
  - Agent 01 Scraper (mock, animated): Task 10 ✓
  - Agent 02 Validator (mock scoring, thresholds): Task 11 ✓
  - Agent 03 Writer (real Claude, typewriter): Task 12 ✓
  - Agent 04 Hook Gen (real Claude, 5 hooks, recommended): Task 13 ✓
  - JSON persistence + history loop: Tasks 3, 6, 14 ✓
  - Configurable niche: NicheInput Task 7 ✓
  - Dark cyberpunk UI with neon accents: Task 2 ✓
  - Animated agent states (idle/running/done): Task 9 ✓
  - History panel (last 5 runs): Task 14 ✓

- [x] **Placeholder scan:** No TBDs, no TODOs, no "similar to above" — all code is complete.

- [x] **Type consistency:**
  - `AgentStatus` defined in `AgentCard.tsx`, imported by all agent components ✓
  - `Run`, `Hook` defined in `storage.ts`, used consistently in API routes ✓
  - `MockTopic`, `PlatformCounts` defined in `mockData.ts`, imported by `page.tsx` and agent components ✓
  - `generateScript` / `generateHooks` signatures in `claude.ts` match usage in API routes ✓
