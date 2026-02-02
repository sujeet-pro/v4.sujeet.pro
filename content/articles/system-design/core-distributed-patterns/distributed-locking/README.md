# Draft: Distributed Locking

Implementing correct distributed locks and when to avoid them.

## TLDR

- Distributed locks are harder than they appear
- Fencing tokens prevent split-brain scenarios
- Lock-free alternatives are often better

## Outline

1. Lock requirements: mutual exclusion, deadlock freedom, fairness
2. Single-node locks: in-memory, limitations
3. Distributed lock services: ZooKeeper, etcd, Redis
4. Redlock algorithm: multi-node Redis locking, controversies
5. Fencing tokens: preventing split-brain scenarios
6. Lock-free alternatives: optimistic concurrency, CAS
7. Lease-based locking: auto-expiration
8. When to avoid distributed locks
