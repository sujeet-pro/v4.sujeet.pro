# Draft: Design Dropbox File Sync

Building a file synchronization service like Dropbox.

## TLDR

- Content-defined chunking enables efficient sync
- Delta sync transfers only changes
- Conflict resolution handles simultaneous edits

## Outline

1. Sync protocol: bidirectional sync, conflict detection
2. Chunking: content-defined chunking, deduplication
3. Delta sync: transferring only changes
4. Conflict resolution: conflicted copies, merge
5. File versioning: version history, restore
6. Bandwidth optimization: compression, prioritization
7. Sharing: shared folders, links, permissions
