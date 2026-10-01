const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path");let bad=0;
const www=f=>path.join(__dirname,"../www",f);
const html=fs.readFileSync(www("index.html"),"utf8").replace(/<script src="([^"]+)"><\/script>/g,(_,f)=>"<script>"+fs.readFileSync(www(f),"utf8")+"</script>");
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const errs=[];
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://localhost/",
  beforeParse(w){Object.assign(w,{structuredClone,TextEncoder,TextDecoder,__noSelfTest:true});Object.defineProperty(w,"crypto",{value:require("node:crypto").webcrypto});w.confirm=()=>true;w.scrollTo=()=>{};w.addEventListener("error",e=>errs.push(e.message))}
});
setTimeout(async()=>{
  const w=dom.window,ev=s=>w.eval(s);
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
  let stepGranted=false,stepSteps=4321,stepHist={"2026-09-30":9000};
  w.Capacitor.Plugins.StepCounter={isAvailable:async()=>({available:true,granted:stepGranted}),requestAccess:async()=>{stepGranted=true;return {granted:true}},start:async()=>{},read:async()=>({steps:stepSteps,history:stepHist})};
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
  ev("tab='bugun';render()");
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
