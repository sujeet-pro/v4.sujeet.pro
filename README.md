# Personal Portfolio & Blog

Technical blog for experienced software professionals. Built with Astro, deployed on GitHub Pages.

## Documentation

- [Project Implementation](./docs/project-implementation.md) - Architecture, content collections, search, and deployment
- [Markdown Features](./docs/markdown-features.md) - Complete markdown reference including code blocks, math, and diagrams

## Quick Start

```bash
npm install          # Install dependencies
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build locally
```

## Content Structure

```
content/
├── writing/         # Main technical articles
├── deep-dives/      # Educational content (with category/subcategory)
├── work/            # Design docs, architecture, case studies
├── uses/            # Tools, setup, productivity
├── drafts/          # Draft workflow for article generation
├── tags.jsonc       # Tag definitions
├── categories.jsonc # Deep-dive categories
└── series.jsonc     # Content series
```

## Writing Content

### File Naming

```
YYYY-MM-DD-slug-name.md
2024-03-15-event-loop.md
```

### Document Structure

```markdown
---
lastReviewedOn: 2024-01-15
tags:
  - js
  - design-patterns
---

# Article Title

Description paragraph(s) - becomes meta description.

## Table of Contents

## Section One

...
```

### Auto-Extracted Fields

| Field         | Source                                        |
| ------------- | --------------------------------------------- |
| `title`       | First H1 heading                              |
| `description` | Paragraphs between H1 and "Table of Contents" |
| `publishedOn` | Filename date (YYYY-MM-DD)                    |
| `minutesRead` | Calculated from content                       |

### Draft Posts

Prefix title with "Draft:" to mark as draft:

```markdown
# Draft: Work in Progress
```

### Featured Posts

Add `featuredRank` to frontmatter (lower = higher priority):

```yaml
---
featuredRank: 1
---
```

## Content Collections

| Collection | Path                  | Special Fields                                          |
| ---------- | --------------------- | ------------------------------------------------------- |
| writing    | `content/writing/`    | `featuredRank` (optional)                               |
| deep-dives | `content/deep-dives/` | `subcategory` (required)                                |
| work       | `content/work/`       | `type` (optional: design-doc, architecture, case-study) |
| uses       | `content/uses/`       | -                                                       |

### Deep Dives Subcategories

```yaml
subcategory: system-design/foundations
subcategory: leadership/team-building
subcategory: dsa/algorithms
```

## Markdown Features

### Code Blocks (Expressive Code)

````markdown
```ts title="file.ts" collapse={1-3} {5-7}
// Lines 1-3 collapsed (imports)
import { a } from "a"
import { b } from "b"

// Lines 5-7 highlighted
function main() {
  return "hello"
}
```
````

**Key features:**

- `title="filename"` - Add file context
- `collapse={1-5}` - Collapse boilerplate lines
- `{2-4}` - Highlight lines
- `+` / `-` - Diff syntax
- Line numbers shown by default (except bash/txt)

### Mermaid Diagrams

````markdown
```mermaid
flowchart LR
    A[Start] --> B[End]
```
````

### Math (KaTeX)

```markdown
Inline: $E = mc^2$
Block: $$\int_0^1 x^2 dx$$
```

### Images

```markdown
![Alt text](./image.png) # Standard
![Diagram](./diagram.invert.png) # Inverts in dark mode
![Icon](./icon.inline.svg) # Inlined SVG
```

---

## Using Claude Code

This repo is configured for Claude Code with specialized skills for content creation and code review.

### Claude Skills

#### Content Skills

| Command | Description |
|---------|-------------|
| `/write-post <topic>` | Write new blog post with deep research |
| `/review-posts <path/topic>` | Review and improve existing post |
| `/sys-design <topic>` | Write system design solution document |
| `/research-post <topic>` | Generate research material for future article |
| `/write-research <type> <category> <path>` | Convert research into blog post |
| `/review-all` | Review all posts one by one |

#### Code Skills

| Command | Description |
|---------|-------------|
| `/review-code` | Review entire codebase against standards |
| `/review-changes` | Review uncommitted changes only |

### Example Workflows

#### Write a New Post

```
/write-post Node.js event loop internals - covering phases and common pitfalls
```

Claude will:
1. Research from official docs, source code, expert blogs
2. Create draft structure with outline
3. Write content with mermaid diagrams and inline references
4. Apply quality checks and save to production location

#### Review an Existing Post

```
/review-posts content/posts/web/2024-01-15-caching.md
```

Claude will:
1. Analyze structure and content
2. Fact-check claims via web research
3. Check code blocks for collapse usage
4. Generate detailed report with recommendations

#### Research Before Writing

```
/research-post WebSocket scaling patterns
```

Creates research material in `content/in-research/`. Later convert to article:

```
/write-research posts web content/in-research/2024-01-20-websockets/
```

### Key Guidelines

1. **Code blocks**: Always collapse imports/boilerplate with `collapse={lines}`
2. **TypeScript**: Strictest mode, use `import type` for types
3. **CSS**: Minimalistic - prefer Tailwind utilities
4. **Audience**: Senior/staff/principal engineers
5. **Conciseness**: No padding, no filler, every paragraph earns its place

### Configuration

- `.claude/rules.md` - Project rules and skill reference
- `.claude/settings.local.json` - Permissions
- `.claude/skills/` - Detailed skill documentation
- `llm_docs/` - Content guidelines, code standards, markdown features

---

## Development

```bash
npm run check        # TypeScript type checking
npm run lint         # ESLint
npm run format       # Prettier
npm run test         # Vitest
```

### TypeScript

Uses `astro/tsconfigs/strictest` - no implicit any, strict null checks.

### Path Aliases

```typescript
import { helper } from "@/utils/helper"
import { SITE } from "@constants/site"
```
