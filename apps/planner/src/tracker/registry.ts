// Parses scripts/nightraven-projects.conf format: ABS_PATH|label|role
// (roles: framework | master | app | user-global). Same format Compass and
// scan-nightraven-projects.sh read — this is an independent, minimal parser for the
// Node CLI context (no browser/Vite runtime available here).

export type RegistryEntry = {
  path: string
  label: string
  role: string
}

export function parseRegistry(content: string): RegistryEntry[] {
  const entries: RegistryEntry[] = []
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const parts = line.split('|')
    if (parts.length < 3) continue
    const [path, label, role] = parts
    entries.push({ path: path.trim(), label: label.trim(), role: role.trim() })
  }
  return entries
}
