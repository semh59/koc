"use strict";
/* Trend > Bağlantılar card. Computed only on this device; never part of the Coach context. */
function linksCard(){
  const by=Log.byDay;
  const items=LinksLib.analyze({today:dayKey(),sleep:Habits.sleep(),mood:Habits.mood(),steps:by("steps"),kcal:by("food"),weights:weights()});
  return items.length?`<h2>Bağlantılar</h2><div class="card"><ul class="bgl">${items.map(i=>`<li class="row">${esc(i.text)}</li>`).join("")}</ul><p class="pt-2 hint">Son 60 günde bir arada görülen örüntüler; neden-sonuç değildir ve tıbbi bir değerlendirme sayılmaz. Hesap yalnız bu telefonda yapılır, Koç'a gönderilmez.</p></div>`:"";
}
