# Exactly-Once Delivery

True exactly-once delivery is impossible in distributed systems—the Two Generals Problem and FLP impossibility theorem prove this mathematically. What we call "exactly-once" is actually "effectively exactly-once": at-least-once delivery combined with idempotency and deduplication mechanisms that ensure each message's effect occurs exactly once, even when the message itself is delivered multiple times.

<figure>

```mermaid
flowchart TB
    subgraph "The Illusion of Exactly-Once"
        direction LR
        P[Producer] -->|"msg + ID"| B[Broker]
        B -->|"msg + ID<br/>(may redeliver)"| C[Consumer]
        C -->|"Check ID"| D[(Dedup Store)]
        D -->|"Already seen?"| E{Duplicate?}
        E -->|"Yes"| F[Skip]
        E -->|"No"| G[Process + Store ID]
    end

    style F fill:#ffcccb
    style G fill:#90EE90
```

<figcaption>Exactly-once semantics: at-least-once delivery + idempotent consumption = effectively exactly-once effect.</figcaption>
</figure>

## Abstract

The mental model for exactly-once semantics:

1. **Network unreliability is fundamental**—messages can be lost, duplicated, or reordered. No protocol can guarantee exactly-once delivery at the network layer.

2. **Exactly-once is a composition**: at-least-once delivery (never lose messages) + idempotency/deduplication (make duplicates harmless) = exactly-once effect.

3. **Three implementation layers**:
   - **Producer side**: Idempotent producers with sequence numbers (Kafka), idempotency keys (Stripe)
   - **Broker side**: Deduplication windows, FIFO ordering, transactional commits
   - **Consumer side**: Idempotent operations, processed-message tracking, atomic state updates

4. **The deduplication window trade-off**: Every system must choose how long to remember message IDs. Shorter windows save storage but risk duplicates from slow retries. Longer windows add overhead but catch more duplicates.

## The Problem

### Why Naive Solutions Fail

**Approach 1: Fire-and-forget (at-most-once)**

Send the message once with no retries. If the network drops it, the message is lost forever.

- Fails because: Message loss is common—TCP connections drop, services restart, packets get corrupted
- Example: Payment notification lost → customer never knows payment succeeded → duplicate payment attempt

**Approach 2: Retry until acknowledged (at-least-once)**

Keep retrying until you receive an acknowledgment. Never lose a message.

- Fails because: The acknowledgment itself can be lost. Producer retries a message that was actually processed.
- Example: Transfer $100 → ack lost → retry → transfer $100 again → $200 withdrawn

**Approach 3: Distributed transactions (two-phase commit)**

Coordinate sender and receiver in a distributed transaction to ensure atomic delivery.

- Fails because: Blocks on coordinator availability, doesn't handle network partitions, terrible performance
- Example: 2PC coordinator fails while holding locks → all participants blocked indefinitely

### The Core Challenge

The fundamental tension: **reliability requires retries, but retries create duplicates**.

The Two Generals Problem proves this mathematically. Two parties cannot achieve certainty of agreement over an unreliable channel—any finite sequence of confirmations leaves doubt about whether the final message arrived.

> **FLP Impossibility (1985)**: There is no deterministic algorithm that solves consensus in an asynchronous system where even one process can crash. This means exactly-once delivery cannot be guaranteed at the protocol level.

The solution isn't to achieve true exactly-once delivery—it's to make duplicates harmless.

## Delivery Semantics

### At-Most-Once

Each message is delivered zero or one times. Messages may be lost but are never redelivered.

**Implementation**: Send once, no retries, no acknowledgment tracking.

**Trade-offs**:

- ✅ Lowest latency and complexity
- ✅ No duplicate handling needed
- ❌ Data loss is guaranteed over time
- ❌ Unsuitable for critical operations

**Use cases**: Metrics collection, logging, real-time analytics where occasional loss is acceptable.

### At-Least-Once

Each message is delivered one or more times. Messages are never lost, but duplicates occur.

