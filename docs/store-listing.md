# Google Play mağaza metni

Kaynak: kod (`www/`, `assets/android/`), `docs/privacy-policy.md`, `docs/play-permission-declarations.md`. Sayılar 7 Ekim 2026 koduna göre: 818 besin kaydı (`www/modules/nutrition/foods.js`; metinde güvenli alt sınır "700'den fazla" yazılı, kayıt eklendikçe metin bozulmaz), 324 egzersiz (`www/modules/gym/exlib.js`), 5 hazır program. Sayı değişirse bu dosya ve README güncellenir.

Yazım kuralı: tedavi, tanı ya da hekim yerine geçme iddiası yok. "Tedavi", "tanı", "hekim yerine" gibi sözcükler yalnız olumsuz ya da sınırlayıcı kullanımda ("tanı koymaz", "tedavi önermez", "hekim yerine geçmez") serbest; "teşhis", "iyileştirir", "garanti", "kilo verdirir" hiç geçmez (aynı kural: `docs/play-data-safety.md`), "çevrimdışı" yalnız çekirdek özellikler için, Rehber ve barkod internet ister.

## Türkçe

**Uygulama adı:** NeoWell

**Kısa açıklama (80):**
Hesapsız, reklamsız diyet, su, spor ve sağlık günlüğü. Kayıtlar telefonda.

> "Verilerin telefonunda kalır" gibi mutlak bir cümle kullanılmadı: Rehber (açık rızayla) ve barkod araması veri gönderir.

**Uzun açıklama:**

NeoWell, yemek, su, kilo, spor ve sağlık kayıtlarını tek yerde tutan kişisel bir günlüktür. Hesap açmak gerekmez, reklam yoktur. Kayıtların telefonunda durur; çekirdek özellikler internet olmadan çalışır.

BESİN VE KALORİ
- 700'den fazla Türk yemeği ve besin: kalori, protein, karbonhidrat ve yağ, porsiyonla birlikte
- Kahvaltı, tabak, ara öğün ve restoran menüsü gibi hazır öğünler
- Kendi besinini, tarifini, favorini ve öğün şablonunu ekle
- Barkod okut: ürün Open Food Facts veritabanında aranır (internet ister; yalnız barkod numarası gider)
- Paket etiketinin fotoğrafından değer okuma (yazı tanıma telefonda yapılır, fotoğraf saklanmaz)
- Günlük kalori ve protein aralığı; değerler yaklaşıktır

SU, KİLO VE VÜCUT
- Tek dokunuşla su ekle, ana ekran widget'ı
- Tartı kaydı, kilo trendi ve vücut ölçüleri (bel, kalça vb.)
- Haftalık özet, grafikler, PDF ve CSV dışa aktarma
- Oruç sayacı, uyku ve ruh hali kaydı, alışkanlık takibi

SPOR
- 324 hareketlik egzersiz kütüphanesi: kas bölgesi, ekipman, seviye
- Salon takibi: set, tekrar, ağırlık, rekorlar ve bir sonraki antrenman için ağırlık önerisi
- 5 hazır program; kendi şablonlarını kaydet
- Sesli rehberli antrenman modu
- Adım sayar ve yürüyüş/koşu algılama (telefonun sensörüyle); isteğe bağlı kısa GPS ölçümü yalnız senin başlattığın yürüyüşte, rota saklanmaz

SAĞLIK KAYITLARI
- Tahlil sonuçlarını kaydet ve değişimi izle (kâğıttan fotoğrafla okuma telefonda yapılır)
- Ev tansiyonu ve kan şekeri ölçümlerini kaydet, ortalamalarını gör
- İlaç saatleri, alım kaydı ve stok takibi; ilaç alarmı dozda telefon kilitliyken ekranı birkaç saniye yakar
- Hatırlatmalar: su, tartı, ilaç, oruç ve yedek
Bu bölümler kayıt ve görüntüleme içindir. NeoWell bu değerleri yorumlamaz, hedef ya da eşik karşılaştırması yapmaz; raporlarını hekimine götürebilirsin.

