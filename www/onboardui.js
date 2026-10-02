"use strict";
/* İlk açılış: 3 adım. Girdiler mevcut profil ve ayar alanlarına yazılır; taslak yalnızca bellekte durur. */
const obFresh=()=>({step:0,kg:"",cm:"",age:"",sex:"",dir:"koru",goal:"",hn:false,mods:[],err:"",bad:""});
const ob=obFresh();
const OB_MODS=[["med","💊 İlaç hatırlatıcı"],["fast","⏳ Oruç takibi"],["steps","👣 Adım sayar"],["bp","❤️ Tansiyon"],["bs","🩸 Şeker"]];
const OB_DIRS=[["ver","Kilo ver"],["koru","Koru"],["al","Kilo al"]];
/* Eski kullanıcıya hiç gösterilmez: bayrak, profil, kayıt, sohbet ya da ilaç varsa atlanır. */
const obNeeded=()=>{const s=S.settings;return !s.obDone&&!s.heightCm&&!s.age&&!s.goalKg&&!s.kcal&&!s.consent&&!S.entries.length&&!S.chat.length&&!S.meds.length};

function obRead(){
  for(const k of ["cm","kg","age","goal"]){const f=$("#ob"+k);if(f)ob[k]=f.value.trim()}
  const h=$("#obhn");if(h)ob.hn=h.checked;
}
/* Doğrulanmış sayılar ya da hata; hata alanın altında yazılır ve alan aria-invalid olur. */
function obParse(){
  const o={};
  for(const [k,lbl,lo,hi,int] of [["cm","Boy",...RANGES.heightCm],["kg","Kilo",20,400,false],["age","Yaş",...RANGES.age]]){
    const v=num(ob[k],int);
    if(isNaN(v)||v<lo||v>hi)return {err:`${lbl} ${lo} ile ${hi} arasında olmalı`,bad:k};
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
function obPlan(p){
  const health=ob.hn||!!S.settings.healthNote.trim(),sex=ob.sex,q={kg:p.kg,cm:p.cm,age:p.age,sex};
  const t=Algo.suggestTarget({tdee:Algo.formulaTdee({...q,act:S.settings.act}),kg:p.kg,goalKg:p.goal,bmr:Algo.bmrMifflin(q),age:p.age,cm:p.cm,health});
  return {kcal:t.kcal,note:t.note,protein:Algo.proteinRange(p.kg),blocked:Algo.lossBlock({age:p.age,cm:p.cm,kg:p.kg,goalKg:p.goal,health})};
}
function obView(){
  const st=ob.step,bad=k=>ob.bad===k?` aria-invalid="true" aria-describedby="oberr"`:"";
  const fld=(k,lbl,val,small,mode)=>`<div class="field"><label for="ob${k}">${lbl}${small?`<small>${small}</small>`:""}</label><input id="ob${k}" type="text" inputmode="${mode}" value="${esc(val)}" autocomplete="off"${bad(k)}></div>`;
  const seg=(attr,opts,sel)=>`<div class="seg2" role="group">${opts.map(([v,l])=>`<button data-ob="${attr}:${v}" aria-pressed="${sel===v}">${l}</button>`).join("")}</div>`;
  const err=`<div class="ferr" id="oberr" role="alert">${esc(ob.err)}</div>`;
  let body,next="Devam";
  if(st===0)body=`<h2>Seni tanıyalım</h2><div class="card">
    ${fld("cm","Boy (cm)",ob.cm,"","numeric")}${fld("kg","Kilo (kg)",ob.kg,"","decimal")}${fld("age","Yaş",ob.age,"","numeric")}
    <div class="lbl" style="margin-top:10px">Cinsiyet (isteğe bağlı)</div>${seg("sex",[["m","Erkek"],["f","Kadın"],["","Belirtmem"]],ob.sex)}
    <div class="lbl" style="margin-top:10px">Hedefin</div>${seg("dir",OB_DIRS,ob.dir)}
    ${ob.dir!=="koru"?fld("goal","Hedef kilo (kg)",ob.goal,"","decimal"):""}
    <label class="chkrow" style="margin-top:6px"><input type="checkbox" id="obhn" ${ob.hn?"checked":""}>Hamileyim, yeme bozukluğu geçmişim var ya da hekim kontrolündeyim</label></div>${err}`;
  else if(st===1)body=`<h2>Hangileri açık olsun?</h2><div class="card"><p class="hint" style="padding:0 0 8px">Kapalı olanlar ekranında görünmez. İstediğini sonra Ayarlar'dan açarsın.</p>
    <div class="chips">${OB_MODS.map(([k,l])=>`<button class="chip" data-ob="mod:${k}" aria-pressed="${ob.mods.includes(k)}">${l}</button>`).join("")}</div>
    ${ob.mods.includes("steps")?`<p class="hint" style="padding:0">Adım sayar için telefon izni, Bugün ekranındaki "Adım sayarı aç" satırından istenir.</p>`:""}</div>`;
  else{
    const p=obParse(),pl=obPlan(p);next="Başla";
    body=`<h2>Günlük hedefin</h2><div class="card"><div class="lbl">Kalori</div><div class="sumv num">${pl.kcal.toLocaleString("tr-TR")} <small>kcal</small></div>
    <div class="lbl">Protein</div><div class="num" style="font-size:22px;font-weight:700">${pl.protein[0]}–${pl.protein[1]} <small class="mut">g</small></div>
    <p class="hint">Verilerin yalnızca telefonunda durur. Koç'u açarsan, yalnızca onayınla, seçtiğin yapay zekâ sağlayıcısına (yurt dışı) gider. Koç olmadan da uygulama tam çalışır. ${MED_NOTE} <button class="lnk" style="display:inline-block;width:auto" data-pv="open">Gizlilik ve veri</button></p>
    ${pl.blocked?`<div class="banner" style="margin:12px 0 0"><b>Kalori açığı önermiyorum</b><p>${esc(pl.blocked)}. ${/hekim/.test(pl.blocked)?"":"Hekimine ya da diyetisyenine danış. "}Yukarıdaki değer kilonu koruma düzeyidir.</p></div>`:`<p class="hint">${pl.note==="Kilo verme"?"Yavaş ve güvenli kilo verme hızına göre":pl.note==="Kilo alma"?"Yavaş kilo alma hızına göre":"Kilonu koruma düzeyine göre"} hesaplandı. Kayıt girdikçe gerçek verine göre güncellenir. Tahmindir, tıbbi tavsiye değildir.</p>`}</div>`;
  }
  const dots=`<div class="hint" role="status" style="padding:0 4px 4px">Adım ${st+1}/3</div>`;
  return `<div class="row" style="display:flex;justify-content:space-between;align-items:center">${dots}<button class="lnk" style="width:auto;padding:0 8px" data-ob="skip">Şimdilik geç</button></div>${body}
  <div class="two" style="display:grid;grid-template-columns:${st?"1fr 2fr":"1fr"};gap:10px">${st?`<button class="btn ghost" data-ob="back">Geri</button>`:""}<button class="btn" data-ob="next">${next}</button></div>`;
}
function obDone(){Object.assign(ob,obFresh());S.settings.obDone=true;tab="bugun";logOff=0;save();render();window.scrollTo(0,0)}
function obFinish(){
  const p=obParse();if(p.err)return;
  const st=S.settings,pl=obPlan(p),mods=ob.mods;
  Object.assign(st,{heightCm:p.cm,age:p.age,sex:ob.sex,goalKg:p.goal,medOn:mods.includes("med"),fastOn:mods.includes("fast"),bpOn:mods.includes("bp"),bsOn:mods.includes("bs")});
  if(pl.kcal>=RANGES.kcal[0]&&pl.kcal<=RANGES.kcal[1])st.kcal=pl.kcal;
  if(ob.hn&&!st.healthNote)st.healthNote="Hamilelik, yeme bozukluğu geçmişi ya da hekim kontrolü (ilk kurulumda işaretlendi)";
  if(!mods.includes("steps"))st.stepsAsked=true;
  add("kilo",p.kg);
  obDone();scheduleReminders().then(setNotif);
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-ob]");if(!el)return;
  const [a,v]=el.dataset.ob.split(":");
  obRead();
  if(a==="skip")return obDone();
  if(a==="back"){ob.step--;ob.err=ob.bad="";return render()}
  if(a==="sex"||a==="dir"){ob[a]=v;ob.err=ob.bad="";return render()}
  if(a==="mod"){ob.mods=ob.mods.includes(v)?ob.mods.filter(x=>x!==v):ob.mods.concat(v);return render()}
  if(ob.step===0){
    const p=obParse();ob.err=p.err||"";ob.bad=p.bad||"";
    if(p.err){render();const f=$("#ob"+p.bad);if(f)f.focus();return}
    ob.step=1;return render();
  }
  if(ob.step===1){ob.step=2;return render()}
  obFinish();
});
document.addEventListener("keydown",ev=>{
  if(ev.key==="Enter"&&ev.target.closest("#view")&&ev.target.id.startsWith("ob")&&ev.target.tagName==="INPUT"){const b=$('[data-ob="next"]');if(b)b.click()}
});
