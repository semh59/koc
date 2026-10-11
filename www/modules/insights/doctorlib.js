"use strict";
/* Doctor preparation report, cover page: the summary of WeeklyLib over 30 or 90 days, how many days have readings, and the user's own questions (no DOM, no S).
   It puts the user's records next to each other; it does not comment, colour or rate anything. */
const DoctorLib=(()=>{
  const A=typeof Algo!=="undefined"?Algo:require("../../kernel/algo.js"),{w:RW,h:RH,m:RM}=A.PAGE;
  const VL=typeof VitalsLib!=="undefined"?VitalsLib:require("../vitals/vitalslib.js");
  const MAXQ=5,QLEN=140,MAX_PAGES=12;
  const clean=(s,n)=>String(s==null?"":s).replace(/[\u0000-\u001F\u007F]/g," ").replace(/\s+/g," ").trim().slice(0,n);
  const cleanQuestions=a=>(Array.isArray(a)?a:[]).map(q=>clean(q,QLEN)).filter(Boolean).slice(0,MAXQ);
  /* Days with at least one reading, as "days with readings / days in the period". */
  function coverage(D,from,to,days){
    const n=f=>new Set(f.filter(x=>x.day>=from&&x.day<=to).map(x=>x.day)).size,v=D.vitals||[],st=D.settings||{},out=[];
    if(st.bpOn)out.push(["Tansiyon ölçümü olan gün",`${n(v.filter(r=>r.k==="t"))} / ${days}`]);
    if(st.bsOn)out.push(["Şeker ölçümü olan gün",`${n(v.filter(r=>r.k==="s"))} / ${days}`]);
    out.push(["Tartı kaydı olan gün",`${n((D.entries||[]).filter(e=>e.type==="weight"))} / ${days}`]);
    return out;
  }
  /* Greedy word wrap with the canvas font already set. */
  function wrap(ctx,text,w){
    const out=[];let line="";
    for(const word of String(text).split(" ")){
      const t=line?line+" "+word:word;
      if(line&&ctx.measureText(t).width>w){out.push(line);line=word}else line=t;
    }
    if(line)out.push(line);return out;
  }
  /* data: WeeklyLib.build result (summary, charts); info: {today, days, coverage, questions}. */
  function drawCover(ctx,data,info){
    ctx.fillStyle="#ffffff";ctx.fillRect(0,0,RW,RH);ctx.textBaseline="alphabetic";
    let y=RM;
    ctx.fillStyle="#10232b";ctx.font="bold 50px sans-serif";ctx.fillText("NeoWell · Hekime hazırlan",RM,y+50);
    ctx.fillStyle="#62737a";ctx.font="24px sans-serif";
    ctx.fillText(`Dönem: son ${info.days} gün · Oluşturulma: ${A.fdate(info.today,true)}`,RM,y+92);
    ctx.fillText("Kullanıcının kendi kayıtlarından derlenmiştir. Yorum içermez, tanı ve tedavi yerine geçmez.",RM,y+126);
    y+=180;
    const KW=330,VW=RW-2*RM-KW;
    for(const [k,v] of [...data.summary.filter(r=>r[0]!=="Dönem"),...info.coverage]){
      ctx.font="bold 28px sans-serif";const lines=wrap(ctx,v,VW);
      ctx.fillStyle="#62737a";ctx.font="28px sans-serif";ctx.fillText(k,RM,y+30);
      ctx.fillStyle="#10232b";ctx.font="bold 28px sans-serif";lines.forEach((l,i)=>ctx.fillText(l,RM+KW,y+30+i*36));
      y+=Math.max(1,lines.length)*36+10;
    }
    y+=20;
    if(info.questions.length){
      ctx.fillStyle="#10232b";ctx.font="bold 32px sans-serif";ctx.fillText("Hekime sormak istediklerim",RM,y+32);y+=56;
      ctx.font="28px sans-serif";
      info.questions.forEach((q,i)=>{wrap(ctx,`${i+1}. ${q}`,RW-2*RM).forEach(l=>{ctx.fillText(l,RM,y+30);y+=38});y+=8});
      y+=14;
    }
    const cs=data.charts||[],h=Math.min(320,RH-90-y-110);
    if(cs.length&&h>=150){
      const colW=(RW-2*RM)/cs.length,w=cs.length>1?colW-150:RW-2*RM-110;
      cs.forEach((c,i)=>{
        const x=RM+i*colW;
        ctx.fillStyle="#10232b";ctx.font="bold 26px sans-serif";ctx.fillText(c.title,x,y+26);
        VL.drawChart(ctx,x,y+46,w,h,c.series,c.from,c.to);
      });
    }
    ctx.fillStyle="#62737a";ctx.font="22px sans-serif";ctx.fillText("Bu değerleri hekiminle değerlendir. · NeoWell · sayfa 1",RM,RH-45);
  }
  return {cleanQuestions,coverage,drawCover,wrap,MAXQ,QLEN,MAX_PAGES};
})();
if(typeof module!=="undefined")module.exports=DoctorLib;
