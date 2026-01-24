# Draft: Design a Notification System

Multi-channel notifications with scheduling and reliability guarantees.

## TLDR

- Channels include email, push, SMS, and in-app
- Deduplication and rate limits protect users
- Delivery tracking and retries are essential

## Outline

1. Requirements and use cases
2. Event ingestion and routing
3. Channel-specific delivery pipelines
4. Scheduling, deduplication, and user preferences
5. Retries, DLQ, and observability
6. Capacity planning
