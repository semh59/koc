const {ok,finish}=require("./ok");
const L=require("../www/modules/labs/lablib.js"),fs=require("fs"),path=require("path");
const P=l=>L.parseLine(l);

// Line formats: [line, key, value, unit, low, high]
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
  ok("line: "+line,r&&r.k===k&&r.v===v&&r.u===u&&r.lo===lo&&r.hi===hi,r);
}
ok("the < qualifier is kept",P("Glukoz < 20 mg/dL 70-100").q==="<");
ok("an unknown name with unit and range is accepted without the guess flag",(r=>r&&!r.guess&&r.n==="Anti-HBs")(P("Anti-HBs 12,5 mIU/mL 0 - 10")));
ok("an unknown name missing unit or range is flagged as a guess",P("Akreditasyon No: 123 ISO 15189").guess===true);
ok("an unknown name without unit and range is rejected",P("Kontrol Sayısı 12")===null);
ok("qualitative result: skipped unless the name is known",P("HIV Negatif")===null);
ok("a qualitative word instead of a value is not a result",P("CRP Negatif")===null&&P("Glukoz Normal")===null);
ok("alias: \"Serum Demiri\" is iron",(r=>r&&r.k==="demir"&&r.n==="Demir")(P("Serum Demiri 45 ug/dL 50-170")));
ok("optNum: blank is undefined, text is null, numbers parse",L.optNum("  ")===undefined&&L.optNum(null)===undefined&&L.optNum("abc")===null&&L.optNum("1,5")===1.5);
ok("fmtN: two decimals at most, decimal comma",L.fmtN(5.4)==="5,4"&&L.fmtN(5.456)==="5,46"&&L.fmtN(6)==="6");

// Patient and document lines are not results
for(const l of ["Hasta Adı Soyadı: Ali Veli","T.C. Kimlik No: 12345678901","Protokol No 1234567","Doğum Tarihi 12.03.1985","Sayfa 1 / 3","Numune Tarihi: 12.09.2026 08:14","Telefon: 0212 555 44 33","Dr. Ayşe Yılmaz Uzm. 12345","Barkod No 8690526010113","Rapor Onay: 12.09.2026 15:00","Kolesterol düzeyi yüksektir, 3 ay sonra tekrar","Test Adı Sonuç Birim Referans Aralığı","12.09.2026 14:32"])
  ok("not a result: "+l,P(l)===null,P(l));

const nums=[["1,5",1.5],["1.5",1.5],["1.234,5",1234.5],["1,234.5",1234.5],["250.000",250000],["0,27",0.27],["12",12],["3.2",3.2]];
for(const [s,v] of nums)ok("number "+s,L.toNum(s)===v,L.toNum(s));
ok("non-numbers give null",L.toNum("abc")===null&&L.toNum("")===null);

const today="2026-10-01";
ok("the sample date takes priority",L.parseDate(["Rapor Tarihi: 14.09.2026","Numune Alım Tarihi: 12.09.2026"],today)==="2026-09-12");
ok("dates in dd/mm/yyyy and yyyy-mm-dd",L.parseDate(["Numune: 3/9/2026"],today)==="2026-09-03"&&L.parseDate(["Örnek Tarihi 2026-08-30"],today)==="2026-08-30");
ok("with only a report date, it is used",L.parseDate(["Rapor Tarihi: 14.09.2026"],today)==="2026-09-14");
ok("future and invalid dates are rejected",L.parseDate(["Numune Tarihi: 12.12.2026"],today)===null&&L.parseDate(["Numune Tarihi: 31.02.2026"],today)===null);
ok("a birth date is not a date",L.parseDate(["Doğum Tarihi 12.03.1985"],today)===null);

const it=(str,x,y,w)=>({str,x,y,w});
const g=L.groupLines([it("98",200,700,10),it("Glukoz",50,700.8,30),it("mg/dL",260,700,25),it("70 - 100",330,699.5,40),it("TSH",50,680,15),it("2,1",200,680,12)]);
ok("line grouping: columns are separated, with a height tolerance",g.length===2&&g[0]==="Glukoz  98  mg/dL  70 - 100"&&g[1]==="TSH  2,1",g);
ok("a grouped line parses",P(g[0]).v===98&&P(g[0]).hi===100);
ok("adjacent fragments are joined",L.groupLines([it("Glu",50,10,10),it("koz",60,10,10)])[0]==="Glukoz");

