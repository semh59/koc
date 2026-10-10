/* ---------- sheets and dialogs ---------- */
/* While a top layer (sheet or guide) is open the background is inert: Tab, touch and the screen reader do not reach behind it. */
const topLayer=()=>$("#alarm")&&!$("#alarm").hidden?$("#alarm"):!$("#cfm").hidden?$("#cfm"):$("#sheet").classList.contains("on")?$("#sheet"):$("#guide").hidden?null:$("#guide");
function trap(){const o=topLayer();for(const e of document.body.children)if(e.tagName!=="SCRIPT")e.inert=!!o&&e!==o&&!e.matches("#scrim,#toast")}
/* sheetEnd: called when a sheet that waits for a choice closes or is replaced by another sheet (a Coach preview then counts as Cancel). */
let sheetFrom=null,sheetEnd=null;
const sheetDone=ok=>{const e=sheetEnd;sheetEnd=null;if(e)e(ok)};
function openSheet(html){
  sheetDone(false);$("#toast").classList.remove("on");const s=$("#sheet");
  if(!s.classList.contains("on"))sheetFrom=document.activeElement;
  s.innerHTML=`<div class="grab"></div><button class="shx" data-shx aria-label="Pencereyi kapat">${Icons.svg("x")}</button>${html}`;
  const h=s.querySelector("h3");
  if(h){h.id="sht";h.tabIndex=-1;s.setAttribute("aria-labelledby","sht")}else{s.removeAttribute("aria-labelledby");s.setAttribute("aria-label","Pencere")}
  s.classList.add("on");$("#scrim").classList.add("on");trap();
  const f=s.querySelector("[autofocus]");if(f)setTimeout(()=>{const a=document.activeElement;if(f.isConnected&&!(a&&a!==f&&s.contains(a)&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)))f.focus()},220);else(h||s).focus({preventScroll:true});
}
function closeSheet(){
  plStop();sheetDone(false);const s=$("#sheet"),was=s.classList.contains("on"),f=sheetFrom;
  s.classList.remove("on");$("#scrim").classList.remove("on");sheetFrom=null;trap();
  if(was&&f&&f.isConnected)f.focus({preventScroll:true});
}
/* Confirmation dialog (instead of the browser's native one): Promise<boolean>, focus on Cancel, Escape and the back key cancel.
   In tests, window.__confirmAuto or a non-native window.confirm stub opens no dialog; the answer is given synchronously
   (the .then callback runs in the same step) and the stub receives the plain text. */
let cfmDone=null;
function confirmSheet({title,body="",ok="Tamam",no="İptal",danger=false}){
  const msg=body||title,c=window.confirm;
  const auto=window.__confirmAuto||(typeof c==="function"&&!/\[native code\]/.test(Function.prototype.toString.call(c))&&c);
  if(auto){const v=!!auto(msg);return {then:f=>Promise.resolve(f?f(v):v)}}
  if(cfmDone)cfmDone(false);
  const d=$("#cfm"),from=document.activeElement;
  $("#cfmt").textContent=title;$("#cfmb").textContent=body;$("#cfmb").hidden=!body;
  const y=d.querySelector('[data-cf="1"]'),n=d.querySelector('[data-cf="0"]');
  y.textContent=ok;y.className=danger?"btn danger":"btn";n.textContent=no;
  d.hidden=false;trap();n.focus();
  return new Promise(res=>{cfmDone=v=>{cfmDone=null;d.hidden=true;trap();if(from&&from.isConnected)from.focus({preventScroll:true});res(v)}});
}
function toast(msg,undo){
  /* While saving fails, a following message such as "+250 ml" must not cover the error. */
  if(saveFail&&!msg.includes("kaydedilemedi"))msg="Kaydedilemedi, depolama dolu. "+msg;
  $("#tmsg").textContent=msg;lastUndo=undo==null?null:undo;$("#tundo").hidden=lastUndo==null;
  $("#toast").classList.add("on");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("#toast").classList.remove("on"),undo!=null?6000:3800);
}
function dayOptions(inl){
  let o="";for(let i=0;i<7;i++){const d=addDays(-i);o+=`<option value="${dayKey(d)}">${i==0?"Bugün":i==1?"Dün":WEEKDAYS[d.getDay()]+" "+fd(dayKey(d))}</option>`}
  if(tab==="day"&&logOff>=7){const k=keyOff(-logOff);o=`<option value="${k}" selected>${fd(k)}</option>`+o} // adding to an older day from the Day screen
  const sel=`<label class="lbl" for="fday">Gün</label><select class="in" id="fday">${o}</select>`;
  return inl?`<div class="inl">${sel}</div>`:sel;
}
const fday=()=>($("#fday")||{}).value||dayKey();
/* The error stays right under the field, in place of what the toast would hide. */
const ferr=(id,msg)=>{$("#"+id).textContent=msg};
/* Day/month navigator: data-<attr>="1" back, "-1" forward; forward is disabled when there is none. */
const dayNav=(attr,label,last)=>`<div class="dnav"><button data-${attr}="1" aria-label="Önceki gün">${Icons.svg("back")}</button><h2 aria-live="polite">${label}</h2><button data-${attr}="-1" aria-label="Sonraki gün"${last?" disabled":""}>${Icons.svg("chev")}</button></div>`;
/* A collapsible section stays open across redraws: <details ${keepOpen(name)}>. toggle does not bubble, so it is listened for in the capture phase. */
const OPEN=new Set(),keepOpen=k=>`data-keep="${k}"${OPEN.has(k)?" open":""}`;
document.addEventListener("toggle",e=>{const k=e.target.dataset&&e.target.dataset.keep;if(k)e.target.open?OPEN.add(k):OPEN.delete(k)},true);
/* Empty state: icon, title, one sentence, at most one action. */
const emptyCard=(ic,title,text,btn="")=>`<div class="card empty">${Icons.svg(ic)}${title?`<b>${title}</b>`:""}<p class="mut sm">${text}</p>${btn}</div>`;

