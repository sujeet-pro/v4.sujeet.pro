---
lastUpdatedOn: 2025-07-14
tags:
  - js
  - html
  - css
  - web-performance
  - performance
  - ssg
  - ssr
featuredRank: 1
---

# Critical Rendering Path: A Modern, Comprehensive Guide

Understanding the Critical Rendering Path (CRP) is essential for web performance optimization. This guide synthesizes foundational concepts with modern browser architecture, advanced bottlenecks, and actionable optimization strategies.

## Table of Contents

## Introduction: Why CRP Matters

The Critical Rendering Path (CRP) is the sequence of steps browsers execute to convert HTML, CSS, and JavaScript into the pixels users see. A deep understanding of this path is non-negotiable for web performance. Modern browsers are not simple, linear engines—they are multi-threaded, speculative, and highly optimized. Optimizing CRP means understanding both the theory and the practical bottlenecks that affect real-world sites.

| Metric                          | What CRP Stage Influences It Most    | Typical Bottleneck                     | Optimization Lever                                          |
| ------------------------------- | ------------------------------------ | -------------------------------------- | ----------------------------------------------------------- |
| First Contentful Paint (FCP)    | HTML → DOM, CSS → CSSOM              | Render-blocking CSS                    | Inline critical CSS, media/print, preload                   |
| Largest Contentful Paint (LCP)  | Layout → Paint                       | Heavy hero images, slow resource fetch | Optimized images, priority hints, server push               |
| Interaction to Next Paint (INP) | Style-Calc, Layout, Paint, Composite | Long tasks, forced reflows             | Break tasks, eliminate layout thrash                        |
| Frame Budget (≈16 ms)           | Style → Layout → Paint → Composite   | Expensive paints, too many layers      | GPU-friendly properties (transform, opacity), layer budgets |

## The Six-Stage Rendering Pipeline

The modern CRP is best understood as a six-stage pipeline. Each stage is critical for understanding performance bottlenecks and optimization opportunities.

### 1. DOM Construction (Parsing HTML)

The browser begins by parsing the raw HTML bytes it receives from the network. This process involves:

- **Conversion**: Translating bytes into characters using the specified encoding (e.g., UTF-8).
- **Tokenizing**: Breaking the character stream into tokens (e.g., `<html>`, `<body>`, text nodes) as per the HTML5 standard.
- **Lexing**: Converting tokens into nodes with properties and rules.
- **DOM Tree Construction**: Linking nodes into a tree structure that represents the document's structure and parent-child relationships.

**Incremental Parsing:** The browser does not wait for the entire HTML document to download before starting to build the DOM. It parses and builds incrementally, which allows it to discover resources (like CSS and JS) early and start fetching them sooner.

```html
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link href="style.css" rel="stylesheet" />
    <title>Critical Path</title>
  </head>
  <body>
    <p>Hello <span>web performance</span> students!</p>
    <div><img src="awesome-photo.jpg" /></div>
  </body>
</html>
```

![DOM Construction Example](./2023-08-10-critical-rendering-path/dom-construction-example.invert.png)

### 2. CSSOM Construction (Parsing CSS)

As the browser encounters `<link rel="stylesheet">` or `<style>` tags, it fetches and parses CSS into the CSS Object Model (CSSOM):

- **CSSOM**: A tree of all CSS selectors and their computed properties.
- **Cascading**: Later CSS rules can override earlier ones, so the browser must have the complete picture before rendering.
- **NOT Parser-Blocking**: CSS is not parser-blocking—the HTML parser continues to process the document while CSS is being fetched.
- **Render-Blocking**: CSS is render-blocking by default. The browser must download and parse all CSS before it can safely render any content. This prevents Flash of Unstyled Content (FOUC) and ensures correct cascading.
- **JS-Blocking**: If a `<script>` tag is encountered that needs to access computed styles (e.g., via `getComputedStyle()`), the browser must wait for all CSS to be loaded and parsed before executing that script. This is because the script may depend on the final computed styles, which are only available after the CSSOM is complete.

**Example**: If a script tries to read an element's color or size, the browser must ensure all CSS is applied before running the script, otherwise the script could get incorrect or incomplete style information.

