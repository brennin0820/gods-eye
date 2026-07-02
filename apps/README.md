# NightRaven apps

Application packages in the **NightRaven monorepo**. Each app keeps **its own app memory** (handoff, overlay, product docs) — do not bleed into framework `docs/14` except cross-links.

| App | Path | Status |
|-----|------|--------|
| **NightRaven Compass** | [`compass/`](compass/) | Phase 1 dashboard (React/TS/Vite · mock data) |
| **NightRaven Planner** | [`planner/`](planner/) | Orchestrator app (TS · manifest-driven · LM Studio brain · claim-file coordination · cross-project tracker) |

**Run Compass:**

```bash
cd apps/compass
npm install
npm run dev
```

**Framework + orchestration** live at repo root (NightRaven memory chain · NightRaven Core skill). See [`docs/NIGHTRAVEN_UNIFIED_PRODUCT.md`](../docs/NIGHTRAVEN_UNIFIED_PRODUCT.md).
