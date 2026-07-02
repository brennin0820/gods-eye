// Cross-project status tracker — reads scripts/nightraven-projects.conf and reports each
// registered workspace's availability, handoff focus, manifest presence, and ledger
// activity. Metadata only (Bible §2.6) — never imports another project's memory content.
//
// Usage: npm run status [-- --registry <path>]

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { findRepoRoot } from './llm/findRepoRoot.js'
import { parseRegistry } from './tracker/registry.js'
import { getProjectStatus } from './tracker/projectStatus.js'
import { logger } from './utils/logger.js'

function parseArgs(argv: string[]) {
  const i = argv.indexOf('--registry')
  return { registryPath: i >= 0 ? argv[i + 1] : undefined }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const registryPath = args.registryPath ?? join(await findRepoRoot(process.cwd()), 'scripts/nightraven-projects.conf')

  const content = await readFile(registryPath, 'utf8')
  const entries = parseRegistry(content)

  logger.phase('flow', '=== NightRaven project tracker ===', { registry: registryPath, count: entries.length })

  const rows: string[] = []
  for (const entry of entries) {
    const status = await getProjectStatus(entry)
    rows.push(
      [
        status.available ? '✓' : '✗',
        entry.role.padEnd(12),
        entry.label,
        status.manifestPath ? 'manifest' : '—',
        `build:${status.buildLedgerEntries}`,
        `audit:${status.auditLedgerEntries}`,
        status.focus ? status.focus.slice(0, 80) : '',
      ].join('  '),
    )
  }

  // eslint-disable-next-line no-console
  console.log(rows.join('\n'))
}

main().catch((err) => {
  logger.error('flow', String(err))
  process.exit(1)
})
