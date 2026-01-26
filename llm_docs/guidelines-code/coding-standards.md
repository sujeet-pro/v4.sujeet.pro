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
