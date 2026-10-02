# 6 özellik uygulama planı (2026-10-02)

Kaynak: mevcut kod (www/, assets/android/, scripts/). "VARSAYIM" işaretli maddeler uygulamadan önce doğrulanacak.
Kurallar: en kısa doğru çözüm, yorum yalnız "neden", her kabul koşuluna bir test. Commit başına `npm test` yeşil.

---

## 0. Mevcut durum özeti (planın dayandığı gerçekler)

| Konu | Kodda olan | Eksik |
|---|---|---|
| Hızlı yemek | `repeatYesterday()` (index.html:674), "Sık yediklerin" çipleri (sheetYemek, sıklığa göre 6 metin), `S.myFoods` (200, barkod/OFF/Koç) | Dünkünü kopyala **makroları kaybediyor** (`add("yemek",e.v,e.text)` p/c/f taşımaz); çipler yalnız metin+kcal'i forma doldurur, tek dokunuşla eklemez; favori/şablon yok |
| Adım | `setSteps` günün **ilk** `adim` kaydını sensör değeriyle ezer; `sum("adim")` bir günün tüm adim kayıtlarını toplar (viewAdim, viewTrend, WeeklyLib, cData) | Elle ekleme, "sayım durdu" uyarısı |
| Koç | `cAsk` sağlayıcı filtresi `on&&health&&key`; **consent kontrolü yalnız `cFlush` ve `cAuto`'da**. `cAuto` haftalık Koç mesajı (Pazar 20:00 sonrası açılışta) | "Neden" analizi, plato, program, haftalık bildirim |
| Salon | `Algo.nextTarget` çift ilerleme (sabit 8-12), öneri satırı ve yeni sete ön doldurma, `gPRs` (yalnız bitiş özetinde), 90 sn dinlenme sayacı (uygulama içi, titreşim), süreli set bildirimi 9001 | Plaka/ısınma hesaplayıcı, set anında rekor bildirimi, egzersiz başına tekrar aralığı |
| Mikro besin | OFF isteği `nutriments` nesnesini tam alır (`OffLib.FIELDS`), ama `OffLib.parse` yalnız k/p/c/f çıkarır; `cleanMyFoods` ve `cleanEntries` yalnız p/c/f tutar; FOODS tablosunda lif/şeker/sodyum yok; LabelLib yalnız k/p/c/f okur | Lif, şeker, sodyum (tuz) alanları uçtan uca |
| Sağlık verisi | Uyku/ruh hali/oruç hiç yok. Health Connect yok | Hepsi |

Bildirim dokunma dinleyicisi (`localNotificationActionPerformed`) **yok**; derin bağlantı yeni iştir.

---

## 1. Uygulama sırası ve commit parçaları

Sıra (bağımlılık ve risk): **4 → 1a → 5 → 3 → 2 → 1b (widget) → 6 (isteğe bağlı)**

| # | Commit | Bağımlılık | Model |
|---|---|---|---|
| 4.1 | Algo: `plates`, `warmup` saf fonksiyonları + algo.test | – | basit |
| 4.2 | Salon: plaka/ısınma sayfası, set anında rekor bildirimi | 4.1 | basit |
| 4.3 | Salon: egzersiz başına tekrar aralığı (`S.exCfg`) | 4.1 | basit |
| 1a.1 | Yemek: dünkünü kopyala makro düzeltmesi + `NUTR` alan listesi | – | basit |
| 1a.2 | Yemek: son yenilenler + favoriler (tek dokunuşla ekle) | 1a.1 | basit |
| 1a.3 | Yemek: öğün şablonları | 1a.1 | basit |
| 1a.4 | Adım: elle ekleme + Adım ekranında listeleme/silme | – | basit |
| 1a.5 | Adım: "sayım durdu" uyarısı (Java `snapAt` + JS kart) | 1a.4 | orta |
| 5.1 | OffLib + LabelLib: lif/şeker/sodyum çıkarma + testler | 1a.1 | basit |
| 5.2 | Kayıt/gösterim: myFoods, entries, porsiyon, Bugün satırı, kapsam | 5.1 | basit |
| 3.1 | `habitlib.js`: uyku, ruh hali, oruç temizleyici + saf mantık testleri | – | basit |
| 3.2 | Uyku + ruh hali arayüzü (Bugün kartı, sayfa) | 3.1 | basit |
| 3.3 | Oruç zamanlayıcısı + bildirimler (9100, hatırlatıcı 11) | 3.1 | orta |
| 2.1 | `insightlib.js`: haftalık "neden" etmenleri + plato istatistiği + testler | 3.1 | **Opus** (plato) |
| 2.2 | Koç: bağlama uyku/ruh hali sütunu, "neden" kartı (yerel) + AI açıklaması | 2.1 | orta |
| 2.3 | Koç: plato sorusu | 2.1 | basit |
| 2.4 | Koç: program isteme (katalog, `program` kartı, şablona ekleme) | – | **Opus** |
| 2.5 | Haftalık özet bildirimi + bildirim dokunma derin bağlantısı | – | orta |
| 1b.1 | Widget: Java provider, layout, WidgetPlugin, patch-android | 1a | **Opus** |
| 6.0 | Health Connect keşif (kitaplık/sürüm/izin doğrulaması), karar | Semih'in cevabı | **Opus** |
| 6.1 | HealthPlugin (Java/Kotlin), manifest, izin akışı | 6.0 | **Opus** |
| 6.2 | Adım birleştirme (max kuralı), uyku/nabız alma, arayüz | 6.1, 3.1 | **Opus** |

---

## 2. Ortak kalıcılık kuralları (her işte geçerli)

