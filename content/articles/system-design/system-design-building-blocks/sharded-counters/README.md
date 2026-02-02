# Draft: Sharded Counters

Scaling counters beyond single-node limitations.

## TLDR

- Write contention limits single-counter throughput
- Sharding distributes writes across multiple counters
- Approximate counting trades accuracy for performance

## Outline

1. Counter challenges at scale: write contention, hot keys
2. Sharding strategies: random, hash-based, time-based
3. Aggregation: synchronous vs asynchronous
4. Approximate counting: HyperLogLog, Count-Min Sketch
5. Consistency tradeoffs: eventual vs strong consistency
6. Use cases: view counts, likes, analytics
