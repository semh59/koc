# Android device test coverage

## Verified coverage

- CI API 36 emulator smoke: `smoke.sh` + `smoke-release.sh`.
- CI API 31 emulator smoke exists but is informational; `release.needs` includes only `smoke` (API 36).
- Browser E2E uses fake Capacitor/provider plugins and is not device coverage.
- Host `hc.test.js` uses a fake Health plugin.
- Only default Android instrumentation test exists; it now asserts the actual package `com.neowell.app`.

## Remaining unverified coverage

No physical-device lane exists for Health Connect, biometric prompt, real sensors/GPS, SAF BackupFolder picker, launcher widget rendering, lock-screen notification behavior, reboot recovery, or manufacturer-specific power/notification behavior. The local environment also lacks `adb`/emulator tools, so these cannot be executed here.

## Changes in this phase

- Corrected the default instrumented package assertion in `android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java`.
- Added a CI contract check after Android generation to ensure the instrumentation test package matches `applicationId`.

## Faz 5 result

- `callProvider()` now rejects non-probe direct calls when Coach consent/provider consent is absent; this closes the bypass found by review.
- `scripts/coach2.test.js` verifies direct provider calls do not send a request without consent.
- `e2e/coach.spec.js` captures the actual fake-provider POST body and verifies protected health fields and raw identity are absent while PII tags remain.
- API 36/31 E2E targeted test passed on both phone projects.


- Debug Android test APK is built in CI.
- API 36 and API 31 emulator smoke jobs run the instrumentation runner before smoke scripts.
- API 31 is now included in the release dependency chain.
- Package contract is `com.neowell.app`.

The remaining hardware-only matrix is explicitly not represented as emulator coverage: real Health Connect provider/watch data, biometric hardware, sensors/GPS, SAF document providers, OEM launchers, lock-screen and manufacturer-specific power/notification behavior.
