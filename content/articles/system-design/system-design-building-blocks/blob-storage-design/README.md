# Draft: Blob Storage Design

Designing scalable object storage systems for large files.

## TLDR

- Chunking enables parallel uploads and deduplication
- Erasure coding provides efficient redundancy
- Tiered storage optimizes cost for different access patterns

## Outline

1. Object storage fundamentals: objects, buckets, metadata
2. Chunking strategies: fixed-size, content-defined
3. Deduplication: file-level, block-level, inline vs post-process
4. Metadata management: separate metadata service
5. Replication: erasure coding vs replica-based
6. Garbage collection: reference counting, mark-and-sweep
7. Access patterns: hot, warm, cold storage tiers
