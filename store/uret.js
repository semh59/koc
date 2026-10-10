"use strict";
/* Play Store images: node store/uret.js (made-up data; www/ is served from a local server). */
const path=require("path"),fs=require("fs"),http=require("http");
const {chromium}=require("@playwright/test");
const {NOW,day,state,entry,CONSENT}=require("../e2e/fixtures");
const root=path.join(__dirname,".."),out=__dirname,www=path.join(root,"www"),PORT=4199;
const logo="data:image/png;base64,"+fs.readFileSync(path.join(root,"assets","logo.png")).toString("base64");

const server=()=>new Promise(res=>{
  const s=http.createServer((q,r)=>{
    const p=path.join(www,decodeURIComponent(q.url.split("?")[0]));
    fs.readFile(p,(e,b)=>{if(e||!p.startsWith(www)){r.writeHead(404);return r.end()}
      const t={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css",".json":"application/json",".png":"image/png",".svg":"image/svg+xml"}[path.extname(p)]||"application/octet-stream";
      r.writeHead(200,{"Content-Type":t,"Cache-Control":"no-store"});r.end(b)});
  }).listen(PORT,"127.0.0.1",()=>res(s));
});

async function icon(b){
  const pg=await b.newPage({viewport:{width:512,height:512}});
  await pg.setContent(`<body style="margin:0;background:rgba(16,93,86,.996)"><img src="${logo}" style="display:block;width:512px;height:512px">`);
  await pg.screenshot({path:path.join(out,"simge-512.png"),omitBackground:true});await pg.close();
}

async function banner(b){
  const pg=await b.newPage({viewport:{width:1024,height:500}});
  await pg.setContent(`<style>body{margin:0;width:1024px;height:500px;background:linear-gradient(135deg,#0f5c55,#0a4640);color:#fff;font-family:"Segoe UI",system-ui,sans-serif;display:flex;align-items:center;gap:56px;padding:0 90px;box-sizing:border-box;overflow:hidden}
img{width:230px;height:230px;border-radius:52px;box-shadow:0 12px 40px #0006}h1{margin:0;font-size:96px;font-weight:700;letter-spacing:-2px}p{margin:14px 0 0;font-size:36px;color:#cfeee6;line-height:1.3}</style>
<img src="${logo}"><div><h1>NeoWell</h1><p>Yemek, hareket ve ilaçların<br>tek sakin ekranda.</p></div>`);
  await pg.screenshot({path:path.join(out,"one-cikan-1024x500.png")});await pg.close();
}

const S=(o,rest)=>state({stepsOn:true,stepGoal:8000,medOn:true,kcal:2100,goalKg:78,...o},rest);
const weights=[...Array(14)].map((_,i)=>entry("weight",+(84.1-i*0.12+(i%3===1?0.15:0)).toFixed(1),"",{d:-(13-i)}));
const meals=[entry("food",320,"Menemen",{time:"08:30",x:{meal:"breakfast"}}),entry("food",180,"Ayran ve simit",{time:"09:20",x:{meal:"breakfast"}}),entry("water",250,"",{time:"09:30"}),entry("water",250,"",{time:"09:45"}),entry("exercise",35,"Yürüyüş",{time:"07:30",x:{km:3.1}})];
const past=(n,ex)=>({id:n,day:day(-n),t0:NOW.getTime()-n*864e5,t1:NOW.getTime()-n*864e5+45*60e3,name:"Antrenman",tpl:null,ex});
const workouts=[past(2,[{id:"bench",sets:[{kg:50,reps:10,done:true},{kg:55,reps:8,done:true}]}]),past(5,[{id:"bench",sets:[{kg:50,reps:10,done:true}]}])];
const templates=[{id:1,name:"Üst vücut",ex:["bench","row","ohp","curl"]},{id:2,name:"Alt vücut ve sırt",ex:["deadlift","pullup"]}];
const meds=[{id:1,n:"Vitamin D",d:"1000 IU",t:["09:00"],on:true},{id:2,n:"Magnezyum",d:"250 mg",t:["21:30"],on:true},{id:3,n:"Omega 3",d:"1 kapsül",t:["13:00"],on:true}];
const medLog=[...Array(30)].flatMap((_,i)=>meds.map(m=>({id:i*3+m.id,m:m.id,day:day(-i),slot:m.t[0],st:"t",at:m.t[0]})).filter(x=>i>0||x.m===1));
const chat=[
  {id:1,role:"user",t:NOW.getTime()-6e4*10,text:"Tamam. Yarın kahvaltıda ne yiyebilirim?"},
  {id:2,role:"coach",t:NOW.getTime()-6e4*9,text:"Yumurta, peynir, domates ve bir dilim tam buğday ekmeği dengeli bir başlangıç olur. Yanına ayran ya da şekersiz çay iyi gider."}
];

const SHOTS=[
  ["ekran-1-bugun",{seed:S({},{entries:[...meals,...weights]}),native:{steps:6240}},async a=>{}],
  ["ekran-2-koc",{seed:S(CONSENT,{entries:weights,chat,cid:3}),keys:{groq:"gsk_demo"}},async a=>{await a.tab("coach")}],
  ["ekran-3-salon",{seed:S({},{entries:weights,workouts,templates,gid:3})},async a=>{await a.tab("gym")}],
  ["ekran-4-trend",{seed:S({},{entries:[...meals,...weights]})},async a=>{await a.tab("trend")}],
  ["ekran-5-ilaclar",{seed:S({},{entries:weights,meds,medLog}),native:{}},async a=>{await a.go("meds")}],
  ["ekran-6-yemek-ekle",{seed:S({},{entries:[...meals,...weights]})},async a=>{await a.page.click('.act[data-act="food"]');await a.page.fill("#fq","menemen");await a.page.locator("#flist [data-food]").first().waitFor()}]
];

async function shot(b,[name,open,act]){
  const ctx=await b.newContext({baseURL:`http://127.0.0.1:${PORT}`,viewport:{width:360,height:640},deviceScaleFactor:3,isMobile:true,hasTouch:true,locale:"tr-TR",timezoneId:"Europe/Istanbul",reducedMotion:"reduce",serviceWorkers:"block"});
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort("internetdisconnected"));
  const page=await ctx.newPage(),a={page,
    async tab(n){await page.locator(`nav button[data-tab="${n}"]`).click()},
    async go(t){await page.evaluate(t=>{const x=document.createElement("button");x.dataset.tab=t;document.body.append(x);x.click();x.remove()},t)}};
  await page.clock.install({time:NOW});
  await page.addInitScript(([s,k])=>{localStorage.setItem("nw_state",JSON.stringify(s));if(k)localStorage.setItem("nw_keys",JSON.stringify(k))},[open.seed,open.keys||null]);
  if(open.native)await page.addInitScript(([c])=>{const P={};if(c.steps!=null)P.StepCounter={isAvailable:async()=>({available:true}),requestAccess:async()=>({granted:true}),start:async()=>({}),read:async()=>({steps:c.steps,snapAt:Date.now(),history:{}})};P.App={addListener:()=>({remove(){}}),exitApp(){}};window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>"android",Plugins:P}},[open.native]);
  await page.goto("/index.html");await page.locator("#view:not(:empty)").waitFor();
  await act(a);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.screenshot({path:path.join(out,name+".png")});await ctx.close();
}

(async()=>{
  const s=await server(),b=await chromium.launch({channel:process.env.E2E_CHANNEL??"chrome"});
  try{await icon(b);await banner(b);for(const x of SHOTS)await shot(b,x)}finally{await b.close();s.close()}
})().catch(e=>{console.error(e);process.exit(1)});
