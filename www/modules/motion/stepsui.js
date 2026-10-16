"use strict";
/* Steps: phone sensor and Health Connect values per day, live counter, the steps report and manual step entries. */
const SC=()=>plugin("StepCounter");
/* stepsRead: until the first sensor read at startup finishes, yesterday's steps may not be written yet, so the "counting stopped" card must not show falsely. */
let stepToday=null,stepSnapAt=0,stepsRead=false;
/* When a day's steps drop to 0 the entry is deleted: a zero-step entry is invalid and would raise the "invalid entry dropped" warning on the next start. */
function stepZero(e){if(!(e.v>0))Log.remove(x=>x===e)}
function setSteps(day,v){
  if(!(v>=0&&v<=200000)||day<S.settings.stepsFrom)return false; // steps the user deleted are not written back from the sensor history
  const e=Log.find(x=>x.type==="steps"&&x.day===day&&x.text!=="manual");
  if(e){const m=Math.max(v,e.hc||0);if(e.v===m&&(e.ph===v||!e.hc))return false;e.ph=v;e.v=m;stepZero(e)} // 0 is valid too: when the counter resets, an old inflated entry gets corrected
  else if(v>0)Log.put({day,time:"00:00",type:"steps",v,ph:v,text:""});
  else return false;
  return true;
}
/* Health Connect (watch) daily steps: a day's value is the larger of the phone's (ph) and the watch's (hc), never their sum. When ph is missing (dropped as invalid by cleanEntries) v is the phone value. */
function setHc(day,v){
  if(!(v>=0&&v<=200000)||day<S.settings.stepsFrom)return false;
  const e=Log.find(x=>x.type==="steps"&&x.day===day&&x.text!=="manual");
  if(e){if(e.hc===v)return false;const ph=e.ph!=null?e.ph:e.v;e.ph=ph;e.hc=v;e.v=Math.max(ph,v);stepZero(e)}
  else if(v>0)Log.put({day,time:"00:00",type:"steps",v,ph:0,hc:v,text:""});
  else return false;
  return true;
}
async function stepsSync(){
  hcSync();
  if(!S.settings.stepsOn||!SC())return;
  try{
    const r=await SC().read();let ch=!stepsRead;stepsRead=true;
    if(stepSnapAt!==(+r.snapAt||0)){stepSnapAt=+r.snapAt||0;ch=true}
    for(const d in (r.history||{}))if(dayOk(d)&&setSteps(d,r.history[d]))ch=true;
    if(typeof r.steps==="number"){if(stepToday!==r.steps){stepToday=r.steps;ch=true}if(setSteps(calKey(),r.steps))ch=true}
    if(ch){save();if((tab==="today"||tab==="steps")&&!$("#sheet").classList.contains("on")&&!viewBusy())render();else widgetPush()}
  }catch{}
}
/* Live steps while open: read at a short interval when visible; a new read does not start before the previous one (4 s if the sensor is unresponsive) is done. */
const STEP_POLL=3000;let stepBusy=false;
function stepsTick(){
  if(document.hidden||stepBusy||(tab!=="today"&&tab!=="steps"))return;
  stepBusy=true;return stepsSync().finally(()=>{stepBusy=false});
}
const daySteps=man=>Log.where(e=>e.type==="steps"&&e.day===dayKey()&&(e.text==="manual")===man).reduce((s,e)=>s+e.v,0);
const manualSteps=()=>daySteps(true);
/* The sensor counts per calendar day: between midnight and the app day start the finished day's total is added to the new count. */
const stepsShown=()=>{const hn=hcNow(),t=Math.max(stepToday==null?-1:stepToday,hn==null?-1:hn),late=dayKey()!==calKey()?daySteps(false):0;return t<0&&!late?null:Math.max(t,0)+late+manualSteps()};
function sheetSteps(){openSheet(`<h3>Adım ekle (elle)</h3><p class="flush hint">Telefonu taşımadığın adımlar için. Sensör değerine eklenir.</p><input class="in num" id="fv" inputmode="numeric" placeholder="Adım sayısı" autofocus>${dayOptions()}<button class="btn" data-go="steps">Ekle</button>`)}
function goSteps(){
  const n=num($("#fv").value,true);
  if(!(n>=1&&n<=100000))return toast("Adımı 1 ile 100.000 arasında yaz");
  const e=add("steps",n,"manual",fday());closeSheet();render();toast(`${fint(n)} adım eklendi`,e.id);
}
function stepCard(){
  const g=S.settings.stepGoal,sh=stepsShown(),n=sh==null?null:Math.round(sh),ok=n!=null&&n>=g;
  if(S.settings.hideNums)return `<button class="rbtn" data-tab="steps" aria-label="Adım raporunu aç">${ring(0,"var(--prim)","•••","Adım","sayılar gizli","","mini")}</button>`;
  return `<button class="rbtn" data-tab="steps" aria-label="Adım${n==null?"":`: ${ok?"hedef tamam":`${fint(g-n)} adım kaldı`}, ${fint(n)} / ${fint(g)}`}, raporu aç">${ring((n??0)/g,"var(--prim)",n==null?"–":ok?"✓":fint(g-n),"Adım",`${n==null?"–":fint(n)} / ${fint(g)}`,ok?"Hedef tamam":n==null?"":"adım kaldı","mini"+(ok?" done":""))}</button>`;
}
let stepRange=14;
function viewSteps(){
  const st=S.settings,L=120,stepsOf=dayTotal("steps");
  const all=[];for(let i=L-1;i>=0;i--){const k=calOff(-i);all.push({k,v:stepsOf(k),d:addDays(-i,new Date())})}
  const N=stepRange||new Date().getDate(),days=all.slice(-N),vals=days.map(d=>d.v);
  const today=stepsShown()==null?all[L-1].v:stepsShown(),max=Math.max(st.stepGoal,...vals,1);
  const g=st.stepGoal,sr=Algo.stepStats(vals,g),s7=Algo.stepStats(all.slice(-7).map(d=>d.v),g),s30=Algo.stepStats(all.slice(-30).map(d=>d.v),g),sl=Algo.stepStats(all.map(d=>d.v),g);
  const best=sr.best>=0?days[sr.best]:null;
  const W=320,H=130,pl=12,gap=N>14?2:6,bw=Math.min(16,(W-2*pl-gap*(N-1))/N),step=N>1?(W-2*pl-bw)/(N-1):0,Y=v=>H-18-(H-30)*(v/max);
  const bars=days.map((d,i)=>{const x=N>1?pl+i*step:(W-bw)/2,y=Y(d.v),hit=d.v>=g,cx=(x+bw/2).toFixed(1);
    const lbl=N<=7?WEEKDAYS_SHORT[d.d.getDay()]:(i%7===0||i===N-1)&&(i===N-1||N-1-i>=4)?fd(d.k):"";
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0,H-18-y).toFixed(1)}" rx="${bw>8?4:1.5}" fill="var(--water)" opacity="${hit?1:.45}"/>${lbl?`<text x="${cx}" y="${H-5}" text-anchor="${N<=7?"middle":i===0?"start":i===N-1?"end":"middle"}">${lbl}</text>`:""}${hit&&N<=14?`<text x="${cx}" y="${(y-3).toFixed(1)}" text-anchor="middle" style="fill:var(--ink)">✓</text>`:""}`}).join("");
  const seg=`<div class="seg tight" role="group" aria-label="Grafik aralığı">${[[7,"7 gün"],[14,"14 gün"],[30,"30 gün"],[0,"Bu ay"]].map(([n,l])=>`<button data-sr="${n}" aria-pressed="${stepRange===n}">${l}</button>`).join("")}</div>`;
  const tx=days.map(d=>`${fd(d.k)} · ${d.v?fint(d.v)+" adım":"kayıt yok"}`),tip=esc(JSON.stringify(days.map((d,i)=>[+((N>1?pl+i*step:(W-bw)/2)+bw/2).toFixed(1),+Y(d.v).toFixed(1),tx[i]])));
  const chartBody=sr.n?`<svg class="w100 bars" viewBox="0 0 ${W} ${H}" role="img" aria-label="Son ${N} günün adımları, günlük ortalama ${fint(sr.avg)}, hedef ${fint(g)}. Tüm değerler grafiğin altındaki tabloda" data-tip="${tip}">${bars}<line x1="0" x2="${W}" y1="${Y(g).toFixed(1)}" y2="${Y(g).toFixed(1)}" stroke="var(--kcal)" stroke-width="1.4" stroke-dasharray="4 3"/></svg><div class="mut sm">Kesik çizgi hedef. ${N<=14?"✓ ve koyu":"Koyu"} çubuk: hedefe ulaşılan gün.</div>${ptsTable(tx)}`:`<p class="hint">Bu aralıkta adım kaydı yok.</p>`;
  const wAll=weights(),wd=Object.keys(wAll).sort(),kg=wd.length?Algo.trend(wAll)[wd[wd.length-1]]:null;
  const km=st.heightCm>0?today*st.heightCm*0.415/1e5:null;
  const extra=km!=null?`<div class="stat"><div class="k">Yaklaşık mesafe</div><div class="v num">${fmt(km,1)} km</div></div>${kg!=null?`<div class="stat"><div class="k">Yaklaşık enerji</div><div class="v num">${Math.round(0.5*kg*km)} kcal</div></div>`:""}`:"";
  const rows=all.slice(-7).reverse().map(d=>`<div class="row"><span>${d.k===calKey()?"Bugün":WEEKDAYS_SHORT[d.d.getDay()]+" "+fd(d.k)}</span><b class="num">${d.v?fint(d.v):"–"}</b></div>`).join("");
  const man=Log.where(e=>e.type==="steps"&&e.text==="manual").sort((a,b)=>b.day.localeCompare(a.day)||b.id-a.id).map(e=>`<div class="prow"><button class="grow pbtn" data-edit="${e.id}" aria-label="${fd(e.day)}, ${fint(e.v)} adım, düzenle"><span class="grow">${fd(e.day)}</span><b class="num">+${fint(e.v)}</b></button><button class="del" data-del="${e.id}" aria-label="Kaydı sil">✕</button></div>`).join("");
  const manualCard=`<div class="card"><div class="lbl">Elle eklenenler</div>${man||'<p class="hint">Elle eklediğin adım yok.</p>'}<button class="lnk" data-act="stepsadd">Adım ekle (elle)</button></div>`;
  /* With no steps at all: one sentence and starting a walk instead of a wall of counters and statistics. */
  if(!sl.n&&!today&&!S.walk)return `${emptyCard("steps","Henüz adım kaydı yok","Telefonu yanında taşıdıkça adımların burada görünür.",`<button class="btn" data-w="start">Yürüyüş başlat</button>`)}
  ${hcCard()}${motionCard()}
  ${manualCard}`;
  return `<div class="tc card">${ring(today/st.stepGoal,"var(--water)",fint(today),"Bugün",`/ ${fint(st.stepGoal)} adım`,"adım")}</div>
  ${walkCard()}
  <div class="card"><div class="lbl">Adım grafiği</div>${seg}${chartBody}</div>
  <div class="stats"><div class="stat"><div class="k">7 gün ortalaması</div><div class="v num">${s7.n?fint(s7.avg):"–"}</div></div><div class="stat"><div class="k">30 gün ortalaması</div><div class="v num">${s30.n?fint(s30.avg):"–"}</div></div>${st.hideNums?"":`<div class="stat"><div class="k">En iyi gün</div><div class="v num">${best?fint(best.v):"–"}</div>${best?`<div class="mut sm">${fd(best.k)}</div>`:""}</div>`}${st.hideNums||st.hideStreak?"":`<div class="stat"><div class="k">Hedef serisi</div><div class="v num">${sl.streak} gün</div></div>`}<div class="stat"><div class="k">Hedefe ulaşılan gün</div><div class="v num">${sr.hit} / ${N}</div></div>${extra}</div>
  ${motionCard()}
  <div class="card"><div class="lbl">Günler</div>${rows}</div>
  ${hcCard()}
  ${manualCard}
  ${km==null?`<p class="hint">Mesafe için Ayarlar'dan boyunu gir.</p>`:""}
  <p class="hint">Kaynak: telefonun adım sensörü. Yalnızca telefonu taşıdığın adımlar sayılır. Çok yavaş yürüyüşte az sayabilir, genelde sapma %5-10 civarıdır. ${S.settings.moveKcalOn?"Enerji ve mesafe yaklaşıktır. Adımlar kalori hedefine eklenmez; Profil'deki ayar açık olduğundan yalnız kayıtlı antrenman ve hareketler eklenir.":"Enerji ve mesafe yaklaşıktır ve günlük kalori hedefine eklenmez: harcama tahmini zaten gerçek kilo değişimine dayanır."} Ortalamalar yalnız adım kaydı olan günlerden hesaplanır.</p>`;
}
async function stepsOpen(){
  const p=SC();if(!p)return;
  try{
    const a=await p.isAvailable();
    if(!a.available)return toast("Bu telefonda adım sensörü yok");
    const g=await p.requestAccess();
    if(!g.granted){S.settings.stepsAsked=true;save();render();return toast("Fiziksel aktivite izni verilmedi. Telefon ayarlarından açabilirsin")}
    S.settings.stepsOn=true;S.settings.stepsAsked=true;save();await p.start();await stepsSync();render();toast("Adım sayar açık");
  }catch{toast("Adım sayar açılamadı")}
}
