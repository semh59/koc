/* Döngü takibi: cyclelib (doğrulama, temizlik, tahmin), yedek turu, gizlilik (Koç bağlamı, bildirim), bildirim kimlikleri. */
const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const www=f=>path.join(__dirname,"../www",f);
const C=require("../www/cyclelib.js"),T="2026-10-06";
const add=(k,n)=>C.addDays(k,n);
const starts=(...ds)=>ds.map(s=>({s}));
const chain=lens=>{let d="2025-01-01";const r=[{s:d}];for(const l of lens){d=add(d,l);r.push({s:d})}return C.clean(r,T)};

{ // doğrulama
  const e=x=>C.check(x,T).err,g=x=>C.check(x,T).row;
  ok("geçerli başlangıç kabul",!!g({s:"2026-09-10"})&&g({s:"2026-09-10"}).e===undefined);
  ok("gelecek başlangıç reddedilir, bugün kabul",!!e({s:"2026-10-07"})&&!!g({s:T}));
  ok("bozuk tarih reddedilir",!!e({s:"2026-13-40"})&&!!e({s:"x"})&&!!e(null)&&!!e({s:"2026-02-30"}));
  ok("bitiş başlangıçtan önce, gelecek ya da 14 günden uzun reddedilir",!!e({s:"2026-09-10",e:"2026-09-09"})&&!!e({s:"2026-10-05",e:"2026-10-07"})&&!!e({s:"2026-09-01",e:"2026-09-15"})&&!!g({s:"2026-09-01",e:"2026-09-14"}));
  ok("5 yıldan eski reddedilir",!!e({s:"2021-01-01"})&&!!g({s:"2021-12-01"}));
  const r=g({s:"2026-09-10",flow:"y",sym:["k","zz","k","r"],not:"  "+"a".repeat(200)});
  ok("akış ve belirti yalnız bilinen etiket, not 80 karakter, boş not atılır",r.flow==="y"&&r.sym.join()==="k,r"&&r.not.length===80&&g({s:T,not:" "}).not===undefined&&g({s:T,flow:"x"}).flow===undefined);
}
{ // temizlik
  const c=C.clean([{s:"2026-09-10",e:"2026-09-14"},{s:"2026-09-12"},{s:"2026-08-12"},{s:"2026-09-14"},{s:"2027-01-01"},null,"x",{s:"2026-09-20"}],T);
  ok("clean: çakışan, gelecek ve geçersiz atılır, sıralanır, kimlikler 1..n",c.map(r=>r.s).join()==="2026-08-12,2026-09-10,2026-09-20"&&c.map(r=>r.id).join()==="1,2,3",c);
  ok("clean: dizi olmayan girdi boş döner, kendi çıktısıyla değişmez",C.clean(null,T).length===0&&C.clean({},T).length===0&&JSON.stringify(C.clean(c,T))===JSON.stringify(c));
  const many=Array.from({length:200},(_,i)=>({s:add("2021-12-01",i*20)})).filter(x=>x.s<=T);
  const m=C.clean(many,T);
  ok("clean: 5 yıldan eski budanır, en çok 80 kayıt",m.length<=80&&m.every(r=>C.diff(T,r.s)<=5*366)&&m.length>60,m.length);
  ok("overlap: yeni kayıt mevcutla çakışırsa true",C.overlap(c,{s:"2026-09-12"})&&C.overlap(c,{s:"2026-09-08",e:"2026-09-11"})&&!C.overlap(c,{s:"2026-09-15"}));
}
{ // tahmin
  ok("az veri: 0-1 döngü uzunluğunda tahmin yok",!C.predict([]).ok&&!C.predict(starts("2026-08-01")).ok&&!C.predict(starts("2026-08-01","2026-08-29")).ok);
  const p=C.predict(chain([28,28,28]));
  ok("düzenli 28 gün: ortalama 28, sapma 0, ±2 gün, düzensiz değil",p.ok&&p.mean===28&&p.sd===0&&!p.irregular&&C.diff(p.to,p.from)===4,p);
  const last=chain([28,28,28]).pop().s;
  ok("aralık son başlangıç + ortalama çevresinde",p.from===add(last,26)&&p.to===add(last,30));
  const q=C.predict(chain([26,30,26,30]));
  ok("ortalama ve sapma hesaplanır (28 ± 2)",q.mean===28&&q.sd===2&&!q.irregular,q);
  const ir=C.predict(chain([21,40,24,45]));
  ok("düzensiz döngü işaretlenir, aralık genişler",ir.irregular&&C.diff(ir.to,ir.from)>C.diff(p.to,p.from),ir);
  ok("yalnız son 6 döngü sayılır",C.lengths(chain([40,40,40,28,28,28,28,28,28])).join()==="28,28,28,28,28,28");
  ok("atlanmış kayıt (60 günden uzun) ortalamayı bozmaz",C.predict(chain([28,28,100,28])).mean===28);
  const f=C.fertile(p,last);
  ok("yumurtlama sonraki başlangıçtan 14 gün önce, pencere -5/+1 gün",f.ov===add(last,28-14)&&f.from===add(f.ov,-5)&&f.to===add(f.ov,1),f);
  ok("sapmalı ama düzenli (28 ± 2): sonraki başlangıç ortalamadan",C.fertile(C.predict(chain([26,30,26,30])),chain([26,30,26,30]).pop().s).ov===add(chain([26,30,26,30]).pop().s,14));
  const g=C.fertile(p,T);
  ok("pencere bugünden önce kalıyorsa sonraki döngüye kayar, geçmiş tarih yok",f.to<T&&g.to>=T&&C.diff(g.ov,f.ov)%28===0&&C.diff(g.from,T)<28,g);
  ok("pencere bugün ya da sonrasındaysa kaymaz",C.fertile(p,f.to).ov===f.ov&&C.fertile(p,f.from).ov===f.ov);
  ok("az veri: yumurtlama ve pencere yok",C.fertile(C.predict([]))===null&&C.fertile(C.predict(starts("2026-08-01","2026-08-29")))===null&&C.fertile(null)===null);
  ok("düzensiz döngü: tarih verilmez, yalnız irregular",JSON.stringify(C.fertile(ir))==='{"irregular":true}');
  ok("5 yıldan eski kayıtlarla yumurtlama yok",C.fertile(C.predict(C.clean(starts("2020-01-01","2020-01-29","2020-02-26"),T)))===null);
  ok("dönem günü: açık son kayıt ve 14 günden yeni ise sayılır",C.dayOfPeriod([{s:"2026-10-04"}],T)===3&&C.dayOfPeriod([{s:"2026-10-04",e:"2026-10-05"}],T)===null&&C.dayOfPeriod([{s:"2026-09-01"}],T)===null);
  ok("hatırlatma günü: aralıktan 2 gün önce, geçmişse ya da pencere dışıysa yok",(()=>{const pp={ok:true,from:"2026-10-20"};return C.remindDay(pp,T,30)==="2026-10-18"&&C.remindDay({ok:true,from:"2026-10-07"},T,30)===null&&C.remindDay({ok:true,from:"2026-12-20"},T,30)===null&&C.remindDay({ok:false},T,30)===null})());
}

