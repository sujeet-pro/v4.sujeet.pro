# Critical Rendering Path: DOM Construction

How browsers parse HTML bytes into a Document Object Model (DOM) tree, why JavaScript loading strategies dictate performance, and how the preload scanner mitigates the cost of parser-blocking resources.

## TLDR

### Incremental Parsing

- DOM construction is incremental; the browser can build the tree and discover resources while HTML is still streaming.
- This enables progressive rendering and early resource discovery via the preload scanner.

### Blocking Mechanics

- Scripts block HTML parsing by default to prevent race conditions (e.g., `document.write()` or querying styles before CSSOM is ready).
- CSS is render-blocking but becomes parser-blocking if followed by a script that requires the CSS Object Model (CSSOM).

### Resource Discovery

- The preload scanner runs a secondary, lightweight parse to find and fetch external resources (`<script>`, `<link>`, `<img>`) while the main parser is blocked.
- JavaScript-injected resources and CSS-defined assets (like `background-image`) are invisible to the preload scanner.

### Loading Strategies

- `async`: Parallel download, executes immediately (order not guaranteed).
- `defer`: Parallel download, executes after DOM is parsed but before `DOMContentLoaded` (order guaranteed).
- `module`: Deferred by default, supports ESM features.

## The Parsing Process

The browser parses HTML bytes into a DOM tree through four stages:

1. **Conversion**: Translate bytes into characters using specified encoding (usually UTF-8).
2. **Tokenization**: Break the character stream into tokens (`<html>`, `<body>`, text nodes) per the HTML spec.
3. **Lexing**: Convert tokens into node objects with specific properties and rules.
4. **Tree Construction**: Link nodes into a parent-child structure representing the Document Object Model.

```html collapse={1-10,13-16}
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

<figcaption>DOM tree construction from HTML parsing: each element becomes a node with parent-child relationships preserved.</figcaption>

</figure>

## Why Incremental Parsing Matters

Unlike [CSSOM construction](../crp-cssom-construction/README.md), DOM construction doesn't require the complete document. The browser parses and builds incrementally, enabling:

- **Early resource discovery**: The preload scanner can find `<link>` and `<script>` tags before they are reached by the main parser.
- **Progressive rendering**: Content above the fold can be displayed as soon as it's parsed and styled.
- **Faster TFB → FCP pipeline**: Reducing the time from Time to First Byte (TTFB) to First Contentful Paint (FCP).

---

## Browser Design: Why JavaScript Blocks Parsing

By default, `<script>` tags block HTML parsing because scripts might:

1. **Modify the DOM**: `document.write()` can inject HTML directly into the parsing stream.
2. **Query DOM state**: Scripts often expect certain elements to exist in the DOM.
3. **Access computed styles**: Scripts may need CSSOM for `getComputedStyle()`, creating a dependency on CSS.

```html collapse={1-3,8-11}
<head>
  <link rel="stylesheet" href="styles.css" />
  <script>
    // This script blocks on CSS because it accesses computed styles
    const color = getComputedStyle(document.body).backgroundColor
  </script>
</head>
```

### The Blocking Chain

1. HTML parser encounters a `<script>`.
2. The browser downloads the script (if external) in parallel with CSS.
3. Execution waits for CSSOM completion if CSS is still loading (to prevent style race conditions).
4. Script executes.
5. HTML parsing resumes.

**Note**: CSS blocks JavaScript **execution**, not **download**. The browser fetches scripts in parallel but won't run them until styles are resolved.

---

## Browser Design: Why CSS is Render-Blocking

CSS blocks rendering—not parsing—because the cascade cannot be resolved incrementally.

If browsers rendered with a partial CSSOM, users would experience a **Flash of Unstyled Content (FOUC)** or "Flash of Wrong Styles" as later rules override earlier ones. Browsers wait for a complete CSSOM to ensure visual stability and prevent layout shifts.

### When CSS Becomes Parser-Blocking

CSS becomes parser-blocking when a `<script>` follows it in the document:

```html collapse={1}
<head>
  <link rel="stylesheet" href="styles.css" />
  <!-- CSS is downloading... -->

  <script src="app.js"></script>
  <!-- Parser blocks here! Waiting for CSS + JS -->
