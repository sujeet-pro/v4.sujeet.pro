# Draft: Design a Key-Value Store

Building a distributed key-value store like Dynamo or Cassandra.

## TLDR

- Consistent hashing distributes data across nodes
- Quorum reads/writes balance consistency and availability
- Vector clocks enable conflict detection

## Outline

1. Requirements: high throughput, low latency, durability
2. Data partitioning: consistent hashing, virtual nodes
3. Replication: quorum reads/writes, sloppy quorum
4. Conflict resolution: vector clocks, LWW, application-level
5. Failure handling: hinted handoff, anti-entropy
6. Storage engine: LSM tree, memtable, SSTables
7. Reference: Dynamo, Riak, Cassandra architecture
