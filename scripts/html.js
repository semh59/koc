/* index.html for tests: <script src> and the main script parts (data-src) are inlined. */
const fs=require("fs"),path=require("path");
const www=f=>path.join(__dirname,"../www",f);
const read=f=>fs.readFileSync(www(f),"utf8");
const inline=h=>h.replace(/<link rel="stylesheet" href="([^"]+)">/g,(_,f)=>"<style>"+read(f)+"</style>").replace(/<script src="([^"]+)"><\/script>/g,(_,f)=>"<script>"+read(f)+"</script>")
  .replace(/<script type="text\/x-main" data-src="([^"]+)"><\/script>/g,(_,f)=>'<script type="text/x-main" data-src="'+f+'">'+read(f)+"</script>");
module.exports={www,read,inline,build:()=>inline(read("index.html"))};
module.exports.full=()=>read("index.html")+read("app.css")+fs.readdirSync(www("main")).sort().map(f=>read("main/"+f)).join("");
/* All app scripts (paths relative to www), without vendor and ex. */
module.exports.listJs=(dir="")=>fs.readdirSync(www(dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?(["vendor","ex"].includes(e.name)?[]:module.exports.listJs(dir?dir+"/"+e.name:e.name)):e.name.endsWith(".js")?[dir?dir+"/"+e.name:e.name]:[]);
module.exports.stripComments=s=>s.replace(/\/\*[\s\S]*?\*\//g,"").replace(/(^|[^:\\])\/\/[^\n]*/g,"$1");
/* Boots the app in jsdom; resolves with the window once the main script is ready (nw:boot). `before(w)` installs fakes. */
module.exports.boot=(before,html=module.exports.build())=>{
  const {JSDOM}=require("jsdom");
  const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://localhost/",beforeParse(w){
    Object.assign(w,{structuredClone,TextEncoder,TextDecoder,__noSelfTest:true});
    w.scrollTo=()=>{};w.confirm=()=>true;w.Element.prototype.scrollIntoView=function(){};
    before?.(w);
  }});
  const d=dom.window.document;
  return d.documentElement.dataset.boot?Promise.resolve(dom.window):new Promise(r=>d.addEventListener("nw:boot",()=>r(dom.window),{once:true}));
};
/* Polls `cond` until it is truthy; resolves false on timeout. */
module.exports.until=async(cond,ms=3000)=>{
  for(const end=Date.now()+ms;Date.now()<end;await new Promise(r=>setTimeout(r,5)))if(await cond())return true;
  return false;
};
/* Lets pending promise callbacks run. */
module.exports.flush=()=>new Promise(r=>setImmediate(r));
/* Fake KeyVault plugin: "encryption" is a base64 prefix; `broken` makes every call throw. */
module.exports.fakeVault=broken=>({
  encrypt:async({text})=>{if(broken)throw new Error("keystore");return {data:Buffer.from("ENC:"+text).toString("base64")}},
  decrypt:async({data})=>{const t=Buffer.from(data,"base64").toString();if(broken||!t.startsWith("ENC:"))throw new Error("bad");return {text:t.slice(4)}}
});
