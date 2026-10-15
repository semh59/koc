#!/bin/bash
# Installs and launches the APK on an emulator and verifies from logcat that the plugins loaded and nothing failed.
# No fixed waits: every step polls its condition with a timeout. A failing step shows in the "=== STEP:" heading and the "(step: ...)" suffix.
STEP=start
step() { STEP="$*"; echo "=== STEP: $*"; }
die() { echo "$1 (step: $STEP)"; exit 1; }
# until_ok SECONDS command...: retries once a second until the command succeeds.
until_ok() { local t=$1 i; shift; for i in $(seq "$t"); do "$@" && return 0; sleep 1; done; return 1; }
focused() { adb shell dumpsys window | grep mCurrentFocus | grep -q com.neowell.app; }
unfocused() { ! focused; }
stopped() { [ -z "$(adb shell pidof com.neowell.app)" ]; }
booted() { adb logcat -d | grep -q "NW-DIAG"; }
launch() { adb shell monkey -p com.neowell.app -c android.intent.category.LAUNCHER 1; }
# Brings the app to the front and leaves a short margin for the screen to settle (for intents that must be handled before negative checks).
front() { launch; until_ok 30 focused || die "APP DID NOT COME TO FRONT"; sleep 2; }
# After a logcat clear, waits for the app to come up (the NW-DIAG console line).
boot_wait() { until_ok 90 booted || die "APP DID NOT START"; sleep 3; }

