---
lastUpdatedOn: 2024-01-01
tags:
  - system-design
  - distributed-systems
  - architecture
category: system-design/foundations
---

# CAP Theorem

The CAP theorem states that a distributed data store cannot simultaneously provide more than two of the following three guarantees: Consistency, Availability, and Partition Tolerance.

## Table of Contents

## The Three Guarantees

### Consistency

Every read receives the most recent write or an error. All nodes see the same data at the same time.

### Availability

Every request receives a response, without guarantee that it contains the most recent version of the data.

### Partition Tolerance

The system continues to operate despite network partitions (communication breakdowns between nodes).

## Why Only Two?

In a distributed system, network partitions are inevitable. When a partition occurs, you must choose between:

- **CP (Consistency + Partition Tolerance)**: Refuse to respond until all nodes are in sync
- **AP (Availability + Partition Tolerance)**: Respond with potentially stale data

## Real-World Examples

| System | Type | Reason |
|--------|------|--------|
| MongoDB | CP | Prioritizes consistency over availability during partitions |
| Cassandra | AP | Prioritizes availability, eventual consistency |
| Redis | CP | Single-master architecture ensures consistency |

## Key Takeaways

1. CAP is about trade-offs, not absolute choices
2. Modern systems often provide tunable consistency
3. Understanding CAP helps in choosing the right database for your use case
