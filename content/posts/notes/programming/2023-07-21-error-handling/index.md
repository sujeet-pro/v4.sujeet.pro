---
lastReviewedOn: 2026-01-21
tags:
  - js
  - ts
  - error-handling
  - fp
  - monads
  - architecture
  - backend
  - frontend
  - design-patterns
  - resilience
---

# Error Handling Paradigms in JavaScript

Master exception-based and value-based error handling approaches, from traditional try-catch patterns to modern functional programming techniques with monadic structures.

<figure>

```mermaid
flowchart LR
    subgraph "Exception Model"
        TRY["try/catch"] --> THROW["throw Error"]
        THROW --> CATCH["catch(error)"]
    end

    subgraph "Value Model"
        FN["function()"] --> RESULT["Result<T, E>"]
        RESULT --> OK["Ok(value)"]
        RESULT --> ERR["Err(error)"]
    end

    subgraph "Evolution"
        TRYCATCH["try/catch<br/>Imperative"] --> TUPLE["[data, error]<br/>Go-style"]
        TUPLE --> MONAD["Result Monad<br/>Composable"]
    end
```

<figcaption>Evolution from exception-based to value-based error handling paradigms</figcaption>

</figure>

## TLDR

**Error handling** in JavaScript spans from traditional `try/catch` exceptions to modern value-based approaches using monadic types like `Result<T, E>`, with the functional paradigm offering stronger type safety and composability.

### Exception Model Trade-offs

- **Pros**: Familiar syntax, built-in async support with `async/await`, stack traces for debugging
- **Cons**: Untyped `catch` block (always `unknown`), non-local control flow, can swallow errors silently
- **Performance**: Stack unwinding is expensive compared to value returns

### Go-Style Tuple Pattern `[data, error]`

- **Explicit errors**: Forces acknowledgment of error possibility at call site
- **Limitations**: No type-level guarantee one value is non-null, verbose chaining with repeated `if (err)` checks
- **Stack trace risk**: Converting exceptions to tuple values can lose debugging information

### Monadic Result Type (`Result<T, E>`)

- **Type safety**: Invalid states (both value and error) impossible at compile time
- **Composable**: Chain operations with `.map()`, `.andThen()`, `.orElse()`, `.match()`
- **Railway Oriented**: Failures automatically bypass subsequent success operations

### Library Comparison

| Criterion | try/catch | [data, error] | fp-ts Either | neverthrow |
|-----------|-----------|---------------|--------------|------------|
| Type Safety | Low | Low | High | High + linting |
| Ergonomics | High (simple) | Low (verbose) | Low (learning curve) | High |
| Composability | Poor | Poor | Excellent | Excellent |
| Performance | Slow (unwinding) | Fast | Fast | Fast |

### Recommendations

- **Use try/catch for**: Legacy code boundaries, top-level safety nets, truly exceptional errors
- **Use neverthrow for**: New code requiring type-safe error handling with approachable API
- **Use fp-ts for**: Teams committed to full functional programming paradigm
- **Avoid Go-style tuples**: Lack type guarantees and compose poorly

### Future JavaScript Features

- **Pipeline Operator (Stage 2)**: Native syntax for Result chaining with `|>`
- **Pattern Matching (Stage 1)**: Exhaustive Result unwrapping with `match` expression
- **Safe Assignment Operator (Pre-Stage)**: Community proposal for `?=` converting exceptions to Result tuples

## Introduction

Error handling is a foundational discipline in software engineering, extending far beyond the mere prevention of application crashes. It is a fundamental aspect of architectural design that profoundly influences code structure, readability, composability, and long-term robustness.

Within the JavaScript ecosystem, the discourse on error handling is centered on a core philosophical tension: the imperative model of exceptions as non-local control flow versus the functional model of errors as explicit, first-class values. The former treats errors as exceptional events that disrupt the normal execution path, while the latter integrates the possibility of failure directly into the data flow of the program.

While JavaScript's traditional `try...catch` mechanism is a cornerstone of the language, a significant paradigm shift towards value-based error handling is gaining traction among expert practitioners. This shift, driven by the pursuit of greater explicitness and type safety, finds its most sophisticated expression in monadic structures like the `Result` or `Either` type.

This article provides an exhaustive analysis of these competing and complementary paradigms, from the orthodox exception-based model to the cutting-edge functional approaches, culminating in practical recommendations for modern JavaScript development.

