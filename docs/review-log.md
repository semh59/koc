# Code review log

Sequential code-quality program. One row per file that was read completely, line by line.

| file | lines | agent 2 | findings fixed |
|---|---|---|---|
| www/kernel/algo.js | 296 | agent 2 | comments translated; removed the `lossBlock` `health:boolean` compatibility shim, the `moveBonus` pct, `trend` alpha and `adaptiveTdee` window parameters nobody passed (now named constants); shared `ISO_DAY`, `MEASURES_MAX` |
| www/kernel/icons.js | 53 | agent 2 | comment translated; removed the unused `search` icon |
| www/kernel/kernel.js | 14 | agent 2 | comments translated |
| www/kernel/modules.js | 22 | agent 2 | comments translated |
| www/kernel/piilib.js | 122 | agent 2 | comments translated; removed the unused `NAMES` export (tag kinds such as AD/TC stay: they are Coach text) |
| www/kernel/storelib.js | 143 | agent 2 | removed the single-text migration path (revision reconciliation, localStorage mirror, conflict copy, copy migration, durability fallback); the main state key now stays in localStorage mode only (105 lines) |
| www/kernel/unitlib.js | 22 | agent 2 | comments translated; removed the unused `LB`/`MG` exports |
| www/kernel/unitui.js | 13 | agent 2 | comment translated |
| www/main/01-core.js | 353 | agent 2 | `cleanSettings` table-driven (boolean flags, day keys); removed the shard verification fallback; one `adoptExternal` handler for both cross-tab events; dead `avg`/`vals`; added `plugin()`, `fint()`, `dayTotal()`, `MYFOODS_MAX`; optional catch binding; comments translated |
| www/main/02-state-components.js | 85 | agent 2 | tip of the day rotated at 03:00 local (UTC day index), now local day; `trendAll` via `Algo.dayNum`; `coach()` renamed `dailyTip()`; comments translated |
| www/main/03-screens.js | 267 | agent 2 | Trend charts and the weekly table use per-day totals (one pass) instead of a full entry scan per day; `COPIES` loses the conflict copy; `plugin()`; comments translated |
| www/main/04-sheets.js | 274 | agent 2 | bug: barcode scan with a full (200) food list opened `sheetPortion(-1)` and threw; now opens unsaved with a note (test added); `plugin()`; comments translated |
| www/main/05-notifications.js | 190 | agent 2 | named `FAST_NID`, `LEAD_MS`, `RESCHEDULE_MS`, kept-notification set; duplicated manual-steps card shared; per-day step totals in one pass; `fint()`; `plugin()`; comments translated |
| www/main/06-events.js | 151 | agent 2 | boolean setting toggles table-driven; plugin listeners via optional chaining; comments translated |
| www/main/07-actions.js | 43 | agent 2 | unused handler parameters removed, `oem1`/`oem2` split instead of re-checking the action name, shared `copyKey` check, reset list from `COPIES` |
| www/index.html | 137 | agent 2 | comments translated; no dead ids or scripts found |
| www/app.css | 395 | agent 2 | comments translated; removed dead rules (`.my-1`, `.sep`, `.tag.warn`, `.prow.off`) and merged duplicate selectors |
| www/modules/log/loglib.js | 92 | agent 3 | comments translated; named caps (`FAVS_MAX`, `TPL_MAX`, `RECENTS_MAX`, `RECIPES_MAX`, ...); shared `uniqueItems` and `nextId`; `dayLog` in one pass instead of five filters; removed the unused `RLBL`/`MAX` exports; bug: a recipe item of 0.04 g was stored as 0 g (round first, then validate); `recipeItem` exported |
| www/modules/log/index.js | 36 | agent 3 | comments translated; hist reuses `WeeklyLib.isWater` instead of a copy; `fint()`; CSV callbacks destructure only the keys they use |
| www/modules/log/drinkui.js | 28 | agent 3 | comment translated; `isWater` evaluated once in `goDrink` |
| www/modules/log/quickui.js | 37 | agent 3 | comments translated; `plugin("QuickLog")` instead of a private getter; optional catch binding |
| www/modules/nutrition/foods.js | 865 | agent 3 | generated file: all 818 rows, 401 aliases, the `VEK` notes and the 476 `PARCA` entries read, and the rows checked by script (unique names, portion grams, kcal vs macros, ranges, aliases); nutrient data has no defect, one display defect in `PARCA` is deferred (see Notes); code part now comes from `tools/besin/sablon.js` (English comments, `foldTr` replaces the 8-step replace chain and also folds other accents) |
| www/modules/nutrition/index.js | 8 | agent 3 | CSV callbacks destructure only the keys they use |
| www/modules/nutrition/labellib.js | 81 | agent 3 | comments translated; removed the unused `found`/`col`/`col100` outputs and the impossible NaN filter in `pairs`; `numbers()` shared by two branches; `LabLib.fold` used directly |
| www/modules/nutrition/menulocal.js | 73 | agent 3 | comments translated; `foldTr` instead of a private `norm`; removed the unused `foods` option, `SIDE` export, the per-call name `Map`, the existence check of the static pools and the dead `own.has` term in `pick`; named `KCAL_MIN/KCAL_MAX/TRIES/MAX_STEPS`; `[iı]` classes simplified (input is already folded) |
| www/modules/nutrition/ocrui.js | 108 | agent 3 | comments translated; `plugin("Ocr")`; removed write-only `ocrKind` and the unused `cls` parameter; label fields table-driven (`LABEL_FIELDS`, `g3` class instead of inline style); bug: protein/carbs/fat above 100 g were silently dropped after the second Save tap, now range-checked with a message before the consistency check (test added; calories keep the old toast); p/c/f are rounded to 0.1 like the other fields; inputs get real `<label for>` names; `MYFOODS_MAX` in the message; self test scheduled unconditionally and checks the plugin itself (load order) |
| www/modules/nutrition/offlib.js | 38 | agent 3 | comment translated; `within()` replaces three null-comparison tricks; shadowed `k` removed |
| www/modules/nutrition/recipeui.js | 75 | agent 3 | globals `rd`/`rres` renamed `recipeDraft`/`recipeHits`; caps from `LogLib`; `LogLib.recipeItem` instead of `cleanRecipes` on a dummy recipe; `allFoods()` built once per keystroke (was twice); dummy-ingredient hack in the summary removed; `newRecipeId()`; display bug: the editor draft held 1.1 portions as 110.00000000000001 g and showed it that way after a re-render (rounded to 0.1 g; test added; saving already rounded); gram validation matches the rounding |

