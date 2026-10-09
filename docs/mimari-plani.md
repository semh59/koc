# Mimari plan: modüler yapı ve modül başına veri

Amaç: `index.html` içindeki ~1300 satırlık ana betiği ve tek JSON kayıt yapısını, her biri kendi verisine ve kurallarına sahip bağımsız modüllere bölmek. Mikroservis fikrinin telefon uygulamasındaki karşılığı **modüler monolit**tir: tek uygulama, ama her modülün kendi klasörü, kendi verisi, kendi testi ve yalnız sözleşmeyle konuştuğu sınırları vardır. Ağ üzerinden ayrı süreç gerekmez, olsa yavaşlatır ve pili yer.

## Bugünkü durum (ölçüldü)
- 65 betik dosyası var, çoğu zaten modül gibi (`*lib.js` mantık, `*ui.js` ekran). Ama hepsi **ortak globallere** bağlı: `S` (tüm veri), `tab`, `render`, `save`, `logOff`, `openSheet`, `toast`.
- `index.html` ana betiği (satır ~500-1800) tek parça: veri temizleyicileri (cleanSettings, cleanEntries, buildState), kayıt (load/save), bileşenler (halka, grafik), ekranlar (Bugün, Trend, Daha, Ayar), alt sayfalar (yemek, su, kilo, spor, not), yedek, bildirim, adım ve **tek dev tıklama dağıtıcısı** (satır ~1616-1780).
- Veri: tek JSON metni (`koc_v1`), her kayıtta tamamı yeniden yazılır. Modüller birbirinin verisini doğrudan okur (Geçmiş, Koç, yedek, CSV hepsi `S.*` içinde gezer).
- Test güvencesi güçlü: 48 birim dosyası, 268 e2e testi, depo mutasyon taraması. Bu, bölmeyi güvenli yapan şey.

## Hedef yapı

```
www/
  index.html            (~100 satır: kabuk, betik sırası)
  kernel/               ortak çekirdek: state, store, bus, registry, tarih/birim, ui (sheet, toast, ring, chart)
  modules/
    yemek/ su/ kilo/ spor/ not/         (kayıt türleri; şimdilik entries)
    salon/                              antrenman, şablon, rehberli mod
    adim/ hareket/                      sensör, Health Connect, yürüyüş
    uyku-ruh-oruc/ nabiz/ tansiyon-seker/ tahlil/ olcu/ dongu/ ilac/
    koc/                                sağlayıcılar, rıza, bağlam
    gecmis/                             takvim, aylar, arama, gün
    yedek/ csv/ gizlilik/               dışa/içe aktarma, silme
    bildirim/ widget/ kilit/
```

Her modülün **sözleşmesi** (tek dosya, `index.js`):
- `id`, sahip olduğu veri dilimi (örn. `pulse`, `hr`) ve sürümü.
- `clean(raw)`: kendi verisini doğrular (bugünkü `clean*` işlevleri buraya taşınır).
- `summary(day)`: o günün özeti (Geçmiş, Koç, CSV buradan okur; kimse başkasının verisini kurcalamaz).
- `coachContext(range)`: Koç'a gidecek kısım. **Rıza filtresi modülün içinde** (saatten gelen veri gibi kurallar tek yerde).
- `exportRows()` / `importRows()`: yedek ve CSV için.
- `views`, `sheets`, `handlers`: kendi ekranlarını ve `data-<modül>` tıklamalarını kaydeder (dev dağıtıcı kalkar).
- `settings`: kendi ayar anahtarları ve varsayılanları.

Çekirdek kuralları:
1. Modül başka modülün dosyasını ya da verisini doğrudan kullanmaz; yalnız o modülün sözleşmesini (`Mod.get("kilo").latest()`) ya da olay yayınını (`bus.emit("entry:added", …)`) kullanır.
2. Çekirdek hiçbir modülü tanımaz (bağımlılık yönü: modül → çekirdek).
3. Sınır ihlali CI'da testle yakalanır (bir modül dosyası başka modülün iç adlarını anarsa derleme durur).

## Veri (DB) planı

Şimdi: tek metin. Hedef: IndexedDB'de **modül başına nesne deposu**.