let weightOk=null;
function sheetWeight(){
  const m=weights(),ds=Object.keys(m).sort(),last=ds.length?dw(m[ds[ds.length-1]]):"";
  /* The last weigh-in comes prefilled; it is selected on focus and on the first tap so the typed number is not appended to the old one. */
  weightOk=null;openSheet(`<h3>Kilo ekle</h3><div class="kstep"><button class="chip" data-kd="-1" aria-label="0,1 ${wlab()} azalt">−0,1</button><input class="in num" id="fv" inputmode="decimal" placeholder="${wlab()==="lb"?"185,4":"84,3"}" value="${last}" autocomplete="off" autofocus onfocus="this.select()" onclick="if(!this.dataset.s){this.dataset.s=1;this.select()}"><button class="chip" data-kd="1" aria-label="0,1 ${wlab()} artır">+0,1</button></div><div class="ferr" id="kerr" role="alert"></div>${dayOptions()}<div id="kwarn" role="alert"></div><button class="btn" data-go="weight">Kaydet</button>`);
}
function weightStep(d){const f=$("#fv"),v=num(f.value),k=Units.wIn(v);if(k>=20&&k<=400)f.value=fmt(Math.round(v*10+d)/10)}
function goWeight(){
  const raw=$("#fv").value,v=Units.wIn(num(raw));
  /* If the selection is lost on the phone, "85" typed after "86,0" becomes 86.085; a scale gives at most 2 decimals. */
  if(!(v>=20&&v<=400)||/[.,]\d{3}/.test(raw))return ferr("kerr",`Kiloyu ${wlab()} olarak yaz, örneğin ${wlab()==="lb"?"185,4":"84,3"}`);
  const day=fday(),m=weights(),ds=Object.keys(m).filter(k=>k<day).sort(),prev=ds.length?m[ds[ds.length-1]]:null;
  const lb=prev==null&&wlab()==="kg"&&Algo.lbSuspect(v,S.settings.heightCm);
  if((lb||prev!=null&&Math.round(Math.abs(v-prev)*10)>=30)&&weightOk!==v){weightOk=v;$("#kerr").textContent="";$("#kwarn").innerHTML=`<div class="banner"><b>${lb?`${fmt(v)} kg çok yüksek görünüyor`:`${dwS(v-prev)} ${wlab()} fark var`}</b><p>${lb?`Libre (lb) yazmış olabilirsin: ${fmt(v)} lb ≈ ${fmt(v*0.45359237)} kg. Doğruysa devam et.`:`Son tartın ${dw(prev)} ${wlab()} idi. Yanlış yazmış olabilir misin?`}</p><button class="btn" data-go="weight">Yine de kaydet</button></div>`;return}
  const e=add("weight",v,"",day);closeSheet();render();
  let msg=`${dw(v)} ${wlab()} kaydedildi`;
  if(prev!=null)msg+=`, öncekine göre ${dwS(v-prev)} ${wlab()}`;
  toast(msg,e.id);
}
/* Yesterday's entry carries its own meal; favourites and templates have none, so the selected chip applies. */
function addFoods(items,day,msg,undo){
  const ids=items.map(s=>{const e=copyNutr(s,add("food",s.v,s.text,day));if(s.lo!=null){e.lo=s.lo;e.hi=s.hi}e.meal=LogLib.mealKey(s.meal)||(s.time?LogLib.mealOf(s):fmeal());return e.id});save();closeSheet();render();
  toast(msg,()=>{S.entries=S.entries.filter(e=>!ids.includes(e.id));if(undo)undo();save();render()});
}
function repeatYesterday(){
  const src=of("food",keyOff(-1));
  if(!src.length)return toast("Dün kayıtlı yemek yok");
  addFoods(src,dayKey(),`Dünkü ${src.length} yemek bugüne eklendi`);
}
function favHtml(){
  recList=LogLib.recents(S.entries,dayKey());
  const fk=new Set(S.favFoods.map(f=>LogLib.key(f.text)));
  const row=(x,i,a,b,star,lab)=>`<div class="prow"><button class="grow pbtn" data-${a}="${i}"><span class="grow"><b>${esc(x.text)}</b><span class="mut sm">${x.v!=null?Math.round(x.v)+" kcal":"kalori yok"}</span></span><span class="aic" aria-hidden="true">${Icons.svg("plus")}</span></button><button class="plus" data-${b}="${i}" aria-label="${lab}" title="${lab}"${star==="★"&&b==="fva"?" disabled":""}>${star}</button></div>`;
  const tp=S.mealTpl.length?`<div class="lbl">Şablonlar</div><div class="chips">${S.mealTpl.map((t,i)=>`<span class="chip tchip"><button data-tp="${i}">${esc(t.n)} · ${t.items.length}</button><button class="del" data-tpd="${i}" aria-label="Şablonu sil">✕</button></span>`).join("")}</div>`:"";
  return recipeListHtml()+tp+(S.favFoods.length?`<div class="lbl">Sık kullanılanlar</div>${S.favFoods.map((x,i)=>row(x,i,"fv","fvd","★","Sık kullanılanlardan çıkar")).join("")}`:"")+(recList.length?`<div class="lbl">Son yediklerin</div>${S.favFoods.length?"":`<div class="p0 hint">☆ ile sık kullanılanlara ekle, + ile bugüne ekle.</div>`}${recList.map((x,i)=>row(x,i,"rc","fva",fk.has(LogLib.key(x.text))?"★":"☆",fk.has(LogLib.key(x.text))?"Sık kullanılanlarda":"Sık kullanılanlara ekle")).join("")}`:"");
}
const mealChips=()=>{const d=LogLib.mealOf({time:`${pad(new Date().getHours())}:00`});return `<div class="lbl" id="fmll">Öğün</div><div class="chips" id="fml" role="group" aria-labelledby="fmll">${LogLib.MEALS.map(([k,n])=>`<button class="chip" data-ml="${k}" aria-pressed="${k===d}">${n}</button>`).join("")}</div>`};
const fmeal=()=>{const b=document.querySelector("#fml [aria-pressed=true]");return b?b.dataset.ml:undefined};
const ownOpen=()=>{$("#fown").hidden=false;const b=$('[data-act="own"]');if(b)b.remove()};
function sheetFood(){
  const dn=of("food",keyOff(-1)).length;
  openSheet(`<h3>Yemek ekle</h3><input class="in" id="fq" type="search" enterkeyhint="search" aria-label="Besin ara" placeholder="Besin ara: mercimek çorbası, simit…" autocomplete="off" autofocus><div id="flist" class="plist"></div>${mealChips()}${dayOptions(true)}<div class="qrow">${dn?`<button class="btn ghost" data-act="yesterday">↺ Dünkünü tekrarla (${dn})</button>`:""}<button class="btn ghost" data-act="own">Kendin yaz</button>${isNative()&&BS()?`<button class="btn ghost" data-act="barcode">${Icons.svg("camera")} Barkod okut</button>`:""}${ocrBtn("label",Icons.svg("tag")+" Etiket oku")}</div>
  <div id="fown" hidden><input class="in" id="ft" aria-label="Yemeğin adı" placeholder="Ne yedin?" autocomplete="off"><input class="in num" id="fv" aria-label="Kalori, isteğe bağlı" inputmode="numeric" placeholder="Kalori (isteğe bağlı)"><div class="ferr" id="yerr" role="alert"></div><button class="btn" data-go="food">Kaydet</button><button class="mt-2 btn ghost" data-rp="new">Tarif oluştur</button></div><div id="frl" class="plist">${favHtml()}</div>`);
}
function sheetWater(){
  const L=S.entries.filter(e=>e.type==="water"&&e.day===keyOff(-logOff));
  if(!L.length)return closeSheet();
  openSheet(`<h3>Su kayıtları</h3>${L.map(e=>`<div class="prow"><span><b class="num">${e.time}</b></span><span class="num">${e.v} ml${e.dr?` · ${drinkName(e.dr)}`:""}</span><button class="del" data-del="${e.id}" aria-label="Kaydı sil">✕</button></div>`).join("")}`);
}
function sheetMeal(id){
  const e=S.entries.find(x=>x.id===id);if(!e)return;
  openSheet(`<h3>Öğünü değiştir</h3><p class="mut sm">${esc(e.text||"Öğün")}</p><div class="chips">${LogLib.MEALS.map(([k,n])=>`<button class="chip" data-mset="${id}:${k}" aria-pressed="${k===LogLib.mealOf(e)}">${n}</button>`).join("")}</div>`);
}
let tplSrc=[];
function sheetTpl(){
  tplSrc=of("food",keyOff(-logOff));
  openSheet(`<h3>Öğün şablonu</h3><div class="lbl">Şablona girecek yemekler</div>${tplSrc.map((e,i)=>`<label class="prow"><span><b>${esc(e.text||"Öğün")}</b><span class="mut sm">${e.v?Math.round(e.v)+" kcal":""}</span></span><input type="checkbox" id="tc${i}" checked></label>`).join("")}<input class="in" id="tpn" placeholder="Şablon adı, örneğin Kahvaltım" maxlength="40" autocomplete="off" autofocus><button class="btn" data-go="tpl">Kaydet</button>`);
}
function goTpl(){
  const items=tplSrc.filter((_,i)=>$("#tc"+i).checked).map(e=>copyNutr(e,{text:e.text||"Öğün",v:e.v})),n=$("#tpn").value.trim();
  if(!items.length)return toast("En az bir yemek seç");
  if(!n)return toast("Şablona bir ad yaz");
  if(items.length>15)return toast("Bir şablonda en fazla 15 yemek olur");
  if(S.mealTpl.length>=20)return toast("En fazla 20 şablon");
  S.mealTpl=LogLib.cleanTpl([...S.mealTpl,{id:Math.max(0,...S.mealTpl.map(t=>t.id))+1,n,items}]);save();closeSheet();toast(`"${n}" şablonu kaydedildi`);
}
let curFood=null,curPor=0,foodAskQ="";
const allFoods=()=>S.myFoods.map(m=>Object.assign({n:m.n,k:m.k,u:m.u||[["1 porsiyon",100]],portion:m.portion===true,my:true,b:m.b,src:m.src},...NUTR.map(k=>({[k]:m[k]==null?null:m[k]})))).concat(S.recipes.map(LogLib.recipeFood),FOODS);
const foodListHtml=q=>{const L=allFoods(),ask=q.trim().length>=2?`<button class="prow" data-c="askfood"><span class="grow"><b>"${esc(q.trim())}" için Rehber'e sor</b><span class="mut sm">Yapay zekâ tahmin eder, sonra listene ekleyebilirsin</span></span><span class="aic" aria-hidden="true">${Icons.svg("sparkle")}</span></button>`:"";return foodSearch(q,8,L).map(i=>{const f=L[i];return `<button class="prow" data-food="${i}"><span class="grow"><b>${esc(f.n)}</b><span class="mut sm">${f.rec?`Tarifim, 1 porsiyon: ${Math.round(f.k*f.u[0][1]/100)} kcal`:f.o?`Öğün, ${esc(f.u[0][0])}: ${Math.round(f.k*f.u[0][1]/100)} kcal`:f.my?(f.u.length>1||f.u[0][1]!==100?`Benim ürünüm, 100 g: ${f.k} kcal`:`Benim besinim, 1 porsiyon: ${f.k} kcal`):`100 g: ${f.k} kcal, protein ${fmt(f.p,0)} g`}</span></span><span class="aic" aria-hidden="true">${Icons.svg("plus")}</span></button>`}).join("")+ask};
function sheetPortion(i,food){
  curFood=food||allFoods()[i];curPor=0;
  openSheet(`<h3>${esc(curFood.n)}</h3><div class="lbl">Porsiyon</div><div class="chips" id="fpc">${curFood.u.map((u,j)=>`<button class="chip" data-fp="${j}" aria-pressed="${j===0}">${esc(u[0])}</button>`).join("")}</div>
  <label class="lbl" for="fqty">Kaç porsiyon</label><input class="in num" id="fqty" inputmode="decimal" value="1" autocomplete="off"><div class="ferr" id="berr" role="alert"></div>
  <div class="my-2"><div class="lbl">Tahmini değer</div><div id="fprev" aria-live="polite"></div></div>
  <details class="acc mb-2"><summary>Kaynak ve hesap</summary><p class="m0 mut sm">${curFood.hint||(curFood.src==="off"?"Kaynak: Open Food Facts (topluluk verisi, ODbL).":curFood.my?"Yapay zekâ ya da senin girdiğin tahmin.":curFood.o?"Öğün: bileşenlerin USDA ve tarif değerlerinden hesaplandı; porsiyon boyutu ve yağ miktarı yere göre değişir.":curFood.s?"Kaynak: USDA FoodData Central. Pişirme ve markaya göre değişebilir.":"Tahmini değer. Tarife ve markaya göre belirgin değişir.")}${curFood.v?" "+curFood.v:""}${curFood.lo!=null?RNOTE:""}</p></details>${mealChips()}${dayOptions()}<button class="btn" data-go="nutrition">Ekle</button>${curFood.rec?`<button class="lnk" data-rp="edit:${curFood.rec}">Tarifi düzenle</button>`:""}${curFood.my&&!curFood.hint?`<button class="lnk dng" data-go="mydel">Bu besini listemden sil</button>`:""}`);
  foodPreview();
}
/* Nutrition value block (food detail and recipe): big calories, a protein/carbohydrate/fat grid, the rest as a small line. A missing value is not written. */
const nutrBlock=x=>`<div class="nkc"><b class="num">${Math.round(x.k)}</b> kcal</div>${x.lo!=null?`<p class="m0 mut sm num">Aralık ~${Math.round(x.lo)}-${Math.round(x.hi)} kcal; ortalama kaydedilir</p>`:""}${(m=>m.length?`<div class="ngrid">${m.map(k=>`<div><b class="num">${fmt(x[k])} g</b><span>${NLBL[k]}</span></div>`).join("")}</div>`:"")(["p","c","f"].filter(k=>x[k]!=null))}${(m=>m.length?`<p class="m0 mut sm num">${m.map(k=>`${NLBL[k]} ${fmt(x[k])} ${NUNIT(k)}`).join(" · ")}</p>`:"")(["fb","sg","na"].filter(k=>x[k]!=null))}`;
const RNOTE=" Aralık, tarif farkını (yağ, hamur) yansıtan bir tahmindir, ölçüm değildir. Ekle düğmesi ortalamayı kaydeder.";
function foodCalc(){
  const q=num($("#fqty").value),g=curFood.u[curPor][1]*(q>0&&q<=20?q:0),r=x=>x==null?null:x*g/100;
  return Object.assign({q,g,k:r(curFood.k),lo:r(curFood.lo),hi:r(curFood.hi)},...NUTR.map(k=>({[k]:r(curFood[k])})));
}
function foodPreview(){
  const x=foodCalc();
  if(x.g)$("#fprev").innerHTML=nutrBlock(x);else $("#fprev").textContent="Miktarı 0,1 ile 20 arasında yaz";
}
const BS=()=>plugin("BarcodeScanner");
async function barcodeRead(){
  const bs=BS();if(!bs)return toast("Barkod okuma yalnızca telefondaki uygulamada çalışır");
  try{
    const a=await bs.isGoogleBarcodeScannerModuleAvailable().catch(()=>({available:true}));
    if(!a.available){toast("Barkod modülü indiriliyor, bir dakika sonra tekrar dene");return bs.installGoogleBarcodeScannerModule()}
    const r=await bs.scan({formats:["EAN_13","EAN_8","UPC_A","UPC_E"]}),b=r.barcodes&&r.barcodes[0];
    if(b&&b.rawValue)await barcodeFind(b.rawValue);
  }catch(e){if(!/cancel/i.test(e&&e.message||""))toast("Barkod okunamadı: "+((e&&e.message)||"hata"))}
}
async function barcodeFind(raw){
  const code=String(raw).replace(/\D/g,"");
  if(code.length<8||code.length>14)return toast("Bu bir ürün barkodu değil");
  const li=allFoods().findIndex(f=>f.b===code);
  if(li>=0)return sheetPortion(li);
  toast("Ürün aranıyor…");
  let j;
  try{
    const r=await NetLog.fetch("off",`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${OffLib.FIELDS}`,{headers:{"User-Agent":"NeoWell/1.0 (kisisel kullanim)"}});
    j=await r.json();
  }catch{return toast("İnternete ulaşılamadı, barkod aranamadı")}
  const x=OffLib.parse(j);
  if(x.status==="none"||x.status==="bad"){
    sheetFood();ownOpen();toast(`${x.why}. Etiketteki değerleri elle yaz ya da Rehber'e sor`);return;
  }
  const food=Object.assign({},x.food,{src:"off"});
  if(x.status==="ok"&&Nutrition.putMy(food)){save();return sheetPortion(S.myFoods.findIndex(m=>m.b===code))}
  const why=x.status==="ok"?"Besin listen dolu (en çok 200) olduğu için listene kaydedilmedi.":"Bazı besin değerleri eksik olduğu için listene kaydedilmedi.";
  sheetPortion(0,Object.assign(food,{my:true,hint:"Kaynak: Open Food Facts. "+why}));
}
function goMyDelete(){
  S.myFoods=S.myFoods.filter(m=>tr(m.n)!==tr(curFood.n));save();closeSheet();render();toast("Besin listenden silindi");
}
function goNutrition(){
  const x=foodCalc();if(!x.g)return ferr("berr","Miktarı 0,1 ile 20 arasında yaz");
  const label=curFood.u[curPor][0],text=`${curFood.n}, ${x.q===1?"":fmt(x.q,x.q%1?1:0)+" × "}${label}`;
  const e=add("food",Math.round(x.k),text,fday());e.meal=fmeal();
  for(const k of NUTR)if(x[k]!=null)e[k]=Math.round(x[k]*10)/10;
  if(x.lo!=null){e.lo=Math.round(x.lo);e.hi=Math.round(x.hi)}
  save();
  closeSheet();render();
  const t=dayKey(),top=sum("food",t,t),g=kcalGoal(t);
  toast(g>0&&top?`Kaydedildi. Bugün ${Math.round(top)} / ${g} kcal`:"Yemek kaydedildi",e.id);
}
function goFood(){
  const text=$("#ft").value.trim(),kc=num($("#fv").value,true);
  if($("#fv").value.trim()&&isNaN(kc))return ferr("yerr","Kaloriyi tam sayı olarak yaz, örneğin 250");
  if(!text&&isNaN(kc))return ferr("yerr","Yemeğin adını ya da kalorisini yaz");
  if(!isNaN(kc)&&kc>20000)return ferr("yerr","Kalori çok yüksek görünüyor, kontrol et");
  const e=add("food",isNaN(kc)?null:kc,text,fday());e.meal=fmeal();save();closeSheet();render();
  const t=dayKey(),top=sum("food",t,t),g=kcalGoal(t);
  toast(g>0&&top?`Kaydedildi. Bugün ${Math.round(top)} / ${g} kcal`:"Yemek kaydedildi",e.id);
}
const EXERCISE=["Yürüyüş","Koşu","Ağırlık","Bisiklet","Yüzme","Yoga","Diğer"];
const EXERCISE_MET={Yürüyüş:3.5,Koşu:8.3,Ağırlık:5,Bisiklet:6.8,Yüzme:6,Yoga:2.5,Diğer:4};
function sheetExercise(){
  openSheet(`<h3>Spor ekle</h3><div class="lbl" id="spl">Tür</div><div class="chips" id="sp" role="group" aria-labelledby="spl">${EXERCISE.map((s,i)=>`<button class="chip" data-sp="${s}" aria-pressed="${i==0}">${s}</button>`).join("")}</div>
  <label class="lbl" for="fv">Süre (dakika)</label><input class="in num" id="fv" inputmode="numeric" placeholder="Örneğin 40" autocomplete="off" autofocus><div class="ferr" id="serr" role="alert"></div>${dayOptions()}<button class="btn" data-go="exercise">Kaydet</button>`);
}
function goExercise(){
  const dk=num($("#fv").value,true);
  if(!(dk>0&&dk<=600))return ferr("serr","Süreyi dakika olarak yaz (1-600), örneğin 40");
  const pr=document.querySelector("#sp [aria-pressed=true]"),name=pr?pr.dataset.sp:"Antrenman";
  const e=add("exercise",dk,name,fday()),kc=Algo.netKcal(EXERCISE_MET[name],motionKg(),dk);if(kc)e.kcal=kc;save();closeSheet();render();
  const w=sum("exercise",keyOff(-6),dayKey());
  toast(`${name} ${Math.round(dk)} dk kaydedildi. Hafta: ${Math.round(w)} / ${S.settings.sportWeek} dk`,e.id);
}
function sheetNote(){openSheet(`<h3>Not ekle</h3><textarea class="in" id="fv" placeholder="Bugün nasıl hissediyorsun?" autofocus></textarea>${dayOptions()}<button class="btn" data-go="note">Kaydet</button>`)}
function goNote(){const t=$("#fv").value.trim();if(!t)return toast("Önce notunu yaz");const e=add("note",null,t,fday());closeSheet();render();toast("Not kaydedildi",e.id)}

