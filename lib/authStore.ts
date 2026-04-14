/**
 * Simple file-based store for OAuth state across API routes.
 * Next.js isolates route modules so in-memory Maps can't be shared.
 * We write state to /tmp/yt_auth_<state>.json and poll from there.
 */
import fs from 'fs'
import path from 'path'
import os from 'os'

export interface AuthResult {
  status: 'pending' | 'success' | 'error'
  refreshToken?: string
  channelName?: string
  channelId?: string
  error?: string
}

function filePath(state: string): string {
  return path.join(os.tmpdir(), `yt_auth_${state}.json`)
}

export function setPending(state: string): void {
  fs.writeFileSync(filePath(state), JSON.stringify({ status: 'pending' }))
}

export function setResult(state: string, result: AuthResult): void {
  fs.writeFileSync(filePath(state), JSON.stringify(result))
}

export function getResult(state: string): AuthResult | null {
  const fp = filePath(state)
  if (!fs.existsSync(fp)) return null
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf-8')) as AuthResult
  } catch {
    return null
  }
}

export function clearResult(state: string): void {
  try { fs.unlinkSync(filePath(state)) } catch {}
}
