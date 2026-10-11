"use strict";
/* Trend > Hareket: this week's sport minutes against your own goal and strength days against the general guideline. Shows numbers only; no verdict. */
function activityCard(){
  const t=dayKey(),from=keyOff(-6),st=S.settings,min=Math.round(sum("exercise",from,t)),goal=st.sportWeek;
  const sd=ActivityLib.strengthDays(Gym.workouts(),Gym.isStrength,from,t);
  const bar=(v,g)=>`<div class="bar" aria-hidden="true"><i style="width:${Math.min(100,g>0?v/g*100:0).toFixed(0)}%"></i></div>`;
  if(!min&&!sd)return `<h2>Haftalık hareket</h2><div class="card"><p class="flush hint">Bu hafta henüz spor kaydı yok.</p></div>`;
  return `<h2>Haftalık hareket</h2><div class="card">
  <div class="row"><span>Bu hafta spor (yaklaşık)</span><b class="num">${min} / ${goal} dk</b></div>${bar(min,goal)}
  <div class="row"><span>Kuvvet çalışması</span><b class="num">${sd} / 2 gün</b></div>${bar(sd,2)}
  <p class="hint">Telefonun algıladığı yürüyüşler bu süreye eklenmez; salon süresi dinlenmeyi de içerir. Genel kılavuz (WHO): haftada 150-300 dk orta tempolu hareket ve 2 gün kuvvet çalışması.${st.age>=65?" 65 yaş üstü için kılavuz, haftada 3 gün denge ve kuvvet çalışmasını da önerir.":""} Kişisel tavsiye değildir; bir rahatsızlığın varsa hekimine danış.</p></div>`;
}
