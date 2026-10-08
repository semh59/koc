"use strict";
/* Trend ekranında haftalık kalori hedefi önerisi: otomatik uygulanmaz; "Şimdi değil" 7 gün susturur (goalSugAt). */
function goalSug(){
  const st=S.settings,w=weights();
  if(!(st.kcal>0)||!Object.keys(w).length)return null;
  const c=cCalc(),intake={};
  for(const e of S.entries)if(e.type==="yemek"&&e.v)intake[e.day]=(intake[e.day]||0)+e.v;
  return GoalLib.suggest({w,kcal:st.kcal,tdee:c.tdee,bmr:c.bmr,ri:riskInput(c.trendKg),intake,today:dayKey(),at:st.goalSugAt});
}
function goalCard(){
  const g=goalSug();if(!g)return "";
  return `<div class="card gsug"><h3 class="m0">Kalori hedefini ayarlayalım mı?</h3><p class="hint">Kilon haftada ${fmtS(g.slope,2)} kg değişiyor, hedef hızın ${fmtS(g.rate,2)} kg. Günlük hedefi ${S.settings.kcal} kcal yerine ${g.kcal} kcal (${g.delta>0?"+":"−"}${Math.abs(g.delta)}) yapmayı öneriyorum. Sen onaylamadan değişmez.</p>
  <div class="two"><button class="btn" data-gs="ok">Uygula</button><button class="btn ghost" data-gs="no">Şimdi değil</button></div></div>`;
}
document.addEventListener("click",ev=>{
  const b=ev.target.closest("[data-gs]");if(!b)return;
  const g=goalSug();if(!g)return render();
  if(b.dataset.gs==="ok"){const why=kcalWhy(g.kcal);if(why)return toast(why);S.settings.kcal=g.kcal}
  S.settings.goalSugAt=dayKey();save();render();
  toast(b.dataset.gs==="ok"?`Kalori hedefi ${g.kcal} kcal oldu`:"Bir hafta sonra tekrar bakarım");
});
