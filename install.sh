#!/usr/bin/env bash
# install.sh — Install NightRaven into a project and/or Cursor user config.
#
# Usage:
#   ./install.sh [OPTIONS] [TARGET_DIR]
#
# Examples:
#   ./install.sh                          # project install (cwd)
#   ./install.sh ~/Projects/my-app        # project install (path)
#   ./install.sh --user                   # user-level Cursor (~/.cursor)
#   ./install.sh --user --project .       # both user + current project
#   curl -fsSL .../install.sh | bash -s -- --user

set -euo pipefail

NIGHTRAVEN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_USER=0
INSTALL_PROJECT=1
INSTALL_HOOKS=1
INSTALL_MCP=1
VENDOR_DOCS=1
FORCE_RULE=0
TARGET=""

usage() {
  cat <<EOF
NightRaven Cursor installer

Usage: $(basename "$0") [OPTIONS] [TARGET_DIR]

Options:
  --user           Install global Cursor rule + hooks under ~/.cursor/
  --no-project     Skip project install (use with --user)
  --no-hooks       Skip hook scripts and hooks.json
  --no-mcp         Skip MCP launcher and .cursor/mcp.json
  --no-vendor      Do not copy portable Bible/router docs into the project
  --force-rule     Overwrite existing .cursor/rules/nightraven-context-intent.mdc
  -h, --help       Show this help

Defaults:
  Project target = current directory
  Vendors docs/37_NIGHTRAVEN.md + router when missing
  Bootstraps handoff/changelog/learning log/AGENTS.md/overlay from templates

Portable source: ${NIGHTRAVEN_ROOT}
EOF
}

log() { printf '==> %s\n' "$*"; }
warn() { printf '!!> %s\n' "$*" >&2; }

copy_if_missing() {
  local src="$1" dest="$2"
  if [[ -f "$dest" ]]; then
    warn "exists (skip): ${dest#${TARGET}/}"
    return 0
  fi
  mkdir -p "$(dirname "$dest")"
  cp "$src" "$dest"
  log "created: ${dest#${TARGET}/}"
}

copy_file() {
  local src="$1" dest="$2"
  mkdir -p "$(dirname "$dest")"
  cp "$src" "$dest"
  log "installed: ${dest#${TARGET}/}"
}

install_project_mcp() {
  local dest_root="$1"
  mkdir -p "${dest_root}/.cursor/mcp"
  cat > "${dest_root}/.cursor/mcp/run-memory-chain-mcp.sh" <<EOF
#!/usr/bin/env bash
# Launch NightRaven MCP server (stdio) for Cursor.
set -euo pipefail

NIGHTRAVEN_INSTALL_ROOT="${NIGHTRAVEN_ROOT}"
SERVER_JS="\${NIGHTRAVEN_INSTALL_ROOT}/mcp-server/dist/index.js"

if [[ ! -f "\$SERVER_JS" ]]; then
  echo "nightraven memory-chain MCP server not built: \${SERVER_JS}" >&2
  echo "Run: cd \"\${NIGHTRAVEN_INSTALL_ROOT}/mcp-server\" && npm install && npm run build" >&2
  exit 1
fi

exec node "\$SERVER_JS"
EOF
  chmod +x "${dest_root}/.cursor/mcp/run-memory-chain-mcp.sh"
  copy_file "${NIGHTRAVEN_ROOT}/templates/mcp/run-memory-chain-mcp.js" "${dest_root}/.cursor/mcp/run-memory-chain-mcp.js"
  chmod +x "${dest_root}/.cursor/mcp/run-memory-chain-mcp.js"
  copy_if_missing "${NIGHTRAVEN_ROOT}/templates/mcp.json" "${dest_root}/.cursor/mcp.json"
  log "mcp: .cursor/mcp.json + run-memory-chain-mcp.js/sh (build mcp-server/ first — see docs/MCP_SETUP.md)"
}

hooks_os_is_windows() {
  case "$(uname -s 2>/dev/null)" in
    MINGW*|MSYS*|CYGWIN*) return 0 ;;
  esac
  [[ "${OS:-}" == "Windows_NT" ]]
}

install_project_hooks() {
  local dest_root="$1"
  local src_hooks dest_hooks hooks_manifest
  src_hooks="$(cd "${NIGHTRAVEN_ROOT}/.cursor/hooks" && pwd)"
  mkdir -p "${dest_root}/.cursor/hooks"
  dest_hooks="$(cd "${dest_root}/.cursor/hooks" && pwd)"
  if [[ "$src_hooks" != "$dest_hooks" ]]; then
    cp "${NIGHTRAVEN_ROOT}/.cursor/hooks/"*.sh "${dest_root}/.cursor/hooks/"
    cp "${NIGHTRAVEN_ROOT}/.cursor/hooks/"*.ps1 "${dest_root}/.cursor/hooks/" 2>/dev/null || true
  fi
  chmod +x "${dest_root}/.cursor/hooks/"*.sh
  hooks_manifest="${NIGHTRAVEN_ROOT}/.cursor/hooks.json"
  if ! hooks_os_is_windows; then
    hooks_manifest="${NIGHTRAVEN_ROOT}/templates/hooks.project.unix.json"
  fi
  if [[ "${hooks_manifest}" != "${dest_root}/.cursor/hooks.json" ]]; then
    cp -f "${hooks_manifest}" "${dest_root}/.cursor/hooks.json"
  fi
  if hooks_os_is_windows; then
    log "hooks: .cursor/hooks.json (PowerShell) + .sh/.ps1 scripts"
  else
    log "hooks: .cursor/hooks.json (run-hook.sh) + .sh/.ps1 scripts"
  fi
}

