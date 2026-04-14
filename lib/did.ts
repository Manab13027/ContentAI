import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execFileAsync = promisify(execFile)
const BASE = 'https://api.d-id.com'

// D-ID's built-in presenter images — no user setup required
// Override with DID_MALE_IMAGE_URL / DID_FEMALE_IMAGE_URL in .env.local
const DEFAULT_PRESENTERS: Record<'male' | 'female', string> = {
  male:   'https://create-images-results.d-id.com/DefaultPresenters/William_m/image.jpeg',
  female: 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.jpeg',
}

function authHeader() {
  return `Basic ${Buffer.from(`${process.env.DID_API_KEY}:`).toString('base64')}`
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function ffmpeg(args: string[]): Promise<void> {
  await execFileAsync('ffmpeg', args, { maxBuffer: 100 * 1024 * 1024 })
}

async function uploadAudio(audioPath: string): Promise<string> {
  const buf  = fs.readFileSync(audioPath)
  const blob = new Blob([buf], { type: 'audio/mpeg' })
  const form = new FormData()
  form.append('audio', blob, 'audio.mp3')

  const res = await fetch(`${BASE}/audios`, {
    method: 'POST',
    headers: { Authorization: authHeader() },
    body: form,
  })
  if (!res.ok) throw new Error(`D-ID audio upload ${res.status}: ${await res.text()}`)
  return ((await res.json()) as { url: string }).url
}

async function createTalk(sourceUrl: string, audioUrl: string): Promise<string> {
  const res = await fetch(`${BASE}/talks`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_url: sourceUrl,
      script: { type: 'audio', audio_url: audioUrl, reduce_noise: false },
      config:  { fluent: true, pad_audio: 0 },
    }),
  })
  if (!res.ok) throw new Error(`D-ID createTalk ${res.status}: ${await res.text()}`)
  return ((await res.json()) as { id: string }).id
}

async function pollUntilDone(talkId: string): Promise<string> {
  for (let i = 0; i < 120; i++) {
    await sleep(3000)
    const res  = await fetch(`${BASE}/talks/${talkId}`, { headers: { Authorization: authHeader() } })
    const data = await res.json() as { status: string; result_url?: string; error?: { description: string } }
    if (data.status === 'done'  && data.result_url) return data.result_url
    if (data.status === 'error') throw new Error(`D-ID error: ${data.error?.description}`)
  }
  throw new Error('D-ID generation timed out (6 min)')
}

/**
 * Generates AI avatar clips from the voiceover audio using D-ID.
 * Returns portrait (1080×1920) video segments for use as face clips:
 *   - Segment 0: first 8s (intro — presenter appears, educational hook)
 *   - Segment 1…N: 5s clips spaced every ~25s (intermittent presenter check-ins)
 * Lip sync is real — the avatar is speaking your actual script.
 */
export async function generateAvatarClips(
  audioPath: string,
  gender: 'male' | 'female',
  runId: string,
  targetDuration: number
): Promise<string[]> {
  const sourceUrl = gender === 'male'
    ? (process.env.DID_MALE_IMAGE_URL   ?? DEFAULT_PRESENTERS.male)
    : (process.env.DID_FEMALE_IMAGE_URL ?? DEFAULT_PRESENTERS.female)

  console.log('[D-ID] Uploading audio...')
  const audioUrl = await uploadAudio(audioPath)

  console.log('[D-ID] Creating talk...')
  const talkId = await createTalk(sourceUrl, audioUrl)

  console.log('[D-ID] Waiting for render...')
  const resultUrl = await pollUntilDone(talkId)

  // Download raw avatar video
  const avatarDir = path.join(process.cwd(), 'data', 'avatar')
  const tmpDir    = path.join(process.cwd(), 'data', 'tmp', runId)
  fs.mkdirSync(avatarDir, { recursive: true })
  fs.mkdirSync(tmpDir, { recursive: true })

  const rawPath = path.join(avatarDir, `${runId}_raw.mp4`)
  const vidRes  = await fetch(resultUrl)
  fs.writeFileSync(rawPath, Buffer.from(await vidRes.arrayBuffer()))

  // Convert to 1080×1920 portrait:
  //   - Scale to 1080×1080 (fitting the face)
  //   - Pad to 1080×1920 with the app's navy background colour
  //   - Face sits in the upper area (60px top offset), dark space below
  const portraitPath = path.join(avatarDir, `${runId}_portrait.mp4`)
  await ffmpeg([
    '-i', rawPath,
    '-vf', 'scale=1080:1080:force_original_aspect_ratio=decrease,' +
           'pad=1080:1920:(ow-iw)/2:60:color=0x080b14',
    '-c:v', 'libx264', '-crf', '22', '-preset', 'fast',
    '-an', '-y', portraitPath,
  ])

  const segments: string[] = []

  // Segment 0 — Intro (8s): presenter opens like an educational video
  const introPath = path.join(tmpDir, 'face_intro.mp4')
  await ffmpeg(['-i', portraitPath, '-t', '8', '-c', 'copy', '-y', introPath])
  segments.push(introPath)

  // Subsequent segments — 5s clips every 25s (intermittent presenter check-ins)
  for (let start = 25; start < targetDuration - 8; start += 25) {
    const segPath = path.join(tmpDir, `face_seg_${start}.mp4`)
    await ffmpeg([
      '-i', portraitPath,
      '-ss', String(start), '-t', '5',
      '-c', 'copy', '-y', segPath,
    ])
    segments.push(segPath)
  }

  console.log(`[D-ID] Generated ${segments.length} avatar segments`)
  return segments
}

export function isDIDAvailable(): boolean {
  return !!process.env.DID_API_KEY
}