const base={day:"2026-09-12",n:"Glukoz",k:"glukoz",v:98,u:"mg/dL",lo:70,hi:100};
const cl=L.cleanLabs([base,{...base},{...base,day:"bozuk"},{...base,v:NaN},{...base,n:""},{...base,v:1e9},{...base,v:105,lo:"x"},{day:"2026-09-12",n:"HIV",t:"Negatif"},null,{...base,v:99,q:"="}]);
ok("cleanLabs: invalid, duplicate and value-less rows are dropped",cl.length===3&&cl.map(x=>x.v).join()==="98,105,99",cl);
ok("cleanLabs: a broken range is dropped and ids are renumbered",cl[1].lo===undefined&&cl.map(x=>x.id).join()==="1,2,3");
ok("cleanLabs: non-array input returns empty",L.cleanLabs(null).length===0&&L.cleanLabs("x").length===0);
ok("cleanLabs: limited to 5000 rows",L.cleanLabs(Array.from({length:6000},(_,i)=>({...base,v:i}))).length===5000);
ok("cleanLabs: over the cap the newest rows are kept",(c=>c[0].v===1000&&c[4999].v===5999)(L.cleanLabs(Array.from({length:6000},(_,i)=>({...base,v:i})))));

ok("out of range only against the lab's own range",L.flag({v:60,lo:70,hi:100})==="low"&&L.flag({v:130,lo:70,hi:100})==="high"&&L.flag({v:80,lo:70,hi:100})===null&&L.flag({v:80})===null);
const ser=L.series(L.cleanLabs([{...base,day:"2026-09-12"},{...base,day:"2026-03-01",v:90},{...base,day:"2026-06-01",v:5.4,u:"mmol/L"}]));
ok("a unit change gives a separate series, in date order",ser.length===2&&ser.find(s=>s.u==="mg/dL").pts.map(p=>p.v).join()==="90,98"&&ser.find(s=>s.u==="mmol/L").pts.length===1,ser);

const seen=new Map();let dup=[];
for(const d of L.DICT)for(const a of d.a){if(seen.has(a)&&seen.get(a)!==d.k)dup.push(a);seen.set(a,d.k)}
ok("aliases do not belong to two tests at once",dup.length===0,dup);

