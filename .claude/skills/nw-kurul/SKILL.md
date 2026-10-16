---
name: nw-kurul
description: NeoWell uzman kurulunu bir sayfa için çalıştırır. Kullanıcı "kurulu çalıştır", "şu sayfayı kurula göster" veya "tüm ajanlarla kontrol et" dediğinde yükle. docs/uzman-kurulu.md akışını uygular.
---

1. `docs/uzman-kurulu.md` matrisini oku; istenen sayfa için ● uzmanları, 7 rol ajanını ve en az 4 `nw-kisi-*` profilini seç.
2. Hepsini paralel başlat (her biri için `.claude/agents/<ad>.md` dosyasını okuyup o rolü üstlenmesini söyle; sayfanın giriş noktasını ve `docs/ui-denetim-2026-10.md`yi ver, tekrar etmemelerini iste).
3. Tüm bulguları `nw-hakem`e ver. Hakem bitmeden kullanıcıya bulgu sunma.
4. Hakem çıktısını `docs/kurul/<tarih>-<sayfa>.md`ye yaz; kullanıcıya en fazla 10 satır özet ve KARAR-GEREKİR sorularını ver.
5. Onaydan sonra düzelt: her bulgu bir test, testler yeşil, ayrı commit. Kasıtlı testle çakışan öneriyi uygulama, kullanıcıya sor.
