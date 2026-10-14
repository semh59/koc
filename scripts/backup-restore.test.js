/* Backup and restore screens: honest wording, restore confirmation facts, separate error messages, the restore page, safety copy order and key-write warnings. */
const {ok,finish}=require("./ok");
const {boot,flush,until}=require("./html");
const nodeCrypto=require("node:crypto");
const PW="mavi-bulut-77";
async function open(settings={}){
  const w=await boot(w=>{
    Object.defineProperty(w,"crypto",{value:nodeCrypto.webcrypto,configurable:true});
    w.Capacitor={isNativePlatform:()=>true,Plugins:{
      KeyVault:{encrypt:async({text})=>({data:"ENC:"+Buffer.from(text).toString("base64")}),decrypt:async({data})=>({text:Buffer.from(data.slice(4),"base64").toString()})},
      Filesystem:{readdir:async()=>({files:[]}),deleteFile:async()=>{},writeFile:async o=>({uri:"file:///"+o.path})},Share:{share:async()=>{}}}};
    w.localStorage.setItem("nw_state",JSON.stringify({entries:[],settings:{obDone:true,noticeOk:true,age:30,...settings}}));
  });
  await flush();w.eval("vaultOn=true");
  return w;
}
const toast=w=>w.document.querySelector("#toast").textContent;
const text=w=>w.document.querySelector("#sheet").textContent;
(async()=>{
  const w=await open({lastBackup:"2026-10-01"});
  w.eval("setKey('groq','KEY-12345678');S.settings.healthNote='eski telefon';add('note',null,'a',dayKey());add('note',null,'b',dayKey())");
  const enc=await w.eval(`backupJson("${PW}")`);
  w.eval("S.settings.healthNote='yeni';add('note',null,'c',dayKey())");

  w.eval("sheetBackup()");
  ok("the backup page has one password field, the photo note and a way to the restore page",!w.document.querySelector("#bkpw2")&&/Fotoğraflar yedeğe girmez/.test(text(w))&&!!w.document.querySelector("[data-obr=open]"));
  w.eval("sheetDrive()");await flush();
  ok("the Drive page: photo note, key note, same-password note, last backup says shared and to verify",/Fotoğraflar yedeğe girmez/.test(text(w))&&/anahtarların da yedeğe girer/.test(text(w))&&/aynı parolayı/.test(text(w))&&/ulaştığını denetle/.test(text(w)));
  w.eval("closeSheet();tab='settings-data';render()");
  const v=w.document.querySelector("#view").textContent;
  ok("Settings: the restore page is a row; the delete-everything warning sits at the top",!!w.document.querySelector("#view [data-obr=open]")&&v.indexOf("Uygulamayı silersen")>=0&&v.indexOf("Uygulamayı silersen")<v.indexOf("Yedek al"));

  w.eval("sheetObRestore()");await flush();
  ok("the restore page: file, pasted text, password, check-only, remember switch, photo note",["#obf","#obt","#obpw","[data-obr=check]","#obrem"].every(s=>!!w.document.querySelector(s))&&/Fotoğraflar yedeğe girmez/.test(text(w)));
  w.eval("closeSheet()");

  const err=async(env,pw=PW)=>{await w.eval(`openBackup(${JSON.stringify(JSON.stringify(env))},${JSON.stringify(pw)})`);return toast(w)};
  const e=JSON.parse(enc);
  ok("a newer format, an unknown format and a wrong password give three different messages",
    /daha yeni bir sürüm/.test(await err({...e,neowell:2}))&&/biçimi tanınmıyor/.test(await err({...e,enc:"x"}))&&/Parola yanlış/.test(await err(e,"yanlis-parola-1")));
  ok("the size limit is 20 MB: a 6 MB file passes, a 30 MB file is refused with the limit in the message",w.eval("bkTooBig({size:6e6})")===false&&w.eval("bkTooBig({size:3e7})")===true&&/20 MB/.test(toast(w)));

  let cm="";
  w.confirm=m=>(cm=m,true);
  w.eval("window.__set0=Store.set;Store.set=function(k){if(k==='nw_state_previous')window.__order=S.settings.healthNote;return window.__set0.apply(this,arguments)}");
  w.eval("setKey('groq','')");
  const done=await w.eval(`goRestore(${JSON.stringify(enc)},"${PW}")`);
  ok("restore confirmation: backup date, current counts, photo note",/Yedek tarihi: /.test(cm)&&/Bu telefondaki 3 kayıt değişecek/.test(cm)&&/Yedekten 2 kayıt/.test(cm)&&/Fotoğraflar yedeğe girmez/.test(cm),cm);
  ok("the safety copy is written before the backup replaces the data",done===true&&w.__order==="yeni"&&w.eval("S.settings.healthNote")==="eski telefon"&&w.eval("Store.get('nw_state_previous')")!=null,w.__order);
  ok("the finished toast says consent and automatic backup are set up again here",/Rehber izni ve otomatik yedek bu telefonda yeniden kurulur/.test(toast(w)));
  ok("restore returns the keys and leaves no warning",w.eval("getKeys().groq")==="KEY-12345678"&&w.eval("S.settings.keyMiss")===false);

  w.eval("S.settings.healthNote='yeni';setKey('groq','')");
  w.eval("setKey=async()=>{throw new Error('vault')}");
  await w.eval(`goRestore(${JSON.stringify(enc)},"${PW}")`);
  ok("a key that cannot be written keeps the restored data and leaves a lasting warning",w.eval("S.settings.healthNote")==="eski telefon"&&w.eval("S.settings.keyMiss")===true&&w.eval("load().settings.keyMiss")===true);
  w.eval("tab='settings-data';render()");
  const a=w.document.querySelector('#view [data-act=keymissok]');
  ok("the warning shows in Data and backup until acknowledged",!!a&&/anahtarlarından bazıları yüklenemedi/.test(w.document.querySelector("#view").textContent));
  a.click();ok("acknowledging clears it",w.eval("S.settings.keyMiss")===false);
  w.eval("Store.set=window.__set0");

  w.eval("sheetObRestore()");await flush();
  w.document.querySelector("#obt").value=enc;w.document.querySelector("#obpw").value=PW;
  const keep=w.document.querySelector("#obrem");keep.checked=true;
  w.eval("S.settings.healthNote='yeni'");
  w.document.querySelector("[data-obr=check]").click();await until(()=>/Parola doğru/.test(toast(w)));
  ok("check-only reads the pasted text and loads nothing",/Parola doğru/.test(toast(w))&&w.eval("S.settings.healthNote")==="yeni");
  w.document.querySelector("[data-obr=go]").click();await until(()=>w.eval("S.settings.healthNote")==="eski telefon"&&w.localStorage.getItem("nw_bkpw_enc"));
  ok("restoring from the page can keep the password on this phone",w.eval("S.settings.healthNote")==="eski telefon"&&!!w.localStorage.getItem("nw_bkpw_enc"));

  w.eval("sheetDrive()");await flush();
  let asked=0;w.confirm=()=>(asked++,false);
  w.document.querySelector('[data-bk=forget]').click();await flush();
  ok("forgetting the password asks first and declining keeps it",asked===1&&!!w.localStorage.getItem("nw_bkpw_enc"));
  w.confirm=()=>true;w.document.querySelector('[data-bk=forget]').click();await flush();await flush();
  ok("confirming forgets it",w.localStorage.getItem("nw_bkpw_enc")===null);

  w.eval("closeSheet();tab='settings-data';render()");
  cm="";w.confirm=m=>(cm=m,false);
  w.document.querySelector('[data-act=reset]').click();await flush();
  ok("delete everything names the last backup and asks for a backup first",/Son yedek: .*ulaştığını denetle/.test(cm)&&/Önce yedek al/.test(cm),cm);
  w.eval("closeSheet();S.settings.lastBackup='';sheetBackup()");
  w.document.querySelector("#bkpw").value=PW;w.document.querySelector('[data-go=share]').click();
  await until(()=>w.eval("S.settings.lastBackup")!=="");
  ok("the manual share path also points to Yalnız denetle",/Yalnız denetle/.test(toast(w)));
  w.eval("add('weight',70)");cm="";w.confirm=m=>(cm=m,false);
  w.eval("pvDelete(PV_CATS.findIndex(c=>c[0]==='Kilo'))");
  ok("a category delete names the last backup the same honest way",/ulaştığını denetle/.test(cm),cm);
  finish();
})();
