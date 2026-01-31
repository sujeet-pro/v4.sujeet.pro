# Content Structure and Metadata

This document reflects the **current implementation** in `content/` and the markdown processing pipeline. Do not assume legacy frontmatter fields or date-based filenames.

## Content Hierarchy (Current)

```
content/articles/
  <category>/
    README.md                # Category index (H1 + description)
    <topic>/
      README.md              # Topic index (H1 + description)
      <article>/
        README.md            # Article content
        <assets>             # Optional images/diagrams
```

### Slugs and IDs

- **Category ID** = folder name under `content/articles/`
- **Topic ID** = folder name under `<category>/`
- **Article ID (postId)** = folder name under `<topic>/`
- Use **kebab-case** and keep slugs short but descriptive.
- There is **no date prefix** in filenames or folders.

## Metadata Derivation (Auto-Generated)

Metadata is derived by the remark frontmatter plugin and validated in code:

- `plugins/remark-frontmatter-plugin.ts`
- `src/utils/content.types.ts` (`remarkPluginFrontmatterSchema`)

### Derived Fields

| Field       | Source                                                    | Notes                            |
| ----------- | --------------------------------------------------------- | -------------------------------- |
| title       | H1 text ("Draft:" prefix stripped)                        | Required; build fails without H1 |
| description | Text between H1 and first H2, or first paragraph after H1 | Used for previews/meta           |
| minutesRead | Reading time computed from markdown content               | Auto-generated                   |
| isDraft     | H1 starts with "Draft:" (case-insensitive)                | Drafts shown only in dev         |
| pageSlug    | File path slug from `content/articles/.../README.md`      | Auto-generated                   |
| category    | Folder name derived from path                             | Auto-generated                   |
| topic       | Folder name derived from path                             | Auto-generated                   |
| postId      | Article folder name derived from path                     | Auto-generated                   |

### Draft Visibility

- Drafts are detected by H1 prefix: `Draft: Your Title`
- Drafts are shown only in development (`import.meta.env.DEV`).

## Ordering (Required for Navigation)

Ordering is centralized in `content/ordering.json5`.

Update these fields when adding or renaming content:

- `categoryOrder` (all categories)
- `topicsOrder` (global list of topics)
- `articlesOrder` (global list of articles)
- `categoryVsTopics` (category -> topic list)
- `topicVsArticlesOrder` (topic -> article list)

**Rules:**

- Every ID must be unique and present in the correct list(s).
- A new article must be added to both `articlesOrder` and its topic list.
- A new topic must be added to both `topicsOrder` and its category list.

## Frontmatter Reality Check

The current pipeline **does not use** these legacy frontmatter fields:

- `publishedOn`
- `lastUpdatedOn` / `lastReviewedOn`
- `tags`

Do not add or require them. If you need these fields, update:

- `plugins/remark-frontmatter-plugin.ts` (to derive/store them)
- `src/utils/content.types.ts` (schema + types)
- UI components that display metadata

## Category and Topic Index Files

Each category/topic README should contain:

- A single H1
- One short description paragraph

No frontmatter is required.

## Article Layout (Required)

This repo derives metadata from the markdown structure. Follow the article layout defined in `llm_docs/guidelines-content/content-guidelines.md`. Key constraints for the pipeline:

- The description is extracted from the text between the H1 and the first H2. Keep it tight and place it immediately after the H1.
- The Appendix is the final H2 and must include Prerequisites, Summary, and References. Add Terminology when needed.
- Do not insert other H2 sections after the Appendix.

## Related JSON5 Config

These files are part of the content system:

- `content/home.json5` (homepage config)
- `content/site.json5` (site metadata)
- `content/vanity.json5` (redirects)
- `content/ordering.json5` (ordering and featured content)