**Summary**: CSS blocks rendering and can block JS execution, but does not block the HTML parser itself.

**Sample CSS:**

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

![CSSOM Construction](./2023-08-10-critical-rendering-path/cssom-construction.inline.svg)

**Non-Render-Blocking CSS:**

- Use the `media` attribute (e.g., `media="print"`) to load non-critical CSS without blocking rendering.
- Chrome 105+ supports `blocking=render` for explicit control.

---

### JavaScript Loading Modes: async, defer, and module

JavaScript can be loaded in several modes, each affecting how and when scripts are executed relative to HTML parsing and CSS loading.

#### 1. Parser-Blocking (Default)

- `<script src="main.js"></script>`
- **Blocks the HTML parser** until the script is downloaded and executed.
- **Order is preserved** for multiple scripts.
- **JS execution is also blocked on CSS** if the script may access computed styles (see above).

#### 2. Async

- `<script src="main.js" async></script>`
- **Does not block the HTML parser**; script is fetched in parallel.
- **Executes as soon as it is downloaded**, possibly before or after DOM is parsed.
- **Order is NOT preserved** for multiple async scripts.
- **Still blocked on CSS** if the script accesses computed styles.

#### 3. Defer

- `<script src="main.js" defer></script>`
- **Does not block the HTML parser**; script is fetched in parallel.
- **Executes after the DOM is fully parsed**, in the order they appear in the document.
- **Still blocked on CSS** if the script accesses computed styles.

#### 4. Module

- `<script type="module" src="main.js"></script>`
- **Deferred by default** (like `defer`).
- **Supports import/export syntax** and top-level await.
- **Executed after the DOM is parsed** and after all dependencies are loaded.
- **Order is not guaranteed** for multiple modules unless imported explicitly.

![Async, Defer, Module Diagram](./2023-08-10-critical-rendering-path/asyncdefer.inline.svg)

| Script Mode | Blocks Parser | Order Preserved | Executes After DOM | Blocks on CSS   | Notes                          |
| ----------- | ------------- | --------------- | ------------------ | --------------- | ------------------------------ |
| Default     | Yes           | Yes             | No                 | Yes (if needed) | Inline or external             |
| Async       | No            | No              | No                 | Yes (if needed) | Fastest, unordered             |
| Defer       | No            | Yes             | Yes                | Yes (if needed) | Best for scripts that need DOM |
| Module      | No            | No              | Yes                | Yes (if needed) | Supports imports               |

**Summary:**

- Use `defer` for scripts that depend on the DOM and should execute in order.
- Use `async` for independent scripts (e.g., analytics) that do not depend on DOM or other scripts.
- Use `type="module"` for modern, modular JavaScript.

---

### 3. Render Tree Construction

With the DOM and CSSOM ready, the browser combines them to create the Render Tree:

- **Render Tree**: Contains only visible nodes and their computed styles.
- **Excludes**: Non-visual nodes (like `<head>`, `<script>`, `<meta>`) and nodes with `display: none`.
- **Difference**: `display: none` removes nodes from the render tree; `visibility: hidden` keeps them in the tree but makes them invisible (they still occupy space).

![Render Tree](./2023-08-10-critical-rendering-path/render-tree.invert.png)

### 4. Layout (Reflow)

The browser walks the Render Tree to calculate the exact size and position of each node:

- **Box Model**: Determines width, height, and coordinates for every element.
- **Triggers**: Any change affecting geometry (e.g., resizing, changing font size, adding/removing elements) can trigger a reflow.
- **Performance**: Layout is expensive, especially if triggered repeatedly (see Layout Thrashing below).

### 5. Paint (Rasterization)

With geometry calculated, the browser fills in the pixels for each node:

- **Painting**: Drawing text, colors, images, borders, etc., onto layers in memory.
- **Optimization**: Modern browsers only repaint invalidated regions, not the entire screen.
- **Output**: Bitmaps/textures representing different parts of the page.

### 6. Compositing (Layers)

Modern browsers paint certain elements onto separate layers, which are then composited together:

