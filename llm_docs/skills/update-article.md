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

3. **Breadth research (topic survey)**
   - Identify canonical sections, edge cases, and expected coverage.
   - Compare with the current outline to find missing or outdated areas.

4. **Section-level deep research**
   - For each affected section, gather primary sources and spec clauses.
   - Verify limits, defaults, version-specific behaviors, and edge cases.

5. **Plan the edits**
   - Decide what to add, remove, or restructure to fit the required article layout.
   - Ensure Appendix requirements are met (Prerequisites, Summary, References).

6. **Apply updates**
   - Correct inaccuracies and drift.
   - Add or refine examples and edge cases.
   - Insert spec quotes where they clarify nuance.
   - Keep code blocks collapsed and minimal.
   - Expand abbreviations on first use (excluding headings).

7. **Quality review**
   - Re-check all non-negotiable rules.
   - Ensure citations and references are complete and specs-first.
   - Confirm the Appendix is the final H2 section.

## Output Checklist

- Update is confined to the requested scope
- Article structure meets current guidelines
- Appendix includes Prerequisites, Summary, and References (Terminology when needed)
- References updated (specs first)
- Code blocks collapsed to show only relevant lines
- Edge cases and limits covered in affected sections
- Abbreviations expanded on first use
