#!/bin/bash
# Shared by smoke.sh and smoke-release.sh (sourced): intro skip and failure diagnostics.
# A fresh install shows the intro and schedules nothing until it is finished (permission is asked after it): the smoke skips it like a user would, by tapping "Şimdilik geç" found in the UI tree.
# The button sits at the bottom of the welcome page: when its bounds are below the screen the page is scrolled first (a tap outside the display does nothing), and the tap is verified by the text being gone.
ui_dump() { adb shell uiautomator dump /sdcard/nw_ui.xml >/dev/null 2>&1; adb shell cat /sdcard/nw_ui.xml 2>/dev/null | tr '>' '
'; }
ui_texts() { ui_dump | grep -oE ' (text|content-desc)="[^"]+"' | sort -u | tr '
' '|'; echo; }
skip_intro() {
  local b h w cy
  b=$(ui_dump | grep 'Şimdilik geç' | grep -oE 'bounds="\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]"' | head -1 | grep -oE '[0-9]+' | tr '
' ' ')
  [ -n "$b" ] || return 1
  set -- $b
  read w h <<< "$(adb shell wm size | grep -oE '[0-9]+x[0-9]+' | tail -1 | tr 'x' ' ')"
  cy=$(( ($2 + $4) / 2 ))
  if [ -n "$h" ] && [ "$cy" -ge $(( h - 40 )) ]; then adb shell input swipe $((w / 2)) $((h * 3 / 4)) $((w / 2)) $((h / 4)) 300; return 1; fi
  echo "UI before tap: $(ui_texts)"
  adb shell input tap $(( ($1 + $3) / 2 )) $cy
  sleep 2
  ui_dump | grep -q 'Şimdilik geç' && return 1
  echo "UI after tap: $(ui_texts)"
  return 0
}
# Diagnostics printed when the reminder alarms do not appear.
alarm_diag() {
  echo "--- UI texts"; ui_texts
  echo "--- dumpsys notification"; adb shell dumpsys notification | head -40
  echo "--- logcat (NW-/console), last 60"; adb logcat -d | grep -E "NW-|Capacitor/Console" | tail -60
  echo "--- alarm count: $(adb shell dumpsys alarm | grep -cE 'RTC_WAKEUP.*com.neowell.app')"
  echo "--- dumpsys alarm, com.neowell.app lines (first 10)"; adb shell dumpsys alarm | grep com.neowell.app | head -10
}
