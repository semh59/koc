"use strict";
/* Blood pressure and glucose screens: records, averages and plots. The only interpretation is the emergency box and the neutral "ask your doctor" line after a save. The data is never sent to the Coach. */
let vRange=14,vSession="morning",vCtx="fasting",vConfirm="";
const vMmol=()=>Units.gu()==="mmol",vDec=()=>vMmol()?1:0;
/* Averages and extremes are rounded to an integer in mg/dL and shown with 1 decimal in mmol/L. */
const vAvg=x=>vMmol()?dg(x):Math.round(x);
const vNow=()=>{const d=new Date();return `${pad(d.getHours())}:${pad(d.getMinutes())}`};
const vToMin=t=>+t.slice(0,2)*60+ +t.slice(3,5);
const vFy=k=>Algo.fdate(k,true);
const VT_REMINDERS={bp:[7,8],bs:[9]};
const vErrText=c=>c.err==="date"?"Gün ve saati seç":c.err==="glucose"?`Şeker ${dg(VitalsLib.LIM.g[0])}-${dg(VitalsLib.LIM.g[1])} ${glab()} arasında olmalı`:c.err;

/* ---- Settings ---- */
function vitalsSettingsHtml(){
  const st=S.settings,h="Evde ölçtüğün tansiyon ve şekeri kaydet. Uygulama değerleri yorumlamaz; kaydeder, ortalamasını ve grafiğini gösterir. Veriler telefondan çıkmaz.";
  const lim=`<button class="lnk" data-vt="limits">Hekimimin verdiği sınır${st.bpSysHi||st.bpDiaHi||st.gFastHi||st.gPostHi||st.bpSysLo||st.bpDiaLo||st.gFastLo?" (açık)":""}</button>`;
  return modRow('data-vt="bptoggle"',st.bpOn,"Tansiyon","Ev ölçümleri, ortalama ve grafik.","hlpbp",h,lim)+modRow('data-vt="bstoggle"',st.bsOn,"Şeker","Ölçümler, ortalama ve grafik.","hlpbs",h,lim);
}
function vToggle(kind){
  const st=S.settings,on=kind==="bp"?"bpOn":"bsOn",ids=VT_REMINDERS[kind];
  st[on]=!st[on];
  for(const r of st.reminders)if(ids.includes(r.id))r.on=st[on];
  save();render();scheduleReminders().then(setNotif);
  toast(st[on]?(kind==="bp"?"Tansiyon takibi açık, sabah ve akşam hatırlatması da açıldı. Saatleri Ayarlar > Hatırlatmalar'dan değiştirebilirsin":"Şeker takibi açık, ölçüm hatırlatması da açıldı. Saatini Ayarlar > Hatırlatmalar'dan değiştirebilirsin"):"Kapatıldı. Kayıtların durur");
}
/* ---- Today and Trend cards ---- */
const vLast=k=>VitalsLib.latest(S.vitals.filter(r=>r.k===k));
/* What Today and Trend call "son": for blood pressure the last session's mean, the same figure the save message gives. */
const vShown=k=>{if(k!=="t")return vLast(k);const l=VitalsLib.sessions(S.vitals);return l[l.length-1]};
/* Today's reading shown on the quick chip, so the value stays visible after the to-do row is gone. */
const vChipTxt=k=>{const r=vShown(k);return r&&r.day===dayKey()&&!S.settings.hideNums?" "+(k==="t"?`${Math.round(r.sys)}/${Math.round(r.dia)}`:`${dg(r.g)} ${glab()}`):""};
function vWhen(r){return (r.day===dayKey()?"bugün ":fd(r.day)+" ")+r.time}
/* The neutral line under the Today chips while any of today's readings is at the "ask your doctor" level; never colours or names the value. */
const vAskToday=()=>S.vitals.some(r=>r.day===dayKey()&&VitalsLib.level(r,dayKey(),vMy())==="ask");
/* Today's to-do: one row per kind that is on, not yet measured today and whose reminder time has come (the default time when the reminder is off). */
function vTodo(){
  const st=S.settings,t=dayKey(),out=[],hm=vNow(),due=ids=>{const rs=st.reminders.filter(r=>ids.includes(r.id)),on=rs.filter(r=>r.on);return (on.length?on:rs).map(r=>r.t).sort()[0]<=hm};
  for(const [on,k,ic,label,act,txt,ids] of [[st.bpOn,"t","heart","Tansiyon","addbp",r=>`${Math.round(r.sys)}/${Math.round(r.dia)}`,VT_REMINDERS.bp],[st.bsOn,"s","glucose","Şeker","addbs",r=>dg(r.g),VT_REMINDERS.bs]]){
    const r=vShown(k);
    /* Home blood pressure is a morning and an evening habit: once the evening reminder time has passed with no evening session, the row returns although the morning one is done. */
    const eveDue=k==="t"&&r&&r.day===t&&(st.reminders.find(x=>x.id===VT_REMINDERS.bp[1])||{t:"99"}).t<=hm&&!VitalsLib.sessions(S.vitals).some(x=>x.day===t&&x.session==="evening");
    if(!on||(r&&r.day===t&&!eveDue)||(!eveDue&&!due(ids)))continue;
    out.push(`<div class="row"><span>${Icons.svg(ic)} ${label} ölç<small class="mut sm num">${r?`son: ${st.hideNums?"•••":txt(r)}, ${vWhen(r)}`:"henüz ölçüm yok"}</small></span><button class="chip" data-vt="${act}" aria-label="${label} ölçümü ekle">Ekle</button></div>`);
  }
  return out;
}
function vTrendCards(){
  const st=S.settings,c=(tab,ic,t,txt)=>navRow(`data-tab="${tab}"`,ic,t,txt);
  const one=(k,none)=>{const r=vShown(k);return r?`son: ${k==="t"?Math.round(r.sys)+"/"+Math.round(r.dia):dg(r.g)}, ${vWhen(r)}`:none};
  return (st.bpOn?c("bp","heart","Tansiyon",one("t","Henüz ölçüm yok")):"")+(st.bsOn?c("glucose","water","Şeker",one("s","Henüz ölçüm yok")):"");
}