1. **`cleanSettings` beyaz listedir:** her yeni ayar için hem `DEF.settings` varsayılanı hem bir temizleme satırı. Sayısal ise `RANGES`'e eklemek yeterli.
2. **`cleanEntries` bilinmeyen alanları atar ve kimlikleri yeniden numaralar:** şablon/favori kayıt kimliğine bağlanmaz, değerleri **kopyalar**. Yeni kayıt alanı (lif vb.) `cleanEntries`'e açıkça eklenir.
3. **`cleanMyFoods` yalnız n,k,p,c,f,b,src,u tutar:** yeni besin alanı oraya eklenir.
4. **`cleanGym` sıfırdan nesne kurar:** yeni salon alanı (`exCfg`) `cleanGym` dönüşüne eklenmezse yüklemede kaybolur.
5. **Yeni üst düzey diziler `cleanHealthState` üzerinden geçer:** `load()` ve `goYukle()` ikisi de onu çağırır; böylece yedek/geri yükleme ayrıca dokunmadan uyumlu olur. `DEF`'e boş varsayılan eklenir ("Tüm verileri sil" `structuredClone(DEF)` kullanır).
6. **Eski veri kaybolmaz:** her yeni alan yoksa boş/varsayılan döner. Her işte bir test: "alansız eski yedek yüklenir, mevcut kayıtlar aynen kalır" + "yeni alan yedekten geri gelir".
7. **Temizleyiciler saf olmalı:** `cleanX(r)` `S`'ye **dokunmaz** (`let S=load()` kurulurken çalışır; `S`'ye erişim hata atar, `load()` bunu yakalayıp veriyi `koc_v1_bozuk`'a taşır, DEF döner ve ilk `save()` gerçek veriyi ezer; `goYukle`'de de yedeğin değil eski durumun verisiyle doğrular). Doğrulama yalnız `r` (ham veri) ve sabitlerle (`EXMERGED`, `GROUPS`) yapılır; bozuk girdide asla hata atmaz. Her yeni alan için bir test: "yeni alanda çöp değer varken diğer veriler eksiksiz yüklenir".
8. **Kodlama:** her yeni saf lib, mevcut kalıpla (`const X=(()=>{...})();if(typeof module!=="undefined")module.exports=X;`), index.html `<script>` sırasına (kullanan UI dosyalarından önce), `package.json` test listesine eklenir.

---

## 3. İŞ 4: Antrenman

### Mevcutta olan (yeniden yazılmayacak)
- Çift ilerleme önerisi: `Algo.nextTarget` (lo 8, hi 12), `gSuggest`, `gAddEx` ön doldurma, kartta "Öneri: …" satırı.
- Rekor: `gPRs` (Epley 1TM, önceki en iyiye göre +0,05) yalnızca bitiş özetinde.
- Dinlenme sayacı: `REST_SEC=90`, ±15, atla, titreşim. (İş kapsamında değişmez.)

### Kabul koşulları
1. Ağırlıklı (k="w") egzersiz menüsünde "Plaka ve ısınma" açılır; hedef kg girilince bar başına bir taraf plaka listesi gösterilir (bar 20 kg varsayılan, değiştirilebilir). Tam yapılamayan ağırlıkta "en yakın: X kg" yazar.
2. Aynı sayfada ısınma setleri: boş bar × 10, %40 × 5, %60 × 3, %80 × 1 (her biri yapılabilir plakaya yuvarlanır, bar altı değerler atılır, tekrar eden değer tekilleşir). "Antrenmana ekle" ısınma setlerini egzersizin başına `done:false` olarak ekler, **ısınma setleri rekor ve hacim hesabına girmez** (alan `w:true`).
3. Set tamamlandığında (✓) 1TM tahmini o egzersizin geçmiş en iyisini geçerse anında toast "Yeni rekor: …" + titreşim; aynı antrenmanda aynı egzersiz için en fazla bir kez.
4. Egzersiz başına tekrar aralığı (ör. 5-8, 8-12, 12-15) seçilebilir; öneri bu aralığa göre hesaplanır. Seçilmemişse 8-12 (mevcut davranış aynen).

### Veri modeli
- `cleanGym` dönüşüne `exCfg:{[exId]:{lo,hi}}` (lo 1-30, hi lo+1..50, bilinen kimlikler) ve `bar` (5-50 kg, varsayılan 20) eklenir. `DEF`'e `exCfg:{},bar:20`.
- Set nesnesine isteğe bağlı `w:true` (ısınma). `cleanGym` set temizleyicisi `w===true` ise korur. `gBest`, `gWorkVol`, `gWorkSets`, `gWeekSets/Regions`, `gHistory` ısınmayı (`s.w`) dışarıda bırakır. Ortak süzgeç tek yerde: `gSetOk=s=>!s.w&&(s.reps>0||s.sec>0)` (gSetOk zaten her yerde kullanılıyor; `gBest` ve `Algo.volume` çağrıları da `!s.w` süzgecinden geçmeli).
- Plaka envanteri sabit: [25,20,15,10,5,2.5,1.25] (ayar yok, gereksiz).

