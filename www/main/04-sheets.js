/* ---------- sheets and dialogs ---------- */
/* While a top layer (sheet or guide) is open the background is inert: Tab, touch and the screen reader do not reach behind it. */
const topLayer=()=>$("#alarm")&&!$("#alarm").hidden?$("#alarm"):!$("#cfm").hidden?$("#cfm"):$("#sheet").classList.contains("on")?$("#sheet"):$("#guide").hidden?null:$("#guide");
function trap(){const o=topLayer();for(const e of document.body.children)if(e.tagName!=="SCRIPT")e.inert=!!o&&e!==o&&!e.matches("#scrim,#toast")}
/* sheetEnd: called when a sheet that waits for a choice closes or is replaced by another sheet (a Coach preview then counts as Cancel). */
let sheetFrom=null,sheetEnd=null;
const sheetDone=ok=>{const e=sheetEnd;sheetEnd=null;if(e)e(ok)};
function openSheet(html){
  Units.reset();sheetDone(false);$("#toast").classList.remove("on");const s=$("#sheet");
  if(!s.classList.contains("on"))sheetFrom=document.activeElement;
  s.innerHTML=`<div class="grab"></div><button class="shx" data-shx aria-label="Pencereyi kapat">${Icons.svg("x")}</button>${html}`;
  const h=s.querySelector("h3");
  if(h){h.id="sht";h.tabIndex=-1;s.setAttribute("aria-labelledby","sht")}else{s.removeAttribute("aria-labelledby");s.setAttribute("aria-label","Pencere")}
  s.classList.add("on");$("#scrim").classList.add("on");trap();
  const f=s.querySelector("[autofocus]");if(f)setTimeout(()=>{const a=document.activeElement;if(f.isConnected&&!(a&&a!==f&&s.contains(a)&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)))f.focus()},220);else(h||s).focus({preventScroll:true});
}
function closeSheet(){
  Units.reset();plStop();sheetDone(false);setPendingBarcode("");const s=$("#sheet"),was=s.classList.contains("on"),f=sheetFrom;
  s.classList.remove("on");$("#scrim").classList.remove("on");sheetFrom=null;trap();
  if(was&&f&&f.isConnected)f.focus({preventScroll:true});
}
/* Confirmation dialog (instead of the browser's native one): Promise<boolean>, focus on Cancel, Escape and the back key cancel.
   In tests, window.__confirmAuto or a non-native window.confirm stub opens no dialog; the answer is given synchronously
   (the .then callback runs in the same step) and the stub receives the plain text. */
