const V=require("../www/modules/vitals/vitalslib.js");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const T=(o)=>({k:"t",day:"2026-09-10",time:"08:00",sys:120,dia:80,session:"morning",...o});
const G=(o)=>({k:"s",day:"2026-09-10",time:"08:00",g:95,ctx:"fasting",...o});
const chk=x=>V.check(x);

// Doğrulama sınırları
for(const [n,x,good] of [
  ["tansiyon normal",T({}),true],["sistolik 300 sınırda",T({sys:300,dia:100}),true],["sistolik 301",T({sys:301}),false],["sistolik 49",T({sys:49,dia:30}),false],
  ["diyastolik 29",T({dia:29}),false],["diyastolik 200 sınırda",T({sys:250,dia:200}),true],["sistolik = diyastolik",T({sys:80,dia:80}),false],["sistolik < diyastolik",T({sys:70,dia:90}),false],
  ["sayı değil",T({sys:"120"}),false],["NaN",T({sys:NaN}),false],["nabız 24",T({pulse:24}),false],["nabız 250 sınırda",T({pulse:250}),true],["nabız yok",T({pulse:undefined}),true],
  ["şeker 20 sınırda",G({g:20}),true],["şeker 19",G({g:19}),false],["şeker 800 sınırda",G({g:800}),true],["şeker 801",G({g:801}),false],["şeker metin",G({g:"95"}),false],
  ["bozuk gün",T({day:"2026-13-40"}),false],["bozuk saat",T({time:"25:00"}),false],["bilinmeyen tür",{k:"x",day:"2026-09-10",time:"08:00"},false],["null",null,false]
])ok("doğrulama: "+n,!!chk(x).row===good,chk(x));
ok("bilinmeyen bağlam rastgele olur, bilinmeyen seans diğer olur",chk(G({ctx:"x"})).row.ctx==="random"&&chk(T({session:"x"})).row.session==="other");
ok("not 80 karaktere kesilir, boş not atılır",chk(G({note:"a".repeat(200)})).row.note.length===80&&chk(G({note:"  "})).row.note===undefined);
ok("seans kimliği yalnızca güvenli karakter",chk(T({sid:"abc123"})).row.sid==="abc123"&&chk(T({sid:"A B!"})).row.sid===undefined);
ok("değerler yuvarlanır (şeker 1 ondalık, tansiyon tam sayı)",chk(G({g:95.46})).row.g===95.5&&chk(T({sys:120.4,dia:79.6})).row.sys===120);

// clean
const cl=V.clean([T({}),T({}),T({sys:999}),null,"x",G({}),G({g:130,ctx:"after"}),T({sid:"a1"}),T({sid:"a1",sys:124,time:"08:02"})]);
ok("clean: yinelenen ve geçersiz atılır, kimlikler 1..n",cl.length===5&&cl.map(r=>r.id).join()==="1,2,3,4,5",cl);
ok("clean: dizi olmayan girdi boş döner",V.clean(null).length===0&&V.clean("x").length===0&&V.clean({}).length===0);
ok("clean: 5000'i aşan ölçüm kaybolmaz",V.clean(Array.from({length:6000},(_,i)=>G({g:50+(i%700),time:`${String(i%24).padStart(2,"0")}:${String(i%60).padStart(2,"0")}`,day:`2026-0${1+(i%9)}-1${i%9}`,ctx:V.CTX[i%5][0]}))).length>5000);
ok("clean: kendi çıktısı tekrar temizlenince değişmez",JSON.stringify(V.clean(cl))===JSON.stringify(cl));

// aynı seansta iki özdeş ölçüm (128/82 iki kez) açılışta temizlenince kaybolmamalı
const twin=V.clean([T({sid:"tw",i:1,sys:128,dia:82,time:"08:00"}),T({sid:"tw",i:2,sys:128,dia:82,time:"08:00"})]);
ok("özdeş iki ölçüm clean sonrası ikisi de durur",twin.length===2&&V.sessions(twin)[0].n===2,twin);
ok("özdeş ölçümler ikinci temizlikte de korunur (her açılışta çalışır)",V.clean(V.clean(twin)).length===2);
ok("rapor satırlarında 1. ve 2. ölçüm numarası i alanından gelir",(r=>r[0].c==="Sabah, 1. ölçüm"&&r[1].c==="Sabah, 2. ölçüm")(V.reportRows(twin,"t","2026-09-01","2026-09-30")));
ok("i yalnızca 1 ya da 2 olabilir",V.check(T({i:3})).row.i===undefined&&V.check(T({i:2})).row.i===2);

