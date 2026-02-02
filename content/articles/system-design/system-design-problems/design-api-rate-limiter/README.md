# Draft: Design an API Rate Limiter

Building a distributed rate limiting service.

## TLDR

- Rate limiting algorithms have different tradeoffs
- Distributed rate limiting requires coordination
- Graceful degradation improves user experience

## Outline

1. Rate limiting algorithms: token bucket, sliding window
2. Distributed rate limiting: Redis-based, approximate
3. Rate limit keys: user, IP, API key, endpoint
4. Quota management: monthly limits, burst allowance
5. Response headers: rate limit communication
6. Grace period and soft limits
7. Rate limiting as a service: multi-tenant
