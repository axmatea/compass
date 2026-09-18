import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep, extname } from 'node:path';
import { createCompassBackend } from './server/app.mjs';
const backend = createCompassBackend();
const root = resolve(process.env.STATIC_ROOT || fileURLToPath(new URL('./dist/', import.meta.url)));
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.mp4':'video/mp4','.woff2':'font/woff2','.ttf':'font/ttf','.vtt':'text/vtt; charset=utf-8','.txt':'text/plain; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.ico':'image/x-icon'};
const server = createServer(async (req,res) => {
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
 if (req.url.startsWith('/api/')) { await backend.handleApi(req,res); return; }
 if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405,{Allow:'GET, HEAD'}).end();return;}
 try {
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/healthz'){res.writeHead(200,{'Content-Type':'text/plain'}).end(req.method==='HEAD'?undefined:'ok');return;}
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  const info=await stat(file);
  if(!info.isFile()){res.writeHead(404).end();return;}
  const headers={'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'public, max-age=0, must-revalidate','Accept-Ranges':'bytes'};
  let start=0,end=info.size-1,status=200;
  if(req.headers.range && req.method==='GET'){
   const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
   if(!m || (!m[1]&&!m[2])){res.writeHead(416,{'Content-Range':`bytes */${info.size}`}).end();return;}
   if(!m[1]){start=Math.max(0,info.size-Number(m[2]));}
   else{start=Number(m[1]);if(m[2])end=Math.min(end,Number(m[2]));}
   if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`}).end();return;}
   status=206;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;
  }
  headers['Content-Length']=info.size===0?0:end-start+1;res.writeHead(status,headers);
  if(req.method==='HEAD'||info.size===0){res.end();return;}
  const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 }catch{if(!res.headersSent)res.writeHead(404);res.end('Not found');}
});
backend.attachVoice(server);
server.listen(Number(process.env.PORT||8770),'0.0.0.0',()=>console.log('COMPASS ready'));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
