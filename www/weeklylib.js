"use strict";
/* Haftalık özet raporu: kayıtlardan sayıları derler ve tek sayfalık PDF görüntüsünü çizer (DOM yok).
   Yalnızca kullanıcının girdiği kayıtları ve kendi hedeflerini yan yana koyar; yorum yapmaz. */
const WeeklyLib=(()=>{
  const VL=typeof VitalsLib!=="undefined"?VitalsLib:require("./vitalslib.js"),ML=typeof MedLib!=="undefined"?MedLib:require("./medlib.js");
  const GUNK=["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"];
  const RW=1240,RH=1754,RM=70,ROW=52;
  const p2=n=>String(n).padStart(2,"0");
  const key=d=>`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`;
  const fmt=(x,d)=>Number(x).toFixed(d==null?1:d).replace(".",",");
  const fmtS=x=>(x>0?"+":x<0?"−":"")+fmt(Math.abs(x));
  const dmy=k=>k.slice(8)+"."+k.slice(5,7)+"."+k.slice(0,4);
  const sumOf=(es,t,k)=>es.filter(e=>e.type===t&&e.day===k).reduce((s,e)=>s+(e.v||0),0);
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
    const from=rows[0].day,summary=[["Dönem",`${dmy(from)} - ${dmy(endDay)}`]];
    const ks=rows.filter(r=>r.kilo!=null);
    if(ks.length>=2)summary.push(["Kilo",`${fmt(ks[0].kilo)} → ${fmt(ks[ks.length-1].kilo)} kg (${fmtS(ks[ks.length-1].kilo-ks[0].kilo)})`]);
    else if(ks.length===1)summary.push(["Kilo",`${fmt(ks[0].kilo)} kg (tek ölçüm)`]);
    else summary.push(["Kilo","bu hafta tartı kaydı yok"]);
    const kc=rows.filter(r=>r.kcal>0);
    summary.push(["Kalori",kc.length?`günlük ortalama ${Math.round(mean(kc.map(r=>r.kcal)))} kcal${st.kcal>0?` (hedef ${st.kcal})`:""}, ${kc.length} gün kayıt`:"yemek kaydı yok"]);
    const su=rows.filter(r=>r.su>0);
    summary.push(["Su",su.length?`günlük ortalama ${fmt(mean(su.map(r=>r.su))/1000)} L (hedef ${fmt(st.waterMl/1000)} L), ${su.length} gün kayıt`:"su kaydı yok"]);
    const sp=rows.filter(r=>r.spor>0),spT=sp.reduce((s,r)=>s+r.spor,0);
    summary.push(["Spor",sp.length?`toplam ${Math.round(spT)} dk (haftalık hedef ${st.sportWeek} dk), ${sp.length} gün`:"spor kaydı yok"]);
    const ad=rows.filter(r=>r.adim>0);
    if(ad.length)summary.push(["Adım",`günlük ortalama ${Math.round(mean(ad.map(r=>r.adim))).toLocaleString("tr-TR")} (hedef ${st.stepGoal.toLocaleString("tr-TR")}), ${ad.length} gün`]);
    const vit=S.vitals||[];
    if(st.bpOn){const h=VL.homeAvg(vit,endDay,days);if(h.all)summary.push(["Tansiyon",`ortalama ${Math.round(h.all.sys)}/${Math.round(h.all.dia)} mmHg (${h.all.n} ölçüm, ${h.days} gün)`])}
    if(st.bsOn){const g=VL.gStats(vit,from,endDay,st);if(g)summary.push(["Şeker",`ortalama ${Math.round(g.avg)} mg/dL (${g.n} ölçüm)${g.pct==null?"":`, hedef aralığında %${g.pct}`}`])}
    if(st.medOn&&S.meds&&S.meds.length){
      const a=ML.adherence(S.meds,S.medLog||[],from,endDay,endDay,nowTime||"23:59");
      if(a.total)summary.push(["İlaç uyumu",`%${a.pct} (${a.taken} / ${a.total} doz alındı${a.missed?`, ${a.missed} kaçırılan`:""}${a.skipped?`, ${a.skipped} atlanan`:""})`]);
    }
    return {rows,summary,from,end:endDay};
  }

  function drawPage(ctx,data,info){
    ctx.fillStyle="#ffffff";ctx.fillRect(0,0,RW,RH);ctx.textBaseline="alphabetic";
    let y=RM;
    ctx.fillStyle="#10232b";ctx.font="bold 50px sans-serif";ctx.fillText("NeoWell · Haftalık rapor",RM,y+50);
    ctx.fillStyle="#62737a";ctx.font="24px sans-serif";
    ctx.fillText(`Oluşturulma: ${dmy(info.today)}`,RM,y+92);
    ctx.fillText("Kullanıcının kendi kayıtlarından derlenmiştir. Tıbbi yorum içermez, tanı ve tedavi yerine geçmez.",RM,y+126);
    y+=190;
    for(const [k,v] of data.summary){
      ctx.fillStyle="#62737a";ctx.font="28px sans-serif";ctx.fillText(k,RM,y+30);
      ctx.fillStyle="#10232b";ctx.font="bold 28px sans-serif";ctx.fillText(v,RM+230,y+30);y+=44;
    }
    y+=30;
    const cols=[["Gün",RM],["Kilo (kg)",RM+210],["Su (L)",RM+420],["Kalori",RM+620],["Spor (dk)",RM+820],["Adım",RM+1020]];
    ctx.fillStyle="#62737a";ctx.font="bold 26px sans-serif";cols.forEach(([t,x])=>ctx.fillText(t,x,y+30));
    ctx.strokeStyle="#9fb4ad";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(RM,y+44);ctx.lineTo(RW-RM,y+44);ctx.stroke();
    y+=ROW;
    ctx.font="28px sans-serif";
    for(const r of data.rows){
      const c=[r.label,r.kilo!=null?fmt(r.kilo):"–",r.su?fmt(r.su/1000):"–",r.kcal?String(Math.round(r.kcal)):"–",r.spor?String(Math.round(r.spor)):"–",r.adim?Math.round(r.adim).toLocaleString("tr-TR"):"–"];
      ctx.fillStyle="#10232b";c.forEach((t,i)=>ctx.fillText(t,cols[i][1],y+32));
      ctx.strokeStyle="#e3ebe8";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(RM,y+ROW-4);ctx.lineTo(RW-RM,y+ROW-4);ctx.stroke();
      y+=ROW;
    }
    ctx.fillStyle="#62737a";ctx.font="22px sans-serif";ctx.fillText("NeoWell",RM,RH-45);
  }
  return {build,drawPage,RW,RH};
})();
if(typeof module!=="undefined")module.exports=WeeklyLib;