let cfmDone=null;
function confirmSheet({title,body="",ok="Tamam",no="Vazgeç",danger=false}){
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
/* Recent undoable actions, newest last: each "Geri al" tap takes back one, so a double tap on "+250 ml" is undone twice. */
const UNDO_KEEP=10,UNDO_MS=10000,TOAST_MS=6000,undoStack=[];
let toastSeq=0;
function toastShow(msg,undoable){
  $("#tmsg").textContent=msg;$("#tundo").hidden=!undoable;toastSeq++;
  $("#toast").classList.add("on");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("#toast").classList.remove("on"),undoable?UNDO_MS:TOAST_MS);
}
function toast(msg,undo){
  /* While saving fails, a following message such as "+250 ml" must not cover the error. */
  if(saveFail&&msg!==SAVE_FAIL)msg=SAVE_FAIL+" "+msg;
  if(undo!=null){undoStack.push({undo,msg,t:Date.now()});if(undoStack.length>UNDO_KEEP)undoStack.shift()}
  toastShow(msg,undo!=null);
}
function undoLast(){
  const e=undoStack.pop();if(!e)return;
  const n=toastSeq,u=e.undo;
  if(typeof u==="function")u();else{Log.remove(x=>x.id===u);save();render()}
  if(toastSeq!==n)return;
  const next=undoStack[undoStack.length-1];
  if(next&&Date.now()-next.t<60000)toastShow(`Geri alındı. Bir önceki: ${next.msg}`,true);else{undoStack.length=0;$("#toast").classList.remove("on")}
}
/* `sel` is the day an open record belongs to; on the Day screen an older day is preselected for new records. */
function dayOptions(inl,sel=tab==="day"&&logOff>=7?keyOff(-logOff):""){
  const ks=Array.from({length:7},(_,i)=>dayKey(addDays(-i)));
  let o=ks.map((k,i)=>`<option value="${k}"${k===sel?" selected":""}>${i==0?"Bugün":i==1?"Dün":WEEKDAYS[addDays(-i).getDay()]+" "+fd(k)}</option>`).join("");
  if(sel&&!ks.includes(sel))o=`<option value="${sel}" selected>${fd(sel)}</option>`+o;
  const f=`<label class="lbl" for="fday">Gün</label><select class="in" id="fday">${o}</select>`,b=!sel||sel===dayKey()?`<details class="acc"><summary>Bugün</summary>${f}</details>`:f;
  return inl?`<div class="inl">${b}</div>`:b;
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
  weightOk=null;openSheet(`<h3>Kilo ekle</h3><div class="lbl"><span id="kul">Kilo (${wlab()})</span> <button class="chip" data-tu="w" data-for="fv" data-lbl="kul" aria-label="Birimi bu kayıt için değiştir">kg ⇄ lb</button></div><div class="kstep"><button class="chip" data-kd="-1" aria-label="0,1 ${wlab()} azalt">−0,1</button><input class="in num" id="fv" inputmode="decimal" placeholder="${wlab()==="lb"?"185,4":"84,3"}" value="${last}" autocomplete="off" autofocus onfocus="this.select()" onclick="if(!this.dataset.s){this.dataset.s=1;this.select()}"><button class="chip" data-kd="1" aria-label="0,1 ${wlab()} artır">+0,1</button></div><div class="ferr" id="kerr" role="alert"></div>${dayOptions()}<div id="kwarn" role="alert"></div><button class="btn" data-go="weight">Kaydet</button>`);
}
function weightStep(d){const f=$("#fv"),v=num(f.value),k=Units.wIn(v);if(k>=20&&k<=400)f.value=fmt(Math.round(v*10+d)/10)}
function goWeight(){
  const raw=$("#fv").value,v=unitVal($("#fv"),Units.wIn);
  /* If the selection is lost on the phone, "85" typed after "86,0" becomes 86.085; a scale gives at most 2 decimals. */
  if(!(v>=20&&v<=400)||/[.,]\d{3}/.test(raw))return ferr("kerr",`Kiloyu ${wlab()} olarak yaz, örneğin ${wlab()==="lb"?"185,4":"84,3"}`);
  const day=fday(),m=weights(),ds=Object.keys(m).filter(k=>k<day).sort(),prev=ds.length?m[ds[ds.length-1]]:null;
  /* A jump against a weigh-in older than two weeks is not a typo signal. */
  const fresh=prev!=null&&Algo.dayNum(day)-Algo.dayNum(ds[ds.length-1])<=14;
  const lb=prev==null&&wlab()==="kg"&&Algo.lbSuspect(v,S.settings.heightCm);
  if((lb||fresh&&Math.round(Math.abs(v-prev)*10)>=30)&&weightOk!==v){weightOk=v;$("#kerr").textContent="";$("#kwarn").innerHTML=`<div class="banner"><b>${lb?`${fmt(v)} kg çok yüksek görünüyor`:`${dwS(v-prev)} ${wlab()} fark var`}</b><p>${lb?`Libre (lb) yazmış olabilirsin: ${fmt(v)} lb ≈ ${fmt(v*0.45359237)} kg. Doğruysa devam et.`:`Son tartın ${dw(prev)} ${wlab()} idi. Yanlış yazmış olabilir misin?`}</p><button class="btn" data-go="weight">Yine de kaydet</button></div>`;return}
  const e=add("weight",v,"",day);closeSheet();render();
  const hide=S.settings.hideNums;
  let msg=hide?"Tartı kaydedildi":`${dw(v)} ${wlab()} kaydedildi`;
  if(prev!=null&&!hide)msg+=`, öncekine göre ${dwS(v-prev)} ${wlab()}`;
  if(Algo.fastLoss(weights()))msg+=". Kilon haftada %1'den hızlı düşüyor; hekimine danış";
  toast(msg,e.id);
}
/* Yesterday's entry carries its own meal; favourites and templates have none, so the selected chip applies. */
function addFoods(items,day,msg,undo){
  const ids=items.map(s=>{const e=copyNutr(s,add("food",s.v,s.text,day));if(s.lo!=null){e.lo=s.lo;e.hi=s.hi}e.meal=LogLib.mealKey(s.meal)||(s.time?LogLib.mealOf(s):fmeal());return e.id});save();closeSheet();render();
  toast(msg,()=>{Log.remove(e=>ids.includes(e.id));if(undo)undo();save();render()});
}
function repeatYesterday(){
  const src=of("food",keyOff(-1));
  if(!src.length)return toast("Dün kayıtlı yemek yok");
  addFoods(src,dayKey(),`Dünkü ${src.length} yemek bugüne eklendi`);
}
function favHtml(){
  recList=LogLib.recents(Log.all(),dayKey());
  const fk=new Set(Nutrition.fav().map(f=>LogLib.key(f.text)));
  const row=(x,i,a,b,star,lab)=>`<div class="prow"><button class="grow pbtn" data-${a}="${i}"><span class="grow"><b>${esc(x.text)}</b><span class="mut sm">${x.v!=null?Math.round(x.v)+" kcal":"kalori yok"}</span></span><span class="aic" aria-hidden="true">${Icons.svg("plus")}</span></button><button class="plus" data-${b}="${i}" aria-label="${lab}" title="${lab}"${star==="★"&&b==="fva"?" disabled":""}>${star}</button></div>`;
  const tp=Nutrition.tpl().length?`<div class="lbl">Şablonlar</div><div class="chips">${Nutrition.tpl().map((t,i)=>`<span class="chip tchip"><button data-tp="${i}">${esc(t.n)} · ${t.items.length}</button><button class="del" data-tpd="${i}" aria-label="Şablonu sil">✕</button></span>`).join("")}</div>`:"";
  return recipeListHtml()+tp+(Nutrition.fav().length?`<div class="lbl">Sık kullanılanlar</div>${Nutrition.fav().map((x,i)=>row(x,i,"fv","fvd","★","Sık kullanılanlardan çıkar")).join("")}`:"")+(recList.length?`<div class="lbl">Son yediklerin</div>${Nutrition.fav().length?"":`<div class="p0 hint">☆ ile sık kullanılanlara ekle, + ile bugüne ekle.</div>`}${recList.map((x,i)=>row(x,i,"rc","fva",fk.has(LogLib.key(x.text))?"★":"☆",fk.has(LogLib.key(x.text))?"Sık kullanılanlarda":"Sık kullanılanlara ekle")).join("")}`:"");
}
const mealChips=()=>{const d=LogLib.mealOf({time:`${pad(new Date().getHours())}:00`});return `<div class="lbl" id="fmll">Öğün</div><div class="chips" id="fml" role="group" aria-labelledby="fmll">${LogLib.MEALS.map(([k,n])=>`<button class="chip" data-ml="${k}" aria-pressed="${k===d}">${n}</button>`).join("")}</div>`};
const fmeal=()=>{const b=document.querySelector("#fml [aria-pressed=true]");return b?b.dataset.ml:undefined};
const ownOpen=()=>{$("#fown").hidden=false;const b=$('[data-act="own"]');if(b)b.remove()};
function sheetFood(){
  const dn=of("food",keyOff(-1)).length;
  openSheet(`<h3>Yemek ekle</h3><input class="in" id="fq" type="search" enterkeyhint="search" aria-label="Besin ara" placeholder="Besin ara: mercimek çorbası, simit…" autocomplete="off" autofocus><div id="flist" class="plist"></div>${mealChips()}${dayOptions(true)}<div class="qrow">${dn?`<button class="btn ghost" data-act="yesterday">↺ Dünkünü tekrarla (${dn})</button>`:""}<button class="btn ghost" data-act="own">Kendin yaz</button>${quickBtn()}${isNative()&&BS()?`<button class="btn ghost" data-act="barcode">${Icons.svg("camera")} Barkod okut</button>`:""}${ocrBtn("label",Icons.svg("tag")+" Etiket oku")}</div>
  <div id="fown" hidden><input class="in" id="ft" aria-label="Yemeğin adı" placeholder="Ne yedin?" autocomplete="off"><input class="in num" id="fv" aria-label="Kalori, isteğe bağlı" inputmode="numeric" placeholder="Kalori (isteğe bağlı)"><div class="ferr" id="yerr" role="alert"></div><button class="btn" data-go="food">Kaydet</button><button class="mt-2 btn ghost" data-rp="new">Tarif oluştur</button></div><div id="frl" class="plist">${favHtml()}</div>`);
}
function sheetWater(){
  const L=Log.where(e=>e.type==="water"&&e.day===keyOff(-logOff));
  if(!L.length)return closeSheet();
  const sh=$("#sheet"),y=sh.classList.contains("on")?sh.scrollTop:0;
  openSheet(`<h3>Su kayıtları</h3>${L.map(e=>`<div class="prow"><button class="tx grow" data-edit="${e.id}" aria-label="${e.time}, ${e.v} ml, düzenle"><b class="num">${e.time}</b></button><span class="num">${e.v} ml${e.dr?` · ${drinkName(e.dr)}`:""}</span><button class="del" data-del="${e.id}" aria-label="Kaydı sil">✕</button></div>`).join("")}`);
  sh.scrollTop=y;
}
/* Copy a meal (scope = meal key) or the whole day to another day; each food keeps its own meal on a day copy. */
let cpScope="";
function sheetCopy(scope){
  const src=Log.where(e=>e.type==="food"&&e.day===keyOff(-logOff)&&(scope==="day"||LogLib.mealOf(e)===scope));
  if(!src.length)return toast("Kopyalanacak yemek yok");
  cpScope=scope;
  const chips=scope==="day"?"":`<div class="lbl" id="fmll">Hangi öğüne</div><div class="chips" id="fml" role="group" aria-labelledby="fmll">${LogLib.MEALS.map(([k,n])=>`<button class="chip" data-ml="${k}" aria-pressed="${k===scope}">${n}</button>`).join("")}</div>`;
  openSheet(`<h3>${scope==="day"?"Günü kopyala":"Öğünü kopyala"}</h3><p class="hint">${src.length} yemek, ${Math.round(src.reduce((a,e)=>a+(e.v||0),0))} kcal. Hedef gün seç.</p>${chips}${dayOptions(false,logOff?dayKey():keyOff(-1))}<button class="btn" data-go="cp">Kopyala</button>`);
}
function goCopy(){
  const from=keyOff(-logOff),to=fday(),m=fmeal();
  const src=Log.where(e=>e.type==="food"&&e.day===from&&(cpScope==="day"||LogLib.mealOf(e)===cpScope));
  addFoods(src.map(e=>({...e,meal:cpScope==="day"?LogLib.mealOf(e):m})),to,`${src.length} yemek ${to===dayKey()?"bugüne":fd(to)+" gününe"} kopyalandı`);
}
/* Tap on a meal: the calories and macros it carries, what is missing, and fields to complete the macros. */
const MACRO_IDS=[["p","epr"],["c","ech"],["f","efa"]];
const foodDetail=e=>{
  const miss=MACRO_IDS.filter(([k])=>e[k]==null).map(([k])=>NLBL[k]);
  return `${e.v>0?`<div class="my-2">${nutrBlock({k:e.v,lo:e.lo,hi:e.hi,p:e.p,c:e.c,f:e.f,fb:e.fb,sg:e.sg,na:e.na})}</div>`:""}${miss.length?`<p class="m0 mut sm">Eksik besin verisi: ${miss.join(", ")}.</p>`:""}
  <details class="acc" ${miss.length?"open":""}><summary>Besin değerleri (g)</summary>${MACRO_IDS.map(([k,id])=>`<label class="lbl" for="${id}">${NLBL[k][0].toUpperCase()+NLBL[k].slice(1)} (g)</label><input class="in num" id="${id}" inputmode="decimal" value="${e[k]!=null?fmt(e[k],e[k]%1?1:0):""}" autocomplete="off">`).join("")}</details>`;
};
function sheetMissing(){
  const L=Log.where(e=>e.type==="food"&&e.day===keyOff(-logOff)&&MACRO_IDS.some(([k])=>e[k]==null));
  if(!L.length)return closeSheet();
  openSheet(`<h3>Eksik besin verisi</h3><p class="hint">Birine dokun, protein, karbonhidrat ve yağı yazıp kaydet.</p>${L.map(e=>`<div class="prow"><button class="grow pbtn" data-edit="${e.id}"><span class="grow"><b>${esc(e.text||"Öğün")}</b><span class="mut sm">Eksik: ${MACRO_IDS.filter(([k])=>e[k]==null).map(([k])=>NLBL[k]).join(", ")}</span></span><span class="aic" aria-hidden="true">›</span></button></div>`).join("")}`);
}
/* One edit sheet for a log entry: value, name or note, day and time, and the meal for food. */
let editId=0;
function sheetEntry(id){
  const e=Log.find(x=>x.id===id);if(!e||e.type==="steps")return;
  const t=e.type,v=e.v==null?"":t==="weight"?dw(e.v):fmt(e.v,e.v%1?1:0);
  const val={weight:`Kilo (${wlab()})`,water:"Miktar (ml)",exercise:"Süre (dakika)",food:"Kalori (kcal, isteğe bağlı)"}[t];
  const name={food:"Yemeğin adı",exercise:"Tür"}[t];
  editId=id;
  openSheet(`<h3>Kaydı düzenle</h3>${val?`<label class="lbl" for="ev">${val}</label><input class="in num" id="ev" inputmode="${t==="weight"?"decimal":"numeric"}" value="${v}" autocomplete="off">`:""}
  ${name?`<label class="lbl" for="et">${name}</label><input class="in" id="et" value="${esc(e.text)}" autocomplete="off">`:""}${t==="note"?`<label class="lbl" for="et">Not</label><textarea class="in" id="et">${esc(e.text)}</textarea>`:""}
  ${t==="food"?foodDetail(e):""}${t==="food"?`<div class="lbl" id="fmll">Öğün</div><div class="chips" id="fml" role="group" aria-labelledby="fmll">${LogLib.MEALS.map(([k,n])=>`<button class="chip" data-ml="${k}" aria-pressed="${k===LogLib.mealOf(e)}">${n}</button>`).join("")}</div>`:""}
  <label class="lbl" for="eday">Gün</label><input class="in" type="date" id="eday" value="${e.day}" max="${dayKey()}">
  <label class="lbl" for="etime">Saat</label><input class="in" type="time" id="etime" value="${e.time||""}">
  <div class="ferr" id="eerr" role="alert"></div><button class="btn" data-go="entry">Kaydet</button>`);
}
async function goEntry(){
  const e=Log.find(x=>x.id===editId);if(!e)return closeSheet();
  const t=e.type,raw=($("#ev")||{value:""}).value.trim(),text=$("#et")?$("#et").value.trim():e.text,day=$("#eday").value,time=$("#etime").value,next={...e,day,time,text};
  const bad=m=>ferr("eerr",m),same=!!$("#ev")&&$("#ev").value===$("#ev").defaultValue;
  if(!/^\d{4}-\d\d-\d\d$/.test(day)||day>dayKey())return bad("Geçerli bir gün seç, gelecek günler olmaz");
  if(!/^\d\d:\d\d$/.test(time))return bad("Saati yaz, örneğin 08:30");
  if(t==="weight"){
    const kg=same?e.v:Units.wIn(num(raw));
    if(!(kg>=20&&kg<=400)||(!same&&/[.,]\d{3}/.test(raw)))return bad(`Kiloyu ${wlab()} olarak yaz, örneğin ${wlab()==="lb"?"185,4":"84,3"}`);
    if(day!==e.day&&of("weight",day).length&&!await confirmSheet({title:"Bu günde başka kilo var",body:`${fd(day)} gününde bir tartı kaydı var. İki kayıttan saati geç olan o günün kilosu sayılır.`,ok:"Taşı"}))return;
    next.v=kg;
  }else if(t==="water"||t==="exercise"){
    const n=same?e.v:num(raw,true),max=t==="water"?5000:600;
    if(!(n>0&&n<=max))return bad(t==="water"?"Miktarı ml olarak yaz (1-5000), örneğin 250":"Süreyi dakika olarak yaz (1-600), örneğin 40");
    next.v=n;
  }else if(t==="food"){
    const kc=same?e.v??NaN:num(raw,true);
    if(raw&&isNaN(kc))return bad("Kaloriyi tam sayı olarak yaz, örneğin 250");
    if(!text&&isNaN(kc))return bad("Yemeğin adını ya da kalorisini yaz");
    if(!isNaN(kc)&&kc>20000)return bad("Kalori çok yüksek görünüyor, kontrol et");
    next.v=isNaN(kc)?null:kc;next.meal=fmeal();
    for(const [k,id] of MACRO_IDS){
      const r=$("#"+id).value.trim(),g=num(r);
      if(!r)delete next[k];
      else if(!(g>=0&&g<=LogLib.MAX[k]))return bad(`${NLBL[k][0].toUpperCase()+NLBL[k].slice(1)} değerini gram olarak yaz, örneğin 12`);
      else next[k]=g;
    }
    if(next.v!==e.v){delete next.lo;delete next.hi}
  }else if(t==="note"&&!text)return bad("Önce notunu yaz");
  if(t==="exercise"){
    if(day!==dayKey())next.bt=true;else delete next.bt;
    if(e.kcal!=null){const kc=Algo.netKcal(EXERCISE_MET[text],motionKg(),next.v);if(kc)next.kcal=kc;else delete next.kcal}
  }
  Log.swap(e,next);
  if(!commit(()=>Log.swap(next,e)))return;
  closeSheet();render();
  toast("Kayıt güncellendi",()=>{if(Log.swap(next,e)&&commit(()=>Log.swap(e,next)))render()});
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
  if(Nutrition.tpl().length>=20)return toast("En fazla 20 şablon");
  Nutrition.addTpl({id:Math.max(0,...Nutrition.tpl().map(t=>t.id))+1,n,items});save();closeSheet();toast(`"${n}" şablonu kaydedildi`);
}
let curFood=null,curPor=0,foodAskQ="";
const allFoods=()=>Nutrition.my().map(m=>Object.assign({n:m.n,k:m.k,u:m.u||[["1 porsiyon",100]],portion:m.portion===true,my:true,b:m.b,src:m.src},...NUTR.map(k=>({[k]:m[k]==null?null:m[k]})))).concat(Nutrition.recipes().map(LogLib.recipeFood),FOODS);
const foodListHtml=q=>{const L=allFoods(),ask=q.trim().length>=2?`<button class="prow" data-c="askfood"><span class="grow"><b>"${esc(q.trim())}" için Rehber'e sor</b><span class="mut sm">Yapay zekâ tahmin eder, sonra listene ekleyebilirsin</span></span><span class="aic" aria-hidden="true">${Icons.svg("sparkle")}</span></button>`:"";return foodSearch(q,8,L).map(i=>{const f=L[i];return `<div class="prow"><button class="grow pbtn" data-food="${i}"><span class="grow"><b>${esc(f.n)}</b><span class="mut sm">${f.rec?`Tarifim, 1 porsiyon: ${Math.round(f.k*f.u[0][1]/100)} kcal`:f.o?`Öğün, ${esc(f.u[0][0])}: ${Math.round(f.k*f.u[0][1]/100)} kcal`:f.my?(f.u.length>1||f.u[0][1]!==100?`Benim ürünüm, 100 g: ${f.k} kcal`:`Benim besinim, 1 porsiyon: ${f.k} kcal`):`100 g: ${f.k} kcal, protein ${fmt(f.p,0)} g`}</span></span></button><button class="plus aic" data-fadd="${i}" aria-label="${esc(f.n)}, ilk porsiyonla ekle" title="İlk porsiyonla ekle">${Icons.svg("plus")}</button></div>`}).join("")+ask};
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
function foodCalc(f=curFood,por=curPor,q=num($("#fqty").value)){
  const g=f.u[por][1]*(q>0&&q<=20?q:0),r=x=>x==null?null:x*g/100;
  return Object.assign({q,g,k:r(f.k),lo:r(f.lo),hi:r(f.hi)},...NUTR.map(k=>({[k]:r(f[k])})));
}
/* The + on a result row: one portion of the first unit, no detail sheet; the day and meal come from the open sheet. */
function quickFood(i){
  const f=allFoods()[i];if(!f)return;
  const x=foodCalc(f,0,1),s={v:Math.round(x.k),text:`${f.n}, ${f.u[0][0]}`};
  for(const k of NUTR)if(x[k]!=null)s[k]=Math.round(x[k]*10)/10;
  if(x.lo!=null){s.lo=Math.round(x.lo);s.hi=Math.round(x.hi)}
  addFoods([s],fday(),`${f.n} eklendi`);
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
  }catch(e){if(!/cancel/i.test(e&&e.message||""))toast("Barkod okunamadı. Işığı ve mesafeyi kontrol edip tekrar dene")}
}
/* Barcode not resolved: the own-food form opens with the reason and the next step written in it, not in a toast that fades. */
function barcodeMiss(code,msg){
  sheetFood();ownOpen();setPendingBarcode(code);
  $("#fown").insertAdjacentHTML("afterbegin",`<div class="banner" role="status"><p>${msg}</p></div>`);
}
/* Network failure: the form opens like for a missing product and the two ways forward are buttons, not a fading toast. */
function barcodeFail(code,why){
  barcodeMiss(code,`${why} Ürünün adını ve kalorisini şimdi elle yazabilirsin; bağlanınca tekrar okutabilirsin.`);
  $("#fown .banner").insertAdjacentHTML("beforeend",`<div class="btns"><button class="btn ghost" data-bc="manual">Elle yaz</button><button class="btn ghost" data-bc="later">Sonra dene</button></div>`);
}
document.addEventListener("click",ev=>{
  const b=ev.target.closest?.("[data-bc]");if(!b)return;
  if(b.dataset.bc==="later")closeSheet();else $("#ft").focus();
});
async function barcodeFind(raw){
  const code=String(raw).replace(/\D/g,"");
  if(code.length<8||code.length>14)return toast("Bu bir ürün barkodu değil");
  const li=allFoods().findIndex(f=>f.b===code);
  if(li>=0)return sheetPortion(li);
  if(navigator.onLine===false)return barcodeFail(code,"İnternete ulaşılamadı, barkod aranamadı: telefon çevrimdışı görünüyor.");
  toast("Ürün aranıyor…");
  let j;
  try{
    const r=await NetLog.fetch("off",`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${OffLib.FIELDS}`,{headers:{"User-Agent":"NeoWell/1.0 (kisisel kullanim)"}});
    j=await r.json();
  }catch(e){return barcodeFail(code,e?.name==="TimeoutError"?"Barkod araması 10 saniyede cevap vermedi.":"İnternete ulaşılamadı, barkod aranamadı.")}
  const x=OffLib.parse(j);
  if(x.status==="none"||x.status==="bad"){
    return barcodeMiss(x.status==="none"?code:"",x.status==="none"?`Ürün bulunamadı, bu barkod Open Food Facts'te yok.${plugin("Ocr")?" Paketin arkasındaki besin tablosunu \"Etiket oku\" ile fotoğraflarsan ürünü kaydederim; sonraki okutmada kendiliğinden gelir.":" Ürünün adını ve kalorisini elle yazabilirsin."}`:`${x.why}. Etiketteki değerleri elle yaz.`);
  }
  const food=Object.assign({},x.food,{src:"off"});
  if(x.status==="ok"&&Nutrition.putMy(food)){save();return sheetPortion(Nutrition.my().findIndex(m=>m.b===code))}
  const why=x.status==="ok"?"Besin listen dolu (en çok 200) olduğu için listene kaydedilmedi.":"Bazı besin değerleri eksik olduğu için listene kaydedilmedi.";
  sheetPortion(0,Object.assign(food,{my:true,hint:"Kaynak: Open Food Facts. "+why}));
}
function goMyDelete(){
  Nutrition.setMy(Nutrition.my().filter(m=>tr(m.n)!==tr(curFood.n)));save();closeSheet();render();toast("Besin listenden silindi");
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
  const e=add("food",isNaN(kc)?null:kc,text,fday());e.meal=fmeal();
  if(pendingBarcode&&text&&!isNaN(kc))Nutrition.addMy(text,kc,null,pendingBarcode);
  save();closeSheet();render();
  const t=dayKey(),top=sum("food",t,t),g=kcalGoal(t);
  toast(g>0&&top?`Kaydedildi. Bugün ${Math.round(top)} / ${g} kcal`:"Yemek kaydedildi",e.id);
}
const EXERCISE=["Yürüyüş","Koşu","Ağırlık","Bisiklet","Yüzme","Yoga","Diğer"];
const EXERCISE_MET={Yürüyüş:3.5,Koşu:8.3,Ağırlık:5,Bisiklet:6.8,Yüzme:6,Yoga:2.5,Diğer:4};
function sheetExercise(){
  const {exLast,exMin}=S.settings,last=EXERCISE.includes(exLast)?exLast:EXERCISE[0];
  openSheet(`<h3>Spor ekle</h3><div class="lbl" id="spl">Tür</div><div class="chips" id="sp" role="group" aria-labelledby="spl">${EXERCISE.map(s=>`<button class="chip" data-sp="${s}" aria-pressed="${s===last}">${s}</button>`).join("")}</div>
  <label class="lbl" for="fv">Süre (dakika)</label><input class="in num" id="fv" inputmode="numeric" placeholder="Örneğin 40" value="${exMin||""}" onfocus="this.select()" autocomplete="off" autofocus><div class="ferr" id="serr" role="alert"></div>${dayOptions()}<button class="btn" data-go="exercise">Kaydet</button>`);
}
function goExercise(){
  const dk=num($("#fv").value,true);
  if(!(dk>0&&dk<=600))return ferr("serr","Süreyi dakika olarak yaz (1-600), örneğin 40");
  const pr=document.querySelector("#sp [aria-pressed=true]"),name=pr?pr.dataset.sp:"Antrenman";
  const e=add("exercise",dk,name,fday()),kc=Algo.netKcal(EXERCISE_MET[name],motionKg(),dk);if(kc)e.kcal=kc;
  Object.assign(S.settings,{exLast:name,exMin:dk});save();closeSheet();render();
  const w=sum("exercise",keyOff(-6),dayKey());
  toast(`${name} ${Math.round(dk)} dk kaydedildi. Hafta: ${Math.round(w)} / ${S.settings.sportWeek} dk`,e.id);
}
function sheetNote(){openSheet(`<h3>Not ekle</h3><textarea class="in" id="fv" placeholder="Bugün nasıl hissediyorsun?" autofocus></textarea>${dayOptions()}<button class="btn" data-go="note">Kaydet</button>`)}
function goNote(){const t=$("#fv").value.trim();if(!t)return toast("Önce notunu yaz");const e=add("note",null,t,fday());closeSheet();render();toast("Not kaydedildi",e.id)}

