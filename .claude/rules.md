# Claude Code Rules

## Project Context

This is an Astro-based technical blog for experienced software professionals. All content is highly technical and structured for cohesive reading.

**Documentation**: See `llm_docs/` for detailed guides:

- [content.md](../llm_docs/content.md) - Content categories, schemas, frontmatter
- [markdown-features.md](../llm_docs/markdown-features.md) - Expressive Code, Mermaid, KaTeX
- [code-standards.md](../llm_docs/code-standards.md) - TypeScript, CSS, accessibility
- [commands.md](../llm_docs/commands.md) - Commands and draft workflow

## Critical Rules

### TypeScript

- **Strictest mode** - No implicit any, strict null checks
- Use `import type` for type-only imports
- All code must be properly typed

### Content Creation

- **Title**: Extracted from H1 heading (don't add to frontmatter)
- **Description**: Paragraphs between H1 and "Table of Contents"
- **Publish date**: From filename `YYYY-MM-DD-slug.md`
- **Required**: "Table of Contents" heading after description
- **Audience**: Experienced professionals, highly technical

### Code Blocks

- **ALWAYS collapse boilerplate** using `collapse={1-5, 20-25}`
- Use `title="filename.ts"` for file context
- Highlight key lines with `{2-4}`
- Use diff syntax for changes (`+` / `-`)

### CSS

- **Minimalistic approach** - Prefer Tailwind utilities
- No unnecessary wrappers or redundant styles
- Use dark mode variants (`dark:`)

### Accessibility

- Semantic HTML elements
- Alt text for all images
- ARIA labels where needed
- Keyboard navigable

## Commands

```
Review article: <path>              # Review for standards
Generate article: <topic>           # Create new article
Generate article from draft: <slug> # From draft folder
Create draft: <slug>                # Initialize draft
```

## Content Categories

| Collection | Path                  | Required Fields       |
| ---------- | --------------------- | --------------------- |
| writing    | `content/writing/`    | tags                  |
| deep-dives | `content/deep-dives/` | tags, subcategory     |
| work       | `content/work/`       | tags, type (optional) |
| uses       | `content/uses/`       | tags                  |

## Quick Reference

### File Naming

```
YYYY-MM-DD-slug-name.md
2024-03-15-react-hooks.md
```

### Frontmatter Template

```yaml
---
lastUpdatedOn: 2024-01-15
tags:
  - tag-id
---
```

### Code Block with Collapse

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

### Mermaid Diagram

````markdown
```mermaid
flowchart LR
    A[Start] --> B[End]
```
````
