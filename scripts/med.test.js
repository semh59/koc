const M=require("../www/modules/meds/medlib.js");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const med=(o)=>({id:1,n:"Ilac A",t:["08:00","20:00"],on:true,...o});

// ilaç temizliği
const cl=M.cleanMeds([med({}),med({id:1,n:"Aynı kimlik"}),{n:"",t:["08:00"]},{n:"Saatsiz",t:[]},{n:"Bozuk saat",t:["25:00","9:00"]},null,"x",med({id:2,n:"B",t:["22:00","08:00","08:00"]})]);
ok("cleanMeds: boş ad, saatsiz, bozuk saat, null atılır",cl.length===3&&cl.map(m=>m.n).join()==="Ilac A,Aynı kimlik,B",cl);
ok("cleanMeds: çakışan kimlik yeni kimlik alır, benzersiz",new Set(cl.map(m=>m.id)).size===3&&cl[0].id===1);
ok("cleanMeds: saatler sıralı ve tekrarsız",cl[2].t.join()==="08:00,22:00");
ok("cleanMeds: en çok 20 ilaç, 6 saat",M.cleanMeds(Array.from({length:30},(_,i)=>med({id:i+1,n:"M"+i}))).length===20&&M.cleanMeds([med({t:["01:00","02:00","03:00","04:00","05:00","06:00","07:00"]})])[0].t.length===6);
ok("cleanMeds: ad 40, doz 30 karakter, boş doz atılır",(m=>m.n.length===40&&m.d.length===30)(M.cleanMeds([med({n:"a".repeat(80),d:"d".repeat(80)})])[0])&&M.cleanMeds([med({d:"  "})])[0].d===undefined);
ok("cleanMeds: hafta günleri; hepsi seçiliyse alan yok, geçersiz gün atılır",M.cleanMeds([med({w:[1,3,3,9,-1]})])[0].w.join()==="1,3"&&M.cleanMeds([med({w:[0,1,2,3,4,5,6]})])[0].w===undefined);
ok("cleanMeds: bitiş başlangıçtan önce olamaz",M.cleanMeds([med({s:"2026-09-10",e:"2026-09-01"})])[0].e===undefined&&M.cleanMeds([med({s:"2026-09-10",e:"2026-09-12"})])[0].e==="2026-09-12");
ok("cleanMeds: stok ve doz başına adet sınırları",(m=>m.k===30&&m.p===0.5)(M.cleanMeds([med({k:30,p:0.5})])[0])&&M.cleanMeds([med({k:-1,p:0})])[0].k===undefined&&M.cleanMeds([med({k:-1,p:0})])[0].p===undefined);
ok("cleanMeds: on varsayılan açık, false korunur",M.cleanMeds([med({on:undefined})])[0].on===true&&M.cleanMeds([med({on:false})])[0].on===false);
ok("cleanMeds: kendi çıktısı tekrar temizlenince değişmez",JSON.stringify(M.cleanMeds(cl))===JSON.stringify(cl));
ok("cleanMeds: dizi olmayan girdi boş döner",M.cleanMeds(null).length===0&&M.cleanMeds("x").length===0);

// kayıt temizliği
const meds=M.cleanMeds([med({}),med({id:2,n:"B",t:["09:00"]})]);
const lg=M.cleanLog([{m:1,day:"2026-09-10",slot:"08:00",st:"t",at:"08:05"},{m:1,day:"2026-09-10",slot:"08:00",st:"s"},{m:9,day:"2026-09-10",slot:"08:00",st:"t"},{m:1,day:"bozuk",slot:"08:00",st:"t"},{m:1,day:"2026-09-10",slot:"8:00",st:"t"},{m:1,day:"2026-09-10",slot:"20:00",st:"x"},null,{m:2,day:"2026-09-10",slot:"09:00",st:"t"}],meds);
ok("cleanLog: bilinmeyen ilaç, bozuk gün/saat/durum atılır; aynı doza en son kayıt geçerli",lg.length===2&&lg[0].st==="s"&&lg[0].at===undefined&&lg[1].m===2,lg);
ok("cleanLog: ilaç silinince kayıtları da gider",M.cleanLog(lg,[meds[1]]).length===1);
ok("cleanLog: kimlikler 1..n",lg.map(x=>x.id).join()==="1,2");

