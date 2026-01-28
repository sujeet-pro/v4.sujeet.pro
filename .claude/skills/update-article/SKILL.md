---
name: update-article
description: Update an existing article using the agent-agnostic skill definition in llm_docs/skills/update-article.md and the canonical content guidelines in llm_docs/guidelines-content.
---

# Update Article Skill (Claude)

Use this skill when the user requests an update or uses `/update-article`.

## Instructions

1. **Read** (MUST read before starting):
   - `llm_docs/skills/update-article.md` (canonical workflow)
   - `llm_docs/guidelines-content/*` (all 5 files)

2. **Follow the research-driven workflow**:
   - Use source priority: specs > official docs > core maintainer content > source code
   - Focus on why and how, not just what
   - State current version; note previous behavior where changed

3. **Key requirements**:
   - Abstract = mental model for revision (NOT section summaries)—update if needed
   - Design reasoning explicit for each major choice
   - Edge cases, limits, failure modes exhaustively covered
   - Code blocks use `collapse={...}`
   - References prioritized (specs first)
