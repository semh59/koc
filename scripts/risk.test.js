const {ok,finish}=require("./ok");
const A=require("../www/kernel/algo.js");
const T="2026-10-03",base={age:35,cm:175,kg:90,goalKg:80,healthNote:"",meds:0,glucoseCount90d:0,bpCount90d:0,edFlag:false,clearedAt:"",today:T};
const R=o=>A.riskFlags({...base,...o});
ok("clean profile: no block",(r=>!r.hard.length&&!r.soft.length&&!r.block)(R({})),R({}));
// hard blocks: confirmation does not lift them
for(const [n,o] of [["under 18",{age:16}],["BMI<18.5",{kg:55,cm:180,goalKg:50}],["goal BMI<18.5",{goalKg:55}],["chat ed flag",{edFlag:true}],
  ["eating disorder in the note",{healthNote:"Yeme bozukluğu geçmişim var"}],["anorexia in the note",{healthNote:"anoreksiya tedavisi gördüm"}],["vomiting in the note",{healthNote:"yedikten sonra kusuyorum"}],
  ["pregnant in capitals",{healthNote:"HAMİLEYİM"}],["gestation",{healthNote:"gebeliğin 3. ayı"}],["breastfeeding",{healthNote:"Emziriyorum"}],["postpartum",{healthNote:"lohusayım"}]])
  ok("hard: "+n,(r=>r.hard.length>0&&!!r.block&&r.block===r.hard[0])(R({...o,clearedAt:T})),R({...o,clearedAt:T}));
ok("pregnancy and eating-disorder markers are separate flags",R({healthNote:"hamileyim"}).pregnant&&!R({healthNote:"hamileyim"}).ed&&R({edFlag:true}).ed);
// negation: not hard, but soft because the note is not empty
for(const t of ["hamile değilim","Hamile değilim, emzirmiyorum","gebelik yok","yeme bozukluğu yok","hiç kusmadım","insülin kullanmıyorum, böbrek sorunum yok"]){
  const r=R({healthNote:t});ok("a negated note is not a hard block: "+t,!r.hard.length&&r.soft.length>0&&!r.pregnant&&!r.kidney,r);
}
ok("a negation later in the sentence does not cancel a positive: \"hamileyim ilaç kullanmıyorum\"",R({healthNote:"hamileyim ilaç kullanmıyorum"}).pregnant);
ok("negative and positive in one note: 'diyabet yok, hamileyim' is hard",R({healthNote:"diyabet yok, hamileyim"}).pregnant);
ok("onboarding notes: the pregnancy/eating-disorder note is hard, the doctor/medication note is soft",R({healthNote:"İlk kurulumda işaretlendi: hamilelik, emzirme ya da yeme bozukluğu geçmişi"}).hard.length>0&&!R({healthNote:"İlk kurulumda işaretlendi: hekim kontrolü ya da düzenli ilaç"}).hard.length&&R({healthNote:"İlk kurulumda işaretlendi: hekim kontrolü ya da düzenli ilaç"}).soft.length>0);
// soft blocks and confirmation
for(const [n,o] of [["health note",{healthNote:"Tansiyon"}],["medication record",{meds:1}],["glucose reading",{glucoseCount90d:3}],["blood pressure reading",{bpCount90d:1}],["chronic keyword",{healthNote:"Tip 2 diyabet"}]])
  ok("soft: "+n,(r=>!r.hard.length&&r.soft.length>0&&!!r.block&&!r.cleared)(R(o)),R(o));
