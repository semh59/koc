# D: Genel tasarım denetimi (salt okunur, 7 Ekim 2026)
Özet (8 satır):
1. Temel sağlam: sakin yeşil marka, tutarlı çizgi ikon, iyi koyu tema, token tabanlı kart/düğme. Amatör hissi marka eksikliğinden değil, düzensiz detaydan gelir.
2. En büyük sorun bilgi mimarisi: "Daha fazla" 10 satırlık düz liste (takip + kütüphane + ayar + hukuk karışık).
3. İkinci: metin duvarları (Modüller 2235 px, Gizlilik sheet'i, Koç boş durumu); 13 px gri paragraf ürünün sesi olmuş.
4. Üçüncü: tip ölçeği delinmiş (23 farklı px, 7-10 px dahil), 267 inline style, 14 farklı yarıçap değeri.
5. Onboarding işlevsel ama karşılama/değer önerisi yok; ilk izlenim bir form.
6. Geri bildirim: 22 yerde yerel tarayıcı confirm(); toast alt menü ve içeriğe biniyor.
7. %200 yazıda alt menü etiketleri harf ortasından kırılıyor, halka sayıları taşıyor.
8. Sıra: Daha fazla + Ayarlar IA, Bugün, onboarding, ortak bileşenler, Koç ilk kullanım.
Yöntem: Playwright/Chrome 155, 360x800 ve 412x915, açık/koyu, ~350 görüntü (scratchpad). %200 yazı, JS ile font-size x2 simülasyonu (Android textZoom'a yakın, birebir değil). Kaynak: www/index.html, www/modules/data/onboardui.js, docs/tasarim-dili.md. Eski rekabet-arayuz.md bulgularının çoğu (emoji ikon, tema seçici, büyük geri düğmesi) giderilmiş; tekrarlanmadı.

## Bulgular (ekran/dosya | sorun | kanıt | öneri | öncelik)
1. Daha fazla (index.html:891 DAHA) | 10 satır tek kart, gruplama yok: takip (ilaç, tansiyon, şeker, döngü, tahlil) ile sistem (Ayarlar, Gizlilik, Hakkında) aynı düzeyde; kapalı modül satırları da listede | s-daha | 3 grup: "Takip" (yalnız açık modüller + "Modül ekle"), "Keşfet" (Egzersiz kütüphanesi, Raporlar), "Uygulama" (Ayarlar, Gizlilik, Hakkında); .grp başlığı 12/600 --mut, grup arası 24 | Y
2. Alt menü | "Daha fazla" adı ve "···" ikonu belirsiz; Ayarlar 2 dokunuş derinde | nav | Etiket "Menü" ya da "Ben", ikon profil; Ayarlar ilk satır | O
3. Ayarlar > Modüller | 2235 px; 5 özelliğin ayarı + Salon antrenman ayarları (modül değil) tek sayfada, hepsi paragraflı | s-ayar-modul | Modül başına tek satır: ad + anahtar + 1 satır açıklama; ayrıntı alt ekrana; Salon ayarları Salon'a | Y
4. Ayarlar > Profil | 1677 px; hedefler, birimler, 6 satırlık "hareket kalorisi" paragrafı | s-ayar-profil | Birimler ayrı satır, paragraflar "i" yardım sheet'ine; alan etiketi + alt metin tek stil | O
5. Ayarlar > Koç | 6 eşit sağlayıcı satırı, model kimlikleri görünür ("nvidia/nemotron-3-super-120b-a12b", "Henüz denenmedi"), "Sırayla denenir ... parolalı yedek" teknik dil (tasarim-dili.md'ye aykırı) | s-ayar-koc | Tek durum kartı ("Koç hazır / Anahtar ekle"); sağlayıcılar "Gelişmiş" altında; model adı yalnız ayrıntıda | Y
6. Ayarlar hub ve Hatırlatmalar | Tema seçici hub'ın altında yetim; 10 özdeş anahtar satırı | s-ayar, s-ayar-hatir | Tema "Görünüm" satırı; hatırlatmalar gruplu (Su, İlaç, Ölçüm, Özet) başlıklarla | D
7. Veri ve yedek | Birincil düğme "Drive'a gönder" (en sık eylem değil); "Alan yeterli." kartı boş üst boşluklu; "Antrenman geçmişini içe aktar" 3 satıra kırılıyor | s-ayar-veri | Durum kartı üstte (son yedek, alan), birincil "Yedekle"; başlıklar kısa | O
8. Gizlilik sheet'i / Hakkında | 13 px, ~900 px duvar; tıbbi uyarı iki yerde aynen tekrar | sheet-gizlilik, s-ayar-hak | Akordeon (Verin nerede / İnternete çıkanlar / Sil); uyarı tek yerde; hukuki metin değişmez, yalnız kabuk | O
9. Onboarding | Karşılama yok, doğrudan form; hata kartın dışında, 12 px; "Belirtmem" öntanımlı koyu seçili (seçim yapılmış gibi); adım 3'te "kcal" taban çizgisi kaymış, 6 satırlık hukuki paragraf hedefin altında; "Şimdilik geç" düğme gibi görünmüyor | ob1, ob1c-err, ob3 | Ekran 0: logo + tek cümle + "Başla"; hata alanın altında --warn 13/600; seçilmemiş segment nötr; gizlilik notu 2 satır + bağlantı | Y
10. 18 yaş ekranı | Başlık kart dışı, ölü uç, tek düğme zayıf | ob-minor | Ortalı ikon + sıcak metin + tek net eylem | D
11. Bugün | Yoğun: 5 hızlı eylem, 3 halka, koç satırı, "Daha fazla" çipi (nav ile yinelenen), yapılacaklar, tartı, koç, günlük; "Henüz ilaç eklemedin / ölçüm yok" satırları ısrarcı görev gibi; başlık "6 Eki, Salı" kısaltma | bugun-full | Tek hero (kalori) + 2 ikincil; çip kalksın; yapılacaklar yalnız vakti gelen; başlık "Bugün", alt satır "6 Ekim, Salı" | Y
12. Bugün halkaları | 3 halka boyutu, merkez sayı 18 px, alt etiket 11 px; %200'de sayı halkadan taşar | x200-bugun | Merkez sayı clamp + overflow gizli; etiket min 12 px; --ring-w token (şu an 7 literal) | O
13. Toast | Alt menünün üstünde içerik ve sheet'e biniyor; konum 150/112/84/58 px literal | toast-su, index.html:149,291,303 | Tek --toast-bottom (nav + 12); 4 sn; "Geri al" ≥48 px; sheet açıkken sheet üstünde | O
14. Onay pencereleri | 22 yerde yerel confirm() (silme, hepsini sil, antrenman bitir): tarayıcı kromu, marka dışı, uzun metin kesiliyor | privacyui.js:21, coach.js x4, gym.js x3 | Ortak confirmSheet(başlık, sonuç, İptal/Sil); yıkıcı = .btn.danger, odak İptal'de | Y
15. Sheet | Tutamaç var, kapat düğmesi yok; yemek sheet'inde 10 öğe tek kaydırmada; açılış hareketi yok | sheet-kilo-err, sheet-yemek | Sağ üst ✕ 44 px; giriş 240 ms --ease; başlık 18/700 | O
16. Boş durumlar | Yalnız metin; Trend boşta 3 ardışık "ekle" kartı; Koç ilk açılış 15 satır duvar | E-trend-l, E-koc-l, E-tahlil-l | .empty: 48 px çizgi ikon (--mut) + başlık + 1 satır + 1 düğme; Koç'ta 3 maddelik "Neler yapar" + tek düğme, ayrıntı akordeonda | O
17. Koç sohbeti | İlk ekranda 3 ayrı çip bölgesi (öneri, hızlı eylem, "Haftalık menü öner") | s-koc | Tek öneri bölgesi; hızlı eylem çipleri klavye kapalıyken tek satır | D
18. Trend/Salon | Çok sayıda h2 + 13 px kart açıklaması; grafik etiketleri 11 px | s-trend, s-salon | Etiket min 12 px; kart başlığı ve eylem aynı satırda | D
19. %200 yazı | Alt menü "Bugü/n", "Daha/fazla" harf ortasından kırılır; liste ikonları (20 px) metinle büyümez | x200-bugun/daha/ayar | Etiket overflow-wrap:normal, uzun etiket kısaltma (Menü); ikon em tabanlı; nav sabit 56 yerine min-height | Y
20. Renk | Veri turuncusu (--kcal) uyarı kutusu ve vurgu metniyle karışıyor; --sbtn #1f5f86 ve --tact ayrı mavi ailesi; durum rengi "başarı" yok | tokens | Rol tablosu aşağıda; --sbtn kaldır (--info), --ok ekle | O
21. Tipografi | 23 farklı px (7, 8, 9, 10, 11, 12,5, 13,5, 14,5 ...), ~87 literal vs ~41 token; --fs-h3 (18) > --fs-h2 (17) ters | grep font-size | 8 basamak ölçek (aşağıda); literal font-size yasak, test ekle | Y
22. Yarıçap/gölge | Token 3 varken 14 farklı değer (99, 999, 50%, 12, 16, 14, 9, 10, 4, 3, 2, 26, 24, 18/6); 5 gölge literal | grep | --r-xs 8, --r-s 12, --r 16, --r-xl 24, --r-pill 999; --sh-1, --sh-2 | O
23. Satır bileşenleri | .prow .rrow .trow .lrow .row .chkrow .rem .exrow: 8 varyant, min-height 44/48/50/52/60 | grep | Tek .row (min 56, ikon alanı 40, sağ slot) + modifier | O
24. Inline stil | 267 style="" (margin-top:8px 28x, padding:0 0 8px 11x, flex:1;min-width:0 11x) | js/html grep | .mt-2 .mt-3 .grow .hint-flush yardımcıları | O
25. Koyu tema bloğu | ~12 satırlık aynı değer seti iki yerde elle senkron (index.html:28-44) | index.html | Test: iki blok eşit mi (kontrast testi zaten var); ideal tek kaynak | D
26. Marka | Logo (halka+yaprak) güçlü ama onboarding dışında uygulamada görünmez; slogan yalnız Hakkında; splash düz zemin | ob1, s-ayar-hak | Splash: logo + ad; Bugün'e dokunmadan, Hakkında'yı sürüm + slogan grubuna topla | D
27. Mikro metin | "Ekle" / "+ Ekle" / "Ekle ›"; tarih "6 Eki" / "21 Eyl" / "6 Ekim"; "Anahtar ekle" vs "Koçu etkinleştir"; "Yedekle veya geri yükle" vs başlık "Veri ve yedek"; "Build", "free" gibi İngilizce kimlikler | çeşitli | Fiil+nesne ("Su ekle"), tarih kuralı (liste "6 Eki", başlık "6 Ekim"), tek terim "Koç anahtarı"; teknik kimlik gizle | O
28. İkon seti | Tek renkli 2 px çizgi tutarlı (iyi); 3 boyut (20/24/26) kuralsız; ‹ › ✕ ··· metin karakteri | s-daha, bugun | 20 satır, 24 nav/üst, 48 boş durum; karakterler Icons.svg'den | D
29. Hareket | Yalnız .16 s; toast transition:all .2s; ekran ve sheet geçişi yok; reduced-motion kuralı iyi | index.html:291,295 | 120/200/320 ms token; ekran 200 ms; transition:all yasak | D
30. Görsel erişilebilirlik | Alanlar 3:1 iyi, odak halkası iyi; 11-12 px etiketler ve 13 px --mut paragraflar yorucu | genel | Min 12 px, paragraf 14-15 | O

## Önerilen tasarım sistemi
- Renk rolleri: marka --prim #0f5c55 (koyu #4fc2a8); yüzey --bg #f2f4f3 / --card / --soft; metin --ink #10232b / --mut #56666d; kenar --line / --fbd; durum --ok (yeni, yeşil), --warn #b03a24, --info (mavi, --sbtn yerine); veri su #2a86bd, kcal #b8691a, spor #7d56c8 (yalnız veri). Eklenecek: --ok, --info-btn, --ring-w, --scrim.
- Tip ölçeği (px): 12 cap, 13 küçük, 15 gövde-2, 16 gövde, 18 başlık-3, 20 başlık-2, 24 başlık-1, 34 büyük rakam; ağırlık 400/600/700; 7-11 px yasak.
- Boşluk: 4, 8, 12, 16, 24, 32 (--sp-1..6); kart iç 16, kart arası 12, bölüm 24.
- Yarıçap 8/12/16/24/pill; gölge --sh-1 kart, --sh-2 toast ve sheet; koyuda gölge yok, çizgi.
- Bileşenler: .row (56), .btn / .ghost / .danger, .chip, .tag, .field (etiket + hata), .empty, .grp başlığı, confirmSheet, sheet (✕ + tutamaç), toast (token'lı konum), .help ("i" ile ayrıntı), akordeon.
- İkon: 24 px, 2 px yuvarlak uçlu çizgi, tek renk; boyutlar 20/24/48; metin karakteri yok.
- Hareket: 120/200/320 ms, --ease; sheet 240 ms yukarı kayma; reduced-motion hepsini kapatır.

## Yeniden tasarım sırası
1. Daha fazla + Ayarlar IA (1-6): en büyük algı kazancı, düşük risk.
2. Bugün (11-12) ve %200 yazı düzeltmeleri (19).
3. Onboarding (9, 10).
4. Ortak bileşenler: confirmSheet, .empty, .row birleştirme, tip/yarıçap/inline temizliği (14, 21-24).
5. Koç ilk kullanım ve sağlayıcı ayarı (5, 16).
6. Gizlilik/Hakkında akordeonları (8).
