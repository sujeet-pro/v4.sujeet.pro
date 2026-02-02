# Draft: Offline-First Architecture

Building applications that work without network connectivity.

## TLDR

- Local-first means the app works offline by default
- Service workers enable caching and background sync
- Conflict resolution handles data divergence

## Outline

1. Offline-first principles: local-first, sync later
2. Service workers: caching strategies, background sync
3. IndexedDB: client-side database, transactions
4. Sync strategies: last-write-wins, merge, CRDT-based
5. Conflict resolution: UI for manual resolution
6. Network detection: online/offline handling
7. Data prioritization: what to cache, storage limits
8. Testing offline scenarios
