---
lastUpdatedOn: 2025-06-29
tags:
  - distributed-systems
  - system-design
---

# Draft: Caching

Caching is a technique used to store a copy of a given resource and serve it back when requested.
This helps in reducing the time to access data and improves the performance of applications.
Caching can be implemented at various levels, including hardware, operating system, and application level.
Common caching strategies include Least Recently Used (LRU), First In First Out (FIFO), and Least Frequently Used (LFU).

## Table of Contents

## Introduction

Caching is a technique used to store a copy of a given resource and serve it back when requested. This helps in reducing the time to access data and improves the performance of applications. Caching can be implemented at various levels, including hardware, operating system, and application level. Common caching strategies include Least Recently Used (LRU), First In First Out (FIFO), and Least Frequently Used (LFU).

- Reduce Network Request (Improve Performance)
- Reduce Processing
- Reduce load on a system

## Caching Strategy

### Cache Aside (Lazy Loading)

- For Reading, Lazy loaded content, reactive approach
- Cache is updated, after the data is requested

#### Process

- Application receive request for data
- Gets the data from cache
- If data exits (Cache-Hit), data is returned
- If miss, get the data from original source
- Save the data in the cache
- return the data

### Write Through Cache

- Write data both the place
  - update cache
  - update original source

### 2. Write Back Cache

- Proactively updates both the source (cache and original)
- On Write request
  - updates the cache
  - async update the original source later
- Always have the latest data, high data consistency
- Slower writes

### 3

### 4

### 5

## Caching Eviction Policy

### 1

### 2

### 3

## References

- [Top caching strategies](https://blog.bytebytego.com/p/top-caching-strategies)
