"use strict";
/* Otomatik algılanan yürüyüş/koşu aralıkları: doğrulama ve özet (DOM yok). Aralıkları yerel taraf hesaplar, burada yalnızca saklanır. */
const MotionLib=(()=>{
  const MAX=400,p2=n=>String(n).padStart(2,"0");
  const dayOf=ms=>{const d=new Date(ms);return `${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`};
  const hmOf=ms=>{const d=new Date(ms);return `${p2(d.getHours())}:${p2(d.getMinutes())}`};
  const num=(v,lo,hi)=>typeof v==="number"&&isFinite(v)&&v>=lo&&v<=hi;
  const dayOk=d=>typeof d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d);
  const timeOk=t=>typeof t==="string"&&/^([01]\d|2[0-3]):[0-5]\d$/.test(t);

  /* Yerel taraftan gelen kayıt → saklanan kayıt. Geçersizse null. */
  function fromNative(it,now){
    if(!it||!num(it.t0,1,now+6e4)||!num(it.t1,1,now+6e4)||it.t1<=it.t0||it.t1-it.t0>4*3600*1000)return null;
    if(it.k!=="w"&&it.k!=="r")return null;
    if(!num(it.steps,150,60000)||!num(it.km,0,100)||!num(it.kmh,0,25))return null;
    return {day:dayOf(it.t0),t0:hmOf(it.t0),min:Math.max(1,Math.round((it.t1-it.t0)/60000)),k:it.k,steps:Math.round(it.steps),km:Math.round(it.km*100)/100,kmh:Math.round(it.kmh*10)/10,kcal:num(it.kcal,0,5000)?Math.round(it.kcal):null,gps:it.gps===true};
  }

  function clean(raw){
    const out=[],seen=new Set();
    for(const x of Array.isArray(raw)?raw:[]){
      if(!x||!dayOk(x.day)||!timeOk(x.t0)||(x.k!=="w"&&x.k!=="r")||!num(x.min,1,240)||!num(x.steps,150,60000)||!num(x.km,0,100)||!num(x.kmh,0,25))continue;
      const key=x.day+x.t0+x.k;if(seen.has(key))continue;seen.add(key);
      out.push({day:x.day,t0:x.t0,min:Math.round(x.min),k:x.k,steps:Math.round(x.steps),km:x.km,kmh:x.kmh,kcal:num(x.kcal,0,5000)?Math.round(x.kcal):null,gps:x.gps===true});
    }
    out.sort((a,b)=>a.day<b.day?-1:a.day>b.day?1:a.t0<b.t0?-1:a.t0>b.t0?1:0);
    return out.slice(-MAX);
  }

  /* Yeni kayıtları ekler (aynı gün+saat+tür tekrar eklenmez), eklenen sayısını döndürür. */
  function ingest(moves,items,now){
    let n=0;const seen=new Set(moves.map(m=>m.day+m.t0+m.k));
    for(const it of items){
      const m=fromNative(it,now);if(!m)continue;
      const key=m.day+m.t0+m.k;if(seen.has(key))continue;seen.add(key);moves.push(m);n++;
    }
    if(n){const c=clean(moves);moves.length=0;moves.push(...c)}
    return n;
  }

  function totals(list){
    const t={min:0,km:0,steps:0,kcal:0,kcalN:0};
    for(const m of list){t.min+=m.min;t.km+=m.km;t.steps+=m.steps;if(m.kcal!=null){t.kcal+=m.kcal;t.kcalN++}}
    return t;
  }
  return {fromNative,clean,ingest,totals,dayOf,hmOf};
})();
if(typeof module!=="undefined")module.exports=MotionLib;
