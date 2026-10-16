/* Goal safety: BMI check needs a height, a blocked goal is neither saved nor shown, floors, fast loss note, low-log day, weekly weigh tip, hide switches, fasting question, neutral tone. */
const {ok,finish}=require("./ok");
const {boot}=require("./html");
const A=require("../www/kernel/algo.js");
(async()=>{
  ok("goalWhy: no height asks for it, BMI under 18.5 is refused for a loss, a gain from underweight and a normal goal pass",
    /boyunu gir/.test(A.goalWhy(70,0,80))&&/BMI 18,5 altı/.test(A.goalWhy(50,170,80))&&A.goalWhy(54,170,50)===""&&A.goalWhy(70,170,80)===""&&A.goalWhy(0,0,0)==="");
  ok("floor: unspecified sex is 1500, female 1200, male 1500",A.kcalFloor("",0)===1500&&A.kcalFloor("f",0)===1200&&A.kcalFloor("m",0)===1500);

  const w=await boot(),ev=s=>w.eval(s),q=s=>w.document.querySelector(s),txt=()=>q("#view").textContent,msg=()=>q("#tmsg").textContent;
  const fresh=(x="")=>ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.settings.kcal=2000;tab='today';${x};render()`);
  const setField=(id,v)=>{const f=q(`#${id}`);f.value=v;f.dispatchEvent(new w.Event("change",{bubbles:true}))};
  const iso=n=>new Date(Date.UTC(2026,9,1)+n*864e5).toISOString().slice(0,10);

  fresh("add('weight',80)");
  ev("tab='settings-profile';render()");
  setField("goalKg","70");
  ok("goal without a height is refused, nothing saved, the toast asks for the height",ev("S.settings.goalKg")===0&&/boyunu gir/.test(msg()),msg());
  ev("S.settings.heightCm=170;render()");
  setField("goalKg","50");
  ok("goal under BMI 18.5 is refused",ev("S.settings.goalKg")===0&&/BMI 18,5 altı/.test(msg()),msg());
  setField("goalKg","70");
  ok("a goal that passes the check is saved",ev("S.settings.goalKg")===70);

  fresh("S.settings.goalKg=50;S.settings.heightCm=170;add('weight',80);add('weight',79,'',keyOff(-1))");
  ok("a stored goal under BMI 18.5: no 'hedefe' on Today",!/hedefe/.test(txt()));
  ev("tab='trend';render()");
  ok("a stored goal under BMI 18.5: no 'Hedefe kalan' and no goal line or edge label in the chart",!/Hedefe kalan/.test(txt())&&!q('svg.chart line[stroke="var(--kcal)"]')&&!/Hedef 50/.test(q("svg.chart")?.textContent||""));
  fresh("S.settings.goalKg=70;S.settings.heightCm=0;add('weight',80);add('weight',79,'',keyOff(-1))");
  ok("a stored goal without a height is hidden too",!/hedefe/.test(txt()));
  fresh("S.settings.goalKg=70;S.settings.heightCm=170;add('weight',80);add('weight',79,'',keyOff(-1))");
  ok("a goal that passes shows 'hedefe' on Today",/hedefe/.test(txt()));

  ev("Object.assign(ob,{cm:'170',kg:'80',age:'30',dir:'lose',goal:'50'})");
  ok("onboarding: a goal under BMI 18.5 gives an error under the goal field",/BMI 18,5 altı/.test(ev("obParse().err")||"")&&ev("obParse().bad")==="goal");

  const w7=n=>{const o={};for(let i=0;i<=21;i+=3)o[iso(i)]=80+n*(i/7);return o};
  ok("fastLoss: more than 1% a week is flagged, 0.5% is not",A.fastLoss(w7(-1),iso(21))===true&&A.fastLoss(w7(-0.4),iso(21))===false);
  ok("fastLoss: with minDays the note waits until the weights span that long",A.fastLoss(w7(-1),iso(21),14)===true&&(sh=>A.fastLoss(sh,iso(21),0)===true&&A.fastLoss(sh,iso(21),14)===false&&A.fastLoss(sh,iso(21),7)===true)({[iso(12)]:80,[iso(15)]:79.2,[iso(18)]:78.4,[iso(21)]:77.6}));
  fresh("for(let i=21;i>=1;i-=3)add('weight',80+0.9*(i/7),'',keyOff(-i))");
  ev("sheetWeight()");q("#fv").value="80";q('[data-go="weight"]').click();
  ok("saving a weigh-in with a fast fall: neutral doctor line, no diagnosis",/haftada %1/.test(msg())&&/hekimine danış/.test(msg())&&!/hastal|bozukluk/.test(msg()),msg());
  ev("tab='trend';render()");
  ok("Trend shows the same note as a persistent line",/hekimine danış; bu bir tanı değildir/.test(txt()));
  fresh("for(let i=21;i>=1;i-=3)add('weight',80+0.1*(i/7),'',keyOff(-i))");
  ev("sheetWeight()");q("#fv").value="80";q('[data-go="weight"]').click();
  ok("a slow fall: no note",!/haftada %1/.test(msg()),msg());

  fresh("S.settings.kcal=2000");
  ok("a day with almost nothing logged: no 'kaldı', neutral note",!/kcal kaldı/.test(txt())&&/Bugün az yemek kayıtlı/.test(txt()));
  fresh("S.settings.kcal=2000;add('food',900,'x')");
  ok("enough logged: remaining calories are shown, no note",/kcal kaldı/.test(txt())&&!/Bugün az yemek kayıtlı/.test(txt()));

  const tip=d=>{
    ev(`(()=>{const D=Date.__real||Date;Date.__real=D;const t=new D("${d}T08:00:00").getTime();Date=class extends D{constructor(...a){a.length?super(...a):super(t)}static now(){return t}}})()`);
    return ev("dailyTip()");
  };
  fresh();
  const shown=Array.from({length:14},(_,i)=>iso(i)).filter(d=>/Sabah tartısını gir/.test(tip(d))).length;
  ok("weigh-in tip: one weekday a week (2 of 14 days)",shown===2,shown);
  ev("Date=Date.__real");
  ok("the weekly weigh reminder is on Mondays only",ev("DEF.settings.reminders.find(r=>r.id===1).dow")===1);

  fresh("for(let i=0;i<3;i++)add('water',250,'',keyOff(-i))");
  ok("streak shows by default",q("#streak").textContent.trim()!=="");
  ev("tab='settings';render()");
  q("[data-hs]").checked=true;q("[data-hs]").dispatchEvent(new w.Event("change",{bubbles:true}));
  ev("tab='today';render()");
  ok("hide streak: switch persists and the badge is empty",ev("S.settings.hideStreak")===true&&q("#streak").textContent.trim()===""&&ev("cleanSettings(JSON.parse(JSON.stringify(S.settings))).hideStreak")===true);
  fresh("S.settings.hideNums=true;S.settings.kcal=2000;add('weight',81.4);add('food',1000,'x')");
  const cards=[...w.document.querySelectorAll('.stepcard[data-tab="trend"],.rings')].map(n=>n.textContent).join(" ");
  ok("hide numbers: the weight card and the calorie ring show no figures",!/81,4|1000/.test(cards)&&/•••/.test(cards),cards);

  fresh("S.settings.fastOn=true;S.settings.fastInfoOk=true");
  ev("fastGo()");
  ok("an existing user (info already confirmed) gets the eating-disorder question before the first start",/Yeme bozukluğu geçmişin ya da yemeyi kısıtlama eğilimin var mı/.test(q("#sheet").textContent)&&ev("S.fast.t0")==null);
  ok("the 'Evet' button says what it does before anything is saved",/işareti açar; oruç ve kalori açığı önerileri kapanır/.test(q("#sheet").textContent)&&ev("risk().ed")===false);
  q('[data-hb="fastedyes"]').click();
  ok("answering 'Evet ya da emin değilim': the eating-disorder brake is on and the fast cannot start",ev("risk().ed")===true&&ev("(fastGo(),S.fast.t0)")==null);
  fresh("S.settings.fastOn=true;S.settings.fastInfoOk=true");
  ev("fastGo()");q("#fic").checked=true;q('[data-hb="fastinfo"]').click();
  ok("answering 'Hayır' with the box ticked records the answer and the fast can start",ev("S.settings.fastEdOk")===true&&ev("(fastGo(),S.fast.t0)")>0);

  fresh("S.settings.goalKg=70;S.settings.heightCm=175;S.settings.lastPlateau='';[-20,-18,-16,-14,-12,-9,-7,-5,-2,0].forEach((o,i)=>add('weight',80+[0.2,-0.1,0.3,-0.2,0,0.1,-0.3,0.2,-0.1,0][i],'',keyOff(o)));tab='trend'");
  ok("the 'why' button is neutral, no 'kilo vermedim' framing",q('[data-c="why"]')&&!/kilo vermedim/.test(q('[data-c="why"]').textContent));
  ev("S.chat=[];cPlateauCheck()");
  ok("plateau message has no failure framing",!/düşmüyor/.test(ev("S.chat[0].text"))&&/yerinde duruyor/.test(ev("S.chat[0].text")));
  finish();
})();
