"use strict";
/* Tam ekran ilaç alarm ekranının saf mantığı (DOM yok): gösterilecek dozlar, gizlilik metni, erteleme bildirimi. */
const AlarmLib=(()=>{
  const M=typeof MedLib!=="undefined"?MedLib:require("./medlib.js");
  const BEFORE=3*3600000,AHEAD=5*60000,SNOOZE_MIN=10,SNOOZE_NID=7148;
  const p2=n=>String(n).padStart(2,"0");
  const hm=d=>p2(d.getHours())+":"+p2(d.getMinutes());
  const atOf=(day,slot)=>new Date(+day.slice(0,4),+day.slice(5,7)-1,+day.slice(8,10),+slot.slice(0,2),+slot.slice(3,5)).getTime();

  /* Vadesi gelmiş dozlar: planlanan zaman [şimdi−3 sa, şimdi+5 dk], işaretsiz. Gece yarısını geçen doz dünün günüyle döner. */
  function due(meds,log,now){
    const t=now.getTime(),today=M.key(now),out=[];
    for(const day of [M.addDay(today,-1),today])for(const {m,slot} of M.dosesOn(meds,day)){
      const at=atOf(day,slot);
      if(at<t-BEFORE||at>t+AHEAD||M.statusOf(log,m.id,day,slot))continue;
      out.push({m:m.id,n:m.n,d:m.d||"",day,slot,at});
    }
    return out.sort((a,b)=>a.at-b.at||a.m-b.m);
  }
  /* Ekran metni: ad gizliyse (medShowName false) ad ve doz yok, yalnız sayı. */
  function view(items,showName){
    const n=items.length;
    return {
      lead:!n?"Tüm dozlar alındı.":showName?(n===1?items[0].n+(items[0].d?" · "+items[0].d:""):"Zamanı gelen dozlar:"):"İlaç saatin geldi.",
      count:n>1||!showName?`${n} doz`:"",
      rows:items.map(i=>({name:showName?i.n:"İlaç",dose:showName?i.d:"",slot:i.slot}))
    };
  }
  const snoozeAt=now=>now+SNOOZE_MIN*60000;
  /* Erteleme bildirimi: ilaç kanalında tek seferlik, düğmesiz; dokununca ilaç ekranı ve alarm ekranı açılır. */
  function snoozeNote(items,showName,at){
    const body=showName&&items.length?items.map(i=>i.n).join(", "):"İlaç saatin geldi.";
    return {id:SNOOZE_NID,title:"💊 İlaç zamanı",body,schedule:{at:new Date(at),allowWhileIdle:true},channelId:"nw_med",extra:{act:"med"},autoCancel:true};
  }
  const allDone=items=>items.every(i=>i.st);
  return {due,view,snoozeAt,snoozeNote,allDone,hm,BEFORE,AHEAD,SNOOZE_MIN,SNOOZE_NID};
})();
if(typeof module!=="undefined")module.exports=AlarmLib;
