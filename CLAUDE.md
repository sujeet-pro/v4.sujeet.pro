# Claude Code Instructions

This file provides context and instructions for Claude Code working on this project.

## Project Overview

Personal technical blog for senior/staff/principal engineers. Built with Astro, deployed to GitHub Pages.

**Production**: https://sujeet.pro

## Claude Skills

Use these commands for common tasks:

### Content Skills

| Command                                    | Description                                   |
| ------------------------------------------ | --------------------------------------------- |
| `/write-post <topic>`                      | Write new blog post with deep research        |
| `/review-posts <path/topic>`               | Review and improve existing article           |
| `/sys-design <topic>`                      | Write system design solution document         |
| `/research-post <topic>`                   | Generate research material for future article |
| `/write-research <type> <category> <path>` | Convert research into blog post               |
| `/review-all`                              | Review all articles one by one                |
| `/validate-content`                        | Validate content structure and config files   |

### Code Skills

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `/review-code`    | Review entire codebase against standards |
| `/review-changes` | Review uncommitted changes only          |

### Skill Details

See `.claude/skills/` for detailed skill documentation:

- `write-post/SKILL.md` - Deep research, mermaid diagrams, inline references
- `review-posts/SKILL.md` - Fact-checking, structure review, quality assessment
- `sys-design/SKILL.md` - Two approaches (cloud-native vs custom), trade-offs
- `research-post/SKILL.md` - Content aggregation, source annotation
- `write-research/SKILL.md` - Convert research to polished articles
- `review-code/SKILL.md` - TypeScript, CSS, accessibility standards
- `review-changes/SKILL.md` - Scoped review of git changes
- `review-all/SKILL.md` - Batch content review
- `validate-content/SKILL.md` - H1 headings, posts.jsonc, meta.jsonc, home.jsonc validation

## Tech Stack

- **Framework**: Astro 5.x (static site generation)
- **Styling**: Tailwind CSS 4.x
- **Language**: TypeScript
- **Deployment**: GitHub Pages
- **Search**: Orama (client-side search)
- **Testing**: Vitest, Playwright

## LLM-Friendly Documentation References

When working on this project, refer to these LLM-optimized documentation sources for accurate, up-to-date information:

### Primary Documentation (Use These First)

| Tool       | LLM Docs URL                           | Notes                                                           |
| ---------- | -------------------------------------- | --------------------------------------------------------------- |
| **Astro**  | https://docs.astro.build/llms-full.txt | Complete Astro documentation - USE THIS for all Astro questions |
| **Astro**  | https://docs.astro.build/llms.txt      | Index of available LLM doc variants                             |
| **Vite**   | https://vite.dev/llms.txt              | Vite build tool documentation                                   |
| **Vitest** | https://vitest.dev/llms.txt            | Testing framework docs                                          |

### Tools Without LLM-Specific Docs

These tools don't have dedicated llms.txt files yet. Use their standard documentation:

| Tool             | Documentation URL                   |
| ---------------- | ----------------------------------- |
| **Tailwind CSS** | https://tailwindcss.com/docs        |
| **TypeScript**   | https://www.typescriptlang.org/docs |
| **ESLint**       | https://eslint.org/docs             |
| **Prettier**     | https://prettier.io/docs            |
| **Playwright**   | https://playwright.dev/docs         |
| **Orama**        | https://docs.orama.com              |

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
- `tailwind.config.ts` - Tailwind CSS configuration (if exists)
- `.github/workflows/astro.yml` - GitHub Pages deployment

## Build Commands

```bash
# Development
npm run dev          # Local dev server

# Production build
npm run build        # Build for production

# Preview
npm run preview      # Preview built site locally

# Validation
npm run validate:build    # Validate built HTML files
npm run validate:content  # Validate content structure and config files
npm run validate:local    # Validate local dev server (localhost:4321)
npm run validate:prod     # Validate production site (sujeet.pro)

# Performance Audits (Unlighthouse)
npm run lighthouse        # Run Lighthouse on production (mobile)
npm run lighthouse:local  # Run Lighthouse on local server
npm run lighthouse:desktop # Run Lighthouse on production (desktop)
```

### Performance Reports (Unlighthouse)

Automated Lighthouse audits via GitHub Actions, deployed to a separate GitHub Pages repo.

**Setup (one-time):**

1. Create repo `sujeet-pro/sujeet-pro-perf-reports`
2. Enable GitHub Pages: Settings → Pages → Source: `main` branch
3. Create Fine-grained PAT with `Contents: Read and write` for the reports repo
4. Add secret `REPORTS_REPO_TOKEN` in the main repo

**Running audits:**

1. Go to Actions → "Unlighthouse Performance Audit" → Run workflow
2. Select device: `both`, `mobile`, or `desktop`
3. View reports at: https://sujeet-pro.github.io/sujeet-pro-perf-reports/

Reports include:

- Summary page with all URLs and Web Vitals (LCP, CLS, INP)
- Performance, Accessibility, Best Practices, SEO scores per page
- Detailed Lighthouse reports for each URL

## Naming Conventions

### Entity Names

Use consistent terminology across the codebase:

| Entity                   | Description                                      | Example                                               |
| ------------------------ | ------------------------------------------------ | ----------------------------------------------------- |
| **Article**              | A content item (blog post)                       | `article`, `articles`, `allArticles`                  |
| **Article Card**         | Card component showing an article in a list      | `ArticleCard`, `.article-card`                        |
| **Category Card**        | Card component showing a category in a list      | `.category-card`                                      |
| **Topic**                | A sub-category within a category                 | `topic`, `topics`, `topicId`                          |
| **Article Listing Page** | Pages that list articles (category, topic pages) | `/articles/programming`, `/articles/programming/algo` |
| **Article Page**         | The actual article page with full content        | `/articles/programming/algo/sorting-algorithms`       |

