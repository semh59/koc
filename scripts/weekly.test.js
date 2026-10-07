const W=require("../www/weeklylib.js");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const settings=(o)=>({kcal:2000,waterMl:2500,sportWeek:150,stepGoal:8000,bpOn:false,bsOn:false,bpSysHi:0,bpDiaHi:0,bpSysLo:0,bpDiaLo:0,gFastLo:0,gFastHi:0,gPostLo:0,gPostHi:0,...o});
const E=(type,day,v)=>({type,day,v,text:"",id:1,time:"08:00"});
const end="2026-09-30";
const S={settings:settings({}),entries:[
  E("kilo","2026-09-24",82.4),E("kilo","2026-09-30",81.9),
  E("yemek","2026-09-25",1800),E("yemek","2026-09-25",300),E("yemek","2026-09-26",1700),
  E("su","2026-09-26",1500),E("su","2026-09-26",750),E("su","2026-09-27",2000),
  E("spor","2026-09-28",60),E("spor","2026-09-29",45),
  E("adim","2026-09-29",9000),E("adim","2026-09-30",7000),
  E("yemek","2026-09-10",5000),E("kilo","2026-09-10",99)
],vitals:[]};
const d=W.build(S,end,7);
const sm=Object.fromEntries(d.summary);
ok("7 satır, eskiden yeniye, gün etiketleri",d.rows.length===7&&d.rows[0].day==="2026-09-24"&&d.rows[6].day==="2026-09-30"&&d.rows[6].label==="Çar 30",d.rows.map(r=>r.label));
ok("dönem başlığı",sm["Dönem"]==="24 Eyl 2026 - 30 Eyl 2026");
ok("kilo: ilk ve son ölçüm, fark işaretli (eksi gerçek eksi işareti)",sm["Kilo"]==="82,4 → 81,9 kg (−0,5)",sm["Kilo"]);
ok("pencere dışı kayıtlar dahil edilmez (10 Eylül)",!JSON.stringify(sm).includes("99")&&!JSON.stringify(d.rows).includes("5000"));
ok("kalori: yalnızca kayıtlı günlerin ortalaması, hedef yan yana",sm["Kalori"]==="2 gün kayıt var; ortalama için en az 3 tam kayıtlı (800 kcal üstü) gün gerekir",sm["Kalori"]);
{const k=en=>Object.fromEntries(W.build({...S,entries:en},end,7).summary)["Kalori"],Y=(d,v)=>E("yemek",d,v);
 ok("kalori ortalaması: 3 tam gün yazılır; 800 altı gün katılmaz ve belirtilir; tek 700 günü ortalama sayılmaz",
  k([Y("2026-09-25",2100),Y("2026-09-26",1700),Y("2026-09-27",1900)])==="günlük ortalama 1900 kcal (hedef 2000), 3 tam kayıtlı gün"&&
  k([Y("2026-09-25",2100),Y("2026-09-26",1700),Y("2026-09-27",1900),Y("2026-09-28",700)])==="günlük ortalama 1900 kcal (hedef 2000), 3 tam kayıtlı gün; 1 gün 800 kcal altında, ortalamaya katılmadı"&&
  k([Y("2026-09-28",700)])==="1 gün kayıt var; ortalama için en az 3 tam kayıtlı (800 kcal üstü) gün gerekir");}
ok("su: gün toplamları ortalaması",sm["Su"]==="günlük ortalama 2,1 L (hedef 2,5 L), 2 gün kayıt",sm["Su"]);
ok("spor: toplam ve gün sayısı",sm["Spor"]==="toplam 105 dk (haftalık hedef 150 dk), 2 gün",sm["Spor"]);
ok("adım satırı yalnızca veri varsa",sm["Adım"]&&sm["Adım"].includes("8.000")&&sm["Adım"].includes("2 gün"),sm["Adım"]);
ok("hedef yoksa kalori satırında hedef yazılmaz",(x=>!x["Kalori"].includes("hedef"))(Object.fromEntries(W.build({...S,settings:settings({kcal:0})},end,7).summary)));
const empty=W.build({settings:settings({}),entries:[],vitals:[]},end,7),se=Object.fromEntries(empty.summary);
ok("boş haftada çökmez, satırlar 'kayıt yok' der",se["Kilo"]==="son 7 günde tartı kaydı yok"&&se["Kalori"]==="yemek kaydı yok"&&se["Su"]==="su kaydı yok"&&se["Spor"]==="spor kaydı yok"&&!se["Adım"]&&empty.rows.every(r=>r.kilo==null&&!r.su));
ok("tek tartı: 'tek ölçüm'",Object.fromEntries(W.build({...S,entries:[E("kilo","2026-09-28",80)]},end,7).summary)["Kilo"]==="80 kg (tek ölçüm)"||Object.fromEntries(W.build({...S,entries:[E("kilo","2026-09-28",80)]},end,7).summary)["Kilo"]==="80,0 kg (tek ölçüm)");
ok("aynı gün iki tartıda sonuncusu alınır",W.build({...S,entries:[E("kilo","2026-09-30",81),E("kilo","2026-09-30",80.5)]},end,7).rows[6].kilo===80.5);
ok("ay sonunu aşan pencere doğru günleri üretir",W.build(S,"2026-03-03",7).rows[0].day==="2026-02-25"&&W.build(S,"2026-01-02",7).rows[0].day==="2025-12-27");

