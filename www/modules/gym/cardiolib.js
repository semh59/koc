"use strict";
/* Ayrı kardiyo kaydı: tür, doğrulama, tempo/hız, MET ve haftalık özet (DOM yok).
   Kayıt sıradan bir spor kaydıdır (type "spor", text = tür adı, v = dk, km, kcal) ve ck/cn alanlarını taşır; böylece haftalık spor dakikasına,
   hareket kalorisine ve Algo.exerciseKcal'ın otomatik yürüyüş/koşu çakışma korumasına aynen girer, ikinci bir toplam oluşmaz. */
const CardioLib=(()=>{
  /* [kod, ad, MET (mesafe yoksa), en yüksek makul hız km/sa] */
  const KINDS=[["run","Koşu",8.3,25],["walk","Yürüyüş",3.5,9],["bike","Bisiklet",6.8,60],["swim","Yüzme",6,6],["elliptical","Eliptik",5,20]];
  const kind=c=>KINDS.find(k=>k[0]===c);
  /* Algo.moveSummary ile aynı Compendium noktaları (km/sa -> MET). */
  const WK=[3.2,4,4.8,5.6,6.4,7.2,8],WM=[2.8,3,3.5,4.3,5,7,8.3],RK=[8,9.7,11.3,12.9,14.5,16.1],RM=[8.3,9.8,11,11.8,12.8,14.5];
  const interp=(x,y,v)=>{if(v<=x[0])return y[0];for(let i=1;i<x.length;i++)if(v<=x[i])return y[i-1]+(y[i]-y[i-1])*(v-x[i-1])/(x[i]-x[i-1]);return y[y.length-1]};
  const met=(c,kmh)=>c==="run"&&kmh?interp(RK,RM,kmh):c==="walk"&&kmh?(kmh>8?interp(RK,RM,kmh):interp(WK,WM,kmh)):kind(c)[2];
  /* Süre dk (1-600, tam sayı), mesafe km (yok ya da 0,1-100). Türün makul hızını aşan süre/mesafe çifti yazım hatası sayılır. */
  function check({kind:c,min,km}){
    const k=kind(c);
    if(!k)return {err:"Tür seç"};
    if(!(Number.isInteger(min)&&min>=1&&min<=600))return {err:"Süreyi dakika olarak yaz (1-600), örneğin 40"};
    if(km==null||km===0)return {name:k[1],min,km:0,kmh:null};
    if(!(km>=0.1&&km<=100))return {err:"Mesafeyi km olarak yaz (0,1-100), örneğin 5,2; yoksa boş bırak"};
    const kmh=km*60/min;
    if(kmh>k[3])return {err:`${k[1]} için ${String(Math.round(kmh*10)/10).replace(".",",")} km/sa olağan dışı; süreyi ve mesafeyi kontrol et`};
    return {name:k[1],min,km:Math.round(km*100)/100,kmh};
  }
  const mmss=m=>{const s=Math.round(m*60);return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`};
  /* Koşu ve yürüyüşte dk/km, yüzmede dk/100 m, bisiklet ve eliptikte km/sa; mesafe yoksa null. */
  function pace(c,min,km){
    if(!(km>0&&min>0))return null;
    if(c==="run"||c==="walk")return `${mmss(min/km)} dk/km`;
    if(c==="swim")return `${mmss(min/(km*10))} dk/100 m`;
    return `${String(Math.round(km*60/min*10)/10).replace(".",",")} km/sa`;
  }
  const isCardio=e=>e&&e.type==="exercise"&&!!kind(e.ck);
  /* Son 7 gün (bugün dahil): toplam ve türe göre. */
  function week(entries,from,to){
    const L=entries.filter(e=>isCardio(e)&&e.day>=from&&e.day<=to),tot={n:L.length,min:0,km:0,kcal:0},by={};
    for(const e of L){
      const b=by[e.ck]||(by[e.ck]={n:0,min:0,km:0});
      b.n++;b.min+=e.v;b.km+=e.km||0;tot.min+=e.v;tot.km+=e.km||0;tot.kcal+=e.kcal||0;
    }
    tot.km=Math.round(tot.km*10)/10;
    return {tot,by};
  }
  return {KINDS,kind,met,check,pace,isCardio,week};
})();
if(typeof module!=="undefined")module.exports=CardioLib;
