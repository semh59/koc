"use strict";
/* Entry helpers every screen uses: add an entry, per-day lookups and totals, weights, the logging streak and the movement-calorie bonus. */
function add(type,v,text,day){
  const n=new Date();
  if(!day)logOff=0;
  const e={id:S.nextId++,day:day||dayKey(),time:`${pad(n.getHours())}:${pad(n.getMinutes())}`,type,v:v==null?null:v,text:text||""};
  if(type==="exercise"&&day&&day!==dayKey())e.bt=true; // logged for a past day: the time is the logging moment, the exercise span is unknown (Algo.exerciseKcal)
  S.entries.push(e);save();return e;
}
const of=(type,day)=>S.entries.filter(e=>e.type===type&&e.day===day);
const inType=(type,e)=>type==="water"?WeeklyLib.isWater(e):e.type===type;
const sum=(type,a,b)=>S.entries.filter(e=>inType(type,e)&&e.day>=a&&e.day<=b).reduce((s,e)=>s+(e.v||0),0);
/* Per-day totals of one entry type in a single pass; returns a day -> total lookup. Chart loops use it instead of a sum() scan per day. */
const dayTotal=type=>{const m=new Map();for(const e of S.entries)if(inType(type,e))m.set(e.day,(m.get(e.day)||0)+(e.v||0));return k=>m.get(k)||0};
/* The part added to that day's calorie target when the movement-calories setting is on, else 0. The ring, widget and toast all read it here. */
const moveAdd=day=>{
  if(!(S.settings.moveKcalOn&&S.settings.kcal>0))return 0;
  const dn=Algo.dayNum(day),near=x=>Math.abs(Algo.dayNum(x.day)-dn)<=1; // an exercise past midnight is stored on the neighbouring day too
  return Algo.moveBonus(Algo.exerciseKcal(S.entries.filter(e=>e.type==="exercise"&&near(e)),Motion.moves().filter(near),day));
};
const kcalGoal=day=>S.settings.kcal>0?S.settings.kcal+moveAdd(day):0;
function weights(a="0000",b="9999"){const m={};for(const e of S.entries)if(e.type==="weight"&&e.day>=a&&e.day<=b)m[e.day]=e.v;return m}
function streak(){
  const ds=new Set(S.entries.filter(e=>e.type!=="steps").map(e=>e.day));let d=addDays(0);
  if(!ds.has(dayKey(d)))d=addDays(-1,d);
  let n=0;while(ds.has(dayKey(d))){n++;d=addDays(-1,d)}return n;
}
