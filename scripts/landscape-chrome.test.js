"use strict";
/* Real layout: in headless Chrome on a short landscape screen, every interactive element of the guided mode and the sheets must be visible and touchable.
   SHOTS=<folder> writes a screenshot of every state. Skipped without Chrome (CI has google-chrome). */
const path=require("path"),fs=require("fs"),L=require("./chrome-lib");
const {ok,finish}=require("./ok");
const bin=L.find();
if(!bin){console.log("SKIPPED: Chrome not found");process.exit(0)}
/* fetch does not work under file://, so the page is opened as a copy with the main script parts inlined. */
const tmpHtml=path.join(__dirname,"../www/.lc-test.html");fs.writeFileSync(tmpHtml,require("./html").build());
process.on("exit",()=>{try{fs.unlinkSync(tmpHtml)}catch(e){}});
const url=require("url").pathToFileURL(tmpHtml).href;
const shots=process.env.SHOTS;if(shots)fs.mkdirSync(shots,{recursive:true});
/* The element's center must hit the element itself (or a child): clipping, overflow and being covered by another layer are all caught. */
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
      await b.eval(`window.confirm=()=>true;S=structuredClone(DEF);S.settings.obDone=true;S.gid=50;const wk=EXDB.find(e=>(e.k||"w")==="w");
        S.templates=[{id:1,name:"Ev antrenmanı uzun bir ad deneme",ex:["plank","pushup",wk.id],tg:{plank:{sets:2,sec:30},pushup:{sets:2,reps:8}}}];tab="gym";render();1`);
      const states=[["prepare","gdStart('f:'+GuideLib.FLOWS[0].id)"],
        ["work",skipTo('gd.st.ph[gd.st.i].k==="w"')],["rest",skipTo('gd.st.ph[gd.st.i].k==="r"')],
        ["pause","gdClick('pause')"],["resume","gdClick('resume')"]];
      const check=async(name,sel,js,sc)=>{
        if(js)await b.eval(js);
        if(sel==="#sheet")await b.waitFor("document.getAnimations().length===0");
        const r=await b.eval(probe(sel,sc||sel!=="#guide"));
        if(shots)await b.shot(path.join(shots,`${name}-${tag}.png`));
        ok(`${tag} ${name}: every interactive element is visible, on top and at least 44 px`,!r.miss&&!r.bad.length,r);
        if(land&&sel==="#guide")ok(`${tag} ${name}: the layer is full width and fits the screen`,r.box[2]===w&&r.box[3]<=h&&r.sw<=w,r);
      };
      for(const [n,js] of states)await check("guide-"+n,"#guide",js);
      await b.eval("gdClick('end')");
      await check("guide-summary-empty","#guide");
      await b.eval("gdClose();gdStart('t:1')");
      await check("guide-template","#guide");
      await b.eval(skipTo('gd.st.ph[gd.st.i].reps'));await check("guide-reps","#guide");
      await b.eval("for(let i=0;i<12;i++){const p=gd.st.ph[gd.st.i];if(p)gdClick(p.k==='w'&&p.reps?'done':'skip')}");
      await check("guide-summary","#guide",0,1);
      await b.eval("gdClose();gdPick()");
      await check("guide-pick-sheet","#sheet");
    }
  }finally{b.close()}
  finish();
})().catch(e=>{console.error(e);process.exit(1)});
