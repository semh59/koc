#!/bin/bash
# Yayınlanan release APK'nın hafif denetimi (smoke.sh'tan sonra, aynı emülatörde): kurulur, açılır, çökmez, eklentiler çalışır.
# debuggable=false olduğu için run-as yok; paylaşılan tercihler adb root ile okunur.
P=com.neowell.app
STEP=başlangıç
step() { STEP="$*"; echo "=== ADIM: $*"; }
die() { echo "$1 (adım: $STEP)"; exit 1; }
until_ok() { local t=$1 i; shift; for i in $(seq "$t"); do "$@" && return 0; sleep 1; done; return 1; }
step "kurulum"
adb uninstall $P
adb install release/neowell.apk || die "RELEASE APK KURULAMADI"
adb shell dumpsys package $P | grep -E "pkgFlags|flags=" | grep -q DEBUGGABLE && die "RELEASE APK DEBUGGABLE"
adb shell pm grant $P android.permission.POST_NOTIFICATIONS
adb logcat -c -b all
step "açılış ve eklenti tanılaması"
# Release derlemede konsol logcata yazılmaz: MainActivity bu intent ekiyle her eklentinin yüklendiğini ve @PluginMethod yöntemlerinin
# R8/ProGuard'dan sağ çıktığını NW-DIAG etiketiyle yazar (patch-android.js, diag).
adb shell am start -n $P/.MainActivity --ez nw_diag true
diag_line() { diag=$(adb logcat -d -s NW-DIAG:I | grep "NW-DIAG" | tail -1); [ -n "$diag" ]; }
until_ok 60 diag_line || { adb logcat -d | grep -iE "neowell|AndroidRuntime|Capacitor" | tail -60; die "RELEASE: NW-DIAG YOK (eklenti tanılaması çalışmadı, uygulama açılmadı ya da tanılama yolu bozuk)"; }
echo "NW-DIAG: $diag"
adb logcat -d -b crash | grep -qE "Process: $P|>>> $P <<<" && { adb logcat -d -b crash; die "RELEASE UYGULAMA ÇÖKTÜ"; }
[ -n "$(adb shell pidof $P)" ] || die "RELEASE UYGULAMA AÇILMADI"
# Her eklentinin en az bir @PluginMethod'u görünmeli (=0: sınıf yüklenmedi ya da yöntemleri küçültmede silindi).
for p in LocalNotifications Share Filesystem App BarcodeScanner MedWake KeyVault DeviceHelp StepCounter Ocr QuickLog Motion Widget Speech BackupFolder; do
  echo "$diag" | grep -qE "(^|[ :])$p=[1-9]" || die "RELEASE: EKLENTİ YOK YA DA YÖNTEMLERİ SİLİNMİŞ: $p"
done
step "JS köprüsü yan etkileri"
# JS köprüsü ve yerel eklentiler şu yan etkilerle de doğrulanır: Widget.update tercih dosyası, LocalNotifications alarmları.
adb root >/dev/null; adb wait-for-device; sleep 2
widget_ok() { adb shell cat /data/data/$P/shared_prefs/nw_widget.xml | grep -qE 'water(&quot;|")?:[0-9]+'; }
until_ok 60 widget_ok || die "RELEASE: WIDGET VERİSİ YAZILMADI"
alarms_ok() { n=$(adb shell dumpsys alarm | grep -E "RTC_WAKEUP.*$P" | wc -l); [ "$n" -ge 100 ]; }
until_ok 90 alarms_ok
echo "Release alarm sayısı: $n"
[ "$n" -ge 100 ] || die "RELEASE: HATIRLATMA ALARMLARI KURULMADI"
echo "Release denetimi geçti"
