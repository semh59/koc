# Sınır haritası (otomatik: node scripts/boundary-map.js)

## Veri alanı -> dokunan dosyalar
| S alanı | dosya sayısı | dosyalar |
|---|---|---|
| settings | 43 | kernel/unitui.js, main/01-core.js, main/02-state-components.js, main/03-screens.js, main/04-sheets.js, main/05-notifications.js, main/05-permissions.js, main/06-events.js, main/07-actions.js, modules/coach/coach.js, modules/cycle/cycleui.js, modules/cycle/index.js, modules/data/archivelib.js, modules/data/backupui.js, modules/data/csvlib.js, modules/data/lockui.js, modules/data/onboardui.js, modules/data/privacyui.js, modules/gym/guideui.js, modules/gym/gym.js, modules/habits/habitui.js, modules/habits/index.js, modules/habits/ramadanui.js, modules/history/historyui.js, modules/insights/activityui.js, modules/insights/doctorui.js, modules/insights/goalui.js, modules/insights/trialui.js, modules/insights/weeklyui.js, modules/log/drinkui.js, modules/log/entries.js, modules/log/quickui.js, modules/measures/measureui.js, modules/meds/alarmui.js, modules/meds/medui.js, modules/motion/index.js, modules/motion/motionui.js, modules/motion/stepsui.js, modules/motion/walkui.js, modules/pulse/hcui.js, modules/pulse/index.js, modules/pulse/pulseui.js, modules/vitals/vitalsui.js |
| entries | 4 | main/04-sheets.js, modules/log/entries.js, modules/log/index.js, modules/log/quickui.js |
| meds | 4 | modules/meds/alarmui.js, modules/meds/index.js, modules/meds/medlib.js, modules/meds/medui.js |
| medLog | 4 | modules/meds/alarmui.js, modules/meds/index.js, modules/meds/medlib.js, modules/meds/medui.js |
| walk | 4 | modules/motion/index.js, modules/motion/motionui.js, modules/motion/stepsui.js, modules/motion/walkui.js |
| gid | 3 | modules/gym/guideui.js, modules/gym/gym.js, modules/gym/index.js |
| workouts | 3 | modules/gym/guideui.js, modules/gym/gym.js, modules/gym/index.js |
| nextId | 3 | modules/log/entries.js, modules/log/index.js, modules/log/quickui.js |
| chat | 2 | modules/coach/coach.js, modules/coach/index.js |
| providers | 2 | modules/coach/coach.js, modules/coach/index.js |
| chats | 2 | modules/coach/coach.js, modules/coach/index.js |
| cycle | 2 | modules/cycle/cycleui.js, modules/cycle/index.js |
| cycleSym | 2 | modules/cycle/cycleui.js, modules/cycle/index.js |
| bar | 2 | modules/gym/exui.js, modules/gym/gym.js |
| plates | 2 | modules/gym/exui.js, modules/gym/gym.js |
| exCfg | 2 | modules/gym/exui.js, modules/gym/gym.js |
| dbStep | 2 | modules/gym/exui.js, modules/gym/gym.js |
| templates | 2 | modules/gym/guideui.js, modules/gym/gym.js |
| customEx | 2 | modules/gym/gym.js, modules/gym/index.js |
| sleep | 2 | modules/habits/habitui.js, modules/habits/index.js |
| mood | 2 | modules/habits/habitui.js, modules/habits/index.js |
| fast | 2 | modules/habits/habitui.js, modules/habits/index.js |
| labs | 2 | modules/labs/index.js, modules/labs/labui.js |
| measures | 2 | modules/measures/index.js, modules/measures/measureui.js |
| moves | 2 | modules/motion/index.js, modules/motion/motionui.js |
| recipes | 2 | modules/nutrition/index.js, modules/nutrition/recipeui.js |
| myFoods | 2 | modules/nutrition/index.js, modules/nutrition/ocrui.js |
| pulse | 2 | modules/pulse/index.js, modules/pulse/pulseui.js |
| hr | 2 | modules/pulse/index.js, modules/pulse/pulseui.js |
| vitals | 2 | modules/vitals/index.js, modules/vitals/vitalsui.js |
| failed | 1 | kernel/storelib.js |
| init | 1 | kernel/storelib.js |
| sharded | 1 | kernel/storelib.js |
| rev | 1 | kernel/storelib.js |
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
| cid | 1 | modules/coach/coach.js |
| favFoods | 1 | modules/nutrition/index.js |
| mealTpl | 1 | modules/nutrition/index.js |

