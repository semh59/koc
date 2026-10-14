"use strict";
/* First run: welcome (step -1) and 3 steps. Inputs are written to the existing profile and settings fields; the draft lives only in memory. */
/* Fixed start-up notice: shown on the welcome screen and, for an existing install, once in a sheet until acknowledged. */
const NOTICE="NeoWell bir tıbbi cihaz değildir ve hekim yerine geçmez. Rehber yapay zekâ kullanır ve yanılabilir; sağlıkla ilgili kararları hekiminle ver. Acil bir durumda 112'yi ara.";
const noticeGate=()=>{if(!S.settings.noticeOk)openSheet(`<h3>Önemli uyarı</h3><div class="banner"><p>${NOTICE}</p></div><button class="btn" data-notice>Anladım</button>`)};
/* The one restore page, opened from the welcome screen and from Settings: a file or pasted backup text, the password, and a check that loads nothing. */
async function sheetObRestore(){
  const keep=!!KV()&&Coach.vaultOn()&&await bkRemembered()==null;
  openSheet(`<h3>Yedekten geri yükle</h3><p class="mut">Daha önce aldığın NeoWell yedek dosyasını seç (ya da Kopyala ile aldığın metni yapıştır) ve yedek parolanı yaz.</p>
  <label class="lbl" for="obf">Yedek dosyası</label><input class="in" type="file" id="obf" accept=".json,application/json,text/plain">
  <label class="lbl" for="obt">Ya da yedek metni</label><textarea class="in" id="obt" spellcheck="false"></textarea>
  <label class="lbl" for="obpw">Yedek parolası</label><input class="in" type="password" id="obpw" autocomplete="off">
  ${keep?swRow('id="obrem"',true,"Parolayı bu telefonda sakla; Drive ve otomatik yedek aynı parolayla çalışır"):""}
  <button class="btn" data-obr="go">Geri yükle</button><button class="mt-2 btn ghost" data-obr="check">Yalnız denetle (hiçbir şey yüklenmez)</button>
  <p class="hint">Parolayı unuttuysan yedek açılamaz. ${BK_PHOTOS} Rehber izni ve otomatik yedek bu telefonda yeniden ayarlanır.</p>`);
}
async function obRestoreGo(btn){
  const f=$("#obf").files[0];let text;
  if(f){
    if(bkTooBig(f))return;
    try{text=await f.text()}catch{return toast("Dosya okunamadı")}
  }else text=$("#obt").value.trim();
  if(!text)return toast("Önce yedek dosyasını seç ya da yedek metnini yapıştır");
  const pw=$("#obpw").value,keep=$("#obrem")?.checked,label=btn.textContent;
  btn.disabled=true;btn.textContent="Açılıyor…";
  try{
    if(btn.dataset.obr==="check")await checkBackup(text,pw);
    else if(await goRestore(text,pw)&&keep)await bkRemember(pw);
  }finally{if(btn.isConnected){btn.disabled=false;btn.textContent=label}}
}
document.addEventListener("click",ev=>{const r=ev.target.closest("[data-obr]");if(r)r.dataset.obr==="open"?sheetObRestore():obRestoreGo(r)});
document.addEventListener("click",ev=>{if(ev.target.closest("[data-notice]")){S.settings.noticeOk=true;save();closeSheet()}});
const obFresh=()=>({step:-1,kg:"",cm:"",age:"",sex:"",dir:"keep",goal:"",pg:false,nu:false,ed:false,hn:false,lk:false,mods:[],err:"",bad:"",minor:false,kgOk:"",job:"",walk:""});
const ob=obFresh();
const OB_MODS=[["med","İlaç hatırlatıcı","meds"],["fast","Oruç takibi","fast"],["steps","Adım sayar","steps"],["bp","Tansiyon","heart"],["bs","Şeker","water"]];
const OB_DIRS=[["lose","Kilo ver"],["keep","Koru"],["gain","Kilo al"]];
/* Never shown to an existing user: skipped when the flag, a profile, a record, a chat or a medication exists. */
const obNeeded=()=>{const s=S.settings;return !s.obDone&&!s.heightCm&&!s.age&&!s.goalKg&&!s.kcal&&!s.consent&&!Log.all().length&&!Coach.chatCount()&&!Meds.count()};

