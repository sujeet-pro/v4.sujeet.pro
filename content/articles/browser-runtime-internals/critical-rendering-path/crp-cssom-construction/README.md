# Critical Rendering Path: CSSOM Construction

The **CSS Object Model (CSSOM)** is the engine's internal representation of all CSS rules and their relationships. Unlike the Document Object Model (DOM), which can be processed incrementally, the CSSOM requires a complete parse of all render-blocking stylesheets to resolve the cascade and avoid visual artifacts like Flash of Unstyled Content (FOUC).

<figure>

![CSSOM Construction](./cssom-construction.inline.svg)

<figcaption>CSSOM tree: stylesheets and rules; computed styles are derived by applying it to the DOM</figcaption>

</figure>

## TLDR

### Core Mechanics

- **Render-Blocking**: Browsers halt the rendering pipeline until the CSSOM is fully constructed for all non-async stylesheets.
- **JS-Blocking**: Synchronous JavaScript (JS) execution is delayed if there is a pending stylesheet, as the engine cannot guarantee correct `getComputedStyle()` results.
- **Cascade Resolution**: The CSSOM must be complete before style recalculation because later rules can override earlier ones via the cascade and specificity.

### Key Constraints

- **Not Incremental**: While the DOM can be rendered partially, the CSSOM cannot be safely applied until the "End of Stylesheet" is reached.
- **Tree Structure**: It represents the hierarchy of rules (selectors + declarations), which is distinct from the DOM tree.

---

## The Parsing Process

As the browser encounters `<link rel="stylesheet">` or `<style>` tags, it fetches and parses CSS into the CSS Object Model. This process involves tokenizing the CSS bytes into characters, then into tokens (nodes), and finally into the tree structure.

> "The CSS Object Model is a set of APIs allowing the manipulation of CSS from JavaScript." — [W3C CSSOM Spec](https://www.w3.org/TR/cssom-1/#introduction)

```css collapse={7-15}
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

The resulting CSSOM tree allows the browser to perform efficient lookups during the [Style Recalculation](../crp-style-recalculation/README.md) phase, where it maps these rules to the DOM nodes.

---

## Browser Design: Why CSSOM Can’t Be Used Incrementally

The design choice to make CSS render-blocking is a trade-off favoring visual stability over initial latency. Unlike [DOM construction](../crp-dom-construction/README.md), **the browser avoids using a partial CSSOM for rendering**.

Consider the following scenario:

```css
p {
  background: red;
}
/* ... hundreds of lines of other styles ... */
p {
  background: blue;
}
```

If the browser applied styles incrementally, the user would see a paragraph flash red before turning blue as the second rule arrives. This Flash of Unstyled Content (or "Flash of Wrong Styles") is avoided by the browser's requirement for a "complete" CSSOM before the first paint.

### Why Complete CSSOM is Required

1.  **The Cascade**: CSS stands for _Cascading_ Style Sheets. The final value of a property depends on all rules that apply to an element.
2.  **Specificity Resolution**: A more specific selector later in the file (or in a later file) can override a more general one.
3.  **Layout Stability**: Many CSS properties (like `display`, `float`, or `position`) fundamentally change the geometry of the page. Rendering with partial CSS would cause massive, jarring layout shifts.

---

## Interaction with JavaScript

The CSSOM has a profound impact on JavaScript execution. Because scripts can query the CSSOM (e.g., via `window.getComputedStyle(el)`), the browser enforces a strict synchronization rule:

**The browser blocks execution of any synchronous script while there is a stylesheet being downloaded or parsed.**

This ensures that any style information the script requests is accurate and up-to-date. This is why placing a large external CSS file before a script in the `<head>` can significantly delay the script's execution.

---

## Developer Optimizations

### Critical CSS Inlining

To bypass the render-blocking nature of external stylesheets for the initial view, "Critical CSS" is inlined directly into the HTML:

```html collapse={1,9}
<head>
  <style>
    /* Critical CSS for above-the-fold content */
    .header {
      height: 60px;
    }
    .hero {
      background: #f4f4f4;
    }
  </style>
  <!-- Load the rest of the CSS non-blockingly -->
  <link rel="stylesheet" href="full.css" media="print" onload="this.media='all'" />
</head>
```

### Media Queries for Deferral

Not all CSS is required for the initial render. By using media queries, you can inform the browser that certain stylesheets should not block rendering:

```html
<!-- Render-blocking: needed for initial render -->
<link rel="stylesheet" href="main.css" />

<!-- Non-render-blocking on screen: only for print -->
<link rel="stylesheet" href="print.css" media="print" />

<!-- Non-render-blocking on mobile: only for large screens -->
<link rel="stylesheet" href="desktop.css" media="(min-width: 1024px)" />
```

---

## Conclusion

The CSSOM construction is a mandatory gate in the Critical Rendering Path. While it introduces a blocking point, it guarantees that the first frame the user sees is visually consistent and respects the rules of the CSS cascade. Optimizing the CSSOM involves minimizing the volume of render-blocking CSS and using modern loading patterns to defer non-essential styles.

---

## Appendix

### Prerequisites

- Understanding of the **Critical Rendering Path (CRP)**.
- Familiarity with the **DOM (Document Object Model)** construction.
- Basic knowledge of **CSS Specificity and the Cascade**.

### Terminology

- **CSSOM**: CSS Object Model, the tree of rules and styles.
- **DOM**: Document Object Model, the tree representation of the HTML structure.
- **FOUC**: Flash of Unstyled Content, a visual glitch where content appears without styles.
- **Render-Blocking**: A resource that prevents the browser from painting pixels to the screen.
- **Cascade**: The algorithm that determines which CSS rules apply when multiple rules match an element.

### Summary

- CSS is **render-blocking** by design to ensure visual consistency and avoid FOUC.
- CSSOM construction must be **complete** before the browser can proceed to style calculation and layout.
- The browser **blocks JS execution** if there are pending stylesheets to ensure `getComputedStyle()` returns correct values.
- Optimization techniques like **Critical CSS** and **Media Queries** can reduce the time spent in the CSSOM construction phase.

### References

- [W3C: CSS Object Model (CSSOM) Specification](https://www.w3.org/TR/cssom-1/)
- [W3C: CSS Cascading and Inheritance Level 4](https://www.w3.org/TR/css-cascade-4/)
- [web.dev: Constructing the Object Model](https://web.dev/articles/critical-rendering-path/constructing-the-object-model)
- [MDN: Critical Rendering Path](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path)
