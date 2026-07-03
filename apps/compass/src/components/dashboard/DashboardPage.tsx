import { useCompassData } from '../../hooks/useCompassData'
import {
  calculateAuditProgress,
  calculateBuildProgress,
  calculateDecisionProgress,
} from '../../utils/progress'
import { PromptCard } from '../prompts/PromptCard'
import { BlockerCard } from './BlockerCard'
import { CurrentPhaseCard } from './CurrentPhaseCard'
import { DecisionCard } from './DecisionCard'
import { NextBestActionCard } from './NextBestActionCard'
import { NotNowCard } from './NotNowCard'
import { ProgressSummaryCard } from './ProgressSummaryCard'
import { ProjectStatusCard } from './ProjectStatusCard'
import { MonitorSummaryCard } from './MonitorSummaryCard'

export function DashboardPage() {
  const { snapshot, nextTask, currentPhase, refresh } = useCompassData()

  if (!snapshot || !nextTask || !currentPhase) return null

  const blocker = snapshot.blockers[0]
  const decision = snapshot.decisions[0]
  const promptCard = snapshot.promptCards[0]
  const blockedTaskTitles = blocker
    ? blocker.blockedTaskIds
        .map((id) => snapshot.tasks.find((task) => task.id === id)?.title)
        .filter((title): title is string => Boolean(title))
    : []

  const calculatedProgress = {
    ...snapshot.progress,
    buildProgress: calculateBuildProgress(snapshot.tasks),
    auditProgress: calculateAuditProgress(snapshot.auditItems),
    decisionProgress: calculateDecisionProgress(snapshot.decisions),
  }

  return (
    <section className="dashboard">
      <div className="dashboard__summary">
        <ProjectStatusCard project={snapshot.project} />
        <MonitorSummaryCard monitor={snapshot.monitor} nextMove={snapshot.nextMove} />
        <NextBestActionCard task={nextTask} />
      </div>

      <div className="dashboard__grid">
        <CurrentPhaseCard phase={currentPhase} />
        <ProgressSummaryCard progress={calculatedProgress} />
        {blocker ? <BlockerCard blocker={blocker} blockedTaskTitles={blockedTaskTitles} /> : null}
        {decision ? <DecisionCard decision={decision} tasks={snapshot.tasks} /> : null}
        <NotNowCard items={snapshot.notNowItems} />
        {promptCard ? (
          <PromptCard
            promptCard={promptCard}
            projectPath={snapshot.meta.projectPath}
            projectLabel={snapshot.project.name}
            phaseName={currentPhase.name}
            taskTitle={nextTask.title}
            onGenerated={() => refresh({ silent: true })}
          />
        ) : null}
      </div>
    </section>
  )
}
