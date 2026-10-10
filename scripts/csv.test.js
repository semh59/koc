const {ok,finish}=require("./ok");
const C=require("../www/modules/data/csvlib.js");
const out=C.csv(["a","b"],[["x",80.5],["y",1500.25]]);
ok("BOM, ; separator, CRLF, decimal comma, no thousands separator",out==="\uFEFFa;b\r\nx;80,5\r\ny;1500,25\r\n",out);
ok("formula injection: text starting with = + - @ tab or CR gets a leading '",["=HYPERLINK(\"http://x\")","+1","-2 kg","@SUM(A1)","\tx","\rx"].every(v=>C.cell(v).replace(/^"/,"").startsWith("'")),["=1","+1"].map(C.cell));
ok("numbers are untouched: a negative number gets no '; plain text is unchanged",C.cell(-5)==="-5"&&C.cell("ekmek")==="ekmek"&&C.cell("a=b")==="a=b");
ok("a cell with ; \" or a line break is quoted and quotes are doubled",C.cell("a;b")==='"a;b"'&&C.cell('x"y')==='"x""y"'&&C.cell("a\nb")==='"a\nb"'&&C.cell("=A;B")==='"\'=A;B"');
ok("empty, null and NaN give an empty cell",[C.cell(null),C.cell(undefined),C.cell(NaN),C.cell("")].every(x=>x===""));
const S={entries:[{id:2,day:"2026-10-02",time:"09:00",type:"weight",v:80.5,text:""},{id:1,day:"2026-10-01",time:"20:00",type:"food",v:300,text:"=cmd|' /C calc'!A0",p:12.5,c:30,f:5},{id:3,day:"2026-10-02",time:"08:00",type:"note",v:null,text:"uyku;kötü"},{id:4,day:"2026-10-02",time:"10:00",type:"steps",v:4000,text:""}],
  workouts:[{id:1,day:"2026-10-01",t0:5,t1:9,name:"A",ex:[{id:"squat",sets:[{kg:20,reps:10,done:true,w:true},{kg:60,reps:8,done:true,rpe:8.5},{kg:60,reps:8,done:false}]},{id:"plank",sets:[{kg:null,reps:null,sec:45,done:true}]}]}],
  vitals:[{k:"t",day:"2026-10-01",time:"08:00",sys:120,dia:80,pulse:70,session:"morning"},{k:"s",day:"2026-10-01",time:"07:00",g:95.5,ctx:"fasting",note:"-düşük"}],
  sleep:[{day:"2026-10-01",min:450,q:4}],mood:[{day:"2026-10-01",v:4}],fast:{plan:16,t0:null,log:[{t0:new Date(2026,9,1,20,0).getTime(),t1:new Date(2026,9,2,12,30).getTime()}]},
  meds:[{id:1,n:"Vitamin D",d:"1000 IU",t:["09:00"]}],medLog:[{m:1,day:"2026-10-01",slot:"09:00",st:"t",at:"09:10"},{m:1,day:"2026-10-02",slot:"09:00",st:"s"}],measures:[],pulse:[],hr:[]};
const F=C.files(S,{exName:id=>({squat:"Squat",plank:"Plank"}[id]),vctx:r=>r.k==="t"?"Sabah":"Açlık"});
const g=k=>F.find(f=>f.key===k).build().split("\r\n").slice(0,-1);
ok("9 separate files with row counts: log, workout, health, recipes, sleep, mood, fast, meds, pulse",F.map(f=>f.key+f.n).join()==="kayitlar4,antrenman3,saglik2,tarifler0,uyku1,ruh1,oruc1,ilac2,nabiz0",F.map(f=>f.key+f.n));
ok("log: sorted by date-time, unit, macros, steps type, note without value, text injection blocked",g("kayitlar").slice(1).join("|")==="2026-10-01;20:00;yemek;300;kcal;'=cmd|' /C calc'!A0;12,5;30;5;;;|2026-10-02;08:00;not;;;\"uyku;kötü\";;;;;;|2026-10-02;09:00;kilo;80,5;kg;;;;;;;|2026-10-02;10:00;adım;4000;adım;;;;;;;",g("kayitlar"));
ok("workout: only completed sets, set number, warm-up and rpe, duration for timed sets",g("antrenman").slice(1).join("|")==="2026-10-01;A;Squat;1;20;10;;;evet;;|2026-10-01;A;Squat;2;60;8;;8,5;;;|2026-10-01;A;Plank;1;;;45;;;;",g("antrenman"));
ok("health: blood pressure and glucose, context, a note starting with '-' is kept",g("saglik").slice(1).join("|")==="2026-10-01;07:00;şeker;;;;95,5;Açlık;'-düşük|2026-10-01;08:00;tansiyon;120;80;70;;Sabah;",g("saglik"));
ok("sleep hours with decimal comma; mood; fast in ISO local time with duration; med name, dose, status",g("uyku")[1]==="2026-10-01;450;7,5;4"&&g("ruh")[1]==="2026-10-01;4;"&&g("oruc")[1]==="2026-10-01T20:00;2026-10-02T12:30;16,5"&&g("ilac").slice(1).join("|")==="2026-10-01;09:00;Vitamin D;1000 IU;alındı;09:10|2026-10-02;09:00;Vitamin D;1000 IU;atlandı;");
{const t=C.files(Object.assign({},S,{recipes:[{n:"Köfte",s:4,items:[{n:"Kıyma",g:250,k:239,p:26},{n:"Bulgur",g:50.5,k:342}]}]}),{exName:x=>x,vctx:()=>""}).find(f=>f.key==="tarifler").build().split("\r\n");
ok("recipes: one row per ingredient, decimal comma, missing values empty",t.length===4&&t[1]==="Köfte;4;Kıyma;250;239;26;;;;;"&&t[2]==="Köfte;4;Bulgur;50,5;342;;;;;;",t);}
ok("empty data: 0 rows, header only",C.files({entries:[],workouts:[],vitals:[],sleep:[],mood:[],fast:{log:[]},meds:[],medLog:[],measures:[],pulse:[],hr:[]},{}).every(f=>f.n===0&&f.build().split("\r\n").length===2));
{const W=[{id:1,day:"2026-10-01",t0:5,t1:9,name:"A",ex:[{id:"a",ss:2,sets:[{kg:40,reps:12,done:true,t:"d"},{kg:40,reps:5,done:true,t:"f"}]},{id:"b",ss:2,sets:[{kg:10,reps:5,done:true}]}]}];
const g2=C.files({entries:[],workouts:W,vitals:[],sleep:[],mood:[],fast:{log:[]},meds:[],medLog:[],measures:[],pulse:[],hr:[]},{exName:x=>x.toUpperCase()}).find(f=>f.key==="antrenman").build().split("\r\n").slice(1,-1);
ok("workout CSV: set type (drop, failure) and superset group number",g2.join("|")==="2026-10-01;A;A;1;40;12;;;;drop;2|2026-10-01;A;A;2;40;5;;;;başarısızlık;2|2026-10-01;A;B;1;10;5;;;;;2",g2);}
{const f=C.files({entries:[],workouts:[],vitals:[],sleep:[],mood:[],fast:{log:[]},meds:[],medLog:[],measures:[{day:"2026-10-01",k:"waist",v:80},{day:"2026-10-01",k:"chest",v:100}],pulse:[],hr:[]},{}).find(x=>x.key==="kayitlar").build();
ok("measure rows carry the lowercase Turkish region name",f.includes("ölçü_bel")&&f.includes("ölçü_göğüs")&&!f.includes("undefined"),f);}
finish();