**Implementation**: Retry with exponential backoff until acknowledgment received. Store unacked messages durably.

**Trade-offs**:

- ✅ No data loss
- ✅ Simple to implement
- ❌ Consumer must handle duplicates
- ❌ Ordering not guaranteed with retries

**Use cases**: Event sourcing, audit logs, any system where data loss is unacceptable and consumers are idempotent.

### Exactly-Once (Effectively)

Each message's effect occurs exactly once. The message may be delivered multiple times, but the system ensures idempotent processing.

**Implementation**: At-least-once delivery + one of:

- Idempotent operations (natural or designed)
- Deduplication at consumer (track processed message IDs)
- Transactional processing (atomic read-process-write)

**Trade-offs**:

- ✅ No data loss, no duplicate effects
- ❌ Higher complexity and latency
- ❌ Requires coordination between producer, broker, and consumer
- ❌ Deduplication window creates edge cases

**Use cases**: Financial transactions, order processing, any operation where duplicates cause real-world harm.

### Comparison

| Aspect         | At-Most-Once | At-Least-Once | Exactly-Once              |
| -------------- | ------------ | ------------- | ------------------------- |
| Message loss   | Possible     | Never         | Never                     |
| Duplicates     | Never        | Possible      | Prevented                 |
| Complexity     | Low          | Medium        | High                      |
| Latency        | Lowest       | Medium        | Highest                   |
| State required | None         | Retry queue   | Dedup store + retry queue |

## Design Paths

### Path 1: Idempotent Operations

Make the operation itself idempotent—applying it multiple times produces the same result as applying it once.

**When to choose this path:**

- Operations are naturally idempotent (SET vs INCREMENT)
- You control the consumer's state model
- Minimal infrastructure investment desired

**Key characteristics:**

- No deduplication storage required
- Works regardless of delivery semantics
- Requires careful operation design

**Natural idempotency examples:**

```typescript
// SET operations are naturally idempotent
await db.query("UPDATE users SET email = $1 WHERE id = $2", [email, userId])

// DELETE with specific criteria is idempotent
await db.query("DELETE FROM sessions WHERE user_id = $1 AND token = $2", [userId, token])

// GET operations are always idempotent
const user = await db.query("SELECT * FROM users WHERE id = $1", [userId])
```

**Non-idempotent operations that need transformation:**

```typescript
// ❌ Non-idempotent: INCREMENT
await db.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [amount, accountId])

// ✅ Idempotent version: SET with version check
await db.query(
  `
  UPDATE accounts
  SET balance = $1, version = $2
  WHERE id = $3 AND version = $4
`,
  [newBalance, newVersion, accountId, expectedVersion],
)
```

**Trade-offs vs other paths:**

| Aspect            | Idempotent Operations       | Deduplication           |
| ----------------- | --------------------------- | ----------------------- |
| Storage overhead  | None                        | Message ID store        |
| Design complexity | Higher (rethink operations) | Lower (add dedup layer) |
| Failure modes     | Version conflicts           | Window expiry           |
| Latency           | Lower                       | Higher (dedup lookup)   |

### Path 2: Idempotency Keys (API Pattern)

Client generates a unique key per logical operation. Server tracks keys and returns cached results for duplicates.

**When to choose this path:**

- Exposing APIs to external clients
- Operations are not naturally idempotent
- Client controls retry behavior

**Key characteristics:**

- Client generates unique key (UUID v4)
- Server stores operation result keyed by idempotency key
- Subsequent requests with same key return cached result
- Keys expire after a window (typically 24 hours)

**Implementation approach:**

