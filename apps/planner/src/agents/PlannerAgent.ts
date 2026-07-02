import type { AppSpec, LayoutPlan, Module, AgentResult } from '../types/agent.js'
import { logger } from '../utils/logger.js'
import { getToolsForDivision, type DivisionName } from '../tools/registry.js'
import type { AgentTool } from '../tools/AgentTool.js'
import type { LmStudioClient } from '../llm/lmStudioClient.js'
import { askDivisionBrain, LmStudioUnreachableError, LlmBrainOutputError } from '../llm/llmBrain.js'
import { LayoutPlanSchema } from '../llm/schemas.js'

const CORE_MODULES: Omit<Module, 'id'>[] = [
  { name: 'Auth',      priority: 'must',   description: 'Identity, session, permissions' },
  { name: 'Shell',     priority: 'must',   description: 'App shell, layout, navigation' },
  { name: 'Dashboard', priority: 'must',   description: 'Primary data surface' },
  { name: 'Settings',  priority: 'should', description: 'User preferences and config' },
  { name: 'Reports',   priority: 'could',  description: 'Export and analytics' },
]

export class PlannerAgent {
  readonly role = 'planner' as const
  readonly division: DivisionName = 'planner'
  readonly tools: AgentTool[]
  private readonly llm?: LmStudioClient

  constructor(llm?: LmStudioClient) {
    this.tools = getToolsForDivision(this.division)
    this.llm = llm
    logger.info('planner', 'Tool belt loaded', { tools: this.tools.map((t) => t.name) })
  }

  async run(spec: AppSpec): Promise<AgentResult<LayoutPlan>> {
    const start = Date.now()
    logger.phase('planner', 'Phase 0 — decomposing spec into layout', { app: spec.name })

    let layout: LayoutPlan
    if (this.llm) {
      try {
        layout = await this.runWithBrain(spec)
      } catch (err) {
        logger.warn('planner', 'LLM brain unavailable — falling back to deterministic layout', {
          reason: err instanceof LmStudioUnreachableError || err instanceof LlmBrainOutputError ? err.message : String(err),
        })
        layout = this.runDeterministic()
      }
    } else {
      layout = this.runDeterministic()
    }

    logger.info('planner', 'Layout plan ready', { moduleCount: layout.modules.length })
    return { role: this.role, output: layout, durationMs: Date.now() - start }
  }

  private async runWithBrain(spec: AppSpec): Promise<LayoutPlan> {
    const task =
      `App spec:\n${JSON.stringify(spec, null, 2)}\n\n` +
      `Decompose this app into modules and produce a LayoutPlan. Respond with ONLY JSON of this shape:\n` +
      `{"modules": [{"id": string, "name": string, "priority": "must"|"should"|"could"|"wont", "description": string}], ` +
      `"layoutContract": {"<module id>": ["<dependency module id>", ...]}}\n` +
      `layoutContract must reference only ids present in modules and must be acyclic.`
    return askDivisionBrain(this.llm!, this.division, task, LayoutPlanSchema)
  }

  private runDeterministic(): LayoutPlan {
    const modules: Module[] = CORE_MODULES.map((m, i) => ({
      ...m,
      id: `mod-${i + 1}-${m.name.toLowerCase()}`,
    }))

    // dependency contract: shell depends on auth; dashboard depends on shell
    const layoutContract: Record<string, string[]> = {
      'mod-1-auth':      [],
      'mod-2-shell':     ['mod-1-auth'],
      'mod-3-dashboard': ['mod-2-shell'],
      'mod-4-settings':  ['mod-2-shell'],
      'mod-5-reports':   ['mod-3-dashboard'],
    }

    return { modules, layoutContract }
  }
}
