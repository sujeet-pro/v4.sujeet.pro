# Claude Agent Rules

These rules tell Claude how to use the agent-agnostic skills in `llm_docs/skills`.

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

### Research & Sources

- Use source priority: specs > official docs > core maintainer content > source code > industry experts.
- Every technical claim must be backed by a source from the hierarchy.
- Quote core maintainers for design rationale.

### Content Quality

- Focus on **why and how**, not just what.
- State current version explicitly; note previous behavior where it has changed.
- Abstract = mental model for revision (NOT section-by-section summary).
- Design reasoning must be explicit for each major choice.
- Edge cases, limits, and failure modes must be exhaustively covered.
- No filler—every paragraph earns its place.

### Formatting

- Code blocks must collapse non-essential lines using `collapse={...}`.
- Do not add legacy frontmatter fields (publishedOn/lastUpdatedOn/tags).
- Maintain the principal-engineer persona.
