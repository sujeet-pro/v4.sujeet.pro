# Critical Rendering Path: Paint Stage

How browsers record drawing instructions into display lists after layout—and how render layers organize content for efficient painting.

## What is Paint?

With geometry calculated in [layout](../crp-layout-stage/README.md), the browser **records** drawing instructions into a **display list**:

- **Paint records**: Instructions like "draw rectangle at (x,y) with color #fff"
- **Paint order**: Background → border → content → outline (per stacking context)
- **Output**: Display lists (not pixels yet!)—these are vector instructions describing _what_ to draw

**Important distinction**: Paint does NOT produce pixels. It produces a list of drawing commands that will be executed later during [rasterization](../crp-rasterization/README.md).

---

## Render Layers (Paint Layers)

The browser organizes content into render layers before painting:

- **Purpose**: Manage stacking context, z-ordering, and determine what needs separate display lists
- **Created by**: Root element, positioned elements with z-index, opacity < 1, CSS filters, transforms, `will-change`

### What Creates a Render Layer

- Root element
- `position: relative/absolute/fixed` with `z-index` other than `auto`
- `opacity` less than 1
- CSS `filter`, `mask`, `clip-path`
- `transform` other than `none`
- `will-change` with compositing properties

---

## Browser Design: Why Paint Creates Display Lists

Paint creates display lists instead of pixels directly for several reasons:

1. **Reusability**: Display lists can be re-rasterized at different resolutions (zoom, HiDPI)
2. **GPU acceleration**: Display lists can be sent to GPU for efficient rasterization
3. **Partial updates**: Only changed display lists need re-rasterization
4. **Parallelization**: Multiple display lists can be rasterized in parallel

### Display List Commands

A display list contains low-level drawing commands:

```
DrawRect(x: 0, y: 0, width: 100, height: 50, color: #ffffff)
DrawBorder(x: 0, y: 0, width: 100, height: 50, style: solid, color: #000000)
DrawText(x: 10, y: 25, text: "Hello", font: Arial 16px, color: #333333)
DrawImage(x: 50, y: 10, src: image.png, width: 40, height: 30)
```

These commands are later executed by the rasterizer to produce actual pixels.

---

## Developer Optimizations

### Minimize Paint Complexity

Complex paint operations are expensive. Avoid:

```css
/* Expensive: complex shadows and gradients */
.expensive {
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 10px 20px rgba(0, 0, 0, 0.15),
    inset 0 2px 4px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, rgba(255, 0, 0, 0.5) 0%, rgba(0, 255, 0, 0.5) 50%, rgba(0, 0, 255, 0.5) 100%);
  filter: blur(5px);
}
```

### Promote Animated Elements to Their Own Layer

Elements that animate frequently should get their own compositor layer:

```css
.animated-element {
  will-change: transform;
}
```

This isolates the element's paint operations from the rest of the page. See the [rasterize](../crp-rasterization/README.md) article for more on compositor layers.

### Reduce Paint Area

When possible, contain paint to smaller regions:

```css
.widget {
  contain: paint;
}
```

This tells the browser that nothing inside `.widget` will paint outside its bounds, allowing more efficient paint invalidation.

### Debug with DevTools Paint Flashing

Enable "Paint flashing" in Chrome DevTools to see which areas are being repainted:

1. Open DevTools (F12)
2. Press Cmd/Ctrl + Shift + P to open Command Palette
3. Type "Show paint flashing" and enable it

Green rectangles show areas being repainted. Large or frequent flashing indicates optimization opportunities.

---

## References

- [web.dev: Rendering Performance](https://web.dev/articles/rendering-performance)
- [Chrome DevTools: RenderingNG Architecture](https://developer.chrome.com/docs/chromium/renderingng-architecture)
- [Chromium: How cc Works](https://chromium.googlesource.com/chromium/src/+/master/docs/how_cc_works.md)
