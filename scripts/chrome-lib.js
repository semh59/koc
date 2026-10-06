"use strict";
/* Başsız Chrome'u CDP ile sürer (ek bağımlılık yok). Chrome yoksa find() null döner, testler atlanır. */
const fs=require("fs"),os=require("os"),path=require("path"),cp=require("child_process");
function find(){
  const c=[process.env.CHROME_BIN,"C:/Program Files/Google/Chrome/Application/chrome.exe","C:/Program Files (x86)/Google/Chrome/Application/chrome.exe","C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe","/usr/bin/google-chrome","/usr/bin/google-chrome-stable","/usr/bin/chromium","/usr/bin/chromium-browser"];
  return c.find(p=>p&&fs.existsSync(p))||null;
}
async function launch(bin){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"koc-chrome-"));
  const proc=cp.spawn(bin,["--headless=new","--disable-gpu","--no-sandbox","--hide-scrollbars","--remote-debugging-port=0","--user-data-dir="+dir,"about:blank"],{stdio:["ignore","ignore","pipe"]});
  const pf=path.join(dir,"DevToolsActivePort");
  let err="";proc.stderr.on("data",d=>{err+=d});proc.on("exit",c=>{err+=" exit "+c});
  let txt="";
  for(let i=0;i<300&&!/\n./.test(txt);i++){await new Promise(r=>setTimeout(r,100));try{txt=fs.readFileSync(pf,"utf8")}catch(e){}}
  if(!/
./.test(txt))throw new Error("Chrome başlamadı: "+bin+" "+err.slice(-600));
  const [port,pth]=txt.trim().split(/\r?\n/);
  const ws=new WebSocket(`ws://127.0.0.1:${port}${pth}`);
  await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
  let id=0;const pend=new Map();
  ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pend.has(d.id)){const [r,j]=pend.get(d.id);pend.delete(d.id);d.error?j(new Error(d.error.message)):r(d.result)}};
  const send=(method,params={},sessionId)=>new Promise((r,j)=>{const i=++id;pend.set(i,[r,j]);ws.send(JSON.stringify({id:i,method,params,sessionId}))});
  const {targetId}=await send("Target.createTarget",{url:"about:blank"});
  const {sessionId}=await send("Target.attachToTarget",{targetId,flatten:true});
  const cmd=(m,p)=>send(m,p,sessionId);
  await cmd("Page.enable");
  return {
    async open(url,w,h){
      await cmd("Emulation.setDeviceMetricsOverride",{width:w,height:h,deviceScaleFactor:1,mobile:true});
      await cmd("Page.navigate",{url});await new Promise(r=>setTimeout(r,1500));
    },
    async eval(expr){
      const r=await cmd("Runtime.evaluate",{expression:expr,returnByValue:true,awaitPromise:true});
      if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception&&r.exceptionDetails.exception.description||r.exceptionDetails.text);
      return r.result.value;
    },
    async shot(file){fs.writeFileSync(file,Buffer.from((await cmd("Page.captureScreenshot",{format:"png"})).data,"base64"))},
    close(){try{ws.close()}catch(e){}proc.kill();setTimeout(()=>{try{fs.rmSync(dir,{recursive:true,force:true,maxRetries:5})}catch(e){}},500)}
  };
}
module.exports={find,launch};
