import type { LayoutPlan, ResearchOutput, AgentResult } from '../types/agent.js'
import { logger } from '../utils/logger.js'
import { getToolsForDivision, type DivisionName } from '../tools/registry.js'
import type { AgentTool } from '../tools/AgentTool.js'
import type { LmStudioClient } from '../llm/lmStudioClient.js'
import { askDivisionBrain, LmStudioUnreachableError, LlmBrainOutputError } from '../llm/llmBrain.js'
import { ResearchOutputSchema } from '../llm/schemas.js'

export class ResearchAgent {
  readonly role = 'researcher' as const
  readonly division: DivisionName = 'researcher'
  readonly tools: AgentTool[]
  private readonly llm?: LmStudioClient

  constructor(llm?: LmStudioClient) {
    this.tools = getToolsForDivision(this.division)
    this.llm = llm
    logger.info('researcher', 'Tool belt loaded', { tools: this.tools.map((t) => t.name) })
  }

  async run(layout: LayoutPlan): Promise<AgentResult<ResearchOutput>> {
    const start = Date.now()
    logger.phase('researcher', 'Phase 1 — generating PRD + best-practices', {
      modules: layout.modules.map((m) => m.name),
    })

    let output: ResearchOutput
    if (this.llm) {
      try {
        output = await this.runWithBrain(layout)
      } catch (err) {
        logger.warn('researcher', 'LLM brain unavailable — falling back to deterministic PRD', {
          reason: err instanceof LmStudioUnreachableError || err instanceof LlmBrainOutputError ? err.message : String(err),
        })
        output = this.runDeterministic(layout)
      }
    } else {
      output = this.runDeterministic(layout)
    }

    logger.info('researcher', 'PRD ready', { practiceCount: output.bestPractices.length })
    return { role: this.role, output, durationMs: Date.now() - start }
  }

  private async runWithBrain(layout: LayoutPlan): Promise<ResearchOutput> {
    const task =
      `Layout plan:\n${JSON.stringify(layout, null, 2)}\n\n` +
      `Write a PRD plus best-practices and risks for this layout. Respond with ONLY JSON:\n` +
      `{"prd": string (markdown), "bestPractices": string[], "risks": string[]}`
    return askDivisionBrain(this.llm!, this.division, task, ResearchOutputSchema)
  }

  private runDeterministic(layout: LayoutPlan): ResearchOutput {
    const mustModules = layout.modules.filter((m) => m.priority === 'must')

    const prd = [
      `## Product Requirements Document`,
      `### Must-have modules (${mustModules.length})`,
      ...mustModules.map((m) => `- **${m.name}**: ${m.description}`),
    ].join('\n')

    const bestPractices = [
      'Enforce auth boundary at the shell level — never inside individual pages',
      'Layout contract defines render order; never skip a dependency tier',
      'Each module owns its own type definitions — no cross-module type imports',
      'Planner output is append-only once approved — use Supersedes for corrections',
    ]

    const risks = [
      'Scope creep via "could" modules entering MVP — gate with MoSCoW review',
      'Layout contract cycles — validate DAG before Architecture phase',
    ]

    return { prd, bestPractices, risks }
  }
}