// PDF round trip: a hand-written text PDF read with the real pdf.js
const {textPdf}=require("./pdfmaker.js");
// "What is this" info: filled, interpretation-free and short for every dictionary item, absent for others
const BAN=/yuksek|dusuk|normal|risk|hastalik|tani|tanisi|tanilama|belirti|gosterir ki|tedavi|oneri|yorum/;
for(const d of L.DICT){
  ok("info filled: "+d.k,!!(d.n&&d.c&&d.e),d);
  ok("info has no forbidden word: "+d.k,!BAN.test(L.fold(d.c+" "+d.e)),d.e);
  ok("info within 160 characters: "+d.k,d.e.length<=160&&d.c.length<=40,d.e.length);
}
ok("an alias-imported item has info",L.info(L.parseLine("Total Kolesterol 190 mg/dL < 200").k)?.c==="Yağ profili");
ok("PDF/OCR alias (Açlık kan şekeri) has info",!!L.info(L.parseLine("Açlık Kan Şekeri 98 mg/dL 70-100").k));
ok("an unrecognised item has no info",L.info(L.parseLine("Bilinmeyen Test 5 mg/dL 1-9").k)===undefined&&L.info(L.keyFor("Bilinmeyen Test"))===undefined);
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
  ok("lines are read with the real pdf.js",ex.lines&&ex.lines.length>=9,ex);
  ok("the date and 4 results come out of the PDF",r.date==="2026-09-12"&&r.rows.map(x=>x.k).join()==="glukoz,wbc,hba1c,ldl",r);
  ok("value, unit and range from the PDF are correct",r.rows[0].v===98&&r.rows[0].u==="mg/dL"&&r.rows[0].hi===100&&r.rows[1].v===7.2&&r.rows[3].hi===100,r.rows);
  ok("patient details never enter any row",!JSON.stringify(r.rows).match(/Ali|Veli|12345678901|7654321/));
  const sc=await L.extract(lib,textPdf([[["Sayfa",40]]]));
  ok("a PDF without digits (scanned) is flagged clearly",sc.scanned===true);
  const bd=await L.extract(lib,new Uint8Array([1,2,3,4]));
  ok("a non-PDF file gives an error message",!!bd.error);

  // Scanned PDF: pages without a text layer go to a fake local OCR
  const scan=textPdf([[["Sayfa",40]]]),page=n=>({lines:[{t:"Glukoz",x:10,y:100*n,w:60,h:10},{t:"98",x:100,y:100*n,w:20,h:10},{t:"mg/dL",x:140,y:100*n,w:40,h:10},{t:"70 - 100",x:200,y:100*n,w:50,h:10}]});
  const mk=(o={})=>{const log={rec:0,prog:[]};return {log,ocr:{render:async pg=>"B64",recognize:async()=>{log.rec++;if(o.fail)throw new Error("x");return o.res||page(1)},progress:(i,n)=>log.prog.push(i+"/"+n),cancelled:()=>o.cancel&&o.cancel(log)}}};
  let m=mk(),so=await L.extract(lib,scan.slice(),undefined,m.ocr),sr=L.parseLines(so.lines,"2026-10-01");
  ok("a PDF without a text layer goes to OCR as page images and is parsed",m.log.rec===1&&sr.rows.length===1&&sr.rows[0].k==="glukoz"&&sr.rows[0].v===98,[m.log,so]);
  ok("without the OCR plugin the scanned message stays",(await L.extract(lib,scan.slice())).scanned===true);
  m=mk({cancel:l=>l.rec>=1});so=await L.extract(lib,scan.slice(),undefined,m.ocr);
  ok("reading stops when cancelled",so.cancelled===true&&!so.lines);
  m=mk({fail:1});so=await L.extract(lib,scan.slice(),undefined,m.ocr);
  ok("an OCR failure gives a clear message",/okunamadı/.test(so.error||""),so);
  m=mk({res:{lines:[{t:"Sayfa",x:1,y:1,w:5,h:10}]}});
  ok("if OCR finds no digits the scanned message stays",(await L.extract(lib,scan.slice(),undefined,m.ocr)).scanned===true);
  ok("OCR is not called for a PDF with a text layer",await(async()=>{const k=mk();await L.extract(lib,textPdf([[["Glukoz",40],["98",200],["mg/dL",260],["70 - 100",340]]]),undefined,k.ocr);return k.log.rec===0})());

  // Export PDF: reopened with pdf.js
  const jpg=Buffer.from("/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=","base64");
  const pdf=L.buildPdf([{data:new Uint8Array(jpg),w:1,h:1},{data:new Uint8Array(jpg),w:1,h:1},{data:new Uint8Array(jpg),w:1,h:1}]);
  const doc=await lib.getDocument({data:pdf.slice(),verbosity:0}).promise;
  const pg=await doc.getPage(1),vp=pg.getViewport({scale:1});
  ok("the generated PDF opens with 3 pages at A4 size",doc.numPages===3&&Math.round(vp.width)===595&&Math.round(vp.height)===842,[doc.numPages,vp.width,vp.height]);
  ok("for a multi-page scanned PDF only the first 6 pages are read and the limit is reported",await(async()=>{const k=mk(),pg=()=>({data:new Uint8Array(jpg),w:1,h:1}),r=await L.extract(lib,L.buildPdf(Array.from({length:7},pg)),undefined,k.ocr);return k.log.rec===6&&k.log.prog.join()==="1/6,2/6,3/6,4/6,5/6,6/6"&&r.limited&&r.limited.read===6&&r.limited.total===7})());
  const s=Buffer.from(pdf).toString("latin1"),sx=+/startxref\n(\d+)/.exec(s)[1];
  ok("the xref offset is correct (even with binary data)",s.slice(sx,sx+4)==="xref");
  ok("the recorded object offsets are correct",(()=>{const m=s.slice(sx).split("\n").slice(3,3+9);return m.every((l,i)=>s.slice(+l.slice(0,10)).startsWith(`${i+1} 0 obj`))})());

  // The vendored pdf.js is byte-identical to the node_modules copy
  const v=fs.readFileSync(path.join(__dirname,"../www/vendor/pdfjs/pdf.min.js")),n=fs.readFileSync(path.join(__dirname,"../node_modules/pdfjs-dist/legacy/build/pdf.min.mjs"));
  const w=fs.readFileSync(path.join(__dirname,"../www/vendor/pdfjs/pdf.worker.min.js")),nw=fs.readFileSync(path.join(__dirname,"../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs"));
  ok("the bundled pdf.js is the same version used in the test",v.equals(n)&&w.equals(nw));
  ok("the pdf.js version is newer than the CVE-2024-4367 fix",(()=>{const [a,b,c]=lib.version.split(".").map(Number);return a>4||(a===4&&(b>2||(b===2&&c>=67)))})(),lib.version);
// toNum: a leading 0 or 0 after a single dot makes three digits a decimal, not thousands
for(const [s,v] of [["0.850",0.85],["1.050",1.05],["0.005",0.005],["1.500",1500],["12.034.567",12034567],["250.000",250000]])ok("toNum decimal/thousands: "+s,L.toNum(s)===v,L.toNum(s));
  ok("a text PDF over the page cap reports the pages left out",await(async()=>{const fake=n=>({getDocument:()=>({promise:Promise.resolve({numPages:n,getPage:async()=>({getTextContent:async()=>({items:[{str:"Glukoz 98 mg/dL",transform:[1,0,0,1,40,700],width:50}]})})}),destroy:async()=>{}})}),r=await L.extract(fake(31),new Uint8Array()),r2=await L.extract(fake(30),new Uint8Array());return r.lines.length===30&&r.limited.read===30&&r.limited.total===31&&!r2.limited})());
  finish();
})().catch(e=>{console.log("FAIL unexpected error",e);process.exit(1)});
