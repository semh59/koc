"use strict";
/* Haftalık set kas haritası (DOM yok): gWeekRegions çıktısı {bölge: set} -> ön ve arka şema SVG'si. Renk yoğunluğu 4 kademe, sayı ve metin de var (renk körlüğü).
   Şekiller kaba bir şemadır, anatomik değildir; sol yarı çizilir, m:1 olanlar aynalanır. 10-20 set genel bir kılavuz aralığıdır, hedef ya da tıbbi iddia değil. */
const MuscleMap=(()=>{
  const LO=10,HI=20,ARM="M19 49l9-1-1 24h-9z",FORE="M18 75h9l-3 28h-9z",DELT='<ellipse cx="27" cy="42" rx="8" ry="9"/>',CALF="M39.5 146H48l-2 42h-4z";
  /* [bölge, görünüm f/b, şekil, aynalı mı, sayı konumu] */
  const R=[
    ["Boyun","f",'<path d="M44 24h12l2 8H42z"/>',0,[50,31]],
    ["Omuz","f",DELT,1,[27,43]],
    ["Göğüs","f",'<path d="M49 37H40Q34 40 34 48Q34 55 42 57L49 56z"/>',1,[41,48]],
    ["Karın","f",'<path d="M41 59h18l-1 33H42z"/>',0,[50,76]],
    ["Biseps","f",`<path d="${ARM}"/>`,1,[23,62]],
    ["Ön kol","f",`<path d="${FORE}"/>`,1,[20,90]],
    ["Ön bacak","f",'<path d="M38 100h11.5L48 142H39z"/>',1,[42,113]],
    ["İç-dış bacak","f",'<path d="M45 102h4.5L48 134h-3.5z"/>',1,[47.2,128]],
    ["Baldır","f",`<path d="${CALF}"/>`,1,[43,168]],
    ["Trapez","b",'<path d="M44 27h12l7 10-13 18-13-18z"/>',0,[50,40]],
    ["Omuz","b",DELT,1,[27,43]],
    ["Sırt","b",'<path d="M37 44L49 58V78H41Q33 68 33 52z"/>',1,[41,63]],
    ["Bel","b",'<path d="M41 80h18l-1 14H42z"/>',0,[50,88]],
    ["Kalça","b",'<ellipse cx="43" cy="104" rx="7.5" ry="9"/>',1,[43,105]],
    ["Triseps","b",`<path d="${ARM}"/>`,1,[23,60]],
    ["Ön kol","b",`<path d="${FORE}"/>`,1,[20,90]],
    ["Arka bacak","b",'<path d="M38 115h11.5L48 142H39z"/>',1,[43,130]],
    ["Baldır","b",`<path d="${CALF}"/>`,1,[43,168]]
  ];
  const BODY='<circle cx="50" cy="13" r="10"/><path d="M41 92h18l3 8H38z"/><ellipse cx="12" cy="108" rx="4" ry="5"/><ellipse cx="43" cy="194" rx="6" ry="3"/>';
  const BODY_MIR='<ellipse cx="12" cy="108" rx="4" ry="5"/><ellipse cx="43" cy="194" rx="6" ry="3"/>';
  const REGIONS=[...new Set(R.map(r=>r[0]))];
  const lvl=n=>n<=0?0:n<5?1:n<LO?2:n<=HI?3:4;
  const LEG=["Set yok","1-4 set","5-9 set","10-20 set (kılavuz aralığı)","21 ve üstü"];
  const tx=(name,n)=>!(n>0)?`${name}: bu hafta set yok`:`${name}: ${n} set, haftalık ${LO}-${HI} kılavuz aralığının ${n<LO?"altında":n>HI?"üstünde":"içinde"}`;
  const mir=s=>`<g transform="translate(100 0) scale(-1 1)">${s}</g>`;
  function fig(v,regs,x){
    const parts=R.filter(r=>r[1]===v).map(([name,,s,m,p])=>{
      const n=regs[name]||0;
      return `<g class="mmr l${lvl(n)}" data-g="mm:${name}" role="button" tabindex="0" aria-label="${tx(name,n)}">${s}${m?mir(s):""}</g>`;
    }).join("");
    const nums=R.filter(r=>r[1]===v&&regs[r[0]]>0).map(([name,,,,p])=>`<text class="mmt" x="${p[0]}" y="${p[1]+2.5}">${regs[name]}</text>`).join("");
    return `<g transform="translate(${x} 0)"><g class="mmb">${BODY}${mir(BODY_MIR)}${v==="b"?'<path d="M44 24h12l2 8H42z"/>':""}</g>${parts}${nums}<text class="mmf" x="50" y="207">${v==="f"?"Ön":"Arka"}</text></g>`;
  }
  /* Şema bölgeleri parmak için küçük (44 px altı); aynı seçim 44 px'lik düğme sırasından da yapılır. regs: gWeekRegions çıktısı. Şemada olmayan bölge ("Tüm vücut", bölgesiz eski egzersiz) düğme/metin olarak ayrıca yazılır. */
  function html(regs){
    const named=new Set(R.map(r=>r[0])),total=Object.values(regs).reduce((a,b)=>a+b,0),extra=Object.keys(regs).filter(k=>!named.has(k)&&regs[k]>0);
    const svg=`<svg viewBox="0 0 220 212" role="group" aria-label="Haftalık kas haritası, ön ve arka görünüm">${fig("f",regs,0)}${fig("b",regs,120)}</svg>`;
    return `<div class="mmwrap">${svg}<p class="mmi" id="mminfo" aria-live="polite">${total>0?"Bir bölgeye dokunarak set sayısını gör.":"Bu hafta set yok."}</p>
    <div class="chips mmp">${[...REGIONS,...extra].map(k=>`<button class="chip" data-g="mm:${k}">${named.has(k)?k:k==="Tüm vücut"?k:"Bölgesiz ("+k+")"} ${regs[k]||0}</button>`).join("")}</div>
    <div class="mmleg" aria-label="Renk açıklaması">${LEG.map((t,i)=>`<span><i class="l${i}"></i>${t}</span>`).join("")}</div></div>`;
  }
  return {html,lvl,tx,REGIONS};
})();
if(typeof module!=="undefined")module.exports=MuscleMap;
