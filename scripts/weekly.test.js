const {ok,finish}=require("./ok");
const W=require("../www/modules/insights/weeklylib.js"),canvas=require("./canvas");
const settings=(o)=>({kcal:2000,waterMl:2500,sportWeek:150,stepGoal:8000,bpOn:false,bsOn:false,bpSysHi:0,bpDiaHi:0,bpSysLo:0,bpDiaLo:0,gFastLo:0,gFastHi:0,gPostLo:0,gPostHi:0,...o});
const E=(type,day,v)=>({type,day,v,text:"",id:1,time:"08:00"});
const end="2026-09-30";
const S={settings:settings({}),entries:[
  E("weight","2026-09-24",82.4),E("weight","2026-09-30",81.9),
  E("food","2026-09-25",1800),E("food","2026-09-25",300),E("food","2026-09-26",1700),
  E("water","2026-09-26",1500),E("water","2026-09-26",750),E("water","2026-09-27",2000),
  E("exercise","2026-09-28",60),E("exercise","2026-09-29",45),
  E("steps","2026-09-29",9000),E("steps","2026-09-30",7000),
  E("food","2026-09-10",5000),E("weight","2026-09-10",99)
],vitals:[]};
const d=W.build(S,end,7);
const sm=Object.fromEntries(d.summary);
ok("7 rows, oldest to newest, day labels",d.rows.length===7&&d.rows[0].day==="2026-09-24"&&d.rows[6].day==="2026-09-30"&&d.rows[6].label==="Çar 30",d.rows.map(r=>r.label));
ok("period title",sm["Dönem"]==="24 Eyl 2026 - 30 Eyl 2026");
ok("weight: first and last reading, signed difference (a real minus sign)",sm["Kilo"]==="82,4 → 81,9 kg (−0,5)",sm["Kilo"]);
ok("records outside the window are excluded (10 September)",!JSON.stringify(sm).includes("99")&&!JSON.stringify(d.rows).includes("5000"));
ok("calories: average of logged days only, the target next to it",sm["Kalori"]==="2 gün kayıt var; ortalama için en az 3 tam kayıtlı (800 kcal üstü) gün gerekir",sm["Kalori"]);
{const k=en=>Object.fromEntries(W.build({...S,entries:en},end,7).summary)["Kalori"],Y=(d,v)=>E("food",d,v);
 ok("calorie average: 3 full days are written; days under 800 are excluded and mentioned; a single 700 day is not an average",
  k([Y("2026-09-25",2100),Y("2026-09-26",1700),Y("2026-09-27",1900)])==="günlük ortalama 1900 kcal (hedef 2000), 3 tam kayıtlı gün"&&
  k([Y("2026-09-25",2100),Y("2026-09-26",1700),Y("2026-09-27",1900),Y("2026-09-28",700)])==="günlük ortalama 1900 kcal (hedef 2000), 3 tam kayıtlı gün; 1 gün 800 kcal altında, ortalamaya katılmadı"&&
  k([Y("2026-09-28",700)])==="1 gün kayıt var; ortalama için en az 3 tam kayıtlı (800 kcal üstü) gün gerekir");}
