# Draft: Client State Management

Managing different types of state in frontend applications.

## TLDR

- Server state and UI state have different requirements
- React Query/SWR simplify server state caching
- State machines model complex UI interactions

## Outline

1. State categories: server cache, UI state, form state
2. Server state: caching, invalidation, optimistic updates
3. React Query/SWR: stale-while-revalidate pattern
4. Global state: when needed, when to avoid
5. State machines: XState, modeling complex UI states
6. Derived state: selectors, memoization
7. State persistence: localStorage, sessionStorage
8. Debugging: state inspection, time-travel debugging
