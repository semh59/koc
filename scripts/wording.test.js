/* Wording and error-text rules: Vazgeç on confirmations, exercise/workout vocabulary, one apostrophe, storage-full texts name the backup. */
const {ok,finish}=require("./ok");
const {boot,listJs,read}=require("./html");
const src=[...listJs().filter(f=>!/piilib|foods\.js|exlib\.js/.test(f)).map(f=>[f,read(f)]),["index.html",read("index.html")]];
const hits=re=>src.filter(([,t])=>re.test(t)).map(([f])=>f);
(async()=>{
  const w=await boot();
  w.eval("confirmSheet({title:'x'})");
  ok("a confirmation's cancel button reads Vazgeç, the accept button Tamam",w.document.querySelector('#cfm [data-cf="0"]').textContent==="Vazgeç"&&w.document.querySelector('#cfm [data-cf="1"]').textContent==="Tamam");
  ok("no UI source says İptal",hits(/İptal/).length===0,hits(/İptal/));
  ok("the single exercise is called egzersiz, not hareket, in the gym and Coach-program screens",hits(/Eşleşen hareket|[Hh]areket ekle|enzer hareket|Bu hareket(i|le) |Hareket şekli|ilk hareket|Son hareket|Tamamlanan hareket/).length===0,hits(/Eşleşen hareket|[Hh]areket ekle|enzer hareket|Bu hareket(i|le) /));
  ok("one apostrophe form: no curly ’ in user texts",hits(/[’‘]/).length===0,hits(/[’‘]/));
  ok("the save-failure toast and the banner both tell to take a backup",/yedek al/.test(w.eval("SAVE_FAIL"))&&/yedek/.test(w.eval("(saveFail=true,storeMsg().join(' '))")));
  ok("the restore-failure text names the backup too",/Yedek yüklenemedi, depolama dolu\. Mevcut verinin yedeğini al/.test(read("main/04-sheets.js")));
  const say=()=>w.document.querySelector("#tmsg").textContent;
  const geo=err=>Object.defineProperty(w.navigator,"geolocation",{value:{getCurrentPosition:(g,b)=>b(err)},configurable:true});
  geo({code:1});w.eval("ramLocate()");
  ok("location: a refused permission and a temporary failure read differently",/izni verilmedi/.test(say()));
  geo({code:2});w.eval("ramLocate()");
  ok("location: a temporary failure does not blame the permission",/şu an alınamadı/.test(say())&&!/izin/.test(say()));
  const cam=name=>Object.defineProperty(w.navigator,"mediaDevices",{value:{getUserMedia:async()=>{throw Object.assign(new Error("x"),{name})}},configurable:true});
  w.eval("S.settings.obDone=true");
  cam("NotAllowedError");await w.eval("plStart()");
  ok("camera: a refused permission says so",/Kamera izni verilmedi/.test(say()),say());
  cam("NotReadableError");await w.eval("plStart()");
  ok("camera: a busy camera is not reported as a permission problem",/şu an açılamadı/.test(say())&&!/izin/.test(say()),say());
  finish();
})();
