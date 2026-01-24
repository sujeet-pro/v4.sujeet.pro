# Critical Rendering Path: Layout Stage

How browsers calculate the exact size and position of every element—the most computationally expensive stage of the rendering pipeline.

## What is Layout?

Layout is where the browser calculates the exact size and position of every element in the [render tree](../crp-render-tree/README.md). This is the most computationally expensive stage because geometry calculations cascade through the tree.

---

## The Box Model

Every element in the render tree generates a box with four distinct areas:

```plain
┌─────────────────────────────────────────┐
│                 MARGIN                  │
│   ┌─────────────────────────────────┐   │
│   │             BORDER              │   │
│   │   ┌─────────────────────────┐   │   │
│   │   │         PADDING         │   │   │
│   │   │   ┌─────────────────┐   │   │   │
│   │   │   │     CONTENT     │   │   │   │
│   │   │   └─────────────────┘   │   │   │
│   │   └─────────────────────────┘   │   │
│   └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

- **Content Box**: Contains actual content (text, images, child elements)
- **Padding Box**: Space between content and border
- **Border Box**: Contains border, padding, and content
- **Margin Box**: External space outside the border—never included in element width calculations

### Box Sizing

The `box-sizing` property determines what the `width` and `height` properties control:

**`box-sizing: content-box`** (default):

```css
.element {
  box-sizing: content-box;
  width: 100px;
  padding: 10px;
  border: 5px solid;
}
/* Content width: 100px */
/* Total rendered width: 5 + 10 + 100 + 10 + 5 = 130px */
```

**`box-sizing: border-box`**:

```css
.element {
  box-sizing: border-box;
  width: 100px;
  padding: 10px;
  border: 5px solid;
}
/* Total rendered width: 100px */
/* Content width: 100 - 5 - 10 - 10 - 5 = 70px */
```

**Why `border-box` is Often Preferred**: When you set `width: 100%`, you typically want the element to fit its container exactly. With `content-box`, adding padding or border causes overflow. With `border-box`, the element stays within bounds.

---

## Block vs Inline Boxes

Elements generate different box types that follow different layout rules:

### Block-Level Boxes

`display: block`, `flex`, `grid`, `table`, etc.:

- Width: 100% of containing block by default
- Height: Intrinsic (determined by content)
- Stack vertically, top to bottom
- Participate in Block Formatting Context (BFC)
- Examples: `<div>`, `<p>`, `<section>`, `<header>`, `<ul>`, `<h1>`-`<h6>`

### Inline-Level Boxes

`display: inline`:

- Flow horizontally, left to right (in LTR languages)
- Wrap to next line when container width exceeded
- **Ignore `width` and `height` properties completely**
- **Ignore vertical margins** (horizontal margins work)
- Padding applies but doesn't affect line height
- Participate in Inline Formatting Context (IFC)
- Examples: `<span>`, `<a>`, `<strong>`, `<em>`, `<img>` (replaced inline)

### Anonymous Boxes

When text exists outside any element, the browser creates anonymous boxes to contain it:

```html
<div>
  <p>Wrapped in paragraph</p>
  This text gets an anonymous block box
</div>
```

---

## Formatting Contexts

Formatting contexts are regions where elements follow specific layout rules. Understanding them explains many "CSS quirks."

### Block Formatting Context (BFC)

A BFC is a mini-layout environment where:

- Block boxes stack vertically
- Margins collapse between adjacent blocks _within the same BFC_
- Floats are contained (don't escape)
- The BFC doesn't overlap with floats

**What Creates a BFC**:

- Root `<html>` element
- Floats (`float: left/right`)
- Absolutely positioned elements (`position: absolute/fixed`)
- `display: inline-block`, `table-cell`, `table-caption`
- `overflow` other than `visible` (e.g., `overflow: hidden`)
- `display: flow-root` (modern, explicit BFC creation)
- Flex/Grid items
- `contain: layout` or `contain: paint`

**Why BFC Matters for Performance**: A BFC isolates layout calculations. Changes inside a BFC don't require recalculating layout outside it, reducing the scope of expensive reflows.

### Inline Formatting Context (IFC)

- Boxes flow horizontally, wrap at container edge
- Vertical alignment via `vertical-align`
- Line boxes contain inline content for each line

### Flex Formatting Context (FFC) and Grid Formatting Context (GFC)

- Created by `display: flex` and `display: grid`
- Children become flex/grid items with special layout rules
- Provide powerful alignment and distribution capabilities

---

## The Containing Block

The containing block determines the reference point for percentage-based sizes and positioning:

- **For `position: static/relative`**: The content box of nearest block-level ancestor
- **For `position: absolute`**: The padding box of nearest ancestor with `position` other than `static` (i.e., `relative`, `absolute`, `fixed`, or `sticky`). If no positioned ancestor exists, the initial containing block (viewport) is used.
- **For `position: fixed`**: Normally the viewport. However, if any ancestor has `transform`, `perspective`, `filter`, `backdrop-filter`, `contain` (layout/paint/strict/content), or `will-change` with transform/filter, that ancestor's padding box becomes the containing block instead.

**Note**: The same properties that affect `position: fixed` (transform, filter, etc.) also create containing blocks for `position: absolute` elements, in addition to positioned ancestors.

---

## Browser Design: Why Layout is Expensive

Layout requires traversing the render tree because:

1. **Parent-child dependencies**: A child's percentage width depends on parent's computed width
2. **Sibling relationships**: Floats and inline elements affect adjacent element positions
3. **Cascade effects**: Changing one element's size can force repositioning of many others
4. **Text reflow**: Font changes or container resizing requires re-wrapping all text

### Layout Triggers

Any change to geometry forces layout recalculation:

- Adding/removing elements
- Changing `width`, `height`, `padding`, `margin`, `border`
- Changing `font-size`, `font-family`
- Changing `position`, `display`, `float`
- Reading layout properties: `offsetWidth`, `offsetHeight`, `getBoundingClientRect()`

---

## Developer Optimizations

### Avoiding Layout Thrashing

Layout thrashing occurs when JavaScript repeatedly forces synchronous layout calculations:

```javascript
// ❌ BAD: Layout thrashing
const elements = document.querySelectorAll(".item")
for (const el of elements) {
  const width = el.offsetWidth // Forces layout
  el.style.width = width * 2 + "px" // Invalidates layout
  // Next iteration forces layout again!
}