- **Compositor Thread**: Separate from the main thread, handles assembling layers into the final image.
- **Triggers for Layers**: CSS properties like `transform`, `opacity`, `will-change`, 3D transforms, `<video>`, `<canvas>`, `position: fixed/sticky`, and CSS filters.
- **Performance**: Animations using only `transform` and `opacity` can be handled entirely by the compositor, skipping layout and paint for smooth 60fps animations.

---

## Parallelism: The Preload Scanner

Modern browsers employ a preload scanner—a speculative, parallel HTML parser that discovers and fetches resources (images, scripts, styles) even while the main parser is blocked. This optimization is only effective if resources are declared in the initial HTML. Anti-patterns that defeat the preload scanner include:

- Loading critical images via CSS `background-image` (use `<img>` with `src` instead).
- Dynamically injecting scripts with JavaScript.
- Fully client-side rendered markup (SPAs without SSR/SSG).
- Incorrect lazy-loading of above-the-fold images.
- Excessive inlining of large resources.

**Best Practice:** Declare all critical resources in the initial HTML. Use SSR/SSG for critical content, and `<img>` for important images.

---

Now that we understand the Critical Rendering Path, let's explore comprehensive optimization techniques organized by resource type and impact area.

## CSS Optimization

#### Critical CSS Inlining

Inline the CSS required for above-the-fold content directly in the `<head>` to eliminate render-blocking requests:

```html
<head>
  <style>
    /* Critical above-the-fold styles */
    .hero {
      width: 100%;
      height: 400px;
    }
    .header {
      position: fixed;
      top: 0;
    }
  </style>
  <link rel="stylesheet" href="non-critical.css" media="print" onload="this.media='all'" />
</head>
```

#### CSS Minification and Compression

- Minify CSS to reduce file size by removing whitespace and comments.
- Enable gzip/Brotli compression on your server.
- Use tools like `cssnano` or `clean-css` for automated minification.

#### CSS Splitting and Code Splitting

Split CSS into critical and non-critical chunks:

```css
/* critical.css - Above-the-fold styles */
.hero,
.header,
.nav {
  /* critical styles */
}

/* non-critical.css - Below-the-fold styles */
.footer,
.sidebar {
  /* non-critical styles */
}
```

#### CSS Containment

Use CSS containment to isolate layout, style, and paint operations:

```css
.widget {
  contain: layout style paint; /* Isolates rendering */
}

.isolated-component {
  contain: strict; /* All containment types */
}
```

#### Content Visibility

Skip rendering work for off-screen content:

```css
.long-article-section {
  content-visibility: auto;
  contain-intrinsic-size: 1500px; /* Placeholder height */
}
```

#### Will-change Property

Optimize animations by hinting which properties will change:

```css
.animated-element {
  will-change: transform, opacity; /* Hint to browser */
}
```

**Note:** Use `will-change` sparingly as it can create compositor layers and consume memory.

## JavaScript Optimization

#### Code Splitting and Lazy Loading

Split large JavaScript bundles into smaller chunks loaded on demand:

```js
// Dynamic import for code splitting
const loadAnalytics = () => import("./analytics.js")

// Lazy load when needed
if (userInteracts) {
  loadAnalytics().then((module) => module.init())
}
```

#### Tree Shaking

Remove unused code during bundling (works best with ES modules):

```js
// Only used functions are included in the bundle
import { usedFunction } from "./utils.js"
// unusedFunction is eliminated from the final bundle
```

#### Module Bundling Optimization

- Use modern bundlers (Webpack, Vite, Rollup) with tree shaking.
- Implement vendor chunking to separate third-party libraries.
- Use dynamic imports for route-based code splitting.

#### Layout Thrashing Prevention

Batch DOM reads and writes to avoid forced synchronous reflows:

```js
// Anti-pattern: Causes layout thrashing
const elements = document.querySelectorAll(".box")
for (let i = 0; i < elements.length; i++) {
  const newWidth = elements[i].offsetWidth // READ
  elements[i].style.width = newWidth / 2 + "px" // WRITE
}

// Solution: Batch reads, then writes
const elements = document.querySelectorAll(".box")
const widths = []
for (let i = 0; i < elements.length; i++) {
  widths.push(elements[i].offsetWidth)
}
for (let i = 0; i < elements.length; i++) {
  elements[i].style.width = widths[i] / 2 + "px"
}
```

