---
lastUpdatedOn: 2025-01-25
tags:
  - js
  - ts
  - design-patterns
---

# Exponential Backoff Retry Strategy

It is a technique where an application progressively increases the waiting time between retry attempts after a failed operation

## Table of Contents

## TL;DR

- Transient Failures do happen, for which we can retry with a limit
- Retry increases load on already overloaded servers
- Retry by adding a delay that increases exponentially, will reduce the load.

## Sample Scenario

- You have an UI, which shows some data.
- The data is fetched at client side via some API
- The server serving the request is overloaded or some throttling is implemented, hence the server is rejecting new calls.
- Making the api call again may succeed.
- So this application needs to add retries.
- But then, if we add retry, would it not add load on an already overloaded system, increasing the failure rates?

## Strategy 1 - Simple Retry

- We want the users to see the data ASAP
- So we will retry ASAP

```ts file=./simple-retry.ts

```

### Problem with Immediate Retry

- The server on load will increase drastically, You would be calling this `1000/response-time-in-ms`
- Eg: For an API with response time of 50ms, it would now make 20 calls per second.
- So we should probably add some waiting time before the next call

### Strategy 2: Retry with constant wait

```ts file=./simple-retry-with-delay.ts

```

### Strategy 3: Retry with exponential Wait

```ts file=./simple-retry-with-exponential-delay.ts

```

### Final Code: Abortable Retry with Exponential Back-off

The Functions should be abortable in production code.

```ts file=./exponential-backoff-abortable.ts collapse={2-20}

```

## References

- [Code Samples With Tests](https://github.com/sujeet-pro/code-samples/tree/main/patterns/exponential-backoff)
- [Wikipedia Exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
