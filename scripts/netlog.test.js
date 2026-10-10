const {ok,finish}=require("./ok");

const store=new Map();
global.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
global.window={fetch:async()=>({ok:true})};
const NetLog=require("../www/kernel/netlog.js");

(async()=>{
  await NetLog.fetch("chat","https://api.groq.com/openai/v1/chat/completions",{method:"POST",body:"merhaba şifre"});
  let rows=NetLog.recent();
  ok("a request is logged with kind, host, body bytes and result, never the content",rows.length===1&&rows[0].kind==="chat"&&rows[0].host==="api.groq.com"&&rows[0].out===14&&rows[0].ok===true&&!store.get(NetLog.KEY).includes("merhaba"),rows);

  global.window.fetch=async()=>{throw new TypeError("offline")};
  let err=null;try{await NetLog.fetch("off","https://world.openfoodfacts.org/api/v2/product/1.json")}catch(e){err=e}
  rows=NetLog.recent();
  ok("a failed request is logged as failed and the error still reaches the caller",err&&err.message==="offline"&&rows.length===2&&rows[1].ok===false&&rows[1].out===0,rows);

  global.window.fetch=async()=>({ok:false,status:401});
  await NetLog.fetch("models","https://api.openai.com/v1/models");
  ok("an HTTP error response is logged as not ok",NetLog.recent().pop().ok===false);

  for(let i=0;i<120;i++)await NetLog.fetch("off","https://world.openfoodfacts.org/x");
  ok("the log keeps at most 100 rows",JSON.parse(store.get(NetLog.KEY)).length===100);

  const old=JSON.parse(store.get(NetLog.KEY));old[0].t=Date.now()-31*864e5;store.set(NetLog.KEY,JSON.stringify(old));
  ok("rows older than 30 days are not shown",NetLog.recent().length===99);

  store.set(NetLog.KEY,"{bozuk");
  ok("a corrupt log reads as empty",NetLog.recent().length===0);
  store.set(NetLog.KEY,JSON.stringify([{t:1,kind:"x"},null,{t:Date.now(),kind:"off",host:"a.b",out:0,ok:true}]));
  ok("rows with a missing field are dropped",NetLog.recent().length===1);

  global.localStorage.setItem=()=>{throw new Error("quota")};
  global.window.fetch=async()=>({ok:true});
  let thrown=false;try{await NetLog.fetch("off","https://a.b/c")}catch{thrown=true}
  ok("a storage error never breaks the request",!thrown);

  NetLog.clear();
  ok("clear empties the log",NetLog.recent().length===0);
  finish();
})();
