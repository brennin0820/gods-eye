export type AgentRole = 'planner' | 'researcher' | 'architect' | 'reviewer' | 'builder'

export type Module = {
  id: string
  name: string
  priority: 'must' | 'should' | 'could' | 'wont'
  description: string
}

export type AppSpec = {
  name: string
  intent: string
  constraints?: string[]
}

export type LayoutPlan = {
  modules: Module[]
  layoutContract: Record<string, string[]>  // module id → dependency ids
  approvedAt?: string
}

export type ResearchOutput = {
  prd: string
  bestPractices: string[]
  risks: string[]
}

export type ArchitectureOutput = {
  adrs: Array<{ id: string; decision: string; rationale: string }>
  mvpScope: Module[]
  roadmap: Module[]
}

export type ReviewOutput = {
  passed: boolean
  findings: Array<{ severity: 'error' | 'warn' | 'info'; message: string }>
  coveragePercent: number
}

export type FileChangeProposal = {
  path: string
  action: 'write' | 'edit'
  content?: string
  oldString?: string
  newString?: string
  reasoning: string
}

export type BuildOutput = {
  proposals: FileChangeProposal[]
  applied: boolean
  note: string
  filesWritten: string[]
  filesFailed: Array<{ path: string; error: string }>
}

export type FlowState = {
  spec: AppSpec
  layout?: LayoutPlan
  research?: ResearchOutput
  architecture?: ArchitectureOutput
  review?: ReviewOutput
  build?: BuildOutput
  phase: 0 | 1 | 2 | 3 | 4
  approved: boolean
}

export type AgentResult<T> = {
  role: AgentRole
  output: T
  durationMs: number
}
