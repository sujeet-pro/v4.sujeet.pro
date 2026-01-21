---
name: review-posts
description: Review and improve existing blog posts for technical accuracy, depth, and quality. Use when the user says "/review-posts..." or asks to review/audit an article. Performs fact-checking via web research, identifies gaps, and suggests improvements.
---

# Review Posts Skill

Reviews existing technical articles for accuracy, depth, and quality. Targets senior/staff/principal engineers.

## Invocation

- `/review-posts [path or topic]`
- `/review-posts content/posts/web/2024-01-15-caching.md`
- `/review-posts caching` (searches for matching article)

### Flags

- `--fix-critical` - Auto-fix critical issues only
- `--fix-all` - Auto-fix all issues

## Workflow

```mermaid
flowchart TD
    A[User Request] --> B[Locate Article]
    B --> C[Initial Analysis]
    C --> D[Fact-Check via Research]
    D --> E[Structure Review]
    E --> F[Quality Assessment]
    F --> G[Generate Report]
    G --> H{Fix Flags?}
    H -->|--fix-critical| I[Apply Critical Fixes]
    H -->|--fix-all| J[Apply All Fixes]
    H -->|No flags| K[User Decision]
```

## Phase 1: Locate Article

Find article by path or topic search:

```plain
content/posts/**/*[topic]*.md
content/posts/**/[topic]/index.md
content/in-research/**/*[topic]*.md
```

## Phase 2: Initial Analysis

### Metadata Check
- [ ] `lastReviewedOn` present and recent
- [ ] Tags from `content/tags.jsonc` (NOT `src/content/tags.json`)
- [ ] Valid YAML frontmatter

### Structure Analysis
- [ ] Clear title (H1)
- [ ] Abstract paragraph (2-4 sentences)
- [ ] Overview mermaid diagram
- [ ] Comprehensive TLDR section
- [ ] Proper section hierarchy
- [ ] References section (REQUIRED)
- [ ] NO manual Table of Contents (auto-generated)

### Content Inventory
- List all claims (with citations if present)
- List code examples (note collapse usage)
- List diagrams
- List external references

## Phase 3: Fact-Check via Research

**Technical accuracy is HIGHEST priority.**

### Verify Technical Claims

For each significant claim:
1. Search official documentation
2. Cross-reference multiple sources
3. Flag discrepancies and outdated info

### Check Code Examples

1. Syntax correct?
2. Logic correct?
3. Follows current best practices?
4. Error cases handled?
5. **Boilerplate collapsed?** (imports, setup code)

### Validate References
- URLs accessible
- Content supports claims
- Better sources available?
- **Every claim needs inline reference**

## Phase 4: Structure Review

### Required Elements

| Element | Required | Check |
|---------|----------|-------|
| Title (H1) | Yes | Present, descriptive |
| Abstract | Yes | 2-4 sentences, context |
| Overview diagram | Yes | Mermaid or image |
| TLDR | Yes | Comprehensive with subsections |
| Main content | Yes | H2/H3 hierarchy |
| Code examples | Context-dependent | With collapse for boilerplate |
| References | **REQUIRED** | All sources cited |
| Manual ToC | **NO** | Auto-generated |

### Code Block Review

All code must use collapse for irrelevant lines:

````markdown
```ts title="example.ts" collapse={1-4, 10-11}
import { foo } from 'bar'
import { baz } from 'qux'
import { something } from 'somewhere'
import { another } from 'elsewhere'

export function mainFunction() {
  // Main logic here
  return foo(baz())
}

function helperOne() { /* ... */ }
function helperTwo() { /* ... */ }
```
````

**Collapse rules:**
- Imports: Always collapse unless demonstrating import patterns
- Boilerplate: Collapse setup/teardown code
- Type definitions: Collapse unless discussing types
- Helper functions: Collapse unless directly relevant

### TLDR Quality Check

- [ ] Main concept defined (1-2 sentences)
- [ ] 3-6 themed subsections
- [ ] 3-6 bullet points per subsection
- [ ] **Bold** for key terms
- [ ] Standalone useful (not just teaser)

## Phase 5: Quality Assessment

### Content Quality

#### Technical Accuracy (HIGHEST PRIORITY)
- [ ] All claims verifiable and verified via research
- [ ] Inline references present for every significant claim
- [ ] No speculation presented as fact
- [ ] Correct, current terminology
- [ ] Code examples pass conceptual PR review
- [ ] Performance claims backed by evidence
- [ ] Security considerations addressed

#### Authoritative Tone (REQUIRED)
- [ ] Assertive statements, not excessive hedging
- [ ] Direct language: "X does Y" not "X might possibly do Y"
- [ ] Confident where evidence supports
- [ ] Honest and explicit about unknowns/limitations
- [ ] No unnecessary qualifiers weakening claims
- [ ] Reads like a staff engineer explaining to peers

#### Conciseness (NO FILLER)
- [ ] No padding or filler sentences whatsoever
- [ ] No tutorial-style hand-holding ("First, let's...")
- [ ] No obvious statements ("Security is important")
- [ ] No meta-commentary ("In this article, we will...")
- [ ] Every paragraph earns its place with new information
- [ ] Every sentence advances understanding
- [ ] Reading time < 30 minutes (60 max)

#### Completeness Without Verbosity
- [ ] Covers "why" behind decisions (design reasoning)
- [ ] Documents assumptions and constraints explicitly
- [ ] Historical context where it illuminates decisions
- [ ] All edge cases and subtleties addressed
- [ ] Failure modes discussed
- [ ] Performance implications noted where relevant

