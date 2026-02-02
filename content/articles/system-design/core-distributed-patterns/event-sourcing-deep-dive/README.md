# Draft: Event Sourcing Deep Dive

Implementing event sourcing patterns effectively.

## TLDR

- Events become the source of truth, not current state
- Snapshots optimize replay performance
- Event schema evolution requires careful planning

## Outline

1. Event sourcing fundamentals: events as source of truth
2. Event store design: append-only, immutable events
3. Event schema: structure, versioning, upcasting
4. Snapshots: reducing replay time, snapshot strategies
5. Projections: building read models, eventual consistency
6. Temporal queries: point-in-time state, audit trails
7. Event sourcing + CQRS: combining patterns
8. Challenges: event schema evolution, debugging
