"use strict";
/* Guided-workout flow engine (pure). Step: {ex, sec | reps, rest, n}. Phases are work (w) and rest (r).
   Time is computed from the end instant: a tick that arrives late in the background steps through several phases, each starting at the previous end, so nothing drifts. */
const GuideLib=(()=>{
  const TEMPO=3,PREP=5; // guide seconds per rep for a rep-based move; preparation before the first move
  function phases(steps){
    const out=[{k:"r",sec:PREP}];
    for(const s of steps)for(let r=1;r<=(s.n||1);r++){
      out.push(Object.assign({k:"w",ex:s.ex,r,n:s.n||1},s.reps?{reps:s.reps,sec:s.reps*TEMPO}:{sec:s.sec}));
      if(s.rest>0)out.push({k:"r",sec:s.rest});
    }
    if(out[out.length-1].k==="r")out.pop();
    return out;
  }
  const over=st=>st.i>=st.ph.length;
  // A rep-based phase has no end: it waits for the "Bitti" tap.
  function enter(st,i,at){st.i=i;st.at=at;const p=st.ph[i];st.end=p&&!p.reps?at+p.sec*1000:null}
  function start(steps,now){const st={ph:phases(steps),done:{},pause:null,t0:now};enter(st,0,now);return st}
  function tick(st,now){
    let moved=false;
    while(!over(st)&&st.pause==null&&st.end!=null&&st.end<=now){
      const p=st.ph[st.i];if(p.k==="w")st.done[st.i]=p.sec;
      enter(st,st.i+1,st.end);moved=true;
    }
    return moved;
  }
  /* Bitti records the time spent in the work phase; Geç moves on without recording. */
  function finish(st,now){
    if(over(st)||st.pause!=null)return false;
    if(st.ph[st.i].k==="w")st.done[st.i]=Math.max(1,Math.round((now-st.at)/1000));
    enter(st,st.i+1,now);return true;
  }
  function skip(st,now){if(over(st)||st.pause!=null)return false;enter(st,st.i+1,now);return true}
  function back(st,now){
    let j=Math.min(st.i,st.ph.length)-1;while(j>0&&st.ph[j].k!=="w")j--;
    j=Math.max(0,j);for(const k in st.done)if(+k>=j)delete st.done[k];
    st.pause=null;enter(st,j,now);return true;
  }
  function pause(st,now){if(st.pause==null&&!over(st))st.pause=now}
  function resume(st,now){
    if(st.pause==null)return;const d=now-st.pause;
    st.at+=d;if(st.end!=null)st.end+=d;st.pause=null;
  }
  const clock=(st,now)=>st.pause!=null?st.pause:now;
  const left=(st,now)=>st.end==null?null:Math.max(0,st.end-clock(st,now));
  const elapsed=(st,now)=>Math.max(0,clock(st,now)-st.at);
  const total=ph=>ph.reduce((s,p)=>s+p.sec,0);
  function remain(st,now){
    if(over(st))return 0;const p=st.ph[st.i];
    return Math.max(0,p.sec-elapsed(st,now)/1000)+total(st.ph.slice(st.i+1));
  }
  const stepsLeft=st=>st.ph.slice(st.i).filter(p=>p.k==="w").length;
  const nextWork=st=>st.ph.slice(st.i+1).find(p=>p.k==="w")||null;
  const works=st=>st.ph.filter(p=>p.k==="w").length;
  /* Completed work phases in exercise order: {ex, sets:[{sec, reps?}]}. */
  function result(st){
    const byEx=new Map();
    st.ph.forEach((p,i)=>{
      if(p.k!=="w"||st.done[i]==null)return;
      let x=byEx.get(p.ex);if(!x)byEx.set(p.ex,x={ex:p.ex,sets:[]});
      x.sets.push(p.reps?{sec:st.done[i],reps:p.reps}:{sec:st.done[i]});
    });
    return [...byEx.values()];
  }

  /* Ready-made flows: general patterns, not a personal program. */
  const rounds=(ids,k,sec,rest)=>Array.from({length:k},(_,i)=>({ex:ids[i%ids.length],sec,rest,n:1}));
  const tabata=ids=>rounds(ids,8,20,10);
  const hiit=ids=>rounds(ids,8,40,20);
  const stretch=ids=>ids.map(ex=>({ex,sec:30,rest:8,n:1}));
  const FLOWS=[
    {id:"warmup5",n:"5 dk ısınma",about:"Hafif kardiyo ve eklem hareketleri; antrenman öncesi.",warm:true,steps:[
      {ex:"jumpingjack",sec:40,rest:5},{ex:"armcircles",sec:30,rest:5},{ex:"shouldercircles",sec:30,rest:5},{ex:"torsotwist",sec:30,rest:5},
      {ex:"windmills",sec:30,rest:5},{ex:"skipping",sec:30,rest:5},{ex:"buttkick",sec:30,rest:5},{ex:"wgstretch",sec:30,rest:5},{ex:"inchworm",sec:30,rest:0}]},
    {id:"stretch10",n:"10 dk tüm vücut esneme",about:"Egzersiz başına 30 saniye, boyundan baldıra.",warm:true,steps:stretch(["chinchest","sideneck","shoulderstretch","tristretch","chestshoulder","upperback","torsotwist","catstretch","childpose","hipflexor","quadstretch","hamstretch","kneechest","seatedglute","calfstretch","groiners"])},
    {id:"balance10",n:"10 dk denge ve kuvvet",about:"Egzersiz başına 40 saniye. Duvar ya da sağlam bir sandalyenin yanında yap.",steps:[...["onefoot","chairstand","heeltoe","sidestep","tandem","armswalk"],...["onefoot","chairstand","heeltoe","sidestep","tandem","armswalk"]].map((ex,i,a)=>({ex,sec:40,rest:i===a.length-1?0:10}))},
    {id:"iwt30",n:"30 dk aralıklı yürüyüş",about:"5 tur: 3 dakika hızlı, 3 dakika yavaş. Hızlı fazda biraz nefes nefese, yavaş fazda rahat kalacağın tempoyu seç.",steps:Array.from({length:10},(_,i)=>({ex:i%2?"slowwalk":"fastwalk",sec:180,rest:0,n:1}))},
    {id:"tabata4",n:"4 dk Tabata, ekipmansız",about:"8 tur: 20 saniye yüksek tempo, 10 saniye dinlenme.",steps:tabata(["jumpingjack","climber","skipping","scissorjump"])},
    {id:"hiit8",n:"8 dk HIIT 40/20, ekipmansız",about:"8 tur: 40 saniye çalışma, 20 saniye dinlenme.",steps:hiit(["climber","jumpingjack","splitjump","buttkick"])}
  ];
  /* Template (gym.js shape) -> steps. timed(id): is it timed; rest(id): seconds between sets. */
  function fromTpl(t,timed,rest){
    return t.ex.map(id=>{
      const g=t.tg&&t.tg[id]||{},n=Math.min(10,g.sets||3);
      return timed(id)?{ex:id,sec:g.sec||30,rest:rest(id),n}:{ex:id,reps:g.reps||10,rest:rest(id),n};
    });
  }

  /* Voice command texts in one place: short, Turkish. The native side queues a text under 20 characters behind the sentence being spoken, while a longer one cuts the previous. */
  const amount=p=>p.reps?`${p.reps} tekrar`:`${p.sec} saniye`;
  const SAY={next:(n,p)=>`Sıradaki: ${n}, ${amount(p)}`,nextShort:n=>`Sıradaki: ${n}`,go:"3, 2, 1, başla",rest:"Dinlen",start:(n,p)=>`${n}, ${amount(p)}. Başla`,end:"Bitti. Tebrikler",pause:"Duraklatıldı"};
  const SHORT_REST=10; // seconds; the countdown is spoken in the last 3 s, and on a shorter rest the long sentence would not finish before it
  /* Text spoken when a phase starts. cd: the countdown was already spoken during the previous rest, so "başla" is not repeated. */
  function cue(st,name,cd){
    if(over(st))return SAY.end;
    const p=st.ph[st.i];
    if(p.k==="r"){const nx=nextWork(st);return !nx?SAY.rest:p.sec<SHORT_REST?SAY.nextShort(name(nx.ex)):(st.i?SAY.rest+". ":"")+SAY.next(name(nx.ex),nx)}
    return cd?"":SAY.start(name(p.ex),p);
  }
  return {TEMPO,PREP,phases,start,tick,finish,skip,back,pause,resume,left,elapsed,total,remain,stepsLeft,nextWork,works,over,result,tabata,hiit,stretch,FLOWS,fromTpl,SAY,cue};
})();
if(typeof module!=="undefined")module.exports=GuideLib;
