"use strict";
/* Tahlil PDF'inden satır çıkarma, sonuç ayrıştırma, doğrulama ve PDF üretimi (DOM yok).
   Tıbbi yorum yapmaz; yalnızca yazılı değerleri ve laboratuvarın kendi referans aralığını taşır. */
const LabLib=(()=>{
  const MAP={"İ":"i","I":"i","ı":"i","Ç":"c","ç":"c","Ğ":"g","ğ":"g","Ö":"o","ö":"o","Ş":"s","ş":"s","Ü":"u","ü":"u","µ":"u","μ":"u"};
  /* Harf harfe eşler: uzunluk değişmez, böylece katlanmış metindeki konum özgün metinde de geçerlidir. */
  const fold=s=>Array.from(String(s)).map(c=>MAP[c]||c.toLowerCase()).join("");

  /* [anahtar, görünen ad, takma adlar (katlanmış)] */
  const DICT=[
    ["glukoz","Glukoz",["glukoz (aclik)","glukoz","glikoz","glucose","aclik kan sekeri","kan sekeri","aks","aclik glukoz","fasting glucose"]],
    ["hba1c","HbA1c",["hemoglobin a1c","hemoglobin a1c (hba1c)","hba1c","hb a1c","a1c","glikozile hemoglobin","glikolize hemoglobin","glycated hemoglobin","glycohemoglobin"]],
    ["insulin","İnsülin",["insulin","insulin (aclik)","aclik insulin"]],
    ["kolesterol","Total kolesterol",["total kolesterol","kolesterol (total)","kolesterol total","kolesterol","cholesterol","total cholesterol"]],
    ["ldl","LDL kolesterol",["kolesterol ldl","ldl kolesterol","ldl-kolesterol","ldl (direkt)","ldl cholesterol","ldl-c","ldl"]],
    ["hdl","HDL kolesterol",["kolesterol hdl","hdl kolesterol","hdl-kolesterol","hdl cholesterol","hdl-c","hdl"]],
    ["vldl","VLDL kolesterol",["vldl kolesterol","vldl-kolesterol","vldl"]],
    ["trigliserid","Trigliserid",["trigliserid","trigliserit","trigliseridler","triglycerides","triglyceride","tg"]],
    ["tsh","TSH",["tsh","tiroid uyarici hormon","thyroid stimulating hormone"]],
    ["ft4","Serbest T4",["serbest t4","sT4","ft4","free t4","t4 serbest","t4 (serbest)"].map(fold)],
    ["ft3","Serbest T3",["serbest t3","ft3","free t3","t3 serbest","t3 (serbest)"]],
    ["b12","Vitamin B12",["vitamin b12","vitamin b-12","vit b12","vit. b12","b12 vitamini","b12","cobalamin"]],
    ["d3","D vitamini (25-OH)",["25-oh vitamin d","25 oh vitamin d","25(oh) vitamin d","25-hidroksi vitamin d","25-oh d vitamini","25 hidroksi vitamin d","vitamin d total","vitamin d3","vitamin d","d vitamini","d vit"]],
    ["folat","Folat",["folik asit","folat","folate"]],
    ["ferritin","Ferritin",["ferritin"]],
    ["demir","Demir",["serum demiri","demir (serum)","demir","iron"]],
    ["tdbk","Demir bağlama kapasitesi",["total demir baglama kapasitesi","demir baglama kapasitesi","demir baglama","tdbk","tibc","dbk"]],
    ["hgb","Hemoglobin",["hemoglobin","hgb","hb"]],
    ["hct","Hematokrit",["hematokrit","hct"]],
    ["wbc","Lökosit",["lokosit","wbc","beyaz kure","beyaz kan hucresi"]],
    ["rbc","Eritrosit",["eritrosit","rbc","kirmizi kure"]],
    ["plt","Trombosit",["trombosit","plt","platelet"]],
    ["mcv","MCV",["mcv"]],
    ["kreatinin","Kreatinin",["kreatinin","creatinine"]],
    ["ure","Üre",["kan ure azotu","ure","bun","urea"]],
    ["alt","ALT",["alt (sgpt)","alt","sgpt","alanin aminotransferaz","alanine aminotransferase"]],
    ["ast","AST",["ast (sgot)","ast","sgot","aspartat aminotransferaz","aspartate aminotransferase"]],
    ["ggt","GGT",["gama gt","gama glutamil transferaz","ggt","gamma gt"]],
    ["alp","ALP",["alkalen fosfataz","alkalin fosfataz","alp"]],
    ["bil_t","Bilirubin (total)",["bilirubin total","bilirubin (total)","total bilirubin","bilirubin t"]],
    ["bil_d","Bilirubin (direkt)",["bilirubin direkt","bilirubin (direkt)","direkt bilirubin","bilirubin d"]],
    ["urikasit","Ürik asit",["urik asit","uric acid"]],
    ["sodyum","Sodyum",["sodyum","sodium","na"]],
    ["potasyum","Potasyum",["potasyum","potassium","k"]],
    ["kalsiyum","Kalsiyum",["kalsiyum","calcium","ca"]],
    ["magnezyum","Magnezyum",["magnezyum","magnesium","mg"]],
    ["fosfor","Fosfor",["fosfor","phosphorus","inorganik fosfor"]],
    ["klor","Klor",["klor","chloride"]],
    ["crp","CRP",["c reaktif protein","c-reaktif protein","crp","c reactive protein"]],
    ["sedim","Sedimantasyon",["sedimantasyon","sedim","esr"]],
    ["albumin","Albümin",["albumin"]],
    ["tprotein","Total protein",["total protein","protein total","protein (total)"]],
    ["psa","PSA (total)",["total psa","psa total","psa"]],
    ["kortizol","Kortizol",["kortizol","cortisol"]]
  ].map(([k,n,a])=>({k,n,a:Array.from(new Set(a.map(fold))).sort((x,y)=>y.length-x.length)}));
  const ALIASES=DICT.flatMap(d=>d.a.map(a=>({a,d}))).sort((x,y)=>y.a.length-x.a.length);
  const isL=c=>/[a-z0-9]/.test(c||"");

  /* Hasta ve belge bilgisi satırları: sonuç sayılmaz, hiçbir zaman saklanmaz. */
  const SKIP=/(^|[^a-z])(tc|t\.c|kimlik|protokol|dogum|hasta|adi|soyad|telefon|tel|gsm|adres|barkod|sayfa|page|doktor|dr|uzm|prof|dop|yas|cinsiyet|kurum|hastane|laboratuvar|laboratuar|numune|ornek|rapor|onay|tarih|sigorta|sgk|talep|istem|e-posta|mail|web|www|fax|faks|imza)([^a-z]|$)/;
  const FLAGS=new Set(["h","l","*","h*","l*","yuksek","dusuk","high","low","(h)","(l)","↑","↓","h↑","l↓","h/","l/"]);

  const UNIT=/^(?:[a-zA-Zµμ%°\/^·x×*][a-zA-Z0-9µμ%°\/^·×*³⁹¹²\-\.]*|10[\^*]?[0-9³⁶⁹]\/[a-zA-Zµμ]+|x10[\^*]?[0-9³⁶⁹]\/[a-zA-Zµμ]+)$/;
  const isNumTok=t=>/^[<>]?=?\d[\d.,]*$/.test(t);

  function toNum(s){
    s=String(s).trim();
    if(!/^\d[\d.,]*$/.test(s))return null;
    const c=s.includes(","),d=s.includes(".");
    let v;
    if(c&&d)v=s.lastIndexOf(",")>s.lastIndexOf(".")?s.replace(/\./g,"").replace(",","."):s.replace(/,/g,"");
    else if(c)v=s.replace(",",".");
    else if(d)v=/^\d{1,3}(\.\d{3})+$/.test(s)?s.replace(/\./g,""):s;
    else v=s;
    const n=Number(v);return Number.isFinite(n)?n:null;
  }

  /* pdf.js metin parçalarını (str,x,y,w) satırlara çevirir: aynı yükseklikteki parçalar soldan sağa dizilir, geniş boşluklar sütun ayracı olur. */
  function groupLines(items){
    const its=items.filter(i=>i&&typeof i.str==="string"&&i.str.trim()!=="").slice().sort((a,b)=>b.y-a.y||a.x-b.x);
    const rows=[];
    for(const it of its){
      const r=rows.find(r=>Math.abs(r.y-it.y)<=2.5);
      if(r)r.items.push(it);else rows.push({y:it.y,items:[it]});
    }
    rows.sort((a,b)=>b.y-a.y);
    return rows.map(r=>{
      r.items.sort((a,b)=>a.x-b.x);
      let s="",end=null;
      for(const it of r.items){
        if(end!==null){const gap=it.x-end;s+=gap>6?"  ":gap>0.4?" ":""}
        s+=it.str.trim();end=it.x+(it.w||0);
      }
      return s.replace(/[ \t]+$/,"");
    }).filter(Boolean);
  }

  /* Gevşek tarih okuma: gg.aa.yyyy, gg/aa/yyyy, gg-aa-yyyy, yyyy-aa-gg. */
  function dateIn(s){
    let m=s.match(/(\d{1,2})[./-](\d{1,2})[./-](20\d{2}|19\d{2})/),y,mo,d;
    if(m){d=+m[1];mo=+m[2];y=+m[3]}
    else if((m=s.match(/(20\d{2}|19\d{2})-(\d{1,2})-(\d{1,2})/))){y=+m[1];mo=+m[2];d=+m[3]}
    else return null;
    const dt=new Date(y,mo-1,d);
    if(dt.getFullYear()!==y||dt.getMonth()!==mo-1||dt.getDate()!==d||y<1990)return null;
    return `${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  }
  /* Numune tarihi önceliklidir, sonra kabul/rapor/onay. Gelecekteki tarih kabul edilmez. */
  function parseDate(lines,todayKey){
    const tiers=[/numune|ornek|alim|toplama|kan\s*alma/,/kabul/,/rapor|onay|sonuc|tarih/];
    for(const re of tiers)for(const l of lines){
      if(!re.test(fold(l)))continue;
      const k=dateIn(l);if(k&&(!todayKey||k<=todayKey))return k;
    }
    return null;
  }

  /* Referans aralığı: "70 - 100", "0,27-4,2", "< 200", "> 40", "Min: 3 Max: 5". */
  function parseRange(rest){
    let m=rest.match(/(\d[\d.,]*)\s*[-–—]\s*(\d[\d.,]*)/);
    if(m){const lo=toNum(m[1]),hi=toNum(m[2]);if(lo!=null&&hi!=null&&lo<=hi)return {lo,hi}}
    m=rest.match(/<\s*=?\s*(\d[\d.,]*)/);if(m){const hi=toNum(m[1]);if(hi!=null)return {hi}}
    m=rest.match(/>\s*=?\s*(\d[\d.,]*)/);if(m){const lo=toNum(m[1]);if(lo!=null)return {lo}}
    return {};
  }

  function findAlias(line){
    let f=fold(line).replace(/^\s+/,"");
    const off=line.length-line.replace(/^\s+/,"").length;
    f=f.replace(/^(serum|plazma|plasma|tam kan)\s+/,m=>{return " ".repeat(m.length)});
    for(const {a,d} of ALIASES){
      if(!f.trimStart().startsWith(a))continue;
      const st=f.length-f.trimStart().length,end=st+a.length;
      if(isL(f[end]))continue;
      return {d,end:end+off};
    }
    return null;
  }

  /* Tek satırı sonuca çevirir; sonuç değilse null. */
  function parseLine(line){
    const raw=String(line).replace(/\t/g," ").trim();
    if(raw.length<3||raw.length>200)return null;
    if(SKIP.test(fold(raw)))return null;
    if(!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(raw))return null;
    const hit=findAlias(raw);
    let name,key=null,rest,toks,nTail=0;
    if(hit){
      key=hit.d.k;name=hit.d.n;rest=raw.slice(hit.end).trim();
      // addan sonra değerden önce "(Açlık)" gibi en çok 3 sözcük atlanır
      toks=rest.split(/\s+/);
      let i=0;while(i<toks.length&&i<3&&!isNumTok(toks[i])&&!/^[<>]=?$/.test(toks[i]))i++;
      const tail=toks.slice(0,i).every(t=>/^\(?[A-Za-zÇĞİÖŞÜçğıöşü0-9.\-]{1,10}\)?:?$/.test(t))&&i<=2;
      if(i>=toks.length||i>=3||!tail){
        const t=toks.join(" ").replace(/\s+/g," ");
        const ql=/^(negatif|pozitif|normal|saptanmadi|saptandi|izlenmedi|gorulmedi|reaktif|non-?reaktif|reaktif degil)\b/.exec(fold(t));
        return ql?{k:key,n:name,t:ql[0][0].toUpperCase()+ql[0].slice(1)}:null;
      }
      toks=toks.slice(i);nTail=i;
    }else{
      const all=raw.split(/\s+/);
      let i=1;while(i<all.length&&!(isNumTok(all[i])||(/^[<>]=?$/.test(all[i])&&isNumTok(all[i+1]||""))))i++;
      if(i>=all.length||i>6)return null;
      name=all.slice(0,i).join(" ").replace(/[:\-–]+$/,"").trim();
      if(name.length<2||name.length>50||!/[A-Za-zÇĞİÖŞÜçğıöşü]{2}/.test(name)||/^\d/.test(name))return null;
      toks=all.slice(i);
    }
    let q="";
    if(/^[<>]=?$/.test(toks[0])){q=toks[0][0];toks=toks.slice(1)}
    let first=toks[0]||"";
    if(/^[<>]=?\d/.test(first)){q=first[0];first=first.replace(/^[<>]=?/,"")}
    const v=toNum(first);
    if(v==null||Math.abs(v)>1e7)return null;
    let r=toks.slice(1);
    while(r.length&&FLAGS.has(fold(r[0])))r=r.slice(1);
    let u="";
    if(r.length&&!isNumTok(r[0])&&!/^[<>]/.test(r[0])&&UNIT.test(r[0])&&!FLAGS.has(fold(r[0]))){u=r[0];r=r.slice(1)}
    // "10^3 / µL" gibi bölünmüş birimleri toparla
    if(/^(?:x|×)?10(?:\^|\*)?\d?$/.test(u)&&r[0]&&/^\/?[a-zA-Zµμ]+/.test(r[0])){u+=r[0];r=r.slice(1)}
    const rest2=r.join(" ");
    const rng=parseRange(rest2);
    const hasR=rng.lo!=null||rng.hi!=null;
    if(!key&&!u&&!hasR)return null; // bilinmeyen adda birim ya da aralık yoksa sonuç sayılmaz
    if(key&&nTail>0&&!u&&!hasR)return null;
    if(u.length>20)u=u.slice(0,20);
    const o={k:key||fold(name).replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"").slice(0,30)||"x",n:name.slice(0,60),v};
    if(q)o.q=q;if(u)o.u=u;if(rng.lo!=null)o.lo=rng.lo;if(rng.hi!=null)o.hi=rng.hi;
    if(!key&&!(u&&hasR))o.guess=true;
    return o;
  }

  function parseLines(lines,todayKey){
    const rows=[];
    for(const l of lines){const r=parseLine(l);if(r)rows.push(r)}
    return {date:parseDate(lines,todayKey),rows};
  }

  /* pdf.js ile metni okur. lib: pdfjs-dist; data: Uint8Array. Parola gerekirse {need:"password"} döner. */
  async function extract(lib,data,password){
    let doc;
    try{
      doc=await lib.getDocument({data,password,isEvalSupported:false,useSystemFonts:false,verbosity:0}).promise;
    }catch(e){
      if(e&&e.name==="PasswordException")return {need:"password",wrong:e.code===2};
      return {error:"Bu dosya PDF olarak açılamadı"};
    }
    const lines=[];let n=Math.min(doc.numPages,30);
    for(let p=1;p<=n;p++){
      const pg=await doc.getPage(p),tc=await pg.getTextContent();
      lines.push(...groupLines(tc.items.map(i=>({str:i.str,x:i.transform[4],y:i.transform[5],w:i.width}))));
    }
    await doc.destroy();
    if(!lines.some(l=>/\d/.test(l)))return {scanned:true,lines:[]};
    return {lines};
  }

  const dayOk=d=>typeof d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!isNaN(Date.parse(d));
  const fin=x=>typeof x==="number"&&Number.isFinite(x);
  /* Saklanan satırları doğrular; geçersizleri atar. */
  function cleanLabs(arr){
    const out=[],seen=new Set();let id=1;
    for(const x of (Array.isArray(arr)?arr:[]).slice(0,5000)){
      if(!x||!dayOk(x.day)||typeof x.n!=="string"||!x.n.trim())continue;
      const hasV=fin(x.v)&&Math.abs(x.v)<=1e7,hasT=typeof x.t==="string"&&x.t.trim();
      if(!hasV&&!hasT)continue;
      const o={id:0,day:x.day,k:typeof x.k==="string"&&/^[a-z0-9_]{1,30}$/.test(x.k)?x.k:fold(x.n).replace(/[^a-z0-9]+/g,"_").slice(0,30)||"x",n:x.n.trim().slice(0,60)};
      if(hasV)o.v=x.v;else o.t=x.t.trim().slice(0,30);
      if(x.q==="<"||x.q===">")o.q=x.q;
      if(typeof x.u==="string"&&x.u.trim())o.u=x.u.trim().slice(0,20);
      if(fin(x.lo))o.lo=x.lo;if(fin(x.hi))o.hi=x.hi;
      const sig=[o.k,o.day,o.u||"",o.v,o.t].join("|");if(seen.has(sig))continue;seen.add(sig);
      o.id=id++;out.push(o);
    }
    return out;
  }

  /* Aralık dışı mı? Yalnızca laboratuvarın yazdığı aralıkla karşılaştırır. "low"/"high"/null. */
  function flag(r){
    if(!fin(r.v))return null;
    if(r.lo!=null&&r.v<r.lo)return "low";
    if(r.hi!=null&&r.v>r.hi)return "high";
    return null;
  }

  /* Her (test, birim) için ayrı seri: birim değişirse aynı grafikte karıştırılmaz. */
  function series(labs){
    const m=new Map();
    for(const r of labs){
      if(!fin(r.v))continue;
      const id=r.k+"|"+(r.u||"");
      if(!m.has(id))m.set(id,{id,k:r.k,n:r.n,u:r.u||"",pts:[]});
      m.get(id).pts.push(r);
    }
    for(const s of m.values())s.pts.sort((a,b)=>a.day<b.day?-1:a.day>b.day?1:a.id-b.id);
    return [...m.values()].sort((a,b)=>a.n.localeCompare(b.n,"tr"));
  }

  /* Minimal PDF: her sayfa tam boy bir JPEG. Türkçe karakterler tuvalde çizildiği için yazı tipi sorunu olmaz. */
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


  const slug=n=>fold(n).replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"").slice(0,30)||"x";
  /* Ad değiştirilince anahtar yeniden bulunur: sözlükteyse sözlük anahtarı, değilse ad kökü. */
  function keyFor(name){const h=findAlias(String(name).trim());return h?h.d.k:slug(name)}

  /* ---- PDF raporu: tuval bağlamı dışarıdan verilir, böylece DOM olmadan da denenir ---- */
  const RW=1240,RH=1754,RM=70,BLOCK=250,HEAD=190,FOOT=80;
  const fmtN=v=>{const s=Number(v.toFixed(2));return String(s).replace(".",",")};
  const fmtD=k=>k.slice(8)+"."+k.slice(5,7)+"."+k.slice(0,4);
  const rangeText=r=>r.lo!=null&&r.hi!=null?`${fmtN(r.lo)} – ${fmtN(r.hi)}`:r.hi!=null?`< ${fmtN(r.hi)}`:r.lo!=null?`> ${fmtN(r.lo)}`:"";
  /* Sayfalara böl: ilk sayfada başlık için yer ayrılır. */
  function paginate(list){
    const pages=[];let cur=[],cap=Math.floor((RH-RM-HEAD-FOOT)/BLOCK);
    for(const s of list){if(cur.length>=cap){pages.push(cur);cur=[];cap=Math.floor((RH-RM-FOOT-RM)/BLOCK)}cur.push(s)}
    pages.push(cur);return pages;
  }
  const dayN=k=>Date.UTC(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10))/864e5;
  /* Seri için çizim koordinatları: x tarihe, y değere orantılı; referans bandı son aralıklı satırdan. */
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
      ctx.fillText("Değerler kullanıcının girdiği ya da PDF'ten okuduğu verilerdir. Referans aralığı laboratuvar raporundan alınmıştır.",RM,y+124);
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
      if(rt)ctx.fillText(`Referans: ${rt} ${s.u||""}`,RM,y+192);
      if(f){ctx.fillStyle="#b3261e";ctx.font="bold 24px sans-serif";ctx.fillText(f==="high"?"▲ Referans aralığının üstünde":"▼ Referans aralığının altında",RM,y+224)}
      const cx=520,cy=y+30,cw=RW-RM-cx-10,ch=150,g=geom(s,cx,cy,cw,ch);
      if(g.band){ctx.fillStyle="#e3efe9";ctx.fillRect(cx,Math.min(g.band.y1,g.band.y2),cw,Math.abs(g.band.y2-g.band.y1))}
      ctx.strokeStyle="#9fb4ad";ctx.lineWidth=1.5;ctx.strokeRect(cx,cy,cw,ch);
      ctx.strokeStyle="#0f5c52";ctx.lineWidth=3;ctx.beginPath();g.pts.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();
      for(const q of g.pts){ctx.fillStyle=q.out?"#b3261e":"#0f5c52";ctx.beginPath();ctx.arc(q.x,q.y,7,0,Math.PI*2);ctx.fill()}
      ctx.fillStyle="#62737a";ctx.font="22px sans-serif";
      ctx.fillText(fmtD(s.pts[0].day),cx,cy+ch+30);
      if(s.pts.length>1){const t=fmtD(last.day);ctx.fillText(t,cx+cw-ctx.measureText(t).width,cy+ch+30)}
      y+=BLOCK;
    }
    ctx.fillStyle="#62737a";ctx.font="22px sans-serif";
    ctx.fillText(`NeoWell · sayfa ${info.page}/${info.total}`,RM,RH-45);
  }


  /* ML Kit satırlarını (t,x,y,w,h; y aşağı doğru artar) tablo satırlarına çevirir. Ölçek satır yüksekliğine göre normalleştirilir. */
  function ocrToLines(res){
    const L=(res&&res.lines||[]).filter(l=>l&&typeof l.t==="string"&&l.h>0);
    if(!L.length)return [];
    const hs=L.map(l=>l.h).sort((a,b)=>a-b),sc=10/hs[Math.floor(hs.length/2)];
    return groupLines(L.map(l=>({str:l.t,x:l.x*sc,y:-(l.y+l.h/2)*sc,w:l.w*sc})));
  }

  return {ocrToLines,RW,RH,paginate,drawPage,geom,rangeText,keyFor,slug,fold,DICT,toNum,groupLines,parseDate,parseRange,parseLine,parseLines,extract,cleanLabs,flag,series,buildPdf,dayOk};
})();
if(typeof module!=="undefined")module.exports=LabLib;
