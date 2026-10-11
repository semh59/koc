"use strict";
/* History: month calendar, monthly summary, search and the day screen. The data comes from HistoryLib; adding and deleting records use the same flows as the Today screen. */
let hg={seg:"cal",ym:null,q:"",focus:null};
const hgDay=k=>WEEKDAYS[new Date(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10)).getDay()];
const hgIndex=()=>HistoryLib.index(S,dayKey); // one pass, a few ms for 3 years of data
const HG_ICON={food:"Yemek",water:"Su",exercise:"Spor",weight:"Kilo"};
const hgMon=ym=>`${MONTHS[+ym.slice(5,7)-1]} ${ym.slice(0,4)}`;
const hgDaysAgo=k=>Algo.dayNum(dayKey())-Algo.dayNum(k);

function hgCal(idx){
  const today=dayKey(),ym=hg.ym||today.slice(0,7),y=+ym.slice(0,4),m=+ym.slice(5,7);
  const sp=HistoryLib.span(idx),y0=Math.min(+(sp.first||today).slice(0,4),+today.slice(0,4),y),y1=+today.slice(0,4);
  const grid=calGrid(ym,hgMon(ym),(k,d)=>{
    const mk=HistoryLib.marks(idx.get(k));
    const names=mk.main.map(x=>HG_ICON[x].toLowerCase()).concat(mk.other?["diğer kayıtlar"]:[]);
    const lbl=`${d} ${MONTHS[m-1]}, ${hgDay(k)}${k===today?", bugün":""}: ${names.length?names.join(", "):"kayıt yok"}`;
    return `<button class="cyd hgd${k===today?" cyn":""}${names.length?"":" hge"}" data-hg="day:${k}" aria-label="${lbl}"${k>today?" disabled":""}><span class="hgn" aria-hidden="true">${d}</span><span class="hgm" aria-hidden="true">${mk.main.map(x=>`<span class="hgk ${x}">${Icons.svg(x)}</span>`).join("")}${mk.other?`<i class="hgo"></i>`:""}</span></button>`;
  });
  const yo=Array.from({length:y1-y0+1},(_,i)=>y1-i).map(v=>`<option value="${v}"${v===y?" selected":""}>${v}</option>`).join("");
  const mo=MONTHS.map((v,i)=>`<option value="${i+1}"${i+1===m?" selected":""}>${v}</option>`).join("");
  const cur=ym===today.slice(0,7);
  return `<div class="card hgcal"><div class="cyh"><button class="chip" data-hg="mon:-1" aria-label="Önceki ay">‹</button>
    <span class="hgsel"><select class="in" id="hgm" aria-label="Ay">${mo}</select><select class="in" id="hgy" aria-label="Yıl">${yo}</select></span>
    <button class="chip" data-hg="mon:1" aria-label="Sonraki ay"${cur?" disabled":""}>›</button></div>
    ${grid}
    <div class="legend">${Object.entries(HG_ICON).map(([k,v])=>`<span>${Icons.svg(k)} ${v}</span>`).join("")}<span><i class="hgo"></i> Diğer</span></div>
    ${cur?"":`<button class="lnk" data-hg="now">Bu aya dön</button>`}</div>`;
}
function hgMonthCard(idx,ym){
  const s=HistoryLib.month(idx,ym),st=[];
  const t=(k,v)=>`<div class="stat"><div class="k">${k}</div><div class="v num">${v}</div></div>`;
  if(!s.days)return `<div class="card"><p class="mut sm">${hgMon(ym)}: kayıt yok.</p></div>`;
  st.push(t("Kayıt günü",s.days),t("Ort. kalori",s.kcalAvg!=null?fint(s.kcalAvg):"–"),t("Ort. su",s.waterAvg!=null?fmt(s.waterAvg/1000,1)+" L":"–"),t("Spor",`${Math.round(s.exercise)} dk`+(s.wo?`, ${s.wo} antr.`:"")),t("Ort. adım",s.stepsAvg!=null?fint(s.stepsAvg):"–"),
    t("Kilo",s.weightN===2?`${dw(s.weightFirst)} → ${dw(s.weightLast)} ${wlab()}`:s.weightN===1?`${dw(s.weightLast)} ${wlab()}`:"–"));
  return `<div class="card"><div class="lbl">${hgMon(ym)}</div><div class="stats hgs">${st.join("")}</div><p class="hint">Ortalamalar yalnız o veriyi girdiğin günler üzerinden; kalori için 800 kcal üstü kayıtlı günler.</p></div>`;
}
function hgMonths(idx){
  const ms=HistoryLib.months(idx);
  if(!ms.length)return emptyCard("trend","Henüz kayıt yok","Kayıt ekledikçe aylar burada listelenir.");
  let y="";
  return ms.map(s=>{
    const h=s.ym.slice(0,4)!==y?`<div class="lbl">${s.ym.slice(0,4)}</div>`:"";y=s.ym.slice(0,4);
    const bits=[`${s.days} gün`,s.kcalAvg!=null?`${fint(s.kcalAvg)} kcal ort.`:"",s.exercise?`${Math.round(s.exercise)} dk spor`:"",s.weightN===2?`${dw(s.weightFirst)} → ${dw(s.weightLast)} ${wlab()}`:""].filter(Boolean).join(" · ");
    return `${h}<button class="rrow" data-hg="ym:${s.ym}"><span class="grow tx"><b>${MONTHS[+s.ym.slice(5,7)-1]}</b><span class="mut sm num">${bits}</span></span></button>`;
  }).join("");
}
function hgResults(){
  const q=hg.q.trim();
  if(foldTr(q).trim().length<HistoryLib.MIN_QUERY)return `<p class="hint">En az ${HistoryLib.MIN_QUERY} harf yaz. Yemek, not, spor ve antrenman adlarında arar.</p>`;
  const r=HistoryLib.search(S,q,HistoryLib.SEARCH_MAX,w=>gNames(w,50));
  if(!r.total)return `<div class="empty">${Icons.svg("note")}<p class="mut">"${esc(q)}" için kayıt bulunamadı.</p></div>`;
  return `<p class="hint" role="status">${r.total} kayıt, ${r.days} günde${r.total>r.items.length?` (ilk ${r.items.length} gösteriliyor)`:""}.</p>`+r.items.map(x=>`<button class="rrow" data-hg="day:${x.day}"><span class="num mut">${fd(x.day)}</span><span class="grow tx"><b>${esc(x.text||(x.type==="food"?"Öğün":"Antrenman"))}</b><span class="mut sm">${x.type==="food"?"Yemek"+(x.v?` · ${Math.round(x.v)} kcal`:""):x.type==="note"?"Not":x.type==="exercise"?"Spor"+(x.v?` · ${Math.round(x.v)} dk`:""):"Antrenman"}</span></span></button>`).join("");
}
function viewHistory(){
  const seg=`<div class="seg" role="group" aria-label="Geçmiş görünümü">${[["cal","Takvim"],["months","Aylar"],["search","Ara"]].map(([k,l])=>`<button data-hg="seg:${k}" aria-pressed="${hg.seg===k}">${l}</button>`).join("")}</div>`;
  const ym=hg.ym||dayKey().slice(0,7),idx=hg.seg==="search"?null:hgIndex();
  const body=hg.seg==="cal"?hgCal(idx)+hgMonthCard(idx,ym):hg.seg==="months"?`<div class="card">${hgMonths(idx)}</div>`:
    `<div class="card"><label class="lbl" for="hgq">Ara</label><input class="in" id="hgq" type="search" enterkeyhint="search" placeholder="Örn. tavuk, yürüyüş, baş ağrısı" value="${esc(hg.q)}" autocomplete="off"><div id="hgres">${hgResults()}</div></div>`;
  return `${seg}${body}<p class="hint">Veriler bu telefonda durur. Kayıtların hiçbiri otomatik silinmez.</p>`;
}

