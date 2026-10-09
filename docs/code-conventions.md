# Code conventions

These rules apply to every file under `www/`, `assets/android/`, `scripts/`, `e2e/` and `.github/`. Product documentation in `docs/*.md` stays Turkish.

## Language
- **Code is English**: identifiers, comments, commit messages, test titles, file and folder names, persisted data keys and enum values, event names, `data-*` attribute values, CSS class names.
- **The product UI is Turkish**: every string a user can read (labels, toasts, sheets, notifications, error messages, generated PDF/CSV text, Coach consent text, privacy policy text) stays Turkish with full diacritics. Do not change UI wording while renaming code.
- Text sent to the AI Coach (system prompt, context blocks) is product text and stays Turkish.
- Tests may assert Turkish UI strings; the surrounding test code and titles are English.

## Vocabulary (Turkish stem -> English)
Persisted entry types: `yemek`->`food`, `su`->`water`, `kilo`->`weight`, `spor`->`exercise`, `not`->`note`, `adim`->`steps`. Meal slots: `kahvalti`->`breakfast`, `ogle`->`lunch`, `aksam`->`dinner`, `atistirma`->`snack`.
Modules: `kayit`->`log`, `besin`->`nutrition`, `salon`->`gym`, `ilac`->`meds`, `aliskanlik`->`habits`, `nabiz`->`pulse`, `tansiyon`->`vitals`, `tahlil`->`labs`, `olcu`->`measures`, `dongu`->`cycle`, `hareket`->`motion`, `koc`->`coach`, `gecmis`->`history`, `analiz`->`insights`, `veri`->`data`.
Everything else: use the plain English word (`ekran`->`screen`, `bildirim`->`notification`, `yedek`->`backup`, `ayar`->`settings`, `gizlilik`->`privacy`, `sohbet`->`chat`, `tarif`->`recipe`, `hafta`->`week`, `gun`->`day`, `bugun`->`today`). The final table lives at the bottom of this file and is extended by whoever introduces a new term.

## No legacy, no speculation
- There are no users and no stored data to preserve: do not keep migration, fallback, compatibility or "just in case" paths for data shapes or behaviors that no longer exist.
- Delete dead code (unreferenced functions, unused parameters, unreachable branches, unused CSS), speculative generality (single-implementation interfaces, options nobody passes), defensive code for impossible states, and imaginary code (references to files, globals, DOM ids, APIs or features that do not exist).
- Comments explain only non-obvious *why*. No restating comments, no task IDs, no history, no TODOs.
- Prove before deleting: `grep` every symbol across `www/`, `index.html`, `scripts/`, `e2e/`, `assets/`; run the tests.

## Techniques
Use the best tool that makes the code shorter or the complexity class lower, not newer syntax for its own sake:
- Index with `Map`/`Set` instead of repeated `filter`/`find` in loops; sort once and binary-search sorted-by-day arrays; single-pass reductions; `Object.groupBy`/`Map.groupBy`, `toSorted`, `structuredClone`, `Array.fromAsync`, `AbortController`, `Intl` formatters, optional chaining, private class fields where state needs encapsulation.
- Keep heavy work off the main thread only when measured (Web Worker); batch IndexedDB writes in one transaction; avoid re-stringifying large objects.
- Pure logic stays DOM-free and unit-testable; UI files stay thin.

## Verification
- `npm test` (unit, jsdom) and `CI=1 E2E_PORT=44xx npx playwright test -c e2e/playwright.config.js --output=$TEMP/pwN` (e2e) must pass before every commit.
- `node scripts/sinir.test.js` enforces module data boundaries; `node scripts/paths.test.js` checks file paths.

## Final vocabulary table
Applied everywhere (persisted data, ids, globals, files, `data-*` values, tests). New terms are added here by whoever introduces them.

