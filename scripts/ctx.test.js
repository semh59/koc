const {ok,finish}=require("./ok");
const C=require("../www/modules/coach/coachlib.js");
const days=[];
for(let i=1;i<=14;i++){const e=[3,4,9].includes(i),dd=String(i).padStart(2,"0");
  days.push(e?{d:"10-"+dd}:{d:"10-"+dd,kg:84.2-i/10,kcal:1700+i*10,p:110+i,water:1800,sport:i%3?30:0,ad:6000+i*100,sl:420,mo:3});}
const meds=[{n:"Metformin",d:"500 mg",t:["08:00","20:00"],a:{taken:10,total:14,missed:4,late:0},left:12},{n:"D vitamini",t:["09:00"],a:{taken:6,total:7,missed:1},left:30}];
const D=()=>({profile:{cm:175,age:34,sex:"m",act:1,note:"Hafif diyabet"},goals:{kg:75,kcal:1800,water:2500,sport:150},calc:{trendKg:84.1,slope:-0.6,tdee:2420,source:"data",target:2110,protein:[136,187],block:"x",why:"İlaç kaydın var"},days:days.map(r=>({...r})),today:["yemek: 2 yumurta ~150 kcal","su 500 ml"],now:"12:42",
  workouts:["10-05 Üst vücut: Bench 60x8, Row 50x10, Press 30x10","10-03 Bacak: Squat 80x6, RDL 70x8","10-01 İtiş: Bench 62x6"],weekSets:{göğüs:9,sırt:8,bacak:6},notes:["Bugün çok yorgundum, az uyudum","Akşam stres vardı","İyi bir gün, yürüyüş yaptım"],meds});
const SEC={"PROFİL":"PROFİL","SAĞLIK":"SAĞLIK NOTU","HEDEFLER":"HEDEFLER","HESAPLANAN":"HESAPLANAN","KISIT":"KISIT","14 GÜN":"SON 14 GÜN","BUGÜN":"BUGÜN","ANTRENMAN":"SON ANTRENMANLAR","SET":"BU HAFTA TAMAMLANAN SET","NOT":"SON NOTLAR","İLAÇ":"İLAÇLAR (kullanıcının"};
const has=(t,k)=>t.includes(SEC[k]);
const full=C.contextText(D());

const ALWAYS=["PROFİL","SAĞLIK","HEDEFLER","HESAPLANAN","KISIT","14 GÜN","BUGÜN"],OPT={"İLAÇ":["Metformin dozu kaç mg?","İlacımı unuttum","vitamin hatırlatıcısı","ağrı kesici alsam olur mu"],"ANTRENMAN":["Antrenmanım nasıldı?","bugün salon programı ne olsun","kaç km koşmalıyım"],"NOT":["Son notlarıma bak","ruh halim nasıl","uykum ve stresim?"]};
OPT["SET"]=OPT["ANTRENMAN"];
const OTHERS=["İLAÇ","ANTRENMAN","SET","NOT"];
for(const [k,qs] of Object.entries(OPT))for(const q of qs){
  const t=C.contextText(D(),q);
  ok(`"${q}" -> ${k} is included`,has(t,k));
  const grp=k==="SET"?["ANTRENMAN","SET"]:[k];
  ok(`"${q}" -> the other optional sections are not`,OTHERS.filter(o=>!grp.includes(o)&&(o!=="SET"||k!=="ANTRENMAN")&&(o!=="ANTRENMAN"||k!=="SET")).every(o=>!has(t,o)),t);
  ok(`"${q}" -> the safety sections are present`,ALWAYS.every(a=>has(t,a)));
}
ok("water question: no MEDS/WORKOUT/NOTE sections",OTHERS.every(o=>!has(C.contextText(D(),"bugün kaç ml su içtim"),o)));
ok("water question: the safety sections are present",ALWAYS.every(a=>has(C.contextText(D(),"bugün kaç ml su içtim"),a)));
ok("a medication name is enough (Metformin)",has(C.contextText(D(),"Metformin"),"İLAÇ")&&!has(C.contextText(D(),"Metformin"),"NOT"));
for(const q of [undefined,"","merhaba","ne yapayım?"])ok(`vague (${JSON.stringify(q)}) -> everything`,Object.keys(SEC).every(k=>has(C.contextText(D(),q),k)));
ok("a vague question gives the same output as no question",C.contextText(D(),"merhaba")===full);
ok("topic continuation: an earlier medication message plus \"peki dozu?\" brings the medication section",has(C.contextText(D(),["Metformin kullanıyorum","tamam","peki dozu?"].join("\n")),"İLAÇ"));
ok("no medications means no section (even when asked)",!has(C.contextText({...D(),meds:[]},"ilaç"),"İLAÇ")&&!C.contextText({...D(),meds:[]},"ilaç").includes("KULLANDIĞI İLAÇLAR"));
{ // medication safety: on every request one line with name+dose and the referral; details (times/adherence) only on a relevant question
  const line=t=>t.split("\n").find(l=>l.startsWith("KULLANDIĞI İLAÇLAR"))||"";
  const Q=[undefined,"bugün kaç ml su içtim","Antrenmanım nasıldı?","ruh halim nasıl","Haftalık menü hazırla, 7 gün","Haftada 3 gün, seans 45 dakika antrenman programı hazırla","Son 7 günümün yorumunu yaz","Bugünkü kayıtlarıma kısaca yorum yap"];
  ok("the medication line is present for every question type: name+dose, no interaction/dose advice, refer to doctor/pharmacist",Q.every(q=>{const l=line(C.contextText(D(),q));return l.includes("Metformin 500 mg")&&l.includes("D vitamini")&&/doz değişikliği önerme/.test(l)&&l.includes("hekime/eczacıya")}),Q.map(q=>line(C.contextText(D(),q))));
  ok("the medication line carries only name and dose (no times, adherence, stock)",!/08:00|20:00|alındı|stok|kaçırılan/.test(line(full)));
  ok("water/menu question: no medication details but the health note and KISIT are present",(t=>!has(t,"İLAÇ")&&t.includes("SAĞLIK NOTU")&&t.includes("KISIT:"))(C.contextText({...D(),calc:{...D().calc,block:"x",why:"İlaç kaydın var"}},"Haftalık menü hazırla")));
}

