import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import fs from 'fs'
import path from 'path'

function toWebStream(nodeStream: fs.ReadStream): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk: Buffer | string) => {
        const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk
        controller.enqueue(new Uint8Array(buf))
      })
      nodeStream.on('end', () => controller.close())
      nodeStream.on('error', err => controller.error(err))
    },
    cancel() {
      nodeStream.destroy()
    },
  })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params

  // Sanitize — UUID format only, no path traversal
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(runId)) {
    return NextResponse.json({ error: 'Invalid runId' }, { status: 400 })
  }

  const videoPath = path.join(process.cwd(), 'data', 'videos', `${runId}.mp4`)
  if (!fs.existsSync(videoPath)) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  const stat = fs.statSync(videoPath)
  const range = req.headers.get('range')

  if (range) {
    const match = range.match(/bytes=(\d+)-(\d*)/)
    if (!match) return NextResponse.json({ error: 'Bad range' }, { status: 416 })
    const start = parseInt(match[1], 10)
    const end = match[2] ? parseInt(match[2], 10) : stat.size - 1
    const chunkSize = end - start + 1

    return new NextResponse(toWebStream(fs.createReadStream(videoPath, { start, end })), {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type': 'video/mp4',
        'Cache-Control': 'no-cache',
      },
    })
  }

  return new NextResponse(toWebStream(fs.createReadStream(videoPath)), {
    status: 200,
    headers: {
      'Content-Length': String(stat.size),
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
    },
  })
}
