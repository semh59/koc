"use strict";
/* Geçmiş: ay takvimi, aylık özet, arama ve gün ekranı. Veri HistoryLib'den; kayıt ekleme ve silme Bugün ekranındaki akışlarla aynı.
   S, tab, logOff, render, save, add, keyOff, dayKey, fd, fmt, esc, dayNav, emptyCard, dayLogHtml, dw, wlab, Icons, Units, AY, GUN index.html'dedir. */
let hg={seg:"tak",ym:null,q:""};
const hgPad=n=>String(n).padStart(2,"0");
const hgGun=k=>GUN[new Date(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10)).getDay()];
const hgIndex=()=>HistoryLib.index(S,dayKey); // tek geçiş; 3 yıllık veride birkaç ms
const HG_ICON={yemek:"Yemek",su:"Su",spor:"Spor",kilo:"Kilo"};
const hgMon=ym=>`${AY[+ym.slice(5,7)-1]} ${ym.slice(0,4)}`;
function hgDaysAgo(k){const a=new Date(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10)),b=new Date();return Math.round((new Date(b.getFullYear(),b.getMonth(),b.getDate())-a)/864e5)}

function hgCal(){
  const idx=hgIndex(),today=dayKey(),ym=hg.ym||today.slice(0,7),y=+ym.slice(0,4),m=+ym.slice(5,7),n=new Date(y,m,0).getDate();
  const lead=(new Date(y,m-1,1).getDay()+6)%7,sp=HistoryLib.span(idx),y0=Math.min(+(sp.first||today).slice(0,4),+today.slice(0,4)),y1=+today.slice(0,4);
  let cells="<span></span>".repeat(lead);
  for(let d=1;d<=n;d++){
    const k=`${ym}-${hgPad(d)}`,o=idx.get(k),mk=HistoryLib.marks(o),future=k>today;
    const names=mk.main.map(x=>HG_ICON[x].toLowerCase()).concat(mk.other?["diğer kayıtlar"]:[]);
    const lbl=`${d} ${AY[m-1]}, ${hgGun(k)}${k===today?", bugün":""}: ${names.length?names.join(", "):"kayıt yok"}`;
    cells+=`<button class="cyd hgd${k===today?" cyn":""}${names.length?"":" hge"}" data-hg="day:${k}" aria-label="${lbl}"${future?" disabled":""}><span class="hgn" aria-hidden="true">${d}</span><span class="hgm" aria-hidden="true">${mk.main.map(x=>`<span class="hgk ${x}">${Icons.svg(x)}</span>`).join("")}${mk.other?`<i class="hgo"></i>`:""}</span></button>`;
  }
  const yo=Array.from({length:y1-y0+1},(_,i)=>y1-i).map(v=>`<option value="${v}"${v===y?" selected":""}>${v}</option>`).join("");
  const mo=AY.map((v,i)=>`<option value="${i+1}"${i+1===m?" selected":""}>${v}</option>`).join("");
  const cur=ym===today.slice(0,7);
  return `<div class="card hgcal"><div class="cyh"><button class="chip" data-hg="mon:-1" aria-label="Önceki ay">‹</button>
    <span class="hgsel"><select class="in" id="hgm" aria-label="Ay">${mo}</select><select class="in" id="hgy" aria-label="Yıl">${yo}</select></span>
    <button class="chip" data-hg="mon:1" aria-label="Sonraki ay"${cur?" disabled":""}>›</button></div>
    <div class="cyg" role="group" aria-label="${hgMon(ym)} takvimi">${["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].map(s=>`<span class="cyw" aria-hidden="true">${s}</span>`).join("")}${cells}</div>
    <div class="legend">${Object.entries(HG_ICON).map(([k,v])=>`<span>${Icons.svg(k)} ${v}</span>`).join("")}<span><i class="hgo"></i> Diğer</span></div>
    ${cur?"":`<button class="lnk" data-hg="now">Bu aya dön</button>`}</div>`;
}
function hgMonthCard(ym){
  const s=HistoryLib.month(hgIndex(),ym),st=[];
  const t=(k,v)=>`<div class="stat"><div class="k">${k}</div><div class="v num">${v}</div></div>`;
  if(!s.days)return `<div class="card"><p class="mut sm">${hgMon(ym)}: kayıt yok.</p></div>`;
  st.push(t("Kayıt günü",s.days),t("Ort. kalori",s.kcalAvg!=null?s.kcalAvg.toLocaleString("tr-TR"):"–"),t("Ort. su",s.suAvg!=null?fmt(s.suAvg/1000,1)+" L":"–"),t("Spor",`${Math.round(s.spor)} dk`+(s.wo?`, ${s.wo} antr.`:"")),t("Ort. adım",s.adimAvg!=null?s.adimAvg.toLocaleString("tr-TR"):"–"),
    t("Kilo",s.kiloN===2?`${dw(s.kiloFirst)} → ${dw(s.kiloLast)} ${wlab()}`:s.kiloN===1?`${dw(s.kiloLast)} ${wlab()}`:"–"));
  return `<div class="card"><div class="lbl">${hgMon(ym)}</div><div class="stats hgs">${st.join("")}</div><p class="hint">Ortalamalar yalnız o veriyi girdiğin günler üzerinden; kalori için 800 kcal üstü kayıtlı günler.</p></div>`;
}
function hgMonths(){
  const ms=HistoryLib.months(hgIndex());
  if(!ms.length)return emptyCard("trend","Henüz kayıt yok","Kayıt ekledikçe aylar burada listelenir.");
  let y="";
  return ms.map(s=>{
    const h=s.ym.slice(0,4)!==y?`<div class="lbl">${s.ym.slice(0,4)}</div>`:"";y=s.ym.slice(0,4);
    const bits=[`${s.days} gün`,s.kcalAvg!=null?`${s.kcalAvg.toLocaleString("tr-TR")} kcal ort.`:"",s.spor?`${Math.round(s.spor)} dk spor`:"",s.kiloN===2?`${dw(s.kiloFirst)} → ${dw(s.kiloLast)} ${wlab()}`:""].filter(Boolean).join(" · ");
    return `${h}<button class="rrow" data-hg="ym:${s.ym}"><span class="grow tx"><b>${AY[+s.ym.slice(5,7)-1]}</b><span class="mut sm num">${bits}</span></span></button>`;
  }).join("");
}
const HG_TYPE={yemek:"yemek",not:"not",spor:"spor",wo:"salon"};
function hgResults(){
  const q=hg.q.trim();
  if(HistoryLib.norm(q).trim().length<2)return `<p class="hint">En az 2 harf yaz. Yemek, not, spor ve antrenman adlarında arar.</p>`;
  const r=HistoryLib.search(S,q,300,w=>{try{return gNames(w,50)}catch(e){return ""}});
  if(!r.total)return `<div class="empty">${Icons.svg("not")}<p class="mut">"${esc(q)}" için kayıt bulunamadı.</p></div>`;
  return `<p class="hint" role="status">${r.total} kayıt, ${r.days} günde${r.total>r.items.length?` (ilk ${r.items.length} gösteriliyor)`:""}.</p>`+r.items.map(x=>`<button class="rrow" data-hg="day:${x.day}"><span class="num mut">${fd(x.day)}</span><span class="grow tx"><b>${esc(x.text||(x.type==="yemek"?"Öğün":"Antrenman"))}</b><span class="mut sm">${x.type==="yemek"?"Yemek"+(x.v?` · ${Math.round(x.v)} kcal`:""):x.type==="not"?"Not":x.type==="spor"?"Spor"+(x.v?` · ${Math.round(x.v)} dk`:""):"Antrenman"}</span></span></button>`).join("");
}
function viewGecmis(){
  const seg=`<div class="seg" role="group" aria-label="Geçmiş görünümü">${[["tak","Takvim"],["ay","Aylar"],["ara","Ara"]].map(([k,l])=>`<button data-hg="seg:${k}" aria-pressed="${hg.seg===k}">${l}</button>`).join("")}</div>`;
  const ym=hg.ym||dayKey().slice(0,7);
  const body=hg.seg==="tak"?hgCal()+hgMonthCard(ym):hg.seg==="ay"?`<div class="card">${hgMonths()}</div>`:
    `<div class="card"><label class="lbl" for="hgq">Ara</label><input class="in" id="hgq" type="search" enterkeyhint="search" placeholder="Örn. tavuk, yürüyüş, baş ağrısı" value="${esc(hg.q)}" autocomplete="off"><div id="hgres">${hgResults()}</div></div>`;
  return `${seg}${body}<p class="hint">Veriler bu telefonda durur. Kayıtların hiçbiri otomatik silinmez.</p>`;
}

