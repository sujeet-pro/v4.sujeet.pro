# Draft: State Management Patterns: Local, Global, and Server State

A decision guide for state boundaries, data ownership, and consistency.

## TLDR

- Local state keeps components simple; global state enables coordination
- Server state requires caching, invalidation, and synchronization
- The best systems minimize shared mutable state

## Outline

1. State taxonomy and ownership
2. Local vs global state boundaries
3. Server state caching and invalidation
4. Derived state and memoization
5. Concurrency and optimistic updates
6. Tooling selection criteria