### Dosyalar
- `www/algo.js`: `plates(total,bar,inv)` → `{side:[...],made}` açgözlü; `warmup(target,bar)` → `[{kg,reps}]`. `nextTarget` zaten `lo/hi` alıyor, değişmez.
- `www/gym.js`: `gSuggest` `S.exCfg[exId]` okur; "done" dalında rekor kontrolü (`gPRs` mantığından tek egzersizlik yardımcı `gIsPR(w,exId)` çıkarılır, `gPRs` onu kullanır); menüye "Plaka ve ısınma", "Tekrar aralığı".
- `gLive`'daki "Önceki" sütunu `prev.sets[si]` ile sıra eşler; ısınma setleri başa eklenince kayar. Önceki değer yalnız çalışma setleri sırasıyla eşlenmeli (ısınma satırında "ısınma" etiketi).
- `www/exui.js` (alt sayfa HTML'i burada daha uygun, gym.js zaten 376 satır).
- Plaka sayfası gösterimi: `pr` alanı **figür çizim aksesuarı**dır (build_exlib.py, `"pr":"bar@sh"` halter çizer). Halter göstergesi olarak `e.pr` "bar" ile başlıyorsa sayfa doğrudan "halter" modunda açılır, diğer k="w" egzersizlerde de menüden açılabilir. VARSAYIM: 54 "bar" kaydının hepsi gerçek halter; değilse yalnız varsayılan mod etkilenir, hesap bozulmaz.

### Testler
- `scripts/algo.test.js`: 100 kg/20 bar → taraf [25,15]; 61 kg → en yakın 60 ve made=60; bar altı hedef → boş liste; ısınma 100 kg → [20×10,40×5,60×3,80×1]; 30 kg hedefte tekrar eden/bar altı setler atılır; `nextTarget` lo 5 hi 8 ile 8'e ulaşınca artırır.
- `app.test.js` (jsdom): rekor toast'ı bir kez çıkar; ısınma setleri `gWorkVol` ve `gPRs`'e girmez; `exCfg` ve `w:true` yeniden yüklemede korunur, bilinmeyen egzersiz kimlikli `exCfg` atılır; eski yedek (exCfg yok) yüklenir.
- CI/smoke etkisi yok.

### Riskler
- Isınma setinin rekor/hacim hesaplarına sızması (tüm `sets.filter(t=>t.done…)` noktaları; gym.js'te ~8 yer, coach.js `cWorkoutEx`, WeeklyLib spor dakikası etkilenmez). Grep listesi: `\.done` ve `Algo.volume`.

---

## 4. İŞ 1a: Hızlı kayıt (JS)

### Kabul koşulları
1. "Dünkünü tekrarla" protein/karbonhidrat/yağ (ve 5. işten sonra lif/şeker/sodyum) dahil kopyalar; geri al çalışır.
2. Yemek ekle sayfasında "Son yediklerin": son 30 günün yemek kayıtlarından metne göre tekil, en yeniden eskiye 8 satır. Satıra dokununca **anında** seçili güne eklenir (makrolarla), toast + geri al.
3. Satırdaki ☆ ile favoriye alınır; "Favoriler" bölümü en üstte (en fazla 20). Favori, kayıt silinse de kalır (değer kopyası).
4. "Öğün şablonu": bir günün kayıt listesinden (Bugün ekranındaki gün) "Bu günün yemeklerinden şablon yap" → yemekleri işaretle, ad ver. Yemek ekle sayfasında şablon çipine dokununca tüm kalemler tek seferde eklenir, tek geri al.
5. Adım ekranında "Adım ekle (elle)": gün (son 7) + adım sayısı (1-100000). Sensör değeriyle **toplanır**, sensör senkronu onu ezmez. Adım ekranında elle eklenenler listelenir ve silinebilir.
6. "Sayım durdu" kartı: adım sayar açık ve (a) gece kapanışı 26 saatten uzun süredir yapılmadıysa ya da (b) dün 0 adım ve önceki 7 gün ortalaması 1000'in üstündeyse Bugün'de kart çıkar; Xiaomi'de mevcut `sheetOem()`'u, diğerlerinde `DH().openBattery()`'yi açar; "Kapat" o gün için gizler.

### Veri modeli
- Ortak sabit `NUTR=["p","c","f"]` (5. işte genişler) ve `copyNutr(src,dst)`; `repeatYesterday`, son yenilenler, favori, şablon hepsi bunu kullanır.
- `S.favFoods=[{text,v,p?,c?,f?}]` (≤20), `S.mealTpl=[{id,n,items:[{text,v,…NUTR}]}]` (≤20 şablon, ≤15 kalem). Temizleyici yeni saf `www/loglib.js` (`cleanFav`, `cleanTpl`, `recents(entries,today)`), `cleanHealthState`'e eklenir. Şablon kimliği yerel sayaç değil `Math.max(0,...ids)+1`.
- Elle adım: `{type:"adim",text:"elle",v}` ayrı kayıt. `cleanEntries` text'i zaten korur, **değişiklik gerekmez**. `setSteps` arama koşulu `x.type==="adim"&&x.day===day&&x.text!=="elle"` olur. Sonuç: tüm `sum("adim")` kullanıcıları elle ekleneni kendiliğinden toplar.
- **Gösterilen bugünkü adım:** `stepCard()` ve `viewAdim` halkası bellekteki sensör değeri `stepToday`'i okur, `sum("adim")`'ı değil. Bu yüzden ikisi de `stepToday + bugünün elle toplamı` gösterecek (tek yardımcı `stepsShown()`); aksi halde elle ekleme Trend/rapor/Koç'ta görünür ama Bugün kartında görünmez. Widget'ın yerelde tazelenen adımı elle eklenenleri içermez (kabul, uygulama açılınca düzelir).
- **Kural (ZOR NOKTALAR'da tekrar):** günün otomatik adımı için **tek** `adim` kaydı olur; ikinci otomatik kaynak ayrı kayıt olarak yazılmaz (her yerde toplanıp çift sayılır).
- `S.settings.stepWarnDay` (gün anahtarı, `dayOk`).
- Java: `StepStore.apply` `closeFirst` true iken `snapAt=System.currentTimeMillis()` yazar; `StepCounterPlugin.read` `snapAt` döndürür (yoksa 0, yeni kurulumda uyarı çıkmaz: 0 ise yalnız (b) koşulu).

### Dosyalar
- Yeni: `www/loglib.js`, `scripts/log.test.js`.
- `www/index.html`: `repeatYesterday`, `sheetYemek` (son yenilenler/favori/şablon bölümleri; eski "Sık yediklerin" çipleri ve `favList`/`data-fav` kaldırılır (önce `app.test.js`'te bunlara bakan test var mı grep'le), yerine `data-rc`/`data-fv`/`data-tp`), `setSteps`, `viewAdim` (elle ekleme düğmesi + liste), `viewBugun` (uyarı kartı), `DEF`, `cleanSettings`, `cleanHealthState`, script sırası.
- `assets/android/StepStore.java`, `StepCounterPlugin.java` (+3 satır).
- `package.json` test listesine `log.test.js`.

### Testler
- `log.test.js`: `recents` tekilleştirir ve sıralar, 30 günden eskiyi almaz; `cleanTpl` boş kalemli şablonu atar, sınırları uygular; `cleanFav` geçersiz kcal'i atar.
- `app.test.js`: dünkünü tekrarla p/c/f taşır; son yenilene dokununca kayıt makrolarla eklenir ve geri al siler; favori yeniden yüklemede kalır; şablon tek dokunuşla N kayıt ekler ve tek geri al hepsini siler; elle adım + `stepsSync` sonrası gün toplamı = sensör + elle (Capacitor sahtesi satır ~790'dan sonra); Bugün adım kartı ve Adım halkası da sensör + elle gösterir; elle adım Adım ekranında silinir; uyarı kartı `snapAt` eski iken çıkar, "Kapat" sonrası o gün çıkmaz; eski yedek (favFoods/mealTpl yok) yüklenir.
- CI: `StepMathTest` etkilenmez (snapAt StepStore'da). Smoke etkisi yok.

### Riskler
- `snapAt` yalnız gece alarmında yazılır; alarm Doze'da gecikirse 26 saat eşiği yanlış uyarı verebilir (eşik bilinçli olarak 26 saat).
- Tek dokunuşla ekleme yanlış dokunmaya açık: her zaman geri al'lı toast.

---

## 5. İŞ 5: Lif, şeker, sodyum

### Gerçek durum
OFF verisi **geliyor ama atılıyor**: `barkodBul` `fields=...nutriments...` ister, `OffLib.parse` yalnız `energy-kcal_100g, proteins_100g, carbohydrates_100g, fat_100g` okur. Saklama yeri `S.myFoods` (barkod `b`, `src:"off"`). Yerel FOODS (138 satır) ve etiket okuma lif/şeker/tuz içermez.

### Kapsam kararı
Vitamin/mineral (mikro besin) **kapsam dışı**: OFF'ta Türk ürünlerinde neredeyse hep boş, yerel tabloda yok, yanıltıcı kısmi toplam üretir. Yalnızca **lif, şeker, sodyum** (etikette "tuz" yazar; sodyum mg = tuz g × 400).

### Kabul koşulları
1. Barkodla eklenen OFF ürününde `fiber_100g`, `sugars_100g`, `sodium_100g` (yoksa `salt_100g/2.5`) varsa porsiyon önizlemesinde ve kayıtta görünür.
2. Etiket fotoğrafında "Lif / Diyet lifi", "Şeker / Şekerler", "Tuz" satırları okunursa aynı alanlar dolar.
3. Bugün ekranındaki makro satırının altında "Lif x g · Şeker x g · Sodyum x mg (n/m öğünde veri var)" yalnızca en az bir öğünde veri varsa görünür. Kapsam notu kısmi toplamı yanıltıcı olmaktan çıkarır.
4. Lif ve şeker OffLib'in kalori-makro tutarlılık kontrolüne **girmez** (şeker karbonhidratın alt kümesi; yalnız şeker ≤ karbonhidrat+0,5 ve lif ≤ 100 kontrolü); tutarsız alt alan atılır, ürün atılmaz.
5. Sınır değer yorumu ya da sağlık iddiası yok (yalnızca sayı).

### Veri modeli
- `NUTR=["p","c","f","fb","sg","na"]` (fb lif g, sg şeker g, na sodyum mg). Alan adları `su` gibi mevcut tür adlarıyla karışmasın diye kısa ve farklı.
- `cleanEntries`: yemek için `fb` 0-500, `sg` 0-2000, `na` 0-50000.
- `cleanMyFoods`: 100 g başına `fb` 0-100, `sg` 0-100, `na` 0-40000.
- `allFoods`, `foodCalc`, `foodPreview`, `goBesin` NUTR döngüsüne çevrilir (şu an p/c/f elle yazılmış; döngü kodu kısaltır).
- FOODS'a değer eklemek bu işte **yok** (veri işi; isteğe bağlı sonraki iş, USDA SR Legacy'den).

### Dosyalar
`www/offlib.js`, `www/labellib.js` (ROWS'a fb/sg/na; "doymuş" gibi SKIPF mantığı şeker için gerekmez), `www/ocrui.js` (etiket sonucunu kaydederken yeni alanlar), `www/index.html` (cleanEntries, cleanMyFoods, porsiyon, Bugün satırı), `www/coachlib.js` değişmez (bağlama eklenmez; bağlam boyutu korunur).

### Testler
- `off.test.js`: tuzdan sodyum hesaplanır; sodyum varsa tuz yok sayılır; şeker > karbonhidrat ise şeker atılır, ürün "ok" kalır; lif yokken önceki tüm testler aynen geçer.
- `label.test.js`: "Tuz 1,2 g" → na 480; "Şekerler 12 g" → sg 12; "Diyet lifi 3 g" → fb 3.
- `app.test.js`: barkod ürünü fb/sg/na ile myFoods'a girer ve kayda porsiyon oranında geçer; Bugün satırı "1/2 öğünde veri var" gösterir; eski kayıtlar (alan yok) satırı gizler.

### Riskler
- OFF'ta `sodium_100g` birimi gramdır (mg değil) – VARSAYIM, `off.test.js`'te gerçek bir ürün yanıtıyla sabitlenmeli.

---

## 6. İŞ 3: Aralıklı oruç + uyku + ruh hali

### Kabul koşulları
1. Bugün'de "Oruç" kartı: plan seçimi (14:10, 16:8, 18:6, 20:4), "Başlat" / "Bitir", geçen süre ve kalan süre (dakika hassasiyeti, ekran açıkken her dakika yenilenir).
2. Oruç hedef süresi dolunca bildirim (uygulama kapalıyken de). Bitirince kayıt geçmişe yazılır; son 7 orucun süresi listelenir.
3. İsteğe bağlı günlük "Oruç başlangıcı" hatırlatıcısı (Ayarlar > Hatırlatmalar, varsayılan kapalı).
4. Uyku kaydı: kalkış günü için yatış-kalkış saati (gece yarısını aşan doğru hesaplanır) ya da saat; kalite 1-5 isteğe bağlı. Gün başına tek kayıt, yeniden giriş üzerine yazar.
5. Ruh hali: 1-5 (emoji düğmeleri) + isteğe bağlı kısa not (≤100). Gün başına tek kayıt.
6. Koç'un 14 günlük tablosunda uyku saati ve ruh hali sütunları (yalnızca en az bir kayıt varsa).
7. Oruç sırasında bile yemek kaydı engellenmez; yorum yok. 18 yaş altı ya da sağlık notu varsa oruç kartında "hekimine danış" notu (mevcut `lossBlock` gerekçesi yeniden kullanılır), engelleme yok.

### Veri modeli
- `S.fast={plan:16,t0:null|ms,log:[{t0,t1}]}` (log ≤200, t1>t0, süre ≤72 sa). `S.sleep=[{day,min,q?,src?}]` (min 60-1080, q 1-5, src yalnız "hc"; ≤400). `S.mood=[{day,v,t?}]` (v 1-5, ≤400). Hepsi `cleanHealthState`'e, `DEF`'e boş varsayılan.
- Yeni saf `www/habitlib.js`: `cleanFast`, `cleanSleep`, `cleanMood`, `sleepMin(bed,wake)`, `fastState(fast,now)` → `{elapsed,left,done}`.
- Hatırlatıcı: `DEF.settings.reminders`'a `{id:11,t:"20:00",on:false,name:"Oruç başlangıcı",…}`. `cleanSettings` DEF'teki kimliklerle eşleştirdiği için eski veride kendiliğinden kapalı görünür.
- Oruç bitiş bildirimi kimliği **9100**, `scheduleReminders` içinde `S.fast.t0` varsa durumdan yeniden kurulur (ayrı yerde kurulmaz, aşağıya bkz.). Başlat/Bitir sonrası `scheduleReminders().then(setNotif)`.

### Dosyalar
Yeni: `www/habitlib.js`, `www/habitui.js` (oruç kartı, uyku/ruh hali sayfaları, olaylar `data-hb`), `scripts/habit.test.js`. Değişen: `www/index.html` (DEF, cleanHealthState, viewBugun'a kart, scheduleReminders'a 9100, script sırası), `www/coach.js` (`cData` satırına uyku/ruh), `www/coachlib.js` (`contextText` sütun başlığı koşullu), `package.json`.

### Testler
- `habit.test.js`: 23:30→07:00 = 450 dk; aynı saat girdisi reddedilir; `fastState` 16:8'de 10 sa sonra left=6 sa, 17 sa sonra done; temizleyici gün başına son kaydı tutar, aralık dışını atar.
- `app.test.js`: oruç başlatınca 9100 doğru saatte kurulur, bitirince kurulmaz ve log'a yazılır; hatırlatıcı 11 açılınca 1100+ kimlikler kurulur; uyku/ruh hali yeniden yüklemede ve yedekte korunur; eski yedek (alan yok) yüklenir; `contextText` uyku sütunu yalnız veri varken.
- Smoke: alarm sayısı kontrolü (≥100) etkilenmez.

### Riskler
- Oruç `t0` telefon saat dilimi değişince kayabilir (ms saklandığı için süre doğru kalır, yalnız gösterim değişir; kabul edilebilir).

---

## 7. İŞ 2: Koç analizi

### Kabul koşulları
1. **"Bu hafta neden kilo vermedim?"**: Koç'ta öneri çipi ve Trend'de düğme. Önce **yerel** etmen kartı (AI'sız, veri telefonda kalır): son 7 gün için
   - kalori: ortalama vs hedef, eksik kayıtlı gün sayısı (<800 kcal ya da kayıt yok, `weekSummary` ile aynı eşik);
   - su: ortalama vs hedef;
   - uyku: ortalama saat (3. iş verisi varsa);
   - adım: 7 gün ortalaması vs önceki 14 gün;
   - tartı gürültüsü: haftalık ham fark, trend çevresindeki son 28 günün artık standart sapmasının 2 katından küçükse "fark tartı oynaması aralığında" etiketi.
   Her etmen sabit Türkçe şablonla, rakamlar uygulamadan. Tıbbi iddia, tanı, "metabolizman yavaşladı" gibi ifade yok.
2. Kart altında "Koç'a yorumlat" düğmesi: yalnızca `consent` ve `usable().length` ise; etmenler "NOT" bloğu olarak gönderilir, modelden yalnız bu sayılarla 4-5 cümle istenir.
3. **Plato**: kilo verme hedefi varken (`goalKg < trend-0,5`, `lossBlock` boş) son 21 günde ≥6 tartı, ≥14 gün yayılım, OLS eğimi |eğim| < 0,1 kg/hafta **ve** eğimin %95 güven aralığı ±0,25 kg/hafta içinde ise, 14 günde en fazla bir kez Koç sohbetine yerel soru düşer: "Son 3 haftadır trendin düz. Birlikte bakalım mı?" + "Bak" (1. maddeyi açar). AI çağrısı kullanıcı dokunmadan yapılmaz.
4. **Koç'tan program**: Salon'da "Koç'tan program iste" → sayfa: haftada gün (2-6), ekipman (Salon / Ev tipi / Ağırlıksız), seans süresi (30/45/60), seviye. Koç yalnız verilen katalogdaki kimliklerle program döndürür; sohbette "program" kartı gün gün listeler; "Şablon olarak ekle" tek dokunuşla her günü `S.templates`'e ekler (mevcut şablon modeli `{id,name,ex:[ids]}`).
5. **Haftalık özet bildirimi**: Pazar 20:30 (Ayarlar'dan kapatılabilir) "Haftalık özetin hazır". Dokununca Koç sekmesi (consent varsa; mevcut `cAuto` haftalık mesajı üretir), yoksa Trend açılır.
6. Koç erişimi değişmez: AI çağrıları yalnız `cAsk` üzerinden (sağlayıcı `on&&health&&key`), her yeni akış `S.settings.consent`'i **kendisi** kontrol eder (cAsk kontrol etmez). Kullanıcı başlatmadan yapılan çağrılar `auto=true` geçer (onaylı sağlayıcıda `confirm()` açılmaz).

### Veri modeli
- `S.settings.lastPlateau` (dayOk), `weeklyNotifOn` yerine hatırlatıcı: `DEF.settings.reminders`'a `{id:12,t:"20:30",on:true,dow:0,name:"Haftalık özet (Pazar)",title:"📊 Haftalık özet",body:"Haftanın özeti hazır, bakmak için dokun."}` → kimlik 1200-1229, mevcut `dow` desteği kullanılır.
- `cleanCoach`: kart türlerine `why` (`{kind:"why",items:[{k,t}]}` metin ≤160, ≤6 öğe) ve `program` (`{kind:"program",name,days:[{n,ex:[ids]}],state}`; kimlikler `EXMERGED` + ham `r.customEx` kimlikleriyle doğrulanır, **`S` kullanılmaz** (bkz. bölüm 2 madde 7), gün ≤6, egzersiz 2-8) eklenir. Aksi halde yeniden yüklemede kartlar kaybolur.
- `CoachLib.parse` sabit anahtar döndürür → `program` anahtarı eklenir; `CoachLib.cleanProgram(p,knownIds)` saf.
- Program JSON'u kartta tutulur, `m.text`'e yazılmaz (geçmiş son 10 mesajı yeniden gönderir; bağlam şişmez).

### Dosyalar
Yeni: `www/insightlib.js` (`weekWhy(data)`, `plateau(weights,today)`, `noiseSd(weights)`), `scripts/insight.test.js`. Değişen: `www/coach.js` (çip, `cWhy()`, `cPlateauCheck()` ayrı çağrı (açılışta ve `visibilitychange`'te; `cAuto`'nun consent/sağlayıcı/30 dk korumasından **önce ve bağımsız**, çünkü yerel çalışır), `cProgram(opts)`, kart çizimi ve tıklamalar), `www/coachlib.js` (parse, cleanProgram, SYSTEM'e program kuralı tek satır), `www/gym.js` (Salon düğmesi), `www/index.html` (Trend düğmesi, DEF, cleanSettings, bildirim dokunma dinleyicisi, script sırası), `package.json`.

### Bağlam boyutu (program)
- Katalog yalnız program isteğinde, `extraSys` olarak: seçilen ekipmana uyan, `k==="w"||k==="b"` egzersizlerden bölge başına en fazla 4 (önce eski 16 klasik + seviye uyumlu), toplam ≤60 satır, satır `id|ad|bölge` (~25 karakter → ~1,5 KB).
- `max_tokens` program için 900; yanıt bozuksa "Program okunamadı, tekrar dene" (kart yok).
- Test: `contextText`+katalog uzunluğu < 9000 karakter (Groq ücretsiz TPM sınırına karşı; VARSAYIM: Türkçe ~3 karakter/token).

### Bildirim dokunma
`LocalNotifications.addListener("localNotificationActionPerformed", e=>…)`: `e.notification.extra.act==="open"` ise `tab=e.notification.extra.tab;render()`. Yalnız `actionId==="tap"` için; "su"/"med" düğmeleri yerel taraf (QuickLogPlugin) tarafından zaten yakalanıyor, dinleyici onlara dokunmaz. VARSAYIM: Capacitor 6 local-notifications soğuk açılışta da bu olayı iletir; telefonda doğrulanacak, olmazsa yalnız uygulama açılır (zararsız).

### Testler
- `insight.test.js`: düz seri (±0,3 kg gürültü, 21 gün, 10 tartı) → plato; −0,5 kg/hafta seri → değil; 4 tartı → yetersiz veri; gürültülü ama eğilimli seride güven aralığı geniş → plato değil; `weekWhy` eksik kayıtlı günleri sayar, hedef yoksa kalori etmeni "hedef yok" der, uyku verisi yoksa etmen çıkmaz.
- `coach.test.js`: `cleanProgram` bilinmeyen kimliği atar, 1 egzersizli günü atar, 7. günü keser; parse `program` anahtarını döndürür.
- `app.test.js`: "neden" kartı consent yokken de yerel çıkar ve hiçbir `fetch` çağrılmaz; "Koç'a yorumlat" consent yokken çağrı yapmaz; plato sorusu bir kez düşer, 14 gün içinde tekrar düşmez; program kartı "Şablon olarak ekle" ile N şablon oluşturur ve kart yeniden yüklemede kalır; hatırlatıcı 12 Pazar 20:30'a kurulur ve `extra.act==="open"` taşır; dinleyici `tab`'ı değiştirir.
- Smoke etkisi yok (alarm sayısı artar).

### Riskler
- Model katalog dışı kimlik uydurur → `cleanProgram` atar; hepsi atılırsa kart çıkmaz.
- Yerel etmen metinleri "suçlayıcı" olmamalı (Koç kuralı); metinler test edilen sabitler.

---

## 8. İŞ 1b: Ana ekran widget'ı

### Kabul koşulları
1. 2×1 (yeniden boyutlanabilir) widget: kalan kalori (hedef yoksa "hedef yok"), su "1,2 / 2,5 L", adım (adım sayar açıksa).
2. "+250" (aslında `S.settings.glass`) düğmesi uygulama arayüzü görünmeden su ekler (bildirim düğmesiyle aynı davranış), widget'taki su hemen artar, uygulama açılınca kayıt ana veriye geçer.
3. Uygulamada su/yemek/adım değişince widget güncellenir; gün değişince widget bugünkü veriye geçmeden önce su ve kaloriyi "–" gösterir (dünkü değer bugünmüş gibi görünmez).
4. Widgete dokununca uygulama Bugün sekmesinde açılır.

### Tasarım (en kısa yol)
- "+250" (güncel): `PendingIntent.getBroadcast(WaterReceiver, 7202)`, exported=false; alıcı `QuickLogPlugin.handle`'ı aynı ek alanlarla çağırır. Ekran açılmaz, activity intent'inin yeniden teslimiyle çift su oluşmaz. Bildirim düğmeleri activity yolunda kalır; tekrar teslimde `extra.at` (planlanan an) + kimlik imzası `nw_quick/seen`'de tutulur, görülmüş imza yok sayılır.
- "+250" (ilk tasarım, değişti): `PendingIntent.getActivity(MainActivity)` ile **bildirim düğmesiyle aynı ek alanlar** (`LocalNotificationUserAction=su`, `LocalNotficationObject={"extra":{"act":"su","v":<glass>}}`). `QuickLogPlugin.handle` bunu zaten kaydedip ekranı arkaya alıyor ve smoke bu yolu zaten test ediyor. `handle` su kaydından sonra `NeoWidget.bump(c,v)` çağırır (widget önbelleğine ekleyip yeniler).
- Veri: JS → `Widget.update({day,water,waterGoal,glass,kcalLeft,steps})` → SharedPreferences `nw_widget` → `AppWidgetManager.updateAppWidget`. JS tarafı `save()` içinde değil, `render()` sonunda değişiklik varsa çağırır (son gönderilen JSON ile karşılaştırma, köprü trafiği az).
- Adım: widget `onUpdate`'te (updatePeriodMillis 30 dk, sistem alt sınırı) `StepStore.read` ile tazelenir (goAsync; adım sayar kapalıysa gizli).
- Request code: 7201 (tıkla-aç), 7202 (+su). 7001/7002 dolu.

### Dosyalar
Yeni: `assets/android/NeoWidget.java` (AppWidgetProvider + statik `push/bump`), `assets/android/WidgetPlugin.java`, `assets/android/res/layout/nw_widget.xml`, `assets/android/res/xml/nw_widget_info.xml`, `assets/android/res/drawable/nw_widget_bg.xml`. Değişen: `assets/android/QuickLogPlugin.java` (`bump`), `scripts/patch-android.js` (kopya listesine iki sınıf; `registerPlugin(WidgetPlugin.class)`; manifest'e `<receiver android:name=".NeoWidget" android:exported="true"><intent-filter><action android:name="android.appwidget.action.APPWIDGET_UPDATE"/></intent-filter><meta-data android:name="android.appwidget.provider" android:resource="@xml/nw_widget_info"/></receiver>`), `www/index.html` (`widgetPush()`, NW-DIAG listesine `Widget`), `scripts/smoke.sh` (eklenti döngüsüne `Widget`; `cmd package query-receivers` ile alıcının kayıtlı olduğu; mevcut "+250" benzetiminden sonra `nw_widget.xml`'de suyun arttığı).
- Saf mantık gerekmez (yalnız biçimleme); Java testi yok.

### Testler
- `app.test.js`: Widget sahtesiyle `render()` sonrası `update` doğru alanlarla bir kez çağrılır, değişiklik yoksa tekrar çağrılmaz; kcal hedefi 0 iken `kcalLeft:null`.
- Smoke: yukarıdaki üç kontrol. Widget görünümü emülatörde doğrulanamaz → telefon test listesine (`docs/yapilacaklar.md`) madde.

### Riskler
- `exported="true"` zorunlu (sistem APPWIDGET_UPDATE gönderir); su ekleme bu alıcıda değil exported=false `WaterReceiver`'da, dışarıdan tetikleme yüzeyi genişlemez.
- MIUI'de widget güncellemesi gecikebilir; değerler uygulama açılışında düzelir.
- Widget'ta ekran açılmaz; bildirim düğmesinde ekran kısa yanıp söner (Capacitor mekanizması).

---

## 9. İŞ 6: Health Connect (isteğe bağlı, en son)

**Ön koşul:** Semih'in Mi Band/saati var mı ve verisi Health Connect'e yazılıyor mu (Mi Fitness/Zepp ayarı)? Yoksa iş yapılmaz: telefon adımı zaten aynı sensör, uyku kaynağı da olmaz.

### 6.0 Keşif (kod yok, Opus)
Doğrulanacaklar (developer.android.com "Health Connect get started" ve npm'den; ezberden yazılmayacak):
- `androidx.health.connect:connect-client` güncel kararlı sürüm, gerektirdiği **minSdk** (mevcut 23, patch-android yükseltiyor) ve **compileSdk** (Capacitor 6 varsayılanı 34; AGP sürümü yeterli mi).
- Kitaplık Kotlin `suspend` API'si: Java'dan doğrudan çağrılamaz. Seçenekler: (a) Kotlin eklentisini patch-android ile kökte ve app'te açıp küçük bir Kotlin sınıfı, (b) Capacitor 6 `peerDependencies` uyumlu topluluk eklentisi (adım + uyku + nabız okuyabiliyor mu). Karar keşifte.
- Gerekli manifest öğeleri: `android.permission.health.READ_STEPS`, `READ_HEART_RATE`, `READ_SLEEP`; `<queries><package android:name="com.google.android.apps.healthdata"/></queries>`; Android 13 ve altı için izin gerekçe intent filtresi (`androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE`), Android 14+ için `VIEW_PERMISSION_USAGE` + `HEALTH_PERMISSIONS` kategorili activity-alias. **Bunlar eksikse izin penceresi sessizce açılmaz**; hangilerinin zorunlu olduğu dokümandan doğrulanır.
- İzin öncesi 30 günden eski veri ek izin ister; okuma penceresi 14 gün tutulur, ek izin istenmez. Arka planda okuma yok (yalnız uygulama açılınca).

### Kabul koşulları
1. Ayarlar > "Health Connect" (yalnız telefon ve HC kullanılabilirse): Bağlan → sistem izin ekranı (adım, uyku, nabız ayrı ayrı); HC yüklü değilse (Android ≤13) Play Store'a yönlendirir.
2. **Adım kaynağı ayarı:** "Otomatik (büyük olan)" varsayılan / "Yalnız telefon" / "Yalnız Health Connect". Gün değeri **asla toplanmaz**.
3. Uyku: HC uyku oturumları kalkış gününe yazılır (`src:"hc"`); aynı gün elle kayıt varsa elle olan kazanır.
4. Nabız: günlük dinlenik/ortalama (varsa `RestingHeartRateRecord`, yoksa gün içi en düşük ve ortalama) Trend'de kart; yorum, eşik, uyarı yok.
5. Uygulama HC'ye **yazmaz** (yazma izni istenmez) → geri besleme döngüsü olmaz.

### Çift sayım kuralları
- Günün otomatik adımı tek `adim` kaydında: `e.ph` (telefon), `e.hc` (HC), `e.v=max(ph,hc)` (ayara göre yalnız biri). `setSteps` `ph`'yi, `hcSync` `hc`'yi yazar, ikisi de `v`'yi yeniden hesaplar. Bugün kartı/Adım halkası da `stepToday` yerine bu birleşik değer + elle toplamı göstermeli (`stepsShown()`). Eski kayıtta `ph` yoksa `v` telefon değeri sayılır. `cleanEntries` adim için `ph`/`hc`'yi korur.
- Neden max: Mi Fitness/Google Fit telefon adımını da HC'ye yazıyor olabilir; toplamak %20-40 şişirir (docs/adim-arastirma.md). HC kendi içinde kaynakları önceliğe göre birleştirir (aggregate), biz yalnız telefonla HC'yi max'la birleştiririz.
- Elle adım (`text:"elle"`) üstüne eklenir; HC açıkken elle ekleme sayfasında "saat/bant adımları zaten sayılıyor olabilir" notu.
- Hareket algılama (MotionPlugin) adım toplamına hiç eklenmez (yalnız aralık özeti), HC'den etkilenmez. HC egzersiz oturumları okunmaz → spor/salon kayıtlarıyla çift sayım yok.

### Veri modeli
- `S.settings.hcOn`, `stepSrc` ("auto"|"phone"|"hc"); `S.hr=[{day,rest?,avg?,min?}]` (≤400, 30-220) `cleanHealthState`'e. Uyku 3. işteki `S.sleep` (`src:"hc"`).
- Yeni saf `www/hclib.js`: `mergeSteps(entry,{ph,hc},src)`, `sleepFromSessions(list)`, `cleanHr`.

### Dosyalar
Yeni: `assets/android/HealthPlugin.java` (ya da keşif kararına göre .kt), `www/hclib.js`, `www/hcui.js`, `scripts/hc.test.js`. Değişen: `scripts/patch-android.js` (izinler, queries, intent filtreleri/activity-alias, bağımlılık, gerekirse minSdk/compileSdk/Kotlin, kopya listesi, `registerPlugin`), `www/index.html` (`setSteps`, `cleanEntries` ph/hc, NW-DIAG'a `Health`), `.github/workflows/apk.yml` (Kotlin gerekirse derleme adımı değişmez; saf Java mantığı yoksa javac satırı aynı), `scripts/smoke.sh` (eklenti döngüsüne `Health`; emülatörde HC yok → yalnız eklentinin yüklendiği ve "kullanılamaz" durumunun hatasız döndüğü).

### Testler
- `hc.test.js`: auto → max; phone → ph; hc → hc; ph yok eski kayıt → v korunur; gece yarısını aşan uyku oturumu kalkış gününe; aynı gün iki oturum toplanır, uyanık evreler düşülür.
- `app.test.js`: HC sahtesiyle senkron sonrası gün toplamı ph+hc değil max; elle adım üstüne eklenir; elle uyku HC uykusunu ezmez; eski yedek yüklenir; `stepSrc` yedekte korunur.
- Smoke: eklenti yüklü, `status()` hatasız.

### Riskler
En yüksek riskli iş: Gradle/SDK/Kotlin değişikliği tüm APK derlemesini kırabilir (ayrı dalda, önce yalnız 6.0 + boş eklentiyle CI yeşil alınmalı); izin akışı üretici farkları; minSdk yükseltmesi eski cihazları düşürür.

---

## 10. ZOR NOKTALAR

### 10.1 Bildirim kimlikleri (mevcut + yeni)

| Kimlik | Kullanım | Not |
|---|---|---|
| 99 | Test bildirimi (`notifTest`) | |
| 100-1029 | Hatırlatıcılar `r.id*100+i`, r.id 1-10, i<30 gün | **yeni hatırlatıcı r.id ≤ 89 olmalı** (90 → 9000-9029, 9001/9002 ile çakışır) |
| 1100-1129 | YENİ hatırlatıcı 11: oruç başlangıcı | |
| 1200-1229 | YENİ hatırlatıcı 12: haftalık özet (Pazar) | |
| 7101 | MotionGpsService ön plan bildirimi (yerel) | LocalNotifications ile aynı NotificationManager kimlik alanı, JS kullanmamalı |
| 9001 | Süreli set zamanlayıcısı (exui.js) | `scheduleReminders` iptal etmez |
| 9002 | Dinlenme bitişi (gym.js `gRestSet`) | `scheduleReminders` iptal etmez; set ✓ ile kurulur, Atla/süreli set/antrenman bitir-iptal ile iptal, doğal bitişte iptal edilmez (teslim edileni silmesin) |
| 9100 | YENİ oruç bitişi | `scheduleReminders` içinde durumdan yeniden kurulur |
| 1.001.000-1.999.239 | İlaç ana: `1e6+m.id*1000+ti*40+off` | |
| +1e6, +2e6 (→3.999.239) | İlaç tekrarları (10, 20 dk) | |

PendingIntent request code: 7001 (StepSnapshotReceiver gece alarmı ve MotionReceiver, farklı bileşen olduğu için çakışmıyor), 7002 (Motion tick), 7003 (StepSnapshotReceiver 23:58 örneği). Widget için 7201/7202. Native alarmlar (7001, 7002, 7003) LocalNotifications'ın 440 bütçesinin dışında, 500 sınırına 60 pay kalır.

Üç tuzak:
1. `scheduleReminders` 9001 ve 9002 dışındaki **tüm** bekleyen bildirimleri iptal eder. Tek seferlik bildirimler (oruç 9100, ileride başka) başka yerde kurulursa bir sonraki çağrıda silinir; **mutlaka `scheduleReminders` içinde durumdan** üretilmeli.
2. `QuickLogPlugin.handle` ve `scheduleReminders`'ın teslim edilmiş bildirim temizliği `id ≥ 1.000.000`'u ilaç sayar (kardeşlerini iptal eder). Yeni kimlikler 1.000.000'un altında kalmalı.
3. Toplam alarm bütçesi `MedLib.BUDGET=440` (Android 500 sınırı); 9001 ve 9002 ile en çok 442, yerel 3 alarmla 445. Yeni bildirimler aynı listeye girer ve en yakın tarihliler korunur; günlük yeni hatırlatıcı 30 alarm daha demek.

### 10.2 Yüksek riskli / ince parçalar ve kime verileceği

| Parça | Neden zor | Model |
|---|---|---|
| Health Connect (6.0-6.2) | Kotlin/coroutine köprüsü, SDK/minSdk, izin penceresinin intent filtresi olmadan sessizce açılmaması, üretici farkları, çift sayım | **Opus** |
| Widget (1b) | RemoteViews, PendingIntent bayrakları (IMMUTABLE), MainActivity yolunun yeniden kullanımı, gün değişimi, adım tazeleme goAsync, smoke | **Opus** |
| Plato istatistiği (2.1) | OLS eğimi + güven aralığı + gürültü ölçüsü; yanlış pozitif Koç'u bezdirir, yanlış negatif işe yaramaz; tartı aralıkları düzensiz | **Opus** |
| Koç program + bağlam boyutu (2.4) | Katalog seçimi, token sınırı, model çıktısı doğrulama, kart kalıcılığı (`cleanCoach`, `parse`) | **Opus** |
| "Neden" analizi metinleri (2.2) | Tıbbi iddia içermeyen, suçlamayan sabit metinler; consent kontrolü | orta (Sonnet yeter, gözden geçirme Opus) |
| Sayım durdu (1a.5) | Java + eşik seçimi | orta |
| Oruç bildirimi (3.3) | scheduleReminders içinde üretim | orta |
| Bildirim dokunma derin bağlantı (2.5) | Soğuk açılış davranışı telefonda doğrulanmalı | orta |
| Plaka/ısınma, rekor, tekrar aralığı (4) | Saf hesap + mevcut kalıp; tek ince nokta ısınma setlerinin hesaplardan dışlanması | basit |
| Son yenilenler, favori, şablon, elle adım (1a.1-1a.4) | Mevcut kalıplar | basit |
| Lif/şeker/sodyum (5) | Alan ekleme + OFF tutarlılık sınırı | basit |
| Uyku, ruh hali, oruç verisi (3.1-3.2) | Temizleyici + sayfa | basit |

### 10.3 Diğer ince noktalar
- **Adım çift sayımı:** `sum("adim")` bir günün tüm adim kayıtlarını toplar. Elle kayıt bu yüzden bedavaya toplanır; ama ikinci bir **otomatik** kaynak (HC) ayrı kayıt olarak yazılırsa her ekranda çift sayılır. Kural: otomatik kaynaklar tek kayıtta birleşir (`max`), yalnız elle kayıt ayrıdır.
- **Koç consent:** `cAsk` consent kontrol etmez; yeni her AI akışı kendisi kontrol eder. Otomatik akışlar `auto=true`.
- **Kalıcılık:** `cleanCoach` yalnız log/food/safety/propose kartlarını ve plan/weekly türlerini tutar; yeni kart türleri eklenmezse yeniden yüklemede kaybolur.
- **Test düzeni:** app.test.js tek, iç içe async akış; Capacitor sahtesi ~790. satırda kurulur, yerel eklentiye dayanan testler ondan sonra, her iş kendi `{…}` bloğunda. Yeni test dosyaları `package.json` `test` satırına, yeni saf Java sınıfları CI `javac` satırına ve `patch-android.js` kopya listesine, yeni eklentiler `smoke.sh` döngüsüne ve index.html NW-DIAG listesine **elle** eklenir (otomatik keşif yok).
- **Yedek:** yeni diziler `cleanHealthState`'ten geçtiği sürece `load` ve `goYukle` ayrı düzenleme istemez; ayarlar için `cleanSettings` satırı şart.

---

## 11. Açık sorular (Semih)
1. Mi Band / saat var mı, verisi Health Connect'e gidiyor mu? (6. iş buna bağlı.)
2. Haftalık özet bildirimi varsayılan açık mı olsun? (Planda açık.)
3. Widget'ta adım gösterilsin mi (30 dk gecikmeli)? (Planda evet.)
