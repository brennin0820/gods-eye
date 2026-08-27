import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { createServer, type ViteDevServer } from 'vite'
import {
  buildNextMove,
  buildProjectFileCatalog,
  buildProjectMonitorSnapshot,
  readResolvedProjectFile,
  resolveProjectSource,
} from './projectMonitor.ts'
import { buildEvolutionSnapshot } from './evolutionTracker.ts'
import type { FileCatalogEntry, ProjectSnapshot } from '../src/types/snapshot'

const separator = '\u2014'

function makeProject(): string {
  const projectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'compass-monitor-'))
  execFileSync('git', ['init'], { cwd: projectPath, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'compass-monitor@example.invalid'], { cwd: projectPath, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'Compass Monitor Test'], { cwd: projectPath, stdio: 'ignore' })
  return projectPath
}

function writeProjectFile(projectPath: string, relativePath: string, content: string): void {
  const fullPath = path.join(projectPath, relativePath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(fullPath, content)
}

function stageProjectFile(projectPath: string, relativePath: string, content: string): void {
  writeProjectFile(projectPath, relativePath, content)
  execFileSync('git', ['-C', projectPath, 'add', relativePath], { stdio: 'ignore' })
}

function commitProject(projectPath: string, message: string): void {
  execFileSync('git', ['-C', projectPath, 'add', '.'], { stdio: 'ignore' })
  execFileSync('git', ['-C', projectPath, 'commit', '-m', message], { stdio: 'ignore' })
}

function catalogEntry(catalog: FileCatalogEntry[], sourcePath: string): FileCatalogEntry {
  const entry = catalog.find((item) => item.sourcePath === sourcePath)
  assert.ok(entry, `Expected catalog entry for ${sourcePath}`)
  return entry
}

function dimensionStatus(catalog: FileCatalogEntry[], sourcePath: string): FileCatalogEntry['precision'] {
  return catalogEntry(catalog, sourcePath).precision
}

function changedSourcePaths(projectPath: string): string[] {
  return buildProjectFileCatalog(projectPath)
    .filter((entry) => entry.monitorRole === 'source' && entry.precision.changed === 'yes')
    .map((entry) => entry.sourcePath)
}

async function startApiServer(): Promise<{ server: ViteDevServer; baseUrl: string }> {
  const server = await createServer({
    configFile: path.join(process.cwd(), 'vite.config.ts'),
    root: process.cwd(),
    logLevel: 'silent',
    server: {
      host: '127.0.0.1',
      port: 0,
    },
  })
  await server.listen()
  const address = server.httpServer?.address()
  assert.ok(address && typeof address === 'object', 'Expected Vite API server address')
  return { server, baseUrl: `http://127.0.0.1:${address.port}` }
}

async function fetchJson<T>(baseUrl: string, route: string): Promise<T> {
  const response = await fetch(`${baseUrl}${route}`)
  if (response.status !== 200) {
    assert.fail(await response.text())
  }
  return (await response.json()) as T
}

test('Git rename evidence points Compass at the current destination path', () => {
  const projectPath = makeProject()
  try {
    writeProjectFile(projectPath, 'draft.md', 'same content\n')
    commitProject(projectPath, 'add draft')
    execFileSync('git', ['-C', projectPath, 'mv', 'draft.md', 'shipped.md'])

    assert.deepEqual(changedSourcePaths(projectPath), ['shipped.md'])
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('an untracked filename containing an arrow stays its literal source path', () => {
  const projectPath = makeProject()
  try {
    writeProjectFile(projectPath, 'draft -> shipped.md', 'new file\n')

    assert.deepEqual(changedSourcePaths(projectPath), ['draft -> shipped.md'])
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('Git paths preserve POSIX backslashes and never stat outside symlink targets', () => {
  const projectPath = makeProject()
  const outsideName = `outside-${path.basename(projectPath)}.txt`
  const externalPath = path.join(path.dirname(projectPath), outsideName)
  const literalBackslashPath = `..\\${outsideName}`
  try {
    writeProjectFile(projectPath, literalBackslashPath, 'inside\n')
    fs.writeFileSync(externalPath, 'outside content that must not supply metadata\n')
    fs.symlinkSync(externalPath, path.join(projectPath, 'outside-link.txt'))

    const catalog = buildProjectFileCatalog(projectPath)
    const literal = catalogEntry(catalog, literalBackslashPath)
    const outsideLink = catalogEntry(catalog, 'outside-link.txt')

    assert.equal(literal.absolutePath, path.join(projectPath, literalBackslashPath))
    assert.equal(literal.sizeBytes, Buffer.byteLength('inside\n'))
    assert.equal(outsideLink.status, 'missing')
    assert.equal(outsideLink.sizeBytes, undefined)
    assert.equal(outsideLink.lastUpdated, undefined)
    assert.equal(outsideLink.precision.blocking, true)
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
    fs.rmSync(externalPath, { force: true })
  }
})

test('evidence reads return metadata from the opened descriptor after resolution', () => {
  const projectPath = makeProject()
  try {
    const sourcePath = 'docs/PROJECT_HANDOFF.md'
    const initialContent = '# Initial handoff\n'
    const updatedContent = '# Updated handoff with descriptor metadata\n'
    writeProjectFile(projectPath, sourcePath, initialContent)
    const resolved = resolveProjectSource(projectPath, sourcePath)
    assert.equal(resolved.stat?.size, Buffer.byteLength(initialContent))

    writeProjectFile(projectPath, sourcePath, updatedContent)
    const opened = readResolvedProjectFile(resolved)

    assert.ok(opened)
    assert.equal(opened.content, updatedContent)
    assert.equal(opened.stat.size, Buffer.byteLength(updatedContent))
    assert.notEqual(opened.stat.size, resolved.stat?.size)
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('evolution evidence rejects outside-project symlinks without falling back to nested or cwd state', async () => {
  const projectPath = makeProject()
  const externalPath = fs.mkdtempSync(path.join(os.tmpdir(), 'compass-evolution-external-'))
  let server: ViteDevServer | undefined
  try {
    writeProjectFile(externalPath, 'PROJECT_STATE.md', '- Current version: Foreign 9\n')
    writeProjectFile(projectPath, 'apps/compass/PROJECT_STATE.md', '- Current version: Nested 2\n')
    fs.symlinkSync(path.join(externalPath, 'PROJECT_STATE.md'), path.join(projectPath, 'PROJECT_STATE.md'))

    const evolution = buildEvolutionSnapshot(projectPath)
    const projectState = evolution.trackingFiles.find((file) => file.name === 'Project State')

    assert.equal(evolution.currentVersion, 'Untracked')
    assert.equal(projectState?.path, 'PROJECT_STATE.md')
    assert.equal(projectState?.status, 'missing')

    const api = await startApiServer()
    server = api.server
    const snapshot = await fetchJson<ProjectSnapshot>(
      api.baseUrl,
      `/api/project?${new URLSearchParams({ path: projectPath, label: 'Evolution Fixture' }).toString()}`,
    )
    assert.equal(snapshot.evolution.currentVersion, 'Untracked')
    assert.equal(snapshot.evolution.trackingFiles.find((file) => file.name === 'Project State')?.status, 'missing')
  } finally {
    await server?.close()
    fs.rmSync(projectPath, { recursive: true, force: true })
    fs.rmSync(externalPath, { recursive: true, force: true })
  }
})

test('evolution evidence preserves contained symlinks and canonical fallback precedence', () => {
  const projectPath = makeProject()
  const emptyProjectPath = makeProject()
  try {
    writeProjectFile(projectPath, '.evolution/PROJECT_STATE.md', '- Current version: Local 3\n- Current stage: Build\n')
    writeProjectFile(projectPath, 'apps/compass/PROJECT_STATE.md', '- Current version: Nested competitor\n')
    fs.symlinkSync('.evolution/PROJECT_STATE.md', path.join(projectPath, 'PROJECT_STATE.md'))

    const evolution = buildEvolutionSnapshot(projectPath)
    assert.equal(evolution.currentVersion, 'Local 3')
    assert.equal(evolution.currentStage, 'Build')
    const rootProjectState = evolution.trackingFiles.find((file) => file.name === 'Project State')
    assert.equal(rootProjectState?.path, 'PROJECT_STATE.md')
    assert.equal(rootProjectState?.status, 'present')

    const emptyEvolution = buildEvolutionSnapshot(emptyProjectPath)
    assert.equal(emptyEvolution.currentVersion, 'Untracked')
    assert.ok(emptyEvolution.trackingFiles.every((file) => file.status === 'missing'))

    writeProjectFile(emptyProjectPath, 'apps/compass/PROJECT_STATE.md', '- Current version: Nested 4\n')
    const nestedEvolution = buildEvolutionSnapshot(emptyProjectPath)
    assert.equal(nestedEvolution.currentVersion, 'Nested 4')
    assert.equal(
      nestedEvolution.trackingFiles.find((file) => file.name === 'Project State')?.path,
      'apps/compass/PROJECT_STATE.md',
    )

    fs.mkdirSync(path.join(emptyProjectPath, 'PROJECT_STATE.md'))
    const wrongTypeEvolution = buildEvolutionSnapshot(emptyProjectPath)
    assert.equal(wrongTypeEvolution.currentVersion, 'Untracked')
    assert.equal(wrongTypeEvolution.trackingFiles.find((file) => file.name === 'Project State')?.path, 'PROJECT_STATE.md')

    fs.rmdirSync(path.join(emptyProjectPath, 'PROJECT_STATE.md'))
    fs.symlinkSync('missing-project-state.md', path.join(emptyProjectPath, 'PROJECT_STATE.md'))
    const brokenEvolution = buildEvolutionSnapshot(emptyProjectPath)
    assert.equal(brokenEvolution.currentVersion, 'Untracked')
    assert.equal(brokenEvolution.trackingFiles.find((file) => file.name === 'Project State')?.path, 'PROJECT_STATE.md')
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
    fs.rmSync(emptyProjectPath, { recursive: true, force: true })
  }
})

test('released claim log entries do not leave a file actively claimed', () => {
  const projectPath = makeProject()
  try {
    stageProjectFile(projectPath, 'src/app.ts', 'export const app = true\n')
    writeProjectFile(
      projectPath,
      'AGENT_WORK_LOG.md',
      [
        `- [CLAIMED] \`src/app.ts\` ${separator} stream:one ${separator} Codex ${separator} started`,
        `- [RELEASED] \`src/app.ts\` ${separator} stream:one ${separator} Codex ${separator} done`,
        '',
      ].join('\n'),
    )

    const entry = catalogEntry(buildProjectFileCatalog(projectPath), 'src/app.ts')

    assert.equal(entry.precision.claim, 'unclaimed')
    assert.equal(entry.precision.blocking, true)
    assert.ok(entry.precision.evidence.includes('no active claim evidence for this path'))
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('clean canonical claims become blocking rows while unsafe claim paths invalidate the source', () => {
  const projectPath = makeProject()
  const externalPath = fs.mkdtempSync(path.join(os.tmpdir(), 'compass-monitor-outside-'))
  try {
    writeProjectFile(projectPath, 'src/clean.ts', 'export const clean = true\n')
    writeProjectFile(projectPath, 'src/absolute.ts', 'export const absolute = true\n')
    writeProjectFile(externalPath, 'secret.ts', 'export const secret = true\n')
    fs.symlinkSync(externalPath, path.join(projectPath, 'outside-link'))
    commitProject(projectPath, 'add clean claim targets')
    writeProjectFile(
      projectPath,
      '.nightraven/file-claims.json',
      `${JSON.stringify({
        claims: [
          { path: 'src/clean.ts' },
          { path: path.join(projectPath, 'src/absolute.ts') },
        ],
      })}\n`,
    )

    const safeCatalog = buildProjectFileCatalog(projectPath)
    const clean = catalogEntry(safeCatalog, 'src/clean.ts')
    const absoluteInside = catalogEntry(safeCatalog, 'src/absolute.ts')

    assert.equal(clean.precision.changed, 'no')
    assert.equal(clean.precision.claim, 'claimed')
    assert.equal(clean.precision.blocking, true)
    assert.equal(clean.precision.nextAction, 'Release or resolve the active file claim.')
    assert.equal(clean.id, 'claimed:src/clean.ts')
    assert.equal(absoluteInside.precision.claim, 'claimed')

    writeProjectFile(
      projectPath,
      '.nightraven/file-claims.json',
      `${JSON.stringify({
        claims: [
          { path: 'src/clean.ts' },
          { path: '../outside.ts', status: 'active', owner: 'outside-owner' },
          { path: path.join(externalPath, 'secret.ts') },
          { path: 'outside-link/secret.ts' },
          { path: 'C:\\outside\\secret.ts', owner: 'windows-owner' },
          { path: '\\\\server\\share\\secret.ts' },
        ],
      })}\n`,
    )

    const catalog = buildProjectFileCatalog(projectPath)
    const canonical = catalogEntry(catalog, '.nightraven/file-claims.json')

    assert.equal(canonical.precision.claim, 'claimed')
    assert.equal(canonical.precision.blocking, true)
    assert.ok(canonical.precision.evidence.some((item) => item.includes('unsupported shape')))
    assert.equal(catalog.some((entry) => entry.sourcePath === 'src/clean.ts'), false)
    assert.equal(catalog.some((entry) => entry.sourcePath.includes('outside.ts')), false)
    assert.equal(catalog.some((entry) => entry.sourcePath === 'outside-link/secret.ts'), false)
    assert.equal(catalog.some((entry) => entry.sourcePath.endsWith('secret.ts')), false)
    assert.equal(
      catalog.some((entry) => ['path', 'status', 'owner'].includes(entry.sourcePath)),
      false,
    )
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
    fs.rmSync(externalPath, { recursive: true, force: true })
  }
})

test('an existing empty canonical claim set suppresses stale legacy claims', () => {
  const projectPath = makeProject()
  try {
    writeProjectFile(projectPath, 'src/legacy.ts', 'export const legacy = true\n')
    commitProject(projectPath, 'add legacy claim target')
    writeProjectFile(
      projectPath,
      'AGENT_WORK_LOG.md',
      `- [CLAIMED] \`src/legacy.ts\` ${separator} stream:legacy ${separator} 2026-08-14T00:00:00.000Z\n`,
    )
    writeProjectFile(projectPath, '.nightraven/file-claims.json', '{"claims":[]}\n')

    assert.equal(buildProjectFileCatalog(projectPath).some((entry) => entry.sourcePath === 'src/legacy.ts'), false)
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('malformed canonical claim evidence blocks progression without reviving legacy claims', () => {
  const projectPath = makeProject()
  try {
    writeProjectFile(projectPath, 'src/legacy.ts', 'export const legacy = true\n')
    commitProject(projectPath, 'add malformed claim fixture')
    writeProjectFile(
      projectPath,
      'AGENT_WORK_LOG.md',
      `- [CLAIMED] \`src/legacy.ts\` ${separator} stream:legacy ${separator} 2026-08-14T00:00:00.000Z\n`,
    )
    writeProjectFile(projectPath, '.nightraven/file-claims.json', '{"claims":[')

    const catalog = buildProjectFileCatalog(projectPath)
    const canonical = catalogEntry(catalog, '.nightraven/file-claims.json')

    assert.equal(canonical.precision.claim, 'claimed')
    assert.equal(canonical.precision.blocking, true)
    assert.equal(canonical.precision.nextAction, 'Repair the canonical claim evidence before marking done.')
    assert.ok(canonical.precision.evidence.some((item) => item.includes('malformed')))
    assert.equal(catalog.some((entry) => entry.sourcePath === 'src/legacy.ts'), false)

    writeProjectFile(projectPath, '.nightraven/file-claims.json', '   \n')
    assert.equal(
      catalogEntry(buildProjectFileCatalog(projectPath), '.nightraven/file-claims.json').precision.blocking,
      true,
    )

    writeProjectFile(projectPath, '.nightraven/file-claims.json', '{"claims":42}\n')
    assert.equal(
      catalogEntry(buildProjectFileCatalog(projectPath), '.nightraven/file-claims.json').precision.nextAction,
      'Repair the canonical claim evidence before marking done.',
    )
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('unsupported primitive claim-array members invalidate the full canonical source', () => {
  const projectPath = makeProject()
  try {
    writeProjectFile(projectPath, 'src/current.ts', 'export const current = true\n')
    writeProjectFile(projectPath, 'src/legacy.ts', 'export const legacy = true\n')
    commitProject(projectPath, 'add invalid claim-array fixtures')
    writeProjectFile(
      projectPath,
      'AGENT_WORK_LOG.md',
      `- [CLAIMED] \`src/legacy.ts\` ${separator} stream:legacy ${separator} 2026-08-14T00:00:00.000Z\n`,
    )

    for (const content of [
      '{"claims":[42]}\n',
      '{"claims":[{"path":"src/current.ts"},false]}\n',
      '{"claims":["   "]}\n',
      '["src/current.ts",null]\n',
    ]) {
      writeProjectFile(projectPath, '.nightraven/file-claims.json', content)
      const catalog = buildProjectFileCatalog(projectPath)
      const canonical = catalogEntry(catalog, '.nightraven/file-claims.json')

      assert.equal(canonical.precision.blocking, true)
      assert.equal(canonical.precision.nextAction, 'Repair the canonical claim evidence before marking done.')
      assert.ok(canonical.precision.evidence.some((item) => item.includes('unsupported shape')))
      assert.equal(catalog.some((entry) => entry.sourcePath === 'src/current.ts'), false)
      assert.equal(catalog.some((entry) => entry.sourcePath === 'src/legacy.ts'), false)
    }
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('pathless claim objects invalidate canonical evidence instead of becoming file paths', () => {
  const projectPath = makeProject()
  try {
    const malformedFixtures = [
      '{"claims":[{"status":"active"}]}\n',
      '{"activeClaims":[{"owner":"builder"}]}\n',
      '{"paths":[[{"stream":"one","action":"claimed"}]]}\n',
      '[{"path":"   ","status":"active"}]\n',
      '{"claims":{"status":"active","owner":"builder"}}\n',
    ]

    for (const content of malformedFixtures) {
      writeProjectFile(projectPath, '.nightraven/file-claims.json', content)
      const catalog = buildProjectFileCatalog(projectPath)
      const canonical = catalogEntry(catalog, '.nightraven/file-claims.json')

      assert.equal(canonical.precision.blocking, true)
      assert.equal(canonical.precision.nextAction, 'Repair the canonical claim evidence before marking done.')
      assert.ok(canonical.precision.evidence.some((item) => item.includes('unsupported shape')))
      assert.equal(
        catalog.some((entry) => ['status', 'owner', 'stream', 'action'].includes(entry.sourcePath)),
        false,
      )
    }
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('canonical current-set arrays and keyed claim maps expose active paths', () => {
  const projectPath = makeProject()
  try {
    writeProjectFile(projectPath, 'src/array.ts', 'export const array = true\n')
    writeProjectFile(projectPath, 'README.md', '# Fixture\n')
    writeProjectFile(projectPath, 'Dockerfile', 'FROM scratch\n')
    commitProject(projectPath, 'add canonical shape fixtures')
    writeProjectFile(projectPath, '.nightraven/file-claims.json', '["src/array.ts"]\n')

    assert.equal(catalogEntry(buildProjectFileCatalog(projectPath), 'src/array.ts').precision.claim, 'claimed')

    writeProjectFile(
      projectPath,
      '.nightraven/file-claims.json',
      '{"claims":[["src/array.ts"],{"path":"README.md"}]}\n',
    )
    const nestedCatalog = buildProjectFileCatalog(projectPath)
    assert.equal(catalogEntry(nestedCatalog, 'src/array.ts').precision.claim, 'claimed')
    assert.equal(catalogEntry(nestedCatalog, 'README.md').precision.claim, 'claimed')

    writeProjectFile(
      projectPath,
      '.nightraven/file-claims.json',
      '{"claims":{"path":"src/array.ts","owner":"builder"}}\n',
    )
    assert.equal(catalogEntry(buildProjectFileCatalog(projectPath), 'src/array.ts').precision.claim, 'claimed')

    writeProjectFile(
      projectPath,
      '.nightraven/file-claims.json',
      '{"claims":{"path":"status","status":"active"}}\n',
    )
    assert.equal(catalogEntry(buildProjectFileCatalog(projectPath), 'status').precision.claim, 'claimed')

    writeProjectFile(projectPath, '.nightraven/file-claims.json', '{"claims":{"README.md":true,"Dockerfile":true}}\n')
    const keyedCatalog = buildProjectFileCatalog(projectPath)
    assert.equal(catalogEntry(keyedCatalog, 'README.md').precision.claim, 'claimed')
    assert.equal(catalogEntry(keyedCatalog, 'Dockerfile').precision.claim, 'claimed')
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('claimed changed paths stay unique and missing claims remain blocking', () => {
  const projectPath = makeProject()
  try {
    writeProjectFile(projectPath, 'src/changed.ts', 'export const value = 1\n')
    commitProject(projectPath, 'add changed claim target')
    writeProjectFile(projectPath, 'src/changed.ts', 'export const value = 2\n')
    writeProjectFile(
      projectPath,
      '.nightraven/file-claims.json',
      '{"claims":[{"path":"src/changed.ts"},{"path":"src/missing.ts"}]}\n',
    )

    const catalog = buildProjectFileCatalog(projectPath)
    const changedEntries = catalog.filter((entry) => entry.sourcePath === 'src/changed.ts')
    const missing = catalogEntry(catalog, 'src/missing.ts')

    assert.equal(changedEntries.length, 1)
    assert.equal(changedEntries[0].precision.changed, 'yes')
    assert.equal(changedEntries[0].precision.claim, 'claimed')
    assert.equal(missing.status, 'missing')
    assert.equal(missing.precision.blocking, true)
    assert.equal(missing.precision.nextAction, 'Release or resolve the active file claim.')
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('outside-root evidence symlinks fail closed without reviving safer aliases', async () => {
  const projectPath = makeProject()
  const externalPath = fs.mkdtempSync(path.join(os.tmpdir(), 'compass-monitor-evidence-outside-'))
  let server: ViteDevServer | undefined
  try {
    writeProjectFile(projectPath, 'docs/14_SESSION_HANDOFF.md', '# Safe legacy handoff\n')
    writeProjectFile(projectPath, 'docs/NIGHTRAVEN_REPO_OVERLAY.md', '# Overlay\n')
    writeProjectFile(projectPath, 'src/legacy.ts', 'export const legacy = true\n')
    writeProjectFile(
      projectPath,
      'AGENT_WORK_LOG.md',
      `- [CLAIMED] \`src/legacy.ts\` ${separator} stream:legacy ${separator} Codex ${separator} stale legacy claim\n`,
    )
    writeProjectFile(
      projectPath,
      'PARALLEL_RUN_STATUS.md',
      '| Stream | Agent | Scope | Status | Notes |\n| --- | --- | --- | --- | --- |\n| safe-alias | Codex | src/app.ts | passed | safe alias |\n',
    )
    commitProject(projectPath, 'add safe aliases and legacy evidence')
    stageProjectFile(projectPath, 'src/app.ts', 'export const app = true\n')

    writeProjectFile(externalPath, 'PROJECT_HANDOFF.md', '# Outside handoff\n')
    writeProjectFile(
      externalPath,
      'BUILD_LEDGER.md',
      '## [2026-08-20] Builder - outside\n- Event: FeatureBuilt\n- Files modified: src/app.ts\n',
    )
    writeProjectFile(
      externalPath,
      'AUDIT_LEDGER.md',
      '## [2026-08-20] Auditor - outside\n- Event: AuditCompleted\n- Files audited: src/app.ts\n- Findings: pass src/app.ts\n',
    )
    writeProjectFile(
      externalPath,
      'PARALLEL_RUN_STATUS.md',
      '| Stream | Agent | Scope | Status | Notes |\n| --- | --- | --- | --- | --- |\n| outside | Codex | src/app.ts | passed | outside |\n',
    )
    writeProjectFile(externalPath, 'file-claims.json', '{"claims":[]}\n')

    fs.mkdirSync(path.join(projectPath, 'docs/ledgers'), { recursive: true })
    fs.mkdirSync(path.join(projectPath, '.nightraven'), { recursive: true })
    fs.symlinkSync(path.join(externalPath, 'PROJECT_HANDOFF.md'), path.join(projectPath, 'docs/PROJECT_HANDOFF.md'))
    fs.symlinkSync(path.join(externalPath, 'BUILD_LEDGER.md'), path.join(projectPath, 'docs/ledgers/BUILD_LEDGER.md'))
    fs.symlinkSync(path.join(externalPath, 'AUDIT_LEDGER.md'), path.join(projectPath, 'docs/ledgers/AUDIT_LEDGER.md'))
    fs.symlinkSync(path.join(externalPath, 'PARALLEL_RUN_STATUS.md'), path.join(projectPath, 'docs/PARALLEL_RUN_STATUS.md'))
    fs.symlinkSync(path.join(externalPath, 'file-claims.json'), path.join(projectPath, '.nightraven/file-claims.json'))

    const catalog = buildProjectFileCatalog(projectPath)
    const handoff = catalogEntry(catalog, 'docs/PROJECT_HANDOFF.md')
    const buildLedger = catalogEntry(catalog, 'docs/ledgers/BUILD_LEDGER.md')
    const auditLedger = catalogEntry(catalog, 'docs/ledgers/AUDIT_LEDGER.md')
    const runStatus = catalogEntry(catalog, 'docs/PARALLEL_RUN_STATUS.md')
    const claims = catalogEntry(catalog, '.nightraven/file-claims.json')
    const changedSource = catalogEntry(catalog, 'src/app.ts')

    for (const evidenceSource of [handoff, buildLedger, auditLedger, runStatus, claims]) {
      assert.equal(evidenceSource.status, 'missing')
      assert.equal(evidenceSource.precision.blocking, true)
      assert.ok(evidenceSource.precision.evidence.some((item) => item.includes('outside the project')))
      assert.equal(
        evidenceSource.precision.nextAction,
        'Replace the invalid evidence source with the expected file or folder inside this project.',
      )
    }
    assert.equal(changedSource.precision.build, 'changed')
    assert.equal(changedSource.precision.audit, 'required')
    assert.equal(runStatus.precision.runStatus, 'invalid')
    assert.equal(catalog.some((entry) => entry.sourcePath === 'src/legacy.ts'), false)

    const monitor = buildProjectMonitorSnapshot(catalog, {
      handoffFound: true,
      overlayFound: true,
      tasks: [],
      blockers: [],
      decisions: [],
      auditItems: [],
    })
    assert.equal(monitor.lifecycle, 'fix_needed')
    assert.notEqual(monitor.dimensions.find((dimension) => dimension.id === 'shippingDetach')?.status, 'ready')

    const api = await startApiServer()
    server = api.server
    const projectQuery = new URLSearchParams({ path: projectPath, label: 'Containment fixture' })
    const versionQuery = new URLSearchParams({ path: projectPath })
    const snapshotVersion = await fetchJson<{ snapshotVersion: string }>(
      api.baseUrl,
      `/api/project/version?${versionQuery.toString()}`,
    )
    const snapshot = await fetchJson<ProjectSnapshot>(api.baseUrl, `/api/project?${projectQuery.toString()}`)
    assert.equal(snapshot.meta.handoffFound, false)
    assert.ok(snapshot.blockers.some((blocker) => blocker.id === 'blocker-no-handoff'))
    assert.equal(snapshot.tasks.some((task) => task.description.includes('Outside handoff')), false)
    assert.equal(snapshot.reports.some((report) => report.id === 'report-parallel-run-status'), false)
    assert.equal(snapshot.reports.some((report) => report.id === 'report-build-ledger-latest'), false)
    assert.equal(snapshot.reports.some((report) => report.id === 'report-audit-ledger-latest'), false)

    writeProjectFile(externalPath, 'PROJECT_HANDOFF.md', '# Changed outside handoff\n')
    writeProjectFile(externalPath, 'BUILD_LEDGER.md', '# Changed outside build evidence\n')
    const updatedVersion = await fetchJson<{ snapshotVersion: string }>(
      api.baseUrl,
      `/api/project/version?${versionQuery.toString()}`,
    )
    assert.equal(updatedVersion.snapshotVersion, snapshotVersion.snapshotVersion)
  } finally {
    await server?.close()
    fs.rmSync(projectPath, { recursive: true, force: true })
    fs.rmSync(externalPath, { recursive: true, force: true })
  }
})

test('safe canonical handoff wins an unsafe legacy alias in the full snapshot', async () => {
  const projectPath = makeProject()
  const externalPath = fs.mkdtempSync(path.join(os.tmpdir(), 'compass-monitor-legacy-outside-'))
  let server: ViteDevServer | undefined
  try {
    writeProjectFile(
      projectPath,
      'docs/PROJECT_HANDOFF.md',
      '## Current state / focus\nCanonical project truth. **Next:** Build the contained slice\n',
    )
    writeProjectFile(
      externalPath,
      '14_SESSION_HANDOFF.md',
      '## Current state / focus\nForeign project truth. **Next:** Import the outside task\n',
    )
    fs.symlinkSync(
      path.join(externalPath, '14_SESSION_HANDOFF.md'),
      path.join(projectPath, 'docs/14_SESSION_HANDOFF.md'),
    )

    const api = await startApiServer()
    server = api.server
    const params = new URLSearchParams({ path: projectPath, label: 'Canonical handoff fixture' })
    const snapshot = await fetchJson<ProjectSnapshot>(api.baseUrl, `/api/project?${params.toString()}`)

    assert.equal(snapshot.meta.handoffFound, true)
    assert.ok(snapshot.tasks.some((task) => task.description === 'Build the contained slice'))
    assert.equal(snapshot.tasks.some((task) => task.description.includes('outside task')), false)
    assert.ok(snapshot.memoryFeed.every((item) => item.source !== 'docs/14_SESSION_HANDOFF.md'))
    assert.equal(catalogEntry(snapshot.fileCatalog, 'docs/PROJECT_HANDOFF.md').status, 'present')
  } finally {
    await server?.close()
    fs.rmSync(projectPath, { recursive: true, force: true })
    fs.rmSync(externalPath, { recursive: true, force: true })
  }
})

test('wrong-type and unsafe-ancestor evidence sources remain blocking', () => {
  const projectPath = makeProject()
  const externalPath = fs.mkdtempSync(path.join(os.tmpdir(), 'compass-monitor-ancestor-outside-'))
  try {
    fs.mkdirSync(path.join(projectPath, 'docs'), { recursive: true })
    fs.mkdirSync(path.join(projectPath, '.evidence/scope-directory'), { recursive: true })
    fs.symlinkSync('../.evidence/scope-directory', path.join(projectPath, 'docs/PROJECT_SCOPE.md'))
    fs.symlinkSync(externalPath, path.join(projectPath, 'docs/ledgers'))

    const catalog = buildProjectFileCatalog(projectPath)
    const scope = catalogEntry(catalog, 'docs/PROJECT_SCOPE.md')
    const buildLedger = catalogEntry(catalog, 'docs/ledgers/BUILD_LEDGER.md')

    for (const evidenceSource of [scope, buildLedger]) {
      assert.equal(evidenceSource.status, 'missing')
      assert.equal(evidenceSource.precision.audit, 'fail')
      assert.equal(evidenceSource.precision.blocking, true)
      assert.ok(evidenceSource.precision.evidence.some((item) => item.includes('wrong type')))
    }
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
    fs.rmSync(externalPath, { recursive: true, force: true })
  }
})

test('contained evidence symlinks and configured aliases remain usable', () => {
  const projectPath = makeProject()
  try {
    writeProjectFile(projectPath, '.evidence/handoff.md', '# Internal handoff\n')
    writeProjectFile(
      projectPath,
      '.evidence/run-status.md',
      '|Stream|Agent|Scope|Status|Notes|\n|---|---|---|---|---|\n|inside|Codex|src/app.ts|passed|contained|\n',
    )
    fs.mkdirSync(path.join(projectPath, 'docs'), { recursive: true })
    fs.symlinkSync('../.evidence/handoff.md', path.join(projectPath, 'docs/14_SESSION_HANDOFF.md'))
    fs.symlinkSync('../.evidence/run-status.md', path.join(projectPath, 'docs/PARALLEL_RUN_STATUS.md'))

    const catalog = buildProjectFileCatalog(projectPath)
    const handoff = catalogEntry(catalog, 'docs/14_SESSION_HANDOFF.md')
    const runStatus = catalogEntry(catalog, 'docs/PARALLEL_RUN_STATUS.md')

    assert.equal(handoff.status, 'present')
    assert.ok(handoff.lastUpdated)
    assert.equal(runStatus.status, 'present')
    assert.equal(runStatus.precision.runStatus, 'passed')
    assert.equal(runStatus.precision.audit, 'not_required')
    assert.equal(runStatus.precision.blocking, false)
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('only the owning legacy stream can release an active claim', () => {
  const projectPath = makeProject()
  try {
    writeProjectFile(projectPath, 'src/owned.ts', 'export const owned = true\n')
    commitProject(projectPath, 'add owned claim target')
    const claim = `- [CLAIMED] \`src/owned.ts\` ${separator} stream:owner ${separator} 2026-08-14T00:00:00.000Z`
    const foreignRelease = `- [RELEASED] \`src/owned.ts\` ${separator} stream:other ${separator} 2026-08-14T00:01:00.000Z`
    const ownerRelease = `- [RELEASED] \`src/owned.ts\` ${separator} stream:owner ${separator} 2026-08-14T00:02:00.000Z`
    writeProjectFile(projectPath, 'AGENT_WORK_LOG.md', `${claim}\n${foreignRelease}\n`)

    assert.equal(catalogEntry(buildProjectFileCatalog(projectPath), 'src/owned.ts').precision.claim, 'claimed')

    writeProjectFile(projectPath, 'AGENT_WORK_LOG.md', `${claim}\n${foreignRelease}\n${ownerRelease}\n`)
    assert.equal(buildProjectFileCatalog(projectPath).some((entry) => entry.sourcePath === 'src/owned.ts'), false)
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('dev-server API exposes monitor file catalog and project snapshot signals', async () => {
  const projectPath = makeProject()
  let server: ViteDevServer | undefined
  try {
    writeProjectFile(projectPath, 'AGENTS.md', '# Agent instructions\n')
    writeProjectFile(
      projectPath,
      'docs/14_SESSION_HANDOFF.md',
      [
        '# Handoff',
        '',
        '## Current state / focus',
        '',
        'Compass monitor API smoke fixture. **Next:** prepare detach package.',
        '',
        '## Recent sessions',
        '- **2026-08-07** — API fixture session.',
        '',
      ].join('\n'),
    )
    writeProjectFile(projectPath, 'docs/NIGHTRAVEN_REPO_OVERLAY.md', '# Overlay\n')
    writeProjectFile(projectPath, 'docs/PROJECT_SCOPE.md', '# Scope\n')
    writeProjectFile(projectPath, 'docs/PROJECT_DECISIONS.md', '# Decisions\n')
    writeProjectFile(projectPath, 'docs/NIGHTRAVEN_ROADMAP.md', '# Roadmap\n')
    writeProjectFile(projectPath, 'PROJECT_STATE.md', '# Project State\n')
    writeProjectFile(projectPath, 'APP_FINAL_FORM_GOAL.md', '# App Final Form Goal\n')
    writeProjectFile(projectPath, '.nightraven/file-claims.json', '{"claims":[]}\n')
    writeProjectFile(projectPath, '.nightraven/manifest.yaml', 'streams: []\n')
    writeProjectFile(
      projectPath,
      'docs/PARALLEL_RUN_STATUS.md',
      [
        '_Generated 2026-08-07T12:00:00.000Z by NightRaven Orchestrator._',
        '',
        '| Stream | Agent | Scope | Status | Notes |',
        '| --- | --- | --- | --- | --- |',
        '| monitor-api | Codex | apps/compass/server/projectMonitor.test.ts | passed | api smoke passed |',
        '',
      ].join('\n'),
    )
    writeProjectFile(
      projectPath,
      'docs/ledgers/BUILD_LEDGER.md',
      [
        '## [2026-08-07] Feature Builder - monitor api smoke',
        '- Event: FeatureBuilt',
        '- Files modified: apps/compass/server/projectMonitor.test.ts',
        '',
      ].join('\n'),
    )
    commitProject(projectPath, 'api fixture')

    const api = await startApiServer()
    server = api.server
    const params = new URLSearchParams({ path: projectPath, label: 'API Fixture' })
    const files = await fetchJson<{ fileCatalog: FileCatalogEntry[] }>(
      api.baseUrl,
      `/api/project/files?${new URLSearchParams({ path: projectPath }).toString()}`,
    )
    const snapshot = await fetchJson<ProjectSnapshot>(api.baseUrl, `/api/project?${params.toString()}`)

    assert.equal(catalogEntry(files.fileCatalog, 'docs/PARALLEL_RUN_STATUS.md').precision.build, 'built')
    assert.equal(catalogEntry(snapshot.fileCatalog, 'docs/PARALLEL_RUN_STATUS.md').precision.blocking, false)
    assert.equal(snapshot.monitor.dimensions.find((dimension) => dimension.id === 'build')?.status, 'clear')
    assert.equal(snapshot.monitor.lifecycle, 'in_audit')

    writeProjectFile(
      projectPath,
      'docs/PARALLEL_RUN_STATUS.md',
      '|Stream|Agent|Scope|Status|Notes|\n|---|---|---|---|---|\n|build-ui|Codex|src/app.ts|failed|compact failure|\n',
    )
    const compactSnapshot = await fetchJson<ProjectSnapshot>(api.baseUrl, `/api/project?${params.toString()}`)
    const compactReport = compactSnapshot.reports.find((report) => report.id === 'report-parallel-run-status')
    assert.equal(compactReport?.excerpt, '1 stream row(s); 0 running; 1 failed.')

    writeProjectFile(
      projectPath,
      'docs/PARALLEL_RUN_STATUS.md',
      '|Stream|Division|Phase|State|Detail|\n|---|---|---|---|---|\n|—|—|—|—|no streams run yet|\n',
    )
    const emptySnapshot = await fetchJson<ProjectSnapshot>(api.baseUrl, `/api/project?${params.toString()}`)
    const emptyReport = emptySnapshot.reports.find((report) => report.id === 'report-parallel-run-status')
    assert.equal(emptyReport?.excerpt, '0 stream row(s); 0 running; 0 failed.')
  } finally {
    await server?.close()
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('current run-status failures drive monitor build failure and fix-needed lifecycle', () => {
  const projectPath = makeProject()
  try {
    writeProjectFile(
      projectPath,
      'docs/PARALLEL_RUN_STATUS.md',
      [
        '| Stream | Agent | Scope | Status | Notes |',
        '| --- | --- | --- | --- | --- |',
        '| build-ui | Codex | src/app.ts | failed | smoke failed |',
        '',
      ].join('\n'),
    )

    const catalog = buildProjectFileCatalog(projectPath)
    const monitor = buildProjectMonitorSnapshot(catalog, {
      handoffFound: true,
      overlayFound: true,
      tasks: [],
      blockers: [],
      decisions: [],
      auditItems: [],
    })
    const buildDimension = monitor.dimensions.find((dimension) => dimension.id === 'build')

    assert.equal(catalogEntry(catalog, 'docs/PARALLEL_RUN_STATUS.md').precision.audit, 'fail')
    assert.equal(buildDimension?.status, 'failed')
    assert.equal(monitor.lifecycle, 'fix_needed')
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('active run evidence does not mark unrelated changed files planned', () => {
  const projectPath = makeProject()
  try {
    stageProjectFile(projectPath, 'src/in-scope.ts', 'export const inScope = 1\n')
    stageProjectFile(projectPath, 'src/unrelated.ts', 'export const unrelated = 1\n')
    writeProjectFile(
      projectPath,
      'docs/PARALLEL_RUN_STATUS.md',
      [
        '| Stream | Agent | Scope | Status | Notes |',
        '| --- | --- | --- | --- | --- |',
        '| build-ui | Codex | src/in-scope.ts | running | active build |',
        '',
      ].join('\n'),
    )
    commitProject(projectPath, 'add run fixture')
    writeProjectFile(projectPath, 'src/in-scope.ts', 'export const inScope = 2\n')
    writeProjectFile(projectPath, 'src/unrelated.ts', 'export const unrelated = 2\n')

    const catalog = buildProjectFileCatalog(projectPath)
    assert.equal(catalogEntry(catalog, 'docs/PARALLEL_RUN_STATUS.md').precision.build, 'planned')
    assert.equal(catalogEntry(catalog, 'src/in-scope.ts').precision.build, 'changed')
    assert.equal(catalogEntry(catalog, 'src/unrelated.ts').precision.build, 'changed')
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('compact run-status rows remain authoritative while malformed evidence fails closed', () => {
  const projectPath = makeProject()
  try {
    writeProjectFile(
      projectPath,
      'docs/PARALLEL_RUN_STATUS.md',
      [
        '|Stream|Agent|Scope|Status|Notes|',
        '|---|---|---|---|---|',
        '|build-ui|Codex|src/app.ts|failed|compact failure|',
        '',
      ].join('\n'),
    )

    const compactCatalog = buildProjectFileCatalog(projectPath)
    const compactRunStatus = catalogEntry(compactCatalog, 'docs/PARALLEL_RUN_STATUS.md').precision
    assert.equal(compactRunStatus.audit, 'fail')
    assert.equal(compactRunStatus.runStatus, 'failed')
    assert.ok(compactRunStatus.evidence.some((item) => item.includes('1 run stream(s)') && item.includes('1 failed')))
    assert.equal(compactRunStatus.evidence.some((item) => item.includes('malformed')), false)

    const malformedFixtures = [
      '',
      '| Stream | Agent | Scope | Status | Notes |\n| --- | --- | --- | --- | --- |\n',
      '| Stream | Agent | Scope | Status | Notes |\n| --- | --- | --- | --- | --- |\n| build-ui | Codex | src/app.ts | unknown | damaged state |\n',
      '| Stream | Agent | Scope | Status | Notes |\n| --- | --- | --- | --- | --- |\n| build-ui | Codex | src/app.ts | done | noncanonical success |\n',
      '| Stream | Agent | Scope | Status | Notes |\n| --- | --- | --- | --- | --- |\n| build-ui | Codex | src/app.ts | RUNNING | uppercase state |\n',
      '| Stream | Division | Phase | State | Detail |\n| --- | --- | --- | --- | --- |\n| build-ui | builder | Phase 4 | Passed | mixed-case state |\n',
      '| build-ui | Codex | src/app.ts | passed | missing schema |\n',
      '| Stream | Agent | Scope | Status | Notes |\n| --- | --- | --- | --- | --- |\n| build-ui | Codex | src/app.ts | running | missing terminator\n',
      '| Stream | Division | Phase | State | Detail |\n| --- | --- | --- | --- | --- |\n| — | garbage | garbage | — | garbage |\n',
      '| Stream | Division | Phase | State | Detail |\n| --- | --- | --- | --- | --- |\n| — | — | — | — | no streams run yet |\n| — | — | — | — | no streams run yet |\n',
      '| Stream | Division | Phase | State | Detail |\n| --- | --- | --- | --- | --- |\n| — | — | — | — | no streams run yet |\n| build-ui | builder | Phase 4 | passed | complete |\n',
    ]

    for (const content of malformedFixtures) {
      writeProjectFile(projectPath, 'docs/PARALLEL_RUN_STATUS.md', content)
      const catalog = buildProjectFileCatalog(projectPath)
      const runStatus = catalogEntry(catalog, 'docs/PARALLEL_RUN_STATUS.md').precision
      const monitor = buildProjectMonitorSnapshot(catalog, {
        handoffFound: true,
        overlayFound: true,
        tasks: [],
        blockers: [],
        decisions: [],
        auditItems: [],
      })

      assert.equal(runStatus.audit, 'fail')
      assert.equal(runStatus.runStatus, 'invalid')
      assert.equal(runStatus.blocking, true)
      assert.equal(runStatus.nextAction, 'Repair the current run-status evidence before marking done.')
      assert.ok(runStatus.evidence.some((item) => item.includes('malformed')))
      const buildDimension = monitor.dimensions.find((dimension) => dimension.id === 'build')
      assert.equal(buildDimension?.status, 'failed')
      assert.equal(buildDimension?.detail, 'Current run status evidence is invalid and must be repaired.')
      assert.ok(buildDimension?.evidence.includes('Run status evidence is invalid'))
      assert.equal(monitor.lifecycle, 'fix_needed')
    }

    writeProjectFile(
      projectPath,
      'docs/PARALLEL_RUN_STATUS.md',
      '|Stream|Division|Phase|State|Detail|\n|---|---|---|---|---|\n|—|—|—|—|no streams run yet|\n',
    )
    const emptyState = catalogEntry(
      buildProjectFileCatalog(projectPath),
      'docs/PARALLEL_RUN_STATUS.md',
    ).precision
    assert.notEqual(emptyState.audit, 'fail')
    assert.equal(emptyState.runStatus, 'empty')
    assert.ok(emptyState.evidence.some((item) => item.startsWith('0 run stream(s)')))

    writeProjectFile(
      projectPath,
      'docs/PARALLEL_RUN_STATUS.md',
      '| Stream | Division | Phase | State | Detail |\n| --- | --- | --- | --- | --- |\n| build-ui | builder | Phase 4 | passed | complete |\n',
    )
    writeProjectFile(
      projectPath,
      'docs/ledgers/AUDIT_LEDGER.md',
      '## [2026-08-20] Auditor - run status file\n- Event: AuditCompleted\n- Files audited: docs/PARALLEL_RUN_STATUS.md\n- Findings: fail docs/PARALLEL_RUN_STATUS.md\n',
    )
    commitProject(projectPath, 'add passed run with failing file audit')
    writeProjectFile(
      projectPath,
      'docs/PARALLEL_RUN_STATUS.md',
      '| Stream | Division | Phase | State | Detail |\n| --- | --- | --- | --- | --- |\n| build-ui | builder | Phase 4 | passed | complete |\n\n',
    )
    const auditedCatalog = buildProjectFileCatalog(projectPath)
    const auditedRunStatus = catalogEntry(auditedCatalog, 'docs/PARALLEL_RUN_STATUS.md').precision
    const auditedMonitor = buildProjectMonitorSnapshot(auditedCatalog, {
      handoffFound: true,
      overlayFound: true,
      tasks: [],
      blockers: [],
      decisions: [],
      auditItems: [],
    })
    const auditedBuild = auditedMonitor.dimensions.find((dimension) => dimension.id === 'build')
    assert.equal(auditedRunStatus.runStatus, 'passed')
    assert.equal(auditedRunStatus.audit, 'fail', auditedRunStatus.evidence.join(' | '))
    assert.notEqual(auditedBuild?.status, 'failed')
    assert.notEqual(auditedBuild?.detail, 'Current run status has failed stream evidence.')
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('latest ledger entries override older started and failed evidence for a changed file', () => {
  const projectPath = makeProject()
  try {
    stageProjectFile(projectPath, 'src/app.ts', 'export const app = true\n')
    writeProjectFile(
      projectPath,
      'docs/ledgers/BUILD_LEDGER.md',
      [
        '## [2026-08-05] Feature Builder - old start',
        '- Event: BuildStarted',
        '- Files modified: src/app.ts',
        '',
        '## [2026-08-05] Feature Builder - done',
        '- Event: FeatureBuilt',
        '- Files modified: src/app.ts',
        '',
      ].join('\n'),
    )
    writeProjectFile(
      projectPath,
      'docs/ledgers/AUDIT_LEDGER.md',
      [
        '## [2026-08-05] General Auditor - old failure',
        '- Event: AuditCompleted',
        '- Findings: fail src/app.ts',
        '',
        '## [2026-08-05] General Auditor - pass',
        '- Event: AuditCompleted',
        '- Findings: pass src/app.ts',
        '',
      ].join('\n'),
    )

    const entry = catalogEntry(buildProjectFileCatalog(projectPath), 'src/app.ts')

    assert.equal(entry.precision.build, 'built')
    assert.equal(entry.precision.audit, 'pass')
    assert.equal(entry.precision.blocking, false)

    writeProjectFile(
      projectPath,
      'docs/ledgers/AUDIT_LEDGER.md',
      [
        '## [2026-08-05] General Auditor - unresolved app failure',
        '- Event: AuditCompleted',
        '- Files reviewed: src/app.ts',
        '- Findings: no tests because failures remain',
        '',
      ].join('\n'),
    )
    const unresolved = catalogEntry(buildProjectFileCatalog(projectPath), 'src/app.ts')
    assert.equal(unresolved.precision.audit, 'fail')
    assert.equal(unresolved.precision.blocking, true)

    writeProjectFile(
      projectPath,
      'docs/ledgers/AUDIT_LEDGER.md',
      [
        '## [2026-08-05] General Auditor - causal failure wording',
        '- Event: AuditCompleted',
        '- Files reviewed: src/app.ts',
        '- Findings: no tests since failures',
        '',
      ].join('\n'),
    )
    const causal = catalogEntry(buildProjectFileCatalog(projectPath), 'src/app.ts')
    assert.equal(causal.precision.audit, 'fail')
    assert.equal(causal.precision.blocking, true)
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('ledger evidence does not cross-match a longer path with the same prefix', () => {
  const projectPath = makeProject()
  try {
    stageProjectFile(projectPath, 'src/app.ts', 'export const app = true\n')
    writeProjectFile(
      projectPath,
      'docs/ledgers/BUILD_LEDGER.md',
      [
        '## [2026-08-05] Feature Builder - different file',
        '- Event: FeatureBuilt',
        '- Files modified: src/app.tsx',
        '',
      ].join('\n'),
    )
    writeProjectFile(
      projectPath,
      'docs/ledgers/AUDIT_LEDGER.md',
      [
        '## [2026-08-05] General Auditor - different file',
        '- Event: AuditCompleted',
        '- Findings: pass src/app.tsx',
        '',
      ].join('\n'),
    )

    const entry = catalogEntry(buildProjectFileCatalog(projectPath), 'src/app.ts')

    assert.equal(entry.precision.build, 'changed')
    assert.equal(entry.precision.audit, 'required')
    assert.equal(entry.precision.blocking, true)
    assert.ok(!entry.precision.evidence.includes('build ledger mentions this path'))
    assert.ok(!entry.precision.evidence.includes('audit ledger mentions this path'))
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('ledger evidence fails closed for longer filenames with spaces or punctuation', () => {
  for (const longerPath of ['src/app.ts copy', 'src/app.ts#notes', 'src/app.ts[old]']) {
    const projectPath = makeProject()
    try {
      stageProjectFile(projectPath, 'src/app.ts', 'export const app = true\n')
      writeProjectFile(
        projectPath,
        'docs/ledgers/BUILD_LEDGER.md',
        [
          '## [2026-08-05] Feature Builder - different file',
          '- Event: FeatureBuilt',
          `- Files modified: ${longerPath}`,
          '',
        ].join('\n'),
      )
      writeProjectFile(
        projectPath,
        'docs/ledgers/AUDIT_LEDGER.md',
        [
          '## [2026-08-05] General Auditor - different file',
          '- Event: AuditCompleted',
          `- Findings: pass ${longerPath}`,
          '',
        ].join('\n'),
      )

      const entry = catalogEntry(buildProjectFileCatalog(projectPath), 'src/app.ts')

      assert.equal(entry.precision.build, 'changed', longerPath)
      assert.equal(entry.precision.audit, 'required', longerPath)
      assert.equal(entry.precision.blocking, true, longerPath)
    } finally {
      fs.rmSync(projectPath, { recursive: true, force: true })
    }
  }
})

test('unrelated latest build evidence cannot mark a changed file built', () => {
  const projectPath = makeProject()
  try {
    stageProjectFile(projectPath, 'src/app.ts', 'export const app = true\n')
    writeProjectFile(
      projectPath,
      'docs/ledgers/BUILD_LEDGER.md',
      [
        '## [2026-08-05] Feature Builder - unrelated completion',
        '- Event: FeatureBuilt',
        '- Files modified: src/other.ts',
        '',
      ].join('\n'),
    )

    const entry = catalogEntry(buildProjectFileCatalog(projectPath), 'src/app.ts')

    assert.equal(entry.precision.build, 'changed')
    assert.equal(entry.precision.blocking, true)
    assert.ok(entry.precision.evidence.includes('latest build ledger event: FeatureBuilt'))
    assert.ok(!entry.precision.evidence.includes('build ledger mentions this path'))
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('narrative ledger mentions cannot prove a changed file complete', () => {
  const projectPath = makeProject()
  try {
    stageProjectFile(projectPath, 'src/app.ts', 'export const app = true\n')
    writeProjectFile(
      projectPath,
      'docs/ledgers/BUILD_LEDGER.md',
      [
        '## [2026-08-05] Feature Builder - unrelated completion',
        '- Event: FeatureBuilt',
        '- Files modified: src/other.ts',
        '- Excluded path: src/app.ts',
        '- Reasoning: No changes were made to `src/app.ts`.',
        '',
      ].join('\n'),
    )
    writeProjectFile(
      projectPath,
      'docs/ledgers/AUDIT_LEDGER.md',
      [
        '## [2026-08-05] General Auditor - unrelated audit',
        '- Event: AuditCompleted',
        '- Findings: pass src/other.ts',
        '- Not audited: src/app.ts',
        '- Recommendations: Audit `src/app.ts` in a later slice.',
        '',
      ].join('\n'),
    )

    const entry = catalogEntry(buildProjectFileCatalog(projectPath), 'src/app.ts')

    assert.equal(entry.precision.build, 'changed')
    assert.equal(entry.precision.audit, 'required')
    assert.equal(entry.precision.blocking, true)
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('mixed audit findings preserve each file path outcome', () => {
  const projectPath = makeProject()
  try {
    stageProjectFile(projectPath, 'src/app.ts', 'export const app = true\n')
    stageProjectFile(projectPath, 'src/other.ts', 'export const other = true\n')
    writeProjectFile(
      projectPath,
      'docs/ledgers/BUILD_LEDGER.md',
      [
        '## [2026-08-05] Feature Builder - both files',
        '- Event: FeatureBuilt',
        '- Files modified: src/app.ts; src/other.ts',
        '',
      ].join('\n'),
    )
    writeProjectFile(
      projectPath,
      'docs/ledgers/AUDIT_LEDGER.md',
      [
        '## [2026-08-05] General Auditor - mixed findings',
        '- Event: AuditCompleted',
        '- Findings: pass src/app.ts; fail src/other.ts',
        '',
      ].join('\n'),
    )

    const catalog = buildProjectFileCatalog(projectPath)
    const passing = catalogEntry(catalog, 'src/app.ts')
    const failing = catalogEntry(catalog, 'src/other.ts')

    assert.equal(passing.precision.audit, 'pass')
    assert.equal(passing.precision.blocking, false)
    assert.equal(failing.precision.audit, 'fail')
    assert.equal(failing.precision.blocking, true)
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('blocking and pending audit outcomes do not pass file-level gates', () => {
  const cases: Array<{ status: string; expected: 'fail' | 'required' }> = [
    { status: 'needs_user_decision', expected: 'fail' },
    { status: 'scope_creep', expected: 'fail' },
    { status: 'pending', expected: 'required' },
  ]

  for (const auditCase of cases) {
    const projectPath = makeProject()
    try {
      stageProjectFile(projectPath, 'src/app.ts', 'export const app = true\n')
      writeProjectFile(
        projectPath,
        'docs/ledgers/BUILD_LEDGER.md',
        [
          '## [2026-08-05] Feature Builder - app',
          '- Event: FeatureBuilt',
          '- Files modified: src/app.ts',
          '',
        ].join('\n'),
      )
      writeProjectFile(
        projectPath,
        'docs/ledgers/AUDIT_LEDGER.md',
        [
          '## [2026-08-05] General Auditor - app',
          '- Event: AuditCompleted',
          '- Files reviewed: src/app.ts',
          `- Findings: ${auditCase.status} src/app.ts`,
          '',
        ].join('\n'),
      )

      const entry = catalogEntry(buildProjectFileCatalog(projectPath), 'src/app.ts')

      assert.equal(entry.precision.audit, auditCase.expected, auditCase.status)
      assert.equal(entry.precision.blocking, true, auditCase.status)
    } finally {
      fs.rmSync(projectPath, { recursive: true, force: true })
    }
  }
})

test('negated audit failure prose does not block a reviewed file', () => {
  const projectPath = makeProject()
  try {
    stageProjectFile(projectPath, 'src/app.ts', 'export const app = true\n')
    writeProjectFile(
      projectPath,
      'docs/ledgers/BUILD_LEDGER.md',
      [
        '## [2026-08-05] Feature Builder - app',
        '- Event: FeatureBuilt',
        '- Files modified: src/app.ts',
        '',
      ].join('\n'),
    )
    writeProjectFile(
      projectPath,
      'docs/ledgers/AUDIT_LEDGER.md',
      [
        '## [2026-08-05] General Auditor - app',
        '- Event: AuditCompleted',
        '- Files reviewed: src/app.ts',
        '- Findings: no browser runtime test failures',
        '',
      ].join('\n'),
    )

    const entry = catalogEntry(buildProjectFileCatalog(projectPath), 'src/app.ts')

    assert.equal(entry.precision.audit, 'pass')
    assert.equal(entry.precision.blocking, false)
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('monitor snapshot exposes stable Files, Runs, and Detach page signals', () => {
  const projectPath = makeProject()
  try {
    writeProjectFile(projectPath, 'AGENTS.md', '# Agent instructions\n')
    writeProjectFile(projectPath, 'docs/14_SESSION_HANDOFF.md', '# Handoff\n\n## Current state / focus\n\nReady.\n')
    writeProjectFile(projectPath, 'docs/NIGHTRAVEN_REPO_OVERLAY.md', '# Overlay\n')
    writeProjectFile(projectPath, 'docs/PROJECT_SCOPE.md', '# Scope\n')
    writeProjectFile(projectPath, 'docs/PROJECT_DECISIONS.md', '# Decisions\n')
    writeProjectFile(projectPath, 'docs/NIGHTRAVEN_ROADMAP.md', '# Roadmap\n')
    writeProjectFile(projectPath, 'docs/02_ENGINEERING_CHANGELOG.md', '# Changelog\n')
    writeProjectFile(projectPath, 'docs/04_LEARNING_LOG.md', '# Learning\n')
    writeProjectFile(projectPath, 'PROJECT_STATE.md', '# Project State\n')
    writeProjectFile(projectPath, 'APP_FINAL_FORM_GOAL.md', '# App Final Form Goal\n')
    writeProjectFile(projectPath, '.nightraven/file-claims.json', '{"claims":[]}\n')
    writeProjectFile(
      projectPath,
      'docs/PARALLEL_RUN_STATUS.md',
      [
        '_Generated 2026-08-05T12:00:00.000Z by NightRaven Orchestrator._',
        '',
        '| Stream | Agent | Scope | Status | Notes |',
        '| --- | --- | --- | --- | --- |',
        '| monitor-smoke | Codex | apps/compass/server/projectMonitor.test.ts | passed | smoke passed |',
        '',
      ].join('\n'),
    )
    writeProjectFile(
      projectPath,
      'docs/ledgers/BUILD_LEDGER.md',
      [
        '## [2026-08-05] Feature Builder - monitor smoke',
        '- Event: FeatureBuilt',
        '- Files modified: apps/compass/server/projectMonitor.test.ts',
        '',
      ].join('\n'),
    )
    writeProjectFile(
      projectPath,
      'docs/ledgers/AUDIT_LEDGER.md',
      [
        '## [2026-08-05] General Auditor - monitor smoke',
        '- Event: AuditCompleted',
        '- Findings: pass',
        '',
      ].join('\n'),
    )
    commitProject(projectPath, 'fixture')

    const catalog = buildProjectFileCatalog(projectPath)
    const monitor = buildProjectMonitorSnapshot(catalog, {
      handoffFound: true,
      overlayFound: true,
      tasks: [],
      blockers: [],
      decisions: [],
      auditItems: [],
    })
    const nextMove = buildNextMove(monitor)
    const runPrecision = dimensionStatus(catalog, 'docs/PARALLEL_RUN_STATUS.md')

    assert.equal(runPrecision.build, 'built')
    assert.equal(runPrecision.audit, 'not_required')
    assert.equal(catalogEntry(catalog, 'docs/PARALLEL_RUN_STATUS.md').precision.blocking, false)
    assert.equal(monitor.dimensions.find((dimension) => dimension.id === 'build')?.status, 'clear')
    assert.equal(monitor.dimensions.find((dimension) => dimension.id === 'shippingDetach')?.status, 'ready')
    assert.equal(monitor.lifecycle, 'ready_to_detach')
    assert.equal(nextMove.action, 'Prepare detach package')

    for (const status of ['pending', 'running']) {
      writeProjectFile(
        projectPath,
        'docs/PARALLEL_RUN_STATUS.md',
        [
          '| Stream | Agent | Scope | Status | Notes |',
          '| --- | --- | --- | --- | --- |',
          `| monitor-smoke | Codex | apps/compass/server/projectMonitor.test.ts | ${status} | smoke active |`,
          '',
        ].join('\n'),
      )
      commitProject(projectPath, `${status} run fixture`)

      const activeCatalog = buildProjectFileCatalog(projectPath)
      const activeMonitor = buildProjectMonitorSnapshot(activeCatalog, {
        handoffFound: true,
        overlayFound: true,
        tasks: [],
        blockers: [],
        decisions: [],
        auditItems: [],
      })

      assert.equal(catalogEntry(activeCatalog, 'docs/PARALLEL_RUN_STATUS.md').precision.build, 'planned')
      assert.equal(activeMonitor.dimensions.find((dimension) => dimension.id === 'shippingDetach')?.status, 'watch')
      assert.equal(activeMonitor.lifecycle, 'in_build')
    }
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('stale handoff memory blocks detach even when all other evidence is clear', () => {
  const projectPath = makeProject()
  try {
    for (const [relativePath, content] of [
      ['AGENTS.md', '# Agent instructions\n'],
      ['docs/14_SESSION_HANDOFF.md', '# Handoff\n'],
      ['docs/NIGHTRAVEN_REPO_OVERLAY.md', '# Overlay\n'],
      ['docs/PROJECT_SCOPE.md', '# Scope\n'],
      ['docs/PROJECT_DECISIONS.md', '# Decisions\n'],
      ['docs/NIGHTRAVEN_ROADMAP.md', '# Roadmap\n'],
      ['docs/02_ENGINEERING_CHANGELOG.md', '# Changelog\n'],
      ['docs/04_LEARNING_LOG.md', '# Learning\n'],
      ['PROJECT_STATE.md', '# Project State\n'],
      ['APP_FINAL_FORM_GOAL.md', '# App Final Form Goal\n'],
      ['.nightraven/file-claims.json', '{"claims":[]}\n'],
      ['docs/PARALLEL_RUN_STATUS.md', '| Stream | Agent | Scope | Status | Notes |\n| --- | --- | --- | --- | --- |\n| monitor | Codex | test | passed | done |\n'],
      ['docs/ledgers/BUILD_LEDGER.md', '## [2026-08-05] Feature Builder - done\n- Event: FeatureBuilt\n'],
      ['docs/ledgers/AUDIT_LEDGER.md', '## [2026-08-05] Auditor - pass\n- Event: AuditCompleted\n- Findings: pass\n'],
    ] as const) writeProjectFile(projectPath, relativePath, content)
    commitProject(projectPath, 'fixture')
    const handoffPath = path.join(projectPath, 'docs/14_SESSION_HANDOFF.md')
    const stale = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    fs.utimesSync(handoffPath, stale, stale)

    const catalog = buildProjectFileCatalog(projectPath)
    const monitor = buildProjectMonitorSnapshot(catalog, {
      handoffFound: true,
      overlayFound: true,
      tasks: [],
      blockers: [],
      decisions: [],
      auditItems: [],
    })

    assert.equal(monitor.dimensions.find((dimension) => dimension.id === 'memory')?.status, 'watch')
    assert.equal(monitor.dimensions.find((dimension) => dimension.id === 'shippingDetach')?.status, 'watch')
    assert.notEqual(monitor.lifecycle, 'ready_to_detach')
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('invalid handoff freshness evidence blocks detach instead of failing open', () => {
  const projectPath = makeProject()
  try {
    writeProjectFile(projectPath, 'docs/14_SESSION_HANDOFF.md', '# Handoff\n')
    writeProjectFile(projectPath, 'docs/NIGHTRAVEN_REPO_OVERLAY.md', '# Overlay\n')
    writeProjectFile(projectPath, 'docs/PROJECT_SCOPE.md', '# Scope\n')
    writeProjectFile(projectPath, 'docs/PROJECT_DECISIONS.md', '# Decisions\n')
    writeProjectFile(projectPath, 'docs/ledgers/BUILD_LEDGER.md', '## [2026-08-16] Build\n- Event: FeatureBuilt\n')
    writeProjectFile(projectPath, 'docs/ledgers/AUDIT_LEDGER.md', '## [2026-08-16] Audit\n- Event: AuditCompleted\n')
    const catalog = buildProjectFileCatalog(projectPath)
    catalogEntry(catalog, 'docs/14_SESSION_HANDOFF.md').lastUpdated = 'not-a-date'
    const monitor = buildProjectMonitorSnapshot(catalog, {
      handoffFound: true,
      overlayFound: true,
      tasks: [],
      blockers: [],
      decisions: [],
      auditItems: [],
    })

    const memory = monitor.dimensions.find((dimension) => dimension.id === 'memory')
    assert.equal(memory?.status, 'watch')
    assert.match(memory?.detail ?? '', /invalid/)
    assert.notEqual(monitor.lifecycle, 'ready_to_detach')
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})

test('missing attach and align memory blocks scope and detach progression', () => {
  const projectPath = makeProject()
  try {
    writeProjectFile(projectPath, 'AGENTS.md', '# Agent instructions\n')
    writeProjectFile(projectPath, 'docs/14_SESSION_HANDOFF.md', '# Handoff\n\n## Current state / focus\n\nMissing memory fixture.\n')
    writeProjectFile(projectPath, 'docs/NIGHTRAVEN_ROADMAP.md', '# Roadmap\n')
    writeProjectFile(projectPath, 'docs/02_ENGINEERING_CHANGELOG.md', '# Changelog\n')
    writeProjectFile(projectPath, 'docs/04_LEARNING_LOG.md', '# Learning\n')
    writeProjectFile(projectPath, 'PROJECT_STATE.md', '# Project State\n')
    writeProjectFile(projectPath, 'APP_FINAL_FORM_GOAL.md', '# App Final Form Goal\n')
    writeProjectFile(projectPath, '.nightraven/file-claims.json', '{"claims":[]}\n')
    writeProjectFile(
      projectPath,
      'docs/PARALLEL_RUN_STATUS.md',
      [
        '| Stream | Agent | Scope | Status | Notes |',
        '| --- | --- | --- | --- | --- |',
        '| monitor-memory | Codex | apps/compass/server/projectMonitor.test.ts | passed | smoke passed |',
        '',
      ].join('\n'),
    )
    writeProjectFile(
      projectPath,
      'docs/ledgers/BUILD_LEDGER.md',
      [
        '## [2026-08-08] Feature Builder - missing memory smoke',
        '- Event: FeatureBuilt',
        '- Files modified: apps/compass/server/projectMonitor.test.ts',
        '',
      ].join('\n'),
    )
    commitProject(projectPath, 'missing memory fixture')

    const catalog = buildProjectFileCatalog(projectPath)
    const monitor = buildProjectMonitorSnapshot(catalog, {
      handoffFound: true,
      overlayFound: false,
      tasks: [],
      blockers: [],
      decisions: [],
      auditItems: [],
    })
    const nextMove = buildNextMove(monitor)

    assert.equal(catalogEntry(catalog, 'docs/NIGHTRAVEN_REPO_OVERLAY.md').status, 'missing')
    assert.equal(catalogEntry(catalog, 'docs/PROJECT_SCOPE.md').status, 'missing')
    assert.equal(catalogEntry(catalog, 'docs/PROJECT_DECISIONS.md').status, 'missing')
    assert.ok(monitor.missingRequiredFiles.some((entry) => entry.sourcePath === 'docs/NIGHTRAVEN_REPO_OVERLAY.md'))
    assert.equal(monitor.dimensions.find((dimension) => dimension.id === 'scope')?.status, 'blocked')
    assert.equal(monitor.dimensions.find((dimension) => dimension.id === 'shippingDetach')?.status, 'watch')
    assert.equal(monitor.lifecycle, 'attached')
    assert.equal(nextMove.action, 'Clear scope blocker')
    assert.match(nextMove.reason, /required attach\/align file\(s\) are missing/)
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }
})
