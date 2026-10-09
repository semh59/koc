"use strict";
/* Veri sahipliği: her S alanını hangi modül yönetir ve hangi dosyalar doğrudan dokunabilir (sahip dosyalar).
   Başka dosyalar o veriyi modülün sözleşmesinden alır; scripts/sinir.test.js sınırı denetler. main/* çekirdektir, her alana dokunabilir. */
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
/* Depo parçaları: modül başına bir kayıt; ayarlar çekirdeğin parçasıdır. Hiçbir parçada olmayan alan "diger" parçasına gider (veri sessizce düşmez). */
/* Çok büyüyen diziler ay ay ayrı parçaya bölünür (parça kimliği "<modül>/<ay>"): bir kayıt eklemek yalnız o ayın parçasını yazar. */
const Chunks={entries:e=>String(e&&e.day||"").slice(0,7)||"x"};
const Shards={settings:["settings"],...Object.fromEntries(Object.entries(Modules).map(([id,m])=>[id,m.keys]))};
if(typeof module!=="undefined")module.exports=Modules;
