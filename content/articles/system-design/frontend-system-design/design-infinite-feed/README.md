# Draft: Design an Infinite Feed

Building infinite scrolling feed interfaces.

## TLDR

- Cursor-based pagination handles dynamic content
- Virtualization enables smooth scrolling with many items
- Position restoration improves back navigation UX

## Outline

1. Pagination strategies: offset, cursor-based, keyset
2. Scroll detection: scroll events, intersection observer
3. Prefetching: loading ahead of scroll
4. Virtualization: rendering visible items only
5. State management: feed items, loading state
6. Refresh: pull-to-refresh, new item indicators
7. Error handling: retry, partial failure
8. Position restoration: scroll position on back navigation
