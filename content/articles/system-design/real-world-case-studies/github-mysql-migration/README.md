# Draft: GitHub MySQL Migration

Learning from GitHub's large-scale database migration.

## TLDR

- Zero-downtime migration requires careful planning
- Dual-write pattern enables safe transitions
- Gradual traffic shifting minimizes risk

## Outline

1. Migration overview: large-scale MySQL migration
2. Zero-downtime requirements: always-on service
3. Dual-write pattern: writing to both systems
4. Data validation: consistency verification
5. Cutover strategy: gradual traffic shift
6. Rollback capability: instant rollback if issues
7. Lessons learned: testing, monitoring, gradual rollout