const html=fs.readFileSync(www("index.html"),"utf8").replace(/<script src="([^"]+)"><\/script>/g,(_,f)=>"<script>"+fs.readFileSync(www(f),"utf8")+"</script>");
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://localhost/",beforeParse(w){Object.assign(w,{structuredClone,TextEncoder,TextDecoder});w.scrollTo=()=>{};w.confirm=()=>true}});
const w=dom.window,ev=s=>w.eval(s);
ev("toast=()=>{}");
const SECRET="GIZLIDONGUNOTU";
const seed=()=>ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.cycleOn=true;S.settings.cycleRem=true;S.settings.age=30;S.cycle=CycleLib.clean([{s:'2026-07-01',e:'2026-07-05',flow:'y',sym:['k'],not:'${SECRET}'},{s:'2026-07-29'},{s:'2026-08-26'},{s:'2026-09-23',not:'${SECRET}'}],'2026-10-06')`);
{ // yedek turu
  seed();
  const b=ev("buildState(JSON.parse(JSON.stringify(S)))");
  ok("yedek turu: döngü kayıtları ve ayarlar geri gelir",JSON.stringify(b.S.cycle)===JSON.stringify(ev("S.cycle"))&&b.S.settings.cycleOn===true&&b.S.settings.cycleRem===true&&b.S.cycle.length===4);
  const bad2=ev(`JSON.stringify(buildState({entries:[],cycle:[{s:'2999-01-01'},{s:'2026-08-01',e:'2026-07-01'},{s:'zz'},{s:'2026-08-10'},{s:'2026-08-10'}],settings:{cycleRem:true}}).S)`);
  const o=JSON.parse(bad2);
  ok("geri yükleme doğrular: geçersiz ve çakışan atılır; cycleOn yoksa hatırlatma da açılmaz",o.cycle.length===1&&o.cycle[0].s==="2026-08-10"&&o.settings.cycleOn===false&&o.settings.cycleRem===false,o);
  ok("varsayılan kapalı, eski yedekte döngü alanı boş",ev("DEF.settings.cycleOn")===false&&ev("buildState({entries:[]}).S.cycle.length")===0);
}
{ // gizlilik: Koç
  seed();ev("cConsent(true)");
  const msgs=JSON.stringify(ev("cMessages('merhaba')")),ctx=ev("CoachLib.contextText(cData())");
  ok("Koç bağlamında ve cMessages gövdesinde döngü verisi yok",![msgs,ctx].some(t=>t.includes(SECRET)||/döngü|cycle|dönem/i.test(t)||t.includes("2026-07-29")),msgs.slice(0,300));
  ok("Koç bağlamında yumurtlama ve doğurgan pencere yok",![msgs,ctx].some(t=>/yumurtlama|doğurgan|fertil|ovul/i.test(t)));
  ok("widget ve CSV dışa aktarımına girmez",!/yumurtlama|doğurgan/i.test(JSON.stringify(ev("CsvLib.files(S,{exName:()=>'x',vctx:()=>'x'}).map(f=>f.build())")))&&!JSON.stringify(ev("CsvLib.files(S,{exName:()=>'x',vctx:()=>'x'}).map(f=>f.build())")).includes(SECRET));
}
{ // bildirim
  seed();
  const n=ev("cycNotif()");
  ok("bildirim kurulur ve metni nötr (konu ya da veri yok)",n&&n.title==="Hatırlatma"&&!/adet|döngü|dönem|regl|cycle|period|yumurt|doğurgan|fertil|ovul/i.test(JSON.stringify([n.title,n.body]))&&n.schedule.at.getHours()===9,n);
  ev("S.settings.cycleRem=false");ok("hatırlatma kapalıysa bildirim yok",ev("cycNotif()")===null);
  ev("S.settings.cycleRem=true;S.settings.cycleOn=false");ok("döngü kapalıysa bildirim yok",ev("cycNotif()")===null);
  ev("S.settings.cycleOn=true;S.settings.healthNote='hamileyim'");ok("hamilelik işaretinde bildirim yok",ev("cycNotif()")===null);
  const used=new Set(),rem=ev("S.settings.reminders.map(r=>r.id)");for(const id of rem)for(let i=0;i<30;i++)used.add(id*100+i);
  ok("kimlik aralığı: hatırlatma (id*100+gün), oruç 9100, rehber 9001-9003 ve ilaç (>=1e6) ile çakışmaz",!used.has(C.NID)&&![9001,9002,9003,9100].includes(C.NID)&&C.NID<1e6&&ev("Math.max(...S.settings.reminders.map(r=>r.id))")<90);
}
{ // ekran ve silme
  seed();ev("S.settings.healthNote='';tab='dongu';render()");
  const v=()=>ev("document.querySelector('#view').textContent");
  ok("ekran: tahmin, not ve takvim görünür",ev("!!document.querySelector('.cypr')")&&/tıbbi tavsiye değildir/.test(v())&&ev("document.querySelectorAll('.cyd').length")===31);
  ev("S.settings.healthNote='hamileyim';render()");
  ok("hamilelik işaretinde tahmin yok, nötr bilgi var",!ev("!!document.querySelector('.cypr')")&&/hamilelik/.test(v()));
  ev("S.settings.healthNote='';S.settings.cycleOn=false;render()");
  ok("kapalıyken ekran kapalı bilgisi gösterir, kayıt listesi yok",/kapalı/.test(v())&&!/Geçmiş/.test(v()));
  ev("S.settings.cycleOn=true");
  ok("Gizlilik kategori listesinde, silince yalnız döngü gider",ev("PV_CATS.some(c=>c[0]==='Döngü kayıtları')")&&(ev("pvDelete(PV_CATS.findIndex(c=>c[0]==='Döngü kayıtları'))"),ev("S.cycle.length")===0));
}
{ // Tüm verileri sil: Koç jeton sayacı da gider
  ev("localStorage.setItem('koc_v1_kullanim','{\"x\":1}');tab='ayar-veri';render()");
  ev("document.querySelector('[data-act=\"sifirla\"]').click()");
  ok("Tüm verileri sil koc_v1_kullanim anahtarını temizler",ev("localStorage.getItem('koc_v1_kullanim')")===null);
}
(async()=>{ // Gizlilik > Döngü kayıtları: yalnız kayıtlar gider, ayar kalır, bekleyen döngü bildirimi iptal edilir
  seed();
  const log={cancel:[],sched:[]},old=w.Capacitor;
  w.Capacitor={isNativePlatform:()=>true,Plugins:{LocalNotifications:{checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),getPending:async()=>({notifications:[{id:9200}]}),getDeliveredNotifications:async()=>({notifications:[]}),cancel:async o=>{log.cancel.push(...o.notifications.map(n=>n.id))},schedule:async o=>{log.sched.push(...o.notifications.map(n=>n.id))}}}};
  await ev("scheduleReminders()");
  ok("silmeden önce döngü bildirimi kurulur",log.sched.includes(9200),log.sched);
  log.cancel.length=0;log.sched.length=0;
  ev("pvDelete(PV_CATS.findIndex(c=>c[0]==='Döngü kayıtları'))");
  await new Promise(r=>setTimeout(r,100));
  ok("kategori silince S.cycle boş, cycleOn ve cycleRem değişmez",ev("S.cycle.length")===0&&ev("S.settings.cycleOn")===true&&ev("S.settings.cycleRem")===true);
  ok("bekleyen döngü bildirimi iptal edilir ve yeniden kurulmaz",log.cancel.includes(9200)&&!log.sched.includes(9200),log);
  w.Capacitor=old;
  process.exit(bad?1:0);
})();
