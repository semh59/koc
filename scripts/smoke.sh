#!/bin/bash
# Emülatörde APK'yı kurar, açar ve logcat'ten eklentilerin yüklendiğini ve hata olmadığını doğrular.
adb install -r neowell.apk || exit 1
adb shell pm grant com.neowell.app android.permission.POST_NOTIFICATIONS
adb logcat -c
adb shell monkey -p com.neowell.app -c android.intent.category.LAUNCHER 1
sleep 25
adb logcat -d > full.log
grep -E "Capacitor/Console|chromium" full.log > smoke.log
cat smoke.log
diag=$(grep "NW-DIAG" smoke.log | tail -1)
[ -n "$diag" ] || { echo "UYGULAMA AÇILMADI: NW-DIAG satırı yok"; exit 1; }
for p in LocalNotifications Share Filesystem App; do
  echo "$diag" | grep -q "$p=object" || { echo "EKLENTİ YOK: $p"; exit 1; }
done
n=$(adb shell dumpsys alarm | grep -E "RTC_WAKEUP.*com.neowell.app" | wc -l)
echo "Kurulu uyandıran alarm sayısı: $n"
[ "$n" -ge 100 ] || { echo "HATIRLATMA ALARMLARI KURULMADI"; exit 1; }
grep -q "NW-VAULT ok" smoke.log || { echo "ANAHTAR KASASI ÇALIŞMADI"; exit 1; }
if grep -Ei "Refused to|Content Security Policy|Uncaught" smoke.log; then echo "KONSOL HATASI"; exit 1; fi
echo "Smoke testi geçti"
