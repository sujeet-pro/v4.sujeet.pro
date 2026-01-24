# Critical Rendering Path: DOM Construction

How browsers parse HTML bytes into a Document Object Model tree, and why JavaScript loading strategies matter for performance.

## The Parsing Process

The browser parses HTML bytes into a Document Object Model (DOM) tree through four steps:

1. **Conversion**: Translate bytes into characters using specified encoding (UTF-8)
2. **Tokenizing**: Break character stream into tokens (`<html>`, `<body>`, text nodes) per HTML5 spec
3. **Lexing**: Convert tokens into nodes with properties and rules
4. **Tree Construction**: Link nodes into parent-child tree structure

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

<figure>

![DOM Construction Example](./dom-construction-example.invert.png)

<figcaption>DOM tree construction from HTML parsing: each element becomes a node with parent-child relationships preserved</figcaption>

</figure>

## Why Incremental Parsing Matters

Unlike [CSSOM construction](../crp-cssom-construction/README.md), DOM construction doesn't require the complete document. The browser parses and builds incrementally, enabling:

- Early resource discovery (the preload scanner can find `<link>` and `<script>` tags)
- Progressive rendering of content above the fold
- Faster Time to First Byte → First Contentful Paint pipeline

---

## Browser Design: Why JavaScript Blocks Parsing

By default, `<script>` tags block HTML parsing because scripts might:

1. **Modify the DOM being parsed**: `document.write()` can inject HTML
2. **Query DOM state**: Script may expect certain elements to exist
3. **Access computed styles**: May need CSSOM for `getComputedStyle()`

```html
<head>
  <link rel="stylesheet" href="styles.css" />
  <script>
    // This script blocks on CSS because it accesses computed styles
    const color = getComputedStyle(document.body).backgroundColor
  </script>
</head>
```

### The Blocking Chain

1. HTML parser encounters `<script>`
2. Download script (if external)—this happens in parallel with CSS loading
3. Wait for CSSOM to complete (if CSS is still loading)—scripts might access computed styles
4. Execute script
5. Resume HTML parsing

**Important**: CSS blocks JavaScript **execution**, not **download**. The browser downloads scripts in parallel with CSS, but won't execute them until CSSOM is ready. This prevents race conditions where scripts might read incorrect or incomplete style information.

---

## Browser Design: Why CSS is Render-Blocking

CSS blocks rendering—not parsing—for a fundamental reason: **the cascade cannot be resolved incrementally**.

Consider what would happen if browsers rendered with partial CSSOM:

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

This "Flash of Unstyled Content" (FOUC) or "Flash of Wrong Styles" creates a poor user experience. Browsers wait for complete CSSOM to ensure:

1. **Correct final styles**: All cascade rules resolved
2. **No layout shifts**: Elements positioned correctly from first paint
3. **Visual stability**: Users see intended design immediately

**The Trade-off**: Waiting for CSS delays First Contentful Paint, but prevents jarring visual changes.

### When CSS Becomes Parser-Blocking

CSS is normally only render-blocking, not parser-blocking. However, CSS **becomes parser-blocking** when JavaScript follows it:

```html
<head>
  <link rel="stylesheet" href="styles.css" />
  <!-- CSS is downloading... -->

  <script src="app.js"></script>
  <!-- Parser blocks here! Waiting for CSS + JS -->
</head>
```

Here's why:

1. The parser encounters the `<script>` tag
2. The script might call `getComputedStyle()` or access CSSOM
3. Browser must wait for CSS to finish before executing JS
4. Since JS blocks parsing, CSS now **indirectly** blocks parsing

**Solution**: Use `defer` or `async` to prevent this blocking chain.

---

## JavaScript Loading Strategies

<figure>

![Async, Defer, Module Diagram](./asyncdefer.inline.svg)

<figcaption>Timeline comparison: default scripts block parsing; async/defer enable parallel download</figcaption>

</figure>

### Default (Parser-Blocking)

```html
<script src="app.js"></script>
```

- Blocks HTML parsing until download and execution complete
- Order preserved for multiple scripts
- Blocks on CSS if script accesses computed styles
- **Use for**: Legacy scripts that use `document.write()` (avoid if possible)

> **Parser-Blocking vs Render-Blocking**: Default scripts block _parsing_, not _rendering_. This distinction matters: parser-blocking prevents the browser from building more of the DOM, while render-blocking prevents painting to the screen.

**Example: Parser-Blocking Without Render-Blocking**

```html
<!doctype html>
<html>
  <head>
    <style>
      .hero {
        background: blue;
        height: 100vh;
      }
      .hero:hover {
        background: red;
      }
      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
      .animated {
        animation: pulse 1s infinite;
      }
    </style>
  </head>
  <body>
    <div class="hero animated">Hover me! Animation runs!</div>

    <!-- Parser blocks here waiting for slow-script.js -->
    <script src="slow-script.js"></script>

    <div class="footer">This won't appear until script executes</div>
  </body>
</html>
```

