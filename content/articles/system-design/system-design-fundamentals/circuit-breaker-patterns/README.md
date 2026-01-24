# Draft: Circuit Breaker Patterns for Resilient Systems

Fail-fast patterns that prevent cascading failures in distributed systems.

## TLDR

- Circuit breakers protect services during downstream failures
- Open/half-open states limit retries and recover safely
- Metrics and thresholds require tuning per workload

## Outline

1. Failure modes and cascading risk
2. Circuit breaker states and transitions
3. Timeouts, retries, and bulkheads
4. Fallback and degradation strategies
5. Instrumentation and alerting
6. Testing failure scenarios
