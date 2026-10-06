"use strict";
/* Kategori başına sayı ve silme. Kendi besinleri, favoriler ve şablonlar kullanıcının hazırladığı içeriktir, yalnız "Tüm verileri sil" ile gider. */
const pvE=(...t)=>[()=>S.entries.filter(e=>t.includes(e.type)).length,()=>{S.entries=S.entries.filter(e=>!t.includes(e.type))}];
const PV_CATS=[
  ["Yemek ve su kayıtları",...pvE("yemek","su")],
  ["Kilo",...pvE("kilo")],
  ["Spor ve antrenman",()=>S.workouts.length+S.entries.filter(e=>e.type==="spor"&&e.wid==null).length,()=>{S.workouts=[];S.entries=S.entries.filter(e=>e.type!=="spor")}],
  ["Adım ve hareket",()=>S.moves.length+S.entries.filter(e=>e.type==="adim").length,()=>{S.moves=[];S.walk=null;S.settings.stepsFrom=keyOff(1);S.entries=S.entries.filter(e=>e.type!=="adim")}],
  ["İlaç",()=>S.meds.length+S.medLog.length,()=>{S.meds=[];S.medLog=[]}],
  ["Sağlık ölçümleri (tansiyon, şeker)",()=>S.vitals.length,()=>{S.vitals=[]}],
  ["Tahlil",()=>S.labs.length,()=>{S.labs=[]}],
  ["Uyku, ruh hali ve oruç",()=>S.sleep.length+S.mood.length+S.fast.log.length+(S.fast.t0?1:0),()=>{S.sleep=[];S.mood=[];S.fast.log=[];S.fast.t0=null}],
  ["Koç sohbeti",()=>S.chat.length+S.chats.length,cClearChat],
  ["Notlar",...pvE("not")],
  ["Vücut ölçüleri (bel, kalça…)",()=>S.measures.length,()=>{S.measures=[]}],
  ["Tariflerim",()=>S.recipes.length,()=>{S.recipes=[]}]
];
function pvDelete(i){
  const [name,n,del]=PV_CATS[i],lb=S.settings.lastBackup;
  if(!n()||!confirm(`${name}: ${n()} kayıt silinecek. Bu geri alınamaz. Son yedek: ${lb?fd(lb):"yok"}. Önce yedek almanı öneririz. Silinsin mi?`))return;
  del();lsDel("koc_v1_onceki");save();render();scheduleReminders().then(setNotif);sheetPrivacy();toast(`${name} silindi`);
}
/* Gizlilik ve veri: verinin nerede durduğu, internete çıkan hizmetler ve Koç açık rızası. Sheet olduğu için onboarding'den de açılır. */
function sheetPrivacy(){
  const st=S.settings;
  openSheet(`<h3>Gizlilik ve veri</h3>
  <div class="banner" style="margin-bottom:10px"><p style="margin:0">${MED_NOTE}</p></div>
  <div class="lbl">Verin nerede</div>
  <p class="mut sm">Tüm kayıtların yalnızca bu telefonda durur; NeoWell'in sunucusu ve hesabı yoktur. Yedek dosyasını sen oluşturur, nereye kaydedeceğini sen seçersin. PDF ve tablo paylaşımları da senin seçtiğin yere gider. Google otomatik yedeğine ve telefondan telefona aktarıma bilerek dahil edilmez.</p>
  <p class="mut sm">Konum yalnız elle başlattığın yürüyüşte, uygulama açıkken başlayan kısa bir ölçüm için kullanılır (sürerken bildirim görünür). Yalnız öğrenilen adım uzunluğu saklanır, konum noktası ve rota saklanmaz. Arka planda konum istenmez.</p>
  <div class="lbl">İnternete çıkanlar</div>
  <ul class="mut sm" style="margin:0 0 10px;padding-left:18px">
    <li><b>Open Food Facts</b> (barkod araması): yalnızca barkod numarası gider. Hizmet, her internet isteğinde olduğu gibi IP adresini görür.</li>
    <li><b>Koç</b>: yalnızca açık rızanla ve yalnız sen bir düğmeye bastığında (otomatik ya da arka planda gönderim yok), aşağıda yazılanlar, seçtiğin sağlayıcıya (${esc(provNames())} ya da kendi eklediğin servis). OpenAI ve Anthropic ücretlidir. Kurulumda yalnız anahtarın ve bir deneme cümlesi gider, sağlık verin gitmez.</li>
    <li><b>Google barkod tarayıcı</b> (Play hizmetleri): görüntü telefonda işlenir, NeoWell görüntüyü almaz. Google, kendi koşullarına göre kullanım ve tanılama bilgisi toplayabilir.</li>
    <li><b>Google Drive</b>: yalnızca sen yedeği paylaşım ekranından Drive'a gönderirsen. Yedek parolayla şifrelenir.</li>
  </ul>
  <div class="lbl">Verilerini sil</div>
  <p class="mut sm">Kategori başına silinir, geri alınamaz. <button class="lnk" style="display:inline;width:auto;min-height:44px" data-act="yedek">Önce yedek al</button></p>
  ${PV_CATS.map(([name,n],i)=>`<div class="row" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--line)"><span style="flex:1;min-width:0"><b>${name}</b><small class="mut sm" style="display:block">${n()} kayıt</small></span><button class="chip" data-pv="del:${i}" ${n()?"":"disabled"} aria-label="${name} sil">Sil</button></div>`).join("")}
  <p class="hint">Kendi besinlerin, favorilerin, öğün şablonların ve antrenman şablonların bu listede yoktur; yalnız Ayarlar > Veri ve yedek > Tüm verileri sil ile gider.</p>
  <div class="banner info" style="margin-top:10px">${consentHtml()}<p>Durum: ${st.consent?`kabul edildi (${esc(st.consentAt)})`:"kabul edilmedi"}</p>
  ${st.consent?`<button class="btn ghost" data-pv="revoke">Rızamı geri al</button>`:consentOk()?`<button class="btn" data-pv="consent">Açık rızamı veriyorum</button>`:""}</div>
  <button class="btn ghost" data-pv="close" style="margin-top:8px">Kapat</button>`);
}
/* Her tablo ayrı paylaşılır: zincirleme paylaşım ekranı ikinci dosyada açılmayabilir. */
const pvCsv=()=>CsvLib.files(S,{exName:id=>gEx(id).n,vctx:r=>r.k==="t"?VitalsLib.sesName(r.ses):VitalsLib.ctxName(r.ctx)});
function sheetCsv(){
  openSheet(`<h3>Tabloya aktar (CSV)</h3><p class="mut sm">Excel ve Google Sheets'te açılır. Dosya şifresizdir, paylaştığın yere gider; yedek yerine geçmez.</p>
  ${pvCsv().map((f,i)=>`<div class="row" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--line)"><span style="flex:1;min-width:0"><b>${f.label}</b><small class="mut sm" style="display:block">${f.n} satır</small></span><button class="chip" data-pv="csvsh:${i}" ${f.n?"":"disabled"} aria-label="${f.label} paylaş">Paylaş</button></div>`).join("")}
  <button class="btn ghost" data-pv="close" style="margin-top:12px">Kapat</button>`);
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-pv]");if(!el)return;
  const [a,arg]=el.dataset.pv.split(":");
  if(a==="open")sheetPrivacy();
  else if(a==="close")closeSheet();
  else if(a==="del")pvDelete(+arg);
  else if(a==="csv")sheetCsv();
  else if(a==="csvsh"){const f=pvCsv()[+arg];shareFile(`neowell-${f.key}-${dayKey()}.csv`,f.label,"text/csv",f.build(),true)}
  else if(a==="consent"||a==="revoke"){cConsent(a==="consent");sheetPrivacy()}
});
