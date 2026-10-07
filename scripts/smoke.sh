#!/bin/bash
# Emülatörde APK'yı kurar, açar ve logcat'ten eklentilerin yüklendiğini ve hata olmadığını doğrular.
# Sabit bekleme yok: her adım koşul sağlanana kadar (zaman aşımıyla) bekler. Düşen adım "=== ADIM:" başlığından ve "(adım: ...)" ekinden anlaşılır.
STEP=başlangıç
step() { STEP="$*"; echo "=== ADIM: $*"; }
die() { echo "$1 (adım: $STEP)"; exit 1; }
# until_ok SANİYE komut...: komut başarılı olana kadar saniyede bir dener.
until_ok() { local t=$1 i; shift; for i in $(seq "$t"); do "$@" && return 0; sleep 1; done; return 1; }
focused() { adb shell dumpsys window | grep mCurrentFocus | grep -q com.neowell.app; }
unfocused() { ! focused; }
stopped() { [ -z "$(adb shell pidof com.neowell.app)" ]; }
booted() { adb logcat -d | grep -q "NW-DIAG"; }
launch() { adb shell monkey -p com.neowell.app -c android.intent.category.LAUNCHER 1; }
# Öne getirir ve ekranın oturması için kısa pay bırakır (olumsuz denetimlerden önce işlenmesi gereken intent'ler için).
front() { launch; until_ok 30 focused || die "UYGULAMA ÖNE GELMEDİ"; sleep 2; }
# Logcat temizlenmiş açılışta uygulamanın (NW-DIAG konsol satırı) ayağa kalkmasını bekler.
boot_wait() { until_ok 90 booted || die "UYGULAMA AÇILMADI"; sleep 3; }

adb install -r neowell.apk || exit 1
# Çökme kaydı (Java FATAL EXCEPTION ve yerel tombstone) crash tamponuna düşer; logcat -c onu da sildiği için her temizlikten önce ve sonda bakılır.
crashcheck() { adb logcat -d -b crash > crash.log; if grep -qE "Process: com\.neowell\.app|>>> com\.neowell\.app <<<" crash.log; then echo "UYGULAMA ÇÖKTÜ"; cat crash.log; exit 1; fi; }
clr() { crashcheck; adb logcat -c; }
# API 36'da am kill arkadaki süreci her zaman öldürmüyor; düşük bellek ölümü gibi SIGKILL yedeği.
appkill() { adb shell am kill com.neowell.app; until_ok 5 stopped || { p=$(adb shell pidof com.neowell.app); [ -z "$p" ] || adb shell run-as com.neowell.app kill -9 $p; }; }
step "kurulum ve ilk açılış"
adb shell pm grant com.neowell.app android.permission.POST_NOTIFICATIONS
clr
launch
# API 36 emülatörü yavaş: açılış denetimleri sabit süre yerine yazı tanıma sonucu (en son biten) düşene kadar, en çok 2 dk beklenir.
ocr_done() { adb logcat -d > full.log; grep -q "NW-OCR" full.log; }
until_ok 120 ocr_done
grep -E "Capacitor/Console|chromium" full.log > smoke.log
cat smoke.log
diag=$(grep "NW-DIAG" smoke.log | tail -1)
[ -n "$diag" ] || { echo "UYGULAMA AÇILMADI: NW-DIAG satırı yok"; grep -iE "neowell|Capacitor|AndroidRuntime|WebView" full.log | tail -80; adb shell dumpsys activity activities | grep -E "mResumed|topResumed|mFocused" | head; exit 1; }
step "eklentiler, alarmlar, konsol"
for p in LocalNotifications Share Filesystem App KeyVault DeviceHelp BarcodeScanner StepCounter Ocr Motion Speech Widget BackupFolder MedWake; do
  echo "$diag" | grep -q "$p=object" || { echo "EKLENTİ YOK: $p"; exit 1; }