#### Intersection Observer

Implement efficient lazy loading and infinite scrolling:

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.src = entry.target.dataset.src
      observer.unobserve(entry.target)
    }
  })
})

document.querySelectorAll("img[data-src]").forEach((img) => {
  observer.observe(img)
})
```

#### Service Workers

Implement advanced caching strategies:

```js
// Cache-first strategy for static assets
self.addEventListener("fetch", (event) => {
  if (event.request.destination === "image") {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request)
      }),
    )
  }
})
```

## Image Optimization

#### Modern Image Formats

Use WebP, AVIF, or JPEG XL for better compression:

```html
<picture>
  <source srcset="image.avif" type="image/avif" />
  <source srcset="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Description" />
</picture>
```

#### Responsive Images

Provide appropriate image sizes for different viewports:

```html
<img
  src="hero.jpg"
  srcset="hero-300.jpg 300w, hero-600.jpg 600w, hero-900.jpg 900w"
  sizes="(max-width: 600px) 300px, (max-width: 900px) 600px, 900px"
  alt="Hero image"
/>
```

#### Lazy Loading

Use native lazy loading for below-the-fold images:

```html
<img src="image.jpg" loading="lazy" alt="Lazy loaded image" />
```

#### Image Compression

- Use tools like ImageOptim, TinyPNG, or Squoosh for compression.
- Implement progressive JPEG loading for better perceived performance.
- Consider using WebP with fallbacks for broader browser support.

#### Image Preloading

Preload critical above-the-fold images:

```html
<link rel="preload" as="image" href="hero-image.jpg" />
```

## Font Optimization

#### Font Display

Control how fonts are displayed during loading:

```css
@font-face {
  font-family: "MyFont";
  src: url("font.woff2") format("woff2");
  font-display: swap; /* Show fallback immediately, swap when loaded */
}
```

#### Font Preloading

Preload critical fonts to avoid layout shifts:

```html
<link rel="preload" href="/fonts/critical-font.woff2" as="font" type="font/woff2" crossorigin />
```

#### Font Subsetting

Include only the characters you need to reduce file size:

```css
@font-face {
  font-family: "MyFont";
  src: url("font-subset.woff2") format("woff2");
  unicode-range:
    U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191,
    U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

#### Font Loading API

Control font loading programmatically:

```js
if ("fonts" in document) {
  document.fonts.load("1em MyFont").then(() => {
    // Font is loaded and ready
  })
}
```

## Resource Loading Optimization

#### Resource Hints

Use resource hints to optimize loading:

```html
<!-- Establish early connections -->
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="dns-prefetch" href="https://www.google-analytics.com" />

<!-- Preload critical resources -->
<link rel="preload" href="/fonts/critical.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/css/critical.css" as="style" />
<link rel="preload" href="/js/critical.js" as="script" />

<!-- Prefetch likely future resources -->
<link rel="prefetch" href="/dashboard.css" as="style" />
```

#### Priority Hints

Control resource loading priority:

```html
<link rel="preload" href="critical.js" as="script" fetchpriority="high" />
<img src="hero.jpg" fetchpriority="high" alt="Hero" />
<img src="below-fold.jpg" fetchpriority="low" alt="Below fold" />
```

#### Resource Compression and Caching

**Compression:**

- Enable gzip/Brotli compression on your server.
- Use appropriate compression levels for different content types.

**Caching Strategies:**

- Set appropriate `Cache-Control` headers for different resource types.
- Use versioning or content hashing for cache busting.
- Implement service workers for advanced caching strategies.

## Advanced Optimization Techniques

#### Server-Side Rendering (SSR) and Static Site Generation (SSG)

**SSR Benefits:**

- Faster First Contentful Paint (FCP)
- Better SEO
- Improved Core Web Vitals
- Critical content available immediately

**SSG Benefits:**

- Pre-rendered pages at build time
- Excellent performance
- Reduced server load
- Perfect for content-heavy sites

**Implementation Examples:**

```js
// Next.js SSR example
export async function getServerSideProps() {
  const data = await fetchData()
  return { props: { data } }
}

// Astro SSG example
export async function getStaticProps() {
  const posts = await getPosts()
  return { props: { posts } }
}
```

#### CDN Optimization

**Edge Caching:**

- Distribute content globally
- Reduce latency for users worldwide
- Implement cache warming strategies

**CDN Configuration:**

```nginx
# Nginx CDN configuration
location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### HTTP/2 Server Push

Push critical resources before the browser requests them:

```js
// Express.js with HTTP/2 push
app.get("/", (req, res) => {
  res.push("/css/critical.css", {
    req: { accept: "text/css" },
    res: { "content-type": "text/css" },
  })
  res.send(html)
})
```

#### Bundle Analysis and Optimization

- Use tools like Webpack Bundle Analyzer to identify large dependencies.
- Implement code splitting based on routes and features.
- Remove unused dependencies and polyfills.
- Consider using modern JavaScript features with appropriate fallbacks.

#### Performance Monitoring

- Implement Real User Monitoring (RUM) to track Core Web Vitals.
- Use Performance API to measure custom metrics.
- Set up alerts for performance regressions.
- Monitor and optimize based on real-world data.

#### Declarative Threads & Off-Main Execution

**CSS Paint API / PaintWorklet**

Move custom painting operations off the main thread to prevent blocking the CRP:

```js
// Register a custom paint worklet
CSS.paintWorklet.addModule('custom-paint.js');

// Use in CSS
.custom-element {
  background: paint(custom-pattern);
}
```

```js
// custom-paint.js
class CustomPatternPainter {
  paint(ctx, size, properties) {
    // Custom painting logic runs off main thread
    ctx.fillStyle = "#f0f0f0"
    ctx.fillRect(0, 0, size.width, size.height)

    // Complex patterns without blocking main thread
    for (let i = 0; i < size.width; i += 10) {
      ctx.strokeStyle = "#333"
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, size.height)
      ctx.stroke()
    }
  }
}

