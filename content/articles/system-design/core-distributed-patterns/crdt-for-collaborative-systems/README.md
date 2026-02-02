# Draft: CRDTs for Collaborative Systems

Using Conflict-free Replicated Data Types for distributed collaboration.

## TLDR

- CRDTs guarantee eventual consistency without coordination
- State-based and operation-based CRDTs have different tradeoffs
- CRDTs enable offline-first collaborative applications

## Outline

1. CRDT fundamentals: convergent vs commutative CRDTs
2. State-based CRDTs: G-Counter, PN-Counter, G-Set, OR-Set
3. Operation-based CRDTs: requirements, delivery guarantees
4. LWW-Register: last-writer-wins semantics
5. Sequence CRDTs: RGA, LSEQ for collaborative editing
6. Client implementation: local operations, sync protocol
7. Server implementation: state merging, tombstone garbage collection
8. Use cases: collaborative editing, distributed gaming, offline-first apps
9. Comparison with OT: tradeoffs, when to use each