/* ---- Entry sheets ---- */
const vIn=(id,lab,val="",ph="")=>`<label class="labf"><span>${lab}</span><input class="in num" id="${id}" inputmode="numeric" value="${val}" placeholder="${ph}" autocomplete="off"></label>`;
/* The note is folded (open when it has text) with a character counter. */
const vNote=(val="")=>`<details class="acc"${val?" open":""}><summary>Not ekle</summary><label class="lbl" for="vnot">Not (isteğe bağlı)</label><input class="in" id="vnot" maxlength="80" value="${esc(val)}" autocomplete="off"><div class="mut sm" id="vnc">${val.length} / 80</div></details>`;
const vChips=(attr,list,sel)=>`<div class="chips">${list.map(([v,l])=>`<button class="chip" data-${attr}="${v}" aria-pressed="${v===sel}">${l}</button>`).join("")}</div>`;
function sheetBp(){
  vConfirm="";vSession=new Date().getHours()<12?"morning":"evening";
  const l=vLast("t")||{},ph=k=>l[k]??"";
  openSheet(`<h3>Tansiyon ekle</h3>
  <div class="lbl">Seans</div>${vChips("vsession",VitalsLib.SESSIONS,vSession)}
  <div class="lbl">1. ölçüm</div><div class="g3 mb-2">${vIn("bs1","Büyük","",ph("sys"))}${vIn("bd1","Küçük","",ph("dia"))}${vIn("bn1","Nabız","",ph("pulse"))}</div>
  <details class="acc mb-2"><summary>2. ölçüm (1-2 dakika sonra, isteğe bağlı)</summary><div class="g3 mb-2">${vIn("bs2","Büyük")}${vIn("bd2","Küçük")}${vIn("bn2","Nabız")}</div></details>
  ${dayOptions()}<label class="lbl" for="vtime">Saat</label><input class="in" type="time" id="vtime" value="${vNow()}">
  ${vNote()}
  <div class="mb-2 mut sm">Ölçmeden önce 5 dakika otur, kol kalp hizasında olsun. Sabah ölçümü kahvaltı ve ilaçtan önce.</div>
  <div class="ferr" id="vwarn" role="alert"></div><button class="btn" data-vt="savebp">Kaydet</button>`);
}
function sheetBs(){
  vConfirm="";vCtx=S.settings.vCtx||(new Date().getHours()<10?"fasting":"random");
  openSheet(`<h3>Şeker ekle</h3>
  <div class="lbl"><label for="gv" id="gul">Şeker (${glab()})</label> <button class="chip" data-tu="g" data-for="gv" data-lbl="gul" aria-label="Birimi bu kayıt için değiştir">mg/dL ⇄ mmol/L</button></div><input class="in num" id="gv" inputmode="${vMmol()?"decimal":"numeric"}" placeholder="örn. ${vMmol()?"5,3":"95"}" autocomplete="off" autofocus>
  <div class="lbl">Ne zaman ölçtün?</div>${vChips("vctx",VitalsLib.CTX,vCtx)}
  ${dayOptions()}<label class="lbl" for="vtime">Saat</label><input class="in" type="time" id="vtime" value="${vNow()}">
  ${vNote()}
  <div class="ferr" id="vwarn" role="alert"></div><button class="btn" data-vt="savebs">Kaydet</button>`);
}
const vGet=id=>{const e=document.getElementById(id);return e?e.value:""};
function vWarn(msg){const e=document.getElementById("vwarn");if(e)e.textContent=msg}
function vFinish(rows,msg){
  const backup=S.vitals.slice(),id0=Math.max(0,...S.vitals.map(r=>r.id))+1;
  const added=rows.map((r,i)=>({...r,sid:r.sid||VitalsLib.newSid(),id:id0+i}));
  S.vitals=S.vitals.concat(added);
  if(!commit(()=>{S.vitals=backup}))return;
  closeSheet();render();
  if(vAlert(rows,added))return;
  const ids=new Set(added.map(r=>r.id));
  toast(msg+vAsk(rows),()=>{S.vitals=S.vitals.filter(r=>!ids.has(r.id));save();render()});
}
const vMy=()=>{const t=S.settings;return {sys:t.bpSysHi,dia:t.bpDiaHi,g:t.gFastHi,gPost:t.gPostHi,sysLo:t.bpSysLo,diaLo:t.bpDiaLo,gLo:t.gFastLo}};
const vLevels=rows=>rows.map(r=>VitalsLib.level(r,dayKey(),vMy()));
const vAsk=rows=>{const i=vLevels(rows).indexOf("ask");return i<0?"":`. Hekimine danış; bu bir tanı değildir${rows.length>1?` (${i+1}. ölçüm ${rows[i].sys}/${rows[i].dia})`:""}`};
/* Emergency box: names the value, tells low from high, and 112 is one tap away. Returns true when it opened. */
let vAlertIds=null;
function vAlert(rows,added=[]){
  vAlertIds=new Set(added.map(r=>r.id));
  const lv=vLevels(rows),i=lv.findIndex(l=>l==="high"||l==="low");
  if(i<0)return false;
  const r=rows[i],bp=r.k==="t",val=bp?`${r.sys}/${r.dia} mmHg`:`${dg(r.g)} ${glab()}`;
  const head=`${lv[i]==="low"?"Düşük":"Yüksek"} ${bp?"tansiyon":"şeker"} ölçümü: ${val}`;
  const sym=lv[i]==="low"?"Kendini kötü hissediyorsan, kafan karışıyorsa ya da bayılırsan":bp?"Göğüs ağrın, nefes darlığın, konuşma güçlüğün ya da şiddetli baş ağrın varsa":"Kendini çok kötü hissediyorsan, kusuyorsan ya da bilincin bulanıksa";
  openSheet(`<h3>${head}</h3><p>Ölçüm kaydedildi. Cihazı kontrol edip ölçümü tekrarla. Değer doğruysa hekimine danış. ${sym} hemen 112'yi ara.</p><a class="btn" href="tel:112">112'yi ara</a><button class="mt-2 btn ghost" data-vt="close">Tamam</button>${added.length?`<button class="mt-2 lnk" data-vt="alertundo">Yanlış yazdım, bu kaydı sil</button>`:""}`);
  return true;
}
function sheetLimits(){
  const st=S.settings,f=(id,lab,v)=>`<label class="lbl" for="${id}">${lab}</label><input class="in num" id="${id}" inputmode="decimal" value="${v?(id==="vlg"||id==="vlglo"||id==="vlgp"?dg(v):v):""}" autocomplete="off">`;
  openSheet(`<h3>Hekimimin verdiği sınır</h3><p class="mut sm">Hekimin bir sınır verdiyse yaz; ölçüm bu sınıra gelince "Hekimine danış" satırı çıkar. Boş bırakırsan varsayılan sınır kullanılır. Uygulama değeri yorumlamaz.</p>
  ${f("vlsys","Büyük tansiyon üst (mmHg)",st.bpSysHi)}${f("vldia","Küçük tansiyon üst (mmHg)",st.bpDiaHi)}${f("vlg",`Şeker üst, açlık ve diğer (${glab()})`,st.gFastHi)}${f("vlgp",`Şeker üst, yemekten 2 saat sonra (${glab()})`,st.gPostHi)}
  ${f("vlsyslo","Büyük tansiyon alt (mmHg)",st.bpSysLo)}${f("vldialo","Küçük tansiyon alt (mmHg)",st.bpDiaLo)}${f("vlglo",`Şeker alt (${glab()})`,st.gFastLo)}
  <div class="ferr" id="vwarn" role="alert"></div><button class="btn" data-vt="savelimits">Kaydet</button>`);
}
function vSaveLimits(){
  const st=S.settings,out={};
  const KEYS=[["vlsys","bpSysHi","Büyük tansiyon"],["vldia","bpDiaHi","Küçük tansiyon"],["vlg","gFastHi","Şeker"],["vlgp","gPostHi","Tokluk şeker"],["vlsyslo","bpSysLo","Büyük tansiyon alt"],["vldialo","bpDiaLo","Küçük tansiyon alt"],["vlglo","gFastLo","Şeker alt"]];
  for(const [id,k,lbl] of KEYS){
    const raw=vGet(id).trim();let v=0;
    if(raw){
      v=LabLib.optNum(raw);if(/^gFast|^gPost/.test(k)&&v>0)v=Units.gIn(v);
      const [lo,hi]=RANGES[k];
      if(!(v>=lo&&v<=hi))return vWarn(`${lbl} sınırı geçerli değil`);
    }
    out[k]=Math.round(v);
  }
  for(const [lo,hi,lbl] of [["bpSysLo","bpSysHi","Büyük tansiyon"],["bpDiaLo","bpDiaHi","Küçük tansiyon"],["gFastLo","gFastHi","Şeker"]])if(out[lo]>0&&out[hi]>0&&out[lo]>=out[hi])return vWarn(`${lbl}: alt sınır üst sınırdan küçük olmalı`);
  const was=Object.fromEntries(KEYS.map(([,k])=>[k,st[k]]));
  Object.assign(st,out);
  if(!commit(()=>Object.assign(st,was)))return;
  closeSheet();render();toast("Sınır kaydedildi");
}
function vConfirmAgain(why,sig){
  if(!why||vConfirm===sig)return false;
  vConfirm=sig;vWarn(`${why} Yanlış yazmış olabilir misin? Doğruysa tekrar Kaydet'e dokun.`);
  return true;
}
/* Edit sheet for one blood pressure session (1-2 readings) or one glucose reading; vEditIds are the raw reading ids. */
let vEditIds=[];
function sheetVEdit(ids){
  const rs=S.vitals.filter(r=>ids.includes(r.id)).sort(VitalsLib.cmpAt);if(!rs.length)return;
  const r0=rs[0],bp=r0.k==="t";
  vEditIds=ids;vConfirm="";vSession=r0.session;vCtx=r0.ctx;
  openSheet(`<h3>${bp?"Tansiyonu düzenle":"Şekeri düzenle"}</h3>
  ${bp?`<div class="lbl">Seans</div>${vChips("vsession",VitalsLib.SESSIONS,vSession)}
  ${rs.map((r,i)=>`<div class="lbl">${i+1}. ölçüm</div><div class="g3 mb-2">${vIn("bs"+(i+1),"Büyük",r.sys)}${vIn("bd"+(i+1),"Küçük",r.dia)}${vIn("bn"+(i+1),"Nabız",r.pulse??"")}</div>`).join("")}`
  :`<label class="lbl" for="gv">Şeker (${glab()})</label><input class="in num" id="gv" inputmode="${vMmol()?"decimal":"numeric"}" value="${dg(r0.g)}" data-base="${r0.g}" data-shown="${dg(r0.g)}" autocomplete="off"><div class="lbl">Ne zaman ölçtün?</div>${vChips("vctx",VitalsLib.CTX,vCtx)}`}
  <label class="lbl" for="vday">Gün</label><input class="in" type="date" id="vday" max="${dayKey()}" value="${r0.day}">
  <label class="lbl" for="vtime">Saat</label><input class="in" type="time" id="vtime" value="${r0.time}">
  ${vNote(r0.note||"")}
  <div class="ferr" id="vwarn" role="alert"></div><button class="btn" data-vt="saveedit">Kaydet</button>`);
}
function vSaveEdit(){
  const old=S.vitals.filter(r=>vEditIds.includes(r.id)).sort(VitalsLib.cmpAt),day=vGet("vday"),next=new Map();
  if(day>dayKey())return vWarn("Gelecek bir gün seçilemez");
  for(const [i,r] of old.entries()){
    const f={...r,day,time:vGet("vtime"),note:vGet("vnot")};
    if(r.k==="t")Object.assign(f,{sys:LabLib.optNum(vGet("bs"+(i+1))),dia:LabLib.optNum(vGet("bd"+(i+1))),pulse:LabLib.optNum(vGet("bn"+(i+1))),session:vSession});
    else{const g=LabLib.optNum(vGet("gv"));Object.assign(f,{g:g==null?g:unitVal($("#gv"),Units.gIn),ctx:vCtx})}
    const c=VitalsLib.check(f);
    if(!c.row)return vWarn(vErrText(c));
    next.set(r.id,{...c.row,id:r.id});
  }
  const was=S.vitals;
  S.vitals=was.map(r=>next.get(r.id)||r);
  if(!commit(()=>{S.vitals=was}))return;
  closeSheet();render();
  const rows=[...next.values()];
  if(vAlert(rows))return;
  toast("Ölçüm güncellendi"+vAsk(rows),()=>{S.vitals=was;if(commit(()=>{}))render()});
}
function vSaveBp(){
  const day=vGet("fday"),time=vGet("vtime"),note=vGet("vnot"),sid=VitalsLib.newSid();
  const rd=n=>({sys:LabLib.optNum(vGet("bs"+n)),dia:LabLib.optNum(vGet("bd"+n)),pulse:LabLib.optNum(vGet("bn"+n)),has:["bs","bd","bn"].some(p=>vGet(p+n).trim()!=="")});
  const a=rd(1),b=rd(2),rows=[];
  if(!a.has||a.sys==null||a.dia==null)return toast("1. ölçümün büyük ve küçük tansiyonunu yaz");
  if(b.has&&(b.sys==null||b.dia==null))return toast("2. ölçümde büyük ve küçük tansiyonu birlikte yaz ya da boş bırak");
  for(const [r,n] of [[a,1],[b,2]]){
    if(!r.has)continue;
    const c=VitalsLib.check({k:"t",day,time,sys:r.sys,dia:r.dia,pulse:r.pulse,session:vSession,sid,i:n,note});
    if(!c.row)return toast(vErrText(c));
    rows.push(c.row);
  }
  if(vConfirmAgain(VitalsLib.needsConfirm(S.vitals,rows[0]),JSON.stringify(rows.map(r=>[r.sys,r.dia,r.day,r.time]))))return;
  const as=Math.round(rows.reduce((t,r)=>t+r.sys,0)/rows.length),ad=Math.round(rows.reduce((t,r)=>t+r.dia,0)/rows.length);
  vFinish(rows,`Kaydedildi: ${as}/${ad}${rows.length>1?" (ortalama)":""}`);
}
function vSaveBs(){
  const day=vGet("fday"),time=vGet("vtime"),g0=LabLib.optNum(vGet("gv")),g=g0==null?g0:unitVal($("#gv"),Units.gIn);
  if(g==null)return toast(`Şekeri ${glab()} olarak yaz, örneğin ${vMmol()?"5,3":"95"}`);
  const c=VitalsLib.check({k:"s",day,time,g,ctx:vCtx,note:vGet("vnot")});
  if(!c.row)return toast(vErrText(c));
  if(vConfirmAgain(VitalsLib.needsConfirm(S.vitals,c.row,Units.gu()),JSON.stringify([c.row.g,c.row.day,c.row.time,c.row.ctx])))return;
  S.settings.vCtx=vCtx;
  vFinish([c.row],`Kaydedildi: ${dg(c.row.g)} ${glab()} (${VitalsLib.ctxName(c.row.ctx).toLowerCase()})`);
}

