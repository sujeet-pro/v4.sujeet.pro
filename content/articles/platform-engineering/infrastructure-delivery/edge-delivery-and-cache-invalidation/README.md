# Draft: Edge Delivery and Cache Invalidation

How to serve content globally while keeping it fresh.

## TLDR

- Cache keys and TTLs define correctness and performance
- Invalidation is costly; design for versioned assets
- Edge compute enables personalization without origin load

## Outline

1. Edge cache fundamentals
2. Cache key design and variation
3. Invalidation strategies and versioning
4. Stale-while-revalidate and background refresh
5. Edge compute use cases
6. Operational guardrails
