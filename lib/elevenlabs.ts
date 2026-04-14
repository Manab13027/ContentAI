import path from 'path'
import fs from 'fs'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

// ─── Voice mappings ────────────────────────────────────────────────────────────

const OPENAI_VOICE_MAP: Record<string, string> = {
  bold:             'onyx',    // deep, authoritative male
  storyteller:      'fable',   // warm, expressive male
  educational:      'echo',    // clear, professional male
  confident:        'nova',    // confident, sharp female
  warm:             'shimmer', // warm, friendly female
  hype:             'alloy',   // energetic, upbeat
  'indian-male-en': 'onyx',    // OpenAI has no Indian accent — closest deep male
  'indian-male-hi': 'onyx',    // Hindi text will be spoken by onyx
  'indian-female-en':'nova',   // closest female
  'indian-female-hi':'nova',   // Hindi text spoken by nova
}

const OPENAI_SPEED_MAP: Record<string, number> = {
  bold: 1.05, storyteller: 0.95, educational: 0.98,
  confident: 1.02, warm: 0.97, hype: 1.10,
  'indian-male-en': 1.0, 'indian-male-hi': 1.0,
  'indian-female-en': 1.0, 'indian-female-hi': 1.0,
}

const ELEVENLABS_VOICE_MAP: Record<string, string> = {
  bold:              'pNInz6obpgDQGcFmaJgB',
  storyteller:       'ErXwobaYiN019PkySvjV',
  educational:       'onwK4e9ZLuTAKqWW03F9',
  confident:         'EXAVITQu4vr4xnSDxMaL',
  warm:              '21m00Tcm4TlvDq8ikWAM',
  hype:              'MF3mGyEYCl7XYWbV9V6O',
  // Indian voices — update these IDs with Indian voices from your ElevenLabs voice library
  'indian-male-en':  'pNInz6obpgDQGcFmaJgB', // TODO: replace with Indian English male voice ID
  'indian-male-hi':  'pNInz6obpgDQGcFmaJgB', // TODO: replace with Hindi male voice ID
  'indian-female-en':'EXAVITQu4vr4xnSDxMaL', // TODO: replace with Indian English female voice ID
  'indian-female-hi':'EXAVITQu4vr4xnSDxMaL', // TODO: replace with Hindi female voice ID
}

const ELEVENLABS_SETTINGS: Record<string, { stability: number; similarity_boost: number; style: number; speed: number }> = {
  bold:              { stability: 0.22, similarity_boost: 0.88, style: 0.65, speed: 1.05 },
  storyteller:       { stability: 0.35, similarity_boost: 0.82, style: 0.58, speed: 0.95 },
  educational:       { stability: 0.45, similarity_boost: 0.82, style: 0.38, speed: 0.98 },
  confident:         { stability: 0.22, similarity_boost: 0.88, style: 0.65, speed: 1.02 },
  warm:              { stability: 0.38, similarity_boost: 0.82, style: 0.52, speed: 0.97 },
  hype:              { stability: 0.18, similarity_boost: 0.92, style: 0.75, speed: 1.10 },
  'indian-male-en':  { stability: 0.40, similarity_boost: 0.85, style: 0.45, speed: 1.0  },
  'indian-male-hi':  { stability: 0.40, similarity_boost: 0.85, style: 0.45, speed: 1.0  },
  'indian-female-en':{ stability: 0.40, similarity_boost: 0.85, style: 0.45, speed: 1.0  },
  'indian-female-hi':{ stability: 0.40, similarity_boost: 0.85, style: 0.45, speed: 1.0  },
}

// Voices that require ElevenLabs multilingual_v2 model (for Hindi)
const ELEVENLABS_MULTILINGUAL_VOICES = new Set(['indian-male-hi', 'indian-female-hi'])

const MACOS_VOICE_MAP: Record<string, string> = {
  bold:              'Eddy (English (US))',
  storyteller:       'Daniel',
  educational:       'Reed (English (US))',
  confident:         'Samantha',
  warm:              'Flo (English (US))',
  hype:              'Shelley (English (US))',
  'indian-male-en':  'Rishi',            // Indian English male (macOS built-in)
  'indian-male-hi':  'Rishi',            // Rishi speaks Hindi too; best built-in option
  'indian-female-en':'Veena',            // Indian English female (macOS built-in)
  'indian-female-hi':'Lekha',            // Hindi female (macOS built-in)
}

const MACOS_RATE_MAP: Record<string, number> = {
  bold: 162, storyteller: 145, educational: 150,
  confident: 160, warm: 148, hype: 175,
  'indian-male-en': 150, 'indian-male-hi': 145,
  'indian-female-en': 150, 'indian-female-hi': 145,
}

