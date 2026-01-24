# Draft: Design YouTube-Style Video Platform

System design for large-scale video upload, processing, and playback.

## TLDR

- Ingest, transcoding, and CDN delivery define the core pipeline
- Metadata search and recommendations drive discovery
- Global scale requires multi-region storage and caching

## Outline

1. Requirements and constraints
2. High-level architecture and data flow
3. Video ingestion and transcoding pipeline
4. Storage, metadata, and search
5. Delivery via CDN and adaptive streaming
6. Capacity planning and tradeoffs
