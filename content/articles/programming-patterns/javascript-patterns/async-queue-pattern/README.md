# Async Queue Pattern in JavaScript

---

image: ./async-task-queue.svg
imageCredit: Async Task Queue and Executors

---

Build resilient, scalable asynchronous task processing systems from basic in-memory queues to advanced distributed patterns using Node.js.

<figure>

```mermaid
graph LR
    %% Task Queue
    subgraph "Task Queue"
        T1[Task 1]
        T2[Task 2]
        T3[Task 3]
        T4[Task 4]
        T5[Task 5]
    end

    %% Executors
    E1[Executor 1]
    E2[Executor 2]
    E3[Executor 3]

    %% Connections
    T1 --> E1
    T2 --> E2
    T3 --> E3
    T4 --> E1
    T5 --> E2

    %% Styling
    classDef taskClass fill:#ffcc00,stroke:#000,stroke-width:2px
    classDef executorClass fill:#00ccff,stroke:#000,stroke-width:2px
    classDef queueClass fill:#e0e0e0,stroke:#000,stroke-width:2px

    class T1,T2,T3,T4,T5 taskClass
    class E1,E2,E3 executorClass
```

<figcaption>Asynchronous task queue architecture showing task distribution across multiple executors</figcaption>

</figure>

## TLDR

**Asynchronous task queues** provide controlled concurrency and reliable task processing in Node.js, from simple in-memory queues for local parallelism to distributed systems with Redis-backed durability and multi-worker scaling.

### In-Memory Task Queues

