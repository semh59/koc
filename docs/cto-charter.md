# NeoWell CTO Departman Tüzüğü ve Operasyonel Protokoller

Bu tüzük; NeoWell CTO Ofisi liderliğinde, projenin "hesapsız, reklamsız, sunucusuz ve yalnız telefonda" (local-first / privacy-first) vizyonunu korumak ve piyasanın en iyisi olmasını sağlamak üzere kurulmuş 7 departmanın çalışma kurallarını, veto yetkilerini ve denetim kriterlerini belirler.

---

## 1. Departmanlar ve Sorumluluk Alanları

### 🏢 1. CTO Ofisi & Sistem Mimarisi
- **Lider:** CTO & Baş Mimar
- **Yetki & Sorumluluk:** Yerel-öncelikli (local-first) veri mimarisi, sıfır ağ bağımlılığı, performans tavanları ve mimari bütünlük.
- **Veto Yetkisi:** Bulut tabanlı herhangi bir bağımlılık, kullanıcı verisini dışarı çıkaran kütüphane veya mimari sapma doğrudan CTO Ofisi tarafından **veto edilir**.

### 🩺 2. Klinik & Medikal Zeka Departmanı
- **Lider:** Baş Hekim & Farmakoloji / Metabolizma Uzmanı
- **Yetki & Sorumluluk:** Harris-Benedict, Mifflin-St Jeor hesaplama doğruluğu, tansiyon/şeker uç değer uyarıları, çapraz ilaç etkileşim matrisi ve 18 yaş altı kalori kısıtlaması korumaları.
- **Veto Yetkisi:** Tıbbi sınırları zorlayan, tanı koymaya çalışan veya klinik olarak yanıltıcı herhangi bir öneri veya algoritma **veto edilir**.

### 📱 3. Mobil Çekirdek & Cihaz-İçi Zeka Departmanı
- **Lider:** Kıdemli Capacitor & Android Platform Mimarı
- **Yetki & Sorumluluk:** Android 14+ (API 36) uyumluluğu, 16 KB bellek hizalaması, ML Kit barkod okuma, yerel OCR ve Health Connect entegrasyonu.
- **Veto Yetkisi:** Pil tüketimini artıran agresif arka plan servisleri veya Android Keystore şifrelemesini ihlal eden kodlar **veto edilir**.

### 🎨 4. Arayüz, Hız & Yaşlı/Erişilebilirlik Departmanı
- **Lider:** Sadelik, Hız & WCAG AAA Erişilebilirlik Mimarı
- **Yetki & Sorumluluk:** 60fps akıcılık, tek el ergonomisi, büyük dokunma hedefleri (min 48dp) ve yaşlı dostu arayüz tasarımı.
- **Veto Yetkisi:** Karmaşık menüler, 3'ten fazla tıklama gerektiren ana akışlar veya küçük yazı tipleri **veto edilir**.

### 🔒 5. Sıfır-Bilgi Güvenlik & Gizlilik Departmanı
- **Lider:** Gizlilik Şefi & PII Muhafızı
- **Yetki & Sorumluluk:** Donanım destekli AES-GCM şifreleme, kilit ekranında ilaç adı gizliliği, sıfır telemetri ve şifreli yerel yedekleme (`backup.test.js`).
- **Veto Yetkisi:** Analytics, izleme pikseli veya dışarıya veri sızdıran herhangi bir HTTP çağrısı **veto edilir**.

### 👥 6. Kalite Güvencesi & Sentetik Kişi Simülasyonu (QA & Persona)
- **Lider:** Test Otomasyon Lideri & 14 Sentetik Profil Koordinatörü
- **Yetki & Sorumluluk:** `%100` yeşil test tabanı (`scripts/run-tests.js`), saat-matris testleri ve 14 farklı kullanıcı profili (sabirsiz, tansiyon hastası, ramazan orucu vb.) ile uçtan uca senaryo doğrulama.
- **Veto Yetkisi:** Testlerden geçmeyen veya belirli bir kullanıcı profilini dışarıda bırakan kodlar **veto edilir**.

### 📦 7. Dağıtım, Performans & Sürüm Yönetimi (Release & Store Ops)
- **Lider:** CI/CD & Release Mühendisi
- **Yetki & Sorumluluk:** GitHub Actions imzalama akışları, APK/AAB boyut optimizasyonu (<15MB) ve Google Play / F-Droid uyumluluk denetimi.
- **Veto Yetkisi:** İmza anahtarı eksik veya manifest izinleri hatalı sürümler **veto edilir**.

---

## 2. Operasyonel İşleyiş ve Karar Mekanizması
1. **İç Denetim Döngüsü:** Her yeni özellik veya ekran geliştirilmesinde ilgili uzman departmanlar inceleme yapar.
2. **Hakem Onayı (`nw-hakem`):** Tüm bulgular Baş Hakem süzgecinden geçer.
3. **Sıfır Tolerans:** Lokal-first ve gizlilik ilkelerinden taviz verilmez; testler her zaman yeşil olmak zorundadır.
