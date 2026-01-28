# LLM Content Guidelines (Canonical)

This folder is the single source of truth for **content** guidance (writing, research, markdown, persona).

## Reading Order

Read these documents in order:

1. `content-structure.md` - Article hierarchy and metadata derivation
2. `content-guidelines.md` - Writing rules, article structure, quality checklist
3. `research-and-fact-checking.md` - Source priority, verification, version evolution
4. `markdown-features.md` - Expressive Code, Mermaid, KaTeX, tables
5. `persona.md` - Principal engineer voice and audience

If any older docs conflict with this folder, the guidance here wins.

## Key Principles Summary

### Source Priority (Strict Hierarchy)
specs > official docs > core maintainer content > source code > industry experts

### Content Quality
- **Why and how, not just what** - Design reasoning explicit for each major choice
- **Version-aware** - State current version; note previous behavior where changed
- **Abstract = mental model** - For revision (NOT section-by-section summaries)
- **Exhaustive edge cases** - Limits, failure modes, gotchas covered
- **No filler** - Every paragraph earns its place; no unnecessary explanations for senior engineers

### Target Audience
Senior/staff/principal engineers and technical leadership. Peer-to-peer communication.

---

For **codebase changes**, use `llm_docs/guidelines-code/coding-standards.md`.