#### Trade-offs (MANDATORY)
- [ ] Explicit pros/cons for every approach/technology
- [ ] Real-world examples demonstrating trade-offs
- [ ] Nothing presented as "the best solution"
- [ ] Alternative approaches mentioned with reasons
- [ ] Context-dependent recommendations
- [ ] When to use AND when NOT to use

### Writing Quality
- [ ] Serious, professional, but not stiff
- [ ] Active voice preferred
- [ ] Consistent terminology throughout
- [ ] Logical flow between sections
- [ ] Clear topic sentences

### Staff/Principal Engineer Standard
- [ ] Could be cited as authoritative reference
- [ ] Handles nuance and edge cases
- [ ] Discusses operational considerations
- [ ] Addresses real production concerns
- [ ] No oversimplification of complex topics

### Score Each Area (1-5)

| Area | Score | Notes |
|------|-------|-------|
| Technical accuracy | /5 | Verified claims, correct code |
| Design reasoning | /5 | Why, not just what |
| Trade-off analysis | /5 | Complete pros/cons |
| Code examples | /5 | Correct, idiomatic, collapsed |
| Inline citations | /5 | Every claim supported |
| Conciseness | /5 | No filler, every word earns place |
| Authoritative tone | /5 | Assertive, confident, honest |

## Phase 6: Generate Report

```markdown
# Post Review: [Article Title]

## Summary
**Overall Quality**: [Excellent/Good/Needs Work/Major Issues]
**Technical Accuracy**: [Score/5]
**Last Reviewed**: [Date]

## Critical Issues
### Issue 1: [Title]
- **Location**: [Section/line]
- **Problem**: [Description]
- **Evidence**: [Research findings with source]
- **Fix**: [Recommended change]

## Improvements Needed
### Structure
- [Issues]

### Missing Elements
- [ ] Code block collapse optimization
- [ ] Inline references
- [ ] Trade-off analysis

### Outdated Information
- [Items needing updates]

## Recommendations
### High Priority (Critical)
1. [Fix] - Auto-applied with --fix-critical

### Medium Priority (Improvements)
1. [Enhancement]

### Low Priority (Polish)
1. [Polish item]
```

## Phase 7: Apply Fixes

**With `--fix-critical`:**
1. Apply critical issues
2. Update `lastReviewedOn`
3. Report remaining issues

**With `--fix-all`:**
1. Apply all fixes
2. Update `lastReviewedOn`
3. Run validation

### Common Fixes

#### Adding Inline References
```markdown
// Before
The event loop processes callbacks in a specific order.

// After
The event loop processes callbacks in a specific order ([Node.js Event Loop Documentation](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)).
```

#### Optimizing Code Block Collapse

Always collapse imports and boilerplate.

#### Removing Manual ToC

Delete any manual Table of Contents - it's auto-generated.

## Anti-Patterns to Flag (CRITICAL)

### Content Anti-Patterns
- **Tutorial-style**: "First, let's understand what X is...", "Before we begin..."
- **Obvious statements**: "Security is important", "Performance matters"
- **Unsubstantiated claims**: Any claim without inline reference
- **Silver bullet thinking**: "This is the best approach", "Always use X"
- **Verbose explanations**: Can be said in fewer words
- **Meta-commentary**: "In this article, we will...", "Let me explain..."
- **Filler transitions**: "Now that we've covered X, let's move to Y"
- **Oversimplification**: Glossing over important nuances
- **Missing trade-offs**: Presenting only benefits, no downsides
- **Outdated information**: Old APIs, deprecated patterns, stale benchmarks

### Structure Anti-Patterns
- **Manual ToC**: Should be auto-generated
- **Missing overview diagram**: No visual context for complex topics
- **No collapse in code**: All lines visible including boilerplate
- **Missing References section**: No sources cited
- **Wall of text**: No diagrams, tables, or code breaking up prose
- **Shallow TLDR**: Just a teaser, not comprehensive summary

### Tone Anti-Patterns
- **Too formal**: Academic/corporate speak, passive voice
- **Preachy**: "You should...", "You must..."
- **Dismissive**: "Obviously...", "Simply...", "Just..."
- **Excessive hedging**: "might possibly", "could perhaps", "may or may not"
- **False certainty**: Speculation presented as established fact
- **Condescending**: Explaining things that are basic to the target audience

### Technical Anti-Patterns
- **Code without context**: No title, no explanation of what it demonstrates
- **Incorrect code**: Syntax errors, logic bugs, outdated APIs
- **Unidiomatic code**: Not following language conventions
- **Missing error handling**: Where it would be present in production
- **Toy examples**: Over-simplified to the point of being misleading

## Reference Documents

**IMPORTANT**: Before reviewing, read these documents from the project root:

| Document | Path (from project root) | Purpose |
|----------|--------------------------|---------|
| Content Guidelines | `llm_docs/content-guidelines.md` | Writing standards, conciseness rules, quality checklist |
| Markdown Features | `llm_docs/markdown-features.md` | Expressive Code syntax, Mermaid diagrams, KaTeX |
| Project Instructions | `CLAUDE.md` | Project structure, commands, styling conventions |

**Usage**: Use the Read tool with absolute paths (e.g., `/path/to/project/llm_docs/content-guidelines.md`) to read these files before starting work.

## Tools Available

- `Read` - Read article content
- `Glob` - Find articles by pattern
- `Grep` - Search content
- `WebSearch` - Fact-check claims
- `WebFetch` - Verify references
- `Edit` - Apply fixes
- `Bash` - Run build validation
