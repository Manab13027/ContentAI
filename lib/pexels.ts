import fs from 'fs'
import path from 'path'

interface PexelsVideoFile {
  id: number
  quality: string
  width: number
  height: number
  link: string
}

interface PexelsVideo {
  id: number
  duration: number
  video_files: PexelsVideoFile[]
}

interface PexelsResponse {
  videos: PexelsVideo[]
}

export interface ClipSet {
  brollPaths: string[]
  facePaths: string[]
}

function pickBestFile(files: PexelsVideoFile[]): PexelsVideoFile | null {
  // Prefer HD (1080p+) files. Among those, prefer wider clips (better content).
  // We crop to portrait in FFmpeg so any aspect ratio works.
  const hd = files.filter(f => f.width >= 1080 || f.height >= 1080)
  const pool = hd.length ? hd : files
  // Pick highest resolution available
  return pool.sort((a, b) => (b.width * b.height) - (a.width * a.height))[0] ?? null
}

const MIN_CLIP_BYTES = 300_000 // skip clips smaller than 300 KB — usually blank/corrupt

async function fetchClips(
  query: string,
  count: number,
  tmpDir: string,
  prefix: string
): Promise<string[]> {
  try {
    // No orientation filter — landscape clips are fine, we crop to portrait in FFmpeg
    // size=large for highest quality footage
    const res = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${count * 3}&size=large`,
      { headers: { Authorization: process.env.PEXELS_API_KEY! } }
    )
    if (!res.ok) return []
    const data = (await res.json()) as PexelsResponse
    if (!data.videos?.length) return []

    const paths: string[] = []
    for (const video of data.videos) {
      if (paths.length >= count) break
      if (video.duration < 4) continue   // skip clips shorter than 4 seconds

      const file = pickBestFile(video.video_files)
      if (!file) continue

      const clipRes = await fetch(file.link)
      if (!clipRes.ok) continue

      const buf      = Buffer.from(await clipRes.arrayBuffer())
      if (buf.length < MIN_CLIP_BYTES) continue  // skip near-blank files

      const clipPath = path.join(tmpDir, `${prefix}_${paths.length}.mp4`)
      fs.writeFileSync(clipPath, buf)
      paths.push(clipPath)
    }
    return paths
  } catch {
    return []
  }
}

const FACE_QUERIES: Record<'male' | 'female', string> = {
  male:   'man presenting speaking camera portrait',
  female: 'woman presenting speaking camera portrait',
}

/**
 * Download b-roll clips from multiple search queries for maximum variety.
 * Each query fetches `countPerQuery` clips — total b-roll = queries.length × countPerQuery.
 */
export async function searchAndDownloadClips(
  queries: string[],
  runId: string,
  countPerQuery = 4,
  voiceGender?: 'male' | 'female'
): Promise<ClipSet> {
  const tmpDir = path.join(process.cwd(), 'data', 'tmp', runId)
  fs.mkdirSync(tmpDir, { recursive: true })

  // Fetch b-roll from all queries in parallel for variety
  const brollBatches = await Promise.all(
    queries.map((q, qi) => fetchClips(q, countPerQuery, tmpDir, `broll_q${qi}`))
  )
  const brollPaths = brollBatches.flat()

  // Face clips (Pexels fallback when D-ID not available)
  const facePaths = voiceGender
    ? await fetchClips(FACE_QUERIES[voiceGender], 2, tmpDir, 'face')
    : []

  if (!brollPaths.length && !facePaths.length) {
    throw new Error(`Failed to download any Pexels clips for: ${queries.join(', ')}`)
  }

  return { brollPaths, facePaths }
}
