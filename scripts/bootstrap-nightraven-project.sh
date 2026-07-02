#!/usr/bin/env bash
# Bootstrap a new NightRaven consumer project — NightRaven memory + NightRaven Core.
#
# Usage:
#   ./scripts/bootstrap-nightraven-project.sh PROJECT_NAME [TARGET_DIR]
#
# Examples:
#   ./scripts/bootstrap-nightraven-project.sh HimFLer
#   ./scripts/bootstrap-nightraven-project.sh HimFLer /e/NightRaven/HimFLer
#
# Creates TARGET_DIR (default: sibling of framework repo under ../PROJECT_NAME),
# runs install-nightraven-framework.sh, seeds overlay/handoff/README, git init if needed.

set -euo pipefail

NIGHTRAVEN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FORCE=0
ARGS=()
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=1 ;;
    *) ARGS+=("$arg") ;;
  esac
done
PROJECT_NAME="${ARGS[0]:-}"
TARGET="${ARGS[1]:-}"

usage() {
  cat <<EOF
Bootstrap a new NightRaven project (NightRaven + Core)

Usage: $(basename "$0") PROJECT_NAME [TARGET_DIR] [--force]

  PROJECT_NAME   Display name (e.g. HimFLer) — used in overlay and README
  TARGET_DIR     Optional absolute path (default: ../PROJECT_NAME next to framework)
  --force        Reseed overlay/handoff/quickstart/README even if the project
                 already has live memory (destructive — normally never needed)

Framework: ${NIGHTRAVEN_ROOT}
EOF
}

log() { printf '==> [bootstrap] %s\n' "$*"; }
warn() { printf '!!> [bootstrap] %s\n' "$*" >&2; }

if [[ -z "$PROJECT_NAME" ]]; then
  usage
  exit 1
fi

if [[ -z "$TARGET" ]]; then
  TARGET="$(cd "${NIGHTRAVEN_ROOT}/.." && pwd)/${PROJECT_NAME}"
fi

TARGET="$(mkdir -p "$TARGET" && cd "$TARGET" && pwd)"

if [[ ! -d "${TARGET}/.git" ]]; then
  log "git init → ${TARGET}"
  git -C "$TARGET" init -b main
fi

log "Installing NightRaven + NightRaven Core → ${TARGET}"
"${NIGHTRAVEN_ROOT}/scripts/install-nightraven-framework.sh" --no-mcp "$TARGET"

TODAY="$(date +%Y-%m-%d)"
FRAMEWORK_REF="${NIGHTRAVEN_ROOT}"

# --- Idempotence guard: never rewrite live memory (+# only law) ---
# A handoff with dated Recent-sessions lines or a Bootstrap milestone means this
# project already has history — seeding again would erase it (-#). Skip unless --force.
HANDOFF="${TARGET}/docs/14_SESSION_HANDOFF.md"
SEED=1
if [[ "$FORCE" -ne 1 && -f "$HANDOFF" ]] && \
   grep -qE '^- \*\*[0-9]{4}-[0-9]{2}-[0-9]{2}\*\*|^- \+# \*\*Bootstrap\*\*' "$HANDOFF"; then
  SEED=0
  warn "existing handoff has live memory — skipping overlay/handoff/quickstart/README seed (re-run with --force to overwrite)"
fi

# --- Overlay (product boundary + vocabulary) ---
OVERLAY="${TARGET}/docs/NIGHTRAVEN_REPO_OVERLAY.md"
if [[ "$SEED" -eq 1 && -f "$OVERLAY" ]]; then
  cat > "$OVERLAY" <<EOF
# NightRaven repo overlay — ${PROJECT_NAME}