ok("90 kg, no note, a medication record: no calorie deficit is suggested (target stays at maintenance)",(s=>s.blocked&&s.kcal===2500)(A.suggestTarget({...base,meds:2,tdee:2500,bmr:1800})),A.suggestTarget({...base,meds:2,tdee:2500,bmr:1800}));
ok("90 kg, no note, clean profile: calorie deficit (2010 kcal)",A.suggestTarget({...base,tdee:2500,bmr:1800}).kcal<2500);
const cl=d=>R({meds:1,clearedAt:d});
ok("confirmation today lifts the soft block",cl(T).cleared&&!cl(T).block&&cl(T).soft.length>0);
ok("confirmation is valid at 29 days, not at 30",cl("2026-09-04").cleared&&!cl("2026-09-03").cleared);
ok("a future, malformed or empty confirmation is invalid",!cl("2026-10-10").cleared&&!cl("2026-13-40x").cleared&&!cl("").cleared&&!cl(undefined).cleared&&!cl(5).cleared);
ok("confirmation does not lift a hard block",(r=>r.cleared&&r.block===r.hard[0])(R({age:16,meds:1,clearedAt:T})));
ok("lossBlock: a health note blocks, an empty profile does not",A.lossBlock({age:30,cm:175,kg:80,goalKg:70,healthNote:"var"})!==""&&A.lossBlock({age:30,cm:175,kg:80,goalKg:70})==="");
ok("lossBlock: age 16 and low goal BMI",A.lossBlock({age:16,cm:170,kg:80,goalKg:70})!==""&&A.lossBlock({age:30,cm:175,kg:80,goalKg:50})!=="");
ok("lossBlock uses the newer fields (meds, measurements, ed)",A.lossBlock({...base,meds:1})!==""&&A.lossBlock({...base,bpCount90d:1})!==""&&A.lossBlock({...base,edFlag:true})!=="");
ok("kidney/liver/dialysis keywords set kidney",R({healthNote:"böbrek yetmezliği"}).kidney&&R({healthNote:"diyalize giriyorum"}).kidney&&R({healthNote:"Karaciğer yağlanması"}).kidney);
// protein: adjusted weight, upper limits, doctor referral
const P=o=>A.protein({...base,...o});
ok("protein 140 kg/180 cm: 153-200 g with adjusted weight",JSON.stringify(P({kg:140,cm:180}).range)==="[153,200]",P({kg:140,cm:180}));
ok("protein 90 kg/175 cm (BMI under 30): unchanged 144-198",JSON.stringify(P({kg:90,cm:175}).range)==="[144,198]",P({kg:90,cm:175}));
ok("protein 55 kg/165 cm: unchanged 88-121",JSON.stringify(P({kg:55,cm:165,goalKg:0}).range)==="[88,121]",P({kg:55,cm:165,goalKg:0}));
ok("no height, 140 kg: 2.0 g/kg and a 200 g cap, lower <= upper (160-200)",JSON.stringify(P({kg:140,cm:0,goalKg:0}).range)==="[160,200]",P({kg:140,cm:0,goalKg:0}));
ok("no height, 70 kg: upper 2.0 g/kg (112-140)",JSON.stringify(P({kg:70,cm:0,goalKg:0}).range)==="[112,140]",P({kg:70,cm:0,goalKg:0}));
ok("kidney note: no range, decide with a doctor",(p=>!p.range&&p.doc)(P({healthNote:"böbrek hastalığım var"})));
ok("age 70 + medication: no range; age 70 clean: range",(p=>!p.range&&p.doc)(P({age:70,meds:1,clearedAt:T}))&&!!P({age:70}).range);
ok("hard block (under 18): no protein increase",(p=>!p.range&&p.doc)(P({age:16})));
ok("without weight there is neither a range nor a referral",(p=>!p.range&&!p.doc)(P({kg:0})));
for(const x of ["bebek bekliyorum","hamileyim","Hamileyim","HAMILEYIM","gebeyim","doğum yapacağım","dogum yapacagim","yemek yemeyi bırakıyorum","yemek yemeyi birakiyorum","kusuyorum","aç kalıyorum","ac kaliyorum"])
  ok("hard (extended pattern): "+x,R({healthNote:x,clearedAt:T}).hard.length>0,R({healthNote:x}));
for(const x of ["hamile değilim","hamile degilim","HAMILE DEGILIM","bebek beklemiyorum","doğum yapmayacağım","yemeyi bırakmıyorum","aç kalmıyorum","kusmuyorum","geberiyorum"])
  ok("not hard (negation or similar word): "+x,R({healthNote:x}).hard.length===0,R({healthNote:x}).hard);
ok("ASCII spelling: bobrek hastaligi sets kidney",R({healthNote:"bobrek hastaligim var"}).kidney);
finish();
