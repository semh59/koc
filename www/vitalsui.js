"use strict";
/* Tansiyon ve şeker takibi arayüzü. index.html'deki S, save, toast, openSheet, closeSheet, esc, render, dayKey, keyOff, dayOptions ile çalışır.
   Kayıt ve grafik tutar; teşhis, yorum ya da doz önerisi yapmaz. Veriler Koç'a gönderilmez. */
let vRange=14,vSes="sabah",vCtx="acl",vConfirm="";
const vN=s=>{const t=String(s==null?"":s).trim();return t===""?undefined:LabLib.toNum(t)};
const vFmt=x=>VitalsLib.num(x);
const vNow=()=>{const d=new Date();return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")};
const vNextId=()=>Math.max(0,...S.vitals.map(r=>r.id))+1;
const vDayLbl=k=>k.slice(8)+"."+k.slice(5,7);
const vFlagTxt=f=>f==="high"?"▲ hedef aralığının üstünde":f==="low"?"▼ hedef aralığının altında":"";
const vToMin=t=>+t.slice(0,2)*60+ +t.slice(3,5);

/* ---- Ayarlar ---- */
function vitalsSettingsHtml(fld){
  const st=S.settings,seg=(on,key,label)=>`<button class="btn ghost" data-vt="${key}" style="margin-bottom:8px">${on?label+" takibini kapat":label+" takibini aç"}</button>`;
  return `<h2>Sağlık ölçümleri</h2><div class="card">
    <p class="mut sm" style="margin:0 0 10px">Evde ölçtüğün tansiyon ve şekeri kaydet. Uygulama yorum yapmaz, yalnızca senin ya da doktorunun verdiği hedef aralığıyla karşılaştırır. Veriler telefondan çıkmaz.</p>
    ${seg(st.bpOn,"bptoggle","Tansiyon")}
    ${st.bpOn?`${fld("bpSysHi","Büyük tansiyon üst sınır",st.bpSysHi||"","Boş bırakırsan karşılaştırma yapılmaz","numeric")}${fld("bpDiaHi","Küçük tansiyon üst sınır",st.bpDiaHi||"","","numeric")}${fld("bpSysLo","Büyük tansiyon alt sınır",st.bpSysLo||"","İsteğe bağlı","numeric")}${fld("bpDiaLo","Küçük tansiyon alt sınır",st.bpDiaLo||"","İsteğe bağlı","numeric")}
    <div class="btns"><button class="btn ghost" data-vt="bppreset">135/85 eşiğini doldur (ESC 2024, ev ölçümü eşiği)</button></div>`:""}
    ${seg(st.bsOn,"bstoggle","Şeker")}
    ${st.bsOn?`${fld("gFastLo","Açlık / yemek öncesi alt sınır (mg/dL)",st.gFastLo||"","Doktorunun verdiği hedef","numeric")}${fld("gFastHi","Açlık / yemek öncesi üst sınır (mg/dL)",st.gFastHi||"","","numeric")}${fld("gPostLo","Yemekten 2 saat sonra alt sınır (mg/dL)",st.gPostLo||"","İsteğe bağlı","numeric")}${fld("gPostHi","Yemekten 2 saat sonra üst sınır (mg/dL)",st.gPostHi||"","","numeric")}
    <div class="btns"><button class="btn ghost" data-vt="gpreset">Diyabetli yetişkinler için ADA 2026 hedeflerini doldur (80-130 ve 180)</button></div>
    <p class="hint">Bu ADA değerleri yalnızca diyabetli yetişkinlerin tedavi hedefidir. Diyabeti olmayan biri için geçerli değildir. Kendi hedefini doktorunla belirle.</p>`:""}
  </div>`;
}
function vToggle(kind){
  const st=S.settings,on=kind==="bp"?"bpOn":"bsOn",ids=kind==="bp"?[7,8]:[9];
  st[on]=!st[on];
  if(!st[on]){for(const r of st.reminders)if(ids.includes(r.id))r.on=false}
  save();render();scheduleReminders().then(setNotif);
  toast(st[on]?(kind==="bp"?"Tansiyon takibi açık. Hatırlatmaları aşağıdan açabilirsin":"Şeker takibi açık. Hatırlatmayı aşağıdan açabilirsin"):"Kapatıldı. Kayıtların durur");
}
function vPreset(kind){
  Object.assign(S.settings,kind==="bp"?VitalsLib.BP_PRESET:VitalsLib.G_PRESET);
  save();render();
  toast(kind==="bp"?"135/85 eşiği dolduruldu. Doktorun farklı bir hedef verdiyse değiştir":"ADA hedefleri dolduruldu. Yalnızca diyabetli yetişkinler için geçerli, kendi hedefini doktorunla belirle");
}

/* ---- Bugün ve Trend kartları ---- */
function vLast(k){return S.vitals.filter(r=>r.k===k).sort((a,b)=>a.day<b.day?1:a.day>b.day?-1:a.time<b.time?1:a.time>b.time?-1:b.id-a.id)[0]}
function vWhen(r){return (r.day===dayKey()?"bugün ":vDayLbl(r.day)+" ")+r.time}
/* Bugün yapılacaklar: açık ve bugün henüz ölçülmemiş tür başına bir satır. */
function vTodo(){
  const st=S.settings,t=dayKey(),out=[];
  for(const [on,k,ic,label,act,txt] of [[st.bpOn,"t","❤️","Tansiyon","addbp",r=>`${r.sys}/${r.dia}`],[st.bsOn,"s","🩸","Şeker","addbs",r=>vFmt(r.g)]]){
    const r=vLast(k);if(!on||(r&&r.day===t))continue;
    out.push(`<div class="row"><span>${ic} ${label} ölç<small class="mut sm num">${r?`son: ${txt(r)}, ${vWhen(r)}`:"ölçüm yok"}</small></span><button class="chip" data-vt="${act}">Ekle</button></div>`);
  }
  return out;
}
function vTrendCards(){
  const st=S.settings,c=(tab,t,txt)=>`<button class="stepcard" data-tab="${tab}"><div class="row"><span class="mut">${t}</span><span class="mut sm">Aç ›</span></div><div class="row"><span class="mut sm">${txt}</span></div></button>`;
  const one=(k,none)=>{const r=vLast(k);return r?`son: ${k==="t"?r.sys+"/"+r.dia:vFmt(r.g)}, ${vWhen(r)}`:none};
  return (st.bpOn?c("tansiyon","❤️ Tansiyon",one("t","Henüz ölçüm yok")):"")+(st.bsOn?c("seker","🩸 Şeker",one("s","Henüz ölçüm yok")):"");
}
function vMenu(){
  const st=S.settings,b=(a,t)=>`<button class="btn ghost" data-vt="${a}" style="margin-bottom:8px">${t}</button>`;
  openSheet(`<h3>Ölçüm</h3>${st.bpOn?b("addbp","➕ Tansiyon ekle"):""}${st.bsOn?b("addbs","➕ Şeker ekle"):""}${st.bpOn?b("go:tansiyon","📊 Tansiyon raporu ve grafik"):""}${st.bsOn?b("go:seker","📊 Şeker raporu ve grafik"):""}<button class="btn ghost" data-vt="close">Kapat</button>`);
}

/* ---- Giriş ekranları ---- */
const vIn=(id,ph,mode)=>`<input class="in num" id="${id}" placeholder="${ph}" inputmode="${mode||"numeric"}" autocomplete="off" style="margin:0;padding:10px;font-size:18px;min-width:0">`;
const vChips=(attr,list,sel)=>`<div class="chips">${list.map(([v,l])=>`<button class="chip" data-${attr}="${v}" aria-pressed="${v===sel}">${l}</button>`).join("")}</div>`;
function sheetBp(){
  vConfirm="";vSes=new Date().getHours()<12?"sabah":"aksam";
  openSheet(`<h3>Tansiyon ekle</h3>
  <div class="lbl">Seans</div>${vChips("vses",VitalsLib.SES,vSes)}
  <div class="lbl">1. ölçüm (büyük / küçük / nabız)</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px">${vIn("bs1","120")}${vIn("bd1","80")}${vIn("bn1","nabız")}</div>
  <div class="lbl">2. ölçüm (1-2 dakika sonra, isteğe bağlı)</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px">${vIn("bs2","120")}${vIn("bd2","80")}${vIn("bn2","nabız")}</div>
  ${dayOptions()}<div class="lbl">Saat</div><input class="in" type="time" id="vtime" value="${vNow()}">
  <input class="in" id="vnot" placeholder="Not (isteğe bağlı)" maxlength="80" autocomplete="off">
  <div class="mut sm" style="margin-bottom:8px">Ölçmeden önce 5 dakika otur, kol kalp hizasında olsun. Sabah ölçümü kahvaltı ve ilaçtan önce.</div>
  <div class="hint" id="vwarn" role="alert"></div><button class="btn" data-vt="savebp">Kaydet</button>`);
}
function sheetBs(){
  vConfirm="";vCtx=new Date().getHours()<10?"acl":"rast";
  openSheet(`<h3>Şeker ekle</h3>
  <div class="lbl">Şeker (mg/dL)</div><input class="in num" id="gv" inputmode="numeric" placeholder="95" autocomplete="off" autofocus>
  <div class="lbl">Ne zaman ölçtün?</div>${vChips("vctx",VitalsLib.CTX,vCtx)}
  ${dayOptions()}<div class="lbl">Saat</div><input class="in" type="time" id="vtime" value="${vNow()}">
  <input class="in" id="vnot" placeholder="Not (isteğe bağlı)" maxlength="80" autocomplete="off">
  <div class="hint" id="vwarn" role="alert"></div><button class="btn" data-vt="savebs">Kaydet</button>`);
}
const vGet=id=>{const e=document.getElementById(id);return e?e.value:""};
function vWarn(msg){const e=document.getElementById("vwarn");if(e)e.textContent=msg}
function vFinish(rows,msg){
  const day=rows[0].day,backup=S.vitals.slice();
  S.vitals=S.vitals.concat(rows.map((r,i)=>({...r,id:vNextId()+i})));
  if(!save()){S.vitals=backup;return toast("Kaydedilemedi, depolama dolu")}
  const ids=S.vitals.slice(-rows.length).map(r=>r.id);
  closeSheet();render();
  if(rows.some(r=>VitalsLib.crisis(r,dayKey()))){
    return openSheet(`<h3>Çok uç bir değer</h3><p>Ölçüm kaydedildi. Bu değer çok uç. Cihazı kontrol edip ölçümü tekrarla. Belirtin varsa ya da değer doğruysa 112'yi ara.</p><button class="btn" data-vt="close">Tamam</button>`);
  }
  toast(msg,()=>{S.vitals=S.vitals.filter(r=>!ids.includes(r.id));save();render()});
}
function vSaveBp(){
  const day=vGet("fday"),time=vGet("vtime"),not=vGet("vnot"),sid=Math.random().toString(36).slice(2,10).replace(/[^a-z0-9]/g,"a");
  const rd=n=>({sys:vN(vGet("bs"+n)),dia:vN(vGet("bd"+n)),nabiz:vN(vGet("bn"+n)),has:["bs","bd","bn"].some(p=>vGet(p+n).trim()!=="")});
  const a=rd(1),b=rd(2),rows=[];
  if(!a.has||a.sys==null||a.dia==null)return toast("1. ölçümün büyük ve küçük tansiyonunu yaz");
  if(b.has&&(b.sys==null||b.dia==null))return toast("2. ölçümde büyük ve küçük tansiyonu birlikte yaz ya da boş bırak");
  for(const [r,n] of [[a,1],[b,2]]){
    if(!r.has)continue;
    const c=VitalsLib.check({k:"t",day,time,sys:r.sys,dia:r.dia,nabiz:r.nabiz,ses:vSes,sid,i:n,not});
    if(!c.row)return toast(c.err==="tarih"?"Gün ve saati seç":c.err);
    rows.push(c.row);
  }
  const sig=JSON.stringify(rows.map(r=>[r.sys,r.dia,r.day,r.time])),why=VitalsLib.needsConfirm(S.vitals,rows[0]);
  if(why&&vConfirm!==sig){vConfirm=sig;return vWarn(`${why} Yanlış yazmış olabilir misin? Doğruysa tekrar Kaydet'e dokun.`)}
  const m=rows.reduce((t,r)=>({s:t.s+r.sys,d:t.d+r.dia}),{s:0,d:0}),as=Math.round(m.s/rows.length),ad=Math.round(m.d/rows.length),f=VitalsLib.flagBp(as,ad,S.settings);
  vFinish(rows,`Kaydedildi: ${as}/${ad}${rows.length>1?" (ortalama)":""}${f?", "+vFlagTxt(f):""}`);
}
function vSaveBs(){
  const day=vGet("fday"),time=vGet("vtime"),g=vN(vGet("gv"));
  if(g==null)return toast("Şekeri mg/dL olarak yaz, örneğin 95");
  const c=VitalsLib.check({k:"s",day,time,g,ctx:vCtx,not:vGet("vnot")});
  if(!c.row)return toast(c.err==="tarih"?"Gün ve saati seç":c.err);
  const sig=JSON.stringify([c.row.g,c.row.day,c.row.time,c.row.ctx]),why=VitalsLib.needsConfirm(S.vitals,c.row);
  if(why&&vConfirm!==sig){vConfirm=sig;return vWarn(`${why} Yanlış yazmış olabilir misin? Doğruysa tekrar Kaydet'e dokun.`)}
  const f=VitalsLib.flagG(c.row,S.settings);
  vFinish([c.row],`Kaydedildi: ${vFmt(c.row.g)} mg/dL (${VitalsLib.ctxName(c.row.ctx).toLowerCase()})${f?", "+vFlagTxt(f):""}`);
}

/* ---- Grafik (SVG) ---- */
function vSvg(series,band,from,to,W,H){
  const f=VitalsLib.dayN(from),t=VitalsLib.dayN(to)+1,span=Math.max(1,t-f),vs=series.flatMap(s=>s.pts.map(p=>p.v));
  if(band){if(band.lo!=null)vs.push(band.lo);if(band.hi!=null)vs.push(band.hi)}
  if(!vs.length)return `<p class="hint">Bu dönemde ölçüm yok.</p>`;
  let lo=Math.min(...vs),hi=Math.max(...vs);if(hi===lo){hi+=1;lo-=1}const pad=(hi-lo)*.12;lo-=pad;hi+=pad;
  const X=p=>8+(W-16)*(VitalsLib.dayN(p.day)+vToMin(p.time)/1440-f)/span,Y=v=>8+(H-30)*(1-(v-lo)/(hi-lo));
  const bd=band?(()=>{const y1=band.hi!=null?Y(band.hi):8,y2=band.lo!=null?Y(band.lo):H-22;return `<rect x="8" y="${Math.min(y1,y2).toFixed(1)}" width="${W-16}" height="${Math.abs(y2-y1).toFixed(1)}" fill="var(--prim)" opacity=".12"/>`})():"";
  const body=series.map(s=>`${s.pts.length>1?`<polyline points="${s.pts.map(p=>X(p).toFixed(1)+","+Y(p.v).toFixed(1)).join(" ")}" fill="none" stroke="${s.color}" stroke-width="1.8" stroke-linejoin="round" opacity="${s.line===false?0:.85}"/>`:""}${s.pts.map(p=>`<circle cx="${X(p).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="3.8" fill="${p.out?"var(--warn)":s.color}"/>`).join("")}`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ölçüm grafiği" style="width:100%;display:block">${bd}<rect x="8" y="8" width="${W-16}" height="${H-30}" fill="none" stroke="var(--line)"/>${body}<text x="8" y="${H-6}" style="font-size:10px;fill:var(--mut)">${vDayLbl(from)}</text><text x="${W-8}" y="${H-6}" text-anchor="end" style="font-size:10px;fill:var(--mut)">${vDayLbl(to)}</text><text x="${W-10}" y="18" text-anchor="end" style="font-size:10px;fill:var(--mut)">${Math.round(hi)}</text><text x="${W-10}" y="${H-26}" text-anchor="end" style="font-size:10px;fill:var(--mut)">${Math.round(lo)}</text></svg>`;
}
const vSeg=()=>`<div class="seg" role="group" aria-label="Aralık">${[7,14,30].map(n=>`<button data-vt="range:${n}" aria-pressed="${vRange===n}">${n} gün</button>`).join("")}</div>`;
const vBtns=(kind,add)=>`<div class="card"><div class="btns" style="display:grid;gap:8px"><button class="btn" data-vt="${add}">➕ Ölçüm ekle</button><button class="btn ghost" data-vt="pdfmenu:${kind}">📤 Doktor raporu (PDF)</button></div></div>`;
const vBack=`<button class="btn" data-tab="trend" style="margin:0 0 12px">‹ Trend</button>`;
const vDel=ids=>`<button class="chip" data-vt="del:${ids.join(",")}" aria-label="Ölçümü sil">✕</button>`;

function viewTansiyon(){
  const st=S.settings,end=dayKey(),from=keyOff(1-vRange),h=VitalsLib.homeAvg(S.vitals,end,7);
  const ses=VitalsLib.sessions(S.vitals).filter(s=>s.day>=from&&s.day<=end);
  const pt=(rows,f)=>rows.map(r=>({day:r.day,time:r.time,v:r[f],out:!!VitalsLib.flagBp(r.sys,r.dia,st)}));
  const raw=S.vitals.filter(r=>r.k==="t"&&r.day>=from&&r.day<=end);
  const hf=h.all?VitalsLib.flagBp(h.all.sys,h.all.dia,st):null;
  const avgTxt=a=>a?`${Math.round(a.sys)}/${Math.round(a.dia)}`:"–";
  const rows=ses.slice().reverse().map(s=>{
    const f=VitalsLib.flagBp(s.sys,s.dia,st);
    return `<div class="row" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-top:1px solid var(--line)"><span style="flex:1">${vDayLbl(s.day)} ${s.time}<small class="mut"> ${VitalsLib.sesName(s.ses)}${s.n>1?`, ${s.n} ölçüm`:""}</small></span><b class="num">${Math.round(s.sys)}/${Math.round(s.dia)}</b><span class="mut sm">${s.nabiz?s.nabiz:""}</span><span aria-hidden="true">${f==="high"?"▲":f==="low"?"▼":""}</span>${vDel(s.raw.map(x=>x.id))}</div>`;
  }).join("");
  return `${vBack}${vBtns("t","addbp")}
  <div class="card"><div class="lbl">Ev ortalaması (son 7 gün)</div>
    ${h.all?`<div class="sumv num" style="color:var(--ink)">${avgTxt(h.all)} <small>mmHg</small></div><div class="mut sm">${h.all.n} ölçüm, ${h.days} gün${hf?" · "+vFlagTxt(hf):""}</div>${h.enough?"":`<div class="mut sm">Ortalama için en az 3 gün, tercihen 7 gün sabah ve akşam ölçüm gerekir.</div>`}
    <div class="stats" style="margin-top:8px"><div class="stat"><div class="k">Sabah ortalaması</div><div class="v num">${avgTxt(h.sabah)}</div></div><div class="stat"><div class="k">Akşam ortalaması</div><div class="v num">${avgTxt(h.aksam)}</div></div></div>`:`<p class="mut">Henüz ölçüm yok. Günde 2 kez (sabah ve akşam), her seferinde 2 ölçüm, 3-7 gün ölçersen anlamlı bir ortalama çıkar.</p>`}
  </div>
  ${vSeg()}<div class="card">${vSvg([{pts:pt(raw,"sys"),color:"var(--prim)"},{pts:pt(raw,"dia"),color:"var(--su)"}],st.bpSysHi>0?{hi:st.bpSysHi}:null,from,end,320,150)}<div class="mut sm">Yeşil: büyük tansiyon, mavi: küçük tansiyon.${st.bpSysHi>0?" Gölgeli bölge büyük tansiyon için hedef aralığıdır.":""} Turuncu nokta: hedef aralığı dışı.</div></div>
  <div class="card"><div class="lbl">Ölçümler (son ${vRange} gün)</div>${rows||`<p class="mut">Bu dönemde ölçüm yok.</p>`}</div>
  <p class="hint">${MED_NOTE} Hedef aralığı Ayarlar'dan girilir.</p>`;
}
function viewSeker(){
  const st=S.settings,end=dayKey(),from=keyOff(1-vRange),a=S.vitals.filter(r=>r.k==="s"&&r.day>=from&&r.day<=end).sort((x,y)=>x.day<y.day?-1:x.day>y.day?1:x.time<y.time?-1:1);
  const gs=VitalsLib.gStats(S.vitals,from,end,st),last=vLast("s");
  const COL={acl:"var(--prim)",once:"var(--prim)",sonra:"var(--kcal)",yatis:"var(--su)",rast:"var(--mut)"};
  const series=VitalsLib.CTX.map(([c])=>({pts:a.filter(r=>r.ctx===c).map(r=>({day:r.day,time:r.time,v:r.g,out:!!VitalsLib.flagG(r,st)})),color:COL[c],line:false})).filter(s=>s.pts.length);
  const ctxs=new Set(a.map(r=>r.ctx)),fastOnly=[...ctxs].every(c=>c==="acl"||c==="once"),postOnly=[...ctxs].every(c=>c==="sonra");
  const band=a.length&&(fastOnly||postOnly)?(()=>{const r=VitalsLib.rangeG(fastOnly?"acl":"sonra",st);return r.lo!=null||r.hi!=null?r:null})():null;
  const rows=a.slice().reverse().map(r=>{const f=VitalsLib.flagG(r,st);return `<div class="row" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-top:1px solid var(--line)"><span style="flex:1">${vDayLbl(r.day)} ${r.time}<small class="mut"> ${esc(VitalsLib.ctxName(r.ctx))}</small></span><b class="num">${vFmt(r.g)}</b><span aria-hidden="true">${f==="high"?"▲":f==="low"?"▼":""}</span>${vDel([r.id])}</div>`}).join("");
  const labA1c=S.labs.filter(l=>l.k==="hba1c"&&l.v!=null).sort((x,y)=>x.day<y.day?1:-1)[0];
  return `${vBack}${vBtns("s","addbs")}
  <div class="card"><div class="lbl">Son ölçüm</div>${last?`<div class="sumv num" style="color:var(--ink)">${vFmt(last.g)} <small>mg/dL</small></div><div class="mut sm">${esc(VitalsLib.ctxName(last.ctx))}, ${vWhen(last)}${VitalsLib.flagG(last,st)?" · "+vFlagTxt(VitalsLib.flagG(last,st)):""}</div>`:`<p class="mut">Henüz ölçüm yok.</p>`}</div>
  ${vSeg()}${gs?`<div class="stats"><div class="stat"><div class="k">Ortalama</div><div class="v num">${Math.round(gs.avg)}</div></div><div class="stat"><div class="k">Ölçüm sayısı</div><div class="v num">${gs.n}</div></div><div class="stat"><div class="k">En düşük / en yüksek</div><div class="v num">${gs.min} / ${gs.max}</div></div><div class="stat"><div class="k">Hedef aralığında</div><div class="v num">${gs.pct==null?"–":"%"+gs.pct}</div></div></div>${gs.pct==null?`<p class="hint">Yüzde için Ayarlar'dan hedef aralığı gir.</p>`:`<p class="hint">Her ölçüm kendi bağlamının (açlık, yemekten sonra) aralığıyla değerlendirilir. ${gs.ranged} ölçümün aralığı var.</p>`}
  <div class="card"><div class="lbl">Bağlama göre ortalama</div>${Object.entries(gs.byCtx).map(([c,x])=>`<div class="row" style="display:flex;justify-content:space-between;padding:6px 0"><span>${esc(VitalsLib.ctxName(c))}</span><b class="num">${Math.round(x.avg)} <small class="mut">(${x.n})</small></b></div>`).join("")}</div>`:""}
  <div class="card">${vSvg(series,band,from,end,320,150)}<div class="mut sm">Yeşil: açlık/yemek öncesi, turuncu: yemekten sonra, mavi: yatmadan önce, gri: rastgele. Gölgeli bölge ancak tek tür ölçüm varsa gösterilir.</div></div>
  <div class="card"><div class="lbl">Ölçümler (son ${vRange} gün)</div>${rows||`<p class="mut">Bu dönemde ölçüm yok.</p>`}</div>
  ${labA1c?`<div class="card"><div class="lbl">Tahlil sonucun</div><div class="row" style="display:flex;justify-content:space-between"><span>HbA1c (${vDayLbl(labA1c.day)}.${labA1c.day.slice(0,4)})</span><b class="num">${vFmt(labA1c.v)} ${esc(labA1c.u||"")}</b></div><div class="mut sm">Tahlil takibinden alındı, ölçümlerle karıştırılmaz.</div></div>`:""}
  <p class="hint">${MED_NOTE} Hedef aralığı Ayarlar'dan girilir.</p>`;
}

