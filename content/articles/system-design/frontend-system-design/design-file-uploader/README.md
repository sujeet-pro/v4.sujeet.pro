# Draft: Design a File Uploader

Building robust file upload components.

## TLDR

- Chunked uploads handle large files reliably
- Resumable uploads recover from network failures
- Progress tracking improves user experience

## Outline

1. Upload methods: form submission, XHR, Fetch
2. Chunked upload: splitting files, parallel upload
3. Resumable uploads: tus protocol, resumption
4. Progress tracking: upload progress, chunk progress
5. Preview: image preview, file type icons
6. Validation: file type, size, dimensions
7. Drag and drop: drop zone, multiple files
8. Error handling: retry, timeout, network errors
