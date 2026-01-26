# Skill: /write-article

Write a **new** article from a prompt. This skill is agent-agnostic and must follow all `llm_docs/guidelines-content/*` documents.

## When to Use

- User asks to write a new article
- Command: `/write-article <topic or prompt>`

## Required Reading

- `llm_docs/guidelines-content/content-structure.md`
- `llm_docs/guidelines-content/content-guidelines.md`
- `llm_docs/guidelines-content/research-and-fact-checking.md`
- `llm_docs/guidelines-content/markdown-features.md`
- `llm_docs/guidelines-content/persona.md`

## Inputs

- Topic and scope
- Target category and topic (if unclear, propose options)
- Any constraints (length, audience emphasis, required sources)

## Workflow

1. **Clarify scope and placement**
   - Confirm the topic, depth, and target audience.
   - Identify the expected category/topic path.

2. **Read relevant code and context**
   - Inspect the local codebase when the article is tied to implementation details.
   - Note constraints, defaults, and real behavior to ground examples.

3. **Breadth research (topic survey)**
   - Identify canonical sections, edge cases, and common misconceptions.
   - Use this to outline the article and required Appendix content.

4. **Section-level deep research**
   - For each section, gather primary sources and spec clauses.
   - Capture limits, defaults, version-specific behaviors, and edge cases.

5. **Outline the article**
   - Required structure: H1, description, diagram, TLDR, main sections, conclusion, Appendix.
   - Ensure every section includes a real-world example.
   - Plan where to explain design decisions and historical evolution.

6. **Draft the article**
   - Create `content/articles/<category>/<topic>/<slug>/README.md`.
   - Use a concise H1 and description paragraph(s).
   - Include diagrams, collapsed code blocks, and examples.
   - Add spec quotes (short) and references.
   - Expand abbreviations on first use (excluding headings).

7. **Update ordering**
   - Add new IDs to `content/ordering.jsonc`:
     - `articlesOrder`
     - `topicVsArticlesOrder[topic]`
   - If new category/topic, also update:
     - `categoryOrder`, `topicsOrder`, `categoryVsTopics`

8. **Quality review**
   - Verify all non-negotiable rules.
   - Check code blocks use `collapse={...}`.
   - Ensure Appendix requirements are met and references are complete.

## Output Checklist

- Article file created in correct folder structure
- Ordering config updated
- Appendix includes Prerequisites, Summary, and References (Terminology when needed)
- References section included (specs first)
- Code blocks collapsed to show only relevant lines
- Edge cases and limits covered in each major section
- Abbreviations expanded on first use
