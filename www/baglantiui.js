"use strict";
/* Trend > Bağlantılar kartı. Veri yalnız bu cihazda hesaplanır; Koç bağlamına girmez. index.html'deki S, weights, dayKey ve esc ile çalışır. */
function baglantiCard(){
  const by=(type)=>{const m={};for(const e of S.entries)if(e.type===type&&e.v)m[e.day]=(m[e.day]||0)+e.v;return m};
  const items=BaglantiLib.analyze({today:dayKey(),sleep:S.sleep,mood:S.mood,steps:by("adim"),kcal:by("yemek"),weights:weights()});
  return items.length?`<h2>Bağlantılar</h2><div class="card"><ul class="bgl">${items.map(i=>`<li>${esc(i.text)}</li>`).join("")}</ul><p class="hint" style="padding:8px 0 0">Son 60 günde bir arada görülen örüntüler; neden-sonuç değildir ve tıbbi bir değerlendirme sayılmaz. Hesap yalnız bu telefonda yapılır, Koç'a gönderilmez.</p></div>`:"";
}
