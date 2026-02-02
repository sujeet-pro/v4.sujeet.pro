# Draft: Leaderboard Design

Building real-time ranking systems at scale.

## TLDR

- Redis sorted sets provide efficient ranking operations
- Partitioning enables horizontal scaling
- Approximate rankings handle extreme scale

## Outline

1. Requirements: real-time ranking, range queries
2. Redis sorted sets: ZADD, ZRANK, ZRANGE operations
3. Scaling sorted sets: partitioning strategies
4. Approximate rankings: sampling, bucketing
5. Dense vs sparse rankings
6. Historical leaderboards: time-based partitioning
7. Tie-breaking strategies
