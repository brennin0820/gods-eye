---
description: Saves a specific finding from a /hunt report into the global code bank at ~/.Codex/code-bank/. Use when the user says "bank this", "save this finding", or runs /bank-save with a BANK-ID.
---

## /bank-save — Save a Finding to the Code Bank

**BANK-ID (and optional note):** $ARGUMENTS

---

1. Find the finding in the current conversation that matches the BANK-ID. If no ID given, use the most recently discussed finding.

2. Write a file to `~/.Codex/code-bank/{BANK-ID}.md` using the Bash tool:

```
---
id: {BANK-ID}
topic: {original hunt topic}
title: {finding title}
source: {URL}
language: {swift|typescript|python|etc}
saved: {today YYYY-MM-DD}
tags: [{relevant tags}]
note: {user note if provided, else empty}
---

## {Finding Title}

**Source:** {URL}
**Topic:** {hunt topic}

### Code
```{language}
{full code snippet}
```

### What it does
{brief description}

### Caveats
{gotchas, version constraints, warnings}
```

3. Confirm:
```
Banked: {BANK-ID}
File: ~/.Codex/code-bank/{BANK-ID}.md
Run /bank-list to browse all entries.
```

**Do not apply or insert the code anywhere. Save only.**