// günün dozları
const d1=M.dosesOn(meds,"2026-09-10");
ok("günün dozları saate göre sıralı",d1.map(x=>x.slot+x.m.id).join()==="08:001,09:002,20:001",d1.map(x=>x.slot));
ok("kapalı ilaç doz üretmez",M.dosesOn(M.cleanMeds([med({on:false})]),"2026-09-10").length===0);
const wd=M.cleanMeds([med({w:[1]})]);// yalnızca Pazartesi
ok("hafta günü filtresi (2026-09-14 Pazartesi, 09-15 Salı)",M.dosesOn(wd,"2026-09-14").length===2&&M.dosesOn(wd,"2026-09-15").length===0);
const course=M.cleanMeds([med({s:"2026-09-10",e:"2026-09-12"})]);
ok("kür: başlangıç ve bitiş günleri dahil, dışı yok",M.dosesOn(course,"2026-09-09").length===0&&M.dosesOn(course,"2026-09-10").length===2&&M.dosesOn(course,"2026-09-12").length===2&&M.dosesOn(course,"2026-09-13").length===0);

// işaretleme, stok, geri alma
const mkS=()=>({meds:M.cleanMeds([med({k:10,p:2}),med({id:2,n:"Stoksuz",t:["09:00"]})]),medLog:[]});
let S=mkS();
const r1=M.mark(S,1,"2026-09-10","08:00","t","08:03");
ok("alındı: kayıt eklenir, stok doz başına adet kadar düşer",S.medLog.length===1&&S.medLog[0].st==="t"&&S.medLog[0].at==="08:03"&&S.meds[0].k===8);
M.mark(S,1,"2026-09-10","08:00","t","08:10");
ok("aynı doza ikinci kez alındı stoğu tekrar düşürmez, kayıt tek",S.medLog.length===1&&S.meds[0].k===8);
M.mark(S,1,"2026-09-10","08:00","s");
ok("alındı → atlandı: stok geri eklenir",S.meds[0].k===10&&S.medLog[0].st==="s");
M.mark(S,1,"2026-09-10","08:00",null);
ok("işaret kaldırılır (st=null)",S.medLog.length===0&&S.meds[0].k===10);
S=mkS();const u=M.mark(S,1,"2026-09-10","20:00","t");u.undo();
ok("geri al: kayıt ve stok eski haline döner",S.medLog.length===0&&S.meds[0].k===10);
S=mkS();M.mark(S,1,"2026-09-10","20:00","s");const u2=M.mark(S,1,"2026-09-10","20:00","t");u2.undo();
ok("geri al: önceki 'atlandı' durumuna döner",S.medLog.length===1&&S.medLog[0].st==="s"&&S.meds[0].k===10);
M.mark(S,2,"2026-09-10","09:00","t");
ok("stoksuz ilaçta stok alanı oluşmaz",S.meds[1].k===undefined);
S=mkS();for(let i=0;i<8;i++)M.mark(S,1,"2026-09-"+String(10+i).padStart(2,"0"),"08:00","t");
ok("stok sıfırın altına düşmez",S.meds[0].k===0);
ok("olmayan ilaç işaretlenemez",M.mark(S,77,"2026-09-10","08:00","t")===null);
ok("kalan doz: stok / doz başına adet",M.stockLeft({k:10,p:2})===5&&M.stockLeft({k:7})===7&&M.stockLeft({k:0.9,p:1})===0&&M.stockLeft({})===null);