// seanslar ve ev ortalaması
const rows=V.clean([
  T({day:"2026-09-10",time:"07:30",sys:130,dia:84,pulse:70,sid:"s1"}),T({day:"2026-09-10",time:"07:32",sys:134,dia:86,pulse:72,sid:"s1"}),
  T({day:"2026-09-10",time:"20:00",sys:140,dia:90,session:"evening",sid:"s2"}),T({day:"2026-09-10",time:"20:02",sys:138,dia:88,session:"evening",sid:"s2"}),
  T({day:"2026-09-09",time:"07:30",sys:120,dia:80,sid:"s3"}),T({day:"2026-09-09",time:"07:32",sys:124,dia:82,sid:"s3"}),
  T({day:"2026-09-08",time:"08:00",sys:110,dia:70}),
  T({day:"2026-09-01",time:"08:00",sys:170,dia:100}),
  G({})
]);
const ss=V.sessions(rows);
ok("seans: aynı seans kimlikli ölçümler birleşir, ortalama ve ham değerler",ss.length===5&&ss.find(s=>s.day==="2026-09-10"&&s.session==="morning").sys===132&&ss.find(s=>s.day==="2026-09-10"&&s.session==="morning").raw.length===2&&ss.find(s=>s.day==="2026-09-10"&&s.session==="morning").pulse===71,ss);
ok("seans: aynı sid farklı günde ayrı seans",V.sessions(V.clean([T({sid:"x",day:"2026-09-10"}),T({sid:"x",day:"2026-09-11"})])).length===2);
ok("seans: şeker satırları sayılmaz",ss.every(s=>s.sys>100));
const h=V.homeAvg(rows,"2026-09-10",7);
ok("ev ortalaması: 7 günlük tüm ham ölçümlerin ortalaması (eski gün dışarıda)",h.all.n===7&&Math.abs(h.all.sys-(130+134+140+138+120+124+110)/7)<0.1&&h.days===3&&h.enough===true,h);
ok("ev ortalaması: sabah ve akşam ayrı",h.morning.n===5&&h.evening.n===2&&h.evening.sys===139,[h.morning,h.evening]);
ok("ev ortalaması: 3 günden az günde yetersiz",V.homeAvg(rows,"2026-09-09",7).enough===false&&V.homeAvg(rows,"2026-09-09",7).days===2);
ok("ev ortalaması: pencere sınırı (tam 7 gün)",V.homeAvg(rows,"2026-09-08",7).all.n===1&&V.homeAvg(rows,"2026-09-07",7).all.n===1&&V.homeAvg(rows,"2026-09-07",7).all.sys===170&&V.homeAvg(rows,"2026-08-20",7).all===null);
ok("ev ortalaması: veri yoksa null, çökmez",V.homeAvg([],"2026-09-10",7).all===null&&V.homeAvg([],"2026-09-10",7).days===0);

// yorum yok: eşik, işaret ve ön ayar API'si kaldırıldı
ok("eşik/işaret/ön ayar işlevleri yok",["flagBp","flagG","rangeG","bpBand","BP_PRESET","G_PRESET"].every(k=>!(k in V)));

// şeker özeti
const gr=V.clean([G({g:90,time:"07:00"}),G({g:140,time:"08:00"}),G({g:150,ctx:"after",time:"09:00"}),G({g:200,ctx:"after",time:"10:00"}),G({g:250,ctx:"random",time:"11:00"}),G({g:100,day:"2026-08-01"})]);
const st=V.gStats(gr,"2026-09-01","2026-09-30");
ok("şeker özeti: sayı, ortalama, en düşük/yüksek",st.n===5&&Math.abs(st.avg-166)<0.1&&st.min===90&&st.max===250,st);
ok("şeker özeti hedef yüzdesi taşımaz",!("pct" in st)&&!("ranged" in st),st);
ok("bağlama göre ortalama",st.byCtx.fasting.avg===115&&st.byCtx.after.avg===175&&st.byCtx.random.n===1);
ok("dönem boşsa null",V.gStats(gr,"2026-01-01","2026-01-31")===null&&V.gStats([],"2026-01-01","2026-12-31")===null);

