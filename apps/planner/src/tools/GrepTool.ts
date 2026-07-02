import { readFile, readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { z } from 'zod'
import { AgentTool } from './AgentTool.js'

const schema = z.object({
  pattern: z.string(),
  path: z.string().default('.'),
  glob: z.string().optional(),
  context: z.number().int().nonnegative().default(0),
})

async function grepFile(file: string, re: RegExp, context: number): Promise<string[]> {
  const lines = (await readFile(file, 'utf8')).split('\n')
  const results: string[] = []
  lines.forEach((line, i) => {
    if (re.test(line)) {
      const start = Math.max(0, i - context)
      const end = Math.min(lines.length - 1, i + context)
      for (let j = start; j <= end; j++) {
        results.push(`${file}:${j + 1}: ${lines[j]}`)
      }
    }
  })
  return results
}

function globToRegExp(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, '(?:.*/)?')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
  return new RegExp(`^${escaped}$`)
}

async function walkGrep(
  dir: string,
  base: string,
  re: RegExp,
  context: number,
  fileMatch?: (rel: string) => boolean,
): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const results: string[] = []
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...await walkGrep(full, base, re, context, fileMatch))
    } else {
      const rel = relative(base, full)
      if (fileMatch && !fileMatch(rel)) continue
      results.push(...await grepFile(rel, re, context).catch(() => []))
    }
  }
  return results
}

export class GrepTool extends AgentTool<z.infer<typeof schema>> {
  readonly name = 'grep'
  readonly description = 'Search file contents with a regex pattern, optionally filtered by a filename glob.'
  readonly schema = schema

  protected async _run({ pattern, path, glob, context }: z.infer<typeof schema>) {
    const re = new RegExp(pattern)
    let fileMatch: ((rel: string) => boolean) | undefined
    if (glob) {
      const globRe = globToRegExp(glob)
      // Patterns without a slash match against the basename (grep --include semantics)
      fileMatch = glob.includes('/')
        ? (rel) => globRe.test(rel)
        : (rel) => globRe.test(rel.split('/').pop() ?? rel)
    }
    const matches = await walkGrep(path, path, re, context, fileMatch)
    return matches.length ? matches.slice(0, 200).join('\n') : '(no matches)'
  }
}
