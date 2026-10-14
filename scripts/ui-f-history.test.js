/* Audit round 2, section F (History and day screen): editable vitals, lab and manual step rows, range error, all measures, search by weight, water and sleep, Do Not Disturb note. */
const {ok,finish}=require("./ok");
const {boot,flush}=require("./html");
(async()=>{
  const w=await boot(w=>{w.Capacitor={isNativePlatform:()=>true,Plugins:{}}}),ev=s=>w.eval(s),q=s=>w.document.querySelector(s),qa=s=>[...w.document.querySelectorAll(s)];
  const fresh=(extra="")=>ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.settings.bpOn=true;S.settings.bsOn=true;S.entries=[];${extra};logOff=0;hg={seg:"cal",ym:null,q:"",focus:null,type:"",from:"",to:""};tab='day';render()`);
  fresh(`S.vitals=[{id:1,day:dayKey(),time:"08:00",k:"t",sys:120,dia:80,pulse:60,session:"morning",sid:"a"},{id:2,day:dayKey(),time:"09:00",k:"s",g:100,ctx:"acl"}];S.labs=[{id:1,day:dayKey(),n:"Glukoz",k:"glucose",v:5,u:"mmol/L"}];add("steps",1500,"manual")`);
  ok("blood pressure, glucose and lab rows on the day screen are buttons",!!q('button.row[data-vt="edit:1"]')&&!!q('button.row[data-vt="edit:2"]')&&!!q('button.row[data-lab="edit:1"]'));
  q('button.row[data-vt="edit:1"]').click();
  ok("a blood pressure row opens its edit sheet",/Tansiyonu düzenle/.test(q("#sheet").textContent));
  ev("closeSheet()");
  q('button.row[data-lab="edit:1"]').click();
  ok("a lab row opens its edit sheet",/Numune tarihi/.test(q("#sheet").textContent));
  ev("closeSheet();tab='steps';render()");
  q('[data-edit]').click();
  ok("a manual step entry opens an edit sheet with the step count",/Adım sayısı/.test(q("#sheet").textContent)&&q("#ev").value==="1500");
  q("#ev").value="2200";q('[data-go="entry"]').click();await flush();
  ok("saving changes the entry",ev("S.entries.find(e=>e.type==='steps').v")===2200);
  q("#tundo").click();
  ok("Geri al restores it",ev("S.entries.find(e=>e.type==='steps').v")===1500);
  ev("add('steps',4000,'')");
  ok("a sensor entry has no edit sheet",(ev("sheetEntry(S.entries.find(e=>e.type==='steps'&&e.text==='').id)"),!q("#sheet.on")));

  /* date range */
  fresh();ev("hg.seg='search';hg.q='tavuk';hg.from=keyOff(-1);hg.to=keyOff(-5);tab='history';render()");
  ok("a start day after the end day says so instead of an empty result",/Başlangıç günü, bitiş gününden sonra olamaz/.test(q("#hgres").textContent)&&!!q("#hgres .ferr"));

  /* search types */
  fresh(`S.sleep=[{day:dayKey(),min:450}];add("weight",84.3);const e=add("water",250);e.dr="tea";add("water",300)`);
  ev("hg.seg='search';tab='history';render()");
  const typeChips=qa('[data-hg^="type:"]').map(b=>b.textContent);
  ok("the type chips include Kilo, Su and Uyku",["Kilo","Su","Uyku"].every(t=>typeChips.includes(t)),typeChips);
  const search=(t,x)=>{ev(`hg.type='${t}';hg.q=${JSON.stringify(x)};render()`);return q("#hgres").textContent};
  ok("a weigh-in is found by its value and the Kilo chip",/84,3/.test(search("weight","84,3"))&&/Kilo/.test(q("#hgres").textContent));
  ok("water is found by the drink name",/Çay 250 ml/.test(search("water","çay")));
  ok("sleep is found by its duration",/Uyku 7 sa 30 dk/.test(search("sleep","7 sa")));
  ok("the Kilo chip does not list water",!/ml/.test(search("weight","su")));

  /* measures */
  fresh(`S.measures=[1,2,3,4,5,6,7].map(i=>({day:keyOff(-i),k:"waist",v:80+i}))`);
  ev("msel='waist';tab='trend';tSec='weight';render()");
  const rowsN=()=>qa('[data-ms^="edit:"]').length;
  const n0=rowsN();
  ok("the measure list shows five and a Tümünü göster button",n0===5&&!!q('[data-ms="all"]')&&/Tümünü göster \(7\)/.test(q('[data-ms="all"]').textContent),n0);
  q('[data-ms="all"]').click();
  ok("Tümünü göster lists all of them",rowsN()===7);

  /* Do Not Disturb note */
  ev("tab='settings-reminders';render()");
  ok("the reminders screen has the Do Not Disturb note",/Rahatsız Etme/.test(q("#view").textContent));
  ev("pmSheet()");
  ok("the permission center has the Do Not Disturb note",/Rahatsız Etme/.test(q("#sheet").textContent));
  finish();
})();
