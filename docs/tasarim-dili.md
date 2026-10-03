# NeoWell tasarım dili

Hedef sakin, kendinden emin, az süslü bir arayüz (Apple Sağlık, Oura, Hevy çizgisi). Tüm değerler `www/index.html` içindeki `:root` token'larından gelir. Yeni bir stil yazmadan önce token'a ve aşağıdaki ortak sınıflara bak.

## Token'lar
- **Renk.** Marka `--prim` (#0f5c55, koyuda #4fc2a8). Nötr renkler: `--bg` sayfa, `--card` kart, `--ink` metin, `--mut` ikincil metin, `--line` ayırıcı, `--soft` tonlu zemin, `--prim-soft` etkin sekme ve rozet, `--field` giriş alanı.
- **Durum renkleri.** `--warn` uyarı ve silme. Kutu renkleri: `--ban-*` uyarı kutusu, `--inf-*` bilgi kutusu, `--tah-*` tahmin rozeti.
- **Veri renkleri.** `--su`, `--kcal`, `--spor`. Her veri türünün tek rengi vardır.
- **Kontrast kuralı.** Renkler 6 haneli hex olarak yazılır. Açık ve koyu temada her çifti `scripts/contrast.test.js` denetler: metin için en az 4,5, grafik ve kenarlık için en az 3. Koyu tema bloğu iki yerde aynı sırayla tekrarlanır (medya sorgusu ve `data-theme="dark"`).
- **Yazı.** Sistem yazı tipi yığını kullanılır, telefonda Roboto ya da üreticinin yazı tipi. Ek dosya yoktur, çevrimdışı çalışır, APK boyutunu etkilemez. Ölçek: `--fs-cap` 12, `--fs-s` 13, `--fs-2` 15, `--fs-1` 16 gövde, `--fs-h2` 17 bölüm başlığı, `--fs-h3` 18, `--fs-h1` 24 ekran başlığı. Rakamlar tabular yazılır (`.num`, `.stat .v`, tablo).
- **Boşluk.** 4 ve 8'in katları kullanılır. Kart iç boşluğu 16, kartlar arası 12, bölüm başlığından önce 24.
- **Köşe.** `--r` 16 kart, `--r-s` 12 düğme ve alan, `--r-xs` 8 küçük alan. Hap biçimli öğelerde 99 kullanılır.
- **Gölge ve çizgi.** Açık temada kartta kenarlık yoktur, `--sh` hafif gölge verir. Koyu temada gölge yoktur, `--card-bd` ince çizgi çizer.
- **Hareket.** `--dur` 160 ms ve `--ease` kullanılır. `prefers-reduced-motion` açıksa geçiş, animasyon ve basış küçülmesi kapanır.

## Bileşenler
- **Kart.** Tek sınıf `.card`. İçinde liste satırları varsa üst ve alt boşluk kendiliğinden azalır.
- **Liste satırı.** `navRow(attr, ikon, başlık, alt satır)` yardımcısı kullanılır: solda ikon, ortada başlık ve ikincil satır, sağda ›. Daha fazla, Ayarlar, Salon, Veri ve yedek ile Raporlar ekranları bunu kullanır. Yıkıcı bir satıra ` dng` sınıfı eklenir.
- **Düğme.** Bir ekranda tek birincil düğme olur (`.btn`). İkincil düğme `.btn.ghost` (tonlu zemin, marka rengi metin), yıkıcı düğme `.btn.danger` (çerçeveli, uyarı rengi), metin düğmesi `.lnk`. Hepsinin yüksekliği en az 48 px, metni 600 kalınlıkta, basınca hafifçe küçülür.
- **Giriş alanı.** Tek stil: `input.in`, `select.in`, `textarea.in`, ayarlar alanları ve set kutuları. Zemin `--field`, kenarlık `--fbd` (3:1), odakta marka renginde halka. Arama kutusu `type="search"` olur ve büyüteç ikonu stilden gelir. `.in` adı alt menünün kapsayıcısında da geçtiği için stil yalnız form öğelerine verilir.
- **Çip ve rozet.** `.chip` hap biçimli, `--soft` zeminli, en az 44 px. Seçili çip `aria-pressed="true"` ile marka rengini alır. `.tag` küçük durum rozetidir (`--prim-soft`). `.seg` ve `.seg2` segment seçicilerdir.
- **İkon.** Yalnız `www/icons.js` içindeki tek renkli çizgi ikonlar kullanılır, ekranda emoji kullanılmaz. Ruh hali yüzleri ve bildirim başlıkları istisnadır. İkon düğmesinde `aria-label` bulunur.
- **Üst çubuk.** Ekran başlığı 24 px. Seri rozeti yalnız Bugün'de görünür. Onboarding'de küçük marka işareti çıkar.
- **Alt menü.** Yüksekliği sabit 56 px. Etkin sekmenin ikonu hap zeminli olur, etiketler tek satırda kalır.

## Ton ve metin
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
