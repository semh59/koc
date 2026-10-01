# Akıllı GPS ile hareket algılama (tasarım, 2026-10-01)

Amaç: yürüyüş/koşuyu otomatik algıla, hız ve kaloriyi bul. Harita ve rota yok, konum noktası saklanmaz.

## Temel kural (doğrulandı)
Android 12+ ve konum türünde ön plan servisi: uygulama arka plandayken konum ön plan servisi başlatılamaz, `ACCESS_BACKGROUND_LOCATION` izni yoksa. Yani "uygulama kapalıyken kendi kendine GPS aç" = "Her zaman izin ver" izni. Elle başlatılan yürüyüşte bu izin gerekmez.
Kaynak: developer.android.com "Restrictions on starting a foreground service from the background".

## Seçenekler
1. **Tam otomatik + arka plan konum izni:** en otomatik. Xiaomi/Android ara sıra "konumu arka planda kullandı" uyarısı verir, izin otomatik geri alınabilir.
2. **Otomatik algılama GPS'siz, GPS yalnızca uygulama açıkken:** ek izin yok, adım uzunluğu öğrenme yavaş.
3. **Pasif GPS:** başka uygulama (Haritalar) konum alırken bedava konum yakalar. Pil maliyeti sıfır, fırsatçı ve yavaş.

## Akıllı kullanım ilkeleri
- **Konum farkı değil GNSS hızı:** `Location.getSpeed()` ve `getSpeedAccuracyMetersPerSecond()` Doppler'den gelir, konum 10+ m zıplasa da doğrudur. Adım uzunluğu = hız ÷ ritim. Kısa pencere yeter.
- **Adım uzunluğu ritmin fonksiyonu:** yürüme ve koşu için ayrı doğru, uzunluk = a + b·ritim. Farklı ritimlerdeki GPS pencereleri doğruyu doldurur.
- **GPS yalnızca bilgi kazandırdığı yerde:** algılanan hareket aralığında 1-3 dk pencere, ve yalnızca model o ritimde belirsizse. Isınma noktalarını doğruluk ≤15 m olana dek at. ~60 sn iyi nokta gelmezse (kapalı alan) kapat ve geri çekil. Günlük üst sınır. Pil az ya da pil tasarrufu açıksa kullanma. Model oturunca nadiren yeniden doğrula.
- **GPS doğrulayıcı:** yüksek hız + düşük ritim = araç; o adımları/aralığı at. GPS hızı yürü/koş ayrımını (~150+ adım/dk koşu) doğrular.
- **Koordinat saklama yok:** anlık hesapla; yalnızca model parametreleri ve aralık özetleri kalır.
- Bağımlılık: `play-services-location` (patch-android.js).

## Test planı
Saf mantık Java sınıfında (StepMath/QuickMath gibi): nokta süzme, adım uzunluğu doğrusu, araç ayıklama, yürü/koş sınıflama, kısa aralık atma, MET kalori. Emülatör `adb emu geo fix` ile GPS yolunu smoke'ta kapsar. Etkinlik Tanıma emülatörde yok, telefon testi.

## Yorulma ve tempo değişimi (eklendi)
Açık aralık sürerken her ~2,5 dk adım sayacından kontrol noktası alınır (yalnızca hareket sürerken, alarm pil maliyeti ihmal edilebilir). Aralık kapanınca özet dilim dilim hesaplanır: her dilimin kendi ritminden adım uzunluğu, hız ve kalori bulunur; ritmi 50'nin altı dilimler duraklama sayılır (kalori yok). Ritim bir önceki dilimden %20 sapar ve o ritim aralığı öğrenilmemişse, son GPS penceresinden 10 dk geçtiyse kısa GPS penceresi açılır. Böylece "dakikada adım düştü" bilgisi hem toplam mesafeye hem GPS kararına yansır.
