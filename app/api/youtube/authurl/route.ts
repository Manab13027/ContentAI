import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import crypto from 'crypto'
import { setPending } from '@/lib/authStore'

export async function POST(req: NextRequest) {
  try {
    const { origin } = await req.json() as { origin: string }
    if (!origin) return NextResponse.json({ error: 'origin required' }, { status: 400 })

    const state       = crypto.randomBytes(16).toString('hex')
    const redirectUri = `${origin}/api/youtube/callback`

    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      redirectUri
    )

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/yt-analytics.readonly',
      ],
      prompt: 'consent select_account',
      state,
    })

    setPending(state)

    return NextResponse.json({ url, state, redirectUri })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
