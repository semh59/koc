/* ---------- data-act actions (registry: Act in kernel.js) ---------- */
const {on,onPre}=Act;
on("water",()=>{
  const {glass,waterMl}=S.settings,e=add("water",glass);render();
  const t=dayKey(),top=sum("water",t,t),reached=top>=waterMl&&top-glass<waterMl;
  if(reached)scheduleReminders().then(setNotif);
  toast(`+${glass} ml, bugün ${Math.round(top)} / ${waterMl} ml`+(reached?". Günlük hedef tamam":""),e.id);
});
on("weight",()=>sheetWeight());
on("yesterday",()=>repeatYesterday());
on("own",()=>{ownOpen();$("#ft").focus()});
on("tplnew",()=>sheetTpl());
on("food",()=>sheetFood());
on("exercise",()=>sheetExercise());
on("note",()=>sheetNote());
on("backup",()=>sheetBackup());
on("recexp",()=>shareFile(`neowell-ham-kayit-${dayKey()}.json`,"Okunamayan kayıt","application/json",recovery.raw,true));
on("rectry",()=>{const s=load();if(recovery)return toast("Kayıt hâlâ okunamıyor");S=s;render();scheduleReminders().then(setNotif)});
on("recnew",()=>{
  const fresh=()=>{recovery=null;S=structuredClone(DEF);save();render();scheduleReminders().then(setNotif)};
  if(rawCopy(recovery.raw))fresh();
  else confirmSheet({title:"Boş başlansın mı?",body:"Ham kopya depolama dolu olduğu için saklanamıyor. Dışa aktarmadıysan bu veri kaybolur. Yine de boş başlansın mı?",ok:"Boş başla",danger:true}).then(ok=>{if(ok&&recovery)fresh()});
});
const copyKey=(a,prefix)=>{const k=a.slice(prefix.length);return COPIES.some(([c])=>c===k)?k:null};
onPre("copy:",a=>{const k=copyKey(a,"copy:");if(k)shareFile(`neowell-kopya-${dayKey()}.json`,"Güvenlik kopyası","application/json",Store.get(k),true)});
on("copyseen",()=>{S.settings.copyAt="";save();render()});
onPre("copydel:",a=>{const k=copyKey(a,"copydel:");if(k){Store.del(k);otherBytes=lsOther();render()}});
on("databackup",()=>{tab="settings-data";render();sheetBackup()});
on("abfix",()=>{tab="settings-data";render()});
on("fullalarm",()=>exactAsk());
on("fullscreen",()=>{MW()?.fsiSettings().catch(()=>toast("Ayar ekranı açılamadı, telefon ayarlarında Tam ekran bildirimleri bul"))});
on("drive",()=>sheetDrive());
on("notiftest",()=>notifTest());
on("barcode",()=>barcodeRead());
on("stepsopen",()=>stepsOpen());
on("stepsadd",()=>sheetSteps());
on("walkgo",()=>{tab="steps";render();window.scrollTo(0,0)});
on("stepsno",()=>{S.settings.stepsAsked=true;save();render()});
on("stepsoff",()=>{S.settings.stepsOn=false;save();motionStopAll();render();toast("Adım sayar kapatıldı. Eski adım kayıtların durur")});
on("bat",batFix);
on("oem1",()=>openDH("openAutostart"));
on("oem2",()=>openDH("openBattery"));
on("stepsfix",batFix);
on("stepshide",()=>{S.settings.stepWarnDay=dayKey();save();render()});
on("profile",()=>{tab="settings-profile";render();window.scrollTo(0,0)});
on("health",()=>{
  const r=risk();
  openSheet(`<h3>Sağlık notların</h3><div class="lbl">Güvenlik frenin bilmesi gerekenler. Yalnız telefonda durur, Rehber’e gönderilmez.</div>
  ${swRow('id="hpg"',r.pregnant,"Hamileyim")}${swRow('id="hnu"',r.nursing,"Emziriyorum")}
  ${r.ed?`<p class="hint">Yeme düzeniyle ilgili bir işaret var: kalori açığı, oruç ve program önerileri kapalı. Bu işareti uygulamadan kaldıramazsın; hekimine ya da diyetisyenine danış.</p>`:swRow('id="hed"',false,"Yeme bozukluğu geçmişim var")}
  <label class="lbl" for="hn">Hastalık, ilaç ve diğer notlar</label><textarea class="in" id="hn" maxlength="500">${esc(S.settings.healthNote)}</textarea><button class="btn" data-go="health">Kaydet</button>`);
});
/* Hamilelik and emzirme are lifted only by the user's own confirmation; the eating-disorder sign is never lifted here. */
async function goHealth(){
  const st=S.settings,r=risk(),snap=structuredClone(st),note=$("#hn").value.trim().slice(0,500);
  const lifts=[["preg",r.pregnant,$("#hpg").checked,"Artık hamile değil misin?"],["nurs",r.nursing,$("#hnu").checked,"Artık emzirmiyor musun?"]];
  for(const [k,was,now,title] of lifts)if(was&&!now&&!await confirmSheet({title,body:"Bu işaretle kapanan öneriler (kalori açığı, oruç, program, hatırlatmalar, döngü tahmini) yeniden açılır. Hâlâ başka bir durum varsa kutuyu açık bırak.",ok:"Evet, kaldır"}))return;
  for(const [k,was,now] of lifts){if(now&&!was)setRisk(k);else if(was&&!now)liftRisk(k)}
  if($("#hed")?.checked)setRisk("ed");
  const old=st.healthNote;st.healthNote=note;if(note!==old)cNoteCheck();
  if(!commit(()=>Object.assign(S.settings,snap)))return;
  closeSheet();render();toast("Kaydedildi");
}
on("riskok",()=>{S.settings.riskClearedAt=dayKey();save();render();toast("Onaylandı, 30 gün geçerli")});
onPre("apply:",a=>{S.settings.kcal=+a.slice(6);save();render();toast(`Kalori hedefi ${S.settings.kcal} kcal oldu`)});
on("reset",()=>{confirmSheet({title:"Tüm veriler silinsin mi?",body:"Tüm kayıtlar, güvenlik kopyası, kayıtlı Rehber anahtarları ve kayıtlı yedek parolası silinecek. Bu geri alınamaz. Devam edilsin mi?",ok:"Hepsini sil",danger:true}).then(ok=>{if(!ok)return;
  chain(S.settings.motionOn?motionStopAll():0,()=>chain(phClear(),photosOk=>chain(nativeWipe(["Motion","MedWake","Widget","QuickLog"]),nativeOk=>{
    if(!nativeOk)toast(NATIVE_FAIL);
    if(!photosOk||!nativeOk)return;
    BF()?.clear().catch(()=>{});cacheClean();["nw_state",...COPIES.map(([k])=>k)].forEach(k=>Store.del(k));["nw_state_usage",NetLog.KEY,KEYS_LS,KEYS_ENC,BKPW_LS,RAM_LS,"nw_keys_plain","nw_walkgps_no","nw_pdfok"].forEach(lsDel);ramCache=undefined;KEYS={};S=structuredClone(DEF);save();recentsSync();logOff=0;render();scheduleReminders().then(setNotif);toast("Tüm veriler silindi");
  })));
})});
