# Draft: Distributed Cache Design

Building scalable caching systems for high-throughput applications.

## TLDR

- Cache topologies range from embedded to distributed clusters
- Consistent hashing enables horizontal scaling
- Hot key handling requires special strategies

## Outline

1. Cache topologies: embedded, client-server, distributed
2. Redis architecture: single-threaded, data structures, clustering
3. Memcached: multi-threaded, consistent hashing
4. Cache partitioning: consistent hashing, virtual nodes
5. Cache replication: synchronous, asynchronous
6. Cache coherence: invalidation protocols
7. Hot key handling: local caching, key splitting
