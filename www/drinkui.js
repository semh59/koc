"use strict";
/* İçecek türü: su kaydına isteğe bağlı etiket (dr). Hepsi sıvı olarak su hedefine aynen sayılır; tür yalnız geçmişte görünür, kafein ya da başka hesap yapılmaz.
   Bildirim ve widget'taki hızlı +su türsüz kayıttır (su). index.html'deki S, add, save, num, ferr, fday, dayOptions, openSheet, closeSheet, render, toast ile çalışır. */
const DRINKS=[["su","Su"],["cay","Çay"],["kahve","Kahve"],["gazli","Gazlı içecek"],["sut","Süt"],["diger","Diğer"]];
const drinkName=c=>(DRINKS.find(d=>d[0]===c)||DRINKS[0])[1];
const drinkOk=c=>c!=="su"&&DRINKS.some(d=>d[0]===c);
function sheetIcecek(){
  openSheet(`<h3>İçecek ekle</h3><div class="chips" id="dr" role="group" aria-label="İçecek türü">${DRINKS.map(([c,n],i)=>`<button class="chip" data-dr="${c}" aria-pressed="${i===0}">${n}</button>`).join("")}</div>
  <input class="in num" id="fv" inputmode="numeric" aria-label="Miktar (ml)" value="${S.settings.glass}" autocomplete="off" onfocus="this.select()"><div class="ferr" id="derr" role="alert"></div>${dayOptions()}
  <p class="hint">Hepsi sıvı olarak günlük su hedefine sayılır. Tür yalnız geçmişte görünür.</p><button class="btn" data-dk="go">Kaydet</button>`);
}
function goIcecek(){
  const ml=num($("#fv").value,true);
  if(!(ml>0&&ml<=3000))return ferr("derr","Miktarı ml olarak yaz (en çok 3000), örneğin 200");
  const c=$("#dr [aria-pressed=true]").dataset.dr,e=add("su",ml,"",fday());
  if(drinkOk(c))e.dr=c;
  save();closeSheet();render();
  const t=dayKey(),top=sum("su",t,t),goal=S.settings.waterMl;
  if(top>=goal&&top-ml<goal)scheduleReminders().then(setNotif);
  toast(`${drinkName(c)} ${ml} ml eklendi, bugün ${Math.round(top)} / ${goal} ml`,e.id);
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-dr],[data-dk]");if(!el)return;
  if(el.dataset.dk==="open")sheetIcecek();
  else if(el.dataset.dk==="go")goIcecek();
  else document.querySelectorAll("#dr .chip").forEach(c=>c.setAttribute("aria-pressed",c===el));
});
