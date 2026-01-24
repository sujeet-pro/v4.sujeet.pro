# Draft: Rate Limiting Strategies: Token Bucket, Leaky Bucket, and Sliding Window

Protect systems from abuse and overload with proven rate limiting algorithms.

## TLDR

- Token bucket handles bursts while enforcing long-term limits
- Sliding window provides smoother accuracy at higher cost
- Distributed limits require shared state or approximations

## Outline

1. Rate limiting goals and constraints
2. Algorithm comparisons and tradeoffs
3. Keying strategies and user identity
4. Distributed rate limiting patterns
5. Error responses and client guidance
6. Testing and monitoring