function sheetBackup(){
  openSheet(`<h3>Yedek al</h3><p class="m0 mb-3 mut sm">${BK_PHOTOS} Yedek her zaman şifrelenir${S.settings.bkNoKeys?" ve Rehber anahtarların içine girmez":" ve Rehber anahtarların da içine girer"}. ${bkLast()}.</p>
  <label class="lbl" for="bkpw">Yedek parolası (en az ${BackupLib.MINPW} karakter). Parolayı unutursan yedeğini kimse açamaz, kurtarma yolu yoktur. Parolayı güvenli bir yere yaz.</label>
  <input class="in" id="bkpw" type="password" autocomplete="new-password" placeholder="Parola"><input class="in" id="bkpw2" type="password" autocomplete="new-password" placeholder="Parolayı tekrar yaz" aria-label="Parolayı tekrar yaz">
  <div class="lbl">Kopyala'ya basınca yedek metni burada çıkar.</div><textarea class="in" id="bk" spellcheck="false" readonly></textarea>
  <div class="hint" id="bkw" role="alert"></div>
  <div class="two"><button class="btn ghost" data-go="copy">Kopyala</button><button class="btn" data-go="${isNative()?"share":"download"}">${isNative()?"Dosya olarak paylaş":"Dosya indir"}</button></div>
  <button class="mt-2 btn ghost" data-obr="open">Yedekten geri yükle</button>`);
}
function markBackup(soft){S.settings.lastBackup=dayKey();save(soft)}
async function backupText(){
  const {pw,bad}=bkNewPw("bkpw","bkpw2");
  if(bad){const w=$("#bkw");if(w)w.textContent=bad;toast(bad);return null}
  return backupJson(pw);
}
/* Share sheet on the phone, file download in a browser. */
async function exportBackup(){
  const txt=await backupText();
  if(txt&&await shareFile(BackupLib.manualName(dayKey()),"NeoWell yedeği","application/json",txt,true)){markBackup();toast(isNative()?BK_SENT:"Yedek dosyası indirildi. Güvenli bir yere kopyala ve yeni telefonda Geri yükle > Yalnız denetle ile sına")}
}
/* Decrypts and validates a backup without touching the app state; null (after a toast) when it cannot be used. */
async function openBackup(text,pw){
  const bad=m=>{toast(m);return null};
  let r,keysIn=null;try{r=JSON.parse(text)}catch{return bad("Yedek metni okunamadı")}
  if(!(r&&(r.enc||r.neowell>1)))return bad("Yalnız parolalı yedek geri yüklenir");
  if(!pw)return bad("Şifreli yedek: önce parolayı yaz");
  let at="",app="",shared=false;
  try{const p=await BackupLib.decrypt(r,pw);shared=!!p.file;r=p.S;keysIn=p.keys;at=/^\d{4}-\d{2}-\d{2}$/.test(p.at)?p.at:"";app=typeof p.app==="string"?p.app.slice(0,20):""}
  catch(e){return bad(e.message==="version"?"Bu yedek NeoWell'in daha yeni bir sürümüyle alınmış. Önce uygulamayı güncelle":e.message==="format"?"Yedek biçimi tanınmıyor. Dosya bozuk ya da başka bir uygulamadan olabilir":"Parola yanlış ya da yedek bozuk")}
  if(!r||!Array.isArray(r.entries))return bad(shared?"Bu paylaşılan bir dosya, yedek değil. Ayarlar > Veri ve yedek > Şifreli dosyayı aç ile aç":"Bu bir NeoWell yedeği değil");
  const b=buildState(r);
  if(!b.S.entries.length&&r.entries.length)return bad("Yedekte geçerli kayıt yok");
  return {b,keysIn,at,app};
}
const backupCounts=s=>[[s.entries,"kayıt"],[s.workouts,"antrenman"],[s.meds,"ilaç"],[s.vitals,"ölçüm"]].filter(([a])=>a.length).map(([a,n])=>`${fint(a.length)} ${n}`).join(", ");
/* "Yalnız denetle": proves the file and password work and shows what is inside, loads nothing. */
async function checkBackup(text,pw){
  const o=await openBackup(text,pw);if(!o)return;
  const days=o.b.S.entries.map(e=>e.day).sort(),last=days[days.length-1];
  toast(`Parola doğru. Yedekte ${backupCounts(o.b.S)||"kayıt yok"}${last?`; son kayıt ${fd(last)}`:""}. Hiçbir şey yüklenmedi.`);
}
/* Returns whether the backup was loaded. */
async function goRestore(text=$("#bk").value,pw=$("#bkpw").value){
  const o=await openBackup(text,pw);if(!o)return;
  const {b,keysIn,at,app}=o,drop=b.drop,out=b.S.entries,hasData=Log.all().length>0||Gym.workouts().length>0||Meds.count()>0,fresh=obNeeded();
  const pj=JSON.stringify(S),canCopy=otherBytes+JSON.stringify(b.S).length*2+pj.length*2<=STORE_WARN;
  if(!await confirmSheet({title:"Yedek yüklensin mi?",ok:"Yükle",danger:true,body:`Yedekten ${backupCounts(b.S)||"0 kayıt"} yüklenecek${drop?`; ${drop} geçersiz kayıt atlanacak`:""}. Yedek tarihi: ${at?fd(at):"bilinmiyor"}${app?`, sürüm ${app}`:""}.${hasData?` Bu telefondaki ${backupCounts(S)||"veriler"} değişecek.`:""} ${BK_PHOTOS}${canCopy||!hasData?"":" Depolama dolu olduğundan eski verin için güvenlik kopyası ALINAMAYACAK; geri dönüş olmaz, önce yedek al."} Devam edilsin mi?`}))return;
  /* The safety copy is taken before anything is overwritten; if the new data then does not fit, save() drops the copy and retries. */
  const copyIn=hasData&&canCopy&&Store.set("nw_state_previous",pj),prevS=S;
  S=b.S;
  const lostRecents=S.settings.hideRecents===true&&!prevS.settings.hideRecents;
  /* A backup must not change where the key goes, the consent setting or the data-sharing permission. The automatic backup folder belongs to this phone. */
  Object.assign(S.settings,Object.fromEntries(["noticeOk","hideRecents",...SHARE_KEYS].map(k=>[k,prevS.settings[k]])),{consent:prevS.settings.consent,consentV:prevS.settings.consentV,consentAt:prevS.settings.consentAt,consentP:prevS.settings.consentP,lastBackup:dayKey(),autoBk:prevS.settings.autoBk,lastAutoBk:prevS.settings.lastAutoBk});cAgeGuard();
  /* A brake on this phone stays and a backup brings its own, but a sign lifted on this phone or in the backup is not brought back by the other. */
  {const a=S.settings,p=prevS.settings,off=[...new Set((a.riskOff+","+p.riskOff).split(",").filter(Boolean))],on=k=>!off.includes(k);
    /* The side whose pregnancy flag changed last decides it, so a sign set on this phone after the backup is not dropped. */
    const newer=a.pregAt===p.pregAt?null:a.pregAt>p.pregAt?a:p,pg=newer&&{on:newer.pregnant,off:newer.riskOff.split(",").includes("preg")},at=a.pregAt>p.pregAt?a.pregAt:p.pregAt;
    Object.assign(a,{riskOff:off.join(","),edFlag:a.edFlag||p.edFlag,pregnant:(a.pregnant||p.pregnant)&&on("preg"),nursing:(a.nursing||p.nursing)&&on("nurs"),pregAt:at});
    if(pg){a.pregnant=pg.on;a.riskOff=off.filter(k=>k!=="preg"||pg.off).join(",")}}
  const keys=getKeys();
  for(const p of Coach.providers()){
    const cur=prevS.providers.find(x=>x.id===p.id),def=defProviders().find(x=>x.id===p.id);
    if(!def&&keys[p.id]&&cur)p.base=cur.base;
    if(def)p.confirm=def.confirm;
  }
  if(!save()){S=prevS;saveFail=false;if(copyIn)Store.del("nw_state_previous");return toast("Yedek yüklenemedi, depolama dolu. Mevcut verinin yedeğini al, sonra eski kayıtları sil ya da Rehber sohbetini temizle")}
  let miss=false;
  if(keysIn&&typeof keysIn==="object")for(const id in keysIn)if(typeof keysIn[id]==="string"&&Coach.providers().some(p=>p.id===id)){
    try{await setKey(id,keysIn[id])}catch{}
    if(getKeys()[id]!==keysIn[id])miss=true;
  }
  const copy=copyIn&&Store.get("nw_state_previous")!=null;
  if(!copy)Store.del("nw_state_previous");
  S.settings.copyAt=copy?dayKey():"";S.settings.keyMiss=miss;
  if(fresh)S.settings.obDone=S.settings.noticeOk=true;
  save(true);
  otherBytes=lsOther();storeBytes=otherBytes+lastJ.length*2;
  logOff=0;closeSheet();render();scheduleReminders().then(setNotif);
  const ps=prevS.settings;
  toast((drop?`Yedek yüklendi, ${drop} geçersiz kayıt atlandı`:"Yedek yüklendi")+(b.lost.length?`; okunamayan alanlar varsayılana döndü (${b.lost.join(", ")})`:"")+(copy||!hasData?"":". Eski verin için güvenlik kopyası alınamadı (depolama dolu); yedek al")+(ps.consent&&ps.autoBk?"":". Rehber izni ve otomatik yedek bu telefonda yeniden kurulur")+(lostRecents?". Son uygulamalarda gizleme bu telefonda kapalı kaldı; Ayarlar > Veri ve yedek'ten aç":"")+(S.settings.ramOn&&S.settings.ramLat&&!ramGet()?". Ramazan vakit doğrulaması yedekte yoktur; Ramazan ayarından Doğrula'ya dokun":"")+(miss?". Bazı Rehber anahtarları kasaya yazılamadı, Ayarlar > Veri ve yedek'te uyarı duruyor":""));
  return true;
}

