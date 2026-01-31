# Agent-Agnostic Skills

These skills are canonical and apply to any agent. Each skill references the relevant guidelines in `llm_docs/guidelines-*`.

## Available Skills

| Skill                | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `write-article.md`   | Write new research-driven articles           |
| `update-article.md`  | Update existing articles with fresh research |
| `review-all-code.md` | Review and refactor codebase                 |

## Core Principles (Content Skills)

All content skills (`write-article`, `update-article`) follow these research-driven principles:

### Source Priority (Strict Hierarchy)

1. **Specifications** - RFCs, WHATWG, ECMA-262, W3C specs
2. **Official Documentation** - Vendor docs, framework guides, MDN
3. **Core Maintainer Content** - Blog posts/talks by project leads
4. **Source Code** - Reference implementations, GitHub repos
5. **Industry Expert Blogs** - Recognized engineers' technical blogs

### Content Quality

- **Why and how, not just what** - Design reasoning, not feature lists
- **Version-aware** - State current version; note previous behavior where changed
- **Abstract = mental model** - For revision, NOT section summaries
- **Exhaustive edge cases** - Limits, failure modes, gotchas
- **No filler** - Every paragraph earns its place

### Required Guidelines

Content skills MUST read all files in `llm_docs/guidelines-content/` before starting:

- `content-structure.md` - Article hierarchy and metadata
- `content-guidelines.md` - Writing rules and article structure
- `research-and-fact-checking.md` - Source hierarchy and verification
- `markdown-features.md` - Expressive Code, Mermaid, KaTeX
- `persona.md` - Principal engineer voice