/* ---- Day screen ---- */
function hgOther(k){ // the data modules produce the rows (Data.dayRows, Data.dayWork)
  return {rows:Data.dayRows.slice().sort((a,b)=>a[0]-b[0]).map(([,f])=>f(k)).join(""),wo:Data.dayWork.map(f=>f(k)).join("")};
}
function viewDay(){
  const k=keyOff(-logOff),today=logOff===0;
  const {items,log}=dayLogHtml(k),oth=hgOther(k);
  const dl=LogLib.dayLog(items),kcal=dl.groups.reduce((s,g)=>s+g.kcal,0);
  const name=`${today?"Bugün, ":logOff===1?"Dün, ":""}${fd(k)}, ${hgDay(k)}`;
  const addBar=`<div class="qa"><button class="chip" data-hg="add:food">${Icons.svg("food")} Yemek</button><button class="chip" data-hg="add:water">${Icons.svg("water")} +${S.settings.glass} ml</button><button class="chip" data-hg="add:weight">${Icons.svg("weight")} Kilo</button><button class="chip" data-hg="add:exercise">${Icons.svg("exercise")} Spor</button><button class="chip" data-hg="add:note">${Icons.svg("note")} Not</button></div>`;
  const empty=!items.length&&!oth.rows&&!oth.wo;
  const tiles=!empty?`<div class="stats hgs"><div class="stat"><div class="k">Kalori</div><div class="v num">${fint(kcal)}</div></div><div class="stat"><div class="k">Su</div><div class="v num">${dl.waterTotal<1000?Math.round(dl.waterTotal)+" ml":fmt(dl.waterTotal/1000,1)+" L"}</div></div><div class="stat"><div class="k">Spor</div><div class="v num">${Math.round(sum("exercise",k,k))} dk</div></div></div>`:"";
  const FOC={kcal:["Kalori",k=>sum("food",k,k),"var(--kcal)",kcalGoal(dayKey()),"kcal",Math.round],water:["Su",k=>sum("water",k,k),"var(--water)",S.settings.waterMl,"L",x=>fmt(x/1000,1)],exercise:["Spor",k=>sum("exercise",k,k),"var(--exercise)",sportDay(),"dk",Math.round]}[hg.focus];
  const focus=FOC?`<div class="card">${miniBars(14,FOC[1],FOC[2],FOC[3],FOC[0]+" · son 14 gün",FOC[4],FOC[5])}<button class="lnk" data-tab="history">Tüm geçmiş ve takvim</button></div>`:"";
  return `${focus}<div class="card">${dayNav("lo",name,today)}${tiles}${addBar}</div>
    ${empty?emptyCard("note","Bu güne ait kayıt yok","Yukarıdan ekleyebilirsin; unuttuğun bir günü de tamamlayabilirsin."):`<div class="card">${log}</div>`}
    ${oth.wo?`<h2>Antrenman</h2><div class="card">${oth.wo}</div>`:""}${oth.rows?`<h2>Diğer kayıtlar</h2><div class="card">${oth.rows}</div>`:""}
    <button class="lnk" data-tab="history">Takvime dön</button>`;
}

