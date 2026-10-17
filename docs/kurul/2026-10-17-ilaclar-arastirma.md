# İlaçlar: 9 karar için web araştırması (2026-10-17)

Not: Birincil kaynak yoksa "ikincil" ya da "kaynak yok" yazıldı. Hukuki görüş değildir.

## 1. "İlaç adı görünsün" anahtarı: formda kalsın, "Tüm ilaçlarda" (öneri doğrulandı)
- Kanıt: mediteo tek genel anahtar sunuyor (Ayarlar > Hatırlatıcılar > ilaç adını göster); ilaç başına değil. https://www.mediteo.com/en/faq/show-hide-name-of-my-medication/ (ikincil, rakip uygulama)
- Kanıt: Android VISIBILITY_PRIVATE kilit ekranında bildirim başlığını yine gösterir; ad başlıktaysa sızar. Ad başlıkta olmamalı ya da setPublicVersion verilmeli. https://developer.android.com/develop/ui/views/notifications/build-notification
- KVKK: ilaç adı sağlık verisidir (özel nitelikli, 6698 m.6); kilit ekranında varsayılan gizli olması veri minimizasyonuna uyar. https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/8ba209bb-fa93-4479-84f0-dd55aac97a0f.pdf
- Doz önermez ilkesi: bozulmuyor.

## 2. Çift doz penceresi: (b) yarı süre, en çok 6 saat (öneri doğrulandı, koşullu)
- Kanıt: NHS SPS "Unutulan doz için çift doz alınmaz; çoğu ilaçta 2 saate kadar geç almak kabul edilir; 1-2 kez/gün ilaçta sonraki doz birkaç saat içinde değilse alınır." https://www.sps.nhs.uk/articles/what-should-people-do-if-they-miss-a-dose-of-their-medicine/
- Yarı süre kuralı SPS'te yok; bu bir ürün sezgisidir ve "çift doz yok" ilkesiyle uyumludur. Sabit 1 saat, günde 1 kez ilaçta (24 saat aralık) tehlikeli çift kaydı kaçırır; sabit pencere ilaca göre yanlış kalır.
- Apple Health çift doz uyarısı vermiyor (Apple sayfasında yok); Medisafe için doğrulanabilir kaynak bulunamadı.
- Doz önermez: yalnız uyarı metni kaydı söylerse bozulmaz ("Bu doz 2 saat önce işaretlenmiş"); "alma" ya da "atla" denmemeli.

## 3. Yeni özellikler: yalnız "gerektiğinde alınan ilaç" (öneri doğrulandı), 1 saat pencere korunur
- Kanıt: NHS bölge PRN yönergeleri; ad, doz, en az doz aralığı ve 24 saatte en çok doz reçete eden tarafından belirlenir, her dozun saati kaydedilir, 24 saat kayan penceredir (gece yarısı değil). https://medicines.bedfordshirelutonandmiltonkeynes.icb.nhs.uk/wp-content/uploads/2022/03/BLMK-ICB-When-Required-PRN-Medication-Protocol-Dec-2023.pdf
- Kanıt: Apple "gerektiğinde" ilaçta hatırlatıcı yok, dokun-Kaydet. https://support.apple.com/en-gb/HT213351; Medisafe "gerektiğinde" ilaç askıya alınamaz, takvimi "gerektiğinde"ye çevirmek hatırlatmayı durdurur. https://help-center.medisafe.com/en/articles/8102964-how-do-i-stop-medisafe-from-sending-medication-reminders
- Boşluk: PRN'de planlı doz yok; Karar 2 (b) formülünün girdisi yok. Sabit 1 saat kalsın ya da kullanıcı kendi "en az aralığını" yazsın (kullanıcının planı, uygulama önermez).
- Doz önermez: uygulama aralık ya da doz önermediği sürece bozulmuyor.

