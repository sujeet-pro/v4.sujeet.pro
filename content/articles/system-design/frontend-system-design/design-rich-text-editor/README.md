# Draft: Design a Rich Text Editor

Building a rich text editor for web applications.

## TLDR

- Document models separate content from rendering
- Collaboration requires OT or CRDT integration
- Accessibility is critical for text editing

## Outline

1. Editor approaches: contentEditable, custom rendering
2. Data model: document model, operations
3. ProseMirror architecture: schema, state, transactions
4. Slate.js architecture: value, operations, plugins
5. Formatting: inline marks, block types
6. Collaboration: OT/CRDT integration
7. Features: mentions, embeds, tables
8. Accessibility: keyboard navigation, screen readers