done
alarms_ok() { n=$(adb shell dumpsys alarm | grep -E "RTC_WAKEUP.*com.neowell.app" | wc -l); [ "$n" -ge 100 ]; }
until_ok 60 alarms_ok
echo "Kurulu uyandıran alarm sayısı: $n"
[ "$n" -ge 100 ] || { echo "HATIRLATMA ALARMLARI KURULMADI"; exit 1; }
grep -q "NW-PDF ok pages=1" smoke.log || { echo "PDF (tuval, pdf.js) ÇALIŞMADI"; grep "NW-PDF" smoke.log; exit 1; }
grep -q "NW-OCR ok" smoke.log || { echo "YAZI TANIMA (ML Kit) ÇALIŞMADI"; grep "NW-OCR" smoke.log; exit 1; }
grep -q "NW-VAULT ok" smoke.log || { echo "ANAHTAR KASASI ÇALIŞMADI"; exit 1; }
if grep -Ei "Refused to|Content Security Policy|Uncaught" smoke.log; then echo "KONSOL HATASI"; exit 1; fi
step "widget alıcısı ve veri"
adb shell cmd package query-receivers -a android.appwidget.action.APPWIDGET_UPDATE | grep -q "NeoWidget" || { echo "WIDGET ALICISI KAYITLI DEĞİL"; exit 1; }
wv() { adb shell run-as com.neowell.app cat shared_prefs/nw_widget.xml > widget.xml 2>&1; grep -oE 'water(&quot;|")?:[0-9]+' widget.xml | grep -oE '[0-9]+$'; }
qx() { adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml 2>/dev/null; }
w0=$(wv)
[ -n "$w0" ] || { echo "WIDGET VERİSİ YAZILMADI (Widget.update)"; cat widget.xml; exit 1; }
# MainActivity exported: düğme kaydı yalnız uygulamanın bildirime koyduğu gizli anahtarla (extra.tk) yazılır. Anahtar ilk bildirim kurulumunda üretilir.
TK=$(adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml 2>/dev/null | grep -oE 'name="tk">[0-9a-f]{32}' | grep -oE '[0-9a-f]{32}')
[ -n "$TK" ] || { echo "BİLDİRİM ANAHTARI ÜRETİLMEDİ (nw_quick.xml tk)"; exit 1; }
step "sahte su intent'i (anahtarsız, yanlış anahtarlı)"
# Başka uygulamanın sahte intent'i: anahtarsız ve yanlış anahtarlı su kaydı yazılmamalı, widget suyu artmamalı. Olumsuz denetim: işlenmesi için öne gelmesi beklenir.
adb shell "am start -n com.neowell.app/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER --es LocalNotificationUserAction su --ei LocalNotificationId 200 --es LocalNotficationObject '{\"extra\":{\"act\":\"su\",\"v\":250}}'"
until_ok 20 focused; sleep 2
adb shell "am start -n com.neowell.app/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER --es LocalNotificationUserAction su --ei LocalNotificationId 200 --es LocalNotficationObject '{\"extra\":{\"act\":\"su\",\"v\":250,\"tk\":\"00000000000000000000000000000000\"}}'"
until_ok 20 focused; sleep 2
adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml > quick0.xml 2>&1
if grep -q "250," quick0.xml || [ "$(wv)" != "$w0" ]; then echo "SAHTE SU KAYDI YAZILDI (anahtarsız intent)"; cat quick0.xml; exit 1; fi
step "bildirim +250 ml düğmesi"
# Bildirimdeki "+250 ml" düğmesi benzetimi: eylem uygulama açıkken gelir, kayıt yerelde birikir, uygulama öne gelince ana veriye alınır.
adb shell "am start -n com.neowell.app/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER --es LocalNotificationUserAction su --ei LocalNotificationId 200 --es LocalNotficationObject '{\"extra\":{\"act\":\"su\",\"v\":250,\"tk\":\"$TK\"}}'"
q250() { qx | grep -q "250,"; }
until_ok 20 q250
adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml > quick.xml 2>&1
cat quick.xml
grep -q "250," quick.xml || { echo "HIZLI SU KAYDI YAZILMADI"; exit 1; }
w_is() { [ "$(wv)" = "$1" ]; }
until_ok 10 w_is "$((w0 + 250))"
w1=$(wv)
echo "Widget su: $w0 -> $w1"
[ "$w1" = "$((w0 + 250))" ] || { echo "WIDGET SUYU ARTMADI"; cat widget.xml; exit 1; }
step "kaydın ana veriye alınması"
clr
launch
ingested1() { adb logcat -d | grep -E "Capacitor/Console" | grep -q "NW-QUICK ingested 1"; }
until_ok 60 ingested1
adb logcat -d | grep -E "Capacitor/Console" > quick.log
grep -q "NW-QUICK ingested 1" quick.log || { echo "HIZLI SU KAYDI ANA VERİYE ALINMADI"; cat quick.log; exit 1; }
no250() { ! q250; }
until_ok 10 no250
adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml > quick2.xml 2>&1
if grep -q "250," quick2.xml; then echo "BEKLEYEN KAYIT TEMİZLENMEDİ"; cat quick2.xml; exit 1; fi
# Gün anahtarı denetimi: uygulama widget'a kendi gününü ve 250 ml'yi yazdı; ikinci düğme aynı güne eklemeli. Başlangıç 0 olsaydı
# "yeni gün" dalı da 250 verirdi ve gün uyuşmazlığı görünmezdi.
w2=$(wv)
[ "$w2" = "$((w0 + 250))" ] || { echo "UYGULAMA WIDGET SUYUNU YAZMADI: $w2"; cat widget.xml; exit 1; }
adb shell "am start -n com.neowell.app/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER --es LocalNotificationUserAction su --ei LocalNotificationId 200 --es LocalNotficationObject '{\"extra\":{\"act\":\"su\",\"v\":250,\"tk\":\"$TK\"}}'"
until_ok 20 w_is "$((w2 + 250))"
w3=$(wv)
echo "Widget su (uygulama günü): $w2 -> $w3"
[ "$w3" = "$((w2 + 250))" ] || { echo "WIDGET SUYU AYNI GÜNE EKLENMEDİ (gün anahtarı uyuşmuyor)"; cat widget.xml; exit 1; }
# Su düğmesi uygulamayı arkaya aldı; öne getirilmeden gelen am start ek alanları teslim etmez.
front
step "ilaç Aldım ve Atla düğmeleri"
# İlaç bildirimindeki "Aldım" düğmesi benzetimi: yerel taraf kaydı "m<kimlik>_<saat>" anahtarıyla biriktirir, uygulama öne gelince tüketilir.
adb shell "am start -n com.neowell.app/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER --es LocalNotificationUserAction med --ei LocalNotificationId 1001001 --es LocalNotficationObject '{\"extra\":{\"act\":\"med\",\"m\":1,\"s\":\"08:00\",\"tk\":\"$TK\"}}'"
qm1() { qx | grep -q "m1_0800,"; }
until_ok 20 qm1
adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml > quick3.xml 2>&1
cat quick3.xml
grep -q "m1_0800," quick3.xml || { echo "İLAÇ KAYDI YAZILMADI"; exit 1; }
launch
nom1() { ! qm1; }
until_ok 40 nom1
adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml > quick4.xml 2>&1
if grep -q "m1_0800," quick4.xml; then echo "İLAÇ KAYDI TÜKETİLMEDİ"; cat quick4.xml; exit 1; fi
# "Atla" düğmesi: k<kimlik>_<saat> anahtarı. Alarm kanalı (nw_med) yüksek önemli ve alarm sesli olarak oluşmuş olmalı.
adb shell "am start -n com.neowell.app/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER --es LocalNotificationUserAction medskip --ei LocalNotificationId 2001001 --es LocalNotficationObject '{\"extra\":{\"act\":\"med\",\"m\":1,\"s\":\"20:00\",\"tk\":\"$TK\"}}'"
qk1() { qx | grep -q "k1_2000,"; }
until_ok 20 qk1
adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml > quick3b.xml 2>&1
grep -q "k1_2000," quick3b.xml || { echo "ATLA KAYDI YAZILMADI"; cat quick3b.xml; exit 1; }
adb shell dumpsys notification --noredact | grep -A12 "nw_med" | head -20
adb shell dumpsys notification --noredact | grep -q "nw_med" || { echo "İLAÇ ALARM KANALI YOK"; exit 1; }
launch
nok1() { ! qk1; }
until_ok 40 nok1
adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml > quick5.xml 2>&1
if grep -q "k1_2000," quick5.xml; then echo "ATLA KAYDI TÜKETİLMEDİ"; cat quick5.xml; exit 1; fi
step "süreç ölümü sonrası yeniden teslim"
# Süreç ölümü sonrası yeniden kurulum: su düğmesiyle soğuk açılıp arkaya alınan uygulama öldürülüp yeniden açılınca
# sistem ilk intent'i yeniden verir; aynı su ikinci kez yazılmamalı (iki aşamada toplam 1 kayıt).
adb shell am force-stop com.neowell.app
until_ok 10 stopped
clr
adb shell "am start -n com.neowell.app/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER --es LocalNotificationUserAction su --ei LocalNotificationId 200 --es LocalNotficationObject '{\"extra\":{\"act\":\"su\",\"v\":250,\"tk\":\"$TK\"}}'"
boot_wait
adb logcat -d | grep -E "Capacitor/Console" > replay1.log
p1=$(adb shell pidof com.neowell.app)
appkill
until_ok 10 stopped
clr
launch
boot_wait
adb logcat -d | grep -E "Capacitor/Console" > replay2.log
p2=$(adb shell pidof com.neowell.app)
[ -n "$p1" ] && [ "$p1" != "$p2" ] || { echo "SÜREÇ ÖLDÜRÜLEMEDİ ($p1 -> $p2), tekrar testi yapılamadı"; exit 1; }
n=$(cat replay1.log replay2.log | grep -oE "NW-QUICK ingested [0-9]+" | grep -oE "[0-9]+$" | awk '{s+=$1} END{print s+0}')
echo "Tekrar testi: alınan su kaydı $n"
[ "$n" = "1" ] || { echo "SU KAYDI TEKRARLANDI YA DA ALINMADI ($n)"; cat replay1.log replay2.log; exit 1; }
step "aynı bildirimin yeniden teslimi"
# Bildirim intent'i yeniden teslim edilirse (aynı planlanmış bildirim, aynı extra.at) su ikinci kez yazılmamalı; uygulama normal açılır.
SU_AT="am start -n com.neowell.app/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER --es LocalNotificationUserAction su --ei LocalNotificationId 201 --es LocalNotficationObject '{\"extra\":{\"act\":\"su\",\"v\":250,\"at\":1790928000000,\"tk\":\"$TK\"}}'"
qn() { adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml 2>/dev/null | grep -oE '250,[0-9]+' | wc -l; }
qn_is() { [ "$(qn)" = "$1" ]; }
front
adb shell "$SU_AT"
until_ok 20 qn_is 1
[ "$(qn)" = "1" ] || { echo "İMZALI SU KAYDI YAZILMADI"; exit 1; }
front
adb shell "$SU_AT"
sleep 3
[ "$(qn)" = "0" ] || { echo "YENİDEN TESLİM EDİLEN BİLDİRİM SUYU İKİNCİ KEZ YAZILDI"; exit 1; }
step "widget +su yayını"
# Widget "+su": exported=false yayın alıcısı, ekran açılmaz. Kabuk (uid 2000) ulaşamamalı; widget'ın PendingIntent'i root ile benzetilir.
wsu() { adb shell "am broadcast -n com.neowell.app/.WaterReceiver --es LocalNotificationUserAction su --es LocalNotficationObject '{\"extra\":{\"act\":\"su\",\"v\":250}}'"; }
ingested() { adb logcat -d | grep -E "Capacitor/Console" | grep -oE "NW-QUICK ingested [0-9]+" | grep -oE "[0-9]+$" | awk '{s+=$1} END{print s+0}'; }
ingested_is() { [ "$(ingested)" = "$1" ]; }
# Arka plandaki süreç öne gelince sayfa yeniden yüklenmez (NW-DIAG basılmaz); soğuk açılışta da ön plana gelmesi yeter.
reopen() { clr; front; }
adb shell input keyevent KEYCODE_HOME
until_ok 10 unfocused
if [ "$(adb shell id -u | tr -d '\r')" != "0" ]; then
  wsu
  sleep 3
  [ "$(qn)" = "0" ] || { echo "WIDGET SU ALICISI DIŞARIDAN TETİKLENEBİLİYOR (exported=false değil)"; exit 1; }
