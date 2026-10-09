"use strict";
/* Tansiyon ve şeker ölçümleri: doğrulama, ortalama, doktor raporu (DOM yok).
   Değerleri yorumlamaz: eşik, etiket ve renk yok; yalnızca kaydeder, ortalar, çizer. */
const VitalsLib=(()=>{
  const CTX=[["acl","Açlık"],["once","Yemek öncesi"],["sonra","Yemekten 2 saat sonra"],["yatis","Yatmadan önce"],["rast","Rastgele"]];
  const SES=[["sabah","Sabah"],["aksam","Akşam"],["diger","Diğer"]];
  const ctxName=c=>(CTX.find(x=>x[0]===c)||[0,"Rastgele"])[1];
  const sesName=c=>(SES.find(x=>x[0]===c)||[0,"Diğer"])[1];
  const LIM={sys:[50,300],dia:[30,200],pulse:[25,250],g:[20,800]};
  const dayOk=d=>typeof d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&new Date(d+"T00:00Z").toJSON()?.slice(0,10)===d;
  const timeOk=s=>typeof s==="string"&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s);
  const fin=x=>typeof x==="number"&&Number.isFinite(x);
  const inr=(x,[a,b])=>fin(x)&&x>=a&&x<=b;
  const r1=x=>Math.round(x*10)/10;
  const UN=typeof Units!=="undefined"?Units:require("./unitlib.js");
  const dayN=k=>Date.UTC(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10))/864e5;

  /* Tek ölçümü doğrular; geçerliyse temiz satırı, değilse {err} döner. */
  function check(x){
    if(!x||(x.k!=="t"&&x.k!=="s"))return {err:"tür"};
    if(!dayOk(x.day)||!timeOk(x.time))return {err:"tarih"};
    const o={day:x.day,time:x.time,k:x.k};
    if(typeof x.not==="string"&&x.not.trim())o.not=x.not.trim().slice(0,80);
    if(typeof x.sid==="string"&&/^[a-z0-9]{1,12}$/.test(x.sid))o.sid=x.sid;
    if(x.k==="t"){
      if(!inr(x.sys,LIM.sys)||!inr(x.dia,LIM.dia))return {err:"Sistolik 50-300, diyastolik 30-200 arasında olmalı"};
      if(x.sys<=x.dia)return {err:"Sistolik (büyük tansiyon) diyastolikten büyük olmalı"};
      o.sys=Math.round(x.sys);o.dia=Math.round(x.dia);
      if(x.nabiz!=null&&x.nabiz!==""){if(!inr(x.nabiz,LIM.pulse))return {err:"Nabız 25-250 arasında olmalı"};o.nabiz=Math.round(x.nabiz)}
      o.ses=SES.some(s=>s[0]===x.ses)?x.ses:"diger";
      if(x.i===1||x.i===2)o.i=x.i;
    }else{
      if(!inr(x.g,LIM.g))return {err:"Şeker 20-800 mg/dL arasında olmalı"};
      o.g=r1(x.g);o.ctx=CTX.some(c=>c[0]===x.ctx)?x.ctx:"rast";
    }
    return {row:o};
  }
  /* Elle girilen her ölçüm kendi kimliğini alır: aynı dakikadaki aynı değerler iki gerçek ölçümdür, temizlikte birleşmez. */
  const newSid=()=>Math.random().toString(36).slice(2,10).replace(/[^a-z0-9]/g,"a");
  /* Saklanan listeyi temizler: geçersizleri ve yinelenenleri (aynı sid, sid yoksa aynı imza) atar, kimlikleri yeniden verir. */
  function clean(arr){
    const out=[],seen=new Set();let id=1;
    for(const x of (Array.isArray(arr)?arr:[]).slice(-50000)){
      const c=check(x);if(!c.row)continue;
      const o=c.row,sig=[o.k,o.day,o.time,o.sys,o.dia,o.g,o.ctx,o.sid,o.i,o.ses,o.nabiz,o.not].join("|");
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

  /* Şeker özeti: sayı, ortalama, uç değerler, bağlama göre ortalama. */
  function gStats(rows,from,to){
    const a=rows.filter(r=>r.k==="s"&&r.day>=from&&r.day<=to);
    if(!a.length)return null;
    const v=a.map(r=>r.g),byCtx={};
    for(const [c] of CTX){const x=a.filter(r=>r.ctx===c);if(x.length)byCtx[c]={n:x.length,avg:r1(x.reduce((t,r)=>t+r.g,0)/x.length)}}
    return {n:a.length,avg:r1(v.reduce((t,x)=>t+x,0)/v.length),min:Math.min(...v),max:Math.max(...v),byCtx};
  }
  /* Uç değer kutusu: yalnızca bugün tarihli kayıtlarda. */
  const crisis=(r,today)=>r.day===today&&(r.k==="t"?(r.sys>=180||r.dia>=120):(r.g<54||r.g>400));
  /* "Emin misin" soru: yalnızca aynı türdeki (şekerde aynı bağlamdaki) en son ölçümle karşılaştırılır. */
  function needsConfirm(rows,n,gu){
    const prev=rows.filter(r=>r.k===n.k&&(n.k==="t"||r.ctx===n.ctx)).sort((a,b)=>a.day<b.day?1:a.day>b.day?-1:a.time<b.time?1:a.time>b.time?-1:b.id-a.id)[0];
    if(!prev)return null;
    if(n.k==="t")return Math.abs(n.sys-prev.sys)>60?`Son sistolik ölçümün ${prev.sys} idi, şimdi ${n.sys}.`:null;
    return Math.abs(n.g-prev.g)>150?`Aynı bağlamdaki son ölçümün ${UN.fg(prev.g,gu)} idi, şimdi ${UN.fg(n.g,gu)}.`:null;
  }

  /* ---- Doktor raporu PDF'i ---- */
  const RW=1240,RH=1754,RM=70,ROW=44,FOOT=80;
  const fmtD=k=>(typeof Algo!=="undefined"?Algo:require("./algo.js")).fdate(k,true);
  const num=x=>String(r1(x)).replace(".",",");
  /* Tablo satırları: her ham ölçüm bir satır. */
  function reportRows(rows,kind,from,to,gu){
    const a=rows.filter(r=>r.k===kind&&r.day>=from&&r.day<=to).sort((x,y)=>x.day<y.day?-1:x.day>y.day?1:x.time<y.time?-1:x.time>y.time?1:x.id-y.id);
    const nth=new Map();
    return a.map(r=>{
      let ctx,val;
      if(kind==="t"){const key=r.sid?r.sid+r.day:null,i=!key?0:r.i?r.i:(nth.set(key,(nth.get(key)||0)+1),nth.get(key));ctx=sesName(r.ses)+(i?`, ${i}. ölçüm`:"");val=`${r.sys}/${r.dia} mmHg`+(r.nabiz?`  nabız ${r.nabiz}`:"")}
      else{ctx=ctxName(r.ctx);val=`${UN.fg(r.g,gu)} ${UN.gl(gu)}`}
      return {d:fmtD(r.day),t:r.time,c:ctx,v:val,not:r.not||""};
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
  /* Renk körü ve siyah-beyaz baskı için seri şekli (c daire, s kare, t üçgen, d baklava), kesik çizgi ve doğrudan etiket (short) taşır. */
  function mark(ctx,sh,x,y,r){
    ctx.beginPath();
    if(sh==="s")ctx.rect(x-r,y-r,2*r,2*r);
    else if(sh==="t"){ctx.moveTo(x,y-r*1.3);ctx.lineTo(x+r*1.2,y+r);ctx.lineTo(x-r*1.2,y+r);ctx.closePath()}
    else if(sh==="d"){ctx.moveTo(x,y-r*1.3);ctx.lineTo(x+r*1.3,y);ctx.lineTo(x,y+r*1.3);ctx.lineTo(x-r*1.3,y);ctx.closePath()}
    else ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fill();
  }
  function drawChart(ctx,x,y,w,h,series,from,to,dec){
    const f=dayN(from),t=dayN(to),span=Math.max(1,t-f);
    const vs=series.flatMap(s=>s.pts.map(p=>p.v));if(!vs.length)return;
    let lo=Math.min(...vs),hi=Math.max(...vs);if(hi===lo){hi+=1;lo-=1}const pad=(hi-lo)*.12;lo-=pad;hi+=pad;
    const ip=16,X=d=>x+ip+(w-2*ip)*(dayN(d)-f)/span,Y=v=>y+h-h*(v-lo)/(hi-lo);
    ctx.font="22px sans-serif";
    ctx.strokeStyle="#9fb4ad";ctx.lineWidth=1.5;ctx.strokeRect(x,y,w,h);
    for(const s of series){
      ctx.strokeStyle=s.color;ctx.lineWidth=2.5;if(ctx.setLineDash)ctx.setLineDash(s.dash?[14,8]:[]);ctx.beginPath();s.pts.forEach((p,i)=>i?ctx.lineTo(X(p.day),Y(p.v)):ctx.moveTo(X(p.day),Y(p.v)));ctx.stroke();if(ctx.setLineDash)ctx.setLineDash([]);
      for(const p of s.pts){ctx.fillStyle=s.color;mark(ctx,s.shape,X(p.day),Y(p.v),6)}
      if(s.vals){
        /* Değer etiketi yalnız ilk, son, en düşük ve en yüksek noktada; birbirine binen etiket atlanır. */
        const vv=s.pts.map(p=>p.v),keep=new Set([0,s.pts.length-1,vv.indexOf(Math.min(...vv)),vv.indexOf(Math.max(...vv))]);let right=-1e9;
        ctx.fillStyle="#10232b";ctx.font="22px sans-serif";
        s.pts.forEach((p,i)=>{if(!keep.has(i))return;const tx=s.fmt?s.fmt(p.v):String(Math.round(p.v)),tw=ctx.measureText(tx).width,lx=Math.min(Math.max(X(p.day)-tw/2,x+2),x+w-tw-2);if(lx<right+6)return;right=lx+tw;ctx.fillText(tx,lx,Y(p.v)-14)});
      }
      if(s.short&&s.pts.length){const p=s.pts[s.pts.length-1],tw=ctx.measureText(s.short).width;ctx.fillStyle="#10232b";ctx.font="bold 22px sans-serif";ctx.fillText(s.short,Math.min(X(p.day),x+w-tw-4),Y(p.v)+(s.below?34:-14));ctx.font="22px sans-serif"}
    }
    ctx.fillStyle="#62737a";ctx.font="22px sans-serif";ctx.fillText(fmtD(from),x,y+h+30);const e=fmtD(to);ctx.fillText(e,x+w-ctx.measureText(e).width,y+h+30);
    const ax=v=>dec?v.toFixed(dec).replace(".",","):Math.round(v);ctx.fillText(`${ax(lo)} – ${ax(hi)}`,x+w+12,y+h);
  }
  /* info: {kind,title,period,summary:[[etiket,değer]],rows (reportRows),chart:{series,from,to},page,total,today} */
  function drawPage(ctx,items,info){
    ctx.fillStyle="#ffffff";ctx.fillRect(0,0,RW,RH);ctx.textBaseline="alphabetic";
    let y=RM;
    if(info.page===1){
      ctx.fillStyle="#10232b";ctx.font="bold 46px sans-serif";ctx.fillText(info.title,RM,y+46);
      ctx.fillStyle="#62737a";ctx.font="24px sans-serif";
      ctx.fillText(`${info.period}   ·   Oluşturulma: ${fmtD(info.today)}`,RM,y+90);
      ctx.fillText("Kullanıcının girdiği ölçümlerdir; yorumlanmamıştır. Bu değerleri hekiminle değerlendir.",RM,y+124);
      y+=HEAD1-RM-110;
      ctx.fillStyle="#10232b";ctx.font="28px sans-serif";
      for(const [k,v] of info.summary){ctx.fillStyle="#62737a";ctx.fillText(k,RM,y+30);ctx.fillStyle="#10232b";ctx.font="bold 28px sans-serif";ctx.fillText(v,RM+420,y+30);ctx.font="28px sans-serif";y+=38}
      y+=20;
      if(info.chart)drawChart(ctx,RM,y,RW-2*RM-110,CHART-80,info.chart.series,info.chart.from,info.chart.to,info.chart.dec);
      y+=CHART;
    }
    ctx.font="bold 24px sans-serif";ctx.fillStyle="#62737a";
    [["Tarih",RM],["Saat",RM+190],["Seans / bağlam",RM+300],["Değer",RM+700]].forEach(([t,x])=>ctx.fillText(t,x,y+30));
    ctx.strokeStyle="#9fb4ad";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(RM,y+40);ctx.lineTo(RW-RM,y+40);ctx.stroke();
    y+=ROW;
    ctx.font="26px sans-serif";
    for(const r of items){
      ctx.fillStyle="#10232b";ctx.fillText(r.d,RM,y+30);ctx.fillText(r.t,RM+190,y+30);ctx.fillText(r.c,RM+300,y+30);ctx.fillText(r.v,RM+700,y+30);
      y+=ROW;
    }
    ctx.fillStyle="#62737a";ctx.font="22px sans-serif";ctx.fillText(`NeoWell · sayfa ${info.page}/${info.total}`,RM,RH-45);
  }
  return {newSid,CTX,SES,ctxName,sesName,LIM,check,clean,sessions,homeAvg,gStats,crisis,needsConfirm,reportRows,paginate,drawPage,drawChart,RW,RH,dayN,num};
})();
if(typeof module!=="undefined")module.exports=VitalsLib;
