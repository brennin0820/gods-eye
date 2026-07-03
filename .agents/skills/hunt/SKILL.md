---
description: Deep online code hunter. Fans out web searches across multiple angles to find real code examples, libraries, and docs for any topic. Nothing is applied automatically — results are presented for review. Use when the user asks to hunt, search, or find code for a topic.
---

## /hunt — NightRaven Code Hunter

**Topic:** $ARGUMENTS

Nothing found here is applied or merged into the project automatically. You decide what to bank or use.

---

### Phase 1 — Decompose

Break the topic into 3–5 distinct search angles:
- Official docs (Apple Developer, language refs, spec sites)
- GitHub repos with real implementations
- Blog posts / tutorials with working code
- Stack Overflow / forums for edge-case patterns
- Package registries (Swift Package Index, npm) if a library might exist

### Phase 2 — Fan-out search

For each angle, run a targeted web search in parallel. Prefer:
- `site:github.com` for real implementations
- `site:developer.apple.com` for official Apple APIs
- `site:swiftpackageindex.com` for Swift packages
- Include version numbers when version-sensitive (e.g. "iOS 18", "Swift 6")

Fetch the top 2–3 results per angle. Extract: code snippets, API signatures, key patterns.

### Phase 3 — Adversarial verify

For each finding check:
- Is the code current and not deprecated?
- Does it work? (look for tests, CI badges, recent commits, open issues)
- Any known gotchas?

Discard stale or unreliable findings.

### Phase 4 — Present report

Output in this exact format:

---

## Hunt Report: {topic}

### TL;DR
One sentence: best approach and why.

### Findings

**[1] {Title}** — `BANK-ID: hunt-{slug}-1`
- **Source:** {URL}
- **What:** brief description
- **Code:**
  ```swift
  // snippet
  ```
- **Caveats:** version constraints, gotchas

**[2] {Title}** — `BANK-ID: hunt-{slug}-2`
_(up to 5 findings, ranked by reliability and relevance)_

### Recommended Approach
Which finding to start with and why.

---

**Nothing above has been applied to your project.**
To save a finding: `/bank-save hunt-{slug}-{n}`

---

Rules: every finding needs a URL. Code snippets must be syntactically valid. Assign BANK-IDs from the topic slug (lowercase, hyphens).
