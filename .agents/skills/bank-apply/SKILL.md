---
description: Applies a banked code entry to the current project. Always asks the user to confirm the target file and location before writing anything. Use when the user says "apply" or "use" a banked finding.
---

## /bank-apply — Apply a Banked Code Entry

**BANK-ID and optional target:** $ARGUMENTS
_(e.g. `hunt-swiftui-drag-1` or `hunt-swiftui-drag-1 into OneDayMillionaire/Views/SomeView.swift`)_

---

1. Read the bank entry:
   ```bash
   cat ~/.Codex/code-bank/{BANK-ID}.md
   ```
   If not found, say: "No entry found for {BANK-ID}. Run /bank-list to see what's saved."

2. Show the full entry to the user (title, source URL, code, caveats).

3. Determine the target:
   - If `into {file}` was provided, read that file and identify the best insertion point.
   - If no target given, ask: "Where should this go? Provide a file path or describe the target location."

4. Before writing anything, confirm with the user:
   ```
   I'll insert this at line {X} in {file}. Confirm? (yes/no)
   ```
   Wait for explicit confirmation.

5. Only after confirmation — use the Edit tool to insert at the confirmed location.

6. Report:
   ```
   Applied: {BANK-ID}
   Location: {file}:{line}
   Source: {URL}
   ```

**Never write code without the user confirming the exact target location.**
