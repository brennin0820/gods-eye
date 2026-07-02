# NightRaven Architecture: Local (LM Studio) vs. Cloud Execution

This document defines the execution modes, optimization strategies, and agent behavioral rules for running NightRaven **with** a local LLM server (LM Studio) versus **without** one (cloud frontier models like Claude, Gemini, or GPT-4o).

**Cross-links:** [`NIGHTRAVEN_REPO_OVERLAY.md`](NIGHTRAVEN_REPO_OVERLAY.md) · [`.cursor/rules/nightraven-context-intent.mdc`](../.cursor/rules/nightraven-context-intent.mdc) · [`MCP_SETUP.md`](MCP_SETUP.md) · [`14_SESSION_HANDOFF.md`](14_SESSION_HANDOFF.md)

---

## Architectural Overview

NightRaven is git-native and **environment-agnostic** by design. The rules, overlay, handoff, and MCP server all operate identically regardless of provider. What changes is the **agent's behavioral discipline** — how aggressively it reads context, whether it spawns subagents, and how tightly it manages token budget.

```mermaid
graph TD
    User([User]) --> Input[Session Request]
    Input --> ModeSelector{Provider?}

    ModeSelector -- Local: LM Studio --> LocalEnv[Local Execution Env]
    LocalEnv --> LocalPruning[Strict Context Pruning]
    LocalEnv --> StrictTiers["Tiers 0–2 Read Gating"]
    LocalEnv --> LocalLLM["Local Model (Llama / Qwen / Mistral)"]

    ModeSelector -- "Cloud: Anthropic / Google / OpenAI" --> CloudEnv[Cloud Execution Env]
    CloudEnv --> HighContext[Large Context Processing]
    CloudEnv --> Subagents[Parallel Subagents and Loops]
    CloudEnv --> CloudLLM[Frontier Cloud Model]

    LocalLLM --> MCP["NightRaven MCP Server"]
    CloudLLM --> MCP
    MCP --> GitTruth[(Git Repository Memory)]
```

---

## 1. Execution Mode Comparison

| Dimension | Local Mode — With LM Studio | Cloud Mode — Without LM Studio |
|-----------|------------------------------|--------------------------------|
| **Primary driver** | Privacy, offline, zero API cost | Frontier reasoning, massive context |
| **Model class** | 8B – 70B parameter open-weights | Large closed-weights frontier models |
| **Context window** | Constrained — 8k – 32k tokens | Massive — 128k – 2M+ tokens |
| **Cost** | $0 — local GPU/CPU compute | Variable API token fees |
| **Data privacy** | 100% private — nothing leaves the machine | Code and prompts sent to third-party |
| **Parallelization** | Serial, single-agent preferred | Parallel subagents and loop teams supported |
| **Read strategy** | MCP snippet retrieval; rules file only | Full chain parallel batch reads |
| **Memory writes** | Same — `+#` append via MCP or manual | Same — `+#` append via MCP or manual |

---

## 2. Local Mode (With LM Studio)

The agent operates under hardware constraints. The following design principles enforce execution speed and accuracy under limited context:

### A. Strict Context Pruning and Read Tiers (§2.5)

**Problem:** Loading the full Bible (`37_NIGHTRAVEN.md`, 50KB+), overlay, handoff, and rules instantly saturates a local model's context window, causing hallucination and speed drops.

**Design:**
- For Tier 0–1 tasks: read **only** `.cursor/rules/nightraven-context-intent.mdc` (kept under 3K characters).
- For Tier 2 tasks: add the overlay and the active **Recent sessions** section of the handoff only — not the full file.
- Use the MCP `nightraven_search_memory` tool to pull targeted snippets instead of loading full docs.
- **Never** batch-read Bible + overlay + handoff + changelog in one turn on a local model.

### B. High-Density Handoff Compaction

**Design:**
- The **Recent sessions** list must stay at a maximum of **5 active lines** in local mode.
- Completed task details must be archived immediately to `docs/02_ENGINEERING_CHANGELOG.md`.
- Target handoff file size: **under 5KB** for smooth local context loading.

### C. Single-Agent Serial Workflows

**Design:**
- Disable subagent spawning by default. Concurrent agents on local machines cause GPU VRAM contention, lag, and hangs.
- All audits, verification, and doc reads must run **serially**.
- Loop cycles (§9) are deferred unless Brent explicitly invokes `/loop`.

### D. Recommended Local Models

