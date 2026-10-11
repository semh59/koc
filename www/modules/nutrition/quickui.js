"use strict";
/* Food sheet > "Birden çok yemek yaz": one text box, a preview you can correct, and one add with one undo. Nothing is saved before "Hepsini ekle". */
let qkSt=null;
const quickBtn=()=>`<button class="btn ghost" data-qk="open">Birden çok yemek yaz</button>`;
const qkR=r=>r.miss?null:QuickLib.calc(qkSt.list[r.f],r,NUTR);
function qkInput(){
  openSheet(`<h3>Birden çok yemek yaz</h3>
  <label class="lbl" for="qkt">Ne yedin? Virgülle ayırarak yaz</label>
  <textarea class="in" id="qkt" rows="4" maxlength="600" placeholder="2 dilim ekmek, 1 çay bardağı çay, yarım simit, 200 g tavuk" autocomplete="off">${esc(qkSt.text)}</textarea>
  <p class="hint">Ölçüyü yalnız besinin kendi ölçüleriyle (dilim, adet, porsiyon…) ya da gramla anlarım. Yazdıklarını önce göstereceğim, sen onaylamadan hiçbir şey kaydedilmez. Klavyedeki mikrofonla söylersen sesi telefonunun klavyesi işler; NeoWell ses almaz.</p>
  <div class="btns"><button class="btn" data-qk="prep">Hazırla</button><button class="btn ghost" data-qk="close">Vazgeç</button></div>`);
}
function qkKeep(){const m=typeof fmeal==="function"?fmeal():undefined,d=document.getElementById("fday");if(m)qkSt.meal=m;if(d)qkSt.day=d.value}
function qkPreview(){
  const s=qkSt,rows=s.rows,ok=rows.filter(r=>!r.miss),open=ok.some(r=>r.flag&&!s.ack.has(r)),tot=ok.reduce((a,r)=>a+qkR(r).k,0);
  const line=(r,i)=>{
    if(r.miss)return `<div class="prow"><span class="grow"><b>${esc(r.text)}</b><span class="mut sm">Besin bulunamadı, eklenmez</span></span><button class="del" data-qk="rm:${i}" aria-label="Satırı kaldır">✕</button></div>`;
    const f=s.list[r.f],c=qkR(r),alt=r.hits.map((h,k)=>k).filter(k=>k!==r.k).slice(0,3);
    return `<div class="prow wrap"><span class="grow"><b>${esc(QuickLib.label(f,r))}</b><span class="mut sm num">${Math.round(c.k)} kcal${r.grams==null?` · ${Math.round(c.g)} g`:""}</span>
      ${r.flag==="unit"&&!s.ack.has(r)?`<span class="sm">Yazdığın ölçü bu besinin ölçülerinde yok; 1 ${esc(f.u[r.por][0])} varsaydım.</span>`:""}
      ${r.flag==="qty"?`<span class="sm">Miktar 0,1-${QuickLib.MAX_Q} arasında olmalı; 1 varsaydım.</span>`:""}</span><button class="del" data-qk="rm:${i}" aria-label="Satırı kaldır">✕</button>
      <span class="chips">${f.u.length>1?f.u.map((u,j)=>`<button class="chip" data-qk="por:${i}:${j}" aria-pressed="${r.grams==null&&j===r.por}">${esc(u[0])}</button>`).join(""):""}${alt.map(k=>`<button class="chip" data-qk="alt:${i}:${k}">${esc(s.list[r.hits[k]].n)}</button>`).join("")}${r.flag==="unit"&&!s.ack.has(r)?`<button class="chip" data-qk="ack:${i}">Tamam</button>`:""}</span></div>`;
  };
  openSheet(`<h3>Bunları ekleyeyim mi?</h3>${rows.map(line).join("")}
  <div class="row"><span>Toplam</span><b class="num">${Math.round(tot)} kcal</b></div>${mealChips()}${dayOptions(true)}
  ${open?`<p class="hint">Ölçüsü anlaşılmayan satırlarda "Tamam"a dokun ya da doğru ölçüyü seç.</p>`:""}
  <div class="btns"><button class="btn" data-qk="add" ${ok.length&&!open?"":"disabled"}>Hepsini ekle (${ok.length})</button><button class="btn ghost" data-qk="back">Yazıya dön</button></div>`);
  if(s.meal)document.querySelectorAll("#fml .chip").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.ml===s.meal)));
  const d=document.getElementById("fday");if(d&&s.day)d.value=s.day;
}
function qkAdd(){
  qkKeep();const s=qkSt,items=s.rows.filter(r=>!r.miss).map(r=>{
    const f=s.list[r.f],c=qkR(r),it={v:Math.round(c.k),text:QuickLib.label(f,r),meal:s.meal};
    for(const k of NUTR)if(c[k]!=null)it[k]=Math.round(c[k]*10)/10;
    if(c.lo!=null){it.lo=Math.round(c.lo);it.hi=Math.round(c.hi)}
    return it;
  });
  const day=s.day||dayKey();qkSt=null;
  addFoods(items,day,`${items.length} yemek eklendi`);
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-qk]");if(!el)return;
  const [a,i,j]=el.dataset.qk.split(":"),s=qkSt;
  if(a==="open"){qkSt={text:"",list:allFoods(),rows:[],ack:new Set()};qkInput();return}
  if(!s)return;
  if(a==="close"){qkSt=null;closeSheet()}
  else if(a==="prep"){
    s.text=document.getElementById("qkt").value;s.rows=QuickLib.parse(s.text,s.list);s.ack=new Set();
    if(!s.rows.length)return toast("Yemek bulunamadı, yazıp tekrar dene");
    qkPreview();
  }
  else if(a==="back")qkInput();
  else{
    qkKeep();const r=s.rows[+i];
    if(a==="rm")s.rows.splice(+i,1);
    else if(a==="ack")s.ack.add(r);
    else if(a==="por"){r.por=+j;r.grams=null;s.ack.add(r)}
    else if(a==="alt"){const n=QuickLib.pick(r.text,r.p,r.hits,+j,s.list);s.rows[+i]=n}
    else if(a==="add")return qkAdd();
    if(!s.rows.length)return qkInput();
    qkPreview();
  }
});
