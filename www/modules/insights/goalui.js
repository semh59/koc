"use strict";
/* Weekly calorie-target suggestion on the Trend screen: never applied automatically; "Şimdi değil" silences it for 7 days (goalSugAt). */
function goalCalc(){
  const st=S.settings,w=weights(),days=Object.keys(w).sort(),out={trendKg:null,tdee:null,bmr:null};
  if(!days.length)return out;
  out.trendKg=Algo.trend(w)[days[days.length-1]];
  if(st.heightCm>0&&st.age>0){
    const profile={kg:out.trendKg,cm:st.heightCm,age:st.age,sex:st.sex||"",act:st.act},intake={};
    for(const e of Log.all())if(e.type==="food"&&e.v)intake[e.day]=(intake[e.day]||0)+e.v;
    const r=Algo.adaptiveTdee({weights:w,intake,profile});out.tdee=r.tdee;out.bmr=Algo.bmrMifflin(profile);
  }
  return out;
}
function goalSug(){
  const st=S.settings,w=weights();
  if(!(st.kcal>0)||!Object.keys(w).length)return null;
  const c=goalCalc();
  return GoalLib.suggest({w,kcal:st.kcal,tdee:c.tdee,bmr:c.bmr,ri:riskInput(c.trendKg),intake:Log.byDay("food"),today:dayKey(),at:st.goalSugAt});
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