| Model | Size | Strength | Best for |
|-------|------|----------|----------|
| **Qwen 2.5 Coder 32B** | 32B | Strong code + instruction following | Code tasks, overlay wiring |
| **Llama 3.1 70B Instruct** | 70B | Broad reasoning | Memory/handoff tasks |
| **Mistral 7B Instruct** | 7B | Fast, low VRAM | Quick Q&A, Tier 0–1 |
| **DeepSeek Coder V2** | 16B | Code generation | Feature implementation |

---

## 3. Cloud Mode (Without LM Studio)

Cloud frontier models unlock the full NightRaven capability stack. The design focuses on maximizing depth, parallelization, and cost control.

### A. Multi-Agent Audits — Six-Team Loop (§9)

**Design:**
- Spawn parallel subagents across Architecture, Engineering, Design/UX, QA, Product, and Tier C lenses simultaneously.
- Synthesize results in a single coordinator pass before writing the `+#` memory step.
- Use `nightraven_search_memory` for dedup before writing to the chain.

### B. Long-Context Continuity

**Design:**
- The agent digests the full Bible, overlay, handoff, and changelog at session start.
- Deep semantic search across the whole workspace is available for intent reconstruction.
- The full Interpretation framework (§3) pipeline runs at maximum fidelity.

### C. Token-Cost Discipline

**Design:**
- Enforce the **Fresh Thread Law (§2.8)** strictly: at ~80% context capacity, stop, write a handoff entry, and request a fresh thread.
- Batch all `+#` memory writes into a single Touch 3 AFTER pass — never scatter writes across turns.
- Use MCP `nightraven_append_recent_session` rather than manual file edits to reduce back-and-forth read cycles.

---

## 4. Agent Rules by Execution Mode

These rules are active in `.cursor/rules/nightraven-context-intent.mdc` and apply every session:

**Local Mode (LM Studio — localhost endpoint):**
1. Read ONLY the rules file + overlay vocabulary; do not load full Bible unless task is Tier 3.
2. No subagent spawning. All audits run serially.
3. Keep handoff Recent sessions to 5 items max; compact older entries to changelog first.
4. Use MCP `nightraven_search_memory` for targeted snippet retrieval instead of full doc reads.
5. Defer loop cycles and six-team audits unless Brent explicitly invokes `/loop`.

**Cloud Mode (Anthropic / Google / OpenAI endpoint):**
1. Parallel-read Bible, overlay, handoff, and AGENTS.md at session start (§2.4).
2. Spawn parallel subagents for substantial cross-cutting work (§2.8).
3. Enforce fresh thread + handoff at ~80% context capacity (§2.8).
4. Batch all memory writes into one Touch 3 AFTER pass per session.

---

## 5. LM Studio Quick Setup

