import { NextResponse } from 'next/server'
import { getAuthUrl, hasToken } from '@/lib/youtube'

export async function GET() {
  if (hasToken()) return NextResponse.json({ connected: true })
  return NextResponse.json({ connected: false, authUrl: getAuthUrl() })
}
