---
lastUpdatedOn: 2025-07-19
tags:
  - web-performance
  - caching
  - frontend
  - performance
---

# Image Optimization for Web Performance

Master responsive image techniques, lazy loading, modern formats like WebP and AVIF, and optimization strategies to improve Core Web Vitals and reduce bandwidth usage by up to 70%.


## 1. How `<img>` Selection Attributes Work

### 1.1 `srcset` and Descriptors

The `srcset` attribute provides the browser with multiple image candidates, each with different characteristics. The browser then selects the most appropriate one based on the current context.

**Width descriptors (`w`)**: specify intrinsic pixel widths.
**Pixel-density descriptors (`x`)**: target device-pixel ratios.

```html
<img
  src="small.jpg"
  srcset="small.jpg 400w, medium.jpg 800w, large.jpg 1200w"
  sizes="(max-width:600px) 100vw, 50vw"
  alt="Example"
/>
```

**How the browser selects the final image:**

1. **Calculate display size**: CSS size × device pixel ratio (DPR)
2. **Find candidates**: Look through srcset for images ≥ calculated size
3. **Select smallest**: Pick the smallest candidate that meets the requirement

**Example calculation:**

- CSS width: 400px
- Device pixel ratio: 2x
- Required image width: 400px × 2 = 800px
- Selected image: `medium.jpg` (800w) - smallest ≥ 800px

### 1.2 `sizes` Media Conditions

The `sizes` attribute tells the browser what size the image will be displayed at different viewport widths, enabling intelligent selection from the srcset.

```html
<img
  src="hero.jpg"
  srcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1200.jpg 1200w, hero-1600.jpg 1600w"
  sizes="
    (max-width: 600px) 100vw,
    (max-width: 1200px) 50vw,
    33vw
  "
  alt="Hero image"
/>
```

**How `sizes` works:**

1. **Viewport width**: 400px → Image displays at 100vw (400px) → Selects `hero-400.jpg`
2. **Viewport width**: 800px → Image displays at 50vw (400px) → Selects `hero-400.jpg`
3. **Viewport width**: 1400px → Image displays at 33vw (467px) → Selects `hero-800.jpg`

### 1.3 `<picture>`, `media`, and `type` - Complete Selection Process

The `<picture>` element provides the most sophisticated image selection mechanism, combining art direction, format negotiation, and responsive sizing.

```html
<picture>
  <!-- Art direction: different crop for mobile -->
  <source media="(max-width: 768px)" srcset="hero-mobile-400.jpg 400w, hero-mobile-600.jpg 600w" type="image/jpeg" />

  <!-- Format negotiation: AVIF for supported browsers -->
  <source srcset="hero-800.avif 800w, hero-1200.avif 1200w" type="image/avif" />

  <!-- Format negotiation: WebP fallback -->
  <source srcset="hero-800.webp 800w, hero-1200.webp 1200w" type="image/webp" />

  <!-- Final fallback -->
  <img
    src="hero-800.jpg"
    srcset="hero-800.jpg 800w, hero-1200.jpg 1200w"
    sizes="(max-width: 768px) 100vw, 50vw"
    alt="Hero image"
  />
</picture>
```

**Complete selection algorithm:**

1. **Media query evaluation**: Browser tests each `<source>`'s `media` attribute
2. **Format support check**: Browser tests each `<source>`'s `type` attribute
3. **First match wins**: Selects the first `<source>` where both media and type match
4. **Srcset selection**: Uses the selected source's srcset to pick the best size
5. **Fallback to `<img>`**: If no sources match, uses the `<img>` element

**When fallback is picked:**

- **No media match**: When the viewport doesn't match any `<source>` media conditions
- **No format support**: When the browser doesn't support any `<source>` type
- **No sources**: When there are no `<source>` elements (just `<img>`)

**Example selection scenarios:**

```html
<picture>
  <!-- Scenario 1: Mobile + AVIF support -->
  <source media="(max-width: 768px)" srcset="mobile.avif 400w, mobile-2x.avif 800w" type="image/avif" />

  <!-- Scenario 2: Mobile + no AVIF support -->
  <source media="(max-width: 768px)" srcset="mobile.webp 400w, mobile-2x.webp 800w" type="image/webp" />

  <!-- Scenario 3: Desktop + AVIF support -->
  <source srcset="desktop.avif 800w, desktop-2x.avif 1600w" type="image/avif" />

  <!-- Scenario 4: Desktop + no AVIF support -->
  <source srcset="desktop.webp 800w, desktop-2x.webp 1600w" type="image/webp" />

  <!-- Scenario 5: No format support or older browser -->
  <img src="desktop.jpg" srcset="desktop.jpg 800w, desktop-2x.jpg 1600w" alt="Desktop image" />
</picture>
```

