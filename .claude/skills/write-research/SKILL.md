---
name: write-research
description: Create a blog post from a research document. Use when the user says "/write-research..." to convert research material into a polished article at the specified post type and category.
---

# Write Research Skill

Converts research documents from `content/in-research/` into polished blog posts.

## Invocation

- `/write-research <posttype> <category> <path-to-research>`
- `/write-research posts web content/in-research/2024-01-15-websockets/`

### Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| `posttype` | Target collection | `posts`, `in-research` |
| `category` | Category within collection | `web`, `tools`, `design-problems` |
| `path` | Path to research folder | `content/in-research/2024-01-15-websockets/` |

If called without arguments, ask user for:
1. Path to research document
2. Target post type and category

## Workflow

```mermaid
flowchart TD
    A[User Request] --> B[Load Research]
    B --> C[Validate Research]
    C --> D[Plan Article]
    D --> E[Write Content]
    E --> F[Quality Check]
    F --> G[Save Article]
    G --> H[Update Research Status]
```

## Phase 1: Load Research

Read all files from the research folder:

```plain
content/in-research/[slug]/
├── index.md          # Main research
├── _sources.md       # Annotated sources
├── _outline.md       # Proposed outline
└── _notes.md         # Raw notes
```

### Extract Key Information

- Research summary and key findings
- Annotated sources with quality ratings
- Proposed article outline
- Identified gaps and open questions

## Phase 2: Validate Research

Check research is ready to write:

### Research Readiness Checklist

- [ ] Key findings documented
- [ ] Major themes identified
- [ ] Authoritative sources found
- [ ] Outline is specific and actionable
- [ ] Critical gaps addressed or noted

### If Research is Incomplete

Ask user:
1. Proceed with available research?
2. Return to `/research-post` to fill gaps?
3. Specify which gaps to ignore?

## Phase 3: Plan Article

### Map Research to Article

Based on the research outline, create article plan:

```markdown
## Article Plan

**Title**: [From outline or refined]
**Target**: posts/[category]/YYYY-MM-DD-[slug]/

### Sections

1. **Abstract**
   - Sources: [list]
   - Key points to cover: [list]

2. **TLDR**
   - Themes from research: [map]

3. **[Section Name]**
   - Research findings to use: [list]
   - Sources for citations: [list]
   - Diagrams needed: [list]

### Code Examples
- [Example 1]: [Source reference]

### Diagrams
- [Diagram 1]: [Description]
```

### Identify Additional Research Needed

If outline reveals gaps:
- Do quick targeted research
- Note in article if something is unverified
- Flag for future update

## Phase 4: Write Content

Use the `/write-post` skill's content standards, but leverage existing research.

### Writing From Research

#### Abstract
- Use research summary as foundation
- Refine for article context
- Add overview diagram

#### TLDR
- Map research themes to TLDR subsections
- Ensure comprehensive coverage
- Add trade-offs identified in research

#### Main Content

For each section:
1. Review relevant research findings
2. Pull key insights and examples
3. Add inline citations from `_sources.md`
4. Create diagrams from research descriptions
5. Write code examples with collapse

### Citation Integration

Transform source annotations into inline references:

```markdown
// From _sources.md
## Node.js Event Loop Documentation
**URL**: https://nodejs.org/...
**Type**: Official Docs
**Key Points**: Event loop has 6 phases...

// In article
The event loop processes callbacks in six distinct phases ([Node.js Event Loop Documentation](https://nodejs.org/...)).
```

### Code Examples

**Always collapse boilerplate:**

````markdown
```typescript title="example.ts" collapse={1-5}
import { something } from 'somewhere'
import { another } from 'elsewhere'
import type { Type } from 'types'
// setup...

// Main logic - visible
export function example(): Result {
  return computeValue()
}
```
````

## Phase 5: Quality Check

### Content Quality
- [ ] Abstract sets context
- [ ] Overview diagram present
- [ ] TLDR is comprehensive
- [ ] All claims have inline references
- [ ] Trade-offs discussed
- [ ] Design reasoning explained

### Research Integration
- [ ] Key findings represented
- [ ] Sources properly cited
- [ ] Gaps acknowledged if unresolved
- [ ] No research copied verbatim (synthesized)

### Conciseness
- [ ] No padding or filler
- [ ] No tutorial-style hand-holding
- [ ] Every section earns its place
- [ ] Reading time < 30 minutes

### Technical Accuracy
- [ ] Claims verified against sources
- [ ] Code examples correct
- [ ] Diagrams accurate

### Formatting
- [ ] No manual ToC
- [ ] Mermaid diagrams render
- [ ] Code blocks use collapse
- [ ] References section complete

## Phase 6: Save Article

### Create Article

Location: `content/[posttype]/[category]/YYYY-MM-DD-[slug]/`

```yaml
---
lastUpdatedOn: YYYY-MM-DD
tags:
  - [tag-from-research]
  - [tag-from-research]
---
```

### Build Verification

```bash
npm run build
npm run validate:build
```

## Phase 7: Update Research Status

After article is saved, update research document:

```yaml
---
topic: [Topic]
status: written  # Changed from research/ready-to-write
researchedOn: YYYY-MM-DD
writtenOn: YYYY-MM-DD
articlePath: content/posts/[category]/YYYY-MM-DD-[slug]/
---
```

## Handling Multiple Articles

If research suggests multiple articles:

1. Ask user which to write first
2. Create article for selected topic
3. Update research with cross-references
4. Note remaining articles in research status

## Anti-Patterns

- **Copy-pasting research**: Synthesize, don't copy verbatim
- **Ignoring gaps**: Note unresolved questions in article
- **Missing citations**: Every claim needs source from research
- **Over-verbose**: Research may be detailed; article should be concise
- **Skipping quality check**: Research quality doesn't guarantee article quality

## Reference Documents

- [content-guidelines.md](../../../llm_docs/content-guidelines.md)
- [markdown-features.md](../../../llm_docs/markdown-features.md)
- [write-post SKILL.md](../write-post/SKILL.md)
- [CLAUDE.md](../../../CLAUDE.md)

## Tools Available

- `Read` - Load research documents
- `Write` - Create article
- `Glob` - Find research files
- `Edit` - Update research status
- `WebSearch` - Fill minor gaps
- `WebFetch` - Verify sources still valid
- `Bash` - Build and validation
