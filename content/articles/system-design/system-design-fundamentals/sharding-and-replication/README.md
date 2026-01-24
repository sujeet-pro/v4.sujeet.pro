# Draft: Sharding and Replication: Scaling Data Stores

Partitioning and replication strategies to scale databases safely.

## TLDR

- Sharding scales writes by distributing data
- Replication improves read throughput and availability
- Consistency and failover require careful design

## Outline

1. Sharding strategies and keys
2. Replication models and topologies
3. Consistency tradeoffs and read/write routing
4. Resharding and migration approaches
5. Failure handling and split-brain avoidance
6. Observability and operational tooling
