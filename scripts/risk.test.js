const A=require("../www/kernel/algo.js");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const T="2026-10-03",base={age:35,cm:175,kg:90,goalKg:80,healthNote:"",meds:0,glucoseCount90d:0,bpCount90d:0,edFlag:false,clearedAt:"",today:T};
const R=o=>A.riskFlags({...base,...o});
ok("temiz profil: engel yok",(r=>!r.hard.length&&!r.soft.length&&!r.block)(R({})),R({}));
// sert engeller: onayla kalkmaz
for(const [n,o] of [["18 yaş altı",{age:16}],["BMI<18,5",{kg:55,cm:180,goalKg:50}],["hedef BMI<18,5",{goalKg:55}],["sohbet ed bayrağı",{edFlag:true}],
  ["notta yeme bozukluğu",{healthNote:"Yeme bozukluğu geçmişim var"}],["notta anoreksiya",{healthNote:"anoreksiya tedavisi gördüm"}],["notta kusma",{healthNote:"yedikten sonra kusuyorum"}],
  ["HAMİLE büyük harf",{healthNote:"HAMİLEYİM"}],["gebelik",{healthNote:"gebeliğin 3. ayı"}],["emziriyorum",{healthNote:"Emziriyorum"}],["lohusa",{healthNote:"lohusayım"}]])
  ok("sert: "+n,(r=>r.hard.length>0&&!!r.block&&r.block===r.hard[0])(R({...o,clearedAt:T})),R({...o,clearedAt:T}));
ok("hamilelik ve ed işaretleri ayrı bayrak",R({healthNote:"hamileyim"}).pregnant&&!R({healthNote:"hamileyim"}).ed&&R({edFlag:true}).ed);
// olumsuzlama: sert değil ama not dolu olduğu için yumuşak
for(const t of ["hamile değilim","Hamile değilim, emzirmiyorum","gebelik yok","yeme bozukluğu yok","hiç kusmadım","insülin kullanmıyorum, böbrek sorunum yok"]){
  const r=R({healthNote:t});ok("olumsuz not sert engel değil: "+t,!r.hard.length&&r.soft.length>0&&!r.pregnant&&!r.kidney,r);
}
ok("aynı notta olumsuz ve olumlu: 'diyabet yok, hamileyim' sert",R({healthNote:"diyabet yok, hamileyim"}).pregnant);
// eski onboarding notu ikisini birden içerir: sert kabul edilir (gerekçe nota yönlendirir)
ok("eski onboarding notu sert",R({healthNote:"Hamilelik, yeme bozukluğu geçmişi ya da hekim kontrolü (ilk kurulumda işaretlendi)"}).hard.length>0);
// yumuşak engeller ve onay
for(const [n,o] of [["sağlık notu",{healthNote:"Tansiyon"}],["ilaç kaydı",{meds:1}],["şeker ölçümü",{glucoseCount90d:3}],["tansiyon ölçümü",{bpCount90d:1}],["kronik anahtar",{healthNote:"Tip 2 diyabet"}]])
  ok("yumuşak: "+n,(r=>!r.hard.length&&r.soft.length>0&&!!r.block&&!r.cleared)(R(o)),R(o));
