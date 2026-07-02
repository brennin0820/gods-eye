import { readFile } from 'node:fs/promises'
import { parse } from 'yaml'
import { ManifestSchema, type Manifest } from './types.js'

export class ManifestValidationError extends Error {}

export type LoadedManifest = {
  manifest: Manifest
  /** Full parsed YAML, including fields the schema doesn't model (e.g. app-specific `invoke` prompts). */
  raw: Record<string, unknown>
  path: string
}

export async function loadManifest(path: string): Promise<LoadedManifest> {
  const text = await readFile(path, 'utf8')
  let raw: unknown
  try {
    raw = parse(text)
  } catch (err) {
    throw new ManifestValidationError(`Could not parse YAML at ${path}: ${String(err)}`)
  }
  const result = ManifestSchema.safeParse(raw)
  if (!result.success) {
    throw new ManifestValidationError(`Manifest at ${path} failed validation: ${result.error.message}`)
  }
  return { manifest: result.data, raw: raw as Record<string, unknown>, path }
}
