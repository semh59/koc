# C: Sağlık ekranları tasarım denetimi (salt okunur)

Ekran görüntüleri: `C:\Users\semih\AppData\Local\Temp\claude\D--PROJECT-koc\a0c52de4-1582-493b-9785-aae79e055ed0\scratchpad\shots\` (ad_genişlik_tema[_z200].png; 360, 412, 320 px; açık/koyu).
Not: %200 yazı, bilgisayarda tüm yazı boyutlarını 2 ile çarparak benzetildi (Android textZoom'un yaklaşığı); %200'de görülen taşmalar kesin değil, cihazda doğrulanmalı.

## Özet
Çekirdek tutarlı (kart, çip, düğme, token), ama "az süslü ve sakin" hedefinin altında kalan üç şey var: sağlıklı veri ekranlarında rakam ölçeği sistemsiz (40 px dev rakam yanında 12 px etiket), listeler sınırsız uzuyor, bilgi/yardım öğeleri kartların dışına serpilmiş. Uyku/ruh hali gerçekten gömülmüş (kanıtlı). "Bu ne?" tasarımı kartın içine alınmalı. En acil: ruh hali notunun kaybolması (işlev hatası), Tansiyon grafik etiket çakışması, Döngü dev tahmin rakamı.

## Bulgular (ekran | sorun | kanıt | öneri | öncelik)
- Bugün | Uyku/ruh hali tek "Daha fazla" çipine gömülü; aynı ekranda alt menüde de "Daha fazla" var (iki anlam) | bugun_360_light.png | Çipin adı "Uyku ve ruh hali" (ikon moon), `.hrow` iki eşit çipe dönsün (bkz. özel şikâyet 1) | Y
- Uyku/Ruh hali sayfası | Ruh hali: emoji'ye dokunmak anında kaydedip kapatıyor, "Kısa not" emoji'lerin ALTINDA; not yazılmadan emoji seçilirse not hiç girilemez (`habitui.js` moodSave `#hbn` değerini dokunuşta okur) | mood-giris_360_light_z200.png | Not alanını emoji'nin üstüne al ya da emoji seçilince seçili göster, "Kaydet" düğmesi ekle | Y
- Uyku sayfası | "Ya da süre" alanındaki yer tutucu "7,5" değer gibi görünüyor; "Kalite 1–5" ölçeği açıklanmıyor (1 iyi mi kötü mü?); geçmiş satırı "6 Eki 6 sa 20 dk · kalite 1" ham | uyku-giris_360_light.png | Yer tutucu rengi `--mut` %70; etiket "Kalite (1 kötü, 5 çok iyi)"; geçmiş en çok 7 satır, kalan "Daha fazla" | O
- Ruh hali geçmişi | Satır emoji + not, uzun nota göre iki satıra kırılıyor; ✕ sağda yüksek ağırlıklı | mood-giris_360_light_z200.png | Not tek satır `text-overflow:ellipsis`; ✕ yerine sola kaydırarak sil/uzun bas; emojiye `aria-label` metni (Çok kötü…Çok iyi) | D
- Tahlil | Kartlar harf sırasında; aralık dışı olanlar ayrı değil; tek sonuçlu kartta grafik yok, kart boyları dengesiz | tahlil_360_light.png | "Son sonuç" tarihine göre sırala, aralık dışı üstte "Aralık dışı (3)" bölümü; tek noktalıda grafik yerine boş şerit koyma | O
- Tahlil kart | Aralık bilgisi 13 px gri, sağ altta; ▲▼ işareti kalın ama renksiz (iyi: renk tek başına değil); grafikte y ekseni ve aralık değerleri yok, 58 px yüksek | tahlil_360_light.png | Aralık çubuğu: değerin aralık içindeki konumu (yatay şerit, 8 px yükseklik) + alt/üst sayı; grafik 80 px, min/max etiketi | O
- Tahlil ayrıntı | Başlıkta son değer yok; "Gölgeli bölge..." açıklaması ve satırlar küçük; ✕ her satırda ağır | tahlil-detay_360_light.png | Başlığa büyük son değer + durum; silmeyi satır sonu "⋯" menüsüne al | D
- Tahlil içe aktarma | Satır düzenleme 4 kutu (Değer/Birim/Alt/Üst) yer tutucu etiketleri değer girilince kayboluyor, hangi kutu ne belli değil | tahlil-pdf_360_light.png | Kutu üstüne kalıcı küçük etiket (12 px); "Emin değilim" satırı için sarı zemin yerine ikon + metin | O
- Tansiyon | Grafik 170 px; y ekseni etiketi "Sistolik/Diyastolik" ile üst üste biniyor ve sol kenarda kırpılıyor (stolik); çizgi 28 noktada zikzak | tansiyon_360_light.png | Eksen sayıları sol kolonda 36 px ayrılsın, seri adı yalnız altta açıklamada; yüksekliği 220; sabah/akşam ayrı nokta biçimi | Y
- Tansiyon | Ölçüm listesi sınırsız (28 satır), sayfa 2500 px; her satırda 44 px daire ✕ | tansiyon_360_light.png | İlk 7 seans, sonra "Tüm ölçümler"; ✕ satır ayrıntı sayfasına | O
- Tansiyon/Şeker ekle | 120/80 yer tutucusu gerçek değer gibi; alan etiketi 12 px | tansiyon-ekle_360_dark.png | Yer tutucu "büyük", "küçük", "nabız"; etiket 13 px `--ink` | O
- İlaç | "Son 7 gün": 6 kırmızı ✕ dairesi kaygı yaratıyor (sakin ton hedefine ters); uyum yüzdesi %33 büyük punto | ilac_360_light.png | Kaçırılan için `--mut` içi boş halka + ✕ ikonu, kırmızıyı yalnız silmede kullan; %'yi 20 px, altına "108 dozdan 36" | O
- İlaç | Doz kartı: Aldım/Atla çipleri ayrı satıra düşüyor, kart boyu şişiyor; "500 mg" ad satırını kırıyor | ilac_360_light.png | Aldım/Atla sağa sabit, doz ikinci satırda; geçmiş dozlar tek satır | D
- İlaç ekle | Gün çipleri hepsi seçili (koyu) iken fark görünmüyor, yalnız renk; "Her seferde kaç a…" yer tutucusu kesik | ilac-ekle_360_light.png | Seçili çipe ✓; yer tutucu "Doz başına adet" | O
- Döngü | Tahmin metni 40 px, "Yaklaşık 21 Eki – 25 Eki" iki satıra kırılıyor; 12. gün de 40 px; etiket 12 px (ölçek kopuk) | dongu_360_light.png | `.sumv` en çok 28 px; "21–25 Eki" tek satır, "Yaklaşık" etiketin içine | Y
- Döngü geçmiş | "25 Eyl –" açık tire ne olduğunu söylemiyor | dongu_360_light.png | "25 Eyl · bitiş girilmedi" | D
- Döngü ekle | %200'de tarih alanı sağdan taşıyor (simülasyon) | dongu-ekle_360_light_z200.png | `input.in{min-width:0;max-width:100%}` | D
- Trend (kilo/ölçü/foto) | Kilo ve ölçü grafiği temiz; fotoğraf altyazısı "8 Tem · 77,0 kg" iki satıra kırılıp ızgarayı bozuyor; gizlilik paragrafı 6 satır | trend_360_light.png | Altyazı yalnız tarih, kilo ikinci satır 12 px; paragrafı "Gizlilik" satırına katla | O
- Fotoğraf karşılaştır | Açılır kutu metni kırpık ("77,0 k") | foto-karsilastir_360_dark.png | Seçenek yalnız tarih; kilo ayrı satırda | D
- Koyu tema | Açık temadaki yapı korunmuş, kontrast sorunu görmedim; tek tük alan çerçevesi (`--fbd`) zayıf | tansiyon-ekle_360_dark.png | Alan çerçevesi 3:1 doğrulansın | D

