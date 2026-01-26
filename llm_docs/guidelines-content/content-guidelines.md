# Content Writing and Review Guidelines

These guidelines define how to write and review articles for this repo. They are **mandatory** for both new and updated content.

## Audience and Voice

- **Author**: Principal engineer with deep domain expertise.
- **Audience**: Senior/staff/principal engineers and technical leadership (Directors/VPs with a technical background).
- **Tone**: Direct, precise, and pragmatic. Concise with no filler. Curiosity is welcome only when it adds technical value.
- **Persona**: See `llm_docs/guidelines-content/persona.md`.

## Non-Negotiable Rules (All MUST)

1. **Principal engineer voice**: Peer-to-peer for senior engineers and technical leadership.
2. **Concise yet deep**: Every paragraph adds new information or analysis; remove filler.
3. **Edge cases included**: Cover limits, failure modes, and surprising behaviors.
4. **Technical accuracy first**: Every technical claim must be verified; references required.
5. **Specs first**: Always include specification links; quote short spec lines (<= 25 words) for nuance.
6. **Coherent flow**: Each section builds on the previous; transitions make the progression explicit.
7. **Examples everywhere**: Every section includes a real-world example with concrete constraints.
8. **Design choices explained**: For each decision, explain trade-offs and when it does or does not make sense.
9. **Historical evolution**: Include where it clarifies why the design exists.
10. **Single-topic focus**: Split broad topics into a series.

## Required Article Structure

1. **H1 Title**
2. **Description paragraph(s)** directly after H1 (used for metadata)
3. **Overview diagram** (mermaid or image) with `<figure>` and `<figcaption>`
4. **TLDR** section with themed subsections and bullet points
5. **Main sections** (H2/H3) with a clear progression
6. **Conclusion** (concise synthesis)
7. **Appendix** (final H2) containing:
   - **Prerequisites** (H3, required) - list assumed knowledge or state "None"
   - **Terminology** (H3, include when needed) - define domain terms and abbreviations
   - **Summary** (H3, required) - quick revision in 3-6 bullets
   - **References** (H3, required) - specs first

No manual Table of Contents. The Appendix must be the final H2 section.

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

For each major design choice, cover:

- **Why it exists** (constraints and assumptions)
- **What it optimizes** (latency, cost, operability, consistency, etc.)
- **What it sacrifices** (complexity, memory, portability, etc.)
- **When it makes sense**
- **When it does not**

### Historical Context

When applicable, explain:

- What problem the prior approach had
- What changed in the new version
- How the new design addresses prior pain

Example: HTTP/1.0 -> HTTP/1.1 -> HTTP/2 -> HTTP/3.

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
- TLDR with subsections
- Conclusion present
- Appendix is last H2 and includes Prerequisites, Summary, and References
- Terminology included when needed

### Accuracy and Evidence

- All technical claims verified
- Specs cited (highest priority)
- Short spec quotes included for key nuances
- References list complete and relevant

### Content Quality

- Single-topic focus (or overview with linked supporting articles)
- Every section includes a real-world example
- Edge cases and failure modes covered
- Design decisions explained with trade-offs
- Historical evolution covered where relevant
- Section flow is coherent and explicit

### Code Blocks

- Only relevant lines visible
- Boilerplate collapsed via `collapse={...}`
- Examples are realistic and typed

### Tone and Audience

- Principal engineer voice
- Friendly but professional
- Concise, no filler
- Abbreviations expanded on first use
