# Gerçekçi insan ve kas vurgusu pilotu

## Güncel karar — tüm egzersizlere uygulama yetkisi
Semih yeni ayak/tam hareket videolarından sonra **“Güzel beğendim şimdi tüm egzersizlerde uygulamalıyız”** dedi. Onaylı pilot görünümü/hareketi tüm mevcut egzersizlere taşınacak; eski aşağıdaki pilot durumları tarihseldir. Güncel kapsam, sabit hashler ve aşamalar [ROLLOUT.md](ROLLOUT.md) içinde. Gerçek katalog/motion/muscle envanteri ve entegrasyon incelemesi sürüyor; üretim henüz değişmedi. Bu kullanıcı onayı klinik/cihaz veya diğer egzersizlerin doğrulaması sayılmaz.

## Güncel devam doğrulaması
- Kalıcı pilot `D:/PROJECT/NeoWell-exercise-pilot/viewer/`, yerel adres `http://127.0.0.1:8770/viewer/`. Üretim ekranı değişmedi.
- Güncel neutral model HTTP hash doğrulamasıyla 7 poz temas kontrolü geçti; aynı pozun tüm skin vertexlerinde tekrar farkı 0. Anatomik temas segmentasyonu/gerçek cihaz kanıtı değildir.
- Renk sözleşmesi RED→GREEN: 278 triseps vertexi kırmızıdan yardımcı kas turuncusuna geçti; göğüs 350 kırmızı, triseps 278 ve ön omuz 118 turuncu; UI açıklaması eşlendi, toggle renkleri birebir geri yüklüyor.
- Mobil kadraj RED→GREEN: 390×844'te 2722 kırpılan vertex; hareket sınırı/FOV tabanlı kamera sonrası üç viewport ve 15 pozda 0. Gerçek telefon performansı ölçülmedi.
- `node hand-contact.test.cjs`, `node muscle-role.test.cjs`, `node mobile-frame.test.cjs`, `node ui-test.cjs`, `node test.cjs`, `node audit-raf.cjs` exit 0. Güncel ayrıntılar `D:/PROJECT/NeoWell-exercise-pilot/viewer/CURRENT.md`.
- Bağımsız temas incelemesi tamamlandı: 101 fazda minimum −2,23 mm; orta/serçe/başparmak yüzey desteği yetersiz ve başparmak +50 mm mutasyonu eski testi geçiriyor. Mevcut 7 poz PASS genel temas kabulü değil. Kanıt `D:/PROJECT/NeoWell-exercise-pilot/review-current/REPORT-TR.md`; düzeltme açık.
- Gövdenin opak dokuya rağmen şeffaf render edilmesi yalnız gövdede düzeltildi; aksesuar alfa ayarları korundu. Probesiz materyal testi ve 6 komşu script exit 0; bağımsız son denetim sürüyor. Vision `no vision-capable provider connected`; görsel kalite ve anatomi onayı hâlâ açık.

## Yeni temas adayı
- Ayrı pilotta el/parmak rotasyon kalibrasyonu yenilendi. Parent son suite tekrar koşumu exit 0: 8 pozitif komut ve beklenen exit 1 veren 6 mutasyon. 101 kare yüzey kontrolünde el penetrasyonu yok; minimum +0,0387 mm. Gerçek başlangıç temas noktası kayması 3,971 mm.
- Anatomik kabul açık: thumb/pinky bind-local dönüşleri 45–52°, uzman/insan hareket incelemesi yok. Eski bağımsız audit temas dışı bilek deformasyonundan exit 1; ayak ucu −1,9999 mm. Bunlar kapanmadı.
- Kullanıcı önceki sabit model görünümünü/kas işaretlerini beğendi. Yeni hareket `D:/PROJECT/NeoWell-exercise-pilot/viewer/contact-evidence/final-preview/pushup-motion.mp4` olarak hazır; hareket onayı ve yeni bağımsız denetim bekleniyor. Üretim entegrasyonu yapılmadı.
- Hareket test açığı ve eski mutasyon dikişleri düzeltildi: parent `node test-gap-evidence/run-checks.cjs` exit 0; bağımsız `test-gap-final-review/verify.cjs` exit 0, 8 koşum beklenen sonuçta. No-op poz ve donmuş runtime gerçek hareket assertion'larında reddediliyor. 120 mm pelvis inişi, 121,60 mm gövde RMS ve 56,46° dirsek yanıtı mühendislik regresyon ölçümleri; klinik ROM/anatomi kabulü değil. Model ve viewer hareket kaynağı değişmedi; açık kalite kapıları korunuyor.

