'use strict';
// Development only: expose dist/ on loopback, never repository files.
const http = require('node:http');
const {realpath, stat, readFile} = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..', 'dist');
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.mp3':'audio/mpeg'};
const server = http.createServer(async (req, res) => {
  if (req.url.split('?')[0] === '/api/config' || req.url.split('?')[0] === '/api/health' || req.url.split('?')[0] === '/api/ask' || req.url.split('?')[0] === '/api/route' || req.url.split('?')[0] === '/api/shared-trip') {
    res.status = code => { res.statusCode=code; return res; };
    res.json = data => { res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(data)); };
    const endpoint=req.url.split('?')[0].slice(5);
    if(req.method==='POST'){
      let body='';
      for await(const chunk of req){body+=chunk;if(body.length>12000)return res.status(413).json({error:'Request too large'});}
      try{req.body=JSON.parse(body);}catch{return res.status(400).json({error:'Invalid JSON'});}
    }
    return require('../api/'+endpoint+'.js')(req,res);
  }
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, {Allow: 'GET, HEAD'}).end();
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = path.resolve(root, '.' + pathname);
    const inside = value => value === root || value.startsWith(root + path.sep);
    if (!inside(file)) { res.writeHead(403).end(); return; }
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    file = await realpath(file);
    if (!inside(file)) { res.writeHead(403).end(); return; }
    const data = await readFile(file);
    res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Content-Length': data.length});
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch (error) {
    res.writeHead(error instanceof URIError ? 400 : 404).end();
  }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Rahyar: http://localhost:${port} (Ctrl+C to stop)`));