/* ---- Charts (SVG) ---- */
/* Shape (circle, square, triangle, diamond) and line style on top of colour: the series stay distinguishable for colour-blind readers and in black-and-white print. */
const vMark=(sh,x,y,r,fill)=>sh==="s"?`<rect x="${(x-r).toFixed(1)}" y="${(y-r).toFixed(1)}" width="${2*r}" height="${2*r}" fill="${fill}"/>`:sh==="t"?`<polygon points="${x.toFixed(1)},${(y-r*1.25).toFixed(1)} ${(x+r*1.15).toFixed(1)},${(y+r*.9).toFixed(1)} ${(x-r*1.15).toFixed(1)},${(y+r*.9).toFixed(1)}" fill="${fill}"/>`:sh==="d"?`<polygon points="${x.toFixed(1)},${(y-r*1.3).toFixed(1)} ${(x+r*1.3).toFixed(1)},${y.toFixed(1)} ${x.toFixed(1)},${(y+r*1.3).toFixed(1)} ${(x-r*1.3).toFixed(1)},${y.toFixed(1)}" fill="${fill}"/>`:`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${fill}"/>`;
const vLegend=series=>`<div class="legend">${series.map(s=>`<span><svg width="26" height="12" viewBox="0 0 26 12" aria-hidden="true">${s.line===false?"":`<line x1="0" x2="26" y1="6" y2="6" stroke="${s.color}" stroke-width="2"${s.dash?' stroke-dasharray="4 3"':""}/>`}${vMark(s.shape,13,6,4,s.color)}</svg>${s.label}</span>`).join("")}</div>`;
function vSvg(series,from,to,W,H,dec){
  if(!series.some(s=>s.pts.length))return `<p class="hint">Bu dönemde ölçüm yok.</p>`;
  const f=Algo.dayNum(from),t=Algo.dayNum(to)+1,span=Math.max(1,t-f),vs=series.flatMap(s=>s.pts.map(p=>p.v));
  let lo=Math.min(...vs),hi=Math.max(...vs);if(hi===lo){hi+=1;lo-=1}const pad=(hi-lo)*.12;lo-=pad;hi+=pad;
  const L=40,X=p=>L+(W-L-8)*(Algo.dayNum(p.day)+vToMin(p.time)/1440-f)/span,Y=v=>8+(H-30)*(1-(v-lo)/(hi-lo)),nf=v=>dec?v.toFixed(dec).replace(".",","):Math.round(v);
  const body=series.map(s=>`${s.pts.length>1?`<polyline points="${s.pts.map(p=>X(p).toFixed(1)+","+Y(p.v).toFixed(1)).join(" ")}" fill="none" stroke="${s.color}" stroke-width="1.8" stroke-linejoin="round"${s.dash?' stroke-dasharray="5 3"':""} opacity="${s.line===false?0:.85}"/>`:""}${s.pts.map(p=>vMark(s.shape,X(p),Y(p.v),3.8,s.color)).join("")}`).join("");
  /* Axis numbers sit in a separate column on the left and the series name only in the legend: nothing collides with the line or is clipped at the edge. */
  let grid="";for(let i=0;i<=3;i++){const v=lo+(hi-lo)*i/3,y=Y(v);grid+=`<line x1="${L}" x2="${W-8}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)"/><text x="${L-6}" y="${(y+4).toFixed(1)}" text-anchor="end">${nf(v)}</text>`}
  const rows=series.flatMap(s=>s.pts.map(p=>[+X(p).toFixed(1),+Y(p.v).toFixed(1),`${fd(p.day)} ${p.time} · ${s.short||s.label||""} ${nf(p.v)}`.trim()])),tip=esc(JSON.stringify(rows));
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Ölçüm grafiği, ${rows.length} ölçüm, ${fd(from)} ile ${fd(to)} arası. Tüm değerler grafiğin altındaki tabloda" data-tip="${tip}">${grid}${body}<text x="${L}" y="${H-6}">${fd(from)}</text><text x="${W-8}" y="${H-6}" text-anchor="end">${fd(to)}</text></svg>${ptsTable(rows.map(r=>r[2]))}`;
}
const vSeg=()=>`<div class="seg" role="group" aria-label="Aralık">${[7,14,30].map(n=>`<button data-vt="range:${n}" aria-pressed="${vRange===n}">${n} gün</button>`).join("")}</div>`;
const vBtns=add=>`<div class="btns mb-3"><button class="btn" data-vt="${add}">${Icons.svg("plus")} Ölçüm ekle</button><button class="btn ghost" data-doc="open">${Icons.svg("share")} Doktora PDF</button></div>`;
const vDel=ids=>`<button class="del" data-vt="del:${ids.join(",")}" aria-label="Ölçümü sil">${Icons.svg("x")}</button>`;
/* List: the last 7 rows open, the rest folded. */
const vList=rows=>rows.length?rows.slice(0,7).join("")+(rows.length>7?`<details class="acc"><summary>Tüm ölçümler (${rows.length})</summary>${rows.slice(7).join("")}</details>`:""):`<p class="m0 mut">Bu dönemde ölçüm yok.</p>`;

