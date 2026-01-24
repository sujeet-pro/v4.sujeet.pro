# Draft: DNS Resolution Path: Stub to Recursive to Authoritative

Walk through how a DNS query resolves end-to-end and where latency and failures appear.

## TLDR

- Resolution flows from client to recursive to root, TLD, and authoritative servers
- Caching and TTLs at every hop dominate real-world latency
- Tracing tools reveal where lookups stall or return incorrect data

## Outline

1. DNS actors and roles (stub, recursive, authoritative)
2. Iterative resolution steps with root and TLD lookups
3. Caching layers and how TTLs are applied
4. Common failure modes (NXDOMAIN, SERVFAIL, timeouts)
5. Latency bottlenecks and mitigation strategies
6. Diagnostics with dig, trace, and resolver logs
