# Project Implementation Guide

Technical documentation for the sujeet.pro portfolio site built with Astro.

## Architecture Overview

```
src/
├── components/       # Reusable UI components
├── constants/        # Site configuration
├── content.config.ts # Content collections schema
├── layout/           # Page layouts
├── pages/            # Route pages
├── styles/           # Global CSS
└── utils/            # Utility functions

content/
├── writing/          # Blog posts
├── deep-dives/       # Educational content with categories
├── work/             # Design docs, case studies
├── uses/             # Tools and setup
├── pages/            # Static pages
├── tags.jsonc        # Tag definitions
├── categories.jsonc  # Deep-dive categories
└── series.jsonc      # Content series groupings

plugins/
├── remark-*.ts       # Custom remark plugins
└── rehype-*.ts       # Custom rehype plugins
```

## Content Collections

### Configuration (`src/content.config.ts`)

Content is organized into typed collections using Astro's Content Collections API with Zod validation.

**Markdown Collections:**

- `writing` - Blog posts with optional `featuredRank`
- `deep-dives` - Requires `subcategory` (format: `category/subcategory`)
- `work` - Optional `type` (design-doc, architecture, case-study)
- `uses` - Tools and setup articles
- `pages` - Static pages

**JSONC Collections:**

- `tags` - Tag ID to display name mapping
- `categories` - Deep-dive category hierarchy with subcategories
- `series` - Content series definitions
- `vanity` - URL redirects

### Content Loading (`src/utils/`)

Each content type has a dedicated utility file:

| File                          | Description                                                     |
| ----------------------------- | --------------------------------------------------------------- |
| `content.helpers.ts`          | Shared helpers: `renderContentItem()`, `sortByDateDescending()` |
| `content-writing.utils.ts`    | Writing posts: `getWriting()`, `getFeaturedWriting()`           |
| `content-deep-dives.utils.ts` | Deep dives: `getDeepDives()` with category resolution           |
| `content-work.utils.ts`       | Work items: `getWork()`, `getWorkByType()`                      |
| `content-uses.utils.ts`       | Uses items: `getUses()`                                         |
| `content.utils.ts`            | Aggregated: `getAllContent()`, `getAllContentItems()`           |
| `content-series.utils.ts`     | Series: `getAllSeries()`, `getSeriesNavigation()`               |
| `content-tags.utils.ts`       | Tags: `getTagsByRefs()`, `getAllUsedTags()`                     |

Content items are returned with unified `ContentItem` interface including:

- `id`, `title`, `description`, `href`
- `publishedOn`, `lastUpdatedOn`, `minutesRead`
- `tags` (resolved tag objects with id and name)
- `type` discriminator

## Search Implementation

### Build-Time Index Generation

The search index is generated at build time using Orama:

1. **Integration Hook** (`astro.config.ts` - if using integration)
2. **Index Builder** (`src/utils/search.utils.ts`)
   - `buildSearchIndex()` - Creates Orama DB, indexes all content, serializes to JSON
   - `getSearchFacets()` - Generates filter options with counts

### Search Index Schema

```typescript
{
  id: string
  title: string
  description: string
  type: string           // content type
  category: string       // deep-dive category ID
  subcategory: string    // deep-dive subcategory ID
  categoryName: string   // display name
  subcategoryName: string
  tags: string[]         // tag IDs
  tagNames: string[]     // tag display names
  href: string
  publishedOn: number    // timestamp
  minutesRead: string
  seriesId: string
  seriesName: string
}
```

### Client-Side Search

The search page (`/search`) loads the pre-built index and provides:

- Full-text search with Orama
- Faceted filtering (categories, subcategories, tags)
- URL-based state management for shareable searches
- Sort by relevance or date

## Markdown Processing

### Pipeline

```
Markdown → Remark Plugins → Rehype Plugins → HTML
```

### Remark Plugins (AST Processing)

1. **remarkFrontmatterPlugin** (custom) - Extracts title, description, publishedOn, minutesRead from content
2. **remarkCodeTitleUsingFile** (custom) - Sets code block title from `file=` meta
3. **remarkInlineSvg** - Inlines SVGs with `.inline.svg` suffix
4. **remarkCodeImport** - Imports code from external files
5. **remarkMath** - LaTeX math syntax
6. **remarkNormalizeHeadings** - Ensures heading hierarchy
7. **remarkEmoji** - Emoji shortcodes
8. **remarkToc** - Auto-generates table of contents

### Rehype Plugins (HTML Processing)

1. **rehypeKatex** - Renders math to HTML
2. **rehypeAccessibleEmojis** - Adds ARIA labels to emojis
3. **rehypeHeadingIds** - Adds IDs to headings
4. **rehypeAutolinkHeadings** - Wraps headings with anchor links
5. **rehypeMermaid** - Renders Mermaid diagrams
6. **rehypeImgClass** (custom) - Adds classes to images
7. **rehypeTable** (custom) - Wraps tables for responsive styling

### Expressive Code (Code Blocks)

Configuration in `ec.config.mjs`:

- Theme: `github-light`
- Plugins: `collapsible-sections`, `line-numbers`
- Custom language: `m3u8`
- Default: Line numbers shown (except bash/txt)

## Styling

### CSS Architecture

Uses Tailwind CSS v4 with custom CSS variables in `src/styles/global.css`:

```css
:root {
  --color-bg: #fefefe;
  --color-text: #1f2937;
  --color-accent: #2563eb;
  --color-muted: #6b7280;
  --color-border: #e5e7eb;
  --color-bg-alt: #f9fafb;
}
```

### Typography

- Body: Open Sans (variable weight, 300-800)
- Code: JetBrains Mono (400)
- Fonts served locally from `/public/fonts/`

### Key CSS Classes

| Class                | Usage                   |
| -------------------- | ----------------------- |
| `.content-container` | Max-width wrapper       |
| `.content-list`      | Styled content list     |
| `.content-item`      | Individual content card |
| `.nav-link`          | Navigation link style   |
| `.badge`             | Content type badge      |
| `.tag`               | Tag/category label      |

## Performance Optimizations

1. **Static Output** - All pages pre-rendered at build time
2. **Font Preloading** - Local fonts preloaded in `<head>`
3. **Search Index Prefetch** - `<link rel="prefetch" href="/search/index.json">`
4. **Prefetch Strategy** - Viewport-based prefetching enabled
5. **Build-Time Computation** - Facets, series, and index generated at build

## Environment Configuration

| Variable         | Default              | Description          |
| ---------------- | -------------------- | -------------------- |
| `SITE_ORIGIN`    | `https://sujeet.pro` | Site URL for sitemap |
| `SITE_BASE_PATH` | `/`                  | Base path for assets |
| `SHOW_DRAFTS`    | `false`              | Show draft content   |

## Deployment

Deployed to Cloudflare Workers:

```bash
npm run build   # Build static site
npm run deploy  # Deploy via wrangler
```

Build output goes to `dist/` including:

- Static HTML pages
- `/search/index.json` - Search index
- `/fonts/` - Local font files
