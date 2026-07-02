// Shared LLM-backed reasoning step for division agents.
//
// Loads the division's SKILL.md as system-prompt context (same convention as
// scripts/lmstudio-division-improve.sh — truncated, division-scoped, no cross-talk),
// asks for strict JSON matching a caller-supplied zod schema, and validates the result.
// Callers own the fallback: on LmStudioUnreachableError or a schema mismatch, the
// deterministic stub behavior (pre-existing agent logic) takes over — the orchestrator
// is never blind-dependent on a running LM Studio server.

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ZodType } from 'zod'
import { LmStudioClient, LmStudioUnreachableError } from './lmStudioClient.js'
import { findRepoRoot } from './findRepoRoot.js'
import type { DivisionName } from '../tools/registry.js'

const MAX_SKILL_CHARS = 12_000

export class LlmBrainOutputError extends Error {}

async function loadDivisionSkill(division: DivisionName): Promise<string> {
  const root = await findRepoRoot(process.cwd())
  const skillPath = join(root, '.claude/skills/divisions', division, 'SKILL.md')
  const content = await readFile(skillPath, 'utf8')
  return content.slice(0, MAX_SKILL_CHARS)
}

function extractJson(text: string): unknown {
  // Models often wrap JSON in prose or ```json fences — take the outermost {...} or [...].
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.search(/[[{]/)
  if (start === -1) throw new LlmBrainOutputError('No JSON object/array found in LM Studio response.')
  const end = Math.max(candidate.lastIndexOf('}'), candidate.lastIndexOf(']'))
  const slice = candidate.slice(start, end + 1)
  try {
    return JSON.parse(slice)
  } catch (err) {
    throw new LlmBrainOutputError(`LM Studio response was not valid JSON: ${String(err)}`)
  }
}

/**
 * Ask the division's LLM brain for structured output. Throws LmStudioUnreachableError
 * (server down) or LlmBrainOutputError (bad/unparseable output) — callers catch and fall
 * back to deterministic logic rather than surfacing either as a hard failure.
 */
export async function askDivisionBrain<T>(
  client: LmStudioClient,
  division: DivisionName,
  task: string,
  schema: ZodType<T>,
): Promise<T> {
  const skill = await loadDivisionSkill(division)
  const system =
    `You are the ${division} division of the NightRaven orchestrator. Stay strictly inside this ` +
    `division's role — no cross-talk with other divisions. Respond with ONLY a single JSON value ` +
    `(no prose, no markdown fences) matching the shape the task describes.\n\n` +
    `--- ${division} division SKILL.md ---\n${skill}`

  const raw = await client.chat([
    { role: 'system', content: system },
    { role: 'user', content: task },
  ])

  const parsed = extractJson(raw)
  const result = schema.safeParse(parsed)
  if (!result.success) {
    throw new LlmBrainOutputError(`LM Studio JSON failed schema validation: ${result.error.message}`)
  }
  return result.data
}

export { LmStudioUnreachableError }
