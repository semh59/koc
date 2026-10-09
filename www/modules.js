"use strict";
/* Veri sahipliği: her S alanını hangi modül yönetir ve hangi dosyalar doğrudan dokunabilir (sahip dosyalar).
   Başka dosyalar o veriyi modülün sözleşmesinden alır; scripts/sinir.test.js sınırı denetler. main/* çekirdektir, her alana dokunabilir. */
const Modules={
  kayit:{keys:["entries","nextId"],owners:["quickui.js"]},
  besin:{keys:["myFoods","favFoods","mealTpl","recipes"],owners:["recipeui.js","ocrui.js"]},
  salon:{keys:["workouts","templates","customEx","gid","bar","dbStep","plates","exCfg"],owners:["gym.js","exui.js","guideui.js"]},
  ilac:{keys:["meds","medLog"],owners:["medlib.js","medui.js","alarmui.js"]},
  aliskanlik:{keys:["sleep","mood","fast"],owners:["habitui.js"]},
  nabiz:{keys:["pulse","hr"],owners:["pulseui.js","hcui.js"]},
  tansiyon:{keys:["vitals"],owners:["vitalsui.js"]},
  tahlil:{keys:["labs"],owners:["labui.js"]},
  olcu:{keys:["measures"],owners:["measureui.js"]},
  dongu:{keys:["cycle"],owners:["cycleui.js"]},
  hareket:{keys:["walk","moves"],owners:["motionui.js","walkui.js"]},
  koc:{keys:["chat","chats","cid","providers"],owners:["coach.js"]}
};
if(typeof module!=="undefined")module.exports=Modules;
