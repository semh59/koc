#!/bin/bash
# Yayınlanan release APK'nın hafif denetimi (smoke.sh'tan sonra, aynı emülatörde): kurulur, açılır, çökmez, eklentiler çalışır.
# debuggable=false olduğu için run-as yok; paylaşılan tercihler adb root ile okunur.
P=com.neowell.app
adb uninstall $P
adb install release/neowell.apk || { echo "RELEASE APK KURULAMADI"; exit 1; }
adb shell dumpsys package $P | grep -E "pkgFlags|flags=" | grep -q DEBUGGABLE && { echo "RELEASE APK DEBUGGABLE"; exit 1; }
adb shell pm grant $P android.permission.POST_NOTIFICATIONS
adb logcat -c -b all
adb shell monkey -p $P -c android.intent.category.LAUNCHER 1
sleep 25
adb logcat -d -b crash | grep -qE "Process: $P|>>> $P <<<" && { echo "RELEASE UYGULAMA ÇÖKTÜ"; adb logcat -d -b crash; exit 1; }
[ -n "$(adb shell pidof $P)" ] || { echo "RELEASE UYGULAMA AÇILMADI"; exit 1; }
diag=$(adb logcat -d | grep "NW-DIAG" | tail -1)
echo "NW-DIAG: ${diag:-yok (release derlemede konsol logcata yazılmıyor olabilir)}"
if [ -n "$diag" ]; then
  for p in LocalNotifications KeyVault Widget BackupFolder; do echo "$diag" | grep -q "$p=object" || { echo "EKLENTİ YOK: $p"; exit 1; }; done
fi
# NW-DIAG görünmese de JS köprüsü ve yerel eklentiler şu yan etkilerle doğrulanır: Widget.update tercih dosyası, LocalNotifications alarmları.
adb root >/dev/null; adb wait-for-device; sleep 2
adb shell cat /data/data/$P/shared_prefs/nw_widget.xml | grep -qE 'water(&quot;|")?:[0-9]+' || { echo "RELEASE: WIDGET VERİSİ YAZILMADI"; exit 1; }
n=$(adb shell dumpsys alarm | grep -E "RTC_WAKEUP.*$P" | wc -l)
echo "Release alarm sayısı: $n"
[ "$n" -ge 100 ] || { echo "RELEASE: HATIRLATMA ALARMLARI KURULMADI"; exit 1; }
echo "Release denetimi geçti"
