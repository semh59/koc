# Faz A — Çöp adam/figür altyapısı geliştirme planı

## Amaç

Egzersiz figürlerinin güvenli, tutarlı, erişilebilir ve yeni egzersizleri taşıyabilecek kalitede olması. Bu fazda egzersiz katalog sayısı artırılmaz.

## Durum

- A-1 SVG/ARIA attribute güvenliği: tamamlandı ve bağımsız `CLOSE` aldı.
- A-2 figür standardı: tamamlandı ve bağımsız `CLOSE` aldı.
- A-3 hareket şablonları: 9 ana aile ve tüm kütüphane bağlantıları testle doğrulandı; bağımsız `CLOSE` aldı.
- A-4–A-7: açık.


1. **SVG güvenliği:** label/ARIA attribute escape; özel egzersiz adıyla browser XSS regression.
2. **Figür standardı:** ön/yan görünüş, zemin, kadraj, oran, renk, animasyon ve `aria-label` sözleşmesi.
3. **Hareket şablonları:** squat, hinge, lunge, push, pull, carry, cardio, mobility ve balance aileleri.
4. **Motor dayanıklılığı:** IK sınırları, eklem yönleri, zemin teması, eksik template/bozuk pose fallback’i.
5. **Görsel kalite matrisi:** her hareket ailesinden temsilci figürleri phone-360/phone-412 browser kontrolü.
6. **Erişilebilirlik:** anlamlı ARIA label, dekoratif SVG davranışı, reduced-motion ve klavye/focus kontrolü.
7. **Native ayrımı:** figür ekranı browser/WebView’de doğrulanır; fiziksel Android sonucu ayrıca raporlanır.

## İş kuralı

Her madde: kırmızı test → en küçük düzeltme → focused/komşu testler → generated sync → bağımsız denetim. Faz B başlamadan Faz A bağımsız `CLOSE` alır.

## Açık riskler

Fiziksel Android WebView/OEM görsel renderer ve gerçek cihaz performansı bu makinede doğrulanamaz; browser kanıtı olarak raporlanır.
