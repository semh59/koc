const {ok,finish}=require("./ok");
// Guided mode flow engine (pure logic).
const G=require("../www/modules/gym/guidelib.js"),EXDB=require("../www/modules/gym/exlib.js"),_bal=require("../www/modules/gym/balance.js"),fs=require("fs"),path=require("path");
const load=(f,name)=>{const m=new module.constructor();m._compile(fs.readFileSync(path.join(__dirname,"../www",f),"utf8")+`;module.exports=${name}`,f);return m.exports};
const FigTpl=load("modules/gym/figtpl.js","FigTpl"),EXCUE=load("modules/gym/excues.js","EXCUE");
const T0=1e6,P=G.PREP*1000;

{
  const st=G.start([{ex:"plank",sec:30,rest:10,n:2},{ex:"pushup",reps:10,rest:0,n:1}],T0);
  ok("phases: prepare, work/rest rounds, no final rest, guide duration for rep-based steps",JSON.stringify(st.ph.map(p=>p.k+(p.sec)))==='["r5","w30","r10","w30","r10","w30"]'&&st.ph[5].reps===10&&st.ph[5].sec===10*G.TEMPO);
  ok("total time and steps left",G.total(st.ph)===5+30+10+30+10+30&&G.stepsLeft(st)===3&&G.works(st)===3);
  ok("remaining time at the start equals the total",G.remain(st,T0)===115);
  G.tick(st,T0+P+12000);
  ok("tick: preparation ends, 18 s left in the work phase",st.i===1&&G.left(st,T0+P+12000)===18000);
  // background: after a long gap several phases pass at once, ends add to the previous one
  G.tick(st,T0+P+30000+10000+30000+10000+4000);
  ok("no drift in the background: three phases pass at once, end = previous end + duration",st.i===5&&st.at===T0+P+80000&&st.end===null&&st.done[1]===30&&st.done[3]===30);
  ok("a rep-based phase does not pass with time, it waits for Done",(G.tick(st,T0+9e6),st.i===5));
  G.finish(st,T0+P+80000+25000);
  ok("Done: the elapsed time is recorded, the flow ends",G.over(st)&&st.done[5]===25&&G.remain(st,T0)===0&&G.stepsLeft(st)===0);
  ok("result: sets per exercise (duration and reps)",JSON.stringify(G.result(st))==='[{"ex":"plank","sets":[{"sec":30},{"sec":30}]},{"ex":"pushup","sets":[{"sec":25,"reps":10}]}]');
}
{
  const st=G.start([{ex:"a",sec:20,rest:10,n:3}],T0);G.tick(st,T0+P+5000);
  G.pause(st,T0+P+5000);
  ok("pause: time freezes",G.left(st,T0+P+60000)===15000&&!G.tick(st,T0+P+60000)&&st.i===1);
  G.resume(st,T0+P+65000);
  ok("resume: the end moves forward by the pause length",st.end===T0+P+20000+60000&&G.left(st,T0+P+65000)===15000);
  ok("Skip and Done do nothing while paused",(G.pause(st,T0+P+70000),!G.skip(st,T0+P+70000)&&!G.finish(st,T0+P+70000)));
  G.resume(st,T0+P+70000);
  G.skip(st,T0+P+70000);
  ok("skip: not counted, the rest starts with its full duration",st.i===2&&st.done[1]==null&&st.end===T0+P+80000);
  G.skip(st,T0+P+71000);G.tick(st,T0+P+71000+20000);
  ok("the second round completes",st.done[3]===20&&st.i===4);
  G.back(st,T0+P+100000);
  ok("back: returns to the previous work phase, its record is deleted, the timer restarts",st.i===3&&st.done[3]==null&&st.end===T0+P+120000);
  G.back(st,T0+P+100000);G.back(st,T0+P+100000);
  ok("back at the start stays in the first phase",st.i===0&&Object.keys(st.done).length===0);
}
{
  const ids=["a","b","c","d"];
  const tb=G.phases(G.tabata(ids)),hi=G.phases(G.hiit(ids)),es=G.phases(G.stretch(["x","y"]));
  ok("Tabata: 8 x 20/10, exercises rotate in order",tb.filter(p=>p.k==="w").length===8&&tb.filter(p=>p.k==="w").every(p=>p.sec===20)&&tb.filter(p=>p.k==="r").slice(1).every(p=>p.sec===10)&&tb[1].ex==="a"&&tb[9].ex==="a"&&tb[3].ex==="b");
  ok("HIIT: 40/20",hi.filter(p=>p.k==="w").every(p=>p.sec===40)&&hi.filter(p=>p.k==="r").slice(1).every(p=>p.sec===20));
  ok("stretching: 30 s per movement",es.filter(p=>p.k==="w").every(p=>p.sec===30));
  const t={ex:["squat","plank","bench"],tg:{squat:{sets:4,reps:6},plank:{sets:2,sec:45}}};
  ok("from a template: timed/rep-based, set count and rest between sets",JSON.stringify(G.fromTpl(t,id=>id==="plank",id=>id==="squat"?150:30))==='[{"ex":"squat","reps":6,"rest":150,"n":4},{"ex":"plank","sec":45,"rest":30,"n":2},{"ex":"bench","reps":10,"rest":30,"n":3}]');
}
{
  const F=G.FLOWS,by=id=>F.find(f=>f.id===id),ex=id=>EXDB.find(e=>e.id===id);
  ok("at least 3 flows: 5 min warm-up, 10 min stretching, 4 min Tabata",F.length>=3&&by("warmup5")&&by("stretch10")&&by("tabata4"));
  const all=F.flatMap(f=>f.steps.map(s=>s.ex)),miss=all.filter(id=>!ex(id));
  ok("flow exercises exist in the library (EXDB; also checked in the app)",!miss.length,miss);
  ok("flow exercises are timed or interval kinds (reps are never left empty in the log)",all.every(id=>"ti".includes(ex(id).k)),all.filter(id=>!"ti".includes(ex(id).k)));
  ok("flow exercises have a figure and a form cue",all.every(id=>FigTpl[ex(id).tp]&&FigTpl[ex(id).tp].frames&&EXCUE[ex(id).tp]&&EXCUE[ex(id).tp].length));
  const min=id=>G.total(G.phases(by(id).steps))/60;
  ok("durations: warm-up about 5, stretching about 10, Tabata about 4 min",Math.abs(min("warmup5")-5)<=0.75&&Math.abs(min("stretch10")-10)<=0.75&&Math.abs(min("tabata4")-4)<=0.5,[min("warmup5"),min("stretch10"),min("tabata4")]);
  ok("warm-up and stretching are marked warm, Tabata is not",by("warmup5").warm&&by("stretch10").warm&&!by("tabata4").warm);
}
{
  const nm=id=>({plank:"Plank",pushup:"Şınav"})[id];
  const st=G.start([{ex:"plank",sec:30,rest:10,n:1},{ex:"pushup",reps:12,rest:0,n:1}],T0);
  ok("preparation (5 s, short): only the next exercise, in time for the countdown",G.cue(st,nm)==="Sıradaki: Plank");
  G.tick(st,T0+P);
  ok("if the countdown was spoken it is not repeated in the work phase; otherwise name and go",G.cue(st,nm,true)===""&&G.cue(st,nm,false)==="Plank, 30 saniye. Başla");
  G.tick(st,T0+P+30000);
  ok("rest: rest and next (rep-based)",G.cue(st,nm)==="Dinlen. Sıradaki: Şınav, 12 tekrar");
  ok("countdown text and ending",G.SAY.go==="3, 2, 1, başla"&&(G.tick(st,T0+P+40000),G.finish(st,T0+P+70000),G.cue(st,nm)===G.SAY.end));
  ok("texts are short (voice prompts)",[G.SAY.go,G.SAY.rest,G.SAY.end,G.SAY.pause].every(s=>s.length<=20));
  const s5=G.start([{ex:"plank",sec:30,rest:5,n:1},{ex:"pushup",reps:12,rest:0,n:1}],T0);G.tick(s5,T0+P+30000);
  ok("5 s rest: no \"Dinlen\" and no duration, only the next exercise",s5.ph[s5.i].k==="r"&&G.cue(s5,nm)==="Sıradaki: Şınav");
}
finish();
