"use strict";
Data.privacy.push(["Spor ve antrenman",()=>S.workouts.length+Log.where(e=>e.type==="exercise"&&e.wid==null).length,()=>{S.workouts=[];Log.drop("exercise")},2]);
Data.csv.push(["antrenman","Antrenman setleri",({wu})=>["tarih","antrenman","egzersiz","set",wu,"tekrar","süre_sn","rpe","ısınma","set_türü","süperset"],({S,by,day,h,conv,wu})=>by(S.workouts,day,x=>x.t0).flatMap(w=>w.ex.flatMap(x=>x.sets.map((s,i)=>s.done&&[w.day,w.name,h.exName(x.id),i+1,s.kg==null?null:conv.w(s.kg,wu),s.reps,s.sec,s.rpe,s.w?"evet":"",s.t==="d"?"drop":s.t==="f"?"başarısızlık":"",x.ss]).filter(Boolean))),1]);
Data.hist.push((S,{add})=>{for(const w of S.workouts)if(w.t1!=null)add(w.day,"wo",1)});
Data.histSearch.push((S,{n,norm,out,wname})=>{
  for(const w of S.workouts){
    if(w.t1==null)continue;
    if(norm(w.name+" "+(wname?wname(w):"")).includes(n))out.push({day:w.day,time:"",type:"wo",kind:"Antrenman",text:w.name,id:w.id});
  }
});
Data.dayWork.push(k=>S.workouts.filter(w=>gDone(w)&&w.day===k).sort((a,b)=>a.t0-b.t0).map(w=>`<button class="rrow" data-g="sum:${w.id}"><span class="grow tx"><b>${esc(w.name)}</b><span class="mut sm">${esc(gNames(w,4))}</span><span class="mut sm num">${gStats(w)}</span></span></button>`).join(""));
const Gym={
  workouts:()=>S.workouts,gid:()=>S.gid,isStrength:id=>{const e=gEx(id);return e.c?e.c==="g":e.k!=="c"},
  addImported:p=>{S.customEx.push(...p.newEx);S.workouts.push(...p.workouts);S.gid=p.gid},
  removeImported:(ids,cx)=>{S.workouts=S.workouts.filter(w=>!ids.has(w.id));S.customEx=S.customEx.filter(e=>!cx.has(e.id))}
};
