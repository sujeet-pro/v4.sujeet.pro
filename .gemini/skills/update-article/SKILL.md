---
name: update-article
description: Review and update an article. Triggered by "Review <path>" or "Update <path>". Uses llm_docs/skills/update-article.md.
---

# Update/Review Article Skill (Gemini)

Use this skill when the user requests to "Review" or "Update" an article.

## Instructions

1. Read the following files to establish context and guidelines:
   - `llm_docs/skills/update-article.md` (Core skill definition)
   - `llm_docs/guidelines-content/*.md` (All content guidelines)

2. Follow the workflow defined in `llm_docs/skills/update-article.md`.

3. Key reminders:
   - Perform deep research.
   - Use `collapse={...}` for code blocks.
   - Cite specs.
   - Adhere strictly to the project's markdown features and structure.
