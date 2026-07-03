// NightRaven Orchestrator CLI — reads a Unified Manifest, runs the foundation +
// build pipeline with LM Studio as the brain, and updates the manifest's status doc
// and ledgers. This is the "make it an app" surface: apps/planner/src/index.ts
// remains the original deterministic dry-run demo; this is the manifest-driven,
// LLM-backed, coordination-aware runtime.
//
// Usage:
//   npm run orchestrate -- --manifest <path> [--spec <path.json>] [--approve] [--stream <id>]
//
// Without --approve, the orchestrator stops after Phase 0 (layout planning) and never
// runs Research → Architecture → Review → Build.
// When the full pipeline does run, Planner/Researcher/Architect can fall back to their
// deterministic stubs if LM Studio is unreachable. Builder does not fabricate fallback
// proposals: it reports the missing brain honestly and writes nothing.

import { dirname, join, resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { AppFoundationFlow } from './flows/AppFoundationFlow.js'
import type { AppSpec } from './types/agent.js'
import { logger } from './utils/logger.js'
import { LmStudioClient } from './llm/lmStudioClient.js'
import { loadManifest } from './manifest/loadManifest.js'
import { claimPath, releasePath } from './coordination/claimFile.js'
import { writeStatusDoc, type StreamStatus } from './coordination/statusDoc.js'
import { appendBuildLedgerEntry } from './coordination/ledger.js'

function parseArgs(argv: string[]) {
  const get = (flag: string) => {
    const i = argv.indexOf(flag)
    return i >= 0 ? argv[i + 1] : undefined
  }
  return {
    manifestPath: get('--manifest'),
    specPath: get('--spec'),
    approve: argv.includes('--approve'),
    streamId: get('--stream') ?? 'main',
  }
}

async function loadSpec(specPath: string | undefined, manifestRoot: string, projectName: string): Promise<AppSpec> {
  if (specPath) {
    const raw = JSON.parse(await readFile(specPath, 'utf8'))
    return raw as AppSpec
  }
  return {
    name: projectName,
    intent: `Foundation + build pass orchestrated from manifest at ${manifestRoot}`,
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.manifestPath) {
    logger.error('flow', 'Usage: orchestrate --manifest <path> [--spec <path.json>] [--approve] [--stream <id>]')
    process.exit(2)
  }

  const { manifest, path: manifestPath } = await loadManifest(args.manifestPath)
  const manifestDir = dirname(resolve(manifestPath))
  // Manifest paths (coordination.claim_file, ledgers.*, monitor.status_doc) are relative
  // to the project root — the directory the manifest's .nightraven/ folder lives under.
  const projectRoot = resolve(manifestDir, '..')
  const resolvePath = (p: string) => join(projectRoot, p)

  logger.phase('flow', '=== NightRaven Orchestrator ===', {
    manifest: manifestPath,
    orchestrator: manifest.orchestrator.name,
    complexity: manifest.orchestrator.complexity,
    stream: args.streamId,
  })

  const llm = new LmStudioClient()
  const flow = new AppFoundationFlow(llm)

  const spec = await loadSpec(args.specPath, projectRoot, manifest.framework.label ?? manifest.framework.name)

  const streams: StreamStatus[] = []
  const statusDocPath = resolvePath(manifest.monitor.status_doc)
  const claimLogPath = resolvePath(manifest.coordination.claim_file)
  const generatedAt = new Date().toISOString()

  const recordAndFlush = async () => {
    await writeStatusDoc(statusDocPath, manifest.framework.label ?? manifest.framework.name, streams, generatedAt)
  }

  streams.push({ streamId: args.streamId, division: 'planner', phase: 'Phase 0', state: 'running' })
  await recordAndFlush()

  let state = await flow.planLayout(spec)
  streams[streams.length - 1].state = 'passed'
  streams[streams.length - 1].detail = `${state.layout?.modules.length} modules`
  await recordAndFlush()

  if (!args.approve) {
    logger.warn('flow', 'Dry-run: pass --approve to run Research → Architecture → Review → Build')
    return
  }

  state = { ...state, approved: true }

  streams.push({ streamId: args.streamId, division: 'researcher+architect+auditor', phase: 'Phase 1-3', state: 'running' })
  await recordAndFlush()

  state = await flow.runPipeline(state)
  streams[streams.length - 1].state = state.review?.passed ? 'passed' : 'failed'
  streams[streams.length - 1].detail = `coverage ${state.review?.coveragePercent}% · ${state.review?.findings.length} findings`
  await recordAndFlush()

  if (!state.review?.passed) {
    logger.warn('flow', 'Review gate failed — stopping before Build (fix findings and re-run)')
    return
  }

  streams.push({ streamId: args.streamId, division: 'builder', phase: 'Phase 4', state: 'running' })
  await recordAndFlush()

  state = await flow.runBuild(state, {
    approve: args.approve,
    targetDir: projectRoot,
    streamId: args.streamId,
    claimHooks: {
      claim: (path) => claimPath(claimLogPath, path, args.streamId, 'orchestrator build phase'),
      release: (path) => releasePath(claimLogPath, path, args.streamId),
    },
  })

  const build = state.build!
  streams[streams.length - 1].state = build.filesFailed.length ? 'failed' : 'passed'
  streams[streams.length - 1].detail = `${build.filesWritten.length} written · ${build.filesFailed.length} failed · ${build.note}`
  await recordAndFlush()

  if (build.applied) {
    await appendBuildLedgerEntry(resolvePath(manifest.ledgers.build), {
      date: generatedAt.slice(0, 10),
      agent: 'BuilderAgent',
      task: spec.name,
      event: build.filesFailed.length ? 'BuildStarted' : 'FeatureBuilt',
      actionsPerformed: build.note,
      filesCreated: build.filesWritten,
      filesModified: [],
      dependenciesAdded: [],
      reasoning: `MVP scope: ${state.architecture?.mvpScope.map((m) => m.name).join(', ')}`,
      confidence: build.filesFailed.length ? 40 : 80,
    })
  }

  logger.phase('flow', '=== Orchestrator run complete ===', {
    passed: state.review?.passed,
    built: build.applied,
    statusDoc: statusDocPath,
  })
}

main().catch((err) => {
  logger.error('flow', String(err))
  process.exit(1)
})
