---
name: write-article
description: Write a new article using the agent-agnostic skill definition in llm_docs/skills/write-article.md and the canonical content guidelines in llm_docs/guidelines-content.
---

# Write Article Skill (Claude)

Use this skill when the user requests a new article or uses `/write-article`.

## Instructions

1. **Read** (MUST read before starting):
   - `llm_docs/skills/write-article.md` (canonical workflow)
   - `llm_docs/guidelines-content/*` (all 5 files)

2. **Follow the research-driven workflow**:
   - Use source priority: specs > official docs > core maintainer content > source code
   - Focus on why and how, not just what
   - State current version; note previous behavior where changed

3. **Key requirements**:
   - Abstract = mental model for revision (NOT section summaries)
   - Design reasoning explicit for each major choice
   - Edge cases, limits, failure modes exhaustively covered
   - Code blocks use `collapse={...}`
   - References prioritized (specs first)
