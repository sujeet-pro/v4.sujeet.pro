# Personal Portfolio & Blog

This repository contains my personal portfolio website and a collection of blogs written over time. Built with Astro for fast, modern web development and deployed on Cloudflare Workers.

## Deployment

This project is deployed on Cloudflare Workers using the modern Workers Assets format. The migration from Cloudflare Pages to Workers was completed to leverage the latest Cloudflare infrastructure.

### Deployment Commands

- `npm run build` - Build the static site
- `npm run deploy` - Build and deploy to Cloudflare Workers
- `npm run deploy:dry-run` - Test deployment configuration without deploying
- `npm run dev:worker` - Start local Workers development server

## Supported Features (Tech)

The blogs are intended to be written in Markdown(.md) files.

Below functionality are extended.

### Frontmatter

#### Automatic Frontmatter Extraction

- **Title**: Extracted from the first H1 heading in the markdown
- **Description**: Extracted from content between H1 and "Table of Contents" heading
- **Published On**: Extracted from the file path (YYYY-MM-DD-slug-path or YYYY-MM-DD/slug-path)
- **Slug**: Generated from the file path structure

#### Automatic Frontmatter Generation

- **Minutes Read**: Automatically calculated based on content length

#### Required Explicit Frontmatter

```yaml
---
lastUpdatedOn: 2024-01-22
tags:
  - js
  - ts
  - design-patterns
---
```

#### Optional Explicit Frontmatter

```yaml
---
lastUpdatedOn: 2024-01-22
tags:
  - js
  - ts
  - design-patterns
featuredRank: 1 # Optional: Makes post appear on home page (lower numbers = higher priority)
---
```

### Draft Posts

To create a draft post, prefix the title with "Draft:" in the H1 heading:

```markdown
# Draft: My Work in Progress Post

This post will be marked as a draft and won't appear in public listings.
```

### Featured Posts

To feature a post on the home page, add `featuredRank` to the frontmatter:

```yaml
---
lastUpdatedOn: 2024-01-22
tags:
  - js
  - ts
featuredRank: 1 # Lower numbers = higher priority (appear first)
---
```

- Posts with `featuredRank` defined will appear in the "Featured Posts" section on the home page
- Posts are sorted by `featuredRank` in ascending order (1 appears before 2)
- Only non-draft posts with `featuredRank` are displayed
- If no posts have `featuredRank`, the section won't appear

### Images

#### PNG Images (Auto-inverted for Dark Mode)

PNG images are automatically inverted in dark mode for better visibility:

```markdown
![Image description](./my-image.png)
```

#### SVG Images

##### Inline SVGs (Recommended for Diagrams)

SVG files ending with `.inline.svg` will be inlined into the HTML, allowing:

- `currentColor` attribute to work with theme colors
- Tailwind classes (though not recommended)
- Proper dark/light mode support for text-based diagrams

```markdown
![Diagram](./my-diagram.inline.svg)
```

##### Regular SVGs

Regular SVG files are treated as regular images:

```markdown
![SVG Image](./my-image.svg)
```

### File Structure

Posts should follow this naming convention:

```
content/posts/category/YYYY-MM-DD-post-title.md
```

Or with date folder structure:

```
content/posts/category/YYYY-MM-DD/post-title.md
```

### Example Complete Post

```markdown
---
lastUpdatedOn: 2024-01-22
tags:
  - js
  - ts
  - design-patterns
featuredRank: 1
---

# My Awesome Blog Post

This is the description that will appear in listings and meta tags.

<figure>
![Cover Image](./cover-image.png)
<figcaption>Image description</figcaption>
</figure>

## Table of Contents

## Introduction

Your content here...

<figure>
![Diagram](./diagram.inline.svg)
<figcaption>SVG diagram that supports currentColor</figcaption>
</figure>
```