## Karar ve kapsam

- Model bütçesi: 0; satın alma, ücretli servis veya mağaza lisansı yok.
- İlk kapsam: ayrı pilot ekranda tek şınav; mevcut katalog ve üretim görüntüleyicisi henüz değişmeyecek.
- Kabul hedefi: gerçekçi insan yüzeyi, doğru hareket, anatomik sınırlarla birincil/ikincil kas vurgusu, mobilde kullanılabilirlik.
- Ücretli ürün düzeyinde kalite ve rakip üstünlüğü henüz doğrulanmadı.

## Kaynak anlık görüntüsü

- Depo: `D:/PROJECT/NeoWell`
- Dal: `release/no-coach`
- HEAD: `bfdd8394459a1b29981cb7e7bd36b08a79459b2f`
- Başlangıçtaki ilişkisiz untracked dosyalar: `e2e-3d-report.json`, `www/models/male_suit.glb`, `www/models/mannequin_m.glb`, `www/models/superhero_m.bin`, `www/models/superhero_m.gltf`. Dokunulmayacak.

## Doğrulanmış başlangıç bulguları

1. `www/modules/gym/fig3d.js:58–89` görünür mesh yerine kemik referansları tutuyor; `:101–139` bu kemiklerde materyal arıyor. Gerçek `mannequin_f.glb` yüklenerek yapılan probda göğüs vurgusu öncesinde/sonrasında iki materyalin emissive rengi `000000` kaldı.
2. Aynı gerçek GLB ve aynı şınav karesi art arda uygulandığında sağ ayak kemik konumu 0.9962832185330042 sahne birimi değişti. Mevcut dönüşüm önceki pozdan bağımsız değil. Birim metre kabul edilmedi; bu sayı render koordinatıdır.
3. `node scripts/gym-3d.test.js` → exit 0, 4 PASS. Bu kontroller GLTF değil primitive mock kolunu çalıştırıyor; gerçek skin deformasyonu, kas vurgusu veya ayak/avuç temasını kanıtlamıyor.
4. Aktif GLB iki SkinnedMesh ve 65 kemik içeriyor; ayrı kas geometrisi veya cilt dokusu yok. Mevcut dosyaların kaynak/lisans izi doğrulanmadı; yeni pilot bunları yeniden dağıtmayacak.

Prob: depo dışındaki `C:/Users/semih/AppData/Local/hermes/cache/scratch/neowell-human-pilot/baseline.cjs`; sonuç aynı klasörde `baseline-result.json`.

## Ücretsiz kaynak kararı

MakeHuman/MPFB çekirdek varlıkları adaydır. Resmî lisans temel mesh, doku, rig ve pozları CC0 olarak tanımlar; eklenti kodunun GPL lisansı ile model çıktısının lisansı farklıdır. Üçüncü taraf eklentiler/varlıklar otomatik olarak bu kapsama dahil değildir.

- https://raw.githubusercontent.com/makehumancommunity/mpfb2/master/LICENSE.md
- https://static.makehumancommunity.org/mpfb/faq/use_in_closed_source.html
- https://static.makehumancommunity.org/mpfb/docs/exporting.html

