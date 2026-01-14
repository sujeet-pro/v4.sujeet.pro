---
lastUpdatedOn: 2024-01-02
tags:
  - data-structures
  - algorithms
  - dsa
subcategory: dsa/data-structures
---

# Draft: Hash Tables

Understanding hash tables: one of the most important data structures in computer science.


## What is a Hash Table?

A hash table is a data structure that maps keys to values using a hash function. It provides average O(1) time complexity for insertions, deletions, and lookups.

## Key Concepts

### Hash Function

A good hash function should:

- Be deterministic (same input = same output)
- Distribute keys uniformly
- Be fast to compute

### Collision Resolution

When two keys hash to the same index:

1. **Chaining**: Store collisions in a linked list
2. **Open Addressing**: Find next available slot
   - Linear probing
   - Quadratic probing
   - Double hashing

## Time Complexity

| Operation | Average | Worst Case |
| --------- | ------- | ---------- |
| Insert    | O(1)    | O(n)       |
| Delete    | O(1)    | O(n)       |
| Search    | O(1)    | O(n)       |

## Coming Soon

More detailed implementations and analysis coming soon...