**Local layer only.** Portable laws live in **\`docs/37_NIGHTRAVEN.md\`** (vendored or at \`\$NIGHTRAVEN_ROOT\`).

**Router:** \`docs/NIGHTRAVEN_LAYERED_SPEC_ROUTER.md\` (if present)

**Default posture:** **Tier C — Creator-Innovator** (Bible §10).

**NightRaven stack:** NightRaven remembers · NightRaven Core orchestrates (\`/nightraven\`). Framework installed from \`${FRAMEWORK_REF}\`.

---

## 1. Vocabulary (this repo)

| Term | Meaning |
|------|---------|
| **${PROJECT_NAME}** | This product / app — ship name and repo folder |
| **NightRaven** | Agent memory chain — handoff, overlay, hooks, Bible (installed) |
| **NightRaven Core** | Orchestration — \`.claude/skills/nightraven/SKILL.md\` |
| **Brent's context** | Agent memory intent — not code \`*Context*\` types unless this app defines them |
| **Always Sync** | Pull before work; commit+push after changes when remote configured (Bible §2.9) |

---

## 2. Product boundary

- **${PROJECT_NAME}** — greenfield project bootstrapped ${TODAY}; product scope TBD with Brent.
- Agents **plan until code it** — memory + wire default; no feature code until Brent says **code it** / **implement** / **build**.
- **This repo only** — no handoff bleed from nightraven framework repo or other apps (§2.6).

---

## 3. Connected chain (this repo)

| Layer | Path |
|-------|------|
| Rule | \`.cursor/rules/nightraven-context-intent.mdc\` |
| Bible | \`docs/37_NIGHTRAVEN.md\` |
| Overlay | this file |
| Handoff | \`docs/14_SESSION_HANDOFF.md\` |
| Entry | \`AGENTS.md\` |
| NightRaven Core | \`.claude/skills/nightraven/SKILL.md\` |
| Ledgers | \`docs/ledgers/BUILD_LEDGER.md\` · \`docs/ledgers/AUDIT_LEDGER.md\` |
| Quickstart | \`docs/PROJECT_QUICKSTART.md\` |

EOF
  log "wrote overlay → docs/NIGHTRAVEN_REPO_OVERLAY.md"
fi

# --- Handoff ---
if [[ "$SEED" -eq 1 && -f "$HANDOFF" ]]; then
  cat > "$HANDOFF" <<EOF
# Session handoff — ${PROJECT_NAME}

**Scope:** App memory for **this repository only**. Portable law: \`docs/37_NIGHTRAVEN.md\`.

---

## Current state / focus

**${PROJECT_NAME}** — greenfield NightRaven project bootstrapped ${TODAY} via \`bootstrap-nightraven-project.sh\` from NightRaven framework (\`${FRAMEWORK_REF}\`). Stack: NightRaven memory + NightRaven Core. **Next:** Brent defines product scope · initial codebase · remote when ready.

---

## Already done

- +# **Bootstrap** (${TODAY}) — NightRaven + NightRaven Core installed; overlay · handoff · ledgers · hooks · \`PROJECT_QUICKSTART.md\`

---

## Recent sessions

- **${TODAY}** — Bootstrap: **${PROJECT_NAME}** project created — NightRaven stack ready; say **code it** when product scope is set (\`+#\` only).

---

## Guardrails / locks

- **\`+#\` only** on memory docs — never \`-#\` or collapse **Recent sessions** / **Already done**
- **This repo only** — no cross-repo handoff bleed
- **Plan until code it** — Bible §2.8

EOF
  log "wrote handoff → docs/14_SESSION_HANDOFF.md"
fi

# --- Project quickstart ---
QUICK="${TARGET}/docs/PROJECT_QUICKSTART.md"
if [[ "$SEED" -eq 1 ]]; then
cat > "$QUICK" <<EOF
# ${PROJECT_NAME} — project quickstart

Bootstrapped ${TODAY} with **NightRaven** + **NightRaven Core**.

## First session (agent)

1. Parallel-read: rule → \`docs/37_NIGHTRAVEN.md\` §0 → overlay → handoff → \`AGENTS.md\`
2. Ask Brent for product scope if unclear
3. Complex work: \`/nightraven <task>\` after Phase 0 assessment

## First commit (human)

\`\`\`bash
cd "${TARGET}"
git add -A
git commit -m "chore: bootstrap ${PROJECT_NAME} with NightRaven + NightRaven Core"
# git remote add origin <url> && git push -u origin main
\`\`\`

## Framework source

Installed from: \`${FRAMEWORK_REF}\`

Re-run bootstrap (idempotent — skips seeding when the handoff has live memory; \`--force\` overrides): \`./scripts/bootstrap-nightraven-project.sh ${PROJECT_NAME} "${TARGET}"\`
EOF
log "wrote docs/PROJECT_QUICKSTART.md"
fi

# --- README ---
README="${TARGET}/README.md"
if [[ "$SEED" -eq 1 ]]; then
cat > "$README" <<EOF
# ${PROJECT_NAME}

NightRaven consumer project — **NightRaven** memory + **NightRaven Core** orchestration.

| Layer | Purpose |
|-------|---------|
| NightRaven | Durable agent memory (handoff, overlay, hooks) |
| NightRaven Core | \`/nightraven\` adaptive Builder/Auditor orchestration |

**Quickstart:** [docs/PROJECT_QUICKSTART.md](docs/PROJECT_QUICKSTART.md)

Bootstrapped ${TODAY} from [NightRaven / NightRaven platform](${FRAMEWORK_REF}).
EOF
log "wrote README.md"
fi

# --- .gitignore baseline ---
GITIGNORE="${TARGET}/.gitignore"
if [[ ! -f "$GITIGNORE" ]]; then
  cat > "$GITIGNORE" <<'EOF'
.DS_Store
.env
.env.*
node_modules/
dist/
.cursor/touch3.disabled
.cursor/.autosync-session
.cursor/.touch3-cache
EOF
  log "wrote .gitignore"
fi

cat <<EOF

${PROJECT_NAME} is ready at: ${TARGET}

Open in Cursor:
  File → Open Folder → ${TARGET}

First agent message:
  "Read AGENTS.md and handoff, then help me define ${PROJECT_NAME} scope."

Optional: add remote and push when ready.

EOF
