"use strict";
Data.privacy.push(["Uyku, ruh hali ve oruç",()=>S.sleep.length+S.mood.length+S.fast.log.length+(S.fast.t0?1:0),()=>{S.sleep=[];S.mood=[];S.fast.log=[];S.fast.t0=null;S.settings.hcFrom=keyOff(1)},7]);
Data.csv.push(["uyku","Uyku",()=>["tarih","süre_dk","süre_saat","kalite_1_5"],({S})=>S.sleep.map(r=>[r.day,r.min,r.min/60,r.q]),4]);
Data.csv.push(["ruh","Ruh hali",()=>["tarih","ruh_hali_1_5","not"],({S})=>S.mood.map(r=>[r.day,r.v,r.t]),5]);
Data.csv.push(["oruc","Oruç",()=>["başlangıç","bitiş","süre_saat"],({S,iso})=>S.fast.log.map(r=>[iso(r.t0),iso(r.t1),(r.t1-r.t0)/36e5]),6]);
Data.hist.push((S,{get,add,dk})=>{
  for(const x of S.sleep)get(x.day).sleep=x.min;
  for(const x of S.mood)get(x.day).mood=x.v;
  for(const f of S.fast.log)add(dk(new Date(f.t1)),"fast",1);
});
Data.histSearch.push((S,{n,norm,out})=>{for(const x of S.mood)if(x.t&&norm(x.t).includes(n))out.push({day:x.day,time:"",type:"mood",kind:"Ruh hali",text:x.t,sub:MOODN[x.v-1]})});
Data.dayRows.push([1,k=>{const x=S.sleep.find(y=>y.day===k);return x?hgRow("moon","Uyku",hbDur(x.min)):""}],
  [2,k=>{const x=S.mood.find(y=>y.day===k);return x?hgRow("smile","Ruh hali",`${MOODS[x.v-1]} ${MOODN[x.v-1]}`):""}],
  [7,k=>S.fast.log.filter(x=>dayAt(x.t1)===k).map(x=>hgRow("moon","Oruç",hbDur(Math.round((x.t1-x.t0)/6e4)))).join("")]);
const Habits={
  sleep:()=>S.sleep,mood:()=>S.mood,fast:()=>S.fast,ramReminders:(now,lead,days)=>ramReminders(now,lead,days),ramShift:(day,t,kind,k)=>ramShift(day,t,kind,k),dayTimes:day=>ramDay(day),
  ramWaterNote:()=>ramWaterNote(),fastNote:()=>ramFastNote(),fastWindow:()=>ramFastWindow(),fasting:()=>ramNow()?.kind==="iftar",
  setSleep:l=>{S.sleep=HabitLib.cleanSleep(l)}
};
