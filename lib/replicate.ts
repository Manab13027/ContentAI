import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execFileAsync = promisify(execFile)

// Reliable public face photos — fetched server-side and base64-encoded
// so Replicate never needs to reach external URLs directly
const DEFAULT_PRESENTERS: Record<'male' | 'female', string> = {
  male:   'https://randomuser.me/api/portraits/men/75.jpg',
  female: 'https://randomuser.me/api/portraits/women/75.jpg',
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function ffmpeg(args: string[]): Promise<void> {
  await execFileAsync('ffmpeg', args, { maxBuffer: 100 * 1024 * 1024 })
}

// Trim audio to maxSeconds — keeps SadTalker generation fast + cheap
async function trimAudio(audioPath: string, maxSec: number, tmpDir: string): Promise<string> {
  const out = path.join(tmpDir, 'avatar_audio.mp3')
  await ffmpeg(['-i', audioPath, '-t', String(maxSec), '-c', 'copy', '-y', out])
  return out
}

interface ReplicatePrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string
  error?: string
}

// Fetch any image URL server-side and return as base64 data URI
// Prevents Replicate from hitting CDNs that block external requests
async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ContentAI/1.0)' },
  })
  if (!res.ok) throw new Error(`Image fetch failed ${res.status}: ${url}`)
  const contentType = res.headers.get('content-type') ?? 'image/jpeg'
  const buf = Buffer.from(await res.arrayBuffer())
  return `data:${contentType};base64,${buf.toString('base64')}`
}

// Fetch the latest version hash for cjwbw/sadtalker dynamically
// (avoids hardcoding a version that may become stale)
async function getLatestVersion(): Promise<string> {
  const res = await fetch('https://api.replicate.com/v1/models/cjwbw/sadtalker', {
    headers: { Authorization: `Bearer ${process.env.REPLICATE_API_KEY}` },
  })
  if (!res.ok) throw new Error(`Cannot fetch SadTalker model: ${res.status} ${await res.text()}`)
  const data = await res.json() as { latest_version?: { id: string } }
  const versionId = data.latest_version?.id
  if (!versionId) throw new Error('SadTalker model has no latest_version on Replicate')
  return versionId
}

async function createPrediction(imageUrl: string, audioB64: string): Promise<ReplicatePrediction> {
  const [version, imageB64] = await Promise.all([
    getLatestVersion(),
    fetchImageAsBase64(imageUrl),  // encode server-side — Replicate gets data URI, no external fetch
  ])
  console.log(`[Replicate] Using SadTalker version: ${version.slice(0, 12)}...`)

  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${process.env.REPLICATE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version,
      input: {
        source_image: imageB64,
        driven_audio: audioB64,
        preprocess:   'crop',
        still_mode:   false,
        use_enhancer: true,
        batch_size:   2,
        size:         256,
        pose_style:   0,
        facerender:   'facevid2vid',
        exp_scale:    1.0,
      },
    }),
  })
  if (!res.ok) throw new Error(`Replicate create ${res.status}: ${await res.text()}`)
  return res.json() as Promise<ReplicatePrediction>
}

async function pollPrediction(id: string): Promise<string> {
  for (let i = 0; i < 120; i++) {
    await sleep(4000)
    const res  = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Bearer ${process.env.REPLICATE_API_KEY}` },
    })
    const data = await res.json() as ReplicatePrediction
    if (data.status === 'succeeded' && data.output) return data.output
    if (data.status === 'failed' || data.status === 'canceled') {
      throw new Error(`Replicate SadTalker ${data.status}: ${data.error ?? 'unknown'}`)
    }
    console.log(`[Replicate] Status: ${data.status}...`)
  }
  throw new Error('Replicate SadTalker timed out (8 min)')
}

/**
 * Generates lip-synced AI avatar clips using Replicate + SadTalker.
 * Returns portrait (1080×1920) video segments:
 *   - Segment 0: first 8s (intro)
 *   - Segment 1…N: 5s clips every 20s
 *
 * Audio is trimmed to 25s max → fast generation, ~$0.05 per run.
 */
export async function generateWithReplicate(
  audioPath: string,
  gender: 'male' | 'female',
  runId: string,
  targetDuration: number
): Promise<string[]> {
  const imageUrl  = gender === 'male'
    ? (process.env.DID_MALE_IMAGE_URL   ?? DEFAULT_PRESENTERS.male)
    : (process.env.DID_FEMALE_IMAGE_URL ?? DEFAULT_PRESENTERS.female)

  const avatarDir = path.join(process.cwd(), 'data', 'avatar')
  const tmpDir    = path.join(process.cwd(), 'data', 'tmp', runId)
  fs.mkdirSync(avatarDir, { recursive: true })
  fs.mkdirSync(tmpDir,    { recursive: true })

  // Trim to 25s max — enough for intro + 1 cutaway, keeps cost minimal
  const MAX_AUDIO_SEC = 25
  const trimmedAudio  = await trimAudio(audioPath, MAX_AUDIO_SEC, tmpDir)
  const audioB64      = `data:audio/mpeg;base64,${fs.readFileSync(trimmedAudio).toString('base64')}`

  console.log('[Replicate] Creating SadTalker prediction...')
  const prediction = await createPrediction(imageUrl, audioB64)

  console.log(`[Replicate] Prediction ${prediction.id} — waiting for render...`)
  const resultUrl = await pollPrediction(prediction.id)

  // Download raw avatar video
  const rawPath = path.join(avatarDir, `${runId}_raw.mp4`)
  const vidRes  = await fetch(resultUrl)
  fs.writeFileSync(rawPath, Buffer.from(await vidRes.arrayBuffer()))

  // Convert to 1080×1920 portrait: face in upper area, app navy background below
  const portraitPath = path.join(avatarDir, `${runId}_portrait.mp4`)
  await ffmpeg([
    '-i', rawPath,
    '-vf', [
      'scale=1080:1080:force_original_aspect_ratio=decrease',
      'pad=1080:1920:(ow-iw)/2:60:color=0x080b14',
    ].join(','),
    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium',
    '-pix_fmt', 'yuv420p',
    '-r', '25',
    '-an', '-y', portraitPath,
  ])

  // Extract segments from the portrait video
  const segments: string[] = []
  const clipDur = Math.min(targetDuration, MAX_AUDIO_SEC)

  // Intro — 8s (educational presenter open)
  const introPath = path.join(tmpDir, 'face_intro.mp4')
  await ffmpeg(['-i', portraitPath, '-t', '8', '-c', 'copy', '-y', introPath])
  segments.push(introPath)

  // Mid-section 5s cutaways every 20s
  for (let start = 20; start < clipDur - 8; start += 20) {
    const segPath = path.join(tmpDir, `face_seg_${start}.mp4`)
    await ffmpeg(['-i', portraitPath, '-ss', String(start), '-t', '5', '-c', 'copy', '-y', segPath])
    segments.push(segPath)
  }

  console.log(`[Replicate] ${segments.length} avatar segments ready`)
  return segments
}
