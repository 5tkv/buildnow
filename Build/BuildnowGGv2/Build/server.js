const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 6720;

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.data': 'application/octet-stream',
  '.png': 'image/png'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Security headers for Unity WebGL
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // Clean URL and default to index.html
  const cleanUrl = req.url.split('?')[0];
  let filePath = '.' + cleanUrl;
  if (filePath === './') filePath = './index.html';

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404);
      return res.end('404 Not Found: ' + filePath);
    }

    let ext = path.extname(filePath).toLowerCase();
    let contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Handle Brotli compressed files
    if (ext === '.br') {
      res.setHeader('Content-Encoding', 'br');
      contentType = MIME_TYPES[path.extname(filePath.slice(0, -3))] || contentType;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stat.size);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('error', (e) => {
      res.writeHead(500);
      res.end('Server error: ' + e);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
