// Generalized Unified Manifest schema — the config layer for a project's orchestration
// run. Modeled on the LinenFlow manifest (examples/manifest/NIGHTRAVEN_UNIFIED_MANIFEST.example.yaml)
// with app-specific fields (serialized_paths, monitor.compass_dev, invoke prompts) kept
// optional so any consumer project's manifest validates without forcing Swift/Xcode shape.

import { z } from 'zod'

export const ComplexitySchema = z.enum(['TRIVIAL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])

export const ManifestSchema = z.object({
  version: z.literal(1),
  framework: z.object({
    name: z.string().default('NightRaven'),
    label: z.string().optional(),
    description: z.string().optional(),
    root: z.string(),
    registry_entry: z.string().optional(),
  }),
  orchestrator: z.object({
    name: z.string().default('NightRaven'),
    skill: z.string().optional(),
    complexity: ComplexitySchema.default('MEDIUM'),
    divisions: z.array(z.string()).default(['planning', 'builder', 'auditor']),
    responsibilities: z.array(z.string()).default([]),
  }),
  coordination: z.object({
    claim_file: z.string().default('AGENT_WORK_LOG.md'),
    protocol: z.string().optional(),
  }),
  ledgers: z.object({
    build: z.string().default('docs/ledgers/BUILD_LEDGER.md'),
    audit: z.string().default('docs/ledgers/AUDIT_LEDGER.md'),
  }),
  plans: z
    .object({
      primary: z.string().optional(),
      handoff: z.string().default('docs/14_SESSION_HANDOFF.md'),
      agent_rules: z.string().default('AGENTS.md'),
    })
    .default({ handoff: 'docs/14_SESSION_HANDOFF.md', agent_rules: 'AGENTS.md' }),
  monitor: z
    .object({
      status_doc: z.string().default('docs/PARALLEL_RUN_STATUS.md'),
      compass_dev: z.string().optional(),
      agent_work_log: z.string().optional(),
    })
    .default({ status_doc: 'docs/PARALLEL_RUN_STATUS.md' }),
  rules: z.record(z.boolean()).default({}),
  serialization_rules: z
    .object({
      serialized_paths: z.array(z.string()).default([]),
      project_file_rule: z.string().optional(),
      conflict_policy: z.string().optional(),
    })
    .default({ serialized_paths: [] })
    .optional(),
})

export type Manifest = z.infer<typeof ManifestSchema>
