# LLM Agent Commands

## Article Commands

### Review Article

**Command**: `Review article: @<file-path>` or `Review article: <article-name>`

**Description**: Review an existing article for technical accuracy, structure, accessibility, and adherence to project standards.

**Path Reference**: Use `@` to reference files (e.g., `@content/writing/javascript/patterns/2023-05-01-pub-sub.md`)

**Review Checklist**:

1. **Structure**
   - H1 title present and descriptive
   - Description paragraph after H1
   - "Table of Contents" heading exists
   - Logical section flow

2. **Technical Accuracy**
   - Code examples are correct and runnable
   - Technical claims are accurate
   - Best practices are followed

3. **Code Blocks**
   - Boilerplate/imports collapsed with `collapse={lines}`
   - Relevant lines highlighted
   - Proper language specified
   - Titles added for file context

4. **Accessibility**
   - Images have alt text
   - Tables are accessible
   - Links are descriptive

5. **Frontmatter**
   - Appropriate tags selected
   - Collection-specific fields present

6. **Tags Review**
   - Check tags against `tags.jsonc` for validity
   - Suggest additional relevant tags that could be added
   - Identify tags that should be removed (irrelevant or too broad)
   - Ensure tag coverage matches article content

**Example**:

```
Review article: @content/writing/javascript/patterns/2023-05-01-pub-sub.md
```

---

### Generate Article

**Command**: `Generate article: <topic>` or `Generate article: @<draft-folder>`

**Description**: Generate a new technical article on the specified topic, or from a draft folder containing research materials.

**Path Reference**: Use `@` to reference files or folders (e.g., `@content/drafts/distributed-consensus/`)

**From Topic with References**:

```
Generate article: Understanding Event Sourcing
ref: @content/writing/javascript/patterns/2023-05-01-pub-sub.md
```

**From Draft Folder**:

```
Generate article: @content/drafts/distributed-consensus/
```

This reads all files from the draft folder and uses `_meta.yaml` for configuration (if present).

**Draft Folder Structure** (flexible - not all files required):

```
content/drafts/<slug>/
├── _meta.yaml     # Optional: target collection, tags hints
├── notes.md       # Optional: personal notes
├── outline.md     # Optional: article outline
├── research-*.md  # Optional: raw research content
├── *.md           # Any markdown files with raw content
└── code/          # Optional: code examples
```

The draft folder can contain any number of markdown files with raw research content. No specific structure is enforced - the generator will synthesize all available materials.

**Generation Process**:

1. Read all source materials from draft folder (any `.md` files, code, etc.)
2. Identify target collection from `_meta.yaml` (if present) or infer from content
3. Synthesize cohesive narrative from raw research
4. Structure with proper sections
5. Add code examples with appropriate features
6. Include Mermaid diagrams where helpful
7. Generate proper frontmatter with appropriate tags
8. **Tags Selection**: Review `tags.jsonc` and select relevant tags based on content
9. Place in correct location with dated filename

**Output Location**:

- Filename: `YYYY-MM-DD-slug.md` (today's date)
- Path: Based on `target` and `folder` in `_meta.yaml` or inferred from content

---

### Create Draft

**Command**: `Create draft: <slug>`

**Description**: Initialize a new draft folder structure.

**Creates**:

```
content/drafts/<slug>/
├── _meta.yaml     # Pre-filled template (optional to fill)
└── notes.md       # Empty notes file to start research
```

Additional files can be added freely - there's no required structure. Add research notes, code snippets, or any raw content as separate files.

---

## Code Commands

### Review Code

**Command**: `Review code: @<file-path>`

**Description**: Review code for TypeScript strictness, accessibility, performance, and project conventions.

**Path Reference**: Use `@` to reference files (e.g., `@src/components/Button.tsx`)

**Checks**:

- TypeScript strict compliance
- Proper type annotations
- Import conventions (type-only imports)
- Accessibility patterns
- Performance considerations
- Tailwind/CSS minimalism

---

### Fix Code

**Command**: `Fix code: @<file-path>` with description of issue

**Description**: Fix specific issues in code while maintaining project standards.

**Path Reference**: Use `@` to reference files (e.g., `@src/utils/helpers.ts`)

**Guidelines**:

- Maintain strict TypeScript
- Keep CSS minimal
- Preserve accessibility
- Don't over-engineer

---

## Utility Commands

### List Drafts

**Command**: `List drafts`

**Description**: Show all draft folders with their status and metadata.

---

### Validate Content

**Command**: `Validate content: <collection>` or `Validate content: @<folder>`

**Description**: Validate all content in a collection for required fields and structure.

**Collections**: `writing`, `deep-dives`, `work`, `uses`

**Path Reference**: Use `@` to validate a specific folder (e.g., `@content/writing/javascript/`)

---

### Suggest Tags

**Command**: `Suggest tags for: <topic>` or `Suggest tags for: @<file>`

**Description**: Suggest appropriate tags from `tags.jsonc` for a topic or article.

**Path Reference**: Use `@` to reference a file (e.g., `@content/writing/javascript/2024-01-15-closures.md`)

---

## Command Patterns

### Path Reference with `@`

Use `@` prefix to reference files and folders in commands. This allows IDE integration for easy file selection.

**Examples**:

- File: `@content/writing/javascript/patterns/2023-05-01-pub-sub.md`
- Folder: `@content/drafts/distributed-consensus/`
- Relative: `@src/components/Button.tsx`

### Alternative Path Formats

Commands also accept:

- By name/slug: `pub-sub` or `Publish-Subscribe Pattern`
- Collection name: `writing`, `deep-dives`

### Reference Files

Use `ref:` to provide additional context files:

```
Generate article: React Server Components
ref: @content/writing/frameworks/react/2024-03-15-react-architecture.md,
     @content/writing/web-development/architecture/2023-10-01-critical-rendering-path/index.md
```

### Draft Folder Generation

When using `Generate article: @<draft-folder>`:

1. Reads all `.md` files in the folder (any structure)
2. Reads `_meta.yaml` for configuration (if present)
3. Synthesizes content from all raw research materials
4. Uses folder name as slug basis
5. Selects appropriate tags from `tags.jsonc`
6. Generates dated filename automatically
