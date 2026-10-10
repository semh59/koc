# Sınır haritası (otomatik: node scripts/sinir-haritasi.js)

## Veri alanı -> dokunan dosyalar
| S alanı | dosya sayısı | dosyalar |
|---|---|---|
| settings | 34 | kernel/unitui.js, main/01-core.js, main/02-state-components.js, main/03-screens.js, main/04-sheets.js, main/05-notifications.js, main/06-events.js, main/07-actions.js, modules/coach/coach.js, modules/cycle/cycleui.js, modules/data/backupui.js, modules/data/csvlib.js, modules/data/lockui.js, modules/data/onboardui.js, modules/data/privacyui.js, modules/gym/guideui.js, modules/gym/gym.js, modules/habits/habitui.js, modules/habits/index.js, modules/history/historyui.js, modules/insights/goalui.js, modules/insights/weeklyui.js, modules/log/drinkui.js, modules/log/quickui.js, modules/measures/measureui.js, modules/meds/alarmui.js, modules/meds/medui.js, modules/motion/index.js, modules/motion/motionui.js, modules/motion/walkui.js, modules/pulse/hcui.js, modules/pulse/index.js, modules/pulse/pulseui.js, modules/vitals/vitalsui.js |
| entries | 8 | main/01-core.js, main/02-state-components.js, main/03-screens.js, main/04-sheets.js, main/05-notifications.js, main/06-events.js, modules/log/index.js, modules/log/quickui.js |
| meds | 7 | main/01-core.js, main/03-screens.js, main/05-notifications.js, modules/meds/alarmui.js, modules/meds/index.js, modules/meds/medlib.js, modules/meds/medui.js |
| walk | 5 | main/03-screens.js, main/05-notifications.js, modules/motion/index.js, modules/motion/motionui.js, modules/motion/walkui.js |
| medLog | 5 | main/05-notifications.js, modules/meds/alarmui.js, modules/meds/index.js, modules/meds/medlib.js, modules/meds/medui.js |
| chats | 3 | main/01-core.js, modules/coach/coach.js, modules/coach/index.js |
| nextId | 3 | main/01-core.js, main/05-notifications.js, modules/log/quickui.js |
| moves | 3 | main/01-core.js, modules/motion/index.js, modules/motion/motionui.js |
| chat | 3 | main/01-core.js, modules/coach/coach.js, modules/coach/index.js |
| vitals | 3 | main/01-core.js, modules/vitals/index.js, modules/vitals/vitalsui.js |
| labs | 3 | main/03-screens.js, modules/labs/index.js, modules/labs/labui.js |
| favFoods | 3 | main/04-sheets.js, main/06-events.js, modules/nutrition/index.js |
| mealTpl | 3 | main/04-sheets.js, main/06-events.js, modules/nutrition/index.js |
| myFoods | 3 | main/04-sheets.js, modules/nutrition/index.js, modules/nutrition/ocrui.js |
| recipes | 3 | main/04-sheets.js, modules/nutrition/index.js, modules/nutrition/recipeui.js |
| fast | 3 | main/05-notifications.js, modules/habits/habitui.js, modules/habits/index.js |
| gid | 3 | modules/gym/guideui.js, modules/gym/gym.js, modules/gym/index.js |
| workouts | 3 | modules/gym/guideui.js, modules/gym/gym.js, modules/gym/index.js |
| providers | 2 | main/04-sheets.js, modules/coach/coach.js |
| cycle | 2 | modules/cycle/cycleui.js, modules/cycle/index.js |
| bar | 2 | modules/gym/exui.js, modules/gym/gym.js |
| plates | 2 | modules/gym/exui.js, modules/gym/gym.js |
| exCfg | 2 | modules/gym/exui.js, modules/gym/gym.js |
| dbStep | 2 | modules/gym/exui.js, modules/gym/gym.js |
| templates | 2 | modules/gym/guideui.js, modules/gym/gym.js |
| customEx | 2 | modules/gym/gym.js, modules/gym/index.js |
| sleep | 2 | modules/habits/habitui.js, modules/habits/index.js |
| mood | 2 | modules/habits/habitui.js, modules/habits/index.js |
| measures | 2 | modules/measures/index.js, modules/measures/measureui.js |
| pulse | 2 | modules/pulse/index.js, modules/pulse/pulseui.js |
| hr | 2 | modules/pulse/index.js, modules/pulse/pulseui.js |
| failed | 1 | kernel/storelib.js |
| rev | 1 | kernel/storelib.js |
| init | 1 | kernel/storelib.js |
| sharded | 1 | kernel/storelib.js |
| ids | 1 | kernel/storelib.js |
| shardError | 1 | kernel/storelib.js |
| mode | 1 | kernel/storelib.js |
| getShards | 1 | kernel/storelib.js |
| putShards | 1 | kernel/storelib.js |
| get | 1 | kernel/storelib.js |
| set | 1 | kernel/storelib.js |
| del | 1 | kernel/storelib.js |
| whenIdle | 1 | kernel/storelib.js |
| onState | 1 | kernel/storelib.js |
| onExternal | 1 | kernel/storelib.js |
| cid | 1 | modules/coach/coach.js |