function viewBp(){
  const end=dayKey(),from=keyOff(1-vRange),h=VitalsLib.homeAvg(S.vitals,end,7);
  const session=VitalsLib.sessions(S.vitals).filter(s=>s.day>=from&&s.day<=end);
  const pt=(rows,f)=>rows.map(r=>({day:r.day,time:r.time,v:r[f]}));
  const raw=S.vitals.filter(r=>r.k==="t"&&r.day>=from&&r.day<=end);
  const bpSeries=[{pts:pt(raw,"sys"),color:"var(--ink)",shape:"c",label:"Sistolik (büyük)",short:"Sistolik"},{pts:pt(raw,"dia"),color:"var(--water)",shape:"s",dash:true,below:true,label:"Diyastolik (küçük)",short:"Diyastolik"}];
  const avgTxt=a=>a?`${Math.round(a.sys)}/${Math.round(a.dia)}`:"–";
  const rows=session.slice().reverse().map(s=>`<div class="prow"><button class="grow pbtn" data-vt="edit:${s.raw.map(x=>x.id)}"><span class="grow"><b class="num">${Math.round(s.sys)}/${Math.round(s.dia)}</b>${s.pulse?`<span class="mut num"> · nabız ${s.pulse}</span>`:""}<small class="db mut num">${fd(s.day)} ${s.time} · ${VitalsLib.sessionName(s.session)}${s.n>1?`, ${s.n} ölçüm`:""}</small>${(d=>d?`<small class="db mut">${d}</small>`:"")(Meds.bpSince(s.day,s.time))}</span></button>${vDel(s.raw.map(x=>x.id))}</div>`);
  return `${vBtns("addbp")}
  ${h.all?`<div class="card"><div class="lbl">Ev ortalaması (son 7 gün)</div>
    <div class="ink sumv num">${avgTxt(h.all)} <small>mmHg</small></div><div class="mut sm">${h.all.n} ölçüm, ${h.days} gün</div>${h.enough?"":`<div class="mut sm">Ortalama için en az 3 gün, tercihen 7 gün sabah ve akşam ölçüm gerekir.</div>`}
    <div class="mt-2 stats"><div class="stat"><div class="k">Sabah ortalaması</div><div class="v num">${avgTxt(h.morning)}</div></div><div class="stat"><div class="k">Akşam ortalaması</div><div class="v num">${avgTxt(h.evening)}</div></div></div></div>`:emptyCard("heart","Henüz ölçüm yok","Günde 2 kez (sabah ve akşam), her seferinde 2 ölçüm, 3-7 gün ölçersen anlamlı bir ortalama çıkar.")}
  ${vSeg()}<div class="card">${vSvg(bpSeries,from,end,320,220)}${vLegend(bpSeries)}</div>
  <div class="card"><div class="lbl">Ölçümler (son ${vRange} gün)</div>${vList(rows)}</div>
  <p class="hint">Bu değerleri hekiminle değerlendir.</p>`;
}
const G_COLOR={fasting:"var(--prim)",before:"var(--prim)",after:"var(--kcal)",bedtime:"var(--water)",random:"var(--mut)"};
const G_SHAPE={fasting:"c",before:"d",after:"t",bedtime:"s",random:"c"};
function viewGlucose(){
  const end=dayKey(),from=keyOff(1-vRange),a=S.vitals.filter(r=>r.k==="s"&&r.day>=from&&r.day<=end).sort(VitalsLib.cmpAt);
  const gs=VitalsLib.gStats(S.vitals,from,end),last=vLast("s");
  const series=VitalsLib.CTX.map(([c])=>({pts:a.filter(r=>r.ctx===c).map(r=>({day:r.day,time:r.time,v:Units.g(r.g)})),color:G_COLOR[c],shape:G_SHAPE[c],label:VitalsLib.ctxName(c),short:"",line:false})).filter(s=>s.pts.length);
  const rows=a.slice().reverse().map(r=>`<div class="prow"><button class="grow pbtn" data-vt="edit:${r.id}"><span class="grow"><b class="num">${dg(r.g)}</b><span class="mut"> ${glab()}</span><small class="db mut num">${fd(r.day)} ${r.time} · ${esc(VitalsLib.ctxName(r.ctx))}</small></span></button>${vDel([r.id])}</div>`);
  const labA1c=Labs.latest("hba1c");
  return `${vBtns("addbs")}
  ${last?`<div class="card"><div class="lbl">Son ölçüm</div><div class="ink sumv num">${dg(last.g)} <small>${glab()}</small></div><div class="mut sm">${esc(VitalsLib.ctxName(last.ctx))}, ${vWhen(last)}</div></div>`:emptyCard("water","Henüz ölçüm yok","İlk şeker ölçümünü ekle; ortalama ve grafik burada görünür.")}
  ${vSeg()}${gs?`<div class="stats"><div class="stat"><div class="k">Ortalama</div><div class="v num">${vAvg(gs.avg)}</div></div><div class="stat"><div class="k">Ölçüm sayısı</div><div class="v num">${gs.n}</div></div><div class="stat"><div class="k">En düşük / en yüksek</div><div class="v num">${vMmol()?`${dg(gs.min)} / ${dg(gs.max)}`:`${gs.min} / ${gs.max}`}</div></div></div>
  <div class="card"><div class="lbl">Bağlama göre ortalama</div>${Object.entries(gs.byCtx).map(([c,x])=>`<div class="row"><span class="grow">${esc(VitalsLib.ctxName(c))}</span><b class="num">${vAvg(x.avg)} <small class="mut">(${x.n})</small></b></div>`).join("")}</div>`:""}
  <div class="card">${vSvg(series,from,end,320,200,vDec())}${vLegend(series)}</div>
  <div class="card"><div class="lbl">Ölçümler (son ${vRange} gün)</div>${vList(rows)}</div>
  ${labA1c?`<div class="card"><div class="lbl">Tahlil sonucun</div><div class="row"><span class="grow">HbA1c (${vFy(labA1c.day)})</span><b class="num">${LabLib.fmtN(labA1c.v)} ${esc(labA1c.u||"")}</b></div><div class="mut sm">Tahlil takibinden alındı, ölçümlerle karıştırılmaz.</div></div>`:""}
  <p class="hint">Bu değerleri hekiminle değerlendir.</p>`;
}