**Selection matrix:**
| Viewport | AVIF Support | WebP Support | Selected Source | Final Image |
|----------|--------------|--------------|-----------------|-------------|
| Mobile | Yes | - | Source 1 | mobile.avif |
| Mobile | No | Yes | Source 2 | mobile.webp |
| Mobile | No | No | `<img>` | mobile.jpg |
| Desktop | Yes | - | Source 3 | desktop.avif |
| Desktop | No | Yes | Source 4 | desktop.webp |
| Desktop | No | No | `<img>` | desktop.jpg |

## 3. Browser Hints: Loading, Decoding, Fetch Priority

| Attribute                 | Purpose                                 | Typical Benefit               |
| ------------------------- | --------------------------------------- | ----------------------------- |
| `loading="lazy"/"eager"`  | Defer offscreen fetch vs. immediate     | ↓ Initial bytes by ~50–100 KB |
| `decoding="async"/"sync"` | Offload decode vs. main-thread blocking | ↑ LCP by up to 20%            |
| `fetchpriority="high"`    | Signal importance to fetch scheduler    | ↑ LCP by 10–25%               |

```html
<!-- Critical above-the-fold image -->
<img src="hero.jpg" loading="eager" decoding="async" fetchpriority="high" alt="Hero Image" />

<!-- Below-the-fold image -->
<img src="gallery.jpg" loading="lazy" decoding="async" fetchpriority="auto" alt="Gallery Image" />
```

## 4. Lazy Loading: Intersection Observer

### 4.1 Using Img Attribute

```html
<img class="lazy" data-src="image-high.jpg" src="image-low.jpg" loading="lazy" alt="Lazy loaded image" />
```

### 4.2 JavaScript Implementation

```js
const io = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return

      const img = target
      img.src = img.dataset.src

      // Decode image asynchronously
      img
        .decode()
        .then(() => {
          img.classList.add("loaded")
        })
        .catch((err) => {
          console.error("Image decode failed:", err)
        })

      obs.unobserve(img)
    })
  },
  {
    rootMargin: "200px", // Start loading 200px before image enters viewport
    threshold: 0.1, // Trigger when 10% of image is visible
  },
)

document.querySelectorAll("img.lazy").forEach((img) => io.observe(img))
```

**Performance Gains:**

- Initial payload ↓ ~75 KB
- LCP on long pages ↓ 15%

## 5. Decoding Control

### 5.1 HTML Hint

```html
<img src="hero.webp" decoding="async" alt="Hero" />
```

### 5.2 Programmatic Decode

```js
async function loadDecoded(url) {
  const img = new Image()
  img.src = url

  try {
    await img.decode()
    document.body.append(img)
  } catch (error) {
    console.error("Failed to decode image:", error)
  }
}

loadDecoded("hero.webp")
```

**Benefit:**

- Eliminates render-blocking jank, improving LCP by up to 20%.

## 6. Fetch Priority

```html
<img src="lcp.jpg" fetchpriority="high" loading="eager" decoding="async" alt="LCP Image" />
```

**Benefit:**

- Pushes true LCP image ahead in HTTP/2 queues—**LCP ↓ 10–25%**.

## 2. Image Format Comparison & Selection

### 2.1 Modern Image Format Comparison

| Format      | Compression Factor vs JPEG | Lossy/Lossless | Color Depth (bits/chan) | HDR & Wide Gamut | Alpha Support | Progressive/Interlace | Best Use Case                | Browser Support | Fallback  |
| ----------- | -------------------------- | -------------- | ----------------------- | ---------------- | ------------- | --------------------- | ---------------------------- | --------------- | --------- |
| **JPEG**    | 1×                         | Lossy          | 8                       | No               | No            | Progressive JPEG      | Photographs, ubiquity        | 100%            | JPEG      |
| **PNG-1.3** | n/a (lossless)             | Lossless       | 1,2,4,8,16              | No               | Yes           | Adam7 interlace       | Graphics, logos, screenshots | 100%            | PNG       |
| **WebP**    | 1.25–1.34× smaller         | Both           | 8, (10 via ICC)         | No               | Yes           | None (in-band frames) | Web delivery of photos & UI  | 96%             | JPEG/PNG  |
| **AVIF**    | 1.5–2× smaller             | Both           | 8,10,12                 | Yes              | Yes           | None                  | Next-gen photos & graphics   | 72%             | WebP/JPEG |
| **JPEG XL** | 1.2–1.5× smaller           | Both           | 8,10,12,16              | Yes              | Yes           | Progressive           | High-quality photos          | 0%              | JPEG      |

