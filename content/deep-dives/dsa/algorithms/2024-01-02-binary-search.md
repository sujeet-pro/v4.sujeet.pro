---
lastUpdatedOn: 2024-01-02
tags:
  - algorithms
  - dsa
subcategory: dsa/algorithms
---

# Draft: Binary Search

Master binary search and its many variations.


## What is Binary Search?

Binary search is an efficient algorithm for finding an item in a sorted array. It works by repeatedly dividing the search interval in half.

## Basic Implementation

```typescript
function binarySearch(arr: number[], target: number): number {
  let left = 0
  let right = arr.length - 1

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)

    if (arr[mid] === target) {
      return mid
    } else if (arr[mid] < target) {
      left = mid + 1
    } else {
      right = mid - 1
    }
  }

  return -1
}
```

## Time Complexity

- **Time**: O(log n)
- **Space**: O(1) for iterative, O(log n) for recursive

## Common Variations

1. Find first occurrence
2. Find last occurrence
3. Find insertion point
4. Search in rotated sorted array

## Coming Soon

More variations and practice problems coming soon...