{ // empty-day merging: no filled day is lost
  const t=C.contextText(D(),"x"),rows=t.split("\n").filter(l=>/^10-\d\d \|/.test(l)),d=D();
  const full=d.days.filter(r=>r.kcal).map(r=>r.d);
  ok("every filled day stays as a row",full.every(x=>rows.some(l=>l.startsWith(x+" |"))),rows);
  ok("empty days are not rows, merged into one line",!rows.some(l=>/^10-0[349] /.test(l))&&/boş günler[^\n]*3, 4, 9/.test(t));
  const one=C.contextText({...D(),days:[{d:"10-01"},{d:"10-02",kg:80},{d:"10-03"}]},"x");
  ok("a day with only a weight is not empty; the table does not break when all days are empty",/10-02 \| 80/.test(one)&&/boş günler[^\n]*1, 3/.test(one)&&C.contextText({...D(),days:[{d:"10-01"}]},"x").includes("boş günler"));
}
{ const a=C.contextText(D(),"x");ok("empty-day merging keeps 11 filled day rows",a.length<full.length+1&&a.split("\n").filter(l=>/^10-\d\d \|/.test(l)).length===11)}
{ // program and menu requests get a short context; the chat context stays the same
  const d={...D(),calc:{...D().calc,block:"x",why:"İlaç kaydın var"}},chat=C.contextText(d,"Bugünü yorumla"),req="Haftada 3 gün, seans 45 dakika, ekipman Salon, seviye Orta için antrenman programı hazırla.";
  const prog=C.contextText(d,req,"prog"),menu=C.contextText(d,"7 günlük menü hazırla.","menu");
  for(const [n,t] of [["program",prog],["menü",menu]]){
    ok(n+": 14 gün tablosu, BUGÜN, notlar, ilaç ayrıntısı yok",!/SON 14 GÜN|BUGÜN:|SON NOTLAR|İLAÇLAR \(kullanıcının|saatler 08:00|^10-\d\d \|/m.test(t),t);
    ok(n+": profil, sağlık notu, hedef, hesaplanan, KISIT ve ilaç satırı var",["PROFİL: 175 cm, 30-34 yaş","SAĞLIK NOTU","HEDEFLER","HESAPLANAN","KISIT:","KULLANDIĞI İLAÇLAR (yalnız ad ve doz","Metformin 500 mg"].every(k=>t.includes(k)),t);
  }
  ok("program: recent workouts are present; menu: absent",prog.includes("SON ANTRENMANLAR")&&!menu.includes("SON ANTRENMANLAR")&&!menu.includes("TAMAMLANAN SET"));
  ok("chat context unchanged (14 days and TODAY are included)",chat.includes("SON 14 GÜN")&&chat.includes("BUGÜN:")&&chat===C.contextText(d,"Bugünü yorumla",undefined));
  ok("the short context is at most half of the chat context",prog.length<chat.length/2&&menu.length<chat.length/2,[prog.length,menu.length,chat.length]);
}
finish();
