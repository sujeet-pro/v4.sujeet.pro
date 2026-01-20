---
lastUpdatedOn: 2024-09-23
tags:
  - system-design
  - distributed-systems
  - architecture
---

# Draft: URL Shortener Design

A comprehensive guide to designing a scalable URL shortening service like bit.ly or TinyURL.


## Requirements

### Functional Requirements

- Generate short URLs from long URLs
- Redirect short URLs to original URLs
- Optional: Custom short URLs
- Optional: Analytics and tracking

### Non-Functional Requirements

- High availability
- Low latency redirects
- Scalable to billions of URLs

## High-Level Design

The system consists of:

1. **API Gateway**: Handles incoming requests
2. **URL Service**: Generates and manages short URLs
3. **Database**: Stores URL mappings
4. **Cache**: For frequently accessed URLs

## Key Design Decisions

### URL Encoding

- Base62 encoding (a-z, A-Z, 0-9)
- 7 characters = 62^7 = ~3.5 trillion unique URLs

### Database Choice

- NoSQL (e.g., DynamoDB, Cassandra) for high write throughput
- Key-value store optimized for lookups

## Coming Soon

More detailed implementation notes coming soon...
