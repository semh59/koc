"use strict";
/* Trend > Bağlantılar card. Computed only on this device; never part of the Coach context. */
function linksCard(){
  const by=Log.byDay;
  const items=LinksLib.analyze({today:dayKey(),sleep:Habits.sleep(),mood:Habits.mood(),steps:by("steps"),kcal:by("food"),weights:weights()});
  return items.length||items.quiet?`<h2>Bağlantılar</h2><div class="card"><ul class="bgl">${items.length?items.map(i=>`<li class="row">${esc(i.text)}</li>`).join(""):'<li class="row">Henüz belirgin bir bağ görünmüyor.</li>'}</ul><p class="pt-2 hint">Son 60 günde bir arada görülen örüntüler; neden-sonuç göstermez, tesadüf de olabilir; tıbbi bir değerlendirme sayılmaz. Hesap yalnız bu telefonda yapılır, Rehber'e gönderilmez.</p></div>`:"";
}