function sheetBackup(){
  openSheet(`<h3>Yedekle veya geri yükle</h3><div class="lbl">Yedek metni. Geri yüklemek için yedek metnini buraya yapıştır ya da "Dosyadan oku"yu kullan. Yedek alırken Kopyala'ya basınca metin burada çıkar.</div><textarea class="in" id="bk" spellcheck="false"></textarea>
  <div class="lbl">Yedek parolası (zorunlu, en az ${BackupLib.MINPW} karakter). Yedek her zaman şifrelenir ve Rehber anahtarların da içine girer. Parolayı unutursan yedeğini kimse açamaz, kurtarma yolu yoktur. Parolayı güvenli bir yere yaz. Geri yüklerken de aynı parola gerekir.</div>
  <input class="in" id="bkpw" type="password" autocomplete="new-password" placeholder="Parola"><input class="in" id="bkpw2" type="password" autocomplete="new-password" placeholder="Yedek alırken parolayı tekrar yaz">
  <div class="hint" id="bkw" role="alert"></div>
  <div class="two"><button class="btn ghost" data-go="copy">Kopyala</button><button class="btn ghost" data-go="${isNative()?"share":"download"}">${isNative()?"Dosya olarak paylaş":"Dosya indir"}</button></div>
  <div class="btns"><label class="tc btn ghost">Dosyadan oku<input id="bkfile" type="file" accept=".json,application/json,text/plain" hidden></label><button class="btn" data-go="restore">Bu metinden geri yükle</button></div>
  <button class="mt-2 btn ghost" data-go="checkbk">Yalnız denetle (hiçbir şey yüklenmez)</button>`);
}
function markBackup(soft){S.settings.lastBackup=dayKey();save(soft)}
async function backupText(){
  const pw=$("#bkpw").value,m2=$("#bkpw2"),bad=BackupLib.pwCheck(pw)||(m2&&m2.value!==pw?"Parolalar aynı değil":"");
  if(bad){const w=$("#bkw");if(w)w.textContent=bad;toast(bad);return null}
  return backupJson(pw);
}
/* Share sheet on the phone, file download in a browser. */
async function exportBackup(){
  const txt=await backupText();
  if(txt&&await shareFile(BackupLib.manualName(dayKey()),"NeoWell yedeği","application/json",txt,true))markBackup();
}
/* Decrypts and validates a backup without touching the app state; null (after a toast) when it cannot be used. */
async function openBackup(text,pw){
  const bad=m=>{toast(m);return null};
  let r,keysIn=null;try{r=JSON.parse(text)}catch{return bad("Yedek metni okunamadı")}
  if(!(r&&r.enc))return bad("Yalnız parolalı yedek geri yüklenir");
  if(!pw)return bad("Şifreli yedek: önce parolayı yaz");
  try{const p=await BackupLib.decrypt(r,pw);r=p.S;keysIn=p.keys}catch{return bad("Parola yanlış ya da yedek bozuk")}
  if(!r||!Array.isArray(r.entries))return bad("Bu bir NeoWell yedeği değil");
  const b=buildState(r);
  if(!b.S.entries.length&&r.entries.length)return bad("Yedekte geçerli kayıt yok");
  return {b,keysIn};
}
const backupCounts=s=>[[s.entries,"kayıt"],[s.workouts,"antrenman"],[s.meds,"ilaç"],[s.vitals,"ölçüm"]].filter(([a])=>a.length).map(([a,n])=>`${fint(a.length)} ${n}`).join(", ");
/* "Yalnız denetle": proves the file and password work and shows what is inside, loads nothing. */
async function checkBackup(){
  const o=await openBackup($("#bk").value,$("#bkpw").value);if(!o)return;
  const days=o.b.S.entries.map(e=>e.day).sort(),last=days[days.length-1];
  toast(`Parola doğru. Yedekte ${backupCounts(o.b.S)||"kayıt yok"}${last?`; son kayıt ${fd(last)}`:""}. Hiçbir şey yüklenmedi.`);
}
async function goRestore(text=$("#bk").value,pw=$("#bkpw").value){
  const o=await openBackup(text,pw);if(!o)return;
  const {b,keysIn}=o,drop=b.drop,out=b.S.entries,hasData=Log.all().length>0||Gym.workouts().length>0||Meds.count()>0,fresh=obNeeded();
  const pj=JSON.stringify(S),canCopy=otherBytes+JSON.stringify(b.S).length*2+pj.length*2<=STORE_WARN;
  if(!await confirmSheet({title:"Yedek yüklensin mi?",ok:"Yükle",danger:true,body:`Yedekten ${backupCounts(b.S)||"0 kayıt"} yüklenecek${drop?`; ${drop} geçersiz kayıt atlanacak`:""}.${hasData?" Mevcut veriler değişecek.":""}${canCopy||!hasData?"":" Depolama dolu olduğundan eski verin için güvenlik kopyası ALINAMAYACAK; geri dönüş olmaz, önce yedek al."} Devam edilsin mi?`}))return;
  const prevS=S;
  S=b.S;
  /* A backup must not change where the key goes, the consent setting or the data-sharing permission. The automatic backup folder belongs to this phone. */
  Object.assign(S.settings,Object.fromEntries(["noticeOk",...SHARE_KEYS].map(k=>[k,prevS.settings[k]])),{consent:prevS.settings.consent,consentV:prevS.settings.consentV,consentAt:prevS.settings.consentAt,consentP:prevS.settings.consentP,chatRisk:riskMerge(prevS.settings.chatRisk,S.settings.chatRisk),lastBackup:dayKey(),autoBk:prevS.settings.autoBk,lastAutoBk:prevS.settings.lastAutoBk});cAgeGuard();
  const keys=getKeys();
  for(const p of S.providers){
    const cur=prevS.providers.find(x=>x.id===p.id),def=defProviders().find(x=>x.id===p.id);
    if(!def&&keys[p.id]&&cur)p.base=cur.base;
    if(def)p.confirm=def.confirm;
  }
  if(!save()){S=prevS;saveFail=false;return toast("Yedek yüklenemedi, depolama dolu")}
  if(keysIn&&typeof keysIn==="object")for(const id in keysIn)if(typeof keysIn[id]==="string"&&S.providers.some(p=>p.id===id))try{await setKey(id,keysIn[id])}catch{toast("Bir anahtar kasaya yazılamadı")}
  /* The safety copy keeps the old data and doubles the store: it is taken only if the total stays under the warning limit. */
  let copy=false;
  if(hasData&&storeBytes+pj.length*2<=STORE_WARN)copy=Store.set("nw_state_previous",pj);
  if(!copy)Store.del("nw_state_previous");
  S.settings.copyAt=copy?dayKey():"";
  if(fresh)S.settings.obDone=S.settings.noticeOk=true;
  save(true);
  otherBytes=lsOther();storeBytes=otherBytes+lastJ.length*2;
  logOff=0;closeSheet();render();scheduleReminders().then(setNotif);
  toast((drop?`Yedek yüklendi, ${drop} geçersiz kayıt atlandı`:"Yedek yüklendi")+(b.lost.length?`; okunamayan alanlar varsayılana döndü (${b.lost.join(", ")})`:"")+(copy||!hasData?"":". Eski verin için güvenlik kopyası alınamadı (depolama dolu)"));
}

