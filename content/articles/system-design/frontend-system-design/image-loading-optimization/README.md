# Draft: Image Loading Optimization

Optimizing image delivery for web performance.

## TLDR

- Lazy loading defers off-screen image loading
- Modern formats reduce file sizes significantly
- Placeholders improve perceived performance

## Outline

1. Lazy loading: native lazy loading, intersection observer
2. Responsive images: srcset, sizes, art direction
3. Modern formats: WebP, AVIF, format negotiation
4. Placeholder strategies: blur hash, LQIP, skeleton
5. Image CDNs: on-the-fly optimization, transformation
6. Priority hints: fetchpriority, preload
7. CLS prevention: aspect ratio, width/height
8. Performance budgets: image size targets
