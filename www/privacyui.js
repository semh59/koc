"use strict";
/* Gizlilik ve veri: verinin nerede durduğu, internete çıkan hizmetler ve Koç açık rızası. Sheet olduğu için onboarding'den de açılır. */
function sheetPrivacy(){
  const st=S.settings;
  openSheet(`<h3>Gizlilik ve veri</h3>
  <div class="banner" style="margin-bottom:10px"><p style="margin:0">${MED_NOTE}</p></div>
  <div class="lbl">Verin nerede</div>
  <p class="mut sm">Tüm kayıtların yalnızca bu telefonda durur; NeoWell'in sunucusu ve hesabı yoktur. Yedek dosyasını sen oluşturur, nereye kaydedeceğini sen seçersin. PDF ve tablo paylaşımları da senin seçtiğin yere gider. Google otomatik yedeğine ve telefondan telefona aktarıma bilerek dahil edilmez.</p>
  <div class="lbl">İnternete çıkanlar</div>
  <ul class="mut sm" style="margin:0 0 10px;padding-left:18px">
    <li><b>Open Food Facts</b> (barkod araması): yalnızca barkod numarası gider. Hizmet, her internet isteğinde olduğu gibi IP adresini görür.</li>
    <li><b>Koç</b>: yalnızca açık rızanla, aşağıda yazılanlar.</li>
    <li><b>Google barkod tarayıcı</b> (Play hizmetleri): görüntü telefonda işlenir, NeoWell görüntüyü almaz. Google, kendi koşullarına göre kullanım ve tanılama bilgisi toplayabilir.</li>
    <li><b>Google Drive</b>: yalnızca sen yedeği paylaşım ekranından Drive'a gönderirsen. Yedek parolayla şifrelenir.</li>
  </ul>
  <div class="banner info">${consentHtml()}<p>Durum: ${st.consent?`kabul edildi (${esc(st.consentAt)})`:"kabul edilmedi"}</p>
  ${st.consent?`<button class="btn ghost" data-pv="revoke">Rızamı geri al</button>`:consentOk()?`<button class="btn" data-pv="consent">Açık rızamı veriyorum</button>`:""}</div>
  <button class="btn ghost" data-pv="close" style="margin-top:8px">Kapat</button>`);
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-pv]");if(!el)return;
  const a=el.dataset.pv;
  if(a==="open")sheetPrivacy();
  else if(a==="close")closeSheet();
  else if(a==="consent"||a==="revoke"){cConsent(a==="consent");sheetPrivacy()}
});
