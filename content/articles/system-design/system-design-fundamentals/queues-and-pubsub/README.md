# Draft: Queues and Pub/Sub: Decoupling and Backpressure

Messaging patterns for reliability, elasticity, and async workflows.

## TLDR

- Queues provide work distribution and backpressure
- Pub/Sub enables fan-out and event-driven architecture
- Delivery semantics impact idempotency and retries

## Outline

1. Queue vs Pub/Sub use cases
2. Delivery guarantees and ordering
3. Retry, DLQ, and idempotency
4. Backpressure handling patterns
5. Scaling consumers and throughput
6. Observability and tracing
