import type { AppSpec, LayoutPlan, ArchitectureOutput, BuildOutput, FileChangeProposal, AgentResult } from '../types/agent.js'
import { logger } from '../utils/logger.js'
import { getToolsForDivision, type DivisionName } from '../tools/registry.js'
import type { AgentTool } from '../tools/AgentTool.js'
import type { LmStudioClient } from '../llm/lmStudioClient.js'
import { askDivisionBrain, LmStudioUnreachableError, LlmBrainOutputError } from '../llm/llmBrain.js'
import { BuildProposalsSchema } from '../llm/schemas.js'
import type { ClaimResult } from '../coordination/claimFile.js'

export type ClaimHooks = {
  claim: (path: string) => Promise<ClaimResult>
  release: (path: string) => Promise<void>
}

/**
 * Builder division — the pipeline's implement step (DIVISION_REGISTRY known gap,
 * closed here). Full tool belt (bash, file_read/write/edit, glob, grep), but writes
 * are gated the same way index.ts gates Phase 1-3: nothing touches disk without
 * approve:true. Without a reachable LM Studio brain, Builder proposes nothing rather
 * than fabricating scaffold code — "no invented output" over "plausible garbage".
 */
export class BuilderAgent {
  readonly role = 'builder' as const
  readonly division: DivisionName = 'builder'
  readonly tools: AgentTool[]
  private readonly llm?: LmStudioClient

  constructor(llm?: LmStudioClient) {
    this.tools = getToolsForDivision(this.division)
    this.llm = llm
    logger.info('builder', 'Tool belt loaded', { tools: this.tools.map((t) => t.name) })
  }

  async run(
    spec: AppSpec,
    layout: LayoutPlan,
    architecture: ArchitectureOutput,
    opts: { approve: boolean; targetDir: string; claimHooks?: ClaimHooks; streamId?: string },
  ): Promise<AgentResult<BuildOutput>> {
    const start = Date.now()
    logger.phase('builder', 'Phase 4 — implementing MVP scope', {
      mvpModules: architecture.mvpScope.map((m) => m.name),
    })

    let proposals: FileChangeProposal[] = []
    let note: string

    if (!this.llm) {
      note = 'No LM Studio brain configured — Builder requires an LM Studio client to propose changes. Run through orchestrate with LM Studio available.'
    } else {
      try {
        const result = await askDivisionBrain(
          this.llm,
          this.division,
          this.buildTask(spec, layout, architecture, opts.targetDir),
          BuildProposalsSchema,
        )
        proposals = result.proposals
        note = proposals.length
          ? `${proposals.length} file change(s) proposed by LM Studio brain.`
          : 'LM Studio brain returned zero proposals for this MVP scope.'
      } catch (err) {
        note =
          err instanceof LmStudioUnreachableError || err instanceof LlmBrainOutputError
            ? `LM Studio brain unavailable — no proposals generated (${err.message}).`
            : `Unexpected Builder brain error — no proposals generated (${String(err)}).`
        logger.warn('builder', note)
      }
    }

    const filesWritten: string[] = []
    const filesFailed: Array<{ path: string; error: string }> = []
    let applied = false

    if (proposals.length && opts.approve) {
      applied = true
      const writeTool = this.tools.find((t) => t.name === 'file_write')
      const editTool = this.tools.find((t) => t.name === 'file_edit')
      for (const proposal of proposals) {
        const tool = proposal.action === 'write' ? writeTool : editTool
        if (!tool) {
          filesFailed.push({ path: proposal.path, error: `No ${proposal.action} tool in builder belt` })
          continue
        }

        // Claim-file coordination (Bible §2.4 — one writer per file per pass): skip the
        // write if another stream already holds this path.
        if (opts.claimHooks) {
          const claimed = await opts.claimHooks.claim(proposal.path)
          if (!claimed.ok) {
            filesFailed.push({ path: proposal.path, error: `Claim denied — ${claimed.reason}` })
            continue
          }
        }

        const input =
          proposal.action === 'write'
            ? { path: proposal.path, content: proposal.content ?? '' }
            : { path: proposal.path, old_string: proposal.oldString ?? '', new_string: proposal.newString ?? '', replace_all: false }
        const result = await tool.run(input as never)
        if (result.ok) {
          filesWritten.push(proposal.path)
        } else {
          filesFailed.push({ path: proposal.path, error: result.output })
        }

        if (opts.claimHooks) await opts.claimHooks.release(proposal.path)
      }
      logger.info('builder', 'Proposals applied', { written: filesWritten.length, failed: filesFailed.length })
    } else if (proposals.length) {
      logger.warn('builder', 'Dry-run: proposals generated but not applied — pass --approve to write files', {
        count: proposals.length,
      })
    }

    const output: BuildOutput = { proposals, applied, note, filesWritten, filesFailed }
    return { role: this.role, output, durationMs: Date.now() - start }
  }

  private buildTask(spec: AppSpec, layout: LayoutPlan, architecture: ArchitectureOutput, targetDir: string): string {
    return (
      `App spec:\n${JSON.stringify(spec, null, 2)}\n\n` +
      `Layout plan:\n${JSON.stringify(layout, null, 2)}\n\n` +
      `Architecture (MVP scope + ADRs):\n${JSON.stringify(architecture, null, 2)}\n\n` +
      `Target directory: ${targetDir}\n\n` +
      `Propose the minimal set of file changes to scaffold the MVP-scope modules. Prefer 'write' for new files, ` +
      `'edit' for exact string replacement in existing files. Every proposal needs a one-line reasoning. ` +
      `Respond with ONLY JSON:\n` +
      `{"proposals": [{"path": string, "action": "write"|"edit", "content"?: string, "oldString"?: string, ` +
      `"newString"?: string, "reasoning": string}]}`
    )
  }
}