// uyum
const A=M.cleanMeds([med({})]);// günde 2 doz
const log=M.cleanLog([{m:1,day:"2026-09-10",slot:"08:00",st:"t"},{m:1,day:"2026-09-10",slot:"20:00",st:"s"},{m:1,day:"2026-09-11",slot:"08:00",st:"t"}],A);
let a=M.adherence(A,log,"2026-09-10","2026-09-11","2026-09-11","23:00");
ok("uyum: bugünün saati geçmiş kayıtsız dozu gün bitene kadar 'gecikti' (kaçırılan değil, paydada yok)",a.total===3&&a.taken===2&&a.skipped===1&&a.missed===0&&a.late===1&&a.pct===67,a);
a=M.adherence(A,log,"2026-09-10","2026-09-12","2026-09-12","09:00");
ok("uyum: ertesi gün 09:00'da dünkü kayıtsız doz kaçırılan olur, bugünün 08:00'ı gecikti",a.missed===1&&a.late===1&&a.total===4&&a.taken===2,a);
a=M.adherence(A,log,"2026-09-10","2026-09-11","2026-09-11","23:59");
ok("uyum: 23:59'da hâlâ gecikti",a.missed===0&&a.late===1,a);
const logLate=M.cleanLog([...log,{m:1,day:"2026-09-11",slot:"20:00",st:"t",at:"21:30"}],A);
a=M.adherence(A,logLate,"2026-09-10","2026-09-11","2026-09-11","23:00");
ok("uyum: geç kayıt eklenince doz alındı sayılır, gecikti kalkar",a.late===0&&a.taken===3&&a.total===4&&a.pct===75,a);
ok("uyum: eski kayıtlı (at'siz) yedek aynı sonucu verir",M.adherence(A,M.cleanLog(JSON.parse(JSON.stringify(log)),A),"2026-09-10","2026-09-11","2026-09-11","23:00").late===1);
a=M.adherence(A,log,"2026-09-10","2026-09-11","2026-09-11","12:00");
ok("uyum: bugün vakti gelmemiş doz sayılmaz",a.total===3&&a.taken===2&&a.missed===0&&a.pct===67,a);
a=M.adherence(A,log,"2026-09-10","2026-09-20","2026-09-11","08:00");
ok("uyum: gelecek günler ve tam saatinde olan doz",a.total===3&&a.taken===2,a);
ok("uyum: doz yoksa yüzde yok",M.adherence([],[],"2026-09-10","2026-09-11","2026-09-11","12:00").pct===null);
ok("uyum: ilaç eklenmeden önceki günler 'kaçırılan' sayılmaz (başlangıç tarihi)",M.adherence(M.cleanMeds([med({s:"2026-09-11"})]),[],"2026-09-01","2026-09-12","2026-09-12","23:00").total===2);

// bildirimler
const now=new Date(2026,8,10,12,0,0);// 10 Eylül 2026 12:00
const N=M.notifications(A,[],now,3,true);
ok("bildirimler: bugünün geçmiş dozu yok, sonrası 3 gün (ana + 2 tekrar)",N.length===15&&N.filter(n=>n.title==="💊 İlaç zamanı").length===5&&N[0].at.getHours()===20&&N.every(n=>n.at>now),N.length);
ok("alarm: kanal, kalıcı bildirim ve tekrarlar 10 / 20 dk sonra",N.every(n=>n.channelId==="nw_med"&&n.ongoing===true)&&N[1].title==="💊 İlacını aldın mı?"&&N[1].at-N[0].at===600000&&N[2].at-N[0].at===1200000);
ok("alarm: kimlikten ilaç ve saat bulunur (ana ve tekrar)",N.slice(0,3).every(n=>{const d=M.doseOfId(A,n.id);return d&&d.m.id===1&&d.slot==="20:00"})&&M.doseOfId(A,5)===null&&M.doseOfId(A,1000000+500*1000)===null);
const late=M.notifications(A,[],new Date(2026,8,10,20,5,0),1,true);
ok("alarm: doz saati geçti ama tekrar yaklaşıyor: ana yok, 2 tekrar var",late.length===2&&late.every(n=>n.title==="💊 İlacını aldın mı?"));
ok("alarm: alınan dozun tekrarları da kurulmaz",M.notifications(A,M.cleanLog([{m:1,day:"2026-09-10",slot:"20:00",st:"t"}],A),new Date(2026,8,10,20,5,0),1,true).length===0);
const midn=M.notifications(M.cleanMeds([med({t:["23:55"]})]),[],new Date(2026,8,11,0,3,0),1,true);
ok("alarm: gece yarısını aşan tekrar dünkü doza aittir",midn.some(n=>n.extra.s==="23:55"&&n.title==="💊 İlacını aldın mı?"&&n.at.getDate()===11)&&midn.every(n=>n.at>new Date(2026,8,11,0,3,0)));
ok("bildirim içeriği: ad, doz, eylem türü ve ek veri",(n=>n.title==="💊 İlaç zamanı"&&n.body==="Ilac A"&&n.actionTypeId==="med"&&n.extra.act==="med"&&n.extra.m===1&&n.extra.s==="20:00")(N[0]));
ok("ad gizliyse genel metin",M.notifications(A,[],now,1,false)[0].body==="İlaç saatin geldi."&&!JSON.stringify(M.notifications(A,[],now,1,false)).includes("Ilac A"));
ok("doz bilgisi bildirimde ad yanında",M.notifications(M.cleanMeds([med({d:"10 mg"})]),[],now,1,true)[0].body==="Ilac A · 10 mg");
ok("kaydı girilmiş doz için bildirim kurulmaz",M.notifications(A,M.cleanLog([{m:1,day:"2026-09-10",slot:"20:00",st:"t"}],A),now,1,true).length===0);
ok("bildirim kimlikleri benzersiz ve büyük aralıkta",(ids=>new Set(ids).size===ids.length&&ids.every(i=>i>=1e6&&i<2**31))(M.notifications(M.cleanMeds([med({id:1}),med({id:2,t:["10:00","11:00","12:30"]}),med({id:999,t:["23:00"]})]),[],new Date(2026,8,10,0,0,0),30,true).map(n=>n.id)));
ok("kimlikler normal hatırlatma kimlikleriyle (1-1100) çakışmaz",M.notifications(A,[],now,30,true).every(n=>n.id>1100));
ok("kapalı ya da hafta günü dışı ilaç bildirim üretmez",M.notifications(M.cleanMeds([med({on:false})]),[],now,5,true).length===0&&M.notifications(wd,[],new Date(2026,8,15,0,0,0),1,true).length===0);
ok("notification ids stay unique over 40 days and the id layout cap is respected",(ids=>new Set(ids).size===ids.length)(M.notifications(M.cleanMeds(Array.from({length:12},(_,i)=>med({id:i+1,n:"M"+i,t:["06:00","10:00","14:00","18:00","22:00","23:00"]}))),[],new Date(2026,8,10,0,0,0),60,true).map(n=>n.id)));
ok("kış/yaz saati günü: saat hâlâ doğru (2026-03-29 geçişi)",(l=>l.length===2&&l[0].at.getHours()===8)(M.notifications(M.cleanMeds([med({t:["08:00"]})]),[],new Date(2026,2,27,12,0,0),3,true).slice(0,2)));

