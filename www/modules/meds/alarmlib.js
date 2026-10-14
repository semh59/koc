"use strict";
/* Pure logic of the full-screen medication alarm (no DOM): the doses to show, the privacy text, the snooze notification. */
const AlarmLib=(()=>{
  const M=typeof MedLib!=="undefined"?MedLib:require("./medlib.js");
  const BEFORE=3*3600000,AHEAD=5*60000,SNOOZE_MIN=10,SNOOZE_NID=7148;

  /* Due doses: scheduled time in [now-3 h, now+5 min] and not logged. A dose past midnight comes back with yesterday's day. */
  function due(meds,log,now){
    const t=now.getTime(),today=M.key(now),rec=M.logIndex(log,M.addDay(today,-1)),out=[];
    for(const day of [M.addDay(today,-1),today])for(const {m,slot} of M.dosesOn(meds,day)){
      const at=M.slotAt(day,slot).getTime();
      if(at<t-BEFORE||at>t+AHEAD||rec(m.id,day,slot))continue;
      out.push({m:m.id,n:m.n,d:M.doseText(m,slot,day),day,slot,at});
    }
    return out.sort((a,b)=>a.at-b.at||a.m-b.m);
  }
  /* Screen text: when the name is hidden (medShowName false) there is no name or dose, only the count. */
  function view(items,showName){
    const n=items.length;
    return {
      lead:!n?"Tüm dozlar alındı.":showName?(n===1?items[0].n+(items[0].d?" · "+items[0].d:""):"Zamanı gelen dozlar:"):M.GENERIC_BODY,
      count:n>1||!showName?`${n} doz`:"",
      rows:items.map(i=>({name:showName?i.n:"İlaç",dose:showName?i.d:"",slot:i.slot}))
    };
  }
  const snoozeAt=now=>now+SNOOZE_MIN*60000;
  /* Snooze notification: one-shot on the medication channel, no buttons; tapping it opens the medication screen and the alarm screen. */
  function snoozeNote(items,showName,at){
    const body=showName&&items.length?items.map(i=>i.n).join(", "):M.GENERIC_BODY;
    return {id:SNOOZE_NID,title:M.TITLE,body,schedule:{at:new Date(at),allowWhileIdle:true},channelId:"nw_med",extra:{act:"med"},autoCancel:true};
  }
  const allDone=items=>items.every(i=>i.st);
  return {due,view,snoozeAt,snoozeNote,allDone,SNOOZE_NID};
})();
if(typeof module!=="undefined")module.exports=AlarmLib;
