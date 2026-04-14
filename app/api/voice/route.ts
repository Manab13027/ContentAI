import { NextResponse } from 'next/server'
import { generateVoiceover } from '@/lib/elevenlabs'
import { prepareScriptForTTS } from '@/lib/claude'

export async function POST(req: Request) {
  const { script, runId, voice } = (await req.json()) as { script: string; runId: string; voice?: string }
  try {
    const speechScript = await prepareScriptForTTS({ script, voice })
    const audioPath = await generateVoiceover(speechScript, runId, voice)
    return NextResponse.json({ audioPath })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