// ✅ GOOD: Batch reads, then batch writes
const elements = document.querySelectorAll(".item")
const widths = Array.from(elements).map((el) => el.offsetWidth) // All reads
elements.forEach((el, i) => {
  el.style.width = widths[i] * 2 + "px" // All writes
})
```

### Properties That Force Layout

Reading any of these properties forces the browser to calculate current layout:

**Element Dimensions**:

- `offsetWidth`, `offsetHeight`, `offsetTop`, `offsetLeft`, `offsetParent`
- `clientWidth`, `clientHeight`, `clientTop`, `clientLeft`
- `scrollWidth`, `scrollHeight`, `scrollTop`, `scrollLeft`

**Computed Styles**:

- `getComputedStyle()`
- `getBoundingClientRect()`

**Scroll Operations**:

- `scrollTo()`, `scrollBy()`, `scrollIntoView()`
- `focus()` (if it causes scroll)

**Window**:

- `innerWidth`, `innerHeight`
- `getComputedStyle()`

For a comprehensive list, see [What Forces Layout/Reflow](https://gist.github.com/paulirish/5d52fb081b3570c81e3a).

### Using `requestAnimationFrame` for Batching

```javascript
// ✅ GOOD: Defer layout-triggering work to animation frame
function updateElements(elements) {
  requestAnimationFrame(() => {
    // Batch all reads
    const measurements = elements.map((el) => el.getBoundingClientRect())

    // Batch all writes
    requestAnimationFrame(() => {
      elements.forEach((el, i) => {
        el.style.transform = `translateX(${measurements[i].width}px)`
      })
    })
  })
}
```

### CSS Containment

The `contain` property isolates subtrees from the rest of the document:

```css
.widget {
  contain: layout style paint;
}

/* Or use the shorthand */
.widget {
  contain: strict; /* size + layout + style + paint */
}

/* Or the content value */
.widget {
  contain: content; /* layout + style + paint */
}
```

**Containment Types**:

- `layout`: Element's layout is independent; internal changes don't affect external layout
- `style`: Style scoping—counters and quotes don't escape
- `paint`: Element acts as containing block; contents don't paint outside bounds
- `size`: Element's size is independent of contents (requires explicit sizing)

**Why It Helps Performance**: When the browser knows a subtree is contained, it can skip recalculating layout/style/paint outside that subtree.

### `content-visibility` for Layout Optimization

The `content-visibility` property tells browsers to skip layout for off-screen content:

```css
.below-fold-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 500px; /* Placeholder height */
}
```

**How It Works**:

- `content-visibility: auto`: Render only when near viewport
- Browser skips style, layout, and paint for hidden content
- `contain-intrinsic-size`: Provides placeholder dimensions for scrollbar accuracy

**Performance Impact**: Can reduce initial layout time by 7x for long pages with many sections.

---

## References

- [MDN: Block Formatting Context](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Display/Block_formatting_context)
- [MDN: Introduction to Formatting Contexts](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_display/Introduction_to_formatting_contexts)
- [What Forces Layout/Reflow](https://gist.github.com/paulirish/5d52fb081b3570c81e3a) - Paul Irish's comprehensive list
- [web.dev: content-visibility](https://web.dev/articles/content-visibility)
- [MDN: CSS Containment](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Using)
