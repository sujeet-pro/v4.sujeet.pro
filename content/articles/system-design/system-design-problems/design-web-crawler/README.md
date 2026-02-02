# Draft: Design a Web Crawler

Building a scalable web crawler for search engines.

## TLDR

- URL frontier manages crawl scheduling
- Politeness prevents overwhelming target servers
- Duplicate detection avoids redundant work

## Outline

1. Crawler architecture: URL frontier, fetcher, parser
2. URL frontier: prioritization, politeness
3. Scheduling: breadth-first, depth-first, priority-based
4. Duplicate detection: URL normalization, content hashing
5. Robots.txt: respecting crawl rules
6. Distributed crawling: coordination, deduplication
7. Freshness: recrawl scheduling, change detection
