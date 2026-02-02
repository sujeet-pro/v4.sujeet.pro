# Draft: Unique ID Generation

Designing scalable unique identifier systems for distributed environments.

## TLDR

- UUIDs are simple but not sortable
- Snowflake IDs provide time-ordering and uniqueness
- Modern formats like ULID combine best of both approaches

## Outline

1. Requirements: uniqueness, sortability, time-ordering
2. UUID: v1, v4, v7, pros and cons
3. Snowflake IDs: Twitter's approach, bit allocation
4. Database sequences: auto-increment, sequences, limitations
5. Distributed ID generation: coordination-free approaches
6. IDs with causality: preserving ordering information
7. ULID, KSUID, and other modern formats
