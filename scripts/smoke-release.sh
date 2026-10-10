#!/bin/bash
# Light check of the release APK (after smoke.sh, on the same emulator): it installs, opens, does not crash and the plugins work.
# debuggable=false means no run-as; shared preferences are read with adb root.
P=com.neowell.app
STEP=start
step() { STEP="$*"; echo "=== STEP: $*"; }
die() { echo "$1 (step: $STEP)"; exit 1; }
until_ok() { local t=$1 i; shift; for i in $(seq "$t"); do "$@" && return 0; sleep 1; done; return 1; }
step "install"
adb uninstall $P
adb install release/neowell.apk || die "RELEASE APK COULD NOT BE INSTALLED"
adb shell dumpsys package $P | grep -E "pkgFlags|flags=" | grep -q DEBUGGABLE && die "RELEASE APK IS DEBUGGABLE"
adb shell pm grant $P android.permission.POST_NOTIFICATIONS
adb logcat -c -b all
step "launch and plugin diagnostics"
# A release build does not write the console to logcat: with this intent extra MainActivity writes, under the NW-DIAG tag, that every plugin loaded
# and its @PluginMethod methods survived R8/ProGuard (MainActivity.java, diag).
adb shell am start -n $P/.MainActivity --ez nw_diag true
diag_line() { diag=$(adb logcat -d -s NW-DIAG:I | grep "NW-DIAG" | tail -1); [ -n "$diag" ]; }
until_ok 60 diag_line || { adb logcat -d | grep -iE "neowell|AndroidRuntime|Capacitor" | tail -60; die "RELEASE: NO NW-DIAG (plugin diagnostics did not run, the app did not start or the diagnostic path is broken)"; }
echo "NW-DIAG: $diag"
adb logcat -d -b crash | grep -qE "Process: $P|>>> $P <<<" && { adb logcat -d -b crash; die "RELEASE APP CRASHED"; }
[ -n "$(adb shell pidof $P)" ] || die "RELEASE APP DID NOT START"
# Every plugin must show at least one @PluginMethod (=0: the class did not load or its methods were removed by shrinking).
for p in LocalNotifications Share Filesystem App BarcodeScanner MedWake AppLock KeyVault DeviceHelp StepCounter Ocr QuickLog Motion Widget Speech BackupFolder Health; do
  echo "$diag" | grep -qE "(^|[ :])$p=[1-9]" || die "RELEASE: PLUGIN MISSING OR ITS METHODS REMOVED: $p"
done
step "JS bridge side effects"
# The JS bridge and native plugins are also verified by their side effects: the Widget.update preferences file and the LocalNotifications alarms.
adb root >/dev/null; adb wait-for-device; sleep 2
widget_ok() { adb shell cat /data/data/$P/shared_prefs/nw_widget.xml | grep -qE 'water(&quot;|")?:[0-9]+'; }
until_ok 60 widget_ok || die "RELEASE: WIDGET DATA NOT WRITTEN"
alarms_ok() { n=$(adb shell dumpsys alarm | grep -E "RTC_WAKEUP.*$P" | wc -l); [ "$n" -ge 100 ]; }
until_ok 90 alarms_ok
echo "Release alarm count: $n"
[ "$n" -ge 100 ] || die "RELEASE: REMINDER ALARMS NOT SCHEDULED"
echo "Release check passed"
