/**
 * Unified AI avatar generation.
 * Priority: Replicate (SadTalker) → D-ID → null (caller uses Pexels fallback)
 */
import { generateWithReplicate } from './replicate'
import { generateAvatarClips as generateWithDID, isDIDAvailable } from './did'

export function isAvatarAvailable(): boolean {
  return !!(process.env.REPLICATE_API_KEY || process.env.DID_API_KEY)
}

export async function generateAvatarClips(
  audioPath: string,
  gender: 'male' | 'female',
  runId: string,
  targetDuration: number
): Promise<string[]> {
  // 1. Replicate — free credits, open-source SadTalker, ~$0.05/video
  if (process.env.REPLICATE_API_KEY) {
    console.log('[Avatar] Using Replicate / SadTalker')
    return generateWithReplicate(audioPath, gender, runId, targetDuration)
  }

  // 2. D-ID — polished commercial avatar, ~$0.10–0.30/video
  if (isDIDAvailable()) {
    console.log('[Avatar] Using D-ID')
    return generateWithDID(audioPath, gender, runId, targetDuration)
  }

  throw new Error('No avatar service configured (set REPLICATE_API_KEY or DID_API_KEY)')
}
