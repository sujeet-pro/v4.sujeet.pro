# Draft: AWS Kinesis 2020 Outage Analysis

Learning from AWS's Kinesis service disruption.

## TLDR

- Shard map explosion caused thread exhaustion
- Thundering herd made recovery difficult
- Control plane vs data plane separation is critical

## Outline

1. Incident overview: multi-hour Kinesis outage
2. Root cause: shard map explosion, thread exhaustion
3. Thundering herd: cascading failures from retries
4. Capacity planning lessons: estimating metadata growth
5. Recovery process: manual intervention, gradual recovery
6. Lessons learned: metadata management, circuit breakers
7. Architectural implications: control plane vs data plane
