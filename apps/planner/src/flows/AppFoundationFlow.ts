import type { FlowState, AppSpec } from '../types/agent.js'
import { PlannerAgent }    from '../agents/PlannerAgent.js'
import { ResearchAgent }   from '../agents/ResearchAgent.js'
import { ArchitectAgent }  from '../agents/ArchitectAgent.js'
import { ReviewAgent }     from '../agents/ReviewAgent.js'
import { BuilderAgent }    from '../agents/BuilderAgent.js'
import { logger }          from '../utils/logger.js'
import type { LmStudioClient } from '../llm/lmStudioClient.js'
import type { ClaimHooks } from '../agents/BuilderAgent.js'

export class AppFoundationFlow {
  private planner: PlannerAgent
  private researcher: ResearchAgent
  private architect: ArchitectAgent
  private reviewer = new ReviewAgent()
  private builder: BuilderAgent

  // Optional LM Studio brain — omit for the original deterministic dry-run behavior.
  constructor(llm?: LmStudioClient) {
    this.planner = new PlannerAgent(llm)
    this.researcher = new ResearchAgent(llm)
    this.architect = new ArchitectAgent(llm)
    this.builder = new BuilderAgent(llm)
  }

  // Phase 0: Planner decomposes spec → layout (requires human approval before continuing)
  async planLayout(spec: AppSpec): Promise<FlowState> {
    const result = await this.planner.run(spec)
    return { spec, layout: result.output, phase: 0, approved: false }
  }

  // Phases 1–3: run after human approves the layout plan
  async runPipeline(state: FlowState): Promise<FlowState> {
    if (!state.approved || !state.layout) {
      throw new Error('Layout must be approved before running the pipeline')
    }

    // Extract before spread-reassignment so TypeScript keeps the narrowed type
    const layout = state.layout

    logger.phase('flow', '--- Phase 1: Research ---')
    const researchResult = await this.researcher.run(layout)
    state = { ...state, research: researchResult.output, phase: 1 }

    const research = state.research!

    logger.phase('flow', '--- Phase 2: Architecture ---')
    const archResult = await this.architect.run(layout, research)
    state = { ...state, architecture: archResult.output, phase: 2 }

    logger.phase('flow', '--- Phase 3: Review ---')
    const reviewResult = await this.reviewer.run(layout, state.architecture!)
    state = { ...state, review: reviewResult.output, phase: 3 }

    if (!state.review!.passed) {
      logger.warn('flow', 'Review gate failed — inspect findings before proceeding')
    } else {
      logger.info('flow', 'Foundation pipeline complete — ready for implementation')
    }

    return state
  }

  // Phase 4: Builder — only reachable after Review passes; writes are gated by buildOpts.approve
  async runBuild(
    state: FlowState,
    buildOpts: { approve: boolean; targetDir: string; claimHooks?: ClaimHooks; streamId?: string },
  ): Promise<FlowState> {
    if (!state.review?.passed || !state.layout || !state.architecture) {
      throw new Error('Review must pass before Builder can run')
    }

    logger.phase('flow', '--- Phase 4: Build ---')
    const buildResult = await this.builder.run(state.spec, state.layout, state.architecture, buildOpts)
    state = { ...state, build: buildResult.output, phase: 4 }

    logger.info('flow', 'Build phase complete', {
      applied: state.build!.applied,
      written: state.build!.filesWritten.length,
      failed: state.build!.filesFailed.length,
    })

    return state
  }
}
