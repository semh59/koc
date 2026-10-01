const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path");let bad=0;
const www=f=>path.join(__dirname,"../www",f);
const html=fs.readFileSync(www("index.html"),"utf8").replace(/<script src="([^"]+)"><\/script>/g,(_,f)=>"<script>"+fs.readFileSync(www(f),"utf8")+"</script>");
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const errs=[];
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://localhost/",
  beforeParse(w){w.structuredClone=structuredClone;w.confirm=()=>true;w.scrollTo=()=>{};w.addEventListener("error",e=>errs.push(e.message))}
});
setTimeout(()=>{
  const w=dom.window,ev=s=>w.eval(s);
  ok("sayfa hatasız açılır",errs.length===0&&ev("document.querySelector('#view').innerHTML.length")>100,errs);
  ok("sayı ayrıştırma",ev("[num('83,7'),num('83.7'),num('1.234,5'),num('1.500',true),num('abc')]").slice(0,4).join()==="83.7,83.7,1234.5,1500"&&isNaN(ev("num('abc')")));
  ok("geçersiz spor süresi atılır",ev("cleanEntries([{type:'spor',day:'2026-01-01',v:1500},{type:'spor',day:'2026-01-01',v:30}]).out.length")===1);
  ok("bildirim metni korunur",ev("cleanSettings({reminders:[{id:1,t:'09:00',on:true,body:'Bugün su içmeyi unutma'}]}).reminders[0].body")==="Bugün su içmeyi unutma");
  ok("antrenman süresi 600 dk ile sınırlı",ev("gDur({t0:Date.now()-3e6*60,t1:null})")===600);
  ev("S.settings.consent=false;setKey('nvidia','K1')");
  const bk=ev("JSON.stringify(Object.assign({},S,{settings:Object.assign({},S.settings,{consent:true}),providers:S.providers.map(p=>Object.assign({},p,{base:'https://evil.example/v1',confirm:false}))}))");
  w.document.body.insertAdjacentHTML("beforeend",'<textarea id="bk"></textarea>');w.document.querySelector("#bk").value=bk;
  ev("goYukle()");
  ok("yedek anahtar adresini değiştiremez",ev("S.providers.find(p=>p.id==='nvidia').base")==="https://integrate.api.nvidia.com/v1",ev("S.providers.map(p=>p.base)"));
  ok("yedek onayı ve izni değiştiremez",ev("S.settings.consent")===false&&ev("S.providers.find(p=>p.id==='gemini').confirm")===true);
  ev("S.chat=[];S.cid=1;cReply({reply:'x',log:[],propose:null,flag:'safety'})");
  ok("model güvenlik işareti kart üretir",ev("S.chat.some(m=>m.card&&m.card.kind==='safety')"));
  ev("S.chat=[];Object.assign(S.settings,{age:12,heightCm:165,goalKg:45,healthNote:'',kcal:0});S.entries=[];for(let i=13;i>=0;i--)S.entries.push({id:100+i,day:keyOff(-i),time:'08:00',type:'kilo',v:60-i*0.01,text:''})");
  ev("cReply({reply:'x',log:[],propose:{kcal:1300,why:'a'},flag:null})");
  ok("18 yaş altına açık önerisi çıkmaz",!ev("S.chat.some(m=>m.card&&m.card.kind==='propose')"));
  ev("S.settings.reminders[0].t");
  process.exit(bad?1:0);
},100);
