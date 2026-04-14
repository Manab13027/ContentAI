import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execFileAsync = promisify(execFile)

async function ffmpeg(args: string[]): Promise<void> {
  await execFileAsync('ffmpeg', args, { maxBuffer: 100 * 1024 * 1024 })
}

export async function getAudioDuration(audioPath: string): Promise<number> {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'quiet',
    '-show_entries', 'format=duration',
    '-of', 'csv=p=0',
    audioPath,
  ])
  return parseFloat(stdout.trim()) || 60
}

async function processClip(
  inputPath: string,
  outputPath: string,
  maxSeconds?: number
): Promise<void> {
  // Scale to fill 1080×1920 regardless of source aspect ratio, then crop centre
  const colorFilter = 'eq=saturation=1.3:contrast=1.05:brightness=0.01'
  const vf = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920:exact=1,${colorFilter}`
  const args = ['-i', inputPath]
  if (maxSeconds) args.push('-t', String(maxSeconds))
  args.push(
    '-vf', vf,
    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium',  // higher quality than crf 23
    '-pix_fmt', 'yuv420p',   // broad compatibility
    '-r', '30',               // normalise to 30fps
    '-an', '-y', outputPath
  )
  await ffmpeg(args)
}

export async function assembleVideo(
  brollPaths: string[],
  facePaths: string[],
  audioPath: string,
  runId: string,
  maxDuration?: number
): Promise<string> {
  const allPaths = [...brollPaths, ...facePaths]
  if (!allPaths.length) throw new Error('No clips provided to assembleVideo')

  const tmpDir = path.dirname(allPaths[0])
  const outDir = path.join(process.cwd(), 'data', 'videos')
  fs.mkdirSync(outDir, { recursive: true })

  const audioDur  = await getAudioDuration(audioPath)
  const targetDur = maxDuration ? Math.min(audioDur, maxDuration) : audioDur
  const fadeStart = Math.max(0, targetDur - 1.5)

  // Step 1: Process b-roll clips (full duration, color boost)
  const procBroll: string[] = []
  for (let i = 0; i < brollPaths.length; i++) {
    const out = path.join(tmpDir, `proc_broll_${i}.mp4`)
    await processClip(brollPaths[i], out)
    procBroll.push(out)
  }

  // Step 2: Process face clips — hard-trimmed to 5 seconds each
  const procFace: string[] = []
  for (let i = 0; i < facePaths.length; i++) {
    const out = path.join(tmpDir, `proc_face_${i}.mp4`)
    await processClip(facePaths[i], out, 5)
    procFace.push(out)
  }

  // Step 3: Build clip sequence
  // Pattern: [face intro] → [broll] → [broll] → [face mid] → [broll] → repeat
  // Face clips are short (5s) so the presenter feels intermittent, not dominant
  const buildSequence = (): string[] => {
    if (!procFace.length) return [...procBroll]
    const seq: string[] = []
    let brollIdx = 0
    let faceIdx  = 0
    // Intro: start with face (educational presenter feel)
    seq.push(procFace[faceIdx++ % procFace.length])
    // Alternate: 2 b-roll → 1 face
    while (brollIdx < procBroll.length * 2) {
      seq.push(procBroll[brollIdx % procBroll.length]); brollIdx++
      seq.push(procBroll[brollIdx % procBroll.length]); brollIdx++
      seq.push(procFace[faceIdx++ % procFace.length])
    }
    return seq
  }

  const sequence = buildSequence()

  // Step 4: Build concat list — 2 passes is enough now that we have 10–15 b-roll clips
  const concatTxt = path.join(tmpDir, 'concat.txt')
  const lines: string[] = []
  for (let r = 0; r < 2; r++) {
    for (const p of sequence) lines.push(`file '${p}'`)
  }
  fs.writeFileSync(concatTxt, lines.join('\n'))

  // Step 5: Concat + audio + fade in/out
  const videoPath = path.join(outDir, `${runId}.mp4`)
  const videoFade = `fade=t=in:st=0:d=0.5,fade=t=out:st=${fadeStart.toFixed(2)}:d=1.5`
  const audioFade = `afade=t=in:st=0:d=0.5,afade=t=out:st=${fadeStart.toFixed(2)}:d=1.5`

  await ffmpeg([
    '-f', 'concat', '-safe', '0', '-i', concatTxt,
    '-i', audioPath,
    '-map', '0:v', '-map', '1:a',
    '-vf', videoFade,
    '-af', audioFade,
    '-t', String(targetDur),
    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart',
    '-y', videoPath,
  ])

  return videoPath
}
