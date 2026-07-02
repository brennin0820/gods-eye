// Writes the manifest's monitor.status_doc (e.g. docs/PARALLEL_RUN_STATUS.md) — a
// full-rewrite snapshot (not append-only; this is live run state, not memory history).

import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

export type StreamStatus = {
  streamId: string
  division: string
  phase: string
  state: 'pending' | 'running' | 'passed' | 'failed'
  detail?: string
}

export function renderStatusDoc(project: string, streams: StreamStatus[], generatedAt: string): string {
  const rows = streams
    .map((s) => `| ${s.streamId} | ${s.division} | ${s.phase} | ${s.state} | ${s.detail ?? ''} |`)
    .join('\n')
  return [
    `# Parallel run status — ${project}`,
    '',
    `_Generated ${generatedAt} by NightRaven Orchestrator. Overwritten each run — not append-only._`,
    '',
    '| Stream | Division | Phase | State | Detail |',
    '|--------|----------|-------|-------|--------|',
    rows || '| — | — | — | — | no streams run yet |',
    '',
  ].join('\n')
}

export async function writeStatusDoc(
  statusDocPath: string,
  project: string,
  streams: StreamStatus[],
  generatedAt: string,
): Promise<void> {
  await mkdir(dirname(statusDocPath), { recursive: true })
  await writeFile(statusDocPath, renderStatusDoc(project, streams, generatedAt), 'utf8')
}
