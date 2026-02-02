# Draft: Design a Time Series Database

Building a time-series database for metrics and monitoring.

## TLDR

- Time-based partitioning enables efficient range queries
- Compression is critical for storage efficiency
- Downsampling manages long-term data retention

## Outline

1. Requirements: high write throughput, range queries, retention
2. Data model: metrics, tags, timestamps
3. Storage: time-based partitioning, compression techniques
4. Downsampling: aggregation, rollups, retention policies
5. Query patterns: range queries, aggregations, grouping
6. Indexing: inverted index for tags
7. Reference: InfluxDB, TimescaleDB, Prometheus
