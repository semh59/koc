# Security red-team: CSV/PDF/SAF paylaşım sınırı

## Durum

**Sonuç: doğrulanmış açık yok.** Bu faz `release/no-coach` dalında, commit `6eceb7bffc079547260570c5c88f8cbef0fe11cb` üzerinde yürütüldü. Çalışma ağacı temizdir.

Bu rapor browser ve Capacitor native-shim kanıtını gerçek Android cihaz kanıtından ayrı tutar.

## İncelenen saldırılar

### 1. Kötü amaçlı CSV import

Gerçek dosya seçici ve import onayı üzerinden şu payload denendi:

- geçersiz tarih: `2026-02-30`
- formula payload: `=HYPERLINK("https://probe.invalid")`
- command-benzeri hücre: `@cmd`

Gözlenen sonuç:

- geçersiz tarih reddedildi (`Okunamadı: 1`)
- yalnız geçerli kilo kaydı state’e girdi
- formula ve command metni state’e taşınmadı
- XSS veya native çağrı oluşmadı

Kalıcı komut: `e2e/csvimport.spec.js` suite’i `3/3` geçti.

### 2. CSV formula injection

Gerçek `Raporlar ve dışa aktarma → CSV paylaş` akışından indirilen dosyanın bytes’ı incelendi.

Gözlenen sonuç:

- ham `=HYPERLINK(...)` hücresi yok
- hücre `'=` ile nötrlenmiş
- UTF-8 BOM ve CSV formatı korundu

Geçici gerçek-UI probe: `1 passed`, exit `0`. Probe dosyası temizlendi; üretim kodu değişmedi.

### 3. PDF komut/action injection

Gerçek `Hekime hazırlan → PDF hazırla` akışına şu soru verildi:

```text
) Tj /OpenAction << /S /JavaScript /JS (app.alert(1)) >> (
```

İndirilen PDF gerçek bytes olarak incelendi.

Gözlenen sonuç:

- PDF header: `%PDF-1.4`
- `/OpenAction`: yok
- `/JavaScript`: yok
- `app.alert`: yok
- payload canvas/JPEG raster katmanında kaldı

Geçici gerçek-UI probe: `1 passed`, exit `0`. Probe dosyası temizlendi; üretim kodu değişmedi.

### 4. Native CSV paylaşım / SAF sınırı

Browser içindeki gerçek üretim paylaşım akışı Capacitor `Filesystem` ve `Share` shim’i ile ölçüldü.

Gözlenen sonuç:

- önceki `neowell-*.csv` cache dosyası temizlendi
- yeni dosya yalnız `CACHE` içine yazıldı
- dosya adı `neowell-tablo-1-2026-10-06.csv`
- veri `encoding: utf8` ile yazıldı
- paylaşım URI’si `content://com.neowell.cache/...` oldu
- path traversal (`..`, çift slash) gözlenmedi

Geçici gerçek-UI/native-shim probe: `1 passed`, exit `0`. Probe dosyası temizlendi; üretim kodu değişmedi.

## Kalıcı komşu kapılar

```text
CSV import: 3/3 passed
PDF suite: 2/2 passed
CSV/PDF toplam komşu suite: 5/5 passed
```

Ek mevcut PDF testi pdf.js worker ile laboratuvar PDF okumasını da kapsar.

## Kanıt sınırı ve açık risk

- Browser DOM/indirilen bytes kanıtı gerçek Android PDF viewer veya Excel/Sheets davranışı değildir.
- Native-shim kanıtı gerçek Capacitor bridge, Android `ContentProvider`, SAF hedefi veya OEM paylaşım uygulaması değildir.
- Fiziksel Android’de URI izinleri, hedef uygulamanın dosyayı geç açması, Android 13+ paylaşım davranışı ve gerçek PDF renderer henüz doğrulanmadı.
- CSV/PDF/SAF tarafında bu faz için doğrulanmış güvenlik açığı yoktur.

## Çalışma ağacı kanıtı

```text
repo: D:/PROJECT/NeoWell
branch: release/no-coach
HEAD: 6eceb7bffc079547260570c5c88f8cbef0fe11cb
status: clean
```
