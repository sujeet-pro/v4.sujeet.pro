# Code Standards

## TypeScript

### Strictness Level

This project uses the **strictest** TypeScript configuration:

```json
{
  "extends": "astro/tsconfigs/strictest",
  "compilerOptions": {
    "strict": true,
    "verbatimModuleSyntax": true
  }
}
```

### Requirements

- **All code must be TypeScript** - No `.js` files except configuration
- **Explicit types required** - No implicit `any`
- **Strict null checks** - Handle `null` and `undefined` explicitly
- **No unused variables** - Remove or prefix with `_`
- **Verbatim module syntax** - Use `import type` for type-only imports

### Import Conventions

```ts
// Type-only imports
import type { SomeType } from "./types"

// Value imports
import { someFunction } from "./utils"

// Path aliases
import { helper } from "@/utils/helper"
import { SITE_NAME } from "@constants/site"
```

### Path Aliases

| Alias          | Path                |
| -------------- | ------------------- |
| `@/*`          | `./src/*`           |
| `@constants/*` | `./src/constants/*` |

### Naming Conventions

- **Files**: `kebab-case.ts`, `kebab-case.utils.ts`
- **Components**: `PascalCase.astro`
- **Functions**: `camelCase`
- **Types/Interfaces**: `PascalCase`
- **Constants**: `SCREAMING_SNAKE_CASE` or `camelCase`

## CSS / Tailwind

### Minimalistic Approach

**Critical**: Follow a minimalistic approach for all CSS:

1. **Prefer Tailwind utilities** over custom CSS
2. **Avoid redundant styles** - Don't add styles that have no visual effect
3. **Use semantic class names** only when utilities are insufficient
4. **No inline styles** unless absolutely necessary
5. **Keep specificity low** - Avoid deep nesting

### Tailwind Guidelines

```astro
<!-- Good: Utility-first -->
<div class="flex items-center gap-4 p-4">
  <!-- Avoid: Unnecessary wrappers -->
  <div class="wrapper">
    <div class="container">
      <div class="content"></div>
    </div>
  </div>
</div>
```

### Custom CSS Rules

When custom CSS is needed:

```css
/* Use Tailwind's @apply sparingly */
.prose-custom {
  @apply prose prose-lg dark:prose-invert;
}

/* Prefer CSS custom properties for theming */
:root {
  --color-primary: theme("colors.blue.500");
}
```

### Dark Mode

Use Tailwind's dark mode variant:

```astro
<div class="bg-white text-black dark:bg-gray-900 dark:text-white"></div>
```

## Astro Components

### Component Structure

```astro
---
// 1. Imports
import type { Props } from "./types"
import { helper } from "@/utils"

// 2. Props interface
interface Props {
  title: string
  description?: string
}

// 3. Props destructuring with defaults
const { title, description = "" } = Astro.props

// 4. Data fetching/processing
const data = await getData()
---

<!-- 5. Template -->
<article class="prose">
  <h1>{title}</h1>
  {description && <p>{description}</p>}
</article>

<!-- 6. Scoped styles (if needed) -->
<style>
  /* Minimal custom styles */
</style>
```

### Best Practices

1. **Type all props** - Use TypeScript interfaces
2. **Destructure with defaults** - Handle optional props explicitly
3. **Use content collections** - For all structured content
4. **Prefer static rendering** - Avoid client-side JavaScript when possible
5. **Lazy load when appropriate** - Use `client:*` directives wisely

## Accessibility

### Requirements

1. **Semantic HTML** - Use appropriate elements (`<article>`, `<nav>`, `<main>`)
2. **ARIA labels** - Add where semantic meaning isn't clear
3. **Color contrast** - Maintain WCAG AA compliance
4. **Keyboard navigation** - All interactive elements must be keyboard accessible
5. **Alt text** - All images must have descriptive alt text
6. **Focus indicators** - Visible focus states for all interactive elements

### Common Patterns

```astro
<!-- Skip link -->
<a href="#main-content" class="sr-only focus:not-sr-only"> Skip to main content </a>

<!-- Accessible icon button -->
<button aria-label="Close menu" type="button">
  <Icon name="carbon:close" />
</button>

<!-- Screen reader only text -->
<span class="sr-only">Additional context for screen readers</span>
```

## Performance

### Build Time

- Minimize plugin processing
- Use efficient glob patterns
- Avoid unnecessary file reads

### Runtime (Web Vitals)

| Metric | Target  |
| ------ | ------- |
| LCP    | < 2.5s  |
| CLS    | < 0.1   |
| INP    | < 200ms |

### Optimization Checklist

- [ ] Images optimized and lazy-loaded
- [ ] Fonts preloaded
- [ ] CSS inlined for critical path
- [ ] JavaScript minimal and deferred
- [ ] Prefetching enabled for navigation
- [ ] Static generation for all pages

### Image Optimization

```astro
---
import { Image } from "astro:assets"
import myImage from "../assets/image.png"
---

<Image src={myImage} alt="Descriptive alt text" width={800} height={600} loading="lazy" />
```

## ESLint & Prettier

### Auto-formatting

```bash
npm run format        # Format all files
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
```

### Prettier Config

- Print width: 120
- No semicolons
- Trailing commas: all
- Single quotes: false (double quotes)
- Arrow parens: always

### Pre-commit Checks

Always run before committing:

```bash
npm run check         # TypeScript
npm run lint          # ESLint
npm run format        # Prettier
```
