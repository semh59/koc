"use strict";
/* Son 7 gün özet raporu (bugün dahil kayan pencere, takvim haftası değil): kayıtlardan sayıları derler ve tek sayfalık PDF görüntüsünü çizer (DOM yok).
   Yalnızca kullanıcının girdiği kayıtları ve kendi hedeflerini yan yana koyar; yorum yapmaz. */
const WeeklyLib=(()=>{
  const VL=typeof VitalsLib!=="undefined"?VitalsLib:require("./vitalslib.js"),ML=typeof MedLib!=="undefined"?MedLib:require("./medlib.js");
  const GUNK=["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"];
  const RW=1240,RH=1754,RM=70,ROW=52;
  const p2=n=>String(n).padStart(2,"0");
  const key=d=>`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`;
  const fmt=(x,d)=>Number(x).toFixed(d==null?1:d).replace(".",",");
  const fmtS=x=>(x>0?"+":x<0?"−":"")+fmt(Math.abs(x));
  const UN=typeof Units!=="undefined"?Units:require("./unitlib.js");
  const AL=()=>typeof Algo!=="undefined"?Algo:require("./algo.js");
  const dmy=k=>AL().fdate(k,true);
  /* Su hedefine yalnız su ve sade maden suyu sayılır; tür alanı olmayan eski kayıt su. Çay, kahve, gazlı, süt, diğer ayrı tutulur. */
  const isWater=e=>e.type==="su"&&(!e.dr||e.dr==="su"||e.dr==="maden");
  const sumOf=(es,t,k)=>es.filter(e=>(t==="su"?isWater(e):e.type===t)&&e.day===k).reduce((s,e)=>s+(e.v||0),0);
  const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;

  /* endDay "YYYY-MM-DD", days: pencere (7). S: durum. */
  function build(S,endDay,days,nowTime){
    days=days||7;
    const [y,m,d]=endDay.split("-").map(Number),end=new Date(y,m-1,d),st=S.settings,es=S.entries,rows=[];
    for(let i=days-1;i>=0;i--){
      const dt=new Date(end.getFullYear(),end.getMonth(),end.getDate()-i),k=key(dt);
      const kg=es.filter(e=>e.type==="kilo"&&e.day===k).map(e=>e.v).pop();
      rows.push({day:k,label:`${GUNK[dt.getDay()]} ${dt.getDate()}`,kilo:kg==null?null:kg,su:sumOf(es,"su",k),kcal:sumOf(es,"yemek",k),spor:sumOf(es,"spor",k),adim:sumOf(es,"adim",k)});
    }
    const from=rows[0].day,wu=st.wUnit==="lb"?"lb":"kg",gu=st.gUnit==="mmol"?"mmol":"mgdl",kw=x=>fmt(UN.w(x,wu)),summary=[["Dönem",`${dmy(from)} - ${dmy(endDay)}`]];
    const ks=rows.filter(r=>r.kilo!=null);
    if(ks.length>=2)summary.push(["Kilo",`${kw(ks[0].kilo)} → ${kw(ks[ks.length-1].kilo)} ${wu} (${fmtS(UN.w(ks[ks.length-1].kilo-ks[0].kilo,wu))})`]);
    else if(ks.length===1)summary.push(["Kilo",`${kw(ks[0].kilo)} ${wu} (tek ölçüm)`]);
    else summary.push(["Kilo","son 7 günde tartı kaydı yok"]);
    const A=AL(),any=rows.filter(r=>r.kcal>0),kc=any.filter(r=>A.fullKcal(r.kcal));
    summary.push(["Kalori",!any.length?"yemek kaydı yok":kc.length>=A.MIN_AVG_DAYS
      ?`günlük ortalama ${Math.round(mean(kc.map(r=>r.kcal)))} kcal${st.kcal>0?` (hedef ${st.kcal})`:""}, ${kc.length} tam kayıtlı gün${any.length>kc.length?`; ${any.length-kc.length} gün 800 kcal altında, ortalamaya katılmadı`:""}`
      :`${any.length} gün kayıt var; ortalama için en az ${A.MIN_AVG_DAYS} tam kayıtlı (800 kcal üstü) gün gerekir`]);
    const su=rows.filter(r=>r.su>0);
    summary.push(["Su",su.length?`günlük ortalama ${fmt(mean(su.map(r=>r.su))/1000)} L (hedef ${fmt(st.waterMl/1000)} L), ${su.length} gün kayıt`:"su kaydı yok"]);
    const sp=rows.filter(r=>r.spor>0),spT=sp.reduce((s,r)=>s+r.spor,0);
    summary.push(["Spor",sp.length?`toplam ${Math.round(spT)} dk (haftalık hedef ${st.sportWeek} dk), ${sp.length} gün`:"spor kaydı yok"]);
    const ad=rows.filter(r=>r.adim>0);
    if(ad.length)summary.push(["Adım",`günlük ortalama ${Math.round(mean(ad.map(r=>r.adim))).toLocaleString("tr-TR")} (hedef ${st.stepGoal.toLocaleString("tr-TR")}), ${ad.length} gün`]);
    const vit=S.vitals||[];
    if(st.bpOn){const h=VL.homeAvg(vit,endDay,days);if(h.all)summary.push(["Tansiyon",`ortalama ${Math.round(h.all.sys)}/${Math.round(h.all.dia)} mmHg (${h.all.n} ölçüm, ${h.days} gün)`])}
    if(st.bsOn){const g=VL.gStats(vit,from,endDay,st);if(g)summary.push(["Şeker",`ortalama ${gu==="mmol"?UN.fg(g.avg,gu):Math.round(g.avg)} ${UN.gl(gu)} (${g.n} ölçüm)`])}
    if(st.medOn&&S.meds&&S.meds.length){
      const a=ML.adherence(S.meds,S.medLog||[],from,endDay,endDay,nowTime||"23:59");
      if(a.total)summary.push(["İlaç uyumu",`%${a.pct} (${a.taken} / ${a.total} doz alındı${a.missed?`, ${a.missed} kaçırılan`:""}${a.late?`, ${a.late} bugün bekliyor`:""}${a.skipped?`, ${a.skipped} atlanan`:""})`]);
    }
    /* Grafikler yalnız en az iki günlük veri varsa çıkar. Renkler uygulamadaki ile aynı: kilo prim, sistolik ink, diyastolik su. */
    const charts=[],kp=rows.filter(r=>r.kilo!=null).map(r=>({day:r.day,v:UN.w(r.kilo,wu)}));
    if(kp.length>=2)charts.push({title:`Kilo (${wu})`,series:[{pts:kp,color:"#0f5c55",shape:"c",vals:true,fmt:v=>fmt(v)}],from,to:endDay});
    if(st.bpOn){
      const byDay={};for(const r of vit)if(r.k==="t"&&r.day>=from&&r.day<=endDay)(byDay[r.day]=byDay[r.day]||[]).push(r);
      const ds=Object.keys(byDay).sort(),avg=f=>ds.map(k=>({day:k,v:mean(byDay[k].map(r=>r[f]))}));
      if(ds.length>=2)charts.push({title:"Tansiyon (mmHg), günlük ortalama",series:[{pts:avg("sys"),color:"#10232b",shape:"c",short:"Sistolik"},{pts:avg("dia"),color:"#2a86bd",shape:"s",dash:true,short:"Diyastolik",below:true}],from,to:endDay});
    }
    return {rows,summary,charts,from,end:endDay,wu};
  }

  function drawPage(ctx,data,info){
    ctx.fillStyle="#ffffff";ctx.fillRect(0,0,RW,RH);ctx.textBaseline="alphabetic";
    let y=RM;
    ctx.fillStyle="#10232b";ctx.font="bold 50px sans-serif";ctx.fillText(`NeoWell · Son ${data.rows.length} gün raporu`,RM,y+50);
    ctx.fillStyle="#62737a";ctx.font="24px sans-serif";
    ctx.fillText(`Oluşturulma: ${dmy(info.today)}`,RM,y+92);
    ctx.fillText("Kullanıcının kendi kayıtlarından derlenmiştir. Tıbbi yorum içermez, tanı ve tedavi yerine geçmez.",RM,y+126);
    y+=190;
    for(const [k,v] of data.summary){
      ctx.fillStyle="#62737a";ctx.font="28px sans-serif";ctx.fillText(k,RM,y+30);
      ctx.fillStyle="#10232b";ctx.font="bold 28px sans-serif";ctx.fillText(v,RM+230,y+30);y+=44;
    }
    y+=30;
    const cols=[["Gün",RM],[`Kilo (${data.wu||"kg"})`,RM+210],["Su (L)",RM+420],["Kalori",RM+620],["Spor (dk)",RM+820],["Adım",RM+1020]];
    ctx.fillStyle="#62737a";ctx.font="bold 26px sans-serif";cols.forEach(([t,x])=>ctx.fillText(t,x,y+30));
    ctx.strokeStyle="#9fb4ad";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(RM,y+44);ctx.lineTo(RW-RM,y+44);ctx.stroke();
    y+=ROW;
    ctx.font="28px sans-serif";
    for(const r of data.rows){
      const c=[r.label,r.kilo!=null?fmt(UN.w(r.kilo,data.wu)):"–",r.su?fmt(r.su/1000):"–",r.kcal?String(Math.round(r.kcal)):"–",r.spor?String(Math.round(r.spor)):"–",r.adim?Math.round(r.adim).toLocaleString("tr-TR"):"–"];
      ctx.fillStyle="#10232b";c.forEach((t,i)=>ctx.fillText(t,cols[i][1],y+32));
      ctx.strokeStyle="#e3ebe8";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(RM,y+ROW-4);ctx.lineTo(RW-RM,y+ROW-4);ctx.stroke();
      y+=ROW;
    }
    /* Tablonun altındaki boşluk: iki grafik yan yana, tek grafik tam genişlikte. Sığmazsa hiç çizilmez. */
    y+=20;
    const cs=data.charts||[],h=Math.min(320,RH-90-y-110);
    if(cs.length&&h>=150){
      const colW=(RW-2*RM)/cs.length,w=cs.length>1?colW-150:RW-2*RM-110;
      cs.forEach((c,i)=>{
        const x=RM+i*colW;
        ctx.fillStyle="#10232b";ctx.font="bold 26px sans-serif";ctx.fillText(c.title,x,y+26);
        VL.drawChart(ctx,x,y+46,w,h,c.series,c.from,c.to);
      });
    }
    ctx.fillStyle="#62737a";ctx.font="22px sans-serif";ctx.fillText("NeoWell",RM,RH-45);
  }
  return {build,drawPage,RW,RH,isWater};
})();
if(typeof module!=="undefined")module.exports=WeeklyLib;
