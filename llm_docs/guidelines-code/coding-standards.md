# Coding Standards and Practices

These standards reflect the current codebase conventions.

## TypeScript (Strictest)

- Use `astro/tsconfigs/strictest`.
- No implicit `any`.
- Strict null checks.
- Use `import type` for type-only imports.
- Avoid unused variables (prefix with `_` only when required).

```json
{
  "extends": "astro/tsconfigs/strictest",
  "compilerOptions": {
    "strict": true,
    "verbatimModuleSyntax": true
  }
}
```

### Import Conventions

```ts
import type { SomeType } from "./types"
import { someFunction } from "./utils"
import { helper } from "@/utils/helper"
import { SITE_NAME } from "@constants/site"
```

## Code Structure and Maintainability

### Do

- Keep functions small and focused on a single responsibility.
- Use descriptive, domain-specific names for variables, functions, files, and folders.
- Prefer readable control flow with early returns and minimal nesting.
- Split modules by concern; keep each file focused on one purpose.
- Co-locate functions by use case and name folders after the real purpose.
- Use orchestrator functions for multi-step workflows and shared data fetches.
- Centralize shared data loading for validators and pass it into rule-specific checks.
- Optimize for readability and maintainability first; reduce cognitive load.
- Ensure build/dev flows handle adding or removing categories/topics/articles; allow safe fallbacks (e.g., full cache refresh) when needed.
- Keep comments minimal and only for complex or non-obvious logic; explain "why," not "what."
- Update `llm_docs`, `docs`, and `README` whenever behavior or structure changes.
- Use TypeScript everywhere; do not add JavaScript files.

### Don't

- Do not add comments that restate obvious code.
- Do not use vague names like `data`, `temp`, or `thing`.
- Do not build long, multi-purpose functions that mix unrelated concerns.
- Do not rely on hidden side effects or shared mutable state between modules.
- Do not scatter shared data loading across validators.
- Do not keep large catch-all files that combine unrelated responsibilities.
- Do not introduce deep nesting or complex branching when a simpler structure exists.
- Do not mix JavaScript and TypeScript; migrate JS to TS instead.
- Do not sacrifice clarity for micro-optimizations.
- Do not leave docs stale after code changes.

### Validation Scripts

- Terminal output: concise, human-readable summaries with file paths, rule names, and next steps.
- Log output: write a machine-friendly file (JSONL preferred) with fields:
  - `timestamp`, `severity`, `rule`, `file`, `message`, `context`, `suggestion`
- Keep log messages short and actionable; include enough context for an LLM to fix the issue.

## Astro Components

- Type all props.
- Destructure props with defaults.
- Prefer static rendering.

```astro
---
import type { Props } from "./types"

interface Props {
  title: string
  description?: string
}

const { title, description = "" } = Astro.props as Props
---

<article class="article">
  <h1>{title}</h1>
  {description && <p>{description}</p>}
</article>
```

## CSS and Tailwind

This codebase uses **semantic classes** with Tailwind `@apply`. Do not inline Tailwind utility classes in markup.

Rules:

- Create semantic class names in CSS.
- Implement styles with `@apply` in CSS.
- Use CSS custom properties for theming.
- Keep specificity low; avoid deep nesting.

```css
.btn-primary {
  @apply inline-flex items-center gap-2 rounded-md px-4 py-2;
  background: var(--color-accent);
  color: white;
}
```

### Tailwind v4 `@reference`

When using `@apply` inside component `<style is:global>`, add:

```css
@reference "tailwindcss";
```

## Client-Side Scripts

All client-side JavaScript lives in `src/scripts/*.ts`. Each file exports an `init<Name>()` function.

Convention for `.astro` files:

```astro
<script>
  import { initFeature } from "@/scripts/feature"
  document.addEventListener("DOMContentLoaded", initFeature)
  document.addEventListener("astro:page-load", initFeature)
</script>
```

- Use `DOMContentLoaded` + `astro:page-load` for most features
- Use `astro:after-swap` instead of `astro:page-load` when re-init must happen before the new page renders (e.g., accordions)
- Call `init()` directly at module level (no event) for features that must run immediately (e.g., sidebar-toggle)
- Prevent double-initialization with DOM `data-*` attribute guards

## Component Taxonomy

Components in `src/components/` are organized by role:

- `cards/` — Presentational card components (article-card, blog-card, category-card, topic-card, project-card)
- `nav/` — Navigation & sidebar components (sidebar-nav-*, sidebar-toc, category-nav)
- `ui/` — Generic UI components (link, tag-pill, frontmatter, toc, accordion-script, topic-accordion)

Import paths use the `@/components/<category>/` prefix:

```ts
import ArticleCard from "@/components/cards/article-card.astro"
import SidebarToc from "@/components/nav/sidebar-toc.astro"
import Link from "@/components/ui/link.astro"
```

## Content Utilities

Content utilities use a facade pattern in `src/utils/content/`:

- `index.ts` — Public API (re-exports from sub-modules)
- `core.ts` — `processAllContent`, `getProcessedContent`
- `ordering.ts` — Ordering config lookups
- `sorting.ts` — Sort functions
- `validation.ts` — Content structure validation
- `cards.ts` — Card cache building
- `navigation.ts` — Prev/next maps, article detail lists
- Plus: `types.ts`, `helpers.ts`, `drafts.ts`, `headings.ts`, `blogs.ts`, `projects.ts`, `tags.ts`

Pages import from the facade: `import { getAllArticleCards } from "@/utils/content"`

## Accessibility

- Semantic HTML elements (`<main>`, `<article>`, `<nav>`).
- Alt text for all images.
- ARIA labels for non-text controls.
- Keyboard navigable interactions.
- Visible focus states.

## Performance Targets

- LCP < 2.5s
- CLS < 0.1
- INP < 200ms

Optimize images, fonts, and client JS accordingly.
