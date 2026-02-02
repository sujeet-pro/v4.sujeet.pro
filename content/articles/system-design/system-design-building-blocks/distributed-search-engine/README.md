# Draft: Distributed Search Engine

Building scalable full-text search systems.

## TLDR

- Inverted indexes enable fast text search
- Index partitioning allows horizontal scaling
- Near-real-time indexing balances freshness and performance

## Outline

1. Inverted index: structure, posting lists, compression
2. Index partitioning: document-based, term-based
3. Query processing: Boolean, TF-IDF, BM25
4. Ranking: relevance scoring, personalization
5. Near-real-time indexing: refresh intervals, segment merging
6. Distributed query execution: scatter-gather
7. Elasticsearch/Solr architecture overview
