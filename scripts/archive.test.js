const {ok,finish}=require("./ok");
const A=require("../www/modules/data/archivelib.js"),Modules=require("../www/kernel/modules.js");
const S={settings:{kcal:2000,healthNote:"not"},entries:[{id:1,type:"weight",day:"2026-10-01",v:80},{id:2,type:"food",day:"2026-10-01",v:300}],nextId:3,
  vitals:[{id:1,k:"t",day:"2026-10-01",time:"08:00",sys:120,dia:80}],meds:[],medLog:[],providers:[{id:"groq",name:"Groq",base:"https://x",key:"SECRET"}],chat:[{r:"u",t:"merhaba"}],labs:[],cycle:{log:["CYC"]}};
const r=A.build(S,"2026-10-11"),d=JSON.parse(r.json);
ok("archive: valid JSON with schema, date, settings and one block per module",d.schema===1&&d.exportedAt==="2026-10-11"&&d.settings.kcal===2000&&Object.keys(d.modules).join()===Object.keys(Modules).join());
ok("archive: records are the user's own, in the module that owns them",d.modules.log.entries.length===2&&d.modules.vitals.vitals[0].sys===120&&d.modules.coach.chat[0].t==="merhaba");
ok("archive: the provider list (and anything key-like) and the cycle record are not included",!("providers" in d.modules.coach)&&!r.json.includes("SECRET")&&!r.json.includes("CYC")&&Object.keys(d.modules.cycle).length===0);
ok("archive: counts equal the array lengths shown to the user",r.counts.log===2&&r.counts.vitals===1&&r.counts.coach===1&&r.total===4,r.counts);
ok("archive: an empty state gives a total of 0 and does not throw",A.build({settings:{}},"2026-10-11").total===0);
ok("archive: settings that stay on the phone (health note, near person, place) are not in the file",(d=>!("healthNote" in d.settings)&&!("medNear" in d.settings)&&d.settings.kcal===2000)(JSON.parse(A.build({settings:{kcal:2000,healthNote:"x",medNear:"+905551112233",ramLat:39}},"2026-10-11").json)));
finish();
