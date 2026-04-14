import { NextResponse } from 'next/server'
import { readResults } from '@/lib/storage'

export async function GET() {
  const store = readResults()
  return NextResponse.json({ runs: store.runs.slice(0, 10) })
}
