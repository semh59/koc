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
for p in LocalNotifications Share Filesystem App KeyVault DeviceHelp BarcodeScanner StepCounter Ocr Motion Widget BackupFolder; do
  echo "$diag" | grep -q "$p=object" || { echo "EKLENTİ YOK: $p"; exit 1; }
done
n=$(adb shell dumpsys alarm | grep -E "RTC_WAKEUP.*com.neowell.app" | wc -l)
echo "Kurulu uyandıran alarm sayısı: $n"
[ "$n" -ge 100 ] || { echo "HATIRLATMA ALARMLARI KURULMADI"; exit 1; }
grep -q "NW-PDF ok pages=1" smoke.log || { echo "PDF (tuval, pdf.js) ÇALIŞMADI"; grep "NW-PDF" smoke.log; exit 1; }
grep -q "NW-OCR ok" smoke.log || { echo "YAZI TANIMA (ML Kit) ÇALIŞMADI"; grep "NW-OCR" smoke.log; exit 1; }
grep -q "NW-VAULT ok" smoke.log || { echo "ANAHTAR KASASI ÇALIŞMADI"; exit 1; }
if grep -Ei "Refused to|Content Security Policy|Uncaught" smoke.log; then echo "KONSOL HATASI"; exit 1; fi
adb shell cmd package query-receivers -a android.appwidget.action.APPWIDGET_UPDATE | grep -q "NeoWidget" || { echo "WIDGET ALICISI KAYITLI DEĞİL"; exit 1; }
wv() { adb shell run-as com.neowell.app cat shared_prefs/nw_widget.xml > widget.xml 2>&1; grep -oE 'water(&quot;|")?:[0-9]+' widget.xml | grep -oE '[0-9]+$'; }
w0=$(wv)
[ -n "$w0" ] || { echo "WIDGET VERİSİ YAZILMADI (Widget.update)"; cat widget.xml; exit 1; }
# Bildirimdeki "+250 ml" düğmesi benzetimi: eylem uygulama açıkken gelir, kayıt yerelde birikir, uygulama öne gelince ana veriye alınır.
adb shell "am start -n com.neowell.app/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER --es LocalNotificationUserAction su --ei LocalNotificationId 200 --es LocalNotficationObject '{\"extra\":{\"act\":\"su\",\"v\":250}}'"
sleep 4
adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml > quick.xml 2>&1
cat quick.xml
grep -q "250," quick.xml || { echo "HIZLI SU KAYDI YAZILMADI"; exit 1; }
w1=$(wv)
echo "Widget su: $w0 -> $w1"
[ "$w1" = "$((w0 + 250))" ] || { echo "WIDGET SUYU ARTMADI"; cat widget.xml; exit 1; }
adb logcat -c
adb shell monkey -p com.neowell.app -c android.intent.category.LAUNCHER 1
sleep 10
adb logcat -d | grep -E "Capacitor/Console" > quick.log
grep -q "NW-QUICK ingested 1" quick.log || { echo "HIZLI SU KAYDI ANA VERİYE ALINMADI"; cat quick.log; exit 1; }
adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml > quick2.xml 2>&1
if grep -q "250," quick2.xml; then echo "BEKLEYEN KAYIT TEMİZLENMEDİ"; cat quick2.xml; exit 1; fi
# Gün anahtarı denetimi: uygulama widget'a kendi gününü ve 250 ml'yi yazdı; ikinci düğme aynı güne eklemeli. Başlangıç 0 olsaydı
# "yeni gün" dalı da 250 verirdi ve gün uyuşmazlığı görünmezdi.
w2=$(wv)
[ "$w2" = "$((w0 + 250))" ] || { echo "UYGULAMA WIDGET SUYUNU YAZMADI: $w2"; cat widget.xml; exit 1; }
adb shell "am start -n com.neowell.app/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER --es LocalNotificationUserAction su --ei LocalNotificationId 200 --es LocalNotficationObject '{\"extra\":{\"act\":\"su\",\"v\":250}}'"
sleep 4
w3=$(wv)
echo "Widget su (uygulama günü): $w2 -> $w3"
[ "$w3" = "$((w2 + 250))" ] || { echo "WIDGET SUYU AYNI GÜNE EKLENMEDİ (gün anahtarı uyuşmuyor)"; cat widget.xml; exit 1; }
# Su düğmesi uygulamayı arkaya aldı; öne getirilmeden gelen am start ek alanları teslim etmez.
adb shell monkey -p com.neowell.app -c android.intent.category.LAUNCHER 1
sleep 10
# İlaç bildirimindeki "Aldım" düğmesi benzetimi: yerel taraf kaydı "m<kimlik>_<saat>" anahtarıyla biriktirir, uygulama öne gelince tüketilir.
adb shell "am start -n com.neowell.app/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER --es LocalNotificationUserAction med --ei LocalNotificationId 1001001 --es LocalNotficationObject '{\"extra\":{\"act\":\"med\",\"m\":1,\"s\":\"08:00\"}}'"
sleep 4
adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml > quick3.xml 2>&1
cat quick3.xml
grep -q "m1_0800," quick3.xml || { echo "İLAÇ KAYDI YAZILMADI"; exit 1; }
adb shell monkey -p com.neowell.app -c android.intent.category.LAUNCHER 1
sleep 10
adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml > quick4.xml 2>&1
if grep -q "m1_0800," quick4.xml; then echo "İLAÇ KAYDI TÜKETİLMEDİ"; cat quick4.xml; exit 1; fi
# "Atla" düğmesi: k<kimlik>_<saat> anahtarı. Alarm kanalı (nw_med) yüksek önemli ve alarm sesli olarak oluşmuş olmalı.
adb shell "am start -n com.neowell.app/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER --es LocalNotificationUserAction medskip --ei LocalNotificationId 2001001 --es LocalNotficationObject '{\"extra\":{\"act\":\"med\",\"m\":1,\"s\":\"20:00\"}}'"
sleep 4
adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml > quick3b.xml 2>&1
grep -q "k1_2000," quick3b.xml || { echo "ATLA KAYDI YAZILMADI"; cat quick3b.xml; exit 1; }
adb shell dumpsys notification --noredact | grep -A12 "nw_med" | head -20
adb shell dumpsys notification --noredact | grep -q "nw_med" || { echo "İLAÇ ALARM KANALI YOK"; exit 1; }
adb shell monkey -p com.neowell.app -c android.intent.category.LAUNCHER 1
sleep 10
adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml > quick5.xml 2>&1
if grep -q "k1_2000," quick5.xml; then echo "ATLA KAYDI TÜKETİLMEDİ"; cat quick5.xml; exit 1; fi
# Süreç ölümü sonrası yeniden kurulum: su düğmesiyle soğuk açılıp arkaya alınan uygulama öldürülüp yeniden açılınca
# sistem ilk intent'i yeniden verir; aynı su ikinci kez yazılmamalı (iki aşamada toplam 1 kayıt).
adb shell am force-stop com.neowell.app
sleep 2
adb logcat -c
adb shell "am start -n com.neowell.app/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER --es LocalNotificationUserAction su --ei LocalNotificationId 200 --es LocalNotficationObject '{\"extra\":{\"act\":\"su\",\"v\":250}}'"
sleep 15
adb logcat -d | grep -E "Capacitor/Console" > replay1.log
p1=$(adb shell pidof com.neowell.app)
adb shell am kill com.neowell.app
sleep 3
adb logcat -c
adb shell monkey -p com.neowell.app -c android.intent.category.LAUNCHER 1
sleep 12
adb logcat -d | grep -E "Capacitor/Console" > replay2.log
p2=$(adb shell pidof com.neowell.app)
[ -n "$p1" ] && [ "$p1" != "$p2" ] || { echo "SÜREÇ ÖLDÜRÜLEMEDİ (am kill: $p1 -> $p2), tekrar testi yapılamadı"; exit 1; }
n=$(cat replay1.log replay2.log | grep -oE "NW-QUICK ingested [0-9]+" | grep -oE "[0-9]+$" | awk '{s+=$1} END{print s+0}')
echo "Tekrar testi: alınan su kaydı $n"
[ "$n" = "1" ] || { echo "SU KAYDI TEKRARLANDI YA DA ALINMADI ($n)"; cat replay1.log replay2.log; exit 1; }
# Bildirim intent'i yeniden teslim edilirse (aynı planlanmış bildirim, aynı extra.at) su ikinci kez yazılmamalı; uygulama normal açılır.
SU_AT="am start -n com.neowell.app/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER --es LocalNotificationUserAction su --ei LocalNotificationId 201 --es LocalNotficationObject '{\"extra\":{\"act\":\"su\",\"v\":250,\"at\":1790928000000}}'"
qn() { adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml 2>/dev/null | grep -oE '250,[0-9]+' | wc -l; }
adb shell monkey -p com.neowell.app -c android.intent.category.LAUNCHER 1
sleep 8
adb shell "$SU_AT"
sleep 4
[ "$(qn)" = "1" ] || { echo "İMZALI SU KAYDI YAZILMADI"; exit 1; }
adb shell monkey -p com.neowell.app -c android.intent.category.LAUNCHER 1
sleep 10
adb shell "$SU_AT"
sleep 4
[ "$(qn)" = "0" ] || { echo "YENİDEN TESLİM EDİLEN BİLDİRİM SUYU İKİNCİ KEZ YAZILDI"; exit 1; }
# Widget "+su": exported=false yayın alıcısı, ekran açılmaz. Kabuk (uid 2000) ulaşamamalı; widget'ın PendingIntent'i root ile benzetilir.
wsu() { adb shell "am broadcast -n com.neowell.app/.WaterReceiver --es LocalNotificationUserAction su --es LocalNotficationObject '{\"extra\":{\"act\":\"su\",\"v\":250}}'"; sleep 3; }
ingested() { adb logcat -d | grep -E "Capacitor/Console" | grep -oE "NW-QUICK ingested [0-9]+" | grep -oE "[0-9]+$" | awk '{s+=$1} END{print s+0}'; }
reopen() { adb logcat -c; adb shell monkey -p com.neowell.app -c android.intent.category.LAUNCHER 1; sleep 12; }
adb shell input keyevent KEYCODE_HOME
sleep 2
if [ "$(adb shell id -u | tr -d '\r')" != "0" ]; then
  wsu
  [ "$(qn)" = "0" ] || { echo "WIDGET SU ALICISI DIŞARIDAN TETİKLENEBİLİYOR (exported=false değil)"; exit 1; }
