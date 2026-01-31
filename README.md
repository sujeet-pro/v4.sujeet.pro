# Personal Portfolio & Blog

Technical blog for experienced software professionals. Built with Astro, deployed on GitHub Pages.

## Documentation

- [Project Implementation](./docs/project-implementation.md) - Architecture, content collections, search, and deployment
- [Markdown Features](./docs/markdown-features.md) - Complete markdown reference including code blocks, math, and diagrams
- LLM Guidelines:
  - `llm_docs/guidelines-content/` (content writing, research, markdown, persona)
  - `llm_docs/guidelines-code/` (codebase changes)

## Quick Start

```bash
npm install          # Install dependencies
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build locally
```

## Content Structure (Current)

```
content/
├── articles/
│   ├── <category>/
│   │   ├── README.md
│   │   └── <topic>/
│   │       ├── README.md
│   │       └── <article>/
│   │           └── README.md
├── ordering.json5   # Global ordering config
├── home.json5       # Homepage config
├── site.json5       # Site metadata
└── vanity.json5     # Redirects
```

## Writing Content

### Article Location

```
content/articles/<category>/<topic>/<article>/README.md
```

### Document Structure

````markdown
# Article Title

Description paragraph(s) - becomes meta description.

<figure>

```mermaid
flowchart LR
    A[Start] --> B[End]
```
````

<figcaption>Short caption</figcaption>
</figure>

## TLDR

## Section One

## Conclusion

## References

````

### Auto-Extracted Fields

| Field         | Source                             |
| ------------- | ---------------------------------- |
| `title`       | First H1 heading                   |
| `description` | Paragraphs between H1 and first H2 |
| `minutesRead` | Calculated from content            |
| `isDraft`     | H1 starts with `Draft:`            |
| `pageSlug`    | Derived from file path             |
| `category`    | Derived from folder path           |
| `topic`       | Derived from folder path           |
| `postId`      | Article folder name                |

### Draft Posts

Prefix title with "Draft:" to mark as draft:

```markdown
# Draft: Work in Progress
````

### Ordering (Required)

Add new categories, topics, and articles to `content/ordering.json5`:

- `categoryOrder`, `topicsOrder`, `articlesOrder`
- `categoryVsTopics`, `topicVsArticlesOrder`

## Content Collections

| Collection | Path                                                      | Notes            |
| ---------- | --------------------------------------------------------- | ---------------- |
| category   | `content/articles/<category>/README.md`                   | H1 + description |
| topic      | `content/articles/<category>/<topic>/README.md`           | H1 + description |
| article    | `content/articles/<category>/<topic>/<article>/README.md` | Full article     |

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
- `collapse={1-5}` - Collapse boilerplate lines (show only key lines)
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

## Using Claude Code and Codex

This repo is configured for Claude and Codex with specialized skills for content creation.

### Skills

#### Content Skills (Shared)

| Command                           | Description                                |
| --------------------------------- | ------------------------------------------ |
| `/write-article <topic>`          | Write new article with deep research       |
| `/update-article <path> <prompt>` | Update existing article with deep research |

### Example Workflows

#### Write a New Article

```
/write-article Node.js event loop internals - covering phases and common pitfalls
```

Claude will:

1. Research from official docs, source code, expert blogs
2. Create draft structure with outline
3. Write content with mermaid diagrams and inline references
4. Apply quality checks and save to production location

#### Update an Existing Article

```
/update-article content/articles/web-foundations/networking-protocols/http1-1-to-http2-evolution/README.md add a section on HTTP/3 0-RTT risk trade-offs
```

### Key Guidelines

1. **Content**: Use `llm_docs/guidelines-content/` for all article work
2. **Code**: Use `llm_docs/guidelines-code/` only when changing site functionality
3. **Code blocks**: Collapse non-essential lines with `collapse={...}`
4. **Audience**: Senior/staff/principal engineers
5. **Conciseness**: No padding, no filler, every paragraph earns its place

### Configuration

- `.claude/rules.md` - Project rules and skill reference
- `.claude/settings.local.json` - Permissions
- `.claude/skills/` - Claude skill wrappers
- `.codex/skills/` - Codex skill wrappers
- `llm_docs/guidelines-content/` - Content guidelines
- `llm_docs/guidelines-code/` - Coding guidelines
- `llm_docs/skills/` - Agent-agnostic skills

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
