"use strict";
/* Kamerayla nabız: parmak ucu (flaş açık) kırmızı kanal ışık dalgasından atım aralığı çıkarılır; kayıt temizliği (DOM yok).
   Sağlık cihazı değildir; yorumlamaz: eşik, etiket ve renk yok, yalnızca ölçer ve kaydeder. Belirsiz ölçümde sayı vermez. */
const PulseLib=(()=>{
  const LIM=[40,200],HZ=30,SKIP_MS=3000,MIN_MS=15000;
  const dayOk=d=>typeof d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&new Date(d+"T00:00Z").toJSON()?.slice(0,10)===d;
  const timeOk=s=>typeof s==="string"&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s);
  const med=a=>{const s=a.slice().sort((x,y)=>x-y),n=s.length;return n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2};
  const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;

  /* Parmak kameraya ve flaşa oturdu mu: kırmızı yüksek ve yeşilden belirgin büyük. */
  const finger=(r,g)=>r>=90&&r/(g+1)>=1.5;

  /* Eşit aralıklı (HZ) örneğe çevirir: kamera kareleri düzensiz gelir. */
  function resample(s){
    const t0=s[0].t,n=Math.floor((s[s.length-1].t-t0)/1000*HZ),out=new Array(n);
    let j=0;
    for(let i=0;i<n;i++){
      const t=t0+i*1000/HZ;
      while(j<s.length-2&&s[j+1].t<t)j++;
      const a=s[j],b=s[j+1],f=b.t>a.t?Math.min(1,Math.max(0,(t-a.t)/(b.t-a.t))):0;
      out[i]=a.r+(b.r-a.r)*f;
    }
    return out;
  }
  /* Ortalama çıkarma (yavaş ışık kayması) ve kısa hareketli ortalama (gürültü). */
  function band(x){
    const n=x.length,pre=[0];for(const v of x)pre.push(pre[pre.length-1]+v);
    const avg=(i,h)=>{const a=Math.max(0,i-h),b=Math.min(n,i+h+1);return (pre[b]-pre[a])/(b-a)};
    const d=x.map((v,i)=>v-avg(i,HZ));
    const pd=[0];for(const v of d)pd.push(pd[pd.length-1]+v);
    return d.map((v,i)=>{const a=Math.max(0,i-2),b=Math.min(n,i+3);return (pd[b]-pd[a])/(b-a)});
  }
  /* Özilinti: 40-200 atım/dk aralığında en güçlü tepe; ama en kısa periyodun gücü ona yakınsa (en az %85) o alınır:
     gerçek periyot T iken 2T de güçlü çıkar ve yarım atım sayısı (oktav hatası) dönerdi. */
  function autocorr(x){
    const n=x.length,m=mean(x),lo=Math.floor(HZ*60/LIM[1]),hi=Math.ceil(HZ*60/LIM[0]);
    const v0=x.reduce((s,a)=>s+(a-m)*(a-m),0);if(!v0)return null;
    const c=[];let best=0;
    for(let lag=lo-1;lag<=hi+1;lag++){
      let s=0;for(let i=0;i+lag<n;i++)s+=(x[i]-m)*(x[i+lag]-m);
      s/=v0*(n-lag)/n;c.push(s);if(lag>=lo&&lag<=hi&&s>best)best=s;
    }
    if(!(best>0))return null;
    for(let lag=lo;lag<=hi;lag++){
      const s=c[lag-lo+1];
      if(s>=0.85*best&&s>=c[lag-lo]&&s>=c[lag-lo+2]){
        const d=c[lag-lo]-2*s+c[lag-lo+2],l=lag+(d?0.5*(c[lag-lo]-c[lag-lo+2])/d:0); // parabolla kesirli örnek: 30 Hz'de tam örnek ±%2,4 sapma verirdi
        return {bpm:60*HZ/l,power:s};
      }
    }
    return null;
  }
  /* samples: [{t ms, r, g}] parmak kesintisiz üzerindeyken toplanan kareler. Sonuç {ok,bpm,n} ya da {ok:false,reason}. */
  function analyze(samples){
    if(!Array.isArray(samples)||samples.length<60)return {ok:false,reason:"short"};
    const t0=samples[0].t,use=samples.filter(s=>s.t-t0>=SKIP_MS);
    if(use.length<60||use[use.length-1].t-use[0].t<MIN_MS-SKIP_MS)return {ok:false,reason:"short"};
    const mr=mean(use.map(s=>s.r)),mg=mean(use.map(s=>s.g)),dg={fps:Math.round(use.length/((use[use.length-1].t-use[0].t)/1000)),r:Math.round(mr),g:Math.round(mg)};
    const fail=(reason,more)=>({ok:false,reason,dg:{...dg,...more}});
    if(!finger(mr,mg))return fail("finger");
    const x=band(resample(use)),n=x.length;
    const sd=Math.sqrt(mean(x.map(v=>v*v)));dg.sd=+sd.toFixed(2);
    if(!(sd>0.05))return fail("flat");
    const minD=Math.floor(HZ*60/LIM[1]),cand=[];
    for(let i=3;i<n-3;i++){let top=true;for(let k=1;k<=3;k++)if(x[i]<=x[i-k]||x[i]<x[i+k]){top=false;break}if(top&&x[i]>0)cand.push(i)}
    cand.sort((a,b)=>x[b]-x[a]);
    const pk=[];for(const i of cand)if(pk.every(p=>Math.abs(p-i)>=minD))pk.push(i);
    pk.sort((a,b)=>a-b);
    /* Örnekleme 30 Hz: tepe konumu parabolle kesirli örneğe inceltilir (yüksek hızda tam örnek yuvarlaması sapma yapar). */
    const pos=pk.map(i=>{const d=x[i-1]-2*x[i]+x[i+1];return i+(d?0.5*(x[i-1]-x[i+1])/d:0)});
    const ibi=[];for(let i=1;i<pos.length;i++)ibi.push((pos[i]-pos[i-1])/HZ);
    const ok0=ibi.filter(v=>v>=60/LIM[1]&&v<=60/LIM[0]);
    dg.pk=pk.length;dg.ibi=ok0.length;
    if(ok0.length<10)return fail("noisy");
    const m=med(ok0),kept=ok0.filter(v=>Math.abs(v-m)<=0.25*m);
    if(kept.length<10||kept.length<0.6*ibi.length)return fail("noisy");
    const sdI=Math.sqrt(mean(kept.map(v=>(v-mean(kept))**2)));
    dg.cv=+(sdI/mean(kept)).toFixed(2);
    if(sdI/mean(kept)>0.15)return fail("noisy");
    const pk0=60/mean(kept),ac=autocorr(x);
    if(ac){dg.ac=+ac.power.toFixed(2);dg.acb=Math.round(ac.bpm)}
    /* Atımlar çok düzenliyse (telefonda ~17 kare/sn'de özilinti gücü 0,2'ye düşebiliyor) güç eşiği 0,15'e iner; özilinti yine atım sayısıyla uyuşmalı. */
    const reg=sdI/mean(kept)<=0.10&&kept.length>=20&&kept.length>=0.85*ibi.length;
    const agree=!!ac&&Math.abs(ac.bpm-pk0)/pk0<=0.12;
    if(!agree||ac.power<(reg?0.15:0.3))return fail("noisy");
    /* Sayı özilintiden: atım noktası ortalaması gürültü tepelerinden yukarı sapıyordu (sentetik denemede özilinti 7 kat az sapma verdi); tepe sayımı yalnız düzen denetimi. */
    const r=Math.round(ac.bpm);
    return r>=LIM[0]&&r<=LIM[1]?{ok:true,bpm:r,n:kept.length+1,dg}:fail("noisy");
  }

  /* Kamera ölçümleri: {day,time,bpm}; geçersizi atar, tarih sırasına koyar, en son 20.000'ü tutar, kimlik verir. */
  function clean(arr){
    const out=[],seen=new Set();
    for(const x of Array.isArray(arr)?arr:[]){
      if(!x||!dayOk(x.day)||!timeOk(x.time)||!Number.isFinite(x.bpm)||x.bpm<LIM[0]||x.bpm>LIM[1])continue;
      const bpm=Math.round(x.bpm),k=x.day+"|"+x.time+"|"+bpm;if(seen.has(k))continue;seen.add(k);
      out.push({day:x.day,time:x.time,bpm});
    }
    out.sort((a,b)=>a.day<b.day?-1:a.day>b.day?1:a.time<b.time?-1:a.time>b.time?1:0);
    return out.slice(-20000).map((x,i)=>({id:i+1,...x}));
  }
  /* Saatten günlük nabız: {day,a ortalama,m en düşük}; günde bir kayıt, en son 400 gün. */
  function cleanHr(arr){
    const m=new Map(),ok=v=>Number.isFinite(v)&&v>=25&&v<=250;
    for(const x of Array.isArray(arr)?arr:[]){
      if(!x||!dayOk(x.day)||!ok(x.a))continue;
      const o={day:x.day,a:Math.round(x.a)};if(ok(x.m))o.m=Math.round(x.m);
      m.set(x.day,o);
    }
    return [...m.values()].sort((a,b)=>a.day<b.day?-1:1).slice(-20000);
  }
  return {LIM,HZ,finger,analyze,clean,cleanHr};
})();
if(typeof module!=="undefined")module.exports=PulseLib;
