# Draft: Virtualization and Windowing

Rendering large lists efficiently with virtual scrolling.

## TLDR

- Only render visible items to maintain performance
- DOM recycling reduces memory and rendering overhead
- Variable height items require additional complexity

## Outline

1. Virtual scrolling: rendering only visible items
2. DOM recycling: reusing DOM elements
3. Intersection Observer: visibility detection
4. Virtual list implementation: item positioning, scroll handling
5. Variable height items: measuring, caching heights
6. Grid virtualization: two-dimensional windowing
7. Libraries: react-window, react-virtualized, vue-virtual-scroller
8. Performance optimization: debouncing, overscan
