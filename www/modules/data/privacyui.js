"use strict";
/* Count and delete per category. The user's own foods, favourites and templates are content they prepared and go only with "Tüm verileri sil". */
const PV_CATS=Data.privacy; // the data modules add the rows
function pvDelete(i){
  const [name,n,del]=PV_CATS[i];
  if(!n())return;
  confirmSheet({title:`${name} silinsin mi?`,body:`${name}: ${n()} kayıt silinecek. Bu geri alınamaz. ${bkLast()}. Önce yedek almanı öneririz. Silinsin mi?`,ok:"Sil",danger:true}).then(ok=>{if(ok)pvDeleteDo(name,del)});
}
function pvDeleteDo(name,del){
  chain(del(),r=>{if(r===false)return;Store.del("nw_state_previous");Store.del("nw_state_corrupt");otherBytes=lsOther();save();render();scheduleReminders().then(setNotif);sheetPrivacy();toast(`${name} silindi`)});
}
const NET_KIND={off:"barkod numarası",chat:"Rehber mesajı (onayladığın metin)",models:"model listesi (anahtarın istek başlığında gider)",ram:"ezan vakitleri (yalnız en yakın il merkezinin numarası)"};
/* What NeoWell itself sent in the last 30 days; Google services (barcode scanner, text recognition) run outside the WebView and are not in this list. */
function netLogHtml(){
  const rows=NetLog.recent().reverse();
  const when=r=>{const d=new Date(r.t);return `${fd(dayKey(d))} ${pad(d.getHours())}:${pad(d.getMinutes())}`};
  const head=rows.length?`Son 30 günde NeoWell kendi başına ${rows.length} istek gönderdi.`:"Son 30 günde NeoWell kendi başına internete hiçbir şey göndermedi.";
  const list=rows.map(r=>`<div class="row"><span class="grow">${when(r)} · ${esc(r.host)}<small class="db mut sm">${NET_KIND[r.kind]||r.kind}${r.out?`, ${fint(r.out)} bayt`:""}${r.ok?"":", başarısız"}</small></span></div>`).join("");
  return `<p class="m0"><b>${head}</b></p>${rows.length?`<details class="acc"><summary>Ayrıntı</summary>${list}<button class="chip" data-pv="netclear">Defteri temizle</button></details>`:""}<p class="mut sm">Google barkod okuyucu ve metin tanıma (Play hizmetleri) bu listede görünmez.</p>`;
}
/* Privacy and data: where the data lives, which services reach the internet, and the Coach consent. It is a sheet, so onboarding can open it too. */
function sheetPrivacy(){
  const st=S.settings;
  const pt=(ic,t,s)=>`<div class="row"><div class="aic">${Icons.svg(ic)}</div><span class="grow"><b>${t}</b><small class="db mut sm">${s}</small></span></div>`;
  openSheet(`<h3>Gizlilik ve veri</h3>
  ${pt("lock","Veriler telefonunda","NeoWell'in sunucusu ve hesabı yok. Yedeği sen alır, yerini sen seçersin.")}${pt("coach","Rehber'e ne gider","Yalnız onay verirsen ve sen gönderdiğinde. Ad, telefon gibi bilgiler önce maskelenir.")}${pt("trash","Silme","Aşağıdan kategori kategori silebilirsin; geri alınamaz.")}
  <div class="my-2 banner"><p class="m0">${MED_NOTE}</p></div>
  <details class="acc"><summary>Verin nerede</summary>
  <p class="mut sm">Tüm kayıtların yalnızca bu telefonda durur; NeoWell'in sunucusu ve hesabı yoktur. Yedek dosyasını sen oluşturur, nereye kaydedeceğini sen seçersin. İlerleme fotoğrafları yalnız bu telefonda durur ve yedeğe girmez. PDF ve tablo paylaşımları da senin seçtiğin yere gider. Google otomatik yedeğine ve telefondan telefona aktarıma bilerek dahil edilmez.</p>
  <p class="mut sm">Konum yalnız elle başlattığın yürüyüşte ve Ramazan modunda "Konumumu kullan"a dokununca, uygulama açıkken kısa bir ölçüm için kullanılır (yürüyüş sürerken bildirim görünür). Yürüyüşte yalnız öğrenilen adım uzunluğu saklanır, nokta ve rota saklanmaz; Ramazan modunda yaklaşık 1 km'ye yuvarlanmış yerin telefonda kalır ve hiçbir yere gönderilmez. Arka planda konum istenmez.</p></details>
  <details class="acc"><summary>İnternete çıkanlar</summary>
  <ul class="mut sm m0 mb-3 pl-4">
    <li><b>Open Food Facts</b> (barkod araması): yalnızca barkod numarası gider. Hizmet, her internet isteğinde olduğu gibi IP adresini görür.</li>
    <li><b>Rehber</b>: yalnızca açık rızanla ve yalnız sen bir düğmeye bastığında (otomatik ya da arka planda gönderim yok), aşağıda yazılanlar, seçtiğin sağlayıcıya (${esc(provNames())} ya da kendi eklediğin servis). OpenAI ve Anthropic ücretlidir. Kurulumda yalnız anahtarın ve bir deneme cümlesi gider, sağlık verin gitmez.</li>
    <li><b>Ezan vakitleri</b> (yalnız Ramazan modunu açarsan): saatler telefonda hesaplanır; doğrulamak için en yakın il merkezinin ilçe numarası gönderilir ve Diyanet vakit tablosunun internetteki bir kopyasından (ezanvakti.emushaf.net) o tablo alınır. Konumun gönderilmez. Hizmet IP adresini görür; ilçe numarası yaklaşık bölgeni gösterir.</li>
    <li><b>Google barkod tarayıcı</b> (Play hizmetleri): görüntü telefonda işlenir, NeoWell görüntüyü almaz. Google, kendi koşullarına göre kullanım ve tanılama bilgisi toplayabilir.</li>
    <li><b>Google Drive</b>: yalnızca sen yedeği paylaşım ekranından Drive'a gönderirsen. Yedek parolayla şifrelenir.</li>
  </ul>
  <p class="mut sm">Rehber sağlayıcısı IP adresini görür; kimlik bilgileri (ad, telefon, e-posta, TC, adres gibi) göndermeden önce telefonda maskelenir; filtre %100 garanti değildir (tam garanti yok): serbest cümleyle anlatılan adres ve listede olmayan nadir adlar yakalanmayabilir.</p>
  <p class="mut sm">${usageText()}. Yalnız sayılar bu telefonda tutulur, hiçbir yere gönderilmez.</p>${netLogHtml()}</details>
  <details class="acc"><summary>Rehber açık rıza metni</summary>${consentHtml()}</details>
  ${swRow('data-pv="prev"',st.piiPrev,"Rehber'e giden metni önizle","Açıkken her gönderimden önce giden tam metni görür, Gönder ya da Vazgeç dersin.")}
  <div class="banner info"><p class="m0">Rehber veri paylaşımı: ${st.consent?`kabul edildi (${esc(st.consentAt)})`:"kabul edilmedi"}</p>
  ${st.consent?`<button class="btn ghost" data-pv="revoke">Rızamı geri al</button>`:consentOk()?`<button class="btn" data-pv="consent">Açık rızamı veriyorum</button>`:""}</div>
  <h4 class="grp">Verilerini sil</h4>
  <p class="mut sm">Kategori başına silinir, geri alınamaz. <button class="lnk ib wa" data-act="backup">Önce yedek al</button></p>
  ${PV_CATS.map(([name,n],i)=>`<div class="row"><span class="grow"><b>${name}</b><small class="db mut sm">${n()} kayıt</small></span><button class="chip" data-pv="del:${i}" ${n()?"":"disabled"} aria-label="${name} sil">Sil</button></div>`).join("")}
  <p class="hint">Kendi besinlerin, favorilerin, öğün şablonların ve antrenman şablonların bu listede yoktur; yalnız Ayarlar > Veri ve yedek > Tüm verileri sil ile gider.</p>
  <button class="mt-2 btn ghost" data-pv="close">Kapat</button>`);
}
/* Each table is shared on its own: a chained share sheet may not open for the second file. */
let pvSeal=false,pvSplit=false,pvIntl=false;
const pvCsv=(split=pvSplit)=>CsvLib.files(S,{exName:id=>gEx(id).n,vctx:r=>r.k==="t"?VitalsLib.sessionName(r.session):VitalsLib.ctxName(r.ctx)},{split,intl:pvIntl});
const pvArchive=tables=>ArchiveLib.build(S,dayKey(),tables);
const pvBundle=()=>pvArchive(Object.fromEntries(pvCsv(false).filter(f=>f.n).map(f=>[f.key,f.build()])));
const pvFhir=()=>FhirLib.build(Vitals.all(),weights(),(d,t)=>-new Date(`${d}T${t}`).getTimezoneOffset(),v=>"Ölçüm zamanı: "+VitalsLib.ctxName(v.ctx));
const pvRow=(t,sub,act,aria,on)=>`<div class="row"><span class="grow"><b>${t}</b><small class="db mut sm">${sub}</small></span><button class="chip" data-pv="${act}" ${on?"":"disabled"} aria-label="${aria}">Paylaş</button></div>`;
/* One place for every PDF report and every table or file that leaves the phone. */
function sheetExport(){
  const ar=pvArchive(),fh=pvFhir(),files=pvCsv(),tabs=pvCsv(false).filter(f=>f.n).length;
  openSheet(`<h3>Raporlar ve dışa aktarma</h3>
  <h4 class="grp">PDF raporları</h4>${reportRows()}
  <h4 class="grp">Tablolar (CSV)</h4><p class="mut sm">Excel ve Google Sheets'te açılır. Aşağıdan şifrelemezsen dosya şifresizdir ve paylaştığın yere gider; yedek yerine geçmez.</p>
  ${swRow('data-pv="seal"',pvSeal,"Parolayla şifrele","Paylaşılan dosyayı yalnız parolayı bilen açabilir; Excel ve Sheets şifreli dosyayı doğrudan açmaz")}
  ${swRow('data-pv="split"',pvSplit,"Tür başına ayrı dosya","Yemek, su, kilo gibi her tür kendi tablosunda olur; her tabloda tek birim bulunur")}
  ${swRow('data-pv="intl"',pvIntl,"Nokta ondalık, virgül ayraç","Türkçe Excel için kapalı bırak; İngilizce Excel ve Google Sheets (ABD) için aç")}
  ${files.map((f,i)=>pvRow(f.label,`${f.n} satır`,"csvsh:"+i,`${f.label} paylaş`,f.n)).join("")}
  <h4 class="grp">Tüm kayıtlar</h4>
  ${pvRow("Hepsini tek paket (tek JSON dosyası)",`${ar.total} kayıt ve ${tabs} tablo. Dışarıda: ${ArchiveLib.LEFT_OUT}`,"bundle","Hepsini tek paket olarak paylaş",ar.total)}
  ${pvRow("Kayıtlarım (tek JSON dosyası, bazı veriler dışarıda)",`${ar.total} kayıt, tüm modüller. Dışarıda: ${ArchiveLib.LEFT_OUT}`,"archive","Kayıtlarımı paylaş",ar.total)}
  ${pvRow("Tansiyon, kilo ve şeker (FHIR R4)",`${fh.bp} tansiyon, ${fh.weight} kilo, ${fh.glucose} şeker kaydı; başka sağlık uygulamalarının okuyabildiği biçim, yorum içermez`,"fhir","FHIR dosyasını paylaş",fh.total)}
  <button class="mt-3 btn ghost" data-pv="close">Kapat</button>`);
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-pv]");if(!el)return;
  const [a,arg]=el.dataset.pv.split(":");
  if(a==="open")sheetPrivacy();
  else if(a==="close")closeSheet();
  else if(a==="del")pvDelete(+arg);
  else if(a==="prev"){S.settings.piiPrev=el.checked;S.settings.piiPrevOwn=true;save()}
  else if(a==="netclear"){NetLog.clear();sheetPrivacy()}
  else if(a==="export"){pvSeal=pvSplit=pvIntl=false;sheetExport()}
  else if(a==="seal"){pvSeal=el.checked;sheetExport()}
  else if(a==="split"){pvSplit=el.checked;sheetExport()}
  else if(a==="intl"){pvIntl=el.checked;sheetExport()}
  else if(a==="archive")shareOut(pvSeal,`neowell-arsiv-${dayKey()}.json`,"Kayıtlarım","application/json",pvArchive().json,true);
  else if(a==="bundle")shareOut(pvSeal,`neowell-paket-${dayKey()}.json`,"Hepsini tek paket","application/json",pvBundle().json,true);
  else if(a==="fhir")shareOut(pvSeal,`neowell-fhir-${dayKey()}.json`,"Tansiyon, kilo ve şeker (FHIR)","application/json",pvFhir().json,true);
  else if(a==="csvsh"){const f=pvCsv()[+arg];shareOut(pvSeal,`neowell-${f.key}-${dayKey()}.csv`,f.label,"text/csv",f.build(),true)}
  else if(a==="consent"||a==="revoke"){cConsent(a==="consent",true);sheetPrivacy()}
});
