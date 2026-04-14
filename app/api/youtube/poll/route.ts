import { NextRequest, NextResponse } from 'next/server'
import { getResult, clearResult } from '@/lib/authStore'

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get('state')
  if (!state) return NextResponse.json({ status: 'error', error: 'state required' })

  const result = getResult(state)
  if (!result) return NextResponse.json({ status: 'not_found' })
  if (result.status === 'pending') return NextResponse.json({ status: 'pending' })

  // Done — return and clean up
  clearResult(state)
  return NextResponse.json(result)
}