### 2.2 Format Selection Strategy

**Photographs (Lossy):**

```html
<picture>
  <source srcset="photo.avif" type="image/avif" />
  <source srcset="photo.webp" type="image/webp" />
  <img src="photo.jpg" alt="Photograph" />
</picture>
```

**Graphics with Transparency:**

```html
<picture>
  <source srcset="logo.avif" type="image/avif" />
  <source srcset="logo.webp" type="image/webp" />
  <img src="logo.png" alt="Logo" />
</picture>
```

**Critical Above-the-fold:**

```html
<picture>
  <source srcset="hero.avif" type="image/avif" />
  <img src="hero.webp" alt="Hero" />
</picture>
```

## 7. Responsive Image Generation

### 7.1 Server-Side Generation

```js
// Node.js with Sharp
const sharp = require("sharp")

async function generateResponsiveImages(inputPath, outputDir) {
  const sizes = [400, 800, 1200, 1600]
  const formats = ["webp", "avif"]

  for (const size of sizes) {
    for (const format of formats) {
      await sharp(inputPath).resize(size).toFormat(format).toFile(`${outputDir}/image-${size}.${format}`)
    }
  }
}
```

### 7.2 Client-Side Generation

```js
// Canvas-based client-side resizing
function resizeImage(file, maxWidth, maxHeight) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      const { width, height } = calculateDimensions(img.width, img.height, maxWidth, maxHeight)

      canvas.width = width
      canvas.height = height

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(resolve, "image/webp", 0.8)
    }

    img.src = URL.createObjectURL(file)
  })
}
```

## 8. Advanced Optimization Techniques

### 8.1 Progressive Enhancement

```html
<picture>
  <!-- High-end devices: AVIF with HDR -->
  <source media="(min-width: 1200px) and (color-gamut: p3)" srcset="hero-hdr.avif" type="image/avif" />

  <!-- Standard devices: WebP -->
  <source srcset="hero.webp" type="image/webp" />

  <!-- Fallback: JPEG -->
  <img src="hero.jpg" alt="Hero image" />
</picture>
```

### 8.2 Network-Aware Loading

```js
class NetworkAwareImageLoader {
  constructor() {
    this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    this.setupOptimization()
  }

  setupOptimization() {
    const images = document.querySelectorAll("img[data-network-aware]")

    images.forEach((img) => {
      const quality = this.getOptimalQuality()
      const format = this.getOptimalFormat()

      img.src = this.updateImageUrl(img.dataset.src, quality, format)
    })
  }

  getOptimalQuality() {
    if (!this.connection) return 80

    const { effectiveType, downlink } = this.connection

    if (effectiveType === "slow-2g" || downlink < 1) return 60
    if (effectiveType === "2g" || downlink < 2) return 70
    if (effectiveType === "3g" || downlink < 5) return 80
    return 90
  }

  getOptimalFormat() {
    if (!this.connection) return "webp"

    const { effectiveType } = this.connection

    if (effectiveType === "slow-2g" || effectiveType === "2g") return "jpeg"
    return "webp"
  }

  updateImageUrl(url, quality, format) {
    const urlObj = new URL(url)
    urlObj.searchParams.set("q", quality.toString())
    urlObj.searchParams.set("f", format)
    return urlObj.toString()
  }
}
```

### 8.3 Preloading Strategies

```html
<!-- Critical above-the-fold images -->
<link rel="preload" as="image" href="hero.avif" type="image/avif" />
<link rel="preload" as="image" href="hero.webp" type="image/webp" />

<!-- LCP image with high priority -->
<link rel="preload" as="image" href="lcp-image.avif" fetchpriority="high" />
```

## 9. Performance Monitoring

### 9.1 Image Loading Metrics

```js
// Monitor image loading performance
const imageObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.initiatorType === "img") {
      console.log(`Image loaded: ${entry.name}`)
      console.log(`Load time: ${entry.responseEnd - entry.startTime}ms`)
      console.log(`Size: ${entry.transferSize} bytes`)
    }
  }
})

imageObserver.observe({ type: "resource" })
```

### 9.2 LCP Tracking

