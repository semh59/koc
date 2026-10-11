const {ok,finish}=require("./ok");
const R=require("../www/modules/data/csvreadlib.js"),C=require("../www/modules/data/csvlib.js");
const T="2026-10-06",rd=(t,o)=>R.read("﻿"+t,{today:T,...o}),empty={wDays:new Set(),t:new Set(),s:[]};

{ // recognition and formats
  let r=rd("tarih;kilo\n2026-09-01;82,4\n2026-09-02;81.9\n");
  ok("weight: semicolon, decimal comma and dot, ISO date",r.rows.w.length===2&&r.rows.w[0].v===82.4&&r.rows.w[1].v===81.9,r);
  r=rd("Date,Weight\n15.03.2024,80\n16.03.2024,79.5\n");
  ok("a dot date is day-first",r.rows.w[0].day==="2024-03-15"&&!r.askDate,r);
  r=rd("tarih,kilo\n15/03/2024,80\n03/04/2024,79\n");
  ok("a part above 12 settles the slash order for the whole file",r.rows.w[0].day==="2024-03-15"&&r.rows.w[1].day==="2024-04-03"&&!r.askDate,r);
  r=rd("tarih,kilo\n03/04/2024,80\n05/06/2024,79\n");
  ok("all-small slash dates are ambiguous: asks, and the answer decides",r.askDate&&rd("tarih,kilo\n03/04/2024,80\n05/06/2024,79\n",{order:"mdy"}).rows.w[0].day==="2024-03-04"&&r.rows.w[0].day==="2024-04-03");
  ok("a file with both orders is refused",!!rd("tarih,kilo\n15/03/2024,80\n03/15/2024,79\n").err);
  r=rd("tarih,kilo\n45201,80\n"+new Date(2026,8,3,12,0).getTime()+",81\n2026-09-04T22:30:00Z,82\n");
  ok("Excel serial, epoch milliseconds and a zoned timestamp read in the local calendar",r.rows.w[0].day==="2023-10-02"&&r.rows.w[1].day==="2026-09-03"&&r.rows.w.length===3,r.rows.w);
  r=rd("tarih,kilo\n2026-09-01,15\n2026-09-02,500\n2026-12-01,80\n1980-01-01,80\nxx,80\n");
  ok("out-of-range weight, future, ancient and unreadable dates are counted, not added",r.rows.w.length===0&&r.bad.length===5,r.bad);
  ok("an unrecognised file is told so, not guessed",/tanıyamadım/.test(rd("a,b\n1,2\n").err)&&/tanıyamadım/.test(rd("x;y\n").err));
  ok("more than 5000 rows are refused",!!rd("tarih,kilo\n"+"2026-09-01,80\n".repeat(5001)).err);
}
{ // units
  let r=rd("tarih,kilo_lb\n2026-09-01,180\n");
  ok("weight: a lb header converts",r.rows.w[0].v===81.6&&!r.askW,r);
  r=rd("tarih,kilo\n2026-09-01,180\n2026-09-02,185\n");
  ok("weight: unstated values all above 120 ask for the unit; the answer converts",r.askW&&r.rows.w[0].v===180&&rd("tarih,kilo\n2026-09-01,180\n",{wUnit:"lb"}).rows.w[0].v===81.6);
  ok("glucose: an mmol/L header converts to mg/dL",rd("tarih;saat;şeker_mmoll\n2026-09-01;08:00;5,6\n").rows.s[0].g===100.9);
  r=rd("tarih;saat;şeker_mgdl\n2026-09-01;08:00;5,6\n");
  ok("glucose: an mg/dL header keeps the value and rejects an impossible one",r.rows.s.length===0&&r.bad.length===1);
  r=rd("tarih;saat;şeker\n2026-09-01;08:00;5,6\n2026-09-02;08:00;6,1\n");
  ok("glucose: unstated small values are mmol/L, large are mg/dL, the middle asks",r.rows.s[0].g===100.9&&rd("tarih;saat;şeker\n2026-09-01;08:00;95\n").rows.s[0].g===95&&rd("tarih;saat;şeker\n2026-09-01;08:00;28\n").askG,r);
}
{ // blood pressure
  let r=rd("tarih;saat;sistolik;diyastolik;nabız\n2026-09-01;07:30;120;80;70\n2026-09-01;19:00;130;85;\n");
  ok("pressure: columns, optional pulse, no invented session",r.rows.t.length===2&&r.rows.t[0].pulse===70&&r.rows.t[1].pulse===undefined&&r.rows.t.every(x=>x.session==="other"),r);
  r=rd("tarih;saat;tansiyon\n2026-09-01;07:30;125/82\n");
  ok("pressure: a single 120/80 cell is split",r.rows.t[0].sys===125&&r.rows.t[0].dia===82,r);
  r=rd("tarih;sistolik;diyastolik\n2026-09-01;120;80\n");
  ok("pressure without a time gets 12:00 and is counted",r.rows.t[0].time==="12:00"&&r.noTime===1);
  r=rd("tarih;saat;sistolik;diyastolik\n2026-09-01;07:30;80;120\n2026-09-01;07:31;400;80\n");
  ok("swapped or out-of-range pressure is rejected with a reason",r.rows.t.length===0&&r.bad.length===2&&r.bad.every(b=>b.why.length>5),r.bad);
  r=rd("tarih,saat,sistolik,diyastolik\n2026-09-01,08:00,=1+1,80\n");
  ok("a formula-looking cell reads as a bad number, never evaluated",r.rows.t.length===0&&r.bad.length===1);
}
{ // plan: duplicates
  const r=rd("tarih;saat;sistolik;diyastolik\n2026-09-01;07:30;120;80\n2026-09-01;07:30;120;80\n2026-09-02;07:30;118;78\n");
  const p=R.plan(r,{...empty,t:new Set(["2026-09-02|07:30|118|78"])});
  ok("plan: a pressure row already stored or repeated in the file is skipped and counted",p.add.t.length===1&&p.dup===2&&p.total===1,p);
  const w=R.plan(rd("tarih;kilo\n2026-09-01;80\n2026-09-01;81\n2026-09-02;79\n"),{...empty,wDays:new Set(["2026-09-02"])});
  ok("plan: one weight per day; the user's own weight wins; first of the file wins",w.add.w.length===1&&w.add.w[0].v===80&&w.dup===2,w);
  const g=R.plan(rd("tarih;saat;şeker_mgdl\n2026-09-01;08:00;100\n2026-09-01;09:00;120\n"),{...empty,s:[{day:"2026-09-01",time:"08:00",g:100.5}]});
  ok("plan: glucose within 1 mg/dL at the same time counts as the same reading",g.add.s.length===1&&g.add.s[0].g===120&&g.dup===1,g);
}
{ // round trip of the app's own export
  const text="﻿"+["tarih;saat;tür;sistolik;diyastolik;nabız;şeker_mmoll;ölçüm_zamanı;not",
    "2026-09-01;07:30;tansiyon;120;80;70;;Sabah;",
    "2026-09-01;08:00;şeker;;;;5,6;Açlık;"].join("\n");
  const r=R.read(text,{today:T});
  ok("own health export: types, session and context names are read back",r.rows.t[0].session==="morning"&&r.rows.t[0].sys===120&&r.rows.s[0].ctx==="fasting"&&r.rows.s[0].g===100.9,r);
  const again=R.plan(r,{wDays:new Set(),t:new Set(["2026-09-01|07:30|120|80"]),s:[{day:"2026-09-01",time:"08:00",g:101}]});
  ok("own export read back into the same data adds nothing (round trip)",again.total===0&&again.dup===2,again);
  const k=R.read("﻿tarih;saat;tür;değer;birim;açıklama\n2026-09-01;07:00;kilo;82,5;kg;\n2026-09-01;12:00;yemek;300;kcal;Pilav\n2026-09-02;07:00;su;250;ml;\n",{today:T});
  ok("own records export: weight rows are taken, food/water rows are ignored without being counted as bad",k.rows.w.length===1&&k.rows.w[0].v===82.5&&k.bad.length===0,k);
}
finish();
