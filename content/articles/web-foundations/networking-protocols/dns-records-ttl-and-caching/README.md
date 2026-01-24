# Draft: DNS Records, TTLs, and Caching Strategy

A practical guide to DNS record types, TTL design, and cache behavior at scale.

## TLDR

- Record types encode routing, ownership, and security policies
- TTL choices trade off propagation speed vs cache efficiency
- Negative caching and split-horizon DNS can surprise deployments

## Outline

1. Core record types (A, AAAA, CNAME, NS, TXT, SRV, CAA)
2. TTL strategy for services, CDNs, and failover
3. Negative caching and NXDOMAIN behavior
4. Propagation timelines and cache invalidation realities
5. Split-horizon and internal vs external resolution
6. Operational checklists and rollout safety
