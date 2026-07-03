import { MessageSquare } from 'lucide-react'
import { useCompassData } from '../../hooks/useCompassData'
import { PromptCard } from './PromptCard'

export function NextPromptPage() {
  const { snapshot, nextTask, currentPhase, refresh } = useCompassData()
  const promptCards = snapshot?.promptCards ?? []

  if (!snapshot || !nextTask || !currentPhase) return null

  return (
    <section className="prompt-page" aria-labelledby="next-prompt-title">
      <article className="dashboard-card dashboard-card--wide">
        <div className="card-heading">
          <span className="card-icon card-icon--blue">
            <MessageSquare size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Next prompt</p>
            <h2 id="next-prompt-title">Prompt generators for current task</h2>
          </div>
        </div>
        <p className="card-copy">
          NightRaven Builder, Auditor, and Research — generated via{' '}
          <code>promptGenerator.ts</code> for <strong>{nextTask.title}</strong> in{' '}
          <strong>{currentPhase.name}</strong>.
        </p>
        <div className="next-move-box">
          <strong>{snapshot.nextMove.action}</strong>
          <p>{snapshot.nextMove.reason}</p>
          <small>
            Target: {snapshot.nextMove.targetAgent} ·{' '}
            {snapshot.nextMove.approvalRequired ? 'approval required' : 'no approval required'}
          </small>
        </div>
        <p className="prompt-text">{snapshot.nextMove.prompt}</p>
      </article>

      <div className="prompt-page__grid">
        {promptCards.length === 0 ? (
          <article className="dashboard-card">
            <p className="card-copy">No prompt cards in snapshot.</p>
          </article>
        ) : (
          promptCards.map((card) => (
            <PromptCard
              key={card.id}
              promptCard={card}
              projectPath={snapshot.meta.projectPath}
              projectLabel={snapshot.project.name}
              phaseName={currentPhase.name}
              taskTitle={nextTask.title}
              onGenerated={() => refresh({ silent: true })}
            />
          ))
        )}
      </div>
    </section>
  )
}
