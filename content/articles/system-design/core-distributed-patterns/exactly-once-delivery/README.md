# Draft: Exactly-Once Delivery

Achieving exactly-once semantics in distributed systems.

## TLDR

- True exactly-once is impossible; we simulate it with idempotency
- Idempotency keys enable safe retries
- End-to-end exactly-once requires careful design

## Outline

1. Delivery semantics: at-most-once, at-least-once, exactly-once
2. Why exactly-once is hard: network partitions, failures
3. Idempotency: idempotent operations, idempotency keys
4. Deduplication: message IDs, deduplication windows
5. Transactional outbox: reliable event publishing
6. Idempotent consumers: database constraints, versioning
7. End-to-end exactly-once: Kafka transactions
8. Practical guidance: when exactly-once matters
