const L=require("../www/lablib.js"),fs=require("fs"),path=require("path");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const P=l=>L.parseLine(l);

// Satır biçimleri: [satır, k, v, u, lo, hi]
const table=[
  ["Glukoz (Açlık)  98  mg/dL  70 - 100","glukoz",98,"mg/dL",70,100],
  ["Glukoz 5,4 mmol/L 3,9-5,6","glukoz",5.4,"mmol/L",3.9,5.6],
  ["Serum Glukoz 101 mg/dL 74-106","glukoz",101,"mg/dL",74,106],
  ["HbA1c   5,4 %  4,0-5,6","hba1c",5.4,"%",4,5.6],
  ["Hemoglobin A1c 6,1 % 4-5,6","hba1c",6.1,"%",4,5.6],
  ["Hemoglobin 14,2 g/dL 12,0 - 16,0","hgb",14.2,"g/dL",12,16],
  ["Total Kolesterol 190 mg/dL < 200","kolesterol",190,"mg/dL",undefined,200],
  ["Kolesterol HDL  45 mg/dL  > 40","hdl",45,"mg/dL",40,undefined],
  ["LDL-Kolesterol 130 H mg/dL <100","ldl",130,"mg/dL",undefined,100],
  ["Trigliserid 150 mg/dL 0-150","trigliserid",150,"mg/dL",0,150],
  ["Lökosit  7,2  10^3/µL  4,0 - 10,0","wbc",7.2,"10^3/µL",4,10],
  ["Trombosit 250.000 /mm3 150.000-450.000","plt",250000,"/mm3",150000,450000],
  ["Trombosit 1.250 10^3/uL 150-450","plt",1250,"10^3/uL",150,450],
  ["TSH 2,1 uIU/mL 0,27-4,2","tsh",2.1,"uIU/mL",0.27,4.2],
  ["Serbest T4 1,1 ng/dL 0,93-1,7","ft4",1.1,"ng/dL",0.93,1.7],
  ["Vitamin B12 245 pg/mL 197-771","b12",245,"pg/mL",197,771],
  ["Vitamin D 25-OH 18,3 ng/mL 30-100","d3",18.3,"ng/mL",30,100],
  ["25-OH Vitamin D 18.3 ng/mL 30-100","d3",18.3,"ng/mL",30,100],
  ["Ferritin 12 ng/mL 13 - 150","ferritin",12,"ng/mL",13,150],
  ["ALT (SGPT) 22 U/L 0-35","alt",22,"U/L",0,35],
  ["Bilirubin Direkt 0,2 mg/dL 0-0,3","bil_d",0.2,"mg/dL",0,0.3],
  ["Kreatinin 0.8 mg/dL 0.5-0.9","kreatinin",0.8,"mg/dL",0.5,0.9],
  ["CRP 3,2 mg/L < 5","crp",3.2,"mg/L",undefined,5],
  ["Üre 31 mg/dL 17-43","ure",31,"mg/dL",17,43],
  ["Sodyum 140 mmol/L 136 - 145","sodyum",140,"mmol/L",136,145],
  ["Glukoz > 500 mg/dL 70-100","glukoz",500,"mg/dL",70,100],
  ["Demir 45 L ug/dL 50-170","demir",45,"ug/dL",50,170],
  ["Kolesterol (Total) 1.234,5 mg/dL 0-200","kolesterol",1234.5,"mg/dL",0,200],
  ["Anti-HBs 12,5 mIU/mL < 10","anti_hbs",12.5,"mIU/mL",undefined,10]
];
for(const [line,k,v,u,lo,hi] of table){
  const r=P(line);
  ok("satır: "+line,r&&r.k===k&&r.v===v&&r.u===u&&r.lo===lo&&r.hi===hi,r);
}
ok("< niteleyicisi korunur",P("Glukoz < 20 mg/dL 70-100").q==="<");
ok("bilinmeyen ad birim ve aralıkla kabul edilir, tahmin işareti yok",(r=>r&&!r.guess&&r.n==="Anti-HBs")(P("Anti-HBs 12,5 mIU/mL 0 - 10")));
ok("bilinmeyen ad birim/aralık eksikse tahmin işaretlenir",P("Akreditasyon No: 123 ISO 15189").guess===true);
ok("bilinmeyen ad birim ve aralık olmadan reddedilir",P("Kontrol Sayısı 12")===null);
ok("nitel sonuç: bilinen ad olmayınca atlanır",P("HIV Negatif")===null);

