# Critical Rendering Path: Rasterization

How the compositor thread turns display lists into actual GPU textures—and why layers enable smooth animations.

## From Display Lists to Pixels

After [paint](../crp-paint-stage/README.md), the compositor thread takes over to convert display lists into actual pixels.

---

## Layerization

The compositor decides how to split display lists into **composited layers** (graphics layers):

### Tiling

Large layers are broken into tiles:

- ~256×256px for software raster
- Approximately viewport-width × ¼ viewport-height for GPU raster

### Prioritization

Tiles near the viewport are rasterized first, enabling:

- Faster time to first visual
- Progressive rendering of large pages
- Efficient memory usage

### Graphics Layers

Some elements are promoted to GPU-accelerated graphics layers for better performance.

**What Promotes to Graphics Layer**:

- 3D transforms (`translate3d`, `rotate3d`, `perspective`)
- `<video>`, `<canvas>`, `<iframe>`
- `position: fixed` (in some browsers)
- `will-change: transform` or `will-change: opacity`
- Animating `transform` or `opacity`
- Overlapping another compositor layer

---

## Rasterization

Rasterization **executes** the display list commands to produce actual pixels:

- **GPU raster** (default in modern Chrome): Display list commands execute on the GPU, producing textures
- **Software raster**: CPU fills in pixels into bitmaps (fallback)
- **Output**: GPU texture tiles containing actual pixel data

This is where pixels are actually created—everything before this was preparation and recording.

---

## Browser Design: Why Graphics Layers Enable 60fps

Graphics layers are the key to smooth animations. Here's why:

### The Problem Without Layers

When you animate an element's position using `left` or `top`:

1. Browser recalculates styles
2. Browser recalculates layout (expensive!)
3. Browser repaints affected areas
4. Browser re-rasterizes
5. Browser composites

All of this happens on the **main thread**, competing with JavaScript.

### The Solution With Compositor Layers

When you animate using `transform`:

1. Compositor applies new transform to cached GPU texture
2. Compositor sends frame to GPU

No main thread involvement! The animation runs at 60fps even during heavy JavaScript execution.

### The Cost of Layers

Each graphics layer consumes GPU memory. A 1000×1000 pixel layer at 4 bytes per pixel = 4MB.

Layer explosion (too many layers) can cause:

- Memory pressure, especially on mobile
- Increased rasterization time
- Texture upload delays

---

## Developer Optimizations

### Compositor-Only Animations

For smooth 60fps animations, use properties the compositor can handle without main thread involvement:

**Compositor-Only Properties**:

- `transform` (translate, rotate, scale, skew)
- `opacity`

```css
/* ❌ BAD: Triggers layout + paint + composite */
.animate-bad {
  transition:
    left 0.3s,
    top 0.3s,
    width 0.3s;
}
.animate-bad:hover {
  left: 100px;
  top: 50px;
  width: 200px;
}

/* ✅ GOOD: Compositor-only, 60fps */
.animate-good {
  transition:
    transform 0.3s,
    opacity 0.3s;
}
.animate-good:hover {
  transform: translate(100px, 50px) scale(1.5);
  opacity: 0.8;
}
```

### Using `will-change` Judiciously

```css
/* Hint to browser: this element will animate */
.will-animate {
  will-change: transform;
}

/* Remove after animation to free GPU memory */
.animation-complete {
  will-change: auto;
}
```

**Best Practices for `will-change`**:

- Apply just before animation starts, remove after
- Don't apply to too many elements (memory cost)
- Don't use `will-change: all` (creates too many layers)
- Consider applying via JavaScript when animation is imminent

```javascript
element.addEventListener("mouseenter", () => {
  element.style.willChange = "transform"
})

element.addEventListener("animationend", () => {
  element.style.willChange = "auto"
})
```

### Monitor Layer Count

Use Chrome DevTools Layers panel to monitor:

1. Open DevTools → More tools → Layers
2. Check **Layer count**: Watch for layer explosion
3. Check **Memory estimate**: See GPU memory per layer
4. Check **Compositing reasons**: Understand why each layer was created

---

## References

- [Chromium: GPU Accelerated Compositing](https://www.chromium.org/developers/design-documents/gpu-accelerated-compositing-in-chrome/)
- [Chromium: How cc Works](https://chromium.googlesource.com/chromium/src/+/master/docs/how_cc_works.md)
- [web.dev: Rendering Performance](https://web.dev/articles/rendering-performance)
