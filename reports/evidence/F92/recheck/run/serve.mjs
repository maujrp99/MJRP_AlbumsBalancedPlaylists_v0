import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const dist = process.argv[2];
const T = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const s = http.createServer((q, r) => { const u = new URL(q.url, 'http://x');
  if (u.pathname.startsWith('/api/') || u.pathname === '/country.json') { r.writeHead(404); r.end('{}'); return; }
  let f = path.join(dist, decodeURIComponent(u.pathname));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, u.pathname.startsWith('/assets') ? 'missing' : 'app.html');
  if (!fs.existsSync(f)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); });
s.listen(0, '127.0.0.1', () => console.log(`serving http://127.0.0.1:${s.address().port}`));