While `slow-script.js` downloads (parser blocked), the browser **continues rendering**:

- The CSS animation keeps running smoothly
- Hovering the hero changes its background to red
- Scrolling works, text can be selected
- The compositor thread handles these updates independently

If the script were **render-blocking** (like CSS in `<head>`), none of this would happen—the screen would stay blank until the resource loaded.

**When scripts ARE render-blocking**: A script in `<head>` before any `<body>` content effectively blocks rendering because there's no DOM to render yet. Scripts added dynamically don't block rendering unless you set `blocking="render"`.

### Async

```html
<script src="analytics.js" async></script>
```

- Downloads in parallel with HTML parsing
- Executes immediately when download completes
- **Order NOT preserved**—executes in download-completion order
- Still blocks on CSS if accessing computed styles
- **Use for**: Independent scripts (analytics, ads, social widgets)

### Defer

```html
<script src="app.js" defer></script>
```

- Downloads in parallel with HTML parsing
- Executes after DOM is fully parsed, before `DOMContentLoaded`
- **Order preserved**—executes in document order
- **Use for**: Application scripts that need the DOM

### Module

```html
<script type="module" src="app.js"></script>
```

- **Deferred by default**—no need to add `defer` attribute
- **Order preserved**—executes in document order (same as `defer`)
- Supports `import`/`export` syntax
- Supports top-level `await`
- Each module executes once (cached)
- Adding `async` makes it execute immediately when downloaded (losing order guarantees)
- **Use for**: Modern applications with ES modules

### Summary Table

| Mode     | Parser Blocking | Order Preserved | When Executes    | Best For       |
| -------- | --------------- | --------------- | ---------------- | -------------- |
| Default  | Yes             | Yes             | Immediately      | Legacy scripts |
| `async`  | No              | No              | When downloaded  | Analytics, ads |
| `defer`  | No              | Yes             | After DOM parsed | App scripts    |
| `module` | No              | Yes             | After DOM parsed | Modern apps    |

> **Note**: Module scripts are deferred by default and preserve document order like `defer`. Adding `async` to a module makes it execute as soon as downloaded, losing order guarantees.

### Priority Hints

```html
<script src="critical.js" fetchpriority="high"></script>
<script src="analytics.js" fetchpriority="low" async></script>
```

- `fetchpriority="high"`: Increase priority for critical scripts
- `fetchpriority="low"`: Decrease priority for non-essential scripts
- Works with `async` and `defer`

---

## The Preload Scanner

The **preload scanner** is a secondary, lightweight HTML parser that runs ahead of the main parser to discover resources:

```html
<!doctype html>
<html>
  <head>
    <link rel="stylesheet" href="styles.css" />
    <!-- Preload scanner finds this -->
    <script src="blocking.js"></script>
    <!-- Main parser blocks here -->
    <link rel="stylesheet" href="more.css" />
    <!-- Preload scanner already found this! -->
    <script src="another.js"></script>
    <!-- And this! -->
  </head>
</html>
```

While the main parser is blocked waiting for `blocking.js`, the preload scanner has already discovered and started fetching `more.css` and `another.js`.

### What Preload Scanner Can Find

- `<link rel="stylesheet">` href
- `<script>` src
- `<img>` src and srcset
- `<link rel="preload">` href
- `<link rel="modulepreload">` href

### What Defeats the Preload Scanner

- Resources loaded via JavaScript (`document.createElement('script')`)
- CSS `background-image` URLs
- JavaScript-injected `<img>` tags
- Fully client-side rendered content (SPA without SSR)
- Lazy-loaded above-the-fold images

**Best Practice**: Declare critical resources in HTML markup so the preload scanner can discover them. Use SSR/SSG for critical content paths.

---

## Developer Optimizations

### Resource Loading Hints

#### Preload Critical Resources

```html
<!-- Preload critical CSS -->
<link rel="preload" href="critical.css" as="style" />

<!-- Preload critical font -->
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin />

<!-- Preload critical image -->
<link rel="preload" href="hero.webp" as="image" />
```

#### Prefetch Future Resources

```html
<!-- Prefetch resources for likely next navigation -->
<link rel="prefetch" href="/next-page.html" />
<link rel="prefetch" href="/next-page-styles.css" />
```

#### Preconnect to Origins

```html
<!-- Establish early connection to critical third-party origin -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://cdn.example.com" crossorigin />
```

---

## References

- [MDN: Critical Rendering Path](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path)
- [web.dev: Constructing the Object Model](https://web.dev/articles/critical-rendering-path/constructing-the-object-model)
- [HTML Spec: Blocking Attributes](https://html.spec.whatwg.org/multipage/urls-and-fetching.html#blocking-attributes)
- [HTML Living Standard: Scripting](https://html.spec.whatwg.org/multipage/scripting.html)
- [You Don't Need the DOM Ready Event](https://thanpol.as/javascript/you-dont-need-dom-ready)
