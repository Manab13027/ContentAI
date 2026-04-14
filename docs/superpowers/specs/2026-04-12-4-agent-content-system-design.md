# 4-Agent Content System — Design Spec
**Date:** 2026-04-12  
**Status:** Approved  

---

## 1. Overview

A single-page animated web app that runs a 4-agent AI pipeline to help content creators find viral topics, generate scripts, and produce hook variations — automatically.

**Core loop:**
> User enters niche + writing sample → pipeline scrapes viral content → validates signals → writes script → generates hooks → saves results

---

## 2. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack, API routes, easy deploy |
| Styling | Tailwind CSS + Framer Motion | Dark UI + animations |
| AI | Claude API (`claude-sonnet-4-6`) | Script + hook generation |
| Storage | `data/results.json` (local file) | Persist runs, compare over time |
| Fonts | Space Grotesk + JetBrains Mono | Matches video aesthetic |

---

## 3. Architecture

### Data Flow

```
User Input (niche + writing sample)
         ↓
Agent 01 — Scraper        [mock data, ~8s animated]
  Simulates scraping Instagram, Twitter/X, YouTube, Reddit
  Outputs: ~3,000+ posts with engagement data
         ↓
Agent 02 — Validator      [mock scoring, ~5s animated]
  Scores posts by: views, likes, comments, post volume
  Thresholds: Views ≥60K, Likes ≥5K, Comments ≥500, Posts ≥5
  Outputs: ranked topics with VIRAL / HOT / LOW signals
         ↓
Agent 03 — Writer         [real Claude API, ~10s]
  Input: niche + top viral topic + user writing sample + past run history
  Output: full ready-to-film script in user's voice
         ↓
Agent 04 — Hook Gen       [real Claude API, ~8s]
  Input: script + viral patterns from history
  Output: 5 hook variations (Pain+Solution, Curiosity, Time-saving, etc.)
         ↓
Save to data/results.json
```

### Storage Schema (`data/results.json`)

```json
{
  "runs": [
    {
      "id": "uuid",
      "timestamp": "2026-04-12T10:00:00Z",
      "niche": "AI tools",
      "topTopic": "Prediction Market Bots",
      "topicSignal": "VIRAL",
      "avgViews": 315400,
      "avgLikes": 18300,
      "script": "...",
      "hooks": [
        { "text": "...", "pattern": "Pain + Solution", "estimatedViews": "1.98M" }
      ],
      "recommendedHook": 0
    }
  ]
}
```

---

## 4. File Structure

```
app/
├── page.tsx                        # Main pipeline page (single page)
├── api/
│   ├── generate/route.ts           # Claude: script generation
│   └── hooks/route.ts              # Claude: hook generation
├── components/
│   ├── NicheInput.tsx              # Niche + writing sample form
│   ├── PipelineHeader.tsx          # "AI AGENT PIPELINE · LIVE" top bar
│   ├── AgentCard.tsx               # Reusable: idle / running / done states
│   ├── Agent01Scraper.tsx          # Platform counters + scrolling post cards
│   ├── Agent02Validator.tsx        # Topic list + badges + threshold checklist
│   ├── Agent03Writer.tsx           # Typewriter script output
│   ├── Agent04HookGen.tsx          # 5 hooks with pattern labels + recommended
│   └── HistoryPanel.tsx            # Last 5 runs, compare button
└── lib/
    ├── storage.ts                  # Read/write data/results.json
    ├── mockData.ts                 # Fake scraping data generator
    └── claude.ts                   # Claude API wrapper (streaming)
```

---

## 5. UI Design

### Aesthetic
- **Background:** `#080b14` dark navy with subtle dot grid
- **Neon accents:** cyan `#00f5ff`, pink `#ff006e`, orange `#ff6b00`, green `#00ff88`
- **Fonts:** Space Grotesk (headings/display) + JetBrains Mono (numbers/metrics)
- **Borders:** animated glowing borders on active agent cards
- **Layout:** horizontal 4-agent card row + output panel below

### Agent Card States
- **Idle:** dim border, greyed icon, "WAITING" badge
- **Running:** pulsing neon border, animated icon, "RUNNING" badge
- **Done:** solid neon border, checkmark, metric summary shown

### Key Interactions
| Action | Behavior |
|---|---|
| Click "Run Pipeline" | Agents run sequentially, each animates for its duration |
| Agent 01 running | Platform counters tick up, fake post cards scroll |
| Agent 02 running | Topics appear one-by-one, scoring bars animate, thresholds tick |
| Agent 03 running | Script streams in with typewriter effect |
| Agent 04 running | 5 hooks stream in one by one, recommended badge appears |
| Pipeline complete | Results auto-saved, history panel updates |
| Click past run | Loads that run's output for comparison |

---

## 6. Claude API Prompts

### Agent 03 — Script Generator
```
You are a content script writer. 
Niche: {niche}
Viral topic: {topTopic} ({avgViews} avg views)
User's writing style (from past scripts): {writingSample}
Past scripts generated: {historyScripts}

Write a 60-90 second reel script in the user's exact voice and style.
The script should be based on the viral topic. Do not repeat topics from past scripts.
Format: [HOOK] ... [BODY] ... [CTA]
```

### Agent 04 — Hook Generator
```
You are a viral hook specialist.
Script: {script}
User's top performing hooks (from history): {pastHooks}

Generate 5 hook variations for this script. Each hook must use a different pattern:
1. Pain + Solution
2. Curiosity gap
3. Time-saving claim
4. Contrarian take
5. Personal story

For each hook, label the pattern and estimate views based on historical performance.
Mark the strongest hook as RECOMMENDED.
```

---

## 7. History & Improvement Loop

- Every pipeline run is appended to `data/results.json`
- Agent 03 receives past scripts → avoids repetition, improves style matching
- Agent 04 receives past hooks + their patterns → avoids repeating formats
- History panel shows last 5 runs with niche, top topic, date
- Compare button shows side-by-side hook output across runs

---

## 8. Out of Scope (v1)

- Real social media scraping (no Instagram/Twitter APIs)
- User authentication
- Cloud database
- Scheduling or auto-posting
- Mobile-optimized layout