## Notes

- `source` values `formül` / `veri` / `veri+formül` of `Algo.adaptiveTdee` are kept Turkish on purpose: `CoachLib` prints them into the Coach context text.
- `--sp-6` is unused in CSS but documented as part of the spacing scale in `docs/tasarim-dili.md`; kept.
- Known risk: if a session had to fall back to localStorage mode (IndexedDB open timeout) and a later boot finds shards, the localStorage text is ignored and left in place (not merged, not deleted); only the first IndexedDB boot migrates and deletes it.
- `Object.groupBy` was not used for sharding: the app has no WebView version floor (minSdk 23) and the save path must not depend on Chrome 117.
- Other modules still declare their own `window.Capacitor.Plugins.X` getters and `toLocaleString("tr-TR")` calls; `plugin()` and `fint()` in `01-core.js` can replace them.
- `foods.js` is generated: edit `tools/besin/` sources and `sablon.js`, then run `node tools/besin/uret.js` (`scripts/foods.test.js` fails if the file drifts). The generator's output path still pointed at the pre-restructure `www/foods.js`; fixed.
- Deferred (generator change): `PARCA` entries for proxy rows name the proxy ingredient, and `CoachLib.shopList` shows it when it has no parentheses: Çökelek lists "Quark" and "Cottage peyniri", Kaymak "Clotted cream", Tulum "Feta" and "Pecorino", Kokoreç "İşkembe" and "Kuzu ciğeri". `tools/besin/uret.js` should map proxy part names to the Turkish product name.
- `foodSearch` stays a scan on purpose: names are normalized once and cached (`foodKey`), and the ranks (word-boundary regex, substring, any-order words, alias) need a substring test per entry, so a prefix or token index would not lower the cost for 818 entries.
- Food data was checked by script and left as is. Rows that share identical values under different names (Zeytin / Yeşil zeytin, Meyve suyu / Elma suyu, Yulaf ezmesi / Yulaf (çiğ), Lavaş / Pide ekmeği, Marie bisküvi / Bisküvi (petibör)) are kept: the first 818 names are hash-locked by `foods.test.js` and each name is a separate search entry.
