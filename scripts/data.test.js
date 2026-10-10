/* Data integrity: corrupt record recovery, field isolation, dropped item notice, quota, archive limit, multiple tabs, key vault fallback. */
const {ok,finish}=require("./ok");
const {boot,fakeVault}=require("./html");
const open=async(seed,o={})=>{
  const w=await boot(w=>{
    Object.defineProperty(w,"crypto",{value:require("node:crypto").webcrypto});w.confirm=()=>o.confirm!==false;
    if(o.vault)w.Capacitor={Plugins:{KeyVault:o.vault}};
    for(const k in seed)w.localStorage.setItem(k,seed[k]);
    if(o.quota){
      const set=w.Storage.prototype.setItem,used=(s,skip)=>{let n=0;for(let i=0;i<s.length;i++){const k=s.key(i);if(k!==skip)n+=k.length+s.getItem(k).length}return n};
      w.Storage.prototype.setItem=function(k,v){if(used(this,k)+k.length+String(v).length>o.quota)throw new Error("QuotaExceededError");return set.call(this,k,v)};
    }
  });
  await w.eval("keysP");
  return w;
};
const E=(day,type,v,x={})=>({id:0,day,time:"08:00",type,v,text:"",...x});
(async()=>{
  // corrupt record: recovery screen, save is locked
  let w=await open({nw_state:'{"entries":[{"id":1,'});
  const loadBackup=require("./bkhelp.js")(()=>w);
  let ev=s=>w.eval(s),q=s=>w.document.querySelector(s),ls=k=>w.localStorage.getItem(k);
  ok("corrupt JSON: the \"Kayıtların okunamadı\" screen shows, the raw data stays in place",q("#view").textContent.includes("Kayıtların okunamadı")&&ls("nw_state")==='{"entries":[{"id":1,');
  ev("S.settings.kcal=2000");ev("save()");
  ok("save writes nothing on the recovery screen (the raw data is not overwritten)",ls("nw_state")==='{"entries":[{"id":1,');
  q('[data-act="rectry"]').click();
  ok("retry: if still corrupt the screen stays",q("#view").textContent.includes("Kayıtların okunamadı"));
  w.localStorage.setItem("nw_state",JSON.stringify({entries:[E("2026-09-01","weight",80)],settings:{obDone:true}}));
  q('[data-act="rectry"]').click();
  ok("retry: once the record is fixed it loads",ev("S.entries.length")===1&&!q("#view").textContent.includes("Kayıtların okunamadı"));
  w=await open({nw_state:"bozuk{"});ev=s=>w.eval(s);q=s=>w.document.querySelector(s);
  q('[data-act="recnew"]').click();
  ok("start empty: the raw copy is kept in nw_state_corrupt, the app opens, records are written",w.localStorage.getItem("nw_state_corrupt")==="bozuk{"&&w.localStorage.getItem("nw_state")!=="bozuk{"&&!q("#view").textContent.includes("Kayıtların okunamadı"));
  ev("S.settings.obDone=true;tab='settings-data';render()");
  ok("Data and backup: the unreadable copy row with export and delete buttons",q('[data-act="copy:nw_state_corrupt"]')&&q('[data-act="copydel:nw_state_corrupt"]'));
  q('[data-act="copydel:nw_state_corrupt"]').click();
  ok("the copy is deleted",w.localStorage.getItem("nw_state_corrupt")===null&&!q('[data-act="copy:nw_state_corrupt"]'));

  // field isolation, dropped item count, ids, orphan wid
  w=await open({});ev=s=>w.eval(s);
  const raw={entries:[E("2026-09-01","weight",80,{id:7}),E("2026-09-02","weight",81,{id:7}),E("2026-09-03","exercise",30,{id:3,wid:5}),E("2026-09-03","exercise",20,{id:4,wid:99}),{type:"x"},E("2026-09-04","water",-5)],
    settings:{obDone:true,kcal:2000},meds:[{id:1,n:"A",t:["08:00"]}],medLog:[{m:1,day:"2026-09-01",slot:"08:00",st:"t"}],
    workouts:[{id:5,day:"2026-09-03",t0:1e12,t1:1e12+6e5,name:"A",ex:[{id:"squat",sets:[{kg:100,reps:5,done:true},{kg:5000,reps:5,done:true}]}]},{id:"x"}]};
  ev(`window.__b=buildState(${JSON.stringify(raw)})`);
  ok("ids are kept, a clashing id is reassigned, nextId is the largest + 1",ev("__b.S.entries.map(e=>e.id).join()")==="7,8,3,4"&&ev("__b.S.nextId")===9,ev("__b.S.entries.map(e=>e.id).join()"));
  ok("an orphan wid is cleared, a linked one stays; medication, medication log and workout ids are intact",ev("__b.S.entries.map(e=>e.wid).join()")===",,5,"&&ev("__b.S.medLog.length")===1&&ev("__b.S.meds[0].id")===1&&ev("__b.S.workouts[0].id")===5,ev("__b.S.entries.map(e=>e.wid).join()"));
  ok("dropped item count: 2 invalid records + 1 corrupt workout + 1 out-of-range set",ev("__b.drop")===4,ev("__b.drop"));
  ev("MedLib.cleanMeds=()=>{throw new Error('x')}");
  ev(`window.__b=buildState(${JSON.stringify(raw)})`);
  ok("when one field is corrupt only that field returns to its default: entries, settings and workouts are kept",ev("__b.lost.join()")==="meds"&&ev("__b.S.meds.length")===0&&ev("__b.S.medLog.length")===0&&ev("__b.S.entries.length")===4&&ev("__b.S.settings.kcal")===2000&&ev("__b.S.workouts.length")===1,ev("__b.lost.join()"));
  w=await open({nw_state:JSON.stringify(raw)});ev=s=>w.eval(s);
  ok("what was dropped at startup is reported and the raw copy is kept",ev("loadNote").includes("4 geçersiz kayıt")&&JSON.parse(w.localStorage.getItem("nw_state_corrupt")).entries.length===6&&w.document.querySelector("#tmsg").textContent.includes("4 geçersiz"),ev("loadNote"));
  w=await open({nw_state:JSON.stringify({entries:[E("2026-09-01","weight",80,{id:3})],settings:{obDone:true}})});ev=s=>w.eval(s);
  ok("with a clean record there is no note and no copy; ids are the same after the round trip",ev("loadNote")===""&&w.localStorage.getItem("nw_state_corrupt")===null&&ev("S.entries[0].id")===3&&ev("S.nextId")===4);

  // quota: safety copies go first; archive limit
  const big="x".repeat(300000);
  w=await open({nw_state:JSON.stringify({entries:[E("2026-09-01","weight",80)],settings:{obDone:true}}),nw_state_previous:big,nw_state_corrupt:big},{quota:900000});ev=s=>w.eval(s);
  ev("S.entries.push(...Array.from({length:3000},(_,i)=>({id:i+10,day:'2026-09-01',time:'08:00',type:'note',v:null,text:'n'.repeat(60)})));save()");
  ok("when storage is full the safety copy is deleted first, the record is written, user data is untouched",ev("saveFail")===false&&JSON.parse(w.localStorage.getItem("nw_state")).entries.length===3001&&w.localStorage.getItem("nw_state_previous")===null&&w.localStorage.getItem("nw_state_corrupt")!==null);
  {
    const seed=at=>open({nw_state:JSON.stringify({entries:[E("2026-09-01","weight",80)],settings:{obDone:true,copyAt:at}}),nw_state_previous:big},{quota:600000});
    const fill="S.entries.push(...Array.from({length:3000},(_,i)=>({id:i+10,day:'2026-09-01',time:'08:00',type:'note',v:null,text:'n'.repeat(60)})))";
    w=await seed("2026-09-01");ev=s=>w.eval(s);ev("S.settings.copyAt=dayKey()");
    ev(fill+";markBackup(true)");
    ok("auto backup (quota full, copy under 7 days old): the safety copy is not deleted, the record is written afterwards",w.localStorage.getItem("nw_state_previous")!==null&&JSON.parse(w.localStorage.getItem("nw_state")).entries.length===1);
    ev("save()");
    ok("when real quota is needed for user data the copy goes anyway",w.localStorage.getItem("nw_state_previous")===null&&JSON.parse(w.localStorage.getItem("nw_state")).entries.length===3001);
    w=await seed("");ev=s=>w.eval(s);ev("S.settings.copyAt=keyOff(-7)");ev(fill+";markBackup(true)");
    ok("after 7 days the auto backup may delete the copy too",w.localStorage.getItem("nw_state_previous")===null&&JSON.parse(w.localStorage.getItem("nw_state")).entries.length===3001);
    w=await seed("");ev=s=>w.eval(s);ev("S.settings.copyAt=dayKey()");ev("sheetPrivacy();document.body.insertAdjacentHTML('beforeend','<button id=gd data-act=copyseen></button>')");w.document.querySelector("#gd").click();ev(fill+";markBackup(true)");
    ok("after the \"Gördüm\" confirmation the protection is lifted",ev("S.settings.copyAt")===""&&w.localStorage.getItem("nw_state_previous")===null);
  }
  w=await open({nw_state_previous:"y".repeat(2e6)});ev=s=>w.eval(s);
  ok("copies count toward the size warning",ev("storeBytes")>4e6&&ev("storeMsg()")!==null,ev("storeBytes"));
  w=await open({});ev=s=>w.eval(s);
  const msg=i=>({id:i,role:"user",text:"a".repeat(1500),t:i}),arc=n=>Array.from({length:n},(_,c)=>({id:1000+c,t:c,title:"S"+c,msgs:Array.from({length:150},(_,i)=>msg(c*1000+i+1))}));
  ev(`S.chats=${JSON.stringify(arc(20))};save()`);
  ok("archived chats stay within the total size limit (the oldest go, the newest stay)",JSON.stringify(ev("S.chats")).length<=1.5e6&&ev("S.chats.length")<20&&ev("S.chats[0].id")===1000&&w.localStorage.getItem("nw_state").length<2e6,ev("S.chats.length"));

  // multiple tabs
  w=await open({nw_state:JSON.stringify({entries:[E("2026-09-01","weight",80)],settings:{obDone:true}})});ev=s=>w.eval(s);
  const other=JSON.stringify({entries:[E("2026-09-01","weight",80),E("2026-09-02","weight",79)],settings:{obDone:true,kcal:1900}});
  w.dispatchEvent(new w.StorageEvent("storage",{key:"nw_state",newValue:other,storageArea:w.localStorage}));
  ok("another tab's save is taken, this tab does not overwrite it with old data",ev("S.entries.length")===2&&ev("S.settings.kcal")===1900&&w.document.querySelector("#tmsg").textContent.includes("sekme"));
  w.dispatchEvent(new w.StorageEvent("storage",{key:"nw_state",newValue:"bozuk{",storageArea:w.localStorage}));
  ok("a corrupt remote value is ignored",ev("S.entries.length")===2);

  // restore: safety copy
  w=await open({nw_state:JSON.stringify({entries:[E("2026-09-01","weight",80)],settings:{obDone:true}})});ev=s=>w.eval(s);
  ev("sheetBackup()");w.document.querySelector("#bk").value=JSON.stringify({entries:[E("2026-09-05","weight",70),E("2026-09-06","weight",69)],settings:{obDone:true}});
  await loadBackup();
  ok("a password-protected backup loads; the previous data is in the safety copy",ev("S.entries.length")===2&&JSON.parse(w.localStorage.getItem("nw_state_previous")).entries[0].v===80);
  ok("once a copy is taken on restore the 7-day protection starts (copyAt is today)",ev("S.settings.copyAt")===ev("dayKey()"));
  ev("sheetPrivacy();pvDelete(1)");
  ok("deleting the category deletes the safety copy too",w.localStorage.getItem("nw_state_previous")===null);

  // key vault
  w=await open({},{vault:fakeVault(true),confirm:false});ev=s=>w.eval(s);
  await ev("setKey('groq','SIRRI-9')");
  ok("vault not working, the user declined plain storage: the key is not written to disk, it stays in the session",(w.localStorage.getItem("nw_keys")||"{}")==="{}"&&!Object.keys(w.localStorage).some(k=>String(w.localStorage.getItem(k)).includes("SIRRI-9"))&&ev("getKeys().groq")==="SIRRI-9");
  w=await open({},{vault:fakeVault(true),confirm:true});ev=s=>w.eval(s);
  await ev("setKey('groq','SIRRI-9')");
  ok("if the user confirms it is stored plain and the choice is remembered",JSON.parse(w.localStorage.getItem("nw_keys")).groq==="SIRRI-9"&&w.localStorage.getItem("nw_keys_plain")==="1");
  w=await open({nw_keys:JSON.stringify({groq:"SIRRI-3"})},{vault:fakeVault(true)});ev=s=>w.eval(s);
  ok("an existing plain key is not lost when the vault is broken, and the user is told",ev("getKeys().groq")==="SIRRI-3"&&w.document.querySelector("#tmsg").textContent.includes("şifrelenemedi"));
  finish();
})();
