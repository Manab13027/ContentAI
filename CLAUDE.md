# ContentAI — Codebase Map

> Auto-loaded by Claude Code at session start. Gives full project context without reading individual files.
> **Keep this file updated** whenever significant changes are made.

---

## What This App Does

7-agent AI pipeline that turns a niche into a published YouTube Short:
1. Scrape viral content (mock) → 2. Validate topics (mock) → 3. Write script (Claude API) →
4. Generate hooks (Claude API) → 5. Record voiceover (macOS `say`) → 6. Assemble video (Pexels + FFmpeg) → 7. Post to YouTube (Data API v3)

Local Next.js app. No cloud deploy. Runs on `http://localhost:3000`.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16.2.3, App Router, TypeScript |
| Styling | Tailwind CSS v4 (`@theme {}` in globals.css — no tailwind.config.ts) |
| Animation | Framer Motion 12 |
| AI | Anthropic SDK (`claude-sonnet-4-6`) |
| TTS | macOS `say` command → AIFF → FFmpeg → MP3 |
| Video | Pexels API (stock clips) + FFmpeg 8.1 (assembly) |
| YouTube | googleapis (`youtube.videos.insert`) + OAuth 2.0 |
| Storage | `data/results.json` (gitignored), YouTube token in localStorage |
| Auth state | `/tmp/yt_auth_<state>.json` (temp files via `lib/authStore.ts`) |

---

## Environment Variables (`.env.local`)

```
ANTHROPIC_API_KEY=...
ELEVENLABS_API_KEY=...        # unused — kept for reference, TTS switched to macOS say
PEXELS_API_KEY=...
YOUTUBE_CLIENT_ID=...         # from Google Cloud project contentai-493114
YOUTUBE_CLIENT_SECRET=...
```

YouTube OAuth is **not** file-token based. `refreshToken` is stored in browser `localStorage` as `yt_account: { channelName, refreshToken }` and passed to the API on each upload call.

---

## File Structure

```
app/
  page.tsx                      # Main orchestrator — all pipeline state lives here
  layout.tsx
  globals.css                   # Tailwind v4 @theme block, neon color tokens, grid pattern
  api/
    generate/route.ts           # POST — Claude script generation
    hooks/route.ts              # POST — Claude hook generation (5 variations)
    save/route.ts               # POST — saves run to data/results.json
    history/route.ts            # GET  — returns last 10 runs
    voice/route.ts              # POST — calls lib/elevenlabs.ts (macOS say)
    video/route.ts              # POST — Pexels search + FFmpeg assembly
    video/[runId]/route.ts      # GET  — streams MP4 for browser playback (range requests)
    voices/route.ts             # GET  — parses `say -v ?`, returns English voice list
    youtube/route.ts            # POST — uploads MP4 via refreshToken
    youtube/authurl/route.ts    # POST — generates OAuth URL + state token
    youtube/callback/route.ts   # GET  — receives OAuth code, saves result to authStore
    youtube/poll/route.ts       # GET  — polls authStore for OAuth result
    youtube/auth/route.ts       # GET  — legacy: checks file-based token (may be unused)

components/
  NicheInput.tsx                # Form: niche, writing sample, voice style, length, shorts toggle
  AgentCard.tsx                 # Wrapper card — colors for agents 1-7, opacity logic
  PipelineHeader.tsx
  HistoryPanel.tsx              # Past runs grid — clickable → RunDetail drawer with video preview
  Agent01Scraper.tsx            # Mock scraping animation (platform counters, scrolling posts)
  Agent02Validator.tsx          # Mock topic validation (staggered reveal, VIRAL/HOT/LOW badges)
  Agent03Writer.tsx             # Typewriter effect for script
  Agent04HookGen.tsx            # 5 hook cards, click-to-copy
  Agent05VoiceGen.tsx           # Waveform animation
  Agent06VideoAssembler.tsx     # Step list animation + ▶ Preview Video modal
  Agent07YouTubePost.tsx        # YouTube status card (no button — connect handled by banner)
  fullscreen/
    Agent01FullScreen.tsx       # Cinematic SVG rings + live post counter
    Agent02FullScreen.tsx       # Topic sidebar + metric bars
    Agent03FullScreen.tsx       # Full-screen typewriter + timer
    Agent04FullScreen.tsx       # Full-screen hook cards + recommended footer
    Agent05FullScreen.tsx       # Animated waveform bars + word count + elapsed timer
    Agent06FullScreen.tsx       # Step-by-step progress with checkmarks + elapsed timer
    Agent07FullScreen.tsx       # YouTube logo + upload progress bar + URL on done

lib/
  claude.ts                     # generateScript() + generateHooks() — claude-sonnet-4-6
  storage.ts                    # readResults / saveRun / getRecentRuns — data/results.json
  mockData.ts                   # Deterministic seeded mock: generatePlatformCounts / generateMockTopics
  elevenlabs.ts                 # generateVoiceover() — uses macOS `say`, converts AIFF→MP3 via FFmpeg
  pexels.ts                     # searchAndDownloadClips() — portrait video search + download
  ffmpeg.ts                     # assembleVideo() — scale/crop clips, concat, mix audio, optional -t cap
  youtube.ts                    # uploadToYouTube() + uploadWithRefreshToken() + getChannelName()
  authStore.ts                  # File-based OAuth state store (/tmp/yt_auth_<state>.json)
```