Dışa aktarım için GameEngine materyal/rig, helper temizliği ve gerçek çıktı testi gerekir. Kaynak cilt/rig sağlar; doğrulanmış hazır kas-kas segmentasyonu sağlamaz.

## Aşamalar ve kabul kapıları

- [x] Mevcut GLTF hatalarını gerçek dosyayla yeniden üret.
- [x] Sıfır maliyetli, ticari kullanıma uygun çekirdek varlık lisansını doğrula.
- [x] Kaynak/provenance ve üretim komutuyla gerçek rigged insan GLB oluştur. Parent tarafından dosya hash/başlık ve iki doğrulayıcı yeniden çalıştırıldı: 8.210.084 bayt, SHA256 `10d7bce642c4bb571037351be0c3196b1f19de90817ef2cfee2eb1a43b58b8e1`; 7 skinned mesh, 53 eklem, 6 gömülü görsel, 36.034 üçgen. Khronos: 0 hata, 7 `NODE_SKINNED_MESH_NON_ROOT` uyarısı, 1 bilgi. Uyarıların tarayıcı etkisi bağımsız incelemede; görsel onay verilmedi.
- [ ] Tek şınavı önceki kareden bağımsız, temas kontrollü olarak uygula; gerçek mesh üzerinde test et.
- [ ] Göğüs / triseps / ön omuz vurgusunu ayrı ve anlaşılır göster. Renk şiddeti ölçülmüş EMG/aktivasyon yüzdesi gibi sunulmayacak.
- [ ] Tarayıcı yükleme, kontrol, WebGL ve hata testlerini çalıştır.
- [ ] Görsel kalite ve anatomik sınırları bağımsız incele; kullanıcı onayı olmadan tüm egzersizlere yayma.
- [ ] Fiziksel Android cihazında performans ve görünüm doğrula.

## Açık engeller

- Taşınabilir Blender 4.5.9 ve MPFB 2.0.18 ile gerçek insan GLB üretildi; sistem geneline kurulum yapılmadı. Kalıcı çalışma kopyası: `D:/PROJECT/NeoWell-exercise-pilot/model/athletic-male-mpfb.glb` (kaynakla SHA256 eşleşti). Aynı klasörde üretim bilgileri, kaynak lisansları, dosya manifesti ve düzenlenebilir `.blend` bulunuyor. Henüz egzersiz animasyonu/kas segmentasyonu içermiyor; ayrı tarayıcı pilotu hazırlanıyor. Scratch klasörü 24 saat kullanılmadığında temizlenebileceği için asıl kopya değildir.
- İlk modelin gövde/şort ayrımında hata: şortta el/bilek bölgesine ait 20 vertex ve 12 üçgen tespit edildi; kol hareketinde 0,3028 m yer değiştiriyor. Üretime kabul edilmedi. `Skeleton.pose()` resetinde maksimum 0,2245 m geometri kayması bulundu; yükleme anındaki yerel pozları geri yükleme 10 tekrarda fark vermedi. Bağımsız rapor: `C:/Users/semih/AppData/Local/hermes/cache/scratch/neowell-human-pilot/independent-report.md`.
- Kullanıcı isteği doğrultusunda ilk erkek görünümlü model yerine cinsiyet vurgusu düşük, doğal oranlı nötr sporcu hazırlanıyor; görsel onay henüz yok. Eski ilk modelin ayrı tarayıcı pilotunda ebeveyn testi: 5 kare tekrar sapması 0, en düşük ten yüzeyi zeminin 4,6 mm altında; avuç teması, anatomi ve görsel kalite kabul edilmedi. Gerçek uygulama ekranı değiştirilmedi.
- Görsel inceleme aracı `no vision-capable provider connected` bildirdi. Ekran görüntüsünün alınması, görsel kalite onayı değildir.
- Tıbbi/anatomik uzman değerlendirmesi, rakip karşılaştırması ve fiziksel cihaz testi yapılmadı.