| Turkish | English | Where it lives |
|---|---|---|
| yemek / su / kilo / spor / not / adim | food / water / weight / exercise / note / steps | entry `type`, tab and icon ids, `data-go`/`data-act`, history kinds, CSS `.hgk.*`, `--water`, `--exercise` |
| kahvalti / ogle / aksam / atistirma (kah/ogl/aks/atis) | breakfast / lunch / dinner / snack | entry `meal`, menu `m`, Coach prompt |
| maden / cay / kahve / gazli / sut / diger | mineral / tea / coffee / soda / milk / other | water entry `dr` |
| acl / once / sonra / yatis / rast | fasting / before / after / bedtime / random | vitals `ctx` |
| sabah / aksam, `ses` (seans) | morning / evening, `session` | vitals `session` |
| nabiz, not (vitals/cycle field) | pulse, note | vitals and cycle fields |
| kos / yur / bis / yuz / eli | run / walk / bike / swim / elliptical | cardio `ck` |
| h / o / y, k / b / r | light / medium / heavy, cramp / headache / mood | cycle `flow`, `sym` |
| ver / koru / al | lose / keep / gain | onboarding `dir` |
| elle | manual | steps entry marker (`text`) |
| kayit / besin / salon / ilac / aliskanlik / nabiz / tansiyon / tahlil / olcu / dongu / hareket / koc / gecmis / analiz / veri | log / nutrition / gym / meds / habits / pulse / vitals / labs / measures / cycle / motion / coach / history / insights / data | module ids, `www/modules/*`, shard ids (`m:log/2026-10`) |
| Kayit / Besin / Salon / Ilac / Aliskanlik / Nabiz / Tansiyon / Tahlil / Koc | Log / Nutrition / Gym / Meds / Habits / Pulse / Vitals / Labs / Coach | module registry globals |
| tansiyon, seker (screens) | bp, glucose | tab ids `bp`, `glucose` (module stays `vitals`) |
| bugun / daha / ayar / profil / hatir / modul / hak / veri | today / more / settings / profile / reminders / modules / about / data | tab ids (`settings-profile`, `settings-data`, ...) |
| egz, bes, har, gun | exlib, nutrition, motion, day | tab and section ids |
| ayar (shard), diger (shard) | settings, other | storage shards |
| koc_v1, koc_v1_bozuk / _onceki / _catisma / _kullanim, koc_keys, koc_bkpw_enc | nw_state, nw_state_corrupt / _previous / _conflict / _usage, nw_keys, nw_bkpw_enc | localStorage / IndexedDB keys |
| yedek / veriyedek / kopya / kopyagordum / kopyasil | backup / databackup / copy / copyseen / copydel | action ids |
| adimac / adimekle / adimduz / adimgizle / adimkapat / adimdegil | stepsopen / stepsadd / stepsfix / stepshide / stepsoff / stepsno | action ids |
| dunku / kendin / tplyeni / barkod / bildirimtest / tamalarm / tamekran / sifirla / paylas / indir / yukle / kopyala / mysil | yesterday / own / tplnew / barcode / notiftest / fullalarm / fullscreen / reset / share / download / restore / copy / mydel | action and `data-go` ids |
| etiket / tarif / tahmin / icecek / uyku / oruc / ruh | label / recipe / forecast / drink / sleep / fast / mood | ids, classes, hist kinds |
| ekran / bildirim / sohbet / hafta / porsiyon / kardiyo / foto | screen / notification / chat / week / portion / cardio / photo | identifier parts (`sheetPhoto`, `goCardio`) |
| baglanti | links | `www/modules/insights/linkslib.js`, `LinksLib` |
| `01-cekirdek` ... `07-eylemler` | `01-core`, `02-state-components`, `03-screens`, `04-sheets`, `05-notifications`, `06-events`, `07-actions` | `www/main/` |
| saat-matrisi / saat-preload, `SAAT_SAHTE` | clock-matrix / clock-preload, `FAKE_CLOCK` | `scripts/` |

Deliberately kept Turkish (product text, not code): UI strings, CSV column headers and CSV ids (`kayitlar`, `saglik`, `uyku`, ...), exported file names (`neowell-yedek-*`, `neowell-tahlil-*`), the Coach context text sent to the model, lab and food name tables, PII word lists, regexes that match Turkish user text, the `Salon` / `Ev tipi` / `Ağırlıksız` equipment values, and `data-gun` / `data-wun` (glucose-unit / weight-unit switches, English abbreviations).

