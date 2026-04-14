import fs from 'fs'
import path from 'path'
import { google } from 'googleapis'

const TOKEN_PATH = path.join(process.cwd(), 'data', 'youtube-token.json')

function getClient() {
  // No redirect URI needed for token refresh / upload operations
  return new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET
  )
}

export function getAuthUrl(): string {
  return getClient().generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.upload'],
    prompt: 'consent',
  })
}

export function hasToken(): boolean {
  return fs.existsSync(TOKEN_PATH)
}

export async function saveToken(code: string): Promise<void> {
  const client = getClient()
  const { tokens } = await client.getToken(code)
  fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true })
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens))
}

export async function uploadToYouTube(
  videoPath: string,
  title: string,
  description: string,
  tags: string[]
): Promise<string> {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error('YouTube not connected. Authorize first via /api/youtube/auth.')
  }

  const client = getClient()
  const storedTokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'))
  client.setCredentials(storedTokens)

  // Persist refreshed tokens automatically
  client.on('tokens', updated => {
    fs.writeFileSync(TOKEN_PATH, JSON.stringify({ ...storedTokens, ...updated }))
  })

  const youtube = google.youtube({ version: 'v3', auth: client })
  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: title.slice(0, 100),
        description,
        tags,
        categoryId: '22', // People & Blogs
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      mimeType: 'video/mp4',
      body: fs.createReadStream(videoPath),
    },
  })

  const videoId = res.data.id
  if (!videoId) throw new Error('YouTube upload returned no video ID')
  return `https://www.youtube.com/watch?v=${videoId}`
}

export async function uploadWithRefreshToken(
  refreshToken: string,
  videoPath: string,
  title: string,
  description: string,
  tags: string[]
): Promise<string> {
  const client = getClient()
  client.setCredentials({ refresh_token: refreshToken })

  const youtube = google.youtube({ version: 'v3', auth: client })
  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: { title: title.slice(0, 100), description, tags, categoryId: '22' },
      status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
    },
    media: { mimeType: 'video/mp4', body: fs.createReadStream(videoPath) },
  })

  const videoId = res.data.id
  if (!videoId) throw new Error('YouTube upload returned no video ID')
  return `https://www.youtube.com/watch?v=${videoId}`
}

export function getChannelName(refreshToken: string): Promise<string> {
  const client = getClient()
  client.setCredentials({ refresh_token: refreshToken })
  const youtube = google.youtube({ version: 'v3', auth: client })
  return youtube.channels.list({ part: ['snippet'], mine: true })
    .then(r => r.data.items?.[0]?.snippet?.title ?? 'YouTube Channel')
}
