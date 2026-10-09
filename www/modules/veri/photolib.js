"use strict";
/* İlerleme fotoğrafı: boyut hesabı, sınır, sıralama ve karşılaştırma farkı (DOM yok). Fotoğraflar localStorage'a, yedeğe, Koç'a ya da paylaşıma girmez. */
const PhotoLib=(()=>{
  const MAX=24,LONG=900,THUMB=160,QUALITY=0.75;
  /* En uzun kenar long px'e iner, küçük görüntü büyütülmez; geçersiz boyut null. */
  function fit(w,h,long=LONG){
    if(!(w>0&&h>0))return null;
    const s=Math.min(1,long/Math.max(w,h));
    return {w:Math.max(1,Math.round(w*s)),h:Math.max(1,Math.round(h*s))};
  }
  const canAdd=n=>n<MAX;
  /* Kilo etiketi isteğe bağlı: boş null, kg cinsinden 20-400 değilse undefined (geçersiz). */
  const kgLabel=v=>v==null?null:typeof v==="number"&&v>=20&&v<=400?Math.round(v*1000)/1000:undefined;
  const order=list=>list.slice().sort((a,b)=>a.day<b.day?-1:a.day>b.day?1:a.t-b.t);
  const dn=k=>Date.UTC(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10))/864e5;
  /* a eski, b yeni: gün farkı ve (ikisinde de etiket varsa) kg farkı. */
  const gap=(a,b)=>({days:dn(b.day)-dn(a.day),kg:a.kg!=null&&b.kg!=null?Math.round((b.kg-a.kg)*1000)/1000:null});
  return {MAX,LONG,THUMB,QUALITY,fit,canAdd,kgLabel,order,gap};
})();
if(typeof module!=="undefined")module.exports=PhotoLib;
