"use strict";
/* Lab result import (PDF text and OCR lines), parsing, validation and PDF report (no DOM).
   It makes no medical comment: it only carries the written values and the lab's own reference range. */
const LabLib=(()=>{
  const MAP={"İ":"i","I":"i","ı":"i","Ç":"c","ç":"c","Ğ":"g","ğ":"g","Ö":"o","ö":"o","Ş":"s","ş":"s","Ü":"u","ü":"u","µ":"u","μ":"u"};
  /* Maps character by character: the length never changes, so a position in the folded text is valid in the original text too. */
  const fold=s=>Array.from(String(s)).map(c=>MAP[c]||c.toLowerCase()).join("");

  /* [key, display name, aliases (folded below), category, what it is (a definition only, no comment)] */
  const DICT=[
    ["glukoz","Glukoz",["glukoz (aclik)","glukoz","glikoz","glucose","aclik kan sekeri","kan sekeri","aks","aclik glukoz","fasting glucose"],"Şeker","Kandaki şeker (glukoz) miktarının ölçümü."],
    ["hba1c","HbA1c",["hemoglobin a1c","hemoglobin a1c (hba1c)","hba1c","hb a1c","a1c","glikozile hemoglobin","glikolize hemoglobin","glycated hemoglobin","glycohemoglobin"],"Şeker","Kırmızı kan hücrelerine bağlanmış şeker (glukoz) oranının ölçümü."],
    ["insulin","İnsülin",["insulin","insulin (aclik)","aclik insulin"],"Hormon","Pankreasın salgıladığı, kandaki şekerle ilgili insülin hormonunun ölçümü."],
    ["kolesterol","Total kolesterol",["total kolesterol","kolesterol (total)","kolesterol total","kolesterol","cholesterol","total cholesterol"],"Yağ profili","Kanda dolaşan toplam yağ (lipit) maddesinin ölçümü."],
    ["ldl","LDL kolesterol",["kolesterol ldl","ldl kolesterol","ldl-kolesterol","ldl (direkt)","ldl cholesterol","ldl-c","ldl"],"Yağ profili","Kandaki yağ (lipit) taşıyan LDL parçacıklarındaki kolesterolün ölçümü."],
    ["hdl","HDL kolesterol",["kolesterol hdl","hdl kolesterol","hdl-kolesterol","hdl cholesterol","hdl-c","hdl"],"Yağ profili","Kandaki yağ (lipit) taşıyan HDL parçacıklarındaki kolesterolün ölçümü."],
    ["vldl","VLDL kolesterol",["vldl kolesterol","vldl-kolesterol","vldl"],"Yağ profili","Kandaki yağ (lipit) taşıyan VLDL parçacıklarındaki kolesterolün ölçümü."],
    ["trigliserid","Trigliserid",["trigliserid","trigliserit","trigliseridler","triglycerides","triglyceride","tg"],"Yağ profili","Kanda dolaşan bir yağ (lipit) türü olan trigliserit miktarının ölçümü."],
    ["tsh","TSH",["tsh","tiroid uyarici hormon","thyroid stimulating hormone"],"Tiroit","Tiroit uyarıcı hormonun ölçümü."],
    ["ft4","Serbest T4",["serbest t4","st4","ft4","free t4","t4 serbest","t4 (serbest)"],"Tiroit","Kanda serbest dolaşan tiroit hormonu T4'ün ölçümü."],
    ["ft3","Serbest T3",["serbest t3","ft3","free t3","t3 serbest","t3 (serbest)"],"Tiroit","Kanda serbest dolaşan tiroit hormonu T3'ün ölçümü."],
    ["b12","Vitamin B12",["vitamin b12","vitamin b-12","vit b12","vit. b12","b12 vitamini","b12","cobalamin"],"Vitamin ve mineral","Kandaki B12 vitamininin (kobalamin) ölçümü."],
    ["d3","D vitamini (25-OH)",["25-oh vitamin d","25 oh vitamin d","25(oh) vitamin d","25-hidroksi vitamin d","25-oh d vitamini","25 hidroksi vitamin d","vitamin d total","vitamin d3","vitamin d","d vitamini","d vit"],"Vitamin ve mineral","Kandaki D vitamininin dolaşımdaki biçiminin (25-OH) ölçümü."],
    ["folat","Folat",["folik asit","folat","folate"],"Vitamin ve mineral","Kandaki folat (B9 vitamini, folik asit) miktarının ölçümü."],
    ["ferritin","Ferritin",["ferritin"],"Demir","Vücudun depoladığı demirle ilişkili ferritin proteininin ölçümü."],
    ["demir","Demir",["demiri","demir (serum)","demir","iron"],"Demir","Kandaki demir miktarının ölçümü."],
    ["tdbk","Demir bağlama kapasitesi",["total demir baglama kapasitesi","demir baglama kapasitesi","demir baglama","tdbk","tibc","dbk"],"Demir","Kandaki proteinlerin bağlayabildiği toplam demir miktarının ölçümü."],
    ["hgb","Hemoglobin",["hemoglobin","hgb","hb"],"Tam kan sayımı","Kırmızı kan hücrelerindeki oksijen taşıyan hemoglobin proteininin ölçümü."],
    ["hct","Hematokrit",["hematokrit","hct"],"Tam kan sayımı","Kan hacminin kırmızı hücrelerin oluşturduğu yüzdesinin ölçümü."],
    ["wbc","Lökosit",["lokosit","wbc","beyaz kure","beyaz kan hucresi"],"Tam kan sayımı","Kandaki beyaz kan hücresi (lökosit) sayısının ölçümü."],
    ["rbc","Eritrosit",["eritrosit","rbc","kirmizi kure"],"Tam kan sayımı","Kandaki kırmızı kan hücresi (eritrosit) sayısının ölçümü."],
    ["plt","Trombosit",["trombosit","plt","platelet"],"Tam kan sayımı","Kandaki trombosit (kan pulcuğu) sayısının ölçümü."],
    ["mcv","MCV",["mcv"],"Tam kan sayımı","Kırmızı kan hücrelerinin ortalama hacminin ölçümü."],
    ["kreatinin","Kreatinin",["kreatinin","creatinine"],"Böbrek","Kanda bulunan kreatinin adlı atık maddenin ölçümü."],
    ["ure","Üre",["kan ure azotu","ure","bun","urea"],"Böbrek","Kanda bulunan üre (kan üre azotu) adlı atık maddenin ölçümü."],
    ["alt","ALT",["alt (sgpt)","alt","sgpt","alanin aminotransferaz","alanine aminotransferase"],"Karaciğer","Başta karaciğerde bulunan ALT enziminin kandaki ölçümü."],
    ["ast","AST",["ast (sgot)","ast","sgot","aspartat aminotransferaz","aspartate aminotransferase"],"Karaciğer","Karaciğer ve kasta bulunan AST enziminin kandaki ölçümü."],
    ["ggt","GGT",["gama gt","gama glutamil transferaz","ggt","gamma gt"],"Karaciğer","Karaciğer ve safra yollarında bulunan GGT enziminin kandaki ölçümü."],
    ["alp","ALP",["alkalen fosfataz","alkalin fosfataz","alp"],"Karaciğer","Karaciğer ve kemikte bulunan alkalen fosfataz enziminin kandaki ölçümü."],
    ["bil_t","Bilirubin (total)",["bilirubin total","bilirubin (total)","total bilirubin","bilirubin t"],"Karaciğer","Kandaki toplam bilirubin (kırmızı hücre yıkımından oluşan sarı madde) ölçümü."],
    ["bil_d","Bilirubin (direkt)",["bilirubin direkt","bilirubin (direkt)","direkt bilirubin","bilirubin d"],"Karaciğer","Kandaki direkt (konjuge) bilirubin ölçümü."],
    ["urikasit","Ürik asit",["urik asit","uric acid"],"Böbrek","Kanda bulunan ürik asit adlı atık maddenin ölçümü."],
    ["sodyum","Sodyum",["sodyum","sodium","na"],"Elektrolit","Kandaki sodyum (tuz mineralinin bir bileşeni) miktarının ölçümü."],
    ["potasyum","Potasyum",["potasyum","potassium","k"],"Elektrolit","Kandaki potasyum mineralinin miktarının ölçümü."],
    ["kalsiyum","Kalsiyum",["kalsiyum","calcium","ca"],"Vitamin ve mineral","Kandaki kalsiyum mineralinin miktarının ölçümü."],
    ["magnezyum","Magnezyum",["magnezyum","magnesium","mg"],"Vitamin ve mineral","Kandaki magnezyum mineralinin miktarının ölçümü."],
    ["fosfor","Fosfor",["fosfor","phosphorus","inorganik fosfor"],"Vitamin ve mineral","Kandaki fosfor mineralinin miktarının ölçümü."],
    ["klor","Klor",["klor","chloride"],"Elektrolit","Kandaki klor (klorür) miktarının ölçümü."],
    ["crp","CRP",["c reaktif protein","c-reaktif protein","crp","c reactive protein"],"İltihap göstergesi","Karaciğerin ürettiği C-reaktif proteinin kandaki ölçümü."],
    ["sedim","Sedimantasyon",["sedimantasyon","sedim","esr"],"İltihap göstergesi","Kırmızı kan hücrelerinin bir saatte tüpün dibine çökme hızının ölçümü."],
    ["albumin","Albümin",["albumin"],"Protein","Kandaki başlıca protein olan albüminin ölçümü."],
    ["tprotein","Total protein",["total protein","protein total","protein (total)"],"Protein","Kandaki toplam protein miktarının ölçümü."],
    ["psa","PSA (total)",["total psa","psa total","psa"],"Prostat","Prostat bezinin ürettiği PSA proteininin kandaki toplam ölçümü."],
    ["kortizol","Kortizol",["kortizol","cortisol"],"Hormon","Böbreküstü bezinin salgıladığı kortizol hormonunun ölçümü."]
  ].map(([k,n,a,c,e])=>({k,n,c,e,a:Array.from(new Set(a.map(fold))).sort((x,y)=>y.length-x.length)}));
  const ALIASES=DICT.flatMap(d=>d.a.map(a=>({a,d}))).sort((x,y)=>y.a.length-x.a.length);
  const info=k=>DICT.find(d=>d.k===k);
  const isL=c=>/[a-z0-9]/.test(c||"");

  /* Patient and document lines: never a result, never stored. */
  const SKIP=/(^|[^a-z])(tc|t\.c|kimlik|protokol|dogum|hasta|adi|soyad|telefon|tel|gsm|adres|barkod|sayfa|page|doktor|dr|uzm|prof|dop|yas|cinsiyet|kurum|hastane|laboratuvar|laboratuar|numune|ornek|rapor|onay|tarih|sigorta|sgk|talep|istem|e-posta|mail|web|www|fax|faks|imza)([^a-z]|$)/;
  const FLAGS=new Set(["h","l","*","h*","l*","yuksek","dusuk","high","low","(h)","(l)","↑","↓","h↑","l↓","h/","l/"]);

  const UNIT=/^(?:[a-zA-Zµμ%°\/^·×*][a-zA-Z0-9µμ%°\/^·×*³⁹¹²\-\.]*|10[\^*]?[0-9³⁶⁹]\/[a-zA-Zµμ]+)$/;
  const isNumTok=t=>/^[<>]?=?\d[\d.,]*$/.test(t);
  const CMP=/^[<>]=?$/,HAS_LETTER=/[A-Za-zÇĞİÖŞÜçğıöşü]/,HAS_WORD=/[A-Za-zÇĞİÖŞÜçğıöşü]{2}/,TAIL_TOK=/^\(?[A-Za-zÇĞİÖŞÜçğıöşü0-9.\-]{1,10}\)?:?$/;
  const slug=n=>fold(n).replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"").slice(0,30)||"x";
  const VALUE_MAX=1e7,LINE_MAX=200,PDF_PAGES_MAX=30,OCR_PAGES=6,LABS_MAX=5000;
  const ROW_TOL=2.5,COLUMN_GAP=6,WORD_GAP=0.4;

  /* Reads one number written in Turkish or English style ("1.234,5", "1,234.5", "0,27"); null when the text is not exactly a number. */
  function toNum(s){
    s=String(s).trim();
    if(!/^\d[\d.,]*$/.test(s))return null;
    const c=s.includes(","),d=s.includes(".");
    let v;
    if(c&&d)v=s.lastIndexOf(",")>s.lastIndexOf(".")?s.replace(/\./g,"").replace(",","."):s.replace(/,/g,"");
    else if(c)v=s.replace(",",".");
    else if(d)v=/^[1-9]\d{0,2}(\.\d{3})+$/.test(s)&&!/^\d+\.0(?!00$)\d\d$/.test(s)?s.replace(/\./g,""):s;
    else v=s;
    const n=Number(v);return Number.isFinite(n)?n:null;
  }

  /* Blank text means "not entered" (undefined); anything else must be a number (toNum, null when it is not). */
  const optNum=s=>{const t=String(s==null?"":s).trim();return t===""?undefined:toNum(t)};

  /* Turns pdf.js text pieces (str,x,y,w) into lines: pieces at the same height are ordered left to right, wide gaps become column separators. */
  function groupLines(items){
    const its=items.filter(i=>i&&typeof i.str==="string"&&i.str.trim()!=="").sort((a,b)=>b.y-a.y||a.x-b.x);
    const rows=[];
    for(const it of its){
      const r=rows.find(r=>Math.abs(r.y-it.y)<=ROW_TOL);
      if(r)r.items.push(it);else rows.push({y:it.y,items:[it]});
    }
    rows.sort((a,b)=>b.y-a.y);
    return rows.map(r=>{
      r.items.sort((a,b)=>a.x-b.x);
      let s="",end=null;
      for(const it of r.items){
        if(end!==null){const gap=it.x-end;s+=gap>COLUMN_GAP?"  ":gap>WORD_GAP?" ":""}
        s+=it.str.trim();end=it.x+(it.w||0);
      }
      return s.replace(/[ \t]+$/,"");
    }).filter(Boolean);
  }

  /* Loose date reading: dd.mm.yyyy, dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd. */
  function dateIn(s){
    let m=s.match(/(\d{1,2})[./-](\d{1,2})[./-]((?:19|20)\d{2})/),y,mo,d;
    if(m){d=+m[1];mo=+m[2];y=+m[3]}
    else if((m=s.match(/((?:19|20)\d{2})-(\d{1,2})-(\d{1,2})/))){y=+m[1];mo=+m[2];d=+m[3]}
    else return null;
    const dt=new Date(y,mo-1,d);
    if(dt.getFullYear()!==y||dt.getMonth()!==mo-1||dt.getDate()!==d||y<1990)return null;
    return `${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  }
  /* The sample date comes first, then the admission / report / approval date. A future date is not accepted. */
  function parseDate(lines,todayKey){
    const tiers=[/numune|ornek|alim|toplama|kan\s*alma/,/kabul/,/rapor|onay|sonuc|tarih/];
    for(const re of tiers)for(const l of lines){
      if(!re.test(fold(l)))continue;
      const k=dateIn(l);if(k&&(!todayKey||k<=todayKey))return k;
    }
    return null;
  }

  /* Reference range: "70 - 100", "0,27-4,2", "< 200", "> 40". */
  function parseRange(rest){
    let m=rest.match(/(\d[\d.,]*)\s*[-–—]\s*(\d[\d.,]*)/);
    if(m){const lo=toNum(m[1]),hi=toNum(m[2]);if(lo!=null&&hi!=null&&lo<=hi)return {lo,hi}}
    m=rest.match(/<\s*=?\s*(\d[\d.,]*)/);if(m){const hi=toNum(m[1]);if(hi!=null)return {hi}}
    m=rest.match(/>\s*=?\s*(\d[\d.,]*)/);if(m){const lo=toNum(m[1]);if(lo!=null)return {lo}}
    return {};
  }

  /* The test at the start of a line (after leading blanks and a sample prefix such as "Serum"): {d: dictionary entry, end: its end offset in `line`}. */
  function findAlias(line){
    const lead=line.length-line.trimStart().length,f0=fold(line).slice(lead);
    const skip=f0.match(/^(serum|plazma|plasma|tam kan)\s+/)?.[0].length||0,f=f0.slice(skip);
    for(const {a,d} of ALIASES){
      if(!f.startsWith(a)||isL(f[a.length]))continue;
      return {d,end:lead+skip+a.length};
    }
    return null;
  }

  /* Turns one line into a result; null when it is not a result. */
  function parseLine(line){
    const raw=String(line).replace(/\t/g," ").trim();
    if(raw.length<3||raw.length>LINE_MAX)return null;
    if(SKIP.test(fold(raw)))return null;
    if(!HAS_LETTER.test(raw))return null;
    const hit=findAlias(raw);
    let name,key=null,toks,nTail=0;
    if(hit){
      key=hit.d.k;name=hit.d.n;
      // up to 2 words such as "(Açlık)" between the name and the value are skipped
      toks=raw.slice(hit.end).trim().split(/\s+/);
      let i=0;while(i<toks.length&&i<3&&!isNumTok(toks[i])&&!CMP.test(toks[i]))i++;
      const tail=i<=2&&toks.slice(0,i).every(t=>TAIL_TOK.test(t));
      if(i>=toks.length||!tail)return null;
      toks=toks.slice(i);nTail=i;
    }else{
      const all=raw.split(/\s+/);
      let i=1;while(i<all.length&&!(isNumTok(all[i])||(CMP.test(all[i])&&isNumTok(all[i+1]||""))))i++;
      if(i>=all.length||i>6)return null;
      name=all.slice(0,i).join(" ").replace(/[:\-–]+$/,"").trim();
      if(name.length<2||name.length>50||!HAS_WORD.test(name)||/^\d/.test(name))return null;
      toks=all.slice(i);
    }
    let q="";
    if(CMP.test(toks[0])){q=toks[0][0];toks=toks.slice(1)}
    let first=toks[0]||"";
    if(/^[<>]=?\d/.test(first)){q=first[0];first=first.replace(/^[<>]=?/,"")}
    const v=toNum(first);
    if(v==null||v>VALUE_MAX)return null;
    let r=toks.slice(1);
    while(r.length&&FLAGS.has(fold(r[0])))r=r.slice(1);
    let u="";
    if(r.length&&!isNumTok(r[0])&&!/^[<>]/.test(r[0])&&UNIT.test(r[0])&&!FLAGS.has(fold(r[0]))){u=r[0];r=r.slice(1)}
    // joins split units such as "10^3 / µL"
    if(/^(?:x|×)?10(?:\^|\*)?\d?$/.test(u)&&r[0]&&/^\/?[a-zA-Zµμ]+/.test(r[0])){u+=r[0];r=r.slice(1)}
    const rest2=r.join(" ");
    const rng=parseRange(rest2);
    const hasR=rng.lo!=null||rng.hi!=null;
    if(!key&&!u&&!hasR)return null; // an unknown name without a unit or range is not a result
    if(key&&nTail>0&&!u&&!hasR)return null;
    if(u.length>20)u=u.slice(0,20);
    const o={k:key||slug(name),n:name.slice(0,60),v};
    if(q)o.q=q;if(u)o.u=u;if(rng.lo!=null)o.lo=rng.lo;if(rng.hi!=null)o.hi=rng.hi;
    if(!key&&!(u&&hasR))o.guess=true;
    return o;
  }

  function parseLines(lines,todayKey){
    const rows=[];
    for(const l of lines){const r=parseLine(l);if(r)rows.push(r)}
    return {date:parseDate(lines,todayKey),rows};
  }

  /* Reads the text with pdf.js. lib: pdfjs-dist; data: Uint8Array. A password-protected file returns {need:"password"}.
     ocr (optional): when there is no text layer the pages are read as images: {render(page)->base64, recognize(base64)->ML Kit result, progress(i,n), cancelled()}.
     `limited` ({read,total}) is set when pages were left out. */
  async function extract(lib,data,password,ocr){
    let doc,task;
    try{
      task=lib.getDocument({data,password,isEvalSupported:false,useSystemFonts:false,verbosity:0});doc=await task.promise;
    }catch(e){
      if(e&&e.name==="PasswordException")return {need:"password",wrong:e.code===2};
      return {error:"Bu dosya PDF olarak açılamadı"};
    }
    const total=doc.numPages,clip=n=>total>n?{read:n,total}:null;
    try{
      const lines=[],n=Math.min(total,PDF_PAGES_MAX);
      for(let p=1;p<=n;p++){
        const pg=await doc.getPage(p),tc=await pg.getTextContent();
        lines.push(...groupLines(tc.items.map(i=>({str:i.str,x:i.transform[4],y:i.transform[5],w:i.width}))));
      }
      if(lines.some(l=>/\d/.test(l)))return n<total?{lines,limited:clip(n)}:{lines};
      if(!ocr)return {scanned:true,lines:[]};
      const out=[],m=Math.min(total,OCR_PAGES);
      for(let p=1;p<=m;p++){
        if(ocr.cancelled?.())return {cancelled:true};
        ocr.progress?.(p,m);
        const pg=await doc.getPage(p);
        try{out.push(...ocrToLines(await ocr.recognize(await ocr.render(pg))))}
        catch(e){return {error:"Taranmış PDF'in yazısı okunamadı, fotoğraftan okumayı dene"}}
        pg.cleanup();
      }
      if(ocr.cancelled?.())return {cancelled:true};
      if(!out.some(l=>/\d/.test(l)))return {scanned:true,lines:[]};
      return {lines:out,limited:clip(m)};
    }finally{await task.destroy()} // pdf.js 5+ closes through the loading task
  }

  const ALGO=typeof Algo!=="undefined"?Algo:require("../../kernel/algo.js"),{dayOk}=ALGO;
  const fin=x=>typeof x==="number"&&Number.isFinite(x);
  /* Validates stored rows and drops invalid ones; over the cap the newest rows are kept. */
  function cleanLabs(arr){
    const out=[],seen=new Set();let id=1;
    for(const x of (Array.isArray(arr)?arr:[]).slice(-LABS_MAX)){
      if(!x||!dayOk(x.day)||typeof x.n!=="string"||!x.n.trim()||!fin(x.v)||x.v<0||x.v>VALUE_MAX)continue;
      const o={id:0,day:x.day,k:typeof x.k==="string"&&/^[a-z0-9_]{1,30}$/.test(x.k)?x.k:slug(x.n),n:x.n.trim().slice(0,60),v:x.v};
      if(x.q==="<"||x.q===">")o.q=x.q;
      if(typeof x.u==="string"&&x.u.trim())o.u=x.u.trim().slice(0,20);
      if(fin(x.lo))o.lo=x.lo;if(fin(x.hi))o.hi=x.hi;
      const sig=[o.k,o.day,o.u||"",o.v].join("|");if(seen.has(sig))continue;seen.add(sig);
      o.id=id++;out.push(o);
    }
    return out;
  }

  /* Outside the range? Compares only with the range the lab wrote. "low" / "high" / null. */
  function flag(r){
    if(r.lo!=null&&r.v<r.lo)return "low";
    if(r.hi!=null&&r.v>r.hi)return "high";
    return null;
  }

  /* One series per (test, unit): a changed unit never mixes into the same chart. */
  function series(labs){
    const m=new Map();
    for(const r of labs){
      const id=r.k+"|"+(r.u||"");
      if(!m.has(id))m.set(id,{id,k:r.k,n:r.n,u:r.u||"",pts:[]});
      m.get(id).pts.push(r);
    }
    for(const s of m.values())s.pts.sort((a,b)=>a.day<b.day?-1:a.day>b.day?1:a.id-b.id);
    return [...m.values()].sort((a,b)=>a.n.localeCompare(b.n,"tr"));
  }

  /* Minimal PDF: every page is one full-size JPEG. Turkish characters are drawn on the canvas, so there is no font problem. */
  function buildPdf(pages){
    const enc=new TextEncoder(),parts=[],offs=[];let len=0;
    const push=b=>{const u=typeof b==="string"?enc.encode(b):b;parts.push(u);len+=u.length};
    const obj=(n,body)=>{offs[n]=len;push(`${n} 0 obj\n`);if(typeof body==="string")push(body);else body.forEach(push);push("\nendobj\n")};
    const n=pages.length;
    push("%PDF-1.4\n%âãÏÓ\n");
    obj(1,"<< /Type /Catalog /Pages 2 0 R >>");
    obj(2,`<< /Type /Pages /Kids [${pages.map((_,i)=>`${3+i*3} 0 R`).join(" ")}] /Count ${n} >>`);
    pages.forEach((p,i)=>{
      const pg=3+i*3,im=pg+1,ct=pg+2,draw="q 595 0 0 842 0 0 cm /Im0 Do Q";
      obj(pg,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 ${im} 0 R >> >> /Contents ${ct} 0 R >>`);
      obj(im,[`<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.data.length} >>\nstream\n`,p.data,"\nendstream"]);
      obj(ct,`<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`);
    });
    const xr=len,total=3+n*3;
    let x=`xref\n0 ${total}\n0000000000 65535 f \n`;
    for(let i=1;i<total;i++)x+=String(offs[i]).padStart(10,"0")+" 00000 n \n";
    push(x+`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF\n`);
    const out=new Uint8Array(len);let p=0;for(const u of parts){out.set(u,p);p+=u.length}
    return out;
  }

  /* When the name is edited the key is found again: the dictionary key if the name is in the dictionary, otherwise a slug of the name. */
  function keyFor(name){const h=findAlias(String(name).trim());return h?h.d.k:slug(name)}

  /* ---- PDF report: the canvas context is passed in, so it can be tried without a DOM ---- */
  const RW=1240,RH=1754,RM=70,BLOCK=250,HEAD=190,FOOT=80;
  const dayN=ALGO.dayNum,fmtD=k=>ALGO.fdate(k,true);
  const fmtN=v=>String(Number(v.toFixed(2))).replace(".",",");
  const rangeText=r=>r.lo!=null&&r.hi!=null?`${fmtN(r.lo)} – ${fmtN(r.hi)}`:r.hi!=null?`< ${fmtN(r.hi)}`:r.lo!=null?`> ${fmtN(r.lo)}`:"";
  /* Splits into pages: the first page keeps room for the title. */
  function paginate(list){
    const pages=[];let cur=[],cap=Math.floor((RH-RM-HEAD-FOOT)/BLOCK);
    for(const s of list){if(cur.length>=cap){pages.push(cur);cur=[];cap=Math.floor((RH-RM-FOOT-RM)/BLOCK)}cur.push(s)}
    pages.push(cur);return pages;
  }
  /* Drawing coordinates of a series: x is proportional to the date, y to the value; the reference band comes from the last row that has a range. */
  function geom(s,x0,y0,w,h){
    const pts=s.pts,last=[...pts].reverse().find(p=>p.lo!=null||p.hi!=null)||{};
    let lo=Math.min(...pts.map(p=>p.v)),hi=Math.max(...pts.map(p=>p.v));
    if(last.lo!=null)lo=Math.min(lo,last.lo);if(last.hi!=null)hi=Math.max(hi,last.hi);
    if(hi===lo){hi+=1;lo-=1}
    const pad=(hi-lo)*.12;lo-=pad;hi+=pad;
    const d0=dayN(pts[0].day),d1=dayN(pts[pts.length-1].day);
    const X=d=>pts.length===1||d1===d0?x0+w/2:x0+w*(dayN(d)-d0)/(d1-d0),Y=v=>y0+h-h*(v-lo)/(hi-lo);
    return {pts:pts.map(p=>({x:X(p.day),y:Y(p.v),out:flag(p)!==null,p})),band:(last.lo!=null||last.hi!=null)?{y1:Y(last.hi!=null?last.hi:hi),y2:Y(last.lo!=null?last.lo:lo)}:null};
  }
  function drawPage(ctx,items,info){
    ctx.fillStyle="#ffffff";ctx.fillRect(0,0,RW,RH);
    ctx.fillStyle="#10232b";ctx.textBaseline="alphabetic";
    let y=RM;
    if(info.page===1){
      ctx.font="bold 46px sans-serif";ctx.fillText("NeoWell · Tahlil sonuçları",RM,y+46);
      ctx.font="24px sans-serif";ctx.fillStyle="#62737a";
      ctx.fillText(`Oluşturulma: ${fmtD(info.today)}   ·   ${info.count} test, ${info.rows} sonuç`,RM,y+90);
      ctx.fillText("Değerler kullanıcının girdiği ya da PDF'ten okuduğu verilerdir. Aralık, raporda yazdığı gibi alınmıştır; yorumlanmamıştır. Bu değerleri hekiminle değerlendir.",RM,y+124);
      y+=HEAD-RM;
    }
    for(const s of items){
      const last=s.pts[s.pts.length-1],f=flag(last);
      ctx.strokeStyle="#d9e2de";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(RM,y);ctx.lineTo(RW-RM,y);ctx.stroke();
      ctx.fillStyle="#10232b";ctx.font="bold 34px sans-serif";ctx.fillText(s.n,RM,y+52);
      ctx.font="bold 52px sans-serif";
      const vt=(last.q||"")+fmtN(last.v);ctx.fillText(vt,RM,y+120);
      const vw=ctx.measureText(vt).width;
      ctx.font="26px sans-serif";ctx.fillStyle="#62737a";ctx.fillText(s.u||"",RM+vw+12,y+120);
      ctx.fillText(fmtD(last.day),RM,y+158);
      const rt=rangeText(last);
      if(rt)ctx.fillText(`Raporda yazan aralık: ${rt} ${s.u||""}`,RM,y+192);
      if(f){ctx.fillStyle="#10232b";ctx.font="bold 24px sans-serif";ctx.fillText(f==="high"?"▲ Raporda yazan aralığın üstünde":"▼ Raporda yazan aralığın altında",RM,y+224)}
      const cx=520,cy=y+30,cw=RW-RM-cx-10,ch=150,g=geom(s,cx,cy,cw,ch);
      if(g.band){ctx.fillStyle="#e3efe9";ctx.fillRect(cx,Math.min(g.band.y1,g.band.y2),cw,Math.abs(g.band.y2-g.band.y1))}
      ctx.strokeStyle="#9fb4ad";ctx.lineWidth=1.5;ctx.strokeRect(cx,cy,cw,ch);
      ctx.strokeStyle="#0f5c52";ctx.lineWidth=3;ctx.beginPath();g.pts.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();
      for(const q of g.pts){ctx.fillStyle="#0f5c52";ctx.beginPath();ctx.arc(q.x,q.y,7,0,Math.PI*2);ctx.fill()}
      ctx.fillStyle="#62737a";ctx.font="22px sans-serif";
      ctx.fillText(fmtD(s.pts[0].day),cx,cy+ch+30);
      if(s.pts.length>1){const t=fmtD(last.day);ctx.fillText(t,cx+cw-ctx.measureText(t).width,cy+ch+30)}
      y+=BLOCK;
    }
    ctx.fillStyle="#62737a";ctx.font="22px sans-serif";
    ctx.fillText(`NeoWell · sayfa ${info.page}/${info.total}`,RM,RH-45);
  }


  /* Turns ML Kit lines (t,x,y,w,h; y grows downward) into table lines. The scale is normalised by the median line height. */
  function ocrToLines(res){
    const L=(res&&res.lines||[]).filter(l=>l&&typeof l.t==="string"&&l.h>0);
    if(!L.length)return [];
    const hs=L.map(l=>l.h).sort((a,b)=>a-b),sc=10/hs[Math.floor(hs.length/2)];
    return groupLines(L.map(l=>({str:l.t,x:l.x*sc,y:-(l.y+l.h/2)*sc,w:l.w*sc})));
  }

  return {ocrToLines,RW,RH,paginate,drawPage,geom,rangeText,keyFor,fold,DICT,info,toNum,optNum,fmtN,groupLines,parseDate,parseLine,parseLines,extract,cleanLabs,flag,series,buildPdf};
})();
if(typeof module!=="undefined")module.exports=LabLib;
