"use strict";
/* Ramadan mode: imsak and iftar calculated on the phone from the place, compared with the Diyanet table from the internet, the countdown and the reminder times (pure, no DOM, no S).
   Times are Turkish local time (UTC+3 all year), so the day and the clock are computed from UTC+3, not from the phone's time zone.
   The calculation is a sun-position formula with constants fitted to the Diyanet table (see scripts/ramadan.test.js); it is shown as "verified" only after a comparison
   with the table of the nearest provincial centre agreed within TOL minutes. It is a clock, not a ruling: no text here says a time is "the" imsak or iftar. */
const RamadanLib=(()=>{
  const A=typeof Algo!=="undefined"?Algo:require("../../kernel/algo.js"),{dayOk,timeOk}=A;
  const CITIES=typeof RAM_CITIES!=="undefined"?RAM_CITIES:require("./ramcities.js");
  const TR_MS=3*36e5,TOL=2,FRESH_DAYS=45;
  const ANGLE=18.3,HORIZON=0.75,IM_OFF=1.17,IF_OFF=8.19; // imsak at 18.3 deg below the horizon, sunset at -0.75 deg, iftar = sunset + 8.19 min (fitted to 81 provinces, 2026-10)
  const p2=n=>String(n).padStart(2,"0");
  const mins=t=>+t.slice(0,2)*60+ +t.slice(3,5);
  const hm=m=>`${p2(Math.floor(m/60))}:${p2(m%60)}`;
  const rad=d=>d*Math.PI/180,deg=r=>r*180/Math.PI;
  /* ms -> {day:"YYYY-MM-DD", min:minutes since midnight} in UTC+3. */
  const tr=ms=>{const d=new Date(ms+TR_MS);return {day:`${d.getUTCFullYear()}-${p2(d.getUTCMonth()+1)}-${p2(d.getUTCDate())}`,min:d.getUTCHours()*60+d.getUTCMinutes()}};
  const addDay=(k,n)=>{const d=new Date(Date.parse(k+"T00:00:00Z")+n*864e5);return d.toISOString().slice(0,10)};
  /* Low-precision solar position (NOAA formulas): minutes after midnight, UTC+3, of imsak and sunset. */
  function sun(day,lat,lon){
    const [y,m,d]=day.split("-").map(Number),jd=Date.UTC(y,m-1,d,12)/864e5+2440587.5,T=(jd-2451545)/36525;
    const L0=(280.46646+T*(36000.76983+T*0.0003032))%360,M=357.52911+T*(35999.05029-0.0001537*T),e=0.016708634-T*(0.000042037+0.0000001267*T);
    const C=Math.sin(rad(M))*(1.914602-T*(0.004817+0.000014*T))+Math.sin(rad(2*M))*(0.019993-0.000101*T)+Math.sin(rad(3*M))*0.000289;
    const om=125.04-1934.136*T,lam=L0+C-0.00569-0.00478*Math.sin(rad(om));
    const eps=23+(26+(21.448-T*(46.815+T*(0.00059-T*0.001813)))/60)/60+0.00256*Math.cos(rad(om));
    const dec=deg(Math.asin(Math.sin(rad(eps))*Math.sin(rad(lam)))),yy=Math.tan(rad(eps/2))**2;
    const eq=4*deg(yy*Math.sin(2*rad(L0))-2*e*Math.sin(rad(M))+4*e*yy*Math.sin(rad(M))*Math.cos(2*rad(L0))-0.5*yy*yy*Math.sin(4*rad(L0))-1.25*e*e*Math.sin(2*rad(M)));
    const noon=720-4*lon-eq+180,H=a=>deg(Math.acos((Math.sin(rad(-a))-Math.sin(rad(lat))*Math.sin(rad(dec)))/(Math.cos(rad(lat))*Math.cos(rad(dec)))));
    return {imsak:noon-4*H(ANGLE),sunset:noon+4*H(HORIZON)};
  }
  const inTurkey=(lat,lon)=>Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=35.5&&lat<=42.5&&lon>=25.5&&lon<=45;
  /* [imsak, iftar] as "HH:MM" for a day and place, or null (outside Turkey, polar, nonsense). */
  function times(day,lat,lon){
    if(!dayOk(day)||!inTurkey(lat,lon))return null;
    const r=sun(day,lat,lon),im=Math.round(r.imsak+IM_OFF),ft=Math.round(r.sunset+IF_OFF);
    return Number.isFinite(im)&&Number.isFinite(ft)&&im>0&&ft>im&&ft<1440?[hm(im),hm(ft)]:null;
  }
  /* Nearest provincial centre: {i, km}. */
  function nearest(lat,lon){
    let best={i:-1,km:Infinity};
    CITIES.forEach(([,a,o],i)=>{
      const dy=(a-lat)*111.2,dx=(o-lon)*111.2*Math.cos(rad((a+lat)/2)),km=Math.hypot(dx,dy);
      if(km<best.km)best={i,km};
    });
    return best;
  }
  /* The table the service returns -> {day:[imsak,iftar]}; rows with a bad date or time are dropped. */
  function parse(arr){
    const out={};
    for(const x of Array.isArray(arr)?arr:[]){
      const day=x&&typeof x.MiladiTarihUzunIso8601==="string"?x.MiladiTarihUzunIso8601.slice(0,10):"";
      if(dayOk(day)&&timeOk(x.Imsak)&&timeOk(x.Aksam)&&mins(x.Aksam)>mins(x.Imsak))out[day]=[x.Imsak,x.Aksam];
    }
    return out;
  }
  /* Compares the calculation at the centre of province i with that province's table: the verification record {il, at, max (largest minute difference), n (days compared), days}. null without a usable comparison. */
  function verify(i,days,nowMs){
    const c=CITIES[i];if(!c)return null;
    let max=0,n=0;
    for(const [d,v] of Object.entries(days)){
      const t=times(d,c[1],c[2]);if(!t)continue;
      max=Math.max(max,Math.abs(mins(t[0])-mins(v[0])),Math.abs(mins(t[1])-mins(v[1])));n++;
    }
    return n>=5?{il:i,at:nowMs,max,n,days}:null;
  }
  function clean(c){
    if(!c||typeof c!=="object"||!Number.isInteger(c.il)||!CITIES[c.il]||!Number.isFinite(c.max)||!c.days||typeof c.days!=="object")return null;
    const days={};for(const [d,v] of Object.entries(c.days))if(dayOk(d)&&Array.isArray(v)&&timeOk(v[0])&&timeOk(v[1]))days[d]=[v[0],v[1]];
    return {il:c.il,at:Number.isFinite(c.at)?c.at:0,max:c.max,n:Number.isFinite(c.n)?c.n:0,days};
  }
  /* Where the times come from. loc {lat,lon}, cache = a verification record or null.
     "verified": calculated for the exact place, and the table of the nearest centre agreed within TOL minutes recently;
     "table": the calculation disagreed with the table, so the table's own days are used (no other days);
     "calc": calculated, not (or no longer) compared with the table. Returns {mode, get(day), max, at, il}. */
  function source(loc,cache,nowMs){
    const own=day=>times(day,loc.lat,loc.lon),near=nearest(loc.lat,loc.lon);
    const fresh=cache&&cache.il===near.i&&nowMs-cache.at<=FRESH_DAYS*864e5;
    if(fresh&&cache.max<=TOL)return {mode:"verified",get:own,max:cache.max,at:cache.at,il:near.i};
    if(fresh)return {mode:"table",get:day=>cache.days[day]||null,max:cache.max,at:cache.at,il:near.i};
    return {mode:"calc",get:own,max:null,at:0,il:near.i};
  }
  const dur=m=>{const h=Math.floor(m/60),r=m%60;return h?`${h} sa${r?` ${r} dk`:""}`:`${r} dk`};
  /* What the Today card says: {kind:"iftar"|"sahur"|"night", left (min), text, imsak, iftar, long} or null without times for today. */
  function now(get,nowMs){
    const t=tr(nowMs),d=get(t.day);if(!d)return null;
    const im=mins(d[0]),ft=mins(d[1]),long=ft-im>16*60;
    let kind,left;
    if(t.min<im){kind="sahur";left=im-t.min}
    else if(t.min<ft){kind="iftar";left=ft-t.min}
    else{
      const n=get(addDay(t.day,1));
      if(!n)return {kind:"night",imsak:d[0],iftar:d[1],long,text:"Yarının saatleri yok"};
      kind="sahur";left=1440-t.min+mins(n[0]);
    }
    return {kind,left,imsak:d[0],iftar:d[1],long,text:`${kind==="iftar"?"İftara":"Sahura"} ${dur(Math.max(1,left))}`};
  }
  /* One-shot reminders: sahur 45 minutes before imsak, iftar 5 minutes before. opt: {sahur, iftar}, lead: minimum ms ahead, days: how far. */
  function reminders(get,opt,nowMs,lead,days){
    const out=[],t0=tr(nowMs).day;
    for(let i=0;i<days;i++){
      const day=addDay(t0,i),d=get(day);if(!d)continue;
      const at=m=>Date.parse(day+"T00:00:00Z")+m*6e4-TR_MS;
      if(opt.sahur&&at(mins(d[0])-45)>nowMs+lead)out.push({id:7000000+i*2,at:at(mins(d[0])-45),title:"Sahur",body:"Hesaplanan imsaka yaklaşık 45 dakika var."});
      if(opt.iftar&&at(mins(d[1])-5)>nowMs+lead)out.push({id:7000001+i*2,at:at(mins(d[1])-5),title:"İftar",body:"Hesaplanan iftara yaklaşık 5 dakika var."});
    }
    return out;
  }
  return {times,nearest,inTurkey,parse,verify,clean,source,now,reminders,dur,tr,addDay,CITIES,TOL};
})();
if(typeof module!=="undefined")module.exports=RamadanLib;
