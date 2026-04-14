import { NextRequest, NextResponse } from 'next/server'
import { generateHooks } from '@/lib/claude'
import { getRecentRuns } from '@/lib/storage'

export async function POST(req: NextRequest) {
  try {
    const { script, niche } = await req.json()
    const pastHooks = getRecentRuns(niche).flatMap(r => r.hooks.map(h => h.text))
    const hooks = await generateHooks({ script, niche, pastHooks })
    return NextResponse.json({ hooks })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
