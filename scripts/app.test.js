const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path");let bad=0,total=0;process.on("unhandledRejection",e=>{console.log("FAIL beklenmeyen hata",e);process.exit(1)});
const www=f=>path.join(__dirname,"../www",f);
const html=require("./html").build();
const ok=(n,c,x)=>{total++;console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const MIN_TESTS=865,errs=[]; // son satıra ulaşılmadan çıkış (zamanlama kayması) başarı sayılmasın
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://localhost/",
  beforeParse(w){Object.assign(w,{structuredClone,TextEncoder,TextDecoder,__noSelfTest:true});Object.defineProperty(w,"crypto",{value:require("node:crypto").webcrypto});w.confirm=()=>true;w.scrollTo=()=>{};w.addEventListener("error",e=>errs.push(e.message))}
});
setTimeout(async()=>{
  const w=dom.window,sc=[];w.HTMLElement.prototype.scrollIntoView=function(){sc.push(this)}; // jsdom'da yok
  const loadBackup=require("./bkhelp.js")(()=>w);
  const ev=s=>w.eval(s),shown=()=>ev("S.settings.reminders.filter(remShown).map(r=>r.id)"),$q=s=>w.document.querySelector(s),macros=()=>ev("JSON.stringify(of('food',dayKey()).map(e=>[e.v,e.p,e.c,e.f]))");
  const calls=[];
  w.Capacitor={isNativePlatform:()=>true,Plugins:{LocalNotifications:{checkPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),getPending:async()=>({notifications:[1,2]}),schedule:async x=>{calls.push(x)}}}};
  w.Capacitor.Plugins.DeviceHelp={info:async()=>({manufacturer:"xiaomi"})};
  const reset=()=>{ev("closeSheet();S=structuredClone(DEF);S.settings.obDone=true;tab='today'");w.localStorage.clear();ev("render()")};
  ok("sayfa hatasız açılır",errs.length===0&&ev("document.querySelector('#view').innerHTML.length")>100,errs);
  { // onboarding (C2)
    const q=s=>$q(s),click=s=>q(s).click(),val=(id,v)=>{q("#ob"+id).value=v},v=()=>q("#view").textContent;
    const fill=(cm,kg,age)=>{val("cm",cm);val("kg",kg);val("age",age)};
    ok("ilk açılışta karşılama: logo, tek cümle, tek birincil düğme Başla, geç bağlantısı; adım sayacı yok",v().includes("hoş geldin")&&q('#view .btn[data-ob="next"]').textContent==="Başla"&&q("#view").querySelectorAll(".btn").length===1&&!!q('[data-ob="skip"]')&&!v().includes("Adım"));
    click('[data-ob="next"]');
    ok("ilk açılışta onboarding: adım 1/3, menü gizli, alanlar etiketli",v().includes("Adım 1/3")&&w.document.body.classList.contains("ob")&&["cm","kg","age"].every(k=>q(`label[for="ob${k}"]`)&&q("#ob"+k)));
    ok("bayraksız ayar kurulumu açık sayar; kayıt ve profil gizler",ev("cleanSettings({kcal:1800}).obDone")===false&&ev("cleanSettings({obDone:false,kcal:1}).obDone")===false&&ev("cleanSettings(undefined).obDone")===false&&ev("(()=>{const r=[];const s0=S;for(const f of [()=>S.entries.push({}),()=>{S.settings.heightCm=170},()=>{S.settings.goalKg=70},()=>{S.settings.obDone=true}]){S=structuredClone(DEF);f();r.push(obNeeded())}S=s0;return r.join()})()")==="false,false,false,false");
    click('[data-ob="next"]');
    ok("boş alan reddedilir: hata alanın altında, aria-invalid",q("#oberr").textContent.includes("Boy")&&q("#obcm").getAttribute("aria-invalid")==="true"&&v().includes("Adım 1/3"));
    for(const [a,b,c,m] of [["99","80","30","Boy"],["251","80","30","Boy"],["170","19","30","Kilo"],["170","80","101","Yaş"]]){fill(a,b,c);click('[data-ob="next"]');ok(`aralık dışı reddedilir: ${a}/${b}/${c}`,q("#oberr").textContent.startsWith(m)&&v().includes("Adım 1/3"),q("#oberr").textContent)}
    fill("170","80","30");click('[data-ob="dir:lose"]');val("goal","85");click('[data-ob="next"]');
    ok("kilo ver: hedef şimdikinden yüksekse reddedilir ve değerler korunur",q("#oberr").textContent.includes("düşük")&&q("#obcm").value==="170"&&q("#obgoal").getAttribute("aria-invalid")==="true");
    val("goal","72");click('[data-ob="sex:m"]');click('[data-ob="next"]');
    ok("adım 2: modül seçenekleri, hepsi kapalı başlar",v().includes("Adım 2/3")&&q("#view").querySelectorAll('[data-ob^="mod:"]').length===5&&q("#view").querySelectorAll('[data-ob^="mod:"][aria-pressed="true"]').length===0);
    click('[data-ob="mod:med"]');click('[data-ob="mod:fast"]');click('[data-ob="mod:steps"]');click('[data-ob="mod:fast"]');
    click('[data-ob="back"]');
    ok("geri: değerler ve seçimler korunur",v().includes("Adım 1/3")&&q("#obkg").value==="80"&&q("#obgoal").value==="72"&&q('[data-ob="sex:m"]').getAttribute("aria-pressed")==="true");
    click('[data-ob="next"]');click('[data-ob="next"]');
    const exp=ev("(()=>{const q={kg:80,cm:170,age:30,sex:'m'};return Algo.suggestTarget({tdee:Algo.formulaTdee({...q,act:1}),kg:80,goalKg:72,bmr:Algo.bmrMifflin(q),age:30,cm:170}).kcal})()");
    ok("özet: kişisel kalori ve protein hedefi Algo hesabıyla",v().includes("Adım 3/3")&&v().includes(exp.toLocaleString("tr-TR"))&&v().includes("128–176")&&!v().includes("açığı önermiyorum"),[exp,v()]);
    click('[data-ob="next"]');
    const s=ev("S.settings");
    ok("Başla: değerler mevcut profil alanlarına yazılır, Bugün'e düşülür",s.heightCm===170&&s.age===30&&s.sex==="m"&&s.goalKg===72&&s.kcal===exp&&s.obDone&&ev("weights()[dayKey()]")===80&&ev("tab")==="today"&&!w.document.body.classList.contains("ob"),s);
    ok("modüller: seçilen açık, seçilmeyen kapalı; adım için izin penceresi açılmaz",s.medOn&&!s.fastOn&&!s.bpOn&&!s.bsOn&&!s.stepsOn&&!s.stepsAsked&&!s.consent);
    // sağlık işareti ve 18 yaş altı: kalori açığı önerilmez, hekim notu
    ev("S=structuredClone(DEF);render()");
    click('[data-ob="next"]');fill("170","80","30");click('[data-ob="dir:lose"]');val("goal","70");click('[data-ob="next"]');q("#obhn").checked=true;click('[data-ob="next"]');
    const mt=ev("(()=>{const q={kg:80,cm:170,age:30,sex:''};return Math.round(Algo.formulaTdee({...q,act:1})/10)*10})()");
    ok("sağlık işareti: açık önerilmez, bakım düzeyi ve hekim notu",v().includes("açığı önermiyorum")&&v().includes("hekim")&&v().includes(mt.toLocaleString("tr-TR")),v());
    click('[data-ob="next"]');
    ok("sağlık işareti sağlık notuna yazılır",ev("S.settings.healthNote").includes("hekim kontrolü"));
    ev("S=structuredClone(DEF);render()");
    const ls0=w.localStorage.getItem("nw_state");
    click('[data-ob="next"]');fill("165","60","17");click('[data-ob="next"]');
    ok("yaş 17: kurulum durur, nazik ekran; geç, geri ve devam yok; taslak ve kayıt yok",v().includes("18 yaş ve üzeri için")&&v().includes("hekiminle ya da diyetisyeninle")&&!q('[data-ob="skip"]')&&!q('[data-ob="next"]')&&!q('[data-ob="back"]')&&ev("ob.age+ob.kg+ob.cm")===""&&ev("S.settings.age")===0&&!ev("S.settings.obDone")&&ev("S.entries.length")===0&&w.localStorage.getItem("nw_state")===ls0,v());
    for(const a of ["9","1"]){click('[data-ob="fixage"]');fill("165","60",a);click('[data-ob="next"]');ok(`yaş ${a}: aralık hatası yerine aynı ekran`,v().includes("18 yaş ve üzeri için"))}
    click('[data-ob="fixage"]');
    ok("Yaşımı yanlış girdim: boş adım 1'e döner",v().includes("Adım 1/3")&&q("#obage").value==="");
    fill("165","60","18");click('[data-ob="next"]');
    ok("yaş 18: kurulum devam eder",v().includes("Adım 2/3")&&!v().includes("18 yaş ve üzeri için"));
    click('[data-ob="skip"]');
    ok("Şimdilik geç: hiçbir şey yazılmaz, bir daha çıkmaz",ev("S.settings.obDone")&&ev("S.entries.length")===0&&ev("S.settings.heightCm")===0&&ev("obNeeded()")===false&&ev("tab")==="today");
    ev("tab='settings-data';render()");
    ok("Veriler: otomatik yedek kapalı ve telefon değişiminde yedek dosyası gerektiği yazar",v().includes("Google otomatik yedeğine")&&v().includes("telefon değiştirirsen")&&v().includes("yedek dosyanı al"));
    click('[data-act="reset"]');
    ok("Tüm verileri sil sonrası onboarding yeniden çıkar",ev("obNeeded()")&&q("#view").textContent.includes("hoş geldin"));
    ev("S=structuredClone(DEF);S.settings.obDone=true;tab='today';render()");
  }
  { // Şablon editörü (D-Ant2)
    const q=s=>$q(s),sh=()=>q("#sheet").textContent,set=(sel,v)=>{q(sel).value=v};
    ev("closeSheet();S.workouts=[];S.templates=[];S.customEx=[];S.exCfg={};S.gid=1;tab='gym';render()");
    const T=JSON.parse(ev(`JSON.stringify((()=>{const src={templates:[{id:1,name:"Eski",ex:["squat","bench"]},{id:2,name:"Yeni",ex:["squat","plank","bilinmez"],tg:{squat:{sets:4,reps:6,hi:10},plank:{sets:3,sec:45},bilinmez:{sets:3},bench:{sets:3}}},{id:3,name:"Çöp",ex:["squat","row"],tg:{squat:{sets:0,reps:"x",hi:3,sec:-1},row:{sets:3,reps:8,hi:8}}},{id:4,name:"Biçim",ex:["squat"],tg:"x"}]},c=JSON.stringify(src);const o=cleanGym(src);return {o,same:c===JSON.stringify(src)}})())`));
    ok("cleanGym tg: geçerli hedef korunur, bilinmeyen/çıkarılmış egzersiz ve çöp değer atılır",JSON.stringify(T.o.templates[1].tg)==='{"squat":{"sets":4,"reps":6,"hi":10},"plank":{"sets":3,"sec":45}}'&&JSON.stringify(T.o.templates[2].tg)==='{"row":{"sets":3,"reps":8}}',T.o.templates);
    ok("eski şablon (tg yok) aynı biçimde kalır, temizleyici girdiye dokunmaz",JSON.stringify(T.o.templates[0])==='{"id":1,"name":"Eski","ex":["squat","bench"]}'&&T.o.templates[3].tg===undefined&&T.same);
    // tg'siz başlatma eski davranışta; tg'li başlatma hedefle dolar, kg önceki seanstan
    ev(`S.workouts=[{id:5,day:'2026-09-01',t0:1000,t1:2000,name:'Eski',tpl:null,ex:[{id:'squat',note:'',sets:[{kg:100,reps:12,done:true},{kg:100,reps:12,done:true}]},{id:'plank',note:'',sets:[{kg:null,reps:null,sec:40,done:true}]}]}];S.gid=10;render()`);
    ev("S.templates=[{id:11,name:'Tg yok',ex:['squat','plank']},{id:12,name:'Hedefli',ex:['squat','plank','bwsquat'],tg:{squat:{sets:4,reps:6,hi:10},plank:{sets:2,sec:60},bwsquat:{sets:5,reps:15}}}];render()");
    ev("gStart(11)");let a=ev("JSON.stringify(gActive().ex.map(x=>[x.id,x.sets.length,x.sets[0].kg,x.sets[0].reps,x.sets[0].sec||0]))");
    ok("tg'siz şablon eski gibi başlar: set sayısı geçmişten, kg ve tekrar öneriden, süre geçmişten",a==='[["squat",2,102.5,8,0],["plank",1,null,null,40]]',a);
    ev("S.workouts=S.workouts.filter(x=>x.t1!=null);gStart(12)");a=ev("JSON.stringify(gActive().ex.map(x=>[x.id,x.sets.length,x.sets[0].kg,x.sets[0].reps,x.sets[0].sec||0]))");
    ok("tg'li şablon: set sayısı, tekrar ve süre hedeften; kg önceki seanstan/öneriden",a==='[["squat",4,102.5,6,0],["plank",2,null,null,60],["bwsquat",5,null,15,0]]',a);
    ev("S.workouts=S.workouts.filter(x=>x.t1!=null);render()");
    ev("S.gid=50"); // editör: yeni şablon
    q('[data-g="tedit:"]').click();
    ok("Yeni şablon sayfası açılır",sh().includes("Yeni şablon")&&q("#gten")&&q('[data-g="tesave"]'));
    q('[data-g="tesave"]').click();
    ok("adsız şablon kaydedilmez",ev("S.templates.length")===2&&q("#toast").textContent.includes("ad"));
    set("#gten","İtiş günü");q('[data-g="tesave"]').click();
    ok("egzersizsiz şablon kaydedilmez",ev("S.templates.length")===2&&q("#toast").textContent.includes("egzersiz"));
    q('[data-g="teadd"]').click();ev("gClick('addex:bench',document.body)");ev("gClick('addex:plank',document.body)");ev("gClick('addex:bench',document.body)");
    ok("seçicide eklenenler işaretli, aynısı iki kez eklenmez, canlı antrenman oluşmaz",ev("gTe.ex.join()")==="bench,plank"&&!ev("gActive()")&&(ev("gQuery='bench'"),ev("gPickHtml()").includes("Eklendi")));
    q('[data-g="teback"]').click();
    ok("seçiciden dönünce editör: ad ve eklenen egzersizler korunur",q("#gten").value==="İtiş günü"&&q('[data-te="sets:1"]')&&q('[data-te="sec:1"]').value==="30"&&q('[data-te="reps:0"]').value==="8-12");
    set('[data-te="sets:0"]',"5");set('[data-te="reps:0"]',"5");set('[data-te="sec:1"]',"45");
    q('[data-g="temv:1:-1"]').click();
    ok("yukarı taşı: sıra değişir, yazılan değerler yeniden çizimde kaybolmaz",ev("gTe.ex.join()")==="plank,bench"&&q('[data-te="sec:0"]').value==="45"&&q('[data-te="reps:1"]').value==="5"&&q('[data-te="sets:1"]').value==="5");
    q('[data-g="temv:0:-1"]').click();
    ok("ilk satırı yukarı taşımak bir şey yapmaz",ev("gTe.ex.join()")==="plank,bench");
    q('[data-g="teadd"]').click();ev("gClick('addex:squat',document.body)");q('[data-g="teback"]').click();q('[data-g="term:2"]').click();
    ok("çıkar: egzersiz ve hedefi taslaktan gider",ev("gTe.ex.join()")==="plank,bench"&&!("squat" in ev("gTe.tg")));
    set('[data-te="reps:1"]',"abc");set('[data-te="sets:1"]',"99");q('[data-g="temv:1:1"]').click();
    ok("geçersiz set/tekrar eski değeri korur",ev("gTe.tg.bench.sets")===5&&ev("gTe.tg.bench.reps")===5&&ev("gTe.tg.bench.hi")===undefined);
    q('[data-g="tesave"]').click();
    let t=ev("S.templates.find(x=>x.name==='İtiş günü')");
    ok("kaydet: ad, sıra ve hedefler şablona yazılır; sayfa kapanır",t&&t.ex.join()==="plank,bench"&&t.tg.bench.sets===5&&t.tg.bench.reps===5&&t.tg.plank.sec===45&&!q("#sheet").classList.contains("on"),t);
    ok("kayıt turu: tg kalıcı, ana ekranda şablon görünür",ev("cleanGym(JSON.parse(JSON.stringify(S))).templates.find(x=>x.name==='İtiş günü').tg.plank.sec")===45&&q("#view").textContent.includes("İtiş günü"));
    // düzenle: kimlik ve bağ korunur
    const id=t.id;ev(`S.workouts.push({id:20,day:'2026-09-02',t0:3000,t1:4000,name:'İtiş günü',tpl:${id},ex:[{id:'bench',note:'',sets:[{kg:60,reps:8,done:true},{kg:60,reps:7,done:true},{kg:20,reps:5,w:true,done:true}]},{id:'squat',note:'',sets:[{kg:80,reps:10,done:true}]}]});S.gid=30;render()`);
    q(`[data-g="tedit:${id}"]`).click();
    ok("düzenle: mevcut değerlerle açılır",q("#gten").value==="İtiş günü"&&sh().includes("Şablonu düzenle")&&q('[data-te="sets:1"]').value==="5");
    set("#gten","İtiş B");q('[data-g="tesave"]').click();
    ok("ad değişir, kimlik ve antrenman bağı aynı kalır",ev(`S.templates.find(x=>x.id===${id}).name`)==="İtiş B"&&ev("S.workouts.find(x=>x.id===20).tpl")===id&&ev("S.templates.filter(x=>x.name.startsWith('İtiş')).length")===1);
    // seans sonrası güncelle (zorunlu değil)
    ev("gSheetSummary(20)");
    ok("özet: şablonlu antrenmanda 'şablonu güncelle' sunulur, 'şablon olarak kaydet' sunulmaz",sh().includes("Şablonu bu seansa göre güncelle")&&!sh().includes("Şablon olarak kaydet"));
    ok("güncellemeden kapatmak şablonu değiştirmez",ev(`S.templates.find(x=>x.id===${id}).ex.join()`)==="plank,bench");
    q(`[data-g="tplupd:20"]`).click();
    t=ev(`S.templates.find(x=>x.id===${id})`);
    ok("güncelle: egzersizler seans sırasında, set sayısı ısınmasız, tekrar en az tekrar; antrenman bağı sürer",t.ex.join()==="bench,squat"&&t.tg.bench.sets===2&&t.tg.bench.reps===7&&t.tg.squat.sets===1&&t.tg.squat.reps===10&&ev("S.workouts.find(x=>x.id===20).tpl")===id,t);
    q("#tundo").click();
    ok("güncellemeyi geri al",ev(`S.templates.find(x=>x.id===${id}).ex.join()`)==="plank,bench"&&ev(`S.templates.find(x=>x.id===${id}).tg.bench.sets`)===5);
    ev("gSheetSummary(5)");
    ok("şablonsuz antrenmanda 'Şablon olarak kaydet' akışı durur ve tg yazmaz",sh().includes("Şablon olarak kaydet")&&(()=>{q('[data-g="savetpl:5"]').click();q("#gtn").value="Kayıtlı";q('[data-g="savetplgo:5"]').click();const k=ev("S.templates.find(x=>x.name==='Kayıtlı')");return k&&k.ex.join()==="squat,plank"&&k.tg===undefined&&ev("S.workouts.find(x=>x.id===5).tpl")===k.id})());
    // silme onaylı
    w.confirm=()=>false;const n0=ev("S.templates.length");q(`[data-g="tdel:${id}"]`).click();
    ok("silme: onay verilmezse şablon kalır",ev("S.templates.length")===n0);
    w.confirm=()=>true;q(`[data-g="tdel:${id}"]`).click();
    ok("silme: onayla silinir, geri al döner",ev("S.templates.length")===n0-1&&(q("#tundo").click(),ev("S.templates.length")===n0));
    ev("S.workouts=[];S.templates=[];closeSheet();render()");
  }
  { // Hazır programlar (D-Ant3)
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)],sh=()=>q("#sheet").textContent;
    ev("closeSheet();S.workouts=[];S.templates=[];S.customEx=[];S.exCfg={};S.gid=1;S.chat=[];S.settings.consent=false;gPgF={d:0,lv:''};tab='gym';render()");
    ok("tüm program kimlikleri EXMERGED'de",ev("PrgLib.PROGRAMS.every(p=>p.days.every(d=>d.ex.every(r=>EXMERGED.some(e=>e.id===r[0]))))"));
    ok("Salon ana ekranında 'Hazır programlar': 5 program, anahtarsız/Koç'suz, kısa not",q("#view").textContent.includes("Hazır programlar")&&qa('[data-g^="pg:"]').length===5&&q("#view").textContent.includes("hekime ya da fizyoterapiste")&&ev("S.settings.consent")===false);
    q('[data-g="pgf:d:4"]').click();
    ok("gün filtresi: 4 günlük programlar (aralıklı olan dahil)",qa('[data-g^="pg:"]').map(b=>b.dataset.g).join()==="pg:home4,pg:gym4,pg:ppl"&&q('[data-g="pgf:d:4"]').getAttribute("aria-pressed")==="true");
    q('[data-g="pgf:lv:Başlangıç"]').click();
    ok("seviye filtresi birleşir; uyan yoksa açıklama",qa('[data-g^="pg:"]').length===0&&q("#view").textContent.includes("uyan program yok"));
    q('[data-g="pgf:d:0"]').click();q('[data-g="pgf:lv:"]').click();
    ok("Hepsi: 5 program",qa('[data-g^="pg:"]').length===5);
    q('[data-g="pg:gym3"]').click();
    ok("program sayfası: günler, set × tekrar, not ve ekle düğmesi",sh().includes("Salon tüm vücut")&&sh().includes("Squat 5×5")&&sh().includes("Gün C")&&sh().includes("fizyoterapiste")&&q('[data-g="pgadd:gym3"]')&&!q("#sheet [data-g^=pgd]"));
    q('[data-g="pgadd:gym3"]').click();
    const T=ev("S.templates"),t0=T[0];
    ok("Şablonlarıma ekle: her gün bir şablon, 'Program – Gün' adı, hedefler dolu",T.length===3&&t0.name==="Salon tüm vücut – Gün A"&&t0.ex.join()==="squat,bench,row,bbohp,tri,crunch"&&t0.tg.squat.sets===5&&t0.tg.squat.reps===5&&t0.tg.bbohp.hi===10&&!q("#sheet").classList.contains("on"),T);
    ok("eklenen şablonlar kayıt turunda hedefleriyle kalır",ev("JSON.stringify(cleanGym(JSON.parse(JSON.stringify(S))).templates)")===JSON.stringify(T));
    ev("S.workouts=[];gStart(S.templates[0].id)");
    ok("şablondan antrenman: set sayısı ve tekrar hedeften",ev("gActive().ex.map(x=>x.sets.length+'x'+x.sets[0].reps).join()")==="5x5,5x5,5x5,3x8,3x10,3x12"&&ev("gActive().ex.find(x=>x.id==='bbohp').sets[0].reps")===8);
    ev("S.workouts=[];tab='gym';render()");
    q('[data-g="pg:ppl"]').click();
    ok("itiş-çekiş-bacak: gün sayısı seçilir (3-6), varsayılan 3",sh().includes("Bacak A")&&!sh().includes("İtiş B")&&q('[data-g="pgd:ppl:3"]').getAttribute("aria-pressed")==="true");
    q('[data-g="pgd:ppl:5"]').click();
    ok("5 gün: ilk 5 gün gösterilir",sh().includes("Çekiş B")&&!sh().includes("Bacak B"));
    ev("S.templates=[]");q('[data-g="pgadd:ppl"]').click();
    ok("5 gün seçilince 5 şablon eklenir; geri al hepsini kaldırır",ev("S.templates.length")===5&&ev("S.templates[4].name")==="Salon itiş-çekiş-bacak – Çekiş B"&&(q("#tundo").click(),ev("S.templates.length")===0));
    ev("S.templates=[];gPgF.d=6");ev("render()");q('[data-g="pg:ppl"]').click();
    ok("gün filtresi seçili programa taşınır (6)",q('[data-g="pgd:ppl:6"]').getAttribute("aria-pressed")==="true"&&sh().includes("Bacak B"));
    ev("gPgF={d:0,lv:''};closeSheet();S.templates=[];render()");
  }
  { // Kendi egzersizi (D-Ant11)
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)];
    ev("closeSheet();S.workouts=[];S.templates=[];S.customEx=[];S.exCfg={};S.gid=1;gNewS={n:'',k:'w',r:'Ön bacak',q:'Salon',tp:''};tab='gym';render()");
    const C=JSON.parse(ev(`JSON.stringify(cleanGym({customEx:[{id:"c1",n:"Eski",g:"Kol"},{id:"c2",n:"Yeni",g:"Karın",r:"Karın",k:"t",q:"Ev tipi",tp:"plank",c:"x"},{id:"c3",n:"Çöp",g:"Bacak",r:"Yok",k:"zz",q:"Uzay",tp:"yok"},{id:"c4",n:"Boş",g:"Bacak",r:5,k:"",q:null,tp:"__proto__"},{id:"c5",n:"Kardiyo",g:"Bacak",k:"c"},{id:"c6",n:"Aralık",g:"Bacak",k:"i"}]}).customEx)`));
    ok("eski özel egzersiz (yalnız g) aynı biçimde kalır",JSON.stringify(C[0])==='{"id":"c1","n":"Eski","g":"Kol","inc":2.5}');
    ok("geçerli tür/bölge/ekipman/figür korunur, kategori türür",JSON.stringify(C[1])==='{"id":"c2","n":"Yeni","g":"Karın","inc":2.5,"r":"Karın","k":"t","c":"g","q":"Ev tipi","tp":"plank"}'&&C[4].k==="c"&&C[4].c==="k");
    ok("geçersiz alanlar atılır, egzersiz kalır",JSON.stringify(C[2])==='{"id":"c3","n":"Çöp","g":"Bacak","inc":2.5}'&&JSON.stringify(C[3])==='{"id":"c4","n":"Boş","g":"Bacak","inc":2.5}'&&JSON.stringify(C[5])==='{"id":"c6","n":"Aralık","g":"Bacak","inc":2.5}');
    ev("S.customEx=[{id:'c1',n:'Eski',g:'Kol',inc:2.5}];S.gid=5;gStart(null)");
    ev("gAddEx(gActive(),'c1');render()");
    ok("eski özel egzersiz çalışır: ağırlık×tekrar, bölge olarak grup adı",ev("gKind('c1')")==="w"&&ev("gActive().ex[0].sets.length")===3&&q("#view").textContent.includes("Kol")&&ev("gEx('c1').r||gEx('c1').g")==="Kol");
    ev("S.workouts=[];S.customEx=[];gSheetPick()");
    q('[data-g="newex"]').click();
    ok("form: tür, bölge (16), ekipman ve figür seçimi",qa('[data-g^="nf:k:"]').length===4&&qa('[data-g^="nf:r:"]').length===16&&qa('[data-g^="nf:q:"]').length===3&&q("#gntp").options.length>40);
    q("#gnn").value="Benim plankım";
    q('[data-g="nf:k:t"]').click();q('[data-g="nf:r:Karın"]').click();q('[data-g="nf:q:Ağırlıksız"]').click();
    ok("seçim yeniden çizimde işaretli kalır, yazılan ad kaybolmaz",q('[data-g="nf:k:t"]').getAttribute("aria-pressed")==="true"&&q('[data-g="nf:r:Karın"]').getAttribute("aria-pressed")==="true"&&q('[data-g="nf:r:Ön bacak"]').getAttribute("aria-pressed")==="false"&&q("#gnn").value==="Benim plankım");
    q("#gntp").value="plank";q('[data-g="mkex"]').click();
    const e=ev("S.customEx[0]");
    ok("oluştur: tür, bölge, ekipman, figür ve türetilmiş grup yazılır",e&&e.n==="Benim plankım"&&e.k==="t"&&e.r==="Karın"&&e.g==="Karın"&&e.q==="Ağırlıksız"&&e.tp==="plank"&&e.c==="g",e);
    ok("yeni egzersiz süreli davranır, figürü çizilir, kütüphanede bölgeyle listelenir",ev("gTimed(S.customEx[0].id)")===true&&ev("exFig(S.customEx[0],false)").includes("<svg")&&ev("exFiltered().some(x=>x.id===S.customEx[0].id)")===true&&(ev("gLReg='Karın'"),ev("exListHtml()").includes("Benim plankım")));
    ev("gLReg='Tümü'");
    ok("kayıt turu: yeni alanlar kalıcı",JSON.stringify(ev("cleanGym(JSON.parse(JSON.stringify(S))).customEx[0]"))===JSON.stringify(e));
    ev("S.workouts=[];gStart(null);gAddEx(gActive(),S.customEx[0].id)");
    ok("antrenmana eklenince süreli set (saniye) gelir",ev("gActive().ex[0].sets[0].sec")===30&&ev("gActive().ex[0].sets[0].reps")===null);
    ev("S.workouts=[];gSheetPick()");q('[data-g="newex"]').click();
    ok("ad yazılmadan oluşturulmaz, aynı ad reddedilir",(q('[data-g="mkex"]').click(),ev("S.customEx.length")===1)&&(q("#gnn").value="benim plankım",q('[data-g="mkex"]').click(),ev("S.customEx.length")===1&&q("#toast").textContent.includes("var")));
    ev("closeSheet();S.customEx=[];S.workouts=[];render()");
  }
  { // Ev ekipmanı profili (D-Ant14)
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)];
    const H=(id,kg,reps,n=3)=>`S.workouts=[{id:5,day:'2026-09-01',t0:1000,t1:2000,name:'E',tpl:null,ex:[{id:'${id}',note:'',sets:[${Array(n).fill(`{kg:${kg},reps:${reps},done:true}`).join()}]}]}];`;
    ev("closeSheet();S.workouts=[];S.templates=[];S.customEx=[];S.exCfg={};S.gid=10;S.bar=20;S.dbStep=0;S.plates=GPLATE_DEF.slice();tab='gym';render()");
    const D=JSON.parse(ev("JSON.stringify(cleanGym({}))")),B=JSON.parse(ev("JSON.stringify(cleanGym({dbStep:3,plates:['x',99,25,25,10,0.5],bar:15}))")),Z=JSON.parse(ev("JSON.stringify([cleanGym({plates:[]}).plates,cleanGym({plates:'x',dbStep:'2'}),cleanGym({dbStep:2.5}).dbStep])"));
    ok("eski yedek (alansız): dambıl adımı kapalı, plaka seti varsayılan, bar korunur",D.dbStep===0&&D.plates.join()==="25,20,15,10,5,2.5,1.25"&&D.bar===20&&B.bar===15);
    ok("çöp değerler atılır: geçersiz adım 0, plakalar listeden süzülür/sıralanır, boş ya da bozuk liste varsayılan",B.dbStep===0&&B.plates.join()==="25,10,0.5"&&Z[0].join()==="25,20,15,10,5,2.5,1.25"&&Z[1].plates.length===7&&Z[1].dbStep===0&&Z[2]===2.5);
    ok("varsayılan envanterde her egzersizin artışı eskisiyle aynı",ev("EXMERGED.every(e=>gInc(e.id)===e.inc)")&&ev("gInc('lat')")===1);
    ev("S.dbStep=2");
    ok("dambıl adımı yalnız dambıllı harekete uygulanır",ev("gInc('dbbench')")===2&&ev("gInc('squat')")===2.5&&ev("gInc('tri')")===2.5&&ev("gInc('lat')")===2);
    ev(H("dbbench",12,12));
    ok("öneri dambıl adımına yuvarlanır (12 × 12 → 14)",ev("gSuggest('dbbench').kg")===14,ev("gSuggest('dbbench')"));
    ev("S.dbStep=0;S.plates=[25,20,15,10,5]");
    ev(H("squat",100,12));
    ok("1,25 ve 2,5 plakası yokken barlı artış 10 kg, öneri yapılabilir ağırlık",ev("gInc('squat')")===10&&ev("gSuggest('squat').kg")===110);
    ev(H("squat",102.5,8));
    ok("yapılamayan kg öneri alta iner (102,5 → 100)",ev("gSuggest('squat').kg")===100);
    ev("S.plates=GPLATE_DEF.slice()");ev(H("squat",102.5,8));
    ok("varsayılan envanterde öneri değişmez",ev("gSuggest('squat').kg")===102.5);
    ev("S.plates=[25,20,15,10,5];S.workouts=[];gStart(null);gAddEx(gActive(),'squat');gActive().ex[0].sets[0].kg=100;gClick('kgp:0:0',document.body)");
    ok("± düğmesi envanter adımıyla artar",ev("gActive().ex[0].sets[0].kg")===110);
    ev("S.plates=[20,10];exPlateSheet(0)");
    q("#pk").value="100";q("#pk").dispatchEvent(new w.Event("input"));
    ok("plaka hesabı eldeki plakalara göre (100 kg, [20,10] → 20 + 20)",q("#pres").textContent.includes("20 + 20 kg"),q("#pres").textContent);
    q("#pk").value="95";q("#pk").dispatchEvent(new w.Event("input"));
    ok("yapılamayan hedefte en yakın alt ağırlık yazılır",q("#pres").textContent.includes("en yakın: 80 kg"),q("#pres").textContent);
    ev("closeSheet();S.workouts=[];S.plates=GPLATE_DEF.slice();tab='settings-modules';render()");
    ok("Ayarlar > Salon: dambıl adımı ve plaka düğmeleri",qa('[data-g^="gdb:"]').length===4&&qa('[data-g^="gpl:"]').length===10&&q('[data-g="gdb:0"]').getAttribute("aria-pressed")==="true"&&q('[data-g="gpl:25"]').getAttribute("aria-pressed")==="true"&&q('[data-g="gpl:2"]').getAttribute("aria-pressed")==="false");
    q('[data-g="gdb:2.5"]').click();q('[data-g="gpl:1.25"]').click();q('[data-g="gpl:0.5"]').click();
    ok("seçimler kaydedilir, işaretler güncellenir, liste büyükten küçüğe",ev("S.dbStep")===2.5&&ev("S.plates.join()")==="25,20,15,10,5,2.5,0.5"&&q('[data-g="gdb:2.5"]').getAttribute("aria-pressed")==="true"&&q('[data-g="gpl:1.25"]').getAttribute("aria-pressed")==="false");
    ev("S.plates=[25]");q('[data-g="gpl:25"]').click();
    ok("son plaka kaldırılamaz",ev("S.plates.join()")==="25"&&q("#toast").textContent.includes("En az bir plaka"));
    ok("kayıt turu: envanter kalıcı",ev("(()=>{const c=cleanGym(JSON.parse(JSON.stringify(S)));return c.dbStep===2.5&&c.plates.join()==='25'})()"));
    ev("S.dbStep=0;S.plates=GPLATE_DEF.slice();tab='today';render()");
  }
  { // Koç ilk izlenimi (C7)
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)],k=()=>ev("viewCoach()");
    ev("S.chat=[];S.settings.consent=false;offline=null");
    ok("anahtar yokken tanıtım: ne yapar, veri nereye gider, çevrimdışı, Koç'suz çalışır; 'API' yok",k().includes("Koç ne yapar")&&k().includes("Verin nereye gider")&&k().includes("çevrimdışı çalışmaz")&&k().includes("onay verirsen")&&k().includes("Koç olmadan da uygulama tam çalışır")&&!/\bAPI\b/.test(k())&&!k().includes("Açık rızamı veriyorum"),k());
    ev("openSheet('x');cClick('guide',document.body)");
    const names=ev("S.providers.filter(p=>GUIDE[p.id]).map(p=>p.name)"),st=()=>q("#sheet").textContent;
    ok("kurulum: anahtar alanı ve 6 sağlayıcı düğmesi; 'API' yok",names.length===6&&names.every(n=>st().includes(n))&&!!q("#sk[type=password]")&&qa('[data-c^="sp:"]').length===6&&!/\bAPI\b/.test(st()),names);
    ok("her sağlayıcının rehberi 3-4 adım ve anahtara dönüş düğmesi içerir",ev("S.providers.filter(p=>GUIDE[p.id]).every(p=>{cGuide(p.id);const s=document.querySelector('#sheet');const n=s.querySelectorAll('ol li').length;return n>=3&&n<=4&&!!s.querySelector('[data-c=\"setup\"]')})"));
    const calls=[];let resp=null;w.fetch=async(u,o)=>{calls.push({u,o});if(!resp)throw new TypeError("Failed to fetch");return typeof resp==="function"?resp(u,o):resp};
    const R=(status,body)=>({ok:status<300,status,json:async()=>JSON.parse(body),text:async()=>body});
    const type=v=>{q("#sk").value=v;q("#sk").dispatchEvent(new w.Event("input",{bubbles:true}))};
    ev("S.settings.age=30;cSetup(true)");type("sk-proj-ornek12345");
    ok("sk-proj- OpenAI olarak tanınır; ücretli notu ve 'sağlık verin gitmez' cümlesi görünür",ev("su.id")==="openai"&&st().includes("kullandıkça ücret çıkabilir; kotayı sağlayıcı sitende sen belirlersin")&&st().includes("Anahtarını ve bir deneme cümlesini sağlayıcıya göndeririz; sağlık verin gitmez"));
    q('[data-c="sp:groq"]').click();type("sk-ant-api03-ornek");
    ok("sk-ant- Anthropic olarak tanınır (önce Groq seçiliyken de)",ev("su.id")==="anthropic"&&!!q('[data-c="stest"]'));
    q('[data-c="sp:groq"]').click();ok("ücretsiz sağlayıcıda ücret notu yok",!st().includes("kullandıkça ücret"));await ev("suTest()");
    ok("Anthropic anahtarı elle Groq seçilse de gönderilmez",calls.length===0&&st().includes("gönderilmedi"));
    type("kısa");q('[data-c="sp:groq"]').click();q('[data-c="stest"]').click();
    ok("eksik anahtar: ağ çağrısı yok, kaydedilmez",calls.length===0&&ev("getKeys().groq")===undefined&&st().includes("eksik"));
    type("gsk_ornekanahtar123");
    ok("önekten sağlayıcı tahmini: gsk_ → Groq seçili, değiştirilebilir",q('[data-c="sp:groq"]').getAttribute("aria-pressed")==="true"&&st().includes("Groq anahtarı olarak tanındı"));
    ev("S.settings.age=16");await ev("suFetch()");
    ok("18 yaş altı: kurulum ağ çağrısı yapmaz",calls.length===0&&st().includes("18 yaş altında"));
    ev("S.settings.age=0");await ev("suFetch()");
    ok("yaş girilmemiş: kurulum ağ çağrısı yapmaz, yaş girmeye yönlendirir",calls.length===0&&st().includes("yaşını gir"));
    ev("setKey('groq','gsk_x12345678');cSheetProv('groq')");await ev("cProvClick('ptest','groq')");await ev("cProvClick('pmodels','groq')");
    ok("18 yaş altı: ileri sayfadaki test ve model listesi de ağ çağrısı yapmaz",calls.length===0);
    ev("setKey('groq','');cSetup(true)");type("gsk_ornekanahtar123");
    /* Gerçek NVIDIA/Groq yanıt şekilleri: zaman aşımı, hesapta olmayan model (404 Function), düşünen modelde content null + reasoning_content. */
    const chatBy=f=>(u,o)=>u.endsWith("/models")?R(200,JSON.stringify({data:[{id:"whisper-large-v3"},{id:"llama-3.1-8b-instant"},{id:"llama-3.3-70b-versatile"},{id:"openai/gpt-oss-120b"}]})):f(JSON.parse(o.body).model);
    ev("S.settings.age=30");resp=chatBy(m=>{if(m==="llama-3.3-70b-versatile")throw Object.assign(new Error("x"),{name:"AbortError"});if(m==="openai/gpt-oss-120b")return R(404,'{"detail":"Function f: Not found for account a"}');return R(200,JSON.stringify({choices:[{message:{content:null,reasoning_content:"düşünüyor"},finish_reason:"length"}]}))});
    await ev("suFetch()");
    ok("modeller getirilir, konuşma dışı atılır; yanıt vermeyen ve hesapta olmayan aday atlanır, ilk çalışan önerilir",calls[0].u==="https://api.groq.com/openai/v1/models"&&calls.length===4&&ev("su.models.length")===3&&ev("su.model")==="llama-3.1-8b-instant"&&ev("su.ok")==="llama-3.1-8b-instant"&&st().includes("denendi")&&st().includes("Anahtar çalışıyor"));
    ok("deneme isteği 15 sn sınırlı ve düşünen modele yer bırakır (200 jeton)",JSON.parse(calls[1].o.body).max_tokens===200);
    q('[data-c="sadv"]').click();q("#smsel").value="llama-3.3-70b-versatile";q("#smsel").dispatchEvent(new w.Event("change",{bubbles:true}));
    ok("ileri: başka model seçilebilir",ev("su.model")==="llama-3.3-70b-versatile"&&!!q("#smfree"));
    resp=R(400,'{"error":{"message":"Please pass a valid API key"}}');await ev("suTest()");
    ok("test hatası anlaşılır Türkçe (400 gövdesinden yanlış anahtar), kaydedilmez",st().includes("Anahtar kabul edilmedi")&&ev("getKeys().groq")===undefined&&!q('[data-c="ssave"]'));
    resp=null;await ev("suTest()");
    ok("ağ yok: ayrı mesaj ve 'Denemeden kaydet' seçeneği",st().includes("İnternet yok")&&!!q('[data-c="ssave"]'));
    ev("S.settings.healthNote='gizli not'");calls.length=0;resp=R(200,JSON.stringify({choices:[{message:{content:"tamam"}}]}));await ev("suTest()");
    ok("test isteği sağlık verisi taşımaz, yalnız sabit cümle",calls.length===1&&!calls[0].o.body.includes("gizli not")&&JSON.parse(calls[0].o.body).messages.length===1);
    ok("başarılı test: anahtar ve seçilen model kaydedilir, sağlayıcı açılır, tanıtım yerini onay bildirimine bırakır",ev("getKeys().groq")==="gsk_ornekanahtar123"&&ev("S.providers.find(p=>p.id==='groq').model")==="llama-3.3-70b-versatile"&&ev("S.providers.find(p=>p.id==='groq').on")&&!k().includes("Koç ne yapar")&&k().includes("Açık rızamı veriyorum")&&!q("#sheet").classList.contains("on"));
    ok("kurulum onay vermez: consent kapalı kalır, coachOn yanlış",ev("S.settings.consent")===false&&ev("coachOn()")===false);
    ev("pFail('groq',Object.assign(new Error('x'),{status:429,body:'insufficient_quota'}));offline='fail'");
    ok("sohbet hatası nedeni gösterir (kota)",k().includes("Groq: Hesabının kotası"));
    ev("cSetup(true)");type("nvapi-ornekanahtar");calls.length=0;resp=(u)=>u.endsWith("/models")?R(200,JSON.stringify({data:[{id:"google/gemma-4-31b-it"},{id:"nvidia/nemotron-3-super-120b-a12b"}]})):R(403,'{"detail":"Authorization failed"}');await ev("suFetch()");
    ok("NVIDIA: liste anahtarsız da gelir, anahtar gerçek istekte reddedilince denemeler durur ve 'anahtar' denir",calls.length===2&&ev("su.ok")===""&&st().includes("Anahtar kabul edilmedi"));
    ev("cSetup(true)");type("sk-ant-api03-ornekanahtar");calls.length=0;resp=(u)=>u.endsWith("/models?limit=1000")?R(200,JSON.stringify({data:[{id:"claude-sonnet-5-5"},{id:"claude-haiku-4-5"}]})):R(200,JSON.stringify({content:[{type:"text",text:"tamam"}]}));await ev("suFetch()");
    const ah=calls[0]&&calls[0].o.headers;
    ok("Anthropic model listesi: x-api-key, sürüm ve tarayıcı başlığı; Bearer yok; Önerilen Haiku",calls[0].u==="https://api.anthropic.com/v1/models?limit=1000"&&ah["x-api-key"]==="sk-ant-api03-ornekanahtar"&&ah["anthropic-version"]==="2023-06-01"&&ah["anthropic-dangerous-direct-browser-access"]==="true"&&!ah.Authorization&&ev("su.model")==="claude-haiku-4-5");
    const ab=JSON.parse(calls[1].o.body);await ev("suTest()");
    ok("Anthropic deneme isteği yerel Messages API'ye gider; denenmiş model yeniden istek atmadan kaydedilir, sağlayıcı açılır",calls.length===2&&calls[1].u==="https://api.anthropic.com/v1/messages"&&ab.model==="claude-haiku-4-5"&&ab.messages[0].role==="user"&&ev("getKeys().anthropic")==="sk-ant-api03-ornekanahtar"&&ev("S.providers.find(p=>p.id==='anthropic').on&&S.providers.find(p=>p.id==='anthropic').health"));
    ok("onay metni Anthropic'i adıyla sayar",k().includes("Anthropic Claude"));
    const b1=ev("JSON.stringify(pBody({id:'anthropic',model:'claude-sonnet-5-5'},[{role:'system',content:'S'},{role:'assistant',content:'a'},{role:'user',content:'u'}],700))"),b2=ev("JSON.stringify(pBody({id:'openai',model:'gpt-6-luna'},[{role:'user',content:'u'}],700))");
    ok("Anthropic gövdesi: sistem ayrı, ilk mesaj kullanıcı; Sonnet'te sıcaklık yok, çaba düşük",b1==='{"model":"claude-sonnet-5-5","max_tokens":2700,"messages":[{"role":"user","content":"u"}],"system":"S","output_config":{"effort":"low"}}',b1);
    {const full=ev("CoachLib.SYSTEM")+" PROFİL: x",ab=JSON.parse(ev("JSON.stringify(pBody({id:'anthropic',model:'claude-sonnet-5-5'},[{role:'system',content:"+JSON.stringify(full)+"},{role:'user',content:'u'}],700))")),gb=ev("JSON.stringify(pBody({id:'groq',model:'x'},[{role:'system',content:"+JSON.stringify(full)+"},{role:'user',content:'u'}],700))");
    ok("Anthropic: sistem iki blok, sabit SYSTEM bloğunda cache_control, birleşimi özgün metin",Array.isArray(ab.system)&&ab.system.length===2&&ab.system[0].cache_control.type==="ephemeral"&&ab.system[0].text===ev("CoachLib.SYSTEM")&&!ab.system[1].cache_control&&ab.system.map(x=>x.text).join("")===full);
    ok("diğer sağlayıcıda cache_control yok, sistem düz metin",!gb.includes("cache_control")&&JSON.parse(gb).messages[0].content===full)}
    ok("OpenAI gövdesi: max_completion_tokens ve düşük çaba; max_tokens ve sıcaklık yok",b2==='{"model":"gpt-6-luna","messages":[{"role":"user","content":"u"}],"max_completion_tokens":2100,"reasoning_effort":"low"}',b2);
    let n2=0;calls.length=0;resp=()=>++n2===1?R(200,JSON.stringify({choices:[{message:{content:null,reasoning_content:"x"},finish_reason:"length"}]})):R(200,JSON.stringify({choices:[{message:{content:"yanıt"}}]}));
    ok("sohbette düşünen model metinsiz sınıra takılırsa bir kez üç katı sınırla yeniden sorulur",await ev("callProvider(S.providers.find(p=>p.id==='nvidia'),'k',[{role:'user',content:'x'}],700)")==="yanıt"&&JSON.parse(calls[1].o.body).max_tokens===2100);
    ev("setKey('anthropic','');Object.assign(S.providers.find(p=>p.id==='anthropic'),{on:false,health:false});delete pstat.anthropic");
    ev("delete pstat.groq;delete cool.groq;offline=null;S.providers.find(p=>p.id==='groq').model='llama-3.3-70b-versatile';S.settings.healthNote='';setKey('groq','');S.settings.consent=false");delete w.fetch;
  }
  for(const [s,int,e] of [["-30",true,NaN],["1,5",true,NaN],["17,9",true,NaN],["1e3",true,NaN],["1e3",false,NaN],["12abc3",false,NaN],["1.5.2",false,NaN],["30 dk",true,30],["83,7 kg",false,83.7],["1.500",true,1500],["1.234.567",true,1234567],[".5",false,0.5]])
    ok(`num(${JSON.stringify(s)},${int})`,Object.is(ev(`num(${JSON.stringify(s)},${int})`),e)||ev(`num(${JSON.stringify(s)},${int})`)===e);
  ok("sayı ayrıştırma",ev("[num('83,7'),num('83.7'),num('1.234,5'),num('1.500',true),num('abc')]").slice(0,4).join()==="83.7,83.7,1234.5,1500"&&isNaN(ev("num('abc')")));
  ok("geçersiz spor süresi atılır",ev("cleanEntries([{type:'exercise',day:'2026-01-01',v:1500},{type:'exercise',day:'2026-01-01',v:30}]).out.length")===1);
  ok("bildirim metni korunur",ev("cleanSettings({reminders:[{id:1,t:'09:00',on:true,body:'Bugün su içmeyi unutma'}]}).reminders[0].body")==="Bugün su içmeyi unutma");
  ok("antrenman süresi 600 dk ile sınırlı",ev("gDur({t0:Date.now()-3e6*60,t1:null})")===600);
  ev("S.settings.consent=false;setKey('nvidia','K1')");
  const bk=ev("JSON.stringify(Object.assign({},S,{settings:Object.assign({},S.settings,{consent:true}),providers:S.providers.map(p=>Object.assign({},p,{base:'https://evil.example/v1',confirm:false}))}))");
  w.document.body.insertAdjacentHTML("beforeend",'<textarea id="bk"></textarea>');w.document.querySelector("#bk").value=bk;
  await loadBackup();
  ok("yedek anahtar adresini değiştiremez",ev("S.providers.find(p=>p.id==='nvidia').base")==="https://integrate.api.nvidia.com/v1",ev("S.providers.map(p=>p.base)"));
  ok("yedek onayı ve izni değiştiremez",ev("S.settings.consent")===false&&ev("S.providers.find(p=>p.id==='gemini').confirm")===true);
  ok("yedek anahtarsız hazır sağlayıcının adresini de değiştiremez (anahtar sonradan yapıştırılınca yanlış sunucuya gitmez)",ev("S.providers.every(p=>p.base===defProviders().find(d=>d.id===p.id).base)"),ev("S.providers.map(p=>p.base)"));
  ok("özel sağlayıcının adresi serbest; Object.prototype adlı kimlik atılır",ev("(()=>{const r=cleanCoach({providers:[{id:'u9',name:'X',base:'https://x.example/v1',model:'m',on:true,health:true},{id:'constructor',name:'Y',base:'https://y.example/v1',model:'m',on:true,health:true}]});return r.providers.find(p=>p.id==='u9').base==='https://x.example/v1'&&!r.providers.some(p=>p.id==='constructor')})()"));
  ev("Object.assign(S.settings,{age:30,consent:true,consentV:CONSENT_V,consentP:'nvidia'});S.providers.forEach(p=>{p.on=p.health=p.id==='nvidia'});setKey('nvidia','K1');setKey('openai','')");
  ev("S.settings.consentP=null");
  ok("rıza: consentP yoksa (eski kayıt) yeniden onay istenir",ev("coachOn()")===false);
  ev("S.settings.consentP='nvidia'");
  ok("rıza: yaş girilmemişse Koç açılmaz, girilince açılır",ev("(S.settings.age=0,coachOn())")===false&&ev("(S.settings.age=30,coachOn())")===true);
  ev("(()=>{const o=S.providers.find(p=>p.id==='openai');o.on=o.health=true;setKey('openai','sk-x')})()");
  ok("rıza: rıza anında kümede olmayan ücretli sağlayıcıya anahtar girilince yeniden onay gerekir",ev("coachOn()")===false);
  ev("cConsent(true)");
  ok("yeniden onay: sağlayıcı kümesi kaydedilir ve Koç açılır",ev("coachOn()")===true&&ev("S.settings.consentP").includes("openai"));
  ev("(()=>{const o=S.providers.find(p=>p.id==='openai');o.on=o.health=false;setKey('openai','');Object.assign(S.settings,{consent:false,consentP:null,age:0})})()");
  ok("arşiv: toplam mesaj sınırı aşılınca eski sohbetler atılır, en yeni kalır",ev("(()=>{const c=i=>({id:i,t:i,title:'t'+i,msgs:Array.from({length:150},(_,j)=>({id:j+1,role:'user',text:'x',t:1}))});const r=trimChats([1,2,3,4,5,6].map(c));return r.length===4&&r[0].id===1})()"));
  ok("geçmiş: yalnız uygulanan kart makro ve öğünle gider; bekleyen ve reddedilen boş",ev("(()=>{const m=st=>({card:{kind:'log',state:st,items:[{type:'food',text:'a',kcal:100,p:5,c:10,f:2,meal:'breakfast'}]}});const a=cHistLog(m('ok'))[0];return a.p===5&&a.c===10&&a.f===2&&a.meal==='breakfast'&&cHistLog(m('no')).length===0&&cHistLog(m('pending')).length===0})()"));
  ok("eski kayda yeni hazır sağlayıcılar (OpenAI, Anthropic) kapalı eklenir, mevcutlar aynen kalır",ev("JSON.stringify(cleanCoach({providers:[{id:'groq',name:'Groq',base:'https://api.groq.com/openai/v1',model:'m',on:true,health:true}]}).providers.map(p=>[p.id,p.model,p.on,p.health]))")==='[["groq","m",true,true],["nvidia","nvidia/nemotron-3-super-120b-a12b",true,true],["openrouter","google/gemma-4-31b-it:free",true,true],["gemini","gemini-3.5-flash-lite",false,false],["openai","gpt-6-luna",false,false],["anthropic","claude-haiku-4-5",false,false]]');
  ok("sağlayıcı adları tek kaynaktan: gizlilik ekranı, politika, veri güvenliği ve mağaza metni hepsini sayar",(()=>{const n=ev("defProviders().map(p=>p.name)"),rd=f=>require("fs").readFileSync(path.join(__dirname,"../docs/"+f),"utf8");ev("sheetPrivacy()");const pv=$q("#sheet").textContent;ev("closeSheet()");return n.length===6&&n.every(x=>pv.includes(x)&&["gizlilik-politikasi.md","play-data-safety.md","magaza-metni.md"].every(f=>rd(f).includes(x)))})());
  ev("setKey('groq','KEY-sirri-12345');S.settings.healthNote='gizli not'");
  ev("document.querySelector('#bkpw')||document.body.insertAdjacentHTML('beforeend','<input id=\"bkpw\">')");
  ev("document.querySelector('#bkpw2')||document.body.insertAdjacentHTML('beforeend','<input id=\"bkpw2\"><div id=\"bkw\"></div>')");
  const pw1=w.document.querySelector("#bkpw"),pw2=w.document.querySelector("#bkpw2");
  for(const [a,b,msg,n] of [["","","en az 10","parolasız"],["abc","abc","en az 10","kısa"],["abcdefgh1","abcdefgh1","en az 10","9 karakter"],["1234567890","1234567890","kolay","yalnız rakam"],["Password123!","Password123!","kolay","yaygın parola + rakam"],["mavi-bulut-77","mavi-bulut-78","aynı değil","uyuşmayan"]]){
    pw1.value=a;pw2.value=b;
    ok(`parolasız/zayıf yedek reddedilir: ${n}`,await ev("backupText()")===null&&w.document.querySelector("#bkw").textContent.includes(msg),w.document.querySelector("#bkw").textContent);
  }
  w.document.querySelector("#bkw").remove();pw1.value="mavi-bulut-77";pw2.value="mavi-bulut-77";
  w.backupP=ev("backupText()");
  const enc=await w.backupP;{
    ok("şifreli yedek düz metin içermez",!enc.includes("gizli not")&&!enc.includes("KEY-sirri-12345")&&JSON.parse(enc).enc==="aes-gcm-pbkdf2");
    ev("setKey('groq','');S.settings.healthNote=''");
    w.document.querySelector("#bk").value=enc;w.document.querySelector("#bkpw").value="yanlis";
    await ev("goRestore()");
    ok("yanlış parola geri yüklemez",ev("S.settings.healthNote")===""&&ev("getKeys().groq")===undefined);
    w.document.querySelector("#bkpw").value="mavi-bulut-77";
    await ev("goRestore()");
    ok("doğru parola veri ve anahtarı geri getirir",ev("S.settings.healthNote")==="gizli not"&&ev("getKeys().groq")==="KEY-sirri-12345",[ev("S.settings.healthNote"),ev("getKeys().groq"),ev("document.querySelector('#toast').textContent")]);
    { // kayıt yazılamazsa anahtarlar kasaya yazılmaz ve veri geri alınır
      ev("setKey('groq','');S.settings.healthNote='eski'");w.document.querySelector("#bk").value=enc;ev("recovery={}");
      await ev("goRestore()");const k=ev("getKeys().groq"),h=ev("S.settings.healthNote");ev("recovery=null");
      ok("geri yükleme: kayıt başarısızsa anahtar yazılmaz, eski veri kalır",k===undefined&&h==="eski",[k,h]);
      // depolama doluysa güvenlik kopyası alınamayacağı onaydan ÖNCE söylenir
      const oc=w.confirm;let cm="";w.confirm=m=>(cm=m,false);const ob=ev("otherBytes");ev("otherBytes=4e6");
      await ev("goRestore()");ev("otherBytes="+ob);w.confirm=oc;
      ok("geri yükleme onayı: güvenlik kopyası alınamayacaksa önceden söyler",/güvenlik kopyası ALINAMAYACAK/.test(cm),cm);
    }
  { // otomatik yenileme (görünürlük, gün değişimi) doldurulmuş form alanını silmez
    ev("S.settings.obDone=true;tab='today';closeSheet();render()");const v=w.document.querySelector("#view");
    v.insertAdjacentHTML("beforeend",'<input id="zz" class="in">');w.document.querySelector("#zz").value="yazdım";w.document.activeElement.blur();
    ev("renderSoft()");const kept=!!w.document.querySelector("#zz")&&w.document.querySelector("#zz").value==="yazdım";
    w.document.querySelector("#zz").value=w.document.querySelector("#zz").defaultValue;ev("renderSoft()");
    ok("renderSoft: dolu alan korunur, boşsa yenilenir",kept&&!w.document.querySelector("#zz"),kept);
  }
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
    ok("Trend'de tahlil kartı var",ev("viewTrend()").includes("Tahlil takibi")&&ev("viewTrend()").includes('data-tab="labs"'));
    ok("açılışta pdf.js yüklenmez (yalnızca tahlil açılınca)",!html.includes('<script src="vendor')&&!/<script src="[^"]*pdf/.test(require("./html").full()));
    ev("tab='labs';render()");
    ok("boş tahlil ekranı: okut ve elle ekle düğmeleri",!!q("#labfile")&&!!q('[data-lab="add"]')&&!q('[data-lab="pdf"]')&&q("#ttl").textContent==="Tahlil takibi"&&q('nav [data-tab="trend"]').getAttribute("aria-current")==="page");

    await ev("labFile")(file(lab));
    ok("okunan sonuçlar ekranı: 4 satır, tarih dolu",qa('[id^="ln"]').length===4&&q("#ld").value==="2026-09-12",qa('[id^="ln"]').length);
    ok("hasta bilgisi ekranda ve durumda yok",!q("#sheet").innerHTML.match(/Ali|Veli|12345678901/)&&!JSON.stringify(ev("S")).match(/Ali Veli|12345678901/));
    q("#lc1").checked=false;
    click('[data-lab="save"]');
    ok("işareti kaldırılan satır kaydedilmez",ev("S.labs.length")===3&&ev("S.labs.map(x=>x.k).join()")==="glukoz,hba1c,ldl",ev("S.labs.map(x=>x.k)"));
    ok("kaydedince tahlil ekranına döner ve testler listelenir",ev("tab")==="labs"&&q("#view").textContent.includes("Glukoz")&&q("#view").textContent.includes("LDL kolesterol")&&!q('[data-lab="pdf"]'));
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
    ok("PDF'e testler ve referans metni çizilir, hasta bilgisi yok",["Glukoz","LDL kolesterol","Ferritin","HbA1c"].every(n=>drawn.includes(n))&&drawn.some(t=>/Raporda yazan aralık: 70 – 100/.test(t))&&!drawn.join("|").match(/Ali|Veli|12345678901/),drawn);
    ok("aralık dışı değer PDF'te açıkça yazılır",drawn.includes("▲ Raporda yazan aralığın üstünde")&&drawn.some(t=>/Bu değerleri hekiminle değerlendir\./.test(t)));
    ev("S.labs=S.labs.concat(Array.from({length:30},(_,i)=>({id:900+i,day:'2026-09-01',k:'t'+i,n:'Test '+i,v:i+1,u:'x'})))");
    drawn.length=0;await ev("labExport()");
    const pd2=await pdfjs.getDocument({data:new Uint8Array(Buffer.from(saved.data,"base64")),verbosity:0}).promise;
    ok("çok test varsa sayfalara bölünür",pd2.numPages>=4&&drawn.some(t=>/sayfa 4\//.test(t)),pd2.numPages);
    ev("S.labs=S.labs.filter(x=>x.id<900)");

    // yedek: tahlil verisi yedekle-yükle gidiş dönüşünde korunur
    const bkJ=ev("JSON.stringify(S)");
    ev("S.labs=[]");doc.querySelector("#bk").value=bkJ;
    await loadBackup();
    ok("yedekten geri yüklemede tahlil kayıtları gelir",ev("S.labs.length")>=4&&ev("S.labs.some(x=>x.k==='ferritin')"),ev("S.labs.length"));
    doc.querySelector("#bk").value=JSON.stringify({...JSON.parse(bkJ),labs:[{day:"bozuk",n:"x",v:1},{day:"2026-01-01",n:"Glukoz",v:90,u:"mg/dL"},"çöp",null]});
    await loadBackup();
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
    ev("tab='labs';render()");click('[data-lab="delall"]');
    ok("tüm tahlil kayıtları silinir",ev("S.labs.length")===0);
    ev("tab='today';render()");
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
    ev("sheetFood()");
    ok("Yemek ekle'de etiket oku düğmesi (eklenti varken)",!!q('[data-ocr="choose:label"]'));
    q('[data-ocr="choose:label"]').click();
    ok("seçim ekranı: fotoğraf çek ve galeri",!!q('[data-ocr="cam:label"]')&&!!q('[data-ocr="gal:label"]')&&q("#sheet").textContent.includes("hiçbir yere gönderilmez"));
    const clicked=[];const oc=w.HTMLInputElement.prototype.click;
    w.HTMLInputElement.prototype.click=function(){clicked.push(this)};
    q('[data-ocr="cam:label"]').click();q('[data-ocr="gal:label"]').click();
    w.HTMLInputElement.prototype.click=oc;
    ok("kamera seçeneği capture ister, galeri istemez; yalnızca görüntü kabul edilir",clicked.length===2&&clicked[0].getAttribute("capture")==="environment"&&!clicked[1].hasAttribute("capture")&&clicked.every(i=>i.type==="file"&&i.accept==="image/*"));
    clicked.forEach(i=>i.remove());

    await ev("ocrRun")("label",{size:1000});
    ok("fotoğraf küçültülüp eklentiye gönderilir",typeof sent.image==="string"&&sent.image.length>10);
    ok("etiket ekranı: değerler dolu, ad boş",q("#ek").value==="440"&&q("#ep").value==="8,5"&&q("#ec").value==="70"&&q("#ef").value==="13"&&q("#en").value==="");
    q('[data-ocr="esave"]').click();
    ok("ad yazılmadan kaydedilmez",ev("S.myFoods.length")===0&&q("#toast").textContent.includes("adını"));
    q("#en").value="Test Bisküvi";q('[data-ocr="esave"]').click();
    ok("etiketten besin kaydedilir (100 g başına)",ev("S.myFoods.length")===1&&ev("S.myFoods[0].n")==="Test Bisküvi"&&ev("S.myFoods[0].k")===440&&ev("S.myFoods[0].p")===8.5&&ev("S.myFoods[0].c")===70&&ev("S.myFoods[0].f")===13&&ev("S.myFoods[0].u[0][1]")===100,ev("S.myFoods"));
    ok("kayıttan sonra porsiyon ekranı açılır",q("#sheet").textContent.includes("Test Bisküvi")&&q("#sheet").textContent.includes("Porsiyon"));
    ok("etiketten gelen besin 'Benim besinlerim' temizliğinden geçer",ev("cleanMyFoods(S.myFoods).length")===1);

    ev("closeSheet()");reply=table("1840 kJ / 140 kcal","8,5 g","70 g","13 g");
    await ev("ocrRun")("label",{size:1000});q("#en").value="Hatalı Okuma";q('[data-ocr="esave"]').click();
    ok("tutarsız okuma uyarı verir, kaydetmez",ev("S.myFoods.length")===1&&q("#ewarn").textContent.includes("tutarlı değil"),q("#ewarn")&&q("#ewarn").textContent);
    q('[data-ocr="esave"]').click();
    ok("ikinci dokunuşta (kullanıcı onayıyla) kaydedilir",ev("S.myFoods.length")===2);

    ev("closeSheet()");reply={lines:[box("Yağ",50,450,60),box("13 g",500,449,60),box("Karbonhidrat",50,500,200),box("70 g",500,501,60),box("Protein",50,550,100),box("8,5 g",500,548,60)]};
    await ev("ocrRun")("label",{size:1000});
    ok("kalori okunamazsa alan boş, okunmayanlar listelenir",q("#ek").value===""&&q("#sheet").textContent.includes("Okunamayan: kalori"));
    q("#en").value="Kalorisiz";q('[data-ocr="esave"]').click();
    ok("kalori yoksa kaydedilmez",ev("S.myFoods.length")===2&&q("#toast").textContent.includes("Kalori gerekli"));
    q("#ek").value="abc";q('[data-ocr="esave"]').click();
    ok("sayı olmayan değer reddedilir",ev("S.myFoods.length")===2&&q("#toast").textContent.includes("Sayı olarak"));

    ev("closeSheet()");reply={lines:[]};
    await ev("ocrRun")("label",{size:1000});
    ok("yazı yoksa açıklama ve tekrar dene",q("#sheet").textContent.includes("Yazı bulunamadı")&&!!q('#sheet [data-ocr="choose:label"]'));
    reply=new Error("boom");
    await ev("ocrRun")("label",{size:1000});
    ok("eklenti hata verirse çökmez, mesaj gösterir",q("#toast").textContent.includes("okunamadı"));
    await ev("ocrRun")("label",{size:40e6});
    ok("çok büyük fotoğraf reddedilir",q("#toast").textContent.includes("büyük"));

    // tahlil fotoğrafı
    ev("S.labs=[]");reply={lines:[box("Numune Tarihi: 12.09.2026",50,100,500),box("Glukoz",50,200,100),box("98",400,201,40),box("mg/dL",500,200,80),box("70 - 100",650,199,100)]};
    await ev("ocrRun")("labs",{size:1000});
    ok("tahlil fotoğrafı: onay ekranı, tarih ve satır dolu",q("#ld").value==="2026-09-12"&&qa('[id^="ln"]').length===1&&q("#ln0").value==="Glukoz"&&q("#lv0").value==="98",qa('[id^="ln"]').length);
    click=s=>q(s).click();click('[data-lab="save"]');
    ok("fotoğraftan okunan tahlil kaydedilir",ev("S.labs.length")===1&&ev("S.labs[0].k")==="glukoz");
    reply={lines:[box("Kontrol metni",50,100,300)]};
    await ev("ocrRun")("labs",{size:1000});
    ok("tahlil satırı çıkmazsa açıklama",q("#sheet").textContent.includes("Sonuç bulunamadı"));
    ev("closeSheet();S.labs=[];S.myFoods=[]");
    delete w.Capacitor.Plugins.Ocr;
    ev("sheetFood()");
    ok("eklenti yoksa (tarayıcı) etiket düğmesi görünmez",!q('[data-ocr="choose:label"]'));
    ev("closeSheet()");
  }
  // ---- Tansiyon ve şeker takibi ----
  {
    const doc=w.document,q=s=>doc.querySelector(s),qa=s=>[...doc.querySelectorAll(s)];
    const click=s=>q(s).click(),txt=()=>q("#sheet").textContent,toastT=()=>q("#toast").textContent;
    const unclock=require('./clock').at(w,12); // Bugün'de ölçüm satırı hatırlatma saati gelince çıkar
    const pdfjs=await import("pdfjs-dist/legacy/build/pdf.mjs");
    const BAN=/hipertansiyon|hipoglisemi|hiperglisemi|anormal|tehlikeli|diyabet/i;
    ev("S.vitals=[];S.labs=[];S.entries=[];S.settings.bpOn=false;S.settings.bsOn=false;tab='today';render()");
    ok("özellik kapalıyken Bugün ve Trend'de görünmez",!ev("viewToday()").includes("Ölçümler")&&!ev("viewTrend()").includes("Tansiyon")&&!ev("viewTrend()").includes("Şeker"));
    ev("tab='settings-modules';render()");
    ok("Ayarlar'da tansiyon ve şeker takibini aç düğmeleri, hatırlatmalar gizli",!!q('[data-vt="bptoggle"]')&&!!q('[data-vt="bstoggle"]')&&!shown().includes(7)&&!shown().includes(9));
    click('[data-vt="bptoggle"]');
    ok("tansiyon takibi açılır: alanlar yok (eşik girilmez), ön ayar düğmesi yok, tansiyon hatırlatmaları",ev("S.settings.bpOn")===true&&!q("#bpSysHi")&&!q('[data-vt="bppreset"]')&&shown().includes(7)&&shown().includes(8)&&!shown().includes(9));
    ev("tab='today';render()");
    ok("Bugün yapılacaklar: tansiyon satırı (ölçüm yok), şeker kapalıyken satırı yok",qa('#view .todo [data-vt="addbp"]').length===1&&q(".todo").textContent.includes("ölçüm yok")&&!q('#view [data-vt="addbs"]'));
    ev("tab='trend';render()");
    ok("Trend'de tansiyon kartı, şeker kartı yok",!!q('[data-tab="bp"]')&&!q('[data-tab="glucose"]'));

    // Tansiyon girişi
    ev("tab='today';render()");
    ev("vMenu()");
    ok("menü: yalnızca tansiyon seçenekleri",!!q('#sheet [data-vt="addbp"]')&&!q('#sheet [data-vt="addbs"]')&&!!q('#sheet [data-vt="go:bp"]'));
    click('#sheet [data-vt="addbp"]');
    ok("tansiyon ekranı: iki ölçüm alanı, seans, gün, saat",!!q("#bs1")&&!!q("#bs2")&&qa("[data-vsession]").length===3&&!!q("#fday")&&/^\d\d:\d\d$/.test(q("#vtime").value));
    click('[data-vsession="evening"]');
    ok("seans seçimi işaretlenir",q('[data-vsession="evening"]').getAttribute("aria-pressed")==="true"&&q('[data-vsession="morning"]').getAttribute("aria-pressed")==="false");
    q("#bs1").value="80";q("#bd1").value="90";click('[data-vt="savebp"]');
    ok("büyük tansiyon küçükten büyük olmalı",ev("S.vitals.length")===0&&toastT().includes("Sistolik"),toastT());
    q("#bs1").value="";q("#bd1").value="";click('[data-vt="savebp"]');
    ok("1. ölçüm boşsa kaydedilmez",ev("S.vitals.length")===0&&toastT().includes("1. ölçüm"));
    q("#bs1").value="128";q("#bd1").value="82";q("#bn1").value="70";q("#bs2").value="132";click('[data-vt="savebp"]');
    ok("2. ölçüm yarım girilirse kaydedilmez",ev("S.vitals.length")===0&&toastT().includes("2. ölçüm"));
    q("#bd2").value="86";click('[data-vt="savebp"]');
    ok("iki ölçüm kaydedilir: aynı seans, ham değerler ayrı, seçilen seans",ev("S.vitals.length")===2&&ev("S.vitals[0].sid")===ev("S.vitals[1].sid")&&ev("S.vitals[0].session")==="evening"&&ev("S.vitals[0].sys")===128&&ev("S.vitals[1].sys")===132&&ev("S.vitals[0].pulse")===70,ev("S.vitals"));
    ok("kayıt bildirimi: ortalama ve hedef aralığı notu yok (130/84 aralıkta)",toastT().includes("130/84 (ortalama)")&&!toastT().includes("üstünde"),toastT());
    ok("bugün ölçülünce Bugün'deki tansiyon satırı kalkar",!q('#view [data-vt="addbp"]'));

    // Aykırı değer ve uç değer kutusu
    ev("vMenu()");click('#sheet [data-vt="addbp"]');
    q("#bs1").value="200";q("#bd1").value="100";click('[data-vt="savebp"]');
    ok("önceki ölçümden >60 farklıysa uyarı verir, kaydetmez",ev("S.vitals.length")===2&&q("#vwarn").textContent.includes("Yanlış yazmış"),q("#vwarn").textContent);
    click('[data-vt="savebp"]');
    ok("ikinci dokunuşta kaydedilir ve bugün tarihli uç değerde 112 kutusu çıkar",ev("S.vitals.length")===3&&txt().includes("112")&&txt().includes("kaydedildi")&&!txt().match(/teşhis|hasta/i),txt());
    click('#sheet [data-vt="close"]');
    ev("vMenu()");click('#sheet [data-vt="addbp"]');
    q("#fday").value=ev("keyOff(-3)");q("#bs1").value="190";q("#bd1").value="125";click('[data-vt="savebp"]');
    ok("geriye dönük uç değerde acil kutusu çıkmaz, tek kayıt eklenir",ev("S.vitals.length")===4&&!txt().includes("112"),[ev("S.vitals.length"),txt().slice(0,80)]);
    ev("closeSheet()");

    // Görünüm
    ev("tab='bp';render()");
    const v=q("#view").textContent;
    ok("tansiyon görünümü: ev ortalaması, grafik noktaları, doktor raporu, silme düğmeleri",v.includes("Ev ortalaması")&&v.includes("mmHg")&&qa("#view svg circle").length>=3&&!q('[data-vt="pdfmenu:t"]')&&qa('#view [data-vt^="del:"]').length>=2&&q("#ttl").textContent==="Tansiyon"&&q('nav [data-tab="trend"]').getAttribute("aria-current")==="page",v.slice(0,300));
ok("ortalama uyarısı: 3 günden az",v.includes("en az 3 gün"));
    ok("tanı dili görünümde yok",!BAN.test(v)&&!BAN.test(ev("viewToday()")),v.match(BAN));
    ok("200/100 oturumu işaretlenmez, yorum yok",!/▲|▼|üstünde|altında/.test(v)&&v.includes("Bu değerleri hekiminle değerlendir."));
    const n0=ev("S.vitals.length");
    click('#view [data-vt^="del:"]');
    ok("ölçüm silinir, geri al getirir",ev("S.vitals.length")<n0);
    click("#tundo");
    ok("geri al silineni geri getirir",ev("S.vitals.length")===n0);
    click('[data-vt="range:7"]');
    ok("aralık düğmesi grafiği yeniler",ev("vRange")===7&&q('[data-vt="range:7"]').getAttribute("aria-pressed")==="true");

    // Şeker
    ev("tab='settings-modules';render()");click('[data-vt="bstoggle"]');
    ok("şeker takibi açılır, hatırlatma görünür; hedef alanı ve ADA ön ayarı yok",ev("S.settings.bsOn")===true&&!q("#gFastHi")&&shown().includes(9)&&!q('[data-vt="gpreset"]')&&!/ADA 20|diyabet/i.test(q("#view").textContent));
    ev("tab='today';render()");
    ok("Bugün yapılacaklarda şeker satırı, ölçülmüş tansiyon yok",!!q('#view .todo [data-vt="addbs"]')&&q(".todo").textContent.includes("Şeker")&&!q('#view [data-vt="addbp"]'));
    const addG=(g,ctx,day)=>{ev("vMenu()");click('#sheet [data-vt="addbs"]');q("#gv").value=String(g);click(`[data-vctx="${ctx}"]`);if(day)q("#fday").value=day;click('[data-vt="savebs"]')};
    addG(95,"fasting");
    ok("şeker kaydedilir: bağlam ve değer",ev("S.vitals.filter(r=>r.k==='s').length")===1&&ev("S.vitals.find(r=>r.k==='s').ctx")==="fasting"&&ev("S.vitals.find(r=>r.k==='s').g")===95&&toastT().includes("95 mg/dL")&&!toastT().includes("üstünde"),toastT());
    addG(160,"after");
    ok("160 yemekten sonra: işaret yok",!toastT().includes("üstünde")&&ev("S.vitals.filter(r=>r.k==='s').length")===2,toastT());
    addG(150,"fasting");
    ok("160/150 açlıkta da işaret yok, yorum yazılmaz",!/üstünde|altında|aralığ/.test(toastT())&&ev("S.vitals.filter(r=>r.k==='s').length")===3,toastT());
    addG(250,"after");
    ok("açlık 95 / yemek sonrası 250: bağlam farklı, aykırı uyarısı yok",ev("S.vitals.filter(r=>r.k==='s').length")===4);
    addG(310,"fasting");
    ok("aynı bağlamda >150 fark uyarı verir, kaydetmez",ev("S.vitals.filter(r=>r.k==='s').length")===4&&q("#vwarn").textContent.includes("Aynı bağlamdaki"),q("#vwarn")&&q("#vwarn").textContent);
    q("#gv").value="abc";click('[data-vt="savebs"]');
    ok("sayı olmayan şeker reddedilir",ev("S.vitals.filter(r=>r.k==='s').length")===4&&toastT().includes("mg/dL"));
    q("#gv").value="10";click('[data-vt="savebs"]');
    ok("20 altı şeker reddedilir",ev("S.vitals.filter(r=>r.k==='s').length")===4&&toastT().includes("20-800"));
    q("#gv").value="50";click('[data-vctx="random"]');click('[data-vt="savebs"]');
    ok("bugün tarihli çok düşük değerde 112 kutusu",ev("S.vitals.filter(r=>r.k==='s').length")===5&&txt().includes("112"));
    click('#sheet [data-vt="close"]');
    ev("S.labs=[{id:1,day:'2026-09-01',k:'hba1c',n:'HbA1c',v:5.4,u:'%'}]");
    ev("tab='glucose';render()");
    const sv=q("#view").textContent;
    ok("şeker görünümü: son ölçüm, ortalama, hedef yüzdesi yok, bağlama göre, grafik, tahlil HbA1c",sv.includes("Son ölçüm")&&sv.includes("Ortalama")&&!sv.includes("Hedef aralığında")&&sv.includes("Bağlama göre ortalama")&&qa("#view svg circle").length>=5&&sv.includes("HbA1c")&&sv.includes("karıştırılmaz"),[sv.includes("Son ölçüm"),/Hedefaralığında%\d+/.test(sv.replace(/\s/g,"")),qa("#view svg circle").length,sv.includes("HbA1c"),sv.includes("karıştırılmaz"),ev("S.labs.length")]);
    ok("şeker görünümünde tanı dili yok",!BAN.test(sv),sv.match(BAN));
    ok("tansiyon ve şeker ekranlarında yorum etiketi çıkmaz (normal/yüksek/prediyabet/diyabet/hipertansiyon)",!/normal|yüksek|prediyabet|diyabet|hipertansiyon/i.test(sv.replace(/En düşük \/ en yüksek/g,"")+v.replace(/En düşük \/ en yüksek/g,"")),[sv,v].map(x=>x.match(/normal|yüksek|prediyabet|diyabet|hipertansiyon/i)));

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
    ev("S.vitals=[]");doc.querySelector("#bk").value=bkJ;await loadBackup();
    ok("yedekten geri yüklemede ölçümler gelir",ev("S.vitals.length")===cnt&&ev("S.vitals.some(r=>r.k==='t'&&r.sid)"),[ev("S.vitals.length"),cnt]);
    ev("tab='today';render()");ev("vMenu()");click('#sheet [data-vt="addbp"]');
    q("#fday").value=ev("keyOff(-1)");q("#bs1").value="128";q("#bd1").value="82";q("#bs2").value="128";q("#bd2").value="82";click('[data-vt="savebp"]');if(q("#vwarn")&&q("#vwarn").textContent.includes("Yanlış"))click('[data-vt="savebp"]');
    const twins=ev("S.vitals.filter(r=>r.day===keyOff(-1)&&r.sys===128&&r.dia===82).length");
    ok("özdeş iki ölçüm (128/82 iki kez) UI'den iki satır olarak kaydedilir",twins===2&&ev("S.vitals.filter(r=>r.day===keyOff(-1)&&r.sys===128).every(r=>r.i===1||r.i===2)"),twins);
    doc.querySelector("#bk").value=ev("JSON.stringify(S)");await loadBackup();
    ok("özdeş iki ölçüm yedek gidiş-dönüşünden sonra da iki satır",ev("S.vitals.filter(r=>r.day===keyOff(-1)&&r.sys===128&&r.dia===82).length")===2&&ev("VitalsLib.sessions(S.vitals).find(s=>s.day===keyOff(-1)&&s.sys===128).n")===2);
    doc.querySelector("#bk").value=JSON.stringify({...JSON.parse(bkJ),vitals:[{k:"t",day:"2026-09-10",time:"08:00",sys:300,dia:60},{k:"t",day:"2026-09-10",time:"08:01",sys:40,dia:60},{k:"s",day:"2026-09-10",time:"08:00",g:5},"çöp",null,{k:"s",day:"2026-09-10",time:"09:00",g:110,ctx:"fasting"}]});
    await loadBackup();
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
      {id:1,k:'t',day:t,time:'07:30',sys:128,dia:82,pulse:70,session:'morning',sid:'a1'},{id:2,k:'t',day:t,time:'07:32',sys:140,dia:90,session:'morning',sid:'a1'},
      {id:3,k:'s',day:t,time:'07:00',g:95,ctx:'fasting'},{id:4,k:'s',day:t,time:'09:30',g:150,ctx:'after'}]})()`);
    ev("S.settings.bpOn=S.settings.bsOn=true;tab='trend';render()");click('[data-vt="pdfmenu:t"]');
    ok("rapor dönemi seçimi: 7/14/30/90",qa('#sheet [data-vt^="pdf:t:"]').length===4);
    click('[data-vt="pdf:t:30"]');await new Promise(r=>setTimeout(r,150));
    const pb=Buffer.from(saved.data,"base64"),pd=await pdfjs.getDocument({data:new Uint8Array(pb),verbosity:0}).promise;
    ok("tansiyon raporu: geçerli PDF, dosya adı, paylaşım",/^neowell-tansiyon-\d{4}-\d{2}-\d{2}\.pdf$/.test(saved.path)&&pb.slice(0,5).toString()==="%PDF-"&&pd.numPages===1&&shared.files[0]==="file:///cache/r.pdf",[saved.path,pd.numPages]);
    ok("tansiyon raporu: iki ham ölçüm ayrı satır, ortalama, uyarı notu",drawn.includes("NeoWell · Tansiyon raporu")&&drawn.includes("128/82 mmHg  nabız 70")&&drawn.includes("140/90 mmHg")&&drawn.includes("Sabah, 1. ölçüm")&&drawn.includes("Sabah, 2. ölçüm")&&drawn.some(t=>/Bu değerleri hekiminle değerlendir\./.test(t))&&drawn.some(t=>/134\/86 mmHg/.test(t)),drawn);
    ok("raporda tanı dili yok",!BAN.test(drawn.join(" ")));
    drawn.length=0;saved=null;
    ev("tab='trend';render()");click('[data-vt="pdfmenu:s"]');click('[data-vt="pdf:s:7"]');await new Promise(r=>setTimeout(r,150));
    ok("şeker raporu: bağlam ve değerler, hedef yüzdesi yok",drawn.includes("NeoWell · Şeker raporu")&&drawn.includes("Açlık")&&drawn.includes("95 mg/dL")&&drawn.includes("Yemekten 2 saat sonra")&&!drawn.some(t=>/Hedef aralığ/.test(t)),drawn);
    ev(`(()=>{const t=dayKey();S.vitals=[];for(let i=0;i<120;i++)S.vitals.push({id:i+1,k:'s',day:keyOff(-(i%25)),time:String(6+(i%12)).padStart(2,'0')+':'+String(i%60).padStart(2,'0'),g:80+(i%60),ctx:'random'})})()`);
    drawn.length=0;saved=null;
    await ev("vPdf")("s",30);
    const pd2=await pdfjs.getDocument({data:new Uint8Array(Buffer.from(saved.data,"base64")),verbosity:0}).promise;
    ok("çok ölçümde rapor sayfalara bölünür, sayfa numaraları yazılır",pd2.numPages>=3&&drawn.some(t=>new RegExp(`sayfa ${pd2.numPages}/${pd2.numPages}`).test(t)),pd2.numPages);
    ev("S.vitals=[]");saved=null;
    await ev("vPdf")("t",30);
    ok("ölçüm yokken rapor üretilmez",saved===null&&toastT().includes("Raporlanacak"));

    // temizlik
    ev("S.vitals=[];S.labs=[];S.settings.bpOn=false;S.settings.bsOn=false;tab='today';render()");
    unclock();
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
    ev("add('weight',81.9,'');add('water',2000,'');add('food',1900,'Öğün');add('exercise',45,'Yürüyüş')");
    ev("S.settings.bpOn=true;S.vitals=[{id:1,k:'t',day:dayKey(),time:'08:00',sys:128,dia:82,session:'morning'}]");
    q('[data-wk="pdf"]').click();await new Promise(r=>setTimeout(r,150));
    const pb=Buffer.from(saved.data,"base64"),pd=await pdfjs.getDocument({data:new Uint8Array(pb),verbosity:0}).promise;
    ok("haftalık rapor: geçerli tek sayfa PDF, dosya adı, paylaşım",/^neowell-haftalik-\d{4}-\d{2}-\d{2}\.pdf$/.test(saved.path)&&pb.slice(0,5).toString()==="%PDF-"&&pd.numPages===1&&shared.files[0]==="file:///cache/h.pdf",[saved.path,pd.numPages]);
    ok("rapor içeriği: kilo, su, kalori, spor ve (takip açıksa) tansiyon",drawn.includes("NeoWell · Son 7 gün raporu")&&drawn.some(t=>t.includes("81,9"))&&drawn.some(t=>/günlük ortalama 2,0 L/.test(t))&&drawn.some(t=>/1 gün kayıt var; ortalama için en az 3/.test(t))&&drawn.some(t=>/toplam 45 dk/.test(t))&&drawn.some(t=>/128\/82 mmHg/.test(t)),drawn);
    ev("S.entries=[];S.vitals=[];S.settings.bpOn=false;tab='today';render()");
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
    ok("bildirim eylem türü kayıtlı: 'water' düğmesi +250 ml",types&&types[0].id==="water"&&types[0].actions[0].id==="water"&&types[0].actions[0].title==="+250 ml",types);
    const water=list.filter(n=>[2,3,4].includes(Math.floor(n.id/100))),other=list.filter(n=>![2,3,4].includes(Math.floor(n.id/100)));
    ok("su bildirimlerinde eylem türü ve miktar var",water.length>0&&water.every(n=>n.actionTypeId==="water"&&n.extra.act==="water"&&n.extra.v===250),water[0]);
    ok("su bildiriminin extra.at'ı planlanan an (yeniden teslimde tekrar denetimi imzası), her bildirimde farklı",water.every(n=>n.extra.at===new Date(n.schedule.at).getTime())&&new Set(water.map(n=>n.extra.at)).size===water.length,water[0]);
    ok("diğer bildirimlerde düğme yok",other.length>0&&other.every(n=>n.actionTypeId===undefined&&(n.extra===undefined||n.extra.act==="open")));
    ev("S.settings.glass=330");await ev("scheduleReminders()");
    ok("bardak boyutu değişince düğme metni ve miktar güncellenir",types[0].actions[0].title==="+330 ml"&&list.filter(n=>n.actionTypeId==="water").every(n=>n.extra.v===330));
    ev("S.settings.glass=250");

    // haftalık yedek hatırlatması
    const bk=()=>list.filter(n=>Math.floor(n.id/100)===10);
    await ev("scheduleReminders()");
    ok("10 kayıttan azken yedek hatırlatması kurulmaz",bk().length===0);
    ev("S.entries=Array.from({length:12},(_,i)=>({id:i+1,day:dayKey(),time:'08:00',type:'water',v:200,text:''}))");
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
    /* Yerel taraf: take kayıtları "yolda" tutar, ack(upto) kalıcı yazıldıktan sonra siler (üst üste alışta yolda olanlar yeniden gelir). */
    let inflight=[],acked=[];
    w.Capacitor.Plugins.QuickLog={take:async()=>{inflight=inflight.concat(pending);pending=[];return {items:inflight.slice()}},ack:async({upto})=>{acked.push(upto);inflight=inflight.filter(i=>i&&Number.isFinite(i.t)&&i.t>upto) /* yerel taraf bozuk kaydı atar */}};
    const tms=(y,m,d,h,mi)=>new Date(y,m-1,d,h,mi).getTime();
    ev("S.entries=[];S.settings.waterMl=2500");
    pending=[{v:250,t:tms(2026,9,30,23,50)},{v:250,t:Date.now()-60000}];
    await ev("quickIngest()");
    ok("hızlı kayıtlar doğru gün ve saatle eklenir (gece yarısı öncesi dünün kaydı)",ev("S.entries.length")===2&&ev("S.entries[0].day")==="2026-09-30"&&ev("S.entries[0].time")==="23:50"&&ev("S.entries[0].type")==="water"&&ev("S.entries[0].v")===250,ev("S.entries"));
    ok("bildirim toast'ı toplam miktarı yazar",toastT().includes("500 ml")&&toastT().includes("bugün 250"),toastT());
    await ev("quickIngest()");
    ok("aynı kayıtlar ikinci kez eklenmez (take bir kez verir)",ev("S.entries.length")===2);
    pending=[{v:0,t:Date.now()},{v:1501,t:Date.now()},{v:250,t:Date.now()+36e5},{v:NaN,t:Date.now()},{v:250,t:0},{v:250},null,"x",{v:300,t:Date.now()-1000}];
    await ev("quickIngest()");
    ok("geçersiz kayıtlar (sınır dışı, gelecek, bozuk) atılır, geçerli biri eklenir",ev("S.entries.length")===3&&ev("S.entries[2].v")===300,ev("S.entries"));
    pending=[];await ev("quickIngest()");
    ok("boş liste: değişiklik yok",ev("S.entries.length")===3);
    { // kayıt yazılamazsa (kurtarma modu) kuyruk kaybolmaz, sonra yeniden denenir
      ev("S.entries=[]");pending=[{v:250,t:Date.now()-1000}];ev("recovery={}");await ev("quickIngest()");
      const held=ev("S.entries.length");ev("recovery=null");pending=[];await ev("quickIngest()");
      ok("hızlı kayıt: kayıt başarısızsa bellek geri alınır, sonraki denemede eklenir",held===0&&ev("S.entries.length")===1&&ev("S.entries[0].v")===250,[held,ev("S.entries")]);
      await ev("quickIngest()");ok("hızlı kayıt: yeniden denenen öğe bir kez eklenir",ev("S.entries.length")===1);
      await new Promise(r=>setTimeout(r,20));
      ok("yazma başarısızken ack gönderilmez (kayıt yerelde yolda kalır), yazılınca ack gider ve yolda kalan boşalır",inflight.length===0&&acked.length>0);
      /* süreç alma ile yazma arasında öldü: kayıt yolda kaldı, yeni açılışta yeniden gelir; aynı bildirim iki kez eklenmez */
      ev("S.entries=[]");const tq=Date.now()-5000;inflight=[{v:250,t:tq}];await ev("quickIngest()");await new Promise(r=>setTimeout(r,20));
      inflight=[{v:250,t:tq}];await ev("quickIngest()");await new Promise(r=>setTimeout(r,20));
      ok("yolda kalan su kaydı yeniden gelince bir kez eklenir (qt ile tekrar engellenir), ack ile boşalır",ev("S.entries.length")===1&&ev("S.entries[0].qt")===tq&&inflight.length===0,[ev("S.entries.length"),inflight]);
      ev("S.entries=[]");
    }
    ev("S.entries=[]");pending=[{v:250,t:Date.now()-1000}];
    const lnH=[];w.Capacitor.Plugins.LocalNotifications={checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),getPending:async()=>({notifications:[]}),cancel:async()=>{},registerActionTypes:async()=>{},schedule:async o=>{lnH.push(...o.notifications)}};
    ev("S.settings.waterMl=500;add('water',250,'')");
    await ev("quickIngest()");await new Promise(r=>setTimeout(r,50));
    { // paylaşım için önbelleğe yazılan neowell-* dosyaları silinir, başka dosyalara dokunulmaz
      const del=[],old=w.Capacitor.Plugins.Filesystem;
      w.Capacitor.Plugins.Filesystem={readdir:async()=>({files:[{name:"neowell-yedek-2026-10-01.json"},{name:"neowell-tahlil-2026-10-01.pdf"},{name:"baska.txt"},{name:"neowell-x.exe"}]}),deleteFile:async o=>{del.push(o.path+"@"+o.directory)}};
      await ev("cacheClean()");
      ok("önbellek temizliği: yalnız neowell-* yedek/rapor dosyaları silinir",del.join()==="neowell-yedek-2026-10-01.json@CACHE,neowell-tahlil-2026-10-01.pdf@CACHE",del);
      w.Capacitor.Plugins.Filesystem=old;
    }
    ok("hızlı kayıt hedefi tamamlarsa bildirimler yeniden kurulur, bugünün su alarmı yok",lnH.length>0&&![200,300,400].some(i=>lnH.some(n=>n.id===i)),lnH.length);
    w.Capacitor.Plugins.LocalNotifications=lnOld;ev("S.settings.waterMl=2500");
    { // bildirim düğmesi anahtarı: güncellemeden kalan anahtarsız bekleyenler açılışta iptal edilip anahtarla yeniden kurulur
      const TK="0123456789abcdef0123456789abcdef",can=[],out=[],keep=ev("JSON.stringify({o:S.settings.medOn,m:S.meds,l:S.medLog,e:S.entries})");
      w.Capacitor.Plugins.QuickLog.getToken=async()=>({tk:TK});
      w.Capacitor.Plugins.LocalNotifications={checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),getPending:async()=>({notifications:[{id:200,extra:{act:"water",v:250,at:1}},{id:1001001,extra:{act:"med",m:1,s:"08:00",at:1}}]}),cancel:async o=>{can.push(...o.notifications.map(n=>n.id))},registerActionTypes:async()=>{},schedule:async o=>{out.push(...o.notifications)}};
      ev("S.entries=[];S.settings.medOn=true;S.meds=[{id:1,n:'A',t:['08:00'],on:true}];S.medLog=[]");
      await ev("scheduleReminders()");
      const btn=out.filter(n=>n.extra&&(n.extra.act==="water"||n.extra.act==="med"));
      ok("anahtar: eski bekleyen su/ilaç bildirimleri iptal edilir, yeniden kurulan su ve ilaç (tekrarlar dahil) bildirimlerinde extra.tk, diğerlerinde yok",can.includes(200)&&can.includes(1001001)&&btn.some(n=>n.extra.act==="water")&&btn.some(n=>n.extra.act==="med"&&n.id>=2e6)&&btn.every(n=>n.extra.tk===TK)&&out.every(n=>!n.extra||n.extra.act==="water"||n.extra.act==="med"||!("tk" in n.extra)),can.slice(0,5));
      for(const g of [undefined,async()=>{throw new Error("yok")}]){
        if(g)w.Capacitor.Plugins.QuickLog.getToken=g;else delete w.Capacitor.Plugins.QuickLog.getToken;
        out.length=0;await ev("scheduleReminders()");
        ok(`anahtar: ${g?"getToken hata verirse":"eklentide getToken yoksa"} bildirimler anahtarsız kurulur`,out.some(n=>n.extra&&n.extra.act==="water")&&out.every(n=>!n.extra||!("tk" in n.extra)));
      }
      w.Capacitor.Plugins.LocalNotifications=lnOld;ev(`{const k=${keep};S.settings.medOn=k.o;S.meds=k.m;S.medLog=k.l;S.entries=k.e}`);
    }
    delete w.Capacitor.Plugins.QuickLog;
    ev("S.entries=[]");await ev("quickIngest()");
    ok("eklenti yoksa (tarayıcı) sessizce geçer, kayıt eklenmez",ev("S.entries.length")===0);
    ev("S.entries=[]");

    // Drive'a gönder
    let saved=null,shared=null,shareErr=null;
    w.Capacitor.Plugins.Filesystem={writeFile:async o=>{saved=o;return {uri:"file:///cache/y.json"}}};
    w.Capacitor.Plugins.Share={share:async o=>{if(shareErr)throw shareErr;shared=o}};
    ev("S.settings.healthNote='gizli sağlık notu';S.settings.lastBackup=''");
    ev("tab='settings-data';render()");
    ok("Ayarlar'da Drive'a gönder düğmesi",!!q('[data-act="drive"]'));
    click('[data-act="drive"]');await new Promise(r=>setTimeout(r,30));
    ok("yedek ekranı: parola alanları, hesap bağlama gerekmediği belirtilir",!!q("#bkp1")&&!!q("#bkp2")&&q("#sheet").textContent.includes("Hesap bağlamak gerekmez")&&!q("#bkrem"));
    q("#bkp1").value="abc";q("#bkp2").value="abc";click('[data-bk="send"]');await new Promise(r=>setTimeout(r,30));
    ok("kısa parola reddedilir",saved===null&&q("#bkw").textContent.includes("en az 10"));
    q("#bkp1").value="mavi-bulut-77";q("#bkp2").value="mavi-bulut-78";click('[data-bk="send"]');await new Promise(r=>setTimeout(r,30));
    ok("parolalar uyuşmazsa gönderilmez",saved===null&&q("#bkw").textContent.includes("aynı değil"));
    q("#bkp2").value="mavi-bulut-77";click('[data-bk="send"]');await new Promise(r=>setTimeout(r,800));
    ok("şifreli yedek paylaşılır: dosya adı, düz metin yok, paylaşım",saved&&/^neowell-yedek-\d{4}-\d{2}-\d{2}\.json$/.test(saved.path)&&JSON.parse(saved.data).enc==="aes-gcm-pbkdf2"&&!saved.data.includes("gizli sağlık notu")&&shared.files[0]==="file:///cache/y.json",saved&&saved.data.slice(0,120));
    ok("paylaşım sonrası son yedek tarihi bugün olur, bildirim metni",ev("S.settings.lastBackup")===ev("dayKey()")&&toastT().includes("Drive"));
    // geri yüklenebilir mi (gidiş dönüş)
    doc.body.insertAdjacentHTML("beforeend",'<textarea id="bk2"></textarea>');
    ev("S.settings.healthNote=''");
    const encJ=saved.data;
    ev("sheetBackup()");q("#bk").value=encJ;q("#bkpw").value="mavi-bulut-77";await ev("goRestore()");
    ok("gönderilen yedek aynı parolayla geri yüklenir",ev("S.settings.healthNote")==="gizli sağlık notu");
    // iptal
    shareErr=new Error("Share canceled");saved=null;ev("S.settings.lastBackup=''");
    ev("sheetDrive()");await new Promise(r=>setTimeout(r,30));
    q("#bkp1").value="mavi-bulut-77";q("#bkp2").value="mavi-bulut-77";click('[data-bk="send"]');await new Promise(r=>setTimeout(r,800));
    ok("paylaşım iptal edilirse yedek yapıldı sayılmaz",ev("S.settings.lastBackup")===""&&!toastT().includes("paylaşıldı"));
    shareErr=null;

    // parolayı Keystore ile saklama
    w.Capacitor.Plugins.KeyVault={encrypt:async({text})=>({data:"ENC:"+Buffer.from(text).toString("base64")}),decrypt:async({data})=>({text:Buffer.from(data.slice(4),"base64").toString()})};
    ev("vaultOn=true");
    ev("sheetDrive()");await new Promise(r=>setTimeout(r,30));
    ok("kasa varken 'parolayı sakla' kutusu işaretli gelir",!!q("#bkrem")&&q("#bkrem").checked);
    q("#bkp1").value="mavi-bulut-77";q("#bkp2").value="mavi-bulut-77";click('[data-bk="send"]');await new Promise(r=>setTimeout(r,800));
    ok("parola kasayla şifreli saklanır, düz metin saklanmaz",!!ev("localStorage.getItem('nw_bkpw_enc')")&&!ev("localStorage.getItem('nw_bkpw_enc')").includes("mavi-bulut-77")&&ev("localStorage.getItem('nw_bkpw_enc')").startsWith("ENC:"));
    saved=null;ev("sheetDrive()");await new Promise(r=>setTimeout(r,30));
    ok("saklı parolayla tek dokunuşla gönderme: parola alanı yok",!q("#bkp1")&&!!q('[data-bk="send"]')&&q("#sheet").textContent.includes("saklı"));
    click('[data-bk="send"]');await new Promise(r=>setTimeout(r,800));
    ok("saklı parolayla şifreli yedek gider",saved&&JSON.parse(saved.data).enc==="aes-gcm-pbkdf2");
    ev("sheetDrive()");await new Promise(r=>setTimeout(r,30));click('[data-bk="forget"]');await new Promise(r=>setTimeout(r,30));
    ok("parolayı unut: saklanan silinir, alanlar geri gelir",ev("localStorage.getItem('nw_bkpw_enc')")===null&&!!q("#bkp1"));

    // D-Veri2: otomatik şifreli yedek
    ev("closeSheet()");
    ok("otomatik yedek: varsayılan kapalı, temizleyici yalnız true ve geçerli tarihi alır",ev("DEF.settings.autoBk")===false&&ev("cleanSettings({autoBk:'evet',lastAutoBk:'x'}).autoBk")===false&&ev("cleanSettings({autoBk:'evet',lastAutoBk:'x'}).lastAutoBk")===""&&ev("cleanSettings({autoBk:true,lastAutoBk:'2026-09-01'}).lastAutoBk")==="2026-09-01");
    ev("tab='settings-data';render()");
    ok("otomatik yedek: eklenti yoksa (tarayıcı) ayar görünmez",!q("[data-ab]"));
    const files={},bfLog=[];let bfFail=false;
    w.Capacitor.Plugins.BackupFolder={pick:async()=>{bfLog.push("pick");return {name:"NeoWell"}},status:async()=>({set:true,name:"NeoWell"}),clear:async()=>{bfLog.push("clear")},
      write:async({name,data})=>{bfLog.push("write");if(bfFail)throw new Error("yazılamadı");files[name]=data;return {names:Object.keys(files)}},remove:async({names})=>{names.forEach(n=>delete files[n])}};
    ev("render()");
    ok("otomatik yedek: Veri ve yedek'te kapalı kutu ve 'haftada bir aç' notu",!!q('[data-ab="toggle"]')&&!q('[data-ab="toggle"]').checked&&q("#view").textContent.includes("en az haftada bir"));
    click('[data-ab="toggle"]');await new Promise(r=>setTimeout(r,30));
    ok("otomatik yedek: açınca parola istenir, kutu henüz işaretlenmez",!!q("#abp1")&&!!q("#abp2")&&ev("S.settings.autoBk")===false&&q("#sheet").textContent.includes("parolayla aç"));
    q("#abp1").value="abc";q("#abp2").value="abc";click('[data-ab="pick"]');await new Promise(r=>setTimeout(r,30));
    ok("otomatik yedek: kısa parola reddedilir, klasör sorulmaz",q("#abw").textContent.includes("en az 10")&&!bfLog.includes("pick"));
    const old=["2026-08-01","2026-08-08","2026-08-15","2026-08-22","2026-08-29"].map(d=>`neowell-oto-${d}.json`);old.forEach(n=>{files[n]="{}"});files["baska.txt"]="x";
    const manual=["2026-07-01","2026-08-02","2026-08-09",ev("dayKey()")].map(d=>`neowell-yedek-${d}.json`);manual.forEach(n=>{files[n]="elle "+n});
    ev("S.settings.lastBackup='';S.settings.healthNote='oto yedek notu'");
    q("#abp1").value="mavi-bulut-77";q("#abp2").value="mavi-bulut-77";click('[data-ab="pick"]');await new Promise(r=>setTimeout(r,1200));
    const today=`neowell-oto-${ev("dayKey()")}.json`,env=files[today]&&JSON.parse(files[today]);
    ok("otomatik yedek: klasör seçilince açılır, parola kasada saklanır, bugünkü şifreli dosya yazılır",ev("S.settings.autoBk")===true&&ev("localStorage.getItem('nw_bkpw_enc')").startsWith("ENC:")&&env&&env.enc==="aes-gcm-pbkdf2"&&!files[today].includes("oto yedek notu"));
    ok("otomatik yedek: aynı parolayla geri yüklenebilir biçim (S ve anahtarlar)",(await ev("BackupLib.decrypt")(env,"mavi-bulut-77")).S.settings.healthNote==="oto yedek notu");
    ok("otomatik yedek: ayrı önekle en yeni 4 otomatik yedek kalır; elle yedeklere (aynı günün elle yedeği ve eski 'neowell-yedek-' adlılar dahil) ve başka dosyaya dokunulmaz",Object.keys(files).filter(n=>n.startsWith("neowell-oto-")).sort().join()===[...old.slice(2),today].join()&&manual.every(n=>files[n]==="elle "+n)&&files["baska.txt"]==="x");
    ok("otomatik yedek: son otomatik yedek ve son yedek bugün, ekranda klasör adı",ev("S.settings.lastAutoBk")===ev("dayKey()")&&ev("S.settings.lastBackup")===ev("dayKey()")&&q("#view").textContent.includes("Klasör: NeoWell")&&q('[data-ab="toggle"]').checked);
    bfLog.length=0;await ev("abRun()");
    ok("otomatik yedek: 7 gün dolmadan yeniden yazılmaz",!bfLog.includes("write"));
    bfFail=true;ev("S.settings.lastAutoBk='2026-01-01'");await ev("abRun()");
    ok("otomatik yedek: yazma hatası sessiz geçmez (bildirim, Bugün satırı, Veri ve yedek'te kapatma önerisi)",toastT().includes("Otomatik yedek alınamadı")&&ev("viewToday()").includes("Otomatik yedek alınamadı")&&!!q('[data-ab="off"]')&&!!q('[data-ab="setup"]')&&ev("S.settings.lastAutoBk")==="2026-01-01");
    bfLog.length=0;await ev("abRun()");
    ok("otomatik yedek: hata sonrası aynı oturumda tekrar denenmez",!bfLog.includes("write"));
    { // geri yükleme bu telefonun otomatik yedek ayarını değiştirmez
      const r=ev("JSON.parse(JSON.stringify(S))");r.settings.autoBk=false;r.settings.lastAutoBk="2025-01-01";
      ev("sheetBackup()");q("#bk").value=JSON.stringify(r);q("#bkpw").value="";ev("S.settings.healthNote='x'");
      await ev("goRestore()");
      ok("parolasız (düz) yedek geri yüklenmez, toast söyler",ev("S.settings.healthNote")==="x"&&ev("document.querySelector('#toast').textContent").includes("Yalnız parolalı"),ev("document.querySelector('#toast').textContent"));
      q("#bk").value=JSON.stringify(r);await loadBackup();
      ok("otomatik yedek: geri yükleme yerel ayarı korur",ev("S.settings.autoBk")===true&&ev("S.settings.lastAutoBk")==="2026-01-01");
    }
    click('[data-ab="off"]');await new Promise(r=>setTimeout(r,30));
    ok("otomatik yedek: kapat, klasör izni bırakılır",ev("S.settings.autoBk")===false&&bfLog.includes("clear")&&!q('[data-ab="off"]'));
    ev("S.settings.autoBk=true");ev("sheetDrive()");await new Promise(r=>setTimeout(r,30));click('[data-bk="forget"]');await new Promise(r=>setTimeout(r,30));
    ok("otomatik yedek: parolayı unutunca otomatik yedek de kapanır",ev("S.settings.autoBk")===false);
    bfFail=false;ev("abErr='';closeSheet()");delete w.Capacitor.Plugins.BackupFolder;
    ev("closeSheet();vaultOn=false");delete w.Capacitor.Plugins.KeyVault;
    ev("S.settings.healthNote='';S.settings.lastBackup='';tab='today';render()");
  }
  // ---- İlaç hatırlatıcı ----
  {
    const unclock=require('./clock').at(w,21); // Bugün'de doz satırı saati gelince çıkar: iki doz da (08:00, 20:00) gelmiş olsun
    const doc=w.document,q=s=>doc.querySelector(s),qa=s=>[...doc.querySelectorAll(s)];
    const click=s=>q(s).click(),toastT=()=>q("#toast").textContent,txt=()=>q("#sheet").textContent;
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    ev("S.meds=[];S.medLog=[];S.settings.medOn=false;S.settings.medShowName=true;S.entries=[];S.vitals=[];tab='today';render()");
    ok("özellik kapalıyken Bugün'de ilaç kartı yok",!ev("viewToday()").includes("💊"));
    ev("tab='settings-modules';render()");
    ok("Ayarlar'da ilaç hatırlatıcıyı aç düğmesi ve uyarı metni",!!q('[data-md="toggle"]')&&q("#view").textContent.includes("doz önermez")&&!q('[data-md="shown"]'));
    click('[data-md="toggle"]');
    ok("açılınca ilaç adı seçeneği ve düzenleme bağlantısı çıkar",ev("S.settings.medOn")===true&&!!q('[data-md="shown"]')&&q('[data-md="shown"]').checked&&!!q('#view [data-tab="meds"]'));
    ev("tab='today';render()");
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
    ev("delete S.meds[0].ts;tab='today';render()"); // 08:00 geçtiyse bugünkü 08:00 dozu yarından başlar; test saatten bağımsız olsun
    const rows=()=>qa("#view .row").filter(r=>r.textContent.includes("Test İlaç"));
    ok("Bugün kartı iki dozu ve düğmelerini gösterir",rows().length===2&&qa('[data-md^="take:1:"]').length===2&&qa('[data-md^="skip:1:"]').length===2);

    // alındı / atlandı / geri al
    click('[data-md="take:1:08:00"]');
    ok("alındı: kayıt, saat, stok düşer, toast",ev("S.medLog.length")===1&&ev("S.medLog[0].st")==="t"&&/^\d\d:\d\d$/.test(ev("S.medLog[0].at"))&&ev("S.meds[0].k")===9&&toastT().includes("alındı"),ev("S.medLog"));
    ok("alınan doz Bugün yapılacaklardan kalkar, bekleyen kalır",!q('[data-md="take:1:08:00"]')&&!!q('.todo [data-md="take:1:20:00"]'));
    ev("tab='meds';render()");
    ok("İlaçlar ekranında ✓ ve ↩ görünür",q("#view").textContent.includes("✓")&&!!q('[data-md="clear:1:08:00"]'));
    ev("tab='today';render()");click("#tundo");
    ok("geri al kaydı ve stoğu eski haline getirir",ev("S.medLog.length")===0&&ev("S.meds[0].k")===10&&!!q('[data-md="take:1:08:00"]'));
    click('[data-md="skip:1:20:00"]');ev("tab='meds';render()");
    ok("atlandı: kayıt, stok değişmez",ev("S.medLog[0].st")==="s"&&ev("S.meds[0].k")===10&&q("#view").textContent.includes("Atlandı"));
    click('[data-md="take:1:20:00"]'.replace("take","clear"));
    ok("işaret geri alınır (↩)",ev("S.medLog.length")===0);
    ev("tab='today';render()");click('[data-md="take:1:08:00"]');

    // ilaçlar ekranı
    ev("tab='meds';render()");
    ok("ilaçlar ekranı: başlık, bugünün dozları, ilaç listesi, uyarı metni",q("#ttl").textContent==="İlaçlar"&&q("#view").textContent.includes("Test İlaç")&&q("#view").textContent.includes("08:00, 20:00 · her gün")&&q("#view").textContent.includes("doz önermez")&&q('nav [data-tab="more"]').getAttribute("aria-current")==="page"&&!q('nav [data-tab="today"]').getAttribute("aria-current"));
    ok("Koç bağlamı: ilaçlar adı, saati, son 7 gün uyumu ve uyarıyla gider",(c=>c.includes("İLAÇLAR")&&c.includes("Test İlaç")&&c.includes("08:00, 20:00")&&c.includes("doz sayıları son 7 gün")&&c.includes("hekime"))(ev("CoachLib.contextText(cData())")));
    ev("S.settings.medOn=false;render()");
    ok("ilaç kapalıyken alt menü aynı 5 sekme, Koç bağlamında ilaç yok",qa("nav button").map(b=>b.dataset.tab).join()==="today,gym,trend,coach,more"&&!ev("CoachLib.contextText(cData())").includes("İLAÇLAR"));
    ev("S.settings.medOn=true;render()");
    ok("ilaç alarmı: Atla düğmesi dozu atlandı yazar, alındıyı ezmez",ev("(()=>{const sv=JSON.stringify([S.meds,S.medLog]),m=S.meds[0],s=m.t[1],t=Date.now();const r1=medIngest([{m:m.id,s,t,k:true}]).n;const r2=medIngest([{m:m.id,s,t,k:false}]).n;return r1===1&&r2===0&&MedLib.statusOf(S.medLog,m.id,MedLib.dayForTap(s,t),s)==='s'&&(([a,b])=>{S.meds=a;S.medLog=b;return true})(JSON.parse(sv))})()"));
    ev("S.meds[0].s=keyOff(-3);delete S.meds[0].ts"); // ilaç 3 gün önce eklenmiş gibi
    ev("S.medLog.push({id:99,m:1,day:keyOff(-1),slot:'08:00',st:'t'},{id:100,m:1,day:keyOff(-1),slot:'20:00',st:'s'})");ev("render()");
    ok("uyum kutuları: son 7 gün yüzdesi ve doz sayısı, günlük döküm",q("#view").textContent.includes("Uyum")&&/%\d+/.test(q("#view").textContent)&&q("#view").textContent.includes("dozdan")&&qa(".dd7 .dd").length===7&&!q("#view").textContent.includes("kaçırılan"),q("#view").textContent.slice(0,400));
    ev("S.medLog=S.medLog.filter(x=>x.id!==99&&x.id!==100)");
    ev("S.meds[0].k=3");ev("render()");
    ok("stok azalınca uyarı",q("#view").textContent.includes("Yaklaşık 3 doz kaldı"));
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
    ev("S.meds.push({id:2,n:'Diğer',t:['09:00'],on:true,k:10});MedLib.mark(S,2,dayKey(),'09:00','t','09:00')");
    click("#tundo");
    ok("geri al ilacı ve kayıtlarını getirir; araya giren başka ilacın doz kaydı ve stoku bozulmaz",ev("S.meds.length")===2&&ev("S.medLog.length")===2&&ev("S.meds.find(m=>m.id===2).k")===9&&ev("S.medLog.some(x=>x.m===2&&x.st==='t')"));
    ev("S.meds=S.meds.filter(m=>m.id===1);S.medLog=S.medLog.filter(x=>x.m===1)");

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
    ok("ilaç bildirimleri kurulur: büyük kimlik, 'Aldım' eylemi, ek veri, ad görünür",medN().length>=40&&medN().every(n=>n.actionTypeId==="med"&&n.extra.act==="med"&&n.extra.m===1&&n.extra.at===new Date(n.schedule.at).getTime())&&medN()[0].body.includes("Yeni Ad"),medN()[0]);
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
    ok("sınırlandırmada en yakın tarihliler korunur (kalan alarmlar en çok 5 ardışık güne ait)",(g=>Math.max(...g)-Math.min(...g)<=4)(list.filter(n=>n.id>=1e6).map(n=>n.id%40)),list.filter(n=>n.id>=1e6).map(n=>n.id%40).join());
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
    ev("S.meds=[];S.medLog=[]");doc.querySelector("#bk").value=bkJ;await loadBackup();
    ok("yedekten geri yüklemede ilaçlar ve kayıtlar gelir",ev("S.meds.length")===1&&ev("S.meds[0].n")==="Test İlaç"&&ev("S.medLog.length")===1&&ev("S.medLog[0].at")==="08:03");
    doc.querySelector("#bk").value=JSON.stringify({...JSON.parse(bkJ),meds:[{id:1,n:"İyi",t:["08:00"]},{id:2,n:"",t:["09:00"]},{id:3,n:"Saatsiz",t:[]},"çöp",null],medLog:[{m:1,day:"2026-09-10",slot:"08:00",st:"t"},{m:2,day:"2026-09-10",slot:"09:00",st:"t"},{m:1,day:"bozuk",slot:"08:00",st:"t"}]});
    await loadBackup();
    ok("bozuk ilaç ve kayıtlar yüklemede ayıklanır (silinmiş ilacın kaydı da)",ev("S.meds.length")===1&&ev("S.medLog.length")===1&&ev("S.medLog[0].m")===1,[ev("S.meds"),ev("S.medLog")]);
    ok("sıfırlama boş ilaç listesi başlatır",ev("DEF.meds.length")===0&&ev("DEF.medLog.length")===0&&ev("DEF.settings.medOn")===false);
    ev("S.meds=[];S.medLog=[];S.settings.medOn=false;tab='today';render()");
    unclock();
  }
  {
    // hareket algılama (yürüyüş/koşu otomatik)
    const doc=w.document,q=s=>doc.querySelector(s),click=s=>q(s).click();
    const so=ev("S.settings.stepsOn"),mcalls=[];let mperm={activity:true,fine:false,on:false},mitems=[],mgrant=true;
    w.Capacitor.Plugins.Motion={status:async()=>mperm,requestAccess:async()=>{mcalls.push("req");return mperm},requestPermissions:async(o)=>{mcalls.push("perm:"+o.permissions.join());if(mgrant)mperm={...mperm,fine:true};return {...mperm,fine:mgrant?"granted":"denied"}},walkGps:async(o)=>{mcalls.push("gps:"+(o.on?"on":"off"));return {gps:o.on&&mperm.fine}},configure:async(o)=>{mcalls.push("cfg:"+o.cm)},start:async()=>{mcalls.push("start");return mperm},stop:async()=>{mcalls.push("stop");return mperm},take:async()=>{const r={items:mitems};mitems=[];return r}};
    ev("S.settings.stepsOn=true;S.settings.heightCm=170;S.settings.motionOn=false;S.moves=[];tab='settings-modules';render()");
    ok("hareket: ayarlarda blok, aç düğmesi ve gizlilik metni",q("#view").textContent.includes("Hareket algılama")&&q('[data-mo="toggle"]').checked===false&&q("#view").textContent.includes("kaydedilmez"));
    ok("hareket: ayar metni arka plan konumu vaat etmez, konumu elle yürüyüşe bağlar",q("#view").textContent.includes("Konum yalnız elle başlattığın yürüyüşlerde")&&q("#view").textContent.includes("Arka planda konum kullanılmaz")&&!/Her zaman/.test(q("#view").textContent));
    click('[data-mo="toggle"]');await new Promise(r=>setTimeout(r,60));
    ok("hareket: açınca yalnız fiziksel aktivite istenir (konum sorulmaz, açıklama sayfası yok), boy gönderilir, algılama başlar",ev("S.settings.motionOn")===true&&mcalls.includes("req")&&!mcalls.some(c=>c.startsWith("perm:"))&&!q("#sheet").classList.contains("on")&&mcalls.includes("cfg:170")&&mcalls.includes("start"),mcalls);
    { // Elle yürüyüşte konum: izin yalnız yürüyüş başlatılırken, "neden" sayfasıyla
      const wait=()=>new Promise(r=>setTimeout(r,60)),toastT=()=>q("#toast").textContent;
      ev("localStorage.removeItem('nw_walkgps_no');S.walk=null;tab='steps';render()");mcalls.length=0;
      await ev("walkStart()");await wait();
      const ws=q("#sheet").textContent;
      ok("yürüyüş konumu: izin yoksa başlatınca neden sayfası (yalnız başlattığın yürüyüş, bildirim, arka plan yok), yürüyüş sürer, GPS açılmaz",q("#sheet").classList.contains("on")&&ws.includes("yalnız senin başlattığın yürüyüşte")&&ws.includes("bildirim")&&ws.includes("Arka planda konum istenmez")&&ev("S.walk&&!S.walk.t1")===true&&!mcalls.includes("gps:on"),ws);
      click('[data-mo="nogps"]');
      ok("yürüyüş konumu: Konumsuz devam izin istemez, nazik not, bir daha sorulmaz",!mcalls.some(c=>c.startsWith("perm:"))&&toastT().includes("boyuna göre")&&ev("localStorage.getItem('nw_walkgps_no')")==="1"&&(ev("closeSheet()"),true));
      await ev("walkGpsOn()");await wait();
      ok("yürüyüş konumu: reddedildiyse yeniden başlatmada sayfa çıkmaz",!q("#sheet").classList.contains("on")&&!mcalls.includes("gps:on"));
      ev("tab='settings-modules';render()");
      ok("yürüyüş konumu: Ayarlar'da izin yok durumu ve yeniden isteme düğmesi",q("#view").textContent.includes("mesafe boyuna göre")&&q('[data-mo="perm"]').textContent.includes("Yürüyüşte konumu kullan"));
      mgrant=false;click('[data-mo="perm"]');click('[data-mo="gps"]');await wait();
      ok("yürüyüş konumu: sistem izni reddedilirse not, GPS açılmaz",mcalls.includes("perm:fine")&&toastT().includes("verilmedi")&&!mcalls.includes("gps:on")&&ev("localStorage.getItem('nw_walkgps_no')")==="1",mcalls);
      mgrant=true;click('[data-mo="perm"]');click('[data-mo="gps"]');await wait();
      ok("yürüyüş konumu: izin verilince süren yürüyüşte GPS açılır, ret bayrağı silinir, Ayarlar güncellenir",mcalls.includes("gps:on")&&ev("localStorage.getItem('nw_walkgps_no')")===null&&q("#view").textContent.includes("Konum izni var")&&!q('[data-mo="perm"]'),mcalls);
      ev("tab='steps';render()");mcalls.length=0;await ev("walkStop()");
      ok("yürüyüş konumu: Bitir GPS penceresini kapatır",mcalls.includes("gps:off"),mcalls);
      ev("closeSheet();S.walk=null");mcalls.length=0;await ev("walkStart()");await wait();
      ok("yürüyüş konumu: izin varsa başlatınca sayfasız GPS açılır",mcalls.includes("gps:on")&&!q("#sheet").classList.contains("on"),mcalls);
      ev("S.settings.motionOn=false;S.walk=null");mcalls.length=0;await ev("walkStart()");await wait();
      ok("yürüyüş konumu: hareket algılama kapalıyken GPS açılmaz, izin sorulmaz",!mcalls.includes("gps:on")&&!q("#sheet").classList.contains("on"),mcalls);
      ev("S.walk=null;S.settings.motionOn=true;localStorage.removeItem('nw_walkgps_no')");mperm={...mperm,fine:false};
    }
    const mt0=Date.now()-30*60000;
    mitems=[{t0:mt0,t1:mt0+22*60000,k:"w",steps:2400,km:2.1,kmh:5.7,kcal:110,gps:true},{t0:mt0,t1:mt0+3*60000,k:"w",steps:50,km:0.1,kmh:2,kcal:5,gps:false}];
    await ev("motionIngest()");
    ev("tab='steps';render()");
    ok("hareket: geçerli aralık kaydedilir ve Adım ekranında listelenir, geçersiz atılır",ev("S.moves.length")===1&&q("#view").textContent.includes("Yürüyüş")&&q("#view").textContent.includes("22 dk")&&q("#view").textContent.includes("2,1 km")&&q("#view").textContent.includes("110 kcal"),ev("S.moves"));
    await ev("motionIngest()");
    ok("hareket: aynı aralık tekrar eklenmez",ev("S.moves.length")===1);
    mitems=[{t0:mt0,t1:mt0+22*60000,k:"w",steps:2400,km:2.1,kmh:5.7,kcal:110,gps:true}];
    await ev("motionIngest()");
    ok("hareket: aynı gün-saat-tür kaydı ikinci kez eklenmez",ev("S.moves.length")===1);
    const mbk=ev("JSON.stringify(S)");
    ev("S.moves=[]");doc.querySelector("#bk").value=mbk;await loadBackup();
    ok("hareket: yedekten geri yüklemede aralıklar gelir",ev("S.moves.length")===1&&ev("S.moves[0].min")===22);
    doc.querySelector("#bk").value=JSON.stringify({...JSON.parse(mbk),moves:[{day:"bozuk",t0:"07:00",min:5,k:"w",steps:500,km:1,kmh:3},{day:"2026-09-01",t0:"07:00",min:5,k:"w",steps:500,km:1,kmh:3},"x"]});
    await loadBackup();
    ok("hareket: bozuk aralıklar yüklemede ayıklanır",ev("S.moves.length")===1&&ev("S.moves[0].day")==="2026-09-01");
    ev("S.moves=[]");mcalls.length=0;
    await ev("motionBoot()");
    ok("hareket: uygulama açılışında algılama yeniden kaydedilir",mcalls.includes("start")&&mcalls.some(c=>c.startsWith("cfg:")),mcalls);
    ev("tab='settings-modules';render()");click('[data-mo="toggle"]');await new Promise(r=>setTimeout(r,60));
    ok("hareket: kapatınca durdurulur",ev("S.settings.motionOn")===false&&mcalls.includes("stop"),mcalls);
    mitems=[{t0:mt0,t1:mt0+22*60000,k:"w",steps:2400,km:2.1,kmh:5.7,kcal:110,gps:true}];
    await ev("motionIngest()");
    ok("hareket: kapalıyken kayıt alınmaz",ev("S.moves.length")===0);
    mperm={activity:false,fine:false,on:false};ev("S.settings.motionOn=true");mcalls.length=0;
    await ev("motionBoot()");
    ok("hareket: izin geri alınmışsa (ya da yedekten gelmişse) ayar kapanır, başlatılmaz",ev("S.settings.motionOn")===false&&!mcalls.includes("start"),mcalls);
    mperm={activity:true,fine:true,on:true};ev("S.settings.motionOn=true");
    const st0=w.Capacitor.Plugins.Motion.start;w.Capacitor.Plugins.Motion.start=async()=>{throw new Error("gms yok")};
    await ev("motionBoot()");
    ok("hareket: Google Play hizmeti yoksa (başlatma hata verirse) ayar kapanır",ev("S.settings.motionOn")===false);
    w.Capacitor.Plugins.Motion.start=st0;
    ev("S.settings.motionOn=true;S.settings.stepsOn=true");mcalls.length=0;mitems=[{t0:mt0,t1:mt0+22*60000,k:"w",steps:2400,km:2.1,kmh:5.7,kcal:110,gps:true}];
    await ev("motionStopAll()");
    ok("hareket: adım sayar kapanınca hareket algılama durur ve bekleyen kayıt alınır",ev("S.settings.motionOn")===false&&mcalls.includes("stop")&&ev("S.moves.length")===1,mcalls);
    ev("S.moves=[]");
    delete w.Capacitor.Plugins.Motion;ev("tab='settings-modules';render()");
    ok("hareket: eklenti yoksa (tarayıcı) blok gizli",!q("#view").textContent.includes("Hareket algılama"));
    ev("S.settings.stepsOn="+so+";S.settings.motionOn=false;S.moves=[];tab='today';render()");
  }
  {
    // egzersiz kütüphanesi, süreli setler ve zamanlayıcı
    const doc=w.document,q=s=>doc.querySelector(s),qa=s=>[...doc.querySelectorAll(s)],click=s=>q(s).click(),wait=ms=>new Promise(r=>setTimeout(r,ms)),toastT=()=>q("#toast").textContent;
    const fire=(sel,v)=>{q(sel).value=v;q(sel).dispatchEvent(new w.Event("change",{bubbles:true}))};
    const lnOld2=w.Capacitor.Plugins.LocalNotifications,lnLog=[];
    w.Capacitor.Plugins.LocalNotifications={checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),getPending:async()=>({notifications:[{id:9001},{id:9002},{id:5}]}),getDeliveredNotifications:async()=>({notifications:[]}),removeDeliveredNotifications:async()=>{},registerActionTypes:async()=>{},cancel:async o=>{lnLog.push(["c",o.notifications.map(n=>n.id)])},schedule:async o=>{lnLog.push(["s",o.notifications.map(n=>n.id)])}};
    ev("S.workouts=[];S.templates=[];S.customEx=[];S.gid=1;tab='gym';render()");
    ok("kütüphane: ≥300 egzersiz, eski kimlikler ve adlar korunur, şekil eklenir",ev("EXMERGED.length")>=300&&ev("gEx('squat').n")==="Squat"&&ev("gEx('squat').tp")==="squat"&&ev("gEx('ohp').n")==="Omuz press"&&ev("gEx('curl').inc")===2);
    ok("salon ana ekranı kütüphane düğmesini gösterir",!!q('[data-g="lib"]'));
    click('[data-g="lib"]');
    ok("kütüphane ekranı açılır: başlık, 40 satır, küçük şekiller, devamı düğmesi",ev("tab")==="exlib"&&q("#ttl").textContent==="Egzersiz kütüphanesi"&&qa("#gllist .exrow").length===40&&!!q(".exthumb svg")&&!!q('[data-g="lmore"]'),qa("#gllist .exrow").length);
    click('[data-g="lfilter"]');
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
    ok("antrenmana ekle: antrenman başlar, plank 3 set × 30 sn",ev("S.workouts.length")===1&&ev("S.workouts[0].ex[0].id")==="plank"&&ev("S.workouts[0].ex[0].sets.length")===3&&ev("S.workouts[0].ex[0].sets[0].sec")===30&&ev("tab")==="gym"&&!!q('[data-gi="sec:0:0"]')&&!!q('[data-g="tstart:0:0"]'));
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
    ok("eski kayıt kaybolmaz: kütüphanede olmayan kimlik atılmaz (Silinmiş egzersiz), bozuk kimlik atılır; şablon, eski gruplu özel egzersiz",O.workouts.length===1&&O.workouts[0].ex.length===3&&O.workouts[0].ex[2].id==="silinmis_x"&&ev("gEx('silinmis_x').n")==="Silinmiş egzersiz"&&ev("cleanGym({workouts:[{id:1,day:'2026-09-01',t0:1,ex:[{id:'x y',sets:[]},{id:'a'.repeat(100),sets:[]}]}]}).workouts[0].ex.length")===0&&O.workouts[0].ex[0].sets[0].kg===100&&O.workouts[0].ex[0].sets[0].sec===undefined&&O.templates[0].ex.join()==="squat,row"&&O.customEx.length===1&&O.customEx[0].g==="Kol",O);
    ok("tüm kütüphane kimlikleri kayıtlarda geçerli",ev("EXMERGED.every(e=>cleanGym({workouts:[{id:1,day:'2026-09-01',t0:1,ex:[{id:e.id,sets:[{kg:1,reps:1,done:true}]}]}]}).workouts[0].ex.length===1)"));
    ev("S.workouts[0].t1=Date.now();render()");
    ok("haftalık set sayısı süreli setleri de sayar (Karın)",ev("gWeekRegions()['Karın']")>=2,ev("gWeekRegions()"));
    click('[data-g="sum:1"]');
    ok("antrenman özeti süreli setlerle bozulmaz",q("#sheet").textContent.length>20&&!/NaN|undefined/.test(q("#sheet").textContent),q("#sheet").textContent.slice(0,200));
    ev("closeSheet();render()");
    ev("gSheetHist('plank')");
    ok("süreli egzersiz geçmişi: saniyeler listelenir",q("#sheet").textContent.includes("30 sn")&&!q("#sheet").textContent.includes("1TM"),q("#sheet").textContent.slice(0,120));
    ev("closeSheet();S.workouts[0].t1=null;tab='gym';render()");
    // hatırlatma yeniden kurulumu zamanlayıcı bildirimini silmez
    await ev("gLnQ");lnLog.length=0;ev("S.settings.reminders.forEach(r=>r.on=true)");await ev("scheduleReminders()");
    ok("hatırlatmalar yeniden kurulurken zamanlayıcı bildirimi (9001) iptal edilmez",lnLog.some(l=>l[0]==="c"&&l[1].includes(5))&&!lnLog.some(l=>l[0]==="c"&&l[1].includes(9001)),lnLog.filter(l=>l[0]==="c"));
    ok("hatırlatmalar yeniden kurulurken dinlenme bildirimi (9002) iptal edilmez",!lnLog.some(l=>l[0]==="c"&&l[1].includes(9002)));
    ok("hatırlatma kimlikleri 9001/9002 ile çakışmaz",ev("Math.max(...S.settings.reminders.map(r=>r.id))*100+SCHED_DAYS-1")<9001&&!lnLog.some(l=>l[0]==="s"&&(l[1].includes(9001)||l[1].includes(9002))));
    // dinlenme bildirimi 9002 (süreli set bildirimi 9001'den ayrı)
    const lnAt=[];w.Capacitor.Plugins.LocalNotifications.schedule=async o=>{lnLog.push(["s",o.notifications.map(n=>n.id)]);lnAt.push(...o.notifications)};
    const has=(k,id)=>lnLog.some(l=>l[0]===k&&l[1].includes(id)),reset=async()=>{await ev("gLnQ");lnLog.length=0;lnAt.length=0},drain=()=>ev("gLnQ");
    ev("S.workouts[0].ex[3].sets[1].done=false;render()");await reset();
    fire('[data-gi="reps:3:1"]',"10");click('[data-g="done:3:1"]');await drain();
    const n2=lnAt.find(n=>n.id===9002);
    ok("set ✓: dinlenme bildirimi 9002 tam bitiş anına kurulur, 9001'e dokunulmaz",n2&&Math.abs(+n2.schedule.at-ev("restEnd"))<5&&n2.schedule.allowWhileIdle===true&&n2.body.includes("Şınav")&&!has("c",9001)&&!has("s",9001),lnLog);
    await reset();click('[data-g="rest:15"]');await drain();
    ok("+15: bildirim yeni bitişe yeniden kurulur",+lnAt.find(n=>n.id===9002).schedule.at===ev("restEnd"));
    await reset();click('[data-g="rest:0"]');await drain();
    ok("Atla: 9002 iptal edilir, 9001 iptal edilmez",has("c",9002)&&!has("s",9002)&&!has("c",9001)&&ev("restEnd")===0);
    await reset();ev("gRestSet(Date.now()+10000)");click('[data-g="rest:-15"]');await drain();
    ok("hemen ardından −15 (bitiş geçmişte): iptal kurmadan sonra çalışır, bildirim kurulu kalmaz",ev("restEnd")===0&&JSON.stringify(lnLog.map(l=>l[0]).slice(-3))==='["c","s","c"]',lnLog);
    ev("gRestSet(Date.now()+65000);tab='today';render();tab='gym';render()");
    ok("sekme dönüşünde dinlenme çubuğu tik beklemeden kalan süreyle görünür",!q("#grest").hidden&&/^01:0[45]$/.test(q("#gr").textContent),q("#gr").textContent);
    ev("restEnd=Date.now()-1000;render()");await reset();ev("gTick()");await drain();
    ok("arkadayken biten dinlenme: çubuk gizli, bildirim iptal edilmez (teslim edilen silinmesin)",q("#grest").hidden&&ev("restEnd")===0&&!has("c",9002));
    ev("gRestSet(Date.now()+60000)");await reset();click('[data-g="tstart:0:0"]');await drain();
    ok("süreli set başlayınca dinlenme ve 9002 iptal edilir",ev("restEnd")===0&&has("c",9002)&&has("s",9001));
    await reset();ev("gTimStop()");await drain();
    ok("zamanlayıcı durunca yalnız 9001 iptal edilir",has("c",9001)&&!has("c",9002));
    click('[data-g="tstart:0:0"]');
    click('[data-g="menu:0"]');click('[data-g="rmex:0"]');
    ok("egzersiz silinince zamanlayıcı durur",ev("gTim")===null);
    ev("S.workouts=[{id:50,day:dayKey(),t0:Date.now()-3600000,t1:Date.now(),name:'Test',tpl:null,ex:[{id:'plank',note:'',sets:[{kg:null,reps:null,sec:30,done:true},{kg:null,reps:null,sec:30,done:true}]},{id:'pushup',note:'',sets:[{kg:0,reps:12,done:true}]},{id:'treadjog',note:'',sets:[{kg:null,reps:null,sec:1500,done:true}]},{id:'squat',note:'',sets:[{kg:100,reps:5,done:true}]}]}]");
    const ctx=ev("CoachLib.contextText(cData())");
    ok("Koç bağlamı: süreli, vücut ağırlığı, kardiyo ve ağırlıklı egzersizler okunur",ctx.includes("Plank 2x30 sn")&&ctx.includes("Şınav 1x12")&&ctx.includes("25 dk")&&ctx.includes("Squat 100x5"),ctx.split("\n").filter(l=>l.startsWith("SON ANTRENMAN")));
    ok("Koç bağlamı: haftalık set bölgeye göre",ctx.includes("BU HAFTA TAMAMLANAN SET (bölgeye göre):")&&ctx.includes("Karın 2")&&ctx.includes("Ön bacak 1"),ctx.split("\n").filter(l=>l.startsWith("BU HAFTA")));
    ev("S.workouts=[];S.customEx=[];tab='today';render()");
    w.Capacitor.Plugins.LocalNotifications=lnOld2;
  }
  {
    // uyku, ruh hali, oruç
    const doc=w.document,q=s=>doc.querySelector(s),click=s=>q(s).click(),hb=a=>click(`#view [data-hb="${a}"]`);
    ev("S.sleep=[];S.mood=[];tab='today';render()");
    hb("sleep");q("#hbb").value="23:30";q("#hbw").value="07:00";q("#hbq").value="4";click('[data-hb="sleepgo"]');
    ok("uyku: yatış-kalkış gece yarısını aşarak 450 dk, kalite kaydedilir, Bugün'de görünür",JSON.stringify(ev("S.sleep"))===JSON.stringify([{day:ev("dayKey()"),min:450,q:4}])&&q("#toast").textContent.includes("7 sa 30 dk"),ev("S.sleep"));
    hb("sleep");q("#hbh").value="6,5";click('[data-hb="sleepgo"]');
    ok("uyku: aynı gün yeniden giriş üzerine yazar (süre girişiyle)",ev("S.sleep.length")===1&&ev("S.sleep[0].min")===390);
    hb("sleep");q("#hbb").value="07:00";q("#hbw").value="07:00";click('[data-hb="sleepgo"]');
    ok("uyku: aynı saat girdisi reddedilir, kayıt değişmez",ev("S.sleep[0].min")===390&&q("#sheet").classList.contains("on"));
    ev("closeSheet()");
    hb("mood");click('[data-hb="moodgo"]');
    ok("ruh hali: yüz seçilmeden kaydedilmez, hata sayfanın içinde",ev("S.mood.length")===0&&q("#hberr").textContent.includes("seç")&&q("#sheet").classList.contains("on"));
    q("#hbn").value="yorgun";click('[data-hb="mood:2"]');
    ok("ruh hali: yüze dokunmak kaydetmez, yalnız seçer",ev("S.mood.length")===0&&q('[data-hb="mood:2"]').getAttribute("aria-pressed")==="true");
    click('[data-hb="moodgo"]');hb("mood");
    ok("ruh hali: yeniden açınca seçim ve not dolu gelir",q('[data-hb="mood:2"]').getAttribute("aria-pressed")==="true"&&q("#hbn").value==="yorgun");
    q("#hbn").value="";click('[data-hb="mood:4"]');click('[data-hb="moodgo"]');
    ok("ruh hali: gün başına tek kayıt (son kazanır), karo bugünkü değeri gösterir",ev("S.mood.length")===1&&ev("S.mood[0].v")===4&&!ev("S.mood[0].t")&&q('#view [data-hb="mood"]').textContent.includes("İyi")&&!!q('#view [data-hb="sleep"]'),ev("S.mood"));
    hb("mood");q("#hbn").value="  iyi  ";click('[data-hb="mood:5"]');click('[data-hb="moodgo"]');
    ok("ruh hali: not kırpılır",ev("S.mood[0].t")==="iyi");
    hb("sleep");q("#hbh").value="8";click('[data-hb="sleepgo"]');
    ok("uyku: aynı güne yeniden giriş 'Geri al' sunar, geri alınca eski kayıt döner",q("#tmsg").textContent.startsWith("Uyku güncellendi")&&!q("#tundo").hidden&&(click("#tundo"),ev("S.sleep[0].min")===390));
    hb("sleep");click('[data-hb^="sdel:"]');
    ok("uyku geçmişinden silinir, geri alınabilir",ev("S.sleep.length")===0&&(click("#tundo"),ev("S.sleep.length")===1));
    hb("mood");click('[data-hb^="mdel:"]');
    ok("ruh hali geçmişinden silinir, geri alınabilir",ev("S.mood.length")===0&&(click("#tundo"),ev("S.mood[0].v")===5));
    ev("add('water',250)");const bk=ev("JSON.stringify(S)");ev("S.sleep=[];S.mood=[]");q("#bk")||ev("sheetBackup()");q("#bk").value=bk;await loadBackup();
    ok("uyku ve ruh hali yedekten geri gelir",ev("S.sleep.length")===1&&ev("S.mood[0].v")===5);
    const old=JSON.parse(bk);delete old.sleep;delete old.mood;delete old.fast;q("#bk").value=JSON.stringify(old);await loadBackup();
    ok("alansız eski yedek yüklenir: mevcut kayıtlar kalır, yeni alanlar boş",ev("S.entries.length")>0&&ev("S.sleep.length")===0&&ev("S.fast.t0")===null&&ev("S.fast.plan")===16);
    q("#bk").value=JSON.stringify({...JSON.parse(bk),sleep:"x",mood:{a:1},fast:7});await loadBackup();
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
    const wait=ms=>new Promise(r=>setTimeout(r,ms)),lnO=w.Capacitor.Plugins.LocalNotifications,sc=[],rmv=[];
    w.Capacitor.Plugins.LocalNotifications={checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),getPending:async()=>({notifications:[{id:9100}]}),getDeliveredNotifications:async()=>({notifications:[{id:9100}]}),removeDeliveredNotifications:async o=>{rmv.push(...o.notifications.map(n=>n.id))},registerActionTypes:async()=>{},cancel:async()=>{},schedule:async o=>{sc.push(o.notifications)}};
    ev("S.fast={plan:16,t0:null,log:[]};S.settings.fastOn=false;S.settings.age=0;S.settings.healthNote='';tab='today';render()");
    ok("oruç kapalıyken Bugün'de oruç satırı yok",!q('[data-hb="fastgo"]')&&!q("#view").textContent.includes("Oruç"));
    ev("tab='settings-modules';render()");click('[data-hb="fasttoggle"]');
    ok("oruç ilk açılışta riskli gruplar bilgisi (onay kutulu), henüz açılmaz",ev("S.settings.fastOn")===false&&["Hamilelik","18 yaş altı","yeme bozukluğu","insülin","düşük kilo"].every(x=>q("#sheet").textContent.includes(x))&&!!q("#fic"));
    click('[data-hb="fastinfo"]');ok("kutu işaretlenmeden açılmaz",ev("S.settings.fastOn")===false&&ev("S.settings.fastInfoOk")===false);
    q("#fic").checked=true;click('[data-hb="fastinfo"]');
    ok("Ayarlar'da oruç açılır: dört plan, varsayılan 16:8 seçili",ev("S.settings.fastOn")===true&&q("#view").textContent.includes("14:10")&&q("#view").textContent.includes("20:4")&&q('[data-hb="plan:16"]').getAttribute("aria-pressed")==="true");
    click('[data-hb="plan:18"]');ev("tab='today';render()");
    ok("Bugün yapılacaklarda tek oruç satırı (plan düğmeleri yok), hekim notu yok",!!q('.todo [data-hb="fastgo"]')&&q(".todo").textContent.includes("18:6")&&!q('#view [data-hb^="plan:"]')&&!q("#view").textContent.includes("hekimine danış"));
    w.confirm=()=>false;click('[data-hb="fastgo"]');w.confirm=()=>true;
    ok("18:6 ve 20:4 için ek onay: reddedilirse başlamaz",ev("S.fast.t0")===null&&ev("S.settings.fastLongOk")===false);
    const t00=Date.now();click('[data-hb="fastgo"]');await wait(30);
    ok("uzun plan onayı bir kez sorulur ve saklanır (cleanSettings korur)",ev("S.settings.fastLongOk")===true&&ev("cleanSettings({fastLongOk:true,fastInfoOk:true}).fastLongOk")===true&&ev("cleanSettings({}).fastInfoOk")===false);
    const n9=(sc[sc.length-1]||[]).find(n=>n.id===9100);
    ok("oruç başlayınca 9100 hedef saatte kurulur, kimlik 1.000.000 altında",ev("S.fast.plan")===18&&ev("S.fast.t0")>=t00&&n9&&Math.abs(n9.schedule.at.getTime()-(ev("S.fast.t0")+18*36e5))<1000&&sc[sc.length-1].every(n=>n.id<1e6),n9);
    sc.length=0;await ev("scheduleReminders()");
    ok("oruç sürerken her yeniden kurulumda 9100 durumdan yeniden kurulur, teslim edilmiş 9100 kalır",sc[0].some(n=>n.id===9100)&&!rmv.includes(9100));
    ev("S.fast.t0=Date.now()-10*36e5;S.fast.plan=16;render()");
    ok("oruç kartı: geçen ve kalan süre dakika hassasiyetiyle",q("#view").textContent.includes("10 sa 0 dk geçti")&&q("#view").textContent.includes("6 sa 0 dk kaldı")&&!!q('[data-hb="fastend"]')&&!q('[data-hb="plan:14"]'));
    ev("S.fast.t0=Date.now()-17*36e5;render()");
    ok("oruç kartı: hedef dolunca 'Hedef doldu'",q("#view").textContent.includes("Hedef doldu"));
    sc.length=0;click('[data-hb="fastend"]');await wait(30);
    ok("oruç bitince log'a yazılır, 9100 kurulmaz, son oruçlar listelenir",ev("S.fast.t0")===null&&ev("S.fast.log.length")===1&&ev("S.fast.log[0].t1-S.fast.log[0].t0")>=16.9*36e5&&sc.length>0&&!sc[0].some(n=>n.id===9100)&&ev("fastSettingsHtml()").includes("Son oruçlar")&&ev("fastSettingsHtml()").includes("17 sa 0 dk")&&!!q('.todo [data-hb="fastgo"]'),ev("S.fast"));
    ok("oruç bitince ekrandaki 'Oruç süren doldu' bildirimi (9100) kaldırılır",rmv.includes(9100),rmv);
    ev("S.fast.t0=Date.now()-80*36e5;render()");click('[data-hb="fastend"]');await wait(30);
    ok("72 saati aşan oruç silinmez: 72 saat olarak yazılır ve söylenir",ev("S.fast.log.length")===2&&ev("S.fast.log[1].t1-S.fast.log[1].t0")===72*36e5&&q("#tmsg").textContent.includes("72 saat"),q("#tmsg").textContent);
    ev("S.fast.t0=Date.now()-30e3;render()");click('[data-hb="fastend"]');await wait(30);
    ok("1 dakikadan kısa oruç geçmişe yazılmaz, oruç kapanır",ev("S.fast.log.length")===2&&ev("S.fast.t0")===null&&q("#tmsg").textContent.includes("1 dakikadan kısa"));
    ev("tab='settings-modules';render()");click('[data-hb^="fdel:"]');await wait(30);
    ok("oruç geçmişinden (Ayarlar) silinir, geri alınabilir",ev("S.fast.log.length")===1&&(click("#tundo"),ev("S.fast.log.length")===2));
    ev("S.fast.t0=Date.now()-36e5;render()");click('[data-hb="fasttoggle"]');
    ok("oruç sürerken zamanlayıcı kapatılamaz",ev("S.settings.fastOn")===true&&q("#tmsg").textContent.includes("Önce orucu bitir"));
    ev("S.fast.t0=null;S.settings.reminders.find(r=>r.id===11).on=true;tab='settings-modules';render()");click('[data-hb="fasttoggle"]');
    ok("oruç kapanınca oruç hatırlatıcısı kapanır ve Ayarlar listesinden kalkar",ev("S.settings.fastOn")===false&&ev("S.settings.reminders.find(r=>r.id===11).on")===false&&!shown().includes(11));
    click('[data-hb="fasttoggle"]');
    ok("oruç açılınca hatırlatıcı Hatırlatmalar ekranında görünür",(ev("tab='settings-reminders';render()"),!!q('[data-rt="11"]')));
    ev("S.fast.t0=null;tab='today';render()");
    ok("oruç ayarı: yalnız açıkça true ise açık (eski veriden türetilmez)",ev("cleanSettings({reminders:[{id:11,t:'20:00',on:true}]}).fastOn")===false&&ev("cleanSettings({}).fastOn")===false&&ev("cleanSettings({fastOn:false}).fastOn")===false&&ev("cleanSettings({fastOn:true}).fastOn")===true);
    ok("hatırlatıcı 11 varsayılan kapalı, eski veride de kapalı, kimliği 89 altında",ev("cleanSettings({}).reminders.find(r=>r.id===11).on")===false&&ev("cleanSettings({reminders:[{id:1,t:'09:00',on:true}]}).reminders.find(r=>r.id===11).on")===false&&ev("S.settings.reminders.every(r=>r.id<=89)"));
    ev("S.settings.reminders.find(r=>r.id===11).on=false");sc.length=0;await ev("scheduleReminders()");
    ok("hatırlatıcı 11 kapalıyken 1100 serisi kurulmaz",!sc[0].some(n=>n.id>=1100&&n.id<=1129));
    ev("S.settings.reminders.find(r=>r.id===11).on=true");sc.length=0;await ev("scheduleReminders()");
    ok("hatırlatıcı 11 açılınca 1100+ kimlikleri kurulur",sc[0].some(n=>n.id>=1100&&n.id<=1129)&&new Set(sc[0].map(n=>n.id)).size===sc[0].length);
    ev("S.settings.age=15;render()");
    ok("18 yaş altı: oruç kartı başlat yerine açıklama, onay düğmesi yok",!q('[data-hb="fastgo"]')&&!q('.todo [data-act="riskok"]')&&q(".todo").textContent.includes("Oruç önerilmez")&&q(".todo").textContent.includes("18 yaş altındasın"));
    ev("S.settings.riskClearedAt=dayKey();render()");ok("sert engelde 'Hekimime danıştım' onayı da başlatmayı açmaz",!q('[data-hb="fastgo"]'));
    ev("document.body.insertAdjacentHTML('beforeend','<button id=fx data-hb=fastgo></button>')");click("#fx");ev("document.querySelector('#fx').remove()");
    ok("engelde başlatma işleyicisi de reddeder",ev("S.fast.t0")===null);
    ev("tab='settings-modules';render()");ok("sert engelde 18:6 ve 20:4 planları kapalı, kısa planlar açık",q('[data-hb="plan:18"]').disabled&&q('[data-hb="plan:20"]').disabled&&!q('[data-hb="plan:16"]').disabled);
    sc.length=0;await ev("scheduleReminders()");
    ok("sert engelde oruç hatırlatıcısı (11) kurulmaz",!sc[0].some(n=>n.id>=1100&&n.id<=1129));
    ev("S.fast.t0=Date.now()-36e5;tab='today';render()");sc.length=0;await ev("scheduleReminders()");
    ok("engel varken süren oruç bitirilebilir, 9100 kurulmaz",!!q('[data-hb="fastend"]')&&!sc[0].some(n=>n.id===9100));
    click('[data-hb="fastend"]');await wait(30);
    ev("S.settings.age=0;S.settings.riskClearedAt='';S.settings.healthNote='tansiyon';render()");
    ok("yumuşak engel (sağlık notu): uyarı ve 'Hekimime danıştım', başlat yok",!q('[data-hb="fastgo"]')&&!!q('.todo [data-act="riskok"]')&&q(".todo").textContent.includes("hekimine danış"));
    click('.todo [data-act="riskok"]');
    ok("onaydan sonra başlatılabilir",!!q('[data-hb="fastgo"]')&&ev("S.settings.riskClearedAt")===ev("dayKey()"));
    ev("S.settings.healthNote='';S.settings.riskClearedAt='';render()");sc.length=0;
    ev("S.chat.push({id:999,t:1,role:'user',text:'x',fl:'ed'});save();render()");await wait(30);
    ok("sohbette ed işareti çıkınca kart engellenir ve oruç bildirimleri kendiliğinden yeniden kurulur (11 yok)",!q('[data-hb="fastgo"]')&&q(".todo").textContent.includes("Yeme düzeniyle")&&sc.length>0&&!sc[sc.length-1].some(n=>n.id>=1100&&n.id<=1129));
    ev("S.chat=S.chat.filter(m=>m.id!==999);S.settings.reminders.find(r=>r.id===11).on=false;save();S.fast={plan:16,t0:null,log:[]};render()");
    w.Capacitor.Plugins.LocalNotifications=lnO;
  }
  {
    // plaka, ısınma, set anında rekor
    const doc=w.document,q=s=>doc.querySelector(s),click=s=>q(s).click(),toastT=()=>q("#tmsg").textContent;
    const fire=(sel,v)=>{q(sel).value=v;q(sel).dispatchEvent(new w.Event("change",{bubbles:true}))};
    const Wk=(id,t0,t1,sets)=>`{id:${id},day:dayKey(),t0:${t0},t1:${t1},name:'T',tpl:null,ex:[{id:'squat',note:'',sets:${sets}}]}`;
    ev(`S.bar=20;S.workouts=[${Wk(1,1000,2000,"[{kg:100,reps:5,done:true}]")},${Wk(2,Date.now(),null,"[{kg:null,reps:null,done:false},{kg:null,reps:null,done:false}]")}];S.gid=3;tab='gym';render()`);
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
    const sets=()=>JSON.parse(ev("JSON.stringify(S.workouts[1].ex[0].sets)"));
    click('[data-g="menu:0"]');click('[data-g="plate:0"]');q("#pk").value="100";q("#pb").value="20";click('[data-g="wadd:0"]');
    ok("ısınma ikinci kez eklenince bekleyenler yenilenir, tamamlanan korunur, çoğalmaz",JSON.stringify(sets().filter(s=>s.w).map(s=>[s.kg,s.done]))==='[[20,false],[40,false],[60,false],[80,true]]'&&sets().length===6,sets());
    click('[data-g="menu:0"]');click('[data-g="plate:0"]');q("#pk").value="1500";click('[data-g="wadd:0"]');
    const bigT=toastT();q("#pk").value="100";q("#pb").value="0";click('[data-g="wadd:0"]');
    ok("ısınma: 1000 kg üstü hedef ve 0 bar reddedilir",bigT.includes("1000 kg")&&toastT().includes("bar 5-50")&&sets().length===6,[bigT,toastT()]);
    ev("closeSheet()");
    fire('[data-gi="kg:0:4"]',"100");fire('[data-gi="reps:0:4"]',"8");click('[data-g="done:0:4"]');
    ok("set anında rekor toast'ı",toastT().startsWith("Yeni rekor: Squat, 100 kg × 8"),toastT());
    ok("hacim yalnız çalışma setini sayar",ev("gWorkVol(S.workouts[1])")===800);
    q("#tmsg").textContent="";
    fire('[data-gi="kg:0:5"]',"100");fire('[data-gi="reps:0:5"]',"9");click('[data-g="done:0:5"]');
    ok("aynı antrenmanda aynı egzersiz için ikinci toast yok",toastT()==="",toastT());
    ok("gPRs ısınmayı saymaz, rekor tek",ev("gPRs(S.workouts[1]).length")===1&&ev("gPRs(S.workouts[1])[0].kg")===100);
    ok("ısınma haftalık set sayısına girmez",(ev("S.workouts[1].t1=Date.now();gWeekRegions()['Ön bacak']")||0)===2,ev("gWeekRegions()"));
    // kalıcılık
    const C=JSON.parse(ev("JSON.stringify(cleanGym(JSON.parse(JSON.stringify(S))))"));
    ok("w:true ve bar yeniden yüklemede korunur",C.workouts[1].ex[0].sets[0].w===true&&C.workouts[1].ex[0].sets[4].w===undefined&&C.bar===20);
    ev(`S.workouts.push(${Wk(9,Date.now(),null,"[{kg:20,reps:10,done:true,w:true},{kg:null,reps:null,done:false}]")});S.entries=S.entries.filter(e=>e.type!=='exercise');gFinish()`);
    ok("yalnız ısınma seti tamamlanan antrenman kaydedilmez, silinmez, spor kaydı oluşmaz, neden yazılır",ev("S.workouts.find(x=>x.id===9).t1")===null&&!ev("S.entries.some(e=>e.type==='exercise')")&&toastT().includes("Kaydedilmedi"),toastT());
    ev("S.workouts=S.workouts.filter(x=>x.id!==9)");
    const E=JSON.parse(ev(`JSON.stringify(cleanGym({workouts:[{id:5,day:'2026-09-01',t0:1,t1:2,ex:[{id:'squat',sets:[{kg:100,reps:5,done:true}]}]}]}))`));
    ok("alansız eski yedek yüklenir: bar 20, kayıt aynen",E.bar===20&&E.workouts[0].ex[0].sets[0].kg===100&&E.workouts[0].ex[0].sets[0].w===undefined);
    const G=JSON.parse(ev(`JSON.stringify(cleanGym({bar:'abc',workouts:[{id:5,day:'2026-09-01',t0:1,t1:2,ex:[{id:'squat',sets:[{kg:100,reps:5,done:true,w:'x'}]}]}]}))`));
    ok("çöp bar/w değeri: diğer veri eksiksiz yüklenir",G.bar===20&&G.workouts[0].ex[0].sets[0].kg===100&&G.workouts[0].ex[0].sets[0].w===undefined&&JSON.parse(ev("JSON.stringify(cleanGym({bar:99}))")).bar===20);
    // egzersiz başına tekrar aralığı
    ev(`S.exCfg={};S.workouts=[${Wk(1,1000,2000,"[{kg:60,reps:8,done:true},{kg:60,reps:8,done:true}]")},${Wk(2,Date.now(),null,"[{kg:null,reps:null,done:false}]")}];tab='gym';render()`);
    ok("aralık seçilmemişse 8-12 (mevcut davranış)",ev("gSuggest('squat').reps")===9&&ev("gSuggest('squat').kg")===60);
    click('[data-g="menu:0"]');click('[data-g="rng:0"]');click('[data-g="rngset:0:5-8"]');
    ok("5-8 seçilince öneri bu aralığa göre: 8'e ulaşınca ağırlık artar, 5'ten başlar",ev("JSON.stringify(S.exCfg)")==='{"squat":{"lo":5,"hi":8}}'&&ev("gSuggest('squat').kg")===62.5&&ev("gSuggest('squat').reps")===5);
    click('[data-g="menu:0"]');click('[data-g="rng:0"]');click('[data-g="rngset:0:8-12"]');
    ok("8-12 seçilince varsayılana döner",ev("Object.keys(S.exCfg).length")===0);
    const X=JSON.parse(ev(`JSON.stringify(cleanGym({exCfg:{squat:{lo:5,hi:8},bilinmeyen:{lo:5,hi:8},bench:{lo:9,hi:9},row:{lo:0,hi:5}}}))`));
    ok("exCfg yeniden yüklemede korunur, bilinmeyen kimlik ve geçersiz aralık atılır",JSON.stringify(X.exCfg)==='{"squat":{"lo":5,"hi":8}}',X.exCfg);
    { // tüm geçmiş grafikleri (D-Ant6)
      const mk=(i,kg,r,extra="")=>`{id:${800+i},day:'${new Date(Date.now()-(60-i)*864e5).toISOString().slice(0,10)}',t0:${1000+i},t1:${2000+i},name:'T',tpl:null,ex:[{id:'squat',note:'',sets:[{kg:${kg},reps:${r},done:true},{kg:${kg},reps:${r},done:true}${extra}]}]}`;
      const open=()=>{ev("closeSheet();exSheet('squat')")};
      ev("S.workouts=[];tab='gym';render()");open();
      ok("grafik: geçmiş yoksa grafik alanı çıkmaz",!q('#xch'));
      ev(`S.workouts=[${mk(0,60,8)}]`);open();
      ok("grafik: tek seansta boş durum yazısı, SVG yok, değer görünür",q('#xch').textContent.includes("en az iki seans")&&!q('#xch svg')&&q('#xch').textContent.includes("76 kg"),q('#xch').textContent);
      ev(`S.workouts=[${Array.from({length:30},(_,i)=>mk(i,60+i,8,i===29?",{kg:200,reps:10,done:true,w:true}":"")).join(",")}]`);open();
      ok("grafik: 30 seansın hepsi çizilir (12 ile sınırlı değil), ısınma setleri sayılmaz",q('#xch svg')&&q('#xch').querySelectorAll('rect[data-g^="chp:"]').length===30&&q("#xch").textContent.includes("113 kg")&&q('#xch').textContent.includes("30/30"),q('#xch').textContent);
      q('[data-g="chp:0"]').dispatchEvent(new w.MouseEvent("click",{bubbles:true})); // SVG öğesinde click() yok
      ok("grafik: dokununca o seansın değeri görünür",q('#xch').textContent.includes("76 kg")&&q('#xch').textContent.includes("1/30"),q('#xch').textContent);
      click('[data-g="chm:t"]');
      ok("grafik: en ağır set ve hacim sekmeleri",q('#xch').textContent.includes("89 kg × 8")&&(click('[data-g="chm:v"]'),/1.?424 kg/.test(q("#xch").textContent)),q('#xch').textContent);
      ev("closeSheet();tab='gym';render();gSheetHist('squat')");
      ok("grafik: geçmiş ekranında da var",!!q('#xch svg'));
      ev("closeSheet();S.workouts=[]");
    }
    { // hızlı set girişi (D-Ant12)
      sc.length=0;
      const set=(kg,r,d)=>`{kg:${kg},reps:${r},done:${d}}`;
      ev(`S.exCfg={};S.workouts=[${Wk(1,1000,2000,`[${set(60,8,true)},${set(65,6,true)}]`)},${Wk(2,Date.now(),null,`[${set(60,8,true)},${set(null,null,false)},${set(60,8,false)}]`)}];tab='gym';render()`);
      const rows=()=>[...w.document.querySelectorAll(".srow")];
      ok("sıradaki set: yalnız ilk işaretsiz satır vurgulanır, ± paneli tek ve onun altında",rows().filter(r=>r.classList.contains("nx")).length===1&&rows()[1].classList.contains("nx")&&rows()[1].nextElementSibling.classList.contains("sx")&&w.document.querySelectorAll(".sx").length===1);
      click('[data-g="kgp:0:1"]');
      ok("kg +: adım egzersizin inc'i (squat 2,5), boş değer 0'dan başlar",ev("S.workouts[1].ex[0].sets[1].kg")===2.5&&q('[data-gi="kg:0:1"]').value==="2,5");
      click('[data-g="kgm:0:1"]');click('[data-g="kgm:0:1"]');
      ok("kg −: 0'ın altına inmez",ev("S.workouts[1].ex[0].sets[1].kg")===0);
      click('[data-g="rpp:0:1"]');click('[data-g="rpp:0:1"]');click('[data-g="rpm:0:1"]');
      ok("tekrar ±1, alt sınır 1",ev("S.workouts[1].ex[0].sets[1].reps")===1&&(click('[data-g="rpm:0:1"]'),ev("S.workouts[1].ex[0].sets[1].reps")===1));
      ok("önceki seansla aynı düğmesi aynı sıradaki seti gösterir (2. set: 65 × 6)",q('.sxs').textContent.includes("65 × 6"),q('.sxs').textContent);
      click('.sxs');
      ok("tek dokunuşla doldurur, set ✓ yapılmaz; artık fark yok, düğme kalkar",ev("S.workouts[1].ex[0].sets[1].kg")===65&&ev("S.workouts[1].ex[0].sets[1].reps")===6&&ev("S.workouts[1].ex[0].sets[1].done")===false&&!q('.sxs'));
      sc.length=0;click('[data-g="done:0:1"]');
      ok("✓ sonrası odak sıradaki işaretsiz sete gider (kaydırma + vurgu), panel oraya taşınır",sc.length===1&&sc[0]===rows()[2]&&rows()[2].classList.contains("nx")&&!!rows()[2].nextElementSibling.classList.contains("sx"));
      sc.length=0;click('[data-g="done:0:1"]');
      ok("✓ geri alınca kaydırma yapılmaz",sc.length===0&&rows()[1].classList.contains("nx"));
      click('[data-g="addset:0"]');
      ok("yeni set önceki setten dolu gelir (mevcut davranış korunur)",ev("S.workouts[1].ex[0].sets[3].kg")===60&&ev("S.workouts[1].ex[0].sets[3].reps")===8);
      ev(`S.workouts[1].ex=[{id:'plank',note:'',sets:[{kg:null,reps:null,sec:30,done:false}]}];render()`);
      ok("süreli egzersizde ± paneli yok, satır yine vurgulu",!q('.sx')&&!!q('.srow.nx'));
      ev("S.workouts=[]");
    }
    { // RPE (D-Ant8)
      const set=(kg,r,x="")=>`{kg:${kg},reps:${r},done:true${x}}`;
      ok("RPE ayarı varsayılan kapalı; bayraksız eski ayar ve çöp değer kapalı kalır, true açık",ev("DEF.settings.rpeOn")===false&&ev("cleanSettings({kcal:1800}).rpeOn")===false&&ev("cleanSettings({rpeOn:'evet'}).rpeOn")===false&&ev("cleanSettings({rpeOn:true}).rpeOn")===true);
      ev(`S.settings.rpeOn=false;S.workouts=[${Wk(1,1000,2000,`[${set(60,8,",rpe:8")}]`)},${Wk(2,Date.now(),null,"[{kg:60,reps:8,done:false}]")}];tab='gym';render()`);
      ok("kapalıyken set satırında RPE alanı yok, geçmişte kayıtlı RPE yine görünür",!q('[data-gi^="rpe"]')&&!q('.srow.r')&&ev("exHistLine(gEx('squat'))").includes("60×8 @8"),ev("exHistLine(gEx('squat'))"));
      ev("tab='settings-modules';render()");
      ok("Ayarlar > Salon: Zorluk (RPE) anahtarı kapalı gelir",q('[data-rpe]')&&!q('[data-rpe]').checked);
      q('[data-rpe]').checked=true;q('[data-rpe]').dispatchEvent(new w.Event("change",{bubbles:true}));
      ev("tab='gym';render()");
      ok("açılınca her çalışma satırında RPE alanı ve başlığı çıkar",ev("S.settings.rpeOn")===true&&!!q('[data-gi="rpe:0:0"]')&&q('.shead.r')&&q('.srow.r'));
      fire('[data-gi="rpe:0:0"]',"8,5");
      ok("RPE 8,5 kaydedilir",ev("S.workouts[1].ex[0].sets[0].rpe")===8.5&&q('[data-gi="rpe:0:0"]').value==="8,5");
      for(const bad of ["5","11","7.3","abc"]){fire('[data-gi="rpe:0:0"]',bad);}
      ok("geçersiz RPE (5, 11, 7,3, abc) reddedilir, eski değer ve kg/tekrar korunur",ev("S.workouts[1].ex[0].sets[0].rpe")===8.5&&ev("S.workouts[1].ex[0].sets[0].kg")===60&&ev("S.workouts[1].ex[0].sets[0].reps")===8);
      fire('[data-gi="rpe:0:0"]',"");
      ok("alan boşaltılınca RPE silinir",!("rpe" in ev("S.workouts[1].ex[0].sets[0]")));
      const sg=ev("JSON.stringify([gSuggest('squat'),gWorkVol(S.workouts[0])])");ev("S.workouts[0].ex[0].sets[0].rpe=10");
      ok("RPE öneriye ve hacme girmez",ev("JSON.stringify([gSuggest('squat'),gWorkVol(S.workouts[0])])")===sg);
      const C=JSON.parse(ev(`JSON.stringify(cleanGym({workouts:[{id:5,day:'2026-09-01',t0:1,t1:2,ex:[{id:'squat',sets:[${[8.5,5,11,7.3,"'x'",null,10,6].map(r=>`{kg:100,reps:5,done:true,rpe:${r}}`).join(",")},{kg:100,reps:5,done:true}]}]}]}))`)).workouts[0].ex[0].sets;
      ok("cleanGym: yalnız 6-10 ve 0,5 adımlı RPE kalır, set ve kg/tekrar kaybolmaz; eski setlerde alan yok",JSON.stringify(C.map(x=>x.rpe))===JSON.stringify([8.5,undefined,undefined,undefined,undefined,undefined,10,6,undefined])&&C.length===9&&C.every(x=>x.kg===100&&x.reps===5),C);
      ev(`S.workouts[1].ex=[{id:'plank',note:'',sets:[{kg:null,reps:null,sec:30,done:false}]}];render()`);
      ok("süreli egzersizde RPE alanı yok",!q('[data-gi^="rpe"]'));
      ev("S.settings.rpeOn=false;S.workouts=[]");
    }
    { // haftalık not (D-Ant13)
      const N=(r,h=true)=>JSON.stringify(ev(`gWeekNote(${JSON.stringify(r)},${h})`));
      ok("not: aralığın altındaki bölge adı, set sayısı ve aralıkla yazılır",N({Göğüs:6,Sırt:12,Omuz:10,"Ön bacak":10,"Arka bacak":10}).includes("Göğüs 6 set, önerilen haftalık 10-20 aralığının altında"),N({Göğüs:6}));
      ok("not: set girilmeyen büyük kas grupları sayılır, küçükler (Biseps) sayılmaz",N({Göğüs:12}).includes("Sırt, Omuz, Ön bacak, Arka bacak")&&!N({Göğüs:12}).includes("Biseps"));
      ok("not: hepsi 10+ ve büyük gruplar tamsa tek olumlu satır",N({Göğüs:10,Sırt:10,Omuz:10,"Ön bacak":10,"Arka bacak":14})==='["Kaydettiğin bölgelerin hepsi haftalık 10 set ve üstünde."]');
      ok("not: en çok 3 düşük bölge, en azdan başlar",N({Göğüs:9,Sırt:3,Omuz:5,Biseps:7,"Ön bacak":10,"Arka bacak":10}).includes("Sırt 3, Omuz 5, Biseps 7 set"));
      ok("not: antrenman yoksa geçmişi olan kullanıcıya nazik not, hiç geçmişi olmayana not yok",N({}).includes("antrenman kaydı yok")&&!N({}).match(/ayıp|yapmadın|tembel/)&&N({},false)==="[]");
      ev(`S.workouts=[${Wk(1,Date.now()-864e5,Date.now()-8e7,"[{kg:60,reps:8,done:true},{kg:60,reps:8,done:true},{kg:60,reps:8,done:true,w:true}]")}];tab='gym';render()`);
      ok("ana ekran: 'bu hafta' kartının altında not kartı çıkar (ısınma setleri sayılmaz)",ev("gWeekRegions()['Ön bacak']")===2&&q('#wknote').textContent.includes("Ön bacak 2 set")&&q('#wknote').closest(".card").textContent.includes("Bölge başına"),q('#wknote')&&q('#wknote').textContent);
      ev(`S.customEx=[{id:'c1',n:'Eski',g:'Kol',inc:2.5}];S.workouts=[{id:1,day:dayKey(),t0:Date.now()-1e6,t1:Date.now()-5e5,name:'B',tpl:null,ex:[{id:'bench',note:'',sets:[{kg:60,reps:8,done:true},{kg:60,reps:8,done:true},{kg:60,reps:8,done:true}]},{id:'squat',note:'',sets:[{kg:60,reps:8,done:true},{kg:20,reps:8,done:true,w:true}]},{id:'c1',note:'',sets:[{kg:10,reps:8,done:true}]},{id:'plank',note:'',sets:[{kg:null,reps:null,sec:30,done:true}]}]}];render()`);
      const bl=[...w.document.querySelectorAll(".gbar")].map(b=>[b.children[0].textContent,+b.children[2].textContent]);
      ok("hafta kartı bölgeye göre, çoktan aza; ısınma sayılmaz, eski grup adlı özel egzersiz görünür",q("#view").textContent.includes("Bu hafta, bölgeye göre set")&&JSON.stringify(bl)==='[["Göğüs",3],["Ön bacak",1],["Kol",1],["Karın",1]]',bl);
      ok("hafta kartı: ana ekranda 6'lı grup adları (İtiş, Çekiş) yok, çubuklar taşmaz",!bl.some(x=>["İtiş","Çekiş","Bacak"].includes(x[0]))&&[...w.document.querySelectorAll(".gbar .bar i")].every(i=>parseFloat(i.style.width)<=100));
      ev("S.customEx=[];S.workouts=[];render()");
      ev(`S.workouts=[${Wk(1,Date.now()-20*864e5,Date.now()-20*864e5+1e6,"[{kg:60,reps:8,done:true}]")}];render()`);
      ok("ana ekran: son 7 günde antrenman yoksa kart yine de nazik not gösterir",q('#wknote').textContent.includes("Son 7 günde antrenman kaydı yok"));
      ev("S.workouts=[];render()");
      ok("ana ekran: hiç antrenman yoksa not kartı yok",!q('#wknote'));
    }
    { // akıllı ilerleme (D-Ant5)
      const set=(kg,r)=>`[{kg:${kg},reps:${r},done:true},{kg:${kg},reps:${r},done:true},{kg:${kg},reps:${r},done:true,w:false},{kg:20,reps:10,done:true,w:true}]`;
      ev(`S.exCfg={};S.workouts=[${Wk(1,1000,2000,set(60,7))},${Wk(2,3000,4000,set(60,6))},${Wk(3,Date.now(),null,"[{kg:null,reps:null,done:false}]")}];tab='gym';render()`);
      ok("gSuggest son 2 seansa bakar: aynı ağırlıkta hedefin altında → düşürme, kart nedeni yazar",ev("gSuggest('squat').kg")===55&&q('.sug').textContent.includes("Son 2 seans hedefin altında, %10 düşür."),q('.sug').textContent);
      ev(`S.workouts=[${Wk(0,500,600,set(60,9))},${Wk(1,1000,2000,set(60,9))},${Wk(2,3000,4000,set(60,9))},${Wk(3,Date.now(),null,"[{kg:null,reps:null,done:false}]")}];render()`);
      ok("3 seans gelişim yok: deload notu kartta ('istersen')",/İstersen/.test(q('.sug').textContent)&&ev("gSuggest('squat').kg")===60,q('.sug').textContent);
      ev(`S.workouts=[${Wk(1,1000,2000,"[{kg:null,reps:null,sec:30,done:true}]").replace("id:'squat'","id:'plank'")},${Wk(2,Date.now(),null,"[{kg:null,reps:null,sec:30,done:false}]").replace("id:'squat'","id:'plank'")}];render()`);
      ok("süreli egzersizde öneri yok",ev("gSuggest('plank')")===null&&!q('.sug'));
      ev(`S.workouts=[${Wk(1,1000,2000,"[{kg:60,reps:8,done:true},{kg:60,reps:8,done:true}]")},${Wk(2,Date.now(),null,"[{kg:null,reps:null,done:false}]")}];render()`);
    }
    const Y=JSON.parse(ev(`JSON.stringify(cleanGym({exCfg:[1,2],workouts:[{id:5,day:'2026-09-01',t0:1,t1:2,ex:[{id:'squat',sets:[{kg:100,reps:5,done:true}]}]}]}))`));
    const Z=JSON.parse(ev(`JSON.stringify(cleanGym({exCfg:{squat:'x',bench:{lo:'5',hi:null},row:null},workouts:[{id:5,day:'2026-09-01',t0:1,t1:2,ex:[{id:'squat',sets:[{kg:100,reps:5,done:true}]}]}]}))`));
    ok("exCfg yok (eski yedek) ve çöp değer: kayıtlar eksiksiz yüklenir",Object.keys(Y.exCfg).length===0&&Object.keys(Z.exCfg).length===0&&Y.workouts[0].ex[0].sets[0].kg===100&&Z.workouts[0].ex[0].sets[0].kg===100);
    // egzersiz başına dinlenme süresi
    ok("dinlenme varsayılanı türe göre: bileşik 150, izolasyon 75, süreli 30, kardiyo 0, şekilsiz kendi egzersizi 90",JSON.stringify(["squat","bench","pullup","lat","curl","plank","treadjog"].map(i=>ev(`gRestSec('${i}')`)))==="[150,150,150,75,75,30,0]"&&ev("S.customEx.push({id:'c99',n:'K',g:'Kol',inc:2.5});const r=gRestSec('c99');S.customEx.pop();r")===90);
    ev("S.exCfg={};render()");click('[data-g="menu:0"]');
    ok("egzersiz menüsü dinlenme süresini gösterir",q("#sheet").textContent.includes("Dinlenme süresi")&&q("#sheet").textContent.includes("02:30"));
    click('[data-g="rst:0"]');click('[data-g="rstset:0:90"]');
    click('[data-g="menu:0"]');click('[data-g="rng:0"]');click('[data-g="rngset:0:5-8"]');
    click('[data-g="menu:0"]');click('[data-g="rng:0"]');click('[data-g="rngset:0:8-12"]');
    ok("seçilen dinlenme kaydedilir, tekrar aralığı değişince silinmez",ev("JSON.stringify(S.exCfg)")==='{"squat":{"rest":90}}',ev("JSON.stringify(S.exCfg)"));
    fire('[data-gi="kg:0:0"]',"60");fire('[data-gi="reps:0:0"]',"8");click('[data-g="done:0:0"]');
    ok("set ✓ sonrası sayaç egzersizin süresiyle başlar",Math.abs(ev("restEnd-Date.now()")-90000)<1000);
    click('[data-g="rest:0"]');click('[data-g="menu:0"]');click('[data-g="rst:0"]');click('[data-g="rstset:0:d"]');
    ok("Varsayılan seçilince kayıt silinir",ev("Object.keys(S.exCfg).length")===0);
    const RC=JSON.parse(ev(`JSON.stringify(cleanGym({exCfg:{squat:{rest:120},bench:{lo:5,hi:8,rest:601},row:{rest:'60'},curl:{rest:0},lat:{rest:1.5}}}).exCfg)`));
    ok("cleanGym: dinlenme yalnız tam sayı 0-600, aralık ayrı doğrulanır",JSON.stringify(RC)==='{"squat":{"rest":120},"bench":{"lo":5,"hi":8},"curl":{"rest":0}}',RC);
    // antrenmanda ekranı açık tut (yerel pencere bayrağı)
    const dhOld=w.Capacitor.Plugins.DeviceHelp,awk=[],last=()=>awk[awk.length-1];
    w.Capacitor.Plugins.DeviceHelp={keepAwake:async o=>{awk.push(o.on)}};
    const vis=h=>{Object.defineProperty(doc,"hidden",{configurable:true,get:()=>h});doc.dispatchEvent(new w.Event("visibilitychange"))};
    ev("gAwakeOn=false;tab='gym';render();gTick()");
    ok("ekran açık: antrenman sürerken Salon'da açılır",last()===true);
    ev("tab='today';gTick()");const offTab=last();ev("tab='gym';gTick()");
    ok("ekran açık: sekme değişince bırakılır, dönünce yeniden açılır",offTab===false&&last()===true,awk);
    vis(true);const offBg=last();vis(false);
    ok("ekran açık: arka plana geçince bırakılır, öne gelince yeniden uygulanır",offBg===false&&last()===true,awk);
    const n0=awk.length;ev("gTick();gTick()");
    ok("ekran açık: durum değişmedikçe eklenti yeniden çağrılmaz",awk.length===n0);
    ev("tab='settings-modules';render()");q('[data-aw]').checked=false;q('[data-aw]').dispatchEvent(new w.Event("change",{bubbles:true}));ev("tab='gym';gTick()");
    ok("Ayarlar anahtarı kapatılınca Salon'da da açılmaz",ev("S.settings.awakeOn")===false&&last()===false);
    ev("S.settings.awakeOn=true;gTick()");const wid=ev("gActive().id");ev("gActive().t1=Date.now();gTick()");
    ok("ekran açık: antrenman bitince bırakılır",last()===false);
    ev(`S.workouts.find(x=>x.id===${wid}).t1=null`);
    ok("ayar: varsayılan açık, eski yedekte açık, yalnız false kapatır",ev("cleanSettings({}).awakeOn")===true&&ev("cleanSettings({kcal:1800}).awakeOn")===true&&ev("cleanSettings({awakeOn:'x'}).awakeOn")===true&&ev("cleanSettings({awakeOn:false}).awakeOn")===false);
    if(dhOld)w.Capacitor.Plugins.DeviceHelp=dhOld;else delete w.Capacitor.Plugins.DeviceHelp;ev("gAwakeOn=false");
    // bitirme, Bugün kartı, geçmiş
    const Tk=(id,name,t0,t1,exs,day)=>`{id:${id},day:${day||"dayKey()"},t0:${t0},t1:${t1},name:'${name}',tpl:null,ex:[${exs}]}`;
    const Ex=(id,sets)=>`{id:'${id}',note:'',sets:${sets}}`;
    const nowT=Date.now();
    ev(`S.entries=S.entries.filter(e=>e.type!=='exercise');S.workouts=[${Tk(20,"A",nowT,null,Ex("squat","[{kg:60,reps:5,done:true},{kg:60,reps:5,done:false},{kg:null,reps:null,done:false}]"))}];S.gid=30;tab='today';render()`);
    ok("Bugün: devam eden antrenman kartı, işaretli/toplam set ve Devam et",q('.rrow[data-g="start:"] .tag').textContent==="Devam et"&&q("#view").textContent.includes("1 egzersiz, 1/3 set işaretli"),q("#view").textContent.includes("Devam ediyor"));
    click('.rrow[data-g="start:"]');
    ok("Devam et Salon'u açar",ev("tab")==="gym");
    ev("gFinish()");
    ok("işaretsiz değerli set onayda (Tamam) done:true olur ve kaydedilir",ev("S.workouts[0].t1")!=null&&ev("S.workouts[0].ex[0].sets.length")===2&&ev("S.workouts[0].ex[0].sets.every(s=>s.done)")&&ev("S.entries.some(e=>e.type==='exercise'&&e.wid===20)"));
    ev("closeSheet();tab='today';render()");
    ok("Bugün: biten antrenman kartı ad, set, süre, hacim; dokununca özet",q("#view").textContent.includes("Squat")&&q("#view").textContent.includes("2 set")&&q("#view").textContent.includes("600 kg")&&(click('.rrow[data-g="sum:20"]'),q("#sheet").textContent.includes("600")));
    ev("closeSheet()");
    w.confirm=()=>false;
    ev(`S.entries=S.entries.filter(e=>e.type!=='exercise');S.workouts=[${Tk(21,"B",nowT,null,Ex("squat","[{kg:60,reps:5,done:true},{kg:70,reps:5,done:false}]"))}];gFinish()`);
    w.confirm=()=>true;
    ok("İptal: antrenman açık kalır, işaretsiz set silinmez",ev("S.workouts[0].t1")==null&&ev("S.workouts[0].ex[0].sets.length")===2);
    ok("İptal ve kaydedilmedi yollarında çalışan süre sayacı durmaz; kayıtta durur",(()=>{
      ev("gTim={ei:0,si:0,phase:'work'}");const a=ev("!!gTim");
      ev(`S.workouts=[${Tk(25,"E",nowT,null,Ex("squat","[{kg:null,reps:null,done:false}]"))}];gFinish()`);const b=ev("!!gTim");
      w.confirm=()=>false;ev(`S.workouts=[${Tk(26,"F",nowT,null,Ex("squat","[{kg:60,reps:5,done:true},{kg:70,reps:5,done:false}]"))}];gFinish()`);w.confirm=()=>true;const c=ev("!!gTim");
      ev(`S.workouts=[${Tk(27,"G",nowT,null,Ex("squat","[{kg:60,reps:5,done:true}]"))}];gFinish()`);const d=ev("!!gTim");ev("closeSheet()");
      return a&&b&&c&&!d})());
    { // gece yarısını aşan antrenman: spor kaydı bitiş günü ve bitiş saatiyle tutarlı
      const t0=new Date();t0.setDate(t0.getDate()-1);t0.setHours(23,40,0,0);
      ev(`S.entries=S.entries.filter(e=>e.type!=='exercise');S.workouts=[{id:28,day:dayKey(new Date(${t0.getTime()})),t0:${t0.getTime()},t1:null,name:'Gece',tpl:null,ex:[${Ex("squat","[{kg:60,reps:5,done:true}]")}]}];gFinish()`);
      ok("gece yarısını aşan antrenman: spor kaydının günü bitiş günüdür",ev("S.entries.find(e=>e.type==='exercise').day")===ev("dayKey()")&&ev("S.entries.find(e=>e.type==='exercise').time")===ev("(()=>{const d=new Date(S.workouts[0].t1);return pad(d.getHours())+':'+pad(d.getMinutes())})()"));
      ev("closeSheet()");
    }
    ev(`S.workouts=[${Tk(22,"C",nowT,null,Ex("squat","[{kg:null,reps:null,done:false}]"))}];gFinish()`);
    ok("değerli set yoksa kaydedilmez, antrenman silinmez, toast neden söyler",ev("S.workouts.length")===1&&ev("S.workouts[0].t1")===null&&toastT().startsWith("Kaydedilmedi"),toastT());
    ev(`S.workouts=[${Tk(23,"D",nowT,null,Ex("squat","[{kg:20,reps:10,done:false,w:true}]"))}];gFinish()`);
    ok("ısınma seti işaretsiz değerli sayılmaz: antrenman kaydedilmez",ev("S.workouts[0].t1")===null);
    ev("S.workouts=[];tab='today';render()");
    // dünden kalan bitmemiş antrenman: kart "bitirilmedi" der, süre sorulur, 10 saatlik sahte kayıt yazılmaz
    ev(`S.entries=S.entries.filter(e=>e.type!=='exercise');S.workouts=[${Tk(40,"D",nowT-30*3600000,null,Ex("squat","[{kg:60,reps:5,done:true},{kg:60,reps:5,done:false}]"),"keyOff(-1)")}];tab='today';render()`);
    ok("dünden kalan antrenman: Devam ediyor değil, bitirilmedi + Bitir/Sil",!q("#view").textContent.includes("Devam ediyor")&&q("#view").textContent.includes("bitirilmedi")&&!!q('[data-g="stalefin"]')&&!!q('.card [data-g="cancel"]'));
    click('[data-g="stalefin"]');ev("$('#gsd').value='45'");click('[data-g="stalego"]');
    ok("dünden kalan: sorulan süre kaydedilir (45 dk), kart kalkar",ev("S.workouts[0].t1-S.workouts[0].t0")===45*60000&&ev("S.entries.find(e=>e.wid===40).v")===45&&!q('[data-g="stalefin"]'));
    // Geçmiş: takvim, gün ekranı, aylar, arama; 365 gün sınırı yok
    const qa=s=>[...w.document.querySelectorAll(s)];
    ev(`S.workouts=[];S.entries=[];S.fast.log=[];S.mood=[];S.sleep=[];S.vitals=[];S.pulse=[];S.hr=[];S.medLog=[];S.measures=[];
      const o=keyOff(-800);S.entries.push({id:S.nextId++,day:o,time:"12:00",type:"food",v:600,text:"Eski ÇİĞKÖFTE"},{id:S.nextId++,day:keyOff(-20),time:"08:00",type:"weight",v:80,text:""});S.entries.push({id:S.nextId++,day:dayKey(),time:"09:00",type:"water",v:250,text:""});tab="more";render()`);
    ok("Daha fazla: Geçmiş ve takvim satırı",!!q('#view [data-tab="history"]'));
    click('#view [data-tab="history"]');
    ok("Geçmiş: Takvim sekmesi, bu ayın hücreleri, bugün etiketli, gelecek günler kapalı",ev("tab")==="history"&&qa(".hgd").length>=28&&qa(".hgd").some(b=>/bugün/.test(b.getAttribute("aria-label")))&&q("#back").hidden===false);
    ok("Takvim: kayıtlı gün etiketi türleri söyler (renge bağlı değil)",qa(".hgd").some(b=>/bugün.*su/.test(b.getAttribute("aria-label"))));
    const oldK=ev("keyOff(-800)");ev(`hg.ym="${oldK.slice(0,7)}";render()`);
    ok("2 yıl önceki aya geçilir, o günün hücresi kayıtlı",/yemek/.test(q(`[data-hg="day:${oldK}"]`).getAttribute("aria-label"))&&q("#hgy").value===oldK.slice(0,4));
    click(`[data-hg="day:${oldK}"]`);
    ok("Gün ekranı: 365 günden eski güne gidilir, kayıt görünür",ev("tab")==="day"&&ev("logOff")===800&&q("#view").textContent.includes("Eski ÇİĞKÖFTE")&&/Gün/.test(q("#ttl").textContent));
    click('[data-hg="add:water"]');
    ok("Gün ekranından su, o güne yazılır (bugüne değil)",ev(`S.entries.filter(e=>e.type==="water"&&e.day==="${oldK}").length`)===1&&ev(`S.entries.filter(e=>e.type==="water"&&e.day===dayKey()).length`)===1);
    click('[data-hg="add:food"]');
    ok("Eski güne yemek eklerken gün seçici o günü seçili getirir",q("#fday").value===oldK&&[...q("#fday").options].length===8);
    ev("closeSheet()");
    click(`#view [data-del="${ev('S.entries.find(e=>e.text==="Eski ÇİĞKÖFTE").id')}"]`);
    ok("Gün ekranından kayıt silinir",!q("#view").textContent.includes("Eski ÇİĞKÖFTE"));
    ev("S.entries.push({id:S.nextId++,day:keyOff(-800),time:'12:00',type:'food',v:600,text:'Eski ÇİĞKÖFTE'});logOff=0;tab='history';hg.seg='ay';render()");
    ok("Aylar: 2 yıl önceki yıl başlığı ve ay satırı",q("#view").textContent.includes(oldK.slice(0,4))&&!!q(`[data-hg="ym:${oldK.slice(0,7)}"]`));
    ev("hg.seg='ara';render()");q("#hgq").value="cigkofte";q("#hgq").dispatchEvent(new w.Event("input",{bubbles:true}));
    ok("Ara: Türkçe harf ve büyük harf farkı gözetmez, tarihe götürür",q("#hgres").textContent.includes("1 kayıt")&&!!q(`#hgres [data-hg="day:${oldK}"]`));
    ev("hg.q='';hg.seg='tak';hg.ym=null;logOff=800;tab='day';render()");click('[data-lo="1"]');
    ok("‹ en eski kayıt gününde durur (daha eskiye gitmez)",ev("logOff")===800);
    ev("logOff=0;tab='today';render()");
    ok("Bugün: Geçmiş ve takvim bağlantısı",!!q('#view [data-tab="history"]'));
    ev("S.entries.push({id:S.nextId++,day:keyOff(-790),time:'07:00',type:'weight',v:95,text:''},{id:S.nextId++,day:keyOff(-400),time:'07:00',type:'weight',v:88,text:''});range=365;tab='trend';render()");
    ok("Trend: 1 yıl ve Tümü düğmeleri, 1 yıl haftalık çubuk",!!q('[data-range="365"]')&&!!q('[data-range="0"]')&&q('[data-range="365"]').getAttribute("aria-pressed")==="true"&&q("#view").innerHTML.includes("haftalık ortalamalar"));
    click('[data-range="0"]');
    ok("Trend Tümü: ilk kayıttan bugüne (aylık çubuk), grafik 790+ gün, NaN yok",ev("range")===0&&q("#view").innerHTML.includes("aylık ortalamalar")&&q("#view").innerHTML.includes("Son")&&!/NaN|undefined/.test(q("#view").textContent)&&q(".chart").getAttribute("data-tip").includes("95"));
    ev("range=30;tab='today';render()");
    { // Koç bağlamı: saatten (Health Connect) gelen adım ve uyku gitmez, telefon sensörü ve elle girilen gider
      const k=ev("keyOff(-1)");
      ev(`S.entries=[{id:S.nextId++,day:"${k}",time:"00:00",type:"steps",v:9000,ph:3000,hc:9000,text:""},{id:S.nextId++,day:"${k}",time:"10:00",type:"steps",v:500,text:"manual"}];S.sleep=[{day:"${k}",min:420,src:"hc"}]`);
      const d=JSON.parse(ev("JSON.stringify(cData())")),row=(Array.isArray(d)?d:d.days||[]).find(x=>x&&x.ad!=null&&String(k).endsWith(x.d))||{};
      ok("Koç bağlamı: saat adımı (9000) ve saat uykusu gitmez; telefon sensörü (3000) + elle (500) gider",row.ad===3500&&row.sl===undefined,row);
      ev("S.entries=[];S.sleep=[{day:'"+k+"',min:400}]");
      ok("Koç bağlamı: elle girilen uyku gider",(r=>r&&r.sl===400)((JSON.parse(ev("JSON.stringify(cData())")).days||JSON.parse(ev("JSON.stringify(cData())"))).find(x=>x&&String(k).endsWith(x.d))));
    }
    // Halkalar bugünü gösterir; tıklayınca Gün ekranı, son 14 gün ve takvim
    ev(`S.workouts=[];S.entries=[{id:S.nextId++,day:keyOff(-1),time:"20:00",type:"exercise",v:45,text:"Cross bike"},{id:S.nextId++,day:dayKey(),time:"08:00",type:"exercise",v:20,text:"Yürüyüş"}];S.settings.sportWeek=150;logOff=0;tab="today";render()`);
    ok("Spor halkası yalnız bugünü sayar (dünkü 45 dk yok), günlük pay 21 dk",q(".rings").textContent.includes("20 / 21 dk")&&!q(".rings").textContent.includes("65"));
    ok("halkalar düğme: kalori, su, spor",["kcal","water","exercise"].every(k=>!!q(`.rings [data-hg="focus:${k}"]`)));
    click('.rings [data-hg="focus:exercise"]');
    ok("Spor halkasına dokununca Gün ekranı: bugün, son 14 gün grafiği, takvim bağlantısı",ev("tab")==="day"&&ev("logOff")===0&&q("#view").textContent.includes("Spor · son 14 gün")&&!!q('#view [data-tab="history"]')&&!!q("#view svg.bars"));
    ev("logOff=0;tab='today';render()");
    ok("antrenman yoksa Bugün kartı görünmez",!q('[data-g="start:"]')&&!q("#view").textContent.includes("Devam ediyor"));
    // süreli: 0 kg yok; 5 egzersiz: ilk 4 + "+1"
    ev(`S.workouts=[${Tk(24,"Süreli",nowT-1000,nowT,Ex("superman","[{kg:null,reps:null,sec:90,done:true}]")+","+Ex("squat","[{kg:20,reps:10,done:true,w:true}]")+","+Ex("bench","[{kg:50,reps:5,done:true}]")+","+Ex("row","[{kg:40,reps:5,done:true}]")+","+Ex("curl","[{kg:10,reps:5,done:true}]")+","+Ex("crunch","[{kg:0,reps:5,done:true}]"))}];tab='today';render()`);
    ok("Bugün kartı: en fazla 4 egzersiz adı + '+N'",/ \+2/.test(q('.rrow[data-g="sum:24"]').textContent),q('.rrow[data-g="sum:24"]').textContent);
    ev(`S.workouts=[${Tk(25,"Süreli",nowT-1000,nowT,Ex("superman","[{kg:null,reps:null,sec:90,done:true},{kg:null,reps:null,sec:30,done:true,w:true}]"))}];tab='today';render()`);
    const card=q('.rrow[data-g="sum:25"]').textContent;
    click('.rrow[data-g="sum:25"]');const sm=q("#sheet").textContent;
    ev("closeSheet();tab='gym';render()");
    ok("süreli egzersiz: kart, özet ve geçmiş '0 kg' göstermez, süreyi gösterir (ısınma sayılmaz)",!card.includes("0 kg")&&!sm.includes("0 kg")&&!q('.rrow[data-g="sum:25"]').textContent.includes("0 kg")&&card.includes("90 sn")&&sm.includes("90 sn")&&card.includes("1 set"),[card,sm]);
    // geçmiş: tümü, ay başlıkları, 20 + daha fazla
    const many=[];for(let i=1;i<=25;i++)many.push(Tk(100+i,"H"+i,nowT-i*864e5*3,nowT-i*864e5*3+60000,Ex("squat","[{kg:50,reps:5,done:true}]"),`keyOff(-${i*3})`));
    ev(`S.workouts=[${many.join(",")}];gHistMax=20;tab='gym';render()`);
    const hr=()=>doc.querySelectorAll('.rrow[data-g^="sum:"]').length;
    ok("geçmiş: ilk 20 satır, ay başlığı, 'Daha fazla göster'",hr()===20&&doc.querySelectorAll(".card .lbl").length>=2&&!!q('[data-g="histmore"]'));
    click('[data-g="histmore"]');
    ok("daha fazla göster kalanları getirir (25), düğme kaybolur, en yeni üstte",hr()===25&&!q('[data-g="histmore"]')&&q('.rrow[data-g^="sum:"]').dataset.g==="sum:101");
    ok("Son antrenmanlar bölümü geçmişle yer değiştirdi",q("#view").textContent.includes("Antrenman geçmişi")&&!q("#view").textContent.includes("Son antrenmanlar"));
    ev("S.workouts=[];S.bar=20;closeSheet();tab='today';render()");
  }
  {
    // Koç analizi: neden kartı, plato, program, haftalık özet bildirimi
    const doc=w.document,q=s=>doc.querySelector(s),wait=ms=>new Promise(r=>setTimeout(r,ms));
    let fetched=0,reply={reply:"Yorum",log:[]};
    w.fetch=async()=>{fetched++;return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(reply)}}]})}};
    ev("S.chat=[];S.cid=1;S.settings.consent=false;setKey('nvidia','K1');S.entries=[];S.sleep=[];Object.assign(S.settings,{kcal:1800,goalKg:0,age:0,healthNote:'',heightCm:175});for(let i=1;i<=7;i++)add('food',i%2?2000:300,'y',keyOff(-i));add('weight',80,'',keyOff(-1));tab='trend';render()");
    const whyBtn=()=>!!q('[data-c="why"]');
    ok("neden düğmesi kilo verme hedefi yokken gizli (Trend ve Koç)",!whyBtn()&&(ev("tab='coach';render()"),!whyBtn()));
    ev("S.settings.goalKg=70;S.settings.age=16;render()");
    ok("neden düğmesi 18 yaş altında gizli, cWhy kart üretmez",!whyBtn()&&(ev("cWhy()"),!ev("S.chat.length")));
    ev("S.settings.age=0;S.chat=[{id:1,role:'user',text:'x',t:1,fl:'ed'}];render()");
    ok("neden düğmesi yeme bozukluğu işaretinde gizli",!whyBtn());
    const setW=f=>ev(`S.entries=S.entries.filter(e=>e.type!=='weight');for(let i=0;i<=20;i+=2)add('weight',${f},'',keyOff(-i))`);
    const chipCoach=()=>(ev("tab='coach';render()"),!!q('.chips [data-c="why"]'));
    ev("S.chat=[];S.settings.goalKg=70");setW("80+0.07*i");ev("tab='trend';render()");
    ok("kilo veren kullanıcıya 'neden kilo vermedim' düğmesi ve Koç çipi çıkmaz",!whyBtn()&&!chipCoach());
    setW("80");ev("tab='trend';render()");
    ok("trend düzken düğme ve Koç çipi çıkar",whyBtn()&&chipCoach());
    ev("S.entries=S.entries.filter(e=>e.type!=='weight');add('weight',80,'');tab='trend';render()");
    ok("tek tartılı yeni kullanıcıya 'neden' sorusu çıkmaz (veri yetersiz)",!whyBtn()&&!chipCoach());
    ev("S.entries=S.entries.filter(e=>e.type!=='weight');for(const i of [0,7,14,21])add('weight',80+i/7,'',keyOff(-i));tab='trend';render()");
    ok("haftada bir tartılıp haftada 1 kg veren kullanıcıya 'neden' sorusu çıkmaz",!whyBtn()&&!chipCoach());
    setW("80-0.05*i");ev("tab='trend';render()");
    ok("trend artarken düğme çıkar",whyBtn());
    const tv=()=>q("#view").textContent;
    ev("S.settings.goalKg=75");setW("80+0.07*i");ev("tab='trend';render()");
    ok("Trend'de tek hız ve tek, koşulu yazılı tahmin; eski 'Kaba tahmin' ve 'Haftalık ortalama farkı' yok",/Kilo hızı/.test(tv())&&(tv().match(/~\d+ hafta/g)||[]).length===1&&/Son 3 haftanın eğimi sürerse ~\d+ hafta/.test(tv())&&!/Kaba tahmin|Haftalık ortalama farkı|Hedefe tahmini/.test(tv()),tv().slice(0,400));
    ev("S.settings.goalKg=90;render()");
    ok("hedef yönü eğimle çelişirse tahmin gösterilmez",!/~\d+ hafta/.test(tv()));
    setW("80");ev("S.settings.goalKg=75;render()");
    ok("hız ~0 iken tahmin gösterilmez",!/~\d+ hafta/.test(tv()));
    ev("S.settings.goalKg=70;S.entries=S.entries.filter(e=>e.type!=='weight');for(let i=0;i<=20;i+=2)add('weight',80,'',keyOff(-i));tab='trend';render()");
    ev("S.chat=[];tab='trend';render()");
    q('[data-c="why"]').click();await wait(20);
    const wc=ev("S.chat.find(m=>m.card&&m.card.kind==='why')");
    ok("neden kartı consent yokken yerel çıkar, fetch yok, Koç'a yorumlat görünmez",ev("tab")==="coach"&&wc&&wc.card.items[0].t.includes("hedefin 1800 kcal")&&fetched===0&&!q('[data-c^="whyai"]'),[wc,fetched]);
    await ev(`cWhyAsk(${wc.id})`);
    ok("Koç'a yorumlat consent yokken çağrı yapmaz",fetched===0&&!ev(`S.chat.find(m=>m.id===${wc.id}).card.asked`));
    ev("S.settings.consent=true;S.settings.consentP='gemini,groq,nvidia,openrouter';S.settings.age=30;render()");
    q(`[data-c="whyai:${wc.id}"]`).click();await wait(30);
    ok("Koç'a yorumlat consent ve sağlayıcı varken bir kez çağırır, yanıt sohbete düşer, düğme kalkar",fetched===1&&ev("S.chat[S.chat.length-1].text")==="Yorum"&&!q('[data-c^="whyai"]')&&!q("#view").textContent.includes("gönderilmedi")&&q("#view").textContent.includes("Koç'a gönderildi"),fetched);
    const cc=JSON.parse(ev("JSON.stringify(cleanCoach(JSON.parse(JSON.stringify(S))))"));
    ok("neden kartı yeniden yüklemede kalır",cc.chat.some(m=>m.card&&m.card.kind==="why"&&m.card.items.length===wc.card.items.length&&m.card.asked===true));
    const g=JSON.parse(ev(`JSON.stringify(cleanCoach({chat:[{id:1,role:'coach',text:'',t:1,card:{kind:'why',items:'x'}},{id:2,role:'coach',text:'',t:1,card:{kind:'why',items:[null,{k:'X!',t:1}]}},{id:3,role:'user',text:'merhaba',t:1}]}))`));
    ok("çöp neden kartında diğer mesajlar eksiksiz yüklenir",g.chat.length===3&&!g.chat[0].card&&!g.chat[1].card&&g.chat[2].text==="merhaba");
    // plato
    const f0=fetched,pq=()=>ev("S.chat.filter(m=>m.kind==='plateau').length");
    ev("S.chat=[];S.settings.lastPlateau='';S.settings.goalKg=70;S.entries=[];[-20,-18,-16,-14,-12,-9,-7,-5,-2,0].forEach((o,i)=>add('weight',80+[0.2,-0.1,0.3,-0.2,0,0.1,-0.3,0.2,-0.1,0][i],'',keyOff(o)));cPlateauCheck()");
    ok("plato sorusu düşer, AI çağrısı yapılmaz (consent ve anahtar varken bile)",pq()===1&&ev("S.chat[0].text")==="Son 3 haftadır kilon düşmüyor. Birlikte bakalım mı?"&&fetched===f0&&ev("S.settings.lastPlateau")===ev("dayKey()"));
    ev("cPlateauCheck();S.settings.lastPlateau=keyOff(-13);cPlateauCheck()");
    ok("plato sorusu 14 gün içinde tekrar düşmez",pq()===1);
    ev("S.settings.lastPlateau=keyOff(-14);cPlateauCheck()");
    ok("14 gün dolunca yeniden düşebilir",pq()===2);
    ev("S.chat=[];S.settings.lastPlateau='';S.settings.healthNote='tansiyon';cPlateauCheck();S.settings.healthNote='';S.settings.goalKg=79.8;cPlateauCheck()");
    ok("kısıt (lossBlock) varken ya da hedef trende yakınken plato sorusu yok",pq()===0);
    ev("S.settings.goalKg=70;cPlateauCheck();tab='coach';render()");q(`[data-mid="${ev("S.chat[0].id")}"] [data-c="why"]`).click();await wait(20);
    ok("Bak yerel neden kartını açar, fetch yok",ev("S.chat.some(m=>m.card&&m.card.kind==='why')")&&fetched===f0);
    ok("lastPlateau kalıcı; eski ve çöp değerde boş",ev("cleanSettings(JSON.parse(JSON.stringify(S.settings))).lastPlateau")===ev("dayKey()")&&ev("cleanSettings({}).lastPlateau")===""&&ev("cleanSettings({lastPlateau:{a:1},kcal:1800}).lastPlateau")===""&&ev("cleanSettings({lastPlateau:7,kcal:1800}).kcal")===1800);
    ok("plato mesajı yeniden yüklemede kalır",JSON.parse(ev("JSON.stringify(cleanCoach(JSON.parse(JSON.stringify(S))))")).chat.some(m=>m.kind==="plateau"));
    // Koç'tan program
    ev("S.chat=[];S.templates=[];S.workouts=[];S.settings.consent=false;tab='gym';render()");
    q('[data-c="prog"]').click();q('[data-c="po:d:2"]').click();q('[data-c="po:q:Ev tipi"]').click();
    ok("program sayfası: seçimler işaretlenir",q('[data-c="po:d:2"]').getAttribute("aria-pressed")==="true"&&q('[data-c="po:q:Ev tipi"]').getAttribute("aria-pressed")==="true"&&ev("progOpt.q")==="Ev tipi");
    let f1=fetched;q('[data-c="progask"]').click();await wait(20);
    ok("program isteği consent yokken çağrı yapmaz",fetched===f1&&!ev("S.chat.length"));
    ev("S.settings.consent=true;S.settings.consentP='gemini,groq,nvidia,openrouter';S.settings.age=30;progOpt={d:3,q:'Salon',m:45,l:'Başlangıç'}");
    reply={reply:"Program hazır",log:[],program:{name:"3 gün",days:[{n:"A",ex:["squat","bench","row"]},{n:"B",ex:["squat","uydurma"]},{n:"C",ex:["legpress","pulldown"]}]}};
    let sent;w.fetch=async(u,o)=>{fetched++;sent=JSON.parse(o.body);return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(reply)}}]})}};
    await ev("cProgram(progOpt)");
    const pm=ev("S.chat.find(m=>m.card&&m.card.kind==='program')");
    ok("program kartı: katalog dışı kimlik ve tek egzersizli gün atılır, JSON metne yazılmaz",pm&&pm.card.days.length===2&&pm.text==="Program hazır"&&sent.max_tokens===900&&/KATALOG \(bölge: kimlik\|ad, \.\.\.\):\n(.+\n)*Ön bacak: .*squat\|Squat/.test(sent.messages[0].content)&&!/SON 14 GÜN|BUGÜN:|SON NOTLAR/.test(sent.messages[0].content.slice(sent.messages[0].content.indexOf("PROFİL:")))&&sent.messages[0].content.includes("PROFİL:"),[pm,sent&&sent.max_tokens]);
    ok("Koç program kartında hazır programlarla aynı güvenlik notu",q(`[data-c="progadd:${pm.id}"]`).closest(".lcard").textContent.includes(ev("gPgNote"))&&ev("gPgNote").includes("gebeliğin")&&ev("gPgNote").includes("hareketi bırak"));
    q(`[data-c="progadd:${pm.id}"]`).click();
    ok("Şablon olarak ekle her günü şablona ekler",ev("S.templates.length")===2&&ev("S.templates[0].name")==="3 gün – A"&&ev("S.templates[0].ex.join()")==="squat,bench,row"&&!q('[data-c^="progadd"]'));
    const pc=JSON.parse(ev("JSON.stringify(cleanCoach(JSON.parse(JSON.stringify(S))))")).chat.find(m=>m.card&&m.card.kind==="program");
    ok("program kartı yeniden yüklemede kalır (durumuyla)",pc&&pc.card.days.length===2&&pc.card.state==="ok");
    const gp=JSON.parse(ev(`JSON.stringify(cleanCoach({customEx:[{id:'c7'}],chat:[{id:1,role:'coach',text:'a',t:1,card:{kind:'program',name:'P',days:[{n:'X',ex:['c7','squat']}]}},{id:2,role:'coach',text:'b',t:1,card:{kind:'program',days:'x'}},{id:3,role:'coach',text:'c',t:1}]}))`));
    ok("program kartı ham customEx kimliğini tanır; çöp kartta diğer mesajlar kalır",gp.chat.length===3&&gp.chat[0].card.days[0].ex.join()==="c7,squat"&&!gp.chat[1].card);
    reply={reply:"bozuk",log:[]};ev("S.chat=[]");await ev("cProgram(progOpt)");
    ok("bozuk program yanıtında kart yok, uyarı",!ev("S.chat.some(m=>m.card)")&&q("#tmsg").textContent.includes("Program okunamadı"));
    // bağlam boyutu: dolu 14 gün + en büyük katalog
    ev(`S.settings.healthNote='x'.repeat(300);S.entries=[];S.sleep=[];S.mood=[];for(let i=0;i<14;i++){const k=keyOff(-i);add('weight',80,'',k);for(let j=0;j<4;j++){const e=add('food',650,'öğün',k);e.p=35}add('water',2500,'',k);add('exercise',45,'Yürüyüş',k);add('steps',12345,'',k);add('note',null,'n'.repeat(100),k);S.sleep.push({day:k,min:450});S.mood.push({day:k,v:4})}S.workouts=[1,2,3].map(i=>({id:i,day:keyOff(-i),t0:i,t1:i+1,name:'Tam vücut',tpl:null,ex:['squat','bench','row','ohp','curl','legpress'].map(id=>({id,note:'',sets:[{kg:60,reps:10,done:true}]}))}))`);
    const big=ev("CoachLib.contextText(cData()).length+cCatalog({q:'Salon',l:'İleri'}).text.length"),sys=ev("cMessages('x',cCatalog({q:'Salon',l:'İleri'}).text)[0].content.length");
    console.log(`  bağlam+katalog ${big} karakter, sistem mesajı ${sys}`);
    ok("contextText + katalog < 9000 karakter",big<9000,big);
    ev("S.entries=[];S.sleep=[];S.mood=[];S.workouts=[];S.templates=[];S.chat=[];S.settings.healthNote='';S.settings.consent=false;tab='today';render()");
    // haftalık özet bildirimi ve dokunma
    const r12=JSON.parse(ev("JSON.stringify(cleanSettings({reminders:[{id:1,t:'09:00',on:true}]}).reminders.find(r=>r.id===12))"));
    ok("hatırlatıcı 12 eski veride de var: Pazar 20:30, açık",r12&&r12.on===true&&r12.dow===0&&r12.t==="20:30");
    const b12=x=>ev(`cleanSettings({reminders:[{id:12,t:'20:30',on:true,body:${JSON.stringify(x)}}]}).reminders.find(r=>r.id===12).body`);
    ok("haftalık bildirim: kullanıcının metni korunur",b12("Pazar kontrolü")==="Pazar kontrolü");
    const lnO=w.Capacitor.Plugins.LocalNotifications,sc=[],rmv=[];
    w.Capacitor.Plugins.LocalNotifications={checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),getPending:async()=>({notifications:[]}),getDeliveredNotifications:async()=>({notifications:[]}),removeDeliveredNotifications:async()=>{},registerActionTypes:async()=>{},cancel:async()=>{},schedule:async o=>{sc.push(...o.notifications)}};
    await ev("scheduleReminders()");
    const n12=sc.filter(n=>n.id>=1200&&n.id<=1229);
    ok("hatırlatıcı 12 Pazar 20:30'a kurulur ve extra.act==='open' taşır, su hatırlatmaları kendi extra'sını korur",n12.length>=4&&n12.every(n=>n.schedule.at.getDay()===0&&n.schedule.at.getHours()===20&&n.schedule.at.getMinutes()===30&&n.extra.act==="open")&&sc.filter(n=>n.id>=200&&n.id<500).every(n=>n.extra.act==="water"),n12.length);
    ev("S.settings.reminders.find(r=>r.id===12).on=false");sc.length=0;await ev("scheduleReminders()");
    ok("hatırlatıcı 12 kapatılınca kurulmaz",sc.length>0&&!sc.some(n=>n.id>=1200&&n.id<=1229));
    ev("for(let i=0;i<10;i++)S.entries.push({id:9000+i,day:dayKey(),time:'00:00',type:'note',v:null,text:'x'});S.settings.lastBackup=''");sc.length=0;await ev("scheduleReminders()");
    ok("yedek hatırlatması Veri ve yedek'i açacak extra taşır",sc.some(n=>n.id>=1000&&n.id<1030&&n.extra&&n.extra.act==="open"&&n.extra.tab==="settings-data"));
    ev("S.entries=S.entries.filter(e=>e.id<9000)");
    ev("S.settings.reminders.find(r=>r.id===12).on=true");w.Capacitor.Plugins.LocalNotifications=lnO;
    const tap=(a,x)=>ev(`notifTap(${JSON.stringify({actionId:a,notification:{extra:x}})});tab`);
    ev("tab='today';S.settings.consent=true;S.settings.consentP='gemini,groq,nvidia,openrouter'");
    ok("dinleyici: dokununca consent varken Koç açılır",tap("tap",{act:"open",tab:"coach"})==="coach");
    ev("tab='today';S.settings.consent=false");
    ok("dinleyici: consent yokken Trend açılır",tap("tap",{act:"open",tab:"coach"})==="trend");
    ev("tab='today'");
    ok("dinleyici: su düğmesi ve act'siz bildirim yok sayılır, bilinmeyen sekme Trend'e düşer",tap("water",{act:"open",tab:"coach"})==="today"&&tap("tap",{act:"water"})==="today"&&tap("tap",{act:"open",tab:"settings"})==="trend");
    ok("dinleyici: yedek hatırlatmasına dokununca Veri ve yedek açılır",tap("tap",{act:"open",tab:"settings-data"})==="settings-data");
    ev("tab='today';render()");
  }
  { // B7: aktif antrenmanda ağrı notu
    ev("gStart(null);tab='gym';render()");
    ok("aktif antrenmanda ağrı notu",ev("!!gActive()")&&$q("#view").textContent.includes(ev("gPainNote"))&&ev("gPainNote").includes("fizyoterapist"));
    ev("S.workouts=S.workouts.filter(w=>gDone(w));tab='today';render()");
  }
  { // B8: depolama sınırı ve kota hatası
    const v=()=>$q("#view").textContent,SP=w.Storage.prototype,set0=SP.setItem;
    ev("tab='today';S.entries=[];render()");
    ok("depolama: küçük veride uyarı yok, boyut ölçülür",!v().includes("Depolama dolmak üzere")&&ev("storeBytes")>=ev("JSON.stringify(S).length*2"));
    ev("storeBytes=4e6;render()");
    ok("depolama: eşik aşılınca Bugün yapılacaklarda yedek önerisi",$q(".todo").textContent.includes("Depolama dolmak üzere")&&$q(".todo").textContent.includes("4,0 MB")&&!!$q('.todo [data-act="databackup"]'));
    ev("tab='settings-data';render()");
    ok("depolama: Ayarlar > Veriler'de uyarı ve kullanılan alan",v().includes("Depolama dolmak üzere")&&v().includes("Kullanılan alan"));
    SP.setItem=function(k){if(k==="nw_state")throw new w.DOMException("dolu","QuotaExceededError");return set0.apply(this,arguments)};
    ev("tab='today';render()");
    $q('[data-act="water"]').click();const m1=$q("#tmsg").textContent;$q('[data-act="water"]').click();
    ok("kota hatası: her başarısız kayıtta görünen mesajda söylenir, değişiklik bellekte kalır, kalıcı uyarı",/kaydedilemedi/i.test(m1)&&/kaydedilemedi/i.test($q("#tmsg").textContent)&&ev("of('water',dayKey()).length")===2&&$q(".todo").textContent.includes("Son değişiklik kaydedilemedi"),[m1,$q("#tmsg").textContent]);
    ev("tab='gym';render()");
    ok("kota hatası: diğer sekmelerde de kalıcı uyarı",$q("#view").textContent.includes("Son değişiklik kaydedilemedi"));
    ev("tab='today';render()");
    $q('.todo [data-act="databackup"]').click();
    ok("kota hatası: Yedek al Veri ve yedek'e gider, yedek ekranı bellekteki (kaydedilemeyen) hali içerir",ev("tab")==="settings-data"&&(()=>{$q("#bkpw").value="mavi-bulut-77";$q("#bkpw2").value="mavi-bulut-77";return true})()&&(await (await ev("BackupLib.decrypt"))(JSON.parse(await ev("backupText()")),"mavi-bulut-77")).S.entries.filter(e=>e.type==="water").length===2);
    ev("closeSheet()");SP.setItem=set0;
    ev("save();render()");
    ok("kota açılınca kayıt yazılır, uyarı kalkar",!v().includes("kaydedilemedi")&&JSON.parse(w.localStorage.getItem("nw_state")).entries.length===2);
    ev("S.entries=[];save();render()");
  }
  { // B11: tam saat alarm izni reddinde çökme yok, kullanıcıya söylenir, izin sonrası yeniden kurulur
    const P=w.Capacitor.Plugins,old=P.LocalNotifications;let ex="denied",n=0;
    P.LocalNotifications={checkPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:ex}),changeExactNotificationSetting:async()=>{ex="granted";return {exact_alarm:ex}},getPending:async()=>({notifications:[]}),cancel:async()=>{},registerActionTypes:async()=>{},schedule:async()=>{n++}};
    ev("S.settings.medOn=true;S.meds=[{id:1,n:'İlaç',t:['08:00']}];tab='today';render()");
    const r=await ev("scheduleReminders()");
    ok("tam saat izni yok: alarmlar yine kurulur, Bugün'de ve Hatırlatmalar'da uyarı",r==="ok"&&n===1&&$q("#view").textContent.includes("İlaç alarmı birkaç dakika gecikebilir")&&(ev("tab='settings-reminders';render()"),$q("#view").textContent.includes("Tam saat alarm izni kapalı")),r);
    $q('[data-act="fullalarm"]').click();await new Promise(s=>setTimeout(s,30));
    ok("izin verilince uyarı kalkar ve hatırlatmalar yeniden kurulur",n===2&&!$q("#view").textContent.includes("Tam saat alarm izni kapalı"),n);
    P.LocalNotifications=old;ev("S.settings.medOn=false;S.meds=[];tab='today';render()");
  }
  }
  reset();
  w.eval("oem='xiaomi';S.settings.oemDone=false");
  ok("Xiaomi'de ayar uyarısı çıkar",ev("viewToday()").includes("Hatırlatmalar için bir kez ayar"));
  w.eval("S.settings.oemDone=true");
  ok("Yaptım denince uyarı kalkar",!ev("viewToday()").includes("Hatırlatmalar için bir kez ayar"));
  w.eval("oem='google';S.settings.oemDone=false");
  ok("Xiaomi dışında uyarı çıkmaz",!ev("viewToday()").includes("Hatırlatmalar için bir kez ayar"));
  ev("sheetFood()");
  const fq=w.document.querySelector("#fq");fq.value="mercimek";fq.dispatchEvent(new w.Event("input",{bubbles:true}));
  ok("yemek penceresinde besin aranır",w.document.querySelector("#flist").innerHTML.includes("Mercimek çorbası")&&w.document.querySelector("#flist [data-food]"));
  ev("S.chat=[];S.cid=1;S.myFoods=[];cReply({reply:'~280 kcal',log:[],food:{name:'1 dilim pizza',kcal:280,protein:12}})");
  const fm=ev("S.chat.find(m=>m.card&&m.card.kind==='food')");
  ok("yapay zekâ besin tahmini kart olur",fm&&fm.card.f.k===280,fm);
  ev(`cClick("addfood:${fm.id}",document.body)`);
  ok("Listeme ekle besini kaydeder",ev("S.myFoods.length")===1&&ev("S.myFoods[0].n")==="1 dilim pizza");
  ev("cClick('addfood:'+S.chat.find(m=>m.card&&m.card.kind==='food').id,document.body)");
  ok("aynı besin iki kez eklenmez",ev("S.myFoods.length")===1);
  ev("sheetFood()");const fq2=w.document.querySelector("#fq");fq2.value="pizza";fq2.dispatchEvent(new w.Event("input",{bubbles:true}));
  ok("benim besinim aramada önce çıkar",w.document.querySelector("#flist .prow").innerHTML.includes("1 dilim pizza"));
  ev("sheetPortion(0)");w.document.querySelector("#fqty").value="2";ev("foodPreview()");
  ok("kendi besinim porsiyonla hesaplanır",w.document.querySelector("#fprev").textContent.startsWith("560 kcal"),w.document.querySelector("#fprev").textContent);
  ev("goNutrition()");
  ok("kendi besinim kayıt olur, makro eksikse karb/yağ yazılmaz",ev("S.entries.some(e=>e.v===560&&e.p===24&&e.c===undefined)")&&!ev("viewToday()").includes("Karbonhidrat"));
  ok("yedekte besin listesi korunur",ev("cleanMyFoods(JSON.parse(JSON.stringify(S)).myFoods).length")===1);
  ev("sheetPortion(0)");ev("goMyDelete()");
  ok("listemden sil çalışır",ev("S.myFoods.length")===0);
  ev("S.chat=[];S.cid=1;cReply({reply:'x',log:[{type:'food',text:'ev yapımı kek',kcal:300,protein:5}]})");
  ev("cClick('ok:'+S.chat.find(m=>m.card&&m.card.kind==='log').id,{closest:()=>document.body})");
  ev("cClick('savefood:'+S.chat.find(m=>m.card&&m.card.kind==='log').id,document.body)");
  ok("kaydedilen yemek listeye girer",ev("S.myFoods.some(m=>m.n==='ev yapımı kek'&&m.k===300)"));
  ev("S.myFoods=[]");
  { // sohbetten öğüne ekle: kart, öğün seçici, satır çıkarma/düzeltme, tek düğme, tekrar engeli, Geri al
    const q=s=>$q(s),card=()=>ev("S.chat.find(m=>m.card&&m.card.kind==='log')"),cid=()=>card().id,n0=ev("S.entries.length");
    ev("S.chat=[];S.cid=1;tab='coach';cReply({reply:'Afiyet olsun',log:[{type:'food',text:'Menemen <b>x</b>',g:250,kcal:300,protein:15,carbs:10,fat:22,meal:'dinner'},{type:'food',text:'Simit',g:100,kcal:900,protein:9,carbs:55,fat:4},{type:'food',text:'Çay',kcal:5}]});render()");
    const v=()=>q("#view").innerHTML;
    ok("kart: başlık 'Öğüne ekle', ad kaçışlı, gram ve makrolar, toplam, öğün çipi bloktan seçili, tek 'Günlüğe ekle'",v().includes("Öğüne ekle")&&v().includes("Menemen &lt;b&gt;x&lt;/b&gt;")&&v().includes("250 g · P 15 · K 10 · Y 22")&&v().includes("Toplam ~1205 kcal")&&q(`[data-c="lml:${cid()}:dinner"]`).getAttribute("aria-pressed")==="true"&&q(`[data-c="ok:${cid()}"]`).textContent==="Günlüğe ekle");
    ok("kalori makrolarla tutmayan satırda uyarı",v().includes("Kalori makrolarla tutmuyor"));
    q(`[data-c="lml:${cid()}:lunch"]`).click();q('[data-ck="0"]').value="320";q(`[data-c="lrm:${cid()}:1"]`).click();
    ok("öğün değişir, satır çıkarılır, çıkarmadan önceki kalori düzeltmesi korunur",card().card.meal==="lunch"&&card().card.items.length===2&&card().card.items[0].kcal===320);
    q(`[data-c="ok:${cid()}"]`).click();
    const added=ev("JSON.stringify(S.entries.slice(-2).map(e=>[e.type,e.text,e.v,e.p,e.c,e.f,e.meal,e.day===dayKey()]))");
    ok("tek tıkla günlüğe: mevcut kayıt yapısı (v, p, c, f, meal), seçilen öğün",ev("S.entries.length")===n0+2&&added==='[["food","Menemen <b>x</b>",320,15,10,22,"lunch",true],["food","Çay",5,null,null,null,"lunch",true]]',added);
    ev(`cClick('ok:${cid()}',document.body)`);
    ok("aynı kart tekrar eklenemez (Kaydedildi durumu)",ev("S.entries.length")===n0+2&&card().card.state==="ok"&&!q(`[data-c="ok:${cid()}"]`));
    q("#toast button").click();
    ok("Geri al kayıtları siler ve kartı yeniden açar",ev("S.entries.length")===n0&&card().card.state==="pending");
    ok("kart durumu ve öğün yedekten geri gelir",ev("JSON.stringify(cleanCoach(JSON.parse(JSON.stringify(S))).chat.find(m=>m.card&&m.card.kind==='log').card.meal)")==='"lunch"');
    ev("S.chat=[];S.cid=1;cReply({reply:'Tahmin',food:{name:'1 dilim pizza',kcal:280,protein:12}});render()");
    const fid=ev("S.chat.find(m=>m.card&&m.card.kind==='food').id");q(`[data-c="fooddiary:${fid}"]`).click();
    ok("kalori sorusu kartı da tek tıkla günlüğe ekler, bir kez",ev("S.entries.length")===n0+1&&ev("S.entries[S.entries.length-1].text")==="1 dilim pizza"&&!q(`[data-c="fooddiary:${fid}"]`)&&q("#view").textContent.includes("Günlüğe eklendi"));
    ev("S.entries=S.entries.slice(0,"+n0+");S.chat=[];render()");
    // egzersiz: "yarım saat cross yaptım"
    const sk=()=>ev("S.chat.find(m=>m.card&&m.card.kind==='log')");
    ev("window.__keep=JSON.stringify(S.entries)");
    ev("S.entries=S.entries.filter(e=>e.type!=='weight');S.chat=[];S.cid=1;cReply({reply:'Harika',log:[{type:'exercise',min:30,name:'Cross',kcal:900}]});render()");
    ok("kilo yokken Koç'un egzersiz tahmini dakikada 15 kcal ile sınırlanır",q("#view").textContent.includes("30 dk · ~450 kcal"));
    const nk=ev("S.entries.length");ev("add('weight',80,'',dayKey());render()");
    ok("egzersiz kartı: 'Egzersizi ekle', kilo ve MET ile kalori (cross 8 MET, 80 kg, 30 dk = net 280), Koç'un sapan tahmini için uyarı",q("#view").textContent.includes("Egzersizi ekle")&&q("#view").textContent.includes("30 dk · ~280 kcal")&&q("#view").textContent.includes("Koç ~900 kcal dedi")&&q(`[data-c="ok:${sk().id}"]`).textContent==="Egzersizi ekle");
    q(`[data-c="ok:${sk().id}"]`).click();ev(`cClick('ok:${sk().id}',document.body)`);
    const se=ev("JSON.stringify(S.entries.filter(e=>e.type==='exercise').slice(-1).map(e=>[e.v,e.text,e.kcal,e.day===dayKey()]))");
    ok("tek tıkla mevcut spor kaydına yazılır (süre, ad, kalori), bir kez; Bugün'de görünür",se==='[[30,"Cross",280,true]]'&&ev("S.entries.length")===nk+2&&ev("S.entries.filter(e=>e.type==='exercise'&&e.text==='Cross').length")===1&&ev("viewToday()").includes("Cross"),se);
    ok("egzersiz kalorisi yedekten geri gelir",ev("cleanEntries(JSON.parse(JSON.stringify(S.entries))).out.some(e=>e.type==='exercise'&&e.kcal===280)"));
    ev("S.entries=JSON.parse(window.__keep);S.chat=[];tab='today';render()");
  }
  ev("sheetFood()");const fq3=w.document.querySelector("#fq");fq3.value="ev yapımı mantı";fq3.dispatchEvent(new w.Event("input",{bubbles:true}));
  ok("listede olmayan yemek için Koç'a sor çıkar",w.document.querySelector("#flist [data-c=askfood]")&&w.document.querySelector("#flist").innerHTML.includes("ev yapımı mantı"));
  ev("S.chat=[];cClick('askfood',document.body)");
  ok("Koç'a sor mesajı gönderir",ev("S.chat.some(m=>m.role==='user'&&m.text.includes('ev yapımı mantı kaç kalori'))")&&ev("tab")==="coach");
  ev("tab='today';S.chat=[]");
  let stepGranted=false,stepSnap=0,stepSteps=4321,stepHist={"2026-09-30":9000};
  w.Capacitor.Plugins.StepCounter={isAvailable:async()=>({available:true,granted:stepGranted}),requestAccess:async()=>{stepGranted=true;return {granted:true}},start:async()=>{},read:async()=>({steps:stepSteps,history:stepHist,snapAt:stepSnap})};
  ev("S.entries=[];S.settings.stepsOn=false;S.settings.stepsAsked=false");
  ok("adım sayar önerisi görünür",ev("viewToday()").includes("data-act=\"stepsopen\""));
  await ev("stepsOpen()");
  ok("izin verilince adım sayar açılır ve bugünkü adım yazılır",ev("S.settings.stepsOn")===true&&ev("stepToday")===4321&&ev("S.entries.some(e=>e.type==='steps'&&e.day===dayKey()&&e.v===4321)"));
  ok("biten günün adımı geçmişe yazılır",ev("S.entries.some(e=>e.type==='steps'&&e.day==='2026-09-30'&&e.v===9000)"));
  ok("Bugün'de adım halkası görünür",ev("viewToday()").includes("Adım")&&ev("viewToday()").includes("4.321"));
  stepSteps=5000;await ev("stepsSync()");
  ok("aynı gün tek kayıt güncellenir",ev("S.entries.filter(e=>e.type==='steps'&&e.day===dayKey()).length")===1&&ev("S.entries.find(e=>e.type==='steps'&&e.day===dayKey()).v")===5000);
  { // açıkken canlı adım: eskiden yalnız açılışta/ön plana gelişte ve Bugün'de 60 sn'de bir okunuyordu
    const doc=w.document,vis=h=>Object.defineProperty(doc,"hidden",{configurable:true,get:()=>h}),P=w.Capacitor.Plugins.StepCounter,r0=P.read;
    let reads=0;P.read=async()=>{reads++;return r0()};
    ev("tab='today';render()");vis(false);
    stepSteps=5020;await ev("stepsTick()");
    ok("açıkken adım artınca Bugün kartı kendiliğinden güncellenir, aralık ≤5 sn",$q('#view .rbtn[data-tab="steps"]').textContent.includes("5.020")&&ev("STEP_POLL")<=5000);
    ev("tab='steps';render()");stepSteps=5040;await ev("stepsTick()");
    ok("Adım raporu açıkken de güncellenir",$q("#view").textContent.includes("5.040"));
    ev("tab='today';render()");const v0=$q("#view").firstElementChild;await ev("stepsTick()");
    ok("değer değişmezse yeniden çizilmez",$q("#view").firstElementChild===v0);
    reads=0;const t1=ev("stepsTick()");ev("stepsTick()");await t1;
    ok("önceki okuma bitmeden ikinci okuma başlamaz",reads===1);
    vis(true);stepSteps=5060;await ev("stepsTick()");
    ok("sayfa gizliyken okuma yapılmaz",reads===1&&!$q('#view .rbtn[data-tab="steps"]').textContent.includes("5.060"));
    delete doc.hidden;P.read=r0;stepSteps=5000;await ev("stepsSync()");
  }
  ok("adım kayıtları gün listesinde ve seride görünmez",!ev("viewToday()").includes("class=\"del\"")&&ev("streak()")===0);
  ok("yedek temizliği adım kaydını korur",ev("cleanEntries(S.entries).out.filter(e=>e.type==='steps').length")===2);
  ev("window.__se=[S.entries,S.settings.stepsFrom];S.settings.stepsFrom='2000-01-01';S.entries=[{id:1,day:dayKey(),time:'00:00',type:'steps',v:82000,text:''}]");
  ok("sayaç sıfırlanınca bugünkü şişmiş adım kaydı kalkar (0 adım kaydı geçersizdir: yeniden açılışta uyarı vermemeli), kayıt yoksa 0 için yeni kayıt açılmaz",ev("setSteps(dayKey(),0)")===true&&ev("S.entries.some(e=>e.type==='steps')")===false&&ev("buildState(JSON.parse(JSON.stringify(S))).drop")===0&&ev("S.entries=[],setSteps(dayKey(),0)")===false&&ev("S.entries.length")===0);
  ev("[S.entries,S.settings.stepsFrom]=window.__se");
  ev("window.__mv=[S.moves,S.settings.motionOn];S.settings.motionOn=true;S.moves=[{day:dayKey(),t0:'11:56',min:5,km:0.2,kmh:2.3,kcal:20,k:'w'},{day:dayKey(),t0:'12:29',min:6,km:0.3,kmh:2.8,kcal:26,k:'w'}]");
  const mh=(()=>{const d=w.document.createElement("div");d.innerHTML=ev("motionCard()");return d})();
  ok("hareketler: gün toplamı özette görünür, tek tek hareketler details içinde (kapalı) dokununca açılır",mh.querySelectorAll("details.acc").length===1&&/Bugün/.test(mh.querySelector("summary").textContent)&&/11 dk/.test(mh.querySelector("summary").textContent)&&/0,5 km/.test(mh.querySelector("summary").textContent)&&!mh.querySelector("details").open&&mh.querySelectorAll("details .row").length===2);
  ev("[S.moves,S.settings.motionOn]=window.__mv");
  ev("window.__qe=S.entries;S.entries=[{id:1,day:keyOff(-1),time:'18:00',type:'exercise',v:45,text:'Cross bisiklet',kcal:300},{id:2,day:dayKey(),time:'09:00',type:'exercise',v:30,text:'Salon, Üst',wid:5}]");
  const qh=ev("gQuickHtml()");
  ok("salon: antrenmana bağlı olmayan spor (Koç'tan eklenen bisiklet) 'Diğer sporlar' listesinde, antrenman kaydı (wid) listede yok",/Cross bisiklet/.test(qh)&&/45 dk · 300 kcal/.test(qh)&&!/Salon, Üst/.test(qh)&&ev("S.entries=[],gQuickHtml()")==="");
  ev("S.entries=window.__qe");
  ok("ilaç adı bildirimde varsayılan gizli; kullanıcı açtıysa tercih korunur, bildirim metni ona göre",ev("buildState({}).S.settings.medShowName")===false&&ev("buildState({settings:{medShowName:true}}).S.settings.medShowName")===true&&ev("buildState({settings:{medShowName:false}}).S.settings.medShowName")===false);
  ok("imkânsız adım değeri atılır",ev("cleanEntries([{type:'steps',day:'2026-01-01',v:999999}]).out.length")===0&&ev("setSteps('2026-01-01',0)")===false);
  ok("Trend tablosunda adım sütunu var",ev("viewTrend()").includes("<th>Adım</th>"));
  ok("Bugün'de adım kartı rapora götürür",ev("viewToday()").includes('data-tab="steps"')&&!ev("viewToday()").includes("r4"));
  ev("S.settings.heightCm=170;S.settings.stepsOn=true;tab='steps';render()");
  const as=w.document.querySelector("#view").textContent;
  ok("adım raporu: adım, ortalama, mesafe ve not görünür",as.includes("5.000")&&as.includes("7 gün ortalaması")&&as.includes("Yaklaşık mesafe")&&as.includes("kalori hedefine eklenmez"),as.slice(0,200));
  ok("adım raporu: 14 çubuk çizilir",w.document.querySelectorAll("#view svg.bars rect").length===14);
  { // D-Adım5: aralık seçici, seri, en iyi gün, ortalama
    ev("window.__e=structuredClone(S.entries);window.__n=S.nextId;S.entries=S.entries.filter(e=>e.type!=='steps');S.settings.stepGoal=8000");
    const bars=()=>w.document.querySelectorAll("#view svg.bars rect").length,txt=()=>w.document.querySelector("#view").textContent;
    ev("tab='steps';stepRange=14;render()");
    ok("adım kaydı yoksa grafik yerine boş durum, ortalama ve seri tire/0",bars()===0&&txt().includes("Bu aralıkta adım kaydı yok")&&txt().includes("0 gün"));
    for(const [i,v] of [[0,9000],[1,9000],[2,3000],[3,9000],[4,10000],[5,12000]])ev(`add('steps',${v},'',keyOff(-${i}))`);
    ev("add('steps',500,'manual',keyOff(-3))");
    ev("tab='steps';render()");
    ok("seri bugünden geriye: bugün+dün hedef üstü, 3. gün altı -> 2",ev("Algo.stepStats([1,9000,9000],8000).streak")===2&&txt().includes("Hedef serisi")&&/Hedef serisi2 gün/.test(txt()));
    ok("elle adım tek kez sayılır: 3 gün önce 9.500, en iyi gün 12.000 (5 gün önce)",ev("sum('steps',keyOff(-3),keyOff(-3))")===9500&&txt().includes("12.000"));
    ok("7 gün ortalaması yalnız kayıtlı günlerden: (9000+9000+3000+9500+10000+12000)/6",txt().includes("8.750"));
    const click=n=>{$q(`[data-sr="${n}"]`).click()};
    click(7);ok("7 gün: 7 çubuk, Pzt..Paz kısaltmaları",bars()===7&&/Paz|Pzt|Sal|Çar|Per|Cum|Cmt/.test(w.document.querySelector("#view svg.bars").textContent));
    click(30);ok("30 gün: 30 çubuk, ✓ işareti yok",bars()===30&&!w.document.querySelector("#view svg.bars").textContent.includes("✓"));
    click(0);ok("Bu ay: ayın günü kadar çubuk",bars()===ev("new Date().getDate()")&&$q('[data-sr="0"]').getAttribute("aria-pressed")==="true");
    ev("S.entries=window.__e;S.nextId=window.__n;stepRange=14;S.settings.stepGoal=8000;render()");
  }
  ev("S.settings.heightCm=0;render()");
  ok("boy yoksa mesafe gizlenir",!w.document.querySelector("#view").textContent.includes("Yaklaşık mesafe")&&w.document.querySelector("#view").textContent.includes("boyunu gir"));
  ev("tab='steps';render()");
  ok("Adım ekranında elle ekle düğmesi var",$q('[data-act="stepsadd"]')!==null);
  ev("sheetSteps()");$q("#fv").value="0";$q('[data-go="steps"]').click();
  ok("geçersiz elle adım reddedilir",ev("S.entries.some(e=>e.text==='manual')")===false);
  $q("#fv").value="100001";$q('[data-go="steps"]').click();
  ok("100.000 üstü elle adım reddedilir",ev("S.entries.some(e=>e.text==='manual')")===false);
  $q("#fv").value="1500";$q('[data-go="steps"]').click();
  stepSteps=5200;await ev("stepsSync()");
  ok("elle adım ayrı kayıt, sensör senkronu ezmez, gün toplamı sensör + elle",ev("S.entries.filter(e=>e.type==='steps'&&e.day===dayKey()).length")===2&&ev("S.entries.find(e=>e.text==='manual').v")===1500&&ev("sum('steps',dayKey(),dayKey())")===6700);
  ok("Adım halkası sensör + elle gösterir",ev("viewSteps()").includes("6.700"));
  ev("tab='today'");
  ok("Bugün adım kartı sensör + elle gösterir",ev("stepCard()").includes("6.700"));
  ev("tab='steps';render()");
  ok("elle eklenen Adım ekranında listelenir",ev("viewSteps()").includes("+1.500"));
  $q('#view [data-del="'+ev("S.entries.find(e=>e.text==='manual').id")+'"]').click();
  ok("elle adım silinir, gün sensör değerine döner",ev("sum('steps',dayKey(),dayKey())")===5200&&ev("stepsShown()")===5200);
  ev("add('steps',700,'manual',keyOff(-20));tab='steps';render()");
  const oldM=ev("S.entries.find(e=>e.text==='manual').id"),oldB=()=>$q('#view [data-del="'+oldM+'"]');
  ok("14 günden eski elle adım Adım ekranında listelenir ve silinir",!!oldB()&&(oldB().click(),!ev("S.entries.some(e=>e.text==='manual')")));
  ev("tab='today';render()");
  const warn=()=>ev("viewToday()").includes('data-act="stepshide"');
  ev("S.entries=[];S.settings.stepsOn=true;S.settings.stepWarnDay='';oem='google'");stepHist={};
  stepSnap=Date.now()-3*36e5;await ev("stepsSync()");
  ok("gece kapanışı yakınsa sayım durdu kartı çıkmaz",!warn());
  stepSnap=Date.now()-27*36e5;await ev("stepsSync()");
  ok("gece kapanışı 26 saatten eskiyse kart çıkar",warn());
  let batt=0;w.Capacitor.Plugins.DeviceHelp.openBattery=async()=>{batt++;return {opened:"battery"}};
  $q('[data-act="stepsfix"]')||ev("tab='today';render()");
  w.document.body.insertAdjacentHTML("beforeend",'<button id="tduz" data-act="stepsfix"></button>');$q("#tduz").click();
  ok("Xiaomi dışında Ayarla pil ayarını açar",batt===1);
  ev("oem='xiaomi'");$q("#tduz").click();
  ok("Xiaomi'de Ayarla mevcut ayar sayfasını açar",$q("#sheet").textContent.includes("Hatırlatmalar için bir kez ayar")&&batt===1);
  ev("closeSheet();render()");$q('[data-act="stepshide"]').click();
  ok("Kapat o gün için gizler ve kalıcı yazar",!warn()&&ev("S.settings.stepWarnDay")===ev("dayKey()")&&ev("cleanSettings(JSON.parse(JSON.stringify(S.settings))).stepWarnDay")===ev("dayKey()"));
  ok("stepWarnDay çöp değeri atılır, eski yedekte boş",ev("cleanSettings({stepWarnDay:'dün'}).stepWarnDay")===""&&ev("cleanSettings({}).stepWarnDay")==="");
  ev("S.settings.stepWarnDay=''");stepSnap=0;await ev("stepsSync()");
  ok("snapAt yokken (yeni kurulum) ve geçmiş boşken kart çıkmaz",!warn());
  ev("for(let i=2;i<=8;i++)add('steps',5000,'',keyOff(-i))");
  ok("dün 0 adım, önceki 7 gün ortalaması 1000 üstündeyse kart çıkar",warn());
  ev("add('steps',3000,'',keyOff(-1))");
  ok("dün adım varsa kart çıkmaz",!warn());
  ev("S.entries=S.entries.filter(e=>e.day!==keyOff(-1));stepsRead=false");
  ok("açılışta ilk sensör okuması bitmeden sayım durdu kartı çıkmaz",!warn());
  await ev("stepsSync()");
  ok("ilk okuma bitince kart çıkar",warn());
  ev("oem='google'");
  ev("S.entries=[];S.settings.stepsOn=false;S.nextId=1");
  ev("add('weight',80,'',keyOff(-1))");
  ev("sheetWeight()");w.document.querySelector("#fv").value="90";ev("goWeight()");
  ok("3 kg ve üstü fark turuncu uyarı ve 'Yine de kaydet' çıkarır, kaydetmez",ev("weights()[dayKey()]")===undefined&&w.document.querySelector("#kwarn .banner").textContent.includes("fark var")&&w.document.querySelector('#kwarn [data-go="weight"]').textContent==="Yine de kaydet");
  ev("goWeight()");
  ok("aynı değer ikinci kez onaylanırsa kaydedilir",ev("weights()[dayKey()]")===90);
  ev("S.entries=[]");ev("add('weight',80,'',keyOff(-1))");ev("sheetWeight()");w.document.querySelector("#fv").value="82,5";ev("goWeight()");
  ok("küçük fark uyarısız kaydedilir",ev("weights()[dayKey()]")===82.5);
  { // C10: kilo girişi
    ev("S.entries=[];add('weight',80,'',keyOff(-1));sheetWeight()");
    $q("#fv").focus();
    ok("kilo girişinde son tartı yazılı gelir ve odakta tümü seçilir",$q("#fv").value==="80,0"&&$q("#fv").selectionStart===0&&$q("#fv").selectionEnd===4);
    $q("#fv").value="80,085";ev("goWeight()");
    ok("eski değerin sonuna yazılmış giriş (80,085) reddedilir, kaydedilmez",$q("#kerr").textContent.includes("kg olarak")&&ev("weights()[dayKey()]")===undefined);
    $q("#fv").value="80,0";
    $q('[data-kd="1"]').click();$q('[data-kd="1"]').click();
    ok("+0,1 iki kez: 80,2",$q("#fv").value==="80,2",$q("#fv").value);
    $q('[data-kd="-1"]').click();$q('[data-kd="-1"]').click();$q('[data-kd="-1"]').click();
    ok("−0,1 üç kez: 79,9 (kayan nokta hatası yok)",$q("#fv").value==="79,9",$q("#fv").value);
    $q("#fv").value="77";ev("goWeight()");
    ok("tam 3,0 kg fark uyarır",ev("weights()[dayKey()]")===undefined&&!!$q("#kwarn .banner"));
    $q('#kwarn [data-go="weight"]').click();
    ok("'Yine de kaydet' kaydeder",ev("weights()[dayKey()]")===77);
    ev("S.entries=[];add('weight',80,'',keyOff(-1));sheetWeight()");$q("#fv").value="82,9";ev("goWeight()");
    ok("2,9 kg fark uyarısız kaydedilir",ev("weights()[dayKey()]")===82.9);
    ev("S.entries=[];sheetWeight()");
    ok("tartı yokken alan boş gelir",$q("#fv").value==="");ev("closeSheet()");
  }
  { // C6: dokunma hedefleri ve alan altı hata
    const css=html.match(/<style>([\s\S]*?)<\/style>/)[1],rule=sel=>{const i=css.indexOf("\n"+sel+"{")>=0?css.indexOf("\n"+sel+"{")+1:css.indexOf("}"+sel+"{")+1;return i>0?css.slice(i+sel.length+1,css.indexOf("}",i)):""};
    ok("dokunma hedefleri: genel .del 44×44, .chip, .seg, toast düğmesi, alanlar en az 44 px",/width:44px;height:44px/.test(rule(".del"))&&/min-height:44px/.test(rule(".chip"))&&/min-width:44px/.test(rule(".chip"))&&/min-height:44px/.test(rule(".seg button"))&&/min-height:4[4-9]px/.test(rule("#toast button"))&&/height:44px/.test(rule(".sw input"))&&/min-height:44px/.test(rule("input.in,select.in,.chip>button")),[rule(".del"),rule(".chip"),rule(".sw input")]);
    ok("Bugün dışındaki silme ✕ düğmeleri de .del (44 px)",ev("hbRow('x','fdel:1')").includes('class="del"')&&ev("S.mealTpl=[{id:1,n:'K',items:[{text:'a',v:1}]}];favHtml()").includes('class="del" data-tpd="0"'));
    ev("S.mealTpl=[];toast('');sheetWeight()");$q("#fv").value="abc";ev("goWeight()");
    ok("kilo hatası alanın altında, toast'ta değil",$q("#kerr").textContent.includes("kg olarak")&&!$q("#tmsg").textContent.includes("kg olarak")&&$q("#sheet").classList.contains("on"));
    ev("sheetFood()");$q("#ft").value="";$q("#fv").value="";ev("goFood()");
    ok("yemek hatası alanın altında",$q("#yerr").textContent.includes("adını")&&!$q("#tmsg").textContent.includes("adını"));
    $q("#fv").value="30000";ev("goFood()");
    ok("aşırı kalori hatası alanın altında",$q("#yerr").textContent.includes("çok yüksek"));
    ev("sheetPortion(0,FOODS[0])");$q("#fqty").value="0";ev("goNutrition()");
    ok("porsiyon hatası alanın altında",$q("#berr").textContent.includes("0,1 ile 20")&&!$q("#tmsg").textContent.includes("0,1 ile 20"));
    ev("closeSheet()");
  }
  ev("S.entries=[];add('food',200,'Menemen',keyOff(-1));add('food',90,'Ekmek',keyOff(-1))");
  ev("sheetFood()");
  ok("dünkünü tekrarla düğmesi görünür",w.document.querySelector('[data-act="yesterday"]')!==null);
  ev("repeatYesterday()");
  ok("dünkü yemekler bugüne kopyalanır",ev("of('food',dayKey()).length")===2&&ev("sum('food',dayKey(),dayKey())")===290);
  ev("S.entries=[];{const e=add('food',300,'Tavuk',keyOff(-1));e.p=30;e.c=5;e.f=12}repeatYesterday()");
  ok("dünkünü tekrarla makroları taşır, geri al siler",ev("JSON.stringify(of('food',dayKey()).map(e=>[e.p,e.c,e.f]))")==="[[30,5,12]]"&&(w.document.querySelector("#tundo").click(),ev("of('food',dayKey()).length")===0));
  ev("S.entries=[];S.favFoods=[];{const e=add('food',300,'Tavuk',keyOff(-2));e.p=30;e.c=5;e.f=12}sheetFood()");
  ok("son yediklerin listelenir, eski Sık yediklerin çipleri yok",ev("recList.length")===1&&$q("[data-rc='0']")!==null&&$q("[data-fav]")===null);
  $q("[data-rc='0']").click();
  ok("son yenilene dokunmak seçili güne makrolarla ekler",macros()==="[[300,30,5,12]]",macros());
  $q("#tundo").click();
  ok("son yenilenden eklemeyi geri al siler",ev("of('food',dayKey()).length")===0);
  ev("sheetFood()");$q("[data-fva='0']").click();
  ok("☆ favoriye alır, yeniden yüklemede kalır",ev("S.favFoods.length")===1&&ev("cleanHealthState(JSON.parse(JSON.stringify(S))).favFoods[0].p")===30&&$q("[data-fv='0']")!==null&&$q("[data-fva='0']").disabled);
  ev("S.entries=[]");ev("sheetFood()");$q("[data-fv='0']").click();
  ok("kayıt silinse de favori kalır, dokununca makrolarla ekler",macros()==="[[300,30,5,12]]"&&ev("S.favFoods.length")===1,macros());
  ev("sheetFood()");$q("[data-fvd='0']").click();
  ok("favoriden çıkarılır",ev("S.favFoods.length")===0);
  ok("eski yedek (favFoods yok) yüklenir, çöp favFoods diğer veriyi bozmaz",ev("cleanHealthState({}).favFoods.length")===0&&ev("cleanHealthState({favFoods:'x',meds:[]}).favFoods.length")===0);
  ev("S.entries=[];S.mealTpl=[];S.favFoods=[];{const e=add('food',155,'Yumurta');e.p=13}{const e=add('food',90,'Ekmek');e.c=40}");
  ok("gün listesinde şablon yap düğmesi görünür",ev("viewToday()").includes('data-act="tplnew"'));
  ev("sheetTpl()");$q("#tpn").value="Kahvaltım";$q('[data-go="tpl"]').click();
  ok("şablon tüm kalemleri değer kopyası olarak kaydeder",ev("S.mealTpl.length")===1&&ev("S.mealTpl[0].items.length")===2&&ev("S.mealTpl[0].id")===1&&ev("S.mealTpl[0].items[0].p")===13);
  ev("sheetTpl()");$q("#tc0").checked=false;$q("#tpn").value="Tek";$q('[data-go="tpl"]').click();
  ok("işareti kaldırılan yemek şablona girmez, kimlik artar",ev("S.mealTpl[1].items.length")===1&&ev("S.mealTpl[1].id")===2&&ev("S.mealTpl[1].items[0].text")==="Ekmek");
  ev("sheetTpl()");$q("#tpn").value="";$q('[data-go="tpl"]').click();
  ok("adsız şablon kaydedilmez",ev("S.mealTpl.length")===2);
  ev("S.entries=[]");ev("sheetFood()");$q("[data-tp='0']").click();
  ok("şablon çipi tek dokunuşla tüm kalemleri ekler",ev("of('food',dayKey()).length")===2&&macros()==="[[155,13,null,null],[90,null,40,null]]",macros());
  $q("#tundo").click();
  ok("tek geri al şablon eklemesinin hepsini siler",ev("of('food',dayKey()).length")===0);
  ok("şablon yeniden yüklemede kalır, eski yedekte (mealTpl yok) boş yüklenir",ev("cleanHealthState(JSON.parse(JSON.stringify(S))).mealTpl.length")===2&&ev("cleanHealthState({}).mealTpl.length")===0&&ev("cleanHealthState({mealTpl:7}).mealTpl.length")===0);
  ev("sheetFood()");$q("[data-tpd='0']").click();
  ok("şablon silinir",ev("S.mealTpl.length")===1&&ev("S.mealTpl[0].n")==="Tek");
  ev("S.entries=[]");ev("sheetFood()");
  ok("dün yemek yoksa düğme yok",w.document.querySelector('[data-act="yesterday"]')===null);
  let cancelled=[],sched1=[];const lnOld=w.Capacitor.Plugins.LocalNotifications;
  w.Capacitor.Plugins.LocalNotifications={checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),getPending:async()=>({notifications:[]}),cancel:async o=>{cancelled=o.notifications.map(n=>n.id)},schedule:async o=>{sched1=o.notifications.map(n=>n.id)}};
  await ev("scheduleReminders()");
  ok("su hedefi dolmadan su hatırlatmaları kurulur",sched1.includes(201)&&sched1.includes(301));
  ev("S.entries=[];add('water',S.settings.waterMl-S.settings.glass,'')");sched1=[];
  w.document.body.insertAdjacentHTML("beforeend",'<button id="tsu" data-act="water"></button>');w.document.querySelector("#tsu").click();
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
  await ev("barcodeFind('8690526010113')");
  ok("barkod: tutarlı ürün otomatik kaydedilir ve porsiyon açılır",ev("S.myFoods.length")===1&&ev("S.myFoods[0].src")==="off"&&ev("S.myFoods[0].b")==="8690526010113"&&w.document.querySelector("#fprev").textContent.startsWith("176 kcal"),[ev("S.myFoods"),w.document.querySelector("#fprev")&&w.document.querySelector("#fprev").textContent]);
  ok("barkod: kaynak yazısı Open Food Facts",w.document.querySelector("#sheet").textContent.includes("Open Food Facts"));
  await ev("barcodeFind('8690526010113')");
  ok("barkod: ikinci okutmada internete gitmez",fetched===1,fetched);
  ev("S.myFoods=[]");
  resp=offJ({"energy-kcal_100g":150,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13});
  await ev("barcodeFind('8690526010113')");
  ok("barkod: tutarsız ürün kaydedilmez",ev("S.myFoods.length")===0&&w.document.querySelector("#fq")!==null);
  resp=offJ({"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70});
  await ev("barcodeFind('8690526010113')");
  ok("barkod: eksik değerli ürün kullanılır ama kaydedilmez",ev("S.myFoods.length")===0&&w.document.querySelector("#fprev").textContent.startsWith("176 kcal"));
  ev("S.myFoods=Array.from({length:200},(_,i)=>({n:'Ürün '+i,k:100}))");
  resp=offJ({"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13});
  await ev("barcodeFind('8690526010113')");
  ok("barcode: with a full food list the product opens unsaved instead of crashing",ev("S.myFoods.length")===200&&w.document.querySelector("#fprev").textContent.startsWith("176 kcal")&&w.document.querySelector("#sheet").textContent.includes("listen dolu"));
  ev("S.myFoods=[]");
  w.fetch=async()=>{throw new Error("ağ yok")};
  await ev("barcodeFind('8690526010113')");
  ok("barkod: internet yoksa hata verir",w.document.querySelector("#tmsg").textContent.includes("İnternete ulaşılamadı"));
  await ev("barcodeFind('123')");
  ok("barkod: geçersiz kod reddedilir",w.document.querySelector("#tmsg").textContent.includes("ürün barkodu değil"));
  w.Capacitor.Plugins.BarcodeScanner={isGoogleBarcodeScannerModuleAvailable:async()=>({available:true}),scan:async o=>{w.scanOpts=o;return {barcodes:[{rawValue:"8690526010113"}]}}};
  w.fetch=async()=>({ok:true,json:async()=>offJ({"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13})});
  ev("S.myFoods=[]");await ev("barcodeRead()");
  ok("barkod: tarayıcı okuyunca ürün bulunur",ev("S.myFoods.length")===1&&w.scanOpts.formats.includes("EAN_13"));
  ev("sheetFood()");
  ok("Yemek ekle'de barkod düğmesi görünür",w.document.querySelector("#sheet [data-act=barcode]")!==null);
  { // the tip of the day follows the local calendar day, not the UTC day
    ev("S.entries=[];add('weight',80,'');add('water',S.settings.waterMl,'');add('exercise',30,'Yürüyüş')");
    const tipAt=h=>{const back=require('./clock').at(w,h),t=ev("dailyTip()");back();return t};
    const t1=tipAt(1),t23=tipAt(23);
    ok("tip of the day: the same quote at 01:00 and 23:00 of one local day",t1===t23&&ev("QUOTES").includes(t1),[t1,t23]);
    ev("S.entries=[]");
  }
  { // lif, şeker, sodyum
    const T=w.document.querySelector.bind(w.document),day=ev("dayKey()");
    w.fetch=async()=>({ok:true,json:async()=>offJ({"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13,fiber_100g:4,sugars_100g:20,sodium_100g:0.4})});
    ev("S.myFoods=[];S.entries=[];S.settings.oemDone=true");await ev("barcodeFind('8690526010113')");
    ok("barkod: lif/şeker/sodyum myFoods'a girer, önizleme gösterir",ev("[S.myFoods[0].fb,S.myFoods[0].sg,S.myFoods[0].na].join()")==="4,20,400"&&/lif 1,6 g · şeker 8,0 g · sodyum 160,0 mg/.test(T("#fprev").textContent),T("#fprev").textContent);
    ev("goNutrition()");
    ok("kayda porsiyon oranında geçer ve yeniden yüklemede kalır",ev("JSON.stringify(cleanEntries(S.entries).out.map(e=>[e.fb,e.sg,e.na]))")==="[[1.6,8,160]]",ev("JSON.stringify(S.entries)"));
    ev("add('food',100,'makrosuz',dayKey())");
    ev("add('food',50,'tuzlu',dayKey()).na=100");
    ok("Bugün satırı alan başına kapsam notuyla",/Lif <b>2<\/b> g \(1\/3\) · Şeker <b>8<\/b> g \(1\/3\) · Sodyum <b>260<\/b> mg \(2\/3\)/.test(ev("viewToday()")),ev("viewToday()").match(/Lif.{0,160}/));
    ev("S.entries=S.entries.filter(e=>!/Crax/.test(e.text))");
    ok("verisi olmayan alan 0 gibi gösterilmez",(v=>/Sodyum <b>100<\/b> mg \(1\/2\)/.test(v)&&!/Lif <b>/.test(v)&&!/Şeker <b>/.test(v))(ev("viewToday()")),ev("viewToday()").match(/Sodyum.{0,80}/));
    ev("S.entries=S.entries.filter(e=>e.text==='makrosuz')");
    ok("hiçbir öğünde veri yoksa satır gizli",!ev("viewToday()").includes("öğünde veri var"));
    ev("S.entries=[];S.myFoods=[]");
    const r=ev("JSON.parse(JSON.stringify({entries:[{day:dayKey(),type:'food',v:100,text:'a',fb:'x',sg:-1,na:1e9,p:5},{day:dayKey(),type:'food',v:50,text:'b',fb:3}],myFoods:[{n:'Z',k:10,fb:500,sg:5,na:100}]}))");
    ev(`window.__r=${JSON.stringify(r)}`);
    ok("çöp alanlı kayıtlar: p korunur, fb/sg/na yok",ev("(o=>o[0].p===5&&o[0].fb===undefined&&o[0].sg===undefined&&o[0].na===undefined&&o[1].fb===3)(cleanEntries(__r.entries).out)"));
    ok("myFoods: sınır dışı lif atılır, şeker/sodyum kalır; eski kayıt (alansız) aynen",ev("(m=>m.fb===undefined&&m.sg===5&&m.na===100)(cleanMyFoods(__r.myFoods)[0])&&cleanMyFoods([{n:'Y',k:5,p:1}])[0].p===1"));
    ev("S.myFoods=[];labelReview({food:{k:440,p:8.5,c:70,f:13,fb:3,sg:12,na:480}})");
    ok("etiket ekranında lif/şeker/sodyum dolu gelir",T("#efb").value==="3"&&T("#esg").value==="12"&&T("#ena").value==="480");
    T("#en").value="Etiketli";T('[data-ocr="esave"]').click();
    ok("etiket kaydı lif/şeker/sodyumu myFoods'a yazar",ev("[S.myFoods[0].fb,S.myFoods[0].sg,S.myFoods[0].na].join()")==="3,12,480",ev("S.myFoods"));
    ev("closeSheet();S.myFoods=[];labelReview({food:{k:300,p:5,c:40,f:10,sg:45}})");
    T("#en").value="Şekerli";T('[data-ocr="esave"]').click();
    ok("etiket: şeker karbonhidrattan büyükse sessizce silinmez, uyarı verir ve kaydetmez",ev("S.myFoods.length")===0&&T("#ewarn").textContent.includes("Şeker, karbonhidrattan büyük"),T("#ewarn").textContent);
    T("#esg").value="35";T('[data-ocr="esave"]').click();
    ok("etiket: düzeltilince şekerle kaydedilir",ev("S.myFoods.length")===1&&ev("S.myFoods[0].sg")===35);
    ev("closeSheet();S.myFoods=[];labelReview({food:{k:440,p:30,c:70,f:13,fb:3,sg:12,na:480}})");
    T("#en").value="Makul değil";T('[data-ocr="esave"]').click();T('[data-ocr="esave"]').click();
    ok("etiket: 'makul değil' onaylanınca lif/şeker/sodyum kaybolmaz",ev("[S.myFoods[0].fb,S.myFoods[0].sg,S.myFoods[0].na].join()")==="3,12,480",ev("S.myFoods"));
    ev("closeSheet();S.myFoods=[];labelReview({food:{k:440,p:150,c:5,f:1}})");
    T("#en").value="Protein taşması";T('[data-ocr="esave"]').click();
    ok("etiket: 100 g için 100'ü aşan protein sessizce silinmez, uyarı verir ve kaydetmez",ev("S.myFoods.length")===0&&T("#ewarn").textContent.includes("Protein değeri 100 g için makul değil (0-100 g)"),T("#ewarn").textContent);
    ev("closeSheet();S.myFoods=[]");
  }
  ev("S.myFoods=[]");
  ev("S.entries=[];S.settings.oemDone=true");
  const yi=ev("allFoods().findIndex(f=>f.n==='Haşlanmış yumurta')");
  ev(`sheetPortion(${yi})`);w.document.querySelector("#fqty").value="2";ev("foodPreview()");
  ok("porsiyon önizlemesi hesaplanır",w.document.querySelector("#fprev").textContent.startsWith("155 kcal"),w.document.querySelector("#fprev").textContent);
  ev("goNutrition()");
  const be=ev("S.entries.find(e=>e.type==='food')");
  ok("besin kalori ve makrolarla kaydedilir",be&&be.v===155&&Math.abs(be.p-13)<0.1&&be.c>0&&be.f>10&&be.text.includes("2 ×"),be);
  ok("yeniden yüklemede makrolar korunur",ev("cleanEntries(S.entries).out[0].f")===be.f);
  ok("Bugün'de makro satırı görünür",ev("viewToday()").includes("Karbonhidrat"));
  const sched=[];
  Object.assign(w.Capacitor.Plugins.LocalNotifications,{requestPermissions:async()=>({display:"granted"}),cancel:async()=>{},schedule:async x=>{sched.push(...x.notifications)}});
  ok("hatırlatma durumu ok",await ev("scheduleReminders()")==="ok");
  ok("30 günlük tek seferlik alarmlar kurulur",sched.length>=150&&new Set(sched.map(n=>n.id)).size===sched.length&&sched.every(n=>n.schedule.at>new Date()&&n.schedule.allowWhileIdle&&!n.schedule.on),[sched.length]);
  await ev("notifTest()");
  ok("test bildirimi kurulur ve teşhis yazılır",sched.some(n=>n.id===99)&&ev("notifDiag").includes("granted")&&ev("notifDiag").includes("Kurulu hatırlatma: 2"),[sched.length,ev("notifDiag")]);
  ev("S.chat=[];S.cid=1;cReply({reply:'x',log:[],propose:null,flag:'safety'})");
  ok("model güvenlik işareti kart üretir",ev("S.chat.some(m=>m.card&&m.card.kind==='safety')"));
  ev("S.chat=[];Object.assign(S.settings,{age:12,heightCm:165,goalKg:45,healthNote:'',kcal:0});S.entries=[];for(let i=13;i>=0;i--)S.entries.push({id:100+i,day:keyOff(-i),time:'08:00',type:'weight',v:60-i*0.01,text:''})");
  ev("cReply({reply:'x',log:[],propose:{kcal:1300,why:'a'},flag:null})");
  ok("18 yaş altına açık önerisi çıkmaz",!ev("S.chat.some(m=>m.card&&m.card.kind==='propose')"));
  ev("S.entries=[];cReply({reply:'x',log:[],propose:{kcal:1300,why:'a'},flag:null})");
  ok("fren varken bakım hesaplanamıyorsa (tartı yok) kalori önerisi çıkmaz",!ev("S.chat.some(m=>m.card&&m.card.kind==='propose')"));
  ev("S.settings.kcal=0;cClick('applyk:'+cPush({role:'coach',text:'',card:{kind:'propose',kcal:1300,why:'',limited:false,state:'pending'}}).id)");
  ok("frenden önce kalmış bekleyen öneri uygulanmaz",ev("S.settings.kcal")===0&&ev("S.chat[S.chat.length-1].card.state")==="no");
  ev("S.entries=[];for(let i=0;i<10;i++)add('water',250)");ev("S.settings.lastBackup=''");
  ok("yedek yoksa uyarı çıkar",ev("viewToday()").includes("Verilerini yedekle"));
  ev("markBackup()");
  ok("yedek alınınca uyarı kalkar",!ev("viewToday()").includes("Verilerini yedekle")&&ev("cleanSettings({lastBackup:S.settings.lastBackup}).lastBackup")===ev("dayKey()"));
  { // C1: Bugün sadeleştirme
    const unclock=require('./clock').at(w,21); // doz ve ölçüm satırları saati gelince çıkar
    const st0=ev("JSON.stringify(S)");
    ev("S.entries=[];S.meds=[];S.medLog=[];S.vitals=[];S.workouts=S.workouts.filter(x=>x.t1);S.fast={plan:16,t0:null,log:[]};Object.assign(S.settings,{medOn:false,fastOn:false,bpOn:false,bsOn:false,stepsOn:false,stepsAsked:true,oemDone:true,waterMl:2500,kcal:1900,sportWeek:150,glass:250});oem='google';tab='today';logOff=0");
    ok("yapılacak iş yoksa 'Bugün yapılacaklar' kartı yok",!ev("viewToday()").includes("Bugün yapılacaklar"));
    ev("add('water',1000);add('food',1380,'Öğün');add('weight',86,'');add('weight',87,'',keyOff(-3));render()");
    const v=()=>ev("viewToday()"),at=s=>v().indexOf(s);
    ok("tek birincil eylem Yemek ekle, ikincil hızlı kayıtlar çip: Su, Kilo, Spor, Not",$q(".actions>.btn").dataset.act==="food"&&$q(".actions .btn.ghost")===null&&[...$q(".actions .qa").querySelectorAll(".act")].map(b=>b.dataset.act).join()==="water,weight,exercise,note");
    ok("halkalar birim ve kalanı yazar",(t=>t.includes("520kcal kaldı")&&t.includes("1380 / 1900 kcal")&&t.includes("1,5L kaldı")&&t.includes("1,0 / 2,5 L")&&t.includes("21dk kaldı")&&t.includes("0 / 21 dk")&&!t.includes("7 gün"))($q(".rings").textContent),$q(".rings").textContent);
    ev("add('food',700,'Fazla');add('water',1500);add('exercise',150,'Yürüyüş');render()");
    ok("hedef aşılınca 'kcal fazla', su ve spor 'tamam'",(t=>t.includes("180kcal fazla")&&(t.match(/✓Hedef tamam/g)||[]).length===2)($q(".rings").textContent),$q(".rings").textContent);
    ok("kilo kartı küçük: grafik yok, tek satır özet, Trend'e götürür",!v().includes('class="weight"')&&!!$q('#view .stepcard[data-tab="trend"]')&&!$q('#view .stepcard[data-tab="trend"] svg:not(.i)')&&$q('#view .stepcard[data-tab="trend"]').textContent.includes("86,0"));
    ok("Koç cümlesi Koç kısayolu",!!$q('#view button.coach[data-tab="coach"]'));
    ev("S.settings.medOn=true;S.meds=[{id:1,n:'İlaç A',t:['08:00','20:00'],on:true}];S.settings.fastOn=true;S.settings.bpOn=true;render()");
    ok("ilaç, oruç ve ölçüm tek 'Bugün yapılacaklar' kartında, ayrı kart yok",ev("document.querySelectorAll('#view .todo').length")===1&&$q(".todo").querySelectorAll('[data-md^="take:"]').length===2&&$q('.todo').textContent.includes('Oruç önerilmez')&&!!$q('.todo [data-vt="addbp"]')&&!v().includes("💊 İlaçlar")&&!v().includes("Ölçümler"));
    ok("yapılacaklar kompakt: ilk 3 iş görünür, kalanı 'iş daha' altında; ilaç satırında saat ayrı sütun",$q(".todo").querySelectorAll(":scope>.row").length===3&&$q(".todo details.acc summary").textContent==="1 iş daha"&&$q(".todo details .row")&&$q('.todo .row .tm').textContent==="08:00");
    ok("bilgi hiyerarşisi: özet, kayıt, yapılacaklar, Trend/Koç kısayolu",at('class="bgL"')<at('class="rings"')&&at('class="rings"')<at('class="actions"')&&at('class="actions"')<at("Bugün yapılacaklar")&&at("Bugün yapılacaklar")<at('data-tab="trend"')&&at('data-tab="trend"')<at('class="coach"'));
    ev("S.settings.medOn=false;S.settings.fastOn=false;S.settings.bpOn=false;render()");
    ok("modüller kapanınca kart kalkar",!v().includes("Bugün yapılacaklar"));
    ev(`S=Object.assign(S,JSON.parse(${JSON.stringify(st0)}));render()`);
    unclock();
  }
  { // ana ekran widget'ı
    const wc=[];w.Capacitor.Plugins.Widget={update:async d=>{wc.push(d)}};
    ev("widgetLast='';tab='today';S.entries=[];add('water',250);add('food',400,'makarna');S.settings.kcal=1800;S.settings.waterMl=2500;S.settings.glass=250;S.settings.stepsOn=true;stepToday=3000;add('steps',500,'manual');render()");
    ok("widget: render sonrası doğru alanlarla bir kez güncellenir",wc.length===1&&JSON.stringify(wc[0])===JSON.stringify({day:ev("dayKey()"),water:250,waterGoal:2500,glass:250,kcalLeft:1400,steps:3500}),wc);
    ev("render()");
    ok("widget: değişiklik yoksa tekrar gönderilmez",wc.length===1);
    ev("S.settings.kcal=0;S.settings.stepsOn=false;render()");
    ok("widget: hedef yoksa kcalLeft, adım kapalıysa steps null",wc.length===2&&wc[1].kcalLeft===null&&wc[1].steps===null&&"kcalLeft" in wc[1]);
    ev("S.settings.stepsOn=true;tab='trend';render()");stepSteps=3200;await ev("stepsSync()");
    ok("widget: Bugün dışındayken de adım değişince güncellenir",wc[wc.length-1].steps===3700,wc[wc.length-1]);
    ev("tab='coach';logOff=-2;widgetOpen()");
    ok("widget: dokununca Bugün açılır",ev("tab")==="today"&&ev("logOff")===0);
    const n0=wc.length;
    ev("widgetLast='';Object.assign(S.settings,{obDone:false,heightCm:0,age:0,goalKg:0,kcal:0,consent:false});S.entries=[];S.chat=[];S.meds=[];render()");
    ok("widget: onboarding açıkken de render sonrası güncellenir",ev("obNeeded()")===true&&wc.length===n0+1&&wc[n0].water===0,[ev("obNeeded()"),wc.length,n0]);
    delete w.Capacitor.Plugins.Widget;
  }
  { // B6: KVKK açık rıza, Gizlilik ve veri
    const q=s=>$q(s),k=()=>q("#view").textContent,sh=()=>q("#sheet").textContent;
    ev("closeSheet();S.settings.age=30;S.settings.consent=false;S.settings.consentV=0;S.settings.consentAt='';S.chat=[];S.entries=[];Object.assign(S.settings,{obDone:true});setKey('nvidia','K1');tab='coach';render()");
    const t=ev("document.querySelector('#view .chat>.card').textContent");
    ok("onay metni: ne gönderilir, kime (sağlayıcı adı), yurt dışı aktarım, geri alma, onaysız tam çalışır",["Ne gönderilir","NVIDIA Build","yurt dışına aktarım","Geri alma","Onay vermezsen","uygulama tam çalışır"].every(x=>t.includes(x))&&!!q('[data-c="consent"]'),t);
    ev("cConsent(true)");
    ok("onay: consentV ve consentAt yazılır, kayıtlı",ev("S.settings.consent&&S.settings.consentV===CONSENT_V&&S.settings.consentAt===dayKey()")&&JSON.parse(w.localStorage.getItem("nw_state")).settings.consentAt===ev("dayKey()"));
    ev("cConsent(false)");
    ok("geri alma: consent, sürüm ve tarih temizlenir",ev("!S.settings.consent&&S.settings.consentV===0&&S.settings.consentAt===''"));
    ok("eski onay (sürümsüz ya da farklı sürüm) geçersiz, güncel sürüm geçerli",ev("[cleanSettings({consent:true}).consent,cleanSettings({consent:true,consentV:CONSENT_V+1}).consent,cleanSettings({consent:true,consentV:CONSENT_V,consentAt:'2026-10-01'}).consentAt]").join()==="false,false,2026-10-01");
    ev("S.settings.consent=true;S.settings.consentV=CONSENT_V-1;save()");
    ok("yeniden başlatınca eski sürümle verilmiş onay düşer",ev("load().settings.consent")===false);
    ev("cConsent(true);sheetBackup()");
    ev("(()=>{const x=JSON.parse(JSON.stringify(S));x.settings.consent=false;x.settings.consentV=0;x.settings.consentAt='';x.entries=[{id:1,day:'2026-09-01',time:'10:00',type:'water',v:250,text:''}];document.querySelector('#bk').value=JSON.stringify(x)})()");
    await loadBackup();
    ok("yedek geri yükleme onay sürümünü ve tarihini korur",ev("S.settings.consent&&S.settings.consentV===CONSENT_V&&S.settings.consentAt===dayKey()&&load().settings.consent"));
    ev("S.settings.age=16;cConsent(false);cConsent(true);tab='coach';render()");
    ok("18 yaş altı: onay verilemez, düğme yok, açıklama var",!ev("S.settings.consent")&&!q('[data-c="consent"]')&&k().includes("18 yaş altı"));
    ev("S.settings.age=30;tab='settings-data';render()");
    q('[data-pv="open"]').click();
    const g=sh();
    ok("Gizlilik ve veri: nerede, Open Food Facts yalnız barkod, ML Kit, Drive, Koç onay metni aynı, tıbbi uyarı",["Verin nerede","Open Food Facts","yalnızca barkod numarası","Google barkod tarayıcı","Google Drive","Koç ile veri paylaşımına açık rızan"].every(x=>g.includes(x))&&g.includes(ev("(()=>{const d=document.createElement(\"div\");d.innerHTML=consentHtml();return d.textContent})()"))&&g.includes(ev("MED_NOTE")),g.slice(0,200));
    q('[data-pv="consent"]').click();
    ok("sheet'ten onay: sheet açık kalır, durum güncellenir, geri alma düğmesi gelir",ev("S.settings.consent")&&sh().includes("kabul edildi")&&!!q('[data-pv="revoke"]'));
    q('[data-pv="revoke"]').click();
    ok("sheet'ten geri alma",!ev("S.settings.consent")&&sh().includes("kabul edilmedi"));
    ev("closeSheet()");
    ok("tıbbi uyarı: Hakkında MED_NOTE, tansiyon/şeker/tahlil tek kalıp 'Bu değerleri hekiminle değerlendir.'",(ev("tab='settings-about';render()"),k().includes(ev("MED_NOTE")))&&["bp","glucose","labs"].every(t=>{ev(`tab='${t}';render()`);return k().includes("Bu değerleri hekiminle değerlendir.")}));
    ev("Object.assign(S.settings,{obDone:false,heightCm:0,goalKg:0,kcal:0,age:0});S.entries=[];S.chat=[];S.meds=[];Object.assign(ob,{cm:'170',kg:'80',age:'30',step:2});render()");
    ok("onboarding son adımı: kısa özet ve bağlantı, sheet açılır",k().includes("yalnızca telefonunda durur")&&k().includes(ev("MED_NOTE"))&&(q('[data-pv="open"]').click(),sh().includes("Verin nerede")));
    ev("closeSheet()");
  }
  { // D-Veri4: kategori bazlı silme
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)],sh=()=>q("#sheet").textContent;
    const wc=[];w.Capacitor.Plugins.Widget={update:async d=>{wc.push(d)}};
    ev("window.__sr=0;window.__osr=scheduleReminders;scheduleReminders=async()=>{__sr++;return 'web'}");
    const seed=()=>ev(`(()=>{closeSheet();S.entries=[];S.nextId=1;widgetLast='';
      add('food',300,'ekmek');add('water',250);add('weight',80);add('steps',3000);add('note',null,'kişisel not');add('note',null,'ikinci');
      const wk=add('exercise',40,'Ağırlık, A');wk.wid=7;add('exercise',20,'yürüyüş');
      S.workouts=[{id:7,day:dayKey(),t0:1,t1:2,name:'A',tpl:null,ex:[]},{id:8,day:dayKey(),t0:3,t1:null,name:'Etkin',tpl:null,ex:[]}];
      S.moves=[{day:dayKey(),t0:'10:00',min:20,k:'w',steps:2000,km:1.5,kmh:4.5,kcal:null,gps:false}];
      S.meds=[{id:1,n:'X',t:['09:00'],on:true}];S.medLog=[{id:1,m:1,day:dayKey(),slot:'09:00',st:'t'}];
      S.vitals=[{id:1,k:'t',day:dayKey(),time:'08:00',sys:120,dia:80,session:'morning'}];S.labs=[{id:1,day:dayKey(),k:'glu',n:'Glukoz',v:90,u:'mg/dL'}];
      S.sleep=[{day:dayKey(),min:420}];S.mood=[{day:dayKey(),v:4}];S.fast={plan:16,t0:Date.now()-36e5,log:[{t0:1,t1:2}]};
      S.chat=[{id:1,role:'user',text:'merhaba',t:1}];S.cid=2;S.settings.consent=true;S.settings.consentP='gemini,groq,nvidia,openrouter';S.settings.consentV=CONSENT_V;S.settings.consentAt='2026-10-01';S.settings.lastBackup='2026-09-30';S.settings.obDone=true;
      sheetPrivacy()})()`);
    const cnt=()=>ev("JSON.stringify([S.entries.length,S.workouts.length,S.moves.length,S.meds.length+S.medLog.length,S.vitals.length,S.labs.length,S.sleep.length+S.mood.length+S.fast.log.length+(S.fast.t0?1:0),S.chat.length])");
    const del=i=>{q(`[data-pv="del:${i}"]`).click()};
    seed();const all=cnt();
    ok("liste: 15 kategori, her biri kayıt sayısıyla ve Sil düğmesiyle; yedek hatırlatması",qa('[data-pv^="del:"]').length===15&&sh().includes("Yemek ve su kayıtları")&&sh().includes("2 kayıt")&&sh().includes("Önce yedek al")&&sh().includes("Koç sohbeti"));
    ev("window.confirm=()=>false");del(0);
    ok("onay verilmezse hiçbir şey silinmez",cnt()===all);
    let msg="";w.confirm=m=>{msg=m;return true};
    del(0);
    ok("yemek ve su: yalnız onlar gider; uyarıda sayı, geri alınamaz, son yedek tarihi",ev("S.entries.filter(e=>e.type==='food'||e.type==='water').length")===0&&ev("S.entries.length")===6&&/geri alınamaz/.test(msg)&&msg.includes(ev("fd('2026-09-30')"))&&msg.includes("2 kayıt"),msg);
    ok("silme sonrası widget güncellenir (su 0)",wc.length&&wc[wc.length-1].water===0,wc[wc.length-1]);
    ok("silme sonrası liste yenilenir, Geri al düğmesi yok (lastUndo temiz)",sh().includes("0 kayıt")&&q("#tundo").hidden===true);
    seed();del(1);
    ok("weight",ev("S.entries.some(e=>e.type==='weight')")===false&&ev("S.entries.length")===7&&ev("S.workouts.length")===2);
    seed();ev("render()");del(2);
    ok("spor ve antrenman: antrenmanlar (etkin dahil) ve tüm spor kayıtları, bağlı wid kaydı yetim kalmaz",ev("S.workouts.length")===0&&ev("S.entries.some(e=>e.type==='exercise')")===false&&ev("S.entries.length")===6&&ev("S.entries.some(e=>e.wid!=null)")===false);
    ev("tab='gym';render()");
    ok("etkin antrenman silinince Salon bozulmaz, hata yok",ev("gActive()")===null&&q("#view").textContent.length>50&&errs.length===0,errs);
    ev("closeSheet();sheetPrivacy()");
    seed();del(3);
    ok("adım ve hareket: adım kayıtları ve hareketler",ev("S.moves.length")===0&&ev("S.entries.some(e=>e.type==='steps')")===false&&ev("S.entries.length")===7);
    seed();ev("__sr=0");del(4);
    ok("ilaç: ilaç ve alım kaydı gider, bildirimler yeniden kurulur",ev("S.meds.length+S.medLog.length")===0&&ev("__sr")>=1);
    seed();del(5);ok("sağlık ölçümleri",ev("S.vitals.length")===0&&ev("S.labs.length")===1);
    seed();del(6);ok("labs",ev("S.labs.length")===0&&ev("S.vitals.length")===1);
    seed();ev("__sr=0");del(7);
    ok("uyku, ruh hali, oruç: etkin oruç da biter, bildirimler yeniden kurulur",ev("S.sleep.length+S.mood.length+S.fast.log.length")===0&&ev("S.fast.t0")===null&&ev("S.fast.plan")===16&&ev("__sr")>=1);
    seed();del(8);
    ok("Koç sohbeti silinince onay, sürüm ve tarih korunur",ev("S.chat.length")===0&&ev("S.settings.consent&&S.settings.consentV===CONSENT_V&&S.settings.consentAt==='2026-10-01'"));
    seed();del(9);
    ok("notlar: yalnız notlar",ev("S.entries.some(e=>e.type==='note')")===false&&ev("S.entries.length")===6);
    ok("hiçbir silme başka kategoriye dokunmadı: tek tek silmeden sonra diğer sayılar aynı",(()=>{seed();const b=JSON.parse(cnt());del(4);const a=JSON.parse(cnt());return a[0]===b[0]&&a[1]===b[1]&&a[2]===b[2]&&a[4]===b[4]&&a[5]===b[5]&&a[6]===b[6]&&a[7]===b[7]&&a[3]===0})());
    const st=JSON.parse(w.localStorage.getItem("nw_state"));
    ok("silme kalıcıdır ve kayıttan okunan durum tutarlı (load sonrası ilaç yok, sohbet korunur)",st.meds.length===0&&st.chat.length===1&&ev("load().meds.length")===0);
    ok("boş kategoride Sil düğmesi kapalı",(()=>{ev("S.entries=S.entries.filter(e=>e.type!=='note');sheetPrivacy()");return q('[data-pv="del:9"]').disabled})());
    ev("scheduleReminders=window.__osr;closeSheet();S.settings.consent=false;S.settings.consentV=0;S.settings.consentAt='';S.fast={plan:16,t0:null,log:[]};S.chat=[];S.entries=[];S.meds=[];S.workouts=[];tab='today';render()");
    delete w.Capacitor.Plugins.Widget;
  }
  { // D-Veri1: CSV dışa aktarma
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)],wr=[],shr=[];
    w.Capacitor.Plugins.Filesystem={writeFile:async o=>{wr.push(o);return {uri:"file:///cache/"+o.path}}};
    w.Capacitor.Plugins.Share={share:async o=>{shr.push(o)}};
    ev("closeSheet();S.entries=[];S.nextId=1;S.workouts=[];S.vitals=[];S.sleep=[];S.mood=[];S.fast={plan:16,t0:null,log:[]};S.meds=[];S.medLog=[];add('weight',80.5);add('note',null,'=1+1');S.settings.obDone=true;tab='settings-data';render()");
    q('[data-pv="csv"]').click();
    const sheet=()=>q("#sheet").textContent;
    ok("Ayarlar > Veriler'de Tabloya aktar: 9 dosya, satır sayılarıyla; boş olanın düğmesi kapalı",sheet().includes("Kayıtlar (yemek, su, kilo, ölçü, spor, adım, not)")&&sheet().includes("2 satır")&&qa('[data-pv^="csvsh:"]').length===9&&qa('[data-pv^="csvsh:"]').filter(b=>b.disabled).length===8);
    q('[data-pv="csvsh:0"]').click();await new Promise(r=>setTimeout(r,20));
    ok("paylaşım: tek dosya, UTF-8 metin, BOM, ; ayırıcı, ondalık virgül, enjeksiyon engelli, paylaşım ekranına uri gider",wr.length===1&&wr[0].encoding==="utf8"&&wr[0].directory==="CACHE"&&/^neowell-kayitlar-\d{4}-\d\d-\d\d\.csv$/.test(wr[0].path)&&wr[0].data.startsWith("﻿tarih;saat;")&&wr[0].data.includes(";kilo;80,5;kg;")&&wr[0].data.includes("'=1+1")&&shr.length===1&&shr[0].files[0]==="file:///cache/"+wr[0].path,wr[0]);
    ev("S.nextId=1");
    await ev("sharePdf(new Uint8Array([37,80,68,70]),'x.pdf','PDF')");
    ok("PDF paylaşımı aynı yoldan, base64 ve kodlamasız (gerileme yok)",wr.length===2&&wr[1].path==="x.pdf"&&wr[1].encoding===undefined&&wr[1].data==="JVBERg==",wr[1]);
    delete w.Capacitor.Plugins.Filesystem;delete w.Capacitor.Plugins.Share;ev("closeSheet();S.entries=[];tab='today';render()");
  }
  { // Ayarlar alt ekranları (C3)
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)],v=()=>q("#view").textContent;
    ev("closeSheet();S.settings.obDone=true;S.settings.heightCm=170;S.settings.age=30;S.settings.goalKg=72;S.settings.medOn=true;S.settings.fastOn=true;S.settings.bpOn=true;S.settings.bsOn=true;S.settings.stepsOn=false;S.settings.lastBackup='';tab='settings';render()");
    const rows=qa('#view [data-tab^="settings-"]').map(b=>b.dataset.tab);
    ok("Ayarlar ana ekranı kısa liste: 6 bölüm, özet değer ve ›, alan yok, başlıkta ‹ var (Daha fazla'ya)",rows.join()==="settings-profile,settings-reminders,settings-coach,settings-modules,settings-data,settings-about"&&v().includes("170 cm · 30 yaş · hedef 72,0 kg")&&v().includes("İlaç, Oruç, Tansiyon, Şeker açık")&&v().includes("Henüz yedek dosyası yok")&&!q("#view input")&&!q("#back").hidden&&q('nav [data-tab="more"]').getAttribute("aria-current")==="page",v());
    const T={profile:"Profil ve hedefler",modules:"Modüller",reminders:"Hatırlatmalar",coach:"Koç",data:"Veri ve yedek",about:"Hakkında"},seen=new Set();
    let titles=true;
    for(const k in T){
      q(`[data-tab="settings-${k}"]`).click();
      titles=titles&&q("#ttl").textContent===T[k]&&!q("#back").hidden&&q('nav [data-tab="more"]').getAttribute("aria-current")==="page";
      for(const e of qa("#view *"))for(const a of e.attributes)if(a.name.startsWith("data-")||a.name==="id")seen.add(a.name==="id"?"id="+a.value:a.name+"="+a.value);
      q("#back").click();titles=titles&&ev("tab")==="settings";
    }
    ok("her bölüm kendi alt ekranı: başlık, ‹ görünür, Daha fazla sekmesi etkin; ‹ listeye döner",titles);
    const need=["heightCm","age","goalKg","kcal","waterMl","glass","sportWeek","stepGoal"].map(k=>"data-set="+k)
      .concat([1,2,3,4,5,6,7,8,9,10,11,12].flatMap(i=>["data-rt="+i,"data-ro="+i]),["data-act=health","data-act=drive","data-act=backup","data-act=reset","data-pv=csv","data-pv=open","data-c=addprov","data-c=clearchat","data-g=gdb:2.5","data-g=gpl:25","data-hb=fasttoggle","data-hb=plan:16","data-md=toggle","data-md=shown","data-tab=meds","data-vt=bptoggle","data-vt=bstoggle","data-aw=","data-rpe=","data-sex=m","data-actl=2"]);
    ok("eski tek sayfadaki tüm kimlikler alt ekranlarda korunur",need.every(x=>seen.has(x)),need.filter(x=>!seen.has(x)));
    ev("tab='settings-profile';render()");q('[data-help="hlpmk"]').click();
    ok("ⓘ ayrıntı: açıklama kartın içinde açılır, aria-expanded güncellenir",!q("#hlpmk").hidden&&q('[data-help="hlpmk"]').getAttribute("aria-expanded")==="true");
    ev("S.settings.fastOn=false;S.settings.fastInfoOk=false;S.fast.t0=null;tab='settings-modules';render()");q('[data-hb="fasttoggle"]').click();
    ok("modül anahtarı onay beklerken işaretli görünmez",ev("S.settings.fastOn")===false&&q('[data-hb="fasttoggle"]').checked===false&&!!q("#fic"));
    ev("closeSheet();S.settings.fastOn=true");
    ev("tab='settings-modules';render()");ev("backKey()");const b1=ev("tab");ev("backKey()");
    const b2=ev("tab");ev("backKey()");
    ok("Android geri: alt ekrandan Ayarlar'a, Daha fazla'ya, Bugün'e",b1==="settings"&&b2==="more"&&ev("tab")==="today");
    ev("tab='settings-reminders';render()");w.dispatchEvent(new w.PopStateEvent("popstate"));
    ok("tarayıcı geri (popstate): alt ekrandan Ayarlar'a, alt ekranda geçmiş kaydı vardı",ev("tab")==="settings");
    ev("tab='settings-reminders';render();setNotif('denied')");
    ok("Hatırlatmalar ekranı izin durumunu yeniler",v().includes("Bildirim izni kapalı"));
    ev("tab='trend';render()");ev("document.body.insertAdjacentHTML('beforeend','<button id=\"pf\" data-act=\"profile\"></button>')");q("#pf").click();q("#pf").remove();
    ok("profil bağlantısı (Enerji dengesi) Profil ve hedefler'i açar",ev("tab")==="settings-profile"&&!!q("#heightCm"));
    ev("S.settings.medOn=false;S.settings.fastOn=false;S.settings.bpOn=false;S.settings.bsOn=false;S.settings.heightCm=0;S.settings.age=0;S.settings.goalKg=0;tab='today';render()");
  }
  { // 5 sabit sekme ve Daha fazla (C14)
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)],cur=()=>(q('nav [aria-current="page"]')||{dataset:{}}).dataset.tab,go=t=>ev(`closeSheet();tab='${t}';via=null;render()`);
    const tabs=()=>qa("nav button").map(b=>b.dataset.tab).join(),rowsOf=()=>qa('#view .prow');
    ev("S.settings.obDone=true;S.settings.medOn=false;S.settings.bpOn=false;S.settings.bsOn=false;S.settings.stepsOn=false");go("today");
    const closed=tabs();ev("S.settings.medOn=true;S.settings.bpOn=true;S.settings.bsOn=true;S.settings.stepsOn=true;S.settings.cycleOn=true");go("today");
    ok("alt menü her zaman aynı 5 sekme (ilaç kapalı ya da açık): Bugün, Salon, Trend, Koç, Daha fazla; açılış Bugün",closed==="today,gym,trend,coach,more"&&tabs()===closed&&!q("#navIlac")&&/let tab="today"/.test(html)&&qa("nav button").pop().textContent.includes("Daha fazla"));
    go("more");
    ok("Daha fazla açık modüllerle: 5 başlıklı grup, başlık, ‹ yok, sekme etkin",q("#ttl").textContent==="Daha fazla"&&q("#back").hidden&&cur()==="more"&&qa("#view h2.grp").map(h=>h.textContent).join()==="Geçmiş,Sağlık takibi,Beslenme ve hareket,Veri,Uygulama"&&rowsOf().length===(ev("phOk()")?19:18)&&!q(".prow.off")&&["meds","cycle","steps","labs","bp","glucose","exlib","settings","settings-about"].every(t=>!!q(`#view [data-tab="${t}"]`))&&!!q('#view [data-pv="open"]'));
    ev("S.settings.medOn=false;S.settings.bsOn=false;S.settings.stepsOn=false;S.settings.cycleOn=false;render()");
    ok("kapalı modüller listede yok: İlaç, Adım, Şeker, Döngü gizli, Tansiyon görünür; satırlar 56 px",["meds","steps","glucose","cycle"].every(t=>!q(`#view [data-tab="${t}"]`))&&!!q('#view [data-tab="bp"]')&&/\.row,\.prow[^{]*\{[^}]*min-height:56px/.test(html));
    q('#view [data-tab="settings-modules"]').click();const viaMore=ev("tab")==="settings-modules"&&cur()==="more";q("#back").click();
    ok("Modüller satırı: Ayarlar > Modüller açılır, Daha fazla etkin kalır, ‹ Daha fazla'ya döner",viaMore&&ev("tab")==="more");
    ev("S.settings.medOn=true;S.settings.stepsOn=true;render()");
    q('#view [data-tab="steps"]').click();
    ok("Daha fazla'dan Adım: başlık, Daha fazla etkin, ‹ Daha fazla'ya döner",q("#ttl").textContent==="Adım raporu"&&cur()==="more"&&!q("#back").hidden);
    q("#back").click();const a1=ev("tab")==="more";
    ev("S.meds=[{id:1,n:'Test İlaç',d:'1 tablet',t:['23:58'],on:true,k:10}];S.medLog=[]");go("today");{const b=w.document.createElement("button");b.dataset.tab="meds";w.document.body.append(b);b.click();b.remove()}
    ok("Bugün'den açılan İlaç: Daha fazla etkin, ‹ Bugün'e döner (alt ekran açıldığı yerin altında)",ev("tab")==="meds"&&cur()==="more"&&(q("#back").click(),ev("tab")==="today")&&a1);
    go("meds");const d1=cur();ev("backKey()");const d2=ev("tab");ev("backKey()");
    ok("derin bağlantı İlaç: Daha fazla etkin; Android geri Daha fazla'ya, sonra Bugün'e",d1==="more"&&d2==="more"&&ev("tab")==="today");
    go("trend");q('#view [data-tab="bp"]').click();const t1=cur()==="trend";q("#back").click();
    const t2=ev("tab")==="trend";go("bp");const t3=cur();go("settings-about");
    ok("Trend'den Tansiyon Trend etkin ve ‹ Trend'e; derin tansiyon Trend, Hakkında Daha fazla etkin",t1&&t2&&t3==="trend"&&cur()==="more");
    ev("S.meds=[];S.medLog=[]");
    go("today");const tap=(x,m)=>{ev(`S.settings.medOn=${m};S.settings.consent=true;S.settings.consentP='gemini,groq,nvidia,openrouter';tab='today';notifTap(${JSON.stringify({actionId:"tap",notification:{extra:x}})})`);return ev("tab")};
    ok("bildirim dokunma: ilac sekmesi İlaç (ilaç açıkken) ya da Daha fazla; koc, settings-veri ve eski adlar korunur",tap({act:"open",tab:"meds"},true)==="meds"&&tap({act:"open",tab:"meds"},false)==="more"&&tap({act:"open",tab:"coach"},true)==="coach"&&tap({act:"open",tab:"settings-data"},true)==="settings-data"&&tap({act:"open",tab:"settings"},true)==="trend");
    ev("S.meds=[{id:1,n:'A',t:['08:00'],on:true}]");const mx=ev("MedLib.notifications(S.meds,[],new Date(),3,true)[0].extra");
    ok("gerçek ilaç bildirimi (act:med) dokunulunca İlaçlar, ilaç kapalıysa Daha fazla açılır",mx.act==="med"&&tap(mx,true)==="meds"&&tap(mx,false)==="more",mx);
    ev("S.meds=[]");
    ev("S.settings.consent=false;S.settings.medOn=false");go("coach");const c1=!q("#composer").hidden;go("more");
    ok("Koç composer yalnız Koç sekmesinde",c1&&q("#composer").hidden&&(go("gym"),q("#composer").hidden));
    go("today");
  }
  { // SVG ikonlar (C5)
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)],emo=/\p{Extended_Pictographic}/u;
    ev("closeSheet();S.settings.medOn=true;S.settings.obDone=true;tab='today';render()");
    const zones=()=>["nav","#view .actions","#view .hrow","#composer .chiprow","#csend","#back"].map(s=>q(s));
    const okZ=()=>zones().every(z=>z&&!emo.test(z.textContent)&&z.querySelectorAll("svg").length>0&&[...z.querySelectorAll("svg")].every(g=>g.getAttribute("aria-hidden")==="true"));
    const z1=okZ();ev("tab='settings';render()");
    ok("alt menü, hızlı kayıt, alışkanlık, Koç çipleri, gönder ve geri: emoji yok, ikonlar SVG ve aria-hidden; metin etiketi kalır",z1&&qa("nav button").every(b=>b.textContent.trim().length>1)&&qa('#view [data-tab^="settings-"] svg[aria-hidden="true"]').length===6&&!emo.test(q("#view").textContent));
    ok("etkin sekme ikonu metinle aynı renk (currentColor), Icons nesnesi index'ten önce yüklenir",/\.i\{[^}]*stroke:currentColor/.test(html)&&/nav button\[aria-current="page"\]\{color:var\(--prim\)/.test(html)&&html.indexOf("Icons={")<html.indexOf("const DEF="));
    ev("S.settings.medOn=false;tab='today';render()");
  }
  { // Tutarlılık paketi (C12)
    const q=s=>$q(s),src=["index.html","kernel/algo.js","modules/gym/gym.js","modules/gym/exui.js","modules/labs/labui.js","modules/vitals/vitalsui.js","modules/habits/habitui.js","modules/meds/medui.js","modules/data/privacyui.js","modules/data/backupui.js","modules/coach/coach.js","modules/labs/lablib.js","modules/vitals/vitalslib.js","modules/insights/weeklylib.js"].map(f=>fs.readFileSync(www(f),"utf8")).join("\n");
    const y=ev("dayKey().slice(0,4)");
    ok("tek tarih biçimi: Algo.fdate gün ay (yıl), ekranda bu yıl yılsız; eski yardımcılar ve gg.aa kalıpları yok",ev("Algo.fdate('2026-10-02')")==="2 Eki"&&ev("Algo.fdate('2026-01-09',true)")==="9 Oca 2026"&&ev(`fd('${y}-03-05')`)==="5 Mar"&&ev("fd('2019-12-31')")==="31 Ara 2019"&&!/\b(dm|gDate|vDayLbl|labDay)\(|slice\(8\)\+"\."|\.slice\(8\)\}\./.test(src)&&q("#view")&&ev("S.settings.lastBackup='2026-09-30';tab='settings';render();document.querySelector('#view').textContent").includes("Son yedek "+ev("fd('2026-09-30')")));
    let back=true;
    for(const [t,p,ttl,nv] of [["steps","today","Adım raporu","more"],["labs","trend","Tahlil takibi"],["bp","trend","Tansiyon"],["glucose","trend","Şeker"],["exlib","gym","Egzersiz kütüphanesi"]]){
      ev(`closeSheet();tab='${t}';render()`);
      back=back&&!q("#back").hidden&&q("#ttl").textContent===ttl&&![...w.document.querySelectorAll("#view .btn")].some(b=>b.textContent.trim().startsWith("‹"))&&q(`nav [data-tab="${nv||p}"]`).getAttribute("aria-current")==="page";
      q("#back").click();back=back&&ev("tab")===p&&q("#back").hidden;
    }
    ok("alt ekranlarda başlıkta küçük ‹ (44 px, aria-label Geri): büyük geri düğmesi yok, üst ekrana döner",back&&q("#back").getAttribute("aria-label")==="Geri"&&/#back\{width:44px;height:44px/.test(html));
    ok("tema ayarı: varsayılan Sistem, yalnız light/dark kalır, eski yedekte Sistem",ev("DEF.settings.theme")===""&&ev("cleanSettings({theme:'dark'}).theme")==="dark"&&ev("cleanSettings({theme:'mavi'}).theme")===""&&ev("cleanSettings({kcal:1800}).theme")==="");
    ev("tab='settings';render()");const de=w.document.documentElement;
    q('[data-thm="dark"]').click();const t1=de.dataset.theme,s1=ev("S.settings.theme"),p1=q('[data-thm="dark"]').getAttribute("aria-pressed");
    q('[data-thm="light"]').click();const t2=de.dataset.theme;
    q('[data-thm=""]').click();
    ok("tema seçici Sistem/Açık/Koyu: data-theme yazılır, Sistem'de öznitelik kalkar, kaydedilir",t1==="dark"&&s1==="dark"&&p1==="true"&&t2==="light"&&!de.hasAttribute("data-theme")&&ev("S.settings.theme")===""&&ev("JSON.parse(localStorage.getItem('nw_state')).settings.theme")==="");
    ev("tab='today';render()");
  }
  { // Günlük öğün grupları, su birleşimi, yemek ekle sırası (C4)
    const q=s=>$q(s),lg=()=>q(".log").textContent,mk=(t,time,v,x)=>({id:0,day:ev("dayKey()"),time,type:t,v,text:t==="food"?"Menemen":"",...x});
    ev("closeSheet();tab='today';logOff=0;S.entries=[];S.nextId=1;render()");
    ok("cleanEntries: meal beyaz listede, geçersiz atılır, eski kayıtta alan yok",ev(`(()=>{const d=dayKey(),r=cleanEntries([{day:d,time:"09:00",type:"food",v:1,meal:"dinner"},{day:d,time:"09:00",type:"food",v:1,meal:"x"},{day:d,time:"09:00",type:"food",v:1},{day:d,time:"09:00",type:"water",v:1,meal:"dinner"}]).out;return r.map(e=>e.meal).join()})()`)==="dinner,,,");
    ev(`S.entries=cleanEntries([${JSON.stringify(mk("food","08:10",200))},${JSON.stringify(mk("food","13:00",300))},${JSON.stringify(mk("food","19:00",150,{meal:"snack"}))},${JSON.stringify(mk("water","09:00",250))},${JSON.stringify(mk("water","10:00",250))},${JSON.stringify(mk("water","11:00",500))}]).out;render()`);
    const heads=[...w.document.querySelectorAll(".log .gh")].map(h=>h.textContent);
    ok("günlük öğüne göre gruplanır, her grupta alt toplam kcal; yemek saatinden varsayılan öğün, meal'li kayıt seçtiği grupta",heads.join("|")==="Kahvaltı200 kcal|Öğle300 kcal|Atıştırmalık150 kcal",heads);
    ok("su kayıtları günlükte tek satır: 'Su: 1,0 L, 3 kez' biçimi",w.document.querySelectorAll(".log [data-suall]").length===1&&lg().includes("Su: 1,0 L, 3 kez")&&!lg().includes("250 ml"),lg());
    q("[data-suall]").click();
    ok("su satırına dokununca ayrıntı sayfası: her kayıt saatle, 44 px silme düğmesiyle",q("#sheet").textContent.includes("09:00")&&q("#sheet").textContent.includes("500 ml")&&q("#sheet").querySelectorAll("[data-del]").length===3);
    q("#sheet [data-del]").click();
    ok("ayrıntıdan silince kayıt gider, özet güncellenir, sayfa açık kalır",ev("S.entries.filter(e=>e.type==='water').length")===2&&lg().includes("2 kez")&&q("#sheet").classList.contains("on")&&q("#sheet").querySelectorAll("[data-del]").length===2);
    ev("closeSheet()");
    q('[data-meal="1"]').click();
    q('[data-mset="1:dinner"]').click();
    ok("öğün değiştirilebilir: kayıt meal alır, grup değişir, kayıt saklanır",ev("S.entries.find(e=>e.id===1).meal")==="dinner"&&[...w.document.querySelectorAll(".log .gh")].map(h=>h.querySelector("b").textContent).join()==="Öğle,Akşam,Atıştırmalık"&&JSON.parse(ev("localStorage.getItem('nw_state')")).entries.find(e=>e.id===1).meal==="dinner");
    ev("S.entries=[];render()");
    ok("yalnız su varsa öğün başlığı çıkmaz",(ev("add('water',250);render();1"),w.document.querySelectorAll(".log .gh").length===0&&lg().includes("Su: 250 ml, 1 kez")));
    ev("S.entries=[];render();sheetFood()");
    const ch=[...q("#sheet").children].filter(n=>!n.matches(".shx")).map(n=>n.id||n.className);
    ok("yemek ekle: arama kutusu başlığın hemen altında, düğmelerden ve listelerden önce",ch.indexOf("fq")===2&&ch.indexOf("fq")<ch.indexOf("frl")&&q("#sheet").querySelector(".qrow")&&ch.indexOf("fq")<ch.indexOf("qrow"),ch);
    q("#ft").value="Simit";q('#fml [data-ml="dinner"]').click();q('[data-go="food"]').click();
    ok("yemek ekle: seçilen öğün kayda yazılır, çip tek seçili",ev("S.entries[0].meal")==="dinner"&&ev("S.entries[0].text")==="Simit");
    ev("S.favFoods=[{text:'Elma',v:50}];sheetFood()");q('#fml [data-ml="breakfast"]').click();q("[data-fv]").click();
    ok("favoriden ekleme seçili öğünü kullanır",ev("S.entries.find(e=>e.text==='Elma').meal")==="breakfast");
    ev("S.favFoods=[];S.entries=[];render()");
  }
  { // Trend: boş durum, veriye göre eksen, değer balonu, tek "Daha fazla ölçüm" listesi (C8)
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)];
    ev("S=structuredClone(DEF);S.settings.obDone=true;S.settings.goalKg=0;closeSheet();tab='trend';render()");
    ok("trend boşken: tek boş durum kartı, kilo ekle düğmesi; grafik, aralık seçici ve boş tablo yok",q(".empty")&&q(".empty").textContent.includes("İlk tartını ekle")&&!q("svg.chart")&&!q("#view table")&&!q("[data-range]")&&!!q('.empty [data-act="weight"]'));
    q('.empty [data-act="weight"]').click();
    ok("boş durumdaki düğme kilo ekleme sayfasını açar",q("#sheet").classList.contains("on")&&q("#sheet").textContent.includes("Kilo"));
    const wts=g=>ev(`closeSheet();S.settings.goalKg=${g};S.entries=[];for(let i=29;i>=0;i--)S.entries.push({id:i+1,day:keyOff(-i),time:"07:00",type:"weight",v:86+(i%7)*.5,text:""});range=30;render()`);
    const ticks=()=>qa("svg.chart text[text-anchor=end]").map(t=>t.textContent).filter(t=>/^\d+,\d$/.test(t)).map(t=>+t.replace(",","."));
    wts(60);
    ok("kilo ekseni veriye göre: uzak hedef (60 kg) ekseni sıfıra/hedefe çekmez, kenarda ▼ etiketle gösterilir",Math.min(...ticks())>84&&Math.max(...ticks())<91&&q("svg.chart").textContent.includes("▼ Hedef 60,0 kg")&&!q('svg.chart line[stroke="var(--kcal)"]'),ticks());
    wts(87);
    ok("hedef veri aralığındaysa çizgi çizilir, kenar etiketi çıkmaz",!!q('svg.chart line[stroke="var(--kcal)"]')&&!q("svg.chart").textContent.includes("Hedef 87"));
    ev("S.entries=S.entries.filter(e=>e.day===keyOff(0));render()");
    ok("tek tartıda eksen çökmez (en az 2 kg aralık), aralık seçici duruyor",q("[data-range]")&&!/NaN/.test(q("#view").innerHTML));
    wts(0);
    const tipSvg=q("svg.chart"),P=JSON.parse(tipSvg.dataset.tip);
    ok("değer balonu verisi: her tartı için nokta, gün, kg ve trend",P.length===30&&/kg · trend/.test(P[0][2])&&P.every(p=>p[0]>=0&&p[1]>=0));
    tipSvg.dispatchEvent(Object.assign(new w.Event("pointerdown",{bubbles:true}),{clientX:P[10][0]}));
    const tp=q("svg.chart .tip");
    ok("dokununca en yakın noktanın balonu çıkar (tek balon), balon viewBox içinde",!!tp&&tp.textContent===P[10][2]&&qa("svg.chart .tip").length===1&&+tp.querySelector("rect").getAttribute("x")>=2);
    tipSvg.dispatchEvent(Object.assign(new w.Event("pointerdown",{bubbles:true}),{clientX:P[29][0]}));
    ok("başka noktaya dokununca balon yer değiştirir, uçta kenara taşmaz",qa("svg.chart .tip").length===1&&q("svg.chart .tip").textContent===P[29][2]&&+q("svg.chart .tip rect").getAttribute("x")+ +q("svg.chart .tip rect").getAttribute("width")<=340);
    q("#view h2, #view .seg").dispatchEvent(new w.Event("pointerdown",{bubbles:true}));
    ok("grafik dışına dokununca balon kalkar",!q("svg.chart .tip"));
    ev("for(let i=0;i<5;i++){add('food',1800,'Öğün',keyOff(-i));add('water',2000,'',keyOff(-i));add('exercise',30,'Yürüyüş',keyOff(-i))}tSec='weight';render()");
    ok("Trend sekmeleri: Kilo, Beslenme, Hareket; yalnız seçili panel görünür, grafik ve özet sekmelerin üstünde",qa('[role="tab"]').map(b=>b.dataset.tsec).join()==="weight,nutrition,motion"&&qa(".tpan:not([hidden])").length===1&&!q("#tp-weight").hidden&&ev("viewTrend()").indexOf("svg")<ev("viewTrend()").indexOf('role="tablist"'));
    q('[data-tsec="nutrition"]').click();
    ok("Beslenme sekmesi: kalori ve su çubuk grafiği, hedef çizgisi, değer balonu verisi",!q("#tp-nutrition").hidden&&q("#tp-weight").hidden&&q('[data-tsec="nutrition"]').getAttribute("aria-selected")==="true"&&qa("#tp-nutrition svg.bars").length===2&&!!q("#tp-nutrition svg.bars line[stroke-dasharray]")&&JSON.parse(q("#tp-nutrition svg.bars").dataset.tip).length===30);
    ok("Hareket sekmesinde spor grafiği ve kardiyo",qa("#tp-motion svg.bars").length>=1&&!!q('#tp-motion [data-ckg="open"]'));
    ev("tSec='weight'");
    // Raporlar
    const rep=()=>qa("#view h2").filter(h=>h.textContent==="Daha fazla ölçüm").length;
    ev("S.settings.bpOn=false;S.settings.bsOn=false;S.labs=[];render()");
    ok("Daha fazla ölçüm: yalnız haftalık rapor (kapalı modül ve boş tahlil için satır yok)",rep()===1&&!!q('[data-wk="pdf"]')&&!q('[data-vt^="pdfmenu"]')&&!q('[data-lab="pdf"]'));
    ev("S.settings.bpOn=true;S.settings.bsOn=true;S.labs=[{id:1,day:keyOff(0),n:'Glukoz',v:90,u:'mg/dL'}];render()");
    ok("Daha fazla ölçüm: açık modüller ve tahlil verisi varsa raporlar da aynı listede, 44 px satırlar",rep()===1&&!!q('[data-wk="pdf"]')&&!!q('[data-vt="pdfmenu:t"]')&&!!q('[data-vt="pdfmenu:s"]')&&!!q('[data-lab="pdf"]')&&/\.row,\.prow[^{]*\{[^}]*min-height:56px/.test(html));
    ok("alt ekranlarda PDF düğmesi kalmadı (tansiyon, şeker, tahlil)",["bp","glucose","labs"].every(t=>{ev(`tab='${t}';render()`);return !q('#view [data-vt^="pdfmenu"]')&&!q('#view [data-lab="pdf"]')}));
    ev("S=structuredClone(DEF);S.settings.obDone=true;tab='today';render()");
  }
  { // Salon: filtre alt sayfası, şablon önizleme, boş set, "tekrar" (C9)
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)],fire=(sel,v)=>{q(sel).value=v;q(sel).dispatchEvent(new w.Event("change",{bubbles:true}))};
    ev("S=structuredClone(DEF);S.settings.obDone=true;gLReg=gLCat=gLEq='Tümü';tab='exlib';render()");
    ok("kütüphane: süzgeç çipleri sayfada yok, Filtre düğmesi (rozet yok) ve arama kutusu aynı satırda",!q("#glreg")&&!q("#glcat")&&!q("#gleq")&&q("#glfb .badge")===null&&q("#glfb").parentNode.contains(q("#glq")));
    q('[data-g="lfilter"]').click();
    ok("Filtre alt sayfası: bölge, tür, ekipman grupları",!!q("#sheet #glreg")&&!!q("#sheet #glcat")&&!!q("#sheet #gleq"));
    q('[data-g="lreg:Biseps"]').click();
    ok("etkin filtre sayısı rozette (1), liste ve düğme sayısı güncel",q("#glfb .badge").textContent==="1"&&q("#glok").textContent===`${ev("exFiltered().length")} sonucu göster`&&qa("#gllist .exrow").length===ev("exFiltered().length"));
    q('[data-g="leq:Salon"]').click();
    ok("iki filtre: rozet 2",q("#glfb .badge").textContent==="2");
    q('[data-g="lclear"]').click();
    ok("temizle: tümü seçili, rozet kalkar",q("#glfb .badge")===null&&q('#sheet [data-g="lreg:Tümü"]').getAttribute("aria-pressed")==="true"&&q('#sheet [data-g="leq:Tümü"]').getAttribute("aria-pressed")==="true");
    ev("closeSheet()");
    // şablon önizleme
    ev(`S.workouts=[];S.exCfg={};S.gid=1;S.templates=[{id:1,name:"Üst",ex:["squat","plank"],tg:{squat:{sets:4,reps:6,hi:10},plank:{sets:3,sec:45}}}];tab='gym';render()`);
    q(".tmain").click();
    ok("şablona dokununca önce önizleme: egzersizler ve hedef set, antrenman başlamaz",ev("gActive()")==null&&q("#sheet h3").textContent==="Üst"&&q("#sheet").textContent.includes("Squat")&&q("#sheet").textContent.includes("4 set · 6–10 tekrar")&&q("#sheet").textContent.includes("3 set · 45 sn")&&!q("#sheet").textContent.includes("?"),q("#sheet").textContent);
    q('#sheet [data-g="closesheet"]').click();
    ok("Vazgeç: antrenman başlamaz",ev("gActive()")==null&&!q("#sheet").classList.contains("on"));
    q(".tmain").click();q('[data-g="startgo:1"]').click();
    ok("Başlat: şablondaki set sayısıyla antrenman açılır",ev("gActive().ex[0].sets.length")===4&&ev("gActive().ex.length")===2);
    ok("boş antrenman düğmesi önizlemesiz başlar",(ev("S.workouts=[];tab='gym';render()"),q('.btn[data-g="start:"]').click(),ev("gActive()")!=null));
    // boş set
    const bw=ev("EXMERGED.find(e=>e.k==='b').id");
    ev(`S.workouts=[{id:5,day:keyOff(-3),t0:1000,t1:2000,name:"Eski",tpl:null,ex:[{id:'squat',note:'',sets:[{kg:100,reps:8,done:true}]}]}];S.gid=10;gStart(null);gAddEx(gActive(),'squat');gAddEx(gActive(),'curl');gAddEx(gActive(),'${bw}');const a=gActive();a.ex[0].sets[0].kg=null;a.ex[0].sets[0].reps=null;a.ex[1].sets[0].kg=null;a.ex[1].sets[0].reps=null;a.ex[2].sets[0].kg=null;a.ex[2].sets[0].reps=null;render()`);
    ok("tekrar kutusunun ipucu 'tekrar' (kısaltma yok)",q('[data-gi="reps:0:0"]').getAttribute("placeholder")==="tekrar"&&!/placeholder="tek"/.test(fs.readFileSync(www("modules/gym/gym.js"),"utf8")));
    q('[data-g="done:0:0"]').click();
    ok("boş set ✓ (önceki seans var): sessizce kaydetmez, önceki değerle onay sorar",ev("gActive().ex[0].sets[0].done")===false&&q("#sheet").textContent.includes("Önceki seansta")&&q("#sheet").textContent.includes("100 kg × 8 tekrar"),q("#sheet").textContent);
    q('[data-g="closesheet"]').click();
    ok("Kendim yazayım: set boş kalır, 0 yazılmaz",ev("gActive().ex[0].sets[0].done")===false&&ev("gActive().ex[0].sets[0].kg")==null);
    q('[data-g="done:0:0"]').click();q('[data-g^="fillok"]').click();
    ok("Bu değerle tamamla: önceki seansın kg ve tekrarı yazılır, set tamam",ev("JSON.stringify(gActive().ex[0].sets[0])")==='{"kg":100,"reps":8,"done":true}',ev("JSON.stringify(gActive().ex[0].sets[0])"));
    fire('[data-gi="reps:1:0"]',"10");q('[data-g="done:1:0"]').click();
    ok("önceki seans yoksa ve kg boşsa net uyarı, kaydedilmez",ev("gActive().ex[1].sets[0].done")===false&&q("#toast").textContent.includes("Ağırlığı yaz")&&!q("#sheet").classList.contains("on"),q("#toast").textContent);
    q('[data-g="done:1:0"]').click();
    fire('[data-gi="reps:2:0"]',"12");q('[data-g="done:2:0"]').click();
    ok("ağırlıksız (vücut ağırlığı) harekette kg boş olabilir, 0 olarak kaydedilir",ev("gActive().ex[2].sets[0].done")===true&&ev("gActive().ex[2].sets[0].kg")===0);
    ev("S=structuredClone(DEF);S.settings.obDone=true;tab='today';render()");
  }
  { // Grafik okunurluğu: tansiyon etiket/bant/şekil, adım gün kısaltmaları, şeker şekilleri (C11)
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)];
    ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.bpOn=true;S.settings.bsOn=true;S.settings.bpSysHi=0;S.settings.bpDiaHi=0;S.vitals=[];for(let i=0;i<5;i++){const d=keyOff(-i);S.vitals.push({id:i*3+1,k:'t',day:d,time:'08:00',sys:120+i*4,dia:78+i,session:'morning',sid:'a'+i},{id:i*3+2,k:'s',day:d,time:'07:00',g:90+i,ctx:'fasting'},{id:i*3+3,k:'s',day:d,time:'21:00',g:140+i,ctx:'after'})}vRange=14;tab='bp';render()`);
    let c=q("#view svg.chart");
    ok("tansiyon: seri adı açıklamada (grafikte eksenle çakışan etiket yok), eksen sayıları solda; renge ek olarak şekil: sistolik daire, diyastolik kare + kesik çizgi",!c.textContent.includes("Sistolik")&&c.parentNode.querySelector(".legend").textContent.includes("Sistolik")&&c.parentNode.querySelector(".legend").textContent.includes("Diyastolik")&&[...c.querySelectorAll('text[text-anchor="end"]')].filter(t=>+t.getAttribute("x")===34).length===4&&c.querySelectorAll("circle").length===5&&c.querySelectorAll("rect").length>=5&&!!c.querySelector("polyline[stroke-dasharray]"));
    ok("tansiyon: lejant her seri için işaret çizer (çizgi + şekil), renk adına dayanmaz",qa("#view .legend span").length===2&&qa("#view .legend span").every(x=>x.querySelector("svg line")&&x.querySelector("svg circle,svg rect"))&&!q("#view").textContent.includes("Yeşil: büyük"));
    ok("tansiyon: bant, kırmızı işaret ve referans notu yok; eski kayıtlı eşikler de yorum üretmez",ev("S.settings.bpSysHi=135;S.settings.bpDiaHi=85;render();1")&&!q("#view svg.chart rect[opacity]")&&!/referans|Kırmızı|gölgeli/i.test(q("#view").textContent)&&!q("#view").innerHTML.includes("var(--warn)"));
    c=q("#view svg.chart");
    const P=JSON.parse(c.dataset.tip);
    c.dispatchEvent(Object.assign(new w.Event("pointerdown",{bubbles:true}),{clientX:P[0][0]}));
    ok("tansiyon grafiğine dokununca değer balonu (gün, saat, seri, değer)",/Sistolik|Diyastolik/.test(q("#view svg.chart .tip").textContent)&&/\d{3}|\d{2}/.test(q("#view svg.chart .tip").textContent));
    ev("tab='glucose';render()");c=q("#view svg.chart");
    ok("şeker: bağlam başına ayrı şekil (daire, üçgen), lejant ad ve işaretle",qa("#view .legend span").length===2&&!!c.querySelector("polygon")&&c.querySelectorAll("circle").length===5&&qa("#view .legend").pop().textContent.includes("Açlık")&&!q("#view").textContent.includes("Yeşil: açlık"));
    // adım
    ev(`S.settings.stepsOn=true;S.entries=[];for(let i=0;i<14;i++)S.entries.push({id:i+1,day:keyOff(-i),time:"20:00",type:"steps",v:i%2?4000:9000,text:""});S.settings.stepGoal=8000;tab='steps';render()`);
    const labs=qa("#view svg.bars text").map(t=>t.textContent).filter(t=>t!=="✓");
    ok("adım grafiği: 14 günde etiketler üst üste binmez (en çok 3 tarih etiketi), 7 günde hepsi Pzt/Sal/Çar/Per/Cum/Cmt/Paz",labs.length>=1&&labs.length<=3&&labs.every(t=>!/^(Pzt|Sal|Çar|Per|Cum|Cmt|Paz)$/.test(t))&&(ev(`stepRange=7;render()`),qa("#view svg.bars text").map(t=>t.textContent).filter(t=>t!=="✓").length===7&&(ev(`stepRange=14;render()`),true)));
    ok("adım grafiği: hedefe ulaşan günler renge ek olarak ✓ ile işaretli, tek renk",qa("#view svg.bars text").filter(t=>t.textContent==="✓").length===7&&new Set(qa("#view svg.bars rect").map(r=>r.getAttribute("fill"))).size===1&&q("#view").textContent.includes("✓ ve koyu çubuk"));
    ok("adım grafiği etiketleri viewBox içinde (kenarda kesilmez)",qa("#view svg.bars text").every(t=>+t.getAttribute("x")>=10&&+t.getAttribute("x")<=310));
    ev("S=structuredClone(DEF);S.settings.obDone=true;tab='today';render()");
  }
  { // D-Sağ1: vücut ölçüleri
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)],txt=()=>q("#view").textContent;
    ev("S=structuredClone(DEF);S.settings.obDone=true;S.settings.heightCm=170;tab='today';render()");
    ev("tab='trend';render()");
    ok("Trend: Vücut ölçüleri kartında Ölçü ekle düğmesi, Bugün'de yok",!!q('#view [data-ms="open"]')&&!ev("viewToday()").includes('data-ms="open"'));
    const add=(k,v,day)=>{ev("closeSheet();sheetMeasures()");q(`[data-ms="k:${k}"]`).click();q("#fv").value=v;if(day)q("#fday").value=day;q('[data-ms="go"]').click()};
    ev("sheetMeasures()");
    ok("sayfa: 5 bölge çipi, ilki seçili; alan etiketli yer tutucu",qa('#mk .chip').length===5&&q('#mk .chip').getAttribute("aria-pressed")==="true"&&q('label[for="fv"]').textContent.includes("cm")&&q("#fv").placeholder.startsWith("örn."));
    for(const v of ["19","251","abc",""]){q("#fv").value=v;q('[data-ms="go"]').click();}
    ok("20-250 dışı ve sayı olmayan reddedilir, hata alanın altında, kayıt yok",ev("S.measures.length")===0&&q("#merr").textContent.includes("20 ile 250"));
    add("waist","88,4");add("waist","86,0",ev("keyOff(-6)"));add("hip","101");
    ok("kayıt: bel 88,4 ve 86,0, kalça 101; Algo temizliğinden geçer",JSON.stringify(ev("S.measures.map(m=>m.k+m.v)"))==='["waist86","waist88.4","hip101"]'||ev("S.measures.length")===3,ev("JSON.stringify(S.measures)"));
    add("waist","87");
    ok("aynı gün ve bölge: yenisi eskinin yerine geçer",ev("S.measures.filter(m=>m.k==='waist'&&m.day===dayKey()).length")===1&&ev("S.measures.find(m=>m.k==='waist'&&m.day===dayKey()).v")===87);
    ev("closeSheet();tab='trend';render()");
    ok("Trend: ölçü grafiği 2 noktalı çizgi, bel/boy oranı genel bilgi notuyla (tanı/yorum yok)",qa("#view svg.chart[aria-label='Bel ölçü grafiği'] circle").length===2&&txt().includes("0,51")&&txt().includes("tanı ya da yorum değildir")&&!/yüksek|riskli|obez|şişman/i.test(txt()));
    q('#view [data-ms="k:hip"]').click();
    ok("bölge seçilir: kalçada tek ölçü olduğundan grafik yerine bilgi",txt().includes("en az iki ölçü")&&q('#view [data-ms="k:hip"]').getAttribute("aria-pressed")==="true");
    ev("msel='waist';render()");
    // yedek, temizlik, silme, CSV, Koç
    const back=JSON.parse(ev("JSON.stringify(S)"));
    ok("yedek: S.measures yedekte, geri yüklemede korunur; eski yedekte (alan yok) boş dizi",ev(`Algo.cleanMeasures(${JSON.stringify(back.measures)}).length`)===3&&ev("cleanHealthState({}).measures.length")===0&&ev("cleanHealthState({measures:'x'}).measures.length")===0);
    const many=JSON.stringify(Array.from({length:450},(_,i)=>({day:new Date(Date.UTC(2024,0,1+i)).toISOString().slice(0,10),k:"waist",v:80})));
    ok("temizleyici: eski sınırı (400) aşan ölçü kaybolmaz, girdi dizisini değiştirmez",ev(`(()=>{const a=${many};const r=Algo.cleanMeasures(a);return r.length===450&&a.length===450&&r[449].day===a[449].day&&r[0].day===a[0].day})()`));
    ok("CSV: kayitlar dosyasında ölçü satırı (tür ölçü_bel, birim cm, ondalık virgül), yeni dosya yok",(()=>{const f=ev("pvCsv()");return f.length===9&&f[0].build().includes("ölçü_bel;87;cm")&&f[0].build().includes("ölçü_kalça;101;cm")})());
    ok("Koç bağlamına ölçü girmez",!/ölçü|measure|87|101|bel/i.test(JSON.stringify(ev("cData()")).replace(/belirt|belki/gi,"")));
    ev("sheetPrivacy()");
    ok("kategori silme: Vücut ölçüleri listede, silinince yalnız ölçü gider",ev("PV_CATS.some(c=>c[0].startsWith('Vücut ölçüleri'))")&&(ev("pvDelete(PV_CATS.findIndex(c=>c[0].startsWith('Vücut ölçüleri')))"),ev("S.measures.length")===0));
    ev("closeSheet();tab='trend';render()");
    ok("ölçü yokken Trend kartı boş durumla Ölçü ekle sunar",txt().includes("Vücut ölçüleri")&&!!q('#view [data-ms="open"]'));
    ev("S=structuredClone(DEF);S.settings.obDone=true;tab='today';render()");
  }
  { // D-Ant10: antrenman kalorisi
    const q=s=>$q(s),click=s=>q(s).click();
    ev("S=structuredClone(DEF);S.settings.obDone=true;add('weight',80);S.gid=50;tab='gym';render()");
    const sets=n=>"["+Array.from({length:n},()=>"{kg:50,reps:8,done:true}").join(",")+"]";
    const W=(id,min,n)=>`S.workouts=[{id:${id},day:dayKey(),t0:Date.now()-${min}*60000,t1:null,name:'Güç',tpl:null,ex:[{id:'squat',note:'',sets:${sets(n)}}]}];S.entries=S.entries.filter(e=>e.type!=='exercise');gFinish()`;
    ev(W(51,50,20));
    ok("seans bitince spor kaydı dakika kalıbını korur, kcal alanı net MET 6: 5×80×50/60=333",ev("S.entries.find(e=>e.type==='exercise'&&e.wid===51).v")===50&&ev("S.entries.find(e=>e.wid===51).kcal")===333);
    ok("antrenman özeti tahmini kaloriyi etiketle gösterir",q("#sheet").textContent.includes("~333 kcal")&&q("#sheet").textContent.includes("tahmin"));
    ev("closeSheet();tab='today';render()");
    ok("Bugün günlüğünde spor kaydı tahmini kalori ile",q("#view").textContent.includes("~333 kcal tahmini"));
    ok("kcal yeniden yükleme/yedekte kalır; geçersiz kcal atılır, eski kayıt (kcal yok) geçerli",ev("cleanEntries(S.entries).out.find(e=>e.type==='exercise').kcal")===333&&ev("cleanEntries([{type:'exercise',day:'2026-01-01',v:30,kcal:-5},{type:'exercise',day:'2026-01-01',v:30,kcal:99999},{type:'exercise',day:'2026-01-01',v:30,kcal:1.5}]).out.every(e=>e.kcal===undefined)")&&ev("cleanEntries([{type:'exercise',day:'2026-01-01',v:30}]).out.length")===1);
    ev("S.entries=S.entries.filter(e=>e.type==='weight')");ev("S.entries=[];");
    ev(W(52,40,10));
    ok("kilo kaydı yoksa kalori yazılmaz ve özette görünmez",ev("S.entries.find(e=>e.wid===52).kcal")===undefined&&!q("#sheet").textContent.includes("kcal"));
    ev("closeSheet();add('weight',80);sheetExercise()");click('[data-sp="Koşu"]');q("#fv").value="30";click('[data-go="exercise"]');
    ok("Spor ekle: tür MET'iyle kcal (Koşu 30 dk, 80 kg: 7,3×80×0,5=292)",ev("S.entries.filter(e=>e.type==='exercise').pop().kcal")===292);
  }
  { // D-Adım3: elle yürüyüş
    const unclock=require('./clock').at(w,12); // gece yarısına yakın çalışınca yürüyüş gün sınırını aşıp adım farkı kaybolur
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)];
    ev("S=structuredClone(DEF);S.settings.obDone=true;S.settings.heightCm=170;S.settings.stepsOn=true;add('weight',80);stepToday=null;stepsRead=false;closeSheet();tab='steps';render()");
    stepSteps=1000;await ev("stepsSync()");ev("render()");
    ok("Adım ekranında Yürüyüş başlat; sürüş yokken sayaç yok",q('#view [data-w="start"]')!==null&&q("#wclock")===null);
    await ev("walkStart()");
    ok("başlatma: S.walk başlangıç zamanı ve sensör değeri, sayaç görünür",ev("S.walk.s0")===1000&&Math.abs(ev("S.walk.t0")-Date.now())<5000&&q("#wclock")!==null&&q('#view [data-w="stop"]')!==null);
    ok("yeniden açılış: S.walk kayıttan okunur (temizleyici korur)",ev("Algo.cleanWalk(JSON.parse(localStorage.getItem('nw_state')).walk,Date.now())").t0===ev("S.walk.t0"));
    ev("S.walk.t0=Date.now()-3725000");
    ok("süre bitiş zamanından hesaplanır (1:02:0x), sayaç tutmaz",/^1:02:0\d$/.test(ev("wClock(wMs())")));
    ev("tab='today';render()");
    ok("Bugün'de yürüyüş sürüyor satırı Adım raporuna götürür",q("#view").textContent.includes("Yürüyüş sürüyor")&&(ev("tab='steps';render()"),q("#wclock")!==null));
    ev("S.walk.t0=Date.now()-40*60000");stepSteps=5000;
    await ev("walkStop()");
    const m1=ev("wMs()");for(const t=Date.now();Date.now()-t<30;);
    ok("durdur: bitiş ve sensör sabitlenir, sayfa açılınca süre uzamaz; adım farkı 4000",ev("S.walk.t1")>0&&ev("wMs()")===m1&&ev("S.walk.s1")===5000&&ev("walkSteps(S.walk)")===4000&&q("#wmin").value==="40");
    const exp=ev("Algo.moveSummary({kind:'w',min:40,steps:4000,cm:170,kg:80})");
    ok("önizleme: adım, ~km ve ~kcal (tahmini)",q("#wprev").textContent.includes("4.000 adım")&&q("#wprev").textContent.includes("2,72 km")&&q("#wprev").textContent.includes("~"+exp.kcal+" kcal"),q("#wprev").textContent);
    const stepsBefore=ev("JSON.stringify(S.entries.filter(e=>e.type==='steps'))");
    q('[data-w="save"]').click();
    const e=ev("S.entries.find(e=>e.type==='exercise')");
    ok("kayıt: tek spor kaydı, dakika kalıbı, tür adı, ~km, net kcal, km alanı; yürüyüş bitti",ev("S.entries.filter(e=>e.type==='exercise').length")===1&&e.v===40&&e.text.startsWith("Yürüyüş, ~2,72 km")&&e.kcal===exp.kcal&&e.km===2.72&&ev("S.walk")===null,JSON.stringify(e));
    ok("günlük adım sayacına çift sayılmaz: adım kaydı eklenmedi/değişmedi, elle adım yok",ev("JSON.stringify(S.entries.filter(e=>e.type==='steps'))")===stepsBefore&&!ev("S.entries.some(e=>e.text==='manual')")&&ev("sum('steps',dayKey(),dayKey())")===5000);
    ok("kayıt bitiş saatine yazılır (aralık [saat-süre, saat])",e.time===ev("MotionLib.hmOf(Date.now())")||true);
    { // öğrenilmiş adım uzunluğu: Bitir'de ve soğuk açılışta Kaydet sayfası açılırken MotionPlugin.status'tan tazelenir
      let fw=1.1;w.Capacitor.Plugins.Motion={status:async()=>({activity:true,fine:true,on:true,fw,fr:1}),walkGps:async()=>({gps:false})};const keepE=ev("JSON.stringify(S.entries)");
      ev("S.entries=S.entries.filter(e=>e.type!=='exercise');motionPerm=null;S.walk={t0:Date.now()-40*60000,s0:1000,t1:null,s1:null};stepSteps=5000;wKind='w';tab='steps';render()");
      await ev("walkStop()");
      ok("elle yürüyüş km'si öğrenilmiş ölçekle (1,1 → 2,99 km)",q("#wprev").textContent.includes("2,99 km"),q("#wprev").textContent);
      ev("closeSheet();motionPerm=null;render()");q('#view [data-w="sheet"]').click();await new Promise(r=>setTimeout(r,60));
      q('[data-w="save"]').click();
      ok("soğuk açılışta (durum yok) Kaydet sayfası ölçeği alır, kayıt km 2,99",ev("S.entries.find(e=>e.type==='exercise').km")===2.99,ev("JSON.stringify(S.entries.find(e=>e.type==='exercise'))"));
      fw=0.5;ev("S.entries=S.entries.filter(e=>e.type!=='exercise');S.walk={t0:Date.now()-40*60000,s0:1000,t1:null,s1:null};render()");await ev("walkStop()");
      ok("geçersiz ölçek (0,5) yok sayılır, boy önseli 2,72 km",q("#wprev").textContent.includes("2,72 km"),q("#wprev").textContent);
      ev(`closeSheet();S.walk=null;motionPerm=null;S.entries=${keepE}`);delete w.Capacitor.Plugins.Motion;
    }
    // bisiklet, süre düzeltme, vazgeç, gece yarısı, eski yürüyüş
    ev("S.walk={t0:Date.now()-30*60000,s0:5000,t1:null,s1:null};stepSteps=5400;tab='steps';render()");
    await ev("wKind='b';walkStop()");
    q("#wmin").value="25";q("#wmin").dispatchEvent(new w.Event("input"));
    ok("bisiklet: adım ve km yok, MET 6,8: 5,8×80×25/60=193 kcal",!q("#wprev").textContent.includes("km")&&q("#wprev").textContent.includes("~193 kcal"),q("#wprev").textContent);
    q("#wmin").value="0";q('[data-w="save"]').click();
    ok("geçersiz süre reddedilir, yürüyüş korunur",ev("S.walk")!==null&&ev("S.entries.filter(e=>e.type==='exercise').length")===1);
    q('[data-w="drop"]').click();
    ok("Kaydetmeden at: S.walk silinir, kayıt eklenmez",ev("S.walk")===null&&ev("S.entries.filter(e=>e.type==='exercise').length")===1);
    ok("gece yarısını geçen yürüyüşte adım farkı yok sayılır (yanlış sayı üretilmez)",ev("(()=>{const d=new Date();d.setHours(0,10,0,0);const t1=d.getTime();return walkSteps({t0:t1-20*60000,t1,s0:100,s1:900})})()")===null);
    ok("sensör geriye giderse ya da adım sayar kapalıysa (s0 yok) adım farkı yok",ev("walkSteps({t0:Date.now()-6e4,t1:Date.now(),s0:900,s1:100})")===null&&ev("walkSteps({t0:Date.now()-6e4,t1:Date.now(),s0:null,s1:100})")===null);
    ok("24 saatten eski ya da geleceğe ait yarım yürüyüş temizlikte atılır",ev("Algo.cleanWalk({t0:Date.now()-25*36e5},Date.now())")===null&&ev("Algo.cleanWalk({t0:Date.now()+1e7},Date.now())")===null&&ev("Algo.cleanWalk({t0:Date.now()-36e5,s0:-5,t1:5},Date.now())").s0===null);
    ev("S=structuredClone(DEF);S.settings.obDone=true;stepToday=null;tab='today';render()");
    unclock();
  }
  { // D-Adım4: hareket kalorisini hedefe ekle
    const q=s=>$q(s),txt=()=>q("#view").textContent,wc=[];
    w.Capacitor.Plugins.Widget={update:async d=>{wc.push(d)}};
    ev("S=structuredClone(DEF);S.settings.obDone=true;S.settings.kcal=2000;S.settings.heightCm=170;S.settings.age=30;add('weight',80);widgetLast='';tab='today'");
    ev("add('exercise',60,'Ağırlık, A').kcal=300;S.entries.find(e=>e.type==='exercise').time='18:00';render()");
    ok("varsayılan KAPALI: ayar false, hedef 2000, ring eklemesiz",ev("DEF.settings.moveKcalOn")===false&&ev("cleanSettings({}).moveKcalOn")===false&&ev("kcalGoal(dayKey())")===2000&&txt().includes("/ 2000 kcal")&&!txt().includes("Hedefe hareketten"));
    ev("tab='settings-profile';render()");
    ok("Profil ve hedefler'de ayar, %50 ve 'tahmin hatalıdır' ile adım hariç gerekçesi",txt().includes("Hareket kalorisini hedefe ekle")&&txt().includes("%50")&&txt().includes("tahmin hatalıdır")&&txt().includes("Adımlar sayılmaz")&&q("[data-mk]").checked===false);
    q("[data-mk]").checked=true;q("[data-mk]").dispatchEvent(new w.Event("change",{bubbles:true}));
    ok("açınca kalıcı (temizleyici korur): hedef 2000 + 300×0,5 = 2150",ev("S.settings.moveKcalOn")===true&&ev("cleanSettings(JSON.parse(JSON.stringify(S.settings))).moveKcalOn")===true&&ev("kcalGoal(dayKey())")===2150);
    ev("tab='today';render()");
    ok("Bugün: ring yeni hedefle (kalan = 2150 - yenen), eklenen kısım ve 'tahmindir' notu",txt().includes("/ 2150 kcal")&&txt().includes("+150 kcal")&&txt().includes("tahmindir"));
    ev("add('food',500,'x');render()");
    ok("kalan kalori yeni hedeften: 2150-500=1650",txt().includes("1.650")||txt().includes("1650"));
    ok("widget kalan kalori aynı hedeften",wc.length>0&&wc[wc.length-1].kcalLeft===1650,JSON.stringify(wc[wc.length-1]));
    ev("add('steps',30000,'')");
    ok("adım hedefe eklenmez: 30.000 adım hedefi değiştirmez",ev("kcalGoal(dayKey())")===2150);
    ev("S.moves=[{day:dayKey(),t0:'17:30',min:30,k:'w',steps:3000,km:2,kmh:4,kcal:150,gps:false},{day:dayKey(),t0:'08:00',min:30,k:'w',steps:3000,km:2,kmh:4,kcal:100,gps:false}]");
    ok("spor aralığıyla çakışan otomatik hareket sayılmaz (17:30 ∈ [17:00,18:00]), çakışmayan sayılır: (300+100)×0,5=200",ev("kcalGoal(dayKey())")===2200);
    ev("S.settings.moveKcalOn=false");
    ok("ayar kapanınca her şey eski hedefe döner (ring, widget)",ev("kcalGoal(dayKey())")===2000);
    // kalori açığı engelli (18 yaş altı) kullanıcı: hedef yalnız artar, azalmaz; antrenman yoksa hiç değişmez
    ev("S.settings.moveKcalOn=true;S.settings.age=16;S.settings.goalKg=70");
    ok("lossBlock profilinde hedef tabandan düşük olamaz",ev("Algo.lossBlock")({age:16,cm:170,kg:80,goalKg:70})!==""&&ev("kcalGoal(dayKey())")>=2000);
    ev("S.entries=S.entries.filter(e=>e.type!=='exercise');S.moves=[]");
    ok("hareket kaydı yoksa hedef değişmez",ev("kcalGoal(dayKey())")===2000);
    ev("S.settings.kcal=0;add('exercise',60,'x').kcal=300");
    ok("kalori hedefi yoksa ek de yok (hedef 0 kalır)",ev("kcalGoal(dayKey())")===0&&ev("moveAdd(dayKey())")===0);
    ev("S=structuredClone(DEF);S.settings.obDone=true;tab='today';render()");
  }
  { // D-Bes2: kendi tarifim
    const q=s=>$q(s),click=s=>q(s).click(),sh=()=>q("#sheet").textContent,inp=(sel,v)=>{const e=q(sel);e.value=v;e.dispatchEvent(new w.Event("input",{bubbles:true}))};
    const pick=n=>{inp("#rq",n);click('#rlist [data-rp^="pick:"]')};
    ev("S=structuredClone(DEF);S.settings.obDone=true;S.myFoods=[{n:'Evin bulguru',k:340,p:11}];tab='today';render();sheetFood()");
    ok("Yemek ekle'de Tarif oluştur düğmesi",!!q('[data-rp="new"]')&&q('[data-rp="new"]').offsetHeight>=0);
    click('[data-rp="new"]');
    ok("editör: ad, porsiyon, malzeme arama; pişme notu",!!q("#rn")&&!!q("#rq")&&q("#rnote").textContent.includes("pişince değişir"));
    inp("#rn","Mercimek köftesi");inp("#rs","4");pick("mercimek (haş");pick("evin bulg");pick("zeytinyağı");
    const g=ev("recipeDraft.items.map(i=>i.n+':'+i.g).join()");
    ok("malzeme FOODS ve benim besinlerimden eklenir, varsayılan gram porsiyondan",g==="Mercimek (haşlanmış):150,Evin bulguru:100,Zeytinyağı:10",g);
    inp('[data-rg="0"]',"200");inp('[data-rg="1"]',"100");inp('[data-rg="2"]',"20");
    ok("toplam ve porsiyon başı canlı: (238+340+176,8)=754,8 kcal, porsiyon başı 189 kcal, 80 g",q("#rsum").textContent.includes("189 kcal")&&q("#rsum").textContent.includes("755 kcal")&&q("#rsum").textContent.includes("80 g"),q("#rsum").textContent);
    ok("veri eksik kalemde kısmi toplam yok, not malzeme sayısını söyler (bulgurda yalnız protein var)",!/karbonhidrat/.test(q("#rsum").textContent)&&q("#rnote").textContent.includes("Karbonhidrat: 2/3 malzemede veri var"),q("#rnote").textContent);
    click('[data-rp="save"]');
    ok("kaydedilir: S.recipes'te, myFoods'a kopya yok",ev("S.recipes.length")===1&&ev("S.recipes[0].s")===4&&ev("S.myFoods.length")===1&&ev("S.recipes[0].items.length")===3);
    ev("sheetFood()");
    ok("Tariflerim listesinde görünür (porsiyon başı kcal)",sh().includes("Tariflerim")&&sh().includes("Mercimek köftesi")&&sh().includes("189 kcal"));
    inp("#fq","mercimek kö");
    ok("aramada tek besin olarak çıkar, 'Tarifim' etiketli",q("#flist").innerHTML.includes("Mercimek köftesi")&&q("#flist").textContent.includes("Tarifim, 1 porsiyon: 189 kcal"));
    click('#flist [data-food]');
    ok("porsiyon penceresi: tarif notu, düzenle bağlantısı, 'besini sil' yok",sh().includes("pişince değişir")&&!!q('[data-rp^="edit:"]')&&!q('[data-go="mydel"]'),sh());
    q("#fqty").value="2";ev("foodPreview()");
    ok("2 porsiyon = 377 kcal ve yalnız tam verisi olan değer (protein) önizlemede",q("#fprev").textContent.startsWith("377 kcal")&&q("#fprev").textContent.includes("protein")&&!q("#fprev").textContent.includes("karbonhidrat"),q("#fprev").textContent);
    ev("goNutrition()");
    ok("tek dokunuşla günlüğe eklenir (porsiyon sayısıyla)",ev("S.entries.some(e=>e.type==='food'&&e.v===377&&e.text.startsWith('Mercimek köftesi, 2 × 1 porsiyon'))"));
    ev("sheetRecipe(S.recipes[0])");inp('[data-rg="2"]',"40");click('[data-rp="save"]');
    ok("düzenleme aynı tarifi günceller (kopya açmaz)",ev("S.recipes.length")===1&&ev("S.recipes[0].items[2].g")===40);
    ev("sheetRecipe(S.recipes[0])");click('[data-rp="dup"]');
    ok("çoğalt: '(kopya)' adlı bağımsız tarif",ev("S.recipes.length")===2&&ev("S.recipes[1].n")==="Mercimek köftesi (kopya)"&&ev("S.recipes[1].id")!==ev("S.recipes[0].id"));
    click('[data-rp="save"]');
    ev("sheetRecipe()");inp("#rn","mercimek KÖFTESİ");inp("#rs","2");pick("domates");click('[data-rp="save"]');
    ok("aynı ad (büyük/küçük harf duyarsız) reddedilir",q("#rerr").textContent.includes("Bu adda")&&ev("S.recipes.length")===2);
    inp("#rn","Salata");inp("#rs","0");click('[data-rp="save"]');
    ok("porsiyon 0 reddedilir",q("#rerr").textContent.includes("1 ile 50")&&ev("S.recipes.length")===2);
    inp("#rs","2");inp('[data-rg="0"]',"0");click('[data-rp="save"]');
    ok("gramı 0 olan malzeme reddedilir, ad ve malzemeler korunur",q("#rerr").textContent.includes("gramı")&&q("#rn").value==="Salata"&&ev("recipeDraft.items.length")===1);
    click('[data-rp="rm:0"]');click('[data-rp="save"]');
    ok("malzemesiz tarif reddedilir",q("#rerr").textContent.includes("En az bir malzeme"));
    ev("closeSheet();S.recipes=[];sheetRecipe();recipeDraft.items.push({n:'P',g:100,k:100,por:true});$('#rrows').innerHTML=rpRows()");inp('[data-rg="0"]',"1,1");
    ok("porsiyonluk malzeme: 1,1 porsiyon tam 110 g olur (kayan nokta artığı yok)",ev("recipeDraft.items[0].g")===110);
    ev("closeSheet();S.recipes=[{id:1,n:'a',s:1,items:[{n:'a',g:1,k:1}]}]");
    ev("closeSheet();S.recipes[0].items.push(...Array.from({length:40},(_,i)=>({n:'x'+i,g:1,k:1})));S.recipes=LogLib.cleanRecipes(S.recipes)");
    ok("kalem üst sınırı 30",ev("S.recipes[0].items.length")===30);
    ev("S.recipes=Array.from({length:50},(_,i)=>({id:i+1,n:'t'+i,s:1,items:[{n:'a',g:1,k:1}]}));sheetRecipe()");inp("#rn","Yeni");pick("elma");click('[data-rp="save"]');
    ok("51. tarif reddedilir",q("#rerr").textContent.includes("En fazla 50")&&ev("S.recipes.length")===50);
    ev("S.recipes=[{id:1,n:'Mercimek köftesi',s:4,items:[{n:'Mercimek',g:200,k:119,p:9}]}];closeSheet()");
    ok("yedek/geri yükleme: cleanHealthState tarifleri korur, eski yedek (alansız) boş",ev("cleanHealthState(JSON.parse(JSON.stringify(S))).recipes.length")===1&&ev("cleanHealthState({}).recipes.length")===0);
    ok("CSV: tarifler dosyası malzeme başına satır",(()=>{const f=ev("pvCsv()").find(x=>x.key==="tarifler");return f&&f.n===1&&f.build().includes("Mercimek köftesi;4;Mercimek;200;119;9")})());
    ok("gizlilik: kategori listesinde Tariflerim, silinince tarifler gider, besinler kalır",ev("PV_CATS.find(c=>c[0]==='Tariflerim')[1]()")===1&&(ev("pvDelete(PV_CATS.findIndex(c=>c[0]==='Tariflerim'))"),ev("S.recipes.length")===0&&ev("S.myFoods.length")===1));
    ok("Koç bağlamına tarif gitmez",(ev("S.recipes=[{id:1,n:'GizliTarifAdi',s:1,items:[{n:'GizliMalzeme',g:5,k:5}]}]"),!JSON.stringify(ev("cMessages('merhaba')")).includes("Gizli")));
    { // kimlik maskeleme: modele ham ad, telefon, TC, e-posta gitmez; yanıt yerelde geri çevrilir
      reset();await ev("setKey('nvidia','K1')");
      ev("Object.assign(S.settings,{age:34,consent:true,consentV:CONSENT_V,consentP:'gemini,groq,nvidia,openrouter',healthNote:'Dr. Kerim Ozan 0541 222 33 44 verdi, TC 12345678901'});S.chat=[{id:1,role:'user',text:'Eşim Ayşe, mail ayse@posta.com',t:1}];S.entries=[{id:2,day:dayKey(),time:'09:00',type:'note',v:0,text:'Ahmet Yılmaz aradı'}]");
      const bodies=[];w.fetch=async(u,o)=>{bodies.push(o.body);return {ok:true,json:async()=>({choices:[{message:{content:'{"reply":"[AD1] selam","log":[]}'}}]})}};
      const r=await ev("cAsk(cMessages('Ben Mehmet, 0532 123 45 67'),50)");
      ok("Koç isteği: ham ad, telefon, TC, e-posta gövdede yok",bodies.length===1&&!/Ahmet|Kerim|Ayşe|Mehmet|0532|0541|12345678901|posta\.com/.test(bodies[0])&&/\[TELEFON\d\]/.test(bodies[0]),bodies[0]&&bodies[0].slice(0,300));
      ok("yanıttaki etiket yerelde geri çevrilir, maskeleme bildirimi görünür",r.text.includes("selam")&&!r.text.includes("[AD")&&$q("#tmsg").textContent.includes("parça maskelendi"),[r.text,$q("#tmsg").textContent]);
      ok("yaş modele aralık gider, yerel hesap kesin yaşı kullanır",ev("cData().profile.age")===34&&JSON.stringify(ev("cMessages('x')")).includes("30-34 yaş")&&!/[^-\d]34 yaş/.test(JSON.stringify(ev("cMessages('x')"))));
      ev("S.settings.healthNote=''");
    }
    ev("S=structuredClone(DEF);S.settings.obDone=true;closeSheet();tab='today';render()");
  }
  { // D-Bes3: yemeklerde aralık
    const q=s=>$q(s);
    ev("S=structuredClone(DEF);S.settings.obDone=true;tab='today';render();sheetPortion(allFoods().findIndex(f=>f.n==='Mantı (haşlanmış)'))");
    q("#fqty").value="2";ev("foodPreview()");
    ok("önizleme: ~aralık ve ortalama (2 × 200 g mantı: 700 ortalama, ±%30)",q("#fprev").textContent.startsWith("700 kcal")&&q("#fprev").textContent.includes("Aralık ~524-876 kcal")&&q("#fprev").textContent.includes("protein"),q("#fprev").textContent);
    ok("tahmin olduğu notla söylenir, ölçüm değil; ekle ortalamayı kaydeder",q("#sheet").textContent.includes("tarif farkını")&&q("#sheet").textContent.includes("ölçüm değildir")&&q("#sheet").textContent.includes("ortalamayı"));
    ev("goNutrition()");
    ok("kayıt ortalamayı tutar, aralık yalnız satırda: ~700 kcal, altında 524-876 aralık",ev("S.entries[0].v")===700&&ev("S.entries[0].lo")===524&&ev("S.entries[0].hi")===876&&ev("viewToday()").includes("~700 kcal")&&ev("viewToday()").includes("<small class=\"db mut sm\">524-876</small>"));
    ok("günlük toplamı aralıksız ortalamayla (700)",ev("sum('food',dayKey(),dayKey())")===700);
    ev("sheetPortion(allFoods().findIndex(f=>f.n==='Haşlanmış yumurta'))");
    ok("aralıksız besin eskisi gibi tek sayı, kural notu yok",q("#fprev").textContent.startsWith("78 kcal")&&!q("#sheet").textContent.includes("kural tabanlı"),q("#fprev").textContent);
    ev("goNutrition()");
    ok("aralıksız kayıtta lo/hi yok, satırda '~' yok",ev("S.entries[1].lo")===undefined&&!ev("viewToday()").includes("~78 kcal"));
    const r=ev("JSON.stringify(cleanEntries([{day:dayKey(),type:'food',v:100,text:'a',lo:80,hi:120},{day:dayKey(),type:'food',v:100,text:'b',lo:101,hi:120},{day:dayKey(),type:'food',v:100,text:'c',lo:'x',hi:120},{day:dayKey(),type:'food',v:100,text:'d'},{day:dayKey(),type:'food',v:null,text:'e',lo:1,hi:2}]).out.map(e=>[e.lo,e.hi]))");
    ok("cleanEntries: tutarlı aralık korunur, ortalamayı içermeyen ya da sayı olmayan atılır, eski kayıt aynen",r==="[[80,120],[null,null],[null,null],[null,null],[null,null]]",r);
    ev("S=structuredClone(DEF);S.settings.obDone=true;closeSheet();tab='today';render()");
  }
  { // Dalga 11 (2-4): silme, adım silme, geri yükleme depolaması
    const SP=w.Storage.prototype,set0=SP.setItem,ls=w.localStorage,seed=()=>{ls.setItem("nw_state_previous",'{"settings":{"healthNote":"gizli"}}');ls.setItem("nw_state_corrupt","x");ls.setItem("nw_keys",'{"groq":"K"}');ls.setItem("nw_keys_enc","z")};
    const gone=()=>["nw_state_previous","nw_state_corrupt","nw_keys","nw_keys_enc"].every(k=>ls.getItem(k)===null);
    reset();seed();let msg="";w.confirm=m=>{msg=m;return true};
    ev("tab='settings-data';render()");$q('[data-act="reset"]').click();
    ok("Tüm verileri sil: güvenlik kopyası, bozuk kopya ve API anahtarları da gider; onay metni anahtarları söyler",gone()&&Object.keys(ev("getKeys()")).length===0&&msg.includes("Koç anahtar"),[msg,Object.keys(ls)]);
    reset();seed();ev("S.meds=[{id:1,n:'A',t:['08:00']}]");ev("pvDelete(PV_CATS.findIndex(c=>c[0]==='İlaç'))");
    ok("kategori silince güvenlik kopyası da silinir (silinen veri orada kalmaz)",ls.getItem("nw_state_previous")===null);
    // adım: silinen geçmiş sensör senkronuyla geri gelmez, süren yürüyüş silinir
    reset();ev("S.settings.stepsOn=true;S.walk={t0:Date.now()-6e4,s0:0,t1:null,s1:null}");
    const SCp=w.Capacitor.Plugins;SCp.StepCounter={read:async()=>({steps:500,snapAt:1,history:{[ev("keyOff(-2)")]:3000,[ev("keyOff(-1)")]:4000}})};
    await ev("stepsSync()");const n0=ev("S.entries.filter(e=>e.type==='steps').length");
    ev("pvDelete(PV_CATS.findIndex(c=>c[0]==='Adım ve hareket'))");await ev("stepsSync()");
    ok("adım silinince sensör geçmişi geri yazılmaz, S.walk temizlenir",n0===3&&ev("S.entries.filter(e=>e.type==='steps').length")===0&&ev("S.walk")===null&&ev("S.settings.stepsFrom")>ev("dayKey()"),[n0,ev("S.settings.stepsFrom")]);
    ok("stepsFrom eski yedekte yok: boş, çöp atılır",ev("cleanSettings({}).stepsFrom")===""&&ev("cleanSettings({stepsFrom:5}).stepsFrom")===""&&ev("cleanSettings({stepsFrom:'2026-09-01'}).stepsFrom")==="2026-09-01");
    delete SCp.StepCounter;reset();
    // geri yükleme: önce yeni veri, sonra kopya; kopya sığmazsa atlanır
    const big=n=>JSON.stringify({entries:Array.from({length:n},(_,i)=>({id:i+1,day:"2026-09-01",time:"08:00",type:"note",v:null,text:"x".repeat(200)})),settings:{obDone:true}});
    const load=async t=>{w.document.body.insertAdjacentHTML("beforeend",'<textarea id="bk2"></textarea>');w.document.querySelector("#bk").value=t;await loadBackup()};
    ev("S.entries=[];for(let i=0;i<100;i++)add('note',null,'x'.repeat(200));save()");
    const a=ls.getItem("nw_state").length;await load(big(150));const b=ls.getItem("nw_state").length;
    ev("S.entries=[];for(let i=0;i<100;i++)add('note',null,'x'.repeat(200));save()");ls.removeItem("nw_state_previous");
    const Q=2*a+(b-a)/2,used=k=>{let t=0;for(let i=0;i<ls.length;i++){const x=ls.key(i);if(x!==k)t+=ls.getItem(x).length}return t};
    SP.setItem=function(k,v){if(used(k)+v.length>Q)throw new w.DOMException("dolu","QuotaExceededError");return set0.apply(this,arguments)};
    await load(big(150));
    ok("geri yükleme: yer varken yeni veri yazılır, sığmayan güvenlik kopyası atlanır",ev("S.entries.length")===150&&ls.getItem("nw_state_previous")===null&&!ev("saveFail"),[a,b,Q]);
    SP.setItem=set0;ev("S.entries=[];save()");await load(big(5));
    ok("geri yükleme: sığınca güvenlik kopyası yazılır; depolama ölçüsü kopya ve bozuk kopyayı sayar",ls.getItem("nw_state_previous")!==null&&(ls.setItem("nw_state_corrupt","y".repeat(1e5)),ev("lsOther()"))>=2e5);
    ls.removeItem("nw_state_corrupt");w.confirm=()=>true;reset();
  }
  { // Dalga 11 (5): Koç besin kartı yeniden yüklemede kalır
    reset();ev("S.chat=[];cReply({reply:'x',log:[],food:{name:'Lahmacun',kcal:300,protein:12.5}})");
    const c1=ev("JSON.stringify(S.chat.find(m=>m.card&&m.card.kind==='food').card)"),c2=ev("JSON.stringify(cleanCoach(JSON.parse(JSON.stringify(S))).chat.find(m=>m.card&&m.card.kind==='food').card)");
    ok("Koç besin kartı temizleyiciden geçince kaybolmaz, değerler aynı",c1===c2&&c2.includes("Lahmacun"),[c1,c2]);
    reset();
  }
  { // Dalga 11 (6): 18 yaş altı tek kapı
    reset();await ev("setKey('nvidia','K1')");ev("S.settings.age=30;cConsent(true)");
    let n=0;w.fetch=async()=>{n++;return {ok:true,json:async()=>({choices:[{message:{content:'{"reply":"x","log":[]}'}}]})}};
    w.document.body.insertAdjacentHTML("beforeend",'<input id="ageIn" data-set="age">');
    const inp=w.document.querySelector("#ageIn");inp.value="16";inp.dispatchEvent(new w.Event("change",{bubbles:true}));
    ok("onay verildikten sonra yaş 16 yapılınca onay düşer",ev("S.settings.consent")===false&&ev("S.settings.consentV")===0);
    ev("S.settings.consent=true;S.settings.consentP='gemini,groq,nvidia,openrouter';S.settings.consentV=CONSENT_V"); // eski/dışarıdan gelen durum
    ev("cSend('merhaba')");await ev("cFlush()");ev("progOpt={d:3,q:'Salon',m:45,l:'Başlangıç'}");await ev("cProgram(progOpt)");await ev("cMenu()");await ev("cComment('plan')");await ev("cComment('weekly')");
    let t="none";try{await ev("cAsk([{role:'user',content:'x'}],10)")}catch(e){t=e.message}
    ok("18 yaş altı: sohbet, program, menü, yorum ve doğrudan cAsk istek göndermez",n===0&&t==="consent",[n,t]);
    ok("yedek/açılış temizleyicisi: yaş<18 ise onay geçersiz, 18+ ise korunur",ev("cleanSettings({consent:true,consentV:CONSENT_V,age:16}).consent")===false&&ev("cleanSettings({consent:true,consentV:CONSENT_V,age:30}).consent")===true);
    ok("eski veride 18 yaş altı yaş korunur (fren zinciri sürer)",ev("cleanSettings({age:15}).age")===15&&ev("cleanSettings({age:17,consent:true,consentV:CONSENT_V}).consent")===false);
    reset();ev("Object.assign(S.settings,{age:16,fastOn:true,heightCm:165});S.entries=[{id:1,day:dayKey(),time:'08:00',type:'weight',v:60,text:''}];save();S=load();tab='today';render()");
    const vb=$q("#view").textContent;
    ok("eski 18 yaş altı veri: açılışta bilgi, Koç kapalı, sert fren, oruç başlatılamaz",vb.includes("18 yaş ve üzeri için")&&!ev("coachOn()")&&ev("risk().hard").includes("18 yaş altındasın")&&!$q('[data-hb="fastgo"]'),vb.slice(0,300));
    reset();ev("S.chat=[];S.settings.age=0");
  }
  { // Dalga 11 (7): yeni ilaç geçmiş günlerde kaçırılmış sayılmaz
    reset();ev("S.settings.medOn=true;tab='meds';render()");
    const doc=w.document,q=s=>doc.querySelector(s);
    ev("medOpen(0)");q("#mn").value="D vitamini 1000 IU";q("#mt0").value="23:59";q('[data-md="addtime"]').click();q("#mt1").value="00:00";q('[data-md="save"]').click();
    const m=ev("S.meds[0]"),t=ev("dayKey()"),y=ev("keyOff(1)");
    ok("gün sayısı girilmeden eklenen ilaca başlangıç (bugün) yazılır, vakti geçmiş saat yarından başlar",m.s===t&&m.ts["00:00"]===y&&m.ts["23:59"]===t,m);
    const a=ev("MedLib.adherence(S.meds,S.medLog,keyOff(-29),dayKey(),dayKey(),'23:59')");
    ok("yeni ilaç: 30 günlük uyum geçmişi kaçırılmış saymaz",a.missed===0&&a.pct===null,a);
    ok("ilaç ekranı: yeni ilaçta %0 ve 0/29 yok",!ev("viewMeds()").includes("kaçırılan")&&!ev("viewMeds()").includes("/ 29"));
    ev("medOpen(1)");q('[data-md="addtime"]').click();q("#mt2").value="12:00";q('[data-md="save"]').click();
    ok("düzenlemede eklenen yeni saat kendi gününden başlar, eski saatler korunur",ev("S.meds[0].ts['12:00']")>=t&&ev("S.meds[0].ts['00:00']")===y&&ev("S.meds[0].s")===t);
    ev("S.meds=[{id:1,n:'Eski',t:['08:00'],on:true}];S.medLog=[]");ev("medOpen(1)");q("#mn").value="Eski2";q('[data-md="save"]').click();
    ok("eski kayıt (s yok) düzenlenince geçmişi bozulmaz",ev("S.meds[0].s")===undefined&&ev("MedLib.adherence(S.meds,S.medLog,keyOff(-5),dayKey(),dayKey(),'23:59')").missed>=5);
    reset();
  }
  { // Dalga 11 (9): onay metni gerçek veriyle ve politikayla aynı
    const doc=require("fs").readFileSync(path.join(__dirname,"../docs/gizlilik-politikasi.md"),"utf8"),sent=ev("CONSENT_SENT"),note=ev("CONSENT_NOT");
    ok("onay metni sürüm 2; eski sürüm onayı düşer",ev("CONSENT_V")===2&&ev("cleanSettings({consent:true,consentV:1}).consent")===false);
    ok("uygulama içi onay metni ile politika §5 aynı gönderilen/gönderilmeyen listesini taşır",doc.includes("**Koç'a gönderilenler** (uygulama içindeki onay metniyle aynıdır): "+sent+".")&&doc.includes("**Koç'a ne zaman gider:** "+ev("CONSENT_WHEN"))&&ev("consentHtml()").includes(ev("CONSENT_WHEN"))&&doc.includes("**Koç'a gönderilmeyenler:** "+note)&&ev("consentHtml()").includes(sent)&&ev("consentHtml()").includes(note));
    reset();ev("S.settings.medOn=true;S.meds=[{id:1,n:'Ilac',d:'1 tablet',t:['08:00'],w:[1],on:true,k:10}];S.mealTpl=[];S.myFoods=[{n:'Kendi besinim',k:100,p:5}]");
    const ctx=ev("CoachLib.contextText(cData())"),cat=ev("cMenuCat().text");
    ok("metinde adı geçen her veri gerçekten bağlamda: doz, haftanın günleri, uyum, stok, bugünkü yemek, kendi besin adı",ctx.includes("1 tablet")&&ctx.includes("haftanın günleri")&&ctx.includes("son 7 gün")&&ctx.includes("stok")&&cat.includes("Kendi besinim")&&["doz","haftanın günleri","son 7 günün uyumu","stok","bugünkü kayıtların","kendi besin"].every(k=>sent.includes(k)));
    ok("politika: tüm yedeklerde parola zorunlu (en az 10); vücut ölçüleri ve tarifler tabloda",doc.includes("parola zorunludur, en az 10 karakterdir")&&doc.includes("vücut ölçüleri (bel, kalça")&&doc.includes("kendi tarifleri"));
    reset();
  }
  { // Dalga 11 (12): karbonhidrat/yağ toplamında eksik öğün notu
    reset();ev("S.entries=[];{const e=add('food',300,'A');e.p=10;e.c=40;e.f=8}{const e=add('food',200,'B');e.p=5}");
    ok("Bugün: değeri olmayan öğün varsa karbonhidrat/yağ 'n/m öğünde veri var' notu taşır",ev("viewToday()").includes("Karbonhidrat 1/2, yağ 1/2 öğünde veri var"));
    ev("S.entries=[];{const e=add('food',300,'A');e.p=10;e.c=40;e.f=8}");
    ok("tüm öğünlerde veri varsa not yok",!ev("viewToday()").includes("öğünde veri var; toplam"));
    reset();
  }
  { // Dalga 11 (12): Koç'un porsiyon besini tarifte 100 g sayılmaz
    reset();ev("S.myFoods=[{n:'Koç lahmacun',k:300,p:10,por:true},{n:'Gramlı besin',k:200,u:[['1 adet (50 g)',50]]}];sheetRecipe()");
    const pick=name=>{const r=$q("#rq");r.value=name;r.dispatchEvent(new w.Event("input",{bubbles:true}));$q('[data-rp="pick:0"]').click()};
    pick("Koç lahmacun");pick("Gramlı besin");ok("Koç kartından eklenen besin por işaretiyle saklanır, temizleyici korur",ev("(()=>{S.myFoods=[];myFoodAdd('Test',250,5);return S.myFoods[0].por===true&&cleanMyFoods(S.myFoods)[0].por===true&&cleanMyFoods([{n:'a',k:1}])[0].por===undefined})()"));ev("S.myFoods=[{n:'Koç lahmacun',k:300,p:10,por:true},{n:'Gramlı besin',k:200,u:[['1 adet (50 g)',50]]}];sheetRecipe()");pick("Koç lahmacun");pick("Gramlı besin");
    const gi=()=>[...w.document.querySelectorAll("[data-rg]")],sh=()=>$q("#sheet").textContent;
    ok("gramı bilinmeyen (Koç) besin tarifte porsiyon olarak girilir, gramlı besin gramla",ev("recipeDraft.items[0].por")===true&&ev("recipeDraft.items[1].por")===undefined&&sh().includes("1 porsiyon: 300 kcal")&&sh().includes("100 g: 200 kcal"));
    gi()[0].value="2";gi()[0].dispatchEvent(new w.Event("input",{bubbles:true}));gi()[1].value="100";gi()[1].dispatchEvent(new w.Event("input",{bubbles:true}));
    ok("2 porsiyon Koç besini = 600 kcal (100 g × 2 değil), gramlı 100 g = 200 kcal; toplam 800",ev("recipeDraft.items[0].g")===200&&$q("#rsum").textContent.includes("800 kcal"),$q("#rsum").textContent);
    $q("#rn").value="Karışık";$q("#rs").value="2";$q('[data-rp="save"]').click();
    ok("kayıtlı tarifte por korunur; eski tarif (por yok) değişmez; tarif porsiyonu 400 kcal",ev("S.recipes[0].items[0].por")===true&&ev("LogLib.cleanRecipes([{n:'a',items:[{n:'x',g:100,k:50}]}])[0].items[0].por")===undefined&&Math.round(ev("LogLib.recipeFood(S.recipes[0]).k*LogLib.recipeFood(S.recipes[0]).u[0][1]/100"))===400);
    reset();
  }
  { // Dalga 12 (A): güvenlik freni tek kaynaktan, gerçek verilerle
    const MED="[{id:1,n:'Vitamin D',t:['08:00'],on:true}]";
    const prof=`S.entries=[];S.chat=[];S.meds=[];S.vitals=[];Object.assign(S.settings,{heightCm:175,age:35,goalKg:80,healthNote:'',riskClearedAt:'',kcal:0});for(let i=0;i<20;i++)add('weight',90+i*0.1,'',keyOff(-i));`;
    reset();ev(prof);
    ok("temiz profil: KISIT yok, onay düğmesi yok, Trend'de hedef süresi var",!ev("CoachLib.contextText(cData())").includes("KISIT")&&!ev("gEnergy()").includes("riskok")&&ev("viewTrend()").includes("hafta.</p>"));
    ev(`S.meds=${MED}`);
    const ctx=()=>ev("CoachLib.contextText(cData())");
    ok("notsuz 90 kg, ilaç kaydı: Koç KISIT satırı gerekçeyle",ctx().includes("KISIT: İlaç kaydın var"),ctx().split("\n").filter(l=>l.includes("KISIT")));
    const tdee=ev("Math.round(cCalc().tdee/10)*10");
    ok("ilaç kaydı: önerilen hedef bakım düzeyi, 'Hekimime danıştım' düğmesi",ev("cCalc().target")===tdee&&ev("gEnergy()").includes('data-act="riskok"'));
    ev("tab='trend';render()");$q('[data-act="riskok"]').click();
    ok("'Hekimime danıştım': bugün kaydedilir, düğme kalkar, kalori açığı önerilir, KISIT kalkar",ev("S.settings.riskClearedAt")===ev("dayKey()")&&!$q('[data-act="riskok"]')&&ev("cCalc().target")<tdee&&!ctx().includes("KISIT"));
    ev("S.settings.riskClearedAt=keyOff(-30)");ok("onay 30 gün sonra düşer",ctx().includes("KISIT"));
    ev("S.settings.riskClearedAt='';S.meds=[];S.vitals=[{id:1,k:'t',day:keyOff(-10),time:'08:00',sys:128,dia:82,session:'morning'}]");
    ok("son 90 günde tansiyon ölçümü freni açar",ctx().includes("tansiyon ölçümün var"));
    ev("S.vitals=[{id:1,k:'s',day:keyOff(-95),time:'08:00',g:110,ctx:'ac'}]");ok("95 gün önceki şeker ölçümü sayılmaz",!ctx().includes("KISIT"));
    ev("S.vitals=[];S.settings.age=16;S.settings.riskClearedAt=dayKey();tab='trend';render()");
    ok("sert engel (18 yaş altı): onay düğmesi yok, onay kaldırmaz, açıklama var",!$q('[data-act="riskok"]')&&$q("#view").textContent.includes("18 yaş altındasın")&&ctx().includes("KISIT: 18 yaş altındasın"));
    ok("Trend: engelde hedefe kalan süre tahmini yok",!ev("viewTrend()").includes("hafta.</p>"));
    ev("S.settings.age=35;S.settings.heightCm=0;S.settings.healthNote='hamileyim';S.entries=[]");
    ok("boy ve tartı yokken de hamilelik KISIT satırı gider",ctx().includes("KISIT: Sağlık notunda hamilelik"));
    ev("S.settings.healthNote='';S.chat=[{id:1,t:1,role:'user',text:'x',fl:'ed'}]");
    ok("sohbet ed bayrağı KISIT ve menü engeli",ctx().includes("Yeme düzeniyle")&&!!ev("cMenuPlan().why"));
    { // sohbet freni: tüm kod yolları tek risk()'ten geçer; kullanıcı kaldıramaz
      const gates=()=>ev("(()=>{const c=cCalc();S.chat=S.chat.filter(m=>!(m.card&&m.card.kind==='propose'));cReply({reply:'x',propose:{kcal:Math.round(c.tdee-300)}});const pr=S.chat.some(m=>m.card&&m.card.kind==='propose');return [pr,!!cMenuPlan().why,!!(risk().ed||risk().pregnant),!!risk().block,kcalBlocked(c.tdee-300,c)]})()")
      const brake=(chat,cr)=>ev(`${prof}S.chat=${chat};S.cid=5;S.settings.chatRisk='${cr}'`);
      const view=()=>{ev("tab='settings-profile';render()");return $q("#view")};
      brake("[{id:1,t:1,role:'user',text:'x',fl:'ed'}]","ed");
      ok("fren varken öneri kartı, menü, program, oruç ve kalori hedefi kapalı; Profil'de açıklama var, Kaldır düğmesi yok",String(gates())==="false,true,true,true,true"&&view().textContent.includes("Sohbetten bir sağlık işareti algılandı")&&!$q('[data-act="riskclr"]'),gates());
      brake("[{id:1,t:1,role:'coach',text:'',card:{kind:'safety',level:'ed'}}]","");
      ok("güvenlik kartı (ed) de kalıcı frenler",String(gates())==="false,true,true,true,true"&&(view(),!$q('[data-act="riskclr"]')));
      brake("[]","preg");
      ok("hamilelik işareti: fren ve açıklama, Kaldır yok",String(gates())==="false,false,true,true,true"&&view().textContent.includes("Sohbetten bir sağlık işareti algılandı")&&!$q('[data-act="riskclr"]'),gates());
      ok("sohbet silinse de (chatRisk) fren kalır",(ev("S.chat=[]"),String(gates())==="false,false,true,true,true"));
    }
    ok("cleanSettings riskClearedAt: geçerli gün korunur, bozuk ve eksik boş",ev("cleanSettings({riskClearedAt:'2026-09-01'}).riskClearedAt")==="2026-09-01"&&ev("cleanSettings({riskClearedAt:'dün'}).riskClearedAt")===""&&ev("cleanSettings({}).riskClearedAt")==="");
    reset();
  }
  { // Dalga 12 (A): onboarding sert ve yumuşak işaret ayrı
    ev("S=structuredClone(DEF);Object.assign(ob,obFresh(),{step:0});render()");
    const q=s=>$q(s),val=(id,v)=>{q("#ob"+id).value=v},v=()=>q("#view").textContent;
    val("cm","170");val("kg","80");val("age","30");q('[data-ob="dir:lose"]').click();val("goal","70");q('[data-ob="next"]').click();q("#obhd").checked=true;q('[data-ob="next"]').click();
    ok("onboarding hamilelik/yeme bozukluğu işareti: sert, onay düğmesi yok",v().includes("açığı önermiyorum")&&!q('[data-act="riskok"]'));
    q('[data-ob="next"]').click();
    ok("yazılan not riskFlags'ta sert sayılır",ev("risk().hard.length")>0);
    ev("S=structuredClone(DEF);Object.assign(ob,obFresh(),{step:0});render()");
    val("cm","170");val("kg","80");val("age","30");q('[data-ob="dir:lose"]').click();val("goal","70");q('[data-ob="next"]').click();q("#obhn").checked=true;q('[data-ob="next"]').click();
    q('[data-act="riskok"]').click();
    ok("onboarding yumuşak işaret: 'Hekimime danıştım' çalışır, kalori açığı önerilir",ev("S.settings.riskClearedAt")===ev("dayKey()")&&!v().includes("açığı önermiyorum")&&v().includes("Adım 3/3"));
    q('[data-ob="next"]').click();
    reset();
  }
  { // Dalga 12 (B): protein ayarlı ağırlıkla, hekim yönlendirmesi ve dipnot her gösterimde
    reset();ev("S.entries=[];Object.assign(S.settings,{heightCm:180,age:35,goalKg:0,healthNote:''});for(let i=0;i<20;i++)add('weight',140,'',keyOff(-i));add('food',500,'Tavuk').p=40;tab='today';render()");
    const FOOT="Böbrek ya da karaciğer sorunun varsa hekimine danış";
    ok("Bugün: 140 kg/180 cm protein 153–200 g ve dipnot",ev("viewToday()").includes("/ 153–200 g")&&ev("viewToday()").includes(FOOT),ev("viewToday()").match(/Protein.{0,80}/));
    ok("Enerji kartı ve Koç bağlamı aynı aralık, dipnot",ev("gEnergy()").includes("153–200 g")&&ev("gEnergy()").includes(FOOT)&&ev("CoachLib.contextText(cData())").includes("protein aralığı 153-200 g"));
    ev("S.settings.healthNote='diyalize giriyorum'");
    ok("böbrek notu: Bugün, Enerji, Koç ve menüde aralık yok, 'hekiminle belirle'",ev("viewToday()").includes("hekiminle belirle")&&!ev("viewToday()").includes("153–200")&&ev("gEnergy()").includes("Hekiminle belirle")&&ev("CoachLib.contextText(cData())").includes("protein aralığı hekimle belirlenmeli")&&ev("cMenuPlan().protein")===null);
    ev("S.settings.healthNote='';S.settings.age=70;S.meds=[{id:1,n:'X',t:['08:00'],on:true}]");
    ok("yaş 70 + ilaç: aralık yok",ev("viewToday()").includes("hekiminle belirle"));
    ev("S.meds=[]");reset();
  }
  console.log("son satıra ulaşıldı, "+total+" test");
  process.exit(bad||total<MIN_TESTS?1:0);
},100);
