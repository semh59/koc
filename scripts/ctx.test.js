const {ok,finish}=require("./ok");
const C=require("../www/modules/coach/coachlib.js");

const P={cm:175,age:34,sex:"m",act:1};
const t=C.contextText({profile:P,goalKcal:1800});
ok("the context carries height, a 5-year age band, sex, activity and the calorie goal",t==="PROFİL: 175 cm, 30-34 yaş, erkek, hareket düzeyi orta, günlük kalori hedefi 1800",t);
ok("the exact age never reaches the model",!/34/.test(t.replace("30-34","")));
ok("without a calorie goal the line has no goal part",!C.contextText({profile:P,goalKcal:null}).includes("kalori hedefi"));
ok("an empty profile reads as not entered",C.contextText({profile:{},goalKcal:null})==="PROFİL: girilmemiş");
ok("a profile that is switched off sends only a notice and no numbers",C.contextText({profile:null,goalKcal:null}).includes("paylaşmadı")&&!/\d/.test(C.contextText({profile:null,goalKcal:null})));
ok("the context is one line, never longer than 200 characters",!t.includes("\n")&&t.length<200);
{ // data the model must never get again
  const d={profile:P,goalKcal:1800,days:[{d:"10-01",kg:81.7}],today:["yemek: x"],notes:["not"],meds:[{n:"Metformin"}],workouts:["a"],calc:{trendKg:81.7},goals:{kg:70}};
  const x=C.contextText(d);
  ok("weight, records, notes, medication and workouts are ignored even if passed",!/Metformin|81|yemek|not|BUGÜN|14 GÜN|İLAÇ|ANTRENMAN|HESAPLANAN|SAĞLIK/.test(x),x);
}
{ // scope: the system prompt allows four tasks and refuses the rest
  const S=C.SYSTEM;
  ok("SYSTEM names the four allowed tasks",["menüsü","Egzersiz programı","yemeğin kalorisini","egzersizin yaktığı kaloriyi"].every(k=>S.includes(k)));
  ok("SYSTEM refuses health interpretation, medication, symptoms, fasting and calorie-goal advice",/belirti/.test(S)&&/ilaç/.test(S)&&/oruç/.test(S)&&/kalori hedefi/.test(S)&&/yardım etme/.test(S));
  ok("SYSTEM no longer offers propose or weight/water/note logging",!/propose|"water"|"weight"|"note"/.test(S)&&!/Kalori hedefini kendin değiştirme/.test(S));
  ok("SYSTEM keeps the emergency rule with the safety flag and 112",/112/.test(S)&&/"safety"/.test(S));
  ok("SYSTEM tells the model the program warning",/başlamadan hekime danış/.test(S));
  ok("SYSTEM output schema has reply, log, flag, food",S.includes('{"reply":"kullanıcıya metin","log":[],"flag":null,"food":null}'));
}
finish();
