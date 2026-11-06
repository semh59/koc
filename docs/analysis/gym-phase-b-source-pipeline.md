# B-3a — Çevrimdışı baseline kaynak hattı

## Karar ve sınır

Bu dilim B-3'ün baseline üretim kısmıdır; yeni batch kabul modeli henüz tamamlanmadı. `324` dış kaynak + `8` yerel = `332` runtime kaydı korunur. Yeni kabul `0`, kanıtlanmış semantik benzersiz sayı `0`, açık semantik inceleme `332`. Sıfır, tüm hareketlerin aynı olduğu anlamına gelmez; canonical kanıt eksiktir.

## Kaynak ve çıktı

- `scripts/gym-catalog/batches/legacy-external.json`: B-2 commit `1ecc2d54a5bab21f41008b8dbdac6e1f8478feeb` runtime çıktısından taşınmış `324` kayıt. Upstream indirmesi değil, doğrulanmış mevcut normalize değerlerin açık kaynak snapshot'ıdır. Eski upstream ad/ID eşlemesi `scripts/exlib-src.txt` ile ayrıca korunur.
- `scripts/gym-catalog/batches/legacy-local.json`: aynı committeki `6` denge + `2` yürüyüş kaydı.
- `runtime` nesnesi mevcut alanları aynen taşır. `metadata` canonical identity, tüm canonical alanlar, signature, family, cue/template, source/license ref, özgün kaynak adı, edinim tarihi, dönüşüm notu ve status taşır.
- Bilinmeyen canonical alanlar, signature, family ve edinim tarihi `null`; status `review`. Eksik bilgiler ad veya template'ten türetilmez.
- `node scripts/build-gym-catalog.js`: yalnız `www/modules/gym/exlib.js`, `www/modules/gym/balance.js`, `docs/analysis/gym-catalog-metadata.json` üretir. JSON batch dosyaları adlarına göre sıralanır; runtime sıra dış kaynak ardından yerel kayıtlardır.
- `balance.js` generated olur; altı denge kaydını export etme ve sekiz kaydı ana diziye ekleme sözleşmesi korunur. Uygulamanın script yükleme sırası değişmez.
- `python scripts/build_exlib.py` aynı Node üreticisine yönlenen uyumluluk girişidir; artık Pillow, internet veya fotoğraf indirmesi gerekmez. Mevcut fotoğraflara yazılmaz/silinmez.
- `npm run gym:build` üretir; `npm run gym:check` yalnız karşılaştırır. Farklı çalışma dizininden mutlak script yolu da desteklenir. `--check` CRLF/LF farkı dışında tam metin karşılaştırır; bozuk çıktıyı otomatik düzeltmez.

## Kabul ve koruma

ID çakışması, eksik alan, yanlış enum, eksik cue/template, bilinmeyen lisans/kaynak, eski kaynak adı/ID değişimi, eksik inventory ve incelemesiz kabul reddedilir. Runtime alanları ve tüm ID/sıra korunumu, B-2 normalize runtime SHA-256 değeri `4f0ef49b6de8e7f4fb082b4147f77116a06a775d2e701a8ee64387ac38628342` ile test edilir. Bu hash dosya veya fotoğraf hash'i değildir; `JSON.stringify` edilmiş 332 runtime kaydın hash'idir.

Yeni batch'ler B-4 görsel pilot ve ayrı kabul kapısı tamamlanana kadar üretici tarafından reddedilir. Bu bilinçli sınırlama B-3'ün tümünün tamamlandığı anlamına gelmez: doğrulanmış yeni canonical metadata, duplicate/near-duplicate ve kayıt bazlı edinim/attribution modeli B-3b'de bağlanacaktır. Her batch'te UI/native motor yeniden yazma gereği yoktur; fakat şu an yeni batch eklenemez.

## Çalıştırılmış odak kanıtı

- `node scripts/gym-catalog-build.test.js`: `18` PASS, `exit 0`; başka cwd'den üretim kontrolü, runtime hash'i, 12 olumsuz kaynak örneği ve üç generated çıktı bozulması dahil.
- Test kendi geçici temiz dosya ağacında her çıktıya ayrı müdahale eder; `--check` her defasında `exit 1` döner ve bozuk dosyayı değiştirmez. Repo kaynaklarına mutation uygulanmaz.
- `python scripts/build_exlib.py --check`: `exit 0`, `324 + 8 = 332`, `0 new`, `332 review`.
- Komşu odak testleri: provenance `9`, semantic `12`, baseline `8`, balance `7`, import `38`, figür `17` PASS; final release runner içinde yeniden çalıştı.
- No-Coach release runner: `84` dosya, `2204` PASS, `0` başarısız; Coach-only `8` skip, mixed `18` ayrı kapsam. Tam mixed `npm test` yeşil iddiası yok.
- No-Coach browser E2E: `16/16` PASS; `360/412` viewport. Android copy/patch/sync: `28` Java, `44` kaynak resource, `758` web asset eşleşti.
- Yerel kanıt logları: `C:/Users/semih/AppData/Local/hermes/cache/scratch/gym-b3a-host.log`, `gym-b3a-e2e.log`.

## Açık kapılar

- Son snapshot için bağımsız denetim ve commit; yayın kapısı açık.
- B-3b yeni batch veri/kabul modeli; B-4 görsel kalite pilotu; 332 canonical inceleme.
- Güncelleme: Kullanıcı onayıyla 644 fotoğraf kaynak ve Android public paketinden kaldırıldı; bkz. `gym-legacy-media-removal.md`. Eski kanonik içerik incelemesi, CI/APK/fiziksel cihaz/hukuk kapıları açık.
- CI/push/yayın, APK/emülatör/fiziksel cihaz ve hukuk onayı bu yerel kanıtla kapanmaz.
