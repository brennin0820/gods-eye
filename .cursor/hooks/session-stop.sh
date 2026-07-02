#!/usr/bin/env bash
# NightRaven Phase 2 — stop (Touch 3 · After) + Always Sync commit/push
# Soft follow-up: append Recent sessions (+# only) before ending. Fail-open on git errors.

# Fail-open: never abort before followup_message (no set -e).
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib.sh
source "${SCRIPT_DIR}/lib.sh"

input="$(cat || true)"
project_root="$(nightraven_project_root "$input")"

loop_count="$(json_number_field "$input" "loop_count")"
loop_count="${loop_count:-0}"

sync_lines=()
fast_path="$(nightraven_session_sync_fast_path "$project_root" || true)"
if [[ -n "$fast_path" ]]; then
  sync_lines+=("$fast_path")
else
  if nightraven_should_skip_stop_pull "$project_root"; then
    sync_lines+=("Autosync pull skipped — session-start recent (see .cursor/.autosync-session).")
  else
    sync_lines+=("$(nightraven_git_pull_ff_only "$project_root")")
  fi
  sync_lines+=("$(nightraven_git_session_commit "$project_root")")
  push_msg="$(nightraven_git_push_if_ahead "$project_root")"
  sync_lines+=("$push_msg")

  if [[ "$push_msg" == Autosync\ push\ failed* ]]; then
    reason="${push_msg#Autosync push failed (fail-open): }"
    nightraven_append_push_defer "$project_root" "$reason" || true
    sync_lines+=("Push defer recorded in docs/14_SESSION_HANDOFF.md Recent sessions (+# only).")
  fi
fi

sync_block="$(printf '%s\n' "${sync_lines[@]}")"

if [[ "${loop_count}" -gt 0 ]]; then
  message="NightRaven · Always Sync [cursor hook]"
  message+=$'\n\n'"${sync_block}"
  emit_followup_message "$message"
  exit 0
fi

if nightraven_handoff_batch_disabled "$project_root"; then
  message="NightRaven · Always Sync [cursor hook]"
  message+=$'\n\n'"${sync_block}"
  if nightraven_multiphase_in_flight "$project_root"; then
    message+=$'\n\n'"Handoff batch paused — multi-phase in flight (.cursor/.multiphase-in-flight). One Touch 3 AFTER when all phases complete; remove marker then."
  else
    message+=$'\n\n'"Touch 3 AFTER paused — no mandatory handoff batch."
  fi
  emit_followup_message "$message"
  exit 0
fi

handoff_path="$(nightraven_rel_path "$project_root" "docs/14_SESSION_HANDOFF.md")"

message="NightRaven · Touch 3 · AFTER — **last turn only**"
message+=$'\n\n'
message+="This follow-up is your **final turn**. All implementation and subagents must be **done** before Touch 3. "
message+="Do not start new work, spawn agents, or defer this batch to a later turn."
message+=$'\n\n'"**Always Sync [cursor hook]**"
message+=$'\n'"${sync_block}"
message+=$'\n\n'
message+="If this was a real session (tier >= 1): append one +# line to **Recent sessions** in ${handoff_path}. "
message+="Keep prior session lines (newest first). Never -# or replace the whole section."
message+=$'\n\n'
message+="Record Everything (Tier 2+): also append docs/02_ENGINEERING_CHANGELOG.md when work was meaningful; "
message+="docs/04_LEARNING_LOG.md for new patterns; wire cross-links (rule, Bible, overlay, AGENTS, handoff)."
message+=$'\n\n'
message+="+# only · this repo only · no new template scaffolds per cycle · then stop."

emit_followup_message "$message"
exit 0