1. Download [LM Studio](https://lmstudio.ai/) and install a supported model (see §2 recommendations above).
2. Go to the **Local Server** tab → click **Start Server** (default: `http://localhost:1234`).
3. Open Cursor **Settings → Models → Override Base URL**: set to `http://localhost:1234/v1`.
4. Add a dummy API key (e.g., `lm-studio`).
5. Set the model name to match what is loaded in LM Studio (e.g., `qwen2.5-coder-32b-instruct`).
6. Open a new Agent chat — NightRaven rules load automatically via `.cursor/rules/nightraven-context-intent.mdc`.

The MCP server, handoff files, and all memory chain docs work identically in both modes. The only difference is the agent's read discipline and parallelization strategy as defined in §4 above.

---

## 6. LM Studio serial division improvement loop

**Two distinct LM Studio integrations exist — do not conflate them:** this section covers the **review/improve script** (`scripts/lmstudio-division-improve.sh`) — it critiques division `SKILL.md` files and writes review-only markdown to `docs/lmstudio-reviews/`, never patches or runs an agent. A second, separate integration — `apps/planner/src/llm/lmStudioClient.ts` + `llmBrain.ts` — is the **live orchestrator brain**: it drives the Planner/Researcher/Architect/Builder agents (`apps/planner/src/agents/`) against a running LM Studio server to produce real pipeline output, same serial-only law (§4/§2.9), same OpenAI-compatible contract. See [`docs/NIGHTRAVEN_ROADMAP.md`](NIGHTRAVEN_ROADMAP.md) Arc 1 §2.2 — this second integration has not yet been tested against a live server.

**Goal:** Improve **every** NightRaven division locally without cloud subagents or API cost — one division per LM Studio call.

### When to use

| Use local loop | Use cloud instead |
|---|---|
| Review/refine division SKILL.md contracts | Live `web_search` / `/hunt` (Researcher, Research) |
| Gap analysis from `DIVISION_REGISTRY.md` | Builder implementation + test loops at scale |
| Tier 2 memory/doc polish | Parallel six-team `/loop` audits |

### Divisions covered (serial order)

1. **planner** → **researcher** → **architect** → **auditor** → **builder** → **greenfield**  
2. Runtime (from `nightraven/SKILL.md`): **planning** → **research** → **design**

**Law:** **Never parallel** under LM Studio — wait for each review file before starting the next division.

### Recommended model per division (local)

| Division | Suggested model class | Notes |
|---|---|---|
| Planner, Architect | Qwen 2.5 Coder 32B or Llama 3.1 70B | Structure + reasoning |
| Researcher, Research | Qwen 32B / Llama 70B | SKILL rubric only — no live web |
| Builder | Qwen 2.5 Coder 32B / DeepSeek Coder V2 16B | Code-oriented |
| Auditor, Design | Mistral 7B or Qwen 32B | Read-only critique |
| Greenfield | Llama 70B | Synthesis after serial passes |

Swap models in LM Studio between runs if VRAM is tight — script uses whichever model is loaded (`/v1/models`).

### Run (CLI)

```bash
# LM Studio: Local Server → Start (http://localhost:1234/v1)
./scripts/lmstudio-division-improve.sh --list
./scripts/lmstudio-division-improve.sh --dry-run --division all
./scripts/lmstudio-division-improve.sh --division all
./scripts/lmstudio-division-improve.sh --division auditor --model qwen2.5-coder-32b-instruct
```

**Output:** `docs/lmstudio-reviews/<division>-<timestamp>.md` — review proposals only; apply with **`+#`** to SKILL/registry after Brent says **code it**.

### Personal Network (preferred remote device)

Brent’s live setup (2026-06-13): **MacBook Pro** runs LM Studio UI + **Local Server**; **DESKTOP-7FT26ER** (RTX 4080 · 16 GB VRAM) is **Connected** with **Set as preferred device** ON; **`GPT-OSS 20B`** (gguf) on remote.

| Layer | Role |
|---|---|
| **Mac Local Server** | OpenAI API for scripts — default `http://localhost:1234/v1` |
| **Preferred remote** | GPU/VRAM for loaded model — LM Studio routes inference |
| **Script** | Still serial · one division per call · `--model` from `/v1/models` |

**20B on 16 GB VRAM:** fine for **auditor** · **design** · **researcher/research** (offline rubric); acceptable but lighter for **planner** · **architect** · **builder** gap reviews.

**Don't:** Change `--base-url` to the remote device unless the OpenAI server is actually listening there.

#### Remote model roster (`DESKTOP-7FT26ER` — Brent 2026-06-13)

| Model (UI) | Params | Use in division loop | Division keys |
|---|---|---|---|
| GPT-OSS 20B | 20B | **Yes** — primary | planner · architect · greenfield · planning · builder |
| DeepSeek R1 0528 Qwen3 8B | 8B | **Yes** — critique/rubric | auditor · researcher · research |
| Gemma 4 E4B | ~7.5B | **Yes** — light read-only | design |
| Nomic Embed Text v1.5 | embed | **No** — embeddings only | — |

Swap loaded model on remote between run groups; script stays serial (one division per API call). **Builder** has no 32B coder on this remote — 20B gap review locally; ship code on cloud/Cursor.

### Step-by-step runbook (macOS)

**Prerequisites:** LM Studio **Local Server → Start** (`http://localhost:1234/v1`) · preferred remote connected · load a **chat** model (not Nomic Embed).

```bash
cd /Users/brentlenninorlanda/Developer/NightRaven/nightraven

# Division keys
./scripts/lmstudio-division-improve.sh --list

# Plan without API
./scripts/lmstudio-division-improve.sh --dry-run --division planner

# Exact model id (OpenAI shape: data[].id — not UI label)
curl -s http://localhost:1234/v1/models | python3 -m json.tool
# or ids only:
curl -s http://localhost:1234/v1/models | python3 -c "import json,sys; [print(m['id']) for m in json.load(sys.stdin).get('data',[])]"

# Smoke test — one division
./scripts/lmstudio-division-improve.sh --division planner --model "<id-from-models>"

# Verify review file (not a git commit)
ls -lt docs/lmstudio-reviews/ | head
git status
```

**Under the hood (actual behavior):**

1. Reads **one** division `SKILL.md` snippet (≤12k chars) + registry-known gap.  
2. POST **`/v1/chat/completions`** — asks for markdown review sections (Summary · Top 3 improvements · local constraints · defer-to-cloud · next step).  
3. Writes **`docs/lmstudio-reviews/<division>-<timestamp>.md`**.  
4. **Does not** JSON Patch · **does not** `git apply` · **does not** auto-commit.

**Apply proposals:** **`+#`** to SKILL/registry after Brent says **code it** — never `-#`.

**Supersedes common mis-doc:** external guides claiming the script rewrites division files or commits `Improve planner division: …` — **incorrect for this repo**. **+# Second paste (2026-06-13):** also wrong — dry-run prints **patches/line counts** (actual: division · skill · gap only) · targets `divisions/planner/` tree (actual: one `SKILL.md`) · reviews as **JSON** with `patches` key (actual: **`.md`** markdown) · **`git apply failed`** troubleshooting (actual: script never patches git).

| Symptom | Fix |
|---|---|
| `connection refused` | Start Local Server on Mac |
| `no models loaded` | Load chat model on preferred remote (play button) |
| Wrong model id | Copy from `/v1/models` → `data[].id` |
| Expected auto-commit | Read review markdown; apply manually with ship signal |
| Nomic fails | Embeddings-only — skip for this script |
| **`git apply failed`** in guide | **N/A** — mis-doc; script does not patch |
| Dry-run expected patch preview | Run live call or read `[dry-run]` skill/gap lines only |
| Review file `.json` | Expect **`planner-YYYYMMDD-HHMMSS.md`** |

#### zsh one-liner + expected output (macOS default shell)

**+# Third external paste (2026-06-13) Supersedes:** sample output showing dry-run **“3 files modified, 27 lines added”** or live run **“applies patches”** — **false**; fix steps citing **`git apply` / `git commit` in script** — **false**.

**Interactive (zsh — use `print -n` + `read`, not bash `read -p`):**

```zsh
cd /Users/brentlenninorlanda/Developer/NightRaven/nightraven && \
./scripts/lmstudio-division-improve.sh --dry-run --division planner && \
echo "Available models:" && \
curl -sf http://localhost:1234/v1/models | \
  python3 -c 'import json,sys; print("\n".join(m["id"] for m in json.load(sys.stdin).get("data", [])))' && \
print -n 'Model id: ' && read MODEL_ID && \
./scripts/lmstudio-division-improve.sh --division planner --model "$MODEL_ID" && \
ls -lt docs/lmstudio-reviews/ | head
```

**Non-interactive (Brent remote default — confirm id from `/v1/models`):**

```zsh
MODEL_ID="gpt-oss-20b"
cd /Users/brentlenninorlanda/Developer/NightRaven/nightraven && \
./scripts/lmstudio-division-improve.sh --dry-run --division planner && \
./scripts/lmstudio-division-improve.sh --division planner --model "$MODEL_ID" && \
git status --short docs/lmstudio-reviews/
```

**Expected dry-run excerpt:**

```text
[dry-run] division=planner skill=.claude/skills/divisions/planner/SKILL.md
  gap: Foundation layout + DAG; human gate before phase 1.
Dry-run complete. 1 division(s) planned.
```

**Expected live run excerpt:**

```text
→ improving division: planner (model: gpt-oss-20b)
  wrote: docs/lmstudio-reviews/planner-YYYYMMDD-HHMMSS.md
Done. Reviews under: docs/lmstudio-reviews/
```

**Expected `git status`:** untracked **`?? docs/lmstudio-reviews/planner-….md`** only — no auto-commit.

### After the loop

1. Read reviews — pick one division improvement per session (Tier C bar).  
2. Apply **`+#`** to the division `SKILL.md` or `DIVISION_REGISTRY.md` — never `-#`.  
3. Append handoff **Recent sessions** once for the batch (not per division mid-flight — use `.cursor/.multiphase-in-flight` if orchestrating).  
4. Ship code/agent fixes on **cloud** or Cursor when local review is done.

**Cross-link:** [`DIVISION_REGISTRY.md`](DIVISION_REGISTRY.md) · [`scripts/lmstudio-division-improve.sh`](../scripts/lmstudio-division-improve.sh)