// Hasta ve belge satırları sonuç sayılmaz
for(const l of ["Hasta Adı Soyadı: Ali Veli","T.C. Kimlik No: 12345678901","Protokol No 1234567","Doğum Tarihi 12.03.1985","Sayfa 1 / 3","Numune Tarihi: 12.09.2026 08:14","Telefon: 0212 555 44 33","Dr. Ayşe Yılmaz Uzm. 12345","Barkod No 8690526010113","Rapor Onay: 12.09.2026 15:00","Kolesterol düzeyi yüksektir, 3 ay sonra tekrar","Test Adı Sonuç Birim Referans Aralığı","12.09.2026 14:32"])
  ok("sonuç değil: "+l,P(l)===null,P(l));

// Sayılar
const nums=[["1,5",1.5],["1.5",1.5],["1.234,5",1234.5],["1,234.5",1234.5],["250.000",250000],["0,27",0.27],["12",12],["3.2",3.2]];
for(const [s,v] of nums)ok("sayı "+s,L.toNum(s)===v,L.toNum(s));
ok("sayı olmayan null",L.toNum("abc")===null&&L.toNum("")===null);

// Tarih
const today="2026-10-01";
ok("numune tarihi önceliklidir",L.parseDate(["Rapor Tarihi: 14.09.2026","Numune Alım Tarihi: 12.09.2026"],today)==="2026-09-12");
ok("tarih gg/aa/yyyy ve yyyy-aa-gg",L.parseDate(["Numune: 3/9/2026"],today)==="2026-09-03"&&L.parseDate(["Örnek Tarihi 2026-08-30"],today)==="2026-08-30");
ok("yalnızca rapor tarihi varsa o kullanılır",L.parseDate(["Rapor Tarihi: 14.09.2026"],today)==="2026-09-14");
ok("gelecek ve geçersiz tarih reddedilir",L.parseDate(["Numune Tarihi: 12.12.2026"],today)===null&&L.parseDate(["Numune Tarihi: 31.02.2026"],today)===null);
ok("doğum tarihi tarih sayılmaz",L.parseDate(["Doğum Tarihi 12.03.1985"],today)===null);

// Satır gruplama
const it=(str,x,y,w)=>({str,x,y,w});
const g=L.groupLines([it("98",200,700,10),it("Glukoz",50,700.8,30),it("mg/dL",260,700,25),it("70 - 100",330,699.5,40),it("TSH",50,680,15),it("2,1",200,680,12)]);
ok("satır gruplama: sütunlar ayrılır, yükseklik toleransı",g.length===2&&g[0]==="Glukoz  98  mg/dL  70 - 100"&&g[1]==="TSH  2,1",g);
ok("gruplanan satır ayrıştırılır",P(g[0]).v===98&&P(g[0]).hi===100);
ok("bitişik parçalar birleşir",L.groupLines([it("Glu",50,10,10),it("koz",60,10,10)])[0]==="Glukoz");

// cleanLabs
const base={day:"2026-09-12",n:"Glukoz",k:"glukoz",v:98,u:"mg/dL",lo:70,hi:100};
const cl=L.cleanLabs([base,{...base},{...base,day:"bozuk"},{...base,v:NaN},{...base,n:""},{...base,v:1e9},{...base,v:105,lo:"x"},{day:"2026-09-12",n:"HIV",t:"Negatif"},null,{...base,v:99,q:"="}]);
ok("cleanLabs: geçersiz ve yinelenenleri atar",cl.length===4&&cl.map(x=>x.v).join()==="98,105,,99",cl);
ok("cleanLabs: bozuk aralık atılır, id yeniden numaralanır",cl[1].lo===undefined&&cl.map(x=>x.id).join()==="1,2,3,4");
ok("cleanLabs: dizi olmayan girdi boş döner",L.cleanLabs(null).length===0&&L.cleanLabs("x").length===0);
ok("cleanLabs: 5000 satırla sınırlı",L.cleanLabs(Array.from({length:6000},(_,i)=>({...base,v:i}))).length===5000);

// flag ve seri
ok("aralık dışı yalnızca laboratuvar aralığıyla",L.flag({v:60,lo:70,hi:100})==="low"&&L.flag({v:130,lo:70,hi:100})==="high"&&L.flag({v:80,lo:70,hi:100})===null&&L.flag({v:80})===null&&L.flag({t:"Negatif"})===null);
const ser=L.series(L.cleanLabs([{...base,day:"2026-09-12"},{...base,day:"2026-03-01",v:90},{...base,day:"2026-06-01",v:5.4,u:"mmol/L"},{day:"2026-09-12",n:"HIV",t:"Negatif"}]));
ok("birim değişirse ayrı seri, tarih sırası",ser.length===2&&ser.find(s=>s.u==="mg/dL").pts.map(p=>p.v).join()==="90,98"&&ser.find(s=>s.u==="mmol/L").pts.length===1,ser);

