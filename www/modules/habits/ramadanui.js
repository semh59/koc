"use strict";
/* Ramadan mode: the Today card (countdown to iftar or sahur), the Settings row, the place (GPS or a province list) and the comparison with the Diyanet table. The clock logic is in ramadanlib.js.
   The times are calculated on the phone from the place; the place stays on the phone. "Doğrula" (user tap only) downloads the table of the nearest provincial centre
   (ezanvakti.emushaf.net, only that district number is sent) and the card says whether the calculation agreed with it. The mode never touches medication times and is closed by the same risk brake as fasting. */
const RAM_LS="nw_ram",RAM_API="https://ezanvakti.emushaf.net/";
let ramCache,ramBusy=false;
const ramGet=()=>{
  if(ramCache===undefined){try{ramCache=RamadanLib.clean(JSON.parse(lsGet(RAM_LS)))}catch{ramCache=null}}
  return ramCache;
};
const ramSrc=()=>S.settings.ramLat?RamadanLib.source({lat:S.settings.ramLat,lon:S.settings.ramLon},ramGet(),Date.now()):null;
const ramPlace=(lat,lon)=>{
  const st=S.settings,i=RamadanLib.nearest(lat,lon).i;
  st.ramLat=Math.round(lat*100)/100;st.ramLon=Math.round(lon*100)/100;st.ramName=RamadanLib.CITIES[i][0];
  save();render();scheduleReminders().then(setNotif);
};
/* Compares the calculation with the table of the nearest provincial centre. Only on the user's own tap: the app sends nothing by itself. */
async function ramVerify(){
  const st=S.settings;
  if(!st.ramOn||!st.ramLat||ramBusy||risk().block)return;
  ramBusy=true;render();
  try{
    const i=RamadanLib.nearest(st.ramLat,st.ramLon).i,r=await NetLog.fetch("ram",RAM_API+"vakitler/"+RamadanLib.CITIES[i][3]);
    if(!r.ok)throw new Error("http");
    const v=RamadanLib.verify(i,RamadanLib.parse(await r.json()),Date.now());
    if(!v)throw new Error("empty");
    ramCache=v;lsSet(RAM_LS,JSON.stringify(v));
    scheduleReminders().then(setNotif);
  }catch{toast("Doğrulanamadı, internete bağlanınca tekrar dene")}
  finally{ramBusy=false;render()}
}
function ramLocate(){
  if(!navigator.geolocation)return toast("Konum bu cihazda alınamıyor; listeden il seç");
  toast("Konum alınıyor…");
  navigator.geolocation.getCurrentPosition(
    p=>{
      const {latitude:la,longitude:lo}=p.coords;
      if(!RamadanLib.inTurkey(la,lo))return toast("Konumun Türkiye dışında görünüyor; listeden il seç");
      ramPlace(la,lo);ramVerify();
    },
    ()=>toast("Konum alınamadı; izin ver ya da listeden il seç"),
    {enableHighAccuracy:false,timeout:20000,maximumAge:36e5});
}
/* Reminder list for scheduleReminders: [] unless the mode and the matching switches are on and the brake is open. */
function ramReminders(now,lead,days){
  const st=S.settings,src=ramSrc();
  if(!st.ramOn||!src||risk().block||!(st.ramSahur||st.ramIftar))return [];
  return RamadanLib.reminders(src.get,{sahur:st.ramSahur,iftar:st.ramIftar},now,lead,days);
}
const ramBtn=(a,t)=>`<button class="chip" data-ram="${a}">${t}</button>`;
function ramadanTodo(){
  const st=S.settings;if(!st.ramOn)return [];
  const r=risk(),hard=r.hard.length,ic=Icons.svg("fast");
  if(r.block)return [`<div class="row"><span>${ic} Ramazan modu<small class="mut sm">${esc((hard?r.hard:r.soft).join(". "))}. ${hard?"Oruç önerilmez, hekimine danış; saatler gösterilmiyor.":"Oruç öncesi hekimine danış."}</small></span>${hard?"":`<button class="chip" data-act="riskok">Hekimime danıştım</button>`}</div>`];
  const rows=[],src=ramSrc(),n=src&&RamadanLib.now(src.get,Date.now());
  if(!src)rows.push(`<div class="row"><span>${ic} Ramazan modu<small class="mut sm">Önce yerini belirle</small></span>${ramBtn("gps","Konumumu kullan")}</div>`);
  else if(!n)rows.push(`<div class="row"><span>${ic} Ramazan modu<small class="mut sm">Bu yer için saat hesaplanamadı</small></span>${ramBtn("place","İl seç")}</div>`);
  else{
    const note={verified:`Diyanet tablosuyla doğrulandı (fark en çok ${src.max} dk)`,table:"Hesap tablodan saptı; il merkezinin Diyanet tablosu gösteriliyor",calc:"Hesaplandı, internetle doğrulanmadı"}[src.mode];
    rows.push(`<div class="row"><span>${ic} <b class="num">${n.text}</b><small class="mut sm num">${n.kind==="night"?"":`İmsak ${n.imsak} · İftar ${n.iftar} · `}${esc(st.ramName)} civarı · ${note}, yaklaşık</small>${n.long?`<small class="mut sm">Gündüz bu yıl uzun; hekimine danış.</small>`:""}</span>${src.mode==="verified"?"":ramBtn("verify",ramBusy?"…":"Doğrula")}</div>`);
  }
  if(st.ramFrom&&Algo.dayNum(dayKey())-Algo.dayNum(st.ramFrom)>=31)rows.push(`<div class="row"><span>Ramazan bitti mi?<small class="mut sm">Modu kapatabilirsin.</small></span><button class="chip" data-ram="off">Modu kapat</button></div>`);
  return rows;
}
function ramadanSettingsHtml(){
  const st=S.settings,hard=risk().hard.length;
  const extra=`<button class="btn ghost" data-ram="gps">Konumumu kullan</button><button class="btn ghost" data-ram="place">${st.ramName?esc(st.ramName)+" civarı · il seç":"İl seç"}</button>
    ${st.ramLat?'<button class="btn ghost" data-ram="forget">Konumu sil</button>':""}
    ${swRow('data-ram="sahur"',st.ramSahur,"Sahur hatırlat (imsaktan 45 dk önce)")}${swRow('data-ram="iftar"',st.ramIftar,"İftar hatırlat (5 dk önce)")}
    <p class="hint">İlaç saatlerini hekimine sormadan değiştirme. NeoWell oruç tutmayı önermez; tutan kişi için saat bilgisi verir.</p>`;
  return modRow('data-ram="toggle"',st.ramOn,"Ramazan modu",hard?"Sana uygun olmayabilir; kapalı.":"İmsak ve iftar saatlerini gösterir.","hlpram",
    "Saatleri telefonda, bulunduğun yerden hesaplar; konumun telefonda kalır ve yalnız sen dokununca alınır (yaklaşık 1 km'ye yuvarlanır). Doğrula'ya dokunursan en yakın il merkezinin Diyanet tablosu internetten alınır ve hesapla karşılaştırılır; yalnız o ilçenin numarası gider. Yaklaşık bilgidir, resmî takvimle karşılaştır. Ramazan'ın başlangıcını ve bitişini sen açıp kapatırsın.",extra);
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
  if(!st.ramLat)ramLocate();
}
function ramPickIl(){
  openSheet(`<h3>Hangi ildesin?</h3><input class="in" id="ramq" type="search" aria-label="İl ara" placeholder="İl ara" autocomplete="off" autofocus>
  <div id="ramlist" class="plist">${RamadanLib.CITIES.map((c,i)=>`<button class="prow" data-ram="il:${i}"><span class="grow"><b>${esc(c[0])}</b></span></button>`).join("")}</div>
  <button class="mt-2 btn ghost" data-ram="close">Vazgeç</button>`);
}
document.addEventListener("input",ev=>{
  if(ev.target.id!=="ramq")return;
  const q=ev.target.value.toLocaleLowerCase("tr");
  document.querySelectorAll("#ramlist .prow").forEach(b=>{b.hidden=!b.textContent.toLocaleLowerCase("tr").includes(q)});
});
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-ram]");if(!el)return;
  const [a,arg]=el.dataset.ram.split(":"),st=S.settings;
  if(a==="toggle")ramToggle();
  else if(a==="infook"){if(!$("#ric").checked)return toast("Önce kutuyu işaretle");st.fastInfoOk=true;closeSheet();ramOpen()}
  else if(a==="gps")ramLocate();
  else if(a==="place")ramPickIl();
  else if(a==="il"){const c=RamadanLib.CITIES[+arg];if(c){closeSheet();ramPlace(c[1],c[2])}}
  else if(a==="verify")ramVerify();
  else if(a==="forget"){st.ramLat=0;st.ramLon=0;st.ramName="";lsDel(RAM_LS);ramCache=null;save();render();scheduleReminders().then(setNotif)}
  else if(a==="off")ramToggle();
  else if(a==="sahur"||a==="iftar"){st[a==="sahur"?"ramSahur":"ramIftar"]=!st[a==="sahur"?"ramSahur":"ramIftar"];save();render();scheduleReminders().then(setNotif)}
  else if(a==="close")closeSheet();
});
