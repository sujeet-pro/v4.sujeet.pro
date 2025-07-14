# Remark Auto Layout Plugin

This remark plugin automatically adds layout frontmatter to markdown files if it doesn't already exist.

## Features

- Automatically adds `layout` frontmatter to markdown files without frontmatter
- Adds `layout` to existing frontmatter if it's missing
- Configurable default layout path
- Option to skip files that already have a layout defined

## Usage

### Basic Usage

```typescript
import remarkAutoLayout from "./src/plugins/remark-auto-layout"

// In your Astro config
export default defineConfig({
  markdown: {
    remarkPlugins: [[remarkAutoLayout, { defaultLayout: "src/layout/layout.astro" }]],
  },
})
```

### Options

- `defaultLayout` (string, optional): The default layout path to use. Defaults to `'src/layout/layout.astro'`
- `skipIfHasLayout` (boolean, optional): Whether to skip files that already have a layout. Defaults to `true`

### Examples

#### Before (no frontmatter)

```markdown
# My Page Title

This is my page content.
```

#### After (with auto-added frontmatter)

```markdown
---
layout: src/layout/layout.astro
---

# My Page Title

This is my page content.
```

#### Before (existing frontmatter without layout)

```markdown
---
title: My Page
description: A sample page
---

# My Page Title

This is my page content.
```

#### After (layout added to existing frontmatter)

```markdown
---
title: My Page
description: A sample page
layout: src/layout/layout.astro
---

# My Page Title

This is my page content.
```

## Installation

The plugin is included in this project at `src/plugins/remark-auto-layout.ts`. No additional dependencies are required as it uses the existing `unist-util-visit` package that comes with Astro.

## How it Works

1. The plugin traverses the markdown AST (Abstract Syntax Tree)
2. It looks for YAML frontmatter nodes
3. If no frontmatter exists, it creates one with the layout
4. If frontmatter exists but no layout is specified, it adds the layout to the existing frontmatter
5. If a layout already exists and `skipIfHasLayout` is true, it skips the file

## Customization

You can customize the plugin by modifying the options:

```typescript
;[
  remarkAutoLayout,
  {
    defaultLayout: "src/layouts/custom-layout.astro",
    skipIfHasLayout: false,
  },
]
```

This will use a different default layout and will add the layout even if one already exists (potentially overwriting it).