fi
adb root
adb wait-for-device
sleep 3
# Uygulama açık (arka planda): kayıt ve widget suyu hemen, ekran öne gelmeden.
w4=$(wv)
wsu
[ "$(qn)" = "1" ] || { echo "WIDGET SUYU (UYGULAMA AÇIK) YAZILMADI"; exit 1; }
w5=$(wv)
echo "Widget yayını su: $w4 -> $w5"
[ "$w5" = "$((w4 + 250))" ] || { echo "WIDGET YAYINI SUYU ARTIRMADI"; cat widget.xml; exit 1; }
adb shell dumpsys window | grep "mCurrentFocus" | grep -q "com.neowell.app" && { echo "WIDGET SUYU EKRANI AÇTI"; exit 1; }
reopen
[ "$(ingested)" = "1" ] || { echo "WIDGET SUYU (UYGULAMA AÇIK) ANA VERİYE ALINMADI"; exit 1; }
# Uygulama kapalı (süreç yok): alıcı süreci kendisi başlatır. force-stop paketi durdurulmuş yapar ve yayın hiç gelmez, bu yüzden am kill.
adb shell input keyevent KEYCODE_HOME
sleep 2
adb shell am kill com.neowell.app
sleep 2
[ -z "$(adb shell pidof com.neowell.app)" ] || { echo "SÜREÇ ÖLDÜRÜLEMEDİ, kapalı uygulama testi yapılamadı"; exit 1; }
wsu
[ "$(qn)" = "1" ] || { echo "WIDGET SUYU (UYGULAMA KAPALI) YAZILMADI"; exit 1; }
reopen
[ "$(ingested)" = "1" ] || { echo "WIDGET SUYU (UYGULAMA KAPALI) ANA VERİYE ALINMADI"; exit 1; }
# Süreç öldürülüp yeniden açılınca hiçbir su yeniden alınmamalı.
adb shell input keyevent KEYCODE_HOME
sleep 2
adb shell am kill com.neowell.app
sleep 2
reopen
[ "$(ingested)" = "0" ] && [ "$(qn)" = "0" ] || { echo "WIDGET SUYU YENİDEN AÇILIŞTA TEKRARLANDI"; exit 1; }
echo "Smoke testi geçti"
