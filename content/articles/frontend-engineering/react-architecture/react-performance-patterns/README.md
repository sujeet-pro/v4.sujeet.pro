# Draft: React Performance Patterns: Rendering, Memoization, and Scheduling

Practical patterns for keeping React apps fast as they scale.

## TLDR

- Render frequency is the primary performance lever
- Memoization works only with stable inputs
- Scheduling helps maintain interaction responsiveness

## Outline

1. Render pipeline and reconciliation costs
2. Memoization patterns and pitfalls
3. List virtualization and windowing
4. Suspense and concurrent rendering
5. Profiling and diagnostics
6. Performance checklist
