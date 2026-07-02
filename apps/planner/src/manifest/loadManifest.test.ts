import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import { loadManifest, ManifestValidationError } from './loadManifest.js'

const here = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(here, '../../../..')
const LINENFLOW_MANIFEST = join(REPO_ROOT, 'examples/manifest/NIGHTRAVEN_UNIFIED_MANIFEST.example.yaml')

describe('loadManifest', () => {
  it('validates the committed LinenFlow Unified Manifest example', async () => {
    const { manifest, raw } = await loadManifest(LINENFLOW_MANIFEST)
    expect(manifest.version).toBe(1)
    expect(manifest.orchestrator.complexity).toBe('MEDIUM')
    expect(manifest.coordination.claim_file).toBe('AGENT_WORK_LOG.md')
    expect(manifest.ledgers.build).toBe('Docs/ledgers/BUILD_LEDGER.md')
    expect(manifest.serialization_rules?.serialized_paths).toContain('LinenFlow.xcodeproj/project.pbxproj')
    // App-specific fields the schema doesn't model still survive in raw.
    expect(raw.invoke).toBeDefined()
  })

  it('rejects a manifest with the wrong version', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'manifest-'))
    const path = join(dir, 'bad.yaml')
    await writeFile(path, 'version: 2\nframework:\n  root: /tmp\norchestrator: {}\ncoordination: {}\nledgers: {}\n')
    await expect(loadManifest(path)).rejects.toThrow(ManifestValidationError)
    await rm(dir, { recursive: true, force: true })
  })

  it('rejects unparsable YAML', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'manifest-'))
    const path = join(dir, 'bad.yaml')
    await writeFile(path, '{ not: [valid yaml')
    await expect(loadManifest(path)).rejects.toThrow(ManifestValidationError)
    await rm(dir, { recursive: true, force: true })
  })
})