## Section 1: The Orthodox Approach - Exceptions as Control Flow

To appreciate the shift towards value-based errors, one must first possess a deep and critical understanding of JavaScript's conventional exception-based model. This orthodox approach, rooted in imperative programming traditions, treats errors as exceptional events that halt the standard execution sequence and transfer control to a dedicated handler.

### 1.1 The Core Mechanics: try, throw, and Error

The foundation of JavaScript's error handling rests on three core language constructs: the `try...catch...finally` statement, the `throw` statement, and the built-in `Error` object.

The `try...catch...finally` statement provides the primary structure for managing exceptions. A `try` block encloses code that may potentially fail. If an exception is thrown within this block, the normal execution flow is immediately suspended, and control is transferred to the nearest enclosing `catch` block.

```javascript
try {
  const result = riskyOperation()
  return processResult(result)
} catch (error) {
  console.error("Operation failed:", error)
  return fallbackValue
} finally {
  cleanup()
}
```

The `catch` block receives the thrown value as an argument, allowing for error logging, recovery, or other handling logic. The optional `finally` block contains code that is guaranteed to execute after the `try` and `catch` blocks, regardless of whether an exception occurred.

The `throw` statement is the mechanism for initiating an exception. A critical, and often problematic, feature of JavaScript is that the `throw` statement can be used with any expression. One can throw a string, a number, a boolean, or a plain object. While this offers flexibility, it is a significant source of type-unsafety and is widely considered poor practice.

```javascript
// Poor practice - throwing primitives
throw "Something went wrong"
throw 404

// Best practice - throwing Error instances
throw new Error("Something went wrong")
throw new TypeError("Expected string, got number")
```

The `Error` object and its derivatives (`TypeError`, `ReferenceError`, `SyntaxError`, `RangeError`, etc.) form a standard hierarchy for representing different classes of errors. An `Error` instance encapsulates crucial information for debugging, including the `stack` trace which provides a snapshot of the call stack at the moment the error was thrown.

### 1.2 Asynchronous Error Propagation

The exception model extends into JavaScript's asynchronous programming patterns, albeit with some syntactic variation. In classic Promise-based code, errors are handled via the `.catch()` method:

```javascript
fetch("/api/data")
  .then((response) => response.json())
  .then((data) => processData(data))
  .catch((error) => {
    console.error("Request failed:", error)
    return fallbackData
  })
```

The introduction of `async/await` syntax provided a significant ergonomic improvement by allowing developers to use the familiar `try...catch` blocks for asynchronous operations:

```javascript
async function fetchData() {
  try {
    const response = await fetch("/api/data")
    const data = await response.json()
    return processData(data)
  } catch (error) {
    console.error("Request failed:", error)
    return fallbackData
  }
}
```

Despite these improvements, a critical pitfall remains: the unhandled promise rejection. If a promise rejects and there is no corresponding `.catch()` handler or `try...catch` block to intercept it, the error can be "swallowed," leading to silent failures that are notoriously difficult to debug.

### 1.3 A Critical Assessment of the Exception Model

While functional and deeply embedded in the language, the exception-based model carries inherent architectural trade-offs that have motivated the search for alternatives.

From a functional programming perspective, exceptions are a side effect. A function signature like `function processData(data)` suggests a simple transformation of input to output. However, if this function can throw, it possesses a second, invisible exit path that is not declared in its type signature. Control can abruptly jump from the function to an arbitrary, distant `catch` block, breaking the declarative flow of the code.

This "non-local goto" behavior stands in stark contrast to patterns where the possibility of failure is explicitly encoded in the function's return type, such as `function processData(data): Result<ProcessedData, ProcessError>`.

Beyond this philosophical objection, the exception model has several practical drawbacks:

**Performance Overhead**: The process of throwing an exception requires the JavaScript runtime to halt execution, capture the state of the call stack, and then unwind that stack frame by frame until a suitable `catch` handler is found. This is computationally more expensive than simply returning a value from a function.

**Untyped catch Blocks**: A significant weakness, particularly in TypeScript, is that the variable bound in a `catch` block is of type `unknown`. This is a direct consequence of the language allowing any value to be thrown. To safely interact with the caught error, developers are forced to perform runtime type guards.

**Risk of Swallowing Errors**: The `try...catch` construct makes it syntactically easy to inadvertently "swallow" an error. A developer might write a `catch` block that logs an error but fails to re-throw it or otherwise handle the failure state.

