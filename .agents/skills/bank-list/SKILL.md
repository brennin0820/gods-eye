---
description: Lists all entries saved in the global code bank at ~/.Codex/code-bank/. Supports optional keyword filter. Use when the user asks to browse, list, or search their code bank.
---

## /bank-list — Browse the Code Bank

**Filter (optional):** $ARGUMENTS

---

1. Run this to find all bank entries:
   ```bash
   ls ~/.Codex/code-bank/*.md 2>/dev/null || echo "EMPTY"
   ```

2. Read the frontmatter of each `.md` file (id, topic, title, source, language, saved, tags, note).

3. If a filter was provided, only show entries where the filter appears in id, topic, title, tags, or note (case-insensitive).

4. Present as a table:

```
## Code Bank  ({N} entries)

| ID | Title | Language | Topic | Saved |
|----|-------|----------|-------|-------|
| hunt-storekit-2-sub-1 | StoreKit 2 Purchase | swift | StoreKit subscription | 2026-06-10 |
...

Run /bank-apply {ID} to use one.
```

5. If empty:
```
Code bank is empty.
Run /hunt {topic} to find code, then /bank-save {ID} to store it.
```
