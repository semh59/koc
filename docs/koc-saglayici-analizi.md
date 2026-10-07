# Koç sağlayıcı ve model seçimi: analiz (2026-10-06)

> **Tarihsel not (7 Ekim 2026):** "Bugünkü durum" 6 Ekim koduna aittir. Sonradan kurulum akışı yeniden yapıldı (Koçu bağla: anahtarı yapıştır, "Doğrula ve modelleri getir", "Test et ve kaydet"), varsayılan modeller güncellendi, OpenAI ve Anthropic Claude eklendi (6 hazır sağlayıcı). Güncel varsayılanlar `www/coach.js` `defProviders()` içindedir; aşağıdaki tablo ve "anahtar doğrulanmıyor" cümleleri artık geçerli değildir.

## 1. Bugünkü durum (koddan)

| Sağlayıcı | Adres (`/chat/completions` üstü) | Kimlik | Varsayılan model | Canlı mı? | health / confirm |
|---|---|---|---|---|---|
| NVIDIA Build | integrate.api.nvidia.com/v1 | Bearer `nvapi-…` | meta/llama-3.3-70b-instruct | **Hayır**, `/v1/models` listesinde yok | açık / hayır |
| Groq | api.groq.com/openai/v1 | Bearer | llama-3.3-70b-versatile | Evet (üretim modeli) | açık / hayır |
| OpenRouter | openrouter.ai/api/v1 | Bearer | meta-llama/llama-3.3-70b-instruct:free | **Hayır**, `:free` sürümü listeden kalkmış | açık / hayır |
| Google Gemini | generativelanguage.googleapis.com/v1beta/openai | Bearer | gemini-2.0-flash | **Hayır**, Google "kapatıldı" diyor | kapalı / evet (ücretsiz katmanda istemler eğitimde kullanılır) |

**Ana bulgu:** 4 hazır modelden 3'ü artık yok. Rehberi izleyip anahtarını kaydeden kullanıcı modeli hiç görmüyor, Koç da yalnız "şu an ulaşılamıyor" diyor. Model adları kodda sabit yazılı olduğu için bu yine bozulacak.

Akış iki yoldan gidiyor:
- **Rehber yolu:** Koç > "Koçu etkinleştir" > sağlayıcı listesi > 4 adımlık anahtar alma rehberi > anahtarı yapıştır > Kaydet. Anahtar doğrulanmıyor, model sorulmuyor, deneme isteği atılmıyor. (6 Ekim durumu) Kayıt sadece 8 karakterden uzun mu ve boşluk var mı diye bakıyor.
- **Ayarlar > Yapay zekâ koç > sağlayıcı:** Adres, Model, Anahtar ve iki onay kutusu tek ekranda. Model boş bir metin kutusu. "Modelleri getir" gizli bir datalist dolduruyor; kullanıcı kutuya dokunana kadar listeyi görmüyor. Listede konuşma dışı modeller de var: Groq'ta whisper, tts ve guard; NVIDIA'da embed, parse ve reward. OpenRouter'da 464 model var ve en çok 300'ü gösteriliyor. Öneri ya da fiyat bilgisi yok.

**Hata mesajları:** 401/403 için "Anahtar geçersiz görünüyor", 404 için "Model ya da adres bulunamadı", 429 için "Limit dolu". Bunların dışında çıplak kod çıkıyor: "Bağlanılamadı: HTTP 400" ya da "Model listesi alınamadı: HTTP 401". Gemini yanlış anahtara 401 değil **400** ("Please pass a valid API key") döndüğü için kullanıcı "HTTP 400" görüyor. Kota biten hesap (429 `insufficient_quota`) ile kısa süreli hız limiti aynı mesajı alıyor. OpenRouter kredisi bitince gelen 402 tanınmıyor. Sohbette her hata "Koç şu an ulaşılamıyor" oluyor.

**Saklama:** Anahtar telefonda Keystore kasasında şifreli duruyor, kasa yoksa düz metin. Şifresiz yedeğe girmiyor; parolalı yedekte şifreli duruyor. Yedek geri yüklenince adres, `confirm` ve onay ayarı değişemiyor.

