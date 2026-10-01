const M=require("../www/medlib.js");let bad=0;
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
ok("uyum: alınan, atlanan ve kaçırılan ayrı sayılır",a.total===4&&a.taken===2&&a.skipped===1&&a.missed===1&&a.pct===50,a);
a=M.adherence(A,log,"2026-09-10","2026-09-11","2026-09-11","12:00");
ok("uyum: bugün vakti gelmemiş doz sayılmaz",a.total===3&&a.taken===2&&a.missed===0&&a.pct===67,a);
a=M.adherence(A,log,"2026-09-10","2026-09-20","2026-09-11","08:00");
ok("uyum: gelecek günler ve tam saatinde olan doz",a.total===3&&a.taken===2,a);
ok("uyum: doz yoksa yüzde yok",M.adherence([],[],"2026-09-10","2026-09-11","2026-09-11","12:00").pct===null);
ok("uyum: ilaç eklenmeden önceki günler 'kaçırılan' sayılmaz (başlangıç tarihi)",M.adherence(M.cleanMeds([med({s:"2026-09-11"})]),[],"2026-09-01","2026-09-11","2026-09-11","23:00").total===2);

// bildirimler
const now=new Date(2026,8,10,12,0,0);// 10 Eylül 2026 12:00
const N=M.notifications(A,[],now,3,true);
ok("bildirimler: bugünün geçmiş dozu yok, sonrası 3 gün",N.length===1+2+2&&N[0].at.getHours()===20&&N.every(n=>n.at>now),N.length);
ok("bildirim içeriği: ad, doz, eylem türü ve ek veri",(n=>n.title==="💊 İlaç zamanı"&&n.body==="Ilac A"&&n.actionTypeId==="med"&&n.extra.act==="med"&&n.extra.m===1&&n.extra.s==="20:00")(N[0]));
ok("ad gizliyse genel metin",M.notifications(A,[],now,1,false)[0].body==="İlaç saatin geldi."&&!JSON.stringify(M.notifications(A,[],now,1,false)).includes("Ilac A"));
ok("doz bilgisi bildirimde ad yanında",M.notifications(M.cleanMeds([med({d:"10 mg"})]),[],now,1,true)[0].body==="Ilac A · 10 mg");
ok("kaydı girilmiş doz için bildirim kurulmaz",M.notifications(A,M.cleanLog([{m:1,day:"2026-09-10",slot:"20:00",st:"t"}],A),now,1,true).length===0);
ok("bildirim kimlikleri benzersiz ve büyük aralıkta",(ids=>new Set(ids).size===ids.length&&ids.every(i=>i>=1e6&&i<2**31))(M.notifications(M.cleanMeds([med({id:1}),med({id:2,t:["10:00","11:00","12:30"]}),med({id:999,t:["23:00"]})]),[],new Date(2026,8,10,0,0,0),30,true).map(n=>n.id)));
ok("kimlikler normal hatırlatma kimlikleriyle (1-1100) çakışmaz",M.notifications(A,[],now,30,true).every(n=>n.id>1100));
ok("kapalı ya da hafta günü dışı ilaç bildirim üretmez",M.notifications(M.cleanMeds([med({on:false})]),[],now,5,true).length===0&&M.notifications(wd,[],new Date(2026,8,15,0,0,0),1,true).length===0);
const big=M.notifications(M.cleanMeds(Array.from({length:12},(_,i)=>med({id:i+1,n:"M"+i,t:["06:00","10:00","14:00","18:00","22:00","23:00"]}))),[],new Date(2026,8,10,0,0,0),40,true);
const bg=M.budget(big);
ok("bütçe: 440 ile sınırlı, en yakın tarihler korunur",big.length>440&&bg.length===440&&bg[0].at<=bg[439].at&&Math.max(...bg.map(n=>n.at))<=Math.min(...big.filter(n=>!bg.includes(n)).map(n=>n.at.getTime()))+1,[big.length,bg.length]);
ok("bütçe: az bildirimde hepsi kalır",M.budget(N).length===N.length);
ok("kış/yaz saati günü: saat hâlâ doğru (2026-03-29 geçişi)",(l=>l.length===2&&l[0].at.getHours()===8)(M.notifications(M.cleanMeds([med({t:["08:00"]})]),[],new Date(2026,2,27,12,0,0),3,true).slice(0,2)));

// bildirim düğmesinden gün bulma
const T=(y,mo,d,h,mi)=>new Date(y,mo-1,d,h,mi).getTime();
ok("düğme: aynı gün (08:00 dozu 08:05'te)",M.dayForTap("08:00",T(2026,9,10,8,5))==="2026-09-10");
ok("düğme: gece yarısını aşan geç basış önceki günün dozudur (23:30 dozu 00:10'da)",M.dayForTap("23:30",T(2026,9,11,0,10))==="2026-09-10");
ok("düğme: erken basış aynı gün (20:00 dozuna 19:00'da basıldı)",M.dayForTap("20:00",T(2026,9,10,19,0))==="2026-09-10");
ok("düğme: 6 saat sınırı (22:00 dozu; sabah 3 ve 5'te basış önceki günün, 16:00 sınırda aynı gün, 15:59 önceki gün)",M.dayForTap("22:00",T(2026,9,11,3,0))==="2026-09-10"&&M.dayForTap("22:00",T(2026,9,11,5,0))==="2026-09-10"&&M.dayForTap("22:00",T(2026,9,11,16,0))==="2026-09-11"&&M.dayForTap("22:00",T(2026,9,11,15,59))==="2026-09-10");

// yorum ve tanı dili yok
const src=require("fs").readFileSync(require("path").join(__dirname,"../www/medlib.js"),"utf8").replace(/\/\*[\s\S]*?\*\//g,"");
ok("doz önerisi/yorum dili kullanılmaz",!/öner|tavsiye|etkileşim|yan etki|aşırı doz|tehlikeli/i.test(src));
console.log(bad?"\n"+bad+" HATA":"\nTüm ilaç testleri geçti");process.exit(bad?1:0);
