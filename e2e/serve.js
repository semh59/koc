"use strict";
/* Static server for www/ (Playwright webServer). Cache off: every test gets the latest file. */
const http=require("http"),fs=require("fs"),path=require("path");
const root=path.join(__dirname,"..","www"),port=+process.env.E2E_PORT||4173;
const MIME={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css",".json":"application/json",".png":"image/png",".svg":"image/svg+xml",".webp":"image/webp",".jpg":"image/jpeg",".mjs":"text/javascript; charset=utf-8",".wasm":"application/wasm",".woff2":"font/woff2"};
http.createServer((q,r)=>{
  const p=path.normalize(path.join(root,decodeURIComponent(q.url.split("?")[0])));
  if(!p.startsWith(root)){r.writeHead(403);return r.end()}
  fs.readFile(p.endsWith(path.sep)?path.join(p,"index.html"):p,(e,b)=>{
    if(e){r.writeHead(404);return r.end()}
    r.writeHead(200,{"Content-Type":MIME[path.extname(p)]||"application/octet-stream","Cache-Control":"no-store"});r.end(b);
  });
}).listen(port,"127.0.0.1",()=>console.log("www: http://127.0.0.1:"+port));