## Dosya -> başka dosyalardan kullandığı adlar (sayı)
| dosya | dışa bağımlı ad | tanımladığı ad |
|---|---|---|
| kernel/algo.js | 5 | 1 |
| kernel/common.js | 3 | 2 |
| kernel/icons.js | 3 | 1 |
| kernel/kernel.js | 0 | 2 |
| kernel/ls.js | 1 | 4 |
| kernel/modules.js | 30 | 3 |
| kernel/netlog.js | 1 | 1 |
| kernel/piilib.js | 6 | 1 |
| kernel/share.js | 10 | 7 |
| kernel/storelib.js | 2 | 1 |
| kernel/unitlib.js | 0 | 1 |
| kernel/unitui.js | 8 | 2 |
| main/01-core.js | 33 | 77 |
| main/02-state-components.js | 16 | 12 |
| main/03-screens.js | 124 | 40 |
| main/04-sheets.js | 70 | 74 |
| main/05-notifications.js | 38 | 19 |
| main/05-permissions.js | 25 | 10 |
| main/06-events.js | 106 | 8 |
| main/07-actions.js | 69 | 2 |
| modules/coach/coach.js | 58 | 146 |
| modules/coach/coachlib.js | 10 | 1 |
| modules/coach/index.js | 5 | 1 |
| modules/coach/insightlib.js | 6 | 1 |
| modules/cycle/cyclelib.js | 6 | 1 |
| modules/cycle/cycleui.js | 29 | 17 |
| modules/cycle/index.js | 3 | 1 |
| modules/data/archivelib.js | 3 | 1 |
| modules/data/backuplib.js | 1 | 1 |
| modules/data/backupui.js | 28 | 20 |
| modules/data/csvimportui.js | 16 | 7 |
| modules/data/csvlib.js | 9 | 1 |
| modules/data/csvreadlib.js | 9 | 1 |
| modules/data/fhirlib.js | 5 | 1 |
| modules/data/lockui.js | 6 | 11 |
| modules/data/onboardui.js | 47 | 19 |
| modules/data/photolib.js | 1 | 1 |
| modules/data/photoui.js | 19 | 24 |
| modules/data/privacyui.js | 40 | 13 |
| modules/gym/balance.js | 1 | 2 |
| modules/gym/cardiolib.js | 3 | 1 |
| modules/gym/cardioui.js | 23 | 9 |
| modules/gym/excues.js | 1 | 1 |
| modules/gym/exlib.js | 2 | 1 |
| modules/gym/exui.js | 52 | 50 |
| modules/gym/figlib.js | 5 | 1 |
| modules/gym/figtpl.js | 0 | 1 |
| modules/gym/guidelib.js | 3 | 1 |
| modules/gym/guideui.js | 40 | 24 |
| modules/gym/gym.js | 55 | 132 |
| modules/gym/importlib.js | 7 | 1 |
| modules/gym/importui.js | 13 | 7 |
| modules/gym/index.js | 13 | 1 |
| modules/gym/musclemap.js | 3 | 1 |
| modules/gym/programs.js | 0 | 1 |
| modules/habits/habitlib.js | 3 | 1 |
| modules/habits/habitui.js | 28 | 21 |
| modules/habits/index.js | 17 | 1 |
| modules/habits/ramadanlib.js | 6 | 1 |
| modules/habits/ramadanui.js | 27 | 23 |
| modules/habits/ramcities.js | 0 | 1 |
| modules/history/historylib.js | 5 | 1 |
| modules/history/historyui.js | 38 | 16 |
| modules/insights/activitylib.js | 1 | 1 |
| modules/insights/activityui.js | 8 | 1 |
| modules/insights/doctorlib.js | 8 | 1 |
| modules/insights/doctorui.js | 19 | 4 |
| modules/insights/goallib.js | 1 | 1 |
| modules/insights/goalui.js | 13 | 2 |
| modules/insights/linkslib.js | 7 | 1 |
| modules/insights/linksui.js | 9 | 1 |
| modules/insights/triallib.js | 3 | 1 |
| modules/insights/trialui.js | 12 | 4 |
| modules/insights/weeklylib.js | 13 | 1 |
| modules/insights/weeklyui.js | 14 | 2 |
| modules/labs/index.js | 9 | 2 |
| modules/labs/lablib.js | 10 | 1 |
| modules/labs/labui.js | 28 | 28 |
| modules/log/drinkui.js | 18 | 7 |
| modules/log/entries.js | 9 | 9 |
| modules/log/index.js | 9 | 4 |
| modules/log/loglib.js | 5 | 1 |
| modules/log/quickui.js | 16 | 2 |
| modules/measures/index.js | 7 | 1 |
| modules/measures/measureui.js | 23 | 8 |
| modules/meds/alarmlib.js | 3 | 1 |
| modules/meds/alarmui.js | 21 | 11 |
| modules/meds/index.js | 11 | 1 |
| modules/meds/medlib.js | 8 | 1 |
| modules/meds/medui.js | 36 | 43 |
| modules/motion/index.js | 14 | 1 |
| modules/motion/motionlib.js | 5 | 1 |
| modules/motion/motionui.js | 24 | 17 |
| modules/motion/stepsui.js | 38 | 17 |
| modules/motion/walkui.js | 23 | 14 |
| modules/nutrition/foods.js | 3 | 6 |
| modules/nutrition/index.js | 5 | 1 |
| modules/nutrition/labellib.js | 4 | 1 |
| modules/nutrition/menulocal.js | 7 | 1 |
| modules/nutrition/ocrui.js | 14 | 7 |
| modules/nutrition/offlib.js | 1 | 1 |
| modules/nutrition/quicklib.js | 6 | 1 |
| modules/nutrition/quickui.js | 16 | 7 |
| modules/nutrition/recipeui.js | 23 | 10 |
| modules/pulse/hcui.js | 19 | 10 |
| modules/pulse/index.js | 8 | 1 |
| modules/pulse/pulselib.js | 3 | 1 |
| modules/pulse/pulseui.js | 14 | 14 |
| modules/vitals/index.js | 9 | 1 |
| modules/vitals/vitalslib.js | 12 | 1 |
| modules/vitals/vitalsui.js | 40 | 49 |
