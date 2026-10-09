"use strict";
/* Kategori başına sayı ve silme. Kendi besinleri, favoriler ve şablonlar kullanıcının hazırladığı içeriktir, yalnız "Tüm verileri sil" ile gider. */
const PV_CATS=Data.privacy; // satırları veri modülleri (modules/*.js) ekler
function pvDelete(i){
  const [name,n,del]=PV_CATS[i],lb=S.settings.lastBackup;
  if(!n())return;
  confirmSheet({title:`${name} silinsin mi?`,body:`${name}: ${n()} kayıt silinecek. Bu geri alınamaz. Son yedek: ${lb?fd(lb):"yok"}. Önce yedek almanı öneririz. Silinsin mi?`,ok:"Sil",danger:true}).then(ok=>{if(ok)pvDeleteDo(name,del)});
}
function pvDeleteDo(name,del){
  if(del()===false)return;Store.del("nw_state_previous");Store.del("nw_state_corrupt");otherBytes=lsOther();save();render();scheduleReminders().then(setNotif);sheetPrivacy();toast(`${name} silindi`);
}
/* Gizlilik ve veri: verinin nerede durduğu, internete çıkan hizmetler ve Koç açık rızası. Sheet olduğu için onboarding'den de açılır. */
function sheetPrivacy(){
  const st=S.settings;
  const pt=(ic,t,s)=>`<div class="row"><div class="aic">${Icons.svg(ic)}</div><span class="grow"><b>${t}</b><small class="db mut sm">${s}</small></span></div>`;
  openSheet(`<h3>Gizlilik ve veri</h3>
  ${pt("lock","Veriler telefonunda","NeoWell'in sunucusu ve hesabı yok. Yedeği sen alır, yerini sen seçersin.")}${pt("coach","Koç'a ne gider","Yalnız onay verirsen ve sen gönderdiğinde. Ad, telefon gibi bilgiler önce maskelenir.")}${pt("trash","Silme","Aşağıdan kategori kategori silebilirsin; geri alınamaz.")}
  <div class="my-2 banner"><p class="m0">${MED_NOTE}</p></div>
  <details class="acc"><summary>Verin nerede</summary>
  <p class="mut sm">Tüm kayıtların yalnızca bu telefonda durur; NeoWell'in sunucusu ve hesabı yoktur. Yedek dosyasını sen oluşturur, nereye kaydedeceğini sen seçersin. İlerleme fotoğrafları yalnız bu telefonda durur ve yedeğe girmez. PDF ve tablo paylaşımları da senin seçtiğin yere gider. Google otomatik yedeğine ve telefondan telefona aktarıma bilerek dahil edilmez.</p>
  <p class="mut sm">Konum yalnız elle başlattığın yürüyüşte, uygulama açıkken başlayan kısa bir ölçüm için kullanılır (sürerken bildirim görünür). Yalnız öğrenilen adım uzunluğu saklanır, konum noktası ve rota saklanmaz. Arka planda konum istenmez.</p></details>
  <details class="acc"><summary>İnternete çıkanlar</summary>
  <ul class="mut sm" style="margin:0 0 10px;padding-left:18px">
    <li><b>Open Food Facts</b> (barkod araması): yalnızca barkod numarası gider. Hizmet, her internet isteğinde olduğu gibi IP adresini görür.</li>
    <li><b>Koç</b>: yalnızca açık rızanla ve yalnız sen bir düğmeye bastığında (otomatik ya da arka planda gönderim yok), aşağıda yazılanlar, seçtiğin sağlayıcıya (${esc(provNames())} ya da kendi eklediğin servis). OpenAI ve Anthropic ücretlidir. Kurulumda yalnız anahtarın ve bir deneme cümlesi gider, sağlık verin gitmez.</li>
    <li><b>Google barkod tarayıcı</b> (Play hizmetleri): görüntü telefonda işlenir, NeoWell görüntüyü almaz. Google, kendi koşullarına göre kullanım ve tanılama bilgisi toplayabilir.</li>
    <li><b>Google Drive</b>: yalnızca sen yedeği paylaşım ekranından Drive'a gönderirsen. Yedek parolayla şifrelenir.</li>
  </ul>
  <p class="mut sm">Koç sağlayıcısı IP adresini görür; kimlik bilgileri (ad, telefon, e-posta, TC, adres gibi) göndermeden önce telefonda maskelenir; filtre %100 garanti değildir (tam garanti yok): serbest cümleyle anlatılan adres ve listede olmayan nadir adlar yakalanmayabilir.</p>
  <p class="mut sm">${usageText()}. Yalnız sayılar bu telefonda tutulur, hiçbir yere gönderilmez.</p></details>
  <details class="acc"><summary>Koç açık rıza metni</summary>${consentHtml()}</details>
  ${swRow('data-pv="prev"',st.piiPrev,"Koç'a giden metni önizle","Açıkken her gönderimden önce giden tam metni görür, Gönder ya da İptal dersin.")}
  <div class="banner info"><p class="m0">Koç veri paylaşımı: ${st.consent?`kabul edildi (${esc(st.consentAt)})`:"kabul edilmedi"}</p>
  ${st.consent?`<button class="btn ghost" data-pv="revoke">Rızamı geri al</button>`:consentOk()?`<button class="btn" data-pv="consent">Açık rızamı veriyorum</button>`:""}</div>
  <h4 class="grp">Verilerini sil</h4>
  <p class="mut sm">Kategori başına silinir, geri alınamaz. <button class="lnk" style="display:inline;width:auto;min-height:44px" data-act="backup">Önce yedek al</button></p>
  ${PV_CATS.map(([name,n],i)=>`<div class="row"><span class="grow"><b>${name}</b><small class="db mut sm">${n()} kayıt</small></span><button class="chip" data-pv="del:${i}" ${n()?"":"disabled"} aria-label="${name} sil">Sil</button></div>`).join("")}
  <p class="hint">Kendi besinlerin, favorilerin, öğün şablonların ve antrenman şablonların bu listede yoktur; yalnız Ayarlar > Veri ve yedek > Tüm verileri sil ile gider.</p>
  <button class="mt-2 btn ghost" data-pv="close">Kapat</button>`);
}
/* Her tablo ayrı paylaşılır: zincirleme paylaşım ekranı ikinci dosyada açılmayabilir. */
const pvCsv=()=>CsvLib.files(S,{exName:id=>gEx(id).n,vctx:r=>r.k==="t"?VitalsLib.sessionName(r.session):VitalsLib.ctxName(r.ctx)});
function sheetCsv(){
  openSheet(`<h3>Tabloya aktar (CSV)</h3><p class="mut sm">Excel ve Google Sheets'te açılır. Dosya şifresizdir, paylaştığın yere gider; yedek yerine geçmez.</p>
  ${pvCsv().map((f,i)=>`<div class="row"><span class="grow"><b>${f.label}</b><small class="db mut sm">${f.n} satır</small></span><button class="chip" data-pv="csvsh:${i}" ${f.n?"":"disabled"} aria-label="${f.label} paylaş">Paylaş</button></div>`).join("")}
  <button class="mt-3 btn ghost" data-pv="close">Kapat</button>`);
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-pv]");if(!el)return;
  const [a,arg]=el.dataset.pv.split(":");
  if(a==="open")sheetPrivacy();
  else if(a==="close")closeSheet();
  else if(a==="del")pvDelete(+arg);
  else if(a==="prev"){S.settings.piiPrev=el.checked;save()}
  else if(a==="csv")sheetCsv();
  else if(a==="csvsh"){const f=pvCsv()[+arg];shareFile(`neowell-${f.key}-${dayKey()}.csv`,f.label,"text/csv",f.build(),true)}
  else if(a==="consent"||a==="revoke"){cConsent(a==="consent");sheetPrivacy()}
});
