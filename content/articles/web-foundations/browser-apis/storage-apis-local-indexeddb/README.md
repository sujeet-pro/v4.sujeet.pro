# Draft: Browser Storage APIs: localStorage, IndexedDB, and Cache

Compare storage APIs, capacity limits, and consistency guarantees in the browser.

## TLDR

- localStorage is synchronous and small; IndexedDB is async and scalable
- Cache API is optimized for request/response pairs
- Storage quotas vary by browser and are eviction-prone

## Outline

1. Storage API landscape and use cases
2. localStorage vs sessionStorage tradeoffs
3. IndexedDB data model and transactions
4. Cache API and service worker integration
5. Quota management and eviction behavior
6. Migration and versioning strategies
