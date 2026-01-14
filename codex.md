# Codex Instructions

## Project

Astro technical blog. Strict TypeScript. Static generation. Web Vitals optimized.

**Documentation**: See `llm_docs/` directory for detailed guides:

- `content.md` - Content schemas, categories, frontmatter
- `markdown-features.md` - Expressive Code, Mermaid, KaTeX
- `code-standards.md` - TypeScript, CSS, accessibility
- `commands.md` - Commands and draft workflow

## Critical Rules

### TypeScript

- Strictest mode (`astro/tsconfigs/strictest`)
- `import type` for type-only imports
- No implicit `any`
- Explicit types required

### Content Files

- H1 = title (auto-extracted)
- Paragraphs after H1 = description
- "Table of Contents" heading required
- Filename: `YYYY-MM-DD-slug.md`

### Code Blocks - Collapse Boilerplate

````markdown
```ts title="file.ts" collapse={1-3}
import { x } from "x"
import { y } from "y"
import type { Z } from "z"

function main() {
  // visible code
}
```
````

### CSS

- Tailwind utilities preferred
- Minimal custom styles
- `dark:` for dark mode

### Accessibility

- Semantic HTML
- Alt text on images
- ARIA where needed

## Structure

```
content/
├── writing/        # Articles
├── deep-dives/     # Educational (needs subcategory)
├── work/           # Design docs
├── uses/           # Tools
└── drafts/         # Draft workflow

llm_docs/           # Detailed documentation
```

## Frontmatter

```yaml
---
lastUpdatedOn: 2024-01-15
tags:
  - tag-id
subcategory: category/subcategory # deep-dives only
---
```

## Commands

```
Review article: <path>
Generate article: <topic>
Generate article from draft: <slug>
Create draft: <slug>
```

## Audience

Experienced software professionals. Highly technical content. Each article cohesive with logical section flow.
