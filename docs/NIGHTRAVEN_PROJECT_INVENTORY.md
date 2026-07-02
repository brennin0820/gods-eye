# NightRaven — Project Inventory

**Purpose:** Aggregate **metadata** from every workspace that runs NightRaven — without importing another repo's app memory into this file.

**Authority:** Inventory is **L0 git truth in this repo** — refresh with [`scripts/scan-nightraven-projects.sh`](../scripts/scan-nightraven-projects.sh). Per-project handoff/changelog remain **local only** (Bible §2.6).

**Last scanned:** 2026-06-10 (UTC) · registry: [`scripts/nightraven-projects.conf`](../scripts/nightraven-projects.conf)

Related: [`NIGHTRAVEN_UNIFIED_STACK.md`](NIGHTRAVEN_UNIFIED_STACK.md) · [`37_NIGHTRAVEN.md`](37_NIGHTRAVEN.md) · [`CURSOR_INSTALL.md`](CURSOR_INSTALL.md)

---

## Summary

| Workspace | Role | Stack phase | Bible source | L3 chain | Hooks |
|-----------|------|-------------|--------------|----------|-------|
| **nightraven** (published) | Framework | **Phase 2** | Vendored `docs/37_NIGHTRAVEN.md` | Full bootstrap | `.cursor/hooks.json` |
| **UAIPOS** (master BAIC) | Constitution / master | **Phase 2** | Canonical for upstream §2.7; **vendor from** published `nightraven` for §1/§3 doctrine | Full BAIC `docs/` | `.cursor/hooks.json` |
| **NightRaven** | Consumer app | **Phase 1** | Pointer → UAIPOS Bible | Overlay + handoff + protocol | Via `install.sh` demo / user global |
| **~/.cursor** (user global) | Cursor-wide entry | **Phase 2** | Pointer → `Projects/nightraven` | N/A (not a repo) | `hooks/nightraven/` |

```text
Experience (portable)     published nightraven doc 37  ──vendor──►  UAIPOS master (upstream §2.7)
App memory (local)        NightRaven handoff/overlay ONLY in that repo (Xcode target OneDayMillionaire until rename)
User global               ~/.cursor rule + hooks — applies when project lacks local rule
Loop snapshot             NightRaven-Docs-extracted/ — reference only; sync via scripts/sync-snapshot.sh
```

---

## Canonical Bible scope (#8)

| Role | Canonical source | Notes |
|------|------------------|-------|
| **Published portable law** | `Projects/nightraven/docs/37_NIGHTRAVEN.md` | §1/§3 doctrine, §2.7 promote-to-standard, §2.8, install defaults |
| **Master BAIC upstream** | `UAIPOS/docs/37_NIGHTRAVEN.md` | §2.7 **Upstream to master**; vendor portable sections **from** published nightraven |
| **Loop snapshot** | `~/NightRaven/NightRaven-Docs-extracted/` | **Not authoritative** — `sync-snapshot.sh` after cycles; `lint-framework-memory.sh snapshot` |

**Release/sync step:** Edit portable law in **published nightraven** → push → `./scripts/sync-snapshot.sh` → vendor delta to UAIPOS when master needs upstream block only.

---

## Scan output (auto-generated shape)

Run `./scripts/scan-nightraven-projects.sh --markdown` to refresh this table:

| Label | Path | Role | Phase | Bible | Artifacts | Latest Recent session |
|-------|------|------|-------|-------|-----------|----------------------|
| **nightraven (published)** | `/Users/brentlenninorlanda/Projects/nightraven` | framework | 2 | vendored | 15/16 | **2026-06-09** — post-merge audit VERIFIED; polish stale Touch 3 docs (`e2c4885`) |
| **UAIPOS (master BAIC)** | `/Users/brentlenninorlanda/Projects/Universal_AI_Project_Operating_System` | master | 2 | vendored | 6/16 | **NightRaven isolation + fast start:** doc 37 §2.6 ↔ docs/35–36; BankrollCalendar chain pointers |
| **NightRaven** | `/Users/brentlenninorlanda/Developer/NightRaven` | app | 1 | UAIPOS pointer | 9/16 | Repo folder renamed from BankrollCalendar; Xcode target still OneDayMillionaire until rename |
| **Cursor user global** | `~/.cursor` | user-global | 2 | pointer | 3/3 | Always-on rule when no project rule |

---

## Per-project detail

### 1. nightraven (published framework)

| Field | Value |
|-------|-------|
| **Path** | `/Users/brentlenninorlanda/Projects/nightraven` |
| **Remote** | https://github.com/brennin0820/nightraven |
| **L0–L4** | L0 full · L1 `AGENTS.md` + rule · L2 vendored Bible + unified stack · L3 handoff/changelog/learning log · L4 Phase 2 hooks + `install.sh` |
| **Focus** | Portable law, installer, templates, Phase 2 hook scaffold |
| **Overlay vocabulary** | Framework meta — see [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) (template slots) |
| **Install** | Self-hosted; `install.sh` bootstraps other repos |

**Key artifacts:** `37_NIGHTRAVEN.md`, `NIGHTRAVEN_UNIFIED_STACK.md`, `NIGHTRAVEN_SESSION_SPEC_TREES.md`, `CURSOR_INSTALL.md`, `HOOKS_SETUP.md`, `install.sh`, `templates/`

**Missing vs full stack:** `docs/USER_CONTEXT_PROTOCOL.md` (use `examples/appendix/` instead)

---

### 2. UAIPOS (master BAIC)

