# Draft: RPC and API Design

Designing effective APIs for distributed systems communication.

## TLDR

- REST, gRPC, and GraphQL serve different use cases
- API versioning prevents breaking changes
- Rate limiting protects services from abuse

## Outline

1. REST: principles, HATEOAS, maturity model
2. gRPC: protocol buffers, streaming, bidirectional
3. GraphQL: queries, mutations, subscriptions, N+1 problem
4. API versioning: URL, header, content negotiation
5. API pagination: offset, cursor-based, keyset
6. Rate limiting and quotas in APIs
7. API documentation: OpenAPI, AsyncAPI