ok("water: average of daily totals",sm["Su"]==="günlük ortalama 2,1 L (hedef 2,5 L), 2 gün kayıt",sm["Su"]);
ok("exercise: total and day count",sm["Spor"]==="toplam 105 dk (haftalık hedef 150 dk), 2 gün",sm["Spor"]);
ok("the steps row only when there is data",sm["Adım"]&&sm["Adım"].includes("8.000")&&sm["Adım"].includes("2 gün"),sm["Adım"]);
ok("without a target the calorie row has no target",(x=>!x["Kalori"].includes("hedef"))(Object.fromEntries(W.build({...S,settings:settings({kcal:0})},end,7).summary)));
const empty=W.build({settings:settings({}),entries:[],vitals:[]},end,7),se=Object.fromEntries(empty.summary);
ok("an empty week does not crash, rows say \"no records\"",se["Kilo"]==="son 7 günde tartı kaydı yok"&&se["Kalori"]==="yemek kaydı yok"&&se["Su"]==="su kaydı yok"&&se["Spor"]==="spor kaydı yok"&&!se["Adım"]&&empty.rows.every(r=>r.weight==null&&!r.water));
ok("a single weigh-in: \"tek ölçüm\"",Object.fromEntries(W.build({...S,entries:[E("weight","2026-09-28",80)]},end,7).summary)["Kilo"]==="80,0 kg (tek ölçüm)");
ok("with two weigh-ins on the same day the last one is used",W.build({...S,entries:[E("weight","2026-09-30",81),E("weight","2026-09-30",80.5)]},end,7).rows[6].weight===80.5);
ok("a window across a month end yields the right days",W.build(S,"2026-03-03",7).rows[0].day==="2026-02-25"&&W.build(S,"2026-01-02",7).rows[0].day==="2025-12-27");

const vit=[{id:1,k:"t",day:"2026-09-29",time:"08:00",sys:130,dia:84,session:"morning"},{id:2,k:"t",day:"2026-09-30",time:"08:00",sys:134,dia:86,session:"morning"},{id:3,k:"s",day:"2026-09-30",time:"08:00",g:100,ctx:"fasting"},{id:4,k:"s",day:"2026-09-30",time:"13:00",g:160,ctx:"fasting"}];
const off=Object.fromEntries(W.build({...S,vitals:vit},end,7).summary);
ok("with tracking off there is no blood pressure or glucose row",!off["Tansiyon"]&&!off["Şeker"]);
const on=Object.fromEntries(W.build({...S,settings:settings({bpOn:true,bsOn:true,gFastLo:80,gFastHi:130}),vitals:vit},end,7).summary);
ok("with tracking on, the blood pressure average",on["Tansiyon"]==="ortalama 132/85 mmHg (2 ölçüm, 2 gün)",on["Tansiyon"]);
ok("glucose average, no target percentage",on["Şeker"]==="ortalama 130 mg/dL (2 ölçüm)",on["Şeker"]);
ok("no row when there are no readings",!Object.fromEntries(W.build({...S,settings:settings({bpOn:true,bsOn:true}),vitals:[]},end,7).summary)["Tansiyon"]);

const meds=[{id:1,n:"A",t:["08:00","20:00"],on:true}],mlog=[{id:1,m:1,day:"2026-09-29",slot:"08:00",st:"t"},{id:2,m:1,day:"2026-09-29",slot:"20:00",st:"t"},{id:3,m:1,day:"2026-09-30",slot:"08:00",st:"s"}];
const medS=settings({medOn:true});
const mo=Object.fromEntries(W.build({...S,settings:medS,meds,medLog:mlog},end,7,"23:59").summary);
ok("medication adherence row: taken / total, missed, pending today (not missed) and skipped",mo["İlaç uyumu"]==="%15 (2 / 13 doz alındı, 10 kaçırılan, 1 bugün bekliyor, 1 atlanan)",mo["İlaç uyumu"]);
ok("no medication row with tracking off or without medications",!Object.fromEntries(W.build({...S,settings:settings({medOn:false}),meds,medLog:mlog},end,7).summary)["İlaç uyumu"]&&!Object.fromEntries(W.build({...S,settings:medS,meds:[],medLog:[]},end,7).summary)["İlaç uyumu"]);
ok("a dose whose time has not come today is not counted (12:00)",Object.fromEntries(W.build({...S,settings:medS,meds,medLog:mlog},end,7,"12:00").summary)["İlaç uyumu"]==="%15 (2 / 13 doz alındı, 10 kaçırılan, 1 atlanan)");

