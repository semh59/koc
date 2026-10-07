"use strict";
/* Ayarlar > Profil: kilo (kg/lb) ve kan şekeri (mg/dL / mmol/L) birimi. Yalnız giriş ve gösterim dönüşür; kayıt, hesap ve Koç kg ile mg/dL'de kalır.
   index.html'deki S, save, render, segb ve Units ile çalışır. */
const unitsHtml=()=>`<div class="lbl" style="margin-top:10px">Kilo birimi</div>${segb("wun",[["kg","kg"],["lb","lb"]],Units.wu())}
  <div class="lbl" style="margin-top:10px">Kan şekeri birimi</div>${segb("gun",[["mgdl","mg/dL"],["mmol","mmol/L"]],Units.gu())}
  <p class="hint">Yalnız girişi ve gösterimi değiştirir. Kayıtlar kg ve mg/dL olarak saklanır, Koç'a da öyle gider; birimi değiştirmek hiçbir kaydı bozmaz.</p>`;
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-wun],[data-gun]");if(!el)return;
  const st=S.settings,d=el.dataset;
  if(d.wun)d.wun==="lb"?st.wUnit="lb":delete st.wUnit;
  else d.gun==="mmol"?st.gUnit="mmol":delete st.gUnit;
  save();render();
});
