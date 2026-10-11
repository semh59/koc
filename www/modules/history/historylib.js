"use strict";
/* History: day-by-day summary index, month summary and search (no DOM). Does not change data and never truncates a record. */
const HistoryLib=(()=>{
  const norm=typeof foldTr!=="undefined"?foldTr:require("../../kernel/common.js").foldTr;
  const SEARCH_MAX=300,MIN_QUERY=2,KCAL_FULL_DAY=800;
  /* Day -> counters filled by the data modules (Data.hist), one pass. dk: ms -> day key. */
  function index(S,dk){
    const m=new Map(),get=d=>{let o=m.get(d);if(!o)m.set(d,o={});return o},add=(d,k,v)=>{const o=get(d);o[k]=(o[k]||0)+v};
    const ctx={add,get,dk};for(const f of Data.hist)f(S,ctx);
    return m;
  }
  const MAIN={food:o=>o.food>0,water:o=>o.water>0,exercise:o=>o.exercise>0||o.wo>0,weight:o=>o.weight!=null};
  const OTHER=["steps","drink","note","sleep","mood","bp","glucose","pulse","hr","meds","measures","fast"];
  /* The main kinds shown in a calendar cell; every other record counts as "other". */
  function marks(o){
    if(!o)return {main:[],other:false};
    return {main:Object.keys(MAIN).filter(k=>MAIN[k](o)),other:OTHER.some(k=>o[k]!=null&&o[k]!==0)};
  }
  /* Summary of one month from its [day, counters] rows. Averages cover only the days that have that data. */
  function summarize(ym,rows){
    let days=0,kd=0,kcal=0,sd=0,water=0,exercise=0,sn=0,steps=0,wo=0,first=null,last=null,fk=null,lk=null;
    for(const [d,o] of rows){
      days++;
      if(o.kcal>=KCAL_FULL_DAY){kd++;kcal+=o.kcal} // a part-logged day would pull the average down; same rule as the weekly report
      if(o.water>0){sd++;water+=o.water}
      exercise+=o.exercise||0;wo+=o.wo||0;
      if(o.steps>0){sn++;steps+=o.steps}
      if(o.weight!=null&&(fk==null||d<fk)){fk=d;first=o.weight}
      if(o.weight!=null&&(lk==null||d>lk)){lk=d;last=o.weight}
    }
    return {ym,days,kcalAvg:kd?Math.round(kcal/kd):null,waterAvg:sd?Math.round(water/sd):null,exercise,wo,stepsAvg:sn?Math.round(steps/sn):null,
      weightFirst:first,weightLast:last,weightN:fk&&lk&&fk!==lk?2:fk?1:0};
  }
  /* ym: "2026-10". */
  const month=(idx,ym)=>summarize(ym,[...idx].filter(([d])=>d.slice(0,7)===ym));
  /* Months that have records, newest first; groups the index once instead of scanning it per month. */
  function months(idx){
    const g=new Map();
    for(const e of idx){const ym=e[0].slice(0,7);let l=g.get(ym);if(!l)g.set(ym,l=[]);l.push(e)}
    return [...g.keys()].sort().reverse().map(ym=>summarize(ym,g.get(ym)));
  }
  /* Searches food, note, exercise and workout names, ignoring case and Turkish letter variants. wname(w): extra searchable workout text. */
  function search(S,q,max=SEARCH_MAX,wname){
    const n=norm(q).trim();if(n.length<MIN_QUERY)return {items:[],total:0,days:0};
    const out=[];
    const ctx={n,norm,out,wname};for(const f of Data.histSearch)f(S,ctx);
    out.sort((a,b)=>a.day<b.day?1:a.day>b.day?-1:(b.time||"").localeCompare(a.time||""));
    return {items:out.slice(0,max),total:out.length,days:new Set(out.map(x=>x.day)).size};
  }
  /* First and last record day: the calendar year picker and the "oldest" bound. */
  function span(idx){let a=null,b=null;for(const d of idx.keys()){if(a==null||d<a)a=d;if(b==null||d>b)b=d}return {first:a,last:b}}
  return {index,marks,month,months,search,span,SEARCH_MAX,MIN_QUERY};
})();
if(typeof module!=="undefined"){
  module.exports=HistoryLib;
  if(typeof Data==="undefined"){globalThis.Data=require("../../kernel/kernel.js").Data;for(const m of ["log","gym","vitals","habits","meds","pulse","measures"])require("../"+m+"/index.js")} // Node tests
}
