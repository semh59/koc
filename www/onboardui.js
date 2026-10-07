"use strict";
/* İlk açılış: 3 adım. Girdiler mevcut profil ve ayar alanlarına yazılır; taslak yalnızca bellekte durur. */
const obFresh=()=>({step:0,kg:"",cm:"",age:"",sex:"",dir:"koru",goal:"",hd:false,hn:false,mods:[],err:"",bad:"",minor:false,kgOk:""});
const ob=obFresh();
const OB_MODS=[["med","İlaç hatırlatıcı","ilac"],["fast","Oruç takibi","fast"],["steps","Adım sayar","adim"],["bp","Tansiyon","heart"],["bs","Şeker","su"]];
const OB_DIRS=[["ver","Kilo ver"],["koru","Koru"],["al","Kilo al"]];
/* Eski kullanıcıya hiç gösterilmez: bayrak, profil, kayıt, sohbet ya da ilaç varsa atlanır. */
const obNeeded=()=>{const s=S.settings;return !s.obDone&&!s.heightCm&&!s.age&&!s.goalKg&&!s.kcal&&!s.consent&&!S.entries.length&&!S.chat.length&&!S.meds.length};

function obRead(){
  for(const k of ["cm","kg","age","goal"]){const f=$("#ob"+k);if(f)ob[k]=f.value.trim()}
  for(const k of ["hd","hn"]){const h=$("#ob"+k);if(h)ob[k]=h.checked}
}
/* Doğrulanmış sayılar ya da hata; hata alanın altında yazılır ve alan aria-invalid olur. */
function obParse(){
  const o={};
  for(const [k,lbl,lo,hi,int] of [["cm","Boy",...RANGES.heightCm],["kg","Kilo",20,400,false],["age","Yaş",...RANGES.age]]){
    const v=num(ob[k],int);
    if(k==="age"&&v>0&&v<18)return {minor:true};
    if(isNaN(v)||v<lo||v>hi)return {err:`${lbl} ${lo} ile ${hi} arasında${int?" tam sayı":""} olmalı`,bad:k};
    o[k]=v;
  }
  o.goal=0;
  if(ob.dir!=="koru"){
    const g=num(ob.goal,false),ver=ob.dir==="ver";
    if(isNaN(g)||g<20||g>400)return {err:"Hedef kilo 20 ile 400 arasında olmalı",bad:"goal"};
    if(ver?g>=o.kg:g<=o.kg)return {err:`Hedef kilo şimdiki kilodan ${ver?"düşük":"yüksek"} olmalı`,bad:"goal"};
    o.goal=g;
  }
  return o;
}
/* İşaretler sağlık notuna yazılır; ilki riskFlags'ta sert (hamilelik), ikincisi yumuşak sayılır. */
const OB_HD="İlk kurulumda işaretlendi: hamilelik, emzirme ya da yeme bozukluğu geçmişi",OB_HN="İlk kurulumda işaretlendi: hekim kontrolü ya da düzenli ilaç";
const obNote=()=>[S.settings.healthNote,ob.hd&&OB_HD,ob.hn&&OB_HN].filter(Boolean).join(". ").slice(0,500);
function obPlan(p){
  const q={kg:p.kg,cm:p.cm,age:p.age,sex:ob.sex},inp={...riskInput(p.kg),age:p.age,sex:ob.sex,cm:p.cm,goalKg:p.goal,healthNote:obNote()};
  const t=Algo.suggestTarget({...inp,tdee:Algo.formulaTdee({...q,act:S.settings.act}),bmr:Algo.bmrMifflin(q)});
  return {kcal:t.kcal,note:t.note,protein:Algo.protein(inp).range,risk:Algo.riskFlags(inp)};
}
function obView(){
  const st=ob.step,bad=k=>ob.bad===k?` aria-invalid="true" aria-describedby="oberr"`:"";
  const fld=(k,lbl,val,small,mode)=>`<div class="field"><label for="ob${k}">${lbl}${small?`<small>${small}</small>`:""}</label><input id="ob${k}" type="text" inputmode="${mode}" value="${esc(val)}" autocomplete="off"${bad(k)}></div>`;
  const seg=(attr,opts,sel)=>`<div class="seg2" role="group">${opts.map(([v,l])=>`<button data-ob="${attr}:${v}" aria-pressed="${sel===v}">${l}</button>`).join("")}</div>`;
  const err=`<div class="ferr" id="oberr" role="alert">${esc(ob.err)}</div>`;
  /* 18 yaş altı: kurulum ilerlemez, taslak silinmiştir; geçme ve geri yolu yok, yalnız yaşı düzeltme. */
  if(ob.minor)return `<h2>NeoWell 18 yaş ve üzeri için</h2><div class="card"><p>Büyüme çağında kalori ve kilo hedefleri farklıdır; bu uygulama onları hesaplamaz.</p><p>Beslenme, kilo ya da spor konusunda bir yetişkinle ve hekiminle ya da diyetisyeninle konuş.</p><p class="hint">Girdiğin bilgiler kaydedilmedi.</p></div><button class="btn ghost" data-ob="fixage">Yaşımı yanlış girdim</button>`;
  let body,next="Devam";
  if(st===0)body=`<h2>Seni tanıyalım</h2><p class="hint" style="margin:-6px 0 10px">Günlük kalori ve protein hedefini buna göre hesaplarız.</p><div class="card">
    ${fld("cm","Boy (cm)",ob.cm,"","numeric")}${fld("kg","Kilo (kg)",ob.kg,"","decimal")}${fld("age","Yaş",ob.age,"","numeric")}
    <div class="lbl" style="margin-top:10px">Cinsiyet (isteğe bağlı)</div>${seg("sex",[["m","Erkek"],["f","Kadın"],["","Belirtmem"]],ob.sex)}
    <div class="lbl" style="margin-top:10px">Hedefin</div>${seg("dir",OB_DIRS,ob.dir)}
    ${ob.dir!=="koru"?fld("goal","Hedef kilo (kg)",ob.goal,"","decimal"):""}</div>${err}`;
  else if(st===1)body=`<h2>Hangileri açık olsun?</h2><div class="card"><p class="hint" style="padding:0 0 8px">Kapalı olanlar ekranında görünmez. İstediğini sonra Ayarlar'dan açarsın.</p>
    <div class="chips">${OB_MODS.map(([k,l,ic])=>`<button class="chip" data-ob="mod:${k}" aria-pressed="${ob.mods.includes(k)}">${Icons.svg(ic)} ${l}</button>`).join("")}</div>
    ${ob.mods.includes("steps")?`<p class="hint" style="padding:0">Adım sayar için telefon izni, Bugün ekranındaki "Adım sayarı aç" satırından istenir.</p>`:""}</div>
    <div class="card"><details class="more"${ob.hd||ob.hn?" open":""}><summary>Sağlık notu ekle</summary><p class="hint" style="padding:0 0 4px">Önerilerin sana göre ihtiyatlı olması için. Hamilelik, yeme bozukluğu geçmişi, hekim kontrolü ya da ilaç varsa işaretle.</p>
    ${swRow('id="obhd"',ob.hd,"Hamileyim, emziriyorum ya da yeme bozukluğu geçmişim var")}${swRow('id="obhn"',ob.hn,"Hekim kontrolündeyim ya da düzenli ilaç kullanıyorum")}</details></div>`;
  else{
    const p=obParse(),pl=obPlan(p);next="Başla";
    body=`<h2>Günlük hedefin</h2><div class="card"><div class="lbl">Kalori</div><div class="sumv num" style="color:var(--prim)">${pl.kcal.toLocaleString("tr-TR")} <small>kcal</small></div>
    <div class="lbl">Protein</div><div class="num" style="font-size:22px;font-weight:700">${pl.protein?`${pl.protein[0]}–${pl.protein[1]} <small class="mut">g</small>`:"Hekiminle belirle"}</div><p class="hint" style="padding:0">${Algo.PROTEIN_NOTE}</p>
    <p class="hint">Verilerin yalnızca telefonunda durur. Koç'u açarsan, yalnızca onayınla, seçtiğin yapay zekâ sağlayıcısına (yurt dışı) gider. Koç olmadan da uygulama tam çalışır. ${MED_NOTE} <button class="lnk" style="display:inline-block;width:auto" data-pv="open">Gizlilik ve veri</button></p>
    ${pl.risk.block?riskBox(pl.risk,"Kalori açığı önermiyorum")+(p.goal>p.kg?"":`<p class="hint">Yukarıdaki değer kilonu koruma düzeyidir.</p>`):`<p class="hint">${pl.note==="Kilo verme"?"Yavaş ve güvenli kilo verme hızına göre":pl.note==="Kilo alma"?"Yavaş kilo alma hızına göre":"Kilonu koruma düzeyine göre"} hesaplandı. Kayıt girdikçe gerçek verine göre güncellenir. Tahmindir, tıbbi tavsiye değildir.</p>`}</div>`;
  }
  const dots=`<div class="obp" role="status"><span class="mut sm">Adım ${st+1}/3</span><span class="obbar" aria-hidden="true">${[0,1,2].map(i=>`<i${i<=st?' class="on"':""}></i>`).join("")}</span></div>`;
  return `<div class="row" style="display:flex;justify-content:space-between;align-items:center;gap:16px">${dots}<button class="lnk" style="width:auto;padding:0 8px" data-ob="skip">Şimdilik geç</button></div>${body}
  <div class="two" style="display:grid;grid-template-columns:${st?"1fr 2fr":"1fr"};gap:10px">${st?`<button class="btn ghost" data-ob="back">Geri</button>`:""}<button class="btn" data-ob="next">${next}</button></div>`;
}
function obDone(){Object.assign(ob,obFresh());S.settings.obDone=true;tab="bugun";logOff=0;save();render();window.scrollTo(0,0)}
function obFinish(){
  const p=obParse();if(p.err)return;
  const st=S.settings,pl=obPlan(p),mods=ob.mods;
  Object.assign(st,{heightCm:p.cm,age:p.age,sex:ob.sex,goalKg:p.goal,medOn:mods.includes("med"),fastOn:mods.includes("fast"),bpOn:mods.includes("bp"),bsOn:mods.includes("bs")});
  if(pl.kcal>=RANGES.kcal[0]&&pl.kcal<=RANGES.kcal[1])st.kcal=pl.kcal;
  if(ob.hd||ob.hn){st.healthNote=obNote();cNoteCheck()}
  if(!mods.includes("steps"))st.stepsAsked=true;
  add("kilo",p.kg);
  obDone();scheduleReminders().then(setNotif);
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-ob]");if(!el)return;
  const [a,v]=el.dataset.ob.split(":");
  obRead();
  if(a==="fixage"){Object.assign(ob,obFresh());return render()}
  if(ob.minor)return;
  if(a==="skip")return obDone();
  if(a==="back"){ob.step--;ob.err=ob.bad="";return render()}
  if(a==="sex"||a==="dir"){ob[a]=v;ob.err=ob.bad="";return render()}
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