```js
// Track Largest Contentful Paint for images
const lcpObserver = new PerformanceObserver((list) => {
  const entries = list.getEntries()
  const lastEntry = entries[entries.length - 1]

  if (lastEntry.element && lastEntry.element.tagName === "IMG") {
    console.log(`LCP image: ${lastEntry.element.src}`)
    console.log(`LCP time: ${lastEntry.startTime}ms`)
  }
})

lcpObserver.observe({ type: "largest-contentful-paint" })
```

## 10. Implementation Checklist

### 10.1 Format Optimization

- [ ] Convert all images to WebP/AVIF with JPEG/PNG fallbacks
- [ ] Use `<picture>` element for format negotiation
- [ ] Implement progressive enhancement for HDR displays
- [ ] Optimize quality settings based on content type

### 10.2 Responsive Images

- [ ] Generate multiple sizes for each image
- [ ] Use `srcset` with width descriptors
- [ ] Implement `sizes` attribute for accurate selection
- [ ] Test across different viewport sizes and DPRs

### 10.3 Loading Optimization

- [ ] Use `loading="lazy"` for below-the-fold images
- [ ] Implement `decoding="async"` for non-critical images
- [ ] Use `fetchpriority="high"` for LCP images
- [ ] Preload critical above-the-fold images

### 10.4 Performance Monitoring

- [ ] Track image loading times
- [ ] Monitor LCP impact
- [ ] Measure bandwidth savings
- [ ] Test across different network conditions

## 11. Advanced Implementation: Smart Image Optimizer

```js
class SmartImageOptimizer {
  constructor(options = {}) {
    this.options = {
      defaultQuality: 80,
      defaultFormat: "webp",
      enableAVIF: true,
      enableWebP: true,
      lazyLoadThreshold: 200,
      ...options,
    }

    this.networkQuality = this.getNetworkQuality()
    this.userPreference = this.getUserPreference()
    this.setupOptimization()
  }

  getNetworkQuality() {
    if (!navigator.connection) return "unknown"

    const { effectiveType, downlink } = navigator.connection

    if (effectiveType === "slow-2g" || downlink < 1) return "low"
    if (effectiveType === "2g" || downlink < 2) return "medium"
    if (effectiveType === "3g" || downlink < 5) return "medium-high"
    return "high"
  }

  getUserPreference() {
    if (window.matchMedia("(prefers-reduced-data: reduce)").matches) {
      return "data-saver"
    }
    return "normal"
  }

  setupOptimization() {
    this.optimizeExistingImages()
    this.setupLazyLoading()
    this.setupMediaQueryListeners()
  }

  optimizeExistingImages() {
    const images = document.querySelectorAll("img:not([data-optimized])")

    images.forEach((img) => {
      this.optimizeImage(img)
      img.setAttribute("data-optimized", "true")
    })
  }

  optimizeImage(img) {
    const strategy = this.getOptimizationStrategy(img)
    const optimizedSrc = this.generateOptimizedUrl(img.src, strategy)

    if (optimizedSrc !== img.src) {
      img.src = optimizedSrc
    }

    this.applyLoadingAttributes(img, strategy)
  }

  getOptimizationStrategy(img) {
    const isAboveFold = this.isAboveFold(img)
    const isCritical = img.hasAttribute("data-critical")

    if (isAboveFold || isCritical) {
      return "above-fold"
    }

    if (this.userPreference === "data-saver" || this.networkQuality === "low") {
      return "data-saver"
    }

    return this.networkQuality
  }

  generateOptimizedUrl(originalUrl, strategy) {
    const urlObj = new URL(originalUrl)

    switch (strategy) {
      case "above-fold":
        urlObj.searchParams.set("q", "90")
        urlObj.searchParams.set("f", this.options.enableAVIF ? "avif" : "webp")
        break
      case "data-saver":
        urlObj.searchParams.set("q", "60")
        urlObj.searchParams.set("f", "jpeg")
        break
      case "low":
        urlObj.searchParams.set("q", "70")
        urlObj.searchParams.set("f", "jpeg")
        break
      case "medium":
        urlObj.searchParams.set("q", "80")
        urlObj.searchParams.set("f", "webp")
        break
      case "medium-high":
        urlObj.searchParams.set("q", "85")
        urlObj.searchParams.set("f", this.options.enableAVIF ? "avif" : "webp")
        break
      case "high":
        urlObj.searchParams.set("q", "90")
        urlObj.searchParams.set("f", this.options.enableAVIF ? "avif" : "webp")
        break
    }

    return urlObj.toString()
  }

  applyLoadingAttributes(img, strategy) {
    if (strategy === "above-fold") {
      img.loading = "eager"
      img.decoding = "async"
      img.fetchPriority = "high"
    } else {
      img.loading = "lazy"
      img.decoding = "async"
      img.fetchPriority = "auto"
    }
  }

  isAboveFold(element) {
    const rect = element.getBoundingClientRect()
    return rect.top < window.innerHeight && rect.bottom > 0
  }

  setupLazyLoading() {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]')

    if ("IntersectionObserver" in window) {
      const imageObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target
              this.loadImage(img)
              observer.unobserve(img)
            }
          })
        },
        {
          rootMargin: `${this.options.lazyLoadThreshold}px`,
        },
      )

      lazyImages.forEach((img) => imageObserver.observe(img))
    } else {
      // Fallback for older browsers
      lazyImages.forEach((img) => this.loadImage(img))
    }
  }

  loadImage(img) {
    if (img.dataset.src) {
      img.src = img.dataset.src
      img.removeAttribute("data-src")
    }
  }

  setupMediaQueryListeners() {
    // Listen for data saver preference changes
    const dataSaverQuery = window.matchMedia("(prefers-reduced-data: reduce)")
    dataSaverQuery.addEventListener("change", (e) => {
      this.userPreference = e.matches ? "data-saver" : "normal"
      this.setupOptimization()
    })

    // Listen for reduced motion preference changes
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    reducedMotionQuery.addEventListener("change", (e) => {
      if (e.matches) {
        this.userPreference = "data-saver"
        this.setupOptimization()
      }
    })

    // Listen for color scheme changes
    const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)")
    colorSchemeQuery.addEventListener("change", (e) => {
      this.setupOptimization()
    })

    // Listen for connection changes
    if (navigator.connection) {
      navigator.connection.addEventListener("change", () => {
        this.networkQuality = this.getNetworkQuality()
        this.setupOptimization()
      })
    }
  }
}
```