```typescript collapse={1-8, 26-35}
// Server-side idempotency key handling
import { Redis } from "ioredis"

interface IdempotencyRecord {
  status: "processing" | "completed" | "failed"
  response?: unknown
  createdAt: number
}

async function handleWithIdempotency(
  redis: Redis,
  idempotencyKey: string,
  operation: () => Promise<unknown>,
): Promise<{ cached: boolean; response: unknown }> {
  // Check for existing record
  const existing = await redis.get(`idem:${idempotencyKey}`)
  if (existing) {
    const record: IdempotencyRecord = JSON.parse(existing)
    if (record.status === "completed") {
      return { cached: true, response: record.response }
    }
    // Still processing - return 409 Conflict
    throw new Error("Request already in progress")
  }

  // Mark as processing (with TTL to handle crashes)
  await redis.set(
    `idem:${idempotencyKey}`,
    JSON.stringify({ status: "processing", createdAt: Date.now() }),
    "EX",
    3600, // 1 hour TTL for processing state
    "NX", // Only set if not exists
  )

  // Execute operation and store result
  // ... operation execution and result caching
}
```

**Stripe's implementation details:**

- Keys stored in Redis cluster shared across all API servers
- 24-hour retention window
- Keys recycled after window expires
- Response includes original status code and body

**Real-world example:**

Stripe processes millions of payment requests daily. Their idempotency key system:

- Client includes `Idempotency-Key` header with UUID
- Server returns `Idempotent-Replayed: true` header for cached responses
- First request that fails partway through is re-executed on retry
- First request that succeeds is returned from cache on retry

Result: Zero duplicate charges from network retries.

### Path 3: Broker-Side Deduplication

Message broker tracks message IDs and filters duplicates before delivery to consumers.

**When to choose this path:**

- Using a message broker that supports deduplication
- Want to offload deduplication from consumers
- Willing to accept deduplication window constraints

**Key characteristics:**

- Producer assigns unique message ID
- Broker maintains recent message IDs in memory/storage
- Duplicates filtered before consumer delivery
- Window-based: IDs forgotten after expiry

**Kafka idempotent producer (since 0.11):**

The broker assigns a Producer ID (PID) to each producer instance. The producer assigns monotonically increasing sequence numbers per topic-partition:

```
Producer → [PID: 12345, Seq: 0] → Broker (accepts)
Producer → [PID: 12345, Seq: 1] → Broker (accepts)
Producer → [PID: 12345, Seq: 1] → Broker (duplicate, rejects)
Producer → [PID: 12345, Seq: 3] → Broker (out-of-order, error)
```

**Configuration (Kafka 3.0+, enabled by default):**

```properties
enable.idempotence=true
acks=all
```

**AWS SQS FIFO deduplication:**

- 5-minute deduplication window
- Two methods: explicit `MessageDeduplicationId` or content-based (SHA-256 of body)
- After window expires, same ID can be submitted again

**Trade-offs vs other paths:**

| Aspect               | Broker-Side    | Consumer-Side        |
| -------------------- | -------------- | -------------------- |
| Consumer complexity  | Lower          | Higher               |
| Dedup window control | Broker-defined | Application-defined  |
| Cross-broker dedup   | No             | Yes                  |
| Storage location     | Broker         | Application database |

### Path 4: Consumer-Side Deduplication

Consumer tracks processed message IDs and skips duplicates.

**When to choose this path:**

- Broker doesn't support deduplication
- Need longer deduplication windows than broker provides
- Want application-level control over dedup logic

**Key characteristics:**

- Consumer stores processed message IDs durably
- Check before processing; skip if seen
- ID storage must be in same transaction as state updates
- Flexible window: can retain IDs indefinitely

**Implementation with database constraints:**

