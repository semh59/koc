"use strict";
/* Koç analizi: haftalık "neden" etmenleri ve plato istatistiği. Saf: DOM ve S yok. */
const InsightLib=(()=>{
  const dn=k=>Math.round(Date.UTC(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10))/864e5);
  const f1=x=>String(Math.round(x*10)/10).replace(".",",");
  const sgn=x=>(x>0?"+":x<0?"-":"")+f1(Math.abs(x));
  const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
  // %95 iki yönlü t değerleri, sd 4..19 (21 günlük pencerede günde tek tartı: n en fazla 21)
  const T95=[2.776,2.571,2.447,2.365,2.306,2.262,2.228,2.201,2.179,2.160,2.145,2.131,2.120,2.110,2.101,2.093];
  /* Pencere bugüne göre: tartmayı bırakan birinin eski düz serisi plato sayılmasın. */
  function pts(w,today,days){
    const t=dn(today),out=[];
    for(const k of Object.keys(w&&typeof w==="object"?w:{})){
      if(!/^\d{4}-\d{2}-\d{2}$/.test(k)||!Number.isFinite(w[k]))continue;
      const d=t-dn(k);if(d>=0&&d<days)out.push([dn(k),w[k]]);
    }
    return out;
  }
  /* Ham tartılara en küçük kareler doğrusu; gün numarasıyla çalıştığı için düzensiz aralık sorun değil. */
  function fit(p){
    const n=p.length;if(n<3)return null;
    const mx=avg(p.map(q=>q[0])),my=avg(p.map(q=>q[1]));
    let sxx=0,sxy=0;for(const [x,y] of p){sxx+=(x-mx)**2;sxy+=(x-mx)*(y-my)}
    if(!sxx)return null;
    const m=sxy/sxx,b=my-m*mx,s2=p.reduce((s,[x,y])=>s+(y-b-m*x)**2,0)/(n-2);
    return {m,n,sd:Math.sqrt(s2),se:Math.sqrt(s2/sxx)};
  }
  /* Son 28 günde doğru çevresindeki artıkların standart sapması (kg). */
  function noiseSd(w,today){const f=fit(pts(w,today,28));return f&&f.n>=4?f.sd:null}
  /* Düz trend: eğim |<0,1| kg/hafta VE %95 güven aralığının tamamı ±0,25 içinde; geniş aralık (az/gürültülü veri) plato sayılmaz. */
  function plateau(w,today){
    const p=pts(w,today,21),xs=p.map(q=>q[0]);
    if(p.length<6||Math.max(...xs)-Math.min(...xs)<14)return {ok:false,enough:false};
    const f=fit(p),slope=7*f.m,ci=7*f.se*T95[Math.min(f.n-2,19)-4];
    return {ok:Math.abs(slope)<0.1&&Math.abs(slope)+ci<=0.25,enough:true,slope,ci};
  }
  /* d.days: bugün dahil son 22 gün {kcal,su,ad,sl}, eskiden yeniye. Bugün yarım gün olduğu için kalori, su ve adımda sayılmaz. */
  function weekWhy(d){
    d=d&&typeof d==="object"?d:{};
    const days=Array.isArray(d.days)?d.days.map(x=>x&&typeof x==="object"?x:{}):[];
    const wk=days.slice(-8,-1),prev=days.slice(-22,-8),n=x=>Number.isFinite(x)?x:0,out=[];
    const full=wk.map(x=>n(x.kcal)).filter(x=>x>=800),miss=wk.length-full.length;
    let t;
    if(!full.length)t="Kalori: son 7 günde tam kayıtlı gün yok, kalorinin etkisi değerlendirilemiyor.";
    else{
      const a=Math.round(avg(full));
      t=d.goalKcal>0?`Kalori: tam kayıtlı ${full.length} günde ortalama ${a} kcal, hedefin ${Math.round(d.goalKcal)} kcal.`:`Kalori: hedef yok; tam kayıtlı ${full.length} günde ortalama ${a} kcal.`;
      if(miss)t+=` ${miss} günün kaydı eksik ya da 800 kcal altında, ortalamaya katılmadı.`;
    }
    out.push({k:"kcal",t});
    const su=wk.map(x=>n(x.su)).filter(x=>x>0);
    if(su.length)out.push({k:"su",t:`Su: kayıtlı ${su.length} günde ortalama ${Math.round(avg(su))} ml`+(d.goalWater>0?`, hedefin ${Math.round(d.goalWater)} ml.`:".")});
    const sl=days.slice(-7).map(x=>n(x.sl)).filter(x=>x>0);
    if(sl.length)out.push({k:"uyku",t:`Uyku: ${sl.length} gecenin ortalaması ${f1(avg(sl)/60)} saat.`});
    const a1=wk.map(x=>n(x.ad)).filter(x=>x>0),a0=prev.map(x=>n(x.ad)).filter(x=>x>0);
    if(a1.length&&a0.length)out.push({k:"adim",t:`Adım: son 7 günde günlük ortalama ${Math.round(avg(a1))}, önceki 14 günde ${Math.round(avg(a0))}.`});
    if(typeof d.today==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d.today)){
      const last=p=>p.sort((x,y)=>x[0]-y[0]).pop(),w1=last(pts(d.weights,d.today,7)),w0=last(pts(d.weights,d.today,14).filter(q=>dn(d.today)-q[0]>=7));
      if(w1&&w0){
        const diff=w1[1]-w0[1],sd=noiseSd(d.weights,d.today);
        out.push({k:"tarti",t:sd!=null&&Math.abs(diff)<2*sd?`Tartı: haftalık fark ${sgn(diff)} kg; bu fark tartı oynaması aralığında, günlük su ve yemek miktarı tartıyı oynatır.`:`Tartı: haftalık fark ${sgn(diff)} kg.`});
      }else out.push({k:"tarti",t:"Tartı: karşılaştırmak için iki haftada da en az bir tartı gerekli."});
    }
    return out;
  }
  return {plateau,noiseSd,weekWhy};
})();
if(typeof module!=="undefined")module.exports=InsightLib;
