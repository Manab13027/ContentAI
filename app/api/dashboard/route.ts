import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { readResults } from '@/lib/storage'

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m?.[1] ?? null
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const refreshToken = searchParams.get('refreshToken')

  let allRuns: ReturnType<typeof readResults>['runs'] = []
  try {
    allRuns = readResults().runs
  } catch (e) {
    return NextResponse.json({ runs: [], error: `Could not read results: ${String(e)}` })
  }

  if (!allRuns.length) {
    return NextResponse.json({ runs: [], error: null })
  }

  const postedRuns  = allRuns.filter(r => r.youtubeUrl)
  const videoIds    = postedRuns
    .map(r => extractVideoId(r.youtubeUrl!))
    .filter((id): id is string => !!id)

  // No token or no posted videos — return all runs without live stats
  if (!refreshToken || !videoIds.length) {
    return NextResponse.json({
      runs: allRuns.map(r => ({
        ...r,
        videoId:   r.youtubeUrl ? (extractVideoId(r.youtubeUrl) ?? null) : null,
        stats:     null,
        countries: [],
      })),
      error: null,
      warnings: !refreshToken && postedRuns.length
        ? ['Connect YouTube on the main page to load live view/like counts']
        : null,
    })
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET
  )
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  // ── YouTube Data API: batch fetch video statistics ────────────────────────
  const statsMap: Record<string, {
    views: number; likes: number; comments: number; title: string; publishedAt: string
  }> = {}
  let statsError: string | null = null

  try {
    const youtube  = google.youtube({ version: 'v3', auth: oauth2Client })
    const statsRes = await youtube.videos.list({
      part: ['statistics', 'snippet'],
      id:   videoIds,
    } as Parameters<typeof youtube.videos.list>[0])
    for (const item of statsRes.data.items ?? []) {
      if (item.id) {
        statsMap[item.id] = {
          title:       item.snippet?.title        ?? '',
          publishedAt: item.snippet?.publishedAt  ?? '',
          views:       parseInt(item.statistics?.viewCount    ?? '0'),
          likes:       parseInt(item.statistics?.likeCount    ?? '0'),
          comments:    parseInt(item.statistics?.commentCount ?? '0'),
        }
      }
    }
  } catch (e) {
    statsError = String(e)
    console.error('[Dashboard] YouTube stats error:', statsError)
  }

  // ── YouTube Analytics API: country breakdown per video ────────────────────
  const countryMap: Record<string, Array<{ country: string; views: number; likes: number }>> = {}
  let analyticsError: string | null = null
  const today = new Date().toISOString().split('T')[0]

  try {
    const analytics = google.youtubeAnalytics({ version: 'v2', auth: oauth2Client })
    await Promise.all(
      videoIds.map(async (videoId) => {
        try {
          const res = await (analytics.reports.query as Function)({
            ids:        'channel==MINE',
            startDate:  '2020-01-01',
            endDate:    today,
            metrics:    'views,likes',
            dimensions: 'country',
            filters:    `video==${videoId}`,
            sort:       '-views',
            maxResults: 10,
          })
          countryMap[videoId] = (res.data?.rows ?? []).map((row: unknown[]) => ({
            country: String(row[0]),
            views:   Number(row[1]),
            likes:   Number(row[2]),
          }))
        } catch (e) {
          console.warn(`[Dashboard] Analytics failed for ${videoId}:`, String(e))
        }
      })
    )
  } catch (e) {
    analyticsError = String(e)
    console.error('[Dashboard] YouTube Analytics error:', analyticsError)
  }

  const runs = allRuns.map(r => {
    const videoId = r.youtubeUrl ? extractVideoId(r.youtubeUrl) : null
    return {
      ...r,
      videoId,
      stats:     videoId ? (statsMap[videoId]   ?? null) : null,
      countries: videoId ? (countryMap[videoId] ?? [])   : [],
    }
  })

  const warnings: string[] = []
  if (statsError)     warnings.push(`Stats API: ${statsError}`)
  if (analyticsError) warnings.push(`Analytics API: ${analyticsError}`)

  return NextResponse.json({ runs, warnings: warnings.length ? warnings : null, error: null })
}
