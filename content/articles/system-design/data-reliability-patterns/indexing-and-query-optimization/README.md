# Draft: Indexing and Query Optimization

Design indexes and queries that scale with data growth.

## TLDR

- Indexes speed reads at the cost of writes and storage
- Query plans explain real performance behavior
- Composite indexes need careful ordering

## Outline

1. Index types and tradeoffs
2. Composite and covering indexes
3. Query planning and execution
4. Write amplification and maintenance
5. Monitoring slow queries
6. Optimization checklist