# A fresh install shows the intro and schedules nothing until it is finished (permission is asked after it): the smoke skips it like a user would, by tapping "Şimdilik geç" found in the UI tree.
skip_intro() {
  local b
  adb shell uiautomator dump /sdcard/nw_ui.xml >/dev/null 2>&1
  b=$(adb shell cat /sdcard/nw_ui.xml 2>/dev/null | tr '>' '
' | grep 'Şimdilik geç' | grep -oE 'bounds="\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]"' | head -1 | grep -oE '[0-9]+' | tr '
' ' ')
  [ -n "$b" ] || return 1
  set -- $b
  adb shell input tap $(( ($1 + $3) / 2 )) $(( ($2 + $4) / 2 ))
}
adb install -r neowell.apk || exit 1
# Crashes (Java FATAL EXCEPTION and native tombstones) land in the crash buffer; logcat -c clears it too, so it is checked before every clear and at the end.
crashcheck() { adb logcat -d -b crash > crash.log; if grep -qE "Process: com\.neowell\.app|>>> com\.neowell\.app <<<" crash.log; then echo "APP CRASHED"; cat crash.log; exit 1; fi; }
clr() { crashcheck; adb logcat -c; }
# On API 36 am kill does not always kill a background process; SIGKILL fallback, like a low-memory kill.
appkill() { adb shell am kill com.neowell.app; until_ok 5 stopped || { p=$(adb shell pidof com.neowell.app); [ -z "$p" ] || adb shell run-as com.neowell.app kill -9 $p; }; }
step "install and first launch"
adb shell pm grant com.neowell.app android.permission.POST_NOTIFICATIONS
clr
launch
# The API 36 emulator is slow: instead of a fixed delay, startup checks wait up to 2 minutes for the OCR result (the last to finish).
ocr_done() { adb logcat -d > full.log; grep -q "NW-OCR" full.log; }
until_ok 120 ocr_done
grep -E "Capacitor/Console|chromium" full.log > smoke.log
cat smoke.log
diag=$(grep "NW-DIAG" smoke.log | tail -1)
[ -n "$diag" ] || { echo "APP DID NOT START: no NW-DIAG line"; grep -iE "neowell|Capacitor|AndroidRuntime|WebView" full.log | tail -80; adb shell dumpsys activity activities | grep -E "mResumed|topResumed|mFocused" | head; exit 1; }
step "plugins, alarms, console"
until_ok 60 skip_intro || die "INTRO SKIP BUTTON NOT FOUND (uiautomator)"
for p in LocalNotifications Share Filesystem App KeyVault DeviceHelp BarcodeScanner StepCounter Ocr Motion Speech Widget BackupFolder MedWake; do
  echo "$diag" | grep -q "$p=object" || { echo "PLUGIN MISSING: $p"; exit 1; }
done
alarms_ok() { n=$(adb shell dumpsys alarm | grep -E "RTC_WAKEUP.*com.neowell.app" | wc -l); [ "$n" -ge 100 ]; }
until_ok 60 alarms_ok
echo "Scheduled wake-up alarms: $n"
[ "$n" -ge 100 ] || { echo "REMINDER ALARMS NOT SCHEDULED"; exit 1; }
grep -q "NW-PDF ok pages=1" smoke.log || { echo "PDF (canvas, pdf.js) FAILED"; grep "NW-PDF" smoke.log; exit 1; }
grep -q "NW-OCR ok" smoke.log || { echo "TEXT RECOGNITION (ML Kit) FAILED"; grep "NW-OCR" smoke.log; exit 1; }
grep -q "NW-VAULT ok" smoke.log || { echo "KEY VAULT FAILED"; exit 1; }
if grep -Ei "Refused to|Content Security Policy|Uncaught" smoke.log; then echo "CONSOLE ERROR"; exit 1; fi
step "widget receiver and data"
adb shell cmd package query-receivers -a android.appwidget.action.APPWIDGET_UPDATE | grep -q "NeoWidget" || { echo "WIDGET RECEIVER NOT REGISTERED"; exit 1; }
wv() { adb shell run-as com.neowell.app cat shared_prefs/nw_widget.xml > widget.xml 2>&1; grep -oE 'water(&quot;|")?:[0-9]+' widget.xml | grep -oE '[0-9]+$'; }
qx() { adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml 2>/dev/null; }
w0=$(wv)
[ -n "$w0" ] || { echo "WIDGET DATA NOT WRITTEN (Widget.update)"; cat widget.xml; exit 1; }
# MainActivity is exported: a button record is written only with the secret key (extra.tk) the app puts in the notification. The key is generated on the first notification setup.
TK=$(adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml 2>/dev/null | grep -oE 'name="tk">[0-9a-f]{32}' | grep -oE '[0-9a-f]{32}')
[ -n "$TK" ] || { echo "NOTIFICATION KEY NOT GENERATED (nw_quick.xml tk)"; exit 1; }
step "forged water intent (no key, wrong key)"
# Forged intent from another app: a water record with no key or a wrong key must not be written and widget water must not grow. Negative check: the app is brought to the front first so the intent gets handled.
adb shell "am start -n com.neowell.app/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER --es LocalNotificationUserAction water --ei LocalNotificationId 200 --es LocalNotficationObject '{\"extra\":{\"act\":\"water\",\"v\":250}}'"
until_ok 20 focused; sleep 2
adb shell "am start -n com.neowell.app/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER --es LocalNotificationUserAction water --ei LocalNotificationId 200 --es LocalNotficationObject '{\"extra\":{\"act\":\"water\",\"v\":250,\"tk\":\"00000000000000000000000000000000\"}}'"
until_ok 20 focused; sleep 2
adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml > quick0.xml 2>&1
if grep -q "250," quick0.xml || [ "$(wv)" != "$w0" ]; then echo "FORGED WATER RECORD WRITTEN (keyless intent)"; cat quick0.xml; exit 1; fi
step "notification +250 ml button"
# Simulates the notification's "+250 ml" button: the action arrives while the app is open, the record accumulates natively and is taken into the main data when the app comes to the front.
adb shell "am start -n com.neowell.app/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER --es LocalNotificationUserAction water --ei LocalNotificationId 200 --es LocalNotficationObject '{\"extra\":{\"act\":\"water\",\"v\":250,\"tk\":\"$TK\"}}'"
q250() { qx | grep -q "250,"; }
until_ok 20 q250
adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml > quick.xml 2>&1
cat quick.xml
grep -q "250," quick.xml || { echo "QUICK WATER RECORD NOT WRITTEN"; exit 1; }
w_is() { [ "$(wv)" = "$1" ]; }
until_ok 10 w_is "$((w0 + 250))"
w1=$(wv)
echo "Widget water: $w0 -> $w1"
[ "$w1" = "$((w0 + 250))" ] || { echo "WIDGET WATER DID NOT GROW"; cat widget.xml; exit 1; }
step "record taken into main data"
clr
launch
ingested1() { adb logcat -d | grep -E "Capacitor/Console" | grep -q "NW-QUICK ingested 1"; }
until_ok 60 ingested1
adb logcat -d | grep -E "Capacitor/Console" > quick.log
grep -q "NW-QUICK ingested 1" quick.log || { echo "QUICK WATER RECORD NOT TAKEN INTO MAIN DATA"; cat quick.log; exit 1; }
no250() { ! q250; }
until_ok 10 no250
adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml > quick2.xml 2>&1
if grep -q "250," quick2.xml; then echo "PENDING RECORD NOT CLEARED"; cat quick2.xml; exit 1; fi
# Day key check: the app wrote its own day and 250 ml to the widget; the second button must add to the same day. Starting from 0 the
# "new day" branch would also give 250 and a day mismatch would stay invisible.
w2=$(wv)
[ "$w2" = "$((w0 + 250))" ] || { echo "APP DID NOT WRITE WIDGET WATER: $w2"; cat widget.xml; exit 1; }
adb shell "am start -n com.neowell.app/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER --es LocalNotificationUserAction water --ei LocalNotificationId 200 --es LocalNotficationObject '{\"extra\":{\"act\":\"water\",\"v\":250,\"tk\":\"$TK\"}}'"
until_ok 20 w_is "$((w2 + 250))"
w3=$(wv)
echo "Widget water (app day): $w2 -> $w3"
[ "$w3" = "$((w2 + 250))" ] || { echo "WIDGET WATER NOT ADDED TO THE SAME DAY (day key mismatch)"; cat widget.xml; exit 1; }
# The water button sent the app to the background; an am start without bringing it to the front does not deliver extras.
front
step "medication Taken and Skip buttons"
# Simulates the medication notification's "Aldım" button: the native side accumulates the record under the key "m<id>_<time>" and consumes it when the app comes to the front.
adb shell "am start -n com.neowell.app/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER --es LocalNotificationUserAction med --ei LocalNotificationId 1001001 --es LocalNotficationObject '{\"extra\":{\"act\":\"med\",\"m\":1,\"s\":\"08:00\",\"tk\":\"$TK\"}}'"
qm1() { qx | grep -q "m1_0800,"; }
until_ok 20 qm1
adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml > quick3.xml 2>&1
cat quick3.xml
grep -q "m1_0800," quick3.xml || { echo "MEDICATION RECORD NOT WRITTEN"; exit 1; }
launch
nom1() { ! qm1; }
until_ok 40 nom1
adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml > quick4.xml 2>&1
if grep -q "m1_0800," quick4.xml; then echo "MEDICATION RECORD NOT CONSUMED"; cat quick4.xml; exit 1; fi
# "Atla" (skip) button: key k<id>_<time>. The alarm channel (nw_med) must exist with high importance and an alarm sound.
adb shell "am start -n com.neowell.app/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER --es LocalNotificationUserAction medskip --ei LocalNotificationId 2001001 --es LocalNotficationObject '{\"extra\":{\"act\":\"med\",\"m\":1,\"s\":\"20:00\",\"tk\":\"$TK\"}}'"
qk1() { qx | grep -q "k1_2000,"; }
until_ok 20 qk1
adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml > quick3b.xml 2>&1
grep -q "k1_2000," quick3b.xml || { echo "SKIP RECORD NOT WRITTEN"; cat quick3b.xml; exit 1; }
adb shell dumpsys notification --noredact | grep -A12 "nw_med" | head -20
adb shell dumpsys notification --noredact | grep -q "nw_med" || { echo "MEDICATION ALARM CHANNEL MISSING"; exit 1; }
launch
nok1() { ! qk1; }
until_ok 40 nok1
adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml > quick5.xml 2>&1
if grep -q "k1_2000," quick5.xml; then echo "SKIP RECORD NOT CONSUMED"; cat quick5.xml; exit 1; fi
step "redelivery after process death"
# Recreation after process death: when an app cold-started by the water button and sent to the background is killed and reopened,
# the system redelivers the first intent; the same water must not be written twice (1 record in total over both stages).
adb shell am force-stop com.neowell.app
until_ok 10 stopped
clr
adb shell "am start -n com.neowell.app/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER --es LocalNotificationUserAction water --ei LocalNotificationId 200 --es LocalNotficationObject '{\"extra\":{\"act\":\"water\",\"v\":250,\"tk\":\"$TK\"}}'"
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
[ -n "$p1" ] && [ "$p1" != "$p2" ] || { echo "PROCESS COULD NOT BE KILLED ($p1 -> $p2), redelivery test impossible"; exit 1; }
n=$(cat replay1.log replay2.log | grep -oE "NW-QUICK ingested [0-9]+" | grep -oE "[0-9]+$" | awk '{s+=$1} END{print s+0}')
echo "Redelivery test: water records taken $n"
[ "$n" = "1" ] || { echo "WATER RECORD REPEATED OR NOT TAKEN ($n)"; cat replay1.log replay2.log; exit 1; }
step "redelivery of the same notification"
# If the notification intent is redelivered (same scheduled notification, same extra.at) water must not be written twice; the app opens normally.
SU_AT="am start -n com.neowell.app/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER --es LocalNotificationUserAction water --ei LocalNotificationId 201 --es LocalNotficationObject '{\"extra\":{\"act\":\"water\",\"v\":250,\"at\":1790928000000,\"tk\":\"$TK\"}}'"
qn() { adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml 2>/dev/null | grep -oE '250,[0-9]+' | wc -l; }
qn_is() { [ "$(qn)" = "$1" ]; }
front
adb shell "$SU_AT"
until_ok 20 qn_is 1
[ "$(qn)" = "1" ] || { echo "SIGNED WATER RECORD NOT WRITTEN"; exit 1; }
front
until_ok 45 qn_is 0
[ "$(qn)" = "0" ] || { echo "WATER RECORD NOT TAKEN INTO THE APP"; exit 1; }
adb shell "$SU_AT"
sleep 3
[ "$(qn)" = "0" ] || { echo "REDELIVERED NOTIFICATION WROTE WATER A SECOND TIME"; exit 1; }
step "widget +water broadcast"
# Widget "+water": an exported=false broadcast receiver, no screen opens. The shell (uid 2000) must not reach it; the widget's PendingIntent is simulated as root.
wsu() { adb shell "am broadcast -n com.neowell.app/.WaterReceiver --es LocalNotificationUserAction water --es LocalNotficationObject '{\"extra\":{\"act\":\"water\",\"v\":250}}'"; }
ingested() { adb logcat -d | grep -E "Capacitor/Console" | grep -oE "NW-QUICK ingested [0-9]+" | grep -oE "[0-9]+$" | awk '{s+=$1} END{print s+0}'; }
ingested_is() { [ "$(ingested)" = "$1" ]; }
# A background process coming to the front does not reload the page (no NW-DIAG); on a cold start reaching the foreground is enough.
reopen() { clr; front; }
adb shell input keyevent KEYCODE_HOME
until_ok 10 unfocused
if [ "$(adb shell id -u | tr -d '\r')" != "0" ]; then
  wsu
  sleep 3
  [ "$(qn)" = "0" ] || { echo "WIDGET WATER RECEIVER CAN BE TRIGGERED FROM OUTSIDE (not exported=false)"; exit 1; }
fi
adb root
adb wait-for-device
sleep 3
# App running (in the background): the record and widget water appear at once, without the screen coming to the front.
w4=$(wv)
wsu
until_ok 15 qn_is 1
[ "$(qn)" = "1" ] || { echo "WIDGET WATER (APP RUNNING) NOT WRITTEN"; exit 1; }
until_ok 10 w_is "$((w4 + 250))"
w5=$(wv)
echo "Widget broadcast water: $w4 -> $w5"
[ "$w5" = "$((w4 + 250))" ] || { echo "WIDGET BROADCAST DID NOT RAISE WATER"; cat widget.xml; exit 1; }
adb shell dumpsys window | grep "mCurrentFocus" | grep -q "com.neowell.app" && { echo "WIDGET WATER OPENED THE SCREEN"; exit 1; }
reopen
until_ok 45 ingested_is 1
[ "$(ingested)" = "1" ] || { echo "WIDGET WATER (APP RUNNING) NOT TAKEN INTO MAIN DATA"; exit 1; }
# App closed (no process): the receiver starts the process itself. force-stop marks the package stopped and the broadcast never arrives, hence am kill.
adb shell input keyevent KEYCODE_HOME
until_ok 10 unfocused
appkill
stopped || die "PROCESS COULD NOT BE KILLED, closed-app test impossible"
wsu
until_ok 15 qn_is 1
[ "$(qn)" = "1" ] || { echo "WIDGET WATER (APP CLOSED) NOT WRITTEN qn=$(qn)"; adb shell run-as com.neowell.app cat shared_prefs/nw_quick.xml; adb shell pidof com.neowell.app; exit 1; }
reopen
until_ok 45 ingested_is 1
[ "$(ingested)" = "1" ] || { echo "WIDGET WATER (APP CLOSED) NOT TAKEN INTO MAIN DATA"; exit 1; }
# After the process is killed and reopened no water may be taken again.
adb shell input keyevent KEYCODE_HOME
until_ok 10 unfocused
appkill
until_ok 10 stopped
reopen
[ "$(ingested)" = "0" ] && [ "$(qn)" = "0" ] || { echo "WIDGET WATER REPEATED ON REOPEN"; exit 1; }
crashcheck
echo "Smoke test passed"
