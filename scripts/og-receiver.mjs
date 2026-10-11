#!/usr/bin/env node
// Receives a PNG data URL over HTTP and writes it to public/og.png.
//
// Used once when refreshing the social-share image: run this, then in the
// game page's console call `await ps.captureOgImage()` (see src/game.js),
// which renders a 1200x630 card and POSTs it here.
//
//   node scripts/og-receiver.mjs            listen on :5199, write public/og.png, exit
//   node scripts/og-receiver.mjs --help

import http from 'node:http';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

if (process.argv.includes('--help')) {
  console.log('usage: og-receiver.mjs  (listens on :5199, writes public/og.png from one POST, then exits)');
  process.exit(0);
}

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og.png');
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') return res.end();
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const m = body.match(/^data:image\/png;base64,(.+)$/);
    if (!m) {
      res.statusCode = 400;
      res.end('expected a PNG data URL');
      console.error('bad payload, length', body.length);
      return;
    }
    const buf = Buffer.from(m[1], 'base64');
    writeFileSync(out, buf);
    console.log(`wrote ${out} (${buf.length} bytes)`);
    res.end('ok');
    server.close();
  });
});
server.listen(5199, () => console.log('waiting for og image on http://localhost:5199 ...'));
