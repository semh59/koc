# NeoWell tasarım dili

Hedef sakin, kendinden emin, az süslü bir arayüz (Apple Sağlık, Oura, Hevy çizgisi). Tüm değerler `www/app.css` başındaki `:root` token'larından gelir (koyu tema aynı dosyada, hemen altında). Yeni bir stil yazmadan önce token'a ve aşağıdaki ortak sınıflara bak.

## Token'lar
Kurallar `scripts/design.test.js` ile denetlenir: ölçek dışı punto, token dışı yarıçap, tarayıcı `confirm()` çağrısı, eksik koyu tema karşılığı, tanımsız `var(--x)` ve 80'i aşan satır içi stil testte kalır.

| Grup | Token | Değer (açık / koyu) | Kullanım |
|---|---|---|---|
| Marka | `--prim`, `--prim-btn`, `--prim-ink`, `--prim-soft` | #0f5c55 / #4fc2a8 | Birincil eylem, seçili durum, bağlantı |
| Yüzey | `--bg`, `--card`, `--soft`, `--field` | | Sayfa, kart, tonlu zemin, giriş alanı |
| Metin | `--ink`, `--mut` | #10232b, #56666d | Gövde, ikincil metin |
| Kenar | `--line`, `--fbd`, `--card-bd` | | Ayırıcı, alan kenarı (3:1), koyu temada kart çizgisi (3:1; açıkta saydam) |
| Durum | `--ok`, `--warn`, `--info` (+`--info-ink`) | #2b7a3b, #b03a24, #1f5f86 | Başarı, uyarı ve silme, bilgi düğmesi |
| Kutu | `--ban-*`, `--inf-*`, `--forecast-*` | | Uyarı kutusu, bilgi kutusu, tahmin rozeti |
| Veri | `--water`, `--kcal`, `--exercise` (+`--exercise-ink`) | | Halka, grafik ve veri vurgusu; metin olarak da kullanılabilir (açık tema tonları 4,5:1) |
| Katman | `--scrim`, `--tbg`, `--tfg`, `--tact`, `--knob` | | Arka örtü, toast, anahtar topuzu |
| Yazı | `--fs-cap` 14, `--fs-s` 14, `--fs-2` 15, `--fs-1` 16, `--fs-h3` 18, `--fs-h2` 20, `--fs-h1` 24, `--fs-num` 34 | | Etiket, ikincil, gövde-2, gövde, sheet başlığı, bölüm başlığı, ekran başlığı, büyük rakam |
| SVG yazısı | `--fs-svg` 14 (viewBox birimi), kas haritası etiketleri 12 | | Grafik ekseni 360 px ekranda ≈12 px; büyük yazıda 16 birimde durur. SVG yazısı 12 biriminin altına inmez |
| Boşluk | `--sp-1`..`--sp-6` | 4, 8, 12, 16, 24, 32 | Kart iç 16, kart arası 12, bölüm 24 |
| Köşe | `--r-xs` 8, `--r-s` 12, `--r` 16, `--r-xl` 24, `--r-pill` 999 | | Küçük alan, düğme ve alan, kart, sheet ve yazma alanı, hap; daire `50%` |
| Gölge | `--sh-1`, `--sh-2` | koyuda `none` / 1 px çizgi | Kart; toast, sheet, onay penceresi |
| Hareket | `--dur-1` 120 ms, `--dur` 200 ms, `--dur-3` 320 ms, `--dur-sheet` 240 ms, `--ease` | | Basış, geçiş, büyük geçiş, sheet yukarı kayma |
| Ölçü | `--hit` 48, `--nav-h` 56 (yatayda `--hit`), `--ring-w` 7, `--toast-b` | | Dokunma hedefi (geri, gezgin, kapat, adım, anahtar satırı, çip), alt menü en az yüksekliği, halka çizgisi, toast konumu |

