// Zod schemas the LLM brain's JSON output must satisfy per division — the compile-visible
// contract between "the model said so" and "the pipeline trusts it".

import { z } from 'zod'

export const ModuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  priority: z.enum(['must', 'should', 'could', 'wont']),
  description: z.string().min(1),
})

export const LayoutPlanSchema = z.object({
  modules: z.array(ModuleSchema).min(1),
  layoutContract: z.record(z.array(z.string())),
})

export const ResearchOutputSchema = z.object({
  prd: z.string().min(1),
  bestPractices: z.array(z.string().min(1)),
  risks: z.array(z.string().min(1)),
})

export const ArchitectureOutputSchema = z.object({
  adrs: z.array(z.object({ id: z.string().min(1), decision: z.string().min(1), rationale: z.string().min(1) })),
  mvpScope: z.array(ModuleSchema),
  roadmap: z.array(ModuleSchema),
})

export const FileChangeProposalSchema = z.object({
  path: z.string().min(1),
  action: z.enum(['write', 'edit']),
  content: z.string().optional(),
  oldString: z.string().optional(),
  newString: z.string().optional(),
  reasoning: z.string().min(1),
})

export const BuildProposalsSchema = z.object({
  proposals: z.array(FileChangeProposalSchema),
})
