# Draft: Graceful Degradation

Designing systems that fail gracefully under stress.

## TLDR

- Partial functionality beats total failure
- Feature flags enable instant mitigation
- Critical paths must be identified upfront

## Outline

1. Degradation principles: partial functionality over total failure
2. Feature flags: gradual rollout, kill switches
3. Circuit breakers: failure isolation, recovery
4. Fallback strategies: cached data, default values, reduced functionality
5. Load shedding: prioritizing critical traffic
6. Timeouts and retries: preventing cascade failures
7. Bulkhead pattern: resource isolation
8. Designing for degradation: identifying critical paths
