"use strict";
/* My recipes: ingredients are entered in grams; a recipe lives in S.recipes and enters the food search as a single food (allFoods). */
const {RECIPES_MAX,RECIPE_ITEMS_MAX}=LogLib;
let recipeDraft=null,recipeHits=[]; // recipe being edited; ingredient search results
const rpFmt=x=>fmt(x,x<10?1:0);
const newRecipeId=()=>Math.max(0,...S.recipes.map(x=>x.id))+1;
function recipeListHtml(){
  if(!S.recipes.length)return "";
  return `<div class="lbl">Tariflerim</div>${S.recipes.map(r=>{const f=LogLib.recipeFood(r);return `<div class="prow"><button class="grow pbtn" data-rp="add:${r.id}"><span class="grow"><b>${esc(r.n)}</b><span class="mut sm">1 porsiyon: ${Math.round(f.k*f.u[0][1]/100)} kcal</span></span></button><button class="plus" data-rp="edit:${r.id}" aria-label="${esc(r.n)} tarifini düzenle">${Icons.svg("note")}</button></div>`}).join("")}`;
}
function rpRows(){
  return recipeDraft.items.map((it,i)=>`<div class="prow"><span class="grow"><b>${esc(it.n)}</b><span class="mut sm">${it.por?"1 porsiyon":"100 g"}: ${Math.round(it.k)} kcal</span></span><input class="in num rgin" data-rg="${i}" inputmode="decimal" aria-label="${esc(it.n)} ${it.por?"porsiyon":"gram"}" value="${it.por?(it.g?it.g/100:""):it.g||""}"><span class="mut">${it.por?"porsiyon":"g"}</span><button class="del" data-rp="rm:${i}" aria-label="${esc(it.n)} malzemesini çıkar">✕</button></div>`).join("")||`<p class="mut sm">Malzemeleri aşağıdan arayıp ekle.</p>`;
}
function rpSum(){
  const ok=recipeDraft.items.filter(i=>i.g>0),c=LogLib.recipeCalc({items:ok}),s=Math.round(num($("#rs").value))||1;
  const total=[`${Math.round(c.tot.k)} kcal`,...NUTR.map(m=>c.tot[m]!=null&&`${NLBL[m]} ${rpFmt(c.tot[m])} ${NUNIT(m)}`)].filter(Boolean).join(" · ");
  const per={k:c.tot.k/s};for(const m of NUTR)per[m]=c.tot[m]==null?null:c.tot[m]/s;
  const ap=recipeDraft.items.some(i=>i.por);
  $("#rsum").innerHTML=ok.length?`<div class="lbl">Porsiyon başı (${s} porsiyon${ap?"":`, ${Math.round(c.g/s)} g`})</div>${nutrBlock(per)}<div class="mt-2 lbl">Tarifin tamamı${ap?"":` (${Math.round(c.g)} g)`}</div><p class="m0 sm num">${total}</p>`:`<p class="m0 hint">Malzeme ve gram girince değerler burada görünür.</p>`;
  $("#rnote").textContent=ok.length?LogLib.recipeNote(c):"Çiğ ağırlıklarla hesaplanır, pişince değişir; tahmindir.";
}
function rpRead(){if(!recipeDraft)return;recipeDraft.n=$("#rn").value;recipeDraft.s=$("#rs").value}
function sheetRecipe(r){
  recipeDraft=r?{id:r.id,n:r.n,s:r.s,items:r.items.map(i=>({...i}))}:{id:null,n:"",s:4,items:[]};recipeHits=[];
  openSheet(`<h3>${r?"Tarifi düzenle":"Tarif oluştur"}</h3>
  <label class="lbl" for="rn">Tarif adı</label><input class="in" id="rn" maxlength="60" autocomplete="off" value="${esc(recipeDraft.n)}" placeholder="Örneğin mercimek köftesi">
  <label class="lbl" for="rs">Kaç porsiyon çıkar</label><input class="in num" id="rs" inputmode="numeric" autocomplete="off" value="${recipeDraft.s}">
  <div class="lbl">Malzemeler (gram)</div><div id="rrows">${rpRows()}</div>
  <label class="lbl" for="rq">Malzeme ekle</label><input class="in" id="rq" type="search" enterkeyhint="search" aria-label="Malzeme ara" placeholder="Un, yumurta, süt…" autocomplete="off"><div id="rlist" class="plist"></div>
  <div class="my-2" id="rsum" aria-live="polite"></div><div class="mb-2 mut sm" id="rnote"></div>
  <div class="ferr" id="rerr" role="alert"></div><button class="btn" data-rp="save">Kaydet</button>${r?`<div class="two"><button class="btn ghost" data-rp="dup">Çoğalt</button><button class="btn danger" data-rp="del">Sil</button></div>`:""}`);
  rpSum();
}
function rpSave(){
  rpRead();
  const err=m=>ferr("rerr",m),n=recipeDraft.n.trim(),s=num(recipeDraft.s,true);
  if(!n)return err("Tarife bir ad yaz");
  if(!recipeDraft.items.length)return err("En az bir malzeme ekle");
  if(!recipeDraft.items.every(i=>i.g>=0.05&&i.g<=5000))return err("Her malzemenin gramı 0,1 ile 5000 arasında olmalı");
  if(!(s>=1&&s<=50))return err("Porsiyon sayısı 1 ile 50 arasında olmalı");
  if(S.recipes.some(x=>x.id!==recipeDraft.id&&LogLib.key(x.n)===LogLib.key(n)))return err("Bu adda bir tarifin var");
  if(recipeDraft.id==null&&S.recipes.length>=RECIPES_MAX)return err(`En fazla ${RECIPES_MAX} tarif olur`);
  const id=recipeDraft.id??newRecipeId(),r=LogLib.cleanRecipes([{id,n,s,items:recipeDraft.items}])[0];
  S.recipes=recipeDraft.id==null?[...S.recipes,r]:S.recipes.map(x=>x.id===id?r:x);
  save();closeSheet();render();toast(`"${r.n}" tarifi kaydedildi`);
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-rp]");if(!el)return;
  const [a,p]=el.dataset.rp.split(":"),r=S.recipes.find(x=>x.id===+p);
  if(a==="new")sheetRecipe();
  else if(a==="edit"&&r)sheetRecipe(r);
  else if(a==="add"&&r)sheetPortion(0,LogLib.recipeFood(r));
  else if(a==="save")rpSave();
  else if(a==="rm"){rpRead();recipeDraft.items.splice(+p,1);$("#rrows").innerHTML=rpRows();rpSum()}
  else if(a==="pick"){
    const f=recipeHits[+p];rpRead();if(!f)return;
    if(recipeDraft.items.length>=RECIPE_ITEMS_MAX)return ferr("rerr",`Bir tarifte en fazla ${RECIPE_ITEMS_MAX} malzeme olur`);
    const it=LogLib.recipeItem({...f,g:f.por?100:Math.min(5000,Math.round(f.u[0][1]))});
    if(it){recipeDraft.items.push(it);$("#rrows").innerHTML=rpRows();$("#rq").value="";$("#rlist").innerHTML="";rpSum()}
  }else if(a==="dup"&&recipeDraft.id!=null){
    rpRead();
    if(S.recipes.length>=RECIPES_MAX)return ferr("rerr",`En fazla ${RECIPES_MAX} tarif olur`);
    const base=recipeDraft.n.trim().slice(0,52);let n=`${base} (kopya)`,i=2;
    while(S.recipes.some(x=>LogLib.key(x.n)===LogLib.key(n)))n=`${base} (kopya ${i++})`;
    const c=LogLib.cleanRecipes([{id:newRecipeId(),n,s:num(recipeDraft.s,true),items:recipeDraft.items}])[0];
    if(!c)return ferr("rerr","Önce malzemelerin gramını düzelt");
    S.recipes.push(c);save();render();sheetRecipe(c);toast("Tarif çoğaltıldı");
  }else if(a==="del"&&recipeDraft.id!=null){
    const id=recipeDraft.id;confirmSheet({title:"Tarif silinsin mi?",body:"Tarif silinsin mi? Günlükteki kayıtların değişmez.",ok:"Sil",danger:true}).then(ok=>{if(ok){S.recipes=S.recipes.filter(x=>x.id!==id);save();closeSheet();render();toast("Tarif silindi")}});
  }
});
document.addEventListener("input",ev=>{
  const t=ev.target;
  if(t.id==="rq"){
    const q=t.value.trim(),all=allFoods();recipeHits=q?foodSearch(q,6,all).map(i=>all[i]):[];
    $("#rlist").innerHTML=recipeHits.map((f,i)=>`<button class="prow" data-rp="pick:${i}"><span class="grow"><b>${esc(f.n)}</b><span class="mut sm">100 g: ${Math.round(f.k)} kcal</span></span><span class="aic" aria-hidden="true">${Icons.svg("plus")}</span></button>`).join("");
  }else if(t.dataset.rg!==undefined&&recipeDraft){const v=num(t.value),it=recipeDraft.items[+t.dataset.rg];it.g=v>0?Math.round(v*(it.por?100:1)*10)/10:0;rpSum()}
  else if(t.id==="rs"&&recipeDraft)rpSum();
});