## 4. "Kaçırıldı" yerine "İşaretlenmedi" (öneri doğrulandı)
- Kanıt: Apple da "işaretlemediyseniz" (haven't logged) dilini kullanıyor; seçenekler Skipped/Taken. https://support.apple.com/en-gb/HT213351
- Uygulama alınıp alınmadığını bilmez, yalnız kaydı bilir; "Kaçırıldı" bilinmeyen bir olguyu iddia eder ve suçlayıcı okunur. Yaşlı kullanıcıda yazım tutarlılığı ve sade dil önemli, ama sözcük seçimini doğrudan ölçen çalışma bulunamadı.
- Doz önermez: bozulmuyor (kayıt dili).

## 5. Ara verme bitince ilaç kendiliğinden açılmasın (öneri doğrulandı)
- Kanıt: Medisafe'te askıya alınan ilaç kullanıcı "Devam" deyince yeniden planlanır; "gerektiğinde" ilaç askıya alınamaz. https://help-center.medisafe.com/en/articles/8102964-how-do-i-stop-medisafe-from-sending-medication-reminders
- Otomatik açılma için kaynak yok; hekim kestiği ilacın onaysız geri gelmesi önlenmeli. Bitiş gününde sabah bildirimi ("o gün sana sorarım") makul orta yol. "Ara ver" kısayolu için kanıt bulunamadı, ertelenebilir.
- Doz önermez: bozulmuyor; karar kullanıcıda kalıyor.

## 6. Saatler önerilmesin: (a) (öneri doğrulandı)
- Dış kaynak bulunamadı; karar ilkeye dayalı. Medisafe/Apple saat önerisi davranışını doğrulayan birincil kaynak çıkmadı.
- (c) eşit aralık, uygulamanın saat önermesidir ve ilkeyi bozar. (b) son saatin kopyası arayüz ön dolgusudur, sınırda; yine de kullanıcı onaylamadan kayda girmemeli. (a) temiz.
- NHS SPS ilacın aralığını hekimin belirlediğini vurgular (yukarıdaki sayfa); hız, katlama/kısayolla sağlanabilir.
- Doz önermez: (a) bozmaz, (c) bozar, (b) sınırda.

## 7. İlaç bildirimleri 440'ı doldurunca diğerlerine pay: (b) (öneri doğrulandı)
- Kanıt: Android uygulama başına 500 alarm sınırı vardır ("Too many alarms (500)", SecurityException; dumpsys alarm max_alarms_per_uid=500). https://proandroiddev.com/debugging-alarms-with-adb-c8de7096b506 (ikincil), https://b4x.com/android/forum/threads/exception-java-lang-securityexception-too-many-alarms.72658 (ikincil). 440 bütçesi bu sınırdan geliyor.
- Android resmi alarm sayfasında sınır belgelenmemiş; sayı topluluk ve AOSP kaynaklıdır, cihaz üstünde doğrulanmalı. https://developer.android.com/develop/background-work/services/alarms
- Öncelik ilaçta kalır, 48 saatlik diğer hatırlatmalara küçük bir pay ayrılır; sessizce kurulmayan hatırlatma kullanıcıya görünmeli.
- Doz önermez: bozulmuyor.

## 8. Ad gizliyken aynı saatte birden çok ilaç: (c) "Adları göster" düğmesi (öneri doğrulandı)
- Kanıt: Android'in kendi örneği: kilitliyken "3 yeni mesaj" göster, gönderen ve içeriği gizle; ayrıntı kilit açılınca. https://developer.android.com/develop/ui/views/notifications/build-notification
- "1. ilaç, 2. ilaç" kör işaretlemeye yol açar ve yanlış ilaç işaretleme riski doğurur; hangi ilaç olduğu bilinmeden kayıt yazılması hatalı doz kaydı üretir.
- (c): varsayılan gizli, dokununca yalnız o ekranda açılır; kilit ekranı gizliliğini korur, okuma hatasını önler. Yaşlı uygulama araştırmaları (sade, doğrusal arayüz) bunu destekler. https://pmc.ncbi.nlm.nih.gov/articles/PMC5694345/ (ikincil)
- Doz önermez: bozulmuyor.

## 9. Kilit ekranı alarmı: (c) (öneri doğrulandı, maliyet notuyla)
- Kanıt: Android'de kilit ekranı üstünde etkinlik setShowWhenLocked ile açılır; kimlik gerektiren işlem için requestDismissKeyguard vardır. https://developer.android.com/reference/android/app/KeyguardManager
- Kilit ekranından tek dokunuşla kayıt ana işlev; (b) bunu bozar ve alarmı etkisiz kılar. (c): kayıt yazsın, ama uygulama kilidi açıkken ad kilit ekranına hiçbir ayarda çıkmasın.
- Maliyet: uygulama kilidi durumu şu an telefon tarafına gönderilmiyor (05-notifications.js:88); (c) için bu aktarım zorunlu, bedava değil.
- KVKK: kilit ekranında ad açığa çıkması üçüncü kişiye ifşa riskidir (sağlık verisi). https://www.kvkk.gov.tr/Icerik/5364/2018-143
- Doz önermez: bozulmuyor.
