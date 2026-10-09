"use strict";
/* Döngü kaydı: doğrulama, temizlik ve tahmin (DOM yok). Veri yalnız cihazda kalır; Koç'a, bildirim gövdesine ve widget'a girmez.
   Tahmin geçmiş dönem başlangıçlarının ortalamasıdır; yumurtlama ve doğurgan pencere yalnız bilgi amaçlı takvim yöntemidir, korunma ya da gebelik aracı değildir. */
const CycleLib=(()=>{
  const FLOW=[["h","Hafif"],["o","Orta"],["y","Yoğun"]],SYM=[["k","Kramp"],["b","Baş ağrısı"],["r","Ruh hali"]];
  const MAXROWS=80,MAXLEN=14,KEEP_DAYS=5*366,NID=9200,LEAD=2;
  const dayOk=d=>typeof d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&new Date(d+"T00:00Z").toJSON()?.slice(0,10)===d;
  const dayN=k=>Date.UTC(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10))/864e5;
  const addDays=(k,n)=>new Date((dayN(k)+n)*864e5).toJSON().slice(0,10);
  const diff=(a,b)=>dayN(a)-dayN(b);

  /* Bir kaydı doğrular: {row} ya da {err}. Başlangıç bugünden ileri olamaz; bitiş başlangıçtan önce, bugünden sonra ya da 14 günden uzun olamaz. */
  function check(x,today){
    if(!x||!dayOk(x.s)||!dayOk(today))return {err:"Başlangıç gününü seç"};
    if(x.s>today)return {err:"Başlangıç bugünden ileri olamaz"};
    if(diff(today,x.s)>KEEP_DAYS)return {err:"Kayıt 5 yıldan eski"};
    const o={s:x.s};
    if(x.e!=null&&x.e!==""){
      if(!dayOk(x.e)||x.e<x.s)return {err:"Bitiş, başlangıçtan önce olamaz"};
      if(x.e>today)return {err:"Bitiş bugünden ileri olamaz"};
      if(diff(x.e,x.s)>=MAXLEN)return {err:"Dönem en çok 14 gün sürebilir"};
      o.e=x.e;
    }
    if(FLOW.some(f=>f[0]===x.flow))o.flow=x.flow;
    const sy=SYM.map(s=>s[0]).filter(k=>Array.isArray(x.sym)&&x.sym.includes(k));
    if(sy.length)o.sym=sy;
    if(typeof x.not==="string"&&x.not.trim())o.not=x.not.trim().slice(0,80);
    return {row:o};
  }
  const last=r=>r.e||r.s;
  /* Önceki kayıtla çakışan (başlangıç önceki kaydın bitişinden önce ya da ona eşit) satır atılır. */
  function clean(arr,today){
    const out=[];
    for(const x of (Array.isArray(arr)?arr:[]).slice(-400).slice().sort((a,b)=>String(a&&a.s)<String(b&&b.s)?-1:1)){
      const c=check(x,today);if(!c.row)continue;
      if(out.length&&c.row.s<=last(out[out.length-1]))continue;
      out.push(c.row);
    }
    return out.slice(-MAXROWS).map((r,i)=>({id:i+1,...r}));
  }
  /* Yeni kaydı mevcut listeye eklemeden önce çakışma denetimi. */
  const overlap=(rows,row)=>rows.some(r=>row.s<=last(r)&&(row.e||row.s)>=r.s);

  /* Ardışık başlangıçlar arası gün sayıları; 15-60 dışı (atlanmış kayıt) ortalamaya girmez. Son 6 döngü. */
  function lengths(rows){
    const s=rows.map(r=>r.s).sort(),L=[];
    for(let i=1;i<s.length;i++){const d=diff(s[i],s[i-1]);if(d>=15&&d<=60)L.push(d)}
    return L.slice(-6);
  }
  /* Tahmin: {ok:false} ya da {ok:true,mean,sd,n,from,to,irregular}. En az 2 döngü uzunluğu gerekir. */
  function predict(rows){
    const L=lengths(rows);
    if(L.length<2||!rows.length)return {ok:false,n:L.length};
    const mean=L.reduce((a,b)=>a+b,0)/L.length,sd=Math.sqrt(L.reduce((a,b)=>a+(b-mean)**2,0)/L.length);
    const w=Math.max(2,Math.ceil(sd)),st=rows.map(r=>r.s).sort().pop(),m=Math.round(mean);
    return {ok:true,n:L.length,mean:Math.round(mean*10)/10,sd:Math.round(sd*10)/10,from:addDays(st,m-w),to:addDays(st,m+w),irregular:sd>=5||Math.max(...L)-Math.min(...L)>=10};
  }
  /* Takvim yöntemi: yumurtlama sonraki başlangıçtan 14 gün önce, pencere yumurtlamadan 5 gün önce - 1 gün sonra.
     Tahmin yoksa null; düzensiz döngüde {irregular:true} (tarih verilmez). */
  function fertile(p,today){
    if(!p||!p.ok)return null;
    if(p.irregular)return {irregular:true};
    let ov=addDays(p.from,diff(p.to,p.from)/2-14);
    while(addDays(ov,1)<today)ov=addDays(ov,Math.round(p.mean));
    return {ov,from:addDays(ov,-5),to:addDays(ov,1)};
  }
  /* Bu dönemin kaçıncı günü: bitişi girilmemiş son kayıt ve 14 günden yeni ise; yoksa null. */
  function dayOfPeriod(rows,today){
    const r=rows.length?rows[rows.length-1]:null;
    if(!r||r.e||r.s>today)return null;
    const n=diff(today,r.s)+1;return n<=MAXLEN?n:null;
  }
  /* Hatırlatma günü: tahmin aralığının LEAD gün öncesi; bugün ya da sonra, `win` gün içinde. */
  function remindDay(p,today,win){
    if(!p.ok)return null;
    const d=addDays(p.from,-LEAD);
    return d>=today&&diff(d,today)<win?d:null;
  }
  return {FLOW,SYM,MAXROWS,MAXLEN,NID,LEAD,dayOk,dayN,addDays,diff,check,clean,overlap,lengths,predict,fertile,dayOfPeriod,remindDay};
})();
if(typeof module!=="undefined")module.exports=CycleLib;
