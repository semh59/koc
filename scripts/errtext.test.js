/* Raw error messages (library or Java exception text) never reach the user: a fixed Turkish sentence is shown instead. */
const {ok,finish}=require("./ok");
const {boot,until}=require("./html");
(async()=>{
  const boom=()=>{throw new Error("SECRET_INTERNAL_ERROR")};
  const w=await boot(w=>{
    w.Capacitor={isNativePlatform:()=>true,getPlatform:()=>"android",Plugins:{
      BarcodeScanner:{isGoogleBarcodeScannerModuleAvailable:async()=>({available:true}),scan:async()=>boom()},
      LocalNotifications:{checkPermissions:async()=>boom(),requestPermissions:async()=>boom(),getPending:async()=>boom(),cancel:async()=>boom(),schedule:async()=>boom(),checkExactNotificationSetting:async()=>boom(),createChannel:async()=>boom(),removeAllDeliveredNotifications:async()=>boom(),addListener:async()=>({remove(){}})},
      Motion:{requestAccess:async()=>boom(),status:async()=>({}),configure:async()=>{}}
    }};
  });
  const ev=s=>w.eval(s),q=s=>w.document.querySelector(s),msg=()=>q("#tmsg").textContent;
  ev("S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;tab='today';render()");
  const clean=t=>!/SECRET_INTERNAL_ERROR|TypeError|undefined/.test(t);

  ev("barcodeRead()");await until(()=>/Barkod okunamadı/.test(msg()));
  ok("barcode: failure shows a fixed sentence",/^Barkod okunamadı\. /.test(msg())&&clean(msg()),msg());

  ev("S.settings.motionOn=false;S.settings.stepsOn=true;motionToggle()");await until(()=>/Hareket algılama açılamadı/.test(msg()));
  ok("motion: failure shows a fixed sentence",/^Hareket algılama açılamadı\. /.test(msg())&&clean(msg()),msg());

  const st=await ev("scheduleReminders()");
  ok("notifications: a scheduling failure returns a fixed sentence",/^Bildirimler kurulamadı\. /.test(st)&&clean(st),st);
  await ev("notifTest()");
  ok("notification test: the diagnosis line has no raw message",clean(ev("notifDiag"))&&/Bildirim denemesi yapılamadı/.test(ev("notifDiag")),ev("notifDiag"));

  ev("impText('a\u0000b','x.csv')");
  ok("gym import: the file error written for the user is still shown",/Dosya metin değil/.test(msg()),msg());
  ev("ImportLib.read=()=>{throw new TypeError('SECRET_INTERNAL_ERROR is not a function')}");
  ev("impText('a,b','x.csv')");
  ok("gym import: an unexpected error shows a fixed sentence",/^Dosya okunamadı\./.test(msg())&&clean(msg()),msg());

  ok("csv read: a file error written for the user is kept",/Dosya metin değil/.test(ev("CsvReadLib.read('a\u0000b').err")));
  ev("ImportLib.parse=()=>{throw new TypeError('SECRET_INTERNAL_ERROR')}");
  const r=ev("CsvReadLib.read('a,b')");
  ok("csv read: an unexpected error shows a fixed sentence",/^Dosya okunamadı\./.test(r.err)&&clean(r.err),r.err);
  finish();
})();
