"use strict";
/* Blood pressure and glucose readings: validation, averages, doctor report (no DOM).
   It does not label or colour values; it records, averages and plots. The only reading-based output is level(): the emergency box and the neutral "ask your doctor" line. */
const VitalsLib=(()=>{
  const CTX=[["fasting","Açlık"],["before","Yemek öncesi"],["after","Yemekten 2 saat sonra"],["bedtime","Yatmadan önce"],["random","Rastgele"]];
  const SESSIONS=[["morning","Sabah"],["evening","Akşam"],["other","Diğer"]];
  const CTX_NAME=new Map(CTX),SESSION_NAME=new Map(SESSIONS);
  const ctxName=c=>CTX_NAME.get(c)??"Rastgele";
  const sessionName=c=>SESSION_NAME.get(c)??"Diğer";
  const LIM={sys:[50,300],dia:[30,200],pulse:[25,250],g:[20,800]};
  const MAX_ROWS=50000,NOTE_MAX=80;
  /* Emergency box: a reading from today at or beyond these values (mg/dL for glucose). */
  const CRISIS={sys:180,dia:120,gLow:54,gHigh:400};
  /* Neutral "ask your doctor" band below the emergency box; the user's own doctor limits (settings, 0 = off) replace these. */
  const ASK={sys:140,dia:90,g:250,sysLo:90,diaLo:60,gLo:70};
  /* "Are you sure" question: jump from the previous reading of the same kind. */
  const JUMP_SYS=60,JUMP_G=150;
  const ALGO=typeof Algo!=="undefined"?Algo:require("../../kernel/algo.js"),{dayOk,timeOk}=ALGO;
  const fin=x=>typeof x==="number"&&Number.isFinite(x);
  const inr=(x,[a,b])=>fin(x)&&x>=a&&x<=b;
  const r1=x=>Math.round(x*10)/10;
  const mean=(a,f=x=>x)=>a.reduce((t,x)=>t+f(x),0)/a.length;
  const UN=typeof Units!=="undefined"?Units:require("../../kernel/unitlib.js");
  const dayN=ALGO.dayNum,fmtD=k=>ALGO.fdate(k,true);
  /* Oldest first by day and time, then id. */
  const cmpAt=(a,b)=>{const x=a.day+a.time,y=b.day+b.time;return x<y?-1:x>y?1:a.id-b.id};
  const latest=rows=>rows.reduce((b,r)=>!b||cmpAt(r,b)>0?r:b,undefined);

  /* Validates one reading: returns the clean row, or {err}. err is a code ("kind", "date", "glucose") or a Turkish message. */
  function check(x){
    if(!x||(x.k!=="t"&&x.k!=="s"))return {err:"kind"};
    if(!dayOk(x.day)||!timeOk(x.time))return {err:"date"};
    const o={day:x.day,time:x.time,k:x.k};
    if(typeof x.note==="string"&&x.note.trim())o.note=x.note.trim().slice(0,NOTE_MAX);
    if(typeof x.sid==="string"&&/^[a-z0-9]{1,12}$/.test(x.sid))o.sid=x.sid;
    if(x.k==="t"){
      if(!inr(x.sys,LIM.sys)||!inr(x.dia,LIM.dia))return {err:`Sistolik ${LIM.sys.join("-")}, diyastolik ${LIM.dia.join("-")} arasında olmalı`};
      if(x.sys<=x.dia)return {err:"Sistolik (büyük tansiyon) diyastolikten büyük olmalı"};
      o.sys=Math.round(x.sys);o.dia=Math.round(x.dia);
      if(x.pulse!=null&&x.pulse!==""){if(!inr(x.pulse,LIM.pulse))return {err:`Nabız ${LIM.pulse.join("-")} arasında olmalı`};o.pulse=Math.round(x.pulse)}
      o.session=SESSION_NAME.has(x.session)?x.session:"other";
      if(x.i===1||x.i===2)o.i=x.i;
    }else{
      if(!inr(x.g,LIM.g))return {err:"glucose"};
      o.g=r1(x.g);o.ctx=CTX_NAME.has(x.ctx)?x.ctx:"random";
    }
    return {row:o};
  }
  /* Every manual reading gets its own id: identical values in the same minute are two real readings and must not merge when cleaning. */
  const newSid=()=>Math.random().toString(36).slice(2,10);
  /* Cleans a stored list: drops invalid rows and duplicates (same sid, or the same signature when there is no sid) and renumbers the ids. */
  function clean(arr){
    const out=[],seen=new Set();let id=1;
    for(const x of (Array.isArray(arr)?arr:[]).slice(-MAX_ROWS)){
      const c=check(x);if(!c.row)continue;
      const o=c.row,sig=[o.k,o.day,o.time,o.sys,o.dia,o.g,o.ctx,o.sid,o.i,o.session,o.pulse,o.note].join("|");
      if(seen.has(sig))continue;seen.add(sig);
      out.push(Object.assign({id:id++},o));
    }
    return out;
  }

  /* Blood pressure sessions: readings with the same sid form one session, a reading without sid is a session of its own. Raw readings are kept. */
  function sessions(rows){
    const m=new Map(),list=[];
    for(const r of rows.filter(r=>r.k==="t").sort(cmpAt)){
      const key=r.sid?r.sid+"|"+r.day:"r"+r.id;
      let s=m.get(key);
      if(!s){s={day:r.day,time:r.time,session:r.session,raw:[]};m.set(key,s);list.push(s)}
      s.raw.push({id:r.id,sys:r.sys,dia:r.dia,pulse:r.pulse,time:r.time});
    }
    for(const s of list){
      s.n=s.raw.length;s.sys=r1(mean(s.raw,x=>x.sys));s.dia=r1(mean(s.raw,x=>x.dia));
      const p=s.raw.filter(x=>x.pulse!=null);s.pulse=p.length?Math.round(mean(p,x=>x.pulse)):null;
    }
    return list;
  }
  const avgOf=a=>a.length?{sys:r1(mean(a,x=>x.sys)),dia:r1(mean(a,x=>x.dia)),n:a.length}:null;
  /* Home average: the `days` days back from the end day, over all raw readings. "Not enough" under 3 distinct days. */
  function homeAvg(rows,endDay,days){
    const end=dayN(endDay),raw=rows.filter(r=>{const n=end-dayN(r.day);return r.k==="t"&&n>=0&&n<days});
    const dset=new Set(raw.map(r=>r.day));
    return {all:avgOf(raw),morning:avgOf(raw.filter(r=>r.session==="morning")),evening:avgOf(raw.filter(r=>r.session==="evening")),days:dset.size,enough:dset.size>=3};
  }

  /* Home readings of the `days` days before a day (the day itself not included), e.g. next to a lab result: {bp:{sys,dia,n}|null, g:{avg,n}|null}. No comparison, no judgement. */
  function before(rows,day,days){
    const end=dayN(day),inWin=r=>{const n=end-dayN(r.day);return n>=1&&n<=days};
    const bp=avgOf(rows.filter(r=>r.k==="t"&&inWin(r))),g=rows.filter(r=>r.k==="s"&&inWin(r));
    return {bp,g:g.length?{avg:r1(mean(g,r=>r.g)),n:g.length}:null};
  }
  /* Glucose summary: count, average, extremes, average per context. */
  function gStats(rows,from,to){
    const a=rows.filter(r=>r.k==="s"&&r.day>=from&&r.day<=to);
    if(!a.length)return null;
    const by=new Map();let min=Infinity,max=-Infinity;
    for(const r of a){
      if(!by.has(r.ctx))by.set(r.ctx,[]);
      by.get(r.ctx).push(r.g);
      if(r.g<min)min=r.g;
      if(r.g>max)max=r.g;
    }
    const byCtx={};
    for(const [c] of CTX){const g=by.get(c);if(g)byCtx[c]={n:g.length,avg:r1(mean(g))}}
    return {n:a.length,avg:r1(mean(a,r=>r.g)),min,max,byCtx};
  }
  /* Emergency box: only for readings dated today. */
  const crisis=(r,today)=>r.day===today&&(r.k==="t"?(r.sys>=CRISIS.sys||r.dia>=CRISIS.dia):(r.g<CRISIS.gLow||r.g>CRISIS.gHigh));
  /* Today's reading -> "low" | "high" (emergency box), "ask" (neutral line) or null. my: {sys, dia, g, sysLo, diaLo, gLo} doctor limits in mg/dL, 0 = default. */
  const level=(r,today,my={})=>{
    if(crisis(r,today))return r.k==="s"&&r.g<CRISIS.gLow?"low":"high";
    if(r.day!==today)return null;
    const bp=r.k==="t";
    return (bp?r.sys>=(my.sys||ASK.sys)||r.dia>=(my.dia||ASK.dia)||r.sys<(my.sysLo||ASK.sysLo)||r.dia<(my.diaLo||ASK.diaLo):r.g>=(my.g||ASK.g)||r.g<(my.gLo||ASK.gLo))?"ask":null;
  };
  /* "Are you sure" question: compared only with the latest reading of the same kind (for glucose, the same context). */
  function needsConfirm(rows,n,gu){
    const prev=latest(rows.filter(r=>r.k===n.k&&(n.k==="t"||r.ctx===n.ctx)));
    if(!prev)return null;
    if(n.k==="t")return Math.abs(n.sys-prev.sys)>JUMP_SYS?`Son sistolik ölçümün ${prev.sys} idi, şimdi ${n.sys}.`:null;
    return Math.abs(n.g-prev.g)>JUMP_G?`Aynı bağlamdaki son ölçümün ${UN.fg(prev.g,gu)} idi, şimdi ${UN.fg(n.g,gu)}.`:null;
  }

  /* ---- Doctor report PDF ---- */
  const {w:RW,h:RH,m:RM,c:C}=ALGO.PAGE,ROW=44,FOOT=80,HEAD1=330,CHART=360;
  /* Table rows: one row per raw reading. A pressure reading of a session shows its measurement number (i). */
  function reportRows(rows,kind,from,to,gu,since){
    return rows.filter(r=>r.k===kind&&r.day>=from&&r.day<=to).sort(cmpAt).map(r=>{
      let ctx,val;
      if(kind==="t"){ctx=sessionName(r.session)+(r.sid&&r.i?`, ${r.i}. ölçüm`:"");val=`${r.sys}/${r.dia} mmHg`+(r.pulse?`  nabız ${r.pulse}`:"")}
      else{ctx=ctxName(r.ctx);val=`${UN.fg(r.g,gu)} ${UN.gl(gu)}`}
      return {d:fmtD(r.day),t:r.time,c:ctx,v:val,note:r.note||"",dose:(kind==="t"&&since&&since(r.day,r.time))||""};
    });
  }
  function paginate(rowsN,nSummary){
    const first=Math.max(0,Math.floor((RH-RM-HEAD1-nSummary*38-CHART-FOOT)/ROW)),rest=Math.floor((RH-RM-FOOT-RM-ROW)/ROW);
    const pages=[{n:Math.min(first,rowsN)}];let i=pages[0].n;
    while(i<rowsN){const n=Math.min(rest,rowsN-i);pages.push({n});i+=n}
    return pages;
  }
  /* The series shape (c circle, s square, t triangle, d diamond), dashed line and direct label (short) keep series apart for colour-blind readers and black-and-white print. */
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
    ctx.strokeStyle=C.frame;ctx.lineWidth=1.5;ctx.strokeRect(x,y,w,h);
    for(const s of series){
      ctx.strokeStyle=s.color;ctx.lineWidth=2.5;if(ctx.setLineDash)ctx.setLineDash(s.dash?[14,8]:[]);ctx.beginPath();s.pts.forEach((p,i)=>i?ctx.lineTo(X(p.day),Y(p.v)):ctx.moveTo(X(p.day),Y(p.v)));ctx.stroke();if(ctx.setLineDash)ctx.setLineDash([]);
      for(const p of s.pts){ctx.fillStyle=s.color;mark(ctx,s.shape,X(p.day),Y(p.v),6)}
      if(s.vals){
        /* Value labels only at the first, last, lowest and highest point; overlapping labels are skipped. */
        const vv=s.pts.map(p=>p.v),keep=new Set([0,s.pts.length-1,vv.indexOf(Math.min(...vv)),vv.indexOf(Math.max(...vv))]);let right=-1e9;
        ctx.fillStyle=C.ink;ctx.font="22px sans-serif";
        s.pts.forEach((p,i)=>{if(!keep.has(i))return;const tx=s.fmt?s.fmt(p.v):String(Math.round(p.v)),tw=ctx.measureText(tx).width,lx=Math.min(Math.max(X(p.day)-tw/2,x+2),x+w-tw-2);if(lx<right+6)return;right=lx+tw;ctx.fillText(tx,lx,Y(p.v)-14)});
      }
      if(s.short&&s.pts.length){const p=s.pts[s.pts.length-1],tw=ctx.measureText(s.short).width;ctx.fillStyle=C.ink;ctx.font="bold 22px sans-serif";ctx.fillText(s.short,Math.min(X(p.day),x+w-tw-4),Y(p.v)+(s.below?34:-14));ctx.font="22px sans-serif"}
    }
    ctx.fillStyle=C.mut;ctx.font="22px sans-serif";ctx.fillText(fmtD(from),x,y+h+30);const e=fmtD(to);ctx.fillText(e,x+w-ctx.measureText(e).width,y+h+30);
    const ax=v=>dec?v.toFixed(dec).replace(".",","):Math.round(v);ctx.fillText(`${ax(lo)} – ${ax(hi)}`,x+w+12,y+h);
  }
  /* info: {kind,title,period,summary:[[label,value]],chart:{series,from,to,dec},page,total,today} */
  function drawPage(ctx,items,info){
    ctx.fillStyle=C.bg;ctx.fillRect(0,0,RW,RH);ctx.textBaseline="alphabetic";
    let y=RM;
    if(info.page===1){
      ctx.fillStyle=C.ink;ctx.font="bold 46px sans-serif";ctx.fillText(info.title,RM,y+46);
      ctx.fillStyle=C.mut;ctx.font="24px sans-serif";
      ctx.fillText(`${info.period}   ·   Oluşturulma: ${fmtD(info.today)}`,RM,y+90);
      ctx.fillText("Kullanıcının girdiği ölçümlerdir; yorumlanmamıştır. Bu değerleri hekiminle değerlendir.",RM,y+124);
      y+=HEAD1-RM-110;
      ctx.fillStyle=C.ink;ctx.font="28px sans-serif";
      for(const [k,v] of info.summary){ctx.fillStyle=C.mut;ctx.fillText(k,RM,y+30);ctx.fillStyle=C.ink;ctx.font="bold 28px sans-serif";ctx.fillText(v,RM+420,y+30);ctx.font="28px sans-serif";y+=38}
      y+=20;
      if(info.chart)drawChart(ctx,RM,y,RW-2*RM-110,CHART-80,info.chart.series,info.chart.from,info.chart.to,info.chart.dec);
      y+=CHART;
    }
    ctx.font="bold 24px sans-serif";ctx.fillStyle=C.mut;
    [["Tarih",RM],["Saat",RM+190],["Seans / bağlam",RM+300],["Değer",RM+700]].forEach(([t,x])=>ctx.fillText(t,x,y+30));
    ctx.strokeStyle=C.frame;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(RM,y+40);ctx.lineTo(RW-RM,y+40);ctx.stroke();
    y+=ROW;
    ctx.font="26px sans-serif";
    for(const r of items){
      ctx.fillStyle=C.ink;ctx.fillText(r.d,RM,y+30);ctx.fillText(r.t,RM+190,y+30);ctx.fillText(r.c,RM+300,r.dose?y+24:y+30);ctx.fillText(r.v,RM+700,y+30);
      if(r.dose){ctx.font="18px sans-serif";ctx.fillStyle=C.mut;ctx.fillText(r.dose,RM+300,y+41);ctx.font="26px sans-serif"}
      y+=ROW;
    }
    ctx.fillStyle=C.mut;ctx.font="22px sans-serif";ctx.fillText(`NeoWell · sayfa ${info.page}/${info.total}`+(items.some(r=>r.dose)?" · Süreler uygulamaya yazılan kayıtlara göredir.":""),RM,RH-45);
  }
  return {MAX_ROWS,newSid,CTX,SESSIONS,ctxName,sessionName,LIM,check,clean,sessions,homeAvg,before,gStats,crisis,level,needsConfirm,latest,cmpAt,reportRows,paginate,drawPage,drawChart,RW,RH};
})();
if(typeof module!=="undefined")module.exports=VitalsLib;