## Section 2: The Paradigm Shift - Errors as Return Values

In response to the limitations of the exception model, a different philosophy has emerged, one that treats errors not as exceptional, flow-disrupting events, but as ordinary, first-class values. This approach, rooted in functional programming principles, promotes explicitness and predictability by making the possibility of failure a transparent part of a function's contract.

### 2.1 The Go-lang Idiom in JavaScript: Tuple-Based Returns

One of the most straightforward implementations of the "error as value" pattern is inspired by the idiomatic error handling style of the Go programming language. This pattern involves functions returning a two-element array (a tuple), conventionally structured as `[data, error]`.

```typescript
// A common helper function to wrap a Promise
function to<T>(promise: Promise<T>): Promise<[T | null, Error | null]> {
  return promise.then((data) => [data, null]).catch((err) => [null, err])
}

// Example usage with async/await
async function fetchUserData(id: string) {
  const [user, err] = await to(fetch(`/api/users/${id}`))

  if (err) {
    console.error("Failed to fetch user:", err)
    return null
  }

  return user
}
```

This pattern has gained popularity due to a few clear strengths. First, it makes failure an explicit and unavoidable part of the control flow. The `err` variable exists right alongside the `user` variable, forcing the developer to acknowledge its potential presence. Second, its implementation is simple and requires no external dependencies.

However, upon closer architectural scrutiny, the Go-style tuple pattern reveals itself to be a "leaky abstraction" for truly robust, type-safe error handling:

**Lacks Type-Level Guarantees**: The type signature for the return value, such as `Promise<[User | null, Error | null]>`, does not actually prevent invalid states. The TypeScript compiler cannot enforce that one and only one of the tuple elements is non-null.

**Verbose and Repetitive Chaining**: When multiple fallible operations must be chained, the pattern leads to a cascade of `if (err) {...}` checks. Each step requires an explicit conditional block to handle or propagate the error.

**No Forced Handling**: There is no language or tooling mechanism to ensure that a developer actually checks the `err` variable. It is easy to destructure `const [user, err] = ...` and then proceed to use `user` without first checking if `err` is null.

**Potential Loss of Stack Traces**: A critical drawback is the risk of losing debugging information. If the caught error that is placed into the tuple is not a proper `Error` instance, the original stack trace can be obscured or lost entirely.

### 2.2 The Functional Evolution: Monadic Error Handling