registerPaint("custom-pattern", CustomPatternPainter)
```

**Benefits:**

- Custom painting operations don't block the main thread
- Enables complex visual effects without impacting CRP
- Better performance for animated custom backgrounds

**AnimationWorklet**

Create high-frequency animations at 120 FPS without main thread involvement:

```js
// Register animation worklet
CSS.animationWorklet.addModule('scroll-animation.js');

// Use in CSS
.scroll-animated {
  animation: scroll-animation 1s linear;
}
```

```js
// scroll-animation.js
class ScrollDrivenAnimation {
  constructor(options) {
    this.options = options
  }

  animate(currentTime, effect) {
    // Animation logic runs at 120 FPS on separate thread
    const progress = currentTime / 1000 // Convert to seconds
    const transform = `translateY(${progress * 100}px)`
    effect.localTime = currentTime
    effect.target.style.transform = transform
  }
}

registerAnimator("scroll-animation", ScrollDrivenAnimation)
```

**Benefits:**

- Animations run at 120 FPS on dedicated thread
- No main thread blocking during animations
- Smooth scrolling and complex animations
- Better battery life on mobile devices

**Model-Viewer for 3D Content**

Leverage GPU for 3D rendering without blocking the CRP:

```html
<!-- Load 3D model without blocking main thread -->
<model-viewer
  src="model.glb"
  alt="3D Model"
  camera-controls
  auto-rotate
  shadow-intensity="1"
  environment-image="neutral"
  exposure="1"
  shadow-softness="0.5"
>
</model-viewer>
```

```html
<!-- With custom loading and error handling -->
<model-viewer
  src="model.glb"
  alt="3D Model"
  loading="eager"
  reveal="auto"
  ar
  ar-modes="webxr scene-viewer quick-look"
  camera-controls
  auto-rotate
>
  <!-- Loading placeholder -->
  <div slot="progress-bar" class="progress-bar">
    <div class="progress-bar-fill"></div>
  </div>

  <!-- Error fallback -->
  <div slot="error" class="error-message">Unable to load 3D model</div>
