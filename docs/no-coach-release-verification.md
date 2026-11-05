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
- CI run `41970378426` on commit `0207ad5`: build, E2E, API 36 smoke, API 31 smoke and release jobs all passed.
- Published `no-coach` release: [GitHub release](https://github.com/semh59/koc/releases/tag/no-coach), target `0207ad5`.
- Published APK SHA-256: `1ac8ddfe170ed8e60cdab184df9ffe00fa1780dc4ed2081e4b7846ddb320c114` (46,037,775 bytes).
- Published AAB SHA-256: `f00a838f9bc4f3a056716b578caa0601bc2b0628d3525c38211c927a21e98ebd` (28,175,405 bytes).

## Scope proof

- Coach web module, Coach imports, Coach navigation/composer, provider/API/network paths, Coach voice, Coach state, Coach consent/key-vault paths and Coach release tests are absent from shipped `www` tree.
- Food voice remains local catalog search and does not auto-save.
- Nutrition OCR, local menu search and Open Food Facts barcode path remain.
- `main` Coach sources/tests remain available from `main` branch.
- `son-surum` remains unchanged.

## Open verification scope

- Physical-device behavior remains unverified.
