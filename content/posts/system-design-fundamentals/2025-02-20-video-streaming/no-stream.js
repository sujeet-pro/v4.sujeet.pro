import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const PORT = 3000;
const VIDEO_PATH = path.join(__dirname, 'video.mp4');

const server = http.createServer((req, res) => {
  // Serve video without range support
  const videoStream = fs.createReadStream(VIDEO_PATH);
  res.writeHead(200, { 'Content-Type': 'video/mp4' });
  videoStream.on('error', () => {
      res.writeHead(500);
      res.end('Error loading video');
  });
  videoStream.pipe(res);
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});