fi
adb root
adb wait-for-device
sleep 3
# Uygulama açık (arka planda): kayıt ve widget suyu hemen, ekran öne gelmeden.
w4=$(wv)
wsu
until_ok 15 qn_is 1
[ "$(qn)" = "1" ] || { echo "WIDGET SUYU (UYGULAMA AÇIK) YAZILMADI"; exit 1; }
until_ok 10 w_is "$((w4 + 250))"
w5=$(wv)
echo "Widget yayını su: $w4 -> $w5"
[ "$w5" = "$((w4 + 250))" ] || { echo "WIDGET YAYINI SUYU ARTIRMADI"; cat widget.xml; exit 1; }
adb shell dumpsys window | grep "mCurrentFocus" | grep -q "com.neowell.app" && { echo "WIDGET SUYU EKRANI AÇTI"; exit 1; }
reopen
until_ok 45 ingested_is 1
[ "$(ingested)" = "1" ] || { echo "WIDGET SUYU (UYGULAMA AÇIK) ANA VERİYE ALINMADI"; exit 1; }
# Uygulama kapalı (süreç yok): alıcı süreci kendisi başlatır. force-stop paketi durdurulmuş yapar ve yayın hiç gelmez, bu yüzden am kill.
adb shell input keyevent KEYCODE_HOME
until_ok 10 unfocused
appkill
stopped || die "SÜREÇ ÖLDÜRÜLEMEDİ, kapalı uygulama testi yapılamadı"
wsu
until_ok 15 qn_is 1
[ "$(qn)" = "1" ] || { echo "WIDGET SUYU (UYGULAMA KAPALI) YAZILMADI"; exit 1; }
reopen
until_ok 45 ingested_is 1
[ "$(ingested)" = "1" ] || { echo "WIDGET SUYU (UYGULAMA KAPALI) ANA VERİYE ALINMADI"; exit 1; }
# Süreç öldürülüp yeniden açılınca hiçbir su yeniden alınmamalı.
adb shell input keyevent KEYCODE_HOME
until_ok 10 unfocused
appkill
until_ok 10 stopped
reopen
[ "$(ingested)" = "0" ] && [ "$(qn)" = "0" ] || { echo "WIDGET SUYU YENİDEN AÇILIŞTA TEKRARLANDI"; exit 1; }
crashcheck
echo "Smoke testi geçti"