- **Renk kuralı.** Renkler 6 haneli hex yazılır; çiftleri `scripts/contrast.test.js` denetler (metin 4,5; grafik, kenar ve koyu kart çizgisi 3). Ham renk değeri yalnız `:root` içinde olur; tek istisna beyaz kâğıda çizilen canvas raporlarıdır: renkleri `Algo.PAGE.c` nesnesindedir (doktor, haftalık, tansiyon/şeker ve tahlil PDF'i). Koyu tema bloğu iki yerde aynı tutulur (medya sorgusu ve `data-theme="dark"`); test ikisini ve her renk token'ının koyu karşılığını karşılaştırır.
- **Yazı kuralı.** Sistem yazı tipi yığını; ek dosya yok. `font-size` yalnız ölçekteki değerleri alır, 12 px (SVG'de 12 birim) altı yoktur. Başlık sırası h1 > h2 > h3 > gövde. Rakamlar tabular yazılır (`.num`, `.stat .v`, tablo). Büyük yazıda sığması gereken birkaç yer bilinçli sınırla büyür: alt menü etiketi `min(--fs-cap, max(12px, 4vw))`, halka rakamı halka çapının oranı, set tablosu başlığı `3,3vw`, SVG ekseni 16 birim.
- **Yükseklik.** Yazıyla büyüyebilecek öğede sabit `height` yerine `min-height` kullanılır.
- **Hareket.** `prefers-reduced-motion` açıksa geçiş, animasyon ve basış küçülmesi kapanır. `transition:all` yazılmaz.
- **Satır içi stil.** Yalnız hesaplanan değer (genişlik yüzdesi, dinamik renk) için. Sabit değer için yardımcı sınıf kullanılır: `.m0 .mt-1 .mt-2 .mt-3 .mb-2 .mb-3 .my-1 .my-2 .p0 .pt-2 .pv-1 .pv-2 .flush .sep .grow .db .ib .tc .ta-r .nw .w100 .wa .b7 .ink .pc .t-h1 .t-h2 .g2 .g3 .rxs .tl .pl-4 .w-hit .w-kg .outbox`. Düğme ızgarası tek sınıf: `.bgrid` (en az 8em genişlikte sütunlar).

## Bileşenler
- **Kart.** Tek sınıf `.card`. İçinde liste satırları varsa üst ve alt boşluk kendiliğinden azalır.
- **Satır.** Tek tanım: `.row` en az 56 px, esnek, aradaki çizgi üstte, kapsayıcıdaki ilk satırda çizgi yok; ilk metin bloğu kalan genişliği alır. Değiştiriciler aynı kuralı paylaşır: `.prow` gezinme (`navRow(attr, ikon, başlık, alt satır)`, sağda ›, yıkıcıda ` dng`), `.rrow` rapor, `.lrow` etiket-değer, `.chkrow` anahtar (`swRow`), `.rem` hatırlatma, `.trow` şablon kartı, `.field` ayar alanı. `.row.wrap` ve Bugün yapılacaklar satırı büyük yazıda eylemi alt satıra indirir; metin harf harf sütuna dönmez.
- **Düğme.** Bir ekranda tek birincil düğme olur (`.btn`). İkincil düğme `.btn.ghost` (tonlu zemin, marka rengi metin), yıkıcı düğme `.btn.danger` (çerçeveli, uyarı rengi), metin düğmesi `.lnk`. Güvenlik kutusunda mavi birincil `.btn.info`. Tam genişlik satır düğmesi `.rbtn` ile metin düğmesi `.lnk` aynı kuralı paylaşır. Hepsinin yüksekliği en az 48 px, metni 600 kalınlıkta, basınca hafifçe küçülür.
- **Onay penceresi.** Tarayıcı `confirm()` kullanılmaz. `confirmSheet({title, body, ok, no, danger})` Promise<boolean> döner; başlık soru, gövde sonucu anlatır, düğme fiildir ("Sil", "Hepsini sil"). Yıkıcı onayda `danger:true`. Ayrı katmandır (`#cfm`, `role="alertdialog"`): açık sheet'i kapatmaz, odak Vazgeç'te başlar ve içeride döner, Escape ve geri tuşu iptal eder, odak tetikleyiciye döner. Testte `window.__confirmAuto` ya da saplama `window.confirm` varsa pencere açılmaz, yanıt eşzamanlı gelir; e2e fikstürü bunu tarayıcı onayına yönlendirir (`dialogs:false` gerçek pencereyi açar).
- **Boş durum.** `emptyCard(ikon, başlık, tek cümle, eylem)` → `.card.empty`: 48 px çizgi ikon, başlık, tek cümle, en çok bir düğme.
- **Bölüm başlığı.** `.grp` 14 px, 600, `--mut`, büyük harf; ekranda `h2.grp`, sheet içinde `h4.grp`; liste içi grup başlığı (`.log .gh`) aynı stili kullanır.
- **Ayrıntı.** Yedek ve parola gibi uzun metinler görünürde tek cümledir, gerisi ⓘ ile açılır. Uzun açıklama karta gömülmez: `.help` (48 px "ⓘ" düğmesi, `aria-expanded`) kartın içinde, açıklama `.helpx` kutusunda hemen altında açılır (`helpBtn(id,ad)` + `helpBox(id,metin)`, anahtarla birlikte `swHelp`). Modül anahtarı `modRow`: anahtar, tek cümle, ⓘ; açıkken ek ayarlar altında. Katlanır içerik `details.acc` > `summary` ile yazılır (klavye ve ekran okuyucu yerel davranışı kullanır).
- **Alan.** `.field` satırı etiket, `small` yardım metni ve alanı taşır. Hata metni `.ferr` (`role="alert"`, 14 px, 600, `--warn`) alanın hemen altında, kartın içindedir.
- **Giriş alanı.** Tek stil: `input.in`, `select.in`, `textarea.in`, ayarlar alanları ve set kutuları. Zemin `--field`, kenarlık `--fbd` (3:1), odakta marka renginde halka. Arama kutusu `type="search"` olur ve büyüteç ikonu stilden gelir. `.in` adı alt menünün kapsayıcısında da geçtiği için stil yalnız form öğelerine verilir.
- **Çip ve rozet.** `.chip` hap biçimli, `--soft` zeminli, en az 48 px. Seçili çip `aria-pressed="true"` ile marka rengini alır. `.tag` küçük durum rozetidir (`--prim-soft`). `.seg` ve `.seg2` segment seçicilerdir.
- **Hızlı çipler.** Bugün'ün çip sırası sabittir (kullanıma göre yer değiştirmez): su ve içecek türü yan yana ilk, sonra Kilo, Spor, açık modül çipleri, Not, Yürüyüş. Ayırıcı için `.sep` (üst çizgi ve boşluk): yıkıcı eylem (Seti sil) seçeneklerden ayrı durur ve onaylanır.
- **Onay satırı.** `swRow(attrs,on,etiket)` anahtar (`.sw`) ve etiketi tek 48 px satırda verir; çıplak onay kutusu kullanılmaz.
- **Katman.** Sheet ve rehber açılınca arka plan `inert` olur, Tab katman içinde döner, Escape kapatır ve odak tetikleyiciye döner (`openSheet`, `trap`). Sheet başlığı (18 px) `aria-labelledby` ile ada bağlanır; üstte tutamaç, sağ üstte 48 px ✕ ("Pencereyi kapat") bulunur, açılış 240 ms yukarı kaymadır.
- **Alarm ekranı.** `#alarm` (`www/modules/meds/alarmui.js`) en üst katmandır (sheet ve onay penceresinin üstünde, opak `--bg` zemin): `role="alertdialog"`, açılınca odak başlıkta, arka plan `inert`, Escape ve geri tuşu kapatır. Saat `min(2 × --fs-num, 22vw)`; büyük yazıda ekran genişliğiyle sınırlanır. Satır `.row.wrap`, Aldım ve Atla en az 56 px; alt çubukta "Hepsini aldım" (yalnız aynı gün ve aynı dakikadaki en az 2 doz için; dakika başına bir düğme), "10 dk sonra hatırlat", "Uygulamayı aç". Dünkü dozun satırında "dün" yazar. İlaç adı gizliyse ad ve doz yazılmaz.
- **Toast.** Düz mesaj 6 sn, "Geri al" taşıyan 10 sn açık kalır. Konum yalnız `--toast-b`: alt menünün üstünde, menü büyüdükçe (`--nx`) yükselir; Koç'ta yazma alanının üstüne (`--cmp`) çıkar. "Geri al" en az 48 px. Sheet açılınca toast kapanır.
- **Halka.** Tamamlanmayan halka en çok %92 çizilir; hedef dolunca ✓ ve "Hedef tamam" yazılır. Merkez rakam halka çapıyla sınırlıdır (`min(token, çap × oran)`), büyük yazıda halkadan taşmaz.
- **İkon.** Yalnız `www/kernel/icons.js` içindeki tek renkli çizgi ikonlar kullanılır, ekranda emoji kullanılmaz. Ruh hali yüzleri ve bildirim başlıkları istisnadır. İkon düğmesinde `aria-label` bulunur.
- **Üst çubuk.** Ekran başlığı 24 px. Seri rozeti yalnız Bugün'de görünür. Onboarding'de küçük marka işareti çıkar.
- **Alt menü.** En az 56 px (`--nav-h`). Etkin sekmenin ikonu hap zeminli olur. Etiket harf ortasından bölünmez (`overflow-wrap:normal`, `word-break:keep-all`); büyük yazıda iki kelimelik etiket iki satıra sarılır, menü uzar ve sabit parçalar `--nx` kadar yükselir.

- **Konfor modu.** Ayarlar > Görünüm'de "Büyük yazı ve düğmeler" (`data-comfy`): yazı ölçeği bir adım büyür, dokunma hedefi 52 px olur; ilk kurulumun karşılama ekranında "Yazıyı büyüt?" diye sorulur. Set tablosu, takvim hücresi, grafik ve alt menü boyutunu korur.

## Ton ve metin
- **Kapat, Vazgeç, Tamam.** Kaydedilmemiş form: Vazgeç. Yalnız bilgi gösteren sayfa: Kapat. Onay penceresi: Vazgeç ve eylem fiili ("Sil", "Tamam"); iki seçenekli kararlarda ("Yazmaya devam et", "Hayır, kaydetme") seçenek adı yazılır. `İptal` kullanılmaz.
- **Sözlük.** Vücut ölçümü "kilo" (kaldırılan yük için "ağırlık"), spor oturumu "antrenman", tek hareket "egzersiz". Apostrof düz yazılır (Rehber'e, 22:00'den). Depolama dolu mesajları yedek almayı söyler; hata metnine ham istisna adı ya da teknik terim girmez.
- **Büyük-küçük harf.** Başlık ve etiketler cümle düzeniyle yazılır ("Egzersiz kütüphanesi"). Kısa etiketlerin sonuna nokta konmaz, açıklama cümleleri noktayla biter.
- **Sayılar.** Ham sayaç ve pazarlama ifadesi kullanılmaz ("324 egzersiz, animasyonlu" gibi). Sayı yalnız bağlam gerektiriyorsa yazılır: "12 sonuç", "Daha fazla göster".
- **Boş durumlar.** Boş durum yönlendirir ve sıcaktır: "İlk tartını ekle", "Bugün henüz bir şey eklemedin. Bir bardak suyla başlayabilirsin."
- **Teknik dil.** Kullanıcıya teknik dil gösterilmez. "API anahtarı" yerine "Koç anahtarı" yazılır, "kayıt" yerine eylem ya da nesne kullanılır ("3 kez", "Bugün"). Sağlayıcı sitelerindeki düğme adları ("Create API Key") olduğu gibi kalır.
- **Değişmeyen metinler.** Koç onayı ve gizlilik metinlerinin hukuki içeriği, hekim ve güvenlik uyarıları (`MED_NOTE`, güvenlik freni) değiştirilmez. Onay metni `CONSENT_V` sürümüne bağlıdır.

## Simge ve açılış ekranı
- **İşaret.** Sağ üstte açıklığı olan bir halka ve bu açıklığa uzanan bir yaprak. Halka ilerlemeyi, yaprak sağlığı anlatır. Zemin marka rengi #0F5C55, halka beyaz, yaprak nane (#8FE3CF).
- **Üretim.** `python scripts/make-icons.py` (Pillow gerekir) tek geometriden şunları üretir: `www/logo.svg`, `www/logo.png`, `assets/logo.png`, mipmap-mdpi'den xxxhdpi'ye kadar ön plan, tek renk, kare ve yuvarlak simgeler, ayrıca 11 adet `splash.png`. Üretilen dosyalar depoya girer.
- **Android'e kopyalama.** `scripts/patch-android.js` `assets/android/res` klasörünü kopyalar. Uyarlanabilir simge (`mipmap-anydpi-v26`) arka plan, ön plan ve Android 13 temalı simge için `monochrome` katmanı taşır. Android 12 ve üstündeki açılış ekranı için yama, `styles.xml` dosyasına arka plan rengini ve simgeyi bir kez ekler. Şablon değişmişse yama durur.
- **Güvenli bölge.** İşaret, 108 dp'lik ön planın ortadaki %50'lik alanında kalır. Böylece daire, damla ya da kare maskede kesilmez.
