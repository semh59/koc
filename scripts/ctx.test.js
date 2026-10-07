const C=require("../www/coachlib.js");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const days=[];
for(let i=1;i<=14;i++){const e=[3,4,9].includes(i),dd=String(i).padStart(2,"0");
  days.push(e?{d:"10-"+dd}:{d:"10-"+dd,kg:84.2-i/10,kcal:1700+i*10,p:110+i,su:1800,sport:i%3?30:0,ad:6000+i*100,sl:420,mo:3});}
const meds=[{n:"Metformin",d:"500 mg",t:["08:00","20:00"],a:{taken:10,total:14,missed:4,late:0},left:12},{n:"D vitamini",t:["09:00"],a:{taken:6,total:7,missed:1},left:30}];
const D=()=>({profile:{cm:175,age:34,sex:"m",act:1,note:"Hafif diyabet"},goals:{kg:75,kcal:1800,water:2500,sport:150},calc:{trendKg:84.1,slope:-0.6,tdee:2420,source:"veri",target:2110,protein:[136,187],block:"x",why:"İlaç kaydın var"},days:days.map(r=>({...r})),today:["yemek: 2 yumurta ~150 kcal","su 500 ml"],now:"12:42",
  workouts:["10-05 Üst vücut: Bench 60x8, Row 50x10, Press 30x10","10-03 Bacak: Squat 80x6, RDL 70x8","10-01 İtiş: Bench 62x6"],weekSets:{göğüs:9,sırt:8,bacak:6},notes:["Bugün çok yorgundum, az uyudum","Akşam stres vardı","İyi bir gün, yürüyüş yaptım"],meds});