REHBER (İSTEĞE BAĞLI, YAPAY ZEKÂ)
- Kendi API anahtarını girersen sohbet ve kayıt önerileri alırsın; konuları ayrı sohbetlerde tutarsın. İnternet ister.
- Rehber yalnız sen açık rıza verirsen çalışır. Rıza verirsen, yalnız sen bir düğmeye bastığında (mesaj, yorum, menü ya da program isteği) sohbetin, profilin ve son kayıtların seçtiğin sağlayıcıya (NVIDIA Build, Groq, OpenRouter, Google Gemini, OpenAI, Anthropic Claude ya da kendi eklediğin servis; OpenAI ve Anthropic ücretlidir) gider; kendiliğinden ya da arka planda hiçbir şey gönderilmez. Sunucuları yurt dışındadır. Rızayı istediğin an geri alırsın; vermezsen uygulama tam çalışır.
- NeoWell 18 yaş ve üzeri içindir; kurulumda 18 yaş altı kabul edilmez, yaş girilmeden Rehber açılmaz.

GİZLİLİK
- Hesap, kendi sunucumuz, reklam ve analitik yok.
- Yedek dosyası senin seçtiğin yere gider, parolayla şifrelenir.
- Ayarlar > Gizlilik ve veri'den kategori bazında silebilirsin.

ÖNEMLİ: NeoWell tıbbi cihaz değildir, tanı koymaz ve tedavi önermez; hekim yerine geçmez. Değerler yaklaşıktır. Sağlık kararların için hekimine danış. Hamilelik, yeme bozukluğu ya da hastalık varsa diyet ve spor değişikliğinden önce hekimine danış.

## English

**App name:** NeoWell

**Short description (80):**
No account, no ads: diet, water, workout and health log on your phone.

**Full description:**

NeoWell is a personal log for food, water, weight, workouts and health records. No account is needed and there are no ads. Your entries stay on your phone, and the core features work without internet.

FOOD AND CALORIES
- 700+ Turkish dishes and foods with calories, protein, carbs and fat, per serving
- Ready meals: breakfasts, plates, snacks and restaurant menus
- Add your own foods, recipes, favourites and meal templates
- Scan a barcode: the product is looked up in Open Food Facts (needs internet; only the barcode number is sent)
- Read values from a nutrition label photo (text recognition runs on the phone; the photo is not stored)
- Daily calorie and protein range; values are approximate

WATER, WEIGHT AND BODY
- One-tap water logging and a home screen widget
- Weight log, weight trend and body measurements
- Weekly summary, charts, PDF and CSV export
- Fasting timer, sleep and mood log, habit tracking

WORKOUTS
- 324-exercise library: muscle group, equipment, level
- Gym log: sets, reps, weight, records and a suggested weight for your next workout
- 5 ready-made programs; save your own templates
- Voice-guided workout mode
- Step counter and walk/run detection using the phone's sensor; an optional short GPS measurement only on a walk you start yourself, routes are not stored

HEALTH RECORDS
- Log lab results and track changes (reading from a paper photo happens on the phone)
- Log home blood pressure and blood glucose and see averages
- Medication times, intake log and stock; the medication alarm briefly lights up the screen when the phone is locked
- Reminders: water, weigh-in, medication, fasting and backup
These sections are for logging and viewing. NeoWell does not interpret these values or compare them with targets or thresholds; you can take the reports to your doctor.

COACH (OPTIONAL, AI)
- Add your own API key to get chat and logging suggestions; keep topics in separate chats. Needs internet.
- The Coach works only with your explicit consent. If you consent, only when you tap a button (send a message, ask for a comment, menu or program) your chat, profile and recent entries are sent to the provider you picked (NVIDIA Build, Groq, OpenRouter, Google Gemini, OpenAI, Anthropic Claude or a service you add; OpenAI and Anthropic are paid); nothing is sent automatically or in the background. Their servers are outside Turkey. You can withdraw consent at any time; without it the app works fully.
- NeoWell is for adults (18+); setup does not accept ages under 18, and the Coach stays off until an age is entered.

PRIVACY
- No account, no servers of our own, no ads, no analytics.
- Backups go where you choose and are password-encrypted.
- Delete data by category in Settings > Privacy and data.

IMPORTANT: NeoWell is not a medical device, does not diagnose or recommend treatment, and does not replace a doctor. Values are approximate. Consult your doctor for health decisions, and before changing diet or exercise if you are pregnant, have an eating disorder history or a medical condition.
