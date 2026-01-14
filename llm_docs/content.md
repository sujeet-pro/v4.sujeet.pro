# Content Guide

## Target Audience

Experienced software professionals. Highly technical content. Each article should be cohesive with sections that naturally lead into one another.

## Content Collections

| Collection | Path                  | Required Fields   | Optional Fields      |
| ---------- | --------------------- | ----------------- | -------------------- |
| writing    | `content/writing/`    | tags              | featuredRank, series |
| deep-dives | `content/deep-dives/` | tags, subcategory | -                    |
| work       | `content/work/`       | tags              | type                 |
| uses       | `content/uses/`       | tags              | -                    |

## File Naming

**Format**: `YYYY-MM-DD-slug-name.md` or `YYYY-MM-DD-slug-name/index.md`

The filename determines:

- **Publish date**: From `YYYY-MM-DD` prefix
- **URL slug**: From text after date

```
2024-03-15-react-architecture.md      → /writing/.../react-architecture
2024-05-01-video-playback/index.md    → Use folder for associated assets
```

## Document Structure

```markdown
---
lastUpdatedOn: 2024-01-15
tags:
  - tag-id
subcategory: system-design/foundations # deep-dives only
type: design-doc # work only (optional)
featuredRank: 1 # writing only (optional)
---

# Article Title

Description paragraph(s). This becomes the meta description and appears in previews.

## Table of Contents

## Section One

Content with logical flow to next section...

## Section Two

Builds on previous section...

## Conclusion

Key takeaways...
```

## Auto-Extracted Fields (DO NOT add manually)

| Field         | Source                                        |
| ------------- | --------------------------------------------- |
| `title`       | First H1 heading                              |
| `description` | Paragraphs between H1 and "Table of Contents" |
| `publishedOn` | Filename date (YYYY-MM-DD)                    |
| `minutesRead` | Calculated from content                       |
| `isDraft`     | `true` if title starts with "Draft:"          |

## Writing Categories

```
content/writing/
├── javascript/
│   ├── patterns/       # Design patterns, algorithms
│   ├── runtime/        # Node.js, V8, event loop
│   └── error-handling/
├── web-development/
│   ├── fundamentals/   # Protocols, caching, security
│   ├── performance/    # Web vitals, optimization
│   └── architecture/   # CRP, microfrontends
├── frameworks/react/   # React patterns
├── devops/testing/     # k6, load testing
├── organizational/     # Design systems, migrations
├── platform/           # Platform services
└── media/streaming/    # Video playback
```

## Deep Dives Categories

| Category        | Subcategories                         |
| --------------- | ------------------------------------- |
| `system-design` | `foundations`, `design-problems`      |
| `leadership`    | `team-building`, `technical-strategy` |
| `dsa`           | `data-structures`, `algorithms`       |

**Subcategory format**: `category-id/subcategory-id`

```yaml
subcategory: system-design/foundations
```

## Work Types

- `design-doc` - Technical design documents
- `architecture` - Architecture decisions
- `case-study` - Project case studies

## Tags

Defined in `content/tags.jsonc`. Common categories:

- **Tech**: `frontend`, `backend`, `fullstack`, `devops`
- **Languages**: `js`, `ts`, `python`, `go`, `rust`
- **Frameworks**: `react`, `vue`, `astro`, `nextjs`
- **Performance**: `web-performance`, `caching`, `cls`, `lcp`
- **Architecture**: `microservices`, `distributed-systems`, `scalability`

## Draft Posts

Prefix title with "Draft:" to mark as draft:

```markdown
# Draft: Work in Progress
```

Drafts visible in development, filtered in production.
