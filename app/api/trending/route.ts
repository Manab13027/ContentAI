import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export interface TrendingTopic {
  id: string
  source: 'youtube' | 'reddit'
  title: string
  viewCount: number | null
  score: number | null
  url: string
  thumbnail: string | null
  description: string
  channelOrSubreddit: string
  publishedAt: string
}

async function fetchYouTubeTrending(niche: string, refreshToken: string): Promise<TrendingTopic[]> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET
  )
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client })

  // Last 14 days, sorted by view count
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const searchRes = await youtube.search.list({
    part: ['snippet', 'id'],
    q: niche,
    type: ['video'],
    order: 'viewCount',
    publishedAfter: since,
    maxResults: 10,
    regionCode: 'US',
    relevanceLanguage: 'en',
  })

  const videoIds = (searchRes.data.items ?? [])
    .map(i => i.id?.videoId)
    .filter((id): id is string => !!id)

  if (!videoIds.length) return []

  const statsRes = await youtube.videos.list({
    part: ['snippet', 'statistics'],
    id: videoIds,
  })

  return (statsRes.data.items ?? []).map(v => ({
    id:                v.id ?? '',
    source:            'youtube' as const,
    title:             v.snippet?.title ?? '',
    viewCount:         parseInt(v.statistics?.viewCount ?? '0'),
    score:             null,
    url:               `https://www.youtube.com/watch?v=${v.id}`,
    thumbnail:         v.snippet?.thumbnails?.medium?.url ?? null,
    description:       (v.snippet?.description ?? '').slice(0, 200),
    channelOrSubreddit: v.snippet?.channelTitle ?? '',
    publishedAt:       v.snippet?.publishedAt ?? '',
  }))
}

async function fetchRedditTrending(niche: string): Promise<TrendingTopic[]> {
  const res = await fetch(
    `https://www.reddit.com/search.json?q=${encodeURIComponent(niche)}&sort=top&t=week&limit=10&type=link`,
    { headers: { 'User-Agent': 'ContentAI/1.0 (content automation tool)' } }
  )
  if (!res.ok) return []

  const data = await res.json() as {
    data?: {
      children?: Array<{
        data: {
          id: string; title: string; score: number; num_comments: number
          permalink: string; subreddit: string; selftext?: string
          thumbnail?: string; created_utc: number
        }
      }>
    }
  }

  return (data.data?.children ?? [])
    .filter(p => p.data.score > 50)
    .map(p => ({
      id:                p.data.id,
      source:            'reddit' as const,
      title:             p.data.title,
      viewCount:         null,
      score:             p.data.score,
      url:               `https://reddit.com${p.data.permalink}`,
      thumbnail:         p.data.thumbnail?.startsWith('https') ? p.data.thumbnail : null,
      description:       (p.data.selftext ?? '').slice(0, 200),
      channelOrSubreddit: `r/${p.data.subreddit}`,
      publishedAt:       new Date(p.data.created_utc * 1000).toISOString(),
    }))
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const niche        = searchParams.get('niche')
  const refreshToken = searchParams.get('refreshToken')

  if (!niche) return NextResponse.json({ error: 'niche required' }, { status: 400 })

  const [ytResult, redditResult] = await Promise.allSettled([
    refreshToken ? fetchYouTubeTrending(niche, refreshToken) : Promise.resolve([]),
    fetchRedditTrending(niche),
  ])

  const ytTopics     = ytResult.status     === 'fulfilled' ? ytResult.value     : []
  const redditTopics = redditResult.status === 'fulfilled' ? redditResult.value : []

  // Interleave YouTube + Reddit, sort by metric descending
  const topics: TrendingTopic[] = [...ytTopics, ...redditTopics].sort(
    (a, b) => (b.viewCount ?? b.score ?? 0) - (a.viewCount ?? a.score ?? 0)
  )

  return NextResponse.json({ topics })
}