/* ---- Gün ekranı ---- */
const hgRow=(ic,l,v)=>`<div class="row"><span>${Icons.svg(ic)} ${l}</span><b class="num">${v}</b></div>`;
function hgOther(k){
  const o=[],f=(...a)=>a.filter(x=>x!=null&&x!=="").join(" ");
  const wo=S.workouts.filter(w=>w.t1!=null&&w.day===k).sort((a,b)=>a.t0-b.t0);
  const ad=S.entries.filter(e=>e.type==="adim"&&e.day===k).reduce((s,e)=>s+(e.v||0),0);
  const sl=S.sleep.find(x=>x.day===k),mo=S.mood.find(x=>x.day===k);
  const vt=S.vitals.filter(x=>x.day===k).sort((a,b)=>a.time<b.time?-1:1);
  const pl=S.pulse.filter(x=>x.day===k),hr=S.hr.find(x=>x.day===k);
  const fa=S.fast.log.filter(x=>dayKey(new Date(x.t1))===k);
  const ml=S.medLog.filter(x=>x.day===k),ms=S.measures.filter(x=>x.day===k);
  const names={waist:"Bel",hip:"Kalça",chest:"Göğüs",arm:"Kol",thigh:"Uyluk"};
  if(ad)o.push(hgRow("adim","Adım",Math.round(ad).toLocaleString("tr-TR")));
  if(sl)o.push(hgRow("moon","Uyku",hbDur(sl.min)));
  if(mo)o.push(hgRow("smile","Ruh hali",`${MOODS[mo.v-1]} ${MOODN[mo.v-1]}`));
  for(const x of vt)o.push(hgRow("heart",f(x.time,x.k==="t"?"Tansiyon":"Şeker"),x.k==="t"?`${x.sys}/${x.dia}${x.nabiz?` · nabız ${x.nabiz}`:""}`:`${Units.fg(x.g)} ${Units.gl()}`));
  for(const x of pl)o.push(hgRow("heart",`${x.time} Nabız (kamera)`,`${x.bpm}`));
  if(hr)o.push(hgRow("heart","Nabız (saat), ortalama",`${hr.a}${hr.m?` · en düşük ${hr.m}`:""}`));
  for(const x of fa)o.push(hgRow("moon","Oruç",hbDur(Math.round((x.t1-x.t0)/6e4))));
  if(ml.length){const t=ml.filter(x=>x.st==="t").length,s=ml.length-t;o.push(hgRow("ilac","İlaç",`${t} alındı${s?`, ${s} atlandı`:""}`))}
  for(const x of ms)o.push(hgRow("kilo",`Ölçü: ${names[x.k]||x.k}`,`${fmt(x.v)} cm`));
  const wr=wo.map(w=>`<button class="rrow" data-g="sum:${w.id}"><span class="grow tx"><b>${esc(w.name)}</b><span class="mut sm">${esc(gNames(w,4))}</span><span class="mut sm num">${gStats(w)}</span></span></button>`).join("");
  return {rows:o.join(""),wo:wr};
}
function viewGun(){
  const k=keyOff(-logOff),today=logOff===0;
  const {items,log}=dayLogHtml(k),oth=hgOther(k);
  const dl=LogLib.dayLog(items),kcal=dl.groups.reduce((s,g)=>s+g.kcal,0);
  const name=`${today?"Bugün, ":logOff===1?"Dün, ":""}${fd(k)}, ${hgGun(k)}`;
  const addBar=`<div class="qa"><button class="chip" data-hg="add:yemek">${Icons.svg("yemek")} Yemek</button><button class="chip" data-hg="add:su">${Icons.svg("su")} +${S.settings.glass} ml</button><button class="chip" data-hg="add:kilo">${Icons.svg("kilo")} Kilo</button><button class="chip" data-hg="add:spor">${Icons.svg("spor")} Spor</button><button class="chip" data-hg="add:not">${Icons.svg("not")} Not</button></div>`;
  const empty=!items.length&&!oth.rows&&!oth.wo;
  const sum=!empty?`<div class="stats hgs"><div class="stat"><div class="k">Kalori</div><div class="v num">${Math.round(kcal).toLocaleString("tr-TR")}</div></div><div class="stat"><div class="k">Su</div><div class="v num">${dl.suMl<1000?Math.round(dl.suMl)+" ml":fmt(dl.suMl/1000,1)+" L"}</div></div><div class="stat"><div class="k">Spor</div><div class="v num">${Math.round(S.entries.filter(e=>e.type==="spor"&&e.day===k).reduce((s,e)=>s+(e.v||0),0))} dk</div></div></div>`:"";
  return `<div class="card">${dayNav("lo",name,today)}${sum}${addBar}</div>
    ${empty?emptyCard("not","Bu güne ait kayıt yok","Yukarıdan ekleyebilirsin; unuttuğun bir günü de tamamlayabilirsin."):`<div class="card">${log}</div>`}
    ${oth.wo?`<h2>Antrenman</h2><div class="card">${oth.wo}</div>`:""}${oth.rows?`<h2>Diğer kayıtlar</h2><div class="card">${oth.rows}</div>`:""}
    <button class="lnk" data-tab="gecmis">Takvime dön</button>`;
}

