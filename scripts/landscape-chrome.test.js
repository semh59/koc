"use strict";
/* Gerçek yerleşim: başsız Chrome'da yatay kısa ekranda rehberli mod ve sheet'lerin tüm etkileşimli öğeleri görünür ve dokunulabilir mi.
   SHOTS=klasör verilirse her durumun ekran görüntüsünü yazar. Chrome yoksa atlanır (CI'da google-chrome var). */
const path=require("path"),fs=require("fs"),L=require("./chrome-lib");
const bin=L.find();
if(!bin){console.log("ATLANDI: Chrome bulunamadı");process.exit(0)}
const url=require("url").pathToFileURL(path.join(__dirname,"../www/index.html")).href;
const shots=process.env.SHOTS;if(shots)fs.mkdirSync(shots,{recursive:true});
let bad=0;const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
/* Öğenin merkez noktasında öğenin kendisi (ya da çocuğu) üstte olmalı: kesilme, taşma ve başka katmanın altında kalma hepsini yakalar. */
const probe=(root,scroll)=>`(()=>{const r=document.querySelector(${JSON.stringify(root)});if(!r)return {miss:1};const vw=innerWidth,vh=innerHeight,out=[];
  for(const e of r.querySelectorAll("button,input,a,[data-gd],[data-g],[data-act],select")){let b=e.getBoundingClientRect();if(!b.width&&!b.height)continue;${scroll?'e.scrollIntoView({block:"nearest"});b=e.getBoundingClientRect();':''}
    const cx=b.left+b.width/2,cy=b.top+b.height/2,t=document.elementFromPoint(Math.min(vw-1,Math.max(0,cx)),Math.min(vh-1,Math.max(0,cy)));
    const inside=b.left>=-.5&&b.top>=-.5&&b.right<=vw+.5&&b.bottom<=vh+.5;
    if(!inside||!(t===e||e.contains(t))||b.height<43.5||b.width<43.5)out.push((e.dataset.gd||e.dataset.g||e.textContent||e.className).slice(0,24)+" "+[b.left,b.top,b.width,b.height].map(Math.round))}
  const g=r.getBoundingClientRect();return {bad:out,box:[g.left,g.top,g.width,g.height].map(Math.round),sw:document.documentElement.scrollWidth,vw,vh}})()`;
const skipTo=pred=>`(()=>{for(let i=0;i<60&&!(${pred});i++)gdClick("skip");return ${pred}})()`;
(async()=>{
  const b=await L.launch(bin);
  try{
    for(const [w,h] of [[800,360],[640,360],[360,640],[1280,800]]){
      const land=h<=500,tag=`${w}x${h}`;
      await b.open(url,w,h);
      await b.eval(`window.confirm=()=>true;S=structuredClone(DEF);S.settings.obDone=true;S.gid=50;const wk=EXMERGED.find(e=>(e.k||"w")==="w");
        S.templates=[{id:1,name:"Ev antrenmanı uzun bir ad deneme",ex:["plank","pushup",wk.id],tg:{plank:{sets:2,sec:30},pushup:{sets:2,reps:8}}}];tab="salon";render();1`);
      const states=[["hazirlan","gdStart('f:'+GuideLib.FLOWS[0].id)"],
        ["calis",skipTo('gd.st.ph[gd.st.i].k==="w"')],["dinlen",skipTo('gd.st.ph[gd.st.i].k==="r"')],
        ["duraklat","gdClick('pause')"],["devam","gdClick('resume')"]];
      const check=async(name,sel,js,sc)=>{if(js)await b.eval(js);if(sel==="#sheet")await b.eval("new Promise(r=>setTimeout(r,600))");const r=await b.eval(probe(sel,sc||sel!=="#guide"));
        if(shots)await b.shot(path.join(shots,`${name}-${tag}.png`));
        ok(`${tag} ${name}: tüm etkileşimli öğeler görünür, üstte ve ≥44 px`,!r.miss&&!r.bad.length,r);
        if(land&&sel==="#guide")ok(`${tag} ${name}: katman tam genişlik ve ekrana sığar`,r.box[2]===w&&r.box[3]<=h&&r.sw<=w,r)};
      for(const [n,js] of states)await check("rehber-"+n,"#guide",js);
      await b.eval("gdClick('end')");
      await check("rehber-ozet-bos","#guide");
      await b.eval("gdClose();gdStart('t:1')");
      await check("rehber-sablon","#guide");
      await b.eval(skipTo('gd.st.ph[gd.st.i].reps'));await check("rehber-tekrarli","#guide");
      await b.eval("for(let i=0;i<12;i++){const p=gd.st.ph[gd.st.i];if(p)gdClick(p.k==='w'&&p.reps?'done':'skip')}");
      await check("rehber-ozet","#guide",0,1);
      await b.eval("gdClose();gdPick()");
      await check("rehber-secim-sheet","#sheet");
    }
  }finally{b.close()}
  if(bad){console.log(bad+" HATA");process.exit(1)}console.log("TAMAM");process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
