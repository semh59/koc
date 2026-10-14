"use strict";
/* Doctor preparation report, cover page: the summary of WeeklyLib over 30 or 90 days, how many days have readings, and the user's own questions (no DOM, no S).
   It puts the user's records next to each other; it does not comment, colour or rate anything. */
const DoctorLib=(()=>{
  const A=typeof Algo!=="undefined"?Algo:require("../../kernel/algo.js"),{w:RW,h:RH,m:RM,c:C}=A.PAGE;
  const VL=typeof VitalsLib!=="undefined"?VitalsLib:require("../vitals/vitalslib.js");
  const ML=typeof MedLib!=="undefined"?MedLib:require("../meds/medlib.js");
  const MAXQ=5,QLEN=140,MAX_PAGES=12,WD=["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"];
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
  /* One row per medication of the user's own list, active ones first: name with meal relation and pause, times with their doses, days, start and end. */
  function medRows(meds){
    const fd=d=>A.fdate(d,true);
    return meds.slice().sort((a,b)=>b.on-a.on).map(m=>{
      const dose=sl=>[ML.doseText(m,sl),ML.amt(m,sl)!==1?`${ML.amt(m,sl)} adet`:""].filter(Boolean).join(", ");
      return {name:m.n,tag:[ML.FED_TEXT[m.fed],!m.on&&"Ara verildi"+(m.ou?`, ${fd(m.ou)} tarihine kadar`:"")].filter(Boolean),
        times:m.t.map(t=>dose(t)?`${t} · ${dose(t)}`:t),days:m.iv?`her ${m.iv} günde bir`:m.w?m.w.map(d=>WD[d]).join(", "):"her gün",
        dates:[m.s&&"Başlangıç: "+fd(m.s),m.e&&"Bitiş: "+fd(m.e)].filter(Boolean)};
    });
  }
  /* Medication table and the optional cycle lines (cycle: [[label,text]] or null) on as many pages as they need: {count, draw(ctx,n)}.
     ctx only measures text; rows are placed greedily by their wrapped height. */
  function listPages(meds,cycle,ctx){
    const LH=32,PAD=12,COL=[290,370,190,250],X=COL.map((_,i)=>RM+COL.slice(0,i).reduce((a,b)=>a+b,0)),TOP=RM+130,BOT=RH-RM-60;
    const lines=(t,w,bold)=>{ctx.font=(bold?"bold ":"")+"24px sans-serif";return wrap(ctx,t,w-16)};
    const head={h:48,head:true},items=meds.length?[{h:60,title:"Kullandığım ilaçlar"},head]:[];
    for(const r of medRows(meds)){
      const cells=[[...lines(r.name,COL[0],true),...r.tag.flatMap(t=>lines(t,COL[0]))],r.times.flatMap(t=>lines(t,COL[1])),lines(r.days,COL[2]),r.dates.flatMap(t=>lines(t,COL[3]))];
      items.push({cells,h:Math.max(...cells.map(c=>c.length))*LH+2*PAD,nameN:lines(r.name,COL[0],true).length});
    }
    if(cycle&&cycle.length){
      items.push({h:76,title:"Adet döngüsü (kullanıcı raporuna eklemeyi seçti)"});
      for(const [k,v] of cycle){const l=lines(v,640,true);items.push({kv:[k,l],h:l.length*LH+2*PAD})}
    }
    const pages=[[]];let y=0;
    for(const it of items){
      if(y+it.h>BOT-TOP&&pages[pages.length-1].length){pages.push([]);y=0;if(it.cells)pages[pages.length-1].push(head),y=head.h}
      pages[pages.length-1].push(it);y+=it.h;
    }
    const draw=(c,n)=>{
      c.fillStyle=C.bg;c.fillRect(0,0,RW,RH);c.textBaseline="alphabetic";
      c.fillStyle=C.ink;c.font="bold 50px sans-serif";c.fillText("NeoWell · Hekime hazırlan",RM,RM+50);
      c.fillStyle=C.mut;c.font="24px sans-serif";c.fillText("Kullanıcının kendi girdiği liste. Yorum içermez, tanı ve tedavi yerine geçmez.",RM,RM+92);
      let yy=TOP;
      for(const it of pages[n]){
        if(it.title){c.fillStyle=C.ink;c.font="bold 32px sans-serif";c.fillText(it.title,RM,yy+36)}
        else if(it.head){c.fillStyle=C.mut;c.font="bold 24px sans-serif";["İlaç","Saatler ve dozlar","Günler","Tarihler"].forEach((t,i)=>c.fillText(t,X[i]+8,yy+32))}
        else if(it.kv){c.fillStyle=C.mut;c.font="24px sans-serif";c.fillText(it.kv[0],RM+8,yy+PAD+24);c.fillStyle=C.ink;c.font="bold 24px sans-serif";it.kv[1].forEach((t,i)=>c.fillText(t,RM+420,yy+PAD+24+i*LH))}
        else it.cells.forEach((cell,i)=>cell.forEach((t,j)=>{
          const bold=i===0&&j<it.nameN;c.fillStyle=bold||i===1?C.ink:C.mut;c.font=(bold?"bold ":"")+"24px sans-serif";c.fillText(t,X[i]+8,yy+PAD+24+j*LH);
        }));
        yy+=it.h;
        if(it.cells||it.head){c.fillStyle=C.rule;c.fillRect(RM,yy-1,RW-2*RM,2)}
      }
      c.fillStyle=C.mut;c.font="22px sans-serif";c.fillText(`NeoWell · liste ${n+1}/${pages.length}`,RM,RH-45);
    };
    return {count:pages.length,draw};
  }
  /* data: WeeklyLib.build result (summary, charts); info: {today, days, coverage, questions}. */
  function drawCover(ctx,data,info){
    ctx.fillStyle=C.bg;ctx.fillRect(0,0,RW,RH);ctx.textBaseline="alphabetic";
    let y=RM;
    ctx.fillStyle=C.ink;ctx.font="bold 50px sans-serif";ctx.fillText("NeoWell · Hekime hazırlan",RM,y+50);
    ctx.fillStyle=C.mut;ctx.font="24px sans-serif";
    ctx.fillText(`Dönem: son ${info.days} gün · Oluşturulma: ${A.fdate(info.today,true)}`,RM,y+92);
    ctx.fillText("Kullanıcının kendi kayıtlarından derlenmiştir. Yorum içermez, tanı ve tedavi yerine geçmez.",RM,y+126);
    y+=180;
    const KW=330,VW=RW-2*RM-KW;
    for(const [k,v] of [...data.summary.filter(r=>r[0]!=="Dönem"),...info.coverage]){
      ctx.font="bold 28px sans-serif";const lines=wrap(ctx,v,VW);
      ctx.fillStyle=C.mut;ctx.font="28px sans-serif";ctx.fillText(k,RM,y+30);
      ctx.fillStyle=C.ink;ctx.font="bold 28px sans-serif";lines.forEach((l,i)=>ctx.fillText(l,RM+KW,y+30+i*36));
      y+=Math.max(1,lines.length)*36+10;
    }
    y+=20;
    if(info.questions.length){
      ctx.fillStyle=C.ink;ctx.font="bold 32px sans-serif";ctx.fillText("Hekime sormak istediklerim",RM,y+32);y+=56;
      ctx.font="28px sans-serif";
      info.questions.forEach((q,i)=>{wrap(ctx,`${i+1}. ${q}`,RW-2*RM).forEach(l=>{ctx.fillText(l,RM,y+30);y+=38});y+=8});
      y+=14;
    }
    const cs=data.charts||[],h=Math.min(320,RH-90-y-110);
    if(cs.length&&h>=150){
      const colW=(RW-2*RM)/cs.length,w=cs.length>1?colW-150:RW-2*RM-110;
      cs.forEach((c,i)=>{
        const x=RM+i*colW;
        ctx.fillStyle=C.ink;ctx.font="bold 26px sans-serif";ctx.fillText(c.title,x,y+26);
        VL.drawChart(ctx,x,y+46,w,h,c.series,c.from,c.to);
      });
    }
    ctx.fillStyle=C.mut;ctx.font="22px sans-serif";ctx.fillText("Bu değerleri hekiminle değerlendir. · NeoWell · sayfa 1",RM,RH-45);
  }
  return {cleanQuestions,coverage,drawCover,wrap,listPages,medRows,MAXQ,QLEN,MAX_PAGES};
})();
if(typeof module!=="undefined")module.exports=DoctorLib;
