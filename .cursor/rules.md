# Cursor Rules

## Project Context

Astro-based technical blog for experienced software professionals. Highly technical content with strict TypeScript.

**Full Documentation**: `llm_docs/` directory contains detailed guides:

- `content.md` - Content categories, schemas, frontmatter rules
- `markdown-features.md` - Expressive Code features, Mermaid, KaTeX
- `code-standards.md` - TypeScript strictness, CSS minimalism, accessibility
- `commands.md` - Commands and draft workflow

## Essential Rules

### TypeScript (Strictest)

```typescript
// REQUIRED: Type-only imports
import type { Props } from "./types"

// REQUIRED: Explicit types
function process(data: InputData): OutputData {}

// NO: Implicit any
function bad(data) {} // Error
```

### Code Blocks - ALWAYS Collapse Boilerplate

````markdown
```ts title="src/api.ts" collapse={1-5} {8-10}
// Lines 1-5 collapsed (imports)
import { db } from "./db"
import { validate } from "./validate"
import type { User } from "./types"
import { logger } from "./logger"

// Lines 8-10 highlighted (key code)
async function createUser(data: UserInput): Promise<User> {
  const validated = validate(data)
  return db.users.create(validated)
}
```
````

### CSS - Minimalistic Only

```astro
<!-- GOOD: Tailwind utilities -->
<div class="flex gap-4 bg-white p-4 dark:bg-gray-900">
  <!-- BAD: Unnecessary wrappers -->
  <div class="outer-wrapper">
    <div class="inner-wrapper"></div>
  </div>
</div>
```

### Content Structure

```markdown
# Title (becomes frontmatter title)

Description paragraph(s) here.

## Table of Contents

## Section One

...
```

### File Naming

```
content/writing/category/YYYY-MM-DD-slug.md
content/writing/javascript/2024-03-15-event-loop.md
```

## Commands

| Command                               | Description                     |
| ------------------------------------- | ------------------------------- |
| `Review article: <path>`              | Review for standards compliance |
| `Generate article: <topic>`           | Create new technical article    |
| `Generate article from draft: <slug>` | Generate from draft folder      |
| `Create draft: <slug>`                | Initialize new draft            |

## Content Collections

| Collection | Subcategory Required | Type Field |
| ---------- | -------------------- | ---------- |
| writing    | No                   | No         |
| deep-dives | Yes (`category/sub`) | No         |
| work       | No                   | Optional   |
| uses       | No                   | No         |

## Performance Targets

- LCP < 2.5s
- CLS < 0.1
- INP < 200ms
- Static generation only
