# Claude Code Instructions

This file provides context and instructions for AI agents working on this project.

## Project Overview

This is a personal website/blog built with Astro, deployed to:
- **Production**: https://sujeet.pro (Cloudflare Pages)
- **Preview**: https://projects.sujeet.pro/v4.sujeet.pro/ (GitHub Pages)

## Tech Stack

- **Framework**: Astro 5.x (static site generation)
- **Styling**: Tailwind CSS 4.x
- **Language**: TypeScript
- **Deployment**: Cloudflare Pages (primary), GitHub Pages (preview)
- **Search**: Orama (client-side search)
- **Testing**: Vitest, Playwright

## LLM-Friendly Documentation References

When working on this project, refer to these LLM-optimized documentation sources for accurate, up-to-date information:

### Primary Documentation (Use These First)

| Tool | LLM Docs URL | Notes |
|------|--------------|-------|
| **Astro** | https://docs.astro.build/llms-full.txt | Complete Astro documentation - USE THIS for all Astro questions |
| **Astro** | https://docs.astro.build/llms.txt | Index of available LLM doc variants |
| **Cloudflare** | https://developers.cloudflare.com/llms-full.txt | Full Cloudflare platform docs (Workers, Pages, etc.) |
| **Cloudflare** | https://developers.cloudflare.com/llms.txt | Index of Cloudflare docs |
| **Vite** | https://vite.dev/llms.txt | Vite build tool documentation |
| **Vitest** | https://vitest.dev/llms.txt | Testing framework docs |

### Tools Without LLM-Specific Docs

These tools don't have dedicated llms.txt files yet. Use their standard documentation:

| Tool | Documentation URL |
|------|-------------------|
| **Tailwind CSS** | https://tailwindcss.com/docs |
| **TypeScript** | https://www.typescriptlang.org/docs |
| **ESLint** | https://eslint.org/docs |
| **Prettier** | https://prettier.io/docs |
| **Playwright** | https://playwright.dev/docs |
| **Orama** | https://docs.orama.com |

## Project Structure

```
src/
├── content.config.ts    # Content collections configuration
├── content/             # Markdown content (writing, deep-dives, work, uses)
├── pages/               # Astro pages and routes
├── layout/              # Layout components
├── components/          # Reusable UI components
├── styles/              # Global CSS (Tailwind)
└── utils/               # Utility functions

scripts/
├── validation/          # Build validation scripts
└── setup.ts             # Project setup script

public/                  # Static assets (fonts, favicons)
```

## Key Configuration Files

- `astro.config.ts` - Astro configuration with markdown plugins
- `wrangler.jsonc` - Cloudflare deployment config
- `tailwind.config.ts` - Tailwind CSS configuration (if exists)
- `.github/workflows/astro.yml` - GitHub Pages deployment

## Build Commands

```bash
# Development
npm run dev          # Local dev server (root path)
npm run dev:gh       # Dev server with GitHub Pages base path

# Production builds
npm run build:cf     # Build for Cloudflare (root path)
npm run build:gh     # Build for GitHub Pages (with base path)

# Validation
npm run validate:static   # Validate built HTML files
npm run validate:live     # Validate running site

# Deployment
npm run deploy       # Deploy to Cloudflare
```

## Important Patterns

### Base Path Handling

The site supports deployment to both root (`/`) and subdirectory (`/v4.sujeet.pro/`). Use these utilities:

```typescript
import { getFilePath, getLinkProps } from "@/utils/link.utils"

// For assets (fonts, images, etc.)
const fontPath = getFilePath("fonts/my-font.woff2")

// For page links
const { href } = getLinkProps({ href: "/writing" })
```

### Content Collections

Content uses Astro's Content Layer API with `glob` and `file` loaders:
- Writing (blog posts): `content/writing/`
- Deep Dives: `content/deep-dives/`
- Work: `content/work/`
- Uses: `content/uses/`

### Environment Variables

No environment variables are required. Defaults:
- Site origin: `https://sujeet.pro`
- Base path: `/` (root)

Override via CLI: `astro build --site https://example.com --base /path/`

## Common Tasks

### Adding a New Blog Post

1. Create markdown file in `content/writing/[category]/YYYY-MM-DD-slug.md`
2. Include required frontmatter (title, description, publishedOn)
3. Build and validate: `npm run build:cf && npm run validate:static`

### Updating Dependencies

1. Check LLM docs for breaking changes (links above)
2. Run upgrade: `npm update` or `npx @astrojs/upgrade`
3. Test both builds: `npm run build:cf && npm run build:gh`
4. Validate: `npm run validate:static`

### Debugging Build Issues

1. Check Astro docs: https://docs.astro.build/llms-full.txt
2. For Cloudflare issues: https://developers.cloudflare.com/llms-full.txt
3. Run validation: `npm run validate:static`
4. Check logs in `logs/` folder

## Styling Conventions

This project follows strict styling conventions for maintainability, consistency, and accessibility.

### Core Principles

1. **Custom Classes in HTML** - Never use inline Tailwind utility classes directly in HTML. Always use semantic custom class names.
2. **@apply for Implementation** - Define custom classes in CSS using `@apply` with Tailwind utilities.
3. **CSS Custom Properties** - All colors, spacing, and theming values must use CSS variables for dynamic theming.
4. **Accessibility First** - All styles must meet WCAG 2.1 AA guidelines.

