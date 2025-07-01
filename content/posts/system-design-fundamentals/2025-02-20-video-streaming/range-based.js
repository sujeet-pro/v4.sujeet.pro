import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const PORT = 3000;
const VIDEO_PATH = path.join(__dirname, 'video.mp4');

const server = http.createServer((req, res) => {
  // Get video stats (about 61MB)
  const stat = fs.statSync(VIDEO_PATH);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Parse range
    // Example: "bytes=32324-"
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;

    // Create read stream for this chunk
    const stream = fs.createReadStream(VIDEO_PATH, { start, end });

    // Send partial content response
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4'
    });

    // Pipe the video chunk to response
    stream.pipe(res);
  } else {
    // No range requested, send entire file
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes'
    });
    fs.createReadStream(VIDEO_PATH).pipe(res);
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});