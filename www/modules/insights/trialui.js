"use strict";
/* Trend > Bağlantılar > "Kendi deneyin" card and the Today question. Computed on this device only; never part of the Coach context. */
const TR_NOTE="Bu iki hafta için, kesin bir sonuç değil.";
const trPlanTx=p=>p==="B"?"Bu gece saat 22:00'den sonra ekranı kapat.":"Bu gece her zamanki gibi geç.";
function trialTodo(){
  const t=S.settings.trial;if(!t)return [];
  const s=TrialLib.status(t,dayKey()),out=[];
  if(s.ask)out.push(`<div class="row"><span>Dün geceki plana uydun mu?<small class="mut sm">${esc(trPlanTx(t.plan[Algo.dayNum(s.ask)-Algo.dayNum(t.start)]).replace("Bu gece","Dün gece"))}</small></span><div class="acts"><button class="chip" data-tr="ans:y">Evet</button><button class="chip" data-tr="ans:n">Hayır</button></div></div>`);
  return out;
}
function trialCard(){
  const t=S.settings.trial,f1=x=>(x/60).toFixed(1).replace(".",",");
  if(!t&&Habits.sleep().length<5)return ""; // the offer needs a few sleep records already; without them it would only add an empty tab
  if(!t)return `<h2>Kendi deneyin</h2><div class="card"><p class="m0">Saat 22:00'den sonra ekranı kapatmak uykunla birlikte mi gidiyor? 14 gece boyunca sana her gece "22:00'den sonra ekranı kapat" ya da "her zamanki gibi" denir, rastgele sırayla. Sonunda iki ortalama yan yana gösterilir.</p><p class="hint">Kesin bir sonuç vermez, tıbbi bir değerlendirme sayılmaz. Uyku kaydını her sabah girmen gerekir.</p><button class="btn" data-tr="start">Deneyi başlat</button></div>`;
  const s=TrialLib.status(t,dayKey());
  if(!s.done)return `<h2>Kendi deneyin</h2><div class="card"><p class="m0 b7">${s.tonight?esc(trPlanTx(s.tonight)):"Son gecenin uyku kaydını gir; sonuç yarın görünür."}</p><p class="hint num">${Object.keys(t.ans).length} / ${TrialLib.NIGHTS} gece yanıtlandı. Her sabah uykunu kaydet ve dünkü soruyu yanıtla.</p><button class="btn ghost" data-tr="stop">Deneyi bırak</button></div>`;
  const r=TrialLib.summarize(t,Habits.sleep());
  return `<h2>Kendi deneyin</h2><div class="card"><p class="m0 num">${r?`Ekranı 22:00'den sonra kapattığın ${r.b.n} gecede ortalama uyku ${f1(r.b.avg)} sa; her zamanki gibi geç yattığın ${r.a.n} gecede ${f1(r.a.avg)} sa. ${TR_NOTE}`:"Sonuç yok: en az 10 gecenin hem yanıtı hem uyku kaydı olmalı, her grupta da en az 4 gece."}</p><button class="btn ghost" data-tr="stop">Kapat</button></div>`;
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-tr]");if(!el)return;
  const [a,arg]=el.dataset.tr.split(":"),st=S.settings;
  if(a==="start"){st.trial={start:dayKey(),plan:TrialLib.plan(Math.random),ans:{}};save();render();toast("Deney başladı")}
  else if(a==="ans"&&st.trial){const s=TrialLib.status(st.trial,dayKey());if(s.ask){st.trial.ans[s.ask]=arg;save();render()}}
  else if(a==="stop"){const old=st.trial;st.trial=null;save();render();toast("Deney kapatıldı",()=>{st.trial=old;save();render()})}
});