// tansiyon ve şeker satırları: yalnızca ilgili takip açıksa
const vit=[{id:1,k:"t",day:"2026-09-29",time:"08:00",sys:130,dia:84,ses:"sabah"},{id:2,k:"t",day:"2026-09-30",time:"08:00",sys:134,dia:86,ses:"sabah"},{id:3,k:"s",day:"2026-09-30",time:"08:00",g:100,ctx:"acl"},{id:4,k:"s",day:"2026-09-30",time:"13:00",g:160,ctx:"acl"}];
const off=Object.fromEntries(W.build({...S,vitals:vit},end,7).summary);
ok("takip kapalıyken tansiyon ve şeker satırı yok",!off["Tansiyon"]&&!off["Şeker"]);
const on=Object.fromEntries(W.build({...S,settings:settings({bpOn:true,bsOn:true,gFastLo:80,gFastHi:130}),vitals:vit},end,7).summary);
ok("takip açıkken tansiyon ortalaması",on["Tansiyon"]==="ortalama 132/85 mmHg (2 ölçüm, 2 gün)",on["Tansiyon"]);
ok("şeker ortalaması, hedef yüzdesi yok",on["Şeker"]==="ortalama 130 mg/dL (2 ölçüm)",on["Şeker"]);
ok("ölçüm yoksa satır yok",!Object.fromEntries(W.build({...S,settings:settings({bpOn:true,bsOn:true}),vitals:[]},end,7).summary)["Tansiyon"]);

// ilaç uyumu: yalnızca takip açık ve ilaç varsa
const meds=[{id:1,n:"A",t:["08:00","20:00"],on:true}],mlog=[{id:1,m:1,day:"2026-09-29",slot:"08:00",st:"t"},{id:2,m:1,day:"2026-09-29",slot:"20:00",st:"t"},{id:3,m:1,day:"2026-09-30",slot:"08:00",st:"s"}];
const medS=settings({medOn:true});
const mo=Object.fromEntries(W.build({...S,settings:medS,meds,medLog:mlog},end,7,"23:59").summary);
ok("ilaç uyumu satırı: alınan / toplam, kaçırılan, bugün bekleyen (kaçırılan değil) ve atlanan",mo["İlaç uyumu"]==="%15 (2 / 13 doz alındı, 10 kaçırılan, 1 bugün bekliyor, 1 atlanan)",mo["İlaç uyumu"]);
ok("takip kapalıyken ya da ilaç yokken ilaç satırı yok",!Object.fromEntries(W.build({...S,settings:settings({medOn:false}),meds,medLog:mlog},end,7).summary)["İlaç uyumu"]&&!Object.fromEntries(W.build({...S,settings:medS,meds:[],medLog:[]},end,7).summary)["İlaç uyumu"]);
ok("bugünün vakti gelmemiş dozu sayılmaz (saat 12:00)",Object.fromEntries(W.build({...S,settings:medS,meds,medLog:mlog},end,7,"12:00").summary)["İlaç uyumu"]==="%15 (2 / 13 doz alındı, 10 kaçırılan, 1 atlanan)");