// bildirim düğmesinden gün bulma
const T=(y,mo,d,h,mi)=>new Date(y,mo-1,d,h,mi).getTime();
ok("düğme: aynı gün (08:00 dozu 08:05'te)",M.dayForTap("08:00",T(2026,9,10,8,5))==="2026-09-10");
ok("düğme: gece yarısını aşan geç basış önceki günün dozudur (23:30 dozu 00:10'da)",M.dayForTap("23:30",T(2026,9,11,0,10))==="2026-09-10");
ok("düğme: bildirim doz saatinde çıkar; 15:00 dozuna sabah 08:00 basışı dünün, 16:00 basışı bugünün",M.dayForTap("15:00",T(2026,9,10,8,0))==="2026-09-09"&&M.dayForTap("15:00",T(2026,9,10,16,0))==="2026-09-10"&&M.dayForTap("20:00",T(2026,9,10,19,0))==="2026-09-09");
ok("düğme: 22:00 dozu; gece ve ertesi gün 21:59'a kadar basış dünün, 22:00'de bugünün",M.dayForTap("22:00",T(2026,9,11,3,0))==="2026-09-10"&&M.dayForTap("22:00",T(2026,9,11,21,59))==="2026-09-10"&&M.dayForTap("22:00",T(2026,9,11,22,0))==="2026-09-11");

