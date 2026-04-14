import { NextResponse } from 'next/server'
import { searchAndDownloadClips } from '@/lib/pexels'
import { assembleVideo, getAudioDuration } from '@/lib/ffmpeg'
import { generateAvatarClips, isAvatarAvailable } from '@/lib/avatar'

const MALE_VOICES   = new Set(['bold', 'storyteller', 'educational', 'indian-male-en', 'indian-male-hi'])
const FEMALE_VOICES = new Set(['confident', 'warm', 'hype', 'indian-female-en', 'indian-female-hi'])

export async function POST(req: Request) {
  const { topic, niche, audioPath, runId, shortsOnly, voice } = (await req.json()) as {
    topic: string; niche: string; audioPath: string
    runId: string; shortsOnly?: boolean; voice?: string
  }
  try {
    const voiceGender: 'male' | 'female' | undefined = voice
      ? MALE_VOICES.has(voice)   ? 'male'
      : FEMALE_VOICES.has(voice) ? 'female'
      : undefined
      : undefined

    const audioDur  = await getAudioDuration(audioPath)
    const maxDur    = shortsOnly ? 60 : undefined
    const targetDur = maxDur ? Math.min(audioDur, maxDur) : audioDur

    // 4 varied queries × 4 clips = up to 16 unique b-roll clips
    const topicWords = topic.split(' ').slice(0, 3).join(' ')
    const queries = [
      `${topicWords} ${niche}`,
      niche,
      topicWords,
      `${niche} lifestyle success`,
    ]

    // Download b-roll + Pexels face clips (face clips used as fallback)
    const { brollPaths, facePaths: pexelsFacePaths } = await searchAndDownloadClips(
      queries, runId, 4, voiceGender
    )

    // Face clips: AI avatar (lip-synced) if service configured, else Pexels
    let facePaths = pexelsFacePaths
    let avatarError: string | undefined
    if (voiceGender && isAvatarAvailable()) {
      try {
        facePaths = await generateAvatarClips(audioPath, voiceGender, runId, targetDur)
      } catch (e) {
        console.error('[Avatar] Failed, using Pexels face clips:', String(e))
        avatarError = String(e)
        facePaths = pexelsFacePaths
      }
    }

    const videoPath = await assembleVideo(brollPaths, facePaths, audioPath, runId, maxDur)
    return NextResponse.json({ videoPath, avatarError })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
