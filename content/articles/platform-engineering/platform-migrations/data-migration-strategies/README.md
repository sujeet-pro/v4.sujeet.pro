# Draft: Data Migration Strategies and Zero-Downtime Cuts

Patterns for moving data without disrupting production systems.

## TLDR

- Dual writes and backfills reduce downtime risk
- Cutovers require observability and rollback plans
- Schema compatibility is the biggest hidden risk

## Outline

1. Migration goals and risk assessment
2. Backfill and dual-write strategies
3. Schema evolution and compatibility
4. Validation and reconciliation
5. Cutover plans and rollback
6. Post-migration cleanup
