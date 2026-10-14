const {ok,finish}=require("./ok");
const H=require("../www/modules/history/historylib.js");
const dk=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const E=(type,day,v,text="",o={})=>({id:1,day,time:"12:00",type,v,text,...o});
const S={entries:[
  E("food","2026-10-01",900,"Tavuk pilav"),E("food","2026-10-01",1200,"Yoğurt"),E("food","2026-10-02",500,"Çorba"),
  E("water","2026-10-01",750),E("water","2026-10-01",330,"",{dr:"coffee"}),E("exercise","2026-10-02",40,"Yürüyüş"),
  E("weight","2026-10-01",82),E("weight","2026-10-20",80.5),E("steps","2026-10-02",7000),E("note","2026-10-03",null,"Baş ağrısı vardı"),
  E("food","2024-03-05",2000,"Izgara ÇİĞKÖFTE")
],workouts:[{id:5,day:"2026-10-02",t0:1,t1:2,name:"Göğüs günü",ex:[]},{id:6,day:"2026-10-04",t0:1,t1:null,name:"Bitmedi",ex:[]}],
sleep:[{day:"2026-10-01",min:420}],mood:[{day:"2026-10-01",v:4}],vitals:[{day:"2026-10-05",k:"t"},{day:"2026-10-05",k:"s"}],
pulse:[{day:"2026-10-06"}],hr:[{day:"2026-10-07",a:60}],medLog:[{day:"2026-10-08",st:"t"},{day:"2026-10-08",st:"s"}],moves:[],labs:[],measures:[{day:"2026-10-09"}],
fast:{log:[{t0:0,t1:new Date(2026,9,10,12).getTime()}]}};
const ix=H.index(S,dk),g=d=>ix.get(d);
ok("day summary: food count and calories, water counts only water (coffee excluded)",g("2026-10-01").food===2&&g("2026-10-01").kcal===2100&&g("2026-10-01").water===750&&g("2026-10-01").drink===1,g("2026-10-01"));
ok("exercise minutes, steps, note, weight",g("2026-10-02").exercise===40&&g("2026-10-02").steps===7000&&g("2026-10-03").note===1&&g("2026-10-01").weight===82);
ok("only finished workouts count",g("2026-10-02").wo===1&&!g("2026-10-04"));
ok("sleep, mood, blood pressure, glucose, pulse, hourly pulse, meds (taken only), measures, fast",g("2026-10-01").sleep===420&&g("2026-10-01").mood===4&&g("2026-10-05").bp===1&&g("2026-10-05").glucose===1&&g("2026-10-06").pulse===1&&g("2026-10-07").hr===60&&g("2026-10-08").meds===1&&g("2026-10-09").measures===1&&g("2026-10-10").fast===1,[...ix.keys()]);
ok("marks: logged day has main types, steps alone is \"other\", an empty day has none",JSON.stringify(H.marks(g("2026-10-01")).main)==='["food","water","weight"]'&&H.marks(g("2026-10-01")).other&&H.marks(g("2026-10-02")).main.includes("exercise")&&H.marks(g("2026-10-03")).other&&H.marks(g("2026-10-03")).main.length===0&&!H.marks(undefined).other);
{const m=H.month(ix,"2026-10");
 ok("month summary: logged days, calorie average over days above 800 only, water, exercise, first and last weight",m.days===10&&m.kcalAvg===2100&&m.waterAvg===750&&m.exercise===40&&m.wo===1&&m.weightFirst===82&&m.weightLast===80.5&&m.weightN===2,m);}
ok("months: newest first, a month two years back is listed too",H.months(ix).map(x=>x.ym).join()==="2026-10,2024-03");
ok("oldest and newest day",H.span(ix).first==="2024-03-05"&&H.span(ix).last==="2026-10-20");
{const r=H.search(S,"cigkofte");ok("search: ignores case and Turkish letter variants, finds entries from two years ago",r.total===1&&r.items[0].day==="2024-03-05",r);
 ok("search: notes and workout names, newest first",H.search(S,"agri").total===1&&H.search(S,"GÖĞÜS").items[0].type==="wo"&&H.search(S,"pil").items[0].text==="Tavuk pilav");
 ok("search: under 2 characters gives nothing, no match gives 0",H.search(S,"a").total===0&&H.search(S,"zzzz").total===0);
 const big=Array.from({length:500},(_,i)=>E("food","2025-01-01",300,"tavuk"+i));ok("search: result limit, correct total",H.search({entries:big,workouts:[],vitals:[],mood:[],medLog:[],moves:[],labs:[],measures:[]},"tavuk",300).items.length===300&&H.search({entries:big,workouts:[],vitals:[],mood:[],medLog:[],moves:[],labs:[],measures:[]},"tavuk",300).total===500);}
{const many=[];for(let i=0;i<1100*8;i++){const d=new Date(2023,0,1+Math.floor(i/8));many.push(E(i%3?"food":"water",dk(d),i%3?400:250,"x"+i))}
 const t=Date.now(),i2=H.index({entries:many,workouts:[],vitals:[],mood:[],medLog:[],moves:[],labs:[],measures:[],sleep:[],mood:[],pulse:[],hr:[],fast:{log:[]}},dk);H.months(i2);ok("3 years x 8 entries/day: index and months in under 1 s",Date.now()-t<1000&&i2.size===1100,[Date.now()-t,i2.size]);}
{ // personal normal band
  const day=n=>"2026-09-"+String(n).padStart(2,"0"),steady=[],S2={entries:[],workouts:[],sleep:[],mood:[],vitals:[],pulse:[],hr:[],medLog:[],moves:[],labs:[],measures:[],fast:{log:[]}};
  for(let i=1;i<=20;i++)S2.entries.push(E("steps",day(i),7000+(i%5)*100));
  const base=H.index(S2,dk);
  ok("normal band: under 14 recorded days there is no band",H.normal(H.index({...S2,entries:S2.entries.slice(0,13)},dk),"2026-09").steps===undefined);
  const flat=H.normal(base,"2026-09").steps;
  ok("normal band: a steady series has a band around its median and flags nothing",flat.n===20&&flat.med===7200&&flat.low.length===0&&flat.high.length===0&&flat.lo<7000&&flat.hi>7400,flat);
  S2.entries.push(E("steps",day(21),1500),E("steps",day(22),15000));
  const odd=H.normal(H.index(S2,dk),"2026-09").steps;
  ok("normal band: one very low and one very high day are flagged, a single outlier does not move the band",odd.low.join()===day(21)&&odd.high.join()===day(22)&&odd.med===7200,odd);
  ok("normal band: only the asked month's days are listed (the band itself uses the last 56 days), calories need 800 kcal and over",H.normal(H.index(S2,dk),"2026-10").steps.low.length===0&&H.normal(H.index(S2,dk),"2026-11").steps===undefined&&H.normal(base,"2026-09").kcal===undefined);
}
finish();
