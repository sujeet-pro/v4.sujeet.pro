# Draft: Design a Distributed File System

Building a distributed file system like GFS or HDFS.

## TLDR

- Master servers manage metadata, chunk servers store data
- Large fixed-size chunks optimize for throughput
- Replication provides fault tolerance

## Outline

1. Requirements: large files, high throughput, fault tolerance
2. Architecture: master/metadata server, chunk servers
3. Chunking: fixed-size chunks, chunk size selection
4. Metadata management: namespace, file-to-chunk mapping
5. Replication: replica placement, re-replication
6. Consistency model: single-writer, append-only
7. Reference: GFS, HDFS architecture
