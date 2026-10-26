# Faz 3 — event ve action ağı

## DOM event delegasyonu

Ana click delegasyonu `www/main/06-events.js:2` içinde document seviyesinde kayıtlıdır. Tek handler şu selector gruplarını yakalar:

```text
[data-tab], [data-act], [data-del], [data-go], [data-range], [data-rc],
[data-fv], [data-fva], [data-fvd], [data-tp], [data-tpd], [data-sp], [data-lo],
[data-kd], [data-g], [data-sex], [data-actl], [data-thm], [data-c], [data-food],
[data-fadd], [data-fp], [data-ml], [data-edit], [data-waterall]
```

Yönlendirme sırası:

```text
click
→ closest selector
→ data.tab / data.c / data.g / data.sex / ...
→ ilgili handler
→ state değişimi veya sheet/render
```

Bu yapı dinamik DOM elemanları için delegation sağlar. Ancak selector listesi merkezi bir iletişim sözleşmesi gibi çalıştığı için yeni `data-*` action eklemek `06-events.js` değişikliğini gerektirir.

## HTML'de görülen giriş noktaları

`www/index.html:19-23` tab düğmeleri:

```text
today, gym, trend, coach, more
```

`www/index.html:28` hızlı giriş actionları:

```text
water, food, weight, exercise
```

## Custom event ağı

Görülen yayın:

- `nw:boot`: `www/index.html:154`

Görülen dinleyiciler:

- `www/kernel/kernel.js:13` — privacy sıralama
- `www/kernel/share.js:52` — cache temizliği
- `www/main/01-core.js:290` — ana uygulama başlatma

Tarama sırasında uygulama özelinde başka `dispatchEvent` yayınına rastlanmadı. Bu sonuç statik grep kapsamındadır.

## Action registry

`Act` dispatcher `www/kernel/kernel.js:3-8` içinde exact ve prefix handler yapısını destekler. Mevcut `Act.on` kayıtları onboarding modülündedir:

| Action | Satır | Sonuç |
|---|---:|---|
| `obmods` | `www/modules/data/onboardui.js:137` | onboarding modül sheet'i |
| `obmodsno` | `www/modules/data/onboardui.js:139` | ayar kaydı + render |
| `obredo` | `www/modules/data/onboardui.js:148` | onboarding state reset |

## Action ile DOM data ayrımı

`data-act` HTML'de hızlı giriş için kullanılır; bu statik taramada `Act.on("...")` registry kayıtlarıyla isimsel olarak eşleşmiyor. Bu nedenle iki ayrı action mekanizması var:

1. DOM event delegation içindeki `data-*` davranışları
2. `Act` registry içindeki programatik onboarding actionları

Aynı adlandırma alanı kullanılmadığı için kavramsal ayrım net; ancak merkezi sözleşme bulunmadığında yeni geliştirici için keşif maliyeti yüksek.

## Riskler

- Document seviyesinde çok sayıda bağımsız event listener var; lifecycle cleanup görünmüyor.
- Selector listesi ile handler dalları arasında otomatik coverage yok.
- `data-*` payload'ları string gelir; `+d.edit`, `+d.range`, `+d.kd` gibi dönüşümler giriş doğrulama sınırı olarak ayrıca test edilmeli.
- `Act.run` dispatcher handler dönüşünü beklemiyor; async action sözleşmesi bulunmuyorsa hata görünürlüğü düşük olabilir.
