# Skill: /write-article

Write a **new** article from a prompt. This skill is agent-agnostic and must follow all `llm_docs/guidelines-content/*` documents.

## When to Use

- User asks to write a new article
- Command: `/write-article <topic or prompt>`

## Required Reading (MUST read before starting)

### Core Guidelines (Always Read)

- `llm_docs/guidelines-content/content-structure.md`
- `llm_docs/guidelines-content/content-guidelines.md`
- `llm_docs/guidelines-content/research-and-fact-checking.md`
- `llm_docs/guidelines-content/markdown-features.md`
- `llm_docs/guidelines-content/persona.md`

### Content-Type Specific Guidelines

Based on the article path, read the corresponding guideline **in addition to core guidelines**:

#### System Design Problems (`content/articles/system-design/system-design-problems/*`)

- `llm_docs/guidelines-content/system-design-problems.md`

Covers:

- Scoping vague problem statements ("Design X")
- **Multiple design paths** based on different requirements
- Tradeoff-focused approach (no single correct answer)
- Full-stack principal perspective (frontend + backend + infra)
- Required sections: Scale estimation, API design, Data modeling, Low-level design
- Cloud-agnostic concepts first, then AWS examples

#### System Design Fundamentals & Building Blocks (`content/articles/system-design/system-design-fundamentals/*` and `system-design-building-blocks/*`)

- `llm_docs/guidelines-content/system-design-fundamentals.md`

Covers:

- **All viable approaches** for each concept (not just the popular one)
- **Factors influencing design choices** - When does each approach shine?
- **Explicit trade-offs** with decision matrices
- **Real-world examples** - Companies that chose each path, why, and outcomes
- Common pitfalls with concrete examples

#### Core Distributed Patterns (`content/articles/system-design/core-distributed-patterns/*`)

- `llm_docs/guidelines-content/core-distributed-patterns.md`

Covers:

- **All major pattern variants** (not just textbook version)
- **Design decision trees** - What choices remain after choosing the pattern?
- **Production implementations differ from theory** - Show real deviations
- Code examples for each variant
- At least 2 contrasting real-world implementations with specific details

#### Frontend System Design (`content/articles/system-design/frontend-system-design/*`)

- `llm_docs/guidelines-content/frontend-system-design.md`

Covers:

- **Multiple implementation approaches** (not just one library)
- **Browser constraints** - Main thread, memory, storage quotas
- **Device/network considerations** - Mobile vs desktop, offline scenarios
- Framework-agnostic concepts first, then specific implementations
- Real-world examples from production apps (Figma, Notion, Discord, etc.)

#### Real-World Case Studies (`content/articles/system-design/real-world-case-studies/*`)

- `llm_docs/guidelines-content/real-world-case-studies.md`

Covers:

- **Deep dives** into production systems (not summaries)
- **Beyond incidents**: performance breakthroughs, bottleneck removals, architecture evolutions
- **Extreme specificity**: exact tools, versions, configurations, numbers
- Options considered (not just chosen approach)
- Measurable outcomes with before/after metrics
- Transferable lessons for readers' own systems

## Core Principles

This skill produces research-driven, factually accurate content for senior/staff/principal engineers:

- **Specs and official sources first**: Every claim must be backed by specifications, official docs, or core maintainer content
- **Why and how, not just what**: Focus on design reasoning, not feature lists
- **Concise but exhaustive**: No filler, but cover ALL edge cases and implementation nuances
- **Version-aware**: State current version, note previous behavior when it has changed

## Inputs

- Topic and scope
- Target category and topic (if unclear, propose options)
- Any constraints (length, audience emphasis, required sources)

## Workflow

### 1. Clarify scope and placement

- Confirm the topic, depth, and target audience.
- Identify the expected category/topic path.
- Determine current version/release to document.

### 2. Read relevant code and context

- Inspect the local codebase when the article is tied to implementation details.
- Note constraints, defaults, and real behavior to ground examples.
- Check source code for undocumented edge cases.

### 3. Breadth research (topic survey)

- Survey the topic using the **source priority hierarchy** (specs > official docs > core maintainer > source code).
- Identify canonical concepts, edge cases, and common misconceptions.
- Note what has changed in recent versions.
- Use this to outline the article and required Appendix content.

### 4. Section-level deep research

- For each section, gather **primary sources** and spec clauses.
- Find design rationale: why were these choices made?
- Capture limits, defaults, version-specific behaviors, and edge cases.
- Look for core maintainer explanations (blog posts, talks, GitHub discussions).

### 5. Outline the article

- Required structure: H1, description, diagram, **Abstract (mental model)**, main sections, conclusion, Appendix.
- The Abstract should be a revision-friendly mental model, NOT a section-by-section summary.
- Plan in-depth technical analysis for each main section.
- Plan where to explain design decisions and version evolution.

### 6. Draft the article

- Create `content/articles/<category>/<topic>/<slug>/README.md`.
- Use a concise H1 and description paragraph(s).
- **Abstract**: Distill the core mental model (diagram, bullets, or prose—whatever works best).
- **Main sections**: In-depth analysis with design reasoning, edge cases, failure modes.
- **Version notes**: State current version; note previous behavior where relevant.
- Include diagrams, collapsed code blocks, and production-relevant examples.
- Add spec quotes (short) and core maintainer quotes for design rationale.
- Expand abbreviations on first use (excluding headings).

### 7. Update ordering

- Add new IDs to `content/ordering.json5`:
  - `articlesOrder`
  - `topicVsArticlesOrder[topic]`
- If new category/topic, also update:
  - `categoryOrder`, `topicsOrder`, `categoryVsTopics`

### 8. Quality review

- Verify all non-negotiable rules from content-guidelines.md.
- Check: Why and how explained, not just what?
- Check: Design reasoning explicit for each major choice?
- Check: Version stated, previous behavior noted where changed?
- Check: Edge cases, limits, failure modes exhaustively covered?
- Check: Abstract is a mental model, not section summaries?
- Check: Code blocks use `collapse={...}`.
- Ensure Appendix requirements are met and references are complete and prioritized.

## Output Checklist

- [ ] Article file created in correct folder structure
- [ ] Ordering config updated
- [ ] Abstract provides mental model (not section summaries)
- [ ] Design reasoning explained for each major choice
- [ ] Version stated; previous behavior noted where changed
- [ ] Edge cases, limits, and failure modes exhaustively covered
- [ ] Appendix includes Prerequisites, Summary, and References (Terminology when needed)
- [ ] References prioritized (specs first, then official docs, then core maintainer content)
- [ ] Code blocks collapsed to show only relevant lines
- [ ] Abbreviations expanded on first use
- [ ] No filler—every paragraph earns its place
