"use strict";
/* İçecek türü: kayıt type "su" + etiket (dr). Su hedefine yalnız su ve sade maden suyu sayılır (WeeklyLib.isWater); diğerleri ayrı "Diğer içecekler" satırında görünür, uyarı ya da skor üretmez.
   Bildirim ve widget'taki hızlı +su türsüz kayıttır (su). index.html'deki S, add, save, num, ferr, fday, dayOptions, openSheet, closeSheet, render, toast ile çalışır. */
const DRINKS=[["water","Su"],["mineral","Maden suyu (sade)"],["tea","Çay"],["coffee","Kahve"],["soda","Gazlı içecek"],["milk","Süt"],["other","Diğer"]];
const drinkName=c=>(DRINKS.find(d=>d[0]===c)||DRINKS[0])[1];
const drinkOk=c=>c!=="water"&&DRINKS.some(d=>d[0]===c);
function sheetDrink(){
  openSheet(`<h3>İçecek ekle</h3><div class="lbl" id="drl">İçecek</div><div class="chips" id="dr" role="group" aria-labelledby="drl">${DRINKS.map(([c,n],i)=>`<button class="chip" data-dr="${c}" aria-pressed="${i===0}">${n}</button>`).join("")}</div>
  <label class="lbl" for="fv">Miktar (ml)</label><div class="chips" role="group" aria-label="Hazır miktar">${[150,200,250,330,500].map(v=>`<button class="chip num" data-dq="${v}">${v}</button>`).join("")}</div><input class="in num" id="fv" inputmode="numeric" value="${S.settings.glass}" autocomplete="off" onfocus="this.select()"><div class="ferr" id="derr" role="alert"></div>${dayOptions()}
  <p class="hint">Su hedefine yalnız su ve sade maden suyu sayılır.</p><button class="btn" data-dk="go">Kaydet</button>`);
}
function goDrink(){
  const ml=num($("#fv").value,true);
  if(!(ml>0&&ml<=3000))return ferr("derr","Miktarı ml olarak yaz (en çok 3000), örneğin 200");
  const c=$("#dr [aria-pressed=true]").dataset.dr,e=add("water",ml,"",fday());
  if(drinkOk(c))e.dr=c;
  save();closeSheet();render();
  const t=dayKey(),top=sum("water",t,t),goal=S.settings.waterMl;
  if(WeeklyLib.isWater(e)&&top>=goal&&top-ml<goal)scheduleReminders().then(setNotif);
  toast(WeeklyLib.isWater(e)?`${drinkName(c)} ${ml} ml eklendi, bugün ${Math.round(top)} / ${goal} ml`:`${drinkName(c)} ${ml} ml kaydedildi, su hedefine sayılmaz`,e.id);
}
document.addEventListener("click",ev=>{
  const q=ev.target.closest("[data-dq]");if(q){$("#fv").value=q.dataset.dq;return}
  const el=ev.target.closest("[data-dr],[data-dk]");if(!el)return;
  if(el.dataset.dk==="open")sheetDrink();
  else if(el.dataset.dk==="go")goDrink();
  else document.querySelectorAll("#dr .chip").forEach(c=>c.setAttribute("aria-pressed",c===el));
});
