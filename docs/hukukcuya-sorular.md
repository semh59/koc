# Hukukçuya sorular (NeoWell)

Bu metin olduğu gibi iletilebilir. Hukuki tavsiye değildir; yalnız karar gereken noktaları toplar. Güncelleme: 7 Ekim 2026.

## Uygulama kısaca
NeoWell, Android için yemek, su, kilo, spor ve sağlık kaydı (tansiyon, şeker, tahlil, ilaç) tutan, hesapsız ve reklamsız bir günlüktür. Kendi sunucumuz yoktur; kayıtlar yalnız kullanıcının telefonunda durur. Tek isteğe bağlı veri çıkışı "Koç": kullanıcı kendi API anahtarını girer, açık rıza verir ve bir düğmeye bastığında sohbeti, profilini ve son kayıtlarını seçtiği yapay zekâ sağlayıcısına (NVIDIA, Groq, OpenRouter, Google Gemini, OpenAI, Anthropic; sunucuları yurt dışında) gönderir. Kendiliğinden ya da arka planda gönderim yoktur. Tahlil, tansiyon, şeker, vücut ölçüsü, fotoğraf ve konum hiç gönderilmez. İkinci çıkış: barkod aramasında Open Food Facts'e barkod numarası gider. Gizlilik politikası taslağı: `docs/gizlilik-politikasi.md`.

## 1. Veri sorumlusu kim?
Kullanıcı kendi anahtarıyla, kendi hesabıyla sağlayıcıya bağlanıyor; biz veriyi toplamıyor ve görmüyoruz. Bu durumda veri sorumlusu ve aktaran kim sayılır: biz mi, kullanıcı mı, sağlayıcı mı? Politikaya hangi unvan, adres ve e-posta yazılmalı (şahıs mı, şirket mi)? VERBİS kaydı ya da muafiyet gerekir mi?

## 2. Yurt dışı aktarımda açık rıza yeterli mi? (KVKK m.6 ve m.9)
Koç verisi sağlık bilgisi içerir (özel nitelikli veri) ve yurt dışına gider. Aktarım yalnız kullanıcının açık rızasıyla ve yalnız kullanıcı düğmeye bastığında olur. m.9'daki (7499 sayılı Kanun, 1 Haziran 2024) sıraya göre açık rıza yalnız arızi aktarımda yeterli görülüyor. Kullanıcının her düğme basışında yaptığı bu aktarım arızi sayılır mı, yoksa standart sözleşme ve Kurul bildirimi gerekir mi? Ücretsiz katman sağlayıcılarıyla standart sözleşme pratikte mümkün değilse, hangi ek önlem ya da ifade (rıza metni, politika) gerekir? Rıza metni uygulama içinde ve politikada aynıdır; yeterli mi?

## 3. Yaş beyanı yeterli mi?
Uygulama 18 yaş ve üzeri içindir. Kurulumda yaş kullanıcının beyanıyla alınır; 18'den küçük yaş girilirse kurulum ilerlemez ve bilgi kaydedilmez. Yaş doğrulaması yoktur. Yalnız beyan yeterli mi? Yaşı sonradan 18'in altına düşürülen ya da yaşı hiç girilmeyen profilde Koç veri paylaşımını kapalı tutmak yeterli bir önlem mi? Çocuk verisi açısından ek yükümlülük doğar mı?

## 4. Open Food Facts ve Google bileşenleri: IP adresi ve cihaz bilgisi
(a) Barkod aramasında Open Food Facts'e yalnız barkod numarası gider; her internet isteğinde olduğu gibi IP adresi de karşı tarafa ulaşır. Bunu kişisel veri aktarımı olarak politikada ve Play Data safety formunda ayrıca beyan etmek gerekir mi, yoksa "uygulama işlevi için zorunlu teknik istek" demek yeterli mi?
(b) Google'ın bileşenleri (ML Kit barkod ve yazı tanıma, Play hizmetleri) kendi açıklamasına göre cihaz bilgisi ve kuruluma özel bir tanımlayıcı toplayabiliyor; biz bu veriye erişmiyoruz. Data safety formunda "Cihaz veya diğer kimlikler: toplanıyor" işaretlemek gerekir mi?

## 5. Tıbbi cihaz sınıfı
Uygulama tansiyon ve şeker ölçümlerini, tahlil sonuçlarını ve ilaç saatlerini yalnız kayıt olarak tutar; yorum, hedef ya da eşik karşılaştırması yapmaz, tanı koymaz, tedavi önermez ve bunu uygulamada ve mağaza metninde yazar. İki nokta tartışmalı olabilir: (1) bugün tarihli çok uç tansiyon (180/120 ve üstü) ya da şeker (54 altı, 400 üstü) kaydında "cihazı kontrol et, belirtin varsa ya da değer doğruysa 112'yi ara" uyarısı çıkar; (2) kayıtlar "doktor raporu" adıyla PDF olarak dışa aktarılır ("yorumlanmamıştır" notuyla). Bu özellikler uygulamayı tıbbi cihaz yazılımı (Tıbbi Cihaz Yönetmeliği, MDR) ya da Play'in "tıbbi/klinik" uygulama sınıfı yapar mı? Hangi ifadeler ya da ad değişikliği riski azaltır?

## Döngü verisi
Döngü verisi cihazda kaldığı için ayrı bir beyan gerekir mi?
