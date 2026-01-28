# Content Writing and Review Guidelines

These guidelines define how to write and review articles for this repo. They are **mandatory** for both new and updated content.

## Audience and Voice

- **Author**: Principal engineer with deep domain expertise.
- **Audience**: Senior/staff/principal engineers and technical leadership (Directors/VPs with a technical background).
- **Tone**: Direct, precise, and pragmatic. Concise with no filler. Curiosity is welcome only when it adds technical value.
- **Persona**: See `llm_docs/guidelines-content/persona.md`.

## Non-Negotiable Rules (All MUST)

1. **Principal engineer voice**: Peer-to-peer for senior engineers and technical leadership.
2. **Concise yet exhaustive**: Every paragraph adds new technical insight; remove filler and unnecessary explanations. But cover ALL edge cases, failure modes, and implementation nuances.
3. **Why and how, not just what**: Focus on reasoning behind design choices, not just listing features. Every "what" must have a "why".
4. **Technical accuracy first**: Every technical claim must be verified against specs, official docs, or core maintainer sources; references required.
5. **Specs and official sources first**: Always cite specifications (RFCs, WHATWG, ECMA, etc.) and official documentation. Quote short spec lines (<= 25 words) for nuance.
6. **Version-aware content**: State the current version explicitly. When behavior has changed, note the previous implementation so readers understand the evolution.
7. **Design reasoning explicit**: For each design choice (by the tool/service/standard), explain the constraints, trade-offs, and reasoning behind it.
8. **Examples with real constraints**: Every section includes a production-relevant example with concrete numbers and operational implications.
9. **Coherent flow**: Each section builds on the previous; transitions make the progression explicit.
10. **Single-topic focus**: Split broad topics into a series.

## Required Article Structure

1. **H1 Title**
2. **Description paragraph(s)** directly after H1 (used for metadata)
3. **Overview diagram** (mermaid or image) with `<figure>` and `<figcaption>`
4. **Abstract** section (mental model for the entire article—see below)
5. **Main sections** (H2/H3) with in-depth technical analysis
6. **Conclusion** (concise synthesis)
7. **Appendix** (final H2) containing:
   - **Prerequisites** (H3, required) - list assumed knowledge or state "None"
   - **Terminology** (H3, include when needed) - define domain terms and abbreviations
   - **Summary** (H3, required) - quick revision in 3-6 bullets
   - **References** (H3, required) - specs first

No manual Table of Contents. The Appendix must be the final H2 section.

### Abstract (Replaces TLDR)

The Abstract is a **mental model** of the article, not a summary of each section. It should:

- **Be revision-friendly**: A senior engineer should be able to read just the Abstract and recall the key concepts.
- **Use any effective format**: Prose, bullet points, a diagram, or a combination—whatever communicates the core mental model best.
- **Not mirror headings**: Do NOT create a bullet point for each section heading. Instead, distill the conceptual essence.
- **Be concise but complete**: Capture the "gist" that would let someone reconstruct the main ideas.

**Good Abstract patterns:**
- A single diagram showing the relationship between concepts
- 3-5 bullets capturing the core mental model (not section summaries)
- A short paragraph explaining the key insight followed by a diagram
- A table showing key trade-offs or comparisons

**Bad Abstract patterns:**
- "In this article we cover X, Y, Z" (meta-description)
- One bullet per heading (section-by-section summary)
- Long prose that repeats what's in the article

### Description Paragraphs (Meta Description)

The description is extracted from the text between the H1 and the first H2. Keep it tight, specific, and oriented to senior readers.

## Abbreviations and Terminology

- The **first occurrence** of any abbreviation in the body (excluding headings) must include the full form.
  - Example: `SSR (Server-Side Rendering) apps`.
- After the first expansion, use the abbreviation consistently.
- Ensure the Terminology section matches the terms used in the article.

## Content Expectations

### Depth and Focus

- One topic per article. If you need breadth, split into a series.
- Every paragraph must earn its place. If deleting it does not reduce understanding, delete it.

### Edge Cases and Failure Modes

- Cover boundary conditions, defaults, limits, and undefined behaviors.
- Call out counterintuitive outcomes or version-specific traps.

