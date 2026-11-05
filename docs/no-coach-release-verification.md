# No-Coach release verification

Branch: `release/no-coach`
Base: `89e239d`

## Passed

- `node scripts/run-no-coach-tests.js`: 80 executed, 0 failed.
- Coach-only tests: 8 explicitly skipped because Coach is retained on `main`.
- Mixed Coach tests: 18 explicitly scoped to `main`; not counted as no-Coach release tests.
- `npm run test:e2e`: 14 passed across `phone-360` and `phone-412`.
- `node scripts/no-coach-release.test.js`: passed.
- `node scripts/no-coach-boot.test.js`: 5/5 passed.
- `node scripts/food-voice.test.js`: all passed.
- `node scripts/menulocal.test.js`: all passed.
- `node scripts/foods.test.js`: all passed.
- `node scripts/alarm.test.js`: all passed.
- `node scripts/android.test.js`: all passed.
- `node scripts/verify-android-sync.js`: 28 Java, 44 source resources, 758 web assets.
- `node scripts/verify-android-sync.test.js`: 5/5 negative/manifest checks passed.
- Production syntax checks and `git diff --check`: passed.

## Scope proof

- Coach web module, Coach imports, Coach navigation/composer, provider/API/network paths, Coach voice, Coach state, Coach consent/key-vault paths and Coach release tests are absent from shipped `www` tree.
- Food voice remains local catalog search and does not auto-save.
- Nutrition OCR, local menu search and Open Food Facts barcode path remain.
- `main` Coach sources/tests remain available from `main` branch.
- `son-surum` remains unchanged.

## Open blockers

- Android Gradle build/instrumentation not run: machine has no `JAVA_HOME`/`java`.
- Android emulator/device instrumentation not run: `adb` is unavailable.
- No APK/AAB, CI run, tag or GitHub release created.
- Physical-device behavior remains unverified.