Ekran görüntüleri (360x640, scratchpad'de): 03 rehberde model seçimi yok; 05 sağlayıcı sayfasında model boş metin kutusu; 07 yanlış model mesajı "Model ya da adres bulunamadı"; 08 ve 09 "HTTP 401/400".

## 2. Benzer uygulamalar ve uç nokta doğrulaması

- **Open WebUI:** URL ve anahtar girilir, "Verify Connection" `/models` uç noktasını çağırır. Listesi olmayan sağlayıcıda model kimliği elle eklenir (docs.openwebui.com).
- **TypingMind:** "Import OpenRouter", ardından "Check API Key", ardından listeden model seçimi. Elle kurulum ileri seçenek olarak duruyor.
- **Chatbox:** Her sağlayıcıda "Check" (anahtar doğrulama) ve "Fetch" (model listesi) ayrı düğmeler.
- **Ortak örüntü:** sağlayıcı seçilince adres kendiliğinden gelir, liste canlı çekilir, elle model kimliği yalnız ileri kullanıcıya açılır.

`/models` uç noktaları anahtarsız denendi, 2026-10-06:

| Sağlayıcı | Anahtarsız `/models` | Sonuç |
|---|---|---|
| Groq, OpenAI | 401 | Liste çekmek anahtarı da doğrular |
| Gemini | Yanlış anahtarla 400 | Liste çekmek anahtarı doğrular, ama hata gövdeden okunmalı |
| NVIDIA, OpenRouter | **200** | Liste herkese açık, anahtarı **doğrulamaz**; doğrulama ancak gerçek kısa bir istekle olur |
| Anthropic | Bearer ile 401 "invalid x-api-key" | `x-api-key` ve `anthropic-version` başlıkları gerekiyor; OpenAI uyumlu katmanı "üretim için değil" |

Sonuç: "Doğrula ve listele" tek çağrıyla ancak bazı sağlayıcılarda olur. Güvenilir doğrulama yalnız **Test et** (kısa bir sohbet isteği).

**Anahtar önekleri.** Belgeyle doğrulanan yalnız NVIDIA `nvapi-`. Diğerleri yaygın biçimler ama belgeyle doğrulanmadı: Groq `gsk_`, OpenRouter `sk-or-`, Google `AIza`, Anthropic `sk-ant-`, OpenAI `sk-proj-`/`sk-`. Bu yüzden tanıma bir **tahmin** olarak gösterilir ("Groq olarak tanındı · Değiştir"). `sk-ant-` ve `sk-or-`, genel `sk-` önekinden önce denetlenir.

**Düşünen (reasoning) modeller.** Gemini 3.x düşünmeyi kapatamıyor. OpenAI'ın güncel modelleri (gpt-6-luna gibi) düşünen modeller ve `max_tokens` bunlarda kullanılamıyor (`max_completion_tokens` gerekiyor). Bugünkü test isteği 8 jetonla gidiyor; düşünen modelde yanıt boş gelir ve test yanlışlıkla "çalışmıyor" der.

## 2b. Gerçek NVIDIA anahtarıyla canlı deneme (2026-10-06, koordinatör)

- `/models` yanlış anahtarla da 200 döner, 80 model listeler. Yanlış anahtar ancak sohbet isteğinde 403 "Authorization failed" ile anlaşılır.
- **Listede olmak çalışmak demek değil:**
  - google/gemma-4-31b-it 90-120 sn'de yanıt vermedi.
  - mistralai/mistral-large-2-instruct 404 "Function …: Not found for account" döndü.
  - meta/llama-3.3-70b-instruct listede yok; 410 end-of-life (2026-08-26).
  - Uydurma model düz metin "404 page not found" döndü.
- nvidia/nemotron-3-super-120b-a12b çalışıyor, ama düşünen model. Küçük sınırda `content: null` geliyor, `reasoning_content` dolu, `finish_reason: "length"`.

**Kök çözüm (genel, tüm sağlayıcılar):**
- "Doğrula" adımı adayları (tercih sırası, ücretsiz, aile) 15 sn sınırla gerçek kısa istekle sırayla dener. İlk yanıt veren "Önerilen (denendi)" olur.
- Anahtar, kota, ağ ya da hız limiti hatasında denemeler durur.
- 404, 410 ve "Function not found" "model bulunamadı ya da hesabında kullanılamıyor" sınıfına girer.
- Deneme başarısı HTTP 200 ve geçerli yanıt gövdesidir; metinsiz yanıt da sayılır.
- Sohbette metinsiz yanıt sınıra takılmışsa bir kez üç katı sınırla yeniden sorulur.

## 3. Önerilen akış (3 adım)

1. **Anahtarı yapıştır.** Önekten sağlayıcı tahmin edilir ("Groq olarak tanındı · Değiştir"). Tanınmazsa 4 büyük sağlayıcı düğmesi çıkar. Her düğmenin altında tek satır not ve "Anahtarı nereden alırım?" rehberi var.
2. **"Doğrula ve modelleri getir".** Uygulama `/models` uç noktasını çağırır, konuşma dışı modelleri ayıklar ve **Önerilen** modeli hazır seçer: sağlayıcıya göre sıralı tercih listesindeki ilk canlı model. Kodda sabit duran model yalnız son çare. Kullanıcı sadece onaylar. "Başka model" açılır listesi ve serbest kimlik kutusu ileri seçenek olarak kapalı durur. Önerinin yanında etiket var: "Önerilen: ücretsiz", "ücretsiz katman". OpenRouter fiyatı listeden okunur.
3. **"Test et ve kaydet".** Sabit bir cümleyle kısa gerçek istek gider; sağlık verisi gönderilmez. Başarılıysa model ve anahtar kaydedilir, sağlayıcı açılır. Hata Türkçe ve ayrık gösterilir: anahtar yanlış / kota ya da kredi bitti / hız limiti / model bulunamadı / internet yok / zaman aşımı. Ayrım durum koduna ve **hata gövdesine** göre yapılır.

**Çevrimdışı ilke ve gizlilik.**
- Uzak katalog ya da yeni bir sunucu yok. Ağ çağrısı yalnız kullanıcı düğmeye bastığında ve yalnız seçtiği sağlayıcıya gider.
- Giden tek şey anahtar ve sabit test cümlesi.
- 18 yaş altında kurulum ve ileri sayfadaki test/model düğmeleri ağ çağrısı yapmaz.
- Model listesi yalnız bellekte tutulur; kayda ve yedeğe girmez.
- `coachOn`, CONSENT_V, `confirm` ve health zinciri değişmez: sağlık verisi yine yalnız onaydan sonra gider.

**Maliyet.** Hazır 4 sağlayıcının hepsinde ücretsiz katman var. Ücretli hesapta bir Koç isteği yaklaşık 3-4 bin jeton girdi ve en çok 700 jeton çıktı. Örnek: gemini-3.5-flash-lite ile (0,30 / 2,50 $ / M jeton) istek başına yaklaşık 0,3 sent. Öneri sırası ücretsiz ve küçük modelleri öne alır.

**Sağlayıcılar.**
- **Kalsın:** Groq (hızlı, varsayılanı canlı), OpenRouter (ücretsiz `:free` modeller, fiyat listede), Gemini (ücretsiz katman; `confirm` onayı korunur), NVIDIA (ücretsiz deneme; listesi açık, doğrulama testle).
- **Ölü varsayılanlar güncellensin:**
  - NVIDIA: nvidia/nemotron-3-super-120b-a12b
  - OpenRouter: google/gemma-4-31b-it:free
  - Gemini: gemini-3.5-flash-lite

  Eski kayıtta model tam olarak eski varsayılansa yenisine geçilir; kullanıcının kendi seçtiği model korunur.
- **Eklendi (Semih kararı, 2026-10-06):** OpenAI ve Anthropic Claude. İkisi de ücretli; kurulumda "kullandıkça ücret çıkabilir; kotayı sağlayıcı sitende sen belirlersin" yazar. İkisi de kapalı gelir (`on`/`health` kapalı), kurulum açar. Onay metnindeki "Kime" satırı açık sağlayıcıları adıyla sayar.
  - **OpenAI:** api.openai.com/v1, `Authorization: Bearer`. Önerilen model gpt-6-luna (0,10 / 0,50 $ / M; Chat Completions destekli, düşünme çabası none-max). Güncel modeller `max_tokens` kabul etmez; `max_completion_tokens` (yanıt × 3) ve `reasoning_effort: "low"` gönderilir. `temperature` gönderilmez, çünkü belgede yok.
  - **Anthropic:** yerel Messages API kullanılır (`/v1/messages`), OpenAI uyumlu katman kullanılmaz ("üretim için değil"). Başlıklar: `x-api-key`, `anthropic-version: 2023-06-01`, `anthropic-dangerous-direct-browser-access: true`. Bu son başlık olmadan tarayıcı ön kontrolü 400 dönüyor, başlıkla 200 (2026-10-06'da curl ile denendi; telefonda CapacitorHttp CORS'u zaten atlar). Model listesi `/v1/models?limit=1000` aynı başlıklarla.
  - **Anthropic modeli:** Önerilen claude-haiku-4-5 (1 / 5 $; sıcaklık alır, düşünme kapalı). Liste Haiku içermezse claude-sonnet-5-5'e geçilir (2 / 10 $). Sonnet 5.x sıcaklık kabul etmez; ona `output_config.effort: "low"` ve 2000 jeton pay verilir. Haiku 4.5'in emekliliği "15 Ekim 2026'dan önce değil"; canlı liste bunu yakalar.
  - **Anahtar tanıma:** `sk-ant-` Anthropic'e, `sk-proj-`/`sk-` OpenAI'ye gider. Başka sağlayıcı seçiliyken bu anahtarlar gönderilmez.
- **Çıkarılacak yok.**