## Dosya -> başka dosyalardan kullandığı adlar (sayı)
| dosya | dışa bağımlı ad | tanımladığı ad |
|---|---|---|
| kernel/algo.js | 4 | 1 |
| kernel/icons.js | 3 | 1 |
| kernel/kernel.js | 0 | 2 |
| kernel/modules.js | 0 | 3 |
| kernel/piilib.js | 5 | 1 |
| kernel/storelib.js | 2 | 1 |
| kernel/unitlib.js | 0 | 1 |
| kernel/unitui.js | 6 | 1 |
| main/01-core.js | 27 | 72 |
| main/02-state-components.js | 13 | 10 |
| main/03-screens.js | 103 | 36 |
| main/04-sheets.js | 53 | 56 |
| main/05-notifications.js | 50 | 29 |
| main/06-events.js | 84 | 6 |
| main/07-actions.js | 47 | 1 |
| modules/coach/coach.js | 57 | 156 |
| modules/coach/coachlib.js | 9 | 1 |
| modules/coach/index.js | 3 | 1 |
| modules/coach/insightlib.js | 6 | 1 |
| modules/cycle/cyclelib.js | 3 | 1 |
| modules/cycle/cycleui.js | 27 | 15 |
| modules/cycle/index.js | 2 | 0 |
| modules/data/backuplib.js | 1 | 1 |
| modules/data/backupui.js | 24 | 15 |
| modules/data/csvlib.js | 6 | 1 |
| modules/data/lockui.js | 6 | 11 |
| modules/data/onboardui.js | 30 | 14 |
| modules/data/photolib.js | 1 | 1 |
| modules/data/photoui.js | 19 | 24 |
| modules/data/privacyui.js | 28 | 6 |
| modules/data/shareui.js | 6 | 4 |
| modules/gym/cardiolib.js | 3 | 1 |
| modules/gym/cardioui.js | 23 | 9 |
| modules/gym/excues.js | 1 | 1 |
| modules/gym/exlib.js | 2 | 1 |
| modules/gym/exui.js | 44 | 48 |
| modules/gym/figlib.js | 5 | 1 |
| modules/gym/figtpl.js | 0 | 1 |
| modules/gym/guidelib.js | 3 | 1 |
| modules/gym/guideui.js | 40 | 24 |
| modules/gym/gym.js | 48 | 113 |
| modules/gym/importlib.js | 7 | 1 |
| modules/gym/importui.js | 13 | 7 |
| modules/gym/index.js | 12 | 1 |
| modules/gym/musclemap.js | 3 | 1 |
| modules/gym/programs.js | 0 | 1 |
| modules/habits/habitlib.js | 3 | 1 |
| modules/habits/habitui.js | 24 | 20 |
| modules/habits/index.js | 11 | 1 |
| modules/history/historylib.js | 5 | 1 |
| modules/history/historyui.js | 37 | 16 |
| modules/insights/goallib.js | 1 | 1 |
| modules/insights/goalui.js | 13 | 2 |
| modules/insights/linkslib.js | 5 | 1 |
| modules/insights/linksui.js | 7 | 1 |
| modules/insights/weeklylib.js | 12 | 1 |
| modules/insights/weeklyui.js | 11 | 1 |
| modules/labs/index.js | 2 | 1 |
| modules/labs/lablib.js | 8 | 1 |
| modules/labs/labui.js | 24 | 24 |
| modules/log/drinkui.js | 18 | 5 |
| modules/log/index.js | 8 | 4 |
| modules/log/loglib.js | 5 | 1 |
| modules/log/quickui.js | 15 | 2 |
| modules/measures/index.js | 7 | 1 |
| modules/measures/measureui.js | 21 | 7 |
| modules/meds/alarmlib.js | 3 | 1 |
| modules/meds/alarmui.js | 19 | 11 |
| modules/meds/index.js | 6 | 1 |
| modules/meds/medlib.js | 7 | 1 |
| modules/meds/medui.js | 31 | 22 |
| modules/motion/index.js | 4 | 0 |
| modules/motion/motionlib.js | 5 | 1 |
| modules/motion/motionui.js | 22 | 17 |
| modules/motion/walkui.js | 22 | 13 |
| modules/nutrition/foods.js | 2 | 6 |
| modules/nutrition/index.js | 5 | 1 |
| modules/nutrition/labellib.js | 3 | 1 |
| modules/nutrition/menulocal.js | 6 | 1 |
| modules/nutrition/ocrui.js | 14 | 5 |
| modules/nutrition/offlib.js | 1 | 1 |
| modules/nutrition/recipeui.js | 21 | 9 |
| modules/pulse/hcui.js | 19 | 10 |
| modules/pulse/index.js | 8 | 1 |
| modules/pulse/pulselib.js | 3 | 1 |
| modules/pulse/pulseui.js | 13 | 14 |
| modules/vitals/index.js | 7 | 1 |
| modules/vitals/vitalslib.js | 10 | 1 |
| modules/vitals/vitalsui.js | 35 | 38 |