/* ---- Doktor raporu ---- */
function vPdfMenu(kind){
  openSheet(`<h3>Doktor raporu</h3><p class="mut sm">Hangi dönemi rapora ekleyelim?</p>${[7,14,30,90].map(n=>`<button class="btn ghost" data-vt="pdf:${kind}:${n}" style="margin-bottom:8px">Son ${n} gün</button>`).join("")}<button class="btn ghost" data-vt="close">Vazgeç</button>`);
}
function vReportInfo(kind,days){
  const st=S.settings,end=dayKey(),from=keyOff(1-days),all=S.vitals,rows=VitalsLib.reportRows(all,kind,from,end,st);
  const summary=[["Dönem",`${vDayLbl(from)}.${from.slice(0,4)} - ${vDayLbl(end)}.${end.slice(0,4)} (${days} gün)`],["Ölçüm sayısı",String(rows.length)]];
  let series,title;
  if(kind==="t"){
    title="NeoWell · Tansiyon raporu";
    const raw=all.filter(r=>r.k==="t"&&r.day>=from&&r.day<=end),h=VitalsLib.homeAvg(all,end,days),a=h.all;
    const t=x=>x?`${Math.round(x.sys)}/${Math.round(x.dia)} mmHg (${x.n} ölçüm)`:"–";
    summary.push(["Dönem ortalaması",t(a)],["Sabah ortalaması",t(h.sabah)],["Akşam ortalaması",t(h.aksam)],["Hedef aralığı",st.bpSysHi>0||st.bpDiaHi>0?`üst ${st.bpSysHi||"-"}/${st.bpDiaHi||"-"}${st.bpSysLo>0||st.bpDiaLo>0?`, alt ${st.bpSysLo||"-"}/${st.bpDiaLo||"-"}`:""}`:"girilmemiş"]);
    const pt=f=>raw.map(r=>({day:r.day,v:r[f],out:!!VitalsLib.flagBp(r.sys,r.dia,st)}));
    series=[{pts:pt("sys"),color:"#0f5c52"},{pts:pt("dia"),color:"#2b6cb0"}];
  }else{
    title="NeoWell · Şeker raporu";
    const g=VitalsLib.gStats(all,from,end,st);
    if(g){summary.push(["Ortalama",`${Math.round(g.avg)} mg/dL`],["En düşük / en yüksek",`${g.min} / ${g.max} mg/dL`],["Hedef aralığında",g.pct==null?"hedef aralığı girilmemiş":`%${g.pct} (${g.ranged} ölçüm)`]);
      for(const [c,x] of Object.entries(g.byCtx))summary.push([`Ortalama: ${VitalsLib.ctxName(c)}`,`${Math.round(x.avg)} mg/dL (${x.n})`])}
    const raw=all.filter(r=>r.k==="s"&&r.day>=from&&r.day<=end);
    series=[{pts:raw.map(r=>({day:r.day,v:r.g,out:!!VitalsLib.flagG(r,st)})),color:"#0f5c52"}];
  }
  const pages=VitalsLib.paginate(rows.length,summary.length);
  return {rows,pages,info:{kind,title,period:`${from} - ${end}`.split(" - ").map(d=>d.slice(8)+"."+d.slice(5,7)+"."+d.slice(0,4)).join(" - "),summary,chart:series.some(s=>s.pts.length)?{series,band:null,from,to:end}:null,today:end,total:0}};
}
async function vPdf(kind,days){
  closeSheet();
  if(!S.vitals.some(r=>r.k===kind))return toast("Raporlanacak ölçüm yok");
  let pdf;
  try{
    const {rows,pages,info}=vReportInfo(kind,days);let i=0;
    const jp=pages.map((p,n)=>{
      const c=document.createElement("canvas");c.width=VitalsLib.RW;c.height=VitalsLib.RH;
      VitalsLib.drawPage(c.getContext("2d"),rows.slice(i,i+p.n),{...info,page:n+1,total:pages.length});i+=p.n;
      return {data:labUnb64(c.toDataURL("image/jpeg",0.85).split(",")[1]),w:c.width,h:c.height};
    });
    pdf=LabLib.buildPdf(jp);
  }catch(e){return toast("PDF hazırlanamadı")}
  await sharePdf(pdf,`neowell-${kind==="t"?"tansiyon":"seker"}-${dayKey()}.pdf`,kind==="t"?"Tansiyon raporu":"Şeker raporu");
}