---

## Key Data Types

```typescript
// lib/storage.ts
interface Run {
  id: string; timestamp: string; niche: string; topTopic: string
  topicSignal: 'VIRAL' | 'HOT' | 'LOW'; avgViews: number; avgLikes: number
  script: string; hooks: Hook[]; recommendedHook: number
  audioPath?: string; videoPath?: string; youtubeUrl?: string
}

// components/AgentCard.tsx
type AgentStatus = 'idle' | 'running' | 'done'

// components/NicheInput.tsx
interface PipelineOptions {
  targetLength: '30s' | '60s' | '90s' | '3min'
  shortsOnly: boolean   // caps FFmpeg output at 60s
  voice: string         // voice style key: bold | storyteller | educational | confident | warm | hype
}

// lib/authStore.ts
interface AuthResult {
  status: 'pending' | 'success' | 'error'
  refreshToken?: string; channelName?: string; channelId?: string; error?: string
}
```

---

## Pipeline Data Flow (`app/page.tsx`)

```
runPipeline(niche, writingSample, options)
  │
  ├─ Agent 01 (8s mock) ──── generatePlatformCounts(niche) → platformCounts
  ├─ Agent 02 (5s mock) ──── generateMockTopics(niche) → topics[], topTopicData
  │
  ├─ Agent 03 (real) ─────── POST /api/generate → script
  │     └─ claude.ts: generateScript({ niche, topTopic, avgViews, writingSample, pastScripts, targetLength })
  │
  ├─ Agent 04 (real) ─────── POST /api/hooks → hooks[5]
  │     └─ claude.ts: generateHooks({ script, niche, pastHooks })
  │
  ├─ Agent 05 (real) ─────── POST /api/voice → audioPath
  │     └─ elevenlabs.ts: say -v {voice} → data/audio/{runId}.mp3
  │
  ├─ Agent 06 (real) ─────── POST /api/video → videoPath
  │     ├─ pexels.ts: search + download 5 portrait clips → data/tmp/{runId}/
  │     └─ ffmpeg.ts: scale→concat→mix audio → data/videos/{runId}.mp4
  │
  ├─ Agent 07 (real) ─────── POST /api/youtube (with refreshToken from localStorage)
  │     └─ youtube.ts: uploadWithRefreshToken() → youtubeUrl
  │
  └─ POST /api/save ─────── persists full run to data/results.json
```

**Error handling:** Agent 05 and 06 check for `{ error }` in response — pipeline stops and shows red banner if either fails. Agent 07 is skipped gracefully if `ytAccount` is null.

---

## YouTube OAuth Flow

```
User clicks "Connect YouTube →" (banner between row 1 and row 2)
  │
  ├─ POST /api/youtube/authurl  ← sends origin, gets { url, state }
  ├─ window.open(url)           ← Google OAuth consent screen
  ├─ setInterval poll /api/youtube/poll?state=...  every 2s
  │
  │   [In popup] GET /api/youtube/callback?code=...&state=...
  │     ├─ exchanges code for tokens
  │     ├─ extracts channelName via youtube.channels.list
  │     └─ setResult(state, { status:'success', refreshToken, channelName })
  │
  ├─ poll returns success → localStorage.setItem('yt_account', { refreshToken, channelName })
  └─ popup auto-closes after 1.5s
```

