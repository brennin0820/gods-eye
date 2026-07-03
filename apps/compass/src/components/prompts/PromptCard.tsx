import { useState } from 'react'
import { FilePlus2, MessageSquare } from 'lucide-react'
import type { PromptCard as PromptCardData } from '../../types/project'
import { generatePromptFile } from '../../services/compassApi'

type PromptCardProps = {
  promptCard: PromptCardData
  projectPath: string
  projectLabel: string
  phaseName: string
  taskTitle: string
  onGenerated?: () => Promise<void> | void
}

const targetLabels: Record<PromptCardData['target'], string> = {
  nightraven: "NightRaven",
  nightraven_builder: 'NightRaven Builder',
  nightraven_auditor: 'Auditor',
  research: 'Research',
  user: 'User',
}

export function PromptCard({
  promptCard,
  projectPath,
  projectLabel,
  phaseName,
  taskTitle,
  onGenerated,
}: PromptCardProps) {
  const [status, setStatus] = useState<string | null>(null)
  const [writing, setWriting] = useState(false)

  async function handleGenerateFile() {
    setWriting(true)
    setStatus(null)
    try {
      const result = await generatePromptFile({
        projectPath,
        projectLabel,
        phaseName,
        taskTitle,
        promptCard,
      })
      setStatus(`Generated ${result.artifactPath}`)
      await onGenerated?.()
    } catch (error) {
      setStatus(String(error))
    } finally {
      setWriting(false)
    }
  }

  return (
    <article
      className="dashboard-card dashboard-card--prompt"
      data-target={promptCard.target}
    >
      <div className="card-heading">
        <span className="card-icon card-icon--blue">
          <MessageSquare size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Recommended prompt</p>
          <h2>Send to {targetLabels[promptCard.target]}</h2>
        </div>
      </div>
      <p className="prompt-text">{promptCard.prompt}</p>
      <div className="required-output">
        <h3>Required output</h3>
        <ul>
          {promptCard.requiredOutput.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="prompt-actions">
        <button
          type="button"
          className="queue-action"
          onClick={() => void handleGenerateFile()}
          disabled={writing}
        >
          <FilePlus2 size={16} aria-hidden="true" />
          {writing ? 'Generating…' : 'Generate file'}
        </button>
        {status ? <p className="card-copy">{status}</p> : null}
      </div>
    </article>
  )
}
