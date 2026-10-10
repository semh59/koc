const {ok,finish}=require("./ok");
const V=require("../www/modules/vitals/vitalslib.js"),canvas=require("./canvas");
const T=(o)=>({k:"t",day:"2026-09-10",time:"08:00",sys:120,dia:80,session:"morning",...o});
const G=(o)=>({k:"s",day:"2026-09-10",time:"08:00",g:95,ctx:"fasting",...o});
const chk=x=>V.check(x);

for(const [n,x,good] of [
  ["blood pressure normal",T({}),true],["systolic 300 at the limit",T({sys:300,dia:100}),true],["systolic 301",T({sys:301}),false],["systolic 49",T({sys:49,dia:30}),false],
  ["diastolic 29",T({dia:29}),false],["diastolic 200 at the limit",T({sys:250,dia:200}),true],["systolic = diastolic",T({sys:80,dia:80}),false],["systolic < diastolic",T({sys:70,dia:90}),false],
  ["not a number",T({sys:"120"}),false],["NaN",T({sys:NaN}),false],["pulse 24",T({pulse:24}),false],["pulse 250 at the limit",T({pulse:250}),true],["no pulse",T({pulse:undefined}),true],
  ["glucose 20 at the limit",G({g:20}),true],["glucose 19",G({g:19}),false],["glucose 800 at the limit",G({g:800}),true],["glucose 801",G({g:801}),false],["glucose as text",G({g:"95"}),false],
  ["bad day",T({day:"2026-13-40"}),false],["bad time",T({time:"25:00"}),false],["unknown kind",{k:"x",day:"2026-09-10",time:"08:00"},false],["null",null,false]
])ok("validation: "+n,!!chk(x).row===good,chk(x));
ok("an unknown context becomes random, an unknown session becomes other",chk(G({ctx:"x"})).row.ctx==="random"&&chk(T({session:"x"})).row.session==="other");
ok("a note is cut to 80 characters, an empty note is dropped",chk(G({note:"a".repeat(200)})).row.note.length===80&&chk(G({note:"  "})).row.note===undefined);
ok("the session id allows only safe characters",chk(T({sid:"abc123"})).row.sid==="abc123"&&chk(T({sid:"A B!"})).row.sid===undefined);
ok("values are rounded (glucose 1 decimal, blood pressure integer)",chk(G({g:95.46})).row.g===95.5&&chk(T({sys:120.4,dia:79.6})).row.sys===120);

const cl=V.clean([T({}),T({}),T({sys:999}),null,"x",G({}),G({g:130,ctx:"after"}),T({sid:"a1"}),T({sid:"a1",sys:124,time:"08:02"})]);
ok("clean: duplicate and invalid rows are dropped, ids are 1..n",cl.length===5&&cl.map(r=>r.id).join()==="1,2,3,4,5",cl);
ok("clean: non-array input returns empty",V.clean(null).length===0&&V.clean("x").length===0&&V.clean({}).length===0);
ok("clean: cleaning its own output again changes nothing",JSON.stringify(V.clean(cl))===JSON.stringify(cl));

const twin=V.clean([T({sid:"tw",i:1,sys:128,dia:82,time:"08:00"}),T({sid:"tw",i:2,sys:128,dia:82,time:"08:00"})]);
ok("two identical readings both survive clean",twin.length===2&&V.sessions(twin)[0].n===2,twin);
ok("identical readings are kept on a second clean too (it runs on every launch)",V.clean(V.clean(twin)).length===2);
ok("in report rows the 1st/2nd reading number comes from the i field",(r=>r[0].c==="Sabah, 1. ölçüm"&&r[1].c==="Sabah, 2. ölçüm")(V.reportRows(twin,"t","2026-09-01","2026-09-30")));
ok("i can only be 1 or 2",V.check(T({i:3})).row.i===undefined&&V.check(T({i:2})).row.i===2);

