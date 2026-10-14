"use strict";
/* Table (CSV) import of weight, blood pressure and glucose. Pure: no DOM, no S. Columns are recognised by header only; what cannot be read is counted and listed, never guessed.
   No cell is interpreted as HTML or a formula; notes are not imported. */
const CsvReadLib=(()=>{
  const IL=typeof ImportLib!=="undefined"?ImportLib:require("../gym/importlib.js");
  const V=typeof VitalsLib!=="undefined"?VitalsLib:require("../vitals/vitalslib.js");
  const A=typeof Algo!=="undefined"?Algo:require("../../kernel/algo.js");
  const MAX_ROWS=5000,LB=0.45359237,MMOL=18.016;
  const fold=h=>String(h).toLowerCase().replace(/ı/g,"i").replace(/ş/g,"s").replace(/ü/g,"u").replace(/ö/g,"o").replace(/ç/g,"c").replace(/ğ/g,"g").replace(/[^a-z0-9]/g,"");
  const ROLE=[["date",/^(tarih|date|gun|day|datetime|tarihsaat)$/],["time",/^(saat|time|hour)$/],["type",/^(tur|type)$/],["value",/^(deger|value)$/],["unit",/^(birim|unit)$/],
    ["sys",/^(sistolik|systolic|sys|sbp|buyuktansiyon)$/],["dia",/^(diyastolik|diastolic|dia|dbp|kucuktansiyon)$/],["pulse",/^(nabiz|pulse|heartrate|hr|bpm)$/],["bp",/^(tansiyon|bloodpressure|bp)$/],
    ["weight",/^(kilo|weight|agirlik)(kg|lb|lbs)?$/],["glu",/^(seker|glucose|glukoz|bloodglucose|kanseker|kansekeri)(mgdl|mmoll|mmol)?$/],["ctx",/^(olcumzamani|baglam|context|seans|session)$/]];
  const NAMES=new Map([...V.CTX,...V.SESSIONS].map(([id,n])=>[fold(n),id]));
  const pad=n=>String(n).padStart(2,"0");
  const local=d=>({day:`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,time:`${pad(d.getHours())}:${pad(d.getMinutes())}`});
  const SL=/^(\d{1,2})([./-])(\d{1,2})\2(\d{4})(?:[ T,]+(\d{1,2}):(\d{2}))?/;
  /* How a day-first or month-first file is told apart: a dot is day-first; a part above 12 settles the rest; equal or both-small parts are ambiguous. */
  function orderOf(cells){
    let dmy=0,mdy=0,amb=0;
    for(const s of cells){const m=SL.exec(s);if(!m)continue;const a=+m[1],b=+m[3];if(m[2]==="."||a>12)dmy++;else if(b>12)mdy++;else if(a!==b)amb++}
    return dmy&&mdy?"mixed":dmy?"dmy":mdy?"mdy":amb?"ask":"dmy";
  }
  /* A date cell -> {day,time?} in the local calendar, or null. Excel serials, 13-digit epoch milliseconds, ISO (with or without a zone) and d.m.y / d/m/y are read. */
  function stamp(s,order){
    s=String(s||"").trim();let m,d;
    if((m=/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?/.exec(s))){
      if(/T.*(Z|[+-]\d{2}:?\d{2})$/.test(s)){d=new Date(s);return isNaN(d)?null:local(d)}
      return {day:`${m[1]}-${m[2]}-${m[3]}`,time:m[4]!=null?`${pad(+m[4])}:${m[5]}`:null};
    }
    if((m=SL.exec(s))){
      const a=+m[1],b=+m[3],dm=m[2]==="."||order!=="mdy",day=`${m[4]}-${pad(dm?b:a)}-${pad(dm?a:b)}`;
      return {day,time:m[5]!=null?`${pad(+m[5])}:${m[6]}`:null};
    }
    if(/^\d{13}$/.test(s))return local(new Date(+s));
    if(/^\d{5}(\.\d+)?$/.test(s)&&+s>=30000&&+s<=60000){
      const t=new Date(Date.UTC(1899,11,30)+Math.round(+s*864e5));
      const day=t.toISOString().slice(0,10),fr=+s%1;
      return {day,time:fr?`${pad(Math.floor(fr*24))}:${pad(Math.floor(fr*1440)%60)}`:null};
    }
    return null;
  }
  const clock=s=>{const m=/^(\d{1,2}):(\d{2})/.exec(String(s||"").trim());return m?`${pad(+m[1])}:${m[2]}`:null};
  const median=a=>{const s=a.slice().sort((x,y)=>x-y);return s[s.length>>1]};
  const r1=x=>Math.round(x*10)/10;
  const unitIn=(h,u)=>{const s=fold(h+" "+u);return /lb|pound/.test(s)?"lb":/mmol/.test(s)?"mmol":/mgdl/.test(s)?"mg":/kg/.test(s)?"kg":null};
  /* text -> {err} | {rows:{w,t,s}, bad:[{line,why}], askDate, askW, askG, noTime}. opt: {today, order:"dmy"|"mdy", wUnit:"kg"|"lb", gUnit:"mg"|"mmol"}. */
  function read(text,opt={}){
    let rows;try{rows=IL.parse(text)}catch(e){return {err:e.user?e.message:"Dosya okunamadı. Tablo (CSV) dosyası olduğundan emin ol."}}
    if(rows.length>MAX_ROWS+1)return {err:`En çok ${MAX_ROWS} satır okunur`};
    const head=rows.shift()||[],idx={},hdr={};
    head.forEach((h,i)=>{const f=fold(h);for(const [r,re] of ROLE)if(idx[r]==null&&re.test(f)){idx[r]=i;hdr[r]=h;break}});
    if(idx.date==null||(idx.type==null&&idx.weight==null&&idx.sys==null&&idx.bp==null&&idx.glu==null))return {err:"Bu dosyayı tanıyamadım. Başlıkta tarih ile birlikte kilo, sistolik ve diyastolik ya da şeker sütunları olmalı."};
    const get=(r,k)=>idx[k]==null?"":String(r[idx[k]]??"").trim();
    const order=orderOf(rows.map(r=>get(r,"date")));
    if(order==="mixed")return {err:"Dosyadaki tarih biçimi karışık (gün/ay ve ay/gün bir arada)."};
    const ord=order==="ask"?opt.order||"dmy":order;
    const today=opt.today||"9999-12-31",bad=[],out={w:[],t:[],s:[]},items=[];
    rows.forEach((r,n)=>{
      const line=n+2,typ=fold(get(r,"type")),kinds=[];
      if(idx.type!=null){
        if(/^(kilo|weight)$/.test(typ))kinds.push("w");else if(/^(tansiyon|bloodpressure|bp)$/.test(typ))kinds.push("t");else if(/^(seker|glucose|glukoz)$/.test(typ))kinds.push("s");else return;
      }else{
        if(get(r,"weight")!=="")kinds.push("w");if(get(r,"sys")!==""||get(r,"bp")!=="")kinds.push("t");if(get(r,"glu")!=="")kinds.push("s");
        if(!kinds.length)return;
      }
      const st=stamp(get(r,"date"),ord);
      if(!st||!A.dayOk(st.day)||st.day<"1990-01-01"||st.day>today){bad.push({line,why:"Tarih okunamadı ya da gelecekte"});return}
      const time=st.time||clock(get(r,"time")),ctx=NAMES.get(fold(get(r,"ctx")));
      for(const k of kinds)items.push({k,line,day:st.day,time,r,ctx});
    });
    const num=(it,c)=>IL.num(get(it.r,c));
    const wRaw=items.filter(i=>i.k==="w").map(i=>num(i,idx.type!=null?"value":"weight")).filter(v=>v!=null&&v>0);
    const gRaw=items.filter(i=>i.k==="s").map(i=>num(i,idx.type!=null&&idx.glu==null?"value":"glu")).filter(v=>v!=null&&v>0);
    const wHead=unitIn(hdr.weight||"",""),gHead=unitIn(hdr.glu||"","");
    const wStated=wHead||(idx.unit!=null&&items.some(i=>i.k==="w"&&unitIn("",get(i.r,"unit"))))||opt.wUnit;
    const askW=!wStated&&wRaw.length>0&&wRaw.every(v=>v>120)&&median(wRaw)<400;
    const gm=gRaw.length?median(gRaw):0,gStated=gHead||(idx.unit!=null&&items.some(i=>i.k==="s"&&unitIn("",get(i.r,"unit"))))||opt.gUnit;
    const askG=!gStated&&gRaw.length>0&&gm>=20&&gm<=35;
    let noTime=0;
    for(const it of items){
      const {k,line,day,r}=it;let time=it.time;
      if(k==="w"){
        const v=num(it,idx.type!=null?"value":"weight"),u=unitIn(hdr.weight||"",idx.unit!=null?get(r,"unit"):"")||opt.wUnit||"kg",kg=v==null?null:r1(u==="lb"?v*LB:v);
        if(kg==null||kg<20||kg>400){bad.push({line,why:"Kilo 20-400 kg arasında olmalı"});continue}
        out.w.push({day,v:kg});continue;
      }
      if(!time){time="12:00";noTime++}
      if(k==="t"){
        let sys,dia;const bp=/^(\d{2,3})\s*[/-]\s*(\d{2,3})$/.exec(get(r,"bp"));
        if(bp){sys=+bp[1];dia=+bp[2]}else{sys=num(it,"sys");dia=num(it,"dia")}
        const p=num(it,"pulse"),c=V.check({k:"t",day,time,sys,dia,pulse:p==null?undefined:p,session:it.ctx});
        if(!c.row){bad.push({line,why:c.err==="date"?"Tarih ya da saat okunamadı":c.err});continue}
        out.t.push(c.row);continue;
      }
      const v=num(it,idx.type!=null&&idx.glu==null?"value":"glu"),u=gStated?(unitIn(hdr.glu||"",idx.unit!=null?get(r,"unit"):"")||opt.gUnit):(gm<20?"mmol":"mg"),g=v==null?null:r1(u==="mmol"?v*MMOL:v);
      const c=V.check({k:"s",day,time,g,ctx:it.ctx});
      if(!c.row){bad.push({line,why:c.err==="glucose"?"Şeker 20-800 mg/dL arasında olmalı":"Tarih ya da saat okunamadı"});continue}
      out.s.push(c.row);
    }
    return {rows:out,bad,askDate:order==="ask",askW,askG,noTime,order:ord};
  }
  /* ex: {wDays:Set of days with a weight, t:Set of "day|time|sys|dia", s:[{day,time,g}]}. A day that already has a weight keeps its own; glucose matches within 1 mg/dL. */
  function plan(res,ex){
    const wd=new Set(ex.wDays),td=new Set(ex.t),sd=new Map(),add={w:[],t:[],s:[]};let dup=0;
    for(const x of ex.s){if(!sd.has(x.day))sd.set(x.day,[]);sd.get(x.day).push(x)}
    for(const r of res.rows.w){if(wd.has(r.day)){dup++;continue}wd.add(r.day);add.w.push(r)}
    for(const r of res.rows.t){const k=[r.day,r.time,r.sys,r.dia].join("|");if(td.has(k)){dup++;continue}td.add(k);add.t.push(r)}
    for(const r of res.rows.s){
      const l=sd.get(r.day)||[];if(l.some(x=>x.time===r.time&&Math.abs(x.g-r.g)<=1)){dup++;continue}
      l.push(r);sd.set(r.day,l);add.s.push(r);
    }
    return {add,dup,total:add.w.length+add.t.length+add.s.length};
  }
  return {read,plan,stamp,MAX_ROWS};
})();
if(typeof module!=="undefined")module.exports=CsvReadLib;
