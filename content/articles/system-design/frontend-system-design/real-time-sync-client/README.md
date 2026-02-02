# Draft: Real-Time Sync Client

Building real-time data synchronization in frontend applications.

## TLDR

- WebSocket enables bidirectional real-time communication
- Optimistic updates provide immediate feedback
- Reconnection handling is critical for reliability

## Outline

1. Connection types: WebSocket, SSE, long polling
2. Connection management: reconnection, backoff
3. Message handling: ordering, deduplication
4. State reconciliation: server as source of truth
5. Optimistic updates: immediate UI feedback
6. Conflict handling: server wins, merge strategies
7. Presence: user online status, activity indicators
8. Libraries: Socket.io, Phoenix Channels, Ably
