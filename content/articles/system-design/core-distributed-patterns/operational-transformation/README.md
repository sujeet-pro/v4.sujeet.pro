# Draft: Operational Transformation

Understanding OT algorithms for real-time collaborative editing.

## TLDR

- OT transforms concurrent operations to preserve intent
- Transformation functions must satisfy specific properties
- OT powers Google Docs and similar collaborative editors

## Outline

1. OT fundamentals: operation, transformation function
2. Transformation properties: TP1, TP2
3. Server architecture: operation history, transformation
4. Client architecture: pending operations, acknowledgment
5. Cursor and selection transformation
6. Undo/redo in OT systems
7. Google Docs OT implementation overview
8. Challenges: complexity, correctness proofs
