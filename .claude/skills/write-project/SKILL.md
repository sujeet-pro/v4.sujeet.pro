---
name: write-project
description: Write or update a project page by scanning a local code folder, using the agent-agnostic skill definition in llm_docs/skills/write-project.md and the canonical content guidelines in llm_docs/guidelines-content.
---

# Write Project Skill (Claude)

Use this skill when the user requests a new project page or uses `/write-project`.

## Instructions

1. **Read** (MUST read before starting):
   - `llm_docs/skills/write-project.md` (canonical workflow)
   - `llm_docs/guidelines-content/*` (all 5 files)

2. **Follow the code-scanning workflow**:
   - Scan the local project folder thoroughly (README, manifests, key source files)
   - Build a mental model of what it does, tech stack, and architecture
   - Extract metadata (git remote, demo URL, tags)

3. **Key requirements**:
   - Consumer-first: explain the problem before the solution
   - Value proposition explicit (why this over alternatives)
   - Every claim grounded in the scanned codebase
   - Architecture diagram included (mermaid)
   - Getting Started provides a working quick start