/* Gün ekranında geriye en eski kayıt gününe kadar gidilir (en az dün). */
const hgOldest=()=>{const f=HistoryLib.span(hgIndex()).first;return Math.max(1,f?hgDaysAgo(f):0)};
function hgGoDay(k){logOff=Math.max(0,hgDaysAgo(k));hg.ym=k.slice(0,7);tab="gun";render();window.scrollTo(0,0)}
document.addEventListener("click",ev=>{
  const b=ev.target.closest&&ev.target.closest("[data-hg]");if(!b||b.disabled)return;
  const [a,p]=b.dataset.hg.split(/:(.*)/s);
  if(a==="seg"){hg.seg=p;render();return}
  if(a==="mon"){const ym=hg.ym||dayKey().slice(0,7),d=new Date(+ym.slice(0,4),+ym.slice(5,7)-1+ +p,1),n=`${d.getFullYear()}-${hgPad(d.getMonth()+1)}`;if(n<=dayKey().slice(0,7)){hg.ym=n;render()}return}
  if(a==="now"){hg.ym=dayKey().slice(0,7);render();return}
  if(a==="ym"){hg.ym=p;hg.seg="tak";render();window.scrollTo(0,0);return}
  if(a==="day"){hgGoDay(p);return}
  if(a==="add"){
    if(p==="yemek")sheetYemek();else if(p==="kilo")sheetKilo();else if(p==="spor")sheetSpor();else if(p==="not")sheetNot();
    else if(p==="su"){const k=keyOff(-logOff);add("su",S.settings.glass,"",k);render();toast(`+${S.settings.glass} ml eklendi: ${fd(k)}`)}
  }
});
document.addEventListener("change",ev=>{
  const t=ev.target;if(t.id!=="hgm"&&t.id!=="hgy")return;
  const y=+$("#hgy").value,m=+$("#hgm").value,n=`${y}-${hgPad(m)}`,c=dayKey().slice(0,7);
  hg.ym=n>c?c:n;render();
});
document.addEventListener("input",ev=>{
  if(ev.target.id!=="hgq")return;
  hg.q=ev.target.value;const r=$("#hgres");if(r)r.innerHTML=hgResults();
});
