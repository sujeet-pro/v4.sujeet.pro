# Draft: Discord Message Storage

How Discord handles trillions of messages.

## TLDR

- Cassandra provides scalable message storage
- Data modeling decisions significantly impact performance
- Hot partition handling prevents scaling issues

## Outline

1. Scale: trillions of messages
2. Cassandra migration: from MongoDB to Cassandra
3. Data modeling: partition keys, clustering keys
4. Hot partition handling: preventing hotspots
5. Read/write patterns: optimizing for chat
6. Scaling challenges: cluster growth, compaction
7. Lessons learned: data modeling decisions
