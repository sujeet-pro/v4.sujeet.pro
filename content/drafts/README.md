# Drafts

This folder contains draft articles in progress. Each draft is a folder containing research notes, outlines, and metadata.

## Creating a New Draft

1. Create a folder with your article slug:

   ```
   content/drafts/your-article-slug/
   ```

2. Add the metadata file `_meta.yaml`:

   ```yaml
   target: writing # writing | deep-dives | work | uses
   tags:
     - relevant-tag
   folder: category/subcategory # Optional: target folder
   workingTitle: Your Working Title
   status: research # research | outlining | drafting | review | ready
   ```

3. Add your notes as markdown files:
   - `notes.md` - Main research notes
   - `outline.md` - Article structure
   - `references.md` - External links and summaries
   - `code-examples.md` - Code snippets to include

## Generating an Article

Use the command:

```
Generate article from draft: your-article-slug
```

The agent will:

1. Read all files in the draft folder
2. Use `_meta.yaml` for configuration
3. Generate a cohesive article
4. Place it in the correct location with today's date

## Draft Folder Template

```
your-article-slug/
├── _meta.yaml       # Required: metadata
├── notes.md         # Your research notes
├── outline.md       # Optional: planned structure
├── references.md    # Optional: external sources
└── code-examples.md # Optional: code to include
```

## Status Workflow

1. **research** - Gathering information
2. **outlining** - Structuring the article
3. **drafting** - Writing in progress
4. **review** - Ready for review
5. **ready** - Ready to generate final article

## Example `_meta.yaml`

```yaml
# For a writing article
target: writing
folder: javascript/patterns
tags:
  - js
  - design-patterns
workingTitle: Advanced Observer Patterns
status: drafting

# For a deep-dive
target: deep-dives
subcategory: system-design/foundations
tags:
  - system-design
  - distributed-systems
workingTitle: CRDT Deep Dive
status: research

# For a work document
target: work
type: design-doc
tags:
  - platform-engineering
workingTitle: Auth Service Redesign
status: outlining
```
