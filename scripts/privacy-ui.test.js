/* Privacy choices: hide-recents is its own setting, the lock question in setup, first-consent preview, keys kept out of the backup, sealed shares, photo busy flag. */
const {ok,finish}=require("./ok");
const {boot,until,flush}=require("./html");
const BackupLib=require("../www/modules/data/backuplib.js");
const nodeCrypto=require("node:crypto");
async function open({lock=false,settings={}}={}){
  const calls=[],shared=[],res={secure:true,auth:{ok:true}};
  const w=await boot(w=>{
    Object.defineProperty(w,"crypto",{value:nodeCrypto.webcrypto,configurable:true});
    w.Capacitor={isNativePlatform:()=>true,Plugins:{
      ...(lock?{AppLock:{status:async()=>({secure:res.secure}),authenticate:async()=>res.auth,setSecure:async o=>{calls.push("secure:"+o.on)}}}:{}),
      Filesystem:{readdir:async()=>({files:[]}),deleteFile:async()=>{},writeFile:async o=>{shared.push(o);return {uri:"file:///"+o.path}}},
      Share:{share:async()=>{}}}};
    w.localStorage.setItem("nw_state",JSON.stringify({entries:[],settings:{obDone:true,noticeOk:true,age:30,...settings}}));
  });
  return {w,calls,shared,res};
}
const sw=(w,attr,val)=>{const el=w.document.createElement("input");el.type="checkbox";el.checked=val;el.setAttribute(...attr);w.document.body.append(el);return el};
(async()=>{
  {const {calls}=await open({lock:true,settings:{lockOn:true}});await flush();
  ok("the app lock alone does not set FLAG_SECURE",calls.includes("secure:false")&&!calls.includes("secure:true"),calls);}
  {const {w,calls}=await open({lock:true});await flush();
  const el=sw(w,["data-lk","recents"],true);
  el.dispatchEvent(new w.Event("change",{bubbles:true}));await flush();
  ok("the hide-recents switch sets FLAG_SECURE and is saved",calls.at(-1)==="secure:true"&&w.eval("S.settings.hideRecents")===true&&JSON.parse(w.localStorage.getItem("nw_state")).settings.hideRecents===true,calls);
  w.eval("tab='settings-data';render()");
  ok("settings show the hide-recents switch next to the lock",!!w.document.querySelector("[data-lk=recents]")&&!!w.document.querySelector("[data-lk=toggle]"));}

  {const {w}=await open({lock:true,settings:{obDone:false,age:0}});
  w.eval('Object.assign(ob,{step:0,cm:"170",kg:"70",age:"30",dir:"keep"});render()');
  const box=w.document.querySelector("#oblk");
  ok("setup ends with the question whether the app lock should be on",!!box&&/Uygulama kilidi açılsın mı/.test(w.document.body.textContent));
  box.checked=true;w.document.querySelector('[data-ob="next"]').click();w.document.querySelector('[data-ob="next"]').click();
  ok("answering yes turns the lock on after verification",await until(()=>w.eval("S.settings.lockOn")===true));
  const n=await open({lock:false,settings:{obDone:false,age:0}});
  n.w.eval('Object.assign(ob,{step:0,cm:"170",kg:"70",age:"30",dir:"keep"});render()');
  ok("without the lock plugin (browser) the question is not shown",!n.w.document.querySelector("#oblk"));}

  {const {w}=await open();
  w.eval("cConsent(true,true)");
  ok("the first consent turns the text preview on",w.eval("S.settings.piiPrev")===true);
  w.eval("cConsent(false)");
  sw(w,["data-pv","prev"],true).click();
  w.eval("cConsent(true,true)");
  ok("a later consent keeps the user's own choice",w.eval("S.settings.piiPrev")===false&&w.eval("S.settings.piiPrevOwn")===true);
  w.eval("cConsent(false);S.chat=[{role:'user',text:'x',id:1}];S.settings.piiPrevOwn=false;S.settings.piiPrev=false;S.providers.forEach(p=>p.on=true)");
  const html=w.eval("viewCoach()")||"";
  ok("the consent card offers the preview switch, on by default",/data-pv="prev"[^>]*checked/.test(html),String(html).length);}

  {const {w}=await open();
  w.eval("Coach.keys=()=>({groq:'SECRET-KEY'})");
  const dec=async()=>(await BackupLib.decrypt(JSON.parse(await w.eval("backupJson('mavi bulut 7')")),"mavi bulut 7")).keys;
  ok("by default the backup carries the API keys",(await dec()).groq==="SECRET-KEY");
  sw(w,["data-bk","nokeys"],false).click();
  ok("with the switch on, the backup has no API keys and the setting is saved",Object.keys(await dec()).length===0&&JSON.parse(w.localStorage.getItem("nw_state")).settings.bkNoKeys===true);}

  {const {w,shared}=await open();
  const run=(...a)=>w.eval(`shareOut(${a.join(",")})`);
  const typed=(p1,p2,btn)=>{w.document.querySelector("#shp1").value=p1;w.document.querySelector("#shp2").value=p2;w.document.querySelector(`[data-shp=${btn}]`).click()};
  let r=run(true,'"neowell-x.csv"','"T"','"text/csv"','"a;b\\n1;2"',true);await flush();
  typed("kısa","kısa","ok");
  ok("a weak or mismatching password is refused and nothing is shared",!!w.document.querySelector("#shw").textContent&&!shared.length);
  typed("mavi bulut 7","mavi bulut 7","ok");
  ok("the sealed share hands over a backup-format envelope",await r===true&&shared.length===1&&shared[0].path==="neowell-x.csv.enc.json"&&JSON.parse(shared[0].data).enc==="aes-gcm-pbkdf2");
  const f=(await BackupLib.decrypt(JSON.parse(shared[0].data),"mavi bulut 7")).file;
  ok("the envelope opens with the password and holds the original file",f.name==="neowell-x.csv"&&f.data==="a;b\n1;2"&&f.mime==="text/csv");
  r=run(true,'"neowell-y.csv"','"T"','"text/csv"','"x"',true);await flush();typed("","","no");
  ok("cancelling shares nothing",await r===false&&shared.length===1);
  await run(false,'"neowell-z.csv"','"T"','"text/csv"','"x"',true);
  ok("without sealing the file goes out as is",shared.at(-1).path==="neowell-z.csv"&&shared.at(-1).data==="x");

  w.eval("add('weight',70)");
  w.eval("sheetCsv()");
  const s=w.document.querySelector("[data-pv=seal]");s.click();
  w.document.querySelector("[data-pv=archive]").click();await flush();
  ok("the CSV and archive sheet has a seal switch that routes the archive through the password sheet",!!w.document.querySelector("#shp1"));
  w.eval("closeSheet()");
  w.eval("docSt={days:30,seal:false,q:['','','','','']};docSheet()");
  const ds=w.document.querySelector("[data-doc=seal]");ds.click();
  ok("the doctor report sheet has a seal switch",w.eval("docSt.seal")===true&&!!w.document.querySelector("[data-doc=seal]"));}

  {const {w}=await open();
  w.eval("phShrink=async()=>{await new Promise(r=>setTimeout(r,30));return {blob:{},thumb:'d',w:1,h:1}};phPut=async()=>{window.__puts=(window.__puts||0)+1}");
  w.eval("sheetPhoto()");
  ok("the add sheet says the gallery original stays",/galerideki orijinal/i.test(w.document.querySelector("#sheet").textContent));
  w.eval("window.__f={}");
  await Promise.all([w.eval("phAdd(window.__f)"),w.eval("phAdd(window.__f)")]);
  ok("two picks in a row add one photo",w.__puts===1&&w.eval("phList.length")===1,w.__puts);
  w.eval("sheetPhoto()");await w.eval("phAdd(window.__f)");
  ok("the busy flag is released after an add",w.__puts===2);}
  finish();
})();
