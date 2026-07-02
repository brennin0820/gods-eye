#!/usr/bin/env bash
# Shared helpers for NightRaven Phase 2 hooks (bash only — no jq/node).

# Canonical portable Bible clone (set at install time via env or default path).
NIGHTRAVEN_INSTALL_ROOT="${NIGHTRAVEN_INSTALL_ROOT:-${HOME}/Projects/nightraven}"

escape_for_json() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  s="${s//$'\r'/\\r}"
  s="${s//$'\t'/\\t}"
  printf '%s' "$s"
}

emit_additional_context() {
  local message="$1"
  local escaped
  escaped="$(escape_for_json "$message")"
  printf '{\n  "additional_context": "%s"\n}\n' "$escaped"
}

emit_followup_message() {
  local message="$1"
  local escaped
  escaped="$(escape_for_json "$message")"
  printf '{\n  "followup_message": "%s"\n}\n' "$escaped"
}

emit_session_start() {
  local message="$1"
  local nightraven_root="$2"
  local msg_escaped root_escaped
  msg_escaped="$(escape_for_json "$message")"
  root_escaped="$(escape_for_json "$nightraven_root")"
  printf '{\n  "env": { "NIGHTRAVEN_ROOT": "%s" },\n  "additional_context": "%s"\n}\n' \
    "$root_escaped" "$msg_escaped"
}

# Best-effort JSON field extraction without jq.
json_field() {
  local json="$1"
  local field="$2"
  printf '%s' "$json" | sed -n "s/.*\"${field}\"[[:space:]]*:[[:space:]]*\"\\([^\"]*\\)\".*/\\1/p" | head -1
}

json_number_field() {
  local json="$1"
  local field="$2"
  printf '%s' "$json" | sed -n "s/.*\"${field}\"[[:space:]]*:[[:space:]]*\\([0-9][0-9]*\\).*/\\1/p" | head -1
}

# First workspace root from stdin JSON (fallback when CURSOR_PROJECT_DIR is unset).
json_workspace_root() {
  local json="$1"
  printf '%s' "$json" | sed -n 's/.*"workspace_roots"[[:space:]]*:[[:space:]]*\[[[:space:]]*"\([^"]*\)".*/\1/p' | head -1
}

nightraven_project_root() {
  local input="${1:-}"
  if [[ -n "${CURSOR_PROJECT_DIR:-}" && -d "${CURSOR_PROJECT_DIR}" ]]; then
    printf '%s' "${CURSOR_PROJECT_DIR}"
    return 0
  fi
  if [[ -n "${CLAUDE_PROJECT_DIR:-}" && -d "${CLAUDE_PROJECT_DIR}" ]]; then
    printf '%s' "${CLAUDE_PROJECT_DIR}"
    return 0
  fi
  local ws
  ws="$(json_workspace_root "$input")"
  if [[ -n "$ws" && -d "$ws" ]]; then
    printf '%s' "$ws"
    return 0
  fi
  if root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    printf '%s' "$root"
    return 0
  fi
  printf '%s' "${PWD}"
}

nightraven_resolve_root() {
  local project_root="$1"
  if [[ -f "${project_root}/docs/37_NIGHTRAVEN.md" ]]; then
    printf '%s' "${project_root}"
    return 0
  fi
  if [[ -n "${NIGHTRAVEN_ROOT:-}" && -f "${NIGHTRAVEN_ROOT}/docs/37_NIGHTRAVEN.md" ]]; then
    printf '%s' "${NIGHTRAVEN_ROOT}"
    return 0
  fi
  if [[ -f "${NIGHTRAVEN_INSTALL_ROOT}/docs/37_NIGHTRAVEN.md" ]]; then
    printf '%s' "${NIGHTRAVEN_INSTALL_ROOT}"
    return 0
  fi
  printf '%s' "${NIGHTRAVEN_INSTALL_ROOT}"
}

nightraven_rel_path() {
  local project_root="$1"
  local rel="$2"
  if [[ -f "${project_root}/${rel}" ]]; then
    printf '%s' "${rel}"
  else
    printf '%s' "(${rel} — create when bootstrapped)"
  fi
}

