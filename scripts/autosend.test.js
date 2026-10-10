/* The Coach provider is contacted only by a user action: startup, return, timer and notification paths make no network request. */
const {ok,finish}=require("./ok");
const fs=require("fs");
const {www,full,boot,until,flush}=require("./html");
const index=full();
const files=[...index.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).filter(f=>!f.startsWith("vendor/"));
const src=(files.map(f=>fs.readFileSync(www(f),"utf8")).join("\n")+"\n"+fs.readdirSync(www("main")).sort().map(f=>fs.readFileSync(www("main/"+f),"utf8")).join("")+"\n"+[...index.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(t=>!t.includes("Store.init()")).join("\n"))
  .replace(/(^|[\s;{}),])\/\*[\s\S]*?\*\//g,"$1").replace(/(^|[\s;{}])\/\/[^\n]*/g,"$1"); // so that names in comments are not counted as calls

// static: call graph
const close=(s,i,o,c)=>{let d=0;for(;i<s.length;i++){if(s[i]===o)d++;else if(s[i]===c&&--d===0)return i}return s.length};
const fns=Object.create(null);let top=src;
for(const m of src.matchAll(/(?:async\s+)?function\s+([\w$]+)\s*\(/g)){
  const p=close(src,m.index+m[0].length-1,"(",")"),b=src.indexOf("{",p),e=close(src,b,"{","}");
  fns[m[1]]=src.slice(b,e+1);top=top.replace(src.slice(m.index,e+1),"");
}
for(const m of src.matchAll(/const\s+([\w$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[\w$]+)\s*=>([^\n]*)/g)){fns[m[1]]=fns[m[1]]||m[2];top=top.replace(m[0],"")}
/* Touch and keyboard listeners are user actions; everything else (startup, visibilitychange, timers, notification/widget listeners) counts as a root. */
for(const m of [...top.matchAll(/addEventListener\("(click|keydown|input|change)"/g)].reverse())top=top.slice(0,m.index)+top.slice(close(top,m.index+16,"(",")")+1);
for(const m of [...top.matchAll(/^on(?:Pre)?\("[^"]+",/gm)].reverse())top=top.slice(0,m.index)+top.slice(close(top,m.index+m[0].indexOf("("),"(",")")+1); // Act registrations run only on a user click, like a click listener
const net=Object.keys(fns).filter(k=>/\bNetLog\.fetch\(|\bcallProvider\(/.test(fns[k]));
const ids=s=>new Set(s.match(/[A-Za-z_$][\w$]*/g)||[]);
const seen=new Set(),q=[...ids(top)].filter(k=>k in fns);
while(q.length){const k=q.pop();if(seen.has(k))continue;seen.add(k);for(const x of ids(fns[k]))if(x in fns&&!seen.has(x))q.push(x)}
ok("every outgoing request goes through NetLog.fetch: no other fetch( call besides the same-origin file read and NetLog itself",(src.match(/(?<![.\w])fetch\(/g)||[]).length<=1,(src.match(/.{30}(?<![.\w])fetch\(.{20}/g)||[]));
ok("the functions that make network requests are found (Coach, setup, barcode)",["callProvider","fetchModels","barcodeFind"].every(k=>net.includes(k)),net);
ok("no network request is reachable from startup, visibilitychange, timer and notification paths",!net.some(k=>seen.has(k))&&!["cAsk","cFlush","cSend","cComment"].some(k=>seen.has(k)),net.filter(k=>seen.has(k)));
ok("the root scan really works: it sees startup render, visibilitychange and the notification tap",["render","cPlateauCheck","notifTap","scheduleReminders"].every(k=>seen.has(k)));
ok("cAsk is called only from user-action functions",Object.keys(fns).filter(k=>k!=="cAsk"&&/\bcAsk\(/.test(fns[k])).sort().join()==="cComment,cFlush,cMenu,cProgram,cWhyAsk");

// jsdom: startup with the state that used to trigger an automatic send
const t=new Date(),key=d=>{const x=new Date(t);x.setDate(x.getDate()-d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`};
const state={settings:{consent:true,consentV:2,consentAt:key(0),consentP:"gemini,groq,nvidia,openrouter",age:30,obDone:true,noticeOk:true,lastPlan:"",lastWeekly:""},
  providers:[{id:"groq",name:"Groq",base:"https://api.groq.com/openai/v1",model:"llama-3.1-8b-instant",on:true,health:true,confirm:false}],
  entries:[1,2,3,4,5,8,9,10].map((d,i)=>({id:i+1,day:key(d),time:"09:00",type:"water",v:500,text:""})),nextId:9,
  chat:[{id:1,role:"user",text:"merhaba",t:Date.now()-6e4,pend:true}],cid:2};
const calls=[];
(async()=>{
  const w=await boot(w=>{
    Object.defineProperty(w,"crypto",{value:require("node:crypto").webcrypto});
    w.localStorage.setItem("nw_state",JSON.stringify(state));w.localStorage.setItem("nw_keys",JSON.stringify({groq:"gsk_ornek12345"}));
    w.fetch=async(u)=>{calls.push(u);return {ok:true,status:200,json:async()=>({choices:[{message:{content:'{"reply":"Güzel gün","log":[]}'}}]})}};
  }),ev=s=>w.eval(s),q=s=>w.document.querySelector(s);
  await ev("keysP");
  w.document.dispatchEvent(new w.Event("visibilitychange"));await flush();
  ok("with consent, a key, a pending message and last week's records present, startup and return make no network request",calls.length===0&&ev("coachOn()&&usable().length===1"),calls);
  ok("the \"ask the Coach for today's comment\" button on Today",!!q('[data-c="cmt:plan"]')&&q('[data-c="cmt:plan"]').textContent.includes("yorum iste"));
  q('[data-c="cmt:plan"]').click();await until(()=>calls.length>0);
  ok("pressing the button makes a single request, the reply appears in the chat as the day's comment",calls.length===1&&ev("S.chat.filter(m=>m.kind==='plan').length")===1&&ev("tab")==="coach",calls);
  ev("tab='today';render()");
  ok("today's comment is cached: the button becomes \"see\", pressing it makes no request",q('[data-c="cmt:plan"]').textContent.includes("yorumunu gör")&&(q('[data-c="cmt:plan"]').click(),calls.length===1)&&ev("tab")==="coach");
  ok("the pending message does not go on its own, a \"send now\" button shows",ev("S.chat[0].pend")===true&&!!q('[data-c="retry"]'));
  q('[data-c="retry"]').click();await until(()=>calls.length>1);
  ok("\"send now\" sends the pending message",calls.length===2&&ev("S.chat[0].pend")!==true,calls);
  ev("tab='trend';render()");q('[data-c="cmt:weekly"]').click();await until(()=>calls.length>2);
  const sent=JSON.parse(ev("JSON.stringify(S.chat.filter(m=>m.kind==='weekly').length)"));
  ok("the weekly comment button in Trend: pressing it makes a single request",calls.length===3&&sent===1,calls);
  ev("S.settings.consent=false;S.chat=[];tab='today';render()");
  ok("without consent the button is disabled and says why",q('[data-c="cmt:plan"]').disabled&&q("#view").textContent.includes("veri paylaşımını kabul et"));
  finish();
})();