</model-viewer>
```

**Benefits:**

- 3D rendering happens on GPU, not CPU
- No main thread blocking for complex 3D scenes
- Hardware acceleration for smooth performance
- Progressive loading with placeholders
- AR support for mobile devices

**Implementation Considerations:**

- Use `loading="lazy"` for below-the-fold 3D content
- Implement proper fallbacks for unsupported browsers
- Consider using `IntersectionObserver` to load models only when needed
- Optimize 3D models (reduce polygon count, compress textures)

---

## Network Protocols and Their Impact

The protocol used to deliver resources fundamentally impacts CRP:

- **HTTP/1.1**: Multiple TCP connections, limited parallelism, head-of-line blocking.
- **HTTP/2**: Multiplexing over a single TCP connection, but still subject to TCP head-of-line blocking.
- **HTTP/3 (QUIC)**: Multiplexing over UDP, eliminates head-of-line blocking, faster handshakes, resilient to network changes.

| Feature      | HTTP/1.1     | HTTP/2          | HTTP/3 (QUIC)     |
| ------------ | ------------ | --------------- | ----------------- |
| Connection   | Multiple TCP | Single TCP      | Single QUIC (UDP) |
| Multiplexing | No           | Yes             | Yes (Improved)    |
| HOL Blocking | Yes          | Yes (TCP-level) | No (per-stream)   |
| Handshake    | Slow         | Slow            | Fast (0-RTT)      |

## Anti-Patterns to Avoid

Understanding what NOT to do is as important as knowing the right techniques. These anti-patterns can severely impact your CRP performance.

### Style Recalculation Bottlenecks

**Invalidation Scope Issues**

Changing a class on `<body>` forces full-tree recalculation:

```js
// ❌ BAD: Forces recalculation of entire document
document.body.classList.add("dark-theme")

// ✅ GOOD: Target specific elements
document.querySelector(".theme-container").classList.add("dark-theme")
```

**Why it's bad:** When you modify styles on high-level elements like `<body>` or `<html>`, the browser must recalculate styles for the entire document tree, causing massive performance hits.

**Large CSS Selectors**

User Selector performance tracing to measure the impact.
Enable experimental “Selector Stats” in Edge/Chrome devtools

```css
/* ❌ BAD: Expensive selector */
body div.container div.content div.article div.paragraph span.text {
  color: red;
}

/* ✅ GOOD: Specific, efficient selector */
.article-text {
  color: red;
}
```

**Why it's bad:** Complex selectors require more computation during style calculation, especially when the DOM changes.

### Layout Thrashing Patterns

**Read-Write Cycles in Loops**

```js
// ❌ BAD: Forces reflow on every iteration
const elements = document.querySelectorAll(".item")
for (let i = 0; i < elements.length; i++) {
  const width = elements[i].offsetWidth // READ
  elements[i].style.width = width * 2 + "px" // WRITE
}

// ✅ GOOD: Batch reads and writes
const elements = document.querySelectorAll(".item")
const widths = []
for (let i = 0; i < elements.length; i++) {
  widths.push(elements[i].offsetWidth) // All READS
}
for (let i = 0; i < elements.length; i++) {
  elements[i].style.width = widths[i] * 2 + "px" // All WRITES
}
```

**Why it's bad:** Each read forces a synchronous reflow, making the loop exponentially slower.

### Resource Loading Anti-Patterns

**Blocking Critical Resources**

```html
<!-- ❌ BAD: Blocks rendering -->
<head>
  <link rel="stylesheet" href="non-critical.css" />
  <script src="analytics.js"></script>
</head>

<!-- ✅ GOOD: Non-blocking loading -->
<head>
  <link rel="stylesheet" href="non-critical.css" media="print" onload="this.media='all'" />
  <script src="analytics.js" async></script>
</head>
```

**Why it's bad:** Render-blocking resources delay First Contentful Paint and Largest Contentful Paint.

**Hidden Resources from Preload Scanner**

```css
/* ❌ BAD: Image hidden from preload scanner */
.hero {
  background-image: url("hero-image.jpg");
}
```

```html
<!-- ✅ GOOD: Discoverable by preload scanner -->
<img src="hero-image.jpg" alt="Hero" class="hero" />
```

**Why it's bad:** The preload scanner can't discover resources in CSS, delaying their loading.

### DOM Manipulation Anti-Patterns

**Excessive DOM Queries**

```js
// ❌ BAD: Multiple DOM queries
for (let i = 0; i < 1000; i++) {
  const element = document.querySelector(".item") // Expensive query
  element.style.color = "red"
}