const rows=V.clean([
  T({day:"2026-09-10",time:"07:30",sys:130,dia:84,pulse:70,sid:"s1",i:1}),T({day:"2026-09-10",time:"07:32",sys:134,dia:86,pulse:72,sid:"s1",i:2}),
  T({day:"2026-09-10",time:"20:00",sys:140,dia:90,session:"evening",sid:"s2",i:1}),T({day:"2026-09-10",time:"20:02",sys:138,dia:88,session:"evening",sid:"s2",i:2}),
  T({day:"2026-09-09",time:"07:30",sys:120,dia:80,sid:"s3",i:1}),T({day:"2026-09-09",time:"07:32",sys:124,dia:82,sid:"s3",i:2}),
  T({day:"2026-09-08",time:"08:00",sys:110,dia:70}),
  T({day:"2026-09-01",time:"08:00",sys:170,dia:100}),
  G({})
]);
const ss=V.sessions(rows);
ok("session: readings with the same session id merge, average and raw values",ss.length===5&&ss.find(s=>s.day==="2026-09-10"&&s.session==="morning").sys===132&&ss.find(s=>s.day==="2026-09-10"&&s.session==="morning").raw.length===2&&ss.find(s=>s.day==="2026-09-10"&&s.session==="morning").pulse===71,ss);
ok("session: the same sid on different days gives separate sessions",V.sessions(V.clean([T({sid:"x",day:"2026-09-10"}),T({sid:"x",day:"2026-09-11"})])).length===2);
ok("session: glucose rows do not count",ss.every(s=>s.sys>100));
const h=V.homeAvg(rows,"2026-09-10",7);
ok("home average: mean of all raw readings in 7 days (the older day is excluded)",h.all.n===7&&Math.abs(h.all.sys-(130+134+140+138+120+124+110)/7)<0.1&&h.days===3&&h.enough===true,h);
ok("home average: morning and evening apart",h.morning.n===5&&h.evening.n===2&&h.evening.sys===139,[h.morning,h.evening]);
ok("home average: not enough with fewer than 3 days",V.homeAvg(rows,"2026-09-09",7).enough===false&&V.homeAvg(rows,"2026-09-09",7).days===2);
ok("home average: window edge (exactly 7 days)",V.homeAvg(rows,"2026-09-08",7).all.n===1&&V.homeAvg(rows,"2026-09-07",7).all.n===1&&V.homeAvg(rows,"2026-09-07",7).all.sys===170&&V.homeAvg(rows,"2026-08-20",7).all===null);
ok("home average: null without data, no crash",V.homeAvg([],"2026-09-10",7).all===null&&V.homeAvg([],"2026-09-10",7).days===0);

ok("check: error codes for a bad kind, a bad date and a glucose out of range",V.check(null).err==="kind"&&V.check(T({day:"x"})).err==="date"&&V.check(G({g:10})).err==="glucose"&&/^Sistolik 50-300, diyastolik 30-200/.test(V.check(T({sys:5})).err)&&/^Nabız 25-250/.test(V.check(T({pulse:5})).err));
ok("latest and cmpAt: newest by day, time, then id; empty list gives undefined",(r=>V.latest(r).id===4&&V.latest([])===undefined&&r.slice().reverse().sort(V.cmpAt).map(x=>x.id).join()==="1,2,3,4")([{id:1,day:"2026-09-09",time:"23:00"},{id:2,day:"2026-09-10",time:"08:00"},{id:3,day:"2026-09-10",time:"09:00"},{id:4,day:"2026-09-10",time:"09:00"}]));
ok("reportRows: a sid row without i is not numbered",(r=>r[0].c==="Sabah")(V.reportRows([T({id:1,sid:"q"})],"t","2026-09-01","2026-09-30")));
ok("newSid always passes the sid check",Array.from({length:200},()=>V.newSid()).every(s=>V.check(T({sid:s})).row.sid===s));
ok("no threshold, flag or preset functions",["flagBp","flagG","rangeG","bpBand","BP_PRESET","G_PRESET"].every(k=>!(k in V)));

const gr=V.clean([G({g:90,time:"07:00"}),G({g:140,time:"08:00"}),G({g:150,ctx:"after",time:"09:00"}),G({g:200,ctx:"after",time:"10:00"}),G({g:250,ctx:"random",time:"11:00"}),G({g:100,day:"2026-08-01"})]);
const st=V.gStats(gr,"2026-09-01","2026-09-30");
ok("glucose summary: count, average, lowest/highest",st.n===5&&Math.abs(st.avg-166)<0.1&&st.min===90&&st.max===250,st);
ok("the glucose summary carries no target percentage",!("pct" in st)&&!("ranged" in st),st);
ok("average by context",st.byCtx.fasting.avg===115&&st.byCtx.after.avg===175&&st.byCtx.random.n===1);
ok("null when the period is empty",V.gStats(gr,"2026-01-01","2026-01-31")===null&&V.gStats([],"2026-01-01","2026-12-31")===null);

const today="2026-10-01";
ok("extreme value: systolic >=180 or diastolic >=120, today only",V.crisis(T({day:today,sys:180,dia:100}),today)&&V.crisis(T({day:today,sys:150,dia:120}),today)&&!V.crisis(T({day:today,sys:179,dia:119}),today));
ok("extreme value: glucose <54 or >400",V.crisis(G({day:today,g:53}),today)&&V.crisis(G({day:today,g:401}),today)&&!V.crisis(G({day:today,g:54}),today)&&!V.crisis(G({day:today,g:400}),today));
ok("extreme value: not shown for a past record",!V.crisis(T({day:"2026-09-29",sys:200,dia:130}),today)&&!V.crisis(G({day:"2026-09-29",g:30}),today));

const prev=V.clean([T({sys:120,dia:80}),G({g:90,ctx:"fasting"}),G({g:200,ctx:"after"})]);
ok("blood pressure: asks when the systolic difference is over 60, not at 60 or less",!!V.needsConfirm(prev,T({sys:181,dia:100}))&&V.needsConfirm(prev,T({sys:180,dia:100}))===null);
ok("glucose: asks when the difference is over 150 in the same context",!!V.needsConfirm(prev,G({g:241,ctx:"fasting"}))&&V.needsConfirm(prev,G({g:240,ctx:"fasting"}))===null);
ok("glucose: no question across different contexts (fasting 90, after meal 250)",V.needsConfirm(prev,G({g:250,ctx:"after"}))===null&&V.needsConfirm(prev,G({g:300,ctx:"bedtime"}))===null);
ok("no question for the first reading",V.needsConfirm([],T({sys:200,dia:100}))===null&&V.needsConfirm([],G({g:500}))===null);

