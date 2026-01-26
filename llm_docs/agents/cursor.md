# Cursor Agent Rules

These rules tell Cursor how to use the agent-agnostic skills in `llm_docs/skills`.

## Command Map

- `/write-article <topic>` -> `llm_docs/skills/write-article.md`
- `/update-article <path> <prompt>` -> `llm_docs/skills/update-article.md`

If a user asks for a new article or an update without the command, treat it as the matching skill.

## Required Reading (Content Work)

- `llm_docs/guidelines-content/content-structure.md`
- `llm_docs/guidelines-content/content-guidelines.md`
- `llm_docs/guidelines-content/research-and-fact-checking.md`
- `llm_docs/guidelines-content/markdown-features.md`
- `llm_docs/guidelines-content/persona.md`

## Required Reading (Code Changes)

If the prompt is about changing site functionality, read:

- `llm_docs/guidelines-code/coding-standards.md`

## Operating Rules

- Specs are the highest-priority sources.
- Code blocks must collapse non-essential lines.
- Do not add legacy frontmatter fields (publishedOn/lastUpdatedOn/tags).
- Maintain the principal-engineer persona.