/* The day screen goes back to the oldest record day (at least yesterday). */
const hgOldest=()=>{const f=HistoryLib.span(hgIndex()).first;return Math.max(1,f?hgDaysAgo(f):0)};
function hgGoDay(k){hg.focus=null;logOff=Math.max(0,hgDaysAgo(k));hg.ym=k.slice(0,7);tab="day";render();window.scrollTo(0,0)}
document.addEventListener("click",ev=>{
  const b=ev.target.closest&&ev.target.closest("[data-hg]");if(!b||b.disabled)return;
  const [a,p]=b.dataset.hg.split(/:(.*)/s);
  if(a==="seg"){hg.seg=p;render();return}
  if(a==="focus"){hg.focus=p;logOff=0;tab="day";render();window.scrollTo(0,0);return}
  if(a==="mon"){const n=ymShift(hg.ym||dayKey().slice(0,7),+p);if(n<=dayKey().slice(0,7)){hg.ym=n;render()}return}
  if(a==="now"){hg.ym=dayKey().slice(0,7);render();return}
  if(a==="ym"){hg.ym=p;hg.seg="cal";render();window.scrollTo(0,0);return}
  if(a==="day"){hgGoDay(p);return}
  if(a==="add"){
    if(p==="food")sheetFood();else if(p==="weight")sheetWeight();else if(p==="exercise")sheetExercise();else if(p==="note")sheetNote();
    else if(p==="water"){const k=keyOff(-logOff);add("water",S.settings.glass,"",k);render();toast(`+${S.settings.glass} ml eklendi: ${fd(k)}`)}
  }
});
document.addEventListener("change",ev=>{
  const t=ev.target;if(t.id!=="hgm"&&t.id!=="hgy")return;
  const n=`${+$("#hgy").value}-${pad(+$("#hgm").value)}`,c=dayKey().slice(0,7);
  hg.ym=n>c?c:n;render();
});
document.addEventListener("input",ev=>{
  if(ev.target.id!=="hgq")return;
  hg.q=ev.target.value;const r=$("#hgres");if(r)r.innerHTML=hgResults();
});