merge_user_hooks_json() {
  local user_hooks="${HOME}/.cursor/hooks.json"
  local fragment="${NIGHTRAVEN_ROOT}/templates/hooks.user.json"
  if [[ ! -f "$user_hooks" ]]; then
    cp "$fragment" "$user_hooks"
    log "created: ~/.cursor/hooks.json"
    return 0
  fi
  if grep -qE 'nightraven/session-start\.sh|gods-eye/session-start\.sh' "$user_hooks" 2>/dev/null; then
    warn "NightRaven hooks already present in ~/.cursor/hooks.json (skip merge)"
    return 0
  fi
  if command -v python3 >/dev/null 2>&1; then
    python3 - "$user_hooks" "$fragment" <<'PY'
import json, sys
user_path, frag_path = sys.argv[1], sys.argv[2]
with open(user_path) as f:
    user = json.load(f)
with open(frag_path) as f:
    frag = json.load(f)
user.setdefault("version", 1)
user.setdefault("hooks", {})
for event, defs in frag.get("hooks", {}).items():
    existing = user["hooks"].setdefault(event, [])
    for d in defs:
        cmd = d.get("command", "")
        if any(cmd in (e.get("command") or "") for e in existing):
            continue
        existing.append(d)
with open(user_path, "w") as f:
    json.dump(user, f, indent=2)
    f.write("\n")
PY
    log "merged NightRaven hooks into ~/.cursor/hooks.json"
  else
    warn "python3 not found — copy templates/hooks.user.json entries manually into ~/.cursor/hooks.json"
  fi
}

install_user_level() {
  log "Installing user-level Cursor config (~/.cursor/)"
  mkdir -p "${HOME}/.cursor/rules" "${HOME}/.cursor/hooks/nightraven"

  local user_rule="${HOME}/.cursor/rules/nightraven-context-intent.mdc"
  if [[ -f "$user_rule" && "$FORCE_RULE" -eq 0 ]]; then
    warn "exists (skip): ~/.cursor/rules/nightraven-context-intent.mdc (use --force-rule to replace)"
  else
    sed "s|__NIGHTRAVEN_ROOT__|${NIGHTRAVEN_ROOT}|g" \
      "${NIGHTRAVEN_ROOT}/templates/nightraven-context-intent.user.mdc" > "$user_rule"
    log "installed: ~/.cursor/rules/nightraven-context-intent.mdc"
  fi

  if [[ "$INSTALL_HOOKS" -eq 1 ]]; then
    cp "${NIGHTRAVEN_ROOT}/.cursor/hooks/"*.sh "${HOME}/.cursor/hooks/nightraven/"
    cp "${NIGHTRAVEN_ROOT}/.cursor/hooks/"*.ps1 "${HOME}/.cursor/hooks/nightraven/" 2>/dev/null || true
    chmod +x "${HOME}/.cursor/hooks/nightraven/"*.sh
    # Bake install root so hooks resolve Bible when projects use master BAIC instead of vendoring.
    if grep -q 'NIGHTRAVEN_INSTALL_ROOT=' "${HOME}/.cursor/hooks/nightraven/lib.sh" 2>/dev/null; then
      sed -i '' "s|NIGHTRAVEN_INSTALL_ROOT=\"\${NIGHTRAVEN_INSTALL_ROOT:-.*}\"|NIGHTRAVEN_INSTALL_ROOT=\"${NIGHTRAVEN_ROOT}\"|" \
        "${HOME}/.cursor/hooks/nightraven/lib.sh" 2>/dev/null || \
      sed -i "s|NIGHTRAVEN_INSTALL_ROOT=\"\${NIGHTRAVEN_INSTALL_ROOT:-.*}\"|NIGHTRAVEN_INSTALL_ROOT=\"${NIGHTRAVEN_ROOT}\"|" \
        "${HOME}/.cursor/hooks/nightraven/lib.sh"
    fi
    merge_user_hooks_json
    log "hooks: ~/.cursor/hooks/nightraven/*.sh + *.ps1 (lib.ps1/lib.sh parity)"
  fi
}

