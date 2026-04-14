import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const LENGTH_TARGETS: Record<string, { words: string; duration: string }> = {
  '30s':  { words: '60-75 words',   duration: '30-second' },
  '60s':  { words: '130-150 words', duration: '60-second' },
  '90s':  { words: '200-225 words', duration: '90-second' },
  '3min': { words: '400-450 words', duration: '2-3 minute' },
}

const HINDI_VOICES = new Set(['indian-male-hi', 'indian-female-hi'])

export async function generateScript(params: {
  niche: string
  topTopic: string
  avgViews: number
  writingSample: string
  pastScripts: string[]
  targetLength?: string
  voice?: string
}): Promise<string> {
  const pastScriptsText = params.pastScripts.length > 0
    ? `\n\nPast scripts you have already written (do NOT repeat these topics or structures):\n${params.pastScripts.slice(0, 3).join('\n---\n')}`
    : ''

  const target   = LENGTH_TARGETS[params.targetLength ?? '60s']
  const isHindi  = HINDI_VOICES.has(params.voice ?? '')
  const langNote = isHindi
    ? '\n\nIMPORTANT: Write the ENTIRE script in Hindi (Devanagari script). All labels, hook, body, and CTA must be in Hindi.'
    : ''

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a short-form content script writer who mirrors the user's exact voice.

Niche: ${params.niche}
Viral topic: ${params.topTopic} (${(params.avgViews / 1000).toFixed(1)}K avg views on this topic)

User's writing style — match this voice exactly:
${params.writingSample}${pastScriptsText}${langNote}

Write a ${target.duration} reel script (~${target.words}) in the user's exact voice. Base it on the viral topic above.

Format your response EXACTLY like this (include the labels):
[HOOK]
<1-2 sentences that grab attention immediately>

[BODY]
<3-5 short punchy paragraphs — conversational, not corporate>

[CTA]
<1 sentence call to action>`,
    }],
  })

  return (message.content[0] as { type: 'text'; text: string }).text
}

export async function generateHooks(params: {
  script: string
  niche: string
  pastHooks: string[]
}): Promise<Array<{ text: string; pattern: string; estimatedViews: string }>> {
  const pastHooksText = params.pastHooks.length > 0
    ? `\n\nAvoid repeating these past hooks:\n${params.pastHooks.slice(0, 5).join('\n')}`
    : ''

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a viral hook specialist for short-form video content.

Script:
${params.script}

Niche: ${params.niche}${pastHooksText}

Generate exactly 5 hook variations. Each must use a DIFFERENT pattern:
1. Pain + Solution
2. Curiosity Gap
3. Time-Saving Claim
4. Contrarian Take
5. Personal Story

Respond ONLY with valid JSON — no markdown, no explanation, no code fences:
[
  {"text": "...", "pattern": "Pain + Solution", "estimatedViews": "1.2M"},
  {"text": "...", "pattern": "Curiosity Gap", "estimatedViews": "850K"},
  {"text": "...", "pattern": "Time-Saving Claim", "estimatedViews": "600K"},
  {"text": "...", "pattern": "Contrarian Take", "estimatedViews": "420K"},
  {"text": "...", "pattern": "Personal Story", "estimatedViews": "310K"}
]`,
    }],
  })

  const raw = (message.content[0] as { type: 'text'; text: string }).text
  // Strip markdown code fences if Claude wrapped the JSON
  const text = raw.replace(/```[\s\S]*?```/g, m => m.replace(/^```\w*\n?/,'').replace(/```$/,'')).trim()
  return JSON.parse(text) as Array<{ text: string; pattern: string; estimatedViews: string }>
}

export async function prepareScriptForTTS(params: {
  script: string
  voice?: string
}): Promise<string> {
  const toneTip: Record<string, string> = {
    bold:              'Aggressive, punchy, confident. Short sentences. Use "Look —", "Here\'s the truth —".',
    storyteller:       'Warm, narrative. Use pauses before reveals. "And then... it hit me."',
    educational:       'Clear, measured. Pause before key facts. "Now here\'s what most people miss —".',
    confident:         'Sharp, direct. No filler. Statement-heavy. "This is how it works. Period."',
    warm:              'Friendly, conversational. Like talking to a friend. Use "honestly", "real talk".',
    hype:              'High energy. Exclamations. Short bursts. Build momentum with each line.',
    'indian-male-en':  'Confident, articulate Indian English delivery. Natural Indian cadence. Clear pronunciation.',
    'indian-male-hi':  'सहज, आत्मविश्वासी हिंदी। छोटे वाक्य। "देखिए —", "सच बात यह है —" जैसे phrases का उपयोग करें।',
    'indian-female-en':'Warm, expressive Indian English. Natural Indian rhythm and intonation.',
    'indian-female-hi':'मैत्रीपूर्ण, स्वाभाविक हिंदी। "सच में", "ये बात सुनिए" जैसे phrases का उपयोग करें।',
  }
  const tone    = params.voice ? (toneTip[params.voice] ?? '') : ''
  const isHindi = HINDI_VOICES.has(params.voice ?? '')

  const langInstruction = isHindi
    ? `- Output MUST be entirely in Hindi (Devanagari script)
- Use natural spoken Hindi, not formal/literary Hindi
- Hindi fillers: "देखिए", "सच में", "है ना?", "यहाँ बात यह है"`
    : `- Use contractions everywhere (don't, it's, you're, they've, we're, can't, won't)
- Add occasional filler for realism: "Look", "honestly", "right?", "here's the thing"`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a speech coach converting a video script into natural spoken delivery text for an AI voice (ElevenLabs TTS).

Rules:
${langInstruction}
- Break long sentences into SHORT ones — 8 words max per sentence
- Add "..." (3 dots) for a breath pause between thoughts
- Add "—" (em dash) for a dramatic mid-sentence pause
- Remove ALL labels like [HOOK], [BODY], [CTA] — just the spoken words
- No bullet points, no formatting — continuous natural speech only
- Vary sentence length — short punch, then a slightly longer explanation, short punch
- Do NOT add new content — only reformat what exists
${tone ? `\nTone: ${tone}` : ''}

Script to convert:
${params.script}

Output ONLY the speech-ready text. No labels, no explanation.`,
    }],
  })

  return (message.content[0] as { type: 'text'; text: string }).text.trim()
}
