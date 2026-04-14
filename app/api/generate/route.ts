import { NextRequest, NextResponse } from 'next/server'
import { generateScript } from '@/lib/claude'
import { getRecentRuns } from '@/lib/storage'

export async function POST(req: NextRequest) {
  try {
    const { niche, topTopic, avgViews, writingSample, targetLength, voice } = await req.json()
    const pastScripts = getRecentRuns(niche).map(r => r.script)
    const script = await generateScript({ niche, topTopic, avgViews, writingSample, pastScripts, targetLength, voice })
    return NextResponse.json({ script })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
