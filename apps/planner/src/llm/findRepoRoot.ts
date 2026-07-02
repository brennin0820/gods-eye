import { access } from 'node:fs/promises'
import { dirname, join } from 'node:path'

/** Walk up from `from` until docs/37_NIGHTRAVEN.md is found (the Bible — canonical repo-root marker). */
export async function findRepoRoot(from: string, maxLevels = 6): Promise<string> {
  let dir = from
  for (let i = 0; i < maxLevels; i++) {
    try {
      await access(join(dir, 'docs/37_NIGHTRAVEN.md'))
      return dir
    } catch {
      const parent = dirname(dir)
      if (parent === dir) break
      dir = parent
    }
  }
  throw new Error(`Could not locate NightRaven repo root (docs/37_NIGHTRAVEN.md) above ${from}`)
}
