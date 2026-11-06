# Eski egzersiz düzeltmeleri — 9: yana adım

## Kusur ve kapsam
`sidestep`, `legspread` alias'ıydı; iki ayak birlikte açılıp yerde kayıyor, kalça sabit kalıyordu. Cue ise öncü adım, takip adımı ve ters yöne dönüş istiyordu. RED: `node scripts/gym-sidestep.test.js`, `side step must not alias simultaneous leg spreading`, exit 1.

Yalnız `sidestep` bağımsız beş pozlu önden şablona ayrıldı. Motorun opt-in `dx` alanı kalçayı yatay taşır; `feet` iki bağımsız `[sahne-X ofseti, zeminden yükseklik]` hedefini mevcut iki kemikli IK ile çözer. Hedefler kalçaya göre değil sabit X=80 sahne referansına göredir. Eski `foot` yolu değişmedi. Sağ/sol ayaklar `feet[0]`/`feet[1]`; hedefler ease katsayısıyla karışır. Yeni önden IK yönü dizleri birbirinin üzerinden geçirmez.

Başlangıç kalça X=80/Y=90, ayak bilekleri X=85/75 ve Y=136. Öncü ayak X=95'e, ardından takipçi X=85'e gelir; kalça X=90'a taşınır. Swing orta fazında bilek/parmak yerden 5 birim yukarıda. Ping-pong dönüşte sıra tersine döner. Her faz boyunca diğer ayak bileği ve parmağı sahnede sabit/yerdedir. Kemik uzunluğu motor örneklerinde 24 birim korunur; tarayıcı SMIL eklemleri doğrusal karıştırdığı ve koordinatları 0.1'e yuvarladığı için ara SVG karelerinde tam sabit kemik uzunluğu/klinik yürüyüş garantisi verilmez.

Sekiz fazlı yolun temas sınırlarını atlamamak için yalnız bu şablon `samples:16` kullanır. Eski 14 örnekle temas sınırında iki ayak havalanabildiği kalıcı negatif testle doğrulandı; diğer şablonlar 14 örnekte kaldı. Döngü süresi 2.6 s, kadans reçetesi değildir.

## Doğrulama
- `gym-sidestep.test.js`: 8 PASS. 65 motor örneği; sabit destek bileği/parmağı, swing açıklığı, öncü/takip sırası, kalça seyahati, kemik uzunluğu, diz sırası, sonluluk/viewBox ve loop. SVG değerleri arasında 129 zaman örneğiyle temas korunumu. Beş hareket mutasyonu ve 14 örnekli hatalı temas mutasyonu reddedilir.
- Gerçek Chrome detay **ve rehber** SVG'si: 129 zaman, 360/412 px; her fazda sabit destek, swing açıklığı, temas noktaları, kalça seyahati ve 0.02 toleransla loop. Reduced-motion detayda static/0 animate. Odak E2E 2/2 PASS.
- İlk E2E denemesi loop'ta bit düzeyi eşitlik beklediği için 2/2 başarısızdı; Chrome koordinat farkı yaklaşık 0.000016 idi. Geometri toleransı 0.02 ile düzeltildi; ürün temas assertion'ları gevşetilmedi.
- Son test değişikliğinden sonra tam No-Coach runner: **95 dosya / 2336 PASS / 0 hata**; 8 Coach-only skip, 18 mixed scoped (`sidestep-full.log`). Tam release E2E **36/36 PASS**, `--workers=1` (`sidestep-e2e.log`). Loglar Hermes scratch altında.
- Önceki HEAD'in 55 şablonu ile 49 motor örneği/parts ve SVG karşılaştırmasında yalnız `sidestep` değişti; diğer 54 çizim birebir korundu. `legspread` ve onu kullanan yedi dış kayıt bu onarım kapsamında değiştirilmedi.
- Capacitor copy/patch/sync exit 0: **28 Java / 44 resource / 115 web asset**. Katalog --check: **332 runtime / 332 review / 0 yeni**. Veri/ID/cue/geçmiş değiştirilmedi.

## Durum ve sınırlar
İki bağımsız salt-okunur inceleme kusuru ve temas örnekleme riskini doğruladı; son snapshot düzeltme denetimi bekleniyor. Bu, canonical kimlik veya klinik/subjektif görünüş onayı değildir. Önceki paralel Chrome kaynak hataları açık; CI/APK/emülatör/fiziksel cihaz çalıştırılmadı. `heeltoe`, diğer dış katalog varyantları ve özel egzersiz seçeneklerindeki genel `legspread` gösterimi açık kapsamdır.
