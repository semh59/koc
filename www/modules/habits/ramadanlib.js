"use strict";
/* Ramadan mode: imsak and iftar from the Diyanet table (an internet copy, cached on the phone), the countdown, and the reminder times (pure, no DOM, no S).
   Times are Turkish local time (UTC+3 all year), so the day and the clock are computed from UTC+3, not from the phone's time zone.
   It is a clock, not a ruling: no text here says a time is "the" imsak or iftar. */
const RamadanLib=(()=>{
  const A=typeof Algo!=="undefined"?Algo:require("../../kernel/algo.js"),{dayOk,timeOk}=A;
  const TR_MS=3*36e5,KEEP_DAYS=45;
  const p2=n=>String(n).padStart(2,"0");
  const mins=t=>+t.slice(0,2)*60+ +t.slice(3,5);
  /* ms -> {day:"YYYY-MM-DD", min:minutes since midnight} in UTC+3. */
  const tr=ms=>{const d=new Date(ms+TR_MS);return {day:`${d.getUTCFullYear()}-${p2(d.getUTCMonth()+1)}-${p2(d.getUTCDate())}`,min:d.getUTCHours()*60+d.getUTCMinutes()}};
  const addDay=(k,n)=>{const d=new Date(Date.parse(k+"T00:00:00Z")+n*864e5);return d.toISOString().slice(0,10)};
  /* The table the service returns -> {day:[imsak,iftar]}; rows with a bad date or time are dropped. */
  function parse(arr){
    const out={};
    for(const x of Array.isArray(arr)?arr:[]){
      const day=x&&typeof x.MiladiTarihUzunIso8601==="string"?x.MiladiTarihUzunIso8601.slice(0,10):"";
      if(dayOk(day)&&timeOk(x.Imsak)&&timeOk(x.Aksam)&&mins(x.Aksam)>mins(x.Imsak))out[day]=[x.Imsak,x.Aksam];
    }
    return out;
  }
  /* Cache {id, at, days}: valid only for the chosen place; old days are dropped. */
  function merge(cache,id,days,nowMs){
    const from=addDay(tr(nowMs).day,-1),keep={};
    for(const [d,v] of Object.entries(cache&&cache.id===id?cache.days:{}))if(d>=from)keep[d]=v;
    for(const [d,v] of Object.entries(days))if(d>=from)keep[d]=v;
    const ks=Object.keys(keep).sort().slice(0,KEEP_DAYS),o={};for(const k of ks)o[k]=keep[k];
    return {id,at:nowMs,days:o};
  }
  function clean(c){
    if(!c||typeof c!=="object"||!Number.isInteger(c.id)||!c.days||typeof c.days!=="object")return null;
    const days={};for(const [d,v] of Object.entries(c.days))if(dayOk(d)&&Array.isArray(v)&&timeOk(v[0])&&timeOk(v[1]))days[d]=[v[0],v[1]];
    return {id:c.id,at:Number.isFinite(c.at)?c.at:0,days};
  }
  /* Days from today on that the cache covers (0 = no table for today). */
  function ahead(cache,nowMs){
    if(!cache)return 0;let n=0,d=tr(nowMs).day;while(cache.days[d]){n++;d=addDay(d,1)}return n;
  }
  const dur=m=>{const h=Math.floor(m/60),r=m%60;return h?`${h} sa${r?` ${r} dk`:""}`:`${r} dk`};
  /* What the Today card says: {kind:"iftar"|"sahur", left (min), text, imsak, iftar, long} or null without a table for today. */
  function now(cache,nowMs){
    if(!cache)return null;
    const t=tr(nowMs),d=cache.days[t.day];if(!d)return null;
    const im=mins(d[0]),ft=mins(d[1]),long=ft-im>16*60;
    let kind,left;
    if(t.min<im){kind="sahur";left=im-t.min}
    else if(t.min<ft){kind="iftar";left=ft-t.min}
    else{
      const n=cache.days[addDay(t.day,1)];
      if(!n)return {kind:"night",imsak:d[0],iftar:d[1],long,text:"Yarının saatleri henüz yok"};
      kind="sahur";left=1440-t.min+mins(n[0]);
    }
    return {kind,left,imsak:d[0],iftar:d[1],long,text:`${kind==="iftar"?"İftara":"Sahura"} ${dur(Math.max(1,left))}`};
  }
  /* One-shot reminders for the days in the cache: sahur 45 minutes before imsak, iftar 5 minutes before. opt: {sahur, iftar} booleans, lead: minimum ms ahead, days: how far. */
  function reminders(cache,opt,nowMs,lead,days){
    const out=[];if(!cache)return out;
    const t0=tr(nowMs).day;
    for(let i=0;i<days;i++){
      const day=addDay(t0,i),d=cache.days[day];if(!d)continue;
      const at=m=>Date.parse(day+"T00:00:00Z")+m*6e4-TR_MS;
      if(opt.sahur&&at(mins(d[0])-45)>nowMs+lead)out.push({id:7000000+i*2,at:at(mins(d[0])-45),title:"Sahur",body:"Diyanet tablosuna göre imsaka yaklaşık 45 dakika var."});
      if(opt.iftar&&at(mins(d[1])-5)>nowMs+lead)out.push({id:7000001+i*2,at:at(mins(d[1])-5),title:"İftar",body:"Diyanet tablosuna göre iftara yaklaşık 5 dakika var."});
    }
    return out;
  }
  return {parse,merge,clean,ahead,now,reminders,dur,tr,addDay};
})();
if(typeof module!=="undefined")module.exports=RamadanLib;