A more sophisticated and powerful implementation of the "error as value" pattern is found in the concept of monads, specifically the `Result` (or `Either`) monad. This approach formalizes the idea of a computation having two possible outcomes and is a cornerstone of a methodology known as [Railway Oriented Programming](https://fsharpforfunandprofit.com/rop/).

In Railway Oriented Programming, a sequence of operations is visualized as a railway with two parallel tracks: a "happy path" (the success track) and a "sad path" (the failure track). A function's result starts on the success track. Each subsequent operation is a station. If an operation succeeds, the result continues along the success track to the next station. However, if any operation fails, the result is switched to the failure track. Once on the failure track, all subsequent success-track stations are bypassed entirely, and the failure value is carried directly to the end of the line.

This concept is implemented in code using a discriminated union type, commonly named `Result<T, E>` or `Either<E, A>`. This type can exist in one of only two states:

- `Ok(value)` (or `Right(value)`), representing success and containing a payload value of type `T`
- `Err(error)` (or `Left(error)`), representing failure and containing an error of type `E`

This structure makes the invalid state of having both a value and an error simultaneously impossible at the type level, providing a strong guarantee of correctness that the tuple pattern lacks.

The true power of the monadic approach, however, lies not just in its structure but in its rich, chainable API that enables fluent and declarative composition of fallible operations:

```typescript
// Example using a hypothetical Result type
const result = parseNumber("10")
  .map((x) => x * 2) // Apply non-failable transformation
  .andThen((x) => (x > 15 ? ok(x) : err("Value too small"))) // Chain failable operation
  .orElse((err) => ok(defaultValue)) // Provide fallback
  .match(
    (value) => `Success: ${value}`, // Handle success
    (error) => `Error: ${error}`, // Handle failure
  )
```

Key methods include:

- **`.map(fn)`**: Applies a function to the value inside an `Ok` container, returning a new `Ok` with the transformed value. If the container is an `Err`, `.map()` does nothing and simply passes the original `Err` through.

- **`.andThen(fn)`** (also known as `chain` or `flatMap`): This is the core method for composition. It takes a function that is itself failable (i.e., it returns a `Result`). If the container is `Ok`, `fn` is applied to the inner value, and the new `Result` it produces is returned.

- **`.orElse(fn)`**: Provides a path for recovery. If the container is an `Err`, it applies a function to the error value. This function can then return a new `Result`, potentially turning a failure into a success.

- **`.match(onOk, onErr)`** (also known as `fold`): This is the primary method for exiting the monadic container and extracting a value. It takes two functions: one to execute if the `Result` is `Ok` and one to execute if it is `Err`.

## Section 3: Implementing Monadic Patterns in Practice

The theoretical benefits of monadic error handling are realized through a growing ecosystem of libraries in JavaScript and TypeScript. These libraries offer different trade-offs in terms of API design, scope, and philosophical approach.

### 3.1 The Comprehensive Toolkit: fp-ts

[fp-ts](https://gcanti.github.io/fp-ts/) is a library for rigorous, type-safe functional programming in TypeScript. It is not merely an error-handling library but a complete FP toolkit. Its `Either<E, A>` type is a canonical implementation of the Result pattern, where `Left<E>` represents failure and `Right<A>` represents success.

The API of `fp-ts` is characterized by its use of standalone, pipeable functions. Instead of chaining methods on an object, data is passed as the first argument to a `pipe` function, followed by a sequence of operations:

```typescript title="fp-ts-example.ts" collapse={1-2}
import { pipe } from "fp-ts/function"
import * as E from "fp-ts/Either"

// A function that might fail
function parseNumber(s: string): E.Either<string, number> {
  const n = parseFloat(s)
  return isNaN(n) ? E.left("Invalid number") : E.right(n)
}

const result = pipe(
  parseNumber("10"),
  E.map((x) => x * 2), // Maps the Right value: E.right(20)
  E.chain((x) => (x > 15 ? E.right(x) : E.left("Value too small"))), // Chains another failable operation
  E.match(
    // Unwraps the Either into a single value
    (error) => `Computation failed: ${error}`,
    (value) => `Computation succeeded: ${value}`,
  ),
)
// result is "Computation succeeded: 20"
```

The primary strength of `fp-ts` is its uncompromising commitment to functional purity and type safety. It provides a vast array of powerful tools for building complex, robust systems. However, this power comes at a cost. The learning curve is steep, especially for teams not already well-versed in functional programming concepts.

### 3.2 The Pragmatic Choice: neverthrow

[neverthrow](https://github.com/supermacro/neverthrow) is a library that focuses specifically on providing an ergonomic and type-safe `Result` type, without the extensive scope of a full FP toolkit like `fp-ts`. This makes it a more approachable and pragmatic choice for many teams.

Its API is designed around a more conventional class-based, method-chaining style, which is immediately familiar to developers with an object-oriented background:

```typescript title="neverthrow-example.ts" collapse={1}
import { ok, err, Result } from "neverthrow"

function parseNumber(s: string): Result<number, string> {
  const n = parseFloat(s)
  return isNaN(n) ? err("Invalid number") : ok(n)
}

const result = parseNumber("10")
  .map((x) => x * 2) // -> Ok(20)
  .andThen((x) => (x > 15 ? ok(x) : err("Value too small"))) // Chains another failable operation
  .match(
    // Unwraps the Result into a single value
    (value) => `Computation succeeded: ${value}`,
    (error) => `Computation failed: ${error}`,
  )
// result is "Computation succeeded: 20"
```

`neverthrow` strikes an excellent balance between functional correctness and developer ergonomics. Its most compelling feature is the optional [ESLint plugin](https://github.com/mdbetancourt/eslint-plugin-neverthrow). When enabled, this plugin enforces that every function returning a `Result` must have its value consumed (via `.match`, `.unwrapOr`, or `._unsafeUnwrap`). This prevents developers from accidentally ignoring a potential error, effectively eliminating a major class of bugs related to unhandled failures.

### 3.3 The Broader Ecosystem

The popularity of the Result pattern is evidenced by the existence of several other high-quality libraries:

- [oxide.ts](https://github.com/andogq/oxide): A lightweight, zero-dependency library that provides `Result` and `Option` types directly inspired by their counterparts in the Rust programming language.

- [ts-results](https://github.com/vultix/ts-results): Another popular and simple library providing `Ok` and `Err` types. It focuses on being a minimal, unopinionated, and type-safe implementation of the pattern.

The existence of this diverse ecosystem demonstrates a clear demand among expert developers for more explicit and robust error-handling tools than what the base language currently provides.

### Comparative Analysis

| Criterion     | try/catch (Baseline)       | [data, error] Tuple              | fp-ts (Either)                       | neverthrow (Result)                |
| ------------- | -------------------------- | -------------------------------- | ------------------------------------ | ---------------------------------- |
| Type Safety   | Low (untyped catch block)  | Low (convention-based)           | High (compiler-enforced)             | High (compiler-enforced + linting) |
| Ergonomics    | High for simple cases      | Low (verbose if checks)          | Low to Medium (steep learning curve) | High (approachable API)            |
| Composability | Poor (imperative)          | Poor (manual chaining)           | Excellent (designed for composition) | Excellent (fluent chaining)        |
| Performance   | Slower (stack unwinding)   | Faster (value return)            | Faster (value return)                | Faster (value return)              |
| Debuggability | High (native stack traces) | Low (risk of losing stack trace) | High (errors are values)             | High (errors are values)           |
| Ecosystem Fit | Native, universal          | Non-standard but growing         | Niche (FP community)                 | Growing, pragmatic choice          |

## Section 4: The Future of Ergonomic Error Handling

The JavaScript language, through the TC39 committee, is continually evolving. Several active proposals are poised to dramatically improve the ergonomics of value-based error handling, potentially elevating these patterns from library-specific implementations to mainstream, idiomatic practice.

### 4.1 The Pipeline Operator (|>): Streamlining Composition

The [Pipeline Operator proposal](https://github.com/tc39/proposal-pipeline-operator), currently at Stage 2, aims to provide a more readable and fluent syntax for function composition. The current iteration, known as the "Hack Pipe" proposal, is particularly powerful due to its use of a topic reference (proposed as `%`).

This feature is the syntactic glue that could make monadic error handling feel native to JavaScript. It directly addresses the primary ergonomic complaint against libraries like `fp-ts`: the verbosity of wrapping every chain of operations in a `pipe(...)` function call.

Consider how it could streamline an `fp-ts` workflow:

```javascript title="pipeline-operator-example.js" collapse={1-5}
import * as E from 'fp-ts/Either';

// A function returning an Either
declare function getUser(id: string): E.Either<Error, User>;
declare function validatePermissions(user: User): E.Either<Error, User>;

// Future syntax with the pipeline operator
const result = getUser(id)
  |> E.chain(user => validatePermissions(user))
  |> E.map(user => user.name)
  |> E.match(
       e => console.error(`Failure: ${e.message}`),
       name => console.log(`Success: ${name}`)
     );
```

The flow of data from one failable operation to the next becomes clear and left-to-right, making the code easier to read and reason about.

### 4.2 Pattern Matching: The Definitive Result Consumer

The [Pattern Matching proposal](https://github.com/tc39/proposal-pattern-matching), currently at Stage 1, introduces a powerful `match` expression and an `is` operator to the language. This proposal is far more advanced than a simple `switch` statement, allowing for deep, recursive destructuring of objects and arrays while simultaneously checking for specific values, types, and structures.

Pattern matching is the ideal native consumer for `Result` and `Either` types. It provides a declarative, exhaustive, and type-safe syntax for "unwrapping" the monadic container:

```javascript
// A function returning a custom Result object
declare function processData(): Result<string, Error>;

const result = processData();

// Future syntax with pattern matching
const message = match (result) {
  when { isOk: true, value: let v }: {
    // 'v' is bound to the successful value
    return `Success: The processed data is ${v}.`;
  },
  when { isOk: false, error: let e }: {
    // 'e' is bound to the error object
    return `Error: Operation failed with message: ${e.message}.`;
  }
  // A `TypeError` would be thrown at runtime if result didn't match
  // and no `default` clause was provided.
}
```

A key advantage is the potential for exhaustiveness checking. A `match` expression without a `default` clause can be statically analyzed by tools to ensure that all possible variants of the input type are handled.

### 4.3 The Safe Assignment Operator (?=): Native Result Types

The [Safe Assignment Operator proposal](https://github.com/arthurfiorette/proposal-safe-assignment-operator), currently being discussed in the TC39 Ideas forum, represents one of the most ambitious community attempts to bring value-based error handling directly into the JavaScript language itself. This proposal introduces a new operator `?=` that automatically converts thrown exceptions into tuple-style results, effectively bridging the gap between the traditional exception model and the functional "error as value" paradigm.

The core idea is elegantly simple: any expression that might throw an exception can be assigned using the `?=` operator, which will catch any thrown value and return it as a `[error, value]` tuple instead of propagating the exception up the call stack.

```javascript
// Current exception-based approach
function parseUserData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    const user = validateUser(data);
    return user;
  } catch (error) {
    throw new Error(`Failed to parse user data: ${error.message}`);
  }
}

// Future syntax with the safe assignment operator
async function parseUserData(jsonString) {
  const [parseErr, data] ?= JSON.parse(jsonString);
  if (parseErr) return null;

  const [validateErr, user] ?= validateUser(data);
  if (validateErr) return null;

  return user;
}
```

In this example, if `JSON.parse()` throws a `SyntaxError`, the `?=` operator catches it and assigns the error to `parseErr` while `data` is `undefined`. Similarly, if `validateUser()` throws a validation error, it too is caught and assigned to `validateErr`.

The proposal uses a tuple structure similar to Go's error handling pattern:

```javascript
// Success case: error is null, value contains the result
[null, actualResult]

// Failure case: error contains the thrown value, value is undefined
[thrownValue, undefined]
```

This structure is intentionally simple and familiar, avoiding the complexity of full monadic implementations while still providing the core benefits of explicit error handling.

The safe assignment operator shines in scenarios where multiple fallible operations need to be chained:

```javascript
// Complex data processing pipeline
async function processUserRequest(requestId) {
  const [err1, request] ?= await fetchRequest(requestId);
  if (err1) return { error: "Failed to fetch request" };

  const [err2, user] ?= parseUser(request.body);
  if (err2) return { error: "Failed to parse user" };

  const [err3, permissions] ?= await fetchPermissions(user.id);
  if (err3) return { error: "Failed to fetch permissions" };

  const [err4, result] ?= processWithPermissions(user, permissions);
  if (err4) return { error: "Failed to process" };

  return { data: result };
}
```

The proposal also leverages `Symbol.result` to allow objects to define their own result behavior, enabling integration with existing Result/Either types from libraries like neverthrow.

This approach provides several compelling advantages:

**Seamless Integration**: The operator works with existing code that throws exceptions, requiring no refactoring of library functions or legacy code.

**Reduced Boilerplate**: It eliminates the need for `try...catch` blocks while still making error handling explicit at each step.

**Type Safety**: When combined with TypeScript, the tuple structure can be properly typed using discriminated unions.

However, the proposal also faces some challenges:

**Still Verbose**: Unlike monadic approaches, each failable call still requires an explicit `if (err)` check, similar to Go's pattern.

**Not Composable**: The tuple pattern doesn't chain as elegantly as monadic `.andThen()` calls.

**Pre-Stage Status**: As a community proposal not yet in the TC39 process, adoption timeline is uncertain.

The safe assignment operator represents a pragmatic attempt to bring value-based error handling to JavaScript in a familiar form. Its success depends on whether the TC39 committee sees value in standardizing a Go-style error pattern rather than the more expressive monadic approaches already available through libraries.

### 4.4 Supporting Syntax: do and throw Expressions

Other TC39 proposals further enhance error handling ergonomics:

**throw Expressions** ([Stage 2](https://github.com/tc39/proposal-throw-expressions)): This proposal allows the `throw` statement to be used in expression contexts:

```javascript
// Example: Parameter validation
const greet = (name) => (name ? `Hello, ${name}` : throw new Error("Name is required"))
```

**do Expressions** ([Stage 1](https://github.com/tc39/proposal-do-expressions)): This proposal allows block statements, including `try...catch`, to be used as expressions that evaluate to a value:

```javascript
// Example: Safely parsing JSON
function getUserId(blob) {
  const obj = do {
    try {
      JSON.parse(blob)
    } catch {
      // The 'return' here exits the entire getUserId function
      return null
    }
  }
  return obj?.userId
}
```

## Section 5: Synthesis and Recommendations

The evolution of JavaScript error handling presents architects and developers with a spectrum of choices, each with distinct trade-offs. The optimal strategy depends on the specific context of the application, the philosophy of the team, and the desired balance between simplicity, safety, and expressiveness.

### 5.1 The Grand Synthesis: A Future-Forward Idiom

The convergence of functional patterns with upcoming native language features points toward a future JavaScript idiom for error handling that combines the best aspects of current approaches. This forward-looking pattern will likely be characterized by three key components:

1. **Monadic Result Types as the Standard Return**: Functions that can fail will, by convention, return a monadic `Result` type, either from a mature library like `neverthrow` or, potentially, from a future standard library implementation.

2. **The Pipeline Operator for Composition**: Complex workflows involving multiple failable steps will be composed using the Pipeline Operator (`|>`). This will provide a native, readable, and linear syntax for chaining operations on `Result` types.

3. **Pattern Matching for Consumption**: The final `Result` of a computation chain will be consumed and unwrapped using a native `match` expression. This will provide a syntactically rich, powerful, and exhaustive way to handle both the success and failure cases.

This combination represents a "best of all worlds" scenario: it leverages the mathematical rigor and composability of functional programming, but with the ergonomic feel and readability of native language syntax.

### 5.2 A Pragmatic Decision Framework

While the future idiom is compelling, developers today must make pragmatic choices based on current language features and project requirements. The following framework provides context-driven guidance:

**Use try/catch When:**

- Interfacing with legacy code that throws exceptions
- Top-level safety nets in applications
- Truly exceptional, unrecoverable errors

**Use Go-style [data, error] Tuples When:**

- Simplicity is paramount (small scripts, prototypes)
- Adding dependencies is undesirable
- Verbosity is acceptable for simple, linear flows

**Use a Monadic Library (neverthrow, fp-ts, etc.) When:**

- Building complex, robust, and maintainable applications
- Business-critical logic or data processing pipelines
- Composition of multiple failable operations is required
- Type safety and explicit error handling are priorities

**Choosing a Library:**

- `neverthrow` is an excellent pragmatic choice for most teams due to its approachable API and safety-enforcing lint rules
- `fp-ts` is the right choice for teams fully committed to a functional programming paradigm

### 5.3 Final Conclusion

The evolution of error handling in JavaScript is a clear indicator of the language's maturation. The community and the TC39 committee are progressively moving away from patterns that rely on implicit, disruptive control flow and toward those that favor explicit, predictable data flow.

The "error as value" paradigm, particularly in its sophisticated monadic form, represents the frontier of writing clear, maintainable, and resilient JavaScript code. Adopting this approach, especially with an eye toward the powerful syntactic enhancements on the horizon, is not merely a tactical choice of library or pattern. It is a strategic investment in the long-term health, quality, and predictability of any modern software system built with JavaScript.

As we look toward the future, the convergence of functional programming principles with native language features promises to make error handling not just safer and more explicit, but also more ergonomic and intuitive than ever before. The journey from exceptions to values represents not just a technical evolution, but a fundamental shift in how we think about and reason about failure in our applications.

## References

- [neverthrow](https://github.com/supermacro/neverthrow) - Type-safe Result and Option types for TypeScript
- [eslint-plugin-neverthrow](https://github.com/mdbetancourt/eslint-plugin-neverthrow) - ESLint plugin enforcing Result consumption
- [fp-ts](https://gcanti.github.io/fp-ts/) - Typed functional programming library for TypeScript
- [oxide.ts](https://github.com/andogq/oxide) - Rust-inspired Result and Option types for TypeScript
- [ts-results](https://github.com/vultix/ts-results) - Minimal Result type implementation for TypeScript
- [Railway Oriented Programming](https://fsharpforfunandprofit.com/rop/) - Scott Wlaschin's functional error handling patterns
- [Error Handling in Go](https://go.dev/blog/error-handling-and-go) - Go's explicit error handling philosophy
- [TC39 Pipeline Operator Proposal](https://github.com/tc39/proposal-pipeline-operator) - Stage 2 proposal for `|>` operator
- [TC39 Pattern Matching Proposal](https://github.com/tc39/proposal-pattern-matching) - Stage 1 proposal for `match` expression
- [TC39 throw expressions Proposal](https://github.com/tc39/proposal-throw-expressions) - Stage 2 proposal for throw in expression contexts
- [TC39 do expressions Proposal](https://github.com/tc39/proposal-do-expressions) - Stage 1 proposal for block expressions
- [Safe Assignment Operator Proposal](https://github.com/arthurfiorette/proposal-safe-assignment-operator) - Community proposal for `?=` error handling
