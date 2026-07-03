import { useState } from 'react'
import { Copy, ExternalLink, RefreshCw } from 'lucide-react'
import { openSystemPath } from '../../services/compassApi'
import { useCompassData } from '../../hooks/useCompassData'
import type { NavItemId } from './navigation'

type MenuCommand = {
  label: string
  view?: NavItemId
  action?: 'refresh' | 'openProject' | 'revealActiveFile' | 'copyProjectPath' | 'copyNextPrompt'
  disabled?: boolean
}

type MenuGroup = {
  label: string
  commands: MenuCommand[]
}

type CommandMenuBarProps = {
  onViewChange: (view: NavItemId) => void
}

function commandGroups(hasSnapshot: boolean): MenuGroup[] {
  return [
    {
      label: 'File',
      commands: [
        { label: 'Open Project Folder in Explorer', action: 'openProject', disabled: !hasSnapshot },
        { label: 'Reveal Active File in Explorer', action: 'revealActiveFile', disabled: !hasSnapshot },
        { label: 'Copy Project Path', action: 'copyProjectPath', disabled: !hasSnapshot },
        { label: 'Refresh Project', action: 'refresh', disabled: !hasSnapshot },
      ],
    },
    {
      label: 'Edit',
      commands: [
        { label: 'Copy Next Prompt', action: 'copyNextPrompt', disabled: !hasSnapshot },
        { label: 'Copy Project Path', action: 'copyProjectPath', disabled: !hasSnapshot },
        { label: 'Mark Item Reviewed', view: 'auditor-queue', disabled: false },
      ],
    },
    {
      label: 'View',
      commands: [
        { label: 'Overview', view: 'dashboard' },
        { label: 'What Changed', view: 'changed-files' },
        { label: 'Files', view: 'files' },
        { label: 'Runs', view: 'runs' },
        { label: 'Detach Checklist', view: 'detach' },
        { label: 'Evolution Tracker', view: 'evolution' },
      ],
    },
    {
      label: 'Project',
      commands: [
        { label: 'Check Project Health', view: 'dashboard' },
        { label: 'Check Required Files', view: 'files' },
        { label: 'Open Registry', view: 'settings' },
        { label: 'Detach Project', view: 'detach' },
        { label: 'Open Evolution Tracker', view: 'evolution' },
      ],
    },
    {
      label: 'Monitor',
      commands: [
        { label: 'Scan Now', action: 'refresh', disabled: !hasSnapshot },
        { label: 'Show Changed Files', view: 'changed-files' },
        { label: 'Show Missing Evidence', view: 'files' },
        { label: 'Show Mockups and Gaps', view: 'evolution' },
        { label: 'Show Last Scan Details', view: 'dashboard' },
      ],
    },
    {
      label: 'Run',
      commands: [
        { label: 'Show Run Timeline', view: 'runs' },
        { label: 'Open Build Ledger', view: 'runs' },
        { label: 'Open Audit Ledger', view: 'runs' },
        { label: 'Generate Audit Prompt', view: 'next-prompt' },
      ],
    },
    {
      label: 'Memory',
      commands: [
        { label: 'Open Handoff', view: 'memory-feed' },
        { label: 'Show Recent Sessions', view: 'memory-feed' },
        { label: 'Show Decisions', view: 'decisions' },
        { label: 'Generate Memory Update Prompt', view: 'next-prompt' },
      ],
    },
    {
      label: 'Audit',
      commands: [
        { label: 'Show Audit Status', view: 'auditor-queue' },
        { label: 'Show Failed Checks', view: 'auditor-queue' },
        { label: 'Show Acceptance Criteria', view: 'done-criteria' },
        { label: 'Explain Why Not Done', view: 'detach' },
      ],
    },
    {
      label: 'Tools',
      commands: [
        { label: 'Provider Router', view: 'next-prompt' },
        { label: 'Evidence Viewer', view: 'files' },
        { label: 'File Claim Viewer', view: 'files' },
        { label: 'Settings', view: 'settings' },
      ],
    },
    {
      label: 'Window',
      commands: [
        { label: 'Toggle Sidebar', view: 'dashboard' },
        { label: 'New Project Window', view: 'settings' },
      ],
    },
    {
      label: 'Help',
      commands: [
        { label: 'NightRaven Guide', view: 'settings' },
        { label: 'What Does This Status Mean?', view: 'dashboard' },
        { label: 'Progress Rules', view: 'progress' },
        { label: 'Evolution Rules', view: 'evolution' },
        { label: 'Detach Rules', view: 'detach' },
        { label: 'Tips', view: 'dashboard' },
      ],
    },
  ]
}

export function CommandMenuBar({ onViewChange }: CommandMenuBarProps) {
  const { snapshot, refresh } = useCompassData()
  const [message, setMessage] = useState<string | null>(null)

  async function runCommand(command: MenuCommand) {
    setMessage(null)
    if (command.view) {
      onViewChange(command.view)
      return
    }
    if (!snapshot || !command.action) return

    try {
      if (command.action === 'refresh') {
        await refresh()
        setMessage('Project refreshed.')
      } else if (command.action === 'openProject') {
        await openSystemPath({
          projectPath: snapshot.meta.projectPath,
          targetPath: snapshot.meta.projectPath,
          mode: 'open',
        })
        setMessage('Opened project folder.')
      } else if (command.action === 'revealActiveFile') {
        const target = snapshot.monitor.activeFiles[0] ?? snapshot.fileCatalog[0]
        if (!target) {
          setMessage('No active file to reveal.')
          return
        }
        await openSystemPath({
          projectPath: snapshot.meta.projectPath,
          targetPath: target.sourcePath,
          mode: target.type === 'folder' ? 'open' : 'reveal',
        })
        setMessage(`Revealed ${target.name}.`)
      } else if (command.action === 'copyProjectPath') {
        await navigator.clipboard.writeText(snapshot.meta.projectPath)
        setMessage('Project path copied.')
      } else if (command.action === 'copyNextPrompt') {
        await navigator.clipboard.writeText(snapshot.nextMove.prompt)
        setMessage('Next prompt copied.')
      }
    } catch (error) {
      setMessage(String(error))
    }
  }

  return (
    <nav className="command-menu" aria-label="Application menus">
      <div className="command-menu__groups">
        {commandGroups(Boolean(snapshot)).map((group) => (
          <details className="command-menu__group" key={group.label}>
            <summary>{group.label}</summary>
            <div className="command-menu__panel">
              {group.commands.map((command) => (
                <button
                  type="button"
                  key={`${group.label}-${command.label}`}
                  disabled={command.disabled}
                  onClick={() => void runCommand(command)}
                >
                  {command.action === 'refresh' ? <RefreshCw size={14} aria-hidden="true" /> : null}
                  {command.action === 'openProject' || command.action === 'revealActiveFile' ? (
                    <ExternalLink size={14} aria-hidden="true" />
                  ) : null}
                  {command.action?.startsWith('copy') ? <Copy size={14} aria-hidden="true" /> : null}
                  <span>{command.label}</span>
                </button>
              ))}
            </div>
          </details>
        ))}
      </div>
      {message ? <span className="command-menu__message">{message}</span> : null}
    </nav>
  )
}
