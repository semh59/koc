// Tam ekran ilaç alarm ekranı: saf mantık (AlarmLib) ve jsdom'da açılış, işaretleme, gizlilik, erteleme.
const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path"),A=require("../www/alarmlib.js"),M=require("../www/medlib.js");
let bad=0,total=0;const ok=(n,c,x)=>{total++;console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
process.on("unhandledRejection",e=>{console.log("FAIL beklenmeyen hata",e);process.exit(1)});

{ // vadesi gelmiş doz seçimi
  const now=new Date(2026,9,7,9,0),meds=M.cleanMeds([{id:1,n:"A",d:"1 tablet",t:["05:30","06:30","08:50","09:04","09:06","20:00"],on:true},{id:2,n:"B",t:["08:59"],on:false}]);
  const d=A.due(meds,[{m:1,day:"2026-10-07",slot:"08:50",st:"t"}],now).map(i=>i.slot);
  ok("due: [şimdi−3 sa, şimdi+5 dk] arası işaretsiz dozlar, kapalı ilaç ve işaretli doz yok, sıralı",d.join()==="06:30,09:04",d);
  const g=A.due(M.cleanMeds([{id:1,n:"A",t:["23:30"],on:true}]),[],new Date(2026,9,8,0,15));
  ok("due: gece yarısını geçen doz dünün günüyle döner",g.length===1&&g[0].day==="2026-10-07"&&g[0].slot==="23:30",g);
  ok("due: atlanan doz da gösterilmez",A.due(meds,[{m:1,day:"2026-10-07",slot:"06:30",st:"s"},{m:1,day:"2026-10-07",slot:"08:50",st:"s"},{m:1,day:"2026-10-07",slot:"09:04",st:"t"}],now).length===0);
}
{ // gizlilik ve metin
  const it=[{m:1,n:"Aspirin",d:"100 mg",slot:"08:00"},{m:2,n:"B",d:"",slot:"08:00"}];
  const on=A.view(it.slice(0,1),true),off=A.view(it,false);
  ok("view: ad açıkken tek dozda ad ve doz",on.lead==="Aspirin · 100 mg"&&on.rows[0].name==="Aspirin"&&on.count==="",on);
  ok("view: ad kapalıyken ad ve doz yok, 'İlaç saatin geldi.' ve sayı",off.lead==="İlaç saatin geldi."&&off.count==="2 doz"&&!JSON.stringify(off).match(/Aspirin|100 mg|"B"/),off);
  ok("view: doz yoksa 'Tüm dozlar alındı.'",A.view([],true).lead==="Tüm dozlar alındı.");
  ok("allDone: tüm satırlar işaretliyse",A.allDone([{st:"t"},{st:"s"}])&&!A.allDone([{st:"t"},{}]));
}
{ // erteleme
  const t=Date.UTC(2026,9,7,6,0),n=A.snoozeNote([{n:"Aspirin"}],false,A.snoozeAt(t));
  ok("erteleme: 10 dk sonra, tek seferlik ilaç kanalı bildirimi, düğmesiz, ad gizliyse ad yok",A.snoozeAt(t)-t===600000&&n.id===7148&&+n.schedule.at===t+600000&&n.channelId==="nw_med"&&!n.actionTypeId&&n.body==="İlaç saatin geldi."&&n.extra.act==="med");
  ok("erteleme: ad açıkken bekleyen ilaç adları",A.snoozeNote([{n:"A"},{n:"B"}],true,t).body==="A, B");
}

// jsdom: alarmOpen() ile açılış, işaretleme, gizlilik, erteleme
const www=f=>path.join(__dirname,"../www",f),p2=n=>String(n).padStart(2,"0"),hm=d=>p2(d.getHours())+":"+p2(d.getMinutes());
const html=fs.readFileSync(www("index.html"),"utf8").replace(/<script src="([^"]+)"><\/script>/g,(_,f)=>"<script>"+fs.readFileSync(www(f),"utf8")+"</script>");
const now=new Date(),slot=hm(new Date(now-600000)),later=hm(new Date(+now+7200000));
const seed={settings:{obDone:true,heightCm:178,age:35,sex:"m",goalKg:78,kcal:2200,stepsAsked:true,medOn:true},entries:[],meds:[{id:1,n:"Aspirin",d:"100 mg",t:[slot],on:true},{id:2,n:"Gece",t:[later],on:true}]};
const calls=[],errs=[];
const rec=(p,defs)=>new Proxy({},{get:(_,k)=>k==="then"?undefined:k==="addListener"?()=>({remove(){}}):async a=>{calls.push([p+"."+k,a]);const v=defs[k];return typeof v==="function"?v(a):v||{}}});
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://localhost/",beforeParse(w){
  Object.assign(w,{structuredClone,TextEncoder,TextDecoder,__noSelfTest:true});Object.defineProperty(w,"crypto",{value:require("node:crypto").webcrypto});w.scrollTo=()=>{};w.addEventListener("error",e=>errs.push(e.message));
  w.localStorage.setItem("koc_v1",JSON.stringify(seed));
  w.Capacitor={isNativePlatform:()=>true,getPlatform:()=>"android",Plugins:{
    MedWake:rec("MW",{fsi:{allowed:true}}),
    LocalNotifications:rec("LN",{checkPermissions:{display:"granted"},checkExactNotificationSetting:{exact_alarm:"granted"},getDeliveredNotifications:{notifications:[]},getPending:{notifications:[{id:2001000},{id:7148}]}}),
    App:rec("App",{})}};
}});
const w=dom.window,$=s=>w.document.querySelector(s),ev=s=>w.eval(s),sleep=ms=>new Promise(r=>setTimeout(r,ms)),txt=()=>$("#alarm").textContent,n=k=>calls.filter(c=>c[0]===k);
const inert=()=>[...w.document.body.children].some(e=>e.contains($("#view"))&&e.inert===true),click=s=>$(s).dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
setTimeout(async()=>{
  ok("sayfa hatasız açılır",errs.length===0,errs);ev("alarmOpen()");
  ok("alarmOpen(): alarm ekranı açık, alertdialog, vadesi gelen doz var, sonraki doz yok",$("#alarm")&&!$("#alarm").hidden&&$("#alarm").getAttribute("role")==="alertdialog"&&txt().includes("Aspirin")&&txt().includes("100 mg")&&txt().includes(slot)&&!txt().includes("Gece"),txt&&$("#alarm")&&txt());
  ok("katman: arka plan inert, odak başlıkta, saat görünür",inert()&&w.document.activeElement.id==="alt"&&/^\d\d:\d\d$/.test($("#alarm .alclk").textContent));
  const c0=n("LN.cancel").length,s0=n("LN.schedule").length;
  click('#alarm [data-al="t:0"]');await sleep(50);
  const log=ev("JSON.stringify(S.medLog)"),saved=JSON.parse(w.localStorage.getItem("koc_v1"));
  ok("Aldım: doz alındı olarak kaydedilir ve saklanır, satır 'Alındı'",/"m":1/.test(log)&&/"st":"t"/.test(log)&&saved.medLog.some(x=>x.m===1&&x.slot===slot&&x.st==="t")&&txt().includes("Alındı"),log);
  const last=n("LN.schedule").slice(s0).pop(),sch=last?last[1].notifications:[];
  ok("Aldım: bildirimler yeniden kurulur, bekleyen tekrarlar iptal edilir (erteleme kimliği korunur), alınan doz yeniden kurulmaz",n("LN.cancel").length>c0&&n("LN.cancel").slice(c0).some(c=>c[1].notifications.some(x=>x.id===2001000)&&!c[1].notifications.some(x=>x.id===7148))&&!sch.some(x=>x.extra&&x.extra.m===1&&+x.schedule.at<=+now+3600000),sch.map(x=>x.id));
  await sleep(1700);
  ok("hepsi bitince 1,5 sn sonra kapanır",$("#alarm").hidden&&!inert());
  // gizlilik
  ev("S.medLog=[];S.settings.medShowName=false;alarmOpen()");
  ok("medShowName=false: ad ve doz görünmez, 'İlaç saatin geldi.' ve '1 doz'",!$("#alarm").hidden&&!/Aspirin|100 mg/.test($("#alarm").innerHTML)&&txt().includes("İlaç saatin geldi.")&&txt().includes("1 doz"),txt());
  // erteleme
  const t0=Date.now();click('#alarm [data-al="snooze"]');await sleep(50);
  const sn=n("LN.schedule").pop()[1].notifications[0],mz=n("MW.snooze").pop();
  ok("ertele: 10 dk sonra tek seferlik bildirim (ad gizli) ve ekran alarmı, doz işaretlenmez, ekran kapanır",sn.id===7148&&Math.abs(+new Date(sn.schedule.at)-t0-600000)<5000&&sn.body==="İlaç saatin geldi."&&mz&&mz[1].at===+new Date(sn.schedule.at)&&ev("S.medLog.length")===0&&$("#alarm").hidden);
  ev("S.settings.medShowName=true;alarmOpen()");w.document.dispatchEvent(new w.KeyboardEvent("keydown",{key:"Escape",bubbles:true}));
  ok("Escape ve geri tuşu alarm ekranını kapatır (doz işaretlenmez)",$("#alarm").hidden&&ev("S.medLog.length")===0&&(ev("alarmOpen()"),ev("backKey()"))===true&&$("#alarm").hidden);
  ev("S.medLog=[{id:1,m:1,day:dayKey(new Date(Date.now()-600000)),slot:'"+slot+"',st:'t'}];alarmOpen()");
  ok("vadesi gelmiş doz yoksa 'Tüm dozlar alındı' gösterip kapanır",!$("#alarm").hidden&&txt().includes("Tüm dozlar alındı"));
  await sleep(1700);ok("…ve 1,5 sn sonra kapanır",$("#alarm").hidden);
  ev("S.medLog=[];tab='ilac';notifTap({actionId:'tap',notification:{id:1001000,extra:{act:'med',m:1,s:'"+slot+"'}}})");await sleep(30);
  ok("ilaç bildirimine dokununca alarm ekranı açılır",!$("#alarm").hidden&&txt().includes("Aspirin"));
  click('#alarm [data-al="t:0"]');await sleep(30);
  ok("canlı bölge kalıcı ve işaretlemeyi duyurur",$("#allive").getAttribute("aria-live")==="polite"&&$("#allive").textContent==="Aspirin alındı");
  ev("S.medLog=[]");ev("alarmOpen()");click('#alarm [data-al="open"]');
  ok("Uygulamayı aç: alarm kapanır, ana sayfa (Bugün) açılır",$("#alarm").hidden&&ev("tab")==="bugun");
  ev("S.medLog=[{id:1,m:1,day:dayKey(new Date(Date.now()-600000)),slot:'"+slot+"',st:'t'}];notifTap({actionId:'tap',notification:{id:1001000,extra:{act:'med'}}})");await sleep(30);
  ok("geç dokunuşta vadesi gelen doz yoksa alarm ekranı açılmaz",$("#alarm").hidden);
  console.log(`${total} test, ${bad} hata`);process.exit(bad||total<20?1:0);
},300);