## Özel şikâyet 1: "Uyku ve ruh hali sığmamış diye diğeri atılmış"
- Neden: kod geçmişi (`git show f311946 -- www/modules/aliskanlik/habitui.js`) iki yan yana düğmeyi ("Uyku ekle" | "Ruh hali", `.btn.ghost` x2) tek "Daha fazla" çipiyle değiştirmiş; yorum: "ana ekranı kalabalıklaştırmasın". Uyku ve ruh hali artık Bugün'de görünmüyor, `habitui.js:13` `habitRow()` tek çip döndürür.
- Kanıt: bugun_360_light.png (sağa yaslı çip, ikon "···"); uyku-mood-menu_360_light.png (ikinci dokunuş gerekiyor). Eski düzeni geçici kopyada geri kurup ölçtüm: 360 ve 320 px'te iki düğme sığıyor (164 + 164 px), yani "sığmama" 100% yazıda gerçek değildi; %200'de ise `.hrow{justify-content:flex-end}` yüzünden soldaki düğme ekran dışına (x=3) taşıyor (eski-hrow_320_z1.png). Gerçek sorun: 5 çiplik hızlı kayıt satırı (Su, Yemek, Kilo, Spor, Not) 320 px'te zaten dolu; uyku/ruh hali ona sığmadığı için bir menüye itilmiş. Çip etiketi ("Daha fazla") neye açıldığını söylemiyor.
- Düzeltme: (a) Bugün'de "Gün sonu" kartı: "Uyku" ve "Ruh hali" iki eşit yarım karo (`display:grid;grid-template-columns:1fr 1fr;gap:8px`, min 56 px, `@media(max-width:340px){grid-template-columns:1fr}`), değer doluysa karo içinde "6 sa 20 dk" ve 🙂; (b) %200 yazıda tek sütuna in; (c) çip kalırsa adı "Uyku ve ruh hali"; (d) menüdeki ikinci basamak kalksın.