const SEC={"PROFİL":"PROFİL","SAĞLIK":"SAĞLIK NOTU","HEDEFLER":"HEDEFLER","HESAPLANAN":"HESAPLANAN","KISIT":"KISIT","14 GÜN":"SON 14 GÜN","BUGÜN":"BUGÜN","ANTRENMAN":"SON ANTRENMANLAR","SET":"BU HAFTA TAMAMLANAN SET","NOT":"SON NOTLAR","İLAÇ":"İLAÇLAR (kullanıcının"};
const parts=t=>t.split(/\n(?=[A-ZÇĞİÖŞÜ ]{3,}[ :(])/);
const has=(t,k)=>t.includes(SEC[k]);
const full=C.contextText(D());
console.log("ÖLÇÜM SYSTEM: "+C.SYSTEM.length+" | contextText(hepsi): "+full.length);
for(const p of parts(full))console.log("ÖLÇÜM "+p.split(/[:(]/)[0].slice(0,24)+": "+p.length);
console.log("ÖLÇÜM toplam sistem metni: "+(C.SYSTEM.length+full.length)+" | su sorusu: "+(C.SYSTEM.length+C.contextText(D(),"bugün kaç ml su içtim").length));

const ALWAYS=["PROFİL","SAĞLIK","HEDEFLER","HESAPLANAN","KISIT","14 GÜN","BUGÜN"],OPT={"İLAÇ":["Metformin dozu kaç mg?","İlacımı unuttum","vitamin hatırlatıcısı","ağrı kesici alsam olur mu"],"ANTRENMAN":["Antrenmanım nasıldı?","bugün salon programı ne olsun","kaç km koşmalıyım"],"NOT":["Son notlarıma bak","ruh halim nasıl","uykum ve stresim?"]};
OPT["SET"]=OPT["ANTRENMAN"];
const OTHERS=["İLAÇ","ANTRENMAN","SET","NOT"];
for(const [k,qs] of Object.entries(OPT))for(const q of qs){
  const t=C.contextText(D(),q);
  ok(`"${q}" -> ${k} gider`,has(t,k));
  const grp=k==="SET"?["ANTRENMAN","SET"]:[k];
  ok(`"${q}" -> diğer isteğe bağlı bölümler gitmez`,OTHERS.filter(o=>!grp.includes(o)&&(o!=="SET"||k!=="ANTRENMAN")&&(o!=="ANTRENMAN"||k!=="SET")).every(o=>!has(t,o)),t);
  ok(`"${q}" -> güvenlik bölümleri var`,ALWAYS.every(a=>has(t,a)));
}
ok("su sorusu: İLAÇ/ANTRENMAN/NOT yok",OTHERS.every(o=>!has(C.contextText(D(),"bugün kaç ml su içtim"),o)));
ok("su sorusu: güvenlik bölümleri var",ALWAYS.every(a=>has(C.contextText(D(),"bugün kaç ml su içtim"),a)));
ok("ilaç adı geçmesi yeter (Metformin)",has(C.contextText(D(),"Metformin"),"İLAÇ")&&!has(C.contextText(D(),"Metformin"),"NOT"));
for(const q of [undefined,"","merhaba","ne yapayım?"])ok(`belirsiz (${JSON.stringify(q)}) -> hepsi`,Object.keys(SEC).every(k=>has(C.contextText(D(),q),k)));
ok("belirsiz çıktı soru verilmeyenle aynı",C.contextText(D(),"merhaba")===full);
ok("konu devamı: önceki ilaç mesajı + 'peki dozu?' ilaç bölümünü getirir",has(C.contextText(D(),["Metformin kullanıyorum","tamam","peki dozu?"].join("\n")),"İLAÇ"));
ok("ilaç yoksa bölüm de yok (soruluyor olsa bile)",!has(C.contextText({...D(),meds:[]},"ilaç"),"İLAÇ")&&!C.contextText({...D(),meds:[]},"ilaç").includes("KULLANDIĞI İLAÇLAR"));
{ // ilaç güvenliği: budamadan bağımsız her istekte tek satır ad+doz ve yönlendirme; ayrıntı (saat/uyum) yalnız ilgili soruda
  const line=t=>t.split("\n").find(l=>l.startsWith("KULLANDIĞI İLAÇLAR"))||"";
  const Q=[undefined,"bugün kaç ml su içtim","Antrenmanım nasıldı?","ruh halim nasıl","Haftalık menü hazırla, 7 gün","Haftada 3 gün, seans 45 dakika antrenman programı hazırla","Son 7 günümün yorumunu yaz","Bugünkü kayıtlarıma kısaca yorum yap"];
  ok("ilaç satırı her soru türünde var: ad+doz, etkileşim/doz önerme, hekime/eczacıya yönlendir",Q.every(q=>{const l=line(C.contextText(D(),q));return l.includes("Metformin 500 mg")&&l.includes("D vitamini")&&/doz değişikliği önerme/.test(l)&&l.includes("hekime/eczacıya")}),Q.map(q=>line(C.contextText(D(),q))));
  ok("ilaç satırı yalnız ad ve doz taşır (saat, uyum, stok yok)",!/08:00|20:00|alındı|stok|kaçırılan/.test(line(full)));
  ok("su/menü sorusunda ilaç ayrıntısı yok ama sağlık notu ve KISIT var",(t=>!has(t,"İLAÇ")&&t.includes("SAĞLIK NOTU")&&t.includes("KISIT:"))(C.contextText({...D(),calc:{...D().calc,block:"x",why:"İlaç kaydın var"}},"Haftalık menü hazırla")));
}

{ // boş gün birleştirme: hiçbir dolu gün kaybolmaz
  const t=C.contextText(D(),"x"),rows=t.split("\n").filter(l=>/^10-\d\d \|/.test(l)),d=D();
  const full=d.days.filter(r=>r.kcal).map(r=>r.d);
  ok("dolu günlerin hepsi satır olarak durur",full.every(x=>rows.some(l=>l.startsWith(x+" |"))),rows);
  ok("boş günler satırda yok, tek satırda birleşik",!rows.some(l=>/^10-0[349] /.test(l))&&/boş günler[^\n]*3, 4, 9/.test(t));
  const one=C.contextText({...D(),days:[{d:"10-01"},{d:"10-02",kg:80},{d:"10-03"}]},"x");
  ok("yalnız kilosu olan gün boş sayılmaz; tüm günler boşsa tablo çökmez",/10-02 \| 80/.test(one)&&/boş günler[^\n]*1, 3/.test(one)&&C.contextText({...D(),days:[{d:"10-01"}]},"x").includes("boş günler"));
}
{ const a=C.contextText(D(),"x");ok("boş gün birleştirme bağlamı kısaltır",a.length<full.length+1&&a.split("\n").filter(l=>/^10-\d\d \|/.test(l)).length===11)}
console.log(bad?`\n${bad} başarısız`:"\nTamam");process.exit(bad?1:0);
