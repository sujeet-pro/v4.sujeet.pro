# Skill: /update-article

Update an **existing** article based on a prompt. This skill is agent-agnostic and must follow all `llm_docs/guidelines-content/*` documents.

## When to Use

- User asks to update or revise an existing article
- Command: `/update-article <article-path> <update-prompt>`

## Required Reading

- `llm_docs/guidelines-content/content-structure.md`
- `llm_docs/guidelines-content/content-guidelines.md`
- `llm_docs/guidelines-content/research-and-fact-checking.md`
- `llm_docs/guidelines-content/markdown-features.md`
- `llm_docs/guidelines-content/persona.md`

## Inputs

- Existing article path
- Update focus (what should change or be expanded)

## Workflow

1. **Read the current article and relevant code**
   - Identify scope, structure, and gaps.
   - Inspect local code or implementations if the article refers to them.

2. **Clarify the update scope**
   - Focus only on the requested area.
   - Do not expand into unrelated topics.

3. **Rigorous Research & Fact-Checking**
   - **Hierarchy of Sources (Strict Priority):**
     1. **Specifications:** (e.g., HTML/ECMAScript specs, RFCs). *Primary source of truth.*
     2. **Official Documentation & Engineering Blogs:** (e.g., v8.dev, libuv docs, React docs, tool-specific docs).
     3. **Authoritative Industry Sources:** (e.g., web.dev, MDN).
     4. **Prominent Domain Experts:** (e.g., recognized engineering leaders' blogs).
   - **Verification:** Fact-check all technical details, version specifics, and edge cases against Priority 1 & 2 sources.

4. **Target Audience Alignment (Senior/Staff/Principal)**
   - **Assume Expertise:** The reader is highly technical. Skip beginner explanations.
   - **No Fluff:** Eliminate filler words ("basically", "simply", "in order to"). Be direct and dense.
   - **Handling Basics:** If a basic concept *must* be defined, move it to the **Appendix** (under "Terminology" or "Prerequisites"). Keep the main body focused on advanced internals, patterns, and system design.

5. **Plan the edits**
   - Decide what to add, remove, or restructure.
   - Ensure the narrative flows logically for an advanced reader.

6. **Apply updates**
   - Correct inaccuracies and drift using the research hierarchy.
   - Add/refine examples, specifically highlighting edge cases and limitations.
   - Insert spec quotes where they add necessary precision.
   - **Code Blocks:** Keep them collapsed (`collapse={...}`) and minimal. Focus on the *diff* or the *critical logic*.

7. **Quality review**
   - **Conciseness Check:** Can this be said with fewer words?
   - **Depth Check:** Is this providing insight or just restating docs?
   - **Ref Check:** Are specs cited first?
   - Confirm Appendix structure (Prerequisites, Summary, References, Terminology).

## Output Checklist

- Update is confined to the requested scope
- Content is concise, dense, and fluff-free (Senior+ audience)
- Basic concepts moved to Appendix
- Article structure meets current guidelines
- Appendix includes Prerequisites, Summary, and References (Terminology when needed)
- References updated (specs first)
- Code blocks collapsed to show only relevant lines
- Edge cases and limits covered in affected sections
- Abbreviations expanded on first use