// çizim
const drawn=[];const ctx=new Proxy({},{get:(t,k)=>k==="measureText"?()=>({width:100}):k==="fillText"?s=>drawn.push(s):()=>{},set:()=>true});
W.drawPage(ctx,d,{today:"2026-10-01"});
ok("çizim: başlık, özet satırları, tablo başlıkları ve günler, uyarı notu",drawn.includes("NeoWell · Son 7 gün raporu")&&drawn.includes("Kilo")&&drawn.includes("Spor (dk)")&&drawn.includes("Çar 30")&&drawn.some(t=>/Tıbbi yorum içermez/.test(t))&&drawn.some(t=>t.includes("1 Eki 2026")),drawn.slice(0,12));
ok("çizim: tablo değerleri (1.800+300 kcal tek gün toplamı 2100)",drawn.includes("2100")&&drawn.includes("9.000")&&drawn.includes("81,9"));
const n0=drawn.length;W.drawPage(ctx,empty,{today:"2026-10-01"});const d2=drawn.slice(n0);
ok("boş hafta çizimi çökmez, başlık ve altlık çizilir",d2.some(t=>/Son \d+ gün raporu/.test(t))&&d2.includes("NeoWell"),d2);
ok("yorum ve tanı dili yok",!/hipertansiyon|diyabet|hipoglisemi|anormal|tehlikeli|iyi gidiyor|kötü|başarılı|yetersiz|fazla|az yedin/i.test(drawn.join(" ")+JSON.stringify(d.summary)));
{ // C13: haftalık PDF grafikleri
  const T=(day,sys,dia)=>({id:1,k:"t",day,time:"08:00",sys,dia,ses:"sabah"});
  const vit=[T("2026-09-26",120,80),T("2026-09-26",130,84),T("2026-09-28",126,82),T("2026-09-30",132,86),{id:9,k:"t",day:"2026-09-10",time:"08:00",sys:200,dia:120,ses:"sabah"}];
  const SB={...S,settings:settings({bpOn:true}),vitals:vit},c=W.build(SB,end,7).charts;
  ok("kilo ve tansiyon verisi varsa iki grafik (kilo, tansiyon)",c.length===2&&c[0].title.startsWith("Kilo")&&c[1].title.startsWith("Tansiyon"),c.map(x=>x.title));
  ok("tansiyon grafiği günlük ortalama, pencere dışı ölçüm yok, iki seri",c[1].series[0].pts.length===3&&c[1].series[0].pts[0].v===125&&Math.max(...c[1].series[0].pts.map(p=>p.v))<200&&c[1].series.length===2);
  ok("siyah-beyazda okunur: seriler şekil, çizgi biçimi ve doğrudan etiketle ayrılır (yalnız renge bağlı değil)",c[1].series[0].shape!==c[1].series[1].shape&&!c[1].series[0].dash&&c[1].series[1].dash&&c[1].series.every(x=>x.short)&&c[1].series[0].color!==c[1].series[1].color);
  ok("renkler uygulamadakiyle aynı: kilo prim, sistolik ink, diyastolik su",c[0].series[0].color==="#0f5c55"&&c[1].series[0].color==="#10232b"&&c[1].series[1].color==="#2a86bd");
  ok("tansiyon grafiğinde bant ve not yok (yorumlanmaz)",!c[1].note&&!c[1].band&&!("band" in c[0]));
  ok("veri yoksa bölüm yok: tek tartı, takip kapalı, tek gün ölçüm",W.build({...S,entries:[E("kilo","2026-09-28",80)],settings:settings({bpOn:true}),vitals:[T("2026-09-28",120,80)]},end,7).charts.length===0&&W.build({...S,settings:settings({bpOn:false}),vitals:vit},end,7).charts.length===1&&W.build({settings:settings({}),entries:[],vitals:[]},end,7).charts.length===0);
  const rec=data=>{const t=[],calls=[];const ctx=new Proxy({},{get:(_,k)=>k==="measureText"?x=>({width:String(x).length*10}):k==="fillText"?x=>t.push(x):(...a)=>{calls.push(k)},set:()=>true});W.drawPage(ctx,data,{today:end});return {t,calls}};
  const r1=rec(W.build(SB,end,7)),r0=rec(W.build({settings:settings({}),entries:[],vitals:[]},end,7));
  ok("sayfa grafik başlıklarını ve etiketleri çizer; kesik çizgi için setLineDash kullanılır",r1.t.includes("Kilo (kg)")&&r1.t.includes("Sistolik")&&r1.t.includes("Diyastolik")&&!r1.t.some(x=>/referans/.test(x))&&r1.calls.includes("setLineDash"));
  ok("veri yokken grafik başlığı hiç çizilmez",r0.t.filter(x=>x==="Kilo (kg)").length===1&&!r0.t.some(x=>/^Tansiyon \(/.test(x))&&!r0.calls.includes("setLineDash")&&r1.t.filter(x=>x==="Kilo (kg)").length===2);
}
console.log(bad?"\n"+bad+" HATA":"\nTüm haftalık rapor testleri geçti");process.exit(bad?1:0);
