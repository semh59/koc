"use strict";
/* Ramadan mode: the Today card (countdown to iftar or sahur), the Settings row, the place picker and the table download. The clock logic is in ramadanlib.js.
   The times are the Diyanet table from an internet copy (ezanvakti.emushaf.net), cached on the phone; only the chosen district number is sent. The mode never touches medication times and is closed by the same risk brake as fasting. */
const RAM_LS="nw_ram",RAM_API="https://ezanvakti.emushaf.net/";
let ramCache,ramBusy=false,ramPlaces=null;
const ramGet=()=>{
  if(ramCache===undefined){try{ramCache=RamadanLib.clean(JSON.parse(lsGet(RAM_LS)))}catch{ramCache=null}}
  return ramCache&&ramCache.id===S.settings.ramId?ramCache:null;
};
async function ramFetch(path){
  const r=await NetLog.fetch("ram",RAM_API+path);
  if(!r.ok)throw new Error("http");
  const j=await r.json();if(!Array.isArray(j))throw new Error("format");
  return j;
}
/* Downloads the table of the chosen district (about 30 days) and merges it into the cache. Only on the user's own tap (choosing the district, "Yenile"): the app sends nothing by itself. */
async function ramRefresh(){
  const st=S.settings;
  if(!st.ramOn||!st.ramId||ramBusy||risk().block)return;
  ramBusy=true;
  try{
    const days=RamadanLib.parse(await ramFetch("vakitler/"+st.ramId));
    if(!Object.keys(days).length)throw new Error("empty");
    ramCache=RamadanLib.merge(ramGet(),st.ramId,days,Date.now());lsSet(RAM_LS,JSON.stringify(ramCache));
    render();scheduleReminders().then(setNotif);
  }catch{toast("Saatler alınamadı, internete bağlanınca Yenile'ye dokun")}
  finally{ramBusy=false}
}
/* Reminder list for scheduleReminders: [] unless the mode and the matching switches are on and the brake is open. */
function ramReminders(now,lead,days){
  const st=S.settings;
  if(!st.ramOn||risk().block||!(st.ramSahur||st.ramIftar))return [];
  return RamadanLib.reminders(ramGet(),{sahur:st.ramSahur,iftar:st.ramIftar},now,lead,days);
}
function ramadanTodo(){
  const st=S.settings;if(!st.ramOn)return [];
  const r=risk(),hard=r.hard.length,ic=Icons.svg("fast");
  if(r.block)return [`<div class="row"><span>${ic} Ramazan modu<small class="mut sm">${esc((hard?r.hard:r.soft).join(". "))}. ${hard?"Oruç önerilmez, hekimine danış; saatler gösterilmiyor.":"Oruç öncesi hekimine danış."}</small></span>${hard?"":`<button class="chip" data-act="riskok">Hekimime danıştım</button>`}</div>`];
  const rows=[],n=RamadanLib.now(ramGet(),Date.now());
  if(!st.ramId)rows.push(`<div class="row"><span>${ic} Ramazan modu<small class="mut sm">Önce ilçeni seç</small></span><button class="chip" data-ram="place">İlçe seç</button></div>`);
  else if(!n)rows.push(`<div class="row"><span>${ic} Ramazan modu<small class="mut sm">${ramBusy?"Saatler alınıyor…":"Saatler alınamadı; internete bağlanınca Yenile'ye dokun"}</small></span><button class="chip" data-ram="refresh">Yenile</button></div>`);
  else rows.push(`<div class="row"><span>${ic} <b class="num">${n.text}</b><small class="mut sm num">${n.kind==="night"?"":`İmsak ${n.imsak} · İftar ${n.iftar} · `}${esc(st.ramName)} · Diyanet tablosu, yaklaşık</small>${n.long?`<small class="mut sm">Gündüz bu yıl uzun; hekimine danış.</small>`:""}</span></div>`);
  const left=RamadanLib.ahead(ramGet(),Date.now());
  if(st.ramId&&n&&left<5)rows.push(`<div class="row"><span>Saat tablosu ${left} gün için var<small class="mut sm">Yenilemek için internet gerekir.</small></span><button class="chip" data-ram="refresh">Yenile</button></div>`);
  if(st.ramFrom&&Algo.dayNum(dayKey())-Algo.dayNum(st.ramFrom)>=31)rows.push(`<div class="row"><span>Ramazan bitti mi?<small class="mut sm">Modu kapatabilirsin.</small></span><button class="chip" data-ram="off">Modu kapat</button></div>`);
  return rows;
}
function ramadanSettingsHtml(){
  const st=S.settings,hard=risk().hard.length;
  const extra=`<button class="btn ghost" data-ram="place">${st.ramName?esc(st.ramName)+" · değiştir":"İlçe seç"}</button>
    ${swRow('data-ram="sahur"',st.ramSahur,"Sahur hatırlat (imsaktan 45 dk önce)")}${swRow('data-ram="iftar"',st.ramIftar,"İftar hatırlat (5 dk önce)")}
    <p class="hint">İlaç saatlerini hekimine sormadan değiştirme. NeoWell oruç tutmayı önermez; tutan kişi için saat bilgisi verir.</p>`;
  return modRow('data-ram="toggle"',st.ramOn,"Ramazan modu",hard?"Sana uygun olmayabilir; kapalı.":"İmsak ve iftar saatlerini gösterir.","hlpram",
    "İlçenin imsak ve iftar saatlerini Diyanet tablosundan internetten alır ve telefonda saklar; yalnız ilçe numaran gider. Yaklaşık bilgidir, resmî takvimle karşılaştır. Ramazan'ın başlangıcını ve bitişini sen açıp kapatırsın.",extra);
}
function ramInfo(){
  openSheet(`<h3>Ramazan modu</h3><div class="banner"><b>Oruç herkes için uygun değildir.</b><p>Hamilelik, emzirme, diyabet, ilaç kullanımı, yeme düzeni sorunu ya da düşük kilo varsa önce hekimine danış. Baş dönmesi, halsizlik ya da çarpıntı olursa orucu bırak ve hekimine danış. İlaç saatlerini hekimine sormadan değiştirme.</p></div>
  <p class="hint">NeoWell oruç tutmayı önermez; tutan kişi için saat bilgisi verir. ${MED_NOTE}</p>${swRow('id="ric"',false,"Okudum; bu durumlar bende yok ya da hekimime danıştım")}<button class="btn" data-ram="infook">Ramazan modunu aç</button>`);
}
function ramToggle(){
  const st=S.settings;
  if(st.ramOn){st.ramOn=false;st.ramFrom="";save();render();scheduleReminders().then(setNotif);return}
  if(risk().hard.length)return toast("Bu mod senin için kapalı; oruç önerilmez, hekimine danış");
  if(!st.fastInfoOk)return ramInfo();
  ramOpen();
}
function ramOpen(){
  const st=S.settings;st.ramOn=true;st.ramFrom=dayKey();save();render();
  if(!st.ramId)ramPickIl();else ramRefresh();
}
const ramTitle=s=>s.toLocaleLowerCase("tr").replace(/(^|[\s/-])(\p{L})/gu,(_,a,b)=>a+b.toLocaleUpperCase("tr"));
async function ramPickIl(){
  try{ramPlaces=ramPlaces||await ramFetch("sehirler/2")}catch{return toast("İl listesi alınamadı, internete bağlanınca tekrar dene")}
  openSheet(`<h3>Hangi ildesin?</h3><input class="in" id="ramq" type="search" aria-label="İl ara" placeholder="İl ara" autocomplete="off" autofocus>
  <div id="ramlist" class="plist">${ramPlaces.map(x=>`<button class="prow" data-ram="il:${esc(x.SehirID)}:${esc(ramTitle(x.SehirAdi))}"><span class="grow"><b>${esc(ramTitle(x.SehirAdi))}</b></span></button>`).join("")}</div>
  <button class="mt-2 btn ghost" data-ram="close">Vazgeç</button>`);
}
async function ramPickIlce(id,il){
  let list;try{list=await ramFetch("ilceler/"+id)}catch{return toast("İlçe listesi alınamadı, internete bağlanınca tekrar dene")}
  openSheet(`<h3>${esc(il)}: hangi ilçe?</h3><div class="plist">${list.map(x=>`<button class="prow" data-ram="pl:${esc(x.IlceID)}:${esc(ramTitle(il)+" / "+ramTitle(x.IlceAdi))}"><span class="grow"><b>${esc(ramTitle(x.IlceAdi))}</b></span></button>`).join("")}</div>
  <button class="mt-2 btn ghost" data-ram="close">Vazgeç</button>`);
}
document.addEventListener("input",ev=>{
  if(ev.target.id!=="ramq")return;
  const q=ev.target.value.toLocaleLowerCase("tr");
  document.querySelectorAll("#ramlist .prow").forEach(b=>{b.hidden=!b.textContent.toLocaleLowerCase("tr").includes(q)});
});
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-ram]");if(!el)return;
  const [a,arg,...rest]=el.dataset.ram.split(":"),st=S.settings;
  if(a==="toggle")ramToggle();
  else if(a==="infook"){if(!$("#ric").checked)return toast("Önce kutuyu işaretle");st.fastInfoOk=true;closeSheet();ramOpen()}
  else if(a==="place")ramPickIl();
  else if(a==="il")ramPickIlce(arg,rest.join(":"));
  else if(a==="pl"){st.ramId=+arg;st.ramName=rest.join(":").slice(0,40);save();closeSheet();render();ramRefresh()}
  else if(a==="refresh")ramRefresh();
  else if(a==="off")ramToggle();
  else if(a==="sahur"||a==="iftar"){st[a==="sahur"?"ramSahur":"ramIftar"]=!st[a==="sahur"?"ramSahur":"ramIftar"];save();render();scheduleReminders().then(setNotif)}
  else if(a==="close")closeSheet();
});