| Field | Value |
|-------|-------|
| **Path** | `/Users/brentlenninorlanda/Projects/Universal_AI_Project_Operating_System` |
| **Role** | Master constitution — **BigBrother** nickname; **NightRaven Bible** source of truth for laws |
| **L0–L4** | L0 full BAIC `docs/` · L1 `AGENTS.md` + `brents-ai-constitution.mdc` · L2 `37_NIGHTRAVEN.md` (largest) · L3 master handoff/logs · L4 hooks (minimal) |
| **Focus** | Framework maintenance, doc 35–36 fast start/isolation, improvement loop template |
| **Sync note** | When doc 37 changes here, **vendor or sync** into `Projects/nightraven/docs/37_NIGHTRAVEN.md` |

**Key artifacts:** `docs/37_NIGHTRAVEN.md`, `docs/32_BIGBROTHER_OVERSIGHT.md`, `docs/35_FAST_START.md`, `docs/36_PROJECT_ISOLATION.md`, `docs/NIGHTRAVEN_IMPROVEMENT_LOOP_CYCLE_PROMPT.md`

**Not duplicated in nightraven repo:** Full `docs/01`–`08` BAIC chain — apps point here or vendor lean subset only.

---

### 3. NightRaven (consumer app)

| Field | Value |
|-------|------|
| **Path** | `/Users/brentlenninorlanda/Developer/NightRaven` |
| **Product** | **Gambling Tracker** · ship name **NightRaven** · Xcode target **OneDayMillionaire** (until rename) · repo folder **`NightRaven`** |
| **L0–L4** | L0 app git · L1 `AGENTS.md` + rules · L2 Bible via **UAIPOS pointer** · L3 full overlay/handoff/protocol · L4 none in-repo (user global hooks) |
| **Tier** | Tier 0 lean — principles via user constitution + master pointers |
| **Bible pointer** | Overlay → `/Users/brentlenninorlanda/Projects/Universal_AI_Project_Operating_System/docs/37_NIGHTRAVEN.md` |

**Vocabulary (overlay — do not collapse layers):**

| Layer | Name |
|-------|------|
| Product / category | Gambling Tracker |
| Brand / ship name | **NightRaven** |
| Xcode target (until rename) | OneDayMillionaire |
| Platform interaction (NGIA) | NightRaven* types (`NightRavenPlatformRoot`, …) |
| Repo folder | NightRaven |
| Code domain | `bankroll` enums (keep after renames) |
| Oversight (local) | **NightRaven** (was NightRaven in app repo; framework repo unchanged) |
| BAIC global | BigBrother |

**Domain rules:** `gambling-tracker.mdc`, `model-delegation-efficiency.mdc`

**App state (snapshot — read live handoff for current):** MVP complete (phases 0–17); NGIA POC (Phases 1–3); 38 tests pass; Budget/Saving/Allowance/PayStub contexts shipped. **§2.8 adopter:** task-worthiness gate source `364cd1a` → nightraven `bfad585` (2026-06-09).

**Isolation:** Handoff in NightRaven is **app memory only** — never paste into nightraven or UAIPOS handoff.

---

### 4. Cursor user global (`~/.cursor`)

| Field | Value |
|-------|-------|
| **Path** | `~/.cursor/rules/nightraven-context-intent.mdc`, `~/.cursor/hooks.json`, `~/.cursor/hooks/nightraven/` |
| **Role** | Always-on oversight when opening any workspace; Bible fallback path → `Projects/nightraven` |
| **Installed via** | `install.sh --user --no-project` from nightraven repo (`a14ac10`) |

**Laws in global rule:** `+#` only · parallel reads · this-repo app memory · Tier C · intent ladder

---

## L0–L4 matrix (all workspaces)

| Layer | nightraven | UAIPOS | NightRaven | ~/.cursor |
|-------|----------|--------|------------------|-----------|
| **L0 Git truth** | Framework docs | Master `docs/` | App + overlay/handoff | N/A |
| **L1 Entry** | Rule + `AGENTS.md` | Rule + `AGENTS.md` | Rule + `AGENTS.md` | Global rule |
| **L2 Core** | **Canonical portable Bible** | Vendor from nightraven; upstream §2.7 | Pointer to nightraven Bible | Pointer to nightraven |
| **L3 Chain** | Bootstrap templates | Full BAIC chain | Overlay + handoff + protocol | — |
| **L4 Optional** | Hooks + installer | Hooks | User-global hooks | Hooks |

---

## How to refresh this inventory

```bash
# From nightraven repo root
./scripts/scan-nightraven-projects.sh              # human-readable report
./scripts/scan-nightraven-projects.sh --markdown # paste into "Scan output" § above
./scripts/sync-snapshot.sh                       # LOOP step 7 — loop workspace snapshot
./scripts/lint-framework-memory.sh                       # soft checks (snapshot drift, handoff dates)

# Add a new NightRaven workspace
echo '/path/to/repo|My App|app' >> scripts/nightraven-projects.conf
```

**After refresh:** `+#` append a line to [`04_LEARNING_LOG.md`](04_LEARNING_LOG.md) and **Recent sessions** in [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md) when the registry changes materially.

---

## What this file does NOT do

| Anti-pattern | Why |
|--------------|-----|
| Copy NightRaven **Already done** here | Cross-repo app memory bleed (§2.6) |
| Treat UAIPOS handoff as app state | Master ≠ consumer app |
| Replace per-repo handoff reads | Inventory is index only — agents still read **local** `docs/14` |
| Authoritative Mem0/Zep index | Git docs win — see unified stack §6 |

---

*Established 2026-06-10. Aggregates NightRaven adoption across Brent's workspaces; refresh via scan script. NightRaven always watches.*
