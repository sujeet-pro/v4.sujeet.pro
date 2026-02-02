# Draft: Change Data Capture

Capturing and streaming database changes in real-time.

## TLDR

- Log-based CDC provides reliable change streams
- CDC enables real-time data synchronization
- Schema evolution requires careful handling

## Outline

1. CDC fundamentals: capturing database changes
2. CDC approaches: trigger-based, log-based, timestamp-based
3. Log-based CDC: database transaction logs, advantages
4. Debezium: architecture, connectors, configuration
5. CDC consumers: keeping systems in sync
6. Schema evolution: handling schema changes
7. CDC at scale: partitioning, ordering guarantees
8. Use cases: cache invalidation, search indexing, analytics
