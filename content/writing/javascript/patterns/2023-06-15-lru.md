---
lastUpdatedOn: 2023-03-21
tags:
  - js
  - ts
  - caching
  - dsa
  - data-structures
  - algorithms
  - performance
  - system-design
  - architecture
  - backend
---

# LRU Cache and Modern Alternatives

Learn the classic LRU cache implementation, understand its limitations, and explore modern alternatives like LRU-K, 2Q, and ARC for building high-performance caching systems.


- [The Classic: Understanding LRU](#the-classic-understanding-lru)
- [LRU Implementation: O(1) Magic](#lru-implementation-o1-magic)
- [When LRU Fails: The Achilles' Heel](#when-lru-fails-the-achilles-heel)
- [Beyond LRU: Modern Alternatives](#beyond-lru-modern-alternatives)
  - [LRU-K: Adding Frequency Memory](#lru-k-adding-frequency-memory)
  - [2Q: The Probationary Filter](#2q-the-probationary-filter)
  - [ARC: Self-Tuning Intelligence](#arc-self-tuning-intelligence)
- [Real-World Applications](#real-world-applications)
- [Performance Comparison](#performance-comparison)
- [Conclusion](#conclusion)

## The Classic: Understanding LRU

The **Least Recently Used (LRU)** cache is one of the most fundamental and widely-used caching algorithms. The principle is simple and intuitive: when the cache is full, evict the item that has been accessed the least recently. This is based on the principle of **temporal locality**—the observation that data you've used recently is likely to be needed again soon.

LRU operates on the assumption that recently accessed items are more likely to be accessed again in the near future. This makes it particularly effective for workloads with strong temporal locality, such as web browsing, file system access, and many database operations.

## LRU Implementation: O(1) Magic

To be effective, a cache needs to be fast. The two core operations, `get` (retrieving an item) and `put` (adding or updating an item), must be executed in constant time, or O(1). A naive implementation using just an array would require a linear scan (O(n)) to find the least recently used item, which is far too slow.

The classic, high-performance LRU solution combines two data structures:

- **A Hash Map**: This provides the O(1) lookup. The map stores a key that points directly to a node in a linked list.
- **A Doubly Linked List (DLL)**: This maintains the usage order. The head of the list is the Most Recently Used (MRU) item, and the tail is the Least Recently Used (LRU) item.

When an item is accessed (`get`) or added (`put`), it's moved to the head of the DLL. When the cache is full, the item at the tail is evicted. This combination gives both operations the desired O(1) time complexity.

<figure>

```mermaid
graph LR
    %% Hashmap section
    subgraph HashMap ["Hashmap for O(1) access"]
        K1["K1"]
        K2["K2"]
        K3["K3"]
        K4["K4"]
        K5["K5"]
    end

    %% Doubly linked list section
    subgraph DLL ["Doubly Linked List for Order"]
        N1["N1<br/>Key: K1<br/>Value: V1"]
        N2["N2<br/>Key: K2<br/>Value: V2"]
        N3["N3<br/>Key: K3<br/>Value: V3"]
        N4["N4<br/>Key: K4<br/>Value: V4"]
        N5["N5<br/>Key: K5<br/>Value: V5"]
    end

    %% Connections from hashmap to nodes
    K1 --> N1
    K2 --> N2
    K3 --> N3
    K4 --> N4
    K5 --> N5

    %% Doubly linked list connections
    N1 <--> N2
    N2 <--> N3
    N3 <--> N4
    N4 <--> N5

    %% Head and Tail pointers
    Head["Head"] --> N1
    Tail["Tail"] --> N5

    %% Styling
    classDef hashmapStyle fill:#dae8fc,stroke:#6c8ebf,stroke-width:2px
    classDef nodeStyle fill:#fff2cc,stroke:#d6b656,stroke-width:2px
    classDef pointerStyle fill:#f8cecc,stroke:#b85450,stroke-width:2px

    class K1,K2,K3,K4,K5 hashmapStyle
    class N1,N2,N3,N4,N5 nodeStyle
    class Head,Tail pointerStyle
```

<figcaption>LRU Data Structure - hashmap with Doubly linked list</figcaption>
</figure>

### Implementation 1: Utilizing JavaScript Map's Insertion Order

```ts
class LRUCache<K, V> {
  capacity: number
  cache: Map<K, V>

  constructor(capacity: number) {
    this.capacity = capacity
    this.cache = new Map()
  }

  get(key: K): V | null {
    if (!this.cache.has(key)) {
      return null
    } else {
      const value = this.cache.get(key)!
      // Remove and re-insert to move to end (most recently used)
      this.cache.delete(key)
      this.cache.set(key, value)
      return value
    }
  }

  put(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing key - remove and re-insert
      this.cache.delete(key)
    } else if (this.cache.size >= this.capacity) {
      // Remove least recently used (first key in Map)
      const keyToRemove = this.cache.keys().next().value
      this.cache.delete(keyToRemove)
    }
    this.cache.set(key, value)
  }
}
```

### Implementation 2: Classic Doubly Linked List & Hash Map

```ts collapse={46-106}
class LRUCache {
  capacity: number
  cache: Map<number, ListNode>
  list: DoublyLinkedList

  constructor(capacity: number) {
    this.capacity = capacity
    this.cache = new Map()
    this.list = new DoublyLinkedList()
  }

  get(key: number): number {
    if (!this.cache.has(key)) {
      return -1
    } else {
      const node = this.cache.get(key)!
      // Move to head (most recently used)
      this.list.removeNode(node)
      this.list.addToHead(node)
      return node.value
    }
  }

  put(key: number, value: number): void {
    if (this.cache.has(key)) {
      // Update existing key
      const node = this.cache.get(key)!
      node.value = value
      this.list.removeNode(node)
      this.list.addToHead(node)
    } else {
      if (this.cache.size >= this.capacity) {
        // Remove least recently used (tail)
        const removed = this.list.removeTail()
        if (removed) {
          this.cache.delete(removed.key)
        }
      }
      const node = new ListNode(key, value)
      this.list.addToHead(node)
      this.cache.set(key, node)
    }
  }
}

class ListNode {
  key: number
  value: number
  prev: ListNode | null
  next: ListNode | null

  constructor(key: number, value: number) {
    this.key = key
    this.value = value
    this.prev = null
    this.next = null
  }
}

class DoublyLinkedList {
  head: ListNode | null
  tail: ListNode | null

  constructor() {
    this.head = null
    this.tail = null
  }

  addToHead(node: ListNode): void {
    node.next = this.head
    if (this.head) {
      this.head.prev = node
    }
    this.head = node
    if (!this.tail) {
      this.tail = node
    }
  }

  removeNode(node: ListNode): void {
    if (node === this.head) {
      this.head = node.next
    } else if (node === this.tail) {
      this.tail = node.prev
    } else {
      if (node.prev) node.prev.next = node.next
      if (node.next) node.next.prev = node.prev
    }
  }

  removeTail(): ListNode | null {
    if (this.tail) {
      const removed = this.tail
      if (this.head === this.tail) {
        this.head = null
        this.tail = null
      } else {
        this.tail = this.tail.prev
        if (this.tail) {
          this.tail.next = null
        }
      }
      return removed
    }
    return null
  }
}
```

## When LRU Fails: The Achilles' Heel

LRU's greatest strength is its simplicity, but this is also its greatest weakness. It equates "most recently used" with "most important," an assumption that breaks down catastrophically under a common workload: the **sequential scan**.

Imagine a database performing a full table scan or an application looping over a large dataset that doesn't fit in memory. As each new, single-use item is accessed, LRU dutifully places it at the front of the cache, evicting a potentially valuable, frequently-used item from the tail. This process, known as **cache pollution**, systematically flushes the cache of its "hot" data and fills it with "cold" data that will never be used again.

Once the scan is over, the cache is useless, and the application suffers a storm of misses as it tries to reload its true working set. This fundamental flaw is the primary driver behind the evolution of more advanced algorithms.

### Common LRU Failure Scenarios:

1. **Database Full Table Scans**: Large analytics queries that touch every row
2. **File System Traversals**: Walking through directory structures
3. **Batch Processing**: Processing large datasets sequentially
4. **Memory-Mapped File Access**: Sequential reading of large files

## Beyond LRU: Modern Alternatives

To overcome LRU's weaknesses, computer scientists developed policies that incorporate more information than just recency. These algorithms aim to be scan-resistant while retaining low overhead.

### LRU-K: Adding Frequency Memory

LRU-K extends the classic LRU by tracking the timestamps of the last K accesses for each item. The eviction decision is based on the K-th most recent access time, providing better resistance to cache pollution.

**How it Works**: An item is considered "hot" and worth keeping only if it has been accessed at least K times. This allows the algorithm to distinguish between items with a proven history of use and single-use items from a scan.

**Key Advantages**:

- **Scan Resistance**: Items in a sequential scan are typically accessed only once and are evicted quickly
- **Frequency Awareness**: Distinguishes between truly popular items and recently accessed ones
- **Backward Compatibility**: LRU-1 is equivalent to classic LRU

**Trade-offs**: The choice of K is critical and workload-dependent. If K is too large, legitimate items might be evicted before they are accessed K times; if it's too small, the algorithm degenerates back to LRU.

```ts
class LRUKCache {
  capacity: number
  k: number
  cache: Map<number, { value: number; accessTimes: number[] }>

  constructor(capacity: number, k: number = 2) {
    this.capacity = capacity
    this.k = k
    this.cache = new Map()
  }

  get(key: number): number {
    if (!this.cache.has(key)) {
      return -1
    }

    const item = this.cache.get(key)!
    const now = Date.now()

    // Add current access time
    item.accessTimes.push(now)

    // Keep only the last K access times
    if (item.accessTimes.length > this.k) {
      item.accessTimes.shift()
    }

    return item.value
  }

  put(key: number, value: number): void {
    const now = Date.now()

    if (this.cache.has(key)) {
      const item = this.cache.get(key)!
      item.value = value
      item.accessTimes.push(now)
      if (item.accessTimes.length > this.k) {
        item.accessTimes.shift()
      }
    } else {
      if (this.cache.size >= this.capacity) {
        this.evictLRU()
      }
      this.cache.set(key, { value, accessTimes: [now] })
    }
  }

  private evictLRU(): void {
    let oldestTime = Infinity
    let keyToEvict = -1

    for (const [key, item] of this.cache) {
      if (item.accessTimes.length < this.k) {
        // Items with fewer than K accesses are evicted first
        if (item.accessTimes[0] < oldestTime) {
          oldestTime = item.accessTimes[0]
          keyToEvict = key
        }
      } else {
        // For items with K+ accesses, use K-th most recent access
        const kthAccess = item.accessTimes[item.accessTimes.length - this.k]
        if (kthAccess < oldestTime) {
          oldestTime = kthAccess
          keyToEvict = key
        }
      }
    }

    if (keyToEvict !== -1) {
      this.cache.delete(keyToEvict)
    }
  }
}
```

### 2Q: The Probationary Filter

The 2Q (Two Queue) algorithm provides similar scan resistance to LRU-K but with a simpler, constant-time implementation. It acts like a bouncer, only letting items into the main cache after they've proven their worth.

**How it Works**: 2Q uses two buffers:

- **A1 (Probationary Queue)**: FIFO queue for first-time accesses
- **Am (Main Cache)**: LRU cache for proven items

When an item is accessed for the first time, it's placed in the A1 probationary queue. If it's accessed again while in A1, it gets promoted to the main Am cache. If it's never re-referenced, it simply falls off the end of the A1 queue without ever polluting the main cache.

**Key Advantages**:

- **Simple O(1) Operations**: Avoids the complexity of LRU-K
- **Effective Filtering**: Prevents scan pollution effectively
- **Tunable**: Queue sizes can be adjusted based on workload

```ts
class TwoQueueCache {
  capacity: number
  a1Size: number
  amSize: number

  // A1: probationary queue (FIFO)
  a1: Map<number, { value: number; timestamp: number }>

  // Am: main cache (LRU)
  am: Map<number, { value: number; timestamp: number }>

  constructor(capacity: number) {
    this.capacity = capacity
    this.a1Size = Math.floor(capacity * 0.25) // 25% for probationary
    this.amSize = capacity - this.a1Size
    this.a1 = new Map()
    this.am = new Map()
  }

  get(key: number): number {
    // Check main cache first
    if (this.am.has(key)) {
      const item = this.am.get(key)!
      item.timestamp = Date.now()
      return item.value
    }

    // Check probationary queue
    if (this.a1.has(key)) {
      const item = this.a1.get(key)!
      // Promote to main cache
      this.a1.delete(key)
      this.am.set(key, { value: item.value, timestamp: Date.now() })

      // Ensure main cache doesn't exceed capacity
      if (this.am.size > this.amSize) {
        this.evictFromAm()
      }

      return item.value
    }

    return -1
  }

  put(key: number, value: number): void {
    // If already in main cache, update
    if (this.am.has(key)) {
      this.am.set(key, { value, timestamp: Date.now() })
      return
    }

    // If in probationary queue, promote
    if (this.a1.has(key)) {
      this.a1.delete(key)
      this.am.set(key, { value, timestamp: Date.now() })

      if (this.am.size > this.amSize) {
        this.evictFromAm()
      }
      return
    }

    // New item goes to probationary queue
    this.a1.set(key, { value, timestamp: Date.now() })

    if (this.a1.size > this.a1Size) {
      this.evictFromA1()
    }
  }

  private evictFromA1(): void {
    // Remove oldest item from A1 (FIFO)
    let oldestKey = -1
    let oldestTime = Infinity

    for (const [key, item] of this.a1) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp
        oldestKey = key
      }
    }

    if (oldestKey !== -1) {
      this.a1.delete(oldestKey)
    }
  }

  private evictFromAm(): void {
    // Remove least recently used from Am (LRU)
    let oldestKey = -1
    let oldestTime = Infinity

    for (const [key, item] of this.am) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp
        oldestKey = key
      }
    }

    if (oldestKey !== -1) {
      this.am.delete(oldestKey)
    }
  }
}
```

### ARC: Self-Tuning Intelligence

The Adaptive Replacement Cache (ARC) represents a major leap forward. It is a self-tuning algorithm that dynamically balances between recency (like LRU) and frequency (like LFU) based on the current workload, eliminating the need for manual tuning.

**How it Works**: ARC maintains two LRU lists of items that are actually in the cache:

- **T1**: Pages seen only once recently (prioritizing recency)
- **T2**: Pages seen at least twice recently (prioritizing frequency)

**The "Ghost List" Innovation**: The key to ARC's adaptiveness is its use of two additional "ghost lists" (B1 and B2) that store only the keys of recently evicted items from T1 and T2, respectively. These lists act as a short-term memory of eviction decisions.

**The Learning Rule**: If a requested item is not in the cache but is found on the B1 ghost list, it means ARC made a mistake by evicting a recently-seen item. It learns from this and increases the size of the T1 (recency) cache. Conversely, a hit on the B2 ghost list signals that a frequently-used item was wrongly evicted, so ARC increases the size of the T2 (frequency) cache.

This constant feedback loop allows ARC to learn from its mistakes and dynamically adapt its strategy to the workload in real-time.

```ts
class ARCCache {
  capacity: number
  p: number // Adaptation parameter

  // Main cache lists
  t1: Map<number, { value: number; timestamp: number }> // Recently accessed once
  t2: Map<number, { value: number; timestamp: number }> // Recently accessed multiple times

  // Ghost lists (keys only)
  b1: Set<number> // Recently evicted from T1
  b2: Set<number> // Recently evicted from T2

  constructor(capacity: number) {
    this.capacity = capacity
    this.p = 0
    this.t1 = new Map()
    this.t2 = new Map()
    this.b1 = new Set()
    this.b2 = new Set()
  }

  get(key: number): number {
    // Check T1
    if (this.t1.has(key)) {
      const item = this.t1.get(key)!
      this.t1.delete(key)
      this.t2.set(key, { value: item.value, timestamp: Date.now() })
      return item.value
    }

    // Check T2
    if (this.t2.has(key)) {
      const item = this.t2.get(key)!
      item.timestamp = Date.now()
      return item.value
    }

    // Check ghost lists for adaptation
    if (this.b1.has(key)) {
      this.adapt(true) // Increase T1 size
      this.b1.delete(key)
    } else if (this.b2.has(key)) {
      this.adapt(false) // Increase T2 size
      this.b2.delete(key)
    }

    return -1
  }

  put(key: number, value: number): void {
    // If already in cache, update
    if (this.t1.has(key)) {
      const item = this.t1.get(key)!
      this.t1.delete(key)
      this.t2.set(key, { value, timestamp: Date.now() })
      return
    }

    if (this.t2.has(key)) {
      this.t2.set(key, { value, timestamp: Date.now() })
      return
    }

    // New item goes to T1
    this.t1.set(key, { value, timestamp: Date.now() })

    // Ensure capacity constraints
    this.ensureCapacity()
  }

  private adapt(increaseT1: boolean): void {
    if (increaseT1) {
      this.p = Math.min(this.p + 1, this.capacity)
    } else {
      this.p = Math.max(this.p - 1, 0)
    }
  }

  private ensureCapacity(): void {
    const totalSize = this.t1.size + this.t2.size

    if (totalSize <= this.capacity) {
      return
    }

    // Calculate target sizes
    const targetT1 = Math.min(this.p, this.capacity)
    const targetT2 = this.capacity - targetT1

    // Evict from T1 if needed
    while (this.t1.size > targetT1) {
      const oldestKey = this.getOldestKey(this.t1)
      if (oldestKey !== null) {
        const item = this.t1.get(oldestKey)!
        this.t1.delete(oldestKey)
        this.b1.add(oldestKey)

        // Limit ghost list size
        if (this.b1.size > this.capacity) {
          const firstKey = this.b1.values().next().value
          this.b1.delete(firstKey)
        }
      }
    }

    // Evict from T2 if needed
    while (this.t2.size > targetT2) {
      const oldestKey = this.getOldestKey(this.t2)
      if (oldestKey !== null) {
        const item = this.t2.get(oldestKey)!
        this.t2.delete(oldestKey)
        this.b2.add(oldestKey)

        // Limit ghost list size
        if (this.b2.size > this.capacity) {
          const firstKey = this.b2.values().next().value
          this.b2.delete(firstKey)
        }
      }
    }
  }

  private getOldestKey(map: Map<number, { value: number; timestamp: number }>): number | null {
    let oldestKey = null
    let oldestTime = Infinity

    for (const [key, item] of map) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp
        oldestKey = key
      }
    }

    return oldestKey
  }
}
```

## Real-World Applications

The choice of algorithm has profound, practical implications across different domains.

| Aspect               | LRU     | LRU-K                            | 2Q                          | ARC                        |
| -------------------- | ------- | -------------------------------- | --------------------------- | -------------------------- |
| **Primary Criteria** | Recency | K-th Recency (History)           | Recency + Second Hit Filter | Adaptive Recency/Frequency |
| **Scan Resistance**  | Poor    | Good (for K>1)                   | Very Good                   | Excellent                  |
| **Complexity**       | Low     | High                             | Moderate                    | Moderate                   |
| **Time Complexity**  | O(1)    | O(log n) or O(1) with trade-offs | O(1)                        | O(1)                       |
| **Tuning**           | None    | Manual (parameter K)             | Manual (queue sizes)        | Automatic / Self-Tuning    |

### When to Use LRU

LRU is most effective for:

- **Web Browsing**: Recent pages are likely to be revisited
- **File System Access**: Recently accessed files are often accessed again
- **Simple Applications**: Where complexity is a concern
- **Workloads with Strong Temporal Locality**: When recent access predicts future access

### When to Consider Alternatives

Consider advanced algorithms when:

- **Database Systems**: Mix of OLTP and OLAP workloads
- **Large-Scale CDNs**: Need to retain popular content over viral content
- **Operating Systems**: Page replacement in memory management
- **High-Performance Systems**: Where cache efficiency is critical

## Performance Comparison

Here's a comprehensive benchmark to compare the performance characteristics of different algorithms:

```ts
function benchmarkCache(cache: any, operations: Array<{ type: "get" | "put"; key: number; value?: number }>) {
  const start = performance.now()

  for (const op of operations) {
    if (op.type === "get") {
      cache.get(op.key)
    } else {
      cache.put(op.key, op.value!)
    }
  }

  const end = performance.now()
  return end - start
}

// Test different access patterns
const sequentialScan = Array.from({ length: 1000 }, (_, i) => ({ type: "put" as const, key: i, value: i }))
const randomAccess = Array.from({ length: 1000 }, () => ({
  type: "get" as const,
  key: Math.floor(Math.random() * 100),
}))
const mixedWorkload = [
  ...Array.from({ length: 500 }, (_, i) => ({ type: "put" as const, key: i, value: i })),
  ...Array.from({ length: 500 }, () => ({ type: "get" as const, key: Math.floor(Math.random() * 50) })),
]

// Test different algorithms
const lru = new LRUCache(100)
const lruK = new LRUKCache(100, 2)
const twoQ = new TwoQueueCache(100)
const arc = new ARCCache(100)

console.log("=== Cache Performance Benchmark ===")
console.log("\nSequential Scan Performance (Cache Pollution Test):")
console.log(`LRU: ${benchmarkCache(lru, sequentialScan)}ms`)
console.log(`LRU-K: ${benchmarkCache(lruK, sequentialScan)}ms`)
console.log(`2Q: ${benchmarkCache(twoQ, sequentialScan)}ms`)
console.log(`ARC: ${benchmarkCache(arc, sequentialScan)}ms`)

console.log("\nRandom Access Performance (Temporal Locality Test):")
console.log(`LRU: ${benchmarkCache(lru, randomAccess)}ms`)
console.log(`LRU-K: ${benchmarkCache(lruK, randomAccess)}ms`)
console.log(`2Q: ${benchmarkCache(twoQ, randomAccess)}ms`)
console.log(`ARC: ${benchmarkCache(arc, randomAccess)}ms`)

console.log("\nMixed Workload Performance (Real-World Simulation):")
console.log(`LRU: ${benchmarkCache(lru, mixedWorkload)}ms`)
console.log(`LRU-K: ${benchmarkCache(lruK, mixedWorkload)}ms`)
console.log(`2Q: ${benchmarkCache(twoQ, mixedWorkload)}ms`)
console.log(`ARC: ${benchmarkCache(arc, mixedWorkload)}ms`)
```

### Benchmark Results

Running the performance test reveals interesting insights about each algorithm's behavior:

**Sequential Scan Performance (Cache Pollution Test):**

- LRU: 0.94ms - Fastest for sequential operations
- LRU-K: 4.98ms - Higher overhead due to access tracking
- 2Q: 2.10ms - Moderate overhead with good filtering
- ARC: 2.10ms - Similar overhead to 2Q

**Random Access Performance (Temporal Locality Test):**

- LRU: 0.20ms - Excellent for temporal locality
- LRU-K: 0.10ms - Surprisingly fast for random access
- 2Q: 0.11ms - Very efficient for random access
- ARC: 0.13ms - Good performance with adaptive overhead

**Mixed Workload Performance (Real-World Simulation):**

- LRU: 0.13ms - Best overall performance for mixed workloads
- LRU-K: 0.72ms - Higher overhead in mixed scenarios
- 2Q: 0.87ms - Moderate performance
- ARC: 0.44ms - Good adaptive performance

### Key Insights from Benchmark Results:

1. **LRU demonstrates** excellent performance across all test scenarios, making it a solid choice for most applications
2. **LRU-K shows** higher overhead in sequential operations but surprisingly good performance for random access
3. **2Q and ARC** provide similar performance characteristics, with moderate overhead compared to LRU
4. **The performance differences** are relatively small in absolute terms, suggesting that algorithm choice should be based on workload characteristics rather than raw performance

## Conclusion

The journey from the simple elegance of LRU to the adaptive intelligence of ARC shows a clear evolutionary path in system design. While a basic LRU cache is an indispensable tool, understanding its limitations is crucial for building resilient, high-performance systems.

**Key Takeaways:**

1. **LRU is excellent** for simple workloads with strong temporal locality
2. **Cache pollution** is LRU's primary weakness in real-world scenarios
3. **Advanced algorithms** like LRU-K, 2Q, and ARC address these limitations
4. **Choose wisely** based on your specific workload characteristics

Ultimately, there is no single "best" algorithm. The optimal choice depends entirely on the workload. By understanding this spectrum of policies, developers and architects can make more informed decisions, ensuring they select the right tool to build the fast, efficient, and intelligent systems of tomorrow.

For most applications, start with LRU and consider advanced alternatives when you encounter cache pollution issues or need to optimize for specific workload patterns. The benchmark results show that while LRU remains a solid foundation, modern alternatives can provide significant benefits in the right circumstances.
