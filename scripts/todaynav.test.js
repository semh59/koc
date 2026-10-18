/* The Today links and the back button: "Hedefin nasıl hesaplandı?" opens the calculation, a ring's detail goes back to Today. */
const {ok,finish}=require("./ok");
const {boot}=require("./html");
const unclock=require("./clock").at;

(async()=>{
  const w=await boot(),ev=s=>w.eval(s),restore=unclock(w,12);
  const q=s=>w.document.querySelector(s);
  ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;Object.assign(S.settings,{kcal:1800,heightCm:175,age:40,sex:"m",act:1});S.entries=[{id:1,day:dayKey(),time:"07:00",type:"weight",v:82,text:""},{id:2,day:dayKey(),time:"09:00",type:"food",v:900,text:"Kahvaltı"},{id:3,day:dayKey(),time:"12:00",type:"food",v:600,text:"Öğle"}];S.nextId=4;tab="today";logOff=0;render()`);
  const link=q('[data-act="goalhow"]');
  ok("the calculation link is on Today and is not a tab link",!!link&&!link.dataset.tab);
  link.click();
  ok("it opens the calculation sheet, Today stays",ev("tab")==="today"&&/Hedefin nasıl hesaplandı/.test(q("#sheet.on")?.textContent||"")&&/Mifflin/.test(q("#sheet.on").textContent),q("#sheet")?.textContent);
  ok("Back closes the sheet first",ev("backKey()")===true&&!q("#sheet.on")&&ev("tab")==="today");
  q('[data-hg="focus:kcal"]').click();
  ok("a ring opens its detail",ev("tab")==="day");
  ok("Back from the ring detail returns to Today, not to the history list",ev("backKey()")===true&&ev("tab")==="today");
  restore();
  finish();
})();
