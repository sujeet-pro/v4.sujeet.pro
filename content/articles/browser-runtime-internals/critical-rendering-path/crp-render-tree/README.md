# Critical Rendering Path: Render Tree

How browsers combine DOM and CSSOM into a render tree containing only visible elements.

## What is the Render Tree?

With [DOM](../crp-dom-construction/README.md) and [CSSOM](../crp-cssom-construction/README.md) ready, the browser combines them into the **Render Tree**:

<figure>

![Render Tree](./render-tree.invert.png)

<figcaption>Render tree combines DOM structure with CSSOM styles, excluding non-visual elements</figcaption>

</figure>

## Render Tree Characteristics

- **Contains only visible nodes**: Excludes `<head>`, `<script>`, `<meta>`, and elements with `display: none`
- **Includes computed styles**: Each node has its final calculated styles
- **Excludes invisible content**: `display: none` removes from render tree entirely

## What Gets Excluded

The render tree excludes elements that don't produce visual output:

- `<head>` and its contents (`<meta>`, `<title>`, `<link>`, `<script>`)
- Elements with `display: none`
- `<script>` tags
- `<!-- HTML comments -->`

## `display: none` vs `visibility: hidden`

A common source of confusion is the difference between these two properties:

| Property             | In Render Tree? | Occupies Space? | Triggers Layout? | Accessible? |
| -------------------- | --------------- | --------------- | ---------------- | ----------- |
| `display: none`      | No              | No              | No (when hidden) | No          |
| `visibility: hidden` | Yes             | Yes             | Yes              | No          |

### `display: none`

```css
.hidden {
  display: none;
}
```

- **Completely removed** from the render tree
- Takes up no space in the layout
- Descendants are also not rendered
- Changing to `display: block` triggers full layout recalculation

### `visibility: hidden`

```css
.invisible {
  visibility: hidden;
}
```

- **Remains in the render tree**
- Takes up the same space as if visible
- Only the visual representation is hidden
- Changing visibility is cheaper than changing display

---

## Browser Design: Why the Render Tree Exists

The render tree serves as a bridge between the document structure (DOM) and the visual layout. It exists because:

1. **Not all DOM nodes are visual**: `<head>`, `<script>`, `<meta>` don't render
2. **Computed styles are needed**: Layout requires final calculated styles
3. **Layout isolation**: Elements with `display: none` shouldn't affect layout
4. **Performance**: Smaller tree = faster layout calculations

---

## Developer Optimizations

### Minimize Render Tree Size

Smaller render trees mean faster layout calculations:

```html
<!-- Avoid deeply nested structures when possible -->
<div class="wrapper">
  <div class="container">
    <div class="inner">
      <div class="content">
        <p>Content</p>
      </div>
    </div>
  </div>
</div>

<!-- Prefer flatter structures -->
<div class="content">
  <p>Content</p>
</div>
```

### Use `display: none` for Hidden Content

If content won't be shown, use `display: none` to exclude it from layout calculations:

```css
/* Removed from render tree entirely */
.modal.closed {
  display: none;
}

/* Still in render tree, just invisible */
.modal.hidden {
  visibility: hidden;
}
```

Use `visibility: hidden` only when you need to:

- Preserve layout space
- Animate to/from hidden state
- Keep the element accessible to certain assistive technologies

### `content-visibility` for Off-Screen Content

For content below the fold, use `content-visibility: auto` to skip rendering entirely:

```css
.below-fold-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 500px;
}
```

This tells the browser to skip style, layout, and paint for elements outside the viewport, significantly reducing render tree complexity for the initial paint.

---

## References

- [MDN: Critical Rendering Path](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path)
- [web.dev: Understanding the Critical Path](https://web.dev/learn/performance/understanding-the-critical-path)
