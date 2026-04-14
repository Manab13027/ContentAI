import { NextResponse } from 'next/server'
import { uploadToYouTube, uploadWithRefreshToken } from '@/lib/youtube'

export async function POST(req: Request) {
  const { videoPath, title, description, tags, refreshToken } = (await req.json()) as {
    videoPath: string
    title: string
    description: string
    tags: string[]
    refreshToken?: string
  }
  try {
    const youtubeUrl = refreshToken
      ? await uploadWithRefreshToken(refreshToken, videoPath, title, description, tags)
      : await uploadToYouTube(videoPath, title, description, tags)
    return NextResponse.json({ youtubeUrl })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