### Pattern: Custom Classes with @apply

```astro
<!-- ❌ BAD: Inline Tailwind classes -->
<button class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
  Click me
</button>

<!-- ✅ GOOD: Semantic custom class -->
<button class="btn-primary">
  Click me
</button>
```

```css
/* In global.css or component <style> */
.btn-primary {
  @apply flex items-center gap-2 px-4 py-2 rounded-md;
  @apply text-base font-medium; /* Accessibility: min 16px font */
  background: var(--color-accent);
  color: white;
  transition: background-color 150ms ease;
}

.btn-primary:hover {
  background: var(--color-accent-hover);
}
```

### CSS Custom Properties (Design Tokens)

All dynamic values are defined in `@theme` block in `global.css`:

```css
@theme {
  /* Colors - must meet WCAG contrast ratios */
  --color-bg: #fefefe;
  --color-bg-alt: #f5f5f4;
  --color-text: #1f2937;           /* 4.5:1 contrast ratio min */
  --color-text-muted: #6b7280;     /* 4.5:1 for large text */
  --color-border: #e5e7eb;
  --color-accent: #2563eb;         /* 4.5:1 contrast on bg */
  --color-accent-hover: #1d4ed8;

  /* Layout */
  --content-width: 80ch;           /* Optimal reading width */
  --sidebar-width: 16rem;
  --sidebar-gap: 3rem;

  /* Typography */
  --font-sans: "Open Sans", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}
```

### Accessibility Requirements

Follow these minimum requirements for WCAG 2.1 AA compliance:

| Element | Requirement |
|---------|-------------|
| **Body text** | Minimum 16px (1rem), line-height 1.5+ |
| **Small text** | Minimum 14px (0.875rem), only for non-essential info |
| **Touch targets** | Minimum 44x44px for buttons/links on mobile |
| **Color contrast** | 4.5:1 for normal text, 3:1 for large text (18px+) |
| **Focus indicators** | Visible 2px outline with offset |
| **Interactive spacing** | Minimum 8px between clickable elements |

### Class Naming Convention

Use semantic, BEM-inspired naming:

```css
/* Component block */
.content-item { }

/* Component element */
.content-item-title { }
.content-item-meta { }
.content-item-excerpt { }

/* Component modifier */
.content-item--featured { }

/* State classes */
.is-active { }
.is-open { }
.is-hidden { }
```

### Component Style Location

- **Global/shared styles** → `src/styles/global.css`
- **Component-specific styles** → `<style is:global>` in component file (scoped by parent selector)
- **Dynamic JS-generated content** → Must use `<style is:global>` with parent ID/class selector

**IMPORTANT**: When using `@apply` in component `<style is:global>` blocks with Tailwind CSS v4, you MUST add `@reference "tailwindcss";` at the top of the style block:

```astro
<!-- For dynamically generated content -->
<style is:global>
  @reference "tailwindcss";

  #my-component .dynamic-element {
    @apply flex items-center;
  }
</style>
```

### Style Organization in global.css

Styles are organized in sections:

1. **DESIGN TOKENS** - CSS custom properties in `@theme`
2. **BASE RESETS** - Element defaults (html, body, headings)
3. **TYPOGRAPHY CLASSES** - .heading-1, .body-text, .text-muted
4. **LAYOUT CLASSES** - .content-container, .layout-3col-*
5. **INTERACTIVE ELEMENTS** - .link, .btn, .nav-link
6. **CONTENT COMPONENTS** - .content-item, .category-card
7. **TAGS & BADGES** - .tag, .badge
8. **PROSE CUSTOMIZATION** - Typography plugin overrides
9. **UTILITY CLASSES** - .sp-border-muted, etc.

### Examples

#### Button with Icon

```astro
<button class="btn-icon" aria-label="Close menu">
  <Icon name="carbon:close" />
</button>
```

```css
.btn-icon {
  @apply flex items-center justify-center;
  @apply p-3; /* 44px touch target with icon */
  color: var(--color-text);
  transition: background-color 150ms ease;
}

.btn-icon:hover {
  background: var(--color-bg-alt);
}

.btn-icon svg {
  @apply h-5 w-5; /* 20px icon */
}
```

#### Card Component

```astro
<article class="card">
  <h3 class="card-title">Title</h3>
  <p class="card-description">Description</p>
</article>
```

```css
.card {
  @apply block rounded-md border p-4;
  border-color: var(--color-border);
  transition: border-color 150ms ease;
}

.card:hover {
  border-color: var(--color-accent);
}

.card-title {
  @apply text-lg font-medium mb-2;
  color: var(--color-text);
}

.card-description {
  @apply text-base;
  color: var(--color-text-muted);
}
```

## Notes for AI Agents

1. **Always fetch LLM docs** before making changes to framework code
2. **Test both deployment modes** (Cloudflare and GitHub Pages)
3. **Use validation scripts** after builds to catch broken links
4. **Check base path handling** for all new assets and links
5. **Logs are in `logs/`** folder (git-ignored)
6. **Follow styling conventions** - Use custom classes with @apply, CSS variables for theming
7. **Verify accessibility** - Check contrast ratios, touch targets, and font sizes
