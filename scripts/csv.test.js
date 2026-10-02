const C=require("../www/csvlib.js");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const out=C.csv(["a","b"],[["x",80.5],["y",1500.25]]);
ok("BOM, ; ayırıcı, CRLF, ondalık virgül, binlik ayırıcı yok",out==="﻿a;b\r\nx;80,5\r\ny;1500,25\r\n",out);
ok("formül enjeksiyonu: = + - @ sekme CR ile başlayan metne ' konur",["=HYPERLINK(\"http://x\")","+1","-2 kg","@SUM(A1)","\tx","\rx"].every(v=>C.cell(v).replace(/^"/,"").startsWith("'")),["=1","+1"].map(C.cell));
ok("sayıya dokunulmaz: negatif sayı ' almaz; normal metin değişmez",C.cell(-5)==="-5"&&C.cell("ekmek")==="ekmek"&&C.cell("a=b")==="a=b");
ok("; \" ve satır sonu içeren hücre tırnaklanır, tırnak ikilenir",C.cell("a;b")==='"a;b"'&&C.cell('x"y')==='"x""y"'&&C.cell("a\nb")==='"a\nb"'&&C.cell("=A;B")==='"\'=A;B"');
ok("boş, null ve NaN boş hücre",[C.cell(null),C.cell(undefined),C.cell(NaN),C.cell("")].every(x=>x===""));
const S={entries:[{id:2,day:"2026-10-02",time:"09:00",type:"kilo",v:80.5,text:""},{id:1,day:"2026-10-01",time:"20:00",type:"yemek",v:300,text:"=cmd|' /C calc'!A0",p:12.5,c:30,f:5},{id:3,day:"2026-10-02",time:"08:00",type:"not",v:null,text:"uyku;kötü"},{id:4,day:"2026-10-02",time:"10:00",type:"adim",v:4000,text:""}],
  workouts:[{id:1,day:"2026-10-01",t0:5,t1:9,name:"A",ex:[{id:"squat",sets:[{kg:20,reps:10,done:true,w:true},{kg:60,reps:8,done:true,rpe:8.5},{kg:60,reps:8,done:false}]},{id:"plank",sets:[{kg:null,reps:null,sec:45,done:true}]}]}],
  vitals:[{k:"t",day:"2026-10-01",time:"08:00",sys:120,dia:80,nabiz:70,ses:"sabah"},{k:"s",day:"2026-10-01",time:"07:00",g:95.5,ctx:"acl",not:"-düşük"}],
  sleep:[{day:"2026-10-01",min:450,q:4}],mood:[{day:"2026-10-01",v:4}],fast:{plan:16,t0:null,log:[{t0:new Date(2026,9,1,20,0).getTime(),t1:new Date(2026,9,2,12,30).getTime()}]},
  meds:[{id:1,n:"Vitamin D",d:"1000 IU",t:["09:00"]}],medLog:[{m:1,day:"2026-10-01",slot:"09:00",st:"t",at:"09:10"},{m:1,day:"2026-10-02",slot:"09:00",st:"s"}]};
const F=C.files(S,{exName:id=>({squat:"Squat",plank:"Plank"}[id]),vctx:r=>r.k==="t"?"Sabah":"Açlık"});
const g=k=>F.find(f=>f.key===k).build().split("\r\n").slice(0,-1);
ok("7 ayrı dosya: kayıtlar, antrenman, sağlık, uyku, ruh hali, oruç, ilaç; satır sayıları",F.map(f=>f.key+f.n).join()==="kayitlar4,antrenman3,saglik2,uyku1,ruh1,oruc1,ilac2",F.map(f=>f.key+f.n));
ok("kayıtlar: tarihe-saate göre sıralı, birim, makrolar, adım türü, not değersiz, metin enjeksiyonu engelli",g("kayitlar").slice(1).join("|")==="2026-10-01;20:00;yemek;300;kcal;'=cmd|' /C calc'!A0;12,5;30;5;;;|2026-10-02;08:00;not;;;\"uyku;kötü\";;;;;;|2026-10-02;09:00;kilo;80,5;kg;;;;;;;|2026-10-02;10:00;adım;4000;adım;;;;;;;",g("kayitlar"));
ok("antrenman: yalnız tamamlanan setler, set sıra numarası, ısınma ve rpe, süreli sette süre",g("antrenman").slice(1).join("|")==="2026-10-01;A;Squat;1;20;10;;;evet|2026-10-01;A;Squat;2;60;8;;8,5;|2026-10-01;A;Plank;1;;;45;;",g("antrenman"));
ok("sağlık: tansiyon ve şeker, bağlam, '-' ile başlayan not korunur",g("saglik").slice(1).join("|")==="2026-10-01;07:00;şeker;;;;95,5;Açlık;'-düşük|2026-10-01;08:00;tansiyon;120;80;70;;Sabah;",g("saglik"));
ok("uyku saat ondalık virgülle; ruh hali; oruç ISO yerel saat ve süre; ilaç adı, doz, durum",g("uyku")[1]==="2026-10-01;450;7,5;4"&&g("ruh")[1]==="2026-10-01;4;"&&g("oruc")[1]==="2026-10-01T20:00;2026-10-02T12:30;16,5"&&g("ilac").slice(1).join("|")==="2026-10-01;09:00;Vitamin D;1000 IU;alındı;09:10|2026-10-02;09:00;Vitamin D;1000 IU;atlandı;");
ok("boş veri: satır sayısı 0, yalnız başlık",C.files({entries:[],workouts:[],vitals:[],sleep:[],mood:[],fast:{log:[]},meds:[],medLog:[]},{}).every(f=>f.n===0&&f.build().split("\r\n").length===2));
process.exit(bad?1:0);
