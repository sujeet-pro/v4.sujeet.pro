---
lastUpdatedOn: 2025-01-23
featuredRank: -1
image: ./async-task-queue.svg
imageCredit: Async Task Queue and Executors

tags:
  - js
  - ts
  - design-patterns
---

# Async Task Queue

An async task queue manages and controls the execution of asynchronous tasks, ensuring they run according to specified concurrency limits and order.

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

## Table of Contents

## Intro

An async task queue is a data structure that manages the execution of asynchronous tasks in a controlled manner. It allows you to add tasks to the queue and ensures that they are executed according to specified rules, such as concurrency limits or execution order. Here are some key points about async task queues:

- **Task Management**: Tasks are added to the queue and are executed asynchronously. Each task is typically represented as a promise or a function that returns a promise.
- **Concurrency Control**: The queue can limit the number of tasks that are executed concurrently. This is useful for managing resource usage and preventing overload.
- **Order of Execution**: Tasks can be executed in the order they were added (FIFO - First In, First Out) or based on priority.
- **Error Handling**: The queue can handle errors in task execution, allowing for retries or logging of failures.
- **Background Processing**: Tasks can be processed in the background, allowing the main application to remain responsive.
- **Rate Limiting**: The queue can control the rate at which tasks are executed, which is useful for interacting with rate-limited APIs.
- **Workflow Orchestration**: Complex workflows with dependencies between tasks can be managed using an async task queue.

Overall, async task queues are a powerful tool for managing asynchronous operations in a controlled and efficient manner.

## Implementation

```ts file=./2025-01-24-code-sample.ts collapse={47-52, 56-64, 67-75, 80-89, 101-106, 110-112}

```

## References

- [MDN With Resolvers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers)
