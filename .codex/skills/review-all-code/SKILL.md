---
name: review-all-code
description: Review the entire codebase and refactor as needed using the agent-agnostic skill definition in llm_docs/skills/review-all-code.md and the canonical code guidelines in llm_docs/guidelines-code. Use when the user asks to review all code, enforce code guidelines, or make codebase-wide improvements.
---

# Review All Code Skill (Codex)

Use this skill when the user requests a full codebase review or refactor, or invokes `/review-all-code`.

## Instructions

1. Read:
   - `llm_docs/skills/review-all-code.md`
   - `llm_docs/guidelines-code/*`
2. Follow the workflow exactly and keep changes readable.
3. Propose a staged plan before large refactors.
4. After edits, run `npm run check`, `npm run lint`, `npm run format`, and `npm run build`. Fix failures and re-run until they pass.