document.addEventListener("click",ev=>{
  const sb=ev.target.closest("[data-vses],[data-vctx]");
  if(sb){
    const d=sb.dataset;if(d.vses)vSes=d.vses;if(d.vctx)vCtx=d.vctx;
    sb.parentNode.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",String(c===sb)));return;
  }
  const el=ev.target.closest("[data-vt]");if(!el)return;
  const [a,...rest]=el.dataset.vt.split(":"),arg=rest.join(":");
  if(a==="bptoggle")vToggle("bp");
  else if(a==="bstoggle")vToggle("bs");
  else if(a==="bppreset")vPreset("bp");
  else if(a==="gpreset")vPreset("g");
  else if(a==="menu")vMenu();
  else if(a==="addbp")sheetBp();
  else if(a==="addbs")sheetBs();
  else if(a==="savebp")vSaveBp();
  else if(a==="savebs")vSaveBs();
  else if(a==="close")closeSheet();
  else if(a==="go"){closeSheet();tab=arg;render();window.scrollTo(0,0)}
  else if(a==="range"){vRange=+arg;render()}
  else if(a==="pdfmenu")vPdfMenu(arg);
  else if(a==="pdf"){const [k,d]=arg.split(":");vPdf(k,+d)}
  else if(a==="del"){
    const ids=arg.split(",").map(Number),backup=S.vitals.slice();
    S.vitals=S.vitals.filter(r=>!ids.includes(r.id));save();render();
    toast("Ölçüm silindi",()=>{S.vitals=backup;save();render()});
  }
});