install_project() {
  TARGET="$(cd "$TARGET" && pwd)"
  log "Installing NightRaven into project: ${TARGET}"

  mkdir -p "${TARGET}/.cursor/rules" "${TARGET}/docs"

  local rule_dest="${TARGET}/.cursor/rules/nightraven-context-intent.mdc"
  if [[ -f "$rule_dest" && "$FORCE_RULE" -eq 0 ]]; then
    warn "exists (skip): .cursor/rules/nightraven-context-intent.mdc"
  else
    copy_file "${NIGHTRAVEN_ROOT}/.cursor/rules/nightraven-context-intent.mdc" "$rule_dest"
  fi

  copy_if_missing "${NIGHTRAVEN_ROOT}/.cursor/IMPROVEMENT_LOOP_CYCLE_PROMPT.md" \
    "${TARGET}/.cursor/IMPROVEMENT_LOOP_CYCLE_PROMPT.md"

  if [[ "$VENDOR_DOCS" -eq 1 ]]; then
    for doc in \
      docs/37_NIGHTRAVEN.md \
      docs/NIGHTRAVEN_LAYERED_SPEC_ROUTER.md \
      docs/NIGHTRAVEN_SESSION_SPEC_TREES.md \
      docs/NIGHTRAVEN_UNIFIED_STACK.md \
      docs/NIGHTRAVEN_IMPROVEMENT_LOOP_CYCLE_PROMPT.md \
      docs/HOOKS_SETUP.md \
      docs/MCP_SETUP.md; do
      copy_if_missing "${NIGHTRAVEN_ROOT}/${doc}" "${TARGET}/${doc}"
    done
  fi

  copy_if_missing "${NIGHTRAVEN_ROOT}/templates/docs/14_SESSION_HANDOFF.md" \
    "${TARGET}/docs/14_SESSION_HANDOFF.md"
  copy_if_missing "${NIGHTRAVEN_ROOT}/templates/docs/02_ENGINEERING_CHANGELOG.md" \
    "${TARGET}/docs/02_ENGINEERING_CHANGELOG.md"
  copy_if_missing "${NIGHTRAVEN_ROOT}/templates/docs/04_LEARNING_LOG.md" \
    "${TARGET}/docs/04_LEARNING_LOG.md"
  copy_if_missing "${NIGHTRAVEN_ROOT}/templates/docs/NIGHTRAVEN_REPO_OVERLAY.md" \
    "${TARGET}/docs/NIGHTRAVEN_REPO_OVERLAY.md"
  copy_if_missing "${NIGHTRAVEN_ROOT}/templates/AGENTS.md" "${TARGET}/AGENTS.md"

  if [[ "$INSTALL_HOOKS" -eq 1 ]]; then
    install_project_hooks "$TARGET"
  fi

  if [[ "$INSTALL_MCP" -eq 1 ]]; then
    install_project_mcp "$TARGET"
  fi

  cat <<EOF

Project install complete: ${TARGET}

Verify in Cursor:
  • Rules: Cursor Settings → Rules → nightraven-context-intent (alwaysApply)
  • Hooks: Cursor Settings → Hooks (sessionStart, stop, afterFileEdit)
  • MCP: Cursor Settings → MCP → nightraven-memory-chain (after: cd mcp-server && npm install && npm run build)
  • Open a new Agent chat — Touch 1 reminder should appear

Next steps:
  1. Edit docs/NIGHTRAVEN_REPO_OVERLAY.md for local vocabulary
  2. Fill docs/14_SESSION_HANDOFF.md Current state / Already done
  3. Optional: run ./install.sh --user for global rule + hooks on every project

EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --user) INSTALL_USER=1; shift ;;
    --no-project) INSTALL_PROJECT=0; shift ;;
    --no-hooks) INSTALL_HOOKS=0; shift ;;
    --no-mcp) INSTALL_MCP=0; shift ;;
    --no-vendor) VENDOR_DOCS=0; shift ;;
    --force-rule) FORCE_RULE=1; shift ;;
    -h|--help) usage; exit 0 ;;
    -*) warn "unknown option: $1"; usage; exit 1 ;;
    *) TARGET="$1"; shift ;;
  esac
done

if [[ -z "$TARGET" ]]; then
  TARGET="."
fi

if [[ "$INSTALL_USER" -eq 1 ]]; then
  install_user_level
fi

if [[ "$INSTALL_PROJECT" -eq 1 ]]; then
  install_project
fi

if [[ "$INSTALL_USER" -eq 1 && "$INSTALL_PROJECT" -eq 0 ]]; then
  cat <<EOF

User-level install complete.

Verify in Cursor:
  • Settings → Rules → nightraven-context-intent (global, alwaysApply)
  • Settings → Hooks → sessionStart / stop / afterFileEdit
  • NIGHTRAVEN_ROOT defaults to: ${NIGHTRAVEN_ROOT}

Install into a project:
  ${NIGHTRAVEN_ROOT}/install.sh /path/to/your-app

EOF
fi