ok("90 kg, notsuz, ilaç kaydı varsa kalori açığı önerilmez (hedef bakımda)",(s=>s.blocked&&s.kcal===2500)(A.suggestTarget({...base,meds:2,tdee:2500,bmr:1800})),A.suggestTarget({...base,meds:2,tdee:2500,bmr:1800}));
ok("90 kg, notsuz, temiz profil: kalori açığı (2010 kcal)",A.suggestTarget({...base,tdee:2500,bmr:1800}).kcal<2500);
const cl=d=>R({meds:1,clearedAt:d});
ok("onay bugün: yumuşak kalkar",cl(T).cleared&&!cl(T).block&&cl(T).soft.length>0);
ok("onay 29 gün önce geçerli, 30 gün önce değil",cl("2026-09-04").cleared&&!cl("2026-09-03").cleared);
ok("gelecek tarihli, bozuk ya da boş onay geçersiz",!cl("2026-10-10").cleared&&!cl("2026-13-40x").cleared&&!cl("").cleared&&!cl(undefined).cleared&&!cl(5).cleared);
ok("onay sert engeli kaldırmaz",(r=>r.cleared&&r.block===r.hard[0])(R({age:16,meds:1,clearedAt:T})));
ok("lossBlock: sağlık notu engeller, boş profil engellemez",A.lossBlock({age:30,cm:175,kg:80,goalKg:70,healthNote:"var"})!==""&&A.lossBlock({age:30,cm:175,kg:80,goalKg:70})==="");
ok("lossBlock: yaş 16 ve düşük hedef BMI",A.lossBlock({age:16,cm:170,kg:80,goalKg:70})!==""&&A.lossBlock({age:30,cm:175,kg:80,goalKg:50})!=="");
ok("lossBlock yeni alanları kullanır (ilaç, ölçüm, ed)",A.lossBlock({...base,meds:1})!==""&&A.lossBlock({...base,bpCount90d:1})!==""&&A.lossBlock({...base,edFlag:true})!=="");
ok("böbrek/karaciğer/diyaliz anahtarı kidney",R({healthNote:"böbrek yetmezliği"}).kidney&&R({healthNote:"diyalize giriyorum"}).kidney&&R({healthNote:"Karaciğer yağlanması"}).kidney);
// protein: ayarlı ağırlık, üst sınırlar, hekim yönlendirmesi
const P=o=>A.protein({...base,...o});
ok("protein 140 kg/180 cm: ayarlı ağırlıkla 153-200 g (eski 224-308)",JSON.stringify(P({kg:140,cm:180}).range)==="[153,200]",P({kg:140,cm:180}));
ok("protein 90 kg/175 cm (BMI<30): değişmez 144-198",JSON.stringify(P({kg:90,cm:175}).range)==="[144,198]",P({kg:90,cm:175}));
ok("protein 55 kg/165 cm: değişmez 88-121",JSON.stringify(P({kg:55,cm:165,goalKg:0}).range)==="[88,121]",P({kg:55,cm:165,goalKg:0}));
ok("boy yok 140 kg: 2,0 g/kg ve 200 g tavanı, alt ≤ üst (160-200)",JSON.stringify(P({kg:140,cm:0,goalKg:0}).range)==="[160,200]",P({kg:140,cm:0,goalKg:0}));
ok("boy yok 70 kg: üst 2,0 g/kg (112-140)",JSON.stringify(P({kg:70,cm:0,goalKg:0}).range)==="[112,140]",P({kg:70,cm:0,goalKg:0}));
ok("böbrek notu: aralık yok, hekimle belirle",(p=>!p.range&&p.doc)(P({healthNote:"böbrek hastalığım var"})));
ok("yaş 70 + ilaç: aralık yok; yaş 70 temiz: aralık var",(p=>!p.range&&p.doc)(P({age:70,meds:1,clearedAt:T}))&&!!P({age:70}).range);
ok("sert engel (18 yaş altı): protein yükseltme yok",(p=>!p.range&&p.doc)(P({age:16})));
ok("kilo yoksa aralık da yönlendirme de yok",(p=>!p.range&&!p.doc)(P({kg:0})));
for(const x of ["bebek bekliyorum","hamileyim","Hamileyim","HAMILEYIM","gebeyim","doğum yapacağım","dogum yapacagim","yemek yemeyi bırakıyorum","yemek yemeyi birakiyorum","kusuyorum","aç kalıyorum","ac kaliyorum"])
  ok("sert (genişletilmiş kalıp): "+x,R({healthNote:x,clearedAt:T}).hard.length>0,R({healthNote:x}));
for(const x of ["hamile değilim","hamile degilim","HAMILE DEGILIM","bebek beklemiyorum","doğum yapmayacağım","yemeyi bırakmıyorum","aç kalmıyorum","kusmuyorum","geberiyorum"])
  ok("sert değil (olumsuzlama/benzer sözcük): "+x,R({healthNote:x}).hard.length===0,R({healthNote:x}).hard);
ok("ASCII yazım: bobrek hastaligi böbrek anahtarı",R({healthNote:"bobrek hastaligim var"}).kidney);
process.exit(bad?1:0);
