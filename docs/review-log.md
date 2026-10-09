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

## Notes

- `source` values `formül` / `veri` / `veri+formül` of `Algo.adaptiveTdee` are kept Turkish on purpose: `CoachLib` prints them into the Coach context text.
- `--sp-6` is unused in CSS but documented as part of the spacing scale in `docs/tasarim-dili.md`; kept.
- Known risk: if a session had to fall back to localStorage mode (IndexedDB open timeout) and a later boot finds shards, the localStorage text is ignored and left in place (not merged, not deleted); only the first IndexedDB boot migrates and deletes it.
- `Object.groupBy` was not used for sharding: the app has no WebView version floor (minSdk 23) and the save path must not depend on Chrome 117.
- Other modules still declare their own `window.Capacitor.Plugins.X` getters and `toLocaleString("tr-TR")` calls; `plugin()` and `fint()` in `01-core.js` can replace them.
