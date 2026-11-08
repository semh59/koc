# Marka Tutarlılığı ve Tema Uyumu İncelemesi (3D Manken)

Tarih: 2026-11-08 · Kapsam: `www/app.css` tokenları, `www/modules/gym/fig3d.js`, `www/modules/gym/exui.js`, `.ex3dbox` / `.ex3dctrls` modalı.

## 1. Özet

- 3D manken motoru (`fig3d.js`) **sabit hex renkler** kullanıyor; `app.css` tokenlarıyla eşleşmiyor. Palet slate/mavi/cyan tabanlı, marka rengi teal (`--prim`) ile çelişiyor.
- 3D sahne arka planı her temada `0x1a2332` (koyu) sabit; açık temada `.ex3dbox`'ın `var(--bg)` zemini eziliyor, modül "koyu ada" gibi görünüyor.
- Butonlar `.btn sm ghost` ile yazılıyor; `app.css`'te `.btn.sm` tanımlı değil (`.sm` ayrıca `display:block` veriyor). Görünüm şans eseri çalışıyor, tutarlı değil.
- Modal başlığı ve buton etiketleri İngilizce/emoji karışımı içeriyor ("🎮 3D Mannequin (Serbest Açı)"); tasarım dili Türkçe ve emoji yasak.
- `scripts/contrast.test.js` içindeki coach-* token beklentileri tanımsız; test 10 hata veriyor (marka/test borcu).

## 2. 3D paleti vs app.css tokenları

| fig3d elemanı | Mevcut hex | Önerilen token / hex (açık / koyu) |
|---|---|---|
| Sahne zemini | `0x1a2332` | şeffaf bırak; `.ex3dbox { background: var(--bg) }` görünsün |
| Zemin platformu | `0x1e293b` | `--soft` / `--card` |
| Gövde (torso) | `0x2d3a4f` | `--prim` (koyu temada `#4fc2a8`, açıkta `#0f5c55`) |
| Baş | `0x3a4759` | `--prim` tonu veya `--ink` |
| Cilt/uzuvlar | `0x3b4a5e` | `--mut` (açık `#56666d`, koyu `#92a4aa`) |
| Eklemler | `0x60a5fa` | `--prim` veya `--water` |
| Visör (emissive) | `0x60a5fa` / `0x1d4ed8` | `--water` / `--info` |
| Ayak | `0x1e293b` | `--mut` |
| Barbell | `0xd1d5db` | `--card` (metalik) |
| Disk | `0x1f2937` | `--ink` |
| Bench pad | `0x0f172a` | `--card` |
| Bench frame | `0x475569` | `--mut` |
| Ring | `0x2563eb` | `--prim` |
| Rim light | `0x38bdf8` | `--prim` veya `--water` |

2D figür (`FigLib`) zaten `--prim` (yakın gövde) ve `--mut` (uzak) kullanıyor; 3D motor bu dili izlemiyor. İki görünüm yan yana açıldığında (egzersiz sayfası) renk dili kırılıyor.

## 3. Dark / light tema

- `createViewer` içinde `scene.background = new THREE.Color(0x1a2332)` sabit. Renderer `alpha:true` olsa da arka plan opak boyanıyor.
- Sonuç: açık temada 3D kutu koyu bir blok; koyu temada ise `--bg #0c1416` ile yakın ama tam eşleşmiyor (`0x1a2332` daha açık/mavi).
- Öneri: tema algısına göre arka plan seç (`document.documentElement.dataset.theme` veya `prefers-color-scheme`); ya da `scene.background = null` yapıp CSS `--bg` zeminini kullan. Işık şiddeti de açık temada biraz düşürülmeli (mevcut 2.0 sun + 1.1 ambient koyu zemin için uygun).

## 4. Buton stilleri

