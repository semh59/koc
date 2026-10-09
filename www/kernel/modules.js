"use strict";
/* Data ownership: which module manages each S field and which files may touch it directly (the owner files).
   Other files get that data through the module's contract; scripts/sinir.test.js checks the boundary. main/* is the core and may touch every field. */
const Modules={
  log:{keys:["entries","nextId"]},
  nutrition:{keys:["myFoods","favFoods","mealTpl","recipes"]},
  gym:{keys:["workouts","templates","customEx","gid","bar","dbStep","plates","exCfg"]},
  meds:{keys:["meds","medLog"]},
  habits:{keys:["sleep","mood","fast"]},
  pulse:{keys:["pulse","hr"]},
  vitals:{keys:["vitals"]},
  labs:{keys:["labs"]},
  measures:{keys:["measures"]},
  cycle:{keys:["cycle"]},
  motion:{keys:["walk","moves"]},
  coach:{keys:["chat","chats","cid","providers"]}
};
/* Store shards: one record per module; settings belong to the core. A field in no shard goes to the "other" shard (data is never dropped silently).
   Fast-growing arrays are split into one shard per month (shard id "<module>/<month>"): adding an entry writes only that month's shard. */
const Chunks={entries:e=>String(e&&e.day||"").slice(0,7)||"x"};
const Shards={settings:["settings"],...Object.fromEntries(Object.entries(Modules).map(([id,m])=>[id,m.keys]))};
if(typeof module!=="undefined")module.exports=Modules;