const rr=V.reportRows(rows,"t","2026-09-01","2026-09-30");
ok("report rows: one row per raw reading, sorted by date, with session and reading order",rr.length===8&&rr[0].d==="1 Eyl 2026"&&rr.some(r=>r.c==="Sabah, 1. ölçüm"&&r.v.startsWith("130/84"))&&rr.some(r=>r.c==="Sabah, 2. ölçüm"&&r.v.startsWith("134/86")),rr);
ok("report row: pulse is present, no range marker",rr.some(r=>/nabız 70/.test(r.v))&&rr.every(r=>!("f" in r)));
ok("report: glucose row context and unit",V.reportRows(gr,"s","2026-09-01","2026-09-30").some(r=>r.c==="Yemekten 2 saat sonra"&&r.v==="150 mg/dL"));
ok("report: readings outside the period are left out",V.reportRows(gr,"s","2026-09-01","2026-09-30").length===5);
const pg=V.paginate(200,4);
ok("pagination: all rows are distributed and every page fits",pg.reduce((a,p)=>a+p.n,0)===200&&pg.length>=5&&pg.every(p=>p.n>0),pg);
ok("pagination: a single page for few rows",V.paginate(5,4).length===1&&V.paginate(0,4).length===1);

const {ctx,drawn}=canvas();
const items=rr.slice(0,6),info={kind:"t",title:"NeoWell · Tansiyon raporu",period:"01.09.2026 - 30.09.2026",summary:[["7 gün ev ortalaması","132/85 mmHg (14 ölçüm)"]],rows:rr,chart:{series:[{pts:[{day:"2026-09-08",v:110},{day:"2026-09-10",v:132}],color:"#0f5c52"}],from:"2026-09-01",to:"2026-09-30"},page:1,total:1,today};
V.drawPage(ctx,items,info);
ok("report drawing: title, summary, table and the warning note",drawn.includes("NeoWell · Tansiyon raporu")&&drawn.includes("7 gün ev ortalaması")&&drawn.some(t=>/Bu değerleri hekiminle değerlendir\./.test(t))&&drawn.includes("Sabah, 1. ölçüm"),drawn);
ok("report drawing: no range or marker wording",!drawn.some(t=>/aralığ|▲|▼/.test(t)));
const n0=drawn.length;V.drawPage(ctx,[],{...info,chart:null,page:2,total:2});const d2=drawn.slice(n0);
ok("an empty page and a drawing without a chart do not crash, only the table header and the page footer are drawn",d2.includes("Tarih")&&d2.includes("NeoWell · sayfa 2/2")&&!d2.includes(info.title),d2);

const src=require("fs").readFileSync(require("path").join(__dirname,"../www/modules/vitals/vitalslib.js"),"utf8")+drawn.join(" ");
ok("no diagnostic language is used",!/hipertansiyon|diyabet|hipoglisemi|hiperglisemi|anormal|tehlikeli|hasta(lık)?\b/i.test(src.replace(/\/\*[\s\S]*?\*\//g,"")),src.match(/hipertansiyon|diyabet|hipoglisemi|anormal|tehlikeli/i));
ok("date: 2026-02-31 is rejected",!!V.check(T({day:"2026-02-31"})).err&&!!V.check(G({day:"2026-04-31"})).err&&!!V.check(G({day:"2026-02-28"})).row);
{const big=Array.from({length:5100},(_,i)=>G({g:100,day:"2026-01-01",time:"08:00",note:"n"+i})),c=V.clean(big);
ok("clean: above 5000 rows the oldest record is kept too",c.length===5100&&c[c.length-1].note==="n5099"&&c[0].note==="n0",[c.length,c[0].note]);}
ok("clean: two readings without sid but with different notes are not merged",V.clean([T({note:"a"}),T({note:"b"})]).length===2);
{const s1=V.newSid(),s2=V.newSid(),man=[G({g:100,sid:s1}),G({g:100,sid:s2}),T({sid:V.newSid()}),T({sid:V.newSid()})];
const back=V.clean(JSON.parse(JSON.stringify(V.clean(man))));
ok("two identical manually entered readings in the same minute (glucose and blood pressure) stay two records after backup/launch cleaning",s1!==s2&&back.length===4&&back.filter(r=>r.k==="s").length===2,back);
ok("the same sid and signature (backup merge double counting) becomes one record",V.clean([G({g:100,sid:"ab"}),G({g:100,sid:"ab"})]).length===1);
ok("records without a sid stay as they are, an exact copy without a sid is kept once",V.clean([G({g:90}),G({g:90}),G({g:91})]).length===2&&V.clean([G({g:90})])[0].sid===undefined);
ok("glucose also keeps a safe sid, a bad sid is dropped",V.check(G({sid:"x1"})).row.sid==="x1"&&V.check(G({sid:"A B"})).row.sid===undefined);}
finish();