| Depo | İçerik | Anahtar |
|---|---|---|
| `meta` | şema sürümü, sıra numarası, kopya bilgisi | sabit |
| `settings` | ayarlar (modül önekli) | anahtar |
| `entries` | yemek, su, kilo, spor, not, adım kayıtları | `id`; dizin: `day`, `type` |
| `workouts`, `templates`, `customEx` | salon | `id` |
| `sleep`, `mood`, `fast`, `pulse`, `hr`, `vitals`, `labs`, `measures`, `cycle`, `meds`, `medLog`, `moves` | ilgili modül | gün/`id` |
| `coach`, `chats` | sohbet ve sağlayıcılar | `id` |
| `photos` | zaten ayrı (`nw_photos`), yeni şemaya taşınır | `id` |

Kazanımlar: her kayıt yalnız değişen satırı yazar (şimdi 1-3 MB'lık tüm metin), ay/gün aralığıyla okuma (3-10 yıl sorunsuz), modül başına şema sürümü ve geçişi, modül başına silme/yedek.

Kurallar:
- Açılışta küçük depolar ve son yıl belleğe yüklenir (bugünkü hız korunur); eski aylar arama ve geçmiş açılınca imleçle okunur.
- Yedek ve geri yükleme **tek IndexedDB işlemi** içinde tüm depoları yazar (ya hepsi ya hiçbiri).
- Yedek dosya biçimi **değişmez** (eski yedekler yüklenir): modüllerin `exportRows/importRows` işlevleri bugünkü `buildState` çıktısını üretir.
- Her depo yazımında sıra numarası ve hata durumu (bugünkü `Store` mantığı) korunur.

## Aşamalar (her biri ayrı yayınlanır, her biri geri alınabilir)

| Aşama | İş | Veri biçimi | Risk | Kabul |
|---|---|---|---|---|
| 0 | Sınır haritası: hangi dosya hangi globale dokunuyor (otomatik tarama), modül listesi onayı | değişmez | çok düşük | tablo `docs/` altında |
| A | **Mekanik bölme**: ana betik bölümlerine göre dosyalara ayrılır (`kernel/`, `screens/`, `sheets/`, `notify`, `steps`, `events`); mantık değişmez. Doğrulama: yeni dosyaların sırayla birleşimi eski betikle **bayt bayt aynı** olmalı | değişmez | düşük | `index.html` ≤ 150 satır, tüm testler aynen geçer |
| B | Çekirdek: olay yayını ve kayıt defteri; dev tıklama dağıtıcısı modüllerin kendi `handlers` kaydına bölünür | değişmez | orta | tüm e2e aynen geçer; yeni ekranlar yalnız kayıtla eklenir |
| C | Veri sahipliği: modül modül `S` kullanımı sözleşmeye çevrilir. Sıra (bağımsızdan bağımlıya): nabız, uyku/ruh/oruç, ölçüler, tansiyon-şeker, tahlil, döngü, ilaç, adım/hareket, kayıt türleri, salon, **sonra** tüketiciler: Geçmiş, Koç, yedek/CSV. Her adımda sınır testi sıkılaşır | değişmez | orta-yüksek | modül başına: iç adlara dışarıdan erişim yok, testleri kendi klasöründe |
| D | **Modül başına depo**: `neowell2` IndexedDB; eski tek metin okunup modül `clean` işlevlerinden geçerek taşınır; eski metin 30 gün yedek kalır. Açılışta gölge doğrulama (eski ve yeni durum eşit mi, farkı günlüğe yazar) | **değişir** | yüksek | taşıma testleri (bozuk, eski sürüm, yarım yazım, çıkış), sahte ve gerçek IndexedDB, telefonda eski veriyle açılış |
| E | Belgelendirme ve temizlik: modül tablosu, kullanılmayan globaller silinir, CI sınır denetimi kalıcı | değişmez | düşük | belge + CI kuralı |

Sıra önerisi: **0 → A → B → C → D → E**. A ve B hemen yapılabilir ve kullanıcıya görünmez. D, veri biçimini değiştirdiği için tek başına, A-C bittikten ve telefonda doğrulandıktan sonra yapılır.

## Ne vermez, ne ister
- Hız artışı vermez (şimdi de hızlı). Kazanç: değişikliğin etkisini küçük tutmak, yeni özellik eklemeyi ve hatayı bulmayı kolaylaştırmak, ve veri büyürken yazma maliyeti.
- Maliyet büyük: yüzlerce dosya taşınır. Bu yüzden her aşama ayrı sürüm, her aşamada tam test.
- Karar noktaları (sana kalan): (1) D'den sonra localStorage aynası ve eski sürüme dönüş kalkar mı (dönüşü kapatır, kod sadeleşir), (2) modül sınırları ve adları (yukarıdaki liste önerimdir), (3) hız: aşama aşama mı, yoksa A-B'yi hemen mi.