# Touch 3 pause: marker file or env (NIGHTRAVEN_TOUCH3=0 / NIGHTRAVEN_TOUCH3_DISABLED=1).
nightraven_touch3_disabled() {
  local project_root="${1:-}" cached
  if [[ -n "$project_root" ]]; then
    cached="$(nightraven_read_touch3_cache "$project_root" 2>/dev/null || true)"
    case "$cached" in
      1) return 0 ;;
      0) return 1 ;;
    esac
  fi
  case "${NIGHTRAVEN_TOUCH3:-}" in
    0|off|OFF|false|FALSE|no|NO) return 0 ;;
  esac
  case "${NIGHTRAVEN_TOUCH3_DISABLED:-}" in
    1|true|TRUE|yes|YES) return 0 ;;
  esac
  local marker
  for marker in \
    "${HOME}/.cursor/touch3.disabled" \
    "${NIGHTRAVEN_ROOT:-}/.cursor/touch3.disabled" \
    "${NIGHTRAVEN_INSTALL_ROOT}/.cursor/touch3.disabled"; do
    if [[ -f "$marker" ]]; then
      return 0
    fi
  done
  if [[ -n "$project_root" && -f "${project_root}/.cursor/touch3.disabled" ]]; then
    return 0
  fi
  return 1
}

# Multi-phase in-flight: defer handoff read/batch until parent completes all phases.
nightraven_multiphase_in_flight() {
  local project_root="${1:-}"
  [[ -n "$project_root" && -f "${project_root}/.cursor/.multiphase-in-flight" ]] && return 0
  return 1
}

# Handoff Touch 3 batch paused (touch3.disabled OR multi-phase marker).
nightraven_handoff_batch_disabled() {
  nightraven_touch3_disabled "$1" && return 0
  nightraven_multiphase_in_flight "$1" && return 0
  return 1
}

nightraven_touch3_disabled_cached() {
  local project_root="${1:-}"
  if nightraven_touch3_disabled "$project_root"; then
    [[ -n "$project_root" ]] && nightraven_write_touch3_cache "$project_root" 1
    return 0
  fi
  [[ -n "$project_root" ]] && nightraven_write_touch3_cache "$project_root" 0
  return 1
}

# --- Always Sync (git autosync; fail-open) ---

NIGHTRAVEN_AUTOSYNC_SKIP_STOP_PULL_SEC="${NIGHTRAVEN_AUTOSYNC_SKIP_STOP_PULL_SEC:-1800}"

nightraven_autosync_session_marker() {
  local project_root="$1"
  printf '%s/.cursor/.autosync-session' "$project_root"
}

nightraven_touch3_cache_path() {
  local project_root="$1"
  printf '%s/.cursor/.touch3-cache' "$project_root"
}

nightraven_mark_session_pulled() {
  local project_root="$1"
  local pull_ok="${2:-1}"
  local marker dir
  marker="$(nightraven_autosync_session_marker "$project_root")"
  dir="$(dirname "$marker")"
  mkdir -p "$dir" 2>/dev/null || true
  printf '%s|%s\n' "$(date +%s)" "$pull_ok" > "$marker" 2>/dev/null || true
}

nightraven_should_skip_stop_pull() {
  local project_root="$1"
  local marker now_ts file_ts age pull_ok
  marker="$(nightraven_autosync_session_marker "$project_root")"
  [[ -f "$marker" ]] || return 1
  IFS='|' read -r file_ts pull_ok < "$marker" || return 1
  [[ "$pull_ok" == "1" ]] || return 1
  now_ts="$(date +%s)"
  age=$((now_ts - file_ts))
  [[ "$age" -ge 0 && "$age" -le "${NIGHTRAVEN_AUTOSYNC_SKIP_STOP_PULL_SEC}" ]]
}

# Same window as stop-pull skip — session-start skips redundant pull when marker is fresh.
nightraven_should_skip_recent_pull() {
  nightraven_should_skip_stop_pull "$@"
}