/* ---- Doctor report ---- */
/* Pages of one report kind for the combined doctor report: {count, draw(ctx,n)}, or null without readings in the period. */
function vPdfPages(kind,days){
  if(!S.vitals.some(r=>r.k===kind))return null;
  const {rows,pages,info}=vReportInfo(kind,days);
  if(!rows.length)return null;
  let i=0;const slices=pages.map(p=>{const s=rows.slice(i,i+p.n);i+=p.n;return s});
  return {count:pages.length,draw:(ctx,n)=>VitalsLib.drawPage(ctx,slices[n],{...info,page:n+1,total:pages.length})};
}
function vPdfMenu(kind){
  openSheet(`<h3>Hekim özeti</h3><p class="mut sm">Hangi dönemi rapora ekleyelim?</p>${[7,14,30,90].map(n=>`<button class="mb-2 btn ghost" data-vt="pdf:${kind}:${n}">Son ${n} gün</button>`).join("")}<button class="btn ghost" data-vt="close">Vazgeç</button>`);
}
function vReportInfo(kind,days){
  const end=dayKey(),from=keyOff(1-days),all=S.vitals,rows=VitalsLib.reportRows(all,kind,from,end,Units.gu(),Meds.bpSince);
  const period=`${vFy(from)} - ${vFy(end)}`;
  const summary=[["Dönem",`${period} (${days} gün)`],["Ölçüm sayısı",String(rows.length)]];
  let series,title;
  if(kind==="t"){
    title="NeoWell · Tansiyon raporu";
    const raw=all.filter(r=>r.k==="t"&&r.day>=from&&r.day<=end),h=VitalsLib.homeAvg(all,end,days);
    const t=x=>x?`${Math.round(x.sys)}/${Math.round(x.dia)} mmHg (${x.n} ölçüm)`:"–";
    summary.push(["Dönem ortalaması",t(h.all)],["Sabah ortalaması",t(h.morning)],["Akşam ortalaması",t(h.evening)]);
    const pt=f=>raw.map(r=>({day:r.day,v:r[f]}));
    series=[{pts:pt("sys"),color:Algo.PAGE.c.prim},{pts:pt("dia"),color:Algo.PAGE.c.water}];
  }else{
    title="NeoWell · Şeker raporu";
    const g=VitalsLib.gStats(all,from,end);
    if(g){summary.push(["Ortalama",`${vAvg(g.avg)} ${glab()}`],["En düşük / en yüksek",`${vMmol()?`${dg(g.min)} / ${dg(g.max)}`:`${g.min} / ${g.max}`} ${glab()}`]);
      for(const [c,x] of Object.entries(g.byCtx))summary.push([`Ortalama: ${VitalsLib.ctxName(c)}`,`${vAvg(x.avg)} ${glab()} (${x.n})`])}
    const raw=all.filter(r=>r.k==="s"&&r.day>=from&&r.day<=end);
    series=[{pts:raw.map(r=>({day:r.day,v:Units.g(r.g)})),color:Algo.PAGE.c.prim}];
  }
  const pages=VitalsLib.paginate(rows.length,summary.length);
  return {rows,pages,info:{kind,title,period,summary,chart:series.some(s=>s.pts.length)?{series,from,to:end,dec:kind==="s"?vDec():0}:null,today:end}};
}
async function vPdf(kind,days){
  closeSheet();
  if(!S.vitals.some(r=>r.k===kind))return toast("Raporlanacak ölçüm yok");
  let pdf;
  try{
    const {rows,pages,info}=vReportInfo(kind,days);let i=0;
    const slices=pages.map(p=>{const s=rows.slice(i,i+p.n);i+=p.n;return s});
    pdf=canvasPdf(pages.length,(ctx,n)=>VitalsLib.drawPage(ctx,slices[n],{...info,page:n+1,total:pages.length}));
  }catch(e){return toast("PDF hazırlanamadı")}
  await sharePdf(pdf,`neowell-rapor-${dayKey()}.pdf`,kind==="t"?"Tansiyon raporu":"Şeker raporu");
}

