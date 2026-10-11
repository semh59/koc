"use strict";
/* Cross-module contract (api): a module may use another module's top-level name only if it is defined in that module's index.js, is an XxxLib namespace, or is listed in that module's api.
   Data ownership: which module manages each S field and which files may touch it directly (the owner files).
   Other files get that data through the module's contract; scripts/boundary.test.js checks the boundary. main/* is the core and may touch every field. */
const Modules={
  log:{keys:["entries","nextId"],api:["add","of","sum","dayTotal","weights","streak","kcalGoal"]},
  nutrition:{keys:["myFoods","favFoods","mealTpl","recipes"],api:["FOODS","MenuLocal","ocrBtn"]},
  gym:{keys:["workouts","templates","customEx","gid","bar","dbStep","plates","exCfg"],api:["gEx","gPgNote","gTplAdd","gNames","gStats"]},
  meds:{keys:["meds","medLog"],api:["medNowHM","medIngest"]},
  habits:{keys:["sleep","mood","fast"]},
  pulse:{keys:["pulse","hr"],api:["hcCard","hcNow","hcSync"]},
  vitals:{keys:["vitals"]},
  labs:{keys:["labs"],api:["labReview"]},
  measures:{keys:["measures"]},
  cycle:{keys:["cycle"]},
  motion:{keys:["walk","moves"],api:["motionKg","setHc"]},
  coach:{keys:["chat","chats","cid","providers"],api:["cNoteCheck","cConsent","consentHtml","consentOk","provNames","usageText","cCalc"]}
};
/* Store shards: one record per module; settings belong to the core. A field in no shard goes to the "other" shard (data is never dropped silently).
   Fast-growing arrays are split into one shard per month (shard id "<module>/<month>"): adding an entry writes only that month's shard. */
const Chunks={entries:e=>e.day.slice(0,7)};
const Shards={settings:["settings"],...Object.fromEntries(Object.entries(Modules).map(([id,m])=>[id,m.keys]))};
if(typeof module!=="undefined")module.exports=Modules;