// ✅ GOOD: Single query, cache reference
const element = document.querySelector(".item")
for (let i = 0; i < 1000; i++) {
  element.style.color = "red"
}
```

**Why it's bad:** DOM queries are expensive operations that should be minimized and cached.

**Creating Elements in Loops**

```js
// ❌ BAD: Creates elements one by one
for (let i = 0; i < 1000; i++) {
  const div = document.createElement("div")
  div.textContent = `Item ${i}`
  document.body.appendChild(div) // Forces reflow each time
}

// ✅ GOOD: Use DocumentFragment
const fragment = document.createDocumentFragment()
for (let i = 0; i < 1000; i++) {
  const div = document.createElement("div")
  div.textContent = `Item ${i}`
  fragment.appendChild(div)
}
document.body.appendChild(fragment) // Single reflow
```

**Why it's bad:** Each appendChild forces a reflow. DocumentFragment batches all changes.

### Animation Anti-Patterns

**Animating Layout-Triggering Properties**

```css
/* ❌ BAD: Triggers layout on every frame */
.animated {
  animation: bad-animation 1s infinite;
}

@keyframes bad-animation {
  0% {
    width: 100px;
  }
  50% {
    width: 200px;
  }
  100% {
    width: 100px;
  }
}

/* ✅ GOOD: Only animates compositor-friendly properties */
.animated {
  animation: good-animation 1s infinite;
}

