---
lastReviewedOn: 2026-01-21
tags:
  - platform-engineering
  - system-design
---

# CSP-Sentinel Technical Design Document

CSP-Sentinel is a centralized, high-throughput system designed to collect, process, and analyze Content Security Policy (CSP) violation reports from web browsers. As our web properties serve tens of thousands of requests per second, the system must handle significant burst traffic (baseline 50k RPS, scaling to 100k+ RPS) while maintaining near-zero impact on client browsers.

<figure>

```mermaid
flowchart LR
    subgraph Clients
        B[Browsers]
    end
    subgraph Ingestion["Ingestion Layer"]
        LB[Load Balancer] --> API[WebFlux API]
    end
    subgraph Processing["Processing Layer"]
        K[(Kafka)] --> CONS[Consumer]
        CONS --> R[(Redis)]
    end
    subgraph Storage["Storage Layer"]
        SF[(Snowflake)]
    end

    B -->|CSP Reports| LB
    API -->|Async| K
    CONS -->|Batch Write| SF
```

<figcaption>CSP-Sentinel high-level architecture: browsers send violation reports through a non-blocking API to Kafka, where consumers deduplicate and batch-write to Snowflake</figcaption>

</figure>

## TLDR

**CSP-Sentinel** is a streaming data pipeline for ingesting, deduplicating, and analyzing CSP violation reports at scale (50k-500k+ RPS).

### Core Architecture

- **Fire-and-forget ingestion**: Spring WebFlux returns `204 No Content` immediately, no DB interaction
- **Kafka buffering**: Decouples ingestion from processing, survives storage slowdowns
- **Redis deduplication**: Suppresses identical violations within 10-minute windows using hash keys
- **Snowflake OLAP**: Clustered by date/directive for efficient analytics queries

### Technology Choices (Q1 2026)