document.addEventListener("input",ev=>{if(ev.target.id==="vnot")document.getElementById("vnc").textContent=`${ev.target.value.length} / 80`});
document.addEventListener("click",ev=>{
  const sb=ev.target.closest("[data-vsession],[data-vctx]");
  if(sb){
    const d=sb.dataset;if(d.vsession)vSession=d.vsession;if(d.vctx)vCtx=d.vctx;
    sb.parentNode.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",String(c===sb)));return;
  }
  const el=ev.target.closest("[data-vt]");if(!el)return;
  const [a,...rest]=el.dataset.vt.split(":"),arg=rest.join(":");
  if(a==="bptoggle")vToggle("bp");
  else if(a==="bstoggle")vToggle("bs");
  else if(a==="addbp")sheetBp();
  else if(a==="addbs")sheetBs();
  else if(a==="savebp")vSaveBp();
  else if(a==="savebs")vSaveBs();
  else if(a==="edit")sheetVEdit(arg.split(",").map(Number));
  else if(a==="saveedit")vSaveEdit();
  else if(a==="close")closeSheet();
  else if(a==="alertundo"){const ids=vAlertIds;if(ids&&ids.size){S.vitals=S.vitals.filter(r=>!ids.has(r.id));save()}vAlertIds=null;closeSheet();render();toast("Kayıt silindi")}
  else if(a==="limits")sheetLimits();
  else if(a==="savelimits")vSaveLimits();
  else if(a==="range"){vRange=+arg;render()}
  else if(a==="pdfmenu")vPdfMenu(arg);
  else if(a==="pdf"){const [k,d]=arg.split(":");vPdf(k,+d)}
  else if(a==="del"){
    const ids=new Set(arg.split(",").map(Number)),backup=S.vitals.slice();
    S.vitals=S.vitals.filter(r=>!ids.has(r.id));save();render();
    toast("Ölçüm silindi",()=>{S.vitals=backup;save();render()});
  }
});
