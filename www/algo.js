"use strict";
/* Saf hesap fonksiyonları (DOM yok). Tarayıcıda global Algo, Node'da module.exports. */
const Algo=(()=>{
  const KCAL_PER_KG=7700;
  const AY3=["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  /* Uygulamanın tek tarih biçimi: "2 Eki", yıl istenirse "2 Eki 2026". CSV ISO kalır. */
  const fdate=(k,yr)=>`${+k.slice(8,10)} ${AY3[+k.slice(5,7)-1]}${yr?" "+k.slice(0,4):""}`;
  const dayNum=k=>Math.round(Date.UTC(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10))/864e5);
  const roundTo=(x,step)=>Math.round(x/step)*step;

  /* Kilo trendi: zaman duyarlı üstel ortalama (Hacker's Diet tarzı). Boş günler ağırlığı büyütür. */
  function trend(w,alpha=0.1){
    const ks=Object.keys(w).sort(),out={};let t=null,prev=null;
    for(const k of ks){
      const d=dayNum(k);
      if(t===null)t=w[k];
      else{const a=1-Math.pow(1-alpha,d-prev);t+=a*(w[k]-t)}
      prev=d;out[k]=t;
    }
    return out;
  }
  /* En küçük kareler doğrusu (ham tartılar). EWMA gecikmeli olduğu için hız hesabında kullanılmaz. */
  function ols(pts){
    const n=pts.length,mx=pts.reduce((s,p)=>s+p[0],0)/n,my=pts.reduce((s,p)=>s+p[1],0)/n;
    let sxy=0,sxx=0;for(const [x,y] of pts){sxy+=(x-mx)*(y-my);sxx+=(x-mx)*(x-mx)}
    return sxx?{m:sxy/sxx,b:my-sxy/sxx*mx}:null;
  }
  /* Bugünü tarayıcı verir (setClock); Koç tarihsiz çağırdığı için varsayılan gerekir. Saat yoksa pencere son tartıda biter (saf çağrı). */
  let clock=null;
  const setClock=f=>{clock=f};
  /* today verilirse son tartı 7 günden eskiyse bayat: aylar önceki eğim bugünü anlatmaz (InsightLib.plateau ile aynı kural). */
  function windowPts(w,days,today){
    const ks=Object.keys(w).sort();if(ks.length<2)return [];
    const last=dayNum(ks[ks.length-1]);
    if(today&&dayNum(today)-last>7)return [];
    return ks.filter(k=>last-dayNum(k)<days).map(k=>[dayNum(k),w[k]]);
  }
  /* Son `days` gün için kg/hafta. Varsayılan: en az 4 tartı ve 7 gün aralık. */
  function slopePerWeek(w,days=21,minPts=4,minSpan=7,today=clock&&clock()){
    const pts=windowPts(w,days,today);
    if(pts.length<minPts||pts[pts.length-1][0]-pts[0][0]<minSpan)return null;
    const f=ols(pts);return f?7*f.m:null;
  }
  /* Haftada bir tartılan da ölçülebilsin diye 28 gün, en az 3 tartı ve 14 gün yayılım; yetersizse null (lossKnown false). */
  const lossSlope=(w,today)=>slopePerWeek(w,28,3,14,today);
  const lossKnown=(w,today)=>lossSlope(w,today)!=null;
  function isLosing(w,today){const s=lossSlope(w,today);return s!=null&&s<-0.2}
  function bmrMifflin({kg,cm,age,sex}){
    return 10*kg+6.25*cm-5*age+(sex==="m"?5:sex==="f"?-161:-78);
  }
  const ACT=[1.3,1.45,1.6];
  function formulaTdee(p){return bmrMifflin(p)*(ACT[p.act==null?1:p.act]||1.45)}

  /* "Tam kayıtlı gün" tek tanım (haftalık rapor, Koç analizi, harcama tahmini): en az 800 kcal, formül harcaması biliniyorsa yarısından da fazla.
     Eksik girilmiş gün ortalamayı düşürür. */
  const fullKcal=(kcal,tdee)=>kcal>=Math.max(800,tdee>0?tdee*0.5:0);
  /* Kalori "ortalaması" yazılabilmesi için en az tam kayıtlı gün; tek günlük 700 kcal ortalama değildir. */
  const MIN_AVG_DAYS=3;
  /* Uyarlanabilir harcama: ortalama alım − (trend değişimi × 7700 / gün).
     intake: {gün: kcal}; yalnızca tam kayıtlı günler sayılır, bugün yarım olduğundan hiçbir zaman. */
  function adaptiveTdee({weights,intake,profile,window=28,today=clock&&clock()}){
    const f=profile&&profile.cm&&profile.age?formulaTdee(profile):null;
    const t=trend(weights),ks=Object.keys(t).sort();
    if(!ks.length)return {tdee:f,source:f?"formül":null,confidence:0,formula:f,est:null};
    const lastDay=dayNum(ks[ks.length-1]);
    const inWin=k=>lastDay-dayNum(k)<window&&lastDay-dayNum(k)>=0;
    const days=Object.keys(intake).filter(k=>inWin(k)&&fullKcal(intake[k],f)&&!(today&&k>=today));
    const pts=windowPts(weights,window);
    let est=null,conf=0;
    if(days.length>=10&&pts.length>=4){
      const span=pts[pts.length-1][0]-pts[0][0],fit=ols(pts);
      if(span>=10&&fit){
        const avgIn=days.reduce((s,k)=>s+intake[k],0)/days.length;
        est=avgIn-fit.m*KCAL_PER_KG; // m: kg/gün
        conf=Math.min(1,days.length/21);
        if(f)est=Math.min(f*1.3,Math.max(f*0.7,est));
      }
    }
    if(est==null)return {tdee:f,source:f?"formül":null,confidence:0,formula:f,est:null};
    const tdee=f?conf*est+(1-conf)*f:est;
    return {tdee,source:conf>=0.99?"veri":"veri+formül",confidence:conf,formula:f,est};
  }

  /* Trend ekranının tek hızı ve tek tahmini: son 21 günün eğimi (kg/hafta) sürerse hedefe kaç hafta; yön ters, hız ~0, hedef yok ya da hedefte ise weeks null. */
  function goalEta(w,goalKg,today){
    const ks=Object.keys(w).sort(),slope=slopePerWeek(w,21,4,7,today);
    if(!ks.length)return {slope:null,weeks:null};
    const wk=etaWeeks(trend(w)[ks[ks.length-1]],goalKg,slope);
    return {slope,weeks:wk>0?wk:null};
  }
  /* Güvenlik freni (kalori açığı, oruç, yüksek protein) tek kaynak. hard onayla kalkmaz; soft "Hekimime danıştım" (clearedAt) günü dahil 30 gün kalkar.
     Anahtar, Türkçe olumsuzlamada ("hamile değilim", "emzirmiyorum", "kusmadım", "böbrek sorunum yok") sayılmaz; not doluysa yine soft kalır.
     Metin ASCII'ye indirilir (ı→i, ğ→g...), kalıplar ASCII yazılır: "degilim", "HAMILEYIM" gibi aksansız yazım da aynı sonucu verir. */
  const low=s=>String(s||"").replace(/İ/g,"i").replace(/I/g,"ı").toLowerCase().replace(/ı/g,"i").replace(/ğ/g,"g").replace(/ş/g,"s").replace(/ç/g,"c").replace(/ö/g,"o").replace(/ü/g,"u");
  const ED=/yeme bozuklu|anoreksi|bulimi|tikinma|yemeyi birak|ac kal(?=iyor)|kus(?=ma|uyor|tur|ar|tu)/g,PREG=/hamile|gebe(?!r)|emzir|lohusa|bebek bekl(?=iyor|eyen)|bebegim olacak|dogum yapaca|anne adayi/g,KIDNEY=/bobrek|diyaliz|karaciger|siroz/g,
    CHRONIC=/diyabet|seker hasta|insulin|bobrek|diyaliz|karaciger|siroz|kalp|tiroid|guatr|epilep|kanser|kemoterapi|tansiyon/g;
  function said(t,re){
    for(const m of t.matchAll(re)){
      const rest=t.slice(m.index+m[0].length),suf=rest.match(/^[^\s,.;:!?]*/)[0];
      const next=rest.slice(suf.length).split(/[,.;:!?\n]/)[0].trim().split(/\s+/).slice(0,2);
      if(!/^(m[iu]yor|m[ae](d[iu]|z|m[iu]s|y[ae]c))/.test(suf)&&!next.some(w=>/^(degil|yok|olmayan|olmad|hayir)|m[iu]yor|m[ae]d[iu]/.test(w)))return true;
    }
    return false;
  }
  const dateOk=s=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(dayNum(s));
  function riskFlags({age,cm,kg,goalKg,healthNote,meds,glucoseCount90d,bpCount90d,edFlag,clearedAt,today}){
    const t=low(healthNote).trim(),bmi=x=>x>0&&cm>0?x/Math.pow(cm/100,2):null,n=Array.isArray(meds)?meds.length:meds>0?meds:0;
    const ed=!!edFlag||said(t,ED),pregnant=said(t,PREG),hard=[],soft=[];
    if(age>0&&age<18)hard.push("18 yaş altındasın");
    if(ed)hard.push("Yeme düzeniyle ilgili bir işaret var");
    if(pregnant)hard.push("Sağlık notunda hamilelik ya da emzirme geçiyor");
    if(bmi(kg)!=null&&bmi(kg)<18.5)hard.push("Kilon boyuna göre düşük (BMI 18,5 altı)");
    if(goalKg>0&&bmi(goalKg)!=null&&bmi(goalKg)<18.5)hard.push("Hedef kilo boyuna göre çok düşük (BMI 18,5 altı)");
    if(t)soft.push(said(t,CHRONIC)?"Sağlık notunda hekim takibi gerektiren bir durum geçiyor":"Sağlık notun var");
    if(n)soft.push("İlaç kaydın var");
    if(glucoseCount90d>0)soft.push("Son 90 günde şeker ölçümün var");
    if(bpCount90d>0)soft.push("Son 90 günde tansiyon ölçümün var");
    const d=dateOk(clearedAt)&&dateOk(today)?dayNum(today)-dayNum(clearedAt):-1,cleared=d>=0&&d<30;
    return {hard,soft,cleared,kidney:said(t,KIDNEY),pregnant,ed,meds:n,block:hard[0]||(!cleared&&soft[0])||""};
  }
  /* Kalori açığının güvenli olmadığı durumun nedeni, yoksa "". Eski çağrılar health:boolean geçer. */
  const lossBlock=o=>riskFlags({...o,healthNote:o.healthNote!=null?o.healthNote:o.health?"var":""}).block;

  /* Güvenli günlük alt sınır: erkek 1500, diğerleri (kadın, belirtmeyen) 1200; BMR bunun üstündeyse BMR. */
  const kcalFloor=(sex,bmr)=>Math.max(sex==="m"?1500:1200,bmr||0);
  /* Elle girilen günlük hedefin reddedilme nedeni, uygunsa "". 18 yaş altı hiç; sert engel ya da onaysız yumuşak engelde bakım düzeyinin altı
     (tdee biliniyorsa); her durumda cinsiyete göre tabanın altı. */
  function manualKcal({kcal,sex,bmr,tdee,age,block}){
    if(age>0&&age<18)return "18 yaş altına kalori hedefi belirlenmez";
    const keep=Math.round(tdee/10)*10;
    if(block&&keep>0&&kcal<keep)return `${block}. Kalori açığı hedefi koymuyorum; en az ${keep} kcal (bakım düzeyi) gir ya da hekimine danış`;
    const fl=Math.round(kcalFloor(sex,bmr)/10)*10;
    return kcal<fl?`Günlük hedef en az ${fl} kcal olabilir; daha düşüğü için hekimine danış`:"";
  }
  /* İlk tartıda libre/kg karışıklığı: boy biliniyorsa BMI 45 üstü, yoksa 160 kg üstü şüphelidir. */
  const lbSuspect=(kg,cm)=>cm>0?kg/Math.pow(cm/100,2)>=45:kg>=160;
  /* Hedef önerisi. Kullanıcı onaylamadan uygulanmaz. o: riskFlags girdisi + tdee, bmr, sex. */
  function suggestTarget(o){
    const {tdee,kg,goalKg,bmr}=o;
    if(!tdee||!kg)return null;
    let rate=0,kcal=tdee,note="Bakım",blocked="";
    if(goalKg>0&&goalKg<kg-0.2){
      blocked=lossBlock(o);
      if(!blocked){rate=-Math.min(0.005*kg,0.75);note="Kilo verme"}
    }
    else if(goalKg>kg+0.2){rate=0.0025*kg;note="Kilo alma"}
    kcal=tdee+rate*KCAL_PER_KG/7;
    let limited=false;
    if(rate<0){
      const floor=Math.max(kcalFloor(o.sex,bmr),tdee*0.75);
      if(kcal<floor){kcal=floor;limited=true;rate=(kcal-tdee)*7/KCAL_PER_KG}
    }
    return {kcal:Math.round(kcal/10)*10,rateKgWk:rate,limited,note,blocked};
  }
  function etaWeeks(trendNow,goal,slope){
    if(slope==null||!(goal>0))return null;
    const d=goal-trendNow;
    if(Math.abs(d)<0.2)return 0;
    if(Math.abs(slope)<0.05||Math.sign(slope)!==Math.sign(d))return null;
    const w=d/slope;return w>104?null:Math.ceil(w);
  }
  /* Adım istatistiği. vals: eskiden yeniye günlük toplamlar. Ortalama yalnız kayıtlı (>0) günlerden; seri: hedefi art arda geçen gün,
     bugün henüz hedefin altındaysa seri bozulmuş sayılmaz, dünden geriye sayılır. */
  function stepStats(vals,goal){
    const rec=vals.filter(v=>v>0);
    let best=-1;vals.forEach((v,i)=>{if(v>0&&(best<0||v>vals[best]))best=i});
    let i=vals.length-1;if(i>=0&&vals[i]<goal)i--;
    let streak=0;while(i>=0&&vals[i]>=goal){streak++;i--}
    return {n:rec.length,avg:rec.length?rec.reduce((a,b)=>a+b,0)/rec.length:0,best,hit:vals.filter(v=>v>=goal).length,streak};
  }
  /* Vücut ölçüleri (cm): geçersizi atar, aynı gün+bölgede sonuncuyu tutar, en yeni 400. Girdiyi değiştirmez. */
  const MEASURES=["waist","hip","chest","arm","thigh"];
  function cleanMeasures(raw){
    const m=new Map();
    for(const x of Array.isArray(raw)?raw:[])
      if(x&&MEASURES.includes(x.k)&&typeof x.day==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x.day)&&typeof x.v==="number"&&x.v>=20&&x.v<=250)m.set(x.day+x.k,{day:x.day,k:x.k,v:Math.round(x.v*10)/10});
    return [...m.values()].sort((a,b)=>a.day<b.day?-1:a.day>b.day?1:0).slice(-400);
  }
  const whtr=(waist,cm)=>waist>0&&cm>0?waist/cm:null;
  /* Net aktivite enerjisi (dinlenme hariç): (MET−1)×kg×saat. MotionMath.kcal ile aynı tanım; BMR zaten TDEE'de. kg yoksa ya da süre 0 ise null. */
  const netKcal=(met,kg,min)=>kg>0&&min>0?Math.round(Math.max(0,met-1)*kg*min/60):null;
  /* Ağırlık antrenmanı: yoğunluk set/dk. Unutulan seans şişmesin diye süre en çok set×4 dk sayılır; MET 3,5 / 5 / 6. */
  function gymKcal({min,sets,kg}){
    if(!(sets>0&&min>0))return null;
    const eff=Math.min(min,sets*4),rate=sets/eff;
    return netKcal(rate<0.3?3.5:rate<0.4?5:6,kg,eff);
  }
  /* Elle hareket (yürüyüş w / koşu r / bisiklet b): mesafe MotionMath'in adım uzunluğu modelinden: boy önseli × GPS ile öğrenilmiş kişisel ölçek f
     (MotionPlugin.status fw/fr; 0,7-1,3 dışı ya da yoksa 1),
     MET Compendium tablosundan hızla; bisiklette adım anlamsız, mesafe yok. Ritim 40-220 adım/dk dışındaysa adım güvenilmez sayılır. */
  const interp=(x,y,v)=>{if(v<=x[0])return y[0];for(let i=1;i<x.length;i++)if(v<=x[i])return y[i-1]+(y[i]-y[i-1])*(v-x[i-1])/(x[i]-x[i-1]);return y[y.length-1]};
  const WK=[3.2,4,4.8,5.6,6.4,7.2,8],WM=[2.8,3,3.5,4.3,5,7,8.3],RK=[8,9.7,11.3,12.9,14.5,16.1],RM=[8.3,9.8,11,11.8,12.8,14.5];
  function moveSummary({kind,min,steps,cm,kg,f}){
    let km=null,kmh=null;
    if(kind!=="b"&&min>0&&steps>0&&cm>=120&&cm<=230){
      const cad=steps/min;
      if(cad>=40&&cad<=220){km=steps*cm/100*(kind==="r"?0.40+0.0017*cad:0.30+0.0010*cad)*(f>=0.7&&f<=1.3?f:1)/1000;kmh=km*60/min}
    }
    const met=kind==="b"?6.8:kind==="r"?(kmh?interp(RK,RM,kmh):9.8):(kmh?kmh>8?interp(RK,RM,kmh):interp(WK,WM,kmh):3.5);
    return {km:km==null?null:Math.round(km*100)/100,kmh,met,kcal:netKcal(met,kg,min)};
  }
  /* Yarım kalan yürüyüş: başlangıç geçerli ve 24 saatten yeni değilse korunur. */
  function cleanWalk(raw,now){
    const n=(v,lo,hi)=>typeof v==="number"&&isFinite(v)&&v>=lo&&v<=hi;
    if(!raw||!n(raw.t0,1,now+6e4)||now-raw.t0>864e5)return null;
    return {t0:raw.t0,s0:n(raw.s0,0,2e5)?raw.s0:null,t1:n(raw.t1,raw.t0+1,now+6e4)?raw.t1:null,s1:n(raw.s1,0,2e5)?raw.s1:null};
  }
  /* Bir günün kayıtlı hareket enerjisi (net kcal), adım dahil değil: hareket düzeyi çarpanı günlük adımı zaten içerir.
     spor: {day, time: bitiş "SS:DD", v: dk, kcal, text, bt}; moves: {day, k, t0: başlangıç, min, kcal}. Spor aralığı [bitiş−süre, bitiş]; aynı aralığa düşen otomatik hareket
     aynı çıkıştır, ikinci kez sayılmaz. Aralıklar mutlak dakikayla karşılaştırılır, çünkü gece yarısını aşan yürüyüşün otomatik kaydı başlangıç gününde, elle kaydı bitiş gününde durur:
     spor ve moves komşu günleri de içerebilir, yalnız `day` günündekiler toplanır. bt (geçmiş güne girilmiş) kayıtta saat kayıt anıdır, aralık bilinmez:
     o gün adı aynı türle (Yürüyüş/Koşu) başlayan otomatik hareket sayılmaz. */
  function exerciseKcal(spor,moves,day){
    const at=(d,t)=>dayNum(d||day||"1970-01-01")*1440+ +t.slice(0,2)*60+ +t.slice(3),own=x=>!day||!x.day||x.day===day;
    const iv=spor.filter(s=>s.v>0&&!s.bt).map(s=>{const e=at(s.day,s.time);return [e-s.v,e]});
    const kinds=new Set(spor.filter(s=>s.bt&&own(s)).map(s=>/^Yürüyüş/.test(s.text)?"w":/^Koşu/.test(s.text)?"r":""));
    let k=spor.reduce((a,s)=>a+(own(s)&&s.kcal>0?s.kcal:0),0);
    for(const m of moves){
      if(!own(m)||!(m.kcal>0)||kinds.has(m.k))continue;
      const a=at(m.day,m.t0),b=a+m.min;
      if(!iv.some(([c,d])=>a<d&&c<b))k+=m.kcal;
    }
    return k;
  }
  /* Hedefe eklenecek kısım: yakılanın yarısı (tahmin hatalı, TDEE'de zaten ortalama hareket var), en çok 800, asla negatif: hedefi yalnız artırır. */
  const moveBonus=(kcal,pct=0.5)=>kcal>0?Math.min(800,Math.round(kcal*pct)):0;
  /* Protein 1,6-2,2 g/kg: BMI≥30'da ayarlı ağırlık (BMI 25 ağırlığı + fazlanın %25'i), boy yoksa üst 2,0 g/kg, her durumda üst 200 g.
     Böbrek/karaciğer anahtarı, sert engel ya da 65+ yaşta ilaç/yumuşak engel varsa aralık yok: hekimle belirlenir. o: riskFlags girdisi. */
  const PROTEIN_NOTE="Böbrek ya da karaciğer sorunun varsa hekimine danış.";
  function protein(o){
    if(!(o.kg>0))return {range:null,doc:false};
    const r=riskFlags(o),{kg,cm}=o;
    if(r.kidney||r.hard.length||o.age>=65&&(r.meds||r.soft.length))return {range:null,doc:true};
    const w25=cm>0?25*Math.pow(cm/100,2):0,b=w25&&kg>=w25*1.2?w25+0.25*(kg-w25):kg;
    const hi=Math.min(Math.round(2.2*b),cm>0?200:Math.min(Math.round(2*kg),200));
    return {range:[Math.min(Math.round(1.6*b),Math.round(0.8*hi)),hi],doc:false};
  }

  /* Salon */
  function est1RM(kg,reps){
    if(!(reps>0)||reps>20)return 0;
    if(!(kg>0))return 0;
    return reps===1?kg:kg*(1+reps/30); // Epley
  }
  function volume(sets){return sets.reduce((s,x)=>s+(x.done!==false&&!x.w&&x.reps>0?(x.kg||0)*x.reps:0),0)}
  const PLATES=[25,20,15,10,5,2.5,1.25];
  /* Bir tarafa en az plaka; tam tutmazsa made hedefin altındaki en yakın yapılabilir ağırlık. inv büyükten küçüğe sıralı.
     Düzenlenmiş plaka setinde ([15,10] gibi) açgözlü yöntem 20'yi yapamaz, bu yüzden 0,25 kg birimlerinde küçük bir DP. */
  function plates(total,bar=20,inv=PLATES){
    const rest=(total-bar)/2,side=[];
    if(!(rest>=0))return {side,made:bar};
    const U=p=>Math.round(p*4),cap=Math.floor(rest*4+1e-9),best=[0];
    for(let u=1;u<=cap;u++){best[u]=Infinity;for(const p of inv)if(U(p)<=u&&best[u-U(p)]+1<best[u])best[u]=best[u-U(p)]+1}
    let u=cap;while(best[u]===Infinity)u--;
    for(let r=u;r>0;){const p=inv.find(x=>U(x)<=r&&best[r-U(x)]===best[r]-1);side.push(p);r-=U(p)}
    return {side,made:bar+2*side.reduce((a,b)=>a+b,0)};
  }
  /* Boş bar × 10, sonra hedefin %40/60/80'i; yapılabilir plakaya yuvarlanır, bar altı ve tekrar eden atılır. */
  function warmup(target,bar=20,inv=PLATES){
    const out=[];
    for(const [f,reps] of [[0,10],[0.4,5],[0.6,3],[0.8,1]]){
      const kg=f?target*f:bar;
      if(kg<bar)continue;
      const made=plates(kg,bar,inv).made;
      if(made<target&&!out.some(x=>x.kg===made))out.push({kg:made,reps});
    }
    return out;
  }
  /* Çift ilerleme: tüm setler üst tekrara çıkınca ağırlık artır, değilse aynı ağırlıkta +1 tekrar.
     prev: önceki seansların setleri (yeniden eskiye). Aynı ağırlıkta üst üste 2 seans alt tekrarın altında kalınırsa %10 düşürme önerilir;
     son 3 seansta tahmini 1TM artmadıysa deload notu eklenir (yalnız ağırlık artırılmıyorsa). Isınma setleri hiçbir hesaba girmez. */
  function nextTarget(sets,{lo=8,hi=12,inc=2.5,prev=[]}={}){
    const work=a=>a.filter(x=>x.reps>0&&!x.w),top=a=>{const kg=Math.max(...a.map(x=>x.kg||0));return {kg,min:Math.min(...a.filter(x=>(x.kg||0)===kg).map(x=>x.reps))}};
    const s=work(sets);if(!s.length)return null;
    const {kg,min:minReps}=top(s);
    if(kg===0)return {kg:0,reps:minReps+1,why:"Bir tekrar fazla dene"};
    if(minReps>=hi)return {kg:roundTo(kg+inc,0.25),reps:lo,why:"Tüm setlerde üst tekrara ulaştın, ağırlığı artır"};
    const p=prev.map(work).filter(a=>a.length),p1=p[0]&&top(p[0]);
    if(minReps<lo&&p1&&p1.kg===kg&&p1.min<lo){
      const d=roundTo(kg*0.9,inc);
      return {kg:d<kg?d:Math.max(0,kg-inc),reps:lo,why:"Son 2 seans hedefin altında, %10 düşür"};
    }
    const r={kg,reps:Math.min(hi,minReps+1),why:"Aynı ağırlıkta bir tekrar fazla dene"};
    if(p.length>=2){
      const best=a=>Math.max(...a.map(x=>est1RM(x.kg||0,x.reps)));
      const old=best(p[1]);
      if(old>0&&best(s)<=old+0.05&&best(p[0])<=old+0.05)r.note="Son 3 seansta gelişme görünmüyor. İstersen bu hafta ağırlığı %10 azaltıp dinlenme haftası (deload) deneyebilirsin.";
    }
    return r;
  }
  return {KCAL_PER_KG,dayNum,fdate,trend,slopePerWeek,setClock,fullKcal,MIN_AVG_DAYS,kcalFloor,manualKcal,lbSuspect,bmrMifflin,formulaTdee,adaptiveTdee,suggestTarget,riskFlags,lossBlock,etaWeeks,isLosing,lossKnown,goalEta,protein,PROTEIN_NOTE,exerciseKcal,moveBonus,moveSummary,cleanWalk,netKcal,gymKcal,MEASURES,cleanMeasures,whtr,stepStats,est1RM,volume,nextTarget,roundTo,plates,warmup};
})();
if(typeof module!=="undefined")module.exports=Algo;
