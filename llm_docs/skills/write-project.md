# Skill: /write-project

Write or update a **project** page by scanning a local code folder. This skill is agent-agnostic and must follow all `llm_docs/guidelines-content/*` documents.

## When to Use

- User asks to create a project page from a local codebase
- User asks to update an existing project page
- Command: `/write-project <local-project-folder> [existing-project-path]`
  - Without `existing-project-path`: creates a new project entry
  - With `existing-project-path` (e.g. `content/projects/my-tool`): updates the existing project

## Required Reading (MUST read before starting)

### Core Guidelines (Always Read)

- `llm_docs/guidelines-content/content-structure.md`
- `llm_docs/guidelines-content/content-guidelines.md`
- `llm_docs/guidelines-content/research-and-fact-checking.md`
- `llm_docs/guidelines-content/markdown-features.md`
- `llm_docs/guidelines-content/persona.md`

## Core Principles

This skill produces consumer-focused project pages for senior/staff/principal engineers:

- **Consumer-first**: Explain what problem it solves before how it works
- **Why this is better**: Explicitly compare with alternatives or the status quo
- **Grounded in code**: Every claim must be verifiable from the scanned codebase
- **Concise but complete**: Cover the full scope without padding

## Inputs

- Path to a local project folder (required)
- Path to an existing project entry to update (optional)
- Any constraints (audience emphasis, specific sections to highlight)

## Workflow

### 1. Scan the project folder

- Read README, CHANGELOG, and documentation files
- Read package.json / Cargo.toml / go.mod / pyproject.toml / similar manifest files
- Read key source files, config files, and tests
- Build a mental model of: what it does, tech stack, architecture, key dependencies

### 2. Identify the consumer value proposition

- What problem does it solve?
- Who is it for?
- What makes it better than alternatives or the status quo?
- Extract from README, docs, or infer from code when not explicitly stated

### 3. Extract metadata

- Detect git remote URL (for `gitRepo` frontmatter)
- Find demo URLs from README, package.json homepage, or docs
- Infer relevant tags from the tech stack and problem domain

### 4. Check for existing project

- If update path given: read current content and determine what changed
- If creating new: propose a slug based on the project name
- Verify the slug doesn't conflict with existing projects in `content/ordering.json5`

### 5. Draft the project page

Create `content/projects/<slug>/README.md` with the following structure:

```markdown
---
gitRepo: <detected or provided>
links:
  - url: <detected or provided>
    text: <short label e.g. npm, Docs, Demo>
tags: [<inferred from tech/domain>]
---

# Project Name

Consumer-focused description paragraphs (what problem, why this approach, who benefits).

## Overview

Architecture or flow diagram (mermaid).

## What It Does

Core capabilities from the user/consumer perspective.

## Why It Exists

Problem statement, limitations of alternatives, what makes this better.

## How It Works

High-level architecture, key design decisions (not exhaustive internals).

## Key Features

Notable features with brief explanations.

## Getting Started

Quick start for consumers (install, configure, use).

## Appendix

### Tech Stack

Languages, frameworks, key dependencies.

### References

Project repo, docs, related resources.
```

**Section guidelines**:

- **H1 + description**: Clear project name, followed by consumer-focused paragraphs explaining the problem, approach, and who benefits
- **Overview**: Architecture or flow diagram (mermaid) showing the high-level system
- **What It Does**: Capabilities from the consumer's perspective — what can I do with it?
- **Why It Exists**: The motivation — what was broken, missing, or suboptimal before?
- **How It Works**: High-level architecture and key design decisions. Not a code walkthrough — focus on the interesting engineering choices
- **Key Features**: Notable features worth highlighting, with brief explanations
- **Getting Started**: Quick start that gets a consumer from zero to working
- **Appendix**: Tech stack details and references (repo, docs, related projects)

### 6. Update ordering

- Add the project slug to `content/ordering.json5` in the `projects` array

### 7. Quality review

- Consumer focus: Does the page explain value before implementation?
- Accuracy: Is every claim verifiable from the scanned codebase?
- Completeness: Are all sections filled with substantive content?
- No fluff: Does every paragraph earn its place?
- Frontmatter: Are `gitRepo`, `links`, and `tags` correctly populated?
- Ordering: Is the slug added to `content/ordering.json5`?

## Output Checklist

- [ ] Project file created at `content/projects/<slug>/README.md`
- [ ] Ordering config updated (`projects` array in `content/ordering.json5`)
- [ ] Consumer-focused description (problem first, then solution)
- [ ] Value proposition clearly stated (why this over alternatives)
- [ ] All claims grounded in the scanned codebase
- [ ] Architecture/flow diagram included (mermaid)
- [ ] Getting Started section provides working quick start
- [ ] Frontmatter populated (`gitRepo`, `links`, `tags`)
- [ ] Appendix includes Tech Stack and References
- [ ] No filler — every paragraph earns its place
