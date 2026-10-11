# Kalan işler (11 Ekim 2026, sürüm 1.0.279)

Tek güncel liste. Eski ayrıntılar: `todo.md` (telefon test adımları), `roadmap.md` (yapılanlar), `plan-acik-isler.md` (son plan). Kodla bitirilebilecek iş kalmadı; aşağıdakilerin hepsi Semih'e, telefona ya da Play'e bağlı.

## 1. Semih'ten gereken bilgi
- Gizlilik politikası: veri sorumlusu adı, adres (il/ülke yeterli mi?), yayınlanabilir iletişim e-postası, yayın tarihi ve adresi (`todo.md` "Doldurulacaklar").
- "Yanıtı bildir" düğmesi için aynı e-posta.
- Kararlar: G1 (Mi Band/saat), G4 (karartılmış tahlil PDF'i), G5 (eski klasörler, olası sızmış token'lar), G13 (TürKomp izni).
- Depo kalıcı public olsun mu (şimdilik private; yalnız sürüm çıkarırken kısa süre public).

## 2. Telefonda denenecekler (öncelik sırasıyla)
1. Samsung ilaç alarmı tam ekran (Ayarlar > İlaç hatırlatıcı > "Kilitli ekran testi"; olmazsa Ayarlar > Modüller alarm kaydı AS/AE satırları).
2. Ramazan modu: "Konumumu kullan" izni, kartın "doğrulandı" demesi, bildirimler.
3. Yeni özellikler: hızlı yemek yazma, rahat mod, CSV içe aktarma, tüm veri arşivi, denge egzersizleri, lif çubuğu, hekim hazırlığı (hepsi yalnız jsdom/e2e ile kanıtlı).
4. Health Connect okuma, kamerayla nabız ölçümü.
5. `todo.md` "Telefonda tek tek test edilecekler" (eski özellikler; yalnız barkod telefonda denendi).

## 3. Play yayını
- Beyanlar: Sağlık, tam ekran bildirim, ön plan servisi videosu, IARC, hedef kitle.
- Hesap: kişisel hesapta 12 testçi ve 14 gün kapalı test; Play App Signing.
- Release anahtarı (`D:\PROJECT\koc-release-key\`) iki ayrı yere yedeklenecek.

## 4. Bilinen sınırlar (bilinçli)
- Güvenlik freni: yumuşak ağ geniş; yeme bozukluğu işareti kalıcı. Oruç ve protein metinleri hekim gözünden geçmedi.
- Ramazan hesabı yalnız Ekim 2026 verisiyle ölçüldü; mevsim sapması kartta "Doğrula" ile yakalanır.
- Faz 6: `settings` bölünmedi (veri şeması riski), modül→çekirdek bağımlılıkları daraltılmadı.
- Hukuki süreç yok (kararı); `legal-questions.md` yalnız veri akışlarını listeler.

## 5. Ar-Ge raporu (`docs/rd/`) durumu
Birleşik liste `rd/oncelik.md`; takım raporları öneri numaralarıyla kodla karşılaştırıldı (11 Ekim 2026).

**Yapıldı:** Dalga 1 ve 2'nin tamamı (sodyum ve Rehber rakam doğrulama hariç), Dalga 3'ten tam arşiv (JSON), denge/işlevsel güç içeriği ve FHIR R4 dosyası (tansiyon ve kilo). Ayrıca öneri listelerinden: aralıklı yürüyüş akışı (adım/dk geri bildirimi yok), geçmiş aylık özetinde kişisel normal bandı (adım, su, kalori; Trend'de yok), kuvvet x kilo satırı (Bağlantılar), tahlil detayında önceki 30 günün ev ölçümü, döngü kartında dönemden önceki 5 günün ruh hali/uyku özeti, "bu hareket rahatsız etti" işareti ve benzer hareketler, "Kendi deneyin" (14 gece, tek sabit soru).

**Bilerek yapılmadı:**
- Sodyum/tuz çubuğu: tariflerde tuz bileşeni yok (`recipes.txt`, `meals.txt`); hesap yalnız malzemenin kendi sodyumunu sayar, eklenen tuzu saymaz. Kaynaksız bir tuz varsayımı eklemek uydurma olur.
- Rehber rakam doğrulama ve "Rehber'e ne gitti" defteri: Rehber daraltıldı, modele yalnız profil satırı gidiyor; yemek tahmin kartında kcal-makro tutarlılık denetimi var, ağ defteri Gizlilik ekranında.
- Health Connect'ten tansiyon/şeker okuma: yerel Java kodu yalnız CI'da derlenir, telefonda denenemez; Play beyanını değiştirir. `rd/analiz-dalga-3.md` kararı: Play ilk onayından sonra.
- FHIR'de şeker: LOINC kodu doğrulanamadı, dosyada yok.
- "Yakınıma haber ver": sunucu/SMS gerektirir, mimariyle çelişir (rapor reddetti).
- Aralıklı yürüyüşte adım/dk: faz sınırında adım sayacı farkı ister; sensör eklentisi telefonda denenmeden bağlanmadı.
