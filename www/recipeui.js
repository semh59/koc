"use strict";
/* Kendi tarifim: malzemeler gramla girilir, tarif S.recipes'te durur ve yemek aramasına tek besin olarak (allFoods) girer. */
let rd=null,rres=[];
const rpFmt=x=>fmt(x,x<10?1:0);
function recipeListHtml(){
  if(!S.recipes.length)return "";
  return `<div class="lbl">Tariflerim</div>${S.recipes.map(r=>{const f=LogLib.recipeFood(r);return `<div class="prow"><button data-rp="add:${r.id}" style="flex:1;text-align:left;min-height:56px"><b>${esc(r.n)}</b><span class="mut sm">1 porsiyon: ${Math.round(f.k*f.u[0][1]/100)} kcal</span></button><button class="plus" data-rp="edit:${r.id}" aria-label="${esc(r.n)} tarifini düzenle">${Icons.svg("not")}</button></div>`}).join("")}`;
}
function rpRows(){
  return rd.items.map((it,i)=>`<div class="prow"><span style="flex:1;min-width:0"><b>${esc(it.n)}</b><span class="mut sm">${it.por?"1 porsiyon":"100 g"}: ${Math.round(it.k)} kcal</span></span><input class="in num" data-rg="${i}" inputmode="decimal" aria-label="${esc(it.n)} ${it.por?"porsiyon":"gram"}" value="${it.por?(it.g?it.g/100:""):it.g||""}" style="width:76px;margin:0"><span class="mut">${it.por?"porsiyon":"g"}</span><button class="del" data-rp="rm:${i}" aria-label="${esc(it.n)} malzemesini çıkar">✕</button></div>`).join("")||`<p class="mut sm">Henüz malzeme yok. Aşağıdan ara ve ekle.</p>`;
}
function rpSum(){
  const ok=rd.items.filter(i=>i.g>0),c=LogLib.recipeCalc({items:ok.length?ok:[{n:"x",g:1,k:0}]}),s=Math.round(num($("#rs").value))||1;
  const line=div=>[`${Math.round(c.tot.k/div)} kcal`,...NUTR.map(m=>c.tot[m]!=null&&`${NLBL[m]} ${rpFmt(c.tot[m]/div)} ${NUNIT(m)}`)].filter(Boolean).join(" · ");
  $("#rsum").innerHTML=ok.length?`<div class="k">Porsiyon başı (${s} porsiyon${rd.items.some(i=>i.por)?"":`, ${Math.round(c.g/s)} g`})</div><div class="v num">${line(s)}</div><div class="k" style="margin-top:6px">Tarifin tamamı${rd.items.some(i=>i.por)?"":` (${Math.round(c.g)} g)`}</div><div class="v num">${line(1)}</div>`:`<div class="k">Malzeme ve gram girince değerler burada görünür</div>`;
  $("#rnote").textContent=ok.length?LogLib.recipeNote(c):"Çiğ ağırlıklarla hesaplanır, pişince değişir; tahmindir.";
}
function rpRead(){if(!rd)return;rd.n=$("#rn").value;rd.s=$("#rs").value}
function sheetTarif(r){
  rd=r?{id:r.id,n:r.n,s:r.s,items:r.items.map(i=>({...i}))}:{id:null,n:"",s:4,items:[]};rres=[];
  openSheet(`<h3>${r?"Tarifi düzenle":"Tarif oluştur"}</h3>
  <label class="lbl" for="rn">Tarif adı</label><input class="in" id="rn" maxlength="60" autocomplete="off" value="${esc(rd.n)}" placeholder="Örneğin mercimek köftesi">
  <label class="lbl" for="rs">Kaç porsiyon çıkar</label><input class="in num" id="rs" inputmode="numeric" autocomplete="off" value="${rd.s}">
  <div class="lbl">Malzemeler (gram)</div><div id="rrows">${rpRows()}</div>
  <label class="lbl" for="rq">Malzeme ekle</label><input class="in" id="rq" type="search" enterkeyhint="search" aria-label="Malzeme ara" placeholder="Un, yumurta, süt…" autocomplete="off"><div id="rlist" class="plist"></div>
  <div class="stat" id="rsum" style="margin:8px 0"></div><div class="mut sm" id="rnote" style="margin-bottom:8px"></div>
  <div class="ferr" id="rerr" role="alert"></div><button class="btn" data-rp="save">Kaydet</button>${r?`<div class="two"><button class="btn ghost" data-rp="dup">Çoğalt</button><button class="btn danger" data-rp="del">Sil</button></div>`:""}`);
  rpSum();
}
function rpSave(){
  rpRead();
  const err=m=>ferr("rerr",m),n=rd.n.trim(),s=num(rd.s,true);
  if(!n)return err("Tarife bir ad yaz");
  if(!rd.items.length)return err("En az bir malzeme ekle");
  if(!rd.items.every(i=>i.g>0&&i.g<=5000))return err("Her malzemenin gramı 0,1 ile 5000 arasında olmalı");
  if(!(s>=1&&s<=50))return err("Porsiyon sayısı 1 ile 50 arasında olmalı");
  if(S.recipes.some(x=>x.id!==rd.id&&LogLib.key(x.n)===LogLib.key(n)))return err("Bu adda bir tarifin var");
  if(rd.id==null&&S.recipes.length>=50)return err("En fazla 50 tarif olur");
  const id=rd.id==null?Math.max(0,...S.recipes.map(x=>x.id))+1:rd.id,r=LogLib.cleanRecipes([{id,n,s,items:rd.items}])[0];
  S.recipes=rd.id==null?[...S.recipes,r]:S.recipes.map(x=>x.id===id?r:x);
  save();closeSheet();render();toast(`"${r.n}" tarifi kaydedildi`);
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-rp]");if(!el)return;
  const [a,p]=el.dataset.rp.split(":"),r=S.recipes.find(x=>x.id===+p);
  if(a==="new")sheetTarif();
  else if(a==="edit"&&r)sheetTarif(r);
  else if(a==="add"&&r)sheetPorsiyon(0,LogLib.recipeFood(r));
  else if(a==="save")rpSave();
  else if(a==="rm"){rpRead();rd.items.splice(+p,1);$("#rrows").innerHTML=rpRows();rpSum()}
  else if(a==="pick"){
    const f=rres[+p];rpRead();if(!f)return;
    if(rd.items.length>=30)return ferr("rerr","Bir tarifte en fazla 30 malzeme olur");
    const it=LogLib.cleanRecipes([{n:"x",items:[{n:f.n,g:f.por?100:Math.min(5000,Math.round(f.u[0][1])),...f}]}])[0];
    if(it){rd.items.push(it.items[0]);$("#rrows").innerHTML=rpRows();$("#rq").value="";$("#rlist").innerHTML="";rpSum()}
  }else if(a==="dup"&&rd.id!=null){
    rpRead();const base=rd.n.trim().slice(0,52);let n=`${base} (kopya)`,i=2;
    while(S.recipes.some(x=>LogLib.key(x.n)===LogLib.key(n)))n=`${base} (kopya ${i++})`;
    if(S.recipes.length>=50)return ferr("rerr","En fazla 50 tarif olur");
    const c=LogLib.cleanRecipes([{id:Math.max(0,...S.recipes.map(x=>x.id))+1,n,s:num(rd.s,true),items:rd.items}])[0];
    if(!c)return ferr("rerr","Önce malzemelerin gramını düzelt");
    S.recipes.push(c);save();render();sheetTarif(c);toast("Tarif çoğaltıldı");
  }else if(a==="del"&&rd.id!=null&&confirm("Tarif silinsin mi? Günlükteki kayıtların değişmez.")){
    S.recipes=S.recipes.filter(x=>x.id!==rd.id);save();closeSheet();render();toast("Tarif silindi");
  }
});
document.addEventListener("input",ev=>{
  const t=ev.target;
  if(t.id==="rq"){
    const q=t.value.trim();rres=q.length<1?[]:foodSearch(q,6,allFoods()).map(i=>allFoods()[i]);
    $("#rlist").innerHTML=rres.map((f,i)=>`<button class="prow" data-rp="pick:${i}"><span><b>${esc(f.n)}</b><span class="mut sm">100 g: ${Math.round(f.k)} kcal</span></span><span class="plus" aria-hidden="true">+</span></button>`).join("");
  }else if(t.dataset.rg!==undefined&&rd){const v=num(t.value);const it=rd.items[+t.dataset.rg];it.g=v>0?v*(it.por?100:1):0;rpSum()}
  else if(t.id==="rs"&&rd)rpSum();
});
