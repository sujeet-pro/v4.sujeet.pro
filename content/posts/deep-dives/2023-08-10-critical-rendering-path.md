---
lastUpdatedOn: 2024-11-29
tags:
  - js
  - html
  - css
  - web-performance
  - performance
  - ssg
  - ssr
---

# Critical Rendering Path

Understanding the Critical Rendering Path for web performance optimization

![crp](./2023-08-10-critical-rendering-path/crp.inline.svg)

## Table of Contents

## Flow

1. Constructing the Document Object Model (DOM) from the HTML.
1. Constructing the CSS Object Model (CSSOM) from the CSS.
1. Applying any JavaScript that alters the DOM or CSSOM.
1. Constructing the render tree from the DOM and CSSOM.
1. Perform style and layout operations on the page to see what elements fit where.
1. Paint the pixels of the elements in memory.
1. Composite the pixels if any of them overlap.
1. Physically draw all the resulting pixels to screen.

![Critical Rendering Flow Steps](./2023-08-10-critical-rendering-path/crp-flow.inline.svg)

## DOM Construction Process

![Dom Construction PRocess](./2023-08-10-critical-rendering-path/dom-construction-process.inline.svg)

- **Conversion**: The browser reads the raw bytes of HTML off the disk or network, and translates them to individual characters based on the specified encoding of the file (for example, UTF-8).
- **Tokenizing**: The browser converts strings of characters into distinct tokens—as specified by the W3C HTML5 standard, for example, `<html>`, `<body>`—and other strings within angle brackets. Each token has a special meaning and its own set of rules.
- **Lexing**: The emitted tokens are converted into "objects," which define their properties and rules.
- **DOM construction**: Finally, because the HTML markup defines relationships between different tags (some tags are contained within other tags) the created objects are linked in a tree data structure that also captures the parent-child relationships defined in the original markup: the HTML object is a parent of the body object, the body is a parent of the paragraph object, and so on.

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

![Dom Construction Example](./2023-08-10-critical-rendering-path/dom-construction-example.invert.png)

### CSSOM Construction Process

![CSSOM Construction](./2023-08-10-critical-rendering-path/cssom-construction.inline.svg)

CSS is render blocking as it blocks rendering of parsed content until CSS Object Model (CSSOM) is constructed.
The browser does this to prevent Flash of Unstyled Content (FOUC)

- Render-blocking resources, like CSS, **used to** block all rendering of the page when they were discovered.
- Some browsers (Firefox initially, and now also Chrome) only block rendering of content below the render-blocking resource.

#### Sample Code for the CSSOM

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

![CSS Tree](./2023-08-10-critical-rendering-path/cssom-tree.png)

### Explicitly mark CSS as render-blocking

`blocking=render` attribute, added to Chrome 105. This allows developers to explicitly mark a `<link>`, `<script>` or `<style>` element as rendering-blocking until the element is processed, but still allowing the parser to continue processing the document in the meantime.

### Marking CSS as Non Render Blocking

Although CSS is render-blocking by default, it can be turned into a non-render-blocking resource by changing the `<link>` element's media attribute to specify a value that doesn't match the current conditions: `<link rel=stylesheet href="..." media=print>`. This has been used in the past to allow non-critical CSS to load in a non-render blocking fashion.

## JavaScript Execution

![async-defer](./2023-08-10-critical-rendering-path/asyncdefer.inline.svg)

- Script download can be sync or async.
- Script execution is always parser-blocking
- default - Parser Blocking everything - Download + Execution
- `async` - Download in parallel, execute ASAP
- `defer` - Download in parallel, execute after DOM
- JS Execution waits for any in-flight render-blocking CSS (CSSOM Construction)

### Parser Blocking Scripts

Script tags without `async` or `defer` are parser-blocking.

When the parser encounters a `<script>` element, the browser needs to evaluate and execute the script before proceeding with parsing the rest of the HTML. This is by design, as scripts may modify or access the DOM during a time while it is still being constructed. (using `document.write()`)

### Blocked on CSS, Why?

A parser-blocking `<script>` must also wait for any in-flight render-blocking CSS resources to arrive and be parsed before the browser can execute it. This is also by design, as a script may access styles declared in the render-blocking style sheet (for example, by using `element.getComputedStyle()`).

### Browser Optimization for parser blocking

Blocking the parser can have a huge performance cost—much more than just blocking rendering. For this reason, browsers will try to reduce this cost by using a secondary HTML parser known as the **preload scanner** to download upcoming resources while the primary HTML parser is blocked.

### Order of execution

Order of execution is guaranteed in blocking scripts and when using defer.
This is not guaranteed when using `async`, since these scripts are executed as soon as they are downloaded.

## Render Tree Construction

The render tree is a subset of the DOM tree that includes only the nodes required to render the page.

![Render Tree](./2023-08-10-critical-rendering-path/render-tree.invert.png)

## Resources & CRP

### Resources for Initial Render

- Part of the HTML.
- Render-blocking CSS in the `<head>` element.
- Render-blocking JavaScript in the `<head>` element.

Importantly, for the initial render, the browser will not typically wait for:

- All of the HTML.
- Fonts.
- Images.
- Non-render-blocking JavaScript outside of the `<head>` element (for example, `<script>` elements placed at the end of the HTML).
- Non-render-blocking CSS outside of the `<head>` element, or CSS with a media attribute value that does not apply to the current viewport.

### Resource Loading

- CSS is render blocking
- Scripts are parser blocking
- Browsers have a preload scanner, that can continue to download resources, while waiting on blocked resources

![CRP Network](./2023-08-10-critical-rendering-path/crp-network.inline.svg)

### Basic HTML

![CRP Basic](./2023-08-10-critical-rendering-path/crp-network-basic.png)

### Basic CSS

![CRP with basic CSS](./2023-08-10-critical-rendering-path/crp-network-basic-css.png)

### Render Blocking CSS with Async JS

![CRP with render blocking CSS and async JS](./2023-08-10-critical-rendering-path/crp-network-render-blocking-css-with-async-js.png)

## Optimizing CRP

### The preload scanner

The preload scanner is a browser optimization in the form of a secondary HTML parser that scans the raw HTML response to find and speculatively fetch resources before the primary HTML parser would otherwise discover them. For example, the preload scanner would allow the browser to start downloading a resource specified in an `<img>` element, even when the HTML parser is blocked while fetching and processing resources such as CSS and JavaScript.

### Best practices to optimize CRP

The general sequence of steps to optimize the critical rendering path is:

- Analyze and characterize your critical path: number of resources, bytes, length.
- Minimize number of critical resources: eliminate them, defer their download, mark them as async, and so on.
- Optimize the number of critical bytes to reduce the download time (number of roundtrips).
- Optimize the order in which the remaining critical resources are loaded: download all critical assets as early as possible to shorten the critical path length.

### Action Items

- Move to Server Side Rendering
- Deferring JavaScript
- Preload fonts and use `font-display: swap`
- Prioritize Above the fold.

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