- **Java 25 LTS** with ZGC for sub-millisecond GC pauses ([Oracle Java 25](https://www.oracle.com/news/announcement/oracle-releases-java-25-2025-09-16/))
- **Spring Boot 4 / Framework 7** with WebFlux for non-blocking I/O ([Spring Blog](https://spring.io/blog/2025/11/20/spring-boot-4-0-0-available-now/))
- **Kafka 3.8+** on AWS MSK with lz4 compression ([AWS MSK](https://aws.amazon.com/about-aws/whats-new/2025/02/amazon-msk-apache-kafka-version-3-8/))
- **Valkey 8.x** on ElastiCache (Redis-compatible, post-licensing change) ([AWS ElastiCache Docs](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/supported-engine-versions.html))
- **PostgreSQL 18** for local development ([PostgreSQL 18 Release](https://www.postgresql.org/about/news/postgresql-18-released-3142/))

### Scaling Strategy

- **Partition formula**: `P = max(target/producer_throughput, target/consumer_throughput) × growth_factor`
- **48 partitions** handles baseline 50k RPS with headroom to 240k RPS
- **Consumer pods**: Scale on Kafka lag, not CPU
- **Snowflake ingestion**: Buffer to 100-250MB compressed files, use Snowpipe for >50k RPS

### Key Design Decisions

- **`acks=1`** for Kafka producer: Prioritizes latency over strict durability (acceptable for CSP reports)
- **Stateless API**: No session state, horizontal scaling via HPA on CPU
- **24-hour Kafka retention**: Cost optimization; Kafka is a buffer, not storage
- **90-day data retention**: Balance between historical analysis and storage costs

## 1. Project Goals & Background

Modern browsers send CSP violation reports as JSON payloads when a webpage violates defined security policies. Aggregating these reports allows our security and development teams to:

- Identify misconfigurations and false positives.
- Detect malicious activity (XSS attempts).
- Monitor policy rollout health across all properties.

**Key Objectives:**

- **High Throughput:** Handle massive bursts of report traffic during incidents.
- **Low Latency:** Return `204 No Content` immediately to clients.
- **Noise Reduction:** Deduplicate repetitive reports from the same user/browser.
- **Actionable Insights:** Provide dashboards and alerts for developers.
- **Future-Proof:** Built on the latest LTS technologies available for Q1 2026.

## 2. Requirements

### 2.1 Functional Requirements

- **Ingestion API:** Expose a `POST /csp/report` endpoint accepting standard CSP JSON formats ([Legacy `csp-report`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/report-uri) with `application/csp-report` content type and [modern `Report-To`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/report-to) with `application/reports+json`).
- **Immediate Response:** Always respond with HTTP 204 without waiting for processing.
- **Deduplication:** Suppress identical violations from the same browser within a short window (e.g., 10 minutes) using Redis.
- **Storage:** Store detailed violation records (timestamp, directive, blocked URI, etc.) for querying.
- **Analytics:** Support querying by directive, blocked host, and full-text search on resource URLs.
- **Visualization:** Integration with Grafana for trends, top violators, and alerting.
- **Retention:** Retain production data for 90 days.

### 2.2 Non-Functional Requirements

- **Scalability:** Horizontal scaling from 50k RPS to 1M+ RPS.
- **Reliability:** "Fire-and-forget" ingestion with durable buffering in Kafka. At-least-once delivery.
- **Flexibility:** Plug-and-play storage layer (Snowflake for Prod, Postgres for Dev).
- **Security:** Stateless API, standardized TLS, secure access to dashboards.

## 3. Technology Stack (Q1 2026 Strategy)

We have selected the latest Long-Term Support (LTS) and stable versions projected for the build timeframe.

| Component           | Choice         | Version (Target)      | Justification                                                           |
| :------------------ | :------------- | :-------------------- | :---------------------------------------------------------------------- |
| **Language**        | Java           | **25 LTS**            | Latest LTS as of late 2025. Performance & feature set.                  |
| **Framework**       | Spring Boot    | **4.0** (Framework 7) | Built for Java 25. Native support for Virtual Threads & Reactive.       |
| **API Style**       | Spring WebFlux | --                    | Non-blocking I/O essential for high-concurrency ingestion.              |
| **Messaging**       | Apache Kafka   | **3.8+** (AWS MSK)    | Durable buffer, high throughput, decoupling.                            |
| **Caching**         | Valkey         | **8.x** (ElastiCache) | Redis-compatible, low-latency deduplication ([AWS migrated to Valkey](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/supported-engine-versions.html) after Redis licensing changes). |
| **Primary Storage** | Snowflake      | SaaS                  | Cloud-native OLAP, separates storage/compute, handles massive datasets. |
| **Dev Storage**     | PostgreSQL     | **18.x**              | Easy local setup, sufficient for dev/test volumes.                      |
| **Visualization**   | Grafana        | **12.x**              | Rich ecosystem, native Snowflake plugin.                                |

## 4. System Architecture

### 4.1 High-Level Architecture (HLD)

The system follows a Streaming Data Pipeline pattern.

```mermaid
flowchart LR
    subgraph Clients
        B[Browsers<br/>CSP Reports]
    end

    subgraph AWS_EKS["Kubernetes Cluster (EKS)"]
        LB[Load Balancer]
        API[Ingestion Service<br/>Spring WebFlux]
        CONS[Consumer Service<br/>Spring Boot]
    end

    subgraph AWS_Infrastructure
        K[(Kafka / MSK<br/>Topic: csp-violations)]
        R[(Redis / ElastiCache)]
    end

    subgraph Storage
        SF[(Snowflake DW)]
        PG[(Postgres Dev)]
    end

    B -->|POST /csp/report| LB --> API
    API -->|Async Produce| K
    K -->|Consume Batch| CONS
    CONS -->|Check Dedup| R
    CONS -->|Write Batch| SF
    CONS -->|"Write (Dev)"| PG
```

### 4.2 Component Breakdown

#### 4.2.1 Ingestion Service (API)

- **Role:** Entry point for all reports.
- **Implementation:** Spring WebFlux (Netty).
- **Behavior:**
  - Validates JSON format.
  - Asynchronously sends to Kafka (`csp-violations`).
  - Returns `204` immediately.
  - **No** DB interaction to ensure sub-millisecond response time.

#### 4.2.2 Kafka Layer

- **Topic:** `csp-violations`.
- **Partitions:** Scaled per throughput (e.g., 48 partitions for 50k RPS).
- **Role:** Buffers spikes. If DB is slow, Kafka holds data, preventing data loss or API latency.

#### 4.2.3 Consumer Service

- **Role:** Processor.
- **Implementation:** Spring Boot (Reactor Kafka).
- **Logic:**
  1.  Polls batch from Kafka.
  2.  Computes Dedup Hash (e.g., `SHA1(document + directive + blocked_uri + ua)`).
  3.  Checks Redis: If exists, skip. If new, set in Redis (EXPIRE 10m).
  4.  Buffers unique records.
  5.  Batch writes to Storage (Snowflake/Postgres).
  6.  Commits Kafka offsets.

#### 4.2.4 Data Storage

- **Production (Snowflake):** Optimized for OLAP query patterns. Table clustered by Date/Directive.
- **Development (Postgres):** Standard relational table with GIN indexes for text search simulation.

## 5. Data Model

### 5.1 Unified Schema Fields

| Field                | Type      | Description                          |
| :------------------- | :-------- | :----------------------------------- |
| `EVENT_ID`           | UUID      | Unique Event ID                      |
| `EVENT_TS`           | TIMESTAMP | Time of violation                    |
| `DOCUMENT_URI`       | STRING    | Page where violation occurred        |
| `VIOLATED_DIRECTIVE` | STRING    | e.g., `script-src`                   |
| `BLOCKED_URI`        | STRING    | The resource blocked                 |
| `BLOCKED_HOST`       | STRING    | Domain of blocked resource (derived) |
| `USER_AGENT`         | STRING    | Browser UA                           |
| `ORIGINAL_POLICY`    | STRING    | Full CSP string                      |
| `VIOLATION_HASH`     | STRING    | Deduplication key                    |

### 5.2 Snowflake DDL (Production)

```sql
CREATE TABLE CSP_VIOLATIONS (
  EVENT_ID            STRING DEFAULT UUID_STRING(),
  EVENT_TS            TIMESTAMP_LTZ NOT NULL,
  EVENT_DATE          DATE AS (CAST(EVENT_TS AS DATE)) STORED,
  DOCUMENT_URI        STRING,
  VIOLATED_DIRECTIVE  STRING,
  BLOCKED_URI         STRING,
  BLOCKED_HOST        STRING,
  USER_AGENT          STRING,
  -- ... other fields
  VIOLATION_HASH      STRING
)
CLUSTER BY (EVENT_DATE, VIOLATED_DIRECTIVE);
```

### 5.3 Postgres DDL (Development)

```sql
CREATE TABLE csp_violations (
  event_id UUID PRIMARY KEY,
  event_ts TIMESTAMPTZ NOT NULL,
  -- ... same fields
  blocked_uri TEXT
);
-- GIN Index for text search
CREATE INDEX idx_blocked_uri_trgm ON csp_violations USING gin (blocked_uri gin_trgm_ops);
```

## 6. Scaling & Capacity Planning

The system is designed to scale horizontally. We use specific formulas to determine the required infrastructure based on our target throughput.

### 6.1 Sizing Formulas

We use the following [industry-standard formulas](https://www.confluent.io/blog/how-choose-number-topics-partitions-kafka-cluster/) to estimate resources for strict SLAs.

#### 6.1.1 Kafka Partitions

To avoid bottlenecks, partition count ($P$) is calculated based on the slower of the producer ($T_p$) or consumer ($T_c$) throughput per partition.

$$
P = \max \left( \frac{T_{target}}{T_p}, \frac{T_{target}}{T_c} \right) \times \text{GrowthFactor}
$$

- **Target ($T_{target}$):** 50 MB/s (50k RPS $\times$ 1KB avg message size).
- **Producer Limit ($T_p$):** ~10 MB/s (standard Kafka producer on commodity hardware).
- **Consumer Limit ($T_c$):** ~5 MB/s (assuming deserialization + dedup logic).
- **Growth Factor:** 1.5x - 2x.

**Calculation for 50k RPS:**
$$ P = \max(5, 10) \times 1.5 = 15 \text{ partitions (min)} $$
_Recommendation:_ We will provision **48 partitions** to allow for massive burst capacity (up to ~240k RPS without resizing) and to match the parallelism of our consumer pod fleet.

#### 6.1.2 Consumer Pods

$$
N_{pods} = \frac{RPS_{target}}{RPS_{per\_pod}} \times \text{Headroom}
$$

- **50k RPS Target:** $\lceil \frac{50,000}{5,000} \times 1.3 \rceil = 13$ Pods.

### 6.2 Throughput Tiers

| Tier           | RPS  | Throughput | API Pods | Consumer Pods | Kafka Partitions |
| :------------- | :--- | :--------- | :------- | :------------ | :--------------- |
| **Baseline**   | 50k  | ~50 MB/s   | 4        | 12-14         | 48               |
| **Growth**     | 100k | ~100 MB/s  | 8        | 24-28         | 96               |
| **High Scale** | 500k | ~500 MB/s  | 36       | 130+          | 512              |

### 6.3 Scaling Strategies

- **API:** CPU-bound (JSON parsing) and Network I/O bound. Scale HPA based on CPU usage (Target 60%).
- **Consumers:** Bound by DB write latency and processing depth. Scale HPA based on **Kafka Consumer Lag**.
- **Storage:**
  - **Continuous Loading:** Use **Snowpipe** for steady streams.
  - **Batch Loading:** Use `COPY INTO` with file sizes between **100MB - 250MB** (compressed) for optimal warehouse utilization.

## 7. Observability

- **Dashboards (Grafana):**
  - **Overview:** Total violations/min, Breakdown by Directive.
  - **Top Offenders:** Top Blocked Hosts, Top Violating Pages.
  - **System Health:** Kafka Lag, API 5xx rates, End-to-end latency.
- **Alerting:**
  - **Spike Alert:** > 50% increase in violations over 5m moving average.
  - **Lag Alert:** Consumer lag > 1 million messages (indication of stalled consumers).

## 8. Appendix: Infrastructure Optimization & Tuning

### 8.1 Kafka Configuration (AWS MSK)

To ensure durability while maintaining high throughput:

- **Replication Factor:** 3 (Survives 2 broker failures).
- **Min In-Sync Replicas (`min.insync.replicas`):** 2 (Ensures at least 2 writes before ack).
- **Producer Acks:** `acks=1` (Leader only) for lowest latency (Fire-and-forget), or `acks=all` for strict durability. _Recommended: `acks=1` for CSP reports to minimize browser impact._
- **Compression:** `lz4` or `zstd` (Low CPU overhead, high compression ratio for JSON).
- **Log Retention:** 24 Hours (Cost optimization; strictly a buffer).

### 8.2 Spring Boot WebFlux Tuning

Optimizing the Netty engine for 50k+ RPS:

- **Memory Allocation:** Enable Pooled Direct ByteBufs to reduce GC pressure.
  - `-Dio.netty.leakDetection.level=DISABLED` (Production only)
  - `-Dio.netty.allocator.type=pooled`
- **Threads:** limiting the Event Loop threads to `CPU Core Count` prevents context switching.
- **Garbage Collection:** Use **[Generational ZGC](https://openjdk.org/jeps/439)** which is optimized for sub-millisecond pauses on large heaps (available in Java 21+, production-ready).
  - `-XX:+UseZGC -XX:+ZGenerational`

### 8.3 Snowflake Ingestion Optimization

- **File Sizing:** [Snowflake micro-partitions](https://docs.snowflake.com/en/user-guide/data-load-considerations-prepare) are most efficient when loaded from files sized **100MB - 250MB** (compressed).
- **Batch Buffering:** Consumers should buffer writes to S3 until this size is reached OR a time window (e.g., 60s) passes.
- **Snowpipe vs COPY:**
  - For < 50k RPS: Direct Batch Inserts (JDBC) or small batch `COPY`.
  - For > 50k RPS: Write to S3 -> Trigger **[Snowpipe](https://docs.snowflake.com/en/user-guide/data-load-snowpipe-intro)**. This decouples consumer logic from warehouse loading latency.

## 9. Development Plan

1.  **Phase 1: Local Prototype**
    - Docker Compose (Kafka, Redis, Postgres).
    - Basic API & Consumer implementation.
2.  **Phase 2: Cloud Infrastructure**
    - Terraform for EKS, MSK, ElastiCache.
    - Snowflake setup.
3.  **Phase 3: Production Hardening**
    - Load testing (k6/Gatling) to validate 50k RPS.
    - Alert tuning.
4.  **Phase 4: Launch**
    - Switch DNS report-uri to new endpoint.

## References

### CSP Specifications

- [MDN: Content-Security-Policy report-uri](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/report-uri) - Legacy CSP reporting format (`application/csp-report`)
- [MDN: Content-Security-Policy report-to](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/report-to) - Modern Reporting API format (`application/reports+json`)

### Technology Stack

- [Oracle Java 25 LTS Announcement](https://www.oracle.com/news/announcement/oracle-releases-java-25-2025-09-16/) - Released September 16, 2025
- [Spring Boot 4.0.0 Release](https://spring.io/blog/2025/11/20/spring-boot-4-0-0-available-now/) - Released November 20, 2025
- [Spring Framework 7.0 GA](https://spring.io/blog/2025/11/13/spring-framework-7-0-general-availability/) - Released November 13, 2025
- [AWS MSK Kafka 3.8 Support](https://aws.amazon.com/about-aws/whats-new/2025/02/amazon-msk-apache-kafka-version-3-8/) - February 2025
- [AWS ElastiCache Supported Versions](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/supported-engine-versions.html) - Valkey 8.x documentation
- [PostgreSQL 18 Release](https://www.postgresql.org/about/news/postgresql-18-released-3142/) - Released September 25, 2025
- [Grafana 12 Release](https://grafana.com/blog/2025/05/07/grafana-12-release-all-the-new-features/) - May 2025

### Performance & Scaling

- [Confluent: How to Choose Kafka Partition Count](https://www.confluent.io/blog/how-choose-number-topics-partitions-kafka-cluster/) - Partition sizing formula: `max(t/p, t/c)`
- [Snowflake: Preparing Data Files](https://docs.snowflake.com/en/user-guide/data-load-considerations-prepare) - 100-250MB compressed file sizing recommendation
- [Snowflake: Snowpipe Overview](https://docs.snowflake.com/en/user-guide/data-load-snowpipe-intro) - Continuous data ingestion best practices
- [OpenJDK: Generational ZGC (JEP 439)](https://openjdk.org/jeps/439) - Sub-millisecond GC pauses, available in JDK 21+