**Token storage:** `refreshToken` lives in `localStorage` — NOT in a server file. Passed to `/api/youtube` on every upload. Survives page refresh. Cleared by "Switch Account" button.

---

## Voice System (`lib/elevenlabs.ts`)

Uses **macOS `say` command** — no ElevenLabs API (free tier was blocked).

```
Style key       → macOS say voice
bold            → Eddy (English (US))   male, energetic
storyteller     → Daniel                male, British
educational     → Reed (English (US))   male, clear
confident       → Samantha              female, crisp US
warm            → Flo (English (US))    female, warm
hype            → Shelley (English (US))female, upbeat
```
ElevenLabs API attempted first if `ELEVENLABS_API_KEY` set; falls back to macOS `say` on error.

`/api/voices/route.ts` — parses `say -v ?` and returns all English voices grouped by accent (American / British / Australian / Indian / Irish).

---

## Video Preview

`GET /api/video/[runId]` — serves `data/videos/{runId}.mp4` as a proper Web ReadableStream with range request support (enables seeking). UUID format validated server-side (no path traversal).

Agent 06 card shows **▶ Preview Video** button when done → modal with `<video>` element.
HistoryPanel RunDetail drawer also embeds the video player for past runs.

---

## CSS / Theming (`app/globals.css`)

Tailwind v4 — **no `tailwind.config.ts`**. All tokens in `@theme {}`:

```css
--color-neon-cyan: #00f5ff    /* Agent 1, focus rings */
--color-neon-green: #00ff88   /* Agent 2, done badges */
--color-neon-orange: #ff6b00  /* Agent 3 */
--color-neon-pink: #ff006e    /* Agent 4 */
--color-neon-purple: #c77dff  /* Agent 5 */
--color-neon-amber: #ffaa00   /* Agent 6 */
--color-neon-red: #ff3333     /* Agent 7 / YouTube */
--color-navy-900: #080b14     /* page background */
--color-navy-800: #0d1120     /* card background */
```

Custom utilities: `.bg-grid-pattern`, `.glow-{cyan|pink|orange|green}`, `.animate-pulse-glow`, `.animate-scroll-up`

---

## AgentCard Color Map

| Agent | Color | Theme |
|---|---|---|
| 1 | neon-cyan | Scraper |
| 2 | neon-green | Validator |
| 3 | neon-orange | Writer |
| 4 | neon-pink | Hook Gen |
| 5 | purple-500 | Voice Gen |
| 6 | amber-500 | Video |
| 7 | red-500 | YouTube |

Idle state: agents 1-4 get `opacity-30`, agents 5-7 stay at full opacity (so YouTube connect status is always visible).

---

## Data Persistence

| Data | Location | Notes |
|---|---|---|
| Run history | `data/results.json` | gitignored, created on first run |
| Audio files | `data/audio/{runId}.mp3` | macOS say output |
| Video clips (temp) | `data/tmp/{runId}/` | Pexels downloads + processed clips |
| Final videos | `data/videos/{runId}.mp4` | Served by `/api/video/[runId]` |
| YouTube token | `localStorage` as `yt_account` | refreshToken + channelName |
| OAuth state | `/tmp/yt_auth_{state}.json` | Cleaned up after poll resolves |

---

## How to Run

```bash
./start.sh        # checks Node 18+, installs deps, starts dev server, opens browser
# OR
npm run dev       # manual start
```

Runs on `http://localhost:3000`. FFmpeg must be installed (`ffmpeg -version` to check).

---

## Known Issues / Watch Points

- **Voice style mapping**: `NicheInput` passes a style key (`bold`, `warm`, etc.) as `options.voice`. Verify `lib/elevenlabs.ts` maps this correctly to a macOS voice name, or that it's passed directly as a `say -v` argument.
- **Fullscreen overlays**: `app/page.tsx` currently does NOT import fullscreen components — they were removed in a refactor. Check if `AnimatePresence` fullscreen overlays are still needed.
- **`/api/youtube/auth` (legacy)**: This old route checks a file-based token. The new flow uses `authurl` + `poll` + `localStorage`. The legacy route may be unused.
- **`data/` directory**: Must exist before first run. `data/results.json` is created automatically. `data/audio/`, `data/videos/`, `data/tmp/` are created on demand.
