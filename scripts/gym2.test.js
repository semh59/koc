const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path");let bad=0;
const www=f=>path.join(__dirname,"../www",f);
/* D-Ant4, D-Ant7, D-Ant9: içe aktarma, set türü/süperset, kas haritası arayüzü. Ayrı süreçte.*/
const html=fs.readFileSync(www("index.html"),"utf8").replace(/<script src="([^"]+)"><\/script>/g,(_,f)=>"<script>"+fs.readFileSync(www(f),"utf8")+"</script>");
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const errs=[];
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://localhost/",
  beforeParse(w){Object.assign(w,{structuredClone,TextEncoder,TextDecoder,__noSelfTest:true});Object.defineProperty(w,"crypto",{value:require("node:crypto").webcrypto});w.confirm=()=>true;w.scrollTo=()=>{};w.addEventListener("error",e=>errs.push(e.message))}
});
setTimeout(async()=>{
  const w=dom.window,ev=s=>w.eval(s),$q=s=>w.document.querySelector(s);
  w.HTMLElement.prototype.scrollIntoView=function(){};

  const q=$q,click=s=>q(s).click(),sh=()=>q("#sheet").textContent;
  ev("S=structuredClone(DEF);S.settings.obDone=true;tab='ayar-veri';render()");
  ok("Veri ve yedek: içe aktarma düğmesi",!!q('[data-imp="open"]'));
  { // D-Ant4
    const F='Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE\n2024-03-15 18:30:00,A,1h 5m,Bench Press (Barbell),1,135,5,0,0,,,\n2024-03-15 18:30:00,A,1h 5m,Zarp Zurp,1,50,12,0,0,,,\n';
    ev("impText("+JSON.stringify("x")+")");
    ok("bozuk dosya: net hata, sayfa açılmaz",q("#tmsg").textContent.includes("Biçim")||q("#tmsg").textContent.includes("başlık"),q("#tmsg").textContent);
    ev("impText("+JSON.stringify(F)+",'strong.csv')");
    ok("önizleme: antrenman, set, tarih, eşleşen/yeni, birim sorusu, spor kaydı notu",sh().includes("Strong dosyası: strong.csv")&&sh().includes("1 kütüphanede eşleşti, 1 yeni")&&sh().includes("Ağırlık birimi")&&sh().includes("kalori kaydı oluşturulmaz")&&sh().includes("15 Mar 2024"),sh());
    click('[data-imp="unit:lbs"]');
    click('[data-imp="go"]');
    ok("onay: antrenman, kendi egzersizi, lbs->kg eklendi; spor kaydı yok",ev("S.workouts.length")===1&&ev("S.customEx.length")===1&&Math.abs(ev("S.workouts[0].ex[0].sets[0].kg")-61.23)<1e-9&&ev("S.entries.length")===0&&ev("S.gid")===3);
    ok("cleanGym turu: içe aktarılan antrenman aynen yaşar (set sayısı dahil)",JSON.stringify(ev("cleanGym(JSON.parse(JSON.stringify(S))).workouts"))===JSON.stringify(ev("S.workouts"))&&ev("cleanGym(JSON.parse(JSON.stringify(S))).customEx.length")===1);
    ok("içe aktarılan antrenman geçmişte görünür ve önceki seans olur",ev("gHistory('bench').length")===1);
    ev("impText("+JSON.stringify(F)+")");click('[data-imp="go"]');
    ok("aynı dosya tekrar: atlanır, düğme pasif",ev("S.workouts.length")===1&&sh().includes("zaten kayıtlı")&&q('[data-imp="go"]').disabled);
    ev("closeSheet()");
    ev("S.workouts=[];S.customEx=[];S.gid=1");
    ev("impText("+JSON.stringify(F)+")");click('[data-imp="go"]');
    q("#tundo").click();
    ok("geri al çalışır",ev("S.workouts.length")===0&&ev("S.customEx.length")===0);
    ev("storeBytes=STORE_WARN-100;impText("+JSON.stringify(F)+")");
    ok("depolama sınırı: uyarı ve kısmi içe aktarım önerisi / sığmıyorsa onay yok",sh().includes("Depolama uyarısı")&&!q('[data-imp="go"]'),sh());
    ev("closeSheet();storeBytes=0");
  }
  { // D-Ant7
    const cg=j=>JSON.parse(ev(`JSON.stringify(cleanGym(${j}))`));
    const base=(sets,ss)=>JSON.stringify({workouts:[{id:1,day:"2026-09-01",t0:1,t1:2,name:"A",ex:[{id:"bench",sets,ss:ss&&ss[0]},{id:"row",sets:[{kg:50,reps:8,done:true}],ss:ss&&ss[1]},{id:"squat",sets:[{kg:50,reps:8,done:true}],ss:ss&&ss[2]}]}]});
    const c1=cg(base([{kg:50,reps:8,done:true,t:"d"},{kg:50,reps:8,done:true,t:"f"},{kg:50,reps:8,done:true,t:"x"},{kg:20,reps:8,done:true,w:true,t:"d"}]));
    ok("cleanGym: t yalnız d/f, ısınma (w) önceliklidir",c1.workouts[0].ex[0].sets.map(s=>(s.t||"")+(s.w?"w":"")).join()==="d,f,,w",c1.workouts[0].ex[0].sets);
    ok("cleanGym ss: komşu grup kalır, tek kalan temizlenir",cg(base([{kg:50,reps:8,done:true}],[3,3,7])).workouts[0].ex.map(x=>x.ss||0).join()==="3,3,0");
    ok("cleanGym ss: ardışık olmayan aynı kimlik grup sayılmaz",cg(base([{kg:50,reps:8,done:true}],[3,5,3])).workouts[0].ex.every(x=>!x.ss));
    ok("eski veri aynen: t ve ss yoksa çıktıda da yok",!JSON.stringify(cg(base([{kg:50,reps:8,done:true}]))).match(/"t":|"ss"/));
    ev("S.workouts=[{id:1,day:'2026-09-01',t0:1000,t1:2000,name:'A',tpl:null,ex:[{id:'bench',note:'',sets:[{kg:100,reps:10,done:true}]}]},{id:2,day:'2026-09-08',t0:2000000,t1:2100000,name:'B',tpl:null,ex:[{id:'bench',note:'',sets:[{kg:100,reps:10,done:true},{kg:60,reps:30,done:true,t:'d'}]}]}]");
    ok("drop set hacme girer",ev("gWorkVol(S.workouts[1])")===1000+1800);
    ok("drop set rekora girmez: 60x30 (Epley 120) rekor sayılmaz, en iyi 1TM aynı",ev("gIsPR(S.workouts[1],'bench')")===null&&Math.round(ev("gBest(S.workouts[1],'bench')"))===Math.round(ev("gBest(S.workouts[0],'bench')")));
    ev("S.workouts[1].ex[0].sets[1].t='f';S.workouts[1].ex[0].sets[1].kg=140;S.workouts[1].ex[0].sets[1].reps=5");
    ok("başarısızlığa kadar seti rekora girer",ev("gIsPR(S.workouts[1],'bench')")!==null);
    ev("S.workouts[1].ex[0].sets[1].t='d';S.workouts[1].ex[0].sets[1].kg=60;S.workouts[1].ex[0].sets[1].reps=30");
    ok("öneri drop setten etkilenmez (son seans 100x10 + drop 60x30)",ev("gSuggest('bench').kg")===100,ev("gSuggest('bench')"));
    ev("S.workouts=[];S.templates=[];S.customEx=[];S.gid=1;gStart(null);gAddEx(gActive(),'bench');gAddEx(gActive(),'row');gAddEx(gActive(),'squat');render()");
    click('[data-g="stype:0:1"]');
    ok("set numarasına dokununca tür seçimi açılır",sh().includes("2. set türü")&&sh().includes("Drop set")&&sh().includes("Başarısızlığa kadar")&&sh().includes("Isınma"));
    click('[data-g="styd:0:1"]');
    ok("Drop seçilince t:d, rozet D ve ad etiketi",ev("gActive().ex[0].sets[1].t")==="d"&&q('[data-g="stype:0:1"]').textContent.includes("D")&&q('[data-g="stype:0:1"]').getAttribute("aria-label").includes("drop set"));
    click('[data-g="stype:0:1"]');click('[data-g="styw:0:1"]');
    ok("Isınma seçilince w:true ve t silinir (eski w davranışı)",ev("gActive().ex[0].sets[1].w")===true&&ev("gActive().ex[0].sets[1].t")===undefined);
    click('[data-g="stype:0:1"]');click('[data-g="styn:0:1"]');
    ok("Normal seçilince ikisi de silinir",ev("JSON.stringify(Object.keys(gActive().ex[0].sets[1]).sort())")==='["done","kg","reps"]');
    ev("restEnd=0");
    click('[data-g="menu:1"]');
    ok("egzersiz menüsünde bir öncekiyle süperset seçeneği",sh().includes("Önceki egzersizle süperset yap")&&sh().includes("Bench press"));
    click('[data-g="ssl:1"]');
    ok("bağlanınca ikisi aynı ss, kartlarda Süperset 1/2 ve 2/2",ev("gActive().ex[0].ss")===ev("gActive().ex[1].ss")&&ev("gActive().ex[2].ss")===undefined&&q("#view").textContent.includes("Süperset 1/2")&&q("#view").textContent.includes("Süperset 2/2"));
    const fill=(ei,si)=>{q(`[data-gi="kg:${ei}:${si}"]`).value="50";q(`[data-gi="reps:${ei}:${si}"]`).value="8"};
    fill(0,0);click('[data-g="done:0:0"]');
    ok("grubun ilk egzersizinde ✓ dinlenme başlatmaz",ev("restEnd")===0&&ev("gActive().ex[0].sets[0].done")===true);
    fill(1,0);click('[data-g="done:1:0"]');
    ok("grubun son egzersizinde ✓ dinlenme başlatır",ev("restEnd")>Date.now()+30000);
    ev("restEnd=0");fill(2,0);click('[data-g="done:2:0"]');
    ok("süpersetsiz egzersiz eskisi gibi dinlenme başlatır",ev("restEnd")>Date.now()+30000);
    ev("restEnd=0;gClick('mv:0:1',null)");
    ok("grup içinde yer değişince grup korunur",ev("gActive().ex[0].ss")>0&&ev("gActive().ex[0].ss")===ev("gActive().ex[1].ss"));
    ev("gClick('mv:1:1',null)");
    ok("gruptan bir egzersiz taşınınca tek kalan ss temizlenir",ev("gActive().ex.every(x=>!x.ss)"));
    ev("gClick('ssl:1',null)");ev("gClick('rmex:0',null)");
    ok("grup üyesi silinince kalan tek ss temizlenir; Geri al ss'i geri getirir",ev("gActive().ex.every(x=>!x.ss)")&&(q("#tundo").click(),ev("gActive().ex.filter(x=>x.ss).length")===2));
    ev("gClick('ssu:1',null)");
    ok("Süpersetten çıkar: grup çözülür",ev("gActive().ex.every(x=>!x.ss)"));
    ev("gClick('ssl:1',null)");
    ev("for(const x of gActive().ex)for(const s of x.sets){s.kg=50;s.reps=8;s.done=true}gActive().ex[0].sets[0].t='d';gFinish()");
    ok("özet ve geçmiş: süperset ve drop set yazar",/Süperset: [^+]+ \+ /.test(sh())&&sh().includes("1 drop set")&&ev("gStats(S.workouts[0])").includes("1 süperset")&&ev("gStats(S.workouts[0])").includes("1 drop set"),sh());
    const wid=ev("S.workouts[0].id");
    ev(`closeSheet();prompt=()=>"Ş";gClick('savetpl:${wid}',null);closeSheet()`);
    const tpl=JSON.parse(ev("JSON.stringify(S.templates[0])"));
    ok("şablona süperset kaydedilir (tg.ss), cleanGym korur",(v=>v.length===2&&v[0]>0&&v[0]===v[1])(Object.values(tpl.tg||{}).map(a=>a.ss))&&JSON.stringify(cg(ev("JSON.stringify(S)")).templates[0].tg)===JSON.stringify(tpl.tg),tpl);
    ev("gStart(S.templates[0].id)");
    ok("şablondan başlatınca süperset yüklenir",ev("gActive().ex[0].ss")>0&&ev("gActive().ex[0].ss")===ev("gActive().ex[1].ss"));
    ev("S.workouts=S.workouts.filter(w=>w.t1!=null);gTeOpen(S.templates[0].id)");
    ok("şablon editörü ss-only hedefe varsayılan set/tekrar doldurur",ev("Object.values(gTe.tg).every(a=>a.sets===3)")&&ev("Object.values(gTe.tg).some(a=>a.ss>0)"),ev("gTe.tg"));
    ev("closeSheet();gTe=null");
    const csvb=ev("pvCsv()").find(x=>x.key==="antrenman").build();
    ok("CSV dışa aktarma: set türü ve süperset sütunu",csvb.includes("set_türü;süperset")&&csvb.includes("drop;"+ev("S.workouts[0].ex[0].ss")),csvb);
    ev("S.workouts=[];S.templates=[];render();closeSheet()");
  }
  { // D-Ant9
    const M=ev("MuscleMap");
    ev("S.workouts=[];S.customEx=[];tab='salon';render()");
    ok("veri yokken şema gri (tüm bölgeler l0) ve 'Bu hafta set yok'",q("#mminfo").textContent==="Bu hafta set yok."&&q(".mmwrap").querySelectorAll(".mmr").length>=15&&q(".mmwrap").querySelectorAll(".mmr:not(.l0)").length===0&&q(".mmwrap").querySelectorAll(".mmt").length===0);
    ok("kademe sınırları: 0, 1-4, 5-9, 10-20, 21+",[0,1,4,5,9,10,20,21].map(n=>ev(`MuscleMap.lvl(${n})`)).join()==="0,1,1,2,2,3,3,4");
    ok("15 şema bölgesi + Tüm vücut = 16 bölge adı",ev("MuscleMap.REGIONS.length")===15&&ev("MuscleMap.REGIONS.every(r=>EXREG.includes(r))")&&EXREGOK());
    function EXREGOK(){return ev("EXREG.length")===16&&ev("EXREG.filter(r=>!MuscleMap.REGIONS.includes(r))[0]")==="Tüm vücut"}
    const mk=(id,n)=>`{id:'${id}',note:'',sets:Array.from({length:${n}},()=>({kg:50,reps:8,done:true}))}`;
    ev(`S.customEx=[{id:'c1',n:'X',g:'Bacak',inc:2.5,r:'Tüm vücut'}];S.workouts=[{id:1,day:dayKey(),t0:Date.now()-3600000,t1:Date.now()-1800000,name:'A',tpl:null,ex:[${mk("bench",12)},${mk("row",22)},${mk("curl",3)},${mk("tri",7)},{id:'c1',note:'',sets:[{kg:1,reps:1,done:true}]}]},{id:2,day:'2020-01-01',t0:1000,t1:2000,name:'Eski',tpl:null,ex:[${mk("squat",30)}]}];render()`);
    const L=n=>q(`[data-g="mm:${n}"]`);
    ok("haftalık sete göre kademe sınıfı: Göğüs 12 (l3), Sırt 22 (l4), Biseps 3 (l1), Triseps 7 (l2), Ön bacak 0 (l0); 7 gün dışı sayılmaz",L("Göğüs").classList.contains("l3")&&L("Sırt").classList.contains("l4")&&L("Biseps").classList.contains("l1")&&L("Triseps").classList.contains("l2")&&L("Ön bacak").classList.contains("l0"));
    ok("renk dışında sayı da yazılır, erişilebilir ad set sayısını içerir",[...q(".mmwrap").querySelectorAll(".mmt")].map(t=>t.textContent).sort().join()==="12,22,3,7"&&L("Sırt").getAttribute("aria-label").includes("22 set"));
    L("Göğüs").dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
    ok("dokununca bölge adı, set sayısı ve aralık içinde metni",q("#mminfo").textContent==="Göğüs: 12 set, haftalık 10-20 kılavuz aralığının içinde"&&L("Göğüs").classList.contains("on"));
    L("Biseps").dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
    ok("aralığın altında metni; önceki seçim kalkar",q("#mminfo").textContent.includes("3 set")&&q("#mminfo").textContent.includes("altında")&&!L("Göğüs").classList.contains("on"));
    L("Sırt").dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
    ok("aralığın üstünde metni",q("#mminfo").textContent.includes("üstünde"));
    L("Ön bacak").dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
    ok("setsiz bölge: bu hafta set yok",q("#mminfo").textContent==="Ön bacak: bu hafta set yok");
    ok("şemada olmayan bölge (Tüm vücut) düğme olarak ve bölgeler listesinde",q('[data-g="mm:Tüm vücut"]').textContent.includes("1")&&q("#view").textContent.includes("Sırt"));
    ev("S.workouts=[];S.customEx=[];S.templates=[];tab='bugun';render();closeSheet()");
  }
  ok("sayfa hatasız çalıştı",errs.length===0,errs);
  console.log(bad?bad+" test başarısız":"TAMAM");process.exit(bad?1:0);
},100);