// uç değer kutusu
const today="2026-10-01";
ok("uç değer: sistolik ≥180 veya diyastolik ≥120, yalnızca bugün",V.crisis(T({day:today,sys:180,dia:100}),today)&&V.crisis(T({day:today,sys:150,dia:120}),today)&&!V.crisis(T({day:today,sys:179,dia:119}),today));
ok("uç değer: şeker <54 veya >400",V.crisis(G({day:today,g:53}),today)&&V.crisis(G({day:today,g:401}),today)&&!V.crisis(G({day:today,g:54}),today)&&!V.crisis(G({day:today,g:400}),today));
ok("uç değer: geriye dönük kayıtta çıkmaz",!V.crisis(T({day:"2026-09-29",sys:200,dia:130}),today)&&!V.crisis(G({day:"2026-09-29",g:30}),today));

// emin misin
const prev=V.clean([T({sys:120,dia:80}),G({g:90,ctx:"fasting"}),G({g:200,ctx:"after"})]);
ok("tansiyon: sistolik farkı >60 sorar, ≤60 sormaz",!!V.needsConfirm(prev,T({sys:181,dia:100}))&&V.needsConfirm(prev,T({sys:180,dia:100}))===null);
ok("şeker: aynı bağlamda fark >150 sorar",!!V.needsConfirm(prev,G({g:241,ctx:"fasting"}))&&V.needsConfirm(prev,G({g:240,ctx:"fasting"}))===null);
ok("şeker: farklı bağlamlar arası fark sormaz (açlık 90, yemek sonrası 250)",V.needsConfirm(prev,G({g:250,ctx:"after"}))===null&&V.needsConfirm(prev,G({g:300,ctx:"bedtime"}))===null);
ok("ilk ölçümde soru yok",V.needsConfirm([],T({sys:200,dia:100}))===null&&V.needsConfirm([],G({g:500}))===null);

// rapor
const rr=V.reportRows(rows,"t","2026-09-01","2026-09-30");
ok("rapor satırları: her ham ölçüm bir satır, tarih sıralı, seans ve ölçüm sırası",rr.length===8&&rr[0].d==="1 Eyl 2026"&&rr.some(r=>r.c==="Sabah, 1. ölçüm"&&r.v.startsWith("130/84"))&&rr.some(r=>r.c==="Sabah, 2. ölçüm"&&r.v.startsWith("134/86")),rr);
ok("rapor satırı: nabız var, aralık işareti yok",rr.some(r=>/nabız 70/.test(r.v))&&rr.every(r=>!("f" in r)));
ok("rapor: şeker satırı bağlamı ve birimi",V.reportRows(gr,"s","2026-09-01","2026-09-30").some(r=>r.c==="Yemekten 2 saat sonra"&&r.v==="150 mg/dL"));
ok("rapor: dönem dışı ölçümler gelmez",V.reportRows(gr,"s","2026-09-01","2026-09-30").length===5);
const pg=V.paginate(200,4);
ok("sayfalama: tüm satırlar dağıtılır, her sayfa sığar",pg.reduce((a,p)=>a+p.n,0)===200&&pg.length>=5&&pg.every(p=>p.n>0)||pg[0].n===0,pg);
ok("sayfalama: az satırda tek sayfa",V.paginate(5,4).length===1&&V.paginate(0,4).length===1);