### Component Props

- Use `article` (not `item` or `post`) for article-related props: `<ArticleCard article={article} />`
- Use `category` for category-related props
- Use `topic` (not `subCategory`) for topic-related props
- Use `articles` (plural) for arrays of articles

### CSS Classes

- Article cards: `.article-card`, `.article-card-title`, `.article-card-excerpt`, etc.
- Category cards: `.category-card`, `.category-card-title`, `.category-card-description`, etc.
- Article list container: `.article-list`
- Category list container: `.category-list`

## Important Patterns

### Link Utilities

Use link utilities for consistent link handling:

```typescript
import { getFilePath, getLinkProps } from "@/utils/link.utils"

// For assets (fonts, images, etc.)
const fontPath = getFilePath("fonts/my-font.woff2")

// For page links (handles external link security)
const { href } = getLinkProps({ href: "/writing" })
```

### Content Collections

Content uses Astro's Content Layer API with `glob` and `file` loaders:

- Articles (blog posts): `content/articles/`
- Structure: `content/articles/<category>/<topic>/<date>-<slug>.md`

### LLM-Friendly Endpoints

The site provides LLM-optimized content for AI consumption:

| Endpoint         | Purpose                                                |
| ---------------- | ------------------------------------------------------ |
| `/llms.txt`      | Index file with site overview and links to all content |
| `/llms-full.txt` | Complete site content in a single file (~1.2MB)        |

These follow the [llms.txt standard](https://llmstxt.org/) for making websites LLM-friendly.

**Usage**: Point an LLM to `https://sujeet.pro/llms-full.txt` to enable it to answer questions about any article on the site.

### Environment Variables

No environment variables are required. The site defaults to `https://sujeet.pro`.

Optional:

- `SHOW_DRAFTS=true` - Show draft content in development

## Common Tasks

### Adding a New Blog Post

Use `/write-post <topic>` or manually:

1. Create file: `content/articles/[category]/[topic]/YYYY-MM-DD-slug.md`
2. Add frontmatter (`lastReviewedOn`, `tags`)
3. Title from H1, description from paragraphs before ToC
4. Build and validate: `npm run build && npm run validate:build`

### Updating Dependencies

1. Check LLM docs for breaking changes (links above)
2. Run upgrade: `npm update` or `npx @astrojs/upgrade`
3. Build and test: `npm run build`
4. Validate: `npm run validate:build`

### Debugging Build Issues

1. Check Astro docs: https://docs.astro.build/llms-full.txt
2. Run validation: `npm run validate:build`
3. Check logs in `logs/` folder

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
<button class="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
  Click me
</button>

<!-- ✅ GOOD: Semantic custom class -->
<button class="btn-primary"> Click me </button>
```

```css
/* In global.css or component <style> */
.btn-primary {
  @apply flex items-center gap-2 rounded-md px-4 py-2;
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
  --color-text: #1f2937; /* 4.5:1 contrast ratio min */
  --color-text-muted: #6b7280; /* 4.5:1 for large text */
  --color-border: #e5e7eb;
  --color-accent: #2563eb; /* 4.5:1 contrast on bg */
  --color-accent-hover: #1d4ed8;

  /* Layout */
  --content-width: 80ch; /* Optimal reading width */
  --sidebar-width: 16rem;
  --sidebar-gap: 3rem;

  /* Typography */
  --font-sans: "Open Sans", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}
```

### Accessibility Requirements

Follow these minimum requirements for WCAG 2.1 AA compliance:

| Element                 | Requirement                                          |
| ----------------------- | ---------------------------------------------------- |
| **Body text**           | Minimum 16px (1rem), line-height 1.5+                |
| **Small text**          | Minimum 14px (0.875rem), only for non-essential info |
| **Touch targets**       | Minimum 44x44px for buttons/links on mobile          |
| **Color contrast**      | 4.5:1 for normal text, 3:1 for large text (18px+)    |
| **Focus indicators**    | Visible 2px outline with offset                      |
| **Interactive spacing** | Minimum 8px between clickable elements               |

### Class Naming Convention

Use semantic, BEM-inspired naming:

```css
/* Component block */
.article-card {
}

/* Component element */
.article-card-title {
}
.article-card-meta {
}
.article-card-excerpt {
}

/* Component modifier */
.article-card--featured {
}

/* State classes */
.is-active {
}
.is-open {
}
.is-hidden {
}
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
4. **LAYOUT CLASSES** - .content-container, .layout-3col-\*
5. **INTERACTIVE ELEMENTS** - .link, .btn, .nav-link
6. **ARTICLE & CATEGORY CARDS** - .article-card, .category-card
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
  @apply mb-2 text-lg font-medium;
  color: var(--color-text);
}

.card-description {
  @apply text-base;
  color: var(--color-text-muted);
}
```

## Notes for AI Agents

1. **Always fetch LLM docs** before making changes to framework code
2. **Use validation scripts** after builds to catch broken links
3. **Logs are in `logs/`** folder (git-ignored)
4. **Follow styling conventions** - Use custom classes with @apply, CSS variables for theming
5. **Verify accessibility** - Check contrast ratios, touch targets, and font sizes
