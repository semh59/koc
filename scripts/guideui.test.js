const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path");let bad=0;
const www=f=>path.join(__dirname,"../www",f);
/* D-Ant15: rehberli mod arayüzü, kayıt, bildirim, ekran açık, sesli komut ve ayarlar. Ayrı süreçte. */
const html=fs.readFileSync(www("index.html"),"utf8").replace(/<script src="([^"]+)"><\/script>/g,(_,f)=>"<script>"+fs.readFileSync(www(f),"utf8")+"</script>");
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const errs=[];
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://localhost/",
  beforeParse(w){Object.assign(w,{structuredClone,TextEncoder,TextDecoder,__noSelfTest:true});Object.defineProperty(w,"crypto",{value:require("node:crypto").webcrypto});w.confirm=()=>true;w.scrollTo=()=>{};w.addEventListener("error",e=>errs.push(e.message))}
});
setTimeout(async()=>{
  const w=dom.window,ev=s=>w.eval(s),q=s=>w.document.querySelector(s),click=s=>q(s).click(),sh=()=>q("#sheet").textContent,gt=()=>q("#guide").textContent,wait=ms=>new Promise(r=>setTimeout(r,ms));
  w.HTMLElement.prototype.scrollIntoView=function(){};
  const said=[],awk=[],ln=[],stops=[];let pend=[];
  w.Capacitor={Plugins:{
    Speech:{speak:async o=>{said.push(o.text)},stop:async()=>{stops.push(1)}},
    DeviceHelp:{keepAwake:async o=>{awk.push(o.on)}},
    LocalNotifications:{checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),getPending:async()=>({notifications:pend}),getDeliveredNotifications:async()=>({notifications:[]}),removeDeliveredNotifications:async()=>{},registerActionTypes:async()=>{},cancel:async o=>{ln.push(["c",o.notifications.map(n=>n.id)])},schedule:async o=>{ln.push(["s",o.notifications])}}}};
  ev("S=structuredClone(DEF);S.settings.obDone=true;S.gid=50;tab='salon';render()");

  { // ayarlar
    ok("ayarlar: sesli komut ve titreşim varsayılan açık, eski yedekte (alan yok) açık, kapalı korunur",ev("DEF.settings.gdVoice&&DEF.settings.gdVib")&&ev("cleanSettings({kcal:1800}).gdVoice&&cleanSettings({kcal:1800}).gdVib")&&ev("cleanSettings({gdVoice:false,gdVib:false}).gdVoice")===false&&ev("cleanSettings({gdVoice:false,gdVib:false}).gdVib")===false);
    ev("tab='ayar-modul';render()");const v=q("[data-gdv]"),b=q("[data-gdb]");
    ok("Ayarlar > Salon: 'Rehberli modda sesli komut' ve titreşim anahtarı",v&&b&&v.checked&&b.checked&&v.closest("label").textContent.includes("Rehberli modda sesli komut"));
    v.checked=false;v.dispatchEvent(new w.Event("change",{bubbles:true}));
    ok("anahtar kapatılınca ayara yazılır",ev("S.settings.gdVoice")===false);
    ev("S.settings.gdVoice=true;tab='salon';render()");
  }
  { // giriş noktaları
    ev(`S.templates=[{id:1,name:'Ev',ex:['plank','pushup'],tg:{plank:{sets:2,sec:30},pushup:{sets:2,reps:8}}}];render()`);
    click('[data-g="gdpick"]');
    ok("Salon ana ekranı: Rehberli başlat, ≥3 hazır akış ve şablonlar, genel bilgi/ağrı/hekim notu",["5 dk ısınma","10 dk tüm vücut esneme","4 dk Tabata"].every(t=>sh().includes(t))&&sh().includes("Ev")&&sh().includes("fizyoterapiste")&&sh().includes("Genel bilgidir"));
    ok("akış egzersizlerinin hepsi EXMERGED'de",ev("GuideLib.FLOWS.every(f=>f.steps.every(s=>EXMERGED.some(e=>e.id===s.ex)))"));
    ev("closeSheet();gTplPreview(1)");
    ok("şablon önizlemesinde Rehberli başlat",!!q('#sheet [data-g="gdgo:t:1"]'));
    ev("closeSheet();gPgSheet('home3')");
    ok("hazır programda gün başına Rehberli başlat",!!q('#sheet [data-g="gdgo:p:home3-0"]')&&!!q('#sheet [data-g="gdgo:p:home3-2"]'));
    ev("closeSheet()");
  }
  { // ekran, ekran açık, bildirim, ses
    ev("tab='bugun';render()");awk.length=0;said.length=0;ln.length=0;
    ev("gdStart('f:tabata4')");await wait(20);
    ok("tam ekran katman açılır, görünüm yeniden çizilince kalır",!q("#guide").hidden&&(ev("render()"),!q("#guide").hidden)&&q("#guide").getAttribute("aria-modal")==="true");
    ok("ekran: animasyonlu figür, ad, form ipucu, halka, sonraki önizleme, ilerleme, kalan süre",!!q("#guide svg.fig animate")&&gt().includes("Açılıp kapanma sıçraması")&&gt().includes(ev("EXCUE.jack[0]"))&&!!q("#gdpg")&&q(".gdnx").textContent.includes("Dağcı")&&!!q("#gdbar")&&q("#gdrem").textContent.includes("8 adım"));
    ok("ekran açık: Salon dışında da akış sürerken keepAwake açılır",awk[awk.length-1]===true);
    ok("hazırlıkta sesli komut: sıradaki egzersiz (kısa hazırlıkta süre yok)",said[0]==="Sıradaki: Açılıp kapanma sıçraması");
    const n=ln.filter(l=>l[0]==="s").map(l=>l[1][0]).find(x=>x.id===9003);
    ok("evre bitişine yerel bildirim 9003 kurulur (9001/9002'ye dokunulmaz), tam bitiş anı",n&&+n.schedule.at===ev("gd.st.end")&&n.schedule.allowWhileIdle&&n.title.startsWith("Başla")&&!ln.some(l=>l[0]==="s"&&l[1].some(x=>x.id===9001||x.id===9002)));
    // geri sayım bir kez
    ev("gd.st.end=Date.now()+2500;gd.st.at=gd.st.end-5000;gdTick();gdTick()");
    ok("dinlenmenin son 3 saniyesinde '3, 2, 1, başla' bir kez",said.filter(s=>s==="3, 2, 1, başla").length===1);
    // arka plan: üç evre geçmiş
    said.length=0;ev("const _d=Date.now()-gd.st.end+1;gd.st.end-=_d+20000+10000+5000;gd.st.at-=_d+35000;gdTick()");
    ok("arka plandan dönüş: evreler bitişten hesaplanır, yalnız güncel evre söylenir",ev("gd.st.i")===3&&said.length===1&&said[0].startsWith("Dağcı"),[ev("gd.st.i"),said]);
    said.length=0;ev("S.settings.gdVoice=false;gdClick('skip')");
    ok("sesli komut kapalıyken konuşmaz",said.length===0);
    ev("S.settings.gdVoice=true;gdClick('pause')");await wait(10);
    ok("duraklat: bildirim iptal edilir, Devam düğmesi",ln[ln.length-1][0]==="c"&&ln[ln.length-1][1][0]===9003&&!!q('[data-gd="resume"]'));
    ev("gdClick('resume')");
    // hatırlatmalar yeniden kurulurken 9003 iptal edilmez
    pend=[{id:9001},{id:9002},{id:9003},{id:5}];await wait(10);ln.length=0;await ev("scheduleReminders()");
    ok("scheduleReminders 9003'ü (ve 9001/9002'yi) iptal etmez",ln.some(l=>l[0]==="c"&&l[1].includes(5))&&!ln.some(l=>l[0]==="c"&&l[1].some(i=>i>=9001&&i<=9003)));
    // geri tuşu
    ev("backKey()");
    ok("geri tuşu: akış bitirilir, özet görünür",gt().includes("Akış durduruldu")&&ev("gd.fin"));
    ok("özet: ekran açık bırakılır",awk[awk.length-1]===false);
    const before=ev("JSON.stringify(S.workouts)");stops.length=0;
    ev("gd.st.done[1]=5");w.confirm=()=>false;ev("backKey()");
    ok("özette geri tuşu: tamamlanan varsa sormadan atmaz",!q("#guide").hidden&&ev("gd.fin"));
    w.confirm=()=>true;
    ev("backKey()");
    ok("kaydetmeden kapat: S.workouts değişmez, ses durur, katman gizli",ev("JSON.stringify(S.workouts)")===before&&stops.length===1&&q("#guide").hidden&&ev("gd")===null);
  }
  { // kayıt
    const fin=v=>{ev(`gdStart('${v}');while(!GuideLib.over(gd.st)){const p=gd.st.ph[gd.st.i];p.reps?GuideLib.finish(gd.st,gd.st.at+20000):GuideLib.tick(gd.st,gd.st.end)}gdEnter()`)};
    ev("S.workouts=[];S.entries=[];render()");
    fin("f:esneme10");
    ok("doğal bitiş: özet ve 'Bitti. Tebrikler'",gt().includes("Akış bitti")&&said[said.length-1]==="Bitti. Tebrikler"&&!!q('[data-gd="save"]'));
    const vol0=ev("JSON.stringify(gWeekRegions())");
    click('[data-gd="save"]');
    const e=ev("S.workouts[0]");
    ok("ısınma/esneme kaydı: tamamlanan setler done:true, sec dolu, ısınma işaretli",e&&e.t1>e.t0&&e.ex.length===16&&e.ex.every(x=>x.sets.length===1&&x.sets[0].done===true&&x.sets[0].sec===30&&x.sets[0].w===true));
    ok("ısınma/esneme hacme, haftalık sete ve spor dakikasına girmez",ev("gWorkVol(S.workouts[0])")===0&&ev("gWorkSets(S.workouts[0])")===0&&ev("JSON.stringify(gWeekRegions())")===vol0&&ev("S.entries.length")===0);
    fin("f:tabata4");click('[data-gd="save"]');
    const t=ev("S.workouts[1]");
    ok("Tabata kaydı: aralıklı setler süreli, done, sec 20; spor dakikası eklenir",t.ex.length===4&&t.ex.every(x=>x.sets.length===2&&x.sets.every(s=>s.done&&s.sec===20&&!s.w))&&ev("S.entries.filter(x=>x.wid===S.workouts[1].id&&x.type==='spor').length")===1);
    // ağırlıklı şablon: kg öneriden (62,5) değil önceki gerçek setten (60), kullanıcı düzeltebilir
    ev(`S.workouts.push({id:3,day:'2026-09-01',t0:1000,t1:2000,name:'Eski',tpl:null,ex:[{id:'squat',note:'',sets:[{kg:60,reps:12,done:true}]}]});S.templates=[{id:7,name:'Bacak',ex:['squat'],tg:{squat:{sets:2,reps:12}}}]`);
    fin("t:7");
    ok("özet: ağırlıklı harekette kg alanı önceki seansın gerçek ağırlığıyla dolu (öneri 62,5 değil)",ev("gSuggest('squat').kg")===62.5&&q('[data-gdkg="squat"]').value==="60");
    const n0=ev("S.workouts.length");q('[data-gdkg="squat"]').value="";click('[data-gd="save"]');
    ok("boş kg ile kaydedilmez, uyarı",ev("S.workouts.length")===n0&&q("#tmsg").textContent.includes("Ağırlığı"));
    q('[data-gdkg="squat"]').value="60";click('[data-gd="save"]');
    const sq=ev("S.workouts[S.workouts.length-1]");
    ok("ağırlıklı şablon: yazılan kg, tekrar ve süre kaydedilir, şablona bağlı, sahte rekor yok",sq.tpl===7&&sq.ex[0].sets.length===2&&sq.ex[0].sets.every(s=>s.kg===60&&s.reps===12&&s.sec===20&&s.done)&&ev("gPRs(S.workouts[S.workouts.length-1]).length")===0);
    ev(`S.templates.push({id:8,name:'Kayıttan',ex:['plank','trail']})`);
    ok("set/süre hedefi olmayan şablon türün varsayılanını alır (süreli 3×30 sn, kardiyo 1×10 dk)",JSON.stringify(ev("gdTplSteps(S.templates[1]).map(s=>[s.n,s.sec])"))==="[[3,30],[1,600]]");
    ok("rehberli kayıt sonrası öneri sayı (NaN değil)",(r=>r&&Number.isFinite(r.kg)&&Number.isFinite(r.reps))(ev("gSuggest('squat')")));
    ok("cleanGym turu: rehberli kayıtlar aynen yaşar",JSON.stringify(ev("cleanGym(JSON.parse(JSON.stringify(S))).workouts"))===JSON.stringify(ev("S.workouts")));
    ev("gdStart('f:tabata4');gdClick('end')");
    ok("hiç tamamlanan yoksa kaydet düğmesi yok",!q('[data-gd="save"]')&&gt().includes("Tamamlanan hareket yok"));
    ev("gdClick('close')");
  }
  ok("sayfa hatasız çalıştı",errs.length===0,errs);
  console.log(bad?bad+" test başarısız":"TAMAM");process.exit(bad?1:0);
},100);
