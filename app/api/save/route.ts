import { NextRequest, NextResponse } from 'next/server'
import { saveRun, Run } from '@/lib/storage'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const run: Run = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    niche: body.niche,
    topTopic: body.topTopic,
    topicSignal: body.topicSignal,
    avgViews: body.avgViews,
    avgLikes: body.avgLikes,
    script: body.script,
    hooks: body.hooks,
    recommendedHook: body.recommendedHook,
  }
  saveRun(run)
  return NextResponse.json({ success: true, id: run.id })
}
