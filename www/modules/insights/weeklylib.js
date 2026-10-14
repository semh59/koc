"use strict";
/* Last-7-days summary report (a sliding window that includes today, not a calendar week): collects the numbers from the records and draws the one-page PDF image (no DOM).
   It only puts the user's own records next to the user's own goals; it does not comment. */
const WeeklyLib=(()=>{
  const VL=typeof VitalsLib!=="undefined"?VitalsLib:require("../vitals/vitalslib.js"),ML=typeof MedLib!=="undefined"?MedLib:require("../meds/medlib.js");
  const WEEKDAYS_SHORT=["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"];
  const p2=n=>String(n).padStart(2,"0");
  const key=d=>`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`;
  const fmt=(x,d)=>Number(x).toFixed(d==null?1:d).replace(".",",");
  const fmtS=x=>(x>0?"+":x<0?"−":"")+fmt(Math.abs(x));
  const UN=typeof Units!=="undefined"?Units:require("../../kernel/unitlib.js");
  const A=typeof Algo!=="undefined"?Algo:require("../../kernel/algo.js"),{w:RW,h:RH,m:RM,c:C}=A.PAGE,ROW=52;
  const dmy=k=>A.fdate(k,true);
  /* Only plain water and mineral water count toward the water goal (a plain entry has no dr); tea, coffee, soda, milk and other drinks are kept apart. */
  const isWater=e=>e.type==="water"&&(!e.dr||e.dr==="water"||e.dr==="mineral");
  const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;

  /* endDay "YYYY-MM-DD", days: window length. D: {settings, entries, vitals, meds, medLog}. */
  function build(D,endDay,days=7,nowTime){
    const [y,m,d]=endDay.split("-").map(Number),end=new Date(y,m-1,d),st=D.settings,rows=[];
    for(let i=days-1;i>=0;i--){
      const dt=new Date(end.getFullYear(),end.getMonth(),end.getDate()-i);
      rows.push({day:key(dt),label:`${WEEKDAYS_SHORT[dt.getDay()]} ${dt.getDate()}`,weight:null,water:0,kcal:0,exercise:0,steps:0});
    }
    const rowOf=new Map(rows.map(r=>[r.day,r]));
    const wAt=new Map();
    for(const e of D.entries){ // one pass over all entries; the latest weigh-in time of a day wins
      const r=rowOf.get(e.day);if(!r)continue;
      if(e.type==="weight"){if((e.time||"")>=(wAt.get(e.day)??"")){r.weight=e.v??null;wAt.set(e.day,e.time||"")}}
      else if(e.type==="food")r.kcal+=e.v||0;
      else if(e.type==="exercise")r.exercise+=e.v||0;
      else if(e.type==="steps")r.steps+=e.v||0;
      else if(isWater(e))r.water+=e.v||0;
    }
    const from=rows[0].day,wu=st.wUnit==="lb"?"lb":"kg",gu=st.gUnit==="mmol"?"mmol":"mgdl",kw=x=>fmt(UN.w(x,wu)),summary=[["Dönem",`${dmy(from)} - ${dmy(endDay)}`]];
    const ks=rows.filter(r=>r.weight!=null);
    if(ks.length>=2)summary.push(["Kilo",`${kw(ks[0].weight)} → ${kw(ks[ks.length-1].weight)} ${wu} (${fmtS(UN.w(ks[ks.length-1].weight-ks[0].weight,wu))})`]);
    else if(ks.length===1)summary.push(["Kilo",`${kw(ks[0].weight)} ${wu} (tek ölçüm)`]);
    else summary.push(["Kilo",`son ${days} günde tartı kaydı yok`]);
    const any=rows.filter(r=>r.kcal>0),kc=any.filter(r=>A.fullKcal(r.kcal));
    summary.push(["Kalori",!any.length?"yemek kaydı yok":kc.length>=A.MIN_AVG_DAYS
      ?`günlük ortalama ${Math.round(mean(kc.map(r=>r.kcal)))} kcal${st.kcal>0?` (hedef ${st.kcal})`:""}, ${kc.length} tam kayıtlı gün${any.length>kc.length?`; ${any.length-kc.length} gün 800 kcal altında, ortalamaya katılmadı`:""}`
      :`${any.length} gün kayıt var; ortalama için en az ${A.MIN_AVG_DAYS} tam kayıtlı (800 kcal üstü) gün gerekir`]);
    const water=rows.filter(r=>r.water>0);
    summary.push(["Su",water.length?`günlük ortalama ${fmt(mean(water.map(r=>r.water))/1000)} L (hedef ${fmt(st.waterMl/1000)} L), ${water.length} gün kayıt`:"su kaydı yok"]);
    const sp=rows.filter(r=>r.exercise>0),spT=sp.reduce((s,r)=>s+r.exercise,0);
    summary.push(["Spor",sp.length?`toplam ${Math.round(spT)} dk (haftalık hedef ${st.sportWeek} dk), ${sp.length} gün`:"spor kaydı yok"]);
    const ad=rows.filter(r=>r.steps>0);
    if(ad.length)summary.push(["Adım",`günlük ortalama ${Math.round(mean(ad.map(r=>r.steps))).toLocaleString("tr-TR")} (hedef ${st.stepGoal.toLocaleString("tr-TR")}), ${ad.length} gün`]);
    const vit=D.vitals||[];
    if(st.bpOn){const h=VL.homeAvg(vit,endDay,days);if(h.all)summary.push(["Tansiyon",`ortalama ${Math.round(h.all.sys)}/${Math.round(h.all.dia)} mmHg (${h.all.n} ölçüm, ${h.days} gün)`])}
    if(st.bsOn){const g=VL.gStats(vit,from,endDay,st);if(g)summary.push(["Şeker",`ortalama ${gu==="mmol"?UN.fg(g.avg,gu):Math.round(g.avg)} ${UN.gl(gu)} (${g.n} ölçüm)`])}
    if(st.medOn&&D.meds&&D.meds.length){
      const a=ML.adherence(D.meds,D.medLog||[],from,endDay,endDay,nowTime||"23:59");
      if(a.total)summary.push(["İlaç uyumu",`%${a.pct} (${a.taken} / ${a.total} doz alındı${a.missed?`, ${a.missed} kaçırılan`:""}${a.late?`, ${a.late} bugün bekliyor`:""}${a.skipped?`, ${a.skipped} atlanan`:""})`]);
    }
    /* A chart appears only with at least two days of data. Colours match the app: weight primary, systolic ink, diastolic water. */
    const charts=[],kp=rows.filter(r=>r.weight!=null).map(r=>({day:r.day,v:UN.w(r.weight,wu)}));
    if(kp.length>=2)charts.push({title:`Kilo (${wu})`,series:[{pts:kp,color:C.prim,shape:"c",vals:true,fmt:v=>fmt(v)}],from,to:endDay});
    if(st.bpOn){
      const byDay={};for(const r of vit)if(r.k==="t"&&r.day>=from&&r.day<=endDay)(byDay[r.day]=byDay[r.day]||[]).push(r);
      const ds=Object.keys(byDay).sort(),avg=f=>ds.map(k=>({day:k,v:mean(byDay[k].map(r=>r[f]))}));
      if(ds.length>=2)charts.push({title:"Tansiyon (mmHg), günlük ortalama",series:[{pts:avg("sys"),color:C.ink,shape:"c",short:"Sistolik"},{pts:avg("dia"),color:C.water,shape:"s",dash:true,short:"Diyastolik",below:true}],from,to:endDay});
    }
    return {rows,summary,charts,from,end:endDay,wu};
  }

  /* The last 7 days next to the 7 before: daily averages over the days that have data (calories only over fully logged days). */
  function compare(D,endDay){
    const [y,m,d]=endDay.split("-").map(Number),prevEnd=key(new Date(y,m-1,d-7));
    const avg=(rows,f,ok)=>{const a=rows.filter(ok).map(f);return {v:mean(a),n:a.length}};
    const side=day=>{const r=build({...D,vitals:[],meds:[]},day).rows;return {kcal:avg(r,x=>x.kcal,x=>A.fullKcal(x.kcal)),water:avg(r,x=>x.water,x=>x.water>0),steps:avg(r,x=>x.steps,x=>x.steps>0)}};
    return {cur:side(endDay),prev:side(prevEnd)};
  }

  function drawPage(ctx,data,info){
    ctx.fillStyle=C.bg;ctx.fillRect(0,0,RW,RH);ctx.textBaseline="alphabetic";
    let y=RM;
    ctx.fillStyle=C.ink;ctx.font="bold 50px sans-serif";ctx.fillText(`NeoWell · Son ${data.rows.length} gün raporu`,RM,y+50);
    ctx.fillStyle=C.mut;ctx.font="24px sans-serif";
    ctx.fillText(`Oluşturulma: ${dmy(info.today)}`,RM,y+92);
    ctx.fillText("Kullanıcının kendi kayıtlarından derlenmiştir. Tıbbi yorum içermez, tanı ve tedavi yerine geçmez.",RM,y+126);
    y+=190;
    for(const [k,v] of data.summary){
      ctx.fillStyle=C.mut;ctx.font="28px sans-serif";ctx.fillText(k,RM,y+30);
      ctx.fillStyle=C.ink;ctx.font="bold 28px sans-serif";ctx.fillText(v,RM+230,y+30);y+=44;
    }
    y+=30;
    const cols=[["Gün",RM],[`Kilo (${data.wu||"kg"})`,RM+210],["Su (L)",RM+420],["Kalori",RM+620],["Spor (dk)",RM+820],["Adım",RM+1020]];
    ctx.fillStyle=C.mut;ctx.font="bold 26px sans-serif";cols.forEach(([t,x])=>ctx.fillText(t,x,y+30));
    ctx.strokeStyle=C.frame;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(RM,y+44);ctx.lineTo(RW-RM,y+44);ctx.stroke();
    y+=ROW;
    ctx.font="28px sans-serif";
    for(const r of data.rows){
      const c=[r.label,r.weight!=null?fmt(UN.w(r.weight,data.wu)):"–",r.water?fmt(r.water/1000):"–",r.kcal?String(Math.round(r.kcal)):"–",r.exercise?String(Math.round(r.exercise)):"–",r.steps?Math.round(r.steps).toLocaleString("tr-TR"):"–"];
      ctx.fillStyle=C.ink;c.forEach((t,i)=>ctx.fillText(t,cols[i][1],y+32));
      ctx.strokeStyle=C.rule;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(RM,y+ROW-4);ctx.lineTo(RW-RM,y+ROW-4);ctx.stroke();
      y+=ROW;
    }
    /* The space under the table: two charts side by side, one chart at full width. Nothing is drawn when it does not fit. */
    y+=20;
    const cs=data.charts||[],h=Math.min(320,RH-90-y-110);
    if(cs.length&&h>=150){
      const colW=(RW-2*RM)/cs.length,w=cs.length>1?colW-150:RW-2*RM-110;
      cs.forEach((c,i)=>{
        const x=RM+i*colW;
        ctx.fillStyle=C.ink;ctx.font="bold 26px sans-serif";ctx.fillText(c.title,x,y+26);
        VL.drawChart(ctx,x,y+46,w,h,c.series,c.from,c.to);
      });
    }
    ctx.fillStyle=C.mut;ctx.font="22px sans-serif";ctx.fillText("NeoWell",RM,RH-45);
  }
  return {build,compare,drawPage,isWater};
})();
if(typeof module!=="undefined")module.exports=WeeklyLib;