// ─── Script cleaning ───────────────────────────────────────────────────────────

function cleanScriptLabels(text: string): string {
  return text
    .replace(/\[(HOOK|BODY|CTA|BEAT \d+)\]/g, '')
    .replace(/[\u{1F600}-\u{1FAFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[^\x00-\x7F\n]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ─── OpenAI TTS (best quality) ────────────────────────────────────────────────

async function generateWithOpenAI(script: string, voice: string, outputPath: string): Promise<void> {
  const oaiVoice = OPENAI_VOICE_MAP[voice] ?? 'onyx'
  const speed    = OPENAI_SPEED_MAP[voice]  ?? 1.0

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model:           'tts-1-hd',
      input:           script,
      voice:           oaiVoice,
      response_format: 'mp3',
      speed,
    }),
  })

  if (!response.ok) throw new Error(`OpenAI TTS ${response.status}: ${await response.text()}`)
  fs.writeFileSync(outputPath, Buffer.from(await response.arrayBuffer()))
}

// ─── ElevenLabs TTS (great quality) ──────────────────────────────────────────

async function generateWithElevenLabs(script: string, voice: string, outputPath: string): Promise<void> {
  const voiceId  = ELEVENLABS_VOICE_MAP[voice]  ?? 'pNInz6obpgDQGcFmaJgB'
  const settings = ELEVENLABS_SETTINGS[voice]   ?? { stability: 0.28, similarity_boost: 0.88, style: 0.58, speed: 1.0 }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key':   process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
        'Accept':       'audio/mpeg',
      },
      body: JSON.stringify({
        text:     script,
        model_id: ELEVENLABS_MULTILINGUAL_VOICES.has(voice) ? 'eleven_multilingual_v2' : 'eleven_turbo_v2_5',
        voice_settings: {
          stability:        settings.stability,
          similarity_boost: settings.similarity_boost,
          style:            settings.style,
          use_speaker_boost: true,
          speed:            settings.speed,
        },
      }),
    }
  )

  if (!response.ok) throw new Error(`ElevenLabs ${response.status}: ${await response.text()}`)
  fs.writeFileSync(outputPath, Buffer.from(await response.arrayBuffer()))
}

// ─── macOS say (last resort fallback) ────────────────────────────────────────

async function generateWithMacOS(script: string, voice: string, outputPath: string): Promise<void> {
  const macVoice = MACOS_VOICE_MAP[voice] ?? 'Samantha'
  const rate     = MACOS_RATE_MAP[voice]  ?? 160
  const aiffPath = outputPath.replace('.mp3', '.aiff')
  const txtPath  = outputPath.replace('.mp3', '.txt')

  const withPauses = script
    .replace(/—/g, '[[slnc 300]]')
    .replace(/\.\.\./g, '[[slnc 500]]')

  fs.writeFileSync(txtPath, cleanScriptLabels(withPauses), 'utf-8')

  try {
    await execFileAsync('say', ['-v', macVoice, '-r', String(rate), '-f', txtPath, '-o', aiffPath], {
      maxBuffer: 10 * 1024 * 1024,
    })
    await execFileAsync('ffmpeg', ['-i', aiffPath, '-codec:a', 'libmp3lame', '-qscale:a', '2', '-y', outputPath])
  } finally {
    try { fs.unlinkSync(txtPath)  } catch {}
    try { fs.unlinkSync(aiffPath) } catch {}
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateVoiceover(
  script: string,
  runId: string,
  voice = 'bold'
): Promise<string> {
  const dir = path.join(process.cwd(), 'data', 'audio')
  fs.mkdirSync(dir, { recursive: true })
  const outputPath  = path.join(dir, `${runId}.mp3`)
  const cleanScript = cleanScriptLabels(script)

  // 1. OpenAI TTS — best quality, natural human voice
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log('[TTS] Using OpenAI tts-1-hd')
      await generateWithOpenAI(cleanScript, voice, outputPath)
      return outputPath
    } catch (err) {
      console.warn('[TTS] OpenAI failed:', err)
    }
  }

  // 2. ElevenLabs — great quality
  if (process.env.ELEVENLABS_API_KEY) {
    try {
      console.log('[TTS] Using ElevenLabs')
      await generateWithElevenLabs(cleanScript, voice, outputPath)
      return outputPath
    } catch (err) {
      console.warn('[TTS] ElevenLabs failed:', err)
    }
  }

  // 3. macOS say — last resort
  console.log('[TTS] Using macOS say (fallback)')
  await generateWithMacOS(script, voice, outputPath)
  return outputPath
}
