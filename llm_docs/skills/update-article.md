# Skill: /update-article

Update an **existing** article based on a prompt. This skill is agent-agnostic and must follow all `llm_docs/guidelines-content/*` documents.

## When to Use

- User asks to update or revise an existing article
- Command: `/update-article <article-path> <update-prompt>`

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

- Existing article path
- Update focus (what should change or be expanded)

## Workflow

### 1. Read the current article and relevant code

- Identify scope, structure, and gaps.
- Inspect local code or implementations if the article refers to them.
- Check source code for undocumented edge cases.

### 2. Clarify the update scope

- Focus only on the requested area.
- Do not expand into unrelated topics.
- Identify if versions have changed since the article was written.

### 3. Rigorous Research & Fact-Checking

- **Hierarchy of Sources (Strict Priority):**
  1. **Specifications:** RFCs, WHATWG, ECMA-262, W3C specs. _Primary source of truth._
  2. **Official Documentation:** Vendor docs, framework guides, MDN.
  3. **Core Maintainer Content:** Blog posts, talks, design docs from project leads (e.g., Dan Abramov, Matteo Collina, Evan You).
  4. **Source Code:** Reference implementations, GitHub repos.
  5. **Industry Expert Blogs:** web.dev, Julia Evans, Brendan Gregg, Martin Kleppmann.
- **Verification:** Fact-check all technical details, version specifics, and edge cases against Priority 1-3 sources.
- **Design Rationale:** Look for why decisions were made, not just what they are.

### 4. Target Audience Alignment (Senior/Staff/Principal)

- **Assume Expertise:** The reader is highly technical. Skip beginner explanations.
- **No Fluff:** Eliminate filler words ("basically", "simply", "in order to"). Be direct and dense.
- **Handling Basics:** If a basic concept _must_ be defined, move it to the **Appendix** (under "Terminology" or "Prerequisites"). Keep the main body focused on advanced internals, patterns, and system design.
- **Why and How:** Every major point should explain reasoning, not just state facts.

### 5. Plan the edits

- Decide what to add, remove, or restructure.
- Ensure design reasoning is explicit for each major choice.
- Plan version evolution notes if behavior has changed.
- Ensure the narrative flows logically for an advanced reader.

### 6. Apply updates

- Correct inaccuracies and drift using the research hierarchy.
- Add **design reasoning** for each major choice: why it exists, what it optimizes, what it sacrifices.
- Add **version evolution notes**: state current version, note previous behavior where changed.
- Add/refine examples, specifically highlighting edge cases and limitations.
- Insert spec quotes and core maintainer quotes where they add necessary precision.
- Ensure **Abstract** is a mental model, not section summaries (update if needed).
- **Code Blocks:** Keep them collapsed (`collapse={...}`) and minimal. Focus on the _diff_ or the _critical logic_.

### 7. Quality review

- **Why/How Check:** Is design reasoning explicit for each major choice?
- **Version Check:** Is current version stated? Previous behavior noted where changed?
- **Conciseness Check:** Can this be said with fewer words without losing depth?
- **Depth Check:** Is this providing insight or just restating docs?
- **Edge Case Check:** Are limits, failure modes, and gotchas exhaustively covered?
- **Ref Check:** Are specs and core maintainer sources cited first?
- **Abstract Check:** Is it a mental model, not section summaries?
- Confirm Appendix structure (Prerequisites, Summary, References, Terminology).

## Output Checklist

- [ ] Update is confined to the requested scope
- [ ] Content is concise, dense, and fluff-free (Senior+ audience)
- [ ] Design reasoning explicit for each major choice
- [ ] Version stated; previous behavior noted where changed
- [ ] Edge cases, limits, and failure modes exhaustively covered
- [ ] Basic concepts moved to Appendix
- [ ] Abstract is a mental model (not section summaries)—updated if needed
- [ ] Article structure meets current guidelines
- [ ] Appendix includes Prerequisites, Summary, and References (Terminology when needed)
- [ ] References updated and prioritized (specs first, core maintainer content prominent)
- [ ] Code blocks collapsed to show only relevant lines
- [ ] Abbreviations expanded on first use
- [ ] No filler—every paragraph earns its place
