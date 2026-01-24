# Draft: Design Search and Autocomplete

Low-latency search with typeahead suggestions at scale.

## TLDR

- Indexing and caching are core to latency
- Autocomplete requires prefix data structures
- Relevance depends on ranking and personalization

## Outline

1. Functional requirements and latency targets
2. Indexing pipeline and refresh
3. Autocomplete data structures
4. Ranking and personalization
5. Caching and shard strategy
6. Monitoring and evaluation
