"use strict";
/* Tansiyon ve şeker ölçümleri: doğrulama, ortalama, hedef aralığı karşılaştırması, doktor raporu (DOM yok).
   Teşhis ya da yorum yapmaz; yalnızca kullanıcının girdiği ölçümleri ve kendi (ya da doktorunun) hedef aralığını karşılaştırır. */
const VitalsLib=(()=>{
  const CTX=[["acl","Açlık"],["once","Yemek öncesi"],["sonra","Yemekten 2 saat sonra"],["yatis","Yatmadan önce"],["rast","Rastgele"]];
  const SES=[["sabah","Sabah"],["aksam","Akşam"],["diger","Diğer"]];
  const ctxName=c=>(CTX.find(x=>x[0]===c)||[0,"Rastgele"])[1];
  const sesName=c=>(SES.find(x=>x[0]===c)||[0,"Diğer"])[1];
  const LIM={sys:[50,300],dia:[30,200],pulse:[25,250],g:[20,800]};
  const dayOk=d=>typeof d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!isNaN(Date.parse(d));
  const timeOk=s=>typeof s==="string"&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s);
  const fin=x=>typeof x==="number"&&Number.isFinite(x);
  const inr=(x,[a,b])=>fin(x)&&x>=a&&x<=b;
  const r1=x=>Math.round(x*10)/10;
  const dayN=k=>Date.UTC(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10))/864e5;

  /* Tek ölçümü doğrular; geçerliyse temiz satırı, değilse {err} döner. */
  function check(x){
    if(!x||(x.k!=="t"&&x.k!=="s"))return {err:"tür"};
    if(!dayOk(x.day)||!timeOk(x.time))return {err:"tarih"};
    const o={day:x.day,time:x.time,k:x.k};
    if(typeof x.not==="string"&&x.not.trim())o.not=x.not.trim().slice(0,80);
    if(x.k==="t"){
      if(!inr(x.sys,LIM.sys)||!inr(x.dia,LIM.dia))return {err:"Sistolik 50-300, diyastolik 30-200 arasında olmalı"};
      if(x.sys<=x.dia)return {err:"Sistolik (büyük tansiyon) diyastolikten büyük olmalı"};
      o.sys=Math.round(x.sys);o.dia=Math.round(x.dia);
      if(x.nabiz!=null&&x.nabiz!==""){if(!inr(x.nabiz,LIM.pulse))return {err:"Nabız 25-250 arasında olmalı"};o.nabiz=Math.round(x.nabiz)}
      o.ses=SES.some(s=>s[0]===x.ses)?x.ses:"diger";
      if(typeof x.sid==="string"&&/^[a-z0-9]{1,12}$/.test(x.sid))o.sid=x.sid;
    }else{
      if(!inr(x.g,LIM.g))return {err:"Şeker 20-800 mg/dL arasında olmalı"};
      o.g=r1(x.g);o.ctx=CTX.some(c=>c[0]===x.ctx)?x.ctx:"rast";
    }
    return {row:o};
  }
  /* Saklanan listeyi temizler: geçersizleri ve yinelenenleri atar, kimlikleri yeniden verir. */
  function clean(arr){
    const out=[],seen=new Set();let id=1;
    for(const x of (Array.isArray(arr)?arr:[]).slice(0,5000)){
      const c=check(x);if(!c.row)continue;
      const o=c.row,sig=[o.k,o.day,o.time,o.sys,o.dia,o.g,o.ctx,o.sid,o.ses,o.nabiz].join("|");
      if(seen.has(sig))continue;seen.add(sig);
      out.push(Object.assign({id:id++},o));
    }
    return out;
  }

  /* Tansiyon seansları: aynı sid'li ölçümler bir seanstır, sid'siz ölçüm kendi başına. Ham ölçümler korunur. */
  function sessions(rows){
    const m=new Map(),list=[];
    for(const r of rows.filter(r=>r.k==="t").sort((a,b)=>a.day<b.day?-1:a.day>b.day?1:a.time<b.time?-1:a.time>b.time?1:a.id-b.id)){
      const key=r.sid?r.sid+"|"+r.day:"r"+r.id;
      let s=m.get(key);
      if(!s){s={day:r.day,time:r.time,ses:r.ses,raw:[]};m.set(key,s);list.push(s)}
      s.raw.push({id:r.id,sys:r.sys,dia:r.dia,nabiz:r.nabiz,time:r.time});
    }
    for(const s of list){
      s.n=s.raw.length;s.sys=r1(s.raw.reduce((a,x)=>a+x.sys,0)/s.n);s.dia=r1(s.raw.reduce((a,x)=>a+x.dia,0)/s.n);
      const p=s.raw.filter(x=>x.nabiz!=null);s.nabiz=p.length?Math.round(p.reduce((a,x)=>a+x.nabiz,0)/p.length):null;
    }
    return list;
  }
  const avgOf=a=>a.length?{sys:r1(a.reduce((s,x)=>s+x.sys,0)/a.length),dia:r1(a.reduce((s,x)=>s+x.dia,0)/a.length),n:a.length}:null;
  /* Ev ortalaması: bitiş gününden geriye `days` gün, tüm ham ölçümlerin ortalaması. 3 günden az günde "yetersiz". */
  function homeAvg(rows,endDay,days){
    const end=dayN(endDay),raw=rows.filter(r=>r.k==="t"&&dayN(r.day)<=end&&dayN(r.day)>end-(days||7));
    const dset=new Set(raw.map(r=>r.day));
    return {all:avgOf(raw),sabah:avgOf(raw.filter(r=>r.ses==="sabah")),aksam:avgOf(raw.filter(r=>r.ses==="aksam")),days:dset.size,enough:dset.size>=3};
  }

  const pos=x=>fin(x)&&x>0;
  /* Hedef aralığı karşılaştırması. Aralık boşsa null. */
  function flagBp(sys,dia,s){
    if((pos(s.bpSysHi)&&sys>s.bpSysHi)||(pos(s.bpDiaHi)&&dia>s.bpDiaHi))return "high";
    if((pos(s.bpSysLo)&&sys<s.bpSysLo)||(pos(s.bpDiaLo)&&dia<s.bpDiaLo))return "low";
    return null;
  }
  const rangeG=(ctx,s)=>{
    const [lo,hi]=ctx==="acl"||ctx==="once"?[s.gFastLo,s.gFastHi]:ctx==="sonra"?[s.gPostLo,s.gPostHi]:[0,0];
    const o={};if(pos(lo))o.lo=lo;if(pos(hi))o.hi=hi;return o;
  };
  function flagG(r,s){
    const g=rangeG(r.ctx,s);
    if(g.hi!=null&&r.g>g.hi)return "high";
    if(g.lo!=null&&r.g<g.lo)return "low";
    return null;
  }
  const hasRange=(r,s)=>{const g=rangeG(r.ctx,s);return g.lo!=null||g.hi!=null};

  /* Şeker özeti: her ölçüm kendi bağlamının aralığıyla değerlendirilir. */
  function gStats(rows,from,to,s){
    const a=rows.filter(r=>r.k==="s"&&r.day>=from&&r.day<=to);
    if(!a.length)return null;
    const v=a.map(r=>r.g),ranged=a.filter(r=>hasRange(r,s)),inN=ranged.filter(r=>!flagG(r,s)).length,byCtx={};
    for(const [c] of CTX){const x=a.filter(r=>r.ctx===c);if(x.length)byCtx[c]={n:x.length,avg:r1(x.reduce((t,r)=>t+r.g,0)/x.length)}}
    return {n:a.length,avg:r1(v.reduce((t,x)=>t+x,0)/v.length),min:Math.min(...v),max:Math.max(...v),pct:ranged.length?Math.round(100*inN/ranged.length):null,ranged:ranged.length,byCtx};
  }
  /* Uç değer kutusu: yalnızca bugün tarihli kayıtlarda. */
  const crisis=(r,today)=>r.day===today&&(r.k==="t"?(r.sys>=180||r.dia>=120):(r.g<54||r.g>400));
  /* "Emin misin" soru: yalnızca aynı türdeki (şekerde aynı bağlamdaki) en son ölçümle karşılaştırılır. */
  function needsConfirm(rows,n){
    const prev=rows.filter(r=>r.k===n.k&&(n.k==="t"||r.ctx===n.ctx)).sort((a,b)=>a.day<b.day?1:a.day>b.day?-1:a.time<b.time?1:a.time>b.time?-1:b.id-a.id)[0];
    if(!prev)return null;
    if(n.k==="t")return Math.abs(n.sys-prev.sys)>60?`Son sistolik ölçümün ${prev.sys} idi, şimdi ${n.sys}.`:null;
    return Math.abs(n.g-prev.g)>150?`Aynı bağlamdaki son ölçümün ${prev.g} idi, şimdi ${n.g}.`:null;
  }
  const BP_PRESET={bpSysHi:135,bpDiaHi:85};
  const G_PRESET={gFastLo:80,gFastHi:130,gPostHi:180};

  /* ---- Doktor raporu PDF'i ---- */
  const RW=1240,RH=1754,RM=70,ROW=44,FOOT=80;
  const fmtD=k=>k.slice(8)+"."+k.slice(5,7)+"."+k.slice(0,4);
  const num=x=>String(r1(x)).replace(".",",");
  /* Tablo satırları: her ham ölçüm bir satır. */
  function reportRows(rows,kind,from,to,s){
    const a=rows.filter(r=>r.k===kind&&r.day>=from&&r.day<=to).sort((x,y)=>x.day<y.day?-1:x.day>y.day?1:x.time<y.time?-1:x.time>y.time?1:x.id-y.id);
    const nth=new Map();
    return a.map(r=>{
      const f=kind==="t"?flagBp(r.sys,r.dia,s):flagG(r,s);
      let ctx,val;
      if(kind==="t"){const key=r.sid?r.sid+r.day:null,i=key?(nth.set(key,(nth.get(key)||0)+1),nth.get(key)):0;ctx=sesName(r.ses)+(i?`, ${i}. ölçüm`:"");val=`${r.sys}/${r.dia} mmHg`+(r.nabiz?`  nabız ${r.nabiz}`:"")}
      else{ctx=ctxName(r.ctx);val=`${num(r.g)} mg/dL`}
      return {d:fmtD(r.day),t:r.time,c:ctx,v:val,f:f==="high"?"▲":f==="low"?"▼":"",not:r.not||""};
    });
  }
  const HEAD1=330,CHART=360;
  function paginate(rowsN,nSummary){
    const first=Math.max(0,Math.floor((RH-RM-HEAD1-nSummary*38-CHART-FOOT)/ROW)),rest=Math.floor((RH-RM-FOOT-RM-ROW)/ROW);
    const pages=[],items=[];let i=0;
    pages.push({n:Math.min(first,rowsN)});i+=pages[0].n;
    while(i<rowsN){const n=Math.min(rest,rowsN-i);pages.push({n});i+=n}
    return pages;
  }
  function drawChart(ctx,x,y,w,h,series,band,from,to){
    const f=dayN(from),t=dayN(to),span=Math.max(1,t-f);
    const vs=series.flatMap(s=>s.pts.map(p=>p.v));if(band){if(band.lo!=null)vs.push(band.lo);if(band.hi!=null)vs.push(band.hi)}
    if(!vs.length)return;
    let lo=Math.min(...vs),hi=Math.max(...vs);if(hi===lo){hi+=1;lo-=1}const pad=(hi-lo)*.12;lo-=pad;hi+=pad;
    const X=d=>x+w*(dayN(d)-f)/span,Y=v=>y+h-h*(v-lo)/(hi-lo);
    if(band){const y1=band.hi!=null?Y(band.hi):y,y2=band.lo!=null?Y(band.lo):y+h;ctx.fillStyle="#e3efe9";ctx.fillRect(x,Math.min(y1,y2),w,Math.abs(y2-y1))}
    ctx.strokeStyle="#9fb4ad";ctx.lineWidth=1.5;ctx.strokeRect(x,y,w,h);
    for(const s of series){
      ctx.strokeStyle=s.color;ctx.lineWidth=2.5;ctx.beginPath();s.pts.forEach((p,i)=>i?ctx.lineTo(X(p.day),Y(p.v)):ctx.moveTo(X(p.day),Y(p.v)));ctx.stroke();
      for(const p of s.pts){ctx.fillStyle=p.out?"#b3261e":s.color;ctx.beginPath();ctx.arc(X(p.day),Y(p.v),6,0,Math.PI*2);ctx.fill()}
    }
    ctx.fillStyle="#62737a";ctx.font="22px sans-serif";ctx.fillText(fmtD(from),x,y+h+30);const e=fmtD(to);ctx.fillText(e,x+w-ctx.measureText(e).width,y+h+30);
    ctx.fillText(`${Math.round(lo)} – ${Math.round(hi)}`,x+w+12,y+h);
  }
  /* info: {kind,title,period,summary:[[etiket,değer]],rows (reportRows),chart:{series,band,from,to},page,total,today} */
  function drawPage(ctx,items,info){
    ctx.fillStyle="#ffffff";ctx.fillRect(0,0,RW,RH);ctx.textBaseline="alphabetic";
    let y=RM;
    if(info.page===1){
      ctx.fillStyle="#10232b";ctx.font="bold 46px sans-serif";ctx.fillText(info.title,RM,y+46);
      ctx.fillStyle="#62737a";ctx.font="24px sans-serif";
      ctx.fillText(`${info.period}   ·   Oluşturulma: ${fmtD(info.today)}`,RM,y+90);
      ctx.fillText("Kullanıcının girdiği ölçümlerdir. Tıbbi yorum içermez, tanı ve tedavi yerine geçmez.",RM,y+124);
      y+=HEAD1-RM-110;
      ctx.fillStyle="#10232b";ctx.font="28px sans-serif";
      for(const [k,v] of info.summary){ctx.fillStyle="#62737a";ctx.fillText(k,RM,y+30);ctx.fillStyle="#10232b";ctx.font="bold 28px sans-serif";ctx.fillText(v,RM+420,y+30);ctx.font="28px sans-serif";y+=38}
      y+=20;
      if(info.chart)drawChart(ctx,RM,y,RW-2*RM-110,CHART-80,info.chart.series,info.chart.band,info.chart.from,info.chart.to);
      y+=CHART;
    }
    ctx.font="bold 24px sans-serif";ctx.fillStyle="#62737a";
    [["Tarih",RM],["Saat",RM+190],["Seans / bağlam",RM+300],["Değer",RM+700]].forEach(([t,x])=>ctx.fillText(t,x,y+30));
    ctx.strokeStyle="#9fb4ad";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(RM,y+40);ctx.lineTo(RW-RM,y+40);ctx.stroke();
    y+=ROW;
    ctx.font="26px sans-serif";
    for(const r of items){
      ctx.fillStyle="#10232b";ctx.fillText(r.d,RM,y+30);ctx.fillText(r.t,RM+190,y+30);ctx.fillText(r.c,RM+300,y+30);ctx.fillText(r.v,RM+700,y+30);
      if(r.f){ctx.fillStyle="#b3261e";ctx.fillText(r.f==="▲"?"▲ hedef aralığının üstünde":"▼ hedef aralığının altında",RM+950,y+30)}
      y+=ROW;
    }
    ctx.fillStyle="#62737a";ctx.font="22px sans-serif";ctx.fillText(`NeoWell · sayfa ${info.page}/${info.total}`,RM,RH-45);
  }
  return {CTX,SES,ctxName,sesName,LIM,check,clean,sessions,homeAvg,flagBp,flagG,rangeG,gStats,crisis,needsConfirm,BP_PRESET,G_PRESET,reportRows,paginate,drawPage,drawChart,RW,RH,dayN,num};
})();
if(typeof module!=="undefined")module.exports=VitalsLib;