// başlangıç: ilaç ve saat başına since; eski kayıt eskisi gibi
const sd=M.cleanMeds([med({s:"2026-09-10",t:["08:00","20:00"],ts:{"20:00":"2026-09-12","09:00":"2026-09-01","08:00":"bozuk"}})])[0];
ok("cleanMeds: ts yalnız ilacın saatleri ve geçerli gün; çıktısı değişmez",JSON.stringify(sd.ts)==='{"20:00":"2026-09-12"}'&&JSON.stringify(M.cleanMeds([sd])[0])===JSON.stringify(sd)&&M.cleanMeds([med({})])[0].ts===undefined);
ok("sinceFor: yeni saat bugünden, vakti geçmiş saat yarından, eski saat korunur, hiç yoksa alan yok",JSON.stringify(M.sinceFor(["08:00"],["08:00","12:00","20:00"],{"08:00":"2026-09-01"},"2026-09-10","14:00"))==='{"08:00":"2026-09-01","12:00":"2026-09-11","20:00":"2026-09-10"}'&&M.sinceFor(["08:00"],["08:00"],undefined,"2026-09-10","14:00")===undefined);
{
  const m=[med({s:"2026-09-10",t:["08:00","20:00"],ts:{"08:00":"2026-09-11"}})];
  ok("dosesOn: saatin başlangıcından önceki gün o saati üretmez",M.dosesOn(m,"2026-09-10").map(x=>x.slot).join()==="20:00"&&M.dosesOn(m,"2026-09-11").map(x=>x.slot).join()==="08:00,20:00");
  const a=M.adherence(m,[],"2026-09-01","2026-09-12","2026-09-12","23:59");
  ok("uyum: başlangıçtan önceki gün ve dozlar saymaz (10'unda yalnız 20:00, 11'de iki doz; bugün 12'si gecikti sayılır)",a.total===3&&a.missed===3&&a.late===2,a);
  ok("bildirim: başlangıçtan önceki saat için kurulmaz",M.notifications(m,[],new Date(2026,8,10,6,0),2,true).every(n=>!(n.extra.s==="08:00"&&new Date(n.extra.at).getDate()===10)));
  const old=[med({t:["08:00"]})];
  ok("eski kayıt (s ve ts yok) geçmiş günleri eskisi gibi sayar",M.adherence(old,[],"2026-09-01","2026-09-10","2026-09-10","23:59").total===9);
}
// geçmiş değişmez: kapatma, saat silme, gün değişimi eski dozları silmez
{
  const base=M.cleanMeds([med({s:"2026-09-01",t:["08:00","20:00"]})])[0],D="2026-09-10";
  const run=(n,chg,before,after)=>{
    const m=M.cleanMeds([M.revise(base,{...base,...chg},D)])[0],cnt=d=>M.dosesOn([m],d).length;
    ok(`geçmiş sabit: ${n}`,cnt("2026-09-09")===before&&cnt(D)===after,[cnt("2026-09-09"),cnt(D)]);
  };
  run("ilaç kapatıldı",{on:false},2,0);
  run("20:00 saati silindi",{t:["08:00"]},2,1);
  run("saat değişti",{t:["09:00","21:00"]},2,2);
  run("haftanın günü değişti (yalnız cumartesi)",{w:[6]},2,0);
  const off=M.cleanMeds([M.revise(base,{...base,on:false},D)])[0],a=M.adherence([off],[],"2026-09-05","2026-09-12","2026-09-12","23:59");
  ok("kapatılan ilacın geçmiş dozları uyum paydasında kalır (5 gün × 2)",a.total===10&&a.missed===10,a);
  ok("kapalı ilaç için bildirim yok",M.notifications([off],[],new Date(2026,8,12,9,0),3,true).length===0);
  const twice=M.revise(M.cleanMeds([M.revise(base,{...base,on:false},D)])[0],{...base,t:["08:00"],on:false},D);
  ok("aynı gün ikinci değişiklikte ilk sürüm korunur; değişmeyen kayıtta geçmiş yok",twice.h.length===1&&twice.h[0].t.length===2&&M.revise(base,{...base,n:"Yeni ad"},D).h===undefined);
  const re=M.cleanMeds([M.revise(M.cleanMeds([M.revise(base,{...base,on:false},"2026-09-10")])[0],{...base,on:true},"2026-09-15")])[0];
  ok("kapalı dönem boşluğu: açılınca kapalı günler sayılmaz, önceki ve sonraki sayılır",[["2026-09-09",2],["2026-09-12",0],["2026-09-15",2]].every(([d,n])=>M.dosesOn([re],d).length===n)&&JSON.stringify(M.cleanMeds([re])[0])===JSON.stringify(re));
}
{
  const hs=n=>M.cleanMeds([med({h:Array.from({length:n},(_,i)=>({u:`2026-08-${String(i+1).padStart(2,"0")}`,t:["08:00"],on:true}))})])[0].h;
  ok("program geçmişi en çok 24 sürüm; fazlada en eski atılır",hs(24).length===24&&hs(26).length===24&&hs(26)[0].u==="2026-08-03"&&hs(26)[23].u==="2026-08-26");
}
// ekran uyandırma: yalnız ana dozlar; tanı kaydı satırları ve olası sorunlar
{
  const L=M.notifications([med({t:["08:00"]})],[],new Date(2026,9,7,6,0),2,true).map(n=>({id:n.id,extra:n.extra,schedule:{at:n.at}}));
  const W=M.wakeTimes(L.concat([{id:7149,extra:{},schedule:{at:new Date()}},{id:101,schedule:{at:new Date()}}]));
  ok("wakeTimes: ana doz kimlikleri [1e6,2e6), tekrarlar (>=2e6) ve başka bildirimler alınmaz",L.length===6&&W.length===2&&W.every(t=>new Date(t).getHours()===8&&new Date(t).getMinutes()===0),W);
  const T=(h,m,s)=>new Date(2026,9,7,h,m,s).getTime();
  const wk={t:T(14,2,3),a:"WAKE",p:T(14,2,0),kl:true,ia:false,wl:true,fs:"ok",ne:true,fsi:true,ci:4,mi:4,bo:true,ex:true};
  ok("wakeLine: çalan alarm saat, planlanan, gecikme, kilit, ekran ve tam ekran sonucu",M.wakeLine(wk)==="07.10 14:02:03 alarm çaldı (planlanan 14:02:00, +3 sn), ekran kilitli, ekran kapalıydı, tam ekran bildirimi gönderildi",M.wakeLine(wk));
  const l2=M.wakeLine({...wk,k:"T",p:T(13,58,0),kl:false,ia:true,fs:"skip",ci:2,bo:false,fsi:false});
  ok("wakeLine: test alarmı, dakika gecikme, kilit açık, düşük kanal, izin ve pil sorunları",/test alarmı çaldı \(planlanan 13:58:00, \+4 dk\), kilit açık, ekran açıktı, tam ekran bildirimi gerekmedi, tam ekran izni yok, ekran kanalı düşük önemde, pil kısıtı var/.test(l2),l2);
  ok("wakeLine: tam ekran hatası ve kurulum kaydı",/gönderilemedi: SecurityException: x/.test(M.wakeLine({...wk,fs:"err:SecurityException: x"}))&&M.wakeLine({t:T(9,0,0),a:"APP",in:3,n:3,nx:[T(14,0,0)]})==="07.10 09:00:00 uygulama alarmları kurdu: 3 alarm, ilk: 07.10 14:00"&&/BOOT|telefon açıldı/.test(M.wakeLine({t:T(9,0,0),a:"BOOT",in:0,n:0,nx:[]})));
  const ok0={ne:true,fsi:true,ci:4,mi:4,bo:true,ex:true},to=(st,it)=>M.wakeIssues(st,it).map(i=>i.to||"-").join();
  ok("wakeIssues: her şey yolunda ve alarm çalmışsa sorun yok",M.wakeIssues(ok0,[wk]).length===0);
  ok("wakeIssues: Xiaomi kilit ekranı ve arka plan pencere izinleri kapalıysa miui ayarına yönlendirir; -1 (okunamadı) sorun sayılmaz",to({...ok0,xl:1,xp:1},[wk])==="miui,miui"&&M.wakeIssues({...ok0,xl:-1,xp:-1},[wk]).length===0&&M.wakeIssues({...ok0,xl:0,xp:0},[wk]).length===0);
  ok("wakeIssues: kapalı bildirim, engelli/düşük kanal, tam ekran, pil, tam alarm her biri ilgili ayara",to({ne:false,ci:0,mi:2,fsi:false,bo:false,ex:false},[wk])==="notif,channel,channel,fsi,battery,exact"&&M.wakeIssues({...ok0,mi:2},[wk])[0].id==="nw_med");
  ok("wakeIssues: kanal henüz yoksa (-1) sorun sayılmaz",M.wakeIssues({...ok0,ci:-1,mi:-1},[wk]).length===0);
  ok("wakeIssues: kayıt yoksa 'alarm hiç çalmadı' otomatik başlatmaya; kurulan 0 ise ayrı uyarı",to(ok0,[])==="autostart"&&/hiç çalmadı/.test(M.wakeIssues(ok0,[])[0].t)&&/Kurulu ekran alarmı yok/.test(M.wakeIssues(ok0,[{a:"APP",in:0,n:0}])[0].t));
  const armAt=(t,nx)=>({t,a:"APP",in:1,n:1,nx:[nx]});
  ok("wakeIssues: ilk alarm zamanı geçtiği halde arada çalma kaydı yoksa 'çalmadı'; zamanı gelmeden yeniden kurulum ya da arada çalma sorun değil",/Planlanan 07\.10 14:00 alarmı çalmadı/.test(M.wakeIssues(ok0,[wk,armAt(T(9,0,0),T(14,0,0)),armAt(T(18,0,0),T(20,0,0))]).map(i=>i.t).join())&&M.wakeIssues(ok0,[wk,armAt(T(9,0,0),T(14,0,0)),armAt(T(13,0,0),T(14,0,0))]).length===0&&M.wakeIssues(ok0,[armAt(T(9,0,0),T(14,0,0)),{...wk,t:T(14,0,1),p:T(14,0,0)},armAt(T(18,0,0),T(20,0,0))]).length===0);
  ok("wakeIssues: 1 dk'dan geç çalma ve tam ekran hatası bildirilir",/geç çaldı \(en çok \+5 dk\)/.test(M.wakeIssues(ok0,[{...wk,t:wk.p+300000}])[0].t)&&/gönderilemedi/.test(M.wakeIssues(ok0,[{...wk,fs:"err:X"}]).pop().t));
}
// yorum ve tanı dili yok
const src=require("fs").readFileSync(require("path").join(__dirname,"../www/modules/meds/medlib.js"),"utf8").replace(/\/\*[\s\S]*?\*\//g,"");
ok("doz önerisi/yorum dili kullanılmaz",!/öner|tavsiye|etkileşim|yan etki|aşırı doz|tehlikeli/i.test(src));
ok("cleanMeds: an impossible calendar day is not kept as a start day",M.cleanMeds([med({s:"2026-02-31"})])[0].s===undefined&&M.cleanMeds([med({s:"2026-02-28"})])[0].s==="2026-02-28");
// stock keeps two decimals (a quarter tablet does not drift after a reload), adherence by day, indexes, ids, time helpers
ok("stock: quarter doses are not rounded to one decimal by cleanMeds",(m=>M.cleanMeds([m])[0].k===29.75&&M.cleanMeds([M.cleanMeds([m])[0]])[0].k===29.75)(med({k:29.75,p:0.25})));
ok("stock: a per-dose amount that rounds to zero is dropped",M.cleanMeds([med({p:0.004})])[0].p===undefined&&M.cleanMeds([med({p:0.5})])[0].p===0.5);
{const S2={meds:M.cleanMeds([med({k:30,p:0.25})]),medLog:[]};M.mark(S2,1,"2026-09-10","08:00","t");M.mark(S2,1,"2026-09-10","20:00","t");
 ok("stock: marks and a reload keep the same value",S2.meds[0].k===29.5&&M.cleanMeds(S2.meds)[0].k===29.5);}
{const per=M.adherenceDays(A,log,"2026-09-10","2026-09-12","2026-09-12","09:00"),sum=M.sumAdherence(per);
 ok("adherenceDays: one entry per day, summed equals adherence",per.map(d=>d.day).join()==="2026-09-10,2026-09-11,2026-09-12"&&JSON.stringify(sum)===JSON.stringify(M.adherence(A,log,"2026-09-10","2026-09-12","2026-09-12","09:00"))&&per[0].taken===1&&per[0].skipped===1&&per[2].late===1,per);}
{const rec=M.logIndex(log,"2026-09-11");
 ok("logIndex: finds a row by medication, day and time; days before `from` are left out",rec(1,"2026-09-11","08:00").st==="t"&&rec(1,"2026-09-10","08:00")===undefined&&rec(2,"2026-09-11","08:00")===undefined);}
ok("freeId: smallest unused id",M.freeId(new Set([1,2,4]))===3&&M.freeId(new Set())===1);
ok("hm and slotAt: HH:MM of a date, local date of a day and time",M.hm(new Date(2026,8,10,7,5))==="07:05"&&(d=>d.getFullYear()===2026&&d.getMonth()===8&&d.getDate()===10&&d.getHours()===23&&d.getMinutes()===55)(M.slotAt("2026-09-10","23:55")));
ok("mark: new log ids stay unique",(S3=>{M.mark(S3,1,"2026-09-10","08:00","t");M.mark(S3,1,"2026-09-10","20:00","t");M.mark(S3,1,"2026-09-11","08:00","s");return new Set(S3.medLog.map(x=>x.id)).size===3})({meds:M.cleanMeds([med({})]),medLog:[]}));
console.log(bad?"\n"+bad+" HATA":"\nTüm ilaç testleri geçti");process.exit(bad?1:0);