@keyframes good-animation {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
```

**Why it's bad:** Animating width, height, top, left, etc. triggers layout on every frame, causing jank.

**Overusing will-change**

```css
/* ❌ BAD: Creates unnecessary layers */
.everything {
  will-change: transform, opacity, background-color;
}

/* ✅ GOOD: Only hint what will actually change */
.animated-element {
  will-change: transform;
}
```

**Why it's bad:** `will-change` creates compositor layers that consume memory. Use sparingly.

### Memory and Performance Anti-Patterns

**Event Listener Leaks**

```js
// ❌ BAD: Creates new listener on every render
function BadComponent() {
  document.addEventListener("scroll", () => {
    // Handle scroll
  })
}

// ✅ GOOD: Clean up listeners
function GoodComponent() {
  const handleScroll = () => {
    // Handle scroll
  }

  document.addEventListener("scroll", handleScroll)

  return () => {
    document.removeEventListener("scroll", handleScroll)
  }
}
```

**Why it's bad:** Unremoved event listeners cause memory leaks and performance degradation.

**Large Bundle Sizes**

```js
// ❌ BAD: Imports entire library
import _ from "lodash"

// ✅ GOOD: Import only what you need
import debounce from "lodash/debounce"
```

**Why it's bad:** Large bundles increase download time and parsing time, blocking the CRP.

---

## Diagnosing CRP with Chrome DevTools

### Performance Panel

- **Main thread**: Shows DOM construction, style calculation, layout, paint, and compositing.
- **Long purple blocks**: Indicate heavy style/layout work (often due to layout thrashing).
- **Green blocks**: Paint and compositing.

### Network Panel

- **Waterfall**: Visualizes resource dependencies and blocking.

### Lighthouse Panel

- **Eliminate render-blocking resources**: Lists CSS/JS files delaying First Contentful Paint.
- **Critical request chain**: Shows dependency graph for initial render.

### Layers Panel

- **Visualize compositor layers**: Diagnose layer explosions and compositing issues.

**Best Practice:** Always test under simulated mobile network and CPU conditions.

## CRP Optimization Checklist

Use this checklist to audit and optimize your Critical Rendering Path:

- [ ] **Critical CSS extracted & inlined?**

  - Above-the-fold styles inlined in `<head>`
  - Non-critical CSS loaded non-blocking

- [ ] **All render-blocking JS deferred?**

  - Scripts use `async`, `defer`, or `type="module"`
  - No blocking scripts in `<head>`

- [ ] **Largest image preloaded with correct dimensions?**

  - Hero/LCP image preloaded with `rel="preload"`
  - Responsive images with proper `srcset` and `sizes`

- [ ] **DOM ≤ 1,500 nodes above the fold?**

  - Minimal DOM complexity for initial render
  - Complex content deferred below the fold

- [ ] **Long tasks broken below 50 ms?**

  - JavaScript tasks split into smaller chunks
  - Use `requestIdleCallback` for non-critical work

- [ ] **No forced reflows in hot loops?**

  - DOM reads and writes batched separately
  - Layout thrashing eliminated

- [ ] **Layer count under GPU budget?**

  - Reasonable number of compositor layers
  - `will-change` used sparingly

- [ ] **Continuous animations use only transform/opacity?**

  - No layout-triggering properties in animations
  - GPU-accelerated animations only

- [ ] **contain and content-visibility applied where safe?**

  - CSS containment for isolated components
  - `content-visibility: auto` for off-screen content

- [ ] **Field metrics (FCP, LCP, INP) green in Web Vitals dashboard?**
  - First Contentful Paint < 1.8s
  - Largest Contentful Paint < 2.5s
  - Interaction to Next Paint < 200ms

**Additional Checks:**

- [ ] Resource hints (preconnect, preload) implemented
- [ ] Images optimized (WebP/AVIF, compression, lazy loading)
- [ ] Fonts optimized (font-display: swap, preloading)
- [ ] HTTP/2 or HTTP/3 enabled
- [ ] CDN configured properly
- [ ] Service worker caching strategy implemented
- [ ] Bundle size optimized (tree shaking, code splitting)

## Conclusions and Recommendations

- **Adopt a modern, parallel mental model**: The CRP is not linear—embrace preload scanner and compositor thread parallelism.
- **Prioritize declaratively**: Declare critical resources in HTML, use SSR/SSG, and avoid hiding resources in CSS/JS.
- **Master resource prioritization**: Use preconnect, preload, defer, and non-blocking CSS techniques judiciously.
- **Optimize beyond initial load**: Batch DOM reads/writes, use content-visibility, and stick to compositor-friendly animations.
- **Implement advanced techniques**: Use modern image formats, font optimization, CSS containment, and service workers.
- **Leverage modern protocols**: Upgrade to HTTP/2 or HTTP/3 when possible, implement server push for critical resources.
- **Measure, don't guess**: Use DevTools, Lighthouse, and always test under real-world conditions.
- **Focus on Core Web Vitals**: Optimize for LCP, FID, and CLS to improve user experience and search rankings.

---

## References

- [MDN](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path)
- [Understanding the critical path](https://web.dev/learn/performance/understanding-the-critical-path)
- [Optimizing Resource Loading](https://web.dev/learn/performance/optimize-resource-loading)
- [Optimizing the Critical Rendering Path](https://web.dev/articles/critical-rendering-path/optimizing-critical-rendering-path)
- [Constructing the Object Model](https://web.dev/articles/critical-rendering-path/constructing-the-object-model)
- [You Don't Need the DOM Ready Event](https://thanpol.as/javascript/you-dont-need-dom-ready)
- [HTML Spec - Blocking Attribute](https://html.spec.whatwg.org/multipage/urls-and-fetching.html#blocking-attributes)
- [HTML Living Standard](https://html.spec.whatwg.org/multipage/scripting.html)
- [Analysing CRP](https://web.dev/articles/critical-rendering-path/analyzing-crp?hl=en)

#### From ByteByteGo

- Downloaded from [Alex Xu](https://twitter.com/alexxubyte/status/1534201523713867777) Twitter post.

![CRP from Bytebytego](./2023-08-10-critical-rendering-path/crp-bytebytego.jpeg)

<iframe
  width='560'
  height='315'
  class='yt-embed'
  src='https://www.youtube.com/embed/25fkjIIk2_o?si=3cxf1u6rv_7UK_MU'
  title='YouTube video player'
  frameborder='0'
  allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
  referrerpolicy='strict-origin-when-cross-origin'
  allowfullscreen
></iframe>
