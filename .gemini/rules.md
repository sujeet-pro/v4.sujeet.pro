# Gemini Rules

## Project Overview

Astro technical blog for experienced software professionals. Strict TypeScript, static generation, Web Vitals optimized.

**Detailed Documentation**: Read `llm_docs/` for complete guidelines:

- `content.md` - Content schemas, categories, frontmatter
- `markdown-features.md` - Code highlighting, diagrams, math
- `code-standards.md` - TypeScript, CSS, accessibility requirements
- `commands.md` - Commands and draft workflow

## Core Requirements

### TypeScript

- Extends `astro/tsconfigs/strictest`
- No implicit `any`
- Use `import type` for types
- Explicit return types

### Content

- Title from H1 (auto-extracted)
- Description from paragraphs after H1
- "Table of Contents" heading required
- Filename format: `YYYY-MM-DD-slug.md`

### Code Blocks

**Critical**: Collapse irrelevant lines

````markdown
```ts title="file.ts" collapse={1-4, 15-20} {7-9}
// Collapsed imports
import { a } from "a"
import { b } from "b"
import type { C } from "c"

// Highlighted main code
function main(): Result {
  return process()
}

// Collapsed helpers (lines 15-20)
```
````

### CSS

- Tailwind utilities only
- Minimal custom CSS
- Dark mode via `dark:` variants

### Accessibility

- Semantic HTML
- Alt text required
- ARIA labels
- Keyboard navigation

## Collections

```
content/writing/         # Main articles
content/deep-dives/      # Educational (requires subcategory)
content/work/            # Design docs, case studies
content/uses/            # Tools, productivity
content/drafts/          # Draft workflow
```

## Frontmatter

```yaml
---
lastUpdatedOn: 2024-01-15 # Optional
tags:
  - tag-id # From tags.jsonc
subcategory: cat/subcat # deep-dives only
type: design-doc # work only (optional)
---
```

## Commands

- `Review article: <path>` - Check standards
- `Generate article: <topic>` - New article
- `Generate article from draft: <slug>` - From draft folder
- `Create draft: <slug>` - New draft

## Performance

| Metric | Target  |
| ------ | ------- |
| LCP    | < 2.5s  |
| CLS    | < 0.1   |
| INP    | < 200ms |
