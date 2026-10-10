"use strict";
/* Settings > Profile: weight (kg/lb) and blood glucose (mg/dL / mmol/L) units. Only input and display convert; storage, calculations and the Coach stay in kg and mg/dL.
   Works with S, save, render, segb and Units from the main script. */
const unitsHtml=()=>`<div class="mt-3 lbl">Kilo birimi</div>${segb("wun",[["kg","kg"],["lb","lb"]],Units.wu())}
  <div class="mt-3 lbl">Kan şekeri birimi</div>${segb("gun",[["mgdl","mg/dL"],["mmol","mmol/L"]],Units.gu())}
  <p class="hint">Yalnız girişi ve gösterimi değiştirir. Kayıtlar kg ve mg/dL olarak saklanır, Rehber'e da öyle gider; birimi değiştirmek hiçbir kaydı bozmaz.</p>`;
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-wun],[data-gun]");if(!el)return;
  const st=S.settings,d=el.dataset;
  if(d.wun)d.wun==="lb"?st.wUnit="lb":delete st.wUnit;
  else d.gun==="mmol"?st.gUnit="mmol":delete st.gUnit;
  save();render();
});