**CSS for Progressive Enhancement:**

```css
.hero-image-container {
  position: relative;
  width: 100%;
  height: auto;
  overflow: hidden;
}

.hero-image-container img {
  width: 100%;
  height: auto;
  display: block;
  transition: opacity 0.3s ease;
}

/* Loading states */
.hero-image-container img:not([src]) {
  opacity: 0;
}

.hero-image-container img[src] {
  opacity: 1;
}

/* Optimization strategy indicators */
.smart-optimized-data-saver {
  filter: contrast(0.9) saturate(0.8);
}

.smart-optimized-network-conservative {
  filter: contrast(0.85) saturate(0.7);
}

.smart-optimized-network-optimistic {
  filter: contrast(1.05) saturate(1.1);
}

.smart-optimized-above-fold {
  /* No filter - optimal quality */
}

/* Network quality indicators */
.network-low {
  filter: contrast(0.8) saturate(0.6);
}

.network-medium {
  filter: contrast(0.9) saturate(0.8);
}

.network-medium-high {
  filter: contrast(1) saturate(0.9);
}

.network-high {
  filter: contrast(1.05) saturate(1);
}

/* Responsive adjustments */
@media (max-width: 767px) {
  .hero-image-container {
    aspect-ratio: 16/9; /* Mobile aspect ratio */
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .hero-image-container {
    aspect-ratio: 21/9; /* Tablet aspect ratio */
  }
}

@media (min-width: 1200px) {
  .hero-image-container {
    aspect-ratio: 2/1; /* Desktop aspect ratio */
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .hero-image-container img {
    filter: brightness(0.9) contrast(1.1);
  }
}

/* Reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .hero-image-container img {
    transition: none;
  }
}
```

**Performance Benefits Summary:**

| Optimization Feature    | Performance Impact                | Implementation Complexity | Browser Support |
| ----------------------- | --------------------------------- | ------------------------- | --------------- |
| **Responsive Sizing**   | 30-60% bandwidth savings          | Medium                    | 95%+            |
| **Format Optimization** | 25-70% file size reduction        | Medium                    | 72-96%          |
| **Data Saver Mode**     | 40-60% data usage reduction       | Medium                    | 85%+            |
| **Network Awareness**   | 20-40% loading speed improvement  | High                      | 75%+            |
| **Dark Mode Support**   | Contextual optimization           | Low                       | 95%+            |
| **High DPI Support**    | Quality-appropriate delivery      | Medium                    | 95%+            |
| **Progressive Loading** | Perceived performance improvement | Medium                    | 90%+            |

**Total Performance Improvement:**

- **LCP**: 40-60% faster
- **Bandwidth**: 50-80% reduction
- **User Experience**: Context-aware optimization
- **Accessibility**: Respects user preferences
- **Compatibility**: Graceful degradation for older browsers
