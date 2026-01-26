# Skill: /review-all-code

Review the entire codebase for code-quality and architecture guidelines, and refactor as needed. This skill is agent-agnostic and must follow `llm_docs/guidelines-code/*`.

## When to Use

- User asks to review all code, enforce code guidelines, or refactor for readability and maintainability
- Command: `/review-all-code`

## Required Reading

- `llm_docs/guidelines-code/coding-standards.md`

## Inputs

- Scope (entire repo or specific folders)
- Constraints (deadlines, max change size, risk tolerance)
- Known pain points (build/dev slowness, hard-to-read areas, brittle scripts)

## Workflow

1. **Baseline scan**
   - Map the repo structure and identify key modules.
   - Flag JavaScript files and mixed TS/JS boundaries.
   - Locate validation scripts and orchestration points.

2. **Guideline audit**
   - Compare structure, naming, and module boundaries against the guidelines.
   - Identify long multi-purpose functions and overloaded files.
   - Note missing or stale docs tied to current behavior.

3. **Plan the refactor**
   - If changes are large, propose a staged plan before editing.
   - Prioritize changes that reduce cognitive load and clarify responsibilities.

4. **Refactor and restructure**
   - Split files by concern and rename folders to match use cases.
   - Convert JavaScript to TypeScript and keep typing strict.
   - Introduce orchestrator functions for multi-step workflows and shared data.
   - Keep helpers focused on a single rule or responsibility.

5. **Local verification**
   - Run `npm run check` and confirm there are no TypeScript errors.
   - Run `npm run lint` and ensure there are no lint errors.
   - Run `npm run format` to apply formatting; re-run if it reports issues.
   - Run `npm run build` and confirm the build completes.
   - If any step fails, fix the issues and re-run the failing step until it passes, then continue.

6. **Validation outputs**
   - Ensure terminal output is human-readable with clear next steps.
   - Write LLM-optimized logs for agents with actionable context.

7. **Docs sync**
   - Update `llm_docs`, `docs`, and `README` to match behavior and structure changes.

## Output Checklist

- All changes align with `llm_docs/guidelines-code/coding-standards.md`
- JavaScript removed or migrated; TypeScript remains strict
- Files split by single concern; names reflect real use cases
- Orchestrator patterns used for multi-step or shared-data workflows
- `npm run check` passes with zero TypeScript errors
- `npm run lint` passes with zero lint errors
- `npm run format` applied/clean; formatting is correct
- `npm run build` completes successfully
- Validation scripts output both human-readable summaries and LLM-friendly logs
- Documentation updated to match the new structure and behavior
