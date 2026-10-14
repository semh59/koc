"use strict";
/* Cycle log: validation, cleaning and prediction (no DOM). The data stays on the device; it never reaches the Coach, a notification body or the widget.
   The prediction is the average of past period starts; ovulation and the fertile window are an information-only calendar method, not a contraception or pregnancy tool. */
const CycleLib=(()=>{
  const {dayOk,dayNum,fdate}=typeof Algo!=="undefined"?Algo:require("../../kernel/algo.js");
  const FLOW=[["light","Hafif"],["medium","Orta"],["heavy","Yoğun"]],SYM=[["cramp","Kramp"],["headache","Baş ağrısı"],["mood","Ruh hali"]];
  const MAX_ROWS=80,MAXLEN=14,KEEP_DAYS=5*366,NID=9200,LEAD=2,NOTE_MAX=80,CYCLE_DAYS=[15,60],LAST_CYCLES=6,LUTEAL=14;
  const addDays=(k,n)=>new Date((dayNum(k)+n)*864e5).toJSON().slice(0,10);
  const diff=(a,b)=>dayNum(a)-dayNum(b);

  /* Validates one record: {row} or {err}. The start cannot be after today; the end cannot be before the start, after today or MAXLEN days or more away. */
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
    if(typeof x.note==="string"&&x.note.trim())o.note=x.note.trim().slice(0,NOTE_MAX);
    return {row:o};
  }
  const last=r=>r.e||r.s;
  /* A row that overlaps the previous one (start not after the previous end) is dropped; the newest MAX_ROWS are kept. */
  function clean(arr,today){
    const out=[];
    for(const x of (Array.isArray(arr)?arr:[]).slice().sort((a,b)=>String(a?.s)<String(b?.s)?-1:1)){
      const c=check(x,today);if(!c.row)continue;
      if(out.length&&c.row.s<=last(out[out.length-1]))continue;
      out.push(c.row);
    }
    return out.slice(-MAX_ROWS).map((r,i)=>({id:i+1,...r}));
  }
  /* Overlap check before a new row is added to the list. */
  const overlap=(rows,row)=>rows.some(r=>row.s<=last(r)&&last(row)>=r.s);

  /* Day counts between consecutive starts; those outside CYCLE_DAYS (a skipped record) stay out of the average. The last LAST_CYCLES cycles. */
  function lengths(rows){
    const s=rows.map(r=>r.s).sort(),L=[];
    for(let i=1;i<s.length;i++){const d=diff(s[i],s[i-1]);if(d>=CYCLE_DAYS[0]&&d<=CYCLE_DAYS[1])L.push(d)}
    return L.slice(-LAST_CYCLES);
  }
  /* Prediction: {ok:false} or {ok:true,mean,sd,n,from,to,irregular}. Needs at least 2 cycle lengths. */
  function predict(rows){
    const L=lengths(rows);
    if(L.length<2||!rows.length)return {ok:false,n:L.length};
    const mean=L.reduce((a,b)=>a+b,0)/L.length,sd=Math.sqrt(L.reduce((a,b)=>a+(b-mean)**2,0)/L.length);
    const w=Math.max(2,Math.ceil(sd)),st=rows.map(r=>r.s).sort().pop(),m=Math.round(mean);
    return {ok:true,n:L.length,mean:Math.round(mean*10)/10,sd:Math.round(sd*10)/10,from:addDays(st,m-w),to:addDays(st,m+w),irregular:sd>=5||Math.max(...L)-Math.min(...L)>=10};
  }
  /* Calendar method: ovulation LUTEAL days before the next start, the window from 5 days before ovulation to 1 day after.
     null without a prediction; {irregular:true} (no dates) for an irregular cycle. */
  function fertile(p,today){
    if(!p||!p.ok)return null;
    if(p.irregular)return {irregular:true};
    let ov=addDays(p.from,diff(p.to,p.from)/2-LUTEAL);
    while(addDays(ov,1)<today)ov=addDays(ov,Math.round(p.mean));
    return {ov,from:addDays(ov,-5),to:addDays(ov,1)};
  }
  /* Which day of this period it is: only when the last record has no end and is at most MAXLEN days old; otherwise null. */
  function dayOfPeriod(rows,today){
    const r=rows.length?rows[rows.length-1]:null;
    if(!r||r.e||r.s>today)return null;
    const n=diff(today,r.s)+1;return n<=MAXLEN?n:null;
  }
  /* Reminder day: LEAD days before the predicted range, today or later and within `win` days. */
  function remindDay(p,today,win){
    if(!p.ok)return null;
    const d=addDays(p.from,-LEAD);
    return d>=today&&diff(d,today)<win?d:null;
  }
  /* The 5 days before each of the last 3 period starts against the other days since the first of those windows: average mood (1-5) and sleep minutes. A series needs 4 values before and 6 outside; null for a series that does not have them, null overall under 3 starts.
     Descriptive only: no cycle phase, no fertile day. mood: [{day,v}], sleep: [{day,min}]. */
  function beforeStart(rows,mood,sleep,today){
    const st=rows.map(r=>r.s).sort().filter(s=>s<=today).slice(-3);
    if(st.length<3)return null;
    const pre=new Set();for(const s of st)for(let i=1;i<=5;i++)pre.add(addDays(s,-i));
    const from=addDays(st[0],-5),avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
    const one=(list,f)=>{
      const a=[],b=[];for(const x of list||[]){if(x.day<from||x.day>today)continue;(pre.has(x.day)?a:b).push(f(x))}
      return a.length>=4&&b.length>=6?{pre:avg(a),other:avg(b)}:null;
    };
    const m=one(mood,x=>x.v),s=one(sleep,x=>x.min);
    return m||s?{mood:m,sleep:s}:null;
  }
  /* Lines the user may add to the doctor report: the last starts with their length in days and the mean cycle length. No prediction, no fertile window. */
  function report(rows){
    const r=rows.slice(-LAST_CYCLES).reverse(),L=lengths(rows);
    if(!r.length)return null;
    const out=[["Son dönem başlangıçları",r.map(x=>fdate(x.s,true)+(x.e?` (${diff(x.e,x.s)+1} gün)`:"")).join(", ")]];
    if(L.length)out.push(["Ortalama döngü uzunluğu",`${Math.round(L.reduce((a,b)=>a+b,0)/L.length)} gün (${L.length} döngü)`]);
    return out;
  }
  return {report,beforeStart,FLOW,SYM,MAXLEN,NOTE_MAX,NID,check,clean,overlap,lengths,addDays,diff,predict,fertile,dayOfPeriod,remindDay};
})();
if(typeof module!=="undefined")module.exports=CycleLib;
