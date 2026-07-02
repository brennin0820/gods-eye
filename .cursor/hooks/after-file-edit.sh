#!/usr/bin/env bash
# NightRaven Phase 2 — afterFileEdit
# Soft nudge when memory-chain files change: +# only, consider exit writes.
# Fast path: skip lib load when edit is outside memory-chain paths.

set -euo pipefail

input="$(cat || true)"

json_field_fast() {
  local json="$1"
  local field="$2"
  printf '%s' "$json" | sed -n "s/.*\"${field}\"[[:space:]]*:[[:space:]]*\"\\([^\"]*\\)\".*/\\1/p" | head -1
}

memory_chain_path() {
  local file_path="${1//\\//}"
  case "$file_path" in
    docs/*|.cursor/rules/*|examples/overlay/*|AGENTS.md) return 0 ;;
  esac
  return 1
}

file_path="$(json_field_fast "$input" "file_path")"
if [[ -z "${file_path}" ]]; then
  file_path="$(json_field_fast "$input" "path")"
fi

if ! memory_chain_path "${file_path}"; then
  printf '{}\n'
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib.sh
source "${SCRIPT_DIR}/lib.sh"

message="NightRaven memory edit (${file_path}):"
message+=$'\n\n'
message+="- +# only — append; use **Supersedes** for corrections; never -# heading blocks or trim **Already done** / **Recent sessions**"
project_root="$(nightraven_project_root "$input")"
if nightraven_touch3_disabled "$project_root"; then
  message+=$'\n'"- Touch 3 paused — wire cross-links when asked; no mandatory session-close batch"
else
  message+=$'\n'"- Defer Touch 3 batch (changelog, learning log, handoff Recent sessions) to session-stop **last turn** — not mid-session"
  message+=$'\n'"- Mid-session memory append only when Brent explicitly asks"
fi
message+=$'\n'"- One writer per file per pass; parallel reads are fine"

emit_additional_context "$message"
exit 0
