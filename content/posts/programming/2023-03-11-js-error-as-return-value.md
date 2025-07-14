---
lastUpdatedOn: 2024-01-20
tags:
  - js
  - ts
  - error-handling
---

# Better Error Handling in JavaScript / TypeScript

Making errors as first-class citizens in your async function
response, inspired by Go. JS Now Try Statement (In Proposal Stage)

<figure>

![](./2023-03-11-js-error-as-return-value/2023-03-11-cover-better-error-handling-in-js.jpg)

<figcaption>
Photo by <a href="https://unsplash.com/@brett_jordan?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Brett Jordan</a> on <a href="https://unsplash.com/photos/brown-wooden-blocks-on-white-surface-XWar9MbNGUY?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
</figcaption>
</figure>

## Table of Contents

## Update: Try Statements Proposal

- [Try Statements Proposal](https://github.com/arthurfiorette/proposal-try-statements) (originally "Safe Assignment Operator") is similar to below.
- In the past around 2019, similar proposal titled ["One Liner Try-Catch"](https://es.discourse.group/t/try-catch-oneliner/107) was floated.

```js
const [ok, error, value] = try await fetch("https://sujeet.pro/some-endpoint")
```

## The Inspiration

When I was exploring Go, I came across function calls that returned the error alongside the result.

```go
fd, err := os.Open("test.go")
```

This motivates developers to account for errors at the beginning itself and not as an afterthought. This being available in the language construct is awesome. The closest thing we could do in javascript to simulate this is to return a tuple (technically an array), with both the result and the error.

```typescript
async function errorFirstFunctionSample(): Promise<readonly [ResultType, null] | readonly [null, ErrorType]> {
  try {
    const res = await someApiCall()
    return [res, null]
  } catch (err) {
    return [null, err]
  }
}
```

But it seemed tedious to refactor all of my code and even then how do we take care of functions from another package?

What if we could create some utility `withError` that does this conversion for us.

```typescript
function getAsyncData(options: Options): Promise<Result> {
  return promise_result_from_somewhere
}
const getAsyncDataWithError = withError(getAsyncData)
// Final Usages
const [result, err] = await getAsyncDataWithError(options)
```

## Implementing our `withError`

```typescript
function withError<E = unknown, F extends (...args: any) => Promise<any> = (...args: unknown[]) => Promise<unknown>>(
  func: F,
  ctx?: unknown,
) {
  return async (...args: Parameters<F>) => {
    let res: ReturnType<F> | null = null
    let err: E | null = null
    try {
      res = await func.apply(ctx, args)
    } catch (error) {
      err = error
    }
    return [res, err] as const
  }
}
```

## An example use-case

To demonstrate how this utility is helpful, let us consider the below use case.

We want to show product recommendations to our users. The recommendation API needs user preference. For cases, when user preference is not available, we will use the trending API to show products. All the errors must be logged.

```typescript
type UserPreference = unknown
type Product = unknown
declare function getUserPreferences(): Promise<UserPreference>
declare function getRecommendedProducts(userPreference: UserPreference): Promise<Product[]>
declare function getTrendingProducts(): Promise<Product[]>
declare function logger(input: any): void
```

### Implementation using our `withError` Utility

```typescript
async function getProductsUsingWithError() {
  const [userPref, prefError] = await getUserPreferencesWithError()
  if (prefError) {
    logger(prefError)
  }
  const [products, productErr] = userPref
    ? await getRecommendedProducts(userPref)
    : await getTrendingProductsWithError()
  if (productErr) {
    logger(productErr)
    throw productErr
  }
  return products
}
```

## Implementing using existing methods

To keep the ground fair, I have implemented the above use case in existing approaches as well (callback, promises and regular try-catch block)

### Implementation using Callback

In the beginning, we had callbacks that received both the error and response. But this brought the problem of "callback hells" which were nested callbacks.

For this, let us assume all the above available functions also follow a callback structure (error-first, similar to node).

```typescript
function getPageData(cb: (err, products: Product[]) => void) {
  getUserPreferences((err, userPref: UserPreference) => {
    if (err1) {
      logger(err1)
      getTrendingProducts((err2, products2) => {
        if (err2) {
          logger(err2)
        }
        cb(err2, products2)
      })
    } else {
      getRecommendedProducts(userPref, (err3, products3) => {
        if (err3) {
          logger(err3)
        }
        cb(err3, products3)
      })
    }
  })
}
```

### Implementation using Promises

With the introduction of promises, we got chainable `.catch` apart from `.then` and `.finally`

```typescript
function getProductsUsingPromises() {
  return getUserPreferences()
    .then((userPref) => {
      return getRecommendedProducts(userPref)
    })
    .catch((err) => {
      logger(err)
      return getTrendingProducts()
    })
    .catch((err) => {
      logger(err)
      return Promise.reject(err)
    })
}
```

This though has a mental overhead of distinguishing which code runs in sequence and which at a later point in time.

> **Did you notice**, in the above implementation `getTrendingProducts` will be called when either of `getUserPreferences` OR `getRecommendedProducts` fails.

### Implementation using Async -Await with Try / Catch Block

Async Await made it easier to reason with the sequence of execution, especially when you don't care about the intermediate errors.

```typescript
async function getProductsWithoutHandlingErrors() {
  try {
    const userPref = await getUserPreferences()
    return getRecommendedProducts(userPref)
  } catch {
    return getTrendingProducts()
  }
}
```

But, if we come to our use case, and start handling errors of intermediate calls, we will have a sequence of try-catch blocks.

```typescript
async function getProductsUsingTryCatch() {
  try {
    const userPref = await getUserPreferences()
    try {
      const products = await getRecommendedProducts(userPref)
      return products
    } catch (err2) {
      logger(err2)
      throw err2
    }
  } catch (err1) {
    logger(err1)
    try {
      const products = await getTrendingProducts()
      return products
    } catch (err3) {
      logger(err3)
      throw err3
    }
  }
}
```

_And now, I feel, the promise chaining was better than this, at least in terms of readability. If we ignore the problem of calling trending products when recommendations fail (It might be valid for this example use case anyways)_

## Last Words

Based on my experience, the error-first approach using the withError utility method is much easier to work with. Additionally, your implementation of methods can continue to throw errors as a standard.

### What about Sync Function?

The above example only showed the use case for async operation but would work with sync functions as well. We would need to modify the types and remove async and await from the inner function.

```typescript
function withErrorSync<E = unknown, F extends (...args: any) => any = (...args: unknown[]) => unknown>(
  func: F,
  ctx?: unknown,
) {
  return (...args: Parameters<F>) => {
    let res: ReturnType<F> | null = null
    let err: E | null = null
    try {
      res = func.apply(ctx, args)
    } catch (error) {
      err = error
    }
    return [res, err] as const
  }
}
```

### The Ideal order of result and error in the tuple

The intention behind this exploration is to find ways to ensure we as developers take care of errors.

If you want node-like ordering (`error, res`), error-first makes sense.
For me, since the inspiration was from Go, and it uses `res, err` ordering, I stick with that in the article.

```typescript
const [res, error] = await somefunction() // Go Like
// OR
const [error, res] = await somefunction() // Node like

// Both are cool!
```