const {ctx,drawn}=canvas();
W.drawPage(ctx,d,{today:"2026-10-01"});
ok("drawing: title, summary rows, table headers and days, warning note",drawn.includes("NeoWell · Son 7 gün raporu")&&drawn.includes("Kilo")&&drawn.includes("Spor (dk)")&&drawn.includes("Çar 30")&&drawn.some(t=>/Tıbbi yorum içermez/.test(t))&&drawn.some(t=>t.includes("1 Eki 2026")),drawn.slice(0,12));
ok("drawing: table values (1,800+300 kcal makes the day total 2100)",drawn.includes("2100")&&drawn.includes("9.000")&&drawn.includes("81,9"));
const n0=drawn.length;W.drawPage(ctx,empty,{today:"2026-10-01"});const d2=drawn.slice(n0);
ok("an empty week draws without crashing, header and footer are drawn",d2.some(t=>/Son \d+ gün raporu/.test(t))&&d2.includes("NeoWell"),d2);
ok("no commentary or diagnostic wording",!/hipertansiyon|diyabet|hipoglisemi|anormal|tehlikeli|iyi gidiyor|kötü|başarılı|yetersiz|fazla|az yedin/i.test(drawn.join(" ")+JSON.stringify(d.summary)));
{
  const T=(day,sys,dia)=>({id:1,k:"t",day,time:"08:00",sys,dia,session:"morning"});
  const vit=[T("2026-09-26",120,80),T("2026-09-26",130,84),T("2026-09-28",126,82),T("2026-09-30",132,86),{id:9,k:"t",day:"2026-09-10",time:"08:00",sys:200,dia:120,session:"morning"}];
  const SB={...S,settings:settings({bpOn:true}),vitals:vit},c=W.build(SB,end,7).charts;
  ok("with weight and blood pressure data there are two charts (weight, blood pressure)",c.length===2&&c[0].title.startsWith("Kilo")&&c[1].title.startsWith("Tansiyon"),c.map(x=>x.title));
  ok("blood pressure chart: daily average, no reading outside the window, two series",c[1].series[0].pts.length===3&&c[1].series[0].pts[0].v===125&&Math.max(...c[1].series[0].pts.map(p=>p.v))<200&&c[1].series.length===2);
  ok("readable in black and white: series differ by shape, line style and direct label (not by color alone)",c[1].series[0].shape!==c[1].series[1].shape&&!c[1].series[0].dash&&c[1].series[1].dash&&c[1].series.every(x=>x.short)&&c[1].series[0].color!==c[1].series[1].color);
  ok("colors match the app: weight prim, systolic ink, diastolic water",c[0].series[0].color===require("../www/kernel/algo.js").PAGE.c.prim&&c[1].series[0].color===require("../www/kernel/algo.js").PAGE.c.ink&&c[1].series[1].color===require("../www/kernel/algo.js").PAGE.c.water);
  ok("no band or note on the blood pressure chart (not interpreted)",!c[1].note&&!c[1].band&&!("band" in c[0]));
  ok("no section without data: single weigh-in, tracking off, readings on one day",W.build({...S,entries:[E("weight","2026-09-28",80)],settings:settings({bpOn:true}),vitals:[T("2026-09-28",120,80)]},end,7).charts.length===0&&W.build({...S,settings:settings({bpOn:false}),vitals:vit},end,7).charts.length===1&&W.build({settings:settings({}),entries:[],vitals:[]},end,7).charts.length===0);
  const rec=data=>{const {ctx,drawn:t,calls}=canvas(x=>String(x).length*10);W.drawPage(ctx,data,{today:end});return {t,calls}};
  const r1=rec(W.build(SB,end,7)),r0=rec(W.build({settings:settings({}),entries:[],vitals:[]},end,7));
  ok("the page draws chart titles and labels; setLineDash is used for the dashed line",r1.t.includes("Kilo (kg)")&&r1.t.includes("Sistolik")&&r1.t.includes("Diyastolik")&&!r1.t.some(x=>/referans/.test(x))&&r1.calls.includes("setLineDash"));
  ok("no chart title is drawn without data",r0.t.filter(x=>x==="Kilo (kg)").length===1&&!r0.t.some(x=>/^Tansiyon \(/.test(x))&&!r0.calls.includes("setLineDash")&&r1.t.filter(x=>x==="Kilo (kg)").length===2);
}
finish();
