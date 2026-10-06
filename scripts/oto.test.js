/* Koç sağlayıcısına yalnız kullanıcı eylemiyle gidilir: açılış, geri dönüş, zamanlayıcı ve bildirim yolları ağ isteği atmaz. */
const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path");
const www=f=>path.join(__dirname,"../www",f);
let bad=0;const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const index=fs.readFileSync(www("index.html"),"utf8");
const files=[...index.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).filter(f=>!f.startsWith("vendor/"));
const src=(files.map(f=>fs.readFileSync(www(f),"utf8")).join("\n")+"\n"+[...index.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join("\n"))
  .replace(/(^|[\s;{}),])\/\*[\s\S]*?\*\//g,"$1").replace(/(^|[\s;{}])\/\/[^\n]*/g,"$1"); // yorumdaki adlar çağrı sayılmasın

// ---- statik: çağrı grafiği ----
const close=(s,i,o,c)=>{let d=0;for(;i<s.length;i++){if(s[i]===o)d++;else if(s[i]===c&&--d===0)return i}return s.length};
const fns=Object.create(null);let top=src;
for(const m of src.matchAll(/(?:async\s+)?function\s+([\w$]+)\s*\(/g)){
  const p=close(src,m.index+m[0].length-1,"(",")"),b=src.indexOf("{",p),e=close(src,b,"{","}");
  fns[m[1]]=src.slice(b,e+1);top=top.replace(src.slice(m.index,e+1),"");
}
for(const m of src.matchAll(/const\s+([\w$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[\w$]+)\s*=>([^\n]*)/g)){fns[m[1]]=fns[m[1]]||m[2];top=top.replace(m[0],"")}
/* Dokunma ve klavye dinleyicileri kullanıcı eylemidir; geri kalan her şey (açılış, visibilitychange, zamanlayıcılar, bildirim/widget dinleyicileri) kök sayılır. */
for(const m of [...top.matchAll(/addEventListener\("(click|keydown|input|change)"/g)].reverse())top=top.slice(0,m.index)+top.slice(close(top,m.index+16,"(",")")+1);
const net=Object.keys(fns).filter(k=>/\bfetch\(|\bcallProvider\(/.test(fns[k]));
const ids=s=>new Set(s.match(/[A-Za-z_$][\w$]*/g)||[]);
const seen=new Set(),q=[...ids(top)].filter(k=>k in fns);
while(q.length){const k=q.pop();if(seen.has(k))continue;seen.add(k);for(const x of ids(fns[k]))if(x in fns&&!seen.has(x))q.push(x)}
ok("ağ isteği atan fonksiyonlar bulundu (Koç, kurulum, barkod)",["callProvider","suFetch","barkodBul"].every(k=>net.includes(k)),net);
ok("açılış, visibilitychange, zamanlayıcı ve bildirim yollarından ağ isteğine ulaşılmaz",!net.some(k=>seen.has(k))&&!["cAsk","cFlush","cSend","cComment"].some(k=>seen.has(k)),net.filter(k=>seen.has(k)));
ok("kök tarama gerçekten çalışır: açılış render, visibilitychange ve bildirim dokunuşunu görür",["render","cPlateauCheck","notifTap","scheduleReminders"].every(k=>seen.has(k)));
ok("otomatik Koç yolu ve bayrakları kodda yok",!/\b(cAuto|lastAuto|lastPlan|lastWeekly)\b/.test(src));
ok("cAsk yalnız kullanıcı eylemi fonksiyonlarından çağrılır",Object.keys(fns).filter(k=>k!=="cAsk"&&/\bcAsk\(/.test(fns[k])).sort().join()==="cComment,cFlush,cMenu,cProgram,cWhyAsk");

// ---- jsdom: eski otomatik gönderimi tetikleyen durumla açılış ----
const t=new Date(),key=d=>{const x=new Date(t);x.setDate(x.getDate()-d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`};
const state={settings:{consent:true,consentV:2,consentAt:key(0),age:30,obDone:true,lastPlan:"",lastWeekly:""},
  providers:[{id:"groq",name:"Groq",base:"https://api.groq.com/openai/v1",model:"llama-3.1-8b-instant",on:true,health:true,confirm:false}],
  entries:[1,2,3,4,5,8,9,10].map((d,i)=>({id:i+1,day:key(d),time:"09:00",type:"su",v:500,text:""})),nextId:9,
  chat:[{id:1,role:"user",text:"merhaba",t:Date.now()-6e4,pend:true}],cid:2};
const html=index.replace(/<script src="([^"]+)"><\/script>/g,(_,f)=>"<script>"+fs.readFileSync(www(f),"utf8")+"</script>");
const calls=[];
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://localhost/",beforeParse(w){
  Object.assign(w,{structuredClone,TextEncoder,TextDecoder,__noSelfTest:true});Object.defineProperty(w,"crypto",{value:require("node:crypto").webcrypto});
  w.confirm=()=>true;w.scrollTo=()=>{};
  w.localStorage.setItem("koc_v1",JSON.stringify(state));w.localStorage.setItem("koc_keys",JSON.stringify({groq:"gsk_ornek12345"}));
  w.fetch=async(u,o)=>{calls.push(u);return {ok:true,status:200,json:async()=>({choices:[{message:{content:'{"reply":"Güzel gün","log":[]}'}}]})}};
}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const w=dom.window,ev=s=>w.eval(s),q=s=>w.document.querySelector(s);
  await wait(300);await ev("keysP");await wait(50);
  w.document.dispatchEvent(new w.Event("visibilitychange"));await wait(300);
  ok("onay, anahtar, bekleyen mesaj ve geçen haftanın kaydı varken açılış ve geri dönüş ağ isteği atmaz",calls.length===0&&ev("coachOn()&&usable().length===1"),calls);
  ok("eski otomatik bayraklar yüklemede atılır",!("lastPlan" in ev("S.settings"))&&!("lastWeekly" in ev("S.settings")));
  ok("Bugün'de 'Koç'tan bugünkü yorum iste' düğmesi",!!q('[data-c="cmt:plan"]')&&q('[data-c="cmt:plan"]').textContent.includes("yorum iste"));
  q('[data-c="cmt:plan"]').click();await wait(100);
  ok("düğmeye basınca tek istek, yanıt sohbette günün yorumu olarak",calls.length===1&&ev("S.chat.filter(m=>m.kind==='plan').length")===1&&ev("tab")==="koc",calls);
  ev("tab='bugun';render()");
  ok("bugün alınmış yorum önbellekte: düğme 'gör' olur, basınca istek atılmaz",q('[data-c="cmt:plan"]').textContent.includes("yorumunu gör")&&(q('[data-c="cmt:plan"]').click(),calls.length===1)&&ev("tab")==="koc");
  ok("bekleyen mesaj kendiliğinden gitmez, 'Şimdi gönder' düğmesi görünür",ev("S.chat[0].pend")===true&&!!q('[data-c="retry"]'));
  q('[data-c="retry"]').click();await wait(100);
  ok("'Şimdi gönder' ile bekleyen mesaj gider",calls.length===2&&ev("S.chat[0].pend")!==true,calls);
  ev("tab='trend';render()");q('[data-c="cmt:weekly"]').click();await wait(100);
  const sent=JSON.parse(ev("JSON.stringify(S.chat.filter(m=>m.kind==='weekly').length)"));
  ok("Trend'de haftalık yorum düğmesi: basınca tek istek",calls.length===3&&sent===1,calls);
  ev("S.settings.consent=false;S.chat=[];tab='bugun';render()");
  ok("onay yokken düğme pasif ve nedeni yazar",q('[data-c="cmt:plan"]').disabled&&q("#view").textContent.includes("veri paylaşımını kabul et"));
  console.log(bad?`${bad} FAIL`:"oto: hepsi geçti");process.exit(bad?1:0);
})();
