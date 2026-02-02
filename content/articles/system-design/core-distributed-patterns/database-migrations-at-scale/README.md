# Draft: Database Migrations at Scale

Migrating databases without downtime in production systems.

## TLDR

- Online schema changes avoid table locks
- Dual-write patterns enable safe migrations
- Feature flags provide instant rollback

## Outline

1. Migration challenges: downtime, data integrity, rollback
2. Online schema changes: pt-online-schema-change, gh-ost
3. Dual-write pattern: writing to old and new
4. Backfill strategies: batched, incremental, zero-downtime
5. Data validation: consistency checks, reconciliation
6. Feature flags: gradual rollout, instant rollback
7. Large table migrations: chunking, throttling
8. Multi-database migrations: microservices considerations