function obRead(){
  for(const k of ["cm","kg","age","goal"]){const f=$("#ob"+k);if(f)ob[k]=f.value.trim()}
  for(const k of ["pg","nu","ed","hn","lk"]){const h=$("#ob"+k);if(h)ob[k]=h.checked}
}
/* Validated numbers or an error; the error is written under the field and the field gets aria-invalid. */
function obParse(){
  const o={};
  for(const [k,lbl,lo,hi,int] of [["cm","Boy",...RANGES.heightCm],["kg","Kilo",20,400,false],["age","Yaş",...RANGES.age]]){
    const v=num(ob[k],int);
    if(k==="age"&&v>0&&v<18)return {minor:true};
    if(isNaN(v)||v<lo||v>hi)return {err:`${lbl} ${lo} ile ${hi} arasında${int?" tam sayı":""} olmalı`,bad:k};
    o[k]=v;
  }
  o.goal=0;
  if(ob.dir!=="keep"){
    const g=num(ob.goal,false),lose=ob.dir==="lose";
    if(isNaN(g)||g<20||g>400)return {err:"Hedef kilo 20 ile 400 arasında olmalı",bad:"goal"};
    if(lose?g>=o.kg:g<=o.kg)return {err:`Hedef kilo şimdiki kilodan ${lose?"düşük":"yüksek"} olmalı`,bad:"goal"};
    const why=Algo.goalWhy(g,o.cm,o.kg);if(why)return {err:why,bad:"goal"};
    o.goal=g;
  }
  return o;
}
/* Pregnancy, nursing and eating-disorder answers are their own flags; the doctor/medication answer is written into the health note (a soft brake). */
const OB_HN="İlk kurulumda işaretlendi: hekim kontrolü ya da düzenli ilaç";
const obNote=()=>[S.settings.healthNote,ob.hn&&OB_HN].filter(Boolean).join(". ").slice(0,500);
/* From the triage when both questions are answered, otherwise from the current setting. */
const obAct=()=>ob.job!==""&&ob.walk!==""?Algo.actFromTriage(+ob.job,+ob.walk):S.settings.act;
function obPlan(p){
  const q={kg:p.kg,cm:p.cm,age:p.age,sex:ob.sex},r0=riskInput(p.kg),inp={...r0,age:p.age,sex:ob.sex,cm:p.cm,goalKg:p.goal,healthNote:obNote(),pregnant:ob.pg||r0.pregnant,nursing:ob.nu||r0.nursing,edFlag:ob.ed||r0.edFlag};
  const t=Algo.suggestTarget({...inp,tdee:Algo.formulaTdee({...q,act:obAct()}),bmr:Algo.bmrMifflin(q)});
  return {kcal:t.kcal,note:t.note,protein:Algo.protein(inp).range,risk:Algo.riskFlags(inp)};
}
function obView(){
  const st=ob.step,bad=k=>ob.bad===k?` aria-invalid="true" aria-describedby="oberr"`:"";
  const err=`<div class="ferr" id="oberr" role="alert">${esc(ob.err)}</div>`;
  /* The error text sits right under the faulty field, inside the card. */
  const fld=(k,lbl,val,small,mode)=>`<div class="field"><label for="ob${k}">${lbl}${small?`<small>${small}</small>`:""}</label><input id="ob${k}" type="text" inputmode="${mode}" value="${esc(val)}" autocomplete="off"${bad(k)}></div>${ob.bad===k?err:""}`;
  const seg=(attr,opts,sel)=>`<div class="seg2" role="group">${opts.map(([v,l])=>`<button data-ob="${attr}:${v}" aria-pressed="${sel===v}">${l}</button>`).join("")}</div>`;
  if(st<0&&!ob.minor)return `<div class="about"><img src="logo.svg" alt="" width="96" height="96"><h2 class="m0">NeoWell'e hoş geldin</h2><p class="tc mut m0">Yemek, su, hareket ve sağlık ölçümlerini tek yerde tut; hedefini sana göre hesaplayalım.</p></div>
  <p class="tc hint">Verilerin yalnızca bu telefonda durur.</p><div class="banner"><p>${NOTICE}</p></div><button class="btn" data-ob="next">Başla</button><button class="mt-2 btn ghost" data-obr="open">Yedeğim var</button><button class="mt-2 lnk" data-ob="skip">Şimdilik geç</button>`;
  /* Under 18: setup does not continue and the draft is gone; there is no skip or back, only correcting the age. */
  if(ob.minor)return `<h2>NeoWell 18 yaş ve üzeri için</h2><div class="card"><p>Büyüme çağında kalori ve kilo hedefleri farklıdır; bu uygulama onları hesaplamaz.</p><p>Beslenme, kilo ya da spor konusunda bir yetişkinle ve hekiminle ya da diyetisyeninle konuş.</p><p class="hint">Girdiğin bilgiler kaydedilmedi.</p></div><button class="btn ghost" data-ob="fixage">Yaşımı yanlış girdim</button>`;
  let body,next="Devam";
  if(st===0)body=`<h2>Seni tanıyalım</h2><p class="m0 mb-2 hint">Günlük kalori ve protein hedefini buna göre hesaplarız.</p><div class="card">
    ${fld("cm","Boy (cm)",ob.cm,"","numeric")}${fld("kg","Kilo (kg)",ob.kg,"","decimal")}${fld("age","Yaş",ob.age,"","numeric")}
    <div class="mt-3 lbl">Cinsiyet (isteğe bağlı)</div>${seg("sex",[["m","Erkek"],["f","Kadın"],["","Belirtmem"]],ob.sex)}
    <div class="mt-3 lbl">Hedefin</div>${seg("dir",OB_DIRS,ob.dir)}
    ${ob.dir!=="keep"?fld("goal","Hedef kilo (kg)",ob.goal,"","decimal"):""}
    <div class="mt-3 lbl">Gününü nasıl geçiriyorsun?</div>${seg("job",[["0","Oturarak"],["1","Ayakta"],["2","Fiziksel iş"]],ob.job)}
    <div class="mt-3 lbl">Günlük yürüyüşün</div>${seg("walk",[["0","5 bin adımdan az"],["1","5-9 bin"],["2","10 bin+"]],ob.walk)}
    <p class="hint">Planlı antrenmanı sayma, onu ayrıca kaydedersin. Kalori hedefin buna göre başlar; birkaç hafta kayıttan sonra gerçek harcamandan düzelir.</p>${ob.bad?"":err}</div>`;
  else if(st===1)body=`<h2>Hangileri açık olsun?</h2><div class="card"><p class="flush hint">Kapalı olanlar ekranında görünmez. İstediğini sonra Ayarlar'dan açarsın.</p>
    <div class="chips">${OB_MODS.map(([k,l,ic])=>`<button class="chip" data-ob="mod:${k}" aria-pressed="${ob.mods.includes(k)}">${Icons.svg(ic)} ${l}</button>`).join("")}</div>
    ${ob.mods.includes("steps")?`<p class="p0 hint">Adım sayar için telefon izni, Bugün ekranındaki "Adım sayarı aç" satırından istenir.</p>`:""}</div>
    <div class="card"><details class="acc"${ob.pg||ob.nu||ob.ed||ob.hn?" open":""}><summary>Sağlık notu ekle</summary><p class="hint flush">Önerilerin sana göre ihtiyatlı olması için. Hamilelik, yeme bozukluğu geçmişi, hekim kontrolü ya da ilaç varsa işaretle.</p>
    ${swRow('id="obpg"',ob.pg,"Hamileyim")}${swRow('id="obnu"',ob.nu,"Emziriyorum")}${swRow('id="obed"',ob.ed,"Yeme bozukluğu geçmişim var")}${swRow('id="obhn"',ob.hn,"Hekim kontrolündeyim ya da düzenli ilaç kullanıyorum")}</details></div>`;
  else{
    const p=obParse(),pl=obPlan(p);next="Başla";
    body=`<h2>Günlük hedefin</h2><div class="card"><div class="lbl">Kalori</div><div class="pc sumv num">${fint(pl.kcal)} <small>kcal</small></div>
    <div class="lbl">Protein</div><div class="t-h1 b7 num">${pl.protein?`${pl.protein[0]}–${pl.protein[1]} <small class="mut">g</small>`:"Hekiminle belirle"}</div><p class="p0 hint">${Algo.PROTEIN_NOTE}</p>
    <p class="hint">Verilerin yalnızca telefonunda durur. Rehber'i açarsan, yalnızca onayınla, seçtiğin yapay zekâ sağlayıcısına (yurt dışı) gider. Rehber olmadan da uygulama tam çalışır. ${MED_NOTE} <button class="wa ib lnk" data-pv="open">Gizlilik ve veri</button></p>
    ${pl.risk.block?riskBox(pl.risk,"Kalori açığı önermiyorum")+(p.goal>p.kg?"":`<p class="hint">Yukarıdaki değer kilonu koruma düzeyidir.</p>`):`<p class="hint">${pl.note==="Kilo verme"?"Yavaş ve güvenli kilo verme hızına göre":pl.note==="Kilo alma"?"Yavaş kilo alma hızına göre":"Kilonu koruma düzeyine göre"} hesaplandı. Kayıt girdikçe gerçek verine göre güncellenir. Tahmindir, tıbbi tavsiye değildir.</p>`}</div>
    ${AL()?`<div class="card">${swRow('id="oblk"',ob.lk,"Uygulama kilidi açılsın mı?","Uygulamayı açarken telefonun ekran kilidi (parmak izi, yüz, PIN, desen) sorulur. Sonra Ayarlar'dan değiştirirsin.")}</div>`:""}`;
  }
  const dots=`<div class="obp" role="status"><span class="mut sm">Adım ${st+1}/3</span><span class="obbar" aria-hidden="true">${[0,1,2].map(i=>`<i${i<=st?' class="on"':""}></i>`).join("")}</span></div>`;
  return `<div class="row">${dots}<button class="lnk wa" data-ob="skip">Şimdilik geç</button></div>${body}
  <div class="two" style="display:grid;grid-template-columns:${st?"1fr 2fr":"1fr"};gap:10px">${st?`<button class="btn ghost" data-ob="back">Geri</button>`:""}<button class="btn" data-ob="next">${next}</button></div>`;
}
function obDone(){Object.assign(ob,obFresh());S.settings.obDone=S.settings.noticeOk=true;tab="today";logOff=0;save();render();window.scrollTo(0,0)}
function obFinish(){
  const p=obParse();if(p.err)return;
  const st=S.settings,pl=obPlan(p),mods=ob.mods,lock=ob.lk;
  if(ob.job!==""&&ob.walk!=="")st.act=obAct();
  Object.assign(st,{heightCm:p.cm,age:p.age,sex:ob.sex,goalKg:p.goal,medOn:mods.includes("med"),fastOn:mods.includes("fast"),bpOn:mods.includes("bp"),bsOn:mods.includes("bs")});
  if(pl.kcal>=RANGES.kcal[0]&&pl.kcal<=RANGES.kcal[1])st.kcal=pl.kcal;
  if(ob.pg)setRisk("preg");if(ob.nu)setRisk("nurs");if(ob.ed)setRisk("ed");
  if(ob.hn){st.healthNote=obNote();cNoteCheck()}
  if(!mods.includes("steps"))st.stepsAsked=true;
  add("weight",p.kg);
  obDone();scheduleReminders().then(setNotif);
  if(lock)lockEnable().then(e=>{if(e)toast(e);else render()});
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-ob]");if(!el)return;
  const [a,v]=el.dataset.ob.split(":");
  obRead();
  if(a==="fixage"){Object.assign(ob,obFresh(),{step:0});return render()}
  if(ob.minor)return;
  if(a==="skip"){obDone();scheduleReminders().then(setNotif);return}
  if(ob.step<0){ob.step=0;return render()}
  if(a==="back"){ob.step--;ob.err=ob.bad="";return render()}
  if(a==="sex"||a==="dir"||a==="job"||a==="walk"){ob[a]=v;ob.err=ob.bad="";return render()}
  if(a==="mod"){ob.mods=ob.mods.includes(v)?ob.mods.filter(x=>x!==v):ob.mods.concat(v);return render()}
  if(ob.step===0){
    const p=obParse();
    if(p.minor){Object.assign(ob,obFresh(),{minor:true});return render()}
    ob.err=p.err||"";ob.bad=p.bad||"";
    if(p.err){render();const f=$("#ob"+p.bad);if(f)f.focus();return}
    if(Algo.lbSuspect(p.kg,p.cm)&&ob.kgOk!==ob.kg){ob.kgOk=ob.kg;ob.err=`${fmt(p.kg)} kg çok yüksek görünüyor. Libre (lb) yazmış olabilirsin: ${fmt(p.kg)} lb ≈ ${fmt(p.kg*0.45359237)} kg. Doğruysa Devam'a bir kez daha dokun.`;ob.bad="kg";render();$("#obkg").focus();return}
    ob.step=1;return render();
  }
  if(ob.step===1){ob.step=2;return render()}
  obFinish();
});
document.addEventListener("keydown",ev=>{
  if(ev.key==="Enter"&&ev.target.closest("#view")&&ev.target.id.startsWith("ob")&&ev.target.tagName==="INPUT"){const b=$('[data-ob="next"]');if(b)b.click()}
});
