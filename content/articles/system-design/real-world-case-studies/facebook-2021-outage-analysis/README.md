# Draft: Facebook 2021 Outage Analysis

Learning from Facebook's 6-hour global outage.

## TLDR

- A BGP configuration change caused a global outage
- DNS dependency created a single point of failure
- Physical access became necessary for recovery

## Outline

1. Incident overview: 6-hour global outage
2. Root cause: BGP configuration change, DNS failure
3. Cascading failures: how one change brought down everything
4. DNS dependency: why DNS was the critical path
5. Recovery challenges: physical access, out-of-band management
6. Lessons learned: testing, rollback procedures, dependencies
7. Architectural implications: single points of failure