### Examples and Real-World Implications

- Every section includes a real-world example.
- Use concrete numbers, system constraints, and operational outcomes.
- Prefer production incidents and actual trade-offs over theory.

### Design Decisions and Trade-Offs

For each major design choice made by the tool, service, or standard, cover:

- **Why it exists** (what problem or constraint drove the design)
- **What it optimizes** (latency, cost, operability, consistency, etc.)
- **What it sacrifices** (complexity, memory, portability, etc.)
- **When it makes sense** (concrete use cases)
- **When it does not** (antipatterns, misuse scenarios)

The goal is to explain the **reasoning**, not just list features. A senior engineer should understand why the designers made these choices.

### Version Evolution (Required for Changing Topics)

For topics where behavior has changed in recent versions:

1. **State the current version explicitly** (e.g., "As of Node.js 20.x..." or "React 18+")
2. **Note previous behavior** when it differs materially from current
3. **Explain why it changed** (the problem with the old approach)

**Format example:**

```markdown
As of React 18, concurrent rendering is the default. Renders can be interrupted and resumed.

> **Prior to React 18:** Rendering was synchronous and blocking. Once started, a render had to complete before the browser could respond to input. This caused jank on complex updates.
```

This helps readers who encounter older code or documentation understand that behavior has evolved.

### In-Depth Technical Analysis

Main sections should dive deep into implementation details:

- **Internal mechanics**: How does it actually work under the hood?
- **Edge cases and limits**: Boundary conditions, maximum values, undefined behaviors
- **Failure modes**: What breaks, when, and how to detect/recover
- **Performance characteristics**: Time/space complexity, real-world benchmarks where relevant
- **Gotchas**: Counterintuitive behaviors, common mistakes, version-specific traps

The depth should match what a principal engineer would want when debugging a production issue or making an architectural decision.

### Optional Engagement Hooks

If you include short prompts like "Did you know?", keep them to 1-2 sentences, make them technically meaningful, and cite them. Do not add fluff.

## Code Examples

- Only show **relevant** lines.
- Collapse everything else with `collapse={...}`.
- Use realistic, production-grade patterns.
- Add comments explaining **why**, not just what.

### Embedded Code (Strict Collapse Rule)

When code is embedded in articles, **show only the 1-5 lines that matter** and collapse everything else, even if it means collapsing:

- imports
- setup/bootstrapping
- full function definitions (if only a few lines inside are relevant)
- helper functions
- error handling
- configuration objects

If the key insight is a single line inside a function, show only that line and collapse the function header, body, and footer. Readers can expand if needed.

**Goal:** Minimize visible code to the smallest slice that proves the point.

## References and Citations

- References live in the Appendix and must be complete.
- Include **specifications first**.
- Quote short spec lines (<= 25 words) to pinpoint nuanced behavior.
- Every technical claim should be supported by a source.

## Review Checklist

### Structure

- H1 present and specific
- Description paragraph immediately after H1
- Overview diagram with figcaption
- Abstract section with mental model (not section-by-section summary)
- Conclusion present
- Appendix is last H2 and includes Prerequisites, Summary, and References
- Terminology included when needed

### Accuracy and Evidence

- All technical claims verified against specs, official docs, or core maintainer sources
- Specs cited (highest priority)
- Short spec quotes included for key nuances
- Current version stated explicitly where relevant
- Previous behavior noted when it has changed
- References list complete and prioritized (specs first)

### Content Quality

- Single-topic focus (or overview with linked supporting articles)
- Why and how explained, not just what
- Design reasoning explicit for each major choice
- Every section includes a production-relevant example
- Edge cases, failure modes, and limits exhaustively covered
- In-depth technical analysis of internal mechanics
- Version evolution documented where applicable
- Section flow is coherent and explicit

### Code Blocks

- Only relevant lines visible
- Boilerplate collapsed via `collapse={...}`
- Examples are realistic and typed

### Tone and Audience

- Principal engineer voice
- Friendly but professional
- Concise but exhaustive—no filler, all edge cases covered
- No unnecessary explanations for senior engineers
- Abbreviations expanded on first use
