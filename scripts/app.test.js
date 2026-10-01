const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path");let bad=0;
const www=f=>path.join(__dirname,"../www",f);
const html=fs.readFileSync(www("index.html"),"utf8").replace(/<script src="([^"]+)"><\/script>/g,(_,f)=>"<script>"+fs.readFileSync(www(f),"utf8")+"</script>");
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const errs=[];
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://localhost/",
  beforeParse(w){Object.assign(w,{structuredClone,TextEncoder,TextDecoder,__noSelfTest:true});Object.defineProperty(w,"crypto",{value:require("node:crypto").webcrypto});w.confirm=()=>true;w.scrollTo=()=>{};w.addEventListener("error",e=>errs.push(e.message))}
});
setTimeout(async()=>{
  const w=dom.window,ev=s=>w.eval(s),$q=s=>w.document.querySelector(s),macros=()=>ev("JSON.stringify(of('yemek',dayKey()).map(e=>[e.v,e.p,e.c,e.f]))");
  ok("sayfa hatasız açılır",errs.length===0&&ev("document.querySelector('#view').innerHTML.length")>100,errs);
  ok("sayı ayrıştırma",ev("[num('83,7'),num('83.7'),num('1.234,5'),num('1.500',true),num('abc')]").slice(0,4).join()==="83.7,83.7,1234.5,1500"&&isNaN(ev("num('abc')")));
  ok("geçersiz spor süresi atılır",ev("cleanEntries([{type:'spor',day:'2026-01-01',v:1500},{type:'spor',day:'2026-01-01',v:30}]).out.length")===1);
  ok("bildirim metni korunur",ev("cleanSettings({reminders:[{id:1,t:'09:00',on:true,body:'Bugün su içmeyi unutma'}]}).reminders[0].body")==="Bugün su içmeyi unutma");
  ok("antrenman süresi 600 dk ile sınırlı",ev("gDur({t0:Date.now()-3e6*60,t1:null})")===600);
  ev("S.settings.consent=false;setKey('nvidia','K1')");
  const bk=ev("JSON.stringify(Object.assign({},S,{settings:Object.assign({},S.settings,{consent:true}),providers:S.providers.map(p=>Object.assign({},p,{base:'https://evil.example/v1',confirm:false}))}))");
  w.document.body.insertAdjacentHTML("beforeend",'<textarea id="bk"></textarea>');w.document.querySelector("#bk").value=bk;
  ev("goYukle()");
  ok("yedek anahtar adresini değiştiremez",ev("S.providers.find(p=>p.id==='nvidia').base")==="https://integrate.api.nvidia.com/v1",ev("S.providers.map(p=>p.base)"));
  ok("yedek onayı ve izni değiştiremez",ev("S.settings.consent")===false&&ev("S.providers.find(p=>p.id==='gemini').confirm")===true);
  ev("setKey('groq','KEY-sirri-12345');S.settings.healthNote='gizli not'");
  ev("document.querySelector('#bkpw')||document.body.insertAdjacentHTML('beforeend','<input id=\"bkpw\">')");
  w.document.querySelector("#bkpw").value="parola123";
  w.backupP=ev("backupText()");
  w.backupP.then(async enc=>{
    ok("şifreli yedek düz metin içermez",!enc.includes("gizli not")&&!enc.includes("KEY-sirri-12345")&&JSON.parse(enc).enc==="aes-gcm-pbkdf2");
    ev("setKey('groq','');S.settings.healthNote=''");
    w.document.querySelector("#bk").value=enc;w.document.querySelector("#bkpw").value="yanlis";
    await ev("goYukle()");
    ok("yanlış parola geri yüklemez",ev("S.settings.healthNote")===""&&ev("getKeys().groq")===undefined);
    w.document.querySelector("#bkpw").value="parola123";
    await ev("goYukle()");
    ok("doğru parola veri ve anahtarı geri getirir",ev("S.settings.healthNote")==="gizli not"&&ev("getKeys().groq")==="KEY-sirri-12345",[ev("S.settings.healthNote"),ev("getKeys().groq"),ev("document.querySelector('#toast').textContent")]);
  // ---- Tahlil takibi ----
  {
    const {textPdf}=require("./pdfmaker.js");
    const pdfjs=await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc=w.document,q=s=>doc.querySelector(s),qa=s=>[...doc.querySelectorAll(s)];
    const click=s=>q(s).click();
    const lab=textPdf([
      [["Hasta Adi Soyadi: Ali Veli",40]],[["T.C. Kimlik No: 12345678901",40]],[["Numune Alim Tarihi: 12.09.2026",40]],
      [["Glukoz (Aclik)",40],["98",200],["mg/dL",260],["70 - 100",340]],
      [["Lökosit",40],["7,2",200],["10^3/uL",260],["4,0 - 10,0",340]],
      [["HbA1c",40],["5,4",200],["%",260],["4,0-5,6",340]],
      [["LDL-Kolesterol",40],["130",200],["mg/dL",260],["< 100",340]]
    ]);
    let needPw=false;
    w.__labPdfLib={getDocument:o=>{
      if(needPw&&o.password!=="x")return {promise:Promise.reject({name:"PasswordException",code:o.password?2:1})};
      return pdfjs.getDocument({...o,data:new Uint8Array(o.data)});
    }};
    const file=d=>({size:d.length,arrayBuffer:async()=>d.buffer.slice(d.byteOffset,d.byteOffset+d.length)});
    ev("S.labs=[];S.entries=[]");
    ok("Trend'de tahlil kartı var",ev("viewTrend()").includes("Tahlil takibi")&&ev("viewTrend()").includes('data-tab="tahlil"'));
    ok("açılışta pdf.js yüklenmez (yalnızca tahlil açılınca)",!html.includes('<script src="vendor')&&!/<script src="[^"]*pdf/.test(fs.readFileSync(www("index.html"),"utf8")));
    ev("tab='tahlil';render()");
    ok("boş tahlil ekranı: okut ve elle ekle düğmeleri",!!q("#labfile")&&!!q('[data-lab="add"]')&&!q('[data-lab="pdf"]')&&q("#ttl").textContent==="Tahlil takibi"&&q('nav [data-tab="trend"]').getAttribute("aria-current")==="page");

    await ev("labFile")(file(lab));
    ok("okunan sonuçlar ekranı: 4 satır, tarih dolu",qa('[id^="ln"]').length===4&&q("#ld").value==="2026-09-12",qa('[id^="ln"]').length);
    ok("hasta bilgisi ekranda ve durumda yok",!q("#sheet").innerHTML.match(/Ali|Veli|12345678901/)&&!JSON.stringify(ev("S")).match(/Ali Veli|12345678901/));
    q("#lc1").checked=false;
    click('[data-lab="save"]');
    ok("işareti kaldırılan satır kaydedilmez",ev("S.labs.length")===3&&ev("S.labs.map(x=>x.k).join()")==="glukoz,hba1c,ldl",ev("S.labs.map(x=>x.k)"));
    ok("kaydedince tahlil ekranına döner ve testler listelenir",ev("tab")==="tahlil"&&q("#view").textContent.includes("Glukoz")&&q("#view").textContent.includes("LDL kolesterol")&&q('[data-lab="pdf"]')!==null);
    ok("referans dışı değer işaretlenir, normal değil",q("#view").textContent.includes("üstünde")&&(q("#view").textContent.match(/üstünde/g)||[]).length===1,q("#view").textContent);
    ok("kayıtlı satırda yalnızca beklenen alanlar var",ev("Object.keys(S.labs[0]).sort().join()")==="day,hi,id,k,lo,n,u,v");

    await ev("labFile")(file(lab));
    q("#lc1").checked=false;click('[data-lab="save"]');
    ok("aynı PDF tekrar okutulunca yinelenen kayıt oluşmaz",ev("S.labs.length")===3&&q("#toast").textContent.includes("zaten"),q("#toast").textContent);

    ev("labReview({date:'',rows:[]},true)");
    ok("elle ekleme: tarih bugün, bir boş satır",qa('[id^="ln"]').length===1&&q("#ld").value===ev("dayKey()"));
    q("#ln0").value="Ferritin";q("#lv0").value="12";q("#lu0").value="ng/mL";q("#ll0").value="13";q("#lh0").value="150";
    click('[data-lab="save"]');
    ok("elle eklenen sonuç sözlük anahtarıyla kaydedilir",ev("S.labs.some(x=>x.k==='ferritin'&&x.v===12&&x.lo===13&&x.hi===150&&x.u==='ng/mL')"));

    ev("labReview({date:'',rows:[]},true)");q("#ln0").value="Glukoz";q("#lv0").value="abc";click('[data-lab="save"]');
    ok("okunamayan değer kaydedilmez ve uyarır",ev("S.labs.length")===4&&q("#toast").textContent.includes("okunamadı")&&!!q("#ld"),q("#toast").textContent);
    q("#lv0").value="<20";q("#lu0").value="mg/dL";q("#ll0").value="5";q("#lh0").value="3";click('[data-lab="save"]');
    ok("alt sınır üst sınırdan büyükse kaydedilmez",ev("S.labs.length")===4);
    q("#ll0").value="";q("#lh0").value="";q("#ld").value="2999-01-01";click('[data-lab="save"]');
    ok("gelecek tarih kaydedilmez",ev("S.labs.length")===4&&q("#toast").textContent.includes("ileri"));
    q("#ld").value="2026-08-01";click('[data-lab="save"]');
    ok("< niteleyicisi ve ikinci tarih kaydedilir",ev("S.labs.some(x=>x.k==='glukoz'&&x.q==='<'&&x.v===20&&x.day==='2026-08-01')"));

    click('[data-lab="open:glukoz|mg/dL"]');
    ok("ayrıntı: iki sonuç için grafik ve silme düğmeleri",!!q("#sheet svg")&&qa('#sheet [data-lab^="del:"]').length===2);
    click('#sheet [data-lab^="del:"]');
    ok("tek sonuç silinir, geri al düğmesi geri getirir",ev("S.labs.filter(x=>x.k==='glukoz').length")===1);
    click("#tundo");
    ok("geri al silinen sonucu geri getirir",ev("S.labs.filter(x=>x.k==='glukoz').length")===2);

    // PDF dışa aktarma (tuval ve eklentiler taklit)
    const drawn=[];let saved=null,shared=null;
    const ctx=new Proxy({},{get:(t,k)=>k==="measureText"?()=>({width:100}):k==="fillText"?(s)=>drawn.push(s):()=>{} ,set:()=>true});
    w.HTMLCanvasElement.prototype.getContext=()=>ctx;
    const jpgB64="/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
    w.HTMLCanvasElement.prototype.toDataURL=()=>"data:image/jpeg;base64,"+jpgB64;
    w.Capacitor.Plugins.Filesystem={writeFile:async o=>{saved=o;return {uri:"file:///cache/x.pdf"}}};
    w.Capacitor.Plugins.Share={share:async o=>{shared=o}};
    await ev("labExport()");
    const pdfBytes=Buffer.from(saved.data,"base64");
    const pd=await pdfjs.getDocument({data:new Uint8Array(pdfBytes),verbosity:0}).promise;
    ok("PDF dışa aktarılır: dosya adı, geçerli PDF, paylaşım",/^neowell-tahlil-\d{4}-\d{2}-\d{2}\.pdf$/.test(saved.path)&&pdfBytes.slice(0,5).toString()==="%PDF-"&&pd.numPages===1&&shared.files[0]==="file:///cache/x.pdf",[saved.path,pd.numPages]);
    ok("PDF'e testler ve referans metni çizilir, hasta bilgisi yok",["Glukoz","LDL kolesterol","Ferritin","HbA1c"].every(n=>drawn.includes(n))&&drawn.some(t=>/Referans: 70 – 100/.test(t))&&!drawn.join("|").match(/Ali|Veli|12345678901/),drawn);
    ok("aralık dışı değer PDF'te açıkça yazılır",drawn.includes("▲ Referans aralığının üstünde"));
    ev("S.labs=S.labs.concat(Array.from({length:30},(_,i)=>({id:900+i,day:'2026-09-01',k:'t'+i,n:'Test '+i,v:i+1,u:'x'})))");
    drawn.length=0;await ev("labExport()");
    const pd2=await pdfjs.getDocument({data:new Uint8Array(Buffer.from(saved.data,"base64")),verbosity:0}).promise;
    ok("çok test varsa sayfalara bölünür",pd2.numPages>=4&&drawn.some(t=>/sayfa 4\//.test(t)),pd2.numPages);
    ev("S.labs=S.labs.filter(x=>x.id<900)");

    // yedek: tahlil verisi yedekle-yükle gidiş dönüşünde korunur
    const bkJ=ev("JSON.stringify(S)");
    ev("S.labs=[]");doc.querySelector("#bk").value=bkJ;
    await ev("goYukle()");
    ok("yedekten geri yüklemede tahlil kayıtları gelir",ev("S.labs.length")>=4&&ev("S.labs.some(x=>x.k==='ferritin')"),ev("S.labs.length"));
    doc.querySelector("#bk").value=JSON.stringify({...JSON.parse(bkJ),labs:[{day:"bozuk",n:"x",v:1},{day:"2026-01-01",n:"Glukoz",v:90,u:"mg/dL"},"çöp",null]});
    await ev("goYukle()");
    ok("bozuk tahlil satırları yüklemede ayıklanır",ev("S.labs.length")===1&&ev("S.labs[0].v")===90);
    ok("sıfırlama yeni tahlil listesi başlatır",ev("DEF.labs.length")===0);

    // taranmış PDF, PDF olmayan dosya, korumalı PDF
    await ev("labFile")(file(textPdf([[["Sayfa",40]]])));
    ok("taranmış PDF: açıklama ve elle ekleme önerilir",q("#sheet").textContent.includes("Metin bulunamadı")&&!!q('#sheet [data-lab="add"]'));
    await ev("labFile")(file(new Uint8Array([1,2,3,4])));
    ok("PDF olmayan dosya: hata mesajı, çökme yok",q("#toast").textContent.includes("açılamadı"),q("#toast").textContent);
    await ev("labFile")({size:2e7,arrayBuffer:async()=>new ArrayBuffer(1)});
    ok("15 MB üstü dosya reddedilir",q("#toast").textContent.includes("büyük"));
    await ev("labFile")(file(textPdf([[["Numune Tarihi 01.09.2026",40]],[["Kontrol Metni",40]]])));
    ok("sonuç satırı olmayan PDF: açıklama",q("#sheet").textContent.includes("Sonuç bulunamadı"));
    needPw=true;
    await ev("labFile")(file(lab));
    ok("korumalı PDF: parola istenir",!!q("#labpw"));
    q("#labpw").value="yanlis";click('[data-lab="pw"]');await new Promise(r=>setTimeout(r,50));
    ok("yanlış parola: yeniden sorulur",!!q("#labpw")&&q("#sheet").textContent.includes("yanlış"));
    q("#labpw").value="x";click('[data-lab="pw"]');await new Promise(r=>setTimeout(r,200));
    ok("doğru parola: sonuçlar açılır",qa('[id^="ln"]').length===4);
    needPw=false;ev("closeSheet()");

    // tümünü sil
    ev("tab='tahlil';render()");click('[data-lab="delall"]');
    ok("tüm tahlil kayıtları silinir",ev("S.labs.length")===0);
    ev("tab='bugun';render()");
  }
  // ---- Fotoğraftan yazı okuma (etiket, tahlil) ----
  {
    const doc=w.document,q=s=>doc.querySelector(s),qa=s=>[...doc.querySelectorAll(s)];
    const box=(t,x,y,wd=120,h=30)=>({t,x,y,w:wd,h});
    const table=(k,p,c,f)=>({lines:[box("Besin Değerleri",50,350,300),box("100 g başına",500,352,160),box("Enerji",50,400,100),box(k,500,402,160),box("Yağ",50,450,60),box(f,500,449,60),box("Karbonhidrat",50,500,200),box(c,500,501,60),box("Protein",50,550,100),box(p,500,548,60)]});
    let reply=table("1840 kJ / 440 kcal","8,5 g","70 g","13 g"),sent=null;
    w.createImageBitmap=async()=>({width:2400,height:1800});
    w.Capacitor.Plugins.Ocr={recognize:async o=>{sent=o;if(reply instanceof Error)throw reply;return reply}};
    ev("S.myFoods=[]");
    ev("sheetYemek()");
    ok("Yemek ekle'de etiket oku düğmesi (eklenti varken)",!!q('[data-ocr="choose:etiket"]'));
    q('[data-ocr="choose:etiket"]').click();
    ok("seçim ekranı: fotoğraf çek ve galeri",!!q('[data-ocr="cam:etiket"]')&&!!q('[data-ocr="gal:etiket"]')&&q("#sheet").textContent.includes("hiçbir yere gönderilmez"));
    const clicked=[];const oc=w.HTMLInputElement.prototype.click;
    w.HTMLInputElement.prototype.click=function(){clicked.push(this)};
    q('[data-ocr="cam:etiket"]').click();q('[data-ocr="gal:etiket"]').click();
    w.HTMLInputElement.prototype.click=oc;
    ok("kamera seçeneği capture ister, galeri istemez; yalnızca görüntü kabul edilir",clicked.length===2&&clicked[0].getAttribute("capture")==="environment"&&!clicked[1].hasAttribute("capture")&&clicked.every(i=>i.type==="file"&&i.accept==="image/*"));
    clicked.forEach(i=>i.remove());

    await ev("ocrRun")("etiket",{size:1000});
    ok("fotoğraf küçültülüp eklentiye gönderilir",typeof sent.image==="string"&&sent.image.length>10);
    ok("etiket ekranı: değerler dolu, ad boş",q("#ek").value==="440"&&q("#ep").value==="8,5"&&q("#ec").value==="70"&&q("#ef").value==="13"&&q("#en").value==="");
    q('[data-ocr="esave"]').click();
    ok("ad yazılmadan kaydedilmez",ev("S.myFoods.length")===0&&q("#toast").textContent.includes("adını"));
    q("#en").value="Test Bisküvi";q('[data-ocr="esave"]').click();
    ok("etiketten besin kaydedilir (100 g başına)",ev("S.myFoods.length")===1&&ev("S.myFoods[0].n")==="Test Bisküvi"&&ev("S.myFoods[0].k")===440&&ev("S.myFoods[0].p")===8.5&&ev("S.myFoods[0].c")===70&&ev("S.myFoods[0].f")===13&&ev("S.myFoods[0].u[0][1]")===100,ev("S.myFoods"));
    ok("kayıttan sonra porsiyon ekranı açılır",q("#sheet").textContent.includes("Test Bisküvi")&&q("#sheet").textContent.includes("Porsiyon"));
    ok("etiketten gelen besin 'Benim besinlerim' temizliğinden geçer",ev("cleanMyFoods(S.myFoods).length")===1);

    ev("closeSheet()");reply=table("1840 kJ / 140 kcal","8,5 g","70 g","13 g");
    await ev("ocrRun")("etiket",{size:1000});q("#en").value="Hatalı Okuma";q('[data-ocr="esave"]').click();
    ok("tutarsız okuma uyarı verir, kaydetmez",ev("S.myFoods.length")===1&&q("#ewarn").textContent.includes("tutarlı değil"),q("#ewarn")&&q("#ewarn").textContent);
    q('[data-ocr="esave"]').click();
    ok("ikinci dokunuşta (kullanıcı onayıyla) kaydedilir",ev("S.myFoods.length")===2);

    ev("closeSheet()");reply={lines:[box("Yağ",50,450,60),box("13 g",500,449,60),box("Karbonhidrat",50,500,200),box("70 g",500,501,60),box("Protein",50,550,100),box("8,5 g",500,548,60)]};
    await ev("ocrRun")("etiket",{size:1000});
    ok("kalori okunamazsa alan boş, okunmayanlar listelenir",q("#ek").value===""&&q("#sheet").textContent.includes("Okunamayan: kalori"));
    q("#en").value="Kalorisiz";q('[data-ocr="esave"]').click();
    ok("kalori yoksa kaydedilmez",ev("S.myFoods.length")===2&&q("#toast").textContent.includes("Kalori gerekli"));
    q("#ek").value="abc";q('[data-ocr="esave"]').click();
    ok("sayı olmayan değer reddedilir",ev("S.myFoods.length")===2&&q("#toast").textContent.includes("Sayı olarak"));

    ev("closeSheet()");reply={lines:[]};
    await ev("ocrRun")("etiket",{size:1000});
    ok("yazı yoksa açıklama ve tekrar dene",q("#sheet").textContent.includes("Yazı bulunamadı")&&!!q('#sheet [data-ocr="choose:etiket"]'));
    reply=new Error("boom");
    await ev("ocrRun")("etiket",{size:1000});
    ok("eklenti hata verirse çökmez, mesaj gösterir",q("#toast").textContent.includes("okunamadı"));
    await ev("ocrRun")("etiket",{size:40e6});
    ok("çok büyük fotoğraf reddedilir",q("#toast").textContent.includes("büyük"));

    // tahlil fotoğrafı
    ev("S.labs=[]");reply={lines:[box("Numune Tarihi: 12.09.2026",50,100,500),box("Glukoz",50,200,100),box("98",400,201,40),box("mg/dL",500,200,80),box("70 - 100",650,199,100)]};
    await ev("ocrRun")("tahlil",{size:1000});
    ok("tahlil fotoğrafı: onay ekranı, tarih ve satır dolu",q("#ld").value==="2026-09-12"&&qa('[id^="ln"]').length===1&&q("#ln0").value==="Glukoz"&&q("#lv0").value==="98",qa('[id^="ln"]').length);
    click=s=>q(s).click();click('[data-lab="save"]');
    ok("fotoğraftan okunan tahlil kaydedilir",ev("S.labs.length")===1&&ev("S.labs[0].k")==="glukoz");
    reply={lines:[box("Kontrol metni",50,100,300)]};
    await ev("ocrRun")("tahlil",{size:1000});
    ok("tahlil satırı çıkmazsa açıklama",q("#sheet").textContent.includes("Sonuç bulunamadı"));
    ev("closeSheet();S.labs=[];S.myFoods=[]");
    delete w.Capacitor.Plugins.Ocr;
    ev("sheetYemek()");
    ok("eklenti yoksa (tarayıcı) etiket düğmesi görünmez",!q('[data-ocr="choose:etiket"]'));
    ev("closeSheet()");
  }
  // ---- Tansiyon ve şeker takibi ----
  {
    const doc=w.document,q=s=>doc.querySelector(s),qa=s=>[...doc.querySelectorAll(s)];
    const click=s=>q(s).click(),txt=()=>q("#sheet").textContent,toastT=()=>q("#toast").textContent;
    const pdfjs=await import("pdfjs-dist/legacy/build/pdf.mjs");
    const BAN=/hipertansiyon|hipoglisemi|hiperglisemi|anormal|tehlikeli|diyabet/i;
    ev("S.vitals=[];S.labs=[];S.entries=[];S.settings.bpOn=false;S.settings.bsOn=false;tab='bugun';render()");
    ok("özellik kapalıyken Bugün ve Trend'de görünmez",!ev("viewBugun()").includes("Ölçümler")&&!ev("viewTrend()").includes("Tansiyon")&&!ev("viewTrend()").includes("Şeker"));
    ev("tab='ayar';render()");
    ok("Ayarlar'da tansiyon ve şeker takibini aç düğmeleri, hatırlatmalar gizli",!!q('[data-vt="bptoggle"]')&&!!q('[data-vt="bstoggle"]')&&!q("#bpSysHi")&&!q('[data-rt="7"]')&&!q('[data-rt="9"]'));
    click('[data-vt="bptoggle"]');
    ok("tansiyon takibi açılır: alanlar, ön ayar düğmesi, tansiyon hatırlatmaları",ev("S.settings.bpOn")===true&&!!q("#bpSysHi")&&!!q('[data-vt="bppreset"]')&&!!q('[data-rt="7"]')&&!!q('[data-rt="8"]')&&!q('[data-rt="9"]'));
    click('[data-vt="bppreset"]');
    ok("ön ayar 135/85 eşiğini doldurur",ev("S.settings.bpSysHi")===135&&ev("S.settings.bpDiaHi")===85&&q("#bpSysHi").value==="135");
    ev("tab='bugun';render()");
    ok("Bugün'de ölçümler kartı (ölçüm yok)",qa('[data-vt="menu"]').length===1&&q('[data-vt="menu"]').textContent.includes("ölçüm yok")&&!q('[data-vt="menu"]').textContent.includes("Şeker"));
    ev("tab='trend';render()");
    ok("Trend'de tansiyon kartı, şeker kartı yok",!!q('[data-tab="tansiyon"]')&&!q('[data-tab="seker"]'));

    // Ayarlar alanları doğrulama
    ev("tab='ayar';render()");
    q("#bpSysHi").value="140";q("#bpSysHi").dispatchEvent(new w.Event("change",{bubbles:true}));
    ok("üst sınır değiştirilebilir",ev("S.settings.bpSysHi")===140);
    q("#bpSysHi").value="10";q("#bpSysHi").dispatchEvent(new w.Event("change",{bubbles:true}));
    ok("geçersiz sınır reddedilir",ev("S.settings.bpSysHi")===140&&toastT().includes("arasında olmalı"));
    q("#bpSysHi").value="";q("#bpSysHi").dispatchEvent(new w.Event("change",{bubbles:true}));
    ok("boş bırakınca karşılaştırma kapanır",ev("S.settings.bpSysHi")===0);
    ev("S.settings.bpSysHi=135");

    // Tansiyon girişi
    ev("tab='bugun';render()");
    click('[data-vt="menu"]');
    ok("menü: yalnızca tansiyon seçenekleri",!!q('#sheet [data-vt="addbp"]')&&!q('#sheet [data-vt="addbs"]')&&!!q('#sheet [data-vt="go:tansiyon"]'));
    click('#sheet [data-vt="addbp"]');
    ok("tansiyon ekranı: iki ölçüm alanı, seans, gün, saat",!!q("#bs1")&&!!q("#bs2")&&qa("[data-vses]").length===3&&!!q("#fday")&&/^\d\d:\d\d$/.test(q("#vtime").value));
    click('[data-vses="aksam"]');
    ok("seans seçimi işaretlenir",q('[data-vses="aksam"]').getAttribute("aria-pressed")==="true"&&q('[data-vses="sabah"]').getAttribute("aria-pressed")==="false");
    q("#bs1").value="80";q("#bd1").value="90";click('[data-vt="savebp"]');
    ok("büyük tansiyon küçükten büyük olmalı",ev("S.vitals.length")===0&&toastT().includes("Sistolik"),toastT());
    q("#bs1").value="";q("#bd1").value="";click('[data-vt="savebp"]');
    ok("1. ölçüm boşsa kaydedilmez",ev("S.vitals.length")===0&&toastT().includes("1. ölçüm"));
    q("#bs1").value="128";q("#bd1").value="82";q("#bn1").value="70";q("#bs2").value="132";click('[data-vt="savebp"]');
    ok("2. ölçüm yarım girilirse kaydedilmez",ev("S.vitals.length")===0&&toastT().includes("2. ölçüm"));
    q("#bd2").value="86";click('[data-vt="savebp"]');
    ok("iki ölçüm kaydedilir: aynı seans, ham değerler ayrı, seçilen seans",ev("S.vitals.length")===2&&ev("S.vitals[0].sid")===ev("S.vitals[1].sid")&&ev("S.vitals[0].ses")==="aksam"&&ev("S.vitals[0].sys")===128&&ev("S.vitals[1].sys")===132&&ev("S.vitals[0].nabiz")===70,ev("S.vitals"));
    ok("kayıt bildirimi: ortalama ve hedef aralığı notu yok (130/84 aralıkta)",toastT().includes("130/84 (ortalama)")&&!toastT().includes("üstünde"),toastT());
    ok("Bugün kartı son ölçümü gösterir",q('[data-vt="menu"]').textContent.includes("/"));

    // Aykırı değer ve uç değer kutusu
    click('[data-vt="menu"]');click('#sheet [data-vt="addbp"]');
    q("#bs1").value="200";q("#bd1").value="100";click('[data-vt="savebp"]');
    ok("önceki ölçümden >60 farklıysa uyarı verir, kaydetmez",ev("S.vitals.length")===2&&q("#vwarn").textContent.includes("Yanlış yazmış"),q("#vwarn").textContent);
    click('[data-vt="savebp"]');
    ok("ikinci dokunuşta kaydedilir ve bugün tarihli uç değerde 112 kutusu çıkar",ev("S.vitals.length")===3&&txt().includes("112")&&txt().includes("kaydedildi")&&!txt().match(/teşhis|hasta/i),txt());
    click('#sheet [data-vt="close"]');
    click('[data-vt="menu"]');click('#sheet [data-vt="addbp"]');
    q("#fday").value=ev("keyOff(-3)");q("#bs1").value="190";q("#bd1").value="125";click('[data-vt="savebp"]');
    ok("geriye dönük uç değerde acil kutusu çıkmaz, tek kayıt eklenir",ev("S.vitals.length")===4&&!txt().includes("112"),[ev("S.vitals.length"),txt().slice(0,80)]);
    ev("closeSheet()");

    // Görünüm
    ev("tab='tansiyon';render()");
    const v=q("#view").textContent;
    ok("tansiyon görünümü: ev ortalaması, grafik noktaları, doktor raporu, silme düğmeleri",v.includes("Ev ortalaması")&&v.includes("mmHg")&&qa("#view svg circle").length>=3&&!!q('[data-vt="pdfmenu:t"]')&&qa('#view [data-vt^="del:"]').length>=2&&q("#ttl").textContent==="Tansiyon"&&q('nav [data-tab="trend"]').getAttribute("aria-current")==="page",v.slice(0,300));
ok("ortalama uyarısı: 3 günden az",v.includes("en az 3 gün"));
    ok("tanı dili görünümde yok",!BAN.test(v)&&!BAN.test(ev("viewBugun()")),v.match(BAN));
    ok("200/100 oturumu hedef aralığının üstünde işaretlenir",v.includes("▲"));
    const n0=ev("S.vitals.length");
    click('#view [data-vt^="del:"]');
    ok("ölçüm silinir, geri al getirir",ev("S.vitals.length")<n0);
    click("#tundo");
    ok("geri al silineni geri getirir",ev("S.vitals.length")===n0);
    click('[data-vt="range:7"]');
    ok("aralık düğmesi grafiği yeniler",ev("vRange")===7&&q('[data-vt="range:7"]').getAttribute("aria-pressed")==="true");

    // Şeker
    ev("tab='ayar';render()");click('[data-vt="bstoggle"]');
    ok("şeker takibi açılır, hatırlatma görünür",ev("S.settings.bsOn")===true&&!!q("#gFastHi")&&!!q('[data-rt="9"]')&&!!q('[data-vt="gpreset"]')&&q("#view").textContent.includes("yalnızca diyabetli yetişkinlerin tedavi hedefidir"));
    click('[data-vt="gpreset"]');
    ok("şeker ön ayarı: 80-130 ve 180, uyarı toast'ı",ev("S.settings.gFastLo")===80&&ev("S.settings.gFastHi")===130&&ev("S.settings.gPostHi")===180&&toastT().includes("diyabetli yetişkinler"));
    ev("tab='bugun';render()");
    ok("Bugün kartında şeker de var",q('[data-vt="menu"]').textContent.includes("Şeker")&&q('[data-vt="menu"]').textContent.includes("Tansiyon"));
    const addG=(g,ctx,day)=>{click('[data-vt="menu"]');click('#sheet [data-vt="addbs"]');q("#gv").value=String(g);click(`[data-vctx="${ctx}"]`);if(day)q("#fday").value=day;click('[data-vt="savebs"]')};
    addG(95,"acl");
    ok("şeker kaydedilir: bağlam ve değer",ev("S.vitals.filter(r=>r.k==='s').length")===1&&ev("S.vitals.find(r=>r.k==='s').ctx")==="acl"&&ev("S.vitals.find(r=>r.k==='s').g")===95&&toastT().includes("95 mg/dL")&&!toastT().includes("üstünde"),toastT());
    addG(160,"sonra");
    ok("160 yemekten sonra aralıkta (işaret yok)",!toastT().includes("üstünde")&&ev("S.vitals.filter(r=>r.k==='s').length")===2,toastT());
    addG(150,"acl");
    ok("160/150 açlıkta hedef aralığının üstünde yazılır",toastT().includes("hedef aralığının üstünde")&&ev("S.vitals.filter(r=>r.k==='s').length")===3,toastT());
    addG(250,"sonra");
    ok("açlık 95 / yemek sonrası 250: bağlam farklı, aykırı uyarısı yok",ev("S.vitals.filter(r=>r.k==='s').length")===4);
    addG(310,"acl");
    ok("aynı bağlamda >150 fark uyarı verir, kaydetmez",ev("S.vitals.filter(r=>r.k==='s').length")===4&&q("#vwarn").textContent.includes("Aynı bağlamdaki"),q("#vwarn")&&q("#vwarn").textContent);
    q("#gv").value="abc";click('[data-vt="savebs"]');
    ok("sayı olmayan şeker reddedilir",ev("S.vitals.filter(r=>r.k==='s').length")===4&&toastT().includes("mg/dL"));
    q("#gv").value="10";click('[data-vt="savebs"]');
    ok("20 altı şeker reddedilir",ev("S.vitals.filter(r=>r.k==='s').length")===4&&toastT().includes("20-800"));
    q("#gv").value="50";click('[data-vctx="rast"]');click('[data-vt="savebs"]');
    ok("bugün tarihli çok düşük değerde 112 kutusu",ev("S.vitals.filter(r=>r.k==='s').length")===5&&txt().includes("112"));
    click('#sheet [data-vt="close"]');
    ev("S.labs=[{id:1,day:'2026-09-01',k:'hba1c',n:'HbA1c',v:5.4,u:'%'}]");
    ev("tab='seker';render()");
    const sv=q("#view").textContent;
    ok("şeker görünümü: son ölçüm, ortalama, hedefte yüzde, bağlama göre, grafik, tahlil HbA1c",sv.includes("Son ölçüm")&&sv.includes("Ortalama")&&/Hedefaralığında%\d+/.test(sv.replace(/\s/g,""))&&sv.includes("Bağlama göre ortalama")&&qa("#view svg circle").length>=5&&sv.includes("HbA1c")&&sv.includes("karıştırılmaz"),[sv.includes("Son ölçüm"),/Hedefaralığında%\d+/.test(sv.replace(/\s/g,"")),qa("#view svg circle").length,sv.includes("HbA1c"),sv.includes("karıştırılmaz"),ev("S.labs.length")]);
    ok("şeker görünümünde tanı dili yok",!BAN.test(sv),sv.match(BAN));

    // Hatırlatma kurulumu
    const sched=[];const lnOld=w.Capacitor.Plugins.LocalNotifications;
    w.Capacitor.Plugins.LocalNotifications={checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),getPending:async()=>({notifications:[]}),cancel:async()=>{},schedule:async o=>{sched.push(...o.notifications.map(n=>n.id))}};
    await ev("scheduleReminders()");
    ok("tansiyon/şeker hatırlatmaları varsayılan kapalı: kurulmaz",!sched.some(i=>i>=700&&i<1000));
    ev("S.settings.reminders.find(r=>r.id===7).on=true;S.settings.reminders.find(r=>r.id===9).on=true");
    sched.length=0;await ev("scheduleReminders()");
    ok("açılınca 30 günlük alarm kurulur, kimlikler çakışmaz",sched.some(i=>i>=701&&i<730)&&sched.some(i=>i>=901&&i<930)&&!sched.some(i=>i>=800&&i<830)&&new Set(sched).size===sched.length,[sched.length]);
    w.Capacitor.Plugins.LocalNotifications=lnOld;
    ev("vToggle('bp')");
    ok("özellik kapatılınca ilgili hatırlatmalar da kapanır, kayıtlar durur",ev("S.settings.bpOn")===false&&ev("S.settings.reminders.find(r=>r.id===7).on")===false&&ev("S.vitals.filter(r=>r.k==='t').length")>=3);
    ev("vToggle('bp')");

    // Yedek gidiş-dönüş ve temizlik
    const bkJ=ev("JSON.stringify(S)"),cnt=ev("S.vitals.length");
    ev("S.vitals=[]");doc.querySelector("#bk").value=bkJ;await ev("goYukle()");
    ok("yedekten geri yüklemede ölçümler gelir",ev("S.vitals.length")===cnt&&ev("S.vitals.some(r=>r.k==='t'&&r.sid)"),[ev("S.vitals.length"),cnt]);
    ev("tab='bugun';render()");click('[data-vt="menu"]');click('#sheet [data-vt="addbp"]');
    q("#fday").value=ev("keyOff(-1)");q("#bs1").value="128";q("#bd1").value="82";q("#bs2").value="128";q("#bd2").value="82";click('[data-vt="savebp"]');if(q("#vwarn")&&q("#vwarn").textContent.includes("Yanlış"))click('[data-vt="savebp"]');
    const twins=ev("S.vitals.filter(r=>r.day===keyOff(-1)&&r.sys===128&&r.dia===82).length");
    ok("özdeş iki ölçüm (128/82 iki kez) UI'den iki satır olarak kaydedilir",twins===2&&ev("S.vitals.filter(r=>r.day===keyOff(-1)&&r.sys===128).every(r=>r.i===1||r.i===2)"),twins);
    doc.querySelector("#bk").value=ev("JSON.stringify(S)");await ev("goYukle()");
    ok("özdeş iki ölçüm yedek gidiş-dönüşünden sonra da iki satır",ev("S.vitals.filter(r=>r.day===keyOff(-1)&&r.sys===128&&r.dia===82).length")===2&&ev("VitalsLib.sessions(S.vitals).find(s=>s.day===keyOff(-1)&&s.sys===128).n")===2);
    doc.querySelector("#bk").value=JSON.stringify({...JSON.parse(bkJ),vitals:[{k:"t",day:"2026-09-10",time:"08:00",sys:300,dia:60},{k:"t",day:"2026-09-10",time:"08:01",sys:40,dia:60},{k:"s",day:"2026-09-10",time:"08:00",g:5},"çöp",null,{k:"s",day:"2026-09-10",time:"09:00",g:110,ctx:"acl"}]});
    await ev("goYukle()");
    ok("bozuk ölçüm satırları yüklemede ayıklanır",ev("S.vitals.length")===2,ev("S.vitals"));
    ok("sıfırlama boş ölçüm listesi başlatır",ev("DEF.vitals.length")===0&&ev("DEF.settings.bpOn")===false);
    ev("S.settings.bpOn=true;S.settings.bsOn=true");

    // Doktor raporu PDF
    const drawn=[];let saved=null,shared=null;
    const ctx=new Proxy({},{get:(t,k)=>k==="measureText"?()=>({width:100}):k==="fillText"?s=>drawn.push(s):()=>{},set:()=>true});
    w.HTMLCanvasElement.prototype.getContext=()=>ctx;
    w.Capacitor.Plugins.Filesystem={writeFile:async o=>{saved=o;return {uri:"file:///cache/r.pdf"}}};
    w.Capacitor.Plugins.Share={share:async o=>{shared=o}};
    ev("S.vitals=[];S.settings.bpSysHi=135;S.settings.bpDiaHi=85;S.settings.gFastLo=80;S.settings.gFastHi=130;S.settings.gPostHi=180");
    ev(`(()=>{const t=dayKey();S.vitals=[
      {id:1,k:'t',day:t,time:'07:30',sys:128,dia:82,nabiz:70,ses:'sabah',sid:'a1'},{id:2,k:'t',day:t,time:'07:32',sys:140,dia:90,ses:'sabah',sid:'a1'},
      {id:3,k:'s',day:t,time:'07:00',g:95,ctx:'acl'},{id:4,k:'s',day:t,time:'09:30',g:150,ctx:'sonra'}]})()`);
    ev("tab='tansiyon';render()");click('[data-vt="pdfmenu:t"]');
    ok("rapor dönemi seçimi: 7/14/30/90",qa('#sheet [data-vt^="pdf:t:"]').length===4);
    click('[data-vt="pdf:t:30"]');await new Promise(r=>setTimeout(r,150));
    const pb=Buffer.from(saved.data,"base64"),pd=await pdfjs.getDocument({data:new Uint8Array(pb),verbosity:0}).promise;
    ok("tansiyon raporu: geçerli PDF, dosya adı, paylaşım",/^neowell-tansiyon-\d{4}-\d{2}-\d{2}\.pdf$/.test(saved.path)&&pb.slice(0,5).toString()==="%PDF-"&&pd.numPages===1&&shared.files[0]==="file:///cache/r.pdf",[saved.path,pd.numPages]);
    ok("tansiyon raporu: iki ham ölçüm ayrı satır, ortalama, uyarı notu",drawn.includes("NeoWell · Tansiyon raporu")&&drawn.includes("128/82 mmHg  nabız 70")&&drawn.includes("140/90 mmHg")&&drawn.includes("Sabah, 1. ölçüm")&&drawn.includes("Sabah, 2. ölçüm")&&drawn.some(t=>/Tıbbi yorum içermez/.test(t))&&drawn.some(t=>/134\/86 mmHg/.test(t)),drawn);
    ok("raporda tanı dili yok",!BAN.test(drawn.join(" ")));
    drawn.length=0;saved=null;
    ev("tab='seker';render()");click('[data-vt="pdfmenu:s"]');click('[data-vt="pdf:s:7"]');await new Promise(r=>setTimeout(r,150));
    ok("şeker raporu: bağlam ve değerler, hedefte yüzde",drawn.includes("NeoWell · Şeker raporu")&&drawn.includes("Açlık")&&drawn.includes("95 mg/dL")&&drawn.includes("Yemekten 2 saat sonra")&&drawn.some(t=>/%100 \(2 ölçüm\)/.test(t)),drawn);
    ev(`(()=>{const t=dayKey();S.vitals=[];for(let i=0;i<120;i++)S.vitals.push({id:i+1,k:'s',day:keyOff(-(i%25)),time:String(6+(i%12)).padStart(2,'0')+':'+String(i%60).padStart(2,'0'),g:80+(i%60),ctx:'rast'})})()`);
    drawn.length=0;saved=null;
    await ev("vPdf")("s",30);
    const pd2=await pdfjs.getDocument({data:new Uint8Array(Buffer.from(saved.data,"base64")),verbosity:0}).promise;
    ok("çok ölçümde rapor sayfalara bölünür, sayfa numaraları yazılır",pd2.numPages>=3&&drawn.some(t=>new RegExp(`sayfa ${pd2.numPages}/${pd2.numPages}`).test(t)),pd2.numPages);
    ev("S.vitals=[]");saved=null;
    await ev("vPdf")("t",30);
    ok("ölçüm yokken rapor üretilmez",saved===null&&toastT().includes("Raporlanacak"));

    // temizlik
    ev("S.vitals=[];S.labs=[];S.settings.bpOn=false;S.settings.bsOn=false;tab='bugun';render()");
  }
  // ---- Haftalık rapor ----
  {
    const doc=w.document,q=s=>doc.querySelector(s);
    const pdfjs=await import("pdfjs-dist/legacy/build/pdf.mjs");
    const drawn=[];let saved=null,shared=null;
    const ctx=new Proxy({},{get:(t,k)=>k==="measureText"?()=>({width:100}):k==="fillText"?s=>drawn.push(s):()=>{},set:()=>true});
    w.HTMLCanvasElement.prototype.getContext=()=>ctx;
    w.Capacitor.Plugins.Filesystem={writeFile:async o=>{saved=o;return {uri:"file:///cache/h.pdf"}}};
    w.Capacitor.Plugins.Share={share:async o=>{shared=o}};
    ev("S.entries=[];S.vitals=[];S.settings.bpOn=false;S.settings.bsOn=false;tab='trend';render()");
    ok("Trend'de haftalık rapor düğmesi",!!q('[data-wk="pdf"]'));
    q('[data-wk="pdf"]').click();await new Promise(r=>setTimeout(r,100));
    ok("kayıt yokken rapor üretilmez, açıklama verir",saved===null&&q("#toast").textContent.includes("kayıt yok"));
    ev("add('kilo',81.9,'');add('su',2000,'');add('yemek',1900,'Öğün');add('spor',45,'Yürüyüş')");
    ev("S.settings.bpOn=true;S.vitals=[{id:1,k:'t',day:dayKey(),time:'08:00',sys:128,dia:82,ses:'sabah'}]");
    q('[data-wk="pdf"]').click();await new Promise(r=>setTimeout(r,150));
    const pb=Buffer.from(saved.data,"base64"),pd=await pdfjs.getDocument({data:new Uint8Array(pb),verbosity:0}).promise;
    ok("haftalık rapor: geçerli tek sayfa PDF, dosya adı, paylaşım",/^neowell-haftalik-\d{4}-\d{2}-\d{2}\.pdf$/.test(saved.path)&&pb.slice(0,5).toString()==="%PDF-"&&pd.numPages===1&&shared.files[0]==="file:///cache/h.pdf",[saved.path,pd.numPages]);
    ok("rapor içeriği: kilo, su, kalori, spor ve (takip açıksa) tansiyon",drawn.includes("NeoWell · Haftalık rapor")&&drawn.some(t=>t.includes("81,9"))&&drawn.some(t=>/günlük ortalama 2,0 L/.test(t))&&drawn.some(t=>/1900 kcal/.test(t))&&drawn.some(t=>/toplam 45 dk/.test(t))&&drawn.some(t=>/128\/82 mmHg/.test(t)),drawn);
    ev("S.entries=[];S.vitals=[];S.settings.bpOn=false;tab='bugun';render()");
  }
  // ---- Bildirimden hızlı su, haftalık yedek hatırlatması, Drive'a gönder ----
  {
    const doc=w.document,q=s=>doc.querySelector(s),qa=s=>[...doc.querySelectorAll(s)];
    const click=s=>q(s).click(),toastT=()=>q("#toast").textContent;
    const lnOld=w.Capacitor.Plugins.LocalNotifications;
    let types=null,list=[];
    w.Capacitor.Plugins.LocalNotifications={checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),getPending:async()=>({notifications:[]}),cancel:async()=>{},registerActionTypes:async o=>{types=o.types},schedule:async o=>{list=o.notifications}};
    ev("S.entries=[];S.vitals=[];S.settings.lastBackup='';S.settings.glass=250;S.settings.bpOn=false;S.settings.bsOn=false");

    // bildirim düğmesi tanımı
    await ev("scheduleReminders()");
    ok("bildirim eylem türü kayıtlı: 'su' düğmesi +250 ml",types&&types[0].id==="water"&&types[0].actions[0].id==="su"&&types[0].actions[0].title==="+250 ml",types);
    const water=list.filter(n=>[2,3,4].includes(Math.floor(n.id/100))),other=list.filter(n=>![2,3,4].includes(Math.floor(n.id/100)));
    ok("su bildirimlerinde eylem türü ve miktar var",water.length>0&&water.every(n=>n.actionTypeId==="water"&&n.extra.act==="su"&&n.extra.v===250),water[0]);
    ok("diğer bildirimlerde düğme yok",other.length>0&&other.every(n=>n.actionTypeId===undefined&&(n.extra===undefined||n.extra.act==="open")));
    ev("S.settings.glass=330");await ev("scheduleReminders()");
    ok("bardak boyutu değişince düğme metni ve miktar güncellenir",types[0].actions[0].title==="+330 ml"&&list.filter(n=>n.actionTypeId==="water").every(n=>n.extra.v===330));
    ev("S.settings.glass=250");

    // haftalık yedek hatırlatması
    const bk=()=>list.filter(n=>Math.floor(n.id/100)===10);
    await ev("scheduleReminders()");
    ok("10 kayıttan azken yedek hatırlatması kurulmaz",bk().length===0);
    ev("S.entries=Array.from({length:12},(_,i)=>({id:i+1,day:dayKey(),time:'08:00',type:'su',v:200,text:''}))");
    await ev("scheduleReminders()");
    ok("yedek hatırlatması yalnızca Pazar günleri kurulur (30 günde 4-5)",bk().length>=3&&bk().length<=5&&bk().every(n=>new Date(n.schedule.at).getDay()===0),bk().map(n=>new Date(n.schedule.at).getDay()));
    ok("yedek bildirimi metni Drive'a yönlendirir",bk()[0].body.includes("Drive")&&bk()[0].title.includes("Yedek"));
    ev("S.settings.lastBackup=dayKey()");await ev("scheduleReminders()");
    const dayDiff=n=>Math.round((new Date(n.schedule.at).setHours(0,0,0,0)-new Date().setHours(0,0,0,0))/864e5);
    ok("yeni yedekten sonraki 7 günde Pazar bildirimi atlanır, sonrakiler sürer",bk().length>=2&&bk().every(n=>dayDiff(n)>=7),bk().map(dayDiff));
    ev("S.settings.lastBackup='2020-01-01'");await ev("scheduleReminders()");
    ok("eski yedekte hatırlatma sürer",bk().length>=3);
    ev("S.settings.reminders.find(r=>r.id===10).on=false");await ev("scheduleReminders()");
    ok("kapatılınca hiç kurulmaz",bk().length===0);
    ev("S.settings.reminders.find(r=>r.id===10).on=true;S.settings.lastBackup=''");
    w.Capacitor.Plugins.LocalNotifications=lnOld;

    // hızlı kayıt: yerel taraf biriktirir, JS ana veriye ekler
    let pending=[];
    w.Capacitor.Plugins.QuickLog={take:async()=>{const r={items:pending};pending=[];return r}};
    const tms=(y,m,d,h,mi)=>new Date(y,m-1,d,h,mi).getTime();
    ev("S.entries=[];S.settings.waterMl=2500");
    pending=[{v:250,t:tms(2026,9,30,23,50)},{v:250,t:Date.now()-60000}];
    await ev("quickIngest()");
    ok("hızlı kayıtlar doğru gün ve saatle eklenir (gece yarısı öncesi dünün kaydı)",ev("S.entries.length")===2&&ev("S.entries[0].day")==="2026-09-30"&&ev("S.entries[0].time")==="23:50"&&ev("S.entries[0].type")==="su"&&ev("S.entries[0].v")===250,ev("S.entries"));
    ok("bildirim toast'ı toplam miktarı yazar",toastT().includes("500 ml")&&toastT().includes("bugün 250"),toastT());
    await ev("quickIngest()");
    ok("aynı kayıtlar ikinci kez eklenmez (take bir kez verir)",ev("S.entries.length")===2);
    pending=[{v:0,t:Date.now()},{v:1501,t:Date.now()},{v:250,t:Date.now()+36e5},{v:NaN,t:Date.now()},{v:250,t:0},{v:250},null,"x",{v:300,t:Date.now()-1000}];
    await ev("quickIngest()");
    ok("geçersiz kayıtlar (sınır dışı, gelecek, bozuk) atılır, geçerli biri eklenir",ev("S.entries.length")===3&&ev("S.entries[2].v")===300,ev("S.entries"));
    pending=[];await ev("quickIngest()");
    ok("boş liste: değişiklik yok",ev("S.entries.length")===3);
    ev("S.entries=[]");pending=[{v:250,t:Date.now()-1000}];
    const lnH=[];w.Capacitor.Plugins.LocalNotifications={checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),getPending:async()=>({notifications:[]}),cancel:async()=>{},registerActionTypes:async()=>{},schedule:async o=>{lnH.push(...o.notifications)}};
    ev("S.settings.waterMl=500;add('su',250,'')");
    await ev("quickIngest()");await new Promise(r=>setTimeout(r,50));
    ok("hızlı kayıt hedefi tamamlarsa bildirimler yeniden kurulur, bugünün su alarmı yok",lnH.length>0&&![200,300,400].some(i=>lnH.some(n=>n.id===i)),lnH.length);
    w.Capacitor.Plugins.LocalNotifications=lnOld;ev("S.settings.waterMl=2500");
    delete w.Capacitor.Plugins.QuickLog;
    ev("S.entries=[]");await ev("quickIngest()");
    ok("eklenti yoksa (tarayıcı) sessizce geçer, kayıt eklenmez",ev("S.entries.length")===0);
    ev("S.entries=[]");

    // Drive'a gönder
    let saved=null,shared=null,shareErr=null;
    w.Capacitor.Plugins.Filesystem={writeFile:async o=>{saved=o;return {uri:"file:///cache/y.json"}}};
    w.Capacitor.Plugins.Share={share:async o=>{if(shareErr)throw shareErr;shared=o}};
    ev("S.settings.healthNote='gizli sağlık notu';S.settings.lastBackup=''");
    ev("tab='ayar';render()");
    ok("Ayarlar'da Drive'a gönder düğmesi",!!q('[data-act="drive"]'));
    click('[data-act="drive"]');await new Promise(r=>setTimeout(r,30));
    ok("yedek ekranı: parola alanları, hesap bağlama gerekmediği belirtilir",!!q("#bkp1")&&!!q("#bkp2")&&q("#sheet").textContent.includes("Hesap bağlamak gerekmez")&&!q("#bkrem"));
    q("#bkp1").value="abc";q("#bkp2").value="abc";click('[data-bk="send"]');await new Promise(r=>setTimeout(r,30));
    ok("kısa parola reddedilir",saved===null&&q("#bkw").textContent.includes("en az 6"));
    q("#bkp1").value="parola123";q("#bkp2").value="parola124";click('[data-bk="send"]');await new Promise(r=>setTimeout(r,30));
    ok("parolalar uyuşmazsa gönderilmez",saved===null&&q("#bkw").textContent.includes("aynı değil"));
    q("#bkp2").value="parola123";click('[data-bk="send"]');await new Promise(r=>setTimeout(r,800));
    ok("şifreli yedek paylaşılır: dosya adı, düz metin yok, paylaşım",saved&&/^neowell-yedek-\d{4}-\d{2}-\d{2}\.json$/.test(saved.path)&&JSON.parse(saved.data).enc==="aes-gcm-pbkdf2"&&!saved.data.includes("gizli sağlık notu")&&shared.files[0]==="file:///cache/y.json",saved&&saved.data.slice(0,120));
    ok("paylaşım sonrası son yedek tarihi bugün olur, bildirim metni",ev("S.settings.lastBackup")===ev("dayKey()")&&toastT().includes("Drive"));
    // geri yüklenebilir mi (gidiş dönüş)
    doc.body.insertAdjacentHTML("beforeend",'<textarea id="bk2"></textarea>');
    ev("S.settings.healthNote=''");
    const encJ=saved.data;
    ev("sheetYedek()");q("#bk").value=encJ;q("#bkpw").value="parola123";await ev("goYukle()");
    ok("gönderilen yedek aynı parolayla geri yüklenir",ev("S.settings.healthNote")==="gizli sağlık notu");
    // iptal
    shareErr=new Error("Share canceled");saved=null;ev("S.settings.lastBackup=''");
    ev("sheetDrive()");await new Promise(r=>setTimeout(r,30));
    q("#bkp1").value="parola123";q("#bkp2").value="parola123";click('[data-bk="send"]');await new Promise(r=>setTimeout(r,800));
    ok("paylaşım iptal edilirse yedek yapıldı sayılmaz",ev("S.settings.lastBackup")===""&&!toastT().includes("paylaşıldı"));
    shareErr=null;

    // parolayı Keystore ile saklama
    w.Capacitor.Plugins.KeyVault={encrypt:async({text})=>({data:"ENC:"+Buffer.from(text).toString("base64")}),decrypt:async({data})=>({text:Buffer.from(data.slice(4),"base64").toString()})};
    ev("vaultOn=true");
    ev("sheetDrive()");await new Promise(r=>setTimeout(r,30));
    ok("kasa varken 'parolayı sakla' kutusu işaretli gelir",!!q("#bkrem")&&q("#bkrem").checked);
    q("#bkp1").value="parola123";q("#bkp2").value="parola123";click('[data-bk="send"]');await new Promise(r=>setTimeout(r,800));
    ok("parola kasayla şifreli saklanır, düz metin saklanmaz",!!ev("localStorage.getItem('koc_bkpw_enc')")&&!ev("localStorage.getItem('koc_bkpw_enc')").includes("parola123")&&ev("localStorage.getItem('koc_bkpw_enc')").startsWith("ENC:"));
    saved=null;ev("sheetDrive()");await new Promise(r=>setTimeout(r,30));
    ok("saklı parolayla tek dokunuşla gönderme: parola alanı yok",!q("#bkp1")&&!!q('[data-bk="send"]')&&q("#sheet").textContent.includes("saklı"));
    click('[data-bk="send"]');await new Promise(r=>setTimeout(r,800));
    ok("saklı parolayla şifreli yedek gider",saved&&JSON.parse(saved.data).enc==="aes-gcm-pbkdf2");
    ev("sheetDrive()");await new Promise(r=>setTimeout(r,30));click('[data-bk="forget"]');await new Promise(r=>setTimeout(r,30));
    ok("parolayı unut: saklanan silinir, alanlar geri gelir",ev("localStorage.getItem('koc_bkpw_enc')")===null&&!!q("#bkp1"));
    ev("closeSheet();vaultOn=false");delete w.Capacitor.Plugins.KeyVault;
    ev("S.settings.healthNote='';S.settings.lastBackup='';tab='bugun';render()");
  }
  // ---- İlaç hatırlatıcı ----
  {
    const doc=w.document,q=s=>doc.querySelector(s),qa=s=>[...doc.querySelectorAll(s)];
    const click=s=>q(s).click(),toastT=()=>q("#toast").textContent,txt=()=>q("#sheet").textContent;
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    ev("S.meds=[];S.medLog=[];S.settings.medOn=false;S.settings.medShowName=true;S.entries=[];S.vitals=[];tab='bugun';render()");
    ok("özellik kapalıyken Bugün'de ilaç kartı yok",!ev("viewBugun()").includes("💊"));
    ev("tab='ayar';render()");
    ok("Ayarlar'da ilaç hatırlatıcıyı aç düğmesi ve uyarı metni",!!q('[data-md="toggle"]')&&q("#view").textContent.includes("doz önermez")&&!q('[data-md="shown"]'));
    click('[data-md="toggle"]');
    ok("açılınca ilaç adı seçeneği ve düzenleme bağlantısı çıkar",ev("S.settings.medOn")===true&&!!q('[data-md="shown"]')&&q('[data-md="shown"]').checked&&!!q('#view [data-tab="ilac"]'));
    ev("tab='bugun';render()");
    ok("ilaç yokken kart 'ilaç ekle' önerir",q("#view").textContent.includes("Henüz ilaç eklemedin")&&!!q('[data-md="new"]'));

    // ekleme ve doğrulama
    click('[data-md="new"]');
    ok("ilaç ekranı: ad, doz, saat, günler, stok",!!q("#mn")&&!!q("#md")&&!!q("#mt0")&&qa("[data-md^='wd:']").length===7&&!!q("#mk")&&!q('[data-md="del"]'));
    click('[data-md="save"]');
    ok("adsız ilaç kaydedilmez",ev("S.meds.length")===0&&q("#mwarn").textContent.includes("adını"));
    q("#mn").value="Test İlaç";q("#md").value="1 tablet";
    click('[data-md="addtime"]');
    ok("saat ekleyince yazılanlar korunur",q("#mn").value==="Test İlaç"&&!!q("#mt1"));
    q("#mt0").value="08:00";q("#mt1").value="08:00";click('[data-md="save"]');
    ok("yinelenen saat reddedilir",ev("S.meds.length")===0&&q("#mwarn").textContent.includes("Saatleri"));
    q("#mt1").value="20:00";q("#mk").value="abc";click('[data-md="save"]');
    ok("sayı olmayan stok reddedilir",ev("S.meds.length")===0&&q("#mwarn").textContent.includes("sayı"));
    q("#mk").value="10";q("#mp").value="1";q("#mc").value="0";click('[data-md="save"]');
    ok("gün sayısı 0 reddedilir",ev("S.meds.length")===0&&q("#mwarn").textContent.includes("Gün sayısı"));
    q("#mc").value="";
    for(const w_ of [0,1,2,3,4,5,6])click(`[data-md="wd:${w_}"]`);
    click('[data-md="save"]');
    ok("hiç gün seçilmezse reddedilir",ev("S.meds.length")===0&&q("#mwarn").textContent.includes("bir gün"));
    for(const w_ of [0,1,2,3,4,5,6])click(`[data-md="wd:${w_}"]`);
    click('[data-md="save"]');
    ok("ilaç kaydedilir: ad, doz, saatler, stok, her gün",ev("S.meds.length")===1&&ev("S.meds[0].n")==="Test İlaç"&&ev("S.meds[0].d")==="1 tablet"&&ev("S.meds[0].t.join()")==="08:00,20:00"&&ev("S.meds[0].k")===10&&ev("S.meds[0].w")===undefined&&toastT().includes("kaydedildi"),ev("S.meds"));
    ev("tab='bugun';render()");
    const rows=()=>qa("#view .row").filter(r=>r.textContent.includes("Test İlaç"));
    ok("Bugün kartı iki dozu ve düğmelerini gösterir",rows().length===2&&qa('[data-md^="take:1:"]').length===2&&qa('[data-md^="skip:1:"]').length===2);

    // alındı / atlandı / geri al
    click('[data-md="take:1:08:00"]');
    ok("alındı: kayıt, saat, stok düşer, toast",ev("S.medLog.length")===1&&ev("S.medLog[0].st")==="t"&&/^\d\d:\d\d$/.test(ev("S.medLog[0].at"))&&ev("S.meds[0].k")===9&&toastT().includes("alındı"),ev("S.medLog"));
    ok("kartta ✓ görünür, düğmeler gider",q("#view").textContent.includes("✓")&&!q('[data-md="take:1:08:00"]')&&!!q('[data-md="clear:1:08:00"]')&&!!q('[data-md="take:1:20:00"]'));
    click("#tundo");
    ok("geri al kaydı ve stoğu eski haline getirir",ev("S.medLog.length")===0&&ev("S.meds[0].k")===10&&!!q('[data-md="take:1:08:00"]'));
    click('[data-md="skip:1:20:00"]');
    ok("atlandı: kayıt, stok değişmez",ev("S.medLog[0].st")==="s"&&ev("S.meds[0].k")===10&&q("#view").textContent.includes("Atlandı"));
    click('[data-md="take:1:20:00"]'.replace("take","clear"));
    ok("işaret geri alınır (↩)",ev("S.medLog.length")===0);
    click('[data-md="take:1:08:00"]');

    // ilaçlar ekranı
    ev("tab='ilac';render()");
    ok("ilaçlar ekranı: başlık, bugünün dozları, ilaç listesi, uyarı metni",q("#ttl").textContent==="İlaçlar"&&q("#view").textContent.includes("Test İlaç")&&q("#view").textContent.includes("08:00, 20:00 · her gün")&&q("#view").textContent.includes("doz önermez")&&q('nav [data-tab="ilac"]').getAttribute("aria-current")==="page"&&!q('nav [data-tab="bugun"]').getAttribute("aria-current")&&!q("#navIlac").hidden);
    ok("Koç bağlamı: ilaçlar adı, saati, son 7 gün uyumu ve uyarıyla gider",(c=>c.includes("İLAÇLAR")&&c.includes("Test İlaç")&&c.includes("08:00, 20:00")&&c.includes("son 7 gün:")&&c.includes("hekime"))(ev("CoachLib.contextText(cData())")));
    ev("S.settings.medOn=false;render()");
    ok("ilaç kapalıyken sekme gizli, Koç bağlamında ilaç yok",q("#navIlac").hidden&&!ev("CoachLib.contextText(cData())").includes("İLAÇLAR"));
    ev("S.settings.medOn=true;render()");
    ok("ilaç alarmı: Atla düğmesi dozu atlandı yazar, alındıyı ezmez",ev("(()=>{const sv=JSON.stringify([S.meds,S.medLog]),m=S.meds[0],s=m.t[1],t=Date.now();const r1=medIngest([{m:m.id,s,t,k:true}]).n;const r2=medIngest([{m:m.id,s,t,k:false}]).n;return r1===1&&r2===0&&MedLib.statusOf(S.medLog,m.id,MedLib.dayForTap(s,t),s)==='s'&&(([a,b])=>{S.meds=a;S.medLog=b;return true})(JSON.parse(sv))})()"));
    ev("S.medLog.push({id:99,m:1,day:keyOff(-1),slot:'08:00',st:'t'},{id:100,m:1,day:keyOff(-1),slot:'20:00',st:'s'})");ev("render()");
    ok("uyum kutuları: son 7 gün yüzdesi ve doz sayısı, günlük döküm",q("#view").textContent.includes("Son 7 gün uyum")&&/%\d+/.test(q("#view").textContent)&&q("#view").textContent.includes("doz alındı")&&q("#view").textContent.includes("atlanan 1"),q("#view").textContent.slice(0,400));
    ev("S.medLog=S.medLog.filter(x=>x.id!==99&&x.id!==100)");
    ev("S.meds[0].k=3");ev("render()");
    ok("stok azalınca uyarı",q("#view").textContent.includes("yaklaşık 3 doz kaldı"));
    ok("tanı/öneri dili yok",!/etkileşim kontrol|dozu artır|doktora danış|yan etki/i.test(q("#view").textContent.replace("etkileşimlerini denetlemez","")));

    // düzenle, kapat, sil
    click('[data-md="edit:1"]');
    ok("düzenleme: alanlar dolu, sil düğmesi var",q("#mn").value==="Test İlaç"&&q("#mt0").value==="08:00"&&q("#mt1").value==="20:00"&&!!q('[data-md="del"]')&&q("#mon").checked);
    q("#mn").value="Yeni Ad";q("#mon").checked=false;click('[data-md="save"]');
    ok("düzenleme kaydedilir; kapalı ilaç günün dozlarında çıkmaz",ev("S.meds[0].n")==="Yeni Ad"&&ev("S.meds[0].on")===false&&ev("S.meds.length")===1&&ev("MedLib.dosesOn(S.meds,dayKey()).length")===0);
    click('[data-md="edit:1"]');q("#mon").checked=true;click('[data-md="save"]');
    ok("tekrar açılır",ev("S.meds[0].on")===true);
    click('[data-md="edit:1"]');click('[data-md="del"]');
    ok("silinince ilaç ve kayıtları gider, geri al getirir",ev("S.meds.length")===0&&ev("S.medLog.length")===0);
    click("#tundo");
    ok("geri al ilacı ve kayıtlarını getirir",ev("S.meds.length")===1&&ev("S.medLog.length")===1);

    // kür
    click('[data-md="new"]');q("#mn").value="Kür";q("#mc").value="3";click('[data-md="save"]');
    ok("kür: başlangıç bugün, bitiş 3. gün",ev("S.meds.find(m=>m.n==='Kür').s")===ev("dayKey()")&&ev("S.meds.find(m=>m.n==='Kür').e")===ev("MedLib.addDay(dayKey(),2)")&&ev("MedLib.dosesOn(S.meds,MedLib.addDay(dayKey(),3)).filter(x=>x.m.n==='Kür').length")===0);
    ev("S.meds=S.meds.filter(m=>m.n!=='Kür')");

    // bildirim kurulumu
    const lnOld=w.Capacitor.Plugins.LocalNotifications;let types=null,list=[];
    w.Capacitor.Plugins.LocalNotifications={checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),getPending:async()=>({notifications:[]}),cancel:async()=>{},registerActionTypes:async o=>{types=o.types},schedule:async o=>{list=o.notifications}};
    ev("S.medLog=[]");
    await ev("scheduleReminders()");
    const medN=()=>list.filter(n=>n.id>=1e6);
    ok("ilaç bildirimleri kurulur: büyük kimlik, 'Aldım' eylemi, ek veri, ad görünür",medN().length>=40&&medN().every(n=>n.actionTypeId==="med"&&n.extra.act==="med"&&n.extra.m===1)&&medN()[0].body.includes("Yeni Ad"),medN()[0]);
    ok("eylem türleri: su ve ilaç ('✔ Aldım')",types.some(t=>t.id==="med"&&t.actions[0].id==="med"&&t.actions[0].title==="✔ Aldım")&&types.some(t=>t.id==="water"));
    ok("normal hatırlatmalar ilaç kimlikleriyle çakışmaz, kimlikler benzersiz",new Set(list.map(n=>n.id)).size===list.length);
    ev("S.settings.medShowName=false");await ev("scheduleReminders()");
    ok("ad gizliyse bildirimde ilaç adı yok",medN().length>0&&medN().every(n=>!JSON.stringify(n).includes("Yeni Ad")&&n.body==="İlaç saatin geldi."));
    ev("S.settings.medShowName=true;S.settings.medOn=false");await ev("scheduleReminders()");
    ok("özellik kapalıyken ilaç bildirimi kurulmaz",medN().length===0);
    ev("S.settings.medOn=true");
    ev("S.medLog=[{id:1,m:1,day:dayKey(),slot:'20:00',st:'t'}]");await ev("scheduleReminders()");
    ok("bugün alınmış dozun bildirimi kurulmaz",!medN().some(n=>n.extra.s==="20:00"&&n.id===1000000+1*1000+1*40+0));
    ev("S.meds=Array.from({length:20},(_,i)=>({id:i+1,n:'M'+i,t:['06:00','10:00','14:00','18:00','22:00','23:00'],on:true}));S.medLog=[]");
    await ev("scheduleReminders()");
    ok("çok ilaçta toplam alarm 440 ile sınırlı (Android 500 sınırı)",list.length===440,list.length);
    ok("sınırlandırmada en yakın tarihliler korunur (kalan alarmlar yalnızca ilk 5 güne ait)",Math.max(...list.filter(n=>n.id>=1e6).map(n=>n.id%40))<=4&&list.filter(n=>n.id>=1e6).some(n=>n.id%40===0),Math.max(...list.filter(n=>n.id>=1e6).map(n=>n.id%40)));
    w.Capacitor.Plugins.LocalNotifications=lnOld;
    ev("S.meds=[{id:1,n:'Test İlaç',d:'1 tablet',t:['08:00','20:00'],on:true,k:10}];S.medLog=[]");

    // bildirimden Aldım
    let pend=[];const sch=[];
    w.Capacitor.Plugins.QuickLog={take:async()=>{const r={items:pend};pend=[];return r}};
    w.Capacitor.Plugins.LocalNotifications={checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),getPending:async()=>({notifications:[]}),cancel:async()=>{},registerActionTypes:async()=>{},schedule:async o=>{sch.push(...o.notifications)}};
    const tapT=Date.now()-60000;
    pend=[{m:1,s:"08:00",t:tapT}];
    await ev("quickIngest()");await wait(50);
    ok("bildirimden 'Aldım': doz bugün için alındı olarak işlenir, stok düşer, bildirim yeniden kurulur",ev("S.medLog.length")===1&&ev("S.medLog[0].st")==="t"&&ev("S.medLog[0].day")===ev("MedLib.dayForTap('08:00',"+tapT+")")&&ev("S.meds[0].k")===9&&toastT().includes("Test İlaç")&&sch.length>0,[ev("S.medLog"),toastT()]);
    pend=[{m:1,s:"08:00",t:Date.now()-1000}];
    await ev("quickIngest()");
    ok("aynı doz ikinci kez bildirimden gelirse tekrar sayılmaz, stok düşmez",ev("S.medLog.length")===1&&ev("S.meds[0].k")===9);
    pend=[{m:77,s:"08:00",t:Date.now()-1000},{m:1,s:"09:30",t:Date.now()-1000},{m:1,s:"bozuk",t:Date.now()-1000},{m:1.5,s:"08:00",t:Date.now()-1000}];
    await ev("quickIngest()");
    ok("bilinmeyen ilaç, programda olmayan saat ve bozuk veri atılır",ev("S.medLog.length")===1);
    const t0=new Date();t0.setHours(0,0,0,0);
    ev("S.medLog=[];S.meds[0].t=['23:30'];S.meds[0].k=10");
    pend=[{m:1,s:"23:30",t:t0.getTime()}];await ev("quickIngest()");
    ok("gece yarısından sonra basılan 23:30 dozu önceki güne yazılır",ev("S.medLog.length")===1&&ev("S.medLog[0].day")===ev("MedLib.addDay(dayKey(new Date("+t0.getTime()+")),-1)"),ev("S.medLog"));
    ev("S.meds[0].t=['08:00','20:00'];S.medLog=[];S.meds[0].k=10");
    w.Capacitor.Plugins.LocalNotifications=lnOld;delete w.Capacitor.Plugins.QuickLog;

    // yedek ve temizlik
    ev("S.medLog=[{id:1,m:1,day:dayKey(),slot:'08:00',st:'t',at:'08:03'}]");
    const bkJ=ev("JSON.stringify(S)");
    ev("S.meds=[];S.medLog=[]");doc.querySelector("#bk").value=bkJ;await ev("goYukle()");
    ok("yedekten geri yüklemede ilaçlar ve kayıtlar gelir",ev("S.meds.length")===1&&ev("S.meds[0].n")==="Test İlaç"&&ev("S.medLog.length")===1&&ev("S.medLog[0].at")==="08:03");
    doc.querySelector("#bk").value=JSON.stringify({...JSON.parse(bkJ),meds:[{id:1,n:"İyi",t:["08:00"]},{id:2,n:"",t:["09:00"]},{id:3,n:"Saatsiz",t:[]},"çöp",null],medLog:[{m:1,day:"2026-09-10",slot:"08:00",st:"t"},{m:2,day:"2026-09-10",slot:"09:00",st:"t"},{m:1,day:"bozuk",slot:"08:00",st:"t"}]});
    await ev("goYukle()");
    ok("bozuk ilaç ve kayıtlar yüklemede ayıklanır (silinmiş ilacın kaydı da)",ev("S.meds.length")===1&&ev("S.medLog.length")===1&&ev("S.medLog[0].m")===1,[ev("S.meds"),ev("S.medLog")]);
    ok("sıfırlama boş ilaç listesi başlatır",ev("DEF.meds.length")===0&&ev("DEF.medLog.length")===0&&ev("DEF.settings.medOn")===false);
    ev("S.meds=[];S.medLog=[];S.settings.medOn=false;tab='bugun';render()");
  }
  {
    // hareket algılama (yürüyüş/koşu otomatik)
    const doc=w.document,q=s=>doc.querySelector(s),click=s=>q(s).click();
    const so=ev("S.settings.stepsOn"),mcalls=[];let mperm={activity:true,fine:true,bg:false,on:false},mitems=[];
    w.Capacitor.Plugins.Motion={status:async()=>mperm,requestAccess:async()=>{mcalls.push("req");mperm={...mperm,bg:true};return mperm},configure:async(o)=>{mcalls.push("cfg:"+o.cm)},start:async()=>{mcalls.push("start");return mperm},stop:async()=>{mcalls.push("stop");return mperm},take:async()=>{const r={items:mitems};mitems=[];return r}};
    ev("S.settings.stepsOn=true;S.settings.heightCm=170;S.settings.motionOn=false;S.moves=[];tab='ayar';render()");
    ok("hareket: ayarlarda blok, aç düğmesi ve gizlilik metni",q("#view").textContent.includes("Hareket algılama")&&q('[data-mo="toggle"]').textContent.includes("aç")&&q("#view").textContent.includes("kaydedilmez"));
    click('[data-mo="toggle"]');await new Promise(r=>setTimeout(r,60));
    ok("hareket: açınca izin istenir, boy gönderilir, algılama başlar",ev("S.settings.motionOn")===true&&mcalls.includes("req")&&mcalls.includes("cfg:170")&&mcalls.includes("start"),mcalls);
    const mt0=Date.now()-30*60000;
    mitems=[{t0:mt0,t1:mt0+22*60000,k:"w",steps:2400,km:2.1,kmh:5.7,kcal:110,gps:true},{t0:mt0,t1:mt0+3*60000,k:"w",steps:50,km:0.1,kmh:2,kcal:5,gps:false}];
    await ev("motionIngest()");
    ev("tab='adim';render()");
    ok("hareket: geçerli aralık kaydedilir ve Adım ekranında listelenir, geçersiz atılır",ev("S.moves.length")===1&&q("#view").textContent.includes("Yürüyüş")&&q("#view").textContent.includes("22 dk")&&q("#view").textContent.includes("2,1 km")&&q("#view").textContent.includes("110 kcal"),ev("S.moves"));
    await ev("motionIngest()");
    ok("hareket: aynı aralık tekrar eklenmez",ev("S.moves.length")===1);
    mitems=[{t0:mt0,t1:mt0+22*60000,k:"w",steps:2400,km:2.1,kmh:5.7,kcal:110,gps:true}];
    await ev("motionIngest()");
    ok("hareket: aynı gün-saat-tür kaydı ikinci kez eklenmez",ev("S.moves.length")===1);
    const mbk=ev("JSON.stringify(S)");
    ev("S.moves=[]");doc.querySelector("#bk").value=mbk;await ev("goYukle()");
    ok("hareket: yedekten geri yüklemede aralıklar gelir",ev("S.moves.length")===1&&ev("S.moves[0].min")===22);
    doc.querySelector("#bk").value=JSON.stringify({...JSON.parse(mbk),moves:[{day:"bozuk",t0:"07:00",min:5,k:"w",steps:500,km:1,kmh:3},{day:"2026-09-01",t0:"07:00",min:5,k:"w",steps:500,km:1,kmh:3},"x"]});
    await ev("goYukle()");
    ok("hareket: bozuk aralıklar yüklemede ayıklanır",ev("S.moves.length")===1&&ev("S.moves[0].day")==="2026-09-01");
    ev("S.moves=[]");mcalls.length=0;
    await ev("motionBoot()");
    ok("hareket: uygulama açılışında algılama yeniden kaydedilir",mcalls.includes("start")&&mcalls.some(c=>c.startsWith("cfg:")),mcalls);
    ev("tab='ayar';render()");click('[data-mo="toggle"]');await new Promise(r=>setTimeout(r,60));
    ok("hareket: kapatınca durdurulur",ev("S.settings.motionOn")===false&&mcalls.includes("stop"),mcalls);
    mitems=[{t0:mt0,t1:mt0+22*60000,k:"w",steps:2400,km:2.1,kmh:5.7,kcal:110,gps:true}];
    await ev("motionIngest()");
    ok("hareket: kapalıyken kayıt alınmaz",ev("S.moves.length")===0);
    mperm={activity:false,fine:false,bg:false,on:false};ev("S.settings.motionOn=true");mcalls.length=0;
    await ev("motionBoot()");
    ok("hareket: izin geri alınmışsa (ya da yedekten gelmişse) ayar kapanır, başlatılmaz",ev("S.settings.motionOn")===false&&!mcalls.includes("start"),mcalls);
    mperm={activity:true,fine:true,bg:true,on:true};ev("S.settings.motionOn=true");
    const st0=w.Capacitor.Plugins.Motion.start;w.Capacitor.Plugins.Motion.start=async()=>{throw new Error("gms yok")};
    await ev("motionBoot()");
    ok("hareket: Google Play hizmeti yoksa (başlatma hata verirse) ayar kapanır",ev("S.settings.motionOn")===false);
    w.Capacitor.Plugins.Motion.start=st0;
    ev("S.settings.motionOn=true;S.settings.stepsOn=true");mcalls.length=0;mitems=[{t0:mt0,t1:mt0+22*60000,k:"w",steps:2400,km:2.1,kmh:5.7,kcal:110,gps:true}];
    await ev("motionStopAll()");
    ok("hareket: adım sayar kapanınca hareket algılama durur ve bekleyen kayıt alınır",ev("S.settings.motionOn")===false&&mcalls.includes("stop")&&ev("S.moves.length")===1,mcalls);
    ev("S.moves=[]");
    delete w.Capacitor.Plugins.Motion;ev("tab='ayar';render()");
    ok("hareket: eklenti yoksa (tarayıcı) blok gizli",!q("#view").textContent.includes("Hareket algılama"));
    ev("S.settings.stepsOn="+so+";S.settings.motionOn=false;S.moves=[];tab='bugun';render()");
  }
  {
    // egzersiz kütüphanesi, süreli setler ve zamanlayıcı
    const doc=w.document,q=s=>doc.querySelector(s),qa=s=>[...doc.querySelectorAll(s)],click=s=>q(s).click(),wait=ms=>new Promise(r=>setTimeout(r,ms)),toastT=()=>q("#toast").textContent;
    const fire=(sel,v)=>{q(sel).value=v;q(sel).dispatchEvent(new w.Event("change",{bubbles:true}))};
    const lnOld2=w.Capacitor.Plugins.LocalNotifications,lnLog=[];
    w.Capacitor.Plugins.LocalNotifications={checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),getPending:async()=>({notifications:[{id:9001},{id:5}]}),getDeliveredNotifications:async()=>({notifications:[]}),removeDeliveredNotifications:async()=>{},registerActionTypes:async()=>{},cancel:async o=>{lnLog.push(["c",o.notifications.map(n=>n.id)])},schedule:async o=>{lnLog.push(["s",o.notifications.map(n=>n.id)])}};
    ev("S.workouts=[];S.templates=[];S.customEx=[];S.gid=1;tab='salon';render()");
    ok("kütüphane: ≥300 egzersiz, eski kimlikler ve adlar korunur, şekil eklenir",ev("EXMERGED.length")>=300&&ev("gEx('squat').n")==="Squat"&&ev("gEx('squat').tp")==="squat"&&ev("gEx('ohp').n")==="Omuz press"&&ev("gEx('curl').inc")===2);
    ok("salon ana ekranı kütüphane düğmesini gösterir",!!q('[data-g="lib"]'));
    click('[data-g="lib"]');
    ok("kütüphane ekranı açılır: başlık, 40 satır, küçük şekiller, devamı düğmesi",ev("tab")==="egz"&&q("#ttl").textContent==="Egzersizler"&&qa("#gllist .exrow").length===40&&!!q(".exthumb svg")&&!!q('[data-g="lmore"]'),qa("#gllist .exrow").length);
    click('[data-g="lreg:Biseps"]');
    const nb=ev("EXMERGED.filter(e=>e.r==='Biseps').length");
    ok("bölge süzgeci: yalnız o bölge",qa("#gllist .exrow").length===nb&&nb>=15&&!q("#gllist").textContent.includes("Bench press"),qa("#gllist .exrow").length);
    click('[data-g="lreg:Tümü"]');click('[data-g="leq:Ağırlıksız"]');click('[data-g="lcat:Esneme"]');
    ok("tür ve ekipman süzgeci birlikte çalışır",qa("#gllist .exrow").length===ev("EXMERGED.filter(e=>e.q==='Ağırlıksız'&&e.c==='e').length")&&qa("#gllist .exrow").length>=5);
    click('[data-g="leq:Tümü"]');click('[data-g="lcat:Tümü"]');
    q("#glq").value="plank";q("#glq").dispatchEvent(new w.Event("input",{bubbles:true}));
    ok("arama: plank bulunur",q("#gllist").textContent.includes("Plank")&&qa("#gllist .exrow").length<10);
    click('[data-g="exinfo:plank"]');
    ok("ayrıntı: hareketli şekil, form ipucu, foto, kayıt türü",q("#sheet .exfig svg animate")&&q("#sheet").textContent.includes("Vücut baştan topuğa")&&q('#sheet img[src="ex/plank/0.webp"]')&&q("#sheet").textContent.includes("Süreli tutuş"));
    click('[data-g="exadd:plank"]');
    ok("antrenmana ekle: antrenman başlar, plank 3 set × 30 sn",ev("S.workouts.length")===1&&ev("S.workouts[0].ex[0].id")==="plank"&&ev("S.workouts[0].ex[0].sets.length")===3&&ev("S.workouts[0].ex[0].sets[0].sec")===30&&ev("tab")==="salon"&&!!q('[data-gi="sec:0:0"]')&&!!q('[data-g="tstart:0:0"]'));
    click('[data-g="tstart:0:0"]');await wait(20);
    ok("zamanlayıcı başlar: çubuk görünür, bildirim 9001 kurulur",ev("!!gTim&&gTim.phase==='work'&&gTim.total===30")&&!q("#gtim").hidden&&lnLog.some(l=>l[0]==="s"&&l[1].includes(9001)),lnLog);
    ev("render()");
    ok("yeniden çizimde zamanlayıcı çubuğu korunur",!q("#gtim").hidden&&q("#gtv").textContent.length>=4);
    ev("gTim.end=Date.now()-1;exTick()");
    ok("süre dolunca set tamamlanır, dinlenme başlar, zamanlayıcı kapanır",ev("S.workouts[0].ex[0].sets[0].done")===true&&ev("gTim")===null&&ev("restEnd")>Date.now()&&toastT().includes("1. set tamamlandı"),toastT());
    click('[data-g="tstart:0:1"]');click('[data-g="tstart:0:1"]');
    ok("çalışan zamanlayıcıya tekrar basmak durdurur (set tamamlanmaz)",ev("gTim")===null&&ev("S.workouts[0].ex[0].sets[1].done")===false);
    click('[data-g="done:0:1"]');
    ok("süreli set elle tamamlanabilir",ev("S.workouts[0].ex[0].sets[1].done")===true);
    fire('[data-gi="sec:0:2"]',"0");
    ok("geçersiz süre reddedilir",ev("S.workouts[0].ex[0].sets[2].sec")===30&&toastT().includes("Süre"),toastT());
    // aralıklı tur
    ev("gAddEx(gActive(),'climber');save();render()");
    ok("aralıklı: 4 tur × 30 sn",ev("S.workouts[0].ex[1].sets.length")===4&&ev("S.workouts[0].ex[1].sets[0].sec")===30);
    click('[data-g="tstart:1:0"]');ev("gTim.end=Date.now()-1;exTick()");
    ok("aralıklı: tur bitince otomatik 20 sn dinlenme, sonra sıradaki tur",ev("S.workouts[0].ex[1].sets[0].done")&&ev("gTim.phase")==="rest"&&ev("gTim.si")===1&&ev("gTim.total")===20);
    ev("gTim.end=Date.now()-1;exTick()");
    ok("aralıklı: dinlenme bitince 2. tur otomatik başlar",ev("gTim.phase")==="work"&&ev("gTim.si")===1&&ev("gTim.total")===30);
    click('[data-g="tstop"]');
    ok("Bitir: tur tamamlanır, dinlenmeye geçer",ev("S.workouts[0].ex[1].sets[1].done")===true&&ev("gTim&&gTim.phase")==="rest");
    ev("gTimStop()");
    // kardiyo (dakika)
    ev("gAddEx(gActive(),'treadjog');save();render()");
    ok("kardiyo: tek set 10 dk, dakika olarak gösterilir",ev("S.workouts[0].ex[2].sets.length")===1&&ev("S.workouts[0].ex[2].sets[0].sec")===600&&q('[data-gi="sec:2:0"]').value==="10");
    fire('[data-gi="sec:2:0"]',"25");
    ok("kardiyo: dakika saniyeye çevrilip saklanır",ev("S.workouts[0].ex[2].sets[0].sec")===1500);
    fire('[data-gi="sec:2:0"]',"121");
    ok("kardiyo: 120 dakikadan uzun reddedilir",ev("S.workouts[0].ex[2].sets[0].sec")===1500);
    // vücut ağırlığı
    ev("gAddEx(gActive(),'pushup');save();render()");
    ok("vücut ağırlığı: 'ek kg' alanı",q('[data-gi="kg:3:0"]').placeholder==="ek kg");
    fire('[data-gi="reps:3:0"]',"12");
    click('[data-g="done:3:0"]');
    ok("vücut ağırlığı: yalnız tekrarla tamamlanır",ev("S.workouts[0].ex[3].sets[0].done")===true&&ev("S.workouts[0].ex[3].sets[0].reps")===12&&ev("S.workouts[0].ex[3].sets[0].kg")===0);
    // kalıcılık ve eski veri
    const R=JSON.parse(ev("JSON.stringify(cleanGym(JSON.parse(JSON.stringify(S))))"));
    ok("kayıt turu: süre alanı korunur",R.workouts[0].ex[0].sets[0].sec===30&&R.workouts[0].ex[2].sets[0].sec===1500&&R.workouts[0].ex.length===4);
    const old={workouts:[{id:5,day:"2026-09-01",t0:1,t1:2,name:"Eski",tpl:null,ex:[{id:"squat",note:"",sets:[{kg:100,reps:5,done:true}]},{id:"bench",note:"n",sets:[{kg:60,reps:8,done:true}]},{id:"silinmis_x",note:"",sets:[{kg:1,reps:1,done:true}]}]}],templates:[{id:6,name:"T",ex:["squat","row","bilinmeyen"]}],customEx:[{id:"c7",n:"Benim",g:"Kol"},{id:"c8",n:"Kötü",g:"Yok"}],gid:9};
    const O=JSON.parse(ev("JSON.stringify(cleanGym("+JSON.stringify(old)+"))"));
    ok("eski kayıt kaybolmaz: eski kimlikler, şablon, eski gruplu özel egzersiz",O.workouts.length===1&&O.workouts[0].ex.length===2&&O.workouts[0].ex[0].sets[0].kg===100&&O.workouts[0].ex[0].sets[0].sec===undefined&&O.templates[0].ex.join()==="squat,row"&&O.customEx.length===1&&O.customEx[0].g==="Kol",O);
    ok("tüm kütüphane kimlikleri kayıtlarda geçerli",ev("EXMERGED.every(e=>cleanGym({workouts:[{id:1,day:'2026-09-01',t0:1,ex:[{id:e.id,sets:[{kg:1,reps:1,done:true}]}]}]}).workouts[0].ex.length===1)"));
    ev("S.workouts[0].t1=Date.now();render()");
    ok("haftalık set sayısı süreli setleri de sayar (Karın)",ev("gWeekSets()['Karın']")>=2,ev("gWeekSets()"));
    click('[data-g="sum:1"]');
    ok("antrenman özeti süreli setlerle bozulmaz",q("#sheet").textContent.length>20&&!/NaN|undefined/.test(q("#sheet").textContent),q("#sheet").textContent.slice(0,200));
    ev("closeSheet();render()");
    ev("gSheetHist('plank')");
    ok("süreli egzersiz geçmişi: saniyeler listelenir",q("#sheet").textContent.includes("30 sn")&&!q("#sheet").textContent.includes("1TM"),q("#sheet").textContent.slice(0,120));
    ev("closeSheet();S.workouts[0].t1=null;tab='salon';render()");
    // hatırlatma yeniden kurulumu zamanlayıcı bildirimini silmez
    lnLog.length=0;ev("S.settings.reminders.forEach(r=>r.on=true)");await ev("scheduleReminders()");
    ok("hatırlatmalar yeniden kurulurken zamanlayıcı bildirimi (9001) iptal edilmez",lnLog.some(l=>l[0]==="c"&&l[1].includes(5))&&!lnLog.some(l=>l[0]==="c"&&l[1].includes(9001)),lnLog.filter(l=>l[0]==="c"));
    click('[data-g="tstart:0:0"]');
    click('[data-g="menu:0"]');click('[data-g="rmex:0"]');
    ok("egzersiz silinince zamanlayıcı durur",ev("gTim")===null);
    ev("S.workouts=[{id:50,day:dayKey(),t0:Date.now()-3600000,t1:Date.now(),name:'Test',tpl:null,ex:[{id:'plank',note:'',sets:[{kg:null,reps:null,sec:30,done:true},{kg:null,reps:null,sec:30,done:true}]},{id:'pushup',note:'',sets:[{kg:0,reps:12,done:true}]},{id:'treadjog',note:'',sets:[{kg:null,reps:null,sec:1500,done:true}]},{id:'squat',note:'',sets:[{kg:100,reps:5,done:true}]}]}]");
    const ctx=ev("CoachLib.contextText(cData())");
    ok("Koç bağlamı: süreli, vücut ağırlığı, kardiyo ve ağırlıklı egzersizler okunur",ctx.includes("Plank 2x30 sn")&&ctx.includes("Şınav 1x12")&&ctx.includes("25 dk")&&ctx.includes("Squat 100x5"),ctx.split("\n").filter(l=>l.startsWith("SON ANTRENMAN")));
    ok("Koç bağlamı: haftalık set bölgeye göre",ctx.includes("BU HAFTA TAMAMLANAN SET (bölgeye göre):")&&ctx.includes("Karın 2")&&ctx.includes("Ön bacak 1"),ctx.split("\n").filter(l=>l.startsWith("BU HAFTA")));
    ev("S.workouts=[];S.customEx=[];tab='bugun';render()");
    w.Capacitor.Plugins.LocalNotifications=lnOld2;
  }
  {
    // uyku, ruh hali, oruç
    const doc=w.document,q=s=>doc.querySelector(s),click=s=>q(s).click();
    ev("S.sleep=[];S.mood=[];tab='bugun';render()");
    click('[data-hb="sleep"]');q("#hbb").value="23:30";q("#hbw").value="07:00";q("#hbq").value="4";click('[data-hb="sleepgo"]');
    ok("uyku: yatış-kalkış gece yarısını aşarak 450 dk, kalite kaydedilir, Bugün'de görünür",JSON.stringify(ev("S.sleep"))===JSON.stringify([{day:ev("dayKey()"),min:450,q:4}])&&q("#view").textContent.includes("7 sa 30 dk"),ev("S.sleep"));
    click('[data-hb="sleep"]');q("#hbh").value="6,5";click('[data-hb="sleepgo"]');
    ok("uyku: aynı gün yeniden giriş üzerine yazar (süre girişiyle)",ev("S.sleep.length")===1&&ev("S.sleep[0].min")===390);
    click('[data-hb="sleep"]');q("#hbb").value="07:00";q("#hbw").value="07:00";click('[data-hb="sleepgo"]');
    ok("uyku: aynı saat girdisi reddedilir, kayıt değişmez",ev("S.sleep[0].min")===390&&q("#sheet").classList.contains("on"));
    ev("closeSheet()");
    click('[data-hb="mood"]');q("#hbn").value="yorgun";click('[data-hb="mood:2"]');click('[data-hb="mood"]');click('[data-hb="mood:4"]');
    ok("ruh hali: gün başına tek kayıt (son kazanır), not kaydedilir",ev("S.mood.length")===1&&ev("S.mood[0].v")===4&&!ev("S.mood[0].t")&&q("#view").textContent.includes("Ruh hali"),ev("S.mood"));
    click('[data-hb="mood"]');q("#hbn").value="  iyi  ";click('[data-hb="mood:5"]');
    ok("ruh hali: not kırpılır",ev("S.mood[0].t")==="iyi");
    ev("add('su',250)");const bk=ev("JSON.stringify(S)");ev("S.sleep=[];S.mood=[]");q("#bk")||ev("sheetYedek()");q("#bk").value=bk;await ev("goYukle()");
    ok("uyku ve ruh hali yedekten geri gelir",ev("S.sleep.length")===1&&ev("S.mood[0].v")===5);
    const old=JSON.parse(bk);delete old.sleep;delete old.mood;delete old.fast;q("#bk").value=JSON.stringify(old);await ev("goYukle()");
    ok("alansız eski yedek yüklenir: mevcut kayıtlar kalır, yeni alanlar boş",ev("S.entries.length")>0&&ev("S.sleep.length")===0&&ev("S.fast.t0")===null&&ev("S.fast.plan")===16);
    q("#bk").value=JSON.stringify({...JSON.parse(bk),sleep:"x",mood:{a:1},fast:7});await ev("goYukle()");
    ok("çöp uyku/ruh hali/oruç değerinde diğer veriler eksiksiz yüklenir",ev("S.entries.length")===JSON.parse(bk).entries.length&&ev("S.sleep.length")===0&&ev("S.fast.log.length")===0);
    ev("S.sleep=[{day:dayKey(),min:450}];S.mood=[]");
    let ctx=ev("CoachLib.contextText(cData())");
    ok("Koç bağlamı: uyku sütunu yalnız veri varken, ruh hali sütunu yoksa yok",ctx.includes("| adım | uyku sa):")&&ctx.includes("| 7,5")&&!ctx.includes("ruh hali"),ctx.split("\n").filter(l=>l.startsWith("SON 14")));
    ev("S.sleep=[]");ctx=ev("CoachLib.contextText(cData())");
    ok("Koç bağlamı: uyku ve ruh hali verisi yokken sütun başlığı eski haliyle",ctx.includes("| spor dk | adım):")&&!ctx.includes("uyku"));
    ev("S.mood=[{day:dayKey(),v:3}]");ctx=ev("CoachLib.contextText(cData())");
    ok("Koç bağlamı: ruh hali sütunu",ctx.includes("| adım | ruh hali 1-5):"));
    ev("S.mood=[];render()");
    // oruç
    const wait=ms=>new Promise(r=>setTimeout(r,ms)),lnO=w.Capacitor.Plugins.LocalNotifications,sc=[];
    w.Capacitor.Plugins.LocalNotifications={checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),getPending:async()=>({notifications:[{id:9100}]}),getDeliveredNotifications:async()=>({notifications:[]}),removeDeliveredNotifications:async()=>{},registerActionTypes:async()=>{},cancel:async()=>{},schedule:async o=>{sc.push(o.notifications)}};
    ev("S.fast={plan:16,t0:null,log:[]};S.settings.age=0;S.settings.healthNote='';tab='bugun';render()");
    ok("oruç kartı: dört plan, varsayılan 16:8 seçili, hekim notu yok",q("#view").textContent.includes("14:10")&&q("#view").textContent.includes("20:4")&&q('[data-hb="plan:16"]').getAttribute("aria-pressed")==="true"&&!q("#view").textContent.includes("hekimine danış"));
    click('[data-hb="plan:18"]');const t00=Date.now();click('[data-hb="fastgo"]');await wait(30);
    const n9=(sc[sc.length-1]||[]).find(n=>n.id===9100);
    ok("oruç başlayınca 9100 hedef saatte kurulur, kimlik 1.000.000 altında",ev("S.fast.plan")===18&&ev("S.fast.t0")>=t00&&n9&&Math.abs(n9.schedule.at.getTime()-(ev("S.fast.t0")+18*36e5))<1000&&sc[sc.length-1].every(n=>n.id<1e6),n9);
    sc.length=0;await ev("scheduleReminders()");
    ok("oruç sürerken her yeniden kurulumda 9100 durumdan yeniden kurulur",sc[0].some(n=>n.id===9100));
    ev("S.fast.t0=Date.now()-10*36e5;S.fast.plan=16;render()");
    ok("oruç kartı: geçen ve kalan süre dakika hassasiyetiyle",q("#view").textContent.includes("10 sa 0 dk geçti")&&q("#view").textContent.includes("6 sa 0 dk kaldı")&&!!q('[data-hb="fastend"]')&&!q('[data-hb="plan:14"]'));
    ev("S.fast.t0=Date.now()-17*36e5;render()");
    ok("oruç kartı: hedef dolunca 'Hedef doldu'",q("#view").textContent.includes("Hedef doldu"));
    sc.length=0;click('[data-hb="fastend"]');await wait(30);
    ok("oruç bitince log'a yazılır, 9100 kurulmaz, son oruçlar listelenir",ev("S.fast.t0")===null&&ev("S.fast.log.length")===1&&ev("S.fast.log[0].t1-S.fast.log[0].t0")>=16.9*36e5&&sc.length>0&&!sc[0].some(n=>n.id===9100)&&q("#view").textContent.includes("Son oruçlar: ")&&q("#view").textContent.includes("17 sa 0 dk"),ev("S.fast"));
    ok("hatırlatıcı 11 varsayılan kapalı, eski veride de kapalı, kimliği 89 altında",ev("cleanSettings({}).reminders.find(r=>r.id===11).on")===false&&ev("cleanSettings({reminders:[{id:1,t:'09:00',on:true}]}).reminders.find(r=>r.id===11).on")===false&&ev("S.settings.reminders.every(r=>r.id<=89)"));
    ev("S.settings.reminders.find(r=>r.id===11).on=false");sc.length=0;await ev("scheduleReminders()");
    ok("hatırlatıcı 11 kapalıyken 1100 serisi kurulmaz",!sc[0].some(n=>n.id>=1100&&n.id<=1129));
    ev("S.settings.reminders.find(r=>r.id===11).on=true");sc.length=0;await ev("scheduleReminders()");
    ok("hatırlatıcı 11 açılınca 1100+ kimlikleri kurulur",sc[0].some(n=>n.id>=1100&&n.id<=1129)&&new Set(sc[0].map(n=>n.id)).size===sc[0].length);
    ev("S.settings.reminders.find(r=>r.id===11).on=false;S.settings.age=15;render()");
    ok("18 yaş altında oruç kartında hekim notu çıkar, engellenmez",q("#view").textContent.includes("hekimine danış")&&!!q('[data-hb="fastgo"]'));
    ev("S.settings.age=0;S.settings.healthNote='tansiyon';render()");
    ok("sağlık notu varken oruç kartında hekim notu çıkar",q("#view").textContent.includes("hekimine danış"));
    ev("S.settings.healthNote='';S.fast={plan:16,t0:null,log:[]};render()");
    w.Capacitor.Plugins.LocalNotifications=lnO;
  }
  {
    // plaka, ısınma, set anında rekor
    const doc=w.document,q=s=>doc.querySelector(s),click=s=>q(s).click(),toastT=()=>q("#tmsg").textContent;
    const fire=(sel,v)=>{q(sel).value=v;q(sel).dispatchEvent(new w.Event("change",{bubbles:true}))};
    const Wk=(id,t0,t1,sets)=>`{id:${id},day:dayKey(),t0:${t0},t1:${t1},name:'T',tpl:null,ex:[{id:'squat',note:'',sets:${sets}}]}`;
    ev(`S.bar=20;S.workouts=[${Wk(1,1000,2000,"[{kg:100,reps:5,done:true}]")},${Wk(2,Date.now(),null,"[{kg:null,reps:null,done:false},{kg:null,reps:null,done:false}]")}];S.gid=3;tab='salon';render()`);
    click('[data-g="menu:0"]');click('[data-g="plate:0"]');
    fire("#pk","100");q("#pk").dispatchEvent(new w.Event("input"));
    ok("plaka sayfası: 100 kg → bir tarafa 25 + 15, ısınma listesi",q("#pres").textContent.includes("25 + 15")&&q("#pres").textContent.includes("40 × 5"),q("#pres").textContent);
    q("#pk").value="61";q("#pk").dispatchEvent(new w.Event("input"));
    ok("plaka sayfası: tam yapılamayan ağırlıkta en yakın",q("#pres").textContent.includes("en yakın: 60 kg"),q("#pres").textContent);
    q("#pb").value="15";q("#pb").dispatchEvent(new w.Event("input"));
    ok("bar değiştirilebilir ve kalıcı",ev("S.bar")===15);
    q("#pk").value="100";q("#pb").value="20";q("#pb").dispatchEvent(new w.Event("input"));
    click('[data-g="wadd:0"]');
    ok("ısınma setleri başa w:true, done:false eklenir",ev("S.workouts[1].ex[0].sets.length")===6&&ev("S.workouts[1].ex[0].sets.slice(0,4).every(s=>s.w===true&&!s.done)")&&ev("S.workouts[1].ex[0].sets[3].kg")===80);
    ok("ısınma satırı 'ısınma' etiketli ve çalışma seti önceki ile sıra eşler",q(".srow .sp").textContent==="ısınma"&&[...doc.querySelectorAll(".srow .sp")][4].textContent==="100 × 5");
    fire('[data-gi="reps:0:3"]',"1");click('[data-g="done:0:3"]');
    ok("ısınma seti hacme ve rekora girmez",ev("gWorkVol(S.workouts[1])")===0&&ev("gBest(S.workouts[1],'squat')")===0&&!toastT().includes("rekor"));
    fire('[data-gi="kg:0:4"]',"100");fire('[data-gi="reps:0:4"]',"8");click('[data-g="done:0:4"]');
    ok("set anında rekor toast'ı",toastT().startsWith("Yeni rekor: Squat, 100 kg × 8"),toastT());
    ok("hacim yalnız çalışma setini sayar",ev("gWorkVol(S.workouts[1])")===800);
    q("#tmsg").textContent="";
    fire('[data-gi="kg:0:5"]',"100");fire('[data-gi="reps:0:5"]',"9");click('[data-g="done:0:5"]');
    ok("aynı antrenmanda aynı egzersiz için ikinci toast yok",toastT()==="",toastT());
    ok("gPRs ısınmayı saymaz, rekor tek",ev("gPRs(S.workouts[1]).length")===1&&ev("gPRs(S.workouts[1])[0].kg")===100);
    ok("ısınma haftalık set sayısına girmez",(ev("S.workouts[1].t1=Date.now();gWeekSets()['Bacak']")||0)===2,ev("gWeekSets()"));
    // kalıcılık
    const C=JSON.parse(ev("JSON.stringify(cleanGym(JSON.parse(JSON.stringify(S))))"));
    ok("w:true ve bar yeniden yüklemede korunur",C.workouts[1].ex[0].sets[0].w===true&&C.workouts[1].ex[0].sets[4].w===undefined&&C.bar===20);
    const E=JSON.parse(ev(`JSON.stringify(cleanGym({workouts:[{id:5,day:'2026-09-01',t0:1,t1:2,ex:[{id:'squat',sets:[{kg:100,reps:5,done:true}]}]}]}))`));
    ok("alansız eski yedek yüklenir: bar 20, kayıt aynen",E.bar===20&&E.workouts[0].ex[0].sets[0].kg===100&&E.workouts[0].ex[0].sets[0].w===undefined);
    const G=JSON.parse(ev(`JSON.stringify(cleanGym({bar:'abc',workouts:[{id:5,day:'2026-09-01',t0:1,t1:2,ex:[{id:'squat',sets:[{kg:100,reps:5,done:true,w:'x'}]}]}]}))`));
    ok("çöp bar/w değeri: diğer veri eksiksiz yüklenir",G.bar===20&&G.workouts[0].ex[0].sets[0].kg===100&&G.workouts[0].ex[0].sets[0].w===undefined&&JSON.parse(ev("JSON.stringify(cleanGym({bar:99}))")).bar===20);
    // egzersiz başına tekrar aralığı
    ev(`S.exCfg={};S.workouts=[${Wk(1,1000,2000,"[{kg:60,reps:8,done:true},{kg:60,reps:8,done:true}]")},${Wk(2,Date.now(),null,"[{kg:null,reps:null,done:false}]")}];tab='salon';render()`);
    ok("aralık seçilmemişse 8-12 (mevcut davranış)",ev("gSuggest('squat').reps")===9&&ev("gSuggest('squat').kg")===60);
    click('[data-g="menu:0"]');click('[data-g="rng:0"]');click('[data-g="rngset:0:5-8"]');
    ok("5-8 seçilince öneri bu aralığa göre: 8'e ulaşınca ağırlık artar, 5'ten başlar",ev("JSON.stringify(S.exCfg)")==='{"squat":{"lo":5,"hi":8}}'&&ev("gSuggest('squat').kg")===62.5&&ev("gSuggest('squat').reps")===5);
    click('[data-g="menu:0"]');click('[data-g="rng:0"]');click('[data-g="rngset:0:8-12"]');
    ok("8-12 seçilince varsayılana döner",ev("Object.keys(S.exCfg).length")===0);
    const X=JSON.parse(ev(`JSON.stringify(cleanGym({exCfg:{squat:{lo:5,hi:8},bilinmeyen:{lo:5,hi:8},bench:{lo:9,hi:9},row:{lo:0,hi:5}}}))`));
    ok("exCfg yeniden yüklemede korunur, bilinmeyen kimlik ve geçersiz aralık atılır",JSON.stringify(X.exCfg)==='{"squat":{"lo":5,"hi":8}}',X.exCfg);
    const Y=JSON.parse(ev(`JSON.stringify(cleanGym({exCfg:[1,2],workouts:[{id:5,day:'2026-09-01',t0:1,t1:2,ex:[{id:'squat',sets:[{kg:100,reps:5,done:true}]}]}]}))`));
    const Z=JSON.parse(ev(`JSON.stringify(cleanGym({exCfg:{squat:'x',bench:{lo:'5',hi:null},row:null},workouts:[{id:5,day:'2026-09-01',t0:1,t1:2,ex:[{id:'squat',sets:[{kg:100,reps:5,done:true}]}]}]}))`));
    ok("exCfg yok (eski yedek) ve çöp değer: kayıtlar eksiksiz yüklenir",Object.keys(Y.exCfg).length===0&&Object.keys(Z.exCfg).length===0&&Y.workouts[0].ex[0].sets[0].kg===100&&Z.workouts[0].ex[0].sets[0].kg===100);
    ev("S.workouts=[];S.bar=20;closeSheet();tab='bugun';render()");
  }
  {
    // Koç analizi: neden kartı, plato, program, haftalık özet bildirimi
    const doc=w.document,q=s=>doc.querySelector(s),wait=ms=>new Promise(r=>setTimeout(r,ms));
    let fetched=0,reply={reply:"Yorum",log:[]};
    w.fetch=async()=>{fetched++;return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(reply)}}]})}};
    ev("S.chat=[];S.cid=1;S.settings.consent=false;setKey('nvidia','K1');S.entries=[];S.sleep=[];Object.assign(S.settings,{kcal:1800,goalKg:0,age:0,healthNote:''});for(let i=1;i<=7;i++)add('yemek',i%2?2000:300,'y',keyOff(-i));tab='trend';render()");
    q('[data-c="why"]').click();await wait(20);
    const wc=ev("S.chat.find(m=>m.card&&m.card.kind==='why')");
    ok("neden kartı consent yokken yerel çıkar, fetch yok, Koç'a yorumlat görünmez",ev("tab")==="koc"&&wc&&wc.card.items[0].t.includes("hedefin 1800 kcal")&&fetched===0&&!q('[data-c^="whyai"]'),[wc,fetched]);
    await ev(`cWhyAsk(${wc.id})`);
    ok("Koç'a yorumlat consent yokken çağrı yapmaz",fetched===0&&!ev(`S.chat.find(m=>m.id===${wc.id}).card.asked`));
    ev("S.settings.consent=true;render()");
    q(`[data-c="whyai:${wc.id}"]`).click();await wait(30);
    ok("Koç'a yorumlat consent ve sağlayıcı varken bir kez çağırır, yanıt sohbete düşer, düğme kalkar",fetched===1&&ev("S.chat[S.chat.length-1].text")==="Yorum"&&!q('[data-c^="whyai"]'),fetched);
    const cc=JSON.parse(ev("JSON.stringify(cleanCoach(JSON.parse(JSON.stringify(S))))"));
    ok("neden kartı yeniden yüklemede kalır",cc.chat.some(m=>m.card&&m.card.kind==="why"&&m.card.items.length===wc.card.items.length&&m.card.asked===true));
    const g=JSON.parse(ev(`JSON.stringify(cleanCoach({chat:[{id:1,role:'coach',text:'',t:1,card:{kind:'why',items:'x'}},{id:2,role:'coach',text:'',t:1,card:{kind:'why',items:[null,{k:'X!',t:1}]}},{id:3,role:'user',text:'merhaba',t:1}]}))`));
    ok("çöp neden kartında diğer mesajlar eksiksiz yüklenir",g.chat.length===3&&!g.chat[0].card&&!g.chat[1].card&&g.chat[2].text==="merhaba");
    // plato
    const f0=fetched,pq=()=>ev("S.chat.filter(m=>m.kind==='plateau').length");
    ev("S.chat=[];S.settings.lastPlateau='';S.settings.goalKg=70;S.entries=[];[-20,-18,-16,-14,-12,-9,-7,-5,-2,0].forEach((o,i)=>add('kilo',80+[0.2,-0.1,0.3,-0.2,0,0.1,-0.3,0.2,-0.1,0][i],'',keyOff(o)));cPlateauCheck()");
    ok("plato sorusu düşer, AI çağrısı yapılmaz (consent ve anahtar varken bile)",pq()===1&&ev("S.chat[0].text")==="Son 3 haftadır trendin düz. Birlikte bakalım mı?"&&fetched===f0&&ev("S.settings.lastPlateau")===ev("dayKey()"));
    ev("cPlateauCheck();S.settings.lastPlateau=keyOff(-13);cPlateauCheck()");
    ok("plato sorusu 14 gün içinde tekrar düşmez",pq()===1);
    ev("S.settings.lastPlateau=keyOff(-14);cPlateauCheck()");
    ok("14 gün dolunca yeniden düşebilir",pq()===2);
    ev("S.chat=[];S.settings.lastPlateau='';S.settings.healthNote='tansiyon';cPlateauCheck();S.settings.healthNote='';S.settings.goalKg=79.8;cPlateauCheck()");
    ok("kısıt (lossBlock) varken ya da hedef trende yakınken plato sorusu yok",pq()===0);
    ev("S.settings.goalKg=70;cPlateauCheck();tab='koc';render()");q(`[data-mid="${ev("S.chat[0].id")}"] [data-c="why"]`).click();await wait(20);
    ok("Bak yerel neden kartını açar, fetch yok",ev("S.chat.some(m=>m.card&&m.card.kind==='why')")&&fetched===f0);
    ok("lastPlateau kalıcı; eski ve çöp değerde boş",ev("cleanSettings(JSON.parse(JSON.stringify(S.settings))).lastPlateau")===ev("dayKey()")&&ev("cleanSettings({}).lastPlateau")===""&&ev("cleanSettings({lastPlateau:{a:1},kcal:1800}).lastPlateau")===""&&ev("cleanSettings({lastPlateau:7,kcal:1800}).kcal")===1800);
    ok("plato mesajı yeniden yüklemede kalır",JSON.parse(ev("JSON.stringify(cleanCoach(JSON.parse(JSON.stringify(S))))")).chat.some(m=>m.kind==="plateau"));
    // Koç'tan program
    ev("S.chat=[];S.templates=[];S.workouts=[];S.settings.consent=false;tab='salon';render()");
    q('[data-c="prog"]').click();q('[data-c="po:d:2"]').click();q('[data-c="po:q:Ev tipi"]').click();
    ok("program sayfası: seçimler işaretlenir",q('[data-c="po:d:2"]').getAttribute("aria-pressed")==="true"&&q('[data-c="po:q:Ev tipi"]').getAttribute("aria-pressed")==="true"&&ev("progOpt.q")==="Ev tipi");
    let f1=fetched;q('[data-c="progask"]').click();await wait(20);
    ok("program isteği consent yokken çağrı yapmaz",fetched===f1&&!ev("S.chat.length"));
    ev("S.settings.consent=true;progOpt={d:3,q:'Salon',m:45,l:'Başlangıç'}");
    reply={reply:"Program hazır",log:[],program:{name:"3 gün",days:[{n:"A",ex:["squat","bench","row"]},{n:"B",ex:["squat","uydurma"]},{n:"C",ex:["legpress","pulldown"]}]}};
    let sent;w.fetch=async(u,o)=>{fetched++;sent=JSON.parse(o.body);return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(reply)}}]})}};
    await ev("cProgram(progOpt)");
    const pm=ev("S.chat.find(m=>m.card&&m.card.kind==='program')");
    ok("program kartı: katalog dışı kimlik ve tek egzersizli gün atılır, JSON metne yazılmaz",pm&&pm.card.days.length===2&&pm.text==="Program hazır"&&sent.max_tokens===900&&sent.messages[0].content.includes("KATALOG (kimlik|ad|bölge):\nsquat|Squat|Ön bacak"),[pm,sent&&sent.max_tokens]);
    q(`[data-c="progadd:${pm.id}"]`).click();
    ok("Şablon olarak ekle her günü şablona ekler",ev("S.templates.length")===2&&ev("S.templates[0].name")==="3 gün – A"&&ev("S.templates[0].ex.join()")==="squat,bench,row"&&!q('[data-c^="progadd"]'));
    const pc=JSON.parse(ev("JSON.stringify(cleanCoach(JSON.parse(JSON.stringify(S))))")).chat.find(m=>m.card&&m.card.kind==="program");
    ok("program kartı yeniden yüklemede kalır (durumuyla)",pc&&pc.card.days.length===2&&pc.card.state==="ok");
    const gp=JSON.parse(ev(`JSON.stringify(cleanCoach({customEx:[{id:'c7'}],chat:[{id:1,role:'coach',text:'a',t:1,card:{kind:'program',name:'P',days:[{n:'X',ex:['c7','squat']}]}},{id:2,role:'coach',text:'b',t:1,card:{kind:'program',days:'x'}},{id:3,role:'coach',text:'c',t:1}]}))`));
    ok("program kartı ham customEx kimliğini tanır; çöp kartta diğer mesajlar kalır",gp.chat.length===3&&gp.chat[0].card.days[0].ex.join()==="c7,squat"&&!gp.chat[1].card);
    reply={reply:"bozuk",log:[]};ev("S.chat=[]");await ev("cProgram(progOpt)");
    ok("bozuk program yanıtında kart yok, uyarı",!ev("S.chat.some(m=>m.card)")&&q("#tmsg").textContent.includes("Program okunamadı"));
    // bağlam boyutu: dolu 14 gün + en büyük katalog
    ev(`S.settings.healthNote='x'.repeat(300);S.entries=[];S.sleep=[];S.mood=[];for(let i=0;i<14;i++){const k=keyOff(-i);add('kilo',80,'',k);for(let j=0;j<4;j++){const e=add('yemek',650,'öğün',k);e.p=35}add('su',2500,'',k);add('spor',45,'Yürüyüş',k);add('adim',12345,'',k);add('not',null,'n'.repeat(100),k);S.sleep.push({day:k,min:450});S.mood.push({day:k,v:4})}S.workouts=[1,2,3].map(i=>({id:i,day:keyOff(-i),t0:i,t1:i+1,name:'Tam vücut',tpl:null,ex:['squat','bench','row','ohp','curl','legpress'].map(id=>({id,note:'',sets:[{kg:60,reps:10,done:true}]}))}))`);
    const big=ev("CoachLib.contextText(cData()).length+cCatalog({q:'Salon',l:'İleri'}).text.length"),sys=ev("cMessages('x',cCatalog({q:'Salon',l:'İleri'}).text)[0].content.length");
    console.log(`  bağlam+katalog ${big} karakter, sistem mesajı ${sys}`);
    ok("contextText + katalog < 9000 karakter",big<9000,big);
    ev("S.entries=[];S.sleep=[];S.mood=[];S.workouts=[];S.templates=[];S.chat=[];S.settings.healthNote='';S.settings.consent=false;tab='bugun';render()");
    // haftalık özet bildirimi ve dokunma
    const r12=JSON.parse(ev("JSON.stringify(cleanSettings({reminders:[{id:1,t:'09:00',on:true}]}).reminders.find(r=>r.id===12))"));
    ok("hatırlatıcı 12 eski veride de var: Pazar 20:30, açık",r12&&r12.on===true&&r12.dow===0&&r12.t==="20:30");
    const lnO=w.Capacitor.Plugins.LocalNotifications,sc=[];
    w.Capacitor.Plugins.LocalNotifications={checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),getPending:async()=>({notifications:[]}),getDeliveredNotifications:async()=>({notifications:[]}),removeDeliveredNotifications:async()=>{},registerActionTypes:async()=>{},cancel:async()=>{},schedule:async o=>{sc.push(...o.notifications)}};
    await ev("scheduleReminders()");
    const n12=sc.filter(n=>n.id>=1200&&n.id<=1229);
    ok("hatırlatıcı 12 Pazar 20:30'a kurulur ve extra.act==='open' taşır, su hatırlatmaları kendi extra'sını korur",n12.length>=4&&n12.every(n=>n.schedule.at.getDay()===0&&n.schedule.at.getHours()===20&&n.schedule.at.getMinutes()===30&&n.extra.act==="open")&&sc.filter(n=>n.id>=200&&n.id<500).every(n=>n.extra.act==="su"),n12.length);
    ev("S.settings.reminders.find(r=>r.id===12).on=false");sc.length=0;await ev("scheduleReminders()");
    ok("hatırlatıcı 12 kapatılınca kurulmaz",sc.length>0&&!sc.some(n=>n.id>=1200&&n.id<=1229));
    ev("S.settings.reminders.find(r=>r.id===12).on=true");w.Capacitor.Plugins.LocalNotifications=lnO;
    const tap=(a,x)=>ev(`notifTap(${JSON.stringify({actionId:a,notification:{extra:x}})});tab`);
    ev("tab='bugun';S.settings.consent=true");
    ok("dinleyici: dokununca consent varken Koç açılır",tap("tap",{act:"open",tab:"koc"})==="koc");
    ev("tab='bugun';S.settings.consent=false");
    ok("dinleyici: consent yokken Trend açılır",tap("tap",{act:"open",tab:"koc"})==="trend");
    ev("tab='bugun'");
    ok("dinleyici: su düğmesi ve act'siz bildirim yok sayılır, bilinmeyen sekme Trend'e düşer",tap("su",{act:"open",tab:"koc"})==="bugun"&&tap("tap",{act:"su"})==="bugun"&&tap("tap",{act:"open",tab:"ayar"})==="trend");
    ev("tab='bugun';render()");
  }
    process.exit(bad?1:0);
  });
  const calls=[];
  w.Capacitor={isNativePlatform:()=>true,Plugins:{LocalNotifications:{checkPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),getPending:async()=>({notifications:[1,2]}),schedule:async x=>{calls.push(x)}}}};
  w.Capacitor.Plugins.DeviceHelp={info:async()=>({manufacturer:"xiaomi"})};
  w.eval("oem='xiaomi';S.settings.oemDone=false");
  ok("Xiaomi'de ayar uyarısı çıkar",ev("viewBugun()").includes("Hatırlatmalar için bir kez ayar"));
  w.eval("S.settings.oemDone=true");
  ok("Yaptım denince uyarı kalkar",!ev("viewBugun()").includes("Hatırlatmalar için bir kez ayar"));
  w.eval("oem='google';S.settings.oemDone=false");
  ok("Xiaomi dışında uyarı çıkmaz",!ev("viewBugun()").includes("Hatırlatmalar için bir kez ayar"));
  ev("sheetYemek()");
  const fq=w.document.querySelector("#fq");fq.value="mercimek";fq.dispatchEvent(new w.Event("input",{bubbles:true}));
  ok("yemek penceresinde besin aranır",w.document.querySelector("#flist").innerHTML.includes("Mercimek çorbası")&&w.document.querySelector("#flist [data-food]"));
  ev("S.chat=[];S.cid=1;S.myFoods=[];cReply({reply:'~280 kcal',log:[],food:{name:'1 dilim pizza',kcal:280,protein:12}})");
  const fm=ev("S.chat.find(m=>m.card&&m.card.kind==='food')");
  ok("yapay zekâ besin tahmini kart olur",fm&&fm.card.f.k===280,fm);
  ev(`cClick("addfood:${fm.id}",document.body)`);
  ok("Listeme ekle besini kaydeder",ev("S.myFoods.length")===1&&ev("S.myFoods[0].n")==="1 dilim pizza");
  ev("cClick('addfood:'+S.chat.find(m=>m.card&&m.card.kind==='food').id,document.body)");
  ok("aynı besin iki kez eklenmez",ev("S.myFoods.length")===1);
  ev("sheetYemek()");const fq2=w.document.querySelector("#fq");fq2.value="pizza";fq2.dispatchEvent(new w.Event("input",{bubbles:true}));
  ok("benim besinim aramada önce çıkar",w.document.querySelector("#flist .prow").innerHTML.includes("1 dilim pizza"));
  ev("sheetPorsiyon(0)");w.document.querySelector("#fqty").value="2";ev("foodPreview()");
  ok("kendi besinim porsiyonla hesaplanır",w.document.querySelector("#fprev").textContent.startsWith("560 kcal"),w.document.querySelector("#fprev").textContent);
  ev("goBesin()");
  ok("kendi besinim kayıt olur, makro eksikse karb/yağ yazılmaz",ev("S.entries.some(e=>e.v===560&&e.p===24&&e.c===undefined)")&&!ev("viewBugun()").includes("Karbonhidrat"));
  ok("yedekte besin listesi korunur",ev("cleanMyFoods(JSON.parse(JSON.stringify(S)).myFoods).length")===1);
  ev("sheetPorsiyon(0)");ev("goMySil()");
  ok("listemden sil çalışır",ev("S.myFoods.length")===0);
  ev("S.chat=[];S.cid=1;cReply({reply:'x',log:[{type:'yemek',text:'ev yapımı kek',kcal:300,protein:5}]})");
  ev("cClick('ok:'+S.chat.find(m=>m.card&&m.card.kind==='log').id,{closest:()=>document.body})");
  ev("cClick('savefood:'+S.chat.find(m=>m.card&&m.card.kind==='log').id,document.body)");
  ok("kaydedilen yemek listeye girer",ev("S.myFoods.some(m=>m.n==='ev yapımı kek'&&m.k===300)"));
  ev("S.myFoods=[]");
  ev("sheetYemek()");const fq3=w.document.querySelector("#fq");fq3.value="ev yapımı mantı";fq3.dispatchEvent(new w.Event("input",{bubbles:true}));
  ok("listede olmayan yemek için Koç'a sor çıkar",w.document.querySelector("#flist [data-c=askfood]")&&w.document.querySelector("#flist").innerHTML.includes("ev yapımı mantı"));
  ev("S.chat=[];cClick('askfood',document.body)");
  ok("Koç'a sor mesajı gönderir",ev("S.chat.some(m=>m.role==='user'&&m.text.includes('ev yapımı mantı kaç kalori'))")&&ev("tab")==="koc");
  ev("tab='bugun';S.chat=[]");
  let stepGranted=false,stepSnap=0,stepSteps=4321,stepHist={"2026-09-30":9000};
  w.Capacitor.Plugins.StepCounter={isAvailable:async()=>({available:true,granted:stepGranted}),requestAccess:async()=>{stepGranted=true;return {granted:true}},start:async()=>{},read:async()=>({steps:stepSteps,history:stepHist,snapAt:stepSnap})};
  ev("S.entries=[];S.settings.stepsOn=false;S.settings.stepsAsked=false");
  ok("adım sayar önerisi görünür",ev("viewBugun()").includes("data-act=\"adimac\""));
  await ev("stepsOpen()");
  ok("izin verilince adım sayar açılır ve bugünkü adım yazılır",ev("S.settings.stepsOn")===true&&ev("stepToday")===4321&&ev("S.entries.some(e=>e.type==='adim'&&e.day===dayKey()&&e.v===4321)"));
  ok("biten günün adımı geçmişe yazılır",ev("S.entries.some(e=>e.type==='adim'&&e.day==='2026-09-30'&&e.v===9000)"));
  ok("Bugün'de adım halkası görünür",ev("viewBugun()").includes("Adım")&&ev("viewBugun()").includes("4.321"));
  stepSteps=5000;await ev("stepsSync()");
  ok("aynı gün tek kayıt güncellenir",ev("S.entries.filter(e=>e.type==='adim'&&e.day===dayKey()).length")===1&&ev("S.entries.find(e=>e.type==='adim'&&e.day===dayKey()).v")===5000);
  ok("adım kayıtları gün listesinde ve seride görünmez",!ev("viewBugun()").includes("class=\"del\"")&&ev("streak()")===0);
  ok("yedek temizliği adım kaydını korur",ev("cleanEntries(S.entries).out.filter(e=>e.type==='adim').length")===2);
  ok("imkânsız adım değeri atılır",ev("cleanEntries([{type:'adim',day:'2026-01-01',v:999999}]).out.length")===0&&ev("setSteps('2026-01-01',0)")===false);
  ok("Trend tablosunda adım sütunu var",ev("viewTrend()").includes("<th>Adım</th>"));
  ok("Bugün'de adım kartı rapora götürür",ev("viewBugun()").includes('data-tab="adim"')&&!ev("viewBugun()").includes("r4"));
  ev("S.settings.heightCm=170;S.settings.stepsOn=true;tab='adim';render()");
  const as=w.document.querySelector("#view").textContent;
  ok("adım raporu: adım, ortalama, mesafe ve not görünür",as.includes("5.000")&&as.includes("7 gün ortalaması")&&as.includes("Yaklaşık mesafe")&&as.includes("kalori hedefine eklenmez"),as.slice(0,200));
  ok("adım raporu: 14 çubuk çizilir",w.document.querySelectorAll("#view svg.bars rect").length===14);
  ev("S.settings.heightCm=0;render()");
  ok("boy yoksa mesafe gizlenir",!w.document.querySelector("#view").textContent.includes("Yaklaşık mesafe")&&w.document.querySelector("#view").textContent.includes("boyunu gir"));
  ev("tab='adim';render()");
  ok("Adım ekranında elle ekle düğmesi var",$q('[data-act="adimekle"]')!==null);
  ev("sheetAdim()");$q("#fv").value="0";$q('[data-go="adim"]').click();
  ok("geçersiz elle adım reddedilir",ev("S.entries.some(e=>e.text==='elle')")===false);
  $q("#fv").value="100001";$q('[data-go="adim"]').click();
  ok("100.000 üstü elle adım reddedilir",ev("S.entries.some(e=>e.text==='elle')")===false);
  $q("#fv").value="1500";$q('[data-go="adim"]').click();
  stepSteps=5200;await ev("stepsSync()");
  ok("elle adım ayrı kayıt, sensör senkronu ezmez, gün toplamı sensör + elle",ev("S.entries.filter(e=>e.type==='adim'&&e.day===dayKey()).length")===2&&ev("S.entries.find(e=>e.text==='elle').v")===1500&&ev("sum('adim',dayKey(),dayKey())")===6700);
  ok("Adım halkası sensör + elle gösterir",ev("viewAdim()").includes("6.700"));
  ev("tab='bugun'");
  ok("Bugün adım kartı sensör + elle gösterir",ev("stepCard()").includes("6.700"));
  ev("tab='adim';render()");
  ok("elle eklenen Adım ekranında listelenir",ev("viewAdim()").includes("+1.500"));
  $q('#view [data-del="'+ev("S.entries.find(e=>e.text==='elle').id")+'"]').click();
  ok("elle adım silinir, gün sensör değerine döner",ev("sum('adim',dayKey(),dayKey())")===5200&&ev("stepsShown()")===5200);
  ev("tab='bugun';render()");
  const warn=()=>ev("viewBugun()").includes('data-act="adimgizle"');
  ev("S.entries=[];S.settings.stepsOn=true;S.settings.stepWarnDay='';oem='google'");stepHist={};
  stepSnap=Date.now()-3*36e5;await ev("stepsSync()");
  ok("gece kapanışı yakınsa sayım durdu kartı çıkmaz",!warn());
  stepSnap=Date.now()-27*36e5;await ev("stepsSync()");
  ok("gece kapanışı 26 saatten eskiyse kart çıkar",warn());
  let batt=0;w.Capacitor.Plugins.DeviceHelp.openBattery=async()=>{batt++;return {opened:"battery"}};
  $q('[data-act="adimduz"]')||ev("tab='bugun';render()");
  w.document.body.insertAdjacentHTML("beforeend",'<button id="tduz" data-act="adimduz"></button>');$q("#tduz").click();
  ok("Xiaomi dışında Ayarla pil ayarını açar",batt===1);
  ev("oem='xiaomi'");$q("#tduz").click();
  ok("Xiaomi'de Ayarla mevcut ayar sayfasını açar",$q("#sheet").textContent.includes("Hatırlatmalar için bir kez ayar")&&batt===1);
  ev("closeSheet();render()");$q('[data-act="adimgizle"]').click();
  ok("Kapat o gün için gizler ve kalıcı yazar",!warn()&&ev("S.settings.stepWarnDay")===ev("dayKey()")&&ev("cleanSettings(JSON.parse(JSON.stringify(S.settings))).stepWarnDay")===ev("dayKey()"));
  ok("stepWarnDay çöp değeri atılır, eski yedekte boş",ev("cleanSettings({stepWarnDay:'dün'}).stepWarnDay")===""&&ev("cleanSettings({}).stepWarnDay")==="");
  ev("S.settings.stepWarnDay=''");stepSnap=0;await ev("stepsSync()");
  ok("snapAt yokken (yeni kurulum) ve geçmiş boşken kart çıkmaz",!warn());
  ev("for(let i=2;i<=8;i++)add('adim',5000,'',keyOff(-i))");
  ok("dün 0 adım, önceki 7 gün ortalaması 1000 üstündeyse kart çıkar",warn());
  ev("add('adim',3000,'',keyOff(-1))");
  ok("dün adım varsa kart çıkmaz",!warn());
  ev("oem='google'");
  ev("S.entries=[];S.settings.stepsOn=false;S.nextId=1");
  ev("add('kilo',80,'',keyOff(-1))");
  ev("sheetKilo()");w.document.querySelector("#fv").value="90";ev("goKilo()");
  ok("5 kg'dan büyük fark uyarı verir, kaydetmez",ev("weights()[dayKey()]")===undefined&&w.document.querySelector("#kwarn").textContent.includes("fark var"));
  ev("goKilo()");
  ok("aynı değer ikinci kez onaylanırsa kaydedilir",ev("weights()[dayKey()]")===90);
  ev("S.entries=[]");ev("add('kilo',80,'',keyOff(-1))");ev("sheetKilo()");w.document.querySelector("#fv").value="82,5";ev("goKilo()");
  ok("küçük fark uyarısız kaydedilir",ev("weights()[dayKey()]")===82.5);
  ev("S.entries=[];add('yemek',200,'Menemen',keyOff(-1));add('yemek',90,'Ekmek',keyOff(-1))");
  ev("sheetYemek()");
  ok("dünkünü tekrarla düğmesi görünür",w.document.querySelector('[data-act="dunku"]')!==null);
  ev("repeatYesterday()");
  ok("dünkü yemekler bugüne kopyalanır",ev("of('yemek',dayKey()).length")===2&&ev("sum('yemek',dayKey(),dayKey())")===290);
  ev("S.entries=[];{const e=add('yemek',300,'Tavuk',keyOff(-1));e.p=30;e.c=5;e.f=12}repeatYesterday()");
  ok("dünkünü tekrarla makroları taşır, geri al siler",ev("JSON.stringify(of('yemek',dayKey()).map(e=>[e.p,e.c,e.f]))")==="[[30,5,12]]"&&(w.document.querySelector("#tundo").click(),ev("of('yemek',dayKey()).length")===0));
  ev("S.entries=[];S.favFoods=[];{const e=add('yemek',300,'Tavuk',keyOff(-2));e.p=30;e.c=5;e.f=12}sheetYemek()");
  ok("son yediklerin listelenir, eski Sık yediklerin çipleri yok",ev("recList.length")===1&&$q("[data-rc='0']")!==null&&$q("[data-fav]")===null);
  $q("[data-rc='0']").click();
  ok("son yenilene dokunmak seçili güne makrolarla ekler",macros()==="[[300,30,5,12]]",macros());
  $q("#tundo").click();
  ok("son yenilenden eklemeyi geri al siler",ev("of('yemek',dayKey()).length")===0);
  ev("sheetYemek()");$q("[data-fva='0']").click();
  ok("☆ favoriye alır, yeniden yüklemede kalır",ev("S.favFoods.length")===1&&ev("cleanHealthState(JSON.parse(JSON.stringify(S))).favFoods[0].p")===30&&$q("[data-fv='0']")!==null&&$q("[data-fva='0']").disabled);
  ev("S.entries=[]");ev("sheetYemek()");$q("[data-fv='0']").click();
  ok("kayıt silinse de favori kalır, dokununca makrolarla ekler",macros()==="[[300,30,5,12]]"&&ev("S.favFoods.length")===1,macros());
  ev("sheetYemek()");$q("[data-fvd='0']").click();
  ok("favoriden çıkarılır",ev("S.favFoods.length")===0);
  ok("eski yedek (favFoods yok) yüklenir, çöp favFoods diğer veriyi bozmaz",ev("cleanHealthState({}).favFoods.length")===0&&ev("cleanHealthState({favFoods:'x',meds:[]}).favFoods.length")===0);
  ev("S.entries=[];S.mealTpl=[];S.favFoods=[];{const e=add('yemek',155,'Yumurta');e.p=13}{const e=add('yemek',90,'Ekmek');e.c=40}");
  ok("gün listesinde şablon yap düğmesi görünür",ev("viewBugun()").includes('data-act="tplyeni"'));
  ev("sheetTpl()");$q("#tpn").value="Kahvaltım";$q('[data-go="tpl"]').click();
  ok("şablon tüm kalemleri değer kopyası olarak kaydeder",ev("S.mealTpl.length")===1&&ev("S.mealTpl[0].items.length")===2&&ev("S.mealTpl[0].id")===1&&ev("S.mealTpl[0].items[0].p")===13);
  ev("sheetTpl()");$q("#tc0").checked=false;$q("#tpn").value="Tek";$q('[data-go="tpl"]').click();
  ok("işareti kaldırılan yemek şablona girmez, kimlik artar",ev("S.mealTpl[1].items.length")===1&&ev("S.mealTpl[1].id")===2&&ev("S.mealTpl[1].items[0].text")==="Ekmek");
  ev("sheetTpl()");$q("#tpn").value="";$q('[data-go="tpl"]').click();
  ok("adsız şablon kaydedilmez",ev("S.mealTpl.length")===2);
  ev("S.entries=[]");ev("sheetYemek()");$q("[data-tp='0']").click();
  ok("şablon çipi tek dokunuşla tüm kalemleri ekler",ev("of('yemek',dayKey()).length")===2&&macros()==="[[155,13,null,null],[90,null,40,null]]",macros());
  $q("#tundo").click();
  ok("tek geri al şablon eklemesinin hepsini siler",ev("of('yemek',dayKey()).length")===0);
  ok("şablon yeniden yüklemede kalır, eski yedekte (mealTpl yok) boş yüklenir",ev("cleanHealthState(JSON.parse(JSON.stringify(S))).mealTpl.length")===2&&ev("cleanHealthState({}).mealTpl.length")===0&&ev("cleanHealthState({mealTpl:7}).mealTpl.length")===0);
  ev("sheetYemek()");$q("[data-tpd='0']").click();
  ok("şablon silinir",ev("S.mealTpl.length")===1&&ev("S.mealTpl[0].n")==="Tek");
  ev("S.entries=[]");ev("sheetYemek()");
  ok("dün yemek yoksa düğme yok",w.document.querySelector('[data-act="dunku"]')===null);
  let cancelled=[],sched1=[];const lnOld=w.Capacitor.Plugins.LocalNotifications;
  w.Capacitor.Plugins.LocalNotifications={checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),getPending:async()=>({notifications:[]}),cancel:async o=>{cancelled=o.notifications.map(n=>n.id)},schedule:async o=>{sched1=o.notifications.map(n=>n.id)}};
  await ev("scheduleReminders()");
  ok("su hedefi dolmadan su hatırlatmaları kurulur",sched1.includes(201)&&sched1.includes(301));
  ev("S.entries=[];add('su',S.settings.waterMl-S.settings.glass,'')");sched1=[];
  w.document.body.insertAdjacentHTML("beforeend",'<button id="tsu" data-act="su"></button>');w.document.querySelector("#tsu").click();
  await new Promise(r=>setTimeout(r,50));
  ok("su hedefi dolunca bildirimler yeniden kurulur, bugünün su alarmı yok",sched1.length>0&&![200,300,400].some(i=>sched1.includes(i))&&sched1.includes(201),sched1.length);
  await ev("scheduleReminders()");
  ok("hedef dolunca yeniden kurmada bugünün su alarmı yok, yarınki var",![200,300,400].some(i=>sched1.includes(i))&&sched1.includes(201));
  w.Capacitor.Plugins.LocalNotifications=lnOld;
  ev("S.entries=[]");
  ev("S.settings.stepsOn=false;S.entries=[]");
  const offJ=n=>({status:1,product:{code:"8690526010113",product_name:"Crax sticks",brands:"Eti",product_quantity:40,nutriments:n}});
  let fetched=0,resp=offJ({"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13});
  w.fetch=async()=>{fetched++;return {ok:true,json:async()=>resp}};
  ev("S.myFoods=[]");
  await ev("barkodBul('8690526010113')");
  ok("barkod: tutarlı ürün otomatik kaydedilir ve porsiyon açılır",ev("S.myFoods.length")===1&&ev("S.myFoods[0].src")==="off"&&ev("S.myFoods[0].b")==="8690526010113"&&w.document.querySelector("#fprev").textContent.startsWith("176 kcal"),[ev("S.myFoods"),w.document.querySelector("#fprev")&&w.document.querySelector("#fprev").textContent]);
  ok("barkod: kaynak yazısı Open Food Facts",w.document.querySelector("#sheet").textContent.includes("Open Food Facts"));
  await ev("barkodBul('8690526010113')");
  ok("barkod: ikinci okutmada internete gitmez",fetched===1,fetched);
  ev("S.myFoods=[]");
  resp=offJ({"energy-kcal_100g":150,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13});
  await ev("barkodBul('8690526010113')");
  ok("barkod: tutarsız ürün kaydedilmez",ev("S.myFoods.length")===0&&w.document.querySelector("#fq")!==null);
  resp=offJ({"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70});
  await ev("barkodBul('8690526010113')");
  ok("barkod: eksik değerli ürün kullanılır ama kaydedilmez",ev("S.myFoods.length")===0&&w.document.querySelector("#fprev").textContent.startsWith("176 kcal"));
  w.fetch=async()=>{throw new Error("ağ yok")};
  await ev("barkodBul('8690526010113')");
  ok("barkod: internet yoksa hata verir",w.document.querySelector("#tmsg").textContent.includes("İnternete ulaşılamadı"));
  await ev("barkodBul('123')");
  ok("barkod: geçersiz kod reddedilir",w.document.querySelector("#tmsg").textContent.includes("ürün barkodu değil"));
  w.Capacitor.Plugins.BarcodeScanner={isGoogleBarcodeScannerModuleAvailable:async()=>({available:true}),scan:async o=>{w.scanOpts=o;return {barcodes:[{rawValue:"8690526010113"}]}}};
  w.fetch=async()=>({ok:true,json:async()=>offJ({"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13})});
  ev("S.myFoods=[]");await ev("barkodOku()");
  ok("barkod: tarayıcı okuyunca ürün bulunur",ev("S.myFoods.length")===1&&w.scanOpts.formats.includes("EAN_13"));
  ev("sheetYemek()");
  ok("Yemek ekle'de barkod düğmesi görünür",w.document.querySelector("#sheet [data-act=barkod]")!==null);
  { // lif, şeker, sodyum
    const T=w.document.querySelector.bind(w.document),day=ev("dayKey()");
    w.fetch=async()=>({ok:true,json:async()=>offJ({"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13,fiber_100g:4,sugars_100g:20,sodium_100g:0.4})});
    ev("S.myFoods=[];S.entries=[];S.settings.oemDone=true");await ev("barkodBul('8690526010113')");
    ok("barkod: lif/şeker/sodyum myFoods'a girer, önizleme gösterir",ev("[S.myFoods[0].fb,S.myFoods[0].sg,S.myFoods[0].na].join()")==="4,20,400"&&/lif 1,6 g · şeker 8,0 g · sodyum 160,0 mg/.test(T("#fprev").textContent),T("#fprev").textContent);
    ev("goBesin()");
    ok("kayda porsiyon oranında geçer ve yeniden yüklemede kalır",ev("JSON.stringify(cleanEntries(S.entries).out.map(e=>[e.fb,e.sg,e.na]))")==="[[1.6,8,160]]",ev("JSON.stringify(S.entries)"));
    ev("add('yemek',100,'makrosuz',dayKey())");
    ok("Bugün satırı kapsam notuyla (1/2 öğünde)",/Lif <b>2<\/b> g · Şeker <b>8<\/b> g · Sodyum <b>160<\/b> mg \(1\/2 öğünde veri var\)/.test(ev("viewBugun()")));
    ev("S.entries=S.entries.filter(e=>e.text==='makrosuz')");
    ok("hiçbir öğünde veri yoksa satır gizli",!ev("viewBugun()").includes("öğünde veri var"));
    ev("S.entries=[];S.myFoods=[]");
    const r=ev("JSON.parse(JSON.stringify({entries:[{day:dayKey(),type:'yemek',v:100,text:'a',fb:'x',sg:-1,na:1e9,p:5},{day:dayKey(),type:'yemek',v:50,text:'b',fb:3}],myFoods:[{n:'Z',k:10,fb:500,sg:5,na:100}]}))");
    ev(`window.__r=${JSON.stringify(r)}`);
    ok("çöp alanlı kayıtlar: p korunur, fb/sg/na yok",ev("(o=>o[0].p===5&&o[0].fb===undefined&&o[0].sg===undefined&&o[0].na===undefined&&o[1].fb===3)(cleanEntries(__r.entries).out)"));
    ok("myFoods: sınır dışı lif atılır, şeker/sodyum kalır; eski kayıt (alansız) aynen",ev("(m=>m.fb===undefined&&m.sg===5&&m.na===100)(cleanMyFoods(__r.myFoods)[0])&&cleanMyFoods([{n:'Y',k:5,p:1}])[0].p===1"));
    ev("S.myFoods=[];etiketReview({food:{k:440,p:8.5,c:70,f:13,fb:3,sg:12,na:480}})");
    ok("etiket ekranında lif/şeker/sodyum dolu gelir",T("#efb").value==="3"&&T("#esg").value==="12"&&T("#ena").value==="480");
    T("#en").value="Etiketli";T('[data-ocr="esave"]').click();
    ok("etiket kaydı lif/şeker/sodyumu myFoods'a yazar",ev("[S.myFoods[0].fb,S.myFoods[0].sg,S.myFoods[0].na].join()")==="3,12,480",ev("S.myFoods"));
    ev("closeSheet();S.myFoods=[]");
  }
  ev("S.myFoods=[]");
  ev("S.entries=[];S.settings.oemDone=true");
  const yi=ev("allFoods().findIndex(f=>f.n==='Haşlanmış yumurta')");
  ev(`sheetPorsiyon(${yi})`);w.document.querySelector("#fqty").value="2";ev("foodPreview()");
  ok("porsiyon önizlemesi hesaplanır",w.document.querySelector("#fprev").textContent.startsWith("155 kcal"),w.document.querySelector("#fprev").textContent);
  ev("goBesin()");
  const be=ev("S.entries.find(e=>e.type==='yemek')");
  ok("besin kalori ve makrolarla kaydedilir",be&&be.v===155&&Math.abs(be.p-13)<0.1&&be.c>0&&be.f>10&&be.text.includes("2 ×"),be);
  ok("yeniden yüklemede makrolar korunur",ev("cleanEntries(S.entries).out[0].f")===be.f);
  ok("Bugün'de makro satırı görünür",ev("viewBugun()").includes("Karbonhidrat"));
  const sched=[];
  Object.assign(w.Capacitor.Plugins.LocalNotifications,{requestPermissions:async()=>({display:"granted"}),cancel:async()=>{},schedule:async x=>{sched.push(...x.notifications)}});
  ok("hatırlatma durumu ok",await ev("scheduleReminders()")==="ok");
  ok("30 günlük tek seferlik alarmlar kurulur",sched.length>=150&&new Set(sched.map(n=>n.id)).size===sched.length&&sched.every(n=>n.schedule.at>new Date()&&n.schedule.allowWhileIdle&&!n.schedule.on),[sched.length]);
  w.notifP=ev("notifTest()");
  w.notifP.then(()=>{
    ok("test bildirimi kurulur ve teşhis yazılır",sched.some(n=>n.id===99)&&ev("notifDiag").includes("granted")&&ev("notifDiag").includes("Kurulu hatırlatma: 2"),[sched.length,ev("notifDiag")]);
  });
  ev("S.chat=[];S.cid=1;cReply({reply:'x',log:[],propose:null,flag:'safety'})");
  ok("model güvenlik işareti kart üretir",ev("S.chat.some(m=>m.card&&m.card.kind==='safety')"));
  ev("S.chat=[];Object.assign(S.settings,{age:12,heightCm:165,goalKg:45,healthNote:'',kcal:0});S.entries=[];for(let i=13;i>=0;i--)S.entries.push({id:100+i,day:keyOff(-i),time:'08:00',type:'kilo',v:60-i*0.01,text:''})");
  ev("cReply({reply:'x',log:[],propose:{kcal:1300,why:'a'},flag:null})");
  ok("18 yaş altına açık önerisi çıkmaz",!ev("S.chat.some(m=>m.card&&m.card.kind==='propose')"));
  ev("S.entries=[];for(let i=0;i<10;i++)add('su',250)");ev("S.settings.lastBackup=''");
  ok("yedek yoksa uyarı çıkar",ev("viewBugun()").includes("Yedek zamanı"));
  ev("markBackup()");
  ok("yedek alınınca uyarı kalkar",!ev("viewBugun()").includes("Yedek zamanı")&&ev("cleanSettings({lastBackup:S.settings.lastBackup}).lastBackup")===ev("dayKey()"));
},100);
