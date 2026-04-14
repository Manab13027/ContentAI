import { execFile } from 'child_process'
import { promisify } from 'util'
import { NextResponse } from 'next/server'

const execFileAsync = promisify(execFile)

export interface VoiceOption {
  id: string        // exact name to pass to `say -v`
  name: string      // display name
  locale: string    // en_US, en_GB, etc.
  accent: string    // US, British, Australian, Indian, Irish
  gender: 'male' | 'female' | 'neutral'
}

// Voices to exclude (novelty/robotic)
const EXCLUDE = new Set([
  'Bad News','Bahh','Boing','Bubbles','Cellos','Wobble','Jester','Junior',
  'Organ','Superstar','Ralph','Bells','Good News','Albert','Kathy','Fred',
  'Trinoids','Whisper','Zarvox',
])

const GENDER_MAP: Record<string, 'male' | 'female'> = {
  Aman: 'male', Daniel: 'male', Reed: 'male', Rishi: 'male',
  Rocko: 'male', Grandpa: 'male', Eddy: 'male',
  Flo: 'female', Grandma: 'female', Karen: 'female', Moira: 'female',
  Samantha: 'female', Sandy: 'female', Shelley: 'female', Tara: 'female',
}

const ACCENT_MAP: Record<string, string> = {
  en_US: 'American', en_GB: 'British', en_AU: 'Australian',
  en_IN: 'Indian', en_IE: 'Irish',
}

export async function GET() {
  const { stdout } = await execFileAsync('say', ['-v', '?'])

  const voices: VoiceOption[] = []
  for (const line of stdout.split('\n')) {
    const match = line.match(/^(.+?)\s{2,}(en_\w+)/)
    if (!match) continue
    const id   = match[1].trim()
    const locale = match[2].trim()
    if (!locale.startsWith('en_')) continue

    // Derive base name (strip parenthetical accent suffix for gender lookup)
    const baseName = id.replace(/\s*\(.*?\)\s*$/, '').trim()
    if (EXCLUDE.has(baseName) || EXCLUDE.has(id)) continue

    const gender  = GENDER_MAP[baseName] ?? 'neutral'
    const accent  = ACCENT_MAP[locale] ?? locale

    voices.push({ id, name: id, locale, accent, gender })
  }

  // Sort: US first, then by name
  voices.sort((a, b) => {
    if (a.locale === 'en_US' && b.locale !== 'en_US') return -1
    if (a.locale !== 'en_US' && b.locale === 'en_US') return 1
    return a.name.localeCompare(b.name)
  })

  return NextResponse.json({ voices })
}
