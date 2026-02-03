# LLM Content Guidelines (Canonical)

This folder is the single source of truth for **content** guidance (writing, research, markdown, persona).

## Reading Order

### Core Guidelines (Always Read)

1. `content-structure.md` - Article hierarchy and metadata derivation
2. `content-guidelines.md` - Writing rules, article structure, quality checklist
3. `research-and-fact-checking.md` - Source priority, verification, version evolution
4. `markdown-features.md` - Expressive Code, Mermaid, KaTeX, tables
5. `persona.md` - Principal engineer voice and audience

### Content-Type Specific Guidelines

These are **in addition to** core guidelines for specific article types:

| Content Type                                 | Guideline                       | When to Use                                                                                 |
| -------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------- |
| System Design Problems                       | `system-design-problems.md`     | Articles in `system-design/system-design-problems/`                                         |
| System Design Fundamentals & Building Blocks | `system-design-fundamentals.md` | Articles in `system-design/system-design-fundamentals/` or `system-design-building-blocks/` |
| Core Distributed Patterns                    | `core-distributed-patterns.md`  | Articles in `system-design/core-distributed-patterns/`                                      |
| Frontend System Design                       | `frontend-system-design.md`     | Articles in `system-design/frontend-system-design/`                                         |
| Real-World Case Studies                      | `real-world-case-studies.md`    | Articles in `system-design/real-world-case-studies/`                                        |

#### System Design Guidelines Overview

| Guideline                       | Focus                    | Key Requirement                                                             |
| ------------------------------- | ------------------------ | --------------------------------------------------------------------------- |
| `system-design-problems.md`     | End-to-end designs       | Multiple design paths, API/data modeling, frontend + backend + infra        |
| `system-design-fundamentals.md` | Foundational concepts    | All viable approaches, decision matrices, real-world examples with outcomes |
| `core-distributed-patterns.md`  | Pattern deep-dives       | All variants, decision trees, production implementations vs theory          |
| `frontend-system-design.md`     | Client-side architecture | Browser constraints, device/network profiles, accessibility                 |
| `real-world-case-studies.md`    | Production learnings     | Extreme specificity, options considered, measurable outcomes                |

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
