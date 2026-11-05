# Egzersiz Modülü — geliştirme backlog'u

Bu dosya AR-GE incelemesinden ayrıdır. İnceleme commit’inde üretim kodu değiştirilmez; geliştirme maddeleri ayrı iş olarak ele alınır. Ayrıntılı yol haritaları: `gym-phase-a-plan.md` ve `gym-phase-b-plan.md`. Faz B, Faz A kapanmadan başlamaz.

## P0 — güvenlik ve veri bütünlüğü

- [x] **GYM-SEC-001:** `FigLib.svg` label/ARIA attribute sink’ini güvenli serialize et. Gerçek browser payload testi: tehlikeli DOM `0`, execution marker `null`. Bağımsız kapanış: `CLOSE`.
- [ ] **GYM-INT-001:** `gFinishSave` işlemini atomic yap. Save/quota failure sonrası memory ve persisted state aynı kalmalı; başarı summary yalnız kalıcı yazma onayından sonra açılmalı.

## P1 — doğruluk ve kullanıcı akışı

- [ ] **GYM-IMP-001:** Import timestamp saniyesini `0..59` doğrula; `60`, `99`, leap-day, timezone/day-boundary corpus ekle.
- [ ] **GYM-UX-001:** Keyboard `body.kb` sözleşmesini CSS ve geometry E2E ile tamamla veya kullanılmayan JS contract’ını kaldır.
- [ ] **GYM-UX-002:** `gNext`, rest ve finish akışında warm-up setlerini actionable set olmaktan çıkar; normal/drop/failure/timed set davranışını koru.

## P2 — ürün politikası, ölçek ve native doğrulama

- [ ] CSV export’ta her workout satırının header ile aynı kolon sayısını koruduğunu strict parser ile doğrula.
- [ ] Spor privacy deletion kapsamını netleştir: `workouts`, `exercise` logları, `customEx`, `templates`, `exCfg` için beklenen silme politikasını yaz ve test et.
- [ ] Geçerli ama büyük workout/set/template yapıları için CPU/render sınırı ve düşük bellekli cihaz ölçümü ekle.
- [ ] Android notification/lock-screen, process restart, Doze, Android 13+ permission, exact alarm ve keep-awake test kontratı oluştur.
- [ ] IndexedDB shard restart, failed transaction, import/undo/delete reconstruction testleri ekle.

## İş kuralı

Her geliştirme maddesi ayrı branch/commit, kırmızı test → minimal düzeltme → focused/neighbor/full kapılar → bağımsız denetim sırasıyla yürütülecek. AR-GE raporu ile geliştirme diff’i aynı işte karıştırılmayacak.
