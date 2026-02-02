# Draft: Rendering Strategies

Choosing between CSR, SSR, SSG, and hybrid approaches.

## TLDR

- Different rendering strategies optimize for different goals
- Hydration bridges server-rendered HTML and interactivity
- Islands architecture minimizes JavaScript

## Outline

1. Client-side rendering (CSR): SPA, tradeoffs
2. Server-side rendering (SSR): SEO, time-to-first-byte
3. Static site generation (SSG): build-time rendering
4. Incremental static regeneration (ISR): on-demand rebuilds
5. Streaming SSR: progressive rendering
6. Hydration: attaching interactivity, hydration mismatch
7. Partial hydration: islands architecture
8. Framework comparison: Next.js, Nuxt, Astro
