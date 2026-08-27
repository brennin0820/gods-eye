import { PackageCheck } from 'lucide-react'
import { useCompassData } from '../../hooks/useCompassData'

type DetachCheck = {
  label: string
  passed: boolean
  detail: string
}

export function DetachPage() {
  const { snapshot } = useCompassData()
  if (!snapshot) return null
  const memoryDimension = snapshot.monitor.dimensions.find((dimension) => dimension.id === 'memory')
  const auditDimension = snapshot.monitor.dimensions.find((dimension) => dimension.id === 'audit')
  const handoffFresh = snapshot.meta.handoffFound && memoryDimension?.status === 'clear'
  const auditGateClear = auditDimension?.status !== 'blocked' && auditDimension?.status !== 'failed'
  const activeRunOrBuild = snapshot.fileCatalog.some((entry) => entry.precision.build === 'planned')

  const checks: DetachCheck[] = [
    {
      label: 'Changed files clear',
      passed: snapshot.monitor.changedFiles.length === 0,
      detail:
        snapshot.monitor.changedFiles.length === 0
          ? 'No changed files detected by git status.'
          : `${snapshot.monitor.changedFiles.length} changed file(s) still need review.`,
    },
    {
      label: 'No blocking file claims',
      passed: !snapshot.fileCatalog.some((entry) => entry.precision.claim === 'claimed'),
      detail: 'Active claims must be released or resolved before detach.',
    },
    {
      label: 'Audit gate clear',
      passed: auditGateClear,
      detail: auditGateClear
        ? 'No pending or failed audit evidence blocks detach.'
        : auditDimension?.status === 'blocked'
          ? 'Pending audit evidence must finish before detach.'
          : 'Failed audit evidence must be repaired before detach.',
    },
    {
      label: 'No active run or build',
      passed: !activeRunOrBuild,
      detail: activeRunOrBuild
        ? 'Active run or build evidence must reach a terminal state before detach.'
        : 'No active run or build evidence blocks detach.',
    },
    {
      label: 'No open high/critical blockers',
      passed: !snapshot.blockers.some(
        (blocker) => blocker.status === 'open' && (blocker.severity === 'high' || blocker.severity === 'critical'),
      ),
      detail: 'Open high or critical blockers must be resolved before detach.',
    },
    {
      label: 'Project handoff present',
      passed: snapshot.meta.handoffFound,
      detail: 'Project Handoff must exist as final current-state memory.',
    },
    {
      label: 'Project handoff fresh',
      passed: handoffFresh,
      detail: !snapshot.meta.handoffFound
        ? 'Project Handoff must exist before freshness can be verified.'
        : memoryDimension?.detail.includes('invalid')
          ? 'Project handoff freshness evidence is invalid and must be repaired before detach.'
          : handoffFresh
            ? 'Project Handoff freshness evidence is valid for detach.'
            : 'A stale Project Handoff must be refreshed before detach.',
    },
    {
      label: 'Memory artifacts present',
      passed: snapshot.monitor.missingRequiredFiles.length === 0,
      detail:
        snapshot.monitor.missingRequiredFiles.length === 0
          ? 'Attach/align memory files are present.'
          : `${snapshot.monitor.missingRequiredFiles.length} required file(s) are missing.`,
    },
  ]

  const ready = snapshot.monitor.lifecycle === 'ready_to_detach'

  return (
    <section className="detach-page" aria-labelledby="detach-title">
      <article className="dashboard-card dashboard-card--wide">
        <div className="card-heading">
          <span className="card-icon card-icon--green">
            <PackageCheck size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Detach</p>
            <h2 id="detach-title">{ready ? 'Project can prepare to detach' : 'Project is not ready to detach'}</h2>
          </div>
        </div>
        <p className="card-copy">
          A finished project must stand alone. NightRaven can detach only after build, audit,
          claims, blockers, and memory evidence are clear.
        </p>
        <div className="meta-grid">
          <span>
            <strong>Lifecycle</strong>
            {snapshot.monitor.lifecycleLabel}
          </span>
          <span>
            <strong>Blocking reason</strong>
            {snapshot.monitor.blockingReason ?? 'No blocking dimension'}
          </span>
          <span>
            <strong>Next move</strong>
            {snapshot.nextMove.action}
          </span>
        </div>
      </article>

      <article className="dashboard-card">
        <h3>Detach checklist</h3>
        <ul className="detach-checklist">
          {checks.map((check) => (
            <li key={check.label} data-passed={check.passed}>
              <strong>{check.passed ? 'Pass' : 'Blocked'}</strong>
              <span>{check.label}</span>
              <p>{check.detail}</p>
            </li>
          ))}
        </ul>
      </article>

      <article className="dashboard-card dashboard-card--accent">
        <h3>Recommended detach action</h3>
        <p className="card-copy">{snapshot.nextMove.reason}</p>
        <p className="prompt-text">{snapshot.nextMove.prompt}</p>
        <div className="meta-grid meta-grid--two">
          <span>
            <strong>Target</strong>
            {snapshot.nextMove.targetAgent}
          </span>
          <span>
            <strong>Approval</strong>
            {snapshot.nextMove.approvalRequired ? 'Required' : 'Not required'}
          </span>
        </div>
      </article>
    </section>
  )
}
