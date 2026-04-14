import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { setResult } from '@/lib/authStore'

export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const error = req.nextUrl.searchParams.get('error')

  const origin      = `${req.nextUrl.protocol}//${req.nextUrl.host}`
  const redirectUri = `${origin}/api/youtube/callback`

  const html = (color: string, msg: string, extra = '') => new NextResponse(
    `<!DOCTYPE html><html><body style="background:#0f172a;color:${color};font-family:monospace;padding:40px;text-align:center;line-height:1.8">
      <p style="font-size:1.1rem">${msg}</p>${extra}
      <p style="color:#94a3b8;margin-top:16px">You can close this window.</p>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )

  if (error || !code || !state) {
    const msg = error === 'access_denied'
      ? 'Authorization cancelled.'
      : 'Authorization failed. Make sure your Gmail is added as a Test User in Google Cloud Console.'

    if (state) setResult(state, { status: 'error', error: msg })
    return html('#ef4444', msg)
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      redirectUri
    )

    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.refresh_token) {
      const msg = 'No refresh token. Go to myaccount.google.com/permissions, revoke ContentAI, then try again.'
      setResult(state, { status: 'error', error: msg })
      return html('#ef4444', msg)
    }

    oauth2Client.setCredentials(tokens)
    const youtube     = google.youtube({ version: 'v3', auth: oauth2Client })
    const channelRes  = await youtube.channels.list({ part: ['snippet'], mine: true })
    const channelName = channelRes.data.items?.[0]?.snippet?.title ?? 'Unknown Channel'
    const channelId   = channelRes.data.items?.[0]?.id ?? ''

    setResult(state, { status: 'success', refreshToken: tokens.refresh_token, channelName, channelId })

    return html('#22c55e',
      `✓ Connected to <strong>${channelName}</strong>`,
      `<script>setTimeout(() => window.close(), 1500)</script>`
    )
  } catch (err) {
    const msg = `Token exchange failed: ${String(err)}`
    setResult(state, { status: 'error', error: msg })
    return html('#ef4444', msg)
  }
}
