import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Code2,
  Columns3,
  Compass,
  Eye,
  FileText,
  Flag,
  FolderOpen,
  GitBranch,
  Hammer,
  Home,
  ListChecks,
  Map,
  MessageSquare,
  PackageCheck,
  Route,
  Search,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NavItemId =
  | 'dashboard'
  | 'changed-files'
  | 'files'
  | 'scope-map'
  | 'roadmap'
  | 'priority-board'
  | 'coder-tasks'
  | 'next-prompt'
  | 'runs'
  | 'nightraven-queue'
  | 'nr-queue'
  | 'auditor-queue'
  | 'research-queue'
  | 'decisions'
  | 'blockers'
  | 'progress'
  | 'done-criteria'
  | 'not-now'
  | 'memory-feed'
  | 'back-and-forth'
  | 'reports'
  | 'detach'
  | 'evolution'
  | 'settings'

type NavItem = {
  id: NavItemId
  label: string
  phase: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Overview', phase: 'Monitor', icon: Home },
  { id: 'changed-files', label: 'What Changed', phase: 'Monitor', icon: ListChecks },
  { id: 'files', label: 'Files', phase: 'Monitor', icon: FolderOpen },
  { id: 'scope-map', label: 'Scope Map', phase: 'Phase 2', icon: Map },
  { id: 'roadmap', label: 'Plan', phase: 'Phase 2', icon: Route },
  { id: 'priority-board', label: 'Priority Board', phase: 'Phase 2', icon: Columns3 },
  { id: 'coder-tasks', label: 'Coder Tasks', phase: 'Phase 2', icon: Code2 },
  { id: 'next-prompt', label: 'Next Step', phase: 'Phase 2', icon: MessageSquare },
  { id: 'runs', label: 'Runs', phase: 'Monitor', icon: FileText },
  { id: 'nightraven-queue', label: "NightRaven Queue", phase: 'Phase 2', icon: Eye },
  { id: 'nr-queue', label: 'NR Queue', phase: 'Phase 2', icon: Hammer },
  { id: 'auditor-queue', label: 'Audit', phase: 'Phase 5', icon: ShieldCheck },
  { id: 'research-queue', label: 'Research Queue', phase: 'Phase 2', icon: Search },
  { id: 'decisions', label: 'Decisions', phase: 'Phase 2', icon: GitBranch },
  { id: 'blockers', label: 'Blockers', phase: 'Phase 2', icon: AlertTriangle },
  { id: 'not-now', label: 'Not Now', phase: 'Phase 2', icon: Compass },
  { id: 'progress', label: 'Progress', phase: 'Phase 6', icon: BarChart3 },
  { id: 'memory-feed', label: 'Memory', phase: 'Phase 7', icon: BookOpen },
  { id: 'back-and-forth', label: 'Loop Detector', phase: 'Phase 8', icon: AlertTriangle },
  { id: 'done-criteria', label: 'Done Criteria', phase: 'Phase 7', icon: Flag },
  { id: 'reports', label: 'Reports', phase: 'Phase 8', icon: BarChart3 },
  { id: 'detach', label: 'Detach', phase: 'Monitor', icon: PackageCheck },
  { id: 'evolution', label: 'Evolution', phase: 'Monitor', icon: GitBranch },
  { id: 'settings', label: 'Settings', phase: 'Phase 7', icon: Settings },
]

/** Sidebar order — keys must match `routeRegistry` in app/routeRegistry.tsx */
export const navItemIds: NavItemId[] = navItems.map((item) => item.id)
