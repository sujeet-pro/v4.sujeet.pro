# Claude Code Rules

## Project Context

Astro-based technical blog for experienced software professionals (senior/staff/principal engineers). All content is highly technical and structured for cohesive reading.

**Documentation**: See `llm_docs/` for detailed guides:

- [content.md](../llm_docs/content.md) - Content categories, schemas, frontmatter
- [content-guidelines.md](../llm_docs/content-guidelines.md) - Writing standards, conciseness, quality checklist
- [markdown-features.md](../llm_docs/markdown-features.md) - Expressive Code, Mermaid, KaTeX
- [code-standards.md](../llm_docs/code-standards.md) - TypeScript, CSS, accessibility
- [commands.md](../llm_docs/commands.md) - Commands and workflow

## Claude Skills

### Content Skills

| Skill | Trigger | Description |
|-------|---------|-------------|
| `/write-post` | `/write-post <topic>` | Write new blog post with deep research |
| `/review-posts` | `/review-posts <path/topic>` | Review and improve existing post |
| `/sys-design` | `/sys-design <topic>` | Write system design solution document |
| `/research-post` | `/research-post <topic>` | Generate research material for future article |
| `/write-research` | `/write-research <type> <category> <path>` | Convert research into blog post |
| `/review-all` | `/review-all` | Review all posts one by one |

### Code Skills

| Skill | Trigger | Description |
|-------|---------|-------------|
| `/review-code` | `/review-code` | Review entire codebase against standards |
| `/review-changes` | `/review-changes` | Review uncommitted changes only |

## Critical Rules

### Content Creation

- **Audience**: Senior/staff/principal engineers only
- **Conciseness**: No padding, no filler, no tutorial-style hand-holding
- **Every paragraph earns its place** - if removing doesn't reduce understanding, remove it
- **Reading time**: Target < 30 minutes, max 60 minutes
- **Title**: Extracted from H1 heading (don't add to frontmatter)
- **Description**: Paragraphs between H1 and "Table of Contents"
- **Publish date**: From filename `YYYY-MM-DD-slug.md`
- **No manual ToC**: Auto-generated

### Code Blocks

**ALWAYS collapse boilerplate:**

````markdown
```ts title="example.ts" collapse={1-3}
import { a } from "a"
import { b } from "b"
import { c } from "c"

// Visible main code
function main() {
  return "hello"
}
```
````

- Use `title="filename.ts"` for file context
- Highlight key lines with `{2-4}`
- Collapse imports, setup, helpers unless directly relevant

### TypeScript

- **Strictest mode** - No implicit any, strict null checks
- Use `import type` for type-only imports
- All code must be properly typed
- Use path aliases: `@/*`, `@constants/*`

### CSS

- **Minimalistic** - Prefer Tailwind utilities
- Semantic class names for 3+ utilities
- CSS variables for theming
- Use dark mode variants (`dark:`)

### Accessibility

- Semantic HTML elements
- Alt text for all images
- ARIA labels where needed
- Keyboard navigable

## Content Categories

| Collection | Path | Required Fields |
|------------|------|-----------------|
| posts | `content/posts/` | tags |
| in-research | `content/in-research/` | topic, status |

## Quick Reference

### File Naming

```
YYYY-MM-DD-slug-name.md
2024-03-15-react-hooks.md
```

### Frontmatter Template

```yaml
---
lastReviewedOn: 2024-01-15
tags:
  - tag-id
---
```

### Mermaid Diagram

````markdown
<figure>

```mermaid
flowchart LR
    A[Start] --> B[End]
```

<figcaption>Description of diagram</figcaption>

</figure>
````