## Özel şikâyet 2: Tahlil "Bu ne?"
- Neden kötü: (1) çip kartın DIŞINDA, kartlar arasında yüzüyor (`labui.js:27`, düğme `</button>` sonrası), açılan tanım bir sonraki kartın üstüne oturuyor ve hangi karta ait olduğu belli değil; (2) 11 kalemde 11 aynı gri çip: görsel gürültü, hiyerarşiyi bozuyor; (3) soru metni ("Bu ne?") konuşma dili ve tıbbi içerikte belirsiz; (4) tanım ayrıntı sayfasında da var, kopya; (5) açılınca liste kayıyor, sayfa uzuyor; (6) alttaki dipnot bu çipleri ayrıca açıklıyor.
- Kanıt: tahlil_360_light.png (CRP, D vitamini, Ferritin arası), tahlil_360_light_z200.png.
- Öneri: çipi kaldır. Kart içinde, başlığın yanında 44 px "ⓘ" ikon düğmesi (`aria-label="CRP nedir"`); dokununca ayrıntı sayfasında (`labDetail`) tanım zaten üstte açık. Listedeki kartta yalnız kategori etiketi küçük metin (örn. "İltihap göstergesi"). Alt dipnot bir kez, ayrıntı sayfasında kalsın. Kartların içine açılır bölüm gerekmiyor: liste = değer, aralık, durum; ayrıntı = ne, grafik, geçmiş. Metin: "Bu test ne ölçer?" yerine başlık "CRP nedir" + mevcut cümle.

## Tasarım dili önerisi
1. Rakam ölçeği üç basamak: hero 28 (tek ana değer), ikincil 20, satır 16; 40 px yalnız Bugün halkasında.
2. Her liste en çok 7 satır + "Tümünü gör"; silme eylemi satırda değil ayrıntıda.
3. Durum anlamı daima ikon + metin (▲▼, ✓, !); kırmızı yalnız yıkıcı eylemde, kaçırılan/aralık dışı için nötr halka.
4. Yardım/tanım kartın içine ya da ayrıntıya girer, kartlar arasına asla serpilmez; "ⓘ" tek biçim.
5. Formlarda kalıcı etiket, yer tutucu yalnız örnek (gri ve "örn." önekli), 320 px ve %200'de tek sütun ve `min-width:0`.