- **p-queue**: Promise-based with concurrency control, priority support, timeout handling—recommended for most local use cases ([npm](https://www.npmjs.com/package/p-queue))
- **fastq**: Fastest in-memory queue, minimal footprint, good for high-volume processing ([GitHub](https://github.com/mcollina/fastq))
- **Event loop aware**: Queues yield to event loop between tasks; avoid sync-heavy processors that block

### Distributed Task Queues

- **BullMQ**: Production-grade Redis-backed queue with retries, priorities, rate limiting, delayed jobs, and flow support ([docs](https://docs.bullmq.io/))
- **Agenda**: MongoDB-backed scheduler for job scheduling and recurring tasks ([GitHub](https://github.com/agenda/agenda))
- **Temporal**: Workflow orchestration for complex multi-step processes with state persistence ([temporal.io](https://temporal.io/))

### Architecture Components

- **Producer**: Enqueues tasks with payload and metadata (priority, delay, retry config)
- **Broker**: Persistent message store (Redis for BullMQ, Kafka for event streaming)
- **Worker**: Dequeues and processes tasks with concurrency control and error handling
- **Dead Letter Queue**: Captures tasks that exceed retry attempts for manual inspection

### Resilience Patterns

- **Exponential backoff**: `delay = min(cap, base × 2^attempt)` with jitter to prevent thundering herd
- **Idempotent consumers**: Use unique job IDs with deduplication to handle at-least-once delivery safely
- **Transactional outbox**: Write events to outbox table in same transaction as business data; relay process publishes ([microservices.io](https://microservices.io/patterns/data/transactional-outbox.html))
- **Circuit breaker**: Pause queue processing when downstream failure rate exceeds threshold

### Saga Pattern for Distributed Transactions

- **Choreography**: Services react to events autonomously; decoupled but harder to trace ([microservices.io](https://microservices.io/patterns/data/saga.html))
- **Orchestration**: Central coordinator directs saga steps; explicit flow but single point of coordination
- **Compensating actions**: Each step has corresponding rollback action for failure recovery

### Library Comparison

| Library  | Backing Store              | Use Case                       |
| -------- | -------------------------- | ------------------------------ |
| p-queue  | In-memory                  | Local concurrency control      |
| BullMQ   | Redis                      | Production distributed queue   |
| Agenda   | MongoDB                    | Scheduled/recurring jobs       |
| Temporal | PostgreSQL/MySQL/Cassandra | Complex workflow orchestration |
| Kafka    | Kafka                      | Event streaming, CQRS          |

### Performance Considerations

- **Concurrency tuning**: Set based on downstream capacity and resource constraints
- **Batch processing**: Group related tasks for reduced overhead
- **Stalled job detection**: BullMQ's lock-based mechanism detects worker crashes
- **Metrics**: Track queue depth, processing latency, retry rate, DLQ size

## Part 1: The Foundation of Asynchronous Execution

### 1.1 The Event Loop and In-Process Concurrency

At the core of Node.js is a single-threaded, event-driven architecture. This model is highly efficient for I/O-bound operations but presents a challenge for long-running or CPU-intensive tasks, which can block the main thread and render an application unresponsive.

<figure>

```mermaid
graph TD
    subgraph "Event Loop Phases"
        T[1. Timers]
        PC[2. Pending Callbacks]
        IP[3. Idle/Prepare]
        P[4. Poll]
        C[5. Check]
        CL[6. Close Callbacks]
    end

    subgraph "Queues"
        MQ[Microtask Queue]
    end

    T --> PC --> IP --> P --> C --> CL --> T
    MQ -.->|After each phase| T
    MQ -.->|After each phase| PC
    MQ -.->|After each phase| P
    MQ -.->|After each phase| C
    MQ -.->|After each phase| CL

    classDef phaseClass fill:#99ccff,stroke:#000,stroke-width:2px
    classDef microClass fill:#ffcc99,stroke:#000,stroke-width:2px

    class T,PC,IP,P,C,CL phaseClass
    class MQ microClass
```

<figcaption>Node.js event loop phases execute sequentially, with microtasks processed between each phase</figcaption>

</figure>

The Event Loop orchestrates execution between the Call Stack, where synchronous code runs, and various queues that hold callbacks for asynchronous operations. When an async operation completes, its callback is placed in a queue. The Event Loop monitors the Call Stack and processes tasks from these queues when it becomes empty.

**Event Loop Phases** ([Node.js Docs](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)):

The event loop executes in six phases: timers → pending callbacks → idle/prepare → poll → check → close callbacks. Each phase has a FIFO queue of callbacks to execute.

- **Microtask Queue**: Holds Promise callbacks (`.then()`, `.catch()`). The `process.nextTick()` queue processes after the current operation completes, regardless of current phase. Both run before the event loop continues—higher priority than macrotasks.
- **Macrotask Queues**: Phase-specific queues hold callbacks from timers, I/O operations, `setImmediate()`, and close events.

### 1.2 In-Memory Task Queues: Controlling Local Concurrency

For many applications, the first step beyond simple callbacks is an in-memory task queue. The goal is to manage and throttle the execution of asynchronous tasks within a single process, such as controlling concurrent requests to a third-party API to avoid rate limiting.

```ts file=./2025-01-24-code-sample.ts collapse={1-1, 45-95, 97-114}

```

> **Note**: This implementation uses [`Promise.withResolvers()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers) (Baseline 2024) to cleanly separate promise creation from resolution.

This implementation provides basic control over local asynchronous operations. However, it has critical limitations for production systems:

- **No Persistence**: Jobs are lost if the process crashes
- **No Distribution**: Cannot be shared across multiple processes or servers
- **Limited Features**: Lacks advanced features like retries, prioritization, or detailed monitoring

## Part 2: The Ideology of Distributed Async Task Queues

To build scalable and reliable Node.js applications, especially in a microservices architecture, tasks must be offloaded from the main application thread and managed by a system that is both persistent and distributed.

### 2.1 Distributed Architecture Components

<figure>

```mermaid
graph LR
    subgraph "Producer"
        P1[API Server]
        P2[Background Job]
        P3[Event Handler]
    end

    subgraph "Message Broker"
        MB[(Redis/Database)]
    end

    subgraph "Consumers"
        W1[Worker 1]
        W2[Worker 2]
        W3[Worker 3]
    end

    P1 --> MB
    P2 --> MB
    P3 --> MB
    MB --> W1
    MB --> W2
    MB --> W3

    classDef producerClass fill:#ffcc99,stroke:#000,stroke-width:2px
    classDef brokerClass fill:#cc99ff,stroke:#000,stroke-width:2px
    classDef workerClass fill:#99ffcc,stroke:#000,stroke-width:2px

    class P1,P2,P3 producerClass
    class MB brokerClass
    class W1,W2,W3 workerClass
```

<figcaption>Distributed architecture components showing the relationship between producers, message broker, and consumers</figcaption>

</figure>

A distributed task queue system consists of three main components:

1. **Producers**: Application components that create jobs and add them to a queue
2. **Message Broker**: A central, persistent data store (like Redis or a database) that holds the queue of jobs
3. **Consumers (Workers)**: Separate processes that pull jobs from the queue and execute them

**Key Benefits:**

- **Decoupling**: Producers and consumers operate independently
- **Reliability**: Jobs are persisted in the message broker
- **Scalability**: Multiple worker processes can handle increased load (Competing Consumers pattern)

### 2.2 Node.js Task Queue Libraries Comparison

| Library       | Backend | Core Philosophy & Strengths                               | Key Features                                                                                    |
| ------------- | ------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **BullMQ**    | Redis   | Modern, robust, high-performance queue system             | Job dependencies (flows), rate limiting, repeatable jobs, priority queues, sandboxed processors |
| **Bee-Queue** | Redis   | Simple, fast, lightweight for real-time, short-lived jobs | Atomic operations, job timeouts, configurable retries, event-driven processing                  |
| **Agenda**    | MongoDB | Flexible job scheduling with cron-based intervals         | Cron scheduling, concurrency control per job, job priorities, web UI (Agendash)                 |

### 2.3 Implementing with BullMQ

**Producer: Adding a Job to the Queue**

```typescript title="producer.ts" collapse={1-5}
import { Queue } from "bullmq"

// Connect to a local Redis instance
const emailQueue = new Queue("email-processing")

async function queueEmailJob(userId: number, template: string) {
  await emailQueue.add("send-email", { userId, template })
  console.log(`Job queued for user ${userId}`)
}

queueEmailJob(123, "welcome-email")
```

**Worker: Processing the Job**

```typescript title="worker.ts" collapse={1-2}
import { Worker } from "bullmq"

const emailWorker = new Worker(
  "email-processing",
  async (job) => {
    const { userId, template } = job.data
    console.log(`Processing email for user ${userId} with template ${template}`)

    // Simulate sending an email
    await new Promise((resolve) => setTimeout(resolve, 2000))
    console.log(`Email sent to user ${userId}`)
  },
  {
    // Concurrency defines how many jobs this worker can process in parallel
    concurrency: 5,
  },
)

console.log("Email worker started...")
```

## Part 3: Engineering for Failure: Adding Resilience

In any distributed system, failures are not an exception but an expected part of operations. A resilient system must anticipate and gracefully handle these failures.

### 3.1 Retries with Exponential Backoff and Jitter

When a task fails due to a transient issue, the simplest solution is to retry it. However, naive immediate retries can create a "thundering herd" problem that worsens the situation.

<figure>

```mermaid
graph LR
    subgraph "Exponential Backoff with Jitter"
        T1[1s + random]
        T2[2s + random]
        T3[4s + random]
        T4[8s + random]
    end

    T1 --> T2
    T2 --> T3
    T3 --> T4

    classDef timeClass fill:#ffcc00,stroke:#000,stroke-width:2px
    class T1,T2,T3,T4 timeClass
```

<figcaption>Exponential backoff with jitter showing progressive delay increases with randomization to prevent thundering herd</figcaption>

</figure>

**Exponential Backoff Strategy:**

- Delay increases exponentially: 1s, 2s, 4s, 8s
- Retries quickly for brief disruptions
- Gives overwhelmed systems meaningful recovery periods

**Jitter Implementation:**

- Adds random time to backoff delay
- Desynchronizes retry attempts from different clients
- Smooths load on downstream services

```typescript title="producer.ts"
await apiCallQueue.add(
  "call-flaky-api",
  { some: "data" },
  {
    attempts: 5, // Retry up to 4 times (5 attempts total)
    backoff: {
      type: "exponential",
      delay: 1000, // 1000ms, 2000ms, 4000ms, 8000ms
    },
  },
)
```

### 3.2 Dead Letter Queue Pattern

Some messages are inherently unprocessable due to malformed data or persistent bugs in consumer logic. These "poison messages" can get stuck in infinite retry loops.

<figure>

```mermaid
graph LR
    subgraph "Main Queue"
        MQ[(Main Queue)]
    end

    subgraph "Processing"
        W[Worker]
    end

    subgraph "Dead Letter Queue"
        DLQ[(DLQ)]
    end

    MQ --> W
    W -->|Success| MQ
    W -->|Failed > Max Attempts| DLQ

    classDef queueClass fill:#e0e0e0,stroke:#000,stroke-width:2px
    classDef workerClass fill:#00ccff,stroke:#000,stroke-width:2px
    classDef dlqClass fill:#ff6666,stroke:#000,stroke-width:2px

    class MQ queueClass
    class W workerClass
    class DLQ dlqClass
```

<figcaption>Dead letter queue pattern showing how failed messages are moved to a separate queue after maximum retry attempts</figcaption>

</figure>

The Dead Letter Queue (DLQ) pattern moves messages to a separate queue after a configured number of processing attempts have failed. This isolates problematic messages, allowing the main queue to continue functioning.

### 3.3 Idempotent Consumers

Most distributed messaging systems offer at-least-once delivery guarantees, meaning messages might be delivered more than once under certain failure conditions.

```typescript title="idempotent-consumer.ts" collapse={1-3}
import { Worker } from "bullmq"
import { db } from "./database"

const idempotentWorker = new Worker("user-registration", async (job) => {
  const { userId, userData } = job.data

  // Check if already processed
  const existingUser = await db.users.findByPk(userId)
  if (existingUser) {
    console.log(`User ${userId} already exists, skipping`)
    return
  }

  // Process in transaction to ensure atomicity
  await db.transaction(async (t) => {
    await db.users.create(userData, { transaction: t })
    await db.processedJobs.create(
      {
        jobId: job.id,
        processedAt: new Date(),
      },
      { transaction: t },
    )
  })

  console.log(`User ${userId} registered successfully`)
})
```

## Part 4: Advanced Architectural Patterns

### 4.1 Transactional Outbox Pattern

A common challenge in event-driven architectures is ensuring that database updates and event publishing happen atomically.

<figure>

```mermaid
graph TD
    subgraph "Application"
        A[Application Service]
        DB[(Database)]
        OT[Outbox Table]
    end

    subgraph "Message Relay"
        MR[Message Relay Process]
        MB[Message Broker]
    end

    A -->|1. Business Transaction| DB
    DB -->|2. Write Event| OT
    MR -->|3. Read Events| OT
    MR -->|4. Publish Events| MB

    classDef appClass fill:#ffcc99,stroke:#000,stroke-width:2px
    classDef dbClass fill:#cc99ff,stroke:#000,stroke-width:2px
    classDef relayClass fill:#99ffcc,stroke:#000,stroke-width:2px

    class A appClass
    class DB,OT dbClass
    class MR,MB relayClass
```

<figcaption>Transactional outbox pattern showing how database transactions and event publishing are coordinated atomically</figcaption>

</figure>

The Transactional Outbox pattern writes events to an "outbox" table within the same database transaction as business data. A separate message relay process then reads from this table and publishes events to the message broker.

```typescript title="transactional-outbox.ts"
async function createUserWithEvent(userData: UserData) {
  return await db.transaction(async (t) => {
    // 1. Create user
    const user = await db.users.create(userData, { transaction: t })

    // 2. Write event to outbox in same transaction
    await db.outbox.create(
      {
        eventType: "USER_CREATED",
        eventData: { userId: user.id, ...userData },
        status: "PENDING",
      },
      { transaction: t },
    )

    return user
  })
}
```

### 4.2 Saga Pattern for Distributed Transactions

In microservices architecture, coordinating updates across multiple services requires the Saga pattern.

<figure>

```mermaid
graph LR
    subgraph "Choreography Saga"
        S1[Service 1]
        S2[Service 2]
        S3[Service 3]
        S4[Service 4]
    end

    S1 -->|Event| S2
    S2 -->|Event| S3
    S3 -->|Event| S4
    S4 -->|Compensation Event| S3
    S3 -->|Compensation Event| S2
    S2 -->|Compensation Event| S1

    classDef serviceClass fill:#ffcc99,stroke:#000,stroke-width:2px
    class S1,S2,S3,S4 serviceClass
```

<figcaption>Choreography saga pattern showing event-driven communication between services with compensation events for rollback</figcaption>

</figure>

**Saga Implementation Types:**

1. **Choreography**: Services communicate via events without central controller
   - Highly decoupled
   - Harder to debug (workflow logic distributed)

2. **Orchestration**: Central orchestrator manages workflow
   - Centralized logic, easier to monitor
   - Potential single point of failure

```typescript title="saga-orchestrator.ts" collapse={23-29}
class OrderSagaOrchestrator {
  async executeOrderSaga(orderData: OrderData) {
    try {
      // Step 1: Reserve inventory
      await this.reserveInventory(orderData.items)

      // Step 2: Process payment
      await this.processPayment(orderData.payment)

      // Step 3: Create shipping label
      await this.createShippingLabel(orderData.shipping)

      // Step 4: Confirm order
      await this.confirmOrder(orderData.id)
    } catch (error) {
      // Execute compensating transactions
      await this.compensateOrderSaga(orderData, error)
    }
  }

  private async compensateOrderSaga(orderData: OrderData, error: Error) {
    // Reverse operations in reverse order
    await this.cancelShippingLabel(orderData.shipping)
    await this.refundPayment(orderData.payment)
    await this.releaseInventory(orderData.items)
  }
}
```

### 4.3 Event Sourcing and CQRS with Kafka

For applications requiring full audit history, Event Sourcing stores immutable sequences of state-changing events.

<figure>

```mermaid
graph TD
    subgraph "Write Side"
        C[Command Handler]
        ES[Event Store]
        W[Write Model]
    end

    subgraph "Read Side"
        Q[Query Handler]
        MV[Materialized Views]
        R[Read Model]
    end

    C --> ES
    ES --> W
    ES --> MV
    MV --> R
    Q --> R

    classDef writeClass fill:#ffcc99,stroke:#000,stroke-width:2px
    classDef readClass fill:#99ffcc,stroke:#000,stroke-width:2px
    classDef storeClass fill:#cc99ff,stroke:#000,stroke-width:2px

    class C,W writeClass
    class Q,R readClass
    class ES,MV storeClass
```

<figcaption>Event sourcing and CQRS architecture showing the separation between write and read sides with event store as the source of truth</figcaption>

</figure>

Apache Kafka's durable, replayable log is ideal for event stores. Key features include log compaction, which retains the last known value for each message key.

```typescript title="event-sourcing-example.ts" collapse={17-28}
class UserEventStore {
  async appendEvent(userId: string, event: UserEvent) {
    await kafka.produce({
      topic: "user-events",
      key: userId,
      value: JSON.stringify({
        eventId: uuid(),
        userId,
        eventType: event.type,
        eventData: event.data,
        timestamp: new Date().toISOString(),
      }),
    })
  }

  async getUserEvents(userId: string): Promise<UserEvent[]> {
    const events = await kafka.consume({
      topic: "user-events",
      key: userId,
    })
    return events.map((event) => JSON.parse(event.value))
  }

  async getUserState(userId: string): Promise<UserState> {
    const events = await this.getUserEvents(userId)
    return events.reduce(this.applyEvent, {})
  }
}
```

## References

- [MDN With Resolvers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Node.js Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)
- [Saga Pattern](https://microservices.io/patterns/data/saga.html)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Transactional Outbox](https://microservices.io/patterns/data/transactional-outbox.html)