```typescript collapse={1-6, 28-35}
// Idempotent consumer with database constraints
import { Pool } from "pg"

interface Message {
  id: string
  payload: unknown
}

async function processIdempotently(
  pool: Pool,
  subscriberId: string,
  message: Message,
  handler: (payload: unknown) => Promise<void>,
): Promise<{ processed: boolean }> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // Insert message ID - fails if duplicate (primary key violation)
    const result = await client.query(
      `INSERT INTO processed_messages (subscriber_id, message_id, processed_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT DO NOTHING
       RETURNING message_id`,
      [subscriberId, message.id],
    )

    if (result.rowCount === 0) {
      // Duplicate - skip processing
      await client.query("ROLLBACK")
      return { processed: false }
    }

    // Process message (state updates happen here)
    await handler(message.payload)

    await client.query("COMMIT")
    return { processed: true }
  } finally {
    client.release()
  }
}
```

**Schema:**

```sql
CREATE TABLE processed_messages (
  subscriber_id VARCHAR(255) NOT NULL,
  message_id VARCHAR(255) NOT NULL,
  processed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (subscriber_id, message_id)
);

-- Index for cleanup queries
CREATE INDEX idx_processed_messages_time
  ON processed_messages (processed_at);
```

**Real-world example:**

A payment processor handling webhook retries:

- Each webhook includes unique `event_id`
- Before processing: check if `event_id` exists in `processed_webhooks` table
- If exists: return 200 OK immediately (idempotent response)
- If not: process event, insert ID, return 200 OK
- Daily job: delete records older than 30 days

Result: Webhooks can be retried indefinitely without duplicate effects.

### Path 5: Transactional Processing

Wrap read-process-write into an atomic transaction. Either all effects happen or none do.

**When to choose this path:**

- Using Kafka with exactly-once requirements
- Processing involves read → transform → write pattern
- Need atomicity across multiple output topics/partitions

**Key characteristics:**

- Producer, consumer, and state updates are transactional
- Consumer offset committed as part of transaction
- Aborted transactions don't affect state
- Requires `isolation.level=read_committed` on consumers

**Kafka transactional producer/consumer:**

```typescript collapse={1-12, 45-55}
// Kafka exactly-once consume-transform-produce
import { Kafka, EachMessagePayload } from "kafkajs"

const kafka = new Kafka({ brokers: ["localhost:9092"] })

const producer = kafka.producer({
  transactionalId: "my-transactional-producer",
  maxInFlightRequests: 1,
  idempotent: true,
})

const consumer = kafka.consumer({
  groupId: "my-group",
  readUncommitted: false, // read_committed isolation
})

async function processExactlyOnce() {
  await producer.connect()
  await consumer.connect()
  await consumer.subscribe({ topic: "input-topic" })

  await consumer.run({
    eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
      const transaction = await producer.transaction()

      try {
        // Transform message
        const result = transform(message.value)

        // Produce to output topic (within transaction)
        await transaction.send({
          topic: "output-topic",
          messages: [{ value: result }],
        })

        // Commit consumer offset (within same transaction)
        await transaction.sendOffsets({
          consumerGroupId: "my-group",
          topics: [{ topic, partitions: [{ partition, offset: message.offset }] }],
        })

        await transaction.commit()
      } catch (error) {
        await transaction.abort()
        throw error
      }
    },
  })
}

function transform(value: Buffer | null): string {
  // Your transformation logic
  return value?.toString().toUpperCase() ?? ""
}
```

**Kafka's transactional guarantees:**

- **Atomicity**: All messages in transaction commit together or none commit
- **Isolation**: Consumers with `read_committed` only see committed messages
- **Durability**: Committed transactions survive broker failures

**Trade-offs vs other paths:**

| Aspect       | Transactional         | Consumer-Side Dedup      |
| ------------ | --------------------- | ------------------------ |
| Latency      | Higher (coordination) | Lower                    |
| Complexity   | Framework handles     | Application handles      |
| Cross-system | Kafka ecosystem only  | Works with any broker    |
| Recovery     | Automatic             | Manual offset management |

### Decision Framework

```mermaid
flowchart TD
    A[Need exactly-once?] --> B{Control consumer?}
    B -->|Yes| C{Operations naturally idempotent?}
    C -->|Yes| D[Path 1: Idempotent Operations]
    C -->|No| E{Using Kafka?}
    E -->|Yes| F{Read-transform-write?}
    F -->|Yes| G[Path 5: Transactions]
    F -->|No| H[Path 3: Idempotent Producer]
    E -->|No| I[Path 4: Consumer-Side Dedup]
    B -->|No| J{Exposing API?}
    J -->|Yes| K[Path 2: Idempotency Keys]
    J -->|No| L{Broker supports dedup?}
    L -->|Yes| M[Path 3: Broker-Side Dedup]
    L -->|No| N[Path 4: Consumer-Side Dedup]
```

## Production Implementations

### Kafka: Confluent's EOS

**Context:** Apache Kafka, originally developed at LinkedIn, now maintained by Confluent. Processes trillions of messages per day across major tech companies.

**Implementation choices:**

- Pattern variant: Idempotent producer + transactional processing
- Key customization: Producer ID (PID) with per-partition sequence numbers
- Scale: Tested at 1M+ messages/second with exactly-once guarantees

**Architecture:**

```mermaid
flowchart LR
    subgraph Producer
        P[App] --> IP[Idempotent Producer]
        IP -->|"PID + SeqNum"| B
    end

    subgraph Broker["Kafka Broker"]
        B[Leader] -->|"Check SeqNum"| D{Duplicate?}
        D -->|Yes| R[Reject]
        D -->|No| W[Write to Log]
    end

    subgraph Consumer
        W --> C[Consumer]
        C -->|"read_committed"| CP[Consumer Processing]
    end
```

**Specific details:**

- Broker assigns 64-bit Producer ID to each producer on init
- Sequence numbers are per topic-partition, 32-bit integers
- Broker maintains last 5 sequence numbers in memory (configurable)
- `transactional.id` persists PID across producer restarts
- Transaction coordinator manages two-phase commit for multi-partition writes

**What worked:**

- Zero-overhead idempotency when enabled by default (Kafka 3.0+)
- Transactional writes perform within 3% of non-transactional in benchmarks

**What was hard:**

- Transaction coordinator becomes single point of coordination
- `transactional.id` management across producer instances
- Consumer rebalancing during transaction can cause duplicates if not using `read_committed`

**Source:** [KIP-98 - Exactly Once Delivery and Transactional Messaging](https://cwiki.apache.org/confluence/display/KAFKA/KIP-98+-+Exactly+Once+Delivery+and+Transactional+Messaging)

### Stripe: Idempotency Keys

**Context:** Payment processing platform handling millions of API requests daily. A single duplicate charge causes real financial harm.

**Implementation choices:**

- Pattern variant: Client-generated idempotency keys with server-side caching
- Key customization: 24-hour retention, Redis-backed distributed cache
- Scale: Handles all Stripe API traffic with idempotency support

**Architecture:**

```mermaid
sequenceDiagram
    participant Client
    participant API as Stripe API
    participant Redis as Idempotency Store
    participant Core as Payment Core

    Client->>API: POST /charges (Idempotency-Key: abc123)
    API->>Redis: GET idem:abc123
    Redis-->>API: null (not found)
    API->>Redis: SET idem:abc123 {status: processing}
    API->>Core: Process charge
    Core-->>API: Charge result
    API->>Redis: SET idem:abc123 {status: done, response: ...}
    API-->>Client: 200 OK

    Note over Client,API: Network failure, client retries

    Client->>API: POST /charges (Idempotency-Key: abc123)
    API->>Redis: GET idem:abc123
    Redis-->>API: {status: done, response: ...}
    API-->>Client: 200 OK (Idempotent-Replayed: true)
```

**Specific details:**

- Keys are user-provided strings up to 255 characters
- Response cached includes status code, headers, and body
- `Idempotent-Replayed: true` header indicates cached response
- Keys in "processing" state return 409 Conflict on retry
- Separate Redis cluster for idempotency to isolate failure domains

**What worked:**

- Completely eliminates duplicate charges from network issues
- Clients can safely retry with exponential backoff
- No application logic changes needed for idempotent endpoints

**What was hard:**

- Determining correct 24-hour window (too short = duplicates, too long = storage cost)
- Handling partial failures (charge succeeded but idempotency record write failed)
- Cross-datacenter replication of idempotency store

**Source:** [Designing robust and predictable APIs with idempotency](https://stripe.com/blog/idempotency)

### Google Pub/Sub: Exactly-Once Delivery

**Context:** Google Cloud's managed messaging service. Added exactly-once delivery in December 2022.

**Implementation choices:**

- Pattern variant: Broker-side deduplication with acknowledgment tracking
- Key customization: Regional scope, unique message IDs
- Scale: Google-scale messaging with exactly-once in single region

**Specific details:**

- Exactly-once only within a single cloud region
- Uses unique message IDs assigned by Pub/Sub
- Subscribers receive acknowledgment confirmation (acknowledge succeeded or failed)
- Only pull subscriptions and StreamingPull API support exactly-once
- Push subscriptions do NOT support exactly-once

**What worked:**

- Eliminates need for application-level deduplication in many cases
- Ack confirmation tells subscriber definitively if message was processed

**What was hard:**

- **Regional constraint**: Cross-region subscribers may receive duplicates
- Push subscriptions excluded (no ack confirmation mechanism)
- Still requires idempotent handlers for regional failover scenarios

**Source:** [Cloud Pub/Sub exactly-once delivery](https://cloud.google.com/pubsub/docs/exactly-once-delivery)

### Implementation Comparison

| Aspect           | Kafka EOS               | Stripe Idempotency  | Pub/Sub Exactly-Once |
| ---------------- | ----------------------- | ------------------- | -------------------- |
| Variant          | Producer + transactions | Client keys + cache | Broker deduplication |
| Scope            | Kafka ecosystem         | Any HTTP client     | Single GCP region    |
| Latency impact   | 3% overhead             | Cache lookup        | Minimal              |
| Client changes   | Config only             | Add header          | None                 |
| Window           | Configurable            | 24 hours            | Regional             |
| Failure handling | Automatic rollback      | Manual retry        | Ack confirmation     |

## Common Pitfalls

### 1. Deduplication Window Expiry

**The mistake:** Retry timeout longer than deduplication window.

**Example:**

- Send message with ID "X" at T=0
- AWS SQS FIFO has 5-minute deduplication window
- Client retry policy: exponential backoff up to 10 minutes
- At T=6 minutes: client retries, SQS accepts as new message
- Result: Duplicate processing despite deduplication "guarantee"

**Solutions:**

- Ensure max retry delay < deduplication window
- Use exponential backoff with cap: `min(2^attempt * 100ms, windowSize * 0.8)`
- For critical operations: implement consumer-side deduplication as backup

### 2. Producer Restart Losing Sequence State

**The mistake:** Idempotent producer without `transactional.id` loses sequence state on restart.

**Example:**

- Kafka producer with `enable.idempotence=true` but no `transactional.id`
- Producer crashes after sending message with seq=42
- Producer restarts, gets new PID, sequence resets to 0
- Messages with seq 0-42 are accepted again as "new"
- Result: 43 duplicate messages

**Solutions:**

- Set `transactional.id` for producers that must survive restarts
- Or: accept potential duplicates and ensure consumer idempotency

### 3. Consumer Rebalancing Race Condition

**The mistake:** Processing message but not committing offset before rebalance.

**Example:**

- Consumer processes message from partition 0
- Before offset commit: rebalance triggered (session timeout, new consumer joins)
- Partition 0 reassigned to different consumer
- New consumer reads from last committed offset (before the processed message)
- Result: Message processed twice by two different consumers

**Solutions:**

- Use transactional consumers (offset committed with output)
- Implement idempotent consumer pattern (database constraint on message ID)
- Increase `session.timeout.ms` for slow processing
- Use cooperative rebalancing (`partition.assignment.strategy=CooperativeStickyAssignor`)

### 4. Assuming Idempotency Key Uniqueness

**The mistake:** Using predictable keys that collide across users/operations.

**Example:**

- Developer uses `orderId` as idempotency key
- User A creates order 12345, key = "12345"
- User B creates order 12345 in different tenant, same key = "12345"
- User B's request returns User A's cached response
- Result: Data leakage between tenants

**Solutions:**

- Include tenant/user ID in key: `{tenantId}:{operationId}`
- Use client-generated UUIDs (UUID v4)
- Never derive keys solely from user-provided identifiers

### 5. Idempotency for GET Requests

**The mistake:** Adding idempotency keys to read operations.

**Example:**

- Developer adds idempotency keys to all endpoints including GET
- GET /user/123 with key "abc" returns user data, cached
- User updates their profile
- GET /user/123 with key "abc" returns stale cached data
- Result: Clients see outdated data indefinitely

**Solutions:**

- Idempotency keys only for state-changing operations (POST, PUT, DELETE)
- GET requests are naturally idempotent—no key needed
- If caching reads, use standard HTTP caching (ETags, Cache-Control)

### 6. Clock Skew in Last-Write-Wins

**The mistake:** Using wall-clock timestamps for conflict resolution in distributed system.

**Example:**

- Node A (clock +100ms skew) writes value V1 at local time T1
- Node B (accurate clock) writes value V2 at local time T2
- T1 > T2 due to clock skew, but V2 was actually written later
- LWW comparison: V1 wins because T1 > T2
- Result: Causally later write (V2) is discarded

**Solutions:**

- Use Lamport timestamps or vector clocks instead of wall clocks
- Use hybrid logical clocks (HLC) for ordering with physical time hints
- Accept that LWW with physical clocks is eventually consistent, not causally consistent

## Implementation Guide

### Starting Point Decision

```mermaid
flowchart TD
    A[Need exactly-once?] --> B{Using message broker?}
    B -->|Yes| C{Which broker?}
    B -->|No| D{Exposing HTTP API?}

    C -->|Kafka| E[Use idempotent producer<br/>+ transactional consumer]
    C -->|AWS SQS| F[Use FIFO queue<br/>+ idempotent handler]
    C -->|RabbitMQ| G[Consumer-side dedup<br/>with database]
    C -->|Pub/Sub| H[Enable exactly-once<br/>+ idempotent handler]

    D -->|Yes| I[Implement idempotency keys<br/>à la Stripe]
    D -->|No| J[Design idempotent operations<br/>+ version vectors]
```

### When to Build Custom

**Build custom when:**

- Existing solutions don't fit your consistency requirements
- Cross-system exactly-once needed (Kafka → external database)
- Need longer deduplication windows than broker provides
- Performance requirements exceed library capabilities

**Implementation checklist:**

- [ ] Define deduplication key format (unique, collision-resistant)
- [ ] Choose deduplication storage (Redis, database, in-memory)
- [ ] Set deduplication window (longer than max retry delay)
- [ ] Implement atomic state update + dedup record insert
- [ ] Add cleanup job for expired deduplication records
- [ ] Test with network partition simulation
- [ ] Test with producer/consumer restart scenarios
- [ ] Document failure modes and recovery procedures

### Testing Exactly-Once

**Unit tests:**

- Same message ID processed twice → single state change
- Different message IDs → independent state changes
- Concurrent identical requests → single effect

**Integration tests:**

- Producer crash mid-send → no duplicates after restart
- Consumer crash mid-process → message reprocessed once
- Broker failover → no duplicates or losses

**Chaos testing:**

- Network partition between producer and broker
- Kill consumer during processing
- Slow consumer causing rebalance
- Clock skew between nodes

## Conclusion

Exactly-once delivery is a misnomer—true exactly-once is mathematically impossible in distributed systems. What we achieve is "effectively exactly-once": at-least-once delivery combined with idempotency mechanisms that ensure each message's effect occurs exactly once.

The key insight is that exactly-once is a **composition**, not a primitive:

1. Never lose messages (at-least-once delivery with retries and persistence)
2. Make duplicates harmless (idempotent operations, deduplication tracking, or transactional processing)

Choose your implementation based on your constraints:

- **Idempotent operations** when you control the state model
- **Idempotency keys** for external-facing APIs
- **Broker-side deduplication** when your broker supports it
- **Consumer-side deduplication** for maximum control and longer windows
- **Transactional processing** for Kafka consume-transform-produce patterns

Every approach has failure modes around the deduplication window. Design your retry policies to fit within the window, and consider layered approaches (broker + consumer deduplication) for critical paths.

## Appendix

### Prerequisites

- Understanding of distributed systems fundamentals (network failures, partial failures)
- Familiarity with message brokers (Kafka, SQS, or similar)
- Basic knowledge of database transactions

### Terminology

- **Idempotency**: Property where applying an operation multiple times produces the same result as applying it once
- **PID (Producer ID)**: Unique identifier assigned to a Kafka producer instance by the broker
- **Deduplication window**: Time period during which the system remembers message IDs for duplicate detection
- **EOS (Exactly-Once Semantics)**: Kafka's term for effectively exactly-once processing guarantees
- **2PC (Two-Phase Commit)**: Distributed transaction protocol that ensures atomic commits across multiple participants

### Summary

- True exactly-once delivery is impossible (Two Generals, FLP impossibility)
- "Exactly-once" means at-least-once delivery + idempotent consumption
- Five implementation paths: idempotent operations, idempotency keys, broker-side dedup, consumer-side dedup, transactional processing
- Every deduplication mechanism has a window—design retry policies accordingly
- Kafka EOS: idempotent producers (PID + sequence) + transactional consumers (`read_committed`)
- Stripe pattern: client-generated idempotency keys with 24-hour server-side cache
- Test with chaos: network partitions, restarts, rebalancing, clock skew

### References

- [KIP-98 - Exactly Once Delivery and Transactional Messaging](https://cwiki.apache.org/confluence/display/KAFKA/KIP-98+-+Exactly+Once+Delivery+and+Transactional+Messaging) - Kafka's exactly-once specification
- [KIP-129 - Streams Exactly-Once Semantics](https://cwiki.apache.org/confluence/display/KAFKA/KIP-129%3A+Streams+Exactly-Once+Semantics) - Kafka Streams exactly-once
- [Designing robust and predictable APIs with idempotency](https://stripe.com/blog/idempotency) - Stripe's idempotency key pattern
- [Implementing Stripe-like Idempotency Keys in Postgres](https://brandur.org/idempotency-keys) - Detailed implementation guide
- [Message Delivery Guarantees for Apache Kafka](https://docs.confluent.io/kafka/design/delivery-semantics.html) - Confluent official docs
- [Exactly-once Support in Apache Kafka](https://medium.com/@jaykreps/exactly-once-support-in-apache-kafka-55e1fdd0a35f) - Jay Kreps on Kafka EOS
- [The impossibility of exactly-once delivery](https://blog.bulloak.io/post/20200917-the-impossibility-of-exactly-once/) - Theoretical foundations
- [You Cannot Have Exactly-Once Delivery](https://bravenewgeek.com/you-cannot-have-exactly-once-delivery/) - Why true exactly-once is impossible
- [Cloud Pub/Sub exactly-once delivery](https://cloud.google.com/pubsub/docs/exactly-once-delivery) - Google Pub/Sub implementation
- [AWS SQS FIFO exactly-once processing](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues-exactly-once-processing.html) - AWS implementation
- [Reliable Microservices Data Exchange With the Outbox Pattern](https://debezium.io/blog/2019/02/19/reliable-microservices-data-exchange-with-the-outbox-pattern/) - Outbox pattern with CDC
- [Idempotent Consumer Pattern](https://microservices.io/patterns/communication-style/idempotent-consumer.html) - Microservices.io pattern reference