// Sözlük çakışması olmaz
const seen=new Map();let dup=[];
for(const d of L.DICT)for(const a of d.a){if(seen.has(a)&&seen.get(a)!==d.k)dup.push(a);seen.set(a,d.k)}
ok("takma adlar iki teste birden ait değil",dup.length===0,dup);

// PDF yaz-oku: elle yazılmış metin PDF'i gerçek pdf.js ile oku
const {textPdf}=require("./pdfmaker.js");
// "Bu ne?" bilgisi: her kalemde dolu, yorumsuz, kısa; yalnız sözlükteki kalemlerde
const BAN=/yuksek|dusuk|normal|risk|hastalik|tani|tanisi|tanilama|belirti|gosterir ki|tedavi|oneri|yorum/;
for(const d of L.DICT){
  ok("bilgi dolu: "+d.k,!!(d.n&&d.c&&d.e),d);
  ok("bilgi yasak sözcük yok: "+d.k,!BAN.test(L.fold(d.c+" "+d.e)),d.e);
  ok("bilgi en çok 160 karakter: "+d.k,d.e.length<=160&&d.c.length<=40,d.e.length);
}
ok("alias ile içe aktarılan kalemde bilgi var",L.info(L.parseLine("Total Kolesterol 190 mg/dL < 200").k)?.c==="Yağ profili");
ok("PDF/OCR alias (Açlık kan şekeri) bilgi var",!!L.info(L.parseLine("Açlık Kan Şekeri 98 mg/dL 70-100").k));
ok("tanınmayan kalemde bilgi yok",L.info(L.parseLine("Bilinmeyen Test 5 mg/dL 1-9").k)===undefined&&L.info(L.keyFor("Bilinmeyen Test"))===undefined);
(async()=>{
  const lib=await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data=textPdf([
    [["Hasta Adi Soyadi: Ali Veli",40]],[["T.C. Kimlik No: 12345678901",40]],[["Numune Alim Tarihi: 12.09.2026",40]],[["Protokol No 7654321",40]],
    [["Test",40],["Sonuc",200],["Birim",260],["Referans",340]],
    [["Glukoz (Aclik)",40],["98",200],["mg/dL",260],["70 - 100",340]],
    [["Lökosit",40],["7,2",200],["10^3/uL",260],["4,0 - 10,0",340]],
    [["HbA1c",40],["5,4",200],["%",260],["4,0-5,6",340]],
    [["LDL-Kolesterol",40],["130",200],["mg/dL",260],["< 100",340]]
  ]);
  const ex=await L.extract(lib,data);
  const r=L.parseLines(ex.lines,"2026-10-01");
  ok("gerçek pdf.js ile satırlar okunur",ex.lines&&ex.lines.length>=9,ex);
  ok("PDF'ten tarih ve 4 sonuç çıkar",r.date==="2026-09-12"&&r.rows.map(x=>x.k).join()==="glukoz,wbc,hba1c,ldl",r);
  ok("PDF'ten değer, birim ve aralık doğru",r.rows[0].v===98&&r.rows[0].u==="mg/dL"&&r.rows[0].hi===100&&r.rows[1].v===7.2&&r.rows[3].hi===100,r.rows);
  ok("hasta bilgileri hiçbir satıra girmez",!JSON.stringify(r.rows).match(/Ali|Veli|12345678901|7654321/));
  const sc=await L.extract(lib,textPdf([[["Sayfa",40]]]));
  ok("rakamsız (taranmış) PDF anlaşılır işaretlenir",sc.scanned===true);
  const bd=await L.extract(lib,new Uint8Array([1,2,3,4]));
  ok("PDF olmayan dosya hata mesajı verir",!!bd.error);

  // Taranmış PDF: metin katmansız sayfalar sahte yerel OCR'a verilir
  const scan=textPdf([[["Sayfa",40]]]),page=n=>({lines:[{t:"Glukoz",x:10,y:100*n,w:60,h:10},{t:"98",x:100,y:100*n,w:20,h:10},{t:"mg/dL",x:140,y:100*n,w:40,h:10},{t:"70 - 100",x:200,y:100*n,w:50,h:10}]});
  const mk=(o={})=>{const log={rec:0,prog:[]};return {log,ocr:{render:async pg=>"B64",recognize:async()=>{log.rec++;if(o.fail)throw new Error("x");return o.res||page(1)},progress:(i,n)=>log.prog.push(i+"/"+n),cancelled:()=>o.cancel&&o.cancel(log)}}};
  let m=mk(),so=await L.extract(lib,scan.slice(),undefined,m.ocr),sr=L.parseLines(so.lines,"2026-10-01");
  ok("metin katmansız PDF sayfa görüntüsüyle OCR'a gider ve ayrıştırılır",m.log.rec===1&&sr.rows.length===1&&sr.rows[0].k==="glukoz"&&sr.rows[0].v===98,[m.log,so]);
  ok("OCR eklentisi yoksa taranmış mesajı kalır",(await L.extract(lib,scan.slice())).scanned===true);
  m=mk({cancel:l=>l.rec>=1});so=await L.extract(lib,scan.slice(),undefined,m.ocr);
  ok("iptal edilince okuma durur",so.cancelled===true&&!so.lines);
  m=mk({fail:1});so=await L.extract(lib,scan.slice(),undefined,m.ocr);
  ok("OCR hatası açık mesaj verir",/okunamadı/.test(so.error||""),so);
  m=mk({res:{lines:[{t:"Sayfa",x:1,y:1,w:5,h:10}]}});
  ok("OCR rakam bulamazsa taranmış mesajı kalır",(await L.extract(lib,scan.slice(),undefined,m.ocr)).scanned===true);
  ok("metin katmanlı PDF'te OCR çağrılmaz",await(async()=>{const k=mk();await L.extract(lib,textPdf([[["Glukoz",40],["98",200],["mg/dL",260],["70 - 100",340]]]),undefined,k.ocr);return k.log.rec===0})());

  // Dışa aktarma PDF'i: pdf.js ile tekrar aç
  const jpg=Buffer.from("/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=","base64");
  const pdf=L.buildPdf([{data:new Uint8Array(jpg),w:1,h:1},{data:new Uint8Array(jpg),w:1,h:1},{data:new Uint8Array(jpg),w:1,h:1}]);
  const doc=await lib.getDocument({data:pdf.slice(),verbosity:0}).promise;
  const pg=await doc.getPage(1),vp=pg.getViewport({scale:1});
  ok("üretilen PDF 3 sayfa ve A4 boyutunda açılır",doc.numPages===3&&Math.round(vp.width)===595&&Math.round(vp.height)===842,[doc.numPages,vp.width,vp.height]);
  ok("çok sayfalı taranmış PDF'te yalnız ilk 6 sayfa okunur, sınır bildirilir",await(async()=>{const k=mk(),pg=()=>({data:new Uint8Array(jpg),w:1,h:1}),r=await L.extract(lib,L.buildPdf(Array.from({length:7},pg)),undefined,k.ocr);return k.log.rec===6&&k.log.prog.join()==="1/6,2/6,3/6,4/6,5/6,6/6"&&r.limited&&r.limited.read===6&&r.limited.total===7})());
  const s=Buffer.from(pdf).toString("latin1"),sx=+/startxref\n(\d+)/.exec(s)[1];
  ok("xref konumu doğru (ikili veriyle bile)",s.slice(sx,sx+4)==="xref");
  ok("kayıtlı nesne konumları doğru",(()=>{const m=s.slice(sx).split("\n").slice(3,3+9);return m.every((l,i)=>s.slice(+l.slice(0,10)).startsWith(`${i+1} 0 obj`))})());

  // vendor kopyası node_modules ile birebir aynı
  const v=fs.readFileSync(path.join(__dirname,"../www/vendor/pdfjs/pdf.min.js")),n=fs.readFileSync(path.join(__dirname,"../node_modules/pdfjs-dist/legacy/build/pdf.min.mjs"));
  const w=fs.readFileSync(path.join(__dirname,"../www/vendor/pdfjs/pdf.worker.min.js")),nw=fs.readFileSync(path.join(__dirname,"../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs"));
  ok("gömülü pdf.js testte kullanılanla aynı sürüm",v.equals(n)&&w.equals(nw));
  ok("pdf.js sürümü CVE-2024-4367 düzeltmesinden yeni",(()=>{const [a,b,c]=lib.version.split(".").map(Number);return a>4||(a===4&&(b>2||(b===2&&c>=67)))})(),lib.version);
  console.log(bad?"\n"+bad+" HATA":"\nTüm lab testleri geçti");process.exit(bad?1:0);
// toNum: başı 0 ya da tek noktadan sonra 0 gelen üç haneli ondalıktır, binlik değil; geçersiz takvim günü reddedilir
for(const [s,v] of [["0.850",0.85],["1.050",1.05],["0.005",0.005],["1.500",1500],["12.034.567",12034567],["250.000",250000]])ok("toNum ondalık/binlik: "+s,L.toNum(s)===v,L.toNum(s));
ok("dayOk: 2026-02-31 ve 2026-13-01 reddedilir, 2024-02-29 kabul",!L.dayOk("2026-02-31")&&!L.dayOk("2026-13-01")&&L.dayOk("2024-02-29")&&!L.dayOk("2026-02-29"));
})().catch(e=>{console.log("FAIL beklenmeyen hata",e);process.exit(1)});