nightraven_normalize_porcelain_path() {
  local path="$1"
  path="${path# }"
  if [[ "$path" == \"*\" ]]; then
    path="${path:1:${#path}-2}"
  fi
  if [[ "$path" == *" -> "* ]]; then
    path="${path##* -> }"
    path="${path# }"
    if [[ "$path" == \"*\" ]]; then
      path="${path:1:${#path}-2}"
    fi
  fi
  printf '%s' "${path//\\//}"
}

nightraven_write_touch3_cache() {
  local project_root="$1"
  local disabled="$2"
  local cache dir
  cache="$(nightraven_touch3_cache_path "$project_root")"
  dir="$(dirname "$cache")"
  mkdir -p "$dir" 2>/dev/null || true
  printf '%s\n' "$disabled" > "$cache" 2>/dev/null || true
}

nightraven_read_touch3_cache() {
  local project_root="$1"
  local cache val
  cache="$(nightraven_touch3_cache_path "$project_root")"
  [[ -f "$cache" ]] || return 1
  val="$(tr -d ' \r\n' < "$cache" 2>/dev/null || true)"
  case "$val" in
    0|1) printf '%s' "$val"; return 0 ;;
  esac
  return 1
}

nightraven_has_safe_dirty_files() {
  local project_root="$1" line path
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    path="$(nightraven_normalize_porcelain_path "${line:3}")"
    if nightraven_is_safe_autosync_path "$path"; then
      return 0
    fi
  done < <(git -C "${project_root}" status --porcelain 2>/dev/null || true)
  return 1
}

nightraven_is_ahead_of_upstream() {
  local project_root="$1" branch upstream ahead
  branch="$(git -C "${project_root}" rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  [[ -n "$branch" ]] || return 1
  upstream="origin/${branch}"
  git -C "${project_root}" rev-parse --verify "${upstream}" >/dev/null 2>&1 || return 1
  ahead="$(git -C "${project_root}" rev-list --count "${upstream}..HEAD" 2>/dev/null || echo 0)"
  [[ "${ahead}" -gt 0 ]]
}

nightraven_session_sync_fast_path() {
  local project_root="$1"
  if ! nightraven_is_git_repo "$project_root"; then
    printf '%s' "Autosync stop skipped — not a git repository."
    return 0
  fi
  if nightraven_has_safe_dirty_files "$project_root"; then
    return 1
  fi
  if nightraven_is_ahead_of_upstream "$project_root"; then
    return 1
  fi
  if nightraven_should_skip_stop_pull "$project_root"; then
    printf '%s' "Autosync stop: nothing to sync (no safe dirty, not ahead; pull skipped — session-start recent)."
  else
    printf '%s' "Autosync stop: nothing to sync (no safe dirty, not ahead)."
  fi
  return 0
}

nightraven_is_git_repo() {
  local project_root="$1"
  [[ -d "${project_root}/.git" ]]
}

nightraven_is_secret_path() {
  local path="${1//\\//}"
  case "$path" in
    .env|.env.*|*/.env|*/.env.*|credentials.json|*/credentials.json|\
    *.pem|*/secrets/*|secrets/*|*/id_rsa|*/id_rsa.*|*/.npmrc|auth.json|*/auth.json|\
    .aws/*|*/.aws/*)
      return 0 ;;
  esac
  return 1
}

nightraven_is_safe_autosync_path() {
  local path="${1//\\//}"
  if nightraven_is_secret_path "$path"; then
    return 1
  fi
  case "$path" in
    docs/*|.cursor/*|templates/*|examples/*|scripts/*|mcp-server/*|apps/*|\
    AGENTS.md|README.md|CHANGELOG.md|LICENSE|install.sh)
      return 0 ;;
  esac
  return 1
}

nightraven_git_pull_ff_only() {
  local project_root="$1"
  if ! nightraven_is_git_repo "$project_root"; then
    printf '%s' "Autosync pull skipped — not a git repository."
    return 0
  fi
  local output
  if output="$(git -C "${project_root}" pull --ff-only 2>&1)"; then
    local summary
    summary="$(printf '%s\n' "$output" | tail -n 3 | tr '\n' ' ')"
    [[ -z "$summary" ]] && summary="Already up to date."
    printf 'Autosync pull: %s' "$summary"
  else
    local detail
    detail="$(printf '%s\n' "$output" | tail -n 2 | tr '\n' ' ')"
    printf 'Autosync pull failed (fail-open): %s' "$detail"
  fi
}

nightraven_autosync_commit_message() {
  local -a files=("$@")
  local -a normalized=()
  local path n i count listed
  local has_handoff=0 has_changelog=0 has_learning=0 has_hooks=0 has_rules=0
  local has_other_docs=0 has_agents=0 has_readme=0 has_templates=0
  local has_scripts=0 has_mcp=0 has_examples=0
  local -a hook_names=()
  local has_stop=0 has_start=0 has_after=0 has_lib=0
  local hook_subject areas subject body touch_parts memory_doc_count

  for path in "${files[@]}"; do
    n="${path//\\//}"
    normalized+=("$n")
  done

  if [[ ${#normalized[@]} -eq 0 ]]; then
    printf '%s\n' "chore(sync): session autosync [cursor hook]"
    return 0
  fi

  for path in "${normalized[@]}"; do
    case "$path" in
      docs/14_SESSION_HANDOFF.md) has_handoff=1 ;;
      docs/02_ENGINEERING_CHANGELOG.md) has_changelog=1 ;;
      docs/04_LEARNING_LOG.md) has_learning=1 ;;
      .cursor/hooks*)
        has_hooks=1
        hook_names+=("${path##*/}")
        ;;
      .cursor/hooks.json)
        has_hooks=1
        hook_names+=("hooks.json")
        ;;
      .cursor/rules/*) has_rules=1 ;;
      docs/*) has_other_docs=1 ;;
      AGENTS.md) has_agents=1 ;;
      README.md) has_readme=1 ;;
      templates/*) has_templates=1 ;;
      scripts/*) has_scripts=1 ;;
      mcp-server/*) has_mcp=1 ;;
      examples/*) has_examples=1 ;;
    esac
  done

  memory_doc_count=$((has_handoff + has_changelog + has_learning))
  areas=""
  [[ $has_handoff -eq 1 || $has_changelog -eq 1 || $has_learning -eq 1 ]] && areas="${areas:+$areas, }memory docs"
  [[ $has_other_docs -eq 1 ]] && areas="${areas:+$areas, }docs"
  [[ $has_rules -eq 1 ]] && areas="${areas:+$areas, }rules"
  [[ $has_agents -eq 1 ]] && areas="${areas:+$areas, }AGENTS"
  [[ $has_readme -eq 1 ]] && areas="${areas:+$areas, }README"
  [[ $has_templates -eq 1 ]] && areas="${areas:+$areas, }templates"
  [[ $has_scripts -eq 1 ]] && areas="${areas:+$areas, }scripts"
  [[ $has_mcp -eq 1 ]] && areas="${areas:+$areas, }mcp-server"
  [[ $has_examples -eq 1 ]] && areas="${areas:+$areas, }examples"

  if [[ $has_hooks -eq 1 && -z "$areas" ]]; then
    hook_subject="session hook updates"
    for n in "${hook_names[@]}"; do
      n="${n,,}"
      case "$n" in
        session-stop*) has_stop=1 ;;
        session-start*) has_start=1 ;;
        after-file-edit*) has_after=1 ;;
        lib.ps1|lib.sh) has_lib=1 ;;
      esac
    done
    if [[ $has_stop -eq 1 && $has_lib -eq 1 ]]; then
      hook_subject="auto-generate autosync commit messages on session stop"
    elif [[ $has_stop -eq 1 ]]; then
      hook_subject="autosync on session stop"
    elif [[ $has_after -eq 1 ]]; then
      hook_subject="after-file-edit fast paths"
    elif [[ $has_start -eq 1 ]]; then
      hook_subject="session-start autosync fast paths"
    elif [[ $has_lib -eq 1 ]]; then
      hook_subject="autosync hook helpers"
    fi
    subject="fix(hooks): ${hook_subject}"
  elif [[ $has_hooks -eq 0 && $memory_doc_count -gt 0 && $has_other_docs -eq 0 && $has_rules -eq 0 && $has_agents -eq 0 && $has_readme -eq 0 && $has_templates -eq 0 && $has_scripts -eq 0 && $has_mcp -eq 0 && $has_examples -eq 0 ]]; then
    touch_parts=""
    [[ $has_handoff -eq 1 ]] && touch_parts="${touch_parts:+$touch_parts and }handoff"
    [[ $has_changelog -eq 1 ]] && touch_parts="${touch_parts:+$touch_parts and }changelog"
    [[ $has_learning -eq 1 ]] && touch_parts="${touch_parts:+$touch_parts and }learning log"
    if [[ $memory_doc_count -eq 1 && $has_handoff -eq 1 ]]; then
      subject="docs: Touch 3 AFTER handoff"
    elif [[ $memory_doc_count -eq 1 && $has_changelog -eq 1 ]]; then
      subject="docs: engineering changelog"
    elif [[ $memory_doc_count -eq 1 && $has_learning -eq 1 ]]; then
      subject="docs: learning log"
    elif [[ $has_handoff -eq 1 && $has_changelog -eq 1 ]]; then
      subject="docs: Touch 3 AFTER handoff and changelog"
    else
      subject="docs: Touch 3 AFTER ${touch_parts}"
    fi
  elif [[ $has_hooks -eq 1 && -n "$areas" ]]; then
    subject="chore: session sync - hooks, ${areas}"
  elif [[ $has_hooks -eq 0 && $has_other_docs -eq 1 && $memory_doc_count -eq 0 ]]; then
    subject="docs: update project documentation"
  else
    if [[ $has_hooks -eq 1 ]]; then
      subject="chore: session sync - hooks${areas:+, ${areas}}"
    elif [[ -n "$areas" ]]; then
      subject="chore: session sync - ${areas}"
    else
      subject="chore: session sync — memory chain"
    fi
  fi

  printf '%s' "$subject"
  if [[ ${#normalized[@]} -gt 1 ]]; then
    body=""
    count=0
    for path in "${normalized[@]}"; do
      [[ $count -ge 8 ]] && break
      body+=$'- '"${path}"$'\n'
      count=$((count + 1))
    done
    if [[ ${#normalized[@]} -gt 8 ]]; then
      body+=$'- ... and '"$(( ${#normalized[@]} - 8 ))"$' more\n'
    fi
    printf '\n%s' "$body"
  fi
}

nightraven_git_session_commit() {
  local project_root="$1"
  local safe_files=() line path
  if ! nightraven_is_git_repo "$project_root"; then
    printf '%s' "Autosync commit skipped — not a git repository."
    return 0
  fi
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    path="$(nightraven_normalize_porcelain_path "${line:3}")"
    if nightraven_is_safe_autosync_path "$path"; then
      safe_files+=("$path")
    fi
  done < <(git -C "${project_root}" status --porcelain 2>/dev/null || true)

  if [[ ${#safe_files[@]} -eq 0 ]]; then
    printf '%s' "Autosync commit skipped — no safe tracked changes (docs/.cursor/AGENTS/README or secret paths excluded)."
    return 0
  fi

  if ! git -C "${project_root}" add -- "${safe_files[@]}" 2>/dev/null; then
    local added_any=0 path
    for path in "${safe_files[@]}"; do
      if git -C "${project_root}" add -- "$path" 2>/dev/null; then
        added_any=1
      fi
    done
    if [[ "$added_any" -eq 0 ]]; then
      printf '%s' "Autosync commit skipped — git add failed."
      return 0
    fi
  fi
  if git -C "${project_root}" diff --cached --quiet 2>/dev/null; then
    printf '%s' "Autosync commit skipped — nothing staged after safe-path filter."
    return 0
  fi
  local commit_msg commit_body
  commit_msg="$(nightraven_autosync_commit_message "${safe_files[@]}")"
  commit_body=""
  if [[ "$commit_msg" == *$'\n'* ]]; then
    commit_body="${commit_msg#*$'\n'}"
    commit_msg="${commit_msg%%$'\n'*}"
  fi
  if [[ -n "$commit_body" ]]; then
    if git -C "${project_root}" commit -m "$commit_msg" -m "$commit_body" 2>/dev/null; then
      printf 'Autosync commit: %s (%s file(s)).' "$commit_msg" "${#safe_files[@]}"
      return 0
    fi
  elif git -C "${project_root}" commit -m "$commit_msg" 2>/dev/null; then
    printf 'Autosync commit: %s (%s file(s)).' "$commit_msg" "${#safe_files[@]}"
    return 0
  fi
  local last_author name email
  last_author="$(git -C "${project_root}" log -1 --format='%an <%ae>' 2>/dev/null || true)"
  if [[ "$last_author" =~ ^(.+)\ \<(.+)\>$ ]]; then
    name="${BASH_REMATCH[1]}"
    email="${BASH_REMATCH[2]}"
    if [[ -n "$commit_body" ]]; then
      if git -C "${project_root}" -c "user.name=${name}" -c "user.email=${email}" \
        commit -m "$commit_msg" -m "$commit_body" 2>/dev/null; then
        printf 'Autosync commit: %s (%s file(s)).' "$commit_msg" "${#safe_files[@]}"
        return 0
      fi
    elif git -C "${project_root}" -c "user.name=${name}" -c "user.email=${email}" \
      commit -m "$commit_msg" 2>/dev/null; then
      printf 'Autosync commit: %s (%s file(s)).' "$commit_msg" "${#safe_files[@]}"
      return 0
    fi
  fi
  printf '%s' "Autosync commit failed (fail-open)."
}

nightraven_git_push_if_ahead() {
  local project_root="$1"
  local branch upstream ahead output
  if ! nightraven_is_git_repo "$project_root"; then
    printf '%s' "Autosync push skipped — not a git repository."
    return 0
  fi
  branch="$(git -C "${project_root}" rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  [[ -z "$branch" ]] && { printf '%s' "Autosync push skipped — could not resolve branch."; return 0; }
  upstream="origin/${branch}"
  if ! git -C "${project_root}" rev-parse --verify "${upstream}" >/dev/null 2>&1; then
    printf 'Autosync push skipped — no upstream %s.' "$upstream"
    return 0
  fi
  ahead="$(git -C "${project_root}" rev-list --count "${upstream}..HEAD" 2>/dev/null || echo 0)"
  if [[ "${ahead}" -le 0 ]]; then
    printf 'Autosync push skipped — not ahead of %s.' "$upstream"
    return 0
  fi
  if output="$(git -C "${project_root}" push origin HEAD 2>&1)"; then
    printf 'Autosync push: origin/%s (%s commit(s)).' "$branch" "$ahead"
  else
    local detail
    detail="$(printf '%s\n' "$output" | tail -n 2 | tr '\n' ' ')"
    printf 'Autosync push failed (fail-open): %s' "$detail"
  fi
}

nightraven_append_push_defer() {
  local project_root="$1"
  local reason="$2"
  local handoff="${project_root}/docs/14_SESSION_HANDOFF.md"
  local today line tmp
  [[ -f "$handoff" ]] || return 0
  today="$(date +%Y-%m-%d)"
  line="- **${today}** — Autosync push deferred [cursor hook]: ${reason}"
  if grep -q '## Recent sessions' "$handoff" 2>/dev/null; then
    tmp="${handoff}.autosync.tmp"
    awk -v insert="$line" '
      /^## Recent sessions/ { print; print insert; next }
      { print }
    ' "$handoff" > "$tmp" 2>/dev/null && mv "$tmp" "$handoff" 2>/dev/null || true
  fi
}
