# Draft: Load Balancer Architecture: L4 vs L7 and Routing

How load balancers distribute traffic and protect services at scale.

## TLDR

- L4 balances by connection; L7 balances by request
- Health checks and failover define availability
- TLS termination and routing policies shape architecture

## Outline

1. Traffic patterns and balancing goals
2. L4 vs L7 tradeoffs
3. Health checks, failover, and draining
4. TLS termination strategies
5. Session affinity and sticky routing
6. Capacity planning and observability
