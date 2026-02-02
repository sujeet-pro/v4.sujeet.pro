# Draft: Distributed Monitoring

Building observability systems for metrics, logs, and traces.

## TLDR

- The three pillars: metrics, logs, and traces
- Time-series databases optimize for high-cardinality data
- Alerting requires balancing sensitivity and noise

## Outline

1. Metrics types: counters, gauges, histograms, summaries
2. Collection: push vs pull, scraping intervals
3. Time-series databases: data model, compression, downsampling
4. Alerting: threshold-based, anomaly detection, alert fatigue
5. Distributed tracing: spans, traces, context propagation
6. Observability pillars: metrics, logs, traces correlation
7. Prometheus/Grafana architecture overview
