# Critical Rendering Path: CSSOM Construction

How browsers parse CSS into the CSS Object Model, and why it must be complete before rendering can begin.

## The Parsing Process

As the browser encounters `<link rel="stylesheet">` or `<style>` tags, it fetches and parses CSS into the CSS Object Model (CSSOM).

```css
body {
  font-size: 16px;
}
p {
  font-weight: bold;
}
span {
  color: red;
}
p span {
  display: none;
}
img {
  float: right;
}
```

<figure>

![CSSOM Construction](./cssom-construction.inline.svg)

<figcaption>CSSOM tree: stylesheets and rules; computed styles are derived by applying it to the DOM</figcaption>

</figure>

## CSSOM Characteristics

- **Tree structure**: CSSOM is a tree of stylesheets and rules (selectors + declarations), not a 1:1 mirror of the DOM
- **Computed styles**: Produced during style calculation by combining DOM + CSSOM; they are not stored inside the CSSOM tree
- **Cascade resolution**: Later rules override earlier ones; specificity determines winners
- **NOT parser-blocking**: HTML parser continues while CSS loads
- **Render-blocking**: Browser won't paint until CSSOM is complete for render-blocking stylesheets
- **JS-blocking**: Scripts using `getComputedStyle()` must wait for CSSOM

---

## Browser Design: Why CSSOM Can’t Be Used Incrementally

Unlike [DOM construction](../crp-dom-construction/README.md), **the browser avoids using a partial CSSOM for rendering**. The CSSOM can be constructed as CSS is parsed, but it isn’t safe to apply until the full stylesheet is known. Consider this CSS:

```css
p {
  background: red;
}
/* ... hundreds of lines later ... */
p {
  background: blue;
}
```

If the browser rendered with a partial CSSOM after parsing the first rule, paragraphs would flash red before turning blue. The cascade—CSS's fundamental feature—requires knowing _all_ rules before determining final computed styles.

### What Would Happen with Partial CSSOM

```css
/* styles.css - loaded in chunks */

/* Chunk 1 arrives first */
h1 {
  color: red;
  font-size: 48px;
}
.hero {
  background: blue;
}

/* User sees: red headings, blue hero */

/* Chunk 2 arrives */
h1 {
  color: green;
} /* Override! */
.hero {
  background: white;
} /* Override! */

/* User sees: jarring flash as colors change */
```

This "Flash of Unstyled Content" (FOUC) or "Flash of Wrong Styles" creates a poor user experience.

### Why Complete CSSOM is Required

Browsers wait for complete CSSOM to ensure:

1. **Correct final styles**: All cascade rules resolved
2. **No layout shifts**: Elements positioned correctly from first paint
3. **Visual stability**: Users see intended design immediately

**The Trade-off**: Waiting for CSS delays First Contentful Paint, but prevents jarring visual changes.

---

## What Changes CSSOM (and What Doesn’t)

- **DOM node changes**: Adding/removing elements changes which nodes get styles, but it does **not** change the CSSOM itself.
- **Stylesheet changes**: Adding/removing `<style>` or `<link rel="stylesheet">`, or editing a stylesheet, **rebuilds or updates the CSSOM**.
- **Inline style changes**: Updating an element’s `style` attribute affects its computed styles, but does **not** change the CSSOM tree of rules.

---

## Developer Optimizations

### Critical CSS Inlining

Inline styles needed for above-the-fold content to eliminate render-blocking request:

```html
<head>
  <style>
    /* Critical CSS for above-the-fold content */
    .header {
      /* ... */
    }
    .hero {
      /* ... */
    }
  </style>
  <link rel="stylesheet" href="full.css" media="print" onload="this.media='all'" />
</head>
```

The inline `<style>` block is parsed immediately (no network request), allowing faster first paint. The external stylesheet loads asynchronously and applies after download.

### Non-Blocking CSS with Media Queries

```html
<!-- Render-blocking: needed for initial render -->
<link rel="stylesheet" href="critical.css" />

<!-- Non-render-blocking: only for print -->
<link rel="stylesheet" href="print.css" media="print" />

<!-- Non-render-blocking: only for large screens -->
<link rel="stylesheet" href="desktop.css" media="(min-width: 1024px)" />
```

CSS with non-matching media queries still downloads but doesn't block rendering. This allows you to defer non-critical styles while still preloading them.

### Split CSS by Route/Component

Instead of one large stylesheet, consider:

```html
<!-- Core styles for all pages -->
<link rel="stylesheet" href="core.css" />

<!-- Route-specific styles -->
<link rel="stylesheet" href="home.css" />
```

This reduces the amount of CSS that must be parsed before first render.

---

## References

- [web.dev: Render-Blocking CSS](https://web.dev/articles/critical-rendering-path/render-blocking-css)
- [MDN: Critical Rendering Path](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path)
- [web.dev: Constructing the Object Model](https://web.dev/articles/critical-rendering-path/constructing-the-object-model)
