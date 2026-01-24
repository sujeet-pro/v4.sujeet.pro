# Draft: Fetch, Streams, and AbortController

Modern network APIs for efficient streaming, cancellation, and backpressure handling.

## TLDR

- Fetch uses promises and integrates with streams for incremental data
- AbortController enables cancellation and timeout patterns
- Streaming reduces memory use and improves perceived latency

## Outline

1. Fetch basics and request lifecycles
2. ReadableStream fundamentals and backpressure
3. AbortController patterns for timeouts and cancellation
4. Streaming JSON, files, and media
5. Error handling and retries
6. Browser compatibility notes
