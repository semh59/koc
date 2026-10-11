"use strict";
/* "Kendi deneyin": a 14-night personal comparison, one fixed question (does switching the screen off after 22:00 go with the sleep minutes). Pure: no DOM, no S.
   Nights are assigned at random, balanced 7 and 7 with no more than two in a row. The result is two averages side by side and never a cause; fewer than 10 answered nights give no result. */
const TrialLib=(()=>{
  const {dayOk,dayNum}=typeof Algo!=="undefined"?Algo:require("../../kernel/algo.js");
  const NIGHTS=14,MIN_VALID=10,MIN_EACH=4,FALLBACK="ABBAABABBABAAB";
  const addDay=(k,n)=>new Date((dayNum(k)+n)*864e5).toISOString().slice(0,10);
  const planOk=p=>typeof p==="string"&&/^[AB]{14}$/.test(p)&&[...p].filter(c=>c==="A").length===7&&!/AAA|BBB/.test(p);
  /* rng: () => [0,1). A = ordinary night, B = screen off after 22:00. */
  function plan(rng){
    for(let t=0;t<500;t++){
      const a=[..."AAAAAAABBBBBBB"];
      for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
      const s=a.join("");if(planOk(s))return s;
    }
    return FALLBACK;
  }
  /* A stored trial {start, plan, ans:{day:"y"|"n"}} or null. */
  function clean(t){
    if(!t||typeof t!=="object"||!dayOk(t.start)||!planOk(t.plan))return null;
    const ans={};
    for(const [d,v] of Object.entries(t.ans&&typeof t.ans==="object"?t.ans:{})){const i=dayNum(d)-dayNum(t.start);if(dayOk(d)&&i>=0&&i<NIGHTS&&(v==="y"||v==="n"))ans[d]=v}
    return {start:t.start,plan:t.plan,ans};
  }
  const index=(t,today)=>dayNum(today)-dayNum(t.start);
  /* What the screens need today: {night: 0..13 or null, tonight: "A"|"B"|null, ask: day to ask about or null, done: all nights and the last morning are over}. */
  function status(t,today){
    const i=index(t,today),done=i>NIGHTS;
    const ask=i>=1&&i<=NIGHTS&&!t.ans[addDay(t.start,i-1)]?addDay(t.start,i-1):null;
    return {night:i>=0&&i<NIGHTS?i:null,tonight:i>=0&&i<NIGHTS?t.plan[i]:null,ask,done};
  }
  /* sleep: [{day,min}] (a record sits on the wake-up day). {a:{n,avg},b:{n,avg}} in minutes, or null under MIN_VALID answered nights with a sleep record or MIN_EACH in a group. */
  function summarize(t,sleep){
    const by=new Map((sleep||[]).map(s=>[s.day,s.min])),g={A:[],B:[]};
    for(let i=0;i<NIGHTS;i++){
      const d=addDay(t.start,i),m=by.get(addDay(d,1));
      if(t.ans[d]==="y"&&typeof m==="number")g[t.plan[i]].push(m);
    }
    if(g.A.length+g.B.length<MIN_VALID||g.A.length<MIN_EACH||g.B.length<MIN_EACH)return null;
    const f=a=>({n:a.length,avg:a.reduce((x,y)=>x+y,0)/a.length});
    return {a:f(g.A),b:f(g.B)};
  }
  return {NIGHTS,MIN_VALID,MIN_EACH,plan,clean,status,summarize,addDay};
})();
if(typeof module!=="undefined")module.exports=TrialLib;
