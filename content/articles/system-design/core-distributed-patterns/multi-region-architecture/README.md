# Draft: Multi-Region Architecture

Building systems that span multiple geographic regions.

## TLDR

- Multi-region provides latency, availability, and compliance benefits
- Active-active requires careful conflict handling
- Cell-based architecture limits blast radius

## Outline

1. Multi-region goals: latency, availability, compliance
2. Active-passive: failover, data replication, RTO/RPO
3. Active-active: read/write in all regions
4. Conflict resolution: last-writer-wins, merge, CRDTs
5. Data replication: synchronous, asynchronous, semi-sync
6. Global load balancing: GeoDNS, anycast
7. Regional isolation: cell-based architecture
8. Testing: region failure simulation
