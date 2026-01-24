# Draft: Design Real-Time Chat and Messaging

Messaging architecture with delivery guarantees and presence.

## TLDR

- Low-latency delivery requires persistent connections
- Ordering and retries must handle mobile disconnects
- Presence and typing indicators add real-time complexity

## Outline

1. Requirements and scale assumptions
2. Connection management and fan-out
3. Message ordering and delivery guarantees
4. Offline support and sync
5. Storage and search
6. Security and abuse controls
