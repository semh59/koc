"use strict";
/* Sahte yapay zekâ sağlayıcısı (Node http). Tarayıcıdaki sağlayıcı adresleri page.route ile buraya yönlenir;
   gelen her istek kaydedilir. Davranış testten değiştirilir: model listesi, model başına hata, sohbet yanıtı. */
const http=require("http");
const HOSTS=["integrate.api.nvidia.com","api.groq.com","openrouter.ai","generativelanguage.googleapis.com","api.openai.com","api.anthropic.com","custom.example"];
const CORS={"access-control-allow-origin":"*","access-control-allow-headers":"*","access-control-allow-methods":"GET,POST,OPTIONS"};
const json=(r,code,o)=>{r.writeHead(code,{"content-type":"application/json",...CORS});r.end(JSON.stringify(o))};
const DEF_MODELS={
  "integrate.api.nvidia.com":["nvidia/nemotron-3-super-120b-a12b","google/gemma-4-31b-it","meta/llama-guard-4","nvidia/nv-embed-v2"],
  "api.groq.com":["llama-3.3-70b-versatile","whisper-large-v3"],
  "openrouter.ai":["google/gemma-4-31b-it:free"],
  "generativelanguage.googleapis.com":["models/gemini-3.5-flash-lite","models/text-embedding-004"],
  "api.openai.com":["gpt-6-luna","text-embedding-3-small"],
  "api.anthropic.com":["claude-haiku-4-5","claude-sonnet-5-5"]
};
async function startFake(){
  const st={log:[],models:{...DEF_MODELS},behave:{},reply:()=>JSON.stringify({reply:"Merhaba, buradayım."}),badKeys:[],delay:0,finish:()=>"stop"};
  const srv=http.createServer((q,r)=>{
    let body="";q.on("data",d=>body+=d);q.on("end",()=>{
      const [,host,...rest]=q.url.split("/"),path="/"+rest.join("/");
      if(q.method==="OPTIONS"){r.writeHead(204,CORS);return r.end()}
      let b=null;try{b=body?JSON.parse(body):null}catch(e){}
      const key=q.headers["x-api-key"]||String(q.headers.authorization||"").replace(/^Bearer /,"");
      st.log.push({method:q.method,host,path,key,body:b});
      if(st.badKeys.includes(key))return json(r,401,{error:{message:"Invalid API key"}});
      if(q.method==="GET"&&/\/models(\?|$)/.test(path)){
        const ids=st.models[host]||[];
        return json(r,200,{data:ids.map(id=>host==="openrouter.ai"?{id,pricing:{prompt:"0",completion:"0"}}:{id})});
      }
      const model=b&&b.model,how=st.behave[model]||"ok";
      if(how==="hang")return; // yanıt yok: uygulamanın zaman aşımı devreye girer
      if(how==="404fn")return json(r,404,{status:404,title:"Not Found",detail:`Function '${model}': Not found for account`});
      if(how==="plain404"){r.writeHead(404,{"content-type":"text/plain",...CORS});return r.end("404 page not found")}
      if(how==="410")return json(r,410,{error:{message:`The model ${model} has reached its end of life`}});
      if(how==="403")return json(r,403,{error:{message:"Authorization failed"}});
      if(st.delay&&!(b&&Array.isArray(b.messages)&&b.messages.length===1))return setTimeout(()=>answer(r,host,b,how),st.delay);
      answer(r,host,b,how);
    });
  });
  function answer(r,host,b,how){
    const probe=b&&Array.isArray(b.messages)&&b.messages.length===1&&/Sadece 'tamam' yaz/.test(b.messages[0].content);
    const text=probe?"tamam":st.reply(b);
    if(host==="api.anthropic.com")return json(r,200,{type:"message",content:[{type:"text",text}],stop_reason:"end_turn"});
    if(how==="think")return json(r,200,{choices:[{message:{role:"assistant",content:null,reasoning_content:"Kullanıcı tamam yazmamı istiyor."},finish_reason:"length"}]});
    json(r,200,{choices:[{message:{role:"assistant",content:text},finish_reason:st.finish(b)}]});
  }
  await new Promise(ok=>srv.listen(0,"127.0.0.1",ok));
  const url=`http://127.0.0.1:${srv.address().port}`;
  return {
    st,url,
    chats:()=>st.log.filter(x=>x.method==="POST"&&!(x.body&&x.body.messages&&x.body.messages.length===1&&/Sadece 'tamam' yaz/.test(x.body.messages[0].content))),
    async attach(ctx){
      for(const h of HOSTS)await ctx.route(`https://${h}/**`,async route=>{
        const req=route.request(),u=new URL(req.url());
        if(req.method()==="OPTIONS")return route.fulfill({status:204,headers:CORS}).catch(()=>{});
        try{
          const res=await route.fetch({url:`${url}/${h}${u.pathname}${u.search}`,timeout:0});
          await route.fulfill({response:res,headers:{...res.headers(),...CORS}});
        }catch(e){await route.abort("failed").catch(()=>{})}
      });
    },
    close:()=>new Promise(ok=>{srv.closeAllConnections();srv.close(()=>ok())})
  };
}
module.exports={startFake,HOSTS};
