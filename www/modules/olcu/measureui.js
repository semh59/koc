"use strict";
/* Vücut ölçüleri (bel, kalça, göğüs, kol, uyluk): ekleme sayfası ve Trend kartı. Koç bağlamına girmez.
   index.html'deki S, save, toast, esc, fmt, fmtS, fd, num, dayOptions, fday, ferr, openSheet, closeSheet, render, Algo ile çalışır. */
const MNAME={waist:"Bel",hip:"Kalça",chest:"Göğüs",arm:"Kol",thigh:"Uyluk"};
let msel="waist";
const mLast=k=>{const a=S.measures.filter(m=>m.k===k);return a.length?a[a.length-1]:null};
const mChips=id=>`<div class="chips" id="${id}">${Algo.MEASURES.map(k=>`<button class="chip" data-ms="k:${k}" aria-pressed="${k===msel}">${MNAME[k]}</button>`).join("")}</div>`;

function sheetOlcu(){
  const l=mLast(msel);
  openSheet(`<h3>Ölçü ekle</h3><div class="lbl">Bölge</div>${mChips("mk")}<label class="lbl" for="fv">Ölçü (cm)</label><input class="in num" id="fv" inputmode="decimal" placeholder="örn. 86,5" value="${l?fmt(l.v):""}" autocomplete="off" autofocus onfocus="this.select()"><div class="ferr" id="merr" role="alert"></div>${dayOptions()}<button class="btn" data-ms="go">Kaydet</button>`);
}
function goOlcu(){
  const v=num($("#fv").value);
  if(!(v>=20&&v<=250))return ferr("merr","Ölçüyü santimetre olarak yaz (20 ile 250 arası), örneğin 86,5");
  S.measures=Algo.cleanMeasures([...S.measures,{day:fday(),k:msel,v}]);save();closeSheet();render();
  toast(`${MNAME[msel]} ${fmt(Math.round(v*10)/10)} cm kaydedildi`);
}

function mChart(list){
  if(list.length<2)return `<p class="hint">Grafik için aynı bölgeden en az iki ölçü gir.</p>`;
  const W=340,H=150,pl=36,pr=10,pt=10,pb=24,d0=Algo.dayNum(list[0].day),span=Math.max(1,Algo.dayNum(list[list.length-1].day)-d0);
  let lo=Math.min(...list.map(m=>m.v)),hi=Math.max(...list.map(m=>m.v));const pay=Math.max((hi-lo)*.15,1);lo-=pay;hi+=pay;
  const X=m=>pl+(W-pl-pr)*(Algo.dayNum(m.day)-d0)/span,Y=v=>pt+(H-pt-pb)*(1-(v-lo)/(hi-lo));
  let grid="";for(let t=0;t<=3;t++){const v=lo+(hi-lo)*t/3,y=Y(v);grid+=`<line x1="${pl}" x2="${W-pr}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)"/><text x="${pl-6}" y="${(y+3.5).toFixed(1)}" text-anchor="end">${fmt(v,0)}</text>`}
  const line=list.map((m,i)=>(i?"L":"M")+X(m).toFixed(1)+" "+Y(m.v).toFixed(1)).join(""),
    dots=list.map(m=>`<circle cx="${X(m).toFixed(1)}" cy="${Y(m.v).toFixed(1)}" r="3.5" fill="var(--prim)"/>`).join(""),
    tip=esc(JSON.stringify(list.map(m=>[+X(m).toFixed(1),+Y(m.v).toFixed(1),`${fd(m.day)} · ${fmt(m.v)} cm`])));
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${MNAME[msel]} ölçü grafiği" data-tip="${tip}">${grid}<path d="${line}" fill="none" stroke="var(--prim)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${dots}<text x="${pl}" y="${H-6}" text-anchor="start">${fd(list[0].day)}</text><text x="${W-pr}" y="${H-6}" text-anchor="end">${fd(list[list.length-1].day)}</text></svg>`;
}
function measureCard(){
  const addBtn=`<button class="btn ghost" data-ms="open">Ölçü ekle</button>`;
  if(!S.measures.length)return `<h2>Vücut ölçüleri</h2>${emptyCard("kilo","İlk ölçünü ekle","Kilo sabit kalsa da bel, kalça, göğüs, kol ve uyluk ölçülerin ilerlemeyi gösterebilir.",addBtn)}`;
  const list=S.measures.filter(m=>m.k===msel),l=list[list.length-1],f=list[0],w=mLast("waist"),cm=S.settings.heightCm;
  const stats=l?`<div class="stats"><div class="stat"><div class="k">Son</div><div class="v num">${fmt(l.v)} cm</div></div>${list.length>1?`<div class="stat"><div class="k">${fd(f.day)}'den beri</div><div class="v num">${fmtS(l.v-f.v)} cm</div></div>`:""}</div>`:"";
  const whtr=w&&cm>0?`<p class="pt-2 hint">Bel/boy oranı: <b class="num">${fmt(Algo.whtr(w.v,cm),2)}</b> (bel ${fmt(w.v)} cm, boy ${cm} cm). Genel bilgi: bel çevresinin boyun yarısından küçük olması sık anılan bir referanstır; tek başına bir şey söylemez, tanı ya da yorum değildir. Sağlık kararların için hekimine danış.</p>`:"";
  const rows=list.slice(-5).reverse().map(m=>`<div class="row"><span class="grow">${fd(m.day)}</span><b class="num">${fmt(m.v)} cm</b><button class="del" data-ms="del:${m.day}" aria-label="${fd(m.day)} ${MNAME[msel]} ölçüsünü sil">${Icons.svg("x")}</button></div>`).join("");
  return `<h2>Vücut ölçüleri</h2><div class="card">${mChips("mt")}${list.length?mChart(list):`<p class="hint">${MNAME[msel]} için ölçü yok.</p>`}${stats}${whtr}<div class="mt-2">${rows}</div>${addBtn}</div>`;
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-ms]");if(!el)return;
  const [a,p]=el.dataset.ms.split(":");
  if(a==="open")sheetOlcu();
  else if(a==="go")goOlcu();
  else if(a==="k"){
    msel=p;
    if($("#sheet").classList.contains("on")){document.querySelectorAll("#mk .chip").forEach(c=>c.setAttribute("aria-pressed",c===el));const l=mLast(p);$("#fv").value=l?fmt(l.v):""}
    else render();
  }else if(a==="del"){const prev=S.measures;S.measures=prev.filter(m=>!(m.day===p&&m.k===msel));save();render();toast("Ölçü silindi",()=>{S.measures=prev;save();render()})}
});
