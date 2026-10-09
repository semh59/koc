"use strict";
/* Trend > Bağlantılar kartı. Veri yalnız bu cihazda hesaplanır; Koç bağlamına girmez. index.html'deki S, weights, dayKey ve esc ile çalışır. */
function baglantiCard(){
  const by=Kayit.byDay;
  const items=BaglantiLib.analyze({today:dayKey(),sleep:Aliskanlik.sleep(),mood:Aliskanlik.mood(),steps:by("adim"),kcal:by("yemek"),weights:weights()});
  return items.length?`<h2>Bağlantılar</h2><div class="card"><ul class="bgl">${items.map(i=>`<li class="row">${esc(i.text)}</li>`).join("")}</ul><p class="pt-2 hint">Son 60 günde bir arada görülen örüntüler; neden-sonuç değildir ve tıbbi bir değerlendirme sayılmaz. Hesap yalnız bu telefonda yapılır, Koç'a gönderilmez.</p></div>`:"";
}
