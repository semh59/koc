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
/* The stored-unit value of a field: the exact one from before a unit flip while the shown text is untouched, so a flip does not drift (126 mg/dL -> 7,0 mmol/L -> 126). */
const unitVal=(f,conv)=>f.dataset.base&&f.value===f.dataset.shown?+f.dataset.base:conv(num(f.value));
/* A tap on the unit label of an entry sheet converts the typed number and flips the unit for this entry only; the setting stays. */
document.addEventListener("click",ev=>{
  const b=ev.target.closest("[data-tu]");if(!b)return;
  const w=b.dataset.tu==="w",f=document.getElementById(b.dataset.for),raw=num(f.value),base=w?Units.wIn(raw):Units.gIn(raw);
  Units.flip(b.dataset.tu);
  f.dataset.base=Number.isFinite(base)?base:"";
  const l=document.getElementById(b.dataset.lbl);l.textContent=l.textContent.replace(/\(.*\)/,`(${w?Units.wu():Units.gl()})`);
  if(Number.isFinite(base)){f.value=w?fmt(Units.w(base)):Units.fg(base);f.dataset.shown=f.value}
  f.placeholder=w?(Units.wu()==="lb"?"185,4":"84,3"):(Units.gu()==="mmol"?"5,3":"95");
  f.inputMode=w||Units.gu()==="mmol"?"decimal":"numeric";
});