// çizim: tuval bağlamı taklidi
const drawn=[];const ctx=new Proxy({},{get:(t,k)=>k==="measureText"?()=>({width:100}):k==="fillText"?s=>drawn.push(s):()=>{},set:()=>true});
const items=rr.slice(0,6),info={kind:"t",title:"NeoWell · Tansiyon raporu",period:"01.09.2026 - 30.09.2026",summary:[["7 gün ev ortalaması","132/85 mmHg (14 ölçüm)"]],rows:rr,chart:{series:[{pts:[{day:"2026-09-08",v:110},{day:"2026-09-10",v:132}],color:"#0f5c52"}],from:"2026-09-01",to:"2026-09-30"},page:1,total:1,today};
V.drawPage(ctx,items,info);
ok("rapor çizimi: başlık, özet, tablo ve uyarı notu",drawn.includes("NeoWell · Tansiyon raporu")&&drawn.includes("7 gün ev ortalaması")&&drawn.some(t=>/Bu değerleri hekiminle değerlendir\./.test(t))&&drawn.includes("Sabah, 1. ölçüm"),drawn);
ok("rapor çizimi: aralık/işaret ifadesi çıkmaz",!drawn.some(t=>/aralığ|▲|▼/.test(t)));
const n0=drawn.length;V.drawPage(ctx,[],{...info,chart:null,page:2,total:2});const d2=drawn.slice(n0);
ok("boş sayfa ve grafiksiz çizim çökmez, yalnız tablo başlığı ve sayfa altlığı çizilir",d2.includes("Tarih")&&d2.includes("NeoWell · sayfa 2/2")&&!d2.includes(info.title),d2);

// yasak kelimeler (tanı/yorum dili) hiçbir metinde geçmez
const src=require("fs").readFileSync(require("path").join(__dirname,"../www/modules/vitals/vitalslib.js"),"utf8")+drawn.join(" ");
ok("tanı dili kullanılmaz",!/hipertansiyon|diyabet|hipoglisemi|hiperglisemi|anormal|tehlikeli|hasta(lık)?\b/i.test(src.replace(/\/\*[\s\S]*?\*\//g,"")),src.match(/hipertansiyon|diyabet|hipoglisemi|anormal|tehlikeli/i));
ok("tarih: 2026-02-31 reddedilir",!!V.check(T({day:"2026-02-31"})).err&&!!V.check(G({day:"2026-04-31"})).err&&!!V.check(G({day:"2026-02-28"})).row);
{const big=Array.from({length:5100},(_,i)=>G({g:100,day:"2026-01-01",time:"08:00",note:"n"+i})),c=V.clean(big);
ok("clean: 5000'i aşınca en eski kayıt da kalır",c.length===5100&&c[c.length-1].note==="n5099"&&c[0].note==="n0",[c.length,c[0].note]);}
ok("clean: sid'siz, notu farklı iki ölçüm tekilleştirmede yutulmaz",V.clean([T({note:"a"}),T({note:"b"})]).length===2);
// aynı dakikada elle girilen aynı değer: her giriş kendi sid'ini alır, geri yükleme/açılış temizliği ikisini de korur
{const s1=V.newSid(),s2=V.newSid(),man=[G({g:100,sid:s1}),G({g:100,sid:s2}),T({sid:V.newSid()}),T({sid:V.newSid()})];
const back=V.clean(JSON.parse(JSON.stringify(V.clean(man))));
ok("elle girilen aynı dakikadaki iki özdeş ölçüm (şeker ve tansiyon) yedek/açılış temizliğinde iki kayıt kalır",s1!==s2&&back.length===4&&back.filter(r=>r.k==="s").length===2,back);
ok("aynı sid ve aynı imza (yedek birleştirme çift sayımı) tek kayıt olur",V.clean([G({g:100,sid:"ab"}),G({g:100,sid:"ab"})]).length===1);
ok("eski sid'siz kayıtlar bozulmaz, sid'siz birebir kopya tek kalır",V.clean([G({g:90}),G({g:90}),G({g:91})]).length===2&&V.clean([G({g:90})])[0].sid===undefined);
ok("şekerde de güvenli sid saklanır, bozuk sid atılır",V.check(G({sid:"x1"})).row.sid==="x1"&&V.check(G({sid:"A B"})).row.sid===undefined);}
console.log(bad?"\n"+bad+" HATA":"\nTüm tansiyon/şeker testleri geçti");process.exit(bad?1:0);