</head>
```

The browser must wait for CSS to finish to build the CSSOM, so it can safely execute the script, which in turn blocks the parser. This indirect blocking is a common performance bottleneck.

---

## JavaScript Loading Strategies

<figure>

![Async, Defer, Module Diagram](./asyncdefer.inline.svg)

<figcaption>Timeline comparison: default scripts block parsing; async/defer enable parallel download.</figcaption>

</figure>

### Default (Parser-Blocking)

```html
<script src="app.js"></script>
```

- Blocks HTML parsing until download and execution complete.
- Preserves document order.
- **Use for**: Legacy scripts that require `document.write()`.

### Async

```html
<script src="analytics.js" async></script>
```

- Downloads in parallel with parsing.
- Executes immediately upon download (interrupts parser).
- **Order NOT preserved**.
- **Use for**: Independent third-party scripts (analytics, ads).

### Defer

```html
<script src="app.js" defer></script>
```

- Downloads in parallel with parsing.
- Executes after the DOM is fully parsed but before `DOMContentLoaded`.
- **Order preserved**.
- **Use for**: Primary application scripts.

### Module

```html
<script type="module" src="app.js"></script>
```

- **Deferred by default**.
- Supports `import`/`export` and top-level `await`.
- Executes once (singleton behavior).

### Summary Table

| Mode     | Parser Blocking | Order Preserved | When Executes    | Best For       |
| -------- | --------------- | --------------- | ---------------- | -------------- |
| Default  | Yes             | Yes             | Immediately      | Legacy scripts |
| `async`  | No              | No              | When downloaded  | Analytics, ads |
| `defer`  | No              | Yes             | After DOM parsed | App scripts    |
| `module` | No              | Yes             | After DOM parsed | Modern apps    |

---

## The Preload Scanner

The **preload scanner** is a secondary parser that runs ahead of the main parser to discover and fetch external resources. This mitigates the impact of parser-blocking scripts.

### What it can find

- `<link rel="stylesheet">`
- `<script src="...">`
- `<img>` and `<link rel="preload">`

### What it misses

- JavaScript-injected resources (e.g., `document.createElement('script')`).
- CSS `background-image` or `@import`.
- Client-side rendered content in Single Page Applications (SPAs) without Server-Side Rendering (SSR) or Static Site Generation (SSG).

---

## Conclusion

DOM construction is a highly optimized but sensitive process. While the browser's incremental parsing and preload scanner attempt to maximize throughput, parser-blocking scripts and their indirect dependency on CSSOM remain the primary bottlenecks in the Critical Rendering Path. Modern loading strategies like `defer` and `type="module"` should be the default choice to decouple resource execution from the document parsing lifecycle.

## Appendix

### Prerequisites

- Basic understanding of HTML, CSS, and JavaScript.
- Familiarity with the request-response cycle (HTTP).

### Terminology

- **DOM**: Document Object Model, the tree representation of HTML.
- **CSSOM**: CSS Object Model, the tree representation of styles.
- **Critical Rendering Path (CRP)**: The sequence of steps the browser takes to convert HTML, CSS, and JS into pixels on the screen.
- **FOUC**: Flash of Unstyled Content, a visual glitch where unstyled content is shown before CSS is applied.
- **Preload Scanner**: A browser optimization that fetches resources in parallel with the main parser.
- **SSR/SSG**: Server-Side Rendering or Static Site Generation, techniques to provide pre-rendered HTML to the browser.
- **SPA**: Single Page Application, a web app that loads a single HTML page and updates content dynamically via JavaScript.

### Summary

- HTML is parsed into DOM nodes via conversion, tokenization, lexing, and tree construction.
- Scripts are parser-blocking by default; they can modify the DOM or wait for CSSOM.
- CSS is render-blocking but can indirectly block the parser if followed by a script.
- The preload scanner discovers external resources early to mitigate blocking.
- Use `defer` or `module` for application logic to keep the parser unblocked.

### References

- [HTML Spec: Parsing HTML documents](https://html.spec.whatwg.org/multipage/parsing.html#parsing)
- [HTML Spec: Scripting and Blocking](https://html.spec.whatwg.org/multipage/scripting.html)
- [MDN: Critical Rendering Path](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path)
- [web.dev: Constructing the Object Model](https://web.dev/articles/critical-rendering-path/constructing-the-object-model)
