"use strict";
/* Rehberli antrenman ekranı: #guide tam ekran katmanı, render()'dan bağımsız (görünüm yeniden çizilince kaybolmasın).
   guidelib.js (motor), gym.js/exui.js (gEx, gTimed, gRestSec, gAddEx, gNotify, exDef) ile çalışır. */
let gd=null;
const GD_NID=9003; // 9001 süreli set, 9002 dinlenme ile aynı anda kurulu olabilir
const SPK=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Speech;
const gdOn=()=>!!gd&&!gd.fin;
const gdName=id=>gEx(id).n;
/* Android WebView'de speechSynthesis ses çıkarmıyor (rekabet-egzersiz #12); yalnız yerel eklenti. Ses yoksa sessiz geçer. */
function gdSay(t){if(t&&S.settings.gdVoice&&SPK())SPK().speak({text:t}).catch(()=>{})}
function gdVib(p){if(S.settings.gdVib)try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}}
const gdDur=steps=>Math.max(1,Math.round(GuideLib.total(GuideLib.phases(steps))/60));

function gdPick(){
  const row=(v,n,sub)=>`<button class="rrow" data-g="gdgo:${v}"><span class="tx"><b>${esc(n)}</b><span class="mut sm">${sub}</span></span><span class="plus">›</span></button>`;
  const tpl=S.templates.filter(t=>t.ex.length).map(t=>row("t:"+t.id,t.name,`${t.ex.length} egzersiz · ~${gdDur(gdTplSteps(t))} dk`)).join("");
  openSheet(`<h3>Rehberli başlat</h3><p class="hint" style="padding:0 0 6px">Adım adım: animasyon, geri sayım ve sesli komut.</p>
  <div class="lbl">Esneme, ısınma ve ev antrenmanı</div><div class="plist">${GuideLib.FLOWS.map(f=>row("f:"+f.id,f.n,`${f.about} ~${gdDur(f.steps)} dk`)).join("")}</div>
  ${tpl?`<div class="lbl">Şablonlarım</div><div class="plist">${tpl}</div>`:""}
  <p class="hint">${gPgNote}</p><button class="btn ghost" data-g="closesheet">Kapat</button>`);
}
// "Şablon olarak kaydet" şablonunda set/süre yok: editördeki gibi türün varsayılanı.
const gdTplSteps=t=>GuideLib.fromTpl({ex:t.ex,tg:Object.fromEntries(t.ex.map(i=>[i,Object.assign(gTgDef(i),t.tg&&t.tg[i])]))},gTimed,gRestSec);
/* v: "f:akış", "t:şablon", "p:program-günSırası". */
function gdStart(v){
  const [k,id]=[v.slice(0,1),v.slice(2)];let steps,meta;
  if(k==="f"){const f=GuideLib.FLOWS.find(x=>x.id===id);if(!f)return;steps=f.steps;meta={n:f.n,warm:!!f.warm}}
  else if(k==="t"){const t=S.templates.find(x=>x.id===+id);if(!t)return;steps=gdTplSteps(t);meta={n:t.name,tpl:t.id}}
  else{const [pid,di]=id.split("-"),p=PrgLib.PROGRAMS.find(x=>x.id===pid),d=p&&p.days[+di];if(!d)return;steps=gdTplSteps(PrgLib.toTpl(d));meta={n:`${p.n} – ${d.n}`.slice(0,60)}}
  if(!steps.length)return toast("Şablonda egzersiz yok");
  closeSheet();
  gd={st:GuideLib.start(steps,Date.now()),meta,cd:-1,fin:false};
  $("#guide").hidden=false;document.body.classList.add("gdon");
  clearInterval(gdTick.iv);gdTick.iv=setInterval(gdTick,250);
  gdEnter();gAwake(true);
}
function gdEnter(){
  const st=gd.st;
  if(GuideLib.over(st))return gdFinish(true);
  const p=st.ph[st.i];
  gdSay(GuideLib.cue(st,gdName,gd.cd===st.i-1));
  if(st.i)gdVib(p.k==="w"?[300]:[150,100,150]);
  gdSched();gdRender();
}
/* Ekran kapalıyken JS durabilir: evre bitişi yerel bildirimle de duyurulur, her evrede yeniden kurulur. */
function gdSched(){
  const st=gd.st,nx=st.ph[st.i+1];
  if(gd.fin||st.pause!=null||st.end==null)return gNotifyCancel(GD_NID);
  const up=nx&&(nx.k==="w"?nx:GuideLib.nextWork({ph:st.ph,i:st.i+1}));
  gNotify(st.end,!nx?"Akış bitti":nx.k==="r"?"Dinlen":"Başla: "+gdName(nx.ex),up?`Sıradaki: ${gdName(up.ex)}`:gd.meta.n,GD_NID);
}
function gdTick(){
  if(!gdOn())return;
  const st=gd.st,now=Date.now();
  if(GuideLib.tick(st,now))return gdEnter();
  const p=st.ph[st.i],l=GuideLib.left(st,now);
  if(p.k==="r"&&st.pause==null&&l!=null&&l<=3000&&gd.cd!==st.i&&GuideLib.nextWork(st)){gd.cd=st.i;gdSay(GuideLib.SAY.go)}
  gdUpd();
}
const GD_C=2*Math.PI*52;
function gdUpd(){
  const st=gd.st,now=Date.now(),p=st.ph[st.i],l=GuideLib.left(st,now),tot=GuideLib.total(st.ph);
  const fr=p.reps?Math.min(1,GuideLib.elapsed(st,now)/(p.sec*1000)):1-l/(p.sec*1000);
  const set=(s,f)=>{const e=$(s);if(e)f(e)};
  set("#gdpg",e=>e.setAttribute("stroke-dashoffset",(GD_C*fr).toFixed(1)));
  if(!p.reps)set("#gdt",e=>{e.textContent=gClock(l+999)});
  set("#gdrem",e=>{e.textContent=`Kalan ${gClock(GuideLib.remain(st,now)*1000)} · ${GuideLib.stepsLeft(st)} adım`});
  set("#gdbar",e=>{e.style.width=(100*(1-GuideLib.remain(st,now)/tot)).toFixed(1)+"%"});
}
function gdRender(){
  const el=$("#guide");if(!gd)return;
  if(gd.fin)return void(el.innerHTML=gdSumHtml());
  const st=gd.st,p=st.ph[st.i],ws=st.ph.map((x,i)=>i).filter(i=>i>=st.i&&st.ph[i].k==="w");
  const cur=st.ph[ws[0]],nx=st.ph[ws[1]],e=cur&&gEx(cur.ex),fig=e&&e.tp?exFig(e,true):"",cue=e&&(EXCUE[e.tp]||[])[0];
  const lbl=p.k==="w"?(p.n>1?`Set ${p.r}/${p.n}`:"Çalış"):st.i?"Dinlen, sıradaki":"Hazırlan, ilk hareket";
  const k=st.ph.slice(0,ws[0]+1).filter(x=>x.k==="w").length,paused=st.pause!=null,rest=p.k==="r";
  const ring=`<div class="gdring${rest?" gdrs":""}"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="tr" cx="60" cy="60" r="52"/><circle class="pg" id="gdpg" cx="60" cy="60" r="52" stroke-dasharray="${GD_C.toFixed(1)}" stroke-dashoffset="0"/></svg>
    <div class="gdtm">${p.reps?`<b class="num">${p.reps}</b><span class="mut sm">tekrar</span>`:`<b class="num" id="gdt" role="timer"></b><span class="mut sm">${paused?"duraklatıldı":rest?"dinlenme":"saniye"}</span>`}</div></div>`;
  el.innerHTML=`<div class="gdtop"><button class="gdx" data-gd="end" aria-label="Akışı bitir">✕</button><b>${esc(gd.meta.n)}</b><span class="num mut sm">${k}/${GuideLib.works(st)}</span></div>
  <div class="gdbar" aria-hidden="true"><i id="gdbar"></i></div>
  <div class="gdbody"><div class="gdA"><div class="gdfig">${fig}</div>
  <div class="gdl">${lbl}</div><h2 class="gdn">${e?esc(e.n):""}</h2>${cue?`<p class="gdc">${esc(cue)}</p>`:""}</div>
  <div class="gdB">${ring}${p.reps?`<p class="gdc">Bitince Bitti'ye dokun · kılavuz ~${p.sec} sn</p>`:""}
  ${nx?`<div class="gdnx"><span class="mut sm">Sonra</span><b>${esc(gdName(nx.ex))}</b><span class="num mut sm">${nx.reps?nx.reps+" tekrar":nx.sec+" sn"}</span></div>`:`<div class="gdnx"><span class="mut sm">Son hareket</span></div>`}
  <div class="gdctl"><button class="btn ghost" data-gd="back">Geri</button><button class="btn${paused?"":" ghost"}" data-gd="${paused?"resume":"pause"}">${paused?"Devam":"Duraklat"}</button><button class="btn${p.reps&&!paused?"":" ghost"}" data-gd="${p.k==="w"&&p.reps?"done":"skip"}">${p.k==="w"&&p.reps?"Bitti":"Geç"}</button></div>
  <p class="gdrem num mut sm" id="gdrem"></p><p class="hint">Genel bilgidir, tıbbi tavsiye değildir. ${gPainNote}</p></div></div>`;
  gdUpd();
}
function gdFinish(natural){
  gd.fin=true;gd.t1=Date.now();gNotifyCancel(GD_NID);
  if(natural){gdSay(GuideLib.SAY.end);gdVib([300,120,300])}
  gdRender();gAwake(true);
}
function gdSumHtml(){
  const r=GuideLib.result(gd.st),n=r.reduce((s,x)=>s+x.sets.length,0);
  const rows=r.map(x=>`<div class="prow"><span style="flex:1;min-width:0"><b>${esc(gdName(x.ex))}</b><span class="mut sm num">${x.sets.map(s=>s.reps?s.reps+" tekrar":s.sec+" sn").join(" · ")}</span></span>${gKind(x.ex)==="w"&&!gd.meta.warm?`<input class="in num" style="width:84px;margin:0" inputmode="decimal" data-gdkg="${x.ex}" value="${fkg(gdLastKg(x.ex))}" placeholder="kg" aria-label="${esc(gdName(x.ex))} ağırlık (kg)">`:""}</span></div>`).join("");
  return `<div class="gdtop"><b>${esc(gd.meta.n)}</b></div>
  <h2 class="gdn" style="text-align:left;margin:8px 0">${GuideLib.over(gd.st)?"Akış bitti":"Akış durduruldu"}</h2>
  <div class="two"><div class="stat"><div class="k">Süre</div><div class="v num">${gClock(gd.t1-gd.st.t0)}</div></div><div class="stat"><div class="k">Tamamlanan</div><div class="v num">${n}/${GuideLib.works(gd.st)}</div></div></div>
  <div class="plist">${rows||`<p class="hint">Tamamlanan hareket yok.</p>`}</div>
  ${n?`<p class="hint">${gd.meta.warm?"Isınma seti olarak kaydedilir: hacme, haftalık set sayısına ve spor dakikasına girmez.":"Salon geçmişine süresiyle ve spor dakikasına eklenir. Ağırlıklı harekette kullandığın ağırlığı yaz (önceki seanstaki dolu gelir)."}</p>`:""}
  <div class="gdfoot">${n?`<button class="btn" data-gd="save">Antrenman olarak kaydet</button>`:""}<button class="btn ghost" data-gd="close">${n?"Kaydetmeden kapat":"Kapat"}</button></div>`;
}
/* Ağırlık öneriden değil önceki seansın gerçek setinden: öneri bir hedeftir, kaydedilirse yapılmamış artış ve sahte rekor üretir. */
const gdLastKg=id=>{const h=gHistory(id)[0];return h?Math.max(...gWork(h.sets).map(s=>s.kg||0)):""};
/* Yalnız kullanıcı onaylayınca: gAddEx ile set yapısı (tür, set sayısı) kurulur, tamamlananlar done:true ve sec dolu. */
function gdSave(){
  const r=GuideLib.result(gd.st);if(!r.length)return;
  const kg={};
  for(const el of document.querySelectorAll("#guide [data-gdkg]")){
    const v=num(el.value);if(el.value.trim()===""||isNaN(v)||v<0||v>1000)return toast("Ağırlığı 0-1000 kg arasında yaz, ağırlıksızsa 0 yaz");
    kg[el.dataset.gdkg]=v;
  }
  const w={id:S.gid++,day:dayKey(new Date(gd.st.t0)),t0:gd.st.t0,t1:gd.t1,name:gd.meta.n.slice(0,60),tpl:gd.meta.tpl||null,ex:[]};
  for(const x of r){
    gAddEx(w,x.ex,{sets:x.sets.length});
    const y=w.ex[w.ex.length-1];
    y.sets=y.sets.map((s,i)=>Object.assign({kg:x.ex in kg?kg[x.ex]:s.kg,reps:x.sets[i].reps||s.reps,sec:Math.min(7200,x.sets[i].sec),done:true},gd.meta.warm?{w:true}:{}));
  }
  S.workouts.push(w);
  if(!gd.meta.warm)gLogSpor(w,"Rehberli");
  save();gdClose();render();toast("Antrenman kaydedildi",()=>{S.workouts=S.workouts.filter(x=>x!==w);S.entries=S.entries.filter(e=>e.wid!==w.id);save();render()});
}
function gdClose(){
  clearInterval(gdTick.iv);gNotifyCancel(GD_NID);
  if(SPK())SPK().stop().catch(()=>{});
  gd=null;$("#guide").hidden=true;$("#guide").innerHTML="";document.body.classList.remove("gdon");gAwake(true);
}
function gdEnd(){if(GuideLib.over(gd.st)||confirm("Akış burada bitirilsin mi? Tamamlananları kaydedebilirsin."))gdFinish(false)}
/* Donanım geri tuşu: akış sürerken bitirme sorusu, özetteyken kapatır. */
function gdBack(){if(!gd)return false;if(!gd.fin)gdEnd();else if(!GuideLib.result(gd.st).length||confirm("Tamamlananlar kaydedilmeden kapatılsın mı?"))gdClose();return true}
function gdClick(a){
  const st=gd&&gd.st,now=Date.now();if(!st)return;
  switch(a){
    case "pause":GuideLib.pause(st,now);gdSay(GuideLib.SAY.pause);gdSched();return gdRender();
    case "resume":GuideLib.resume(st,now);gdSched();return gdRender();
    case "skip":if(GuideLib.skip(st,now))gdEnter();return;
    case "done":if(GuideLib.finish(st,now))gdEnter();return;
    case "back":GuideLib.back(st,now);gd.cd=-1;return gdEnter();
    case "end":return gdEnd();
    case "save":return gdSave();
    case "close":return gdClose();
  }
}
document.addEventListener("click",ev=>{const b=ev.target.closest("[data-gd]");if(b)gdClick(b.dataset.gd)});
