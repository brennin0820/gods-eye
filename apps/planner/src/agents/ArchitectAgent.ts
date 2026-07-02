import type { ResearchOutput, LayoutPlan, ArchitectureOutput, AgentResult } from '../types/agent.js'
import { logger } from '../utils/logger.js'
import { getToolsForDivision, type DivisionName } from '../tools/registry.js'
import type { AgentTool } from '../tools/AgentTool.js'
import type { LmStudioClient } from '../llm/lmStudioClient.js'
import { askDivisionBrain, LmStudioUnreachableError, LlmBrainOutputError } from '../llm/llmBrain.js'
import { ArchitectureOutputSchema } from '../llm/schemas.js'

export class ArchitectAgent {
  readonly role = 'architect' as const
  readonly division: DivisionName = 'architect'
  readonly tools: AgentTool[]
  private readonly llm?: LmStudioClient

  constructor(llm?: LmStudioClient) {
    this.tools = getToolsForDivision(this.division)
    this.llm = llm
    logger.info('architect', 'Tool belt loaded', { tools: this.tools.map((t) => t.name) })
  }

  async run(layout: LayoutPlan, research: ResearchOutput): Promise<AgentResult<ArchitectureOutput>> {
    const start = Date.now()
    logger.phase('architect', 'Phase 2 — creating ADRs + MoSCoW MVP scope')

    let output: ArchitectureOutput
    if (this.llm) {
      try {
        output = await this.runWithBrain(layout, research)
      } catch (err) {
        logger.warn('architect', 'LLM brain unavailable — falling back to deterministic architecture', {
          reason: err instanceof LmStudioUnreachableError || err instanceof LlmBrainOutputError ? err.message : String(err),
        })
        output = this.runDeterministic(layout, research)
      }
    } else {
      output = this.runDeterministic(layout, research)
    }

    logger.info('architect', 'Architecture ready', {
      adrCount: output.adrs.length,
      mvpModules: output.mvpScope.map((m) => m.name),
    })

    return { role: this.role, output, durationMs: Date.now() - start }
  }

  private async runWithBrain(layout: LayoutPlan, research: ResearchOutput): Promise<ArchitectureOutput> {
    const task =
      `Layout plan:\n${JSON.stringify(layout, null, 2)}\n\n` +
      `Research output:\n${JSON.stringify(research, null, 2)}\n\n` +
      `Produce ADRs and split layout.modules into an MVP scope and a roadmap (MoSCoW). ` +
      `mvpScope and roadmap entries MUST be drawn from layout.modules (same id/name/priority/description) — ` +
      `do not invent new modules. Respond with ONLY JSON:\n` +
      `{"adrs": [{"id": string, "decision": string, "rationale": string}], "mvpScope": Module[], "roadmap": Module[]}`
    return askDivisionBrain(this.llm!, this.division, task, ArchitectureOutputSchema)
  }

  private runDeterministic(layout: LayoutPlan, research: ResearchOutput): ArchitectureOutput {
    const adrs = [
      {
        id: 'ADR-001',
        decision: 'TypeScript strict mode across all modules',
        rationale: research.bestPractices[2] ?? 'Type safety at module boundaries',
      },
      {
        id: 'ADR-002',
        decision: 'Layout contract enforced as DAG — no circular dependencies',
        rationale: research.risks[1] ?? 'Prevents cascading render failures',
      },
      {
        id: 'ADR-003',
        decision: 'Auth module is the only module with no upstream dependencies',
        rationale: research.bestPractices[0] ?? 'Auth boundary at shell level',
      },
    ]

    const mvpScope = layout.modules.filter((m) => m.priority === 'must')
    const roadmap  = layout.modules.filter((m) => m.priority !== 'must')

    return { adrs, mvpScope, roadmap }
  }
}