- `exui.js` satır 98-104: `.btn sm ghost` (boşluklu sınıf). `app.css`'te `.btn.sm` yok; `.sm` 14 px / `display:block` veriyor. `.btn` daha sonra tanımlı olduğundan `display` eziliyor, ama font-size şans eseri `.sm`'den kalıyor.
- `.btn` tam genişlik (`width:100%`) ve `.ex3dctrls` flex satırında dört buton yan yana; dar ekranda taşma riski var.
- Öneri: açı butonları için `.chip` veya `.btn.ghost.wa` kullan; `.btn.sm` gibi tanımsız yardımcı sınıf yerine `.seg`/`.seg2` desenini uygula. Emoji (🎮) kaldır, etiket Türkçe: "3D model (serbest açı)".

## 5. Modal tasarım

- `.ex3dbox`: `height:300px` sabit. Tasarım dili "yükselebilen öğede min-height" diyor; 300 px küçük ekranda (320 px genişlik, 560 px yükseklik) fazla yer kaplıyor. Öneri: `aspect-ratio: 4/3` veya `min(300px, 45vh)`.
- `.ex3dctrls`: `flex-wrap` yok; dar ekranda butonlar sıkışıyor. Öneri: `flex-wrap:wrap`.
- Sheet başlığı (`<h3>... <span class="tag">3D</span></h3>`) uygun; alttaki "360° döndürebilir, yakınlaştırabilirsin." cümlesi tasarım diline uygun.

## 6. Tipografi

- 3D motoru canvas içi olduğundan app.css punto ölçeğine tabi değil; bu kabul edilebilir (canvas istisnası `Algo.PAGE.c` benzeri). Ancak etiketlerde (kontrol butonları) `.sm` ile 14 px kullanılıyor; ölçek dışı değil, tutarlı.
- Modal buton etiketleri İngilizce ("3D Mannequin", "Serbest Açı" karışımı). Tasarım dili: cümle düzeni, Türkçe terim. Öneri: "3D model", "Serbest açı".
- Emoji kullanımı (🎮) tasarım dilinde yasak (ruh hali ve bildirim başlıkları istisnası).

## 7. Diğer tutarlılık sorunları

- `scripts/contrast.test.js` içinde coach-* token'lar (`coach-ink`, `coach-bg`, `coach-card`, `coach-card-ink`, `coach-page-mut`, `coach-card-mut`, `coach-danger`) beklentisi var ama `app.css`'te tanımlı değil → 10 test hatası. Tasarım dili Coach'u ayrı "NEO//RAW" teması olarak tanımlıyor; ya tokenlar eklenmeli ya test beklentisi güncellenmeli (birini seç).
- `scripts/design.test.js` geçiyor (yazı ölçeği, yarıçap, gölge, hareket, koyu tema paritesi).
- 3D motorundaki sabit hex'ler `design.test.js`'in "canvas renkleri yalnız Algo.PAGE.c'de" kuralını ihlal ediyor (fig3d.js hariç tutulmuş mu kontrol edilmeli; şu an `kernel/algo.js` istisnası var, fig3d.js istisnada değil). Test geçiyor çünkü regex `#[0-9a-f]{6}\b` fig3d içinde `0x...` hex (CSS hex değil) formatında; ancak marka tutarlılığı açısından yine de tokenlaştırılmalı.

## 8. Önerilen eylem sırası

1. `fig3d.js` renklerini token karşılıklarıyla değiştir (tablodaki eşleşme); tema algısına göre arka plan seç.
2. `.ex3dbox` yüksekliğini `min(300px, 45vh)` / `aspect-ratio: 4/3` ile esnekleştir; `.ex3dctrls`'e `flex-wrap:wrap`.
3. `exui.js` buton sınıflarını `.btn.ghost.wa` veya `.chip` ile değiştir; emoji ve İngilizce etiketleri Türkçeleştir.
4. Coach tema kararını ver: ya coach-* token'larını `app.css`'e ekle, ya `contrast.test.js`'ten coach çiftlerini kaldır.
5. Değişiklik sonrası `node scripts/contrast.test.js` ve `node scripts/design.test.js` çalıştır; 0 hata beklenir.

## 9. Değiştirilen dosyalar

Bu inceleme rapordur; kod değişikliği yapılmamıştır. Rapor: `docs/brand-consistency-3d-review.md`.
