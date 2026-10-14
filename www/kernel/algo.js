"use strict";
/* Pure calculations (no DOM). Global Algo in the browser, module.exports in Node. */
const Algo=(()=>{
  const KCAL_PER_KG=7700;
  const AY3=["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  /* The app's only display date format: "2 Eki", with year "2 Eki 2026". CSV stays ISO. */
  const fdate=(k,yr)=>`${+k.slice(8,10)} ${AY3[+k.slice(5,7)-1]}${yr?" "+k.slice(0,4):""}`;
  const dayNum=k=>Math.round(Date.UTC(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10))/864e5);
  const roundTo=(x,step)=>Math.round(x/step)*step;
  /* The one validator pair for stored days (strict: rejects 2026-02-31) and HH:MM times. */
  const dayOk=s=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&new Date(s+"T00:00Z").toJSON()?.slice(0,10)===s;
  const timeOk=s=>typeof s==="string"&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s);

  /* Weight trend: time-aware exponential average (Hacker's Diet style); a gap gives the next weigh-in more weight. */
  const TREND_ALPHA=0.1;
  function trend(w){
    const ks=Object.keys(w).sort(),out={};let t=null,prev=null;
    for(const k of ks){
      const d=dayNum(k);
      if(t===null)t=w[k];
      else{const a=1-Math.pow(1-TREND_ALPHA,d-prev);t+=a*(w[k]-t)}
      prev=d;out[k]=t;
    }
    return out;
  }
  /* Least-squares line through raw weigh-ins; the EWMA lags, so it is not used for rates. */
  function ols(pts){
    const n=pts.length,mx=pts.reduce((s,p)=>s+p[0],0)/n,my=pts.reduce((s,p)=>s+p[1],0)/n;
    let sxy=0,sxx=0;for(const [x,y] of pts){sxy+=(x-mx)*(y-my);sxx+=(x-mx)*(x-mx)}
    if(!sxx)return null;
    const m=sxy/sxx,b=my-m*mx;
    let rss=0;for(const [x,y] of pts){const e=y-(b+m*x);rss+=e*e}
    return {m,b,se:n>2?Math.sqrt(rss/(n-2)/sxx):null,df:n-2};
  }
  /* Two-sided 80% Student t for 1..30 degrees of freedom (1.282 beyond). */
  const T80=[3.078,1.886,1.638,1.533,1.476,1.44,1.415,1.397,1.383,1.372,1.363,1.356,1.35,1.345,1.341,1.337,1.333,1.33,1.328,1.325,1.323,1.321,1.319,1.318,1.316,1.315,1.314,1.313,1.311,1.31];
  const t80=df=>df>=1?T80[Math.min(df,30)-1]||1.282:null;
  /* The browser supplies today (setClock) because the Coach calls without a date; without a clock the window ends at the last weigh-in (pure call). */
  let clock=null;
  const setClock=f=>{clock=f};
  /* With today given, a last weigh-in older than 7 days is stale: a slope from months ago says nothing about now (same rule as InsightLib.plateau). */
  function windowPts(w,days,today){
    const ks=Object.keys(w).sort();if(ks.length<2)return [];
    const last=dayNum(ks[ks.length-1]);
    if(today&&dayNum(today)-last>7)return [];
    const pts=[];
    for(let i=ks.length-1;i>=0;i--){const d=dayNum(ks[i]);if(last-d>=days)break;pts.push([d,w[ks[i]]])}
    return pts.reverse();
  }
  /* kg/week over the last `days` days; by default needs at least 4 weigh-ins spanning 7 days. */
  function slopePerWeek(w,days=21,minPts=4,minSpan=7,today=clock&&clock()){
    const pts=windowPts(w,days,today);
    if(pts.length<minPts||pts[pts.length-1][0]-pts[0][0]<minSpan)return null;
    const f=ols(pts);return f?7*f.m:null;
  }
  /* 28 days, 3 weigh-ins spanning 14 days, so weekly weighers qualify; null when too little data (lossKnown false). */
  const lossSlope=(w,today)=>slopePerWeek(w,28,3,14,today);
  const lossKnown=(w,today)=>lossSlope(w,today)!=null;
  function isLosing(w,today){const s=lossSlope(w,today);return s!=null&&s<-0.2}
  function bmrMifflin({kg,cm,age,sex}){
    return 10*kg+6.25*cm-5*age+(sex==="m"?5:sex==="f"?-161:-78);
  }
  const ACT=[1.3,1.45,1.6];
  /* Activity triage: job (0 seated, 1 on feet, 2 physical) + daily walking (0 <5k steps, 1 5-9k, 2 10k+) -> 0 low, 1 medium, 2 high.
     Planned workouts are not counted (gym and exercise entries are added separately) so nothing is counted twice. */
  const actFromTriage=(job,walk)=>{const t=job+walk;return t<=1?0:t<=3?1:2};
  function formulaTdee(p){return bmrMifflin(p)*(ACT[p.act==null?1:p.act]||1.45)}

  /* The one definition of a fully logged day (weekly report, Coach analysis, expenditure estimate): at least 800 kcal, and more than half the formula
     expenditure when known. A half-logged day would drag averages down. */
  const LOW_LOG_KCAL=800;
  const fullKcal=(kcal,tdee)=>kcal>=Math.max(LOW_LOG_KCAL,tdee>0?tdee*0.5:0);
  /* Fully logged days needed before a calorie "average" is shown; one 700 kcal day is not an average. */
  const MIN_AVG_DAYS=3;
  /* Adaptive expenditure: average intake - (trend change x 7700 / days).
     intake: {day: kcal}; only fully logged days count, never today because it is incomplete. */
  const TDEE_WINDOW=28;
  function adaptiveTdee({weights,intake,profile,today=clock&&clock()}){
    const f=profile&&profile.cm&&profile.age?formulaTdee(profile):null;
    const t=trend(weights),ks=Object.keys(t).sort();
    if(!ks.length)return {tdee:f,source:f?"formül":null,confidence:0,formula:f,est:null};
    const lastDay=dayNum(ks[ks.length-1]);
    if(today&&dayNum(today)-lastDay>TDEE_WINDOW)return {tdee:f,source:f?"formül":null,confidence:0,formula:f,est:null}; // weights this old say nothing about now
    const inWin=k=>lastDay-dayNum(k)<TDEE_WINDOW&&lastDay-dayNum(k)>=0;
    const days=Object.keys(intake).filter(k=>inWin(k)&&fullKcal(intake[k],f)&&!(today&&k>=today));
    const pts=windowPts(weights,TDEE_WINDOW);
    let est=null,conf=0;
    if(days.length>=10&&pts.length>=4){
      const span=pts[pts.length-1][0]-pts[0][0],fit=ols(pts);
      if(span>=10&&fit){
        const avgIn=days.reduce((s,k)=>s+intake[k],0)/days.length;
        est=avgIn-fit.m*KCAL_PER_KG; // m: kg/day
        conf=Math.min(1,days.length/21);
        if(f)est=Math.min(f*1.3,Math.max(f*0.7,est));
      }
    }
    if(est==null)return {tdee:f,source:f?"formül":null,confidence:0,formula:f,est:null};
    const tdee=f?conf*est+(1-conf)*f:est;
    return {tdee,source:conf>=0.99?"veri":"veri+formül",confidence:conf,formula:f,est};
  }

  /* The Trend screen's single rate and single estimate: weeks to the goal if the last 21 days' slope (kg/week) continues; weeks is null when the direction
     is wrong, the rate is ~0, there is no goal or it is reached. */
  function goalEta(w,goalKg,today){
    const ks=Object.keys(w).sort(),slope=slopePerWeek(w,21,4,7,today);
    if(!ks.length)return {slope:null,weeks:null};
    const now=trend(w)[ks[ks.length-1]],wk=etaWeeks(now,goalKg,slope);
    return {slope,weeks:wk>0?wk:null,range:wk>0?etaRange(w,now,goalKg,today):null};
  }
  /* Weeks to the goal as an 80% range from the slope's standard error. The fast end is capped at the app's own safe rate. Null (the screen says "cannot be estimated")
     when either end of the slope is ~0 or points the wrong way, the slow end passes 104 weeks, or the slow end is more than 2.5 times the fast end. */
  function etaRange(w,now,goalKg,today){
    const f=ols(windowPts(w,21,today));if(!f||f.se==null)return null;
    const d=goalKg-now,t=t80(f.df);if(!t||Math.abs(d)<0.2)return null;
    const cap=d<0?Math.min(0.005*now,0.75):0.0025*now*2;
    const a=7*(f.m-t*f.se),b=7*(f.m+t*f.se),sg=Math.sign(d),ends=[a,b].map(s=>s*sg).filter(x=>x>0);
    if(ends.length<2||Math.min(...ends)<0.05)return null;
    const slow=Math.min(...ends);
    if(slow>=cap)return null; // already faster than the safe rate: no date is promised
    const fast=Math.min(Math.max(...ends),cap);
    const lo=Math.ceil(Math.abs(d)/fast),hi=Math.ceil(Math.abs(d)/slow);
    return hi>104||hi>lo*2.5?null:[lo,Math.max(lo,hi)];
  }
  /* Safety brake (calorie deficit, fasting, high protein): the single source. A hard block cannot be confirmed away; a soft one is lifted for 30 days
     (including the day itself) by "Hekimime danıştım" (clearedAt).
     A keyword does not count when negated in Turkish ("hamile değilim", "emzirmiyorum", "kusmadım", "böbrek sorunum yok"); a non-empty note still stays soft.
     Text is folded to ASCII (ı->i, ğ->g...) and the patterns are written in ASCII, so "degilim" or "HAMILEYIM" without accents give the same result. */
  const low=s=>String(s||"").replace(/İ/g,"i").replace(/I/g,"ı").toLowerCase().replace(/ı/g,"i").replace(/ğ/g,"g").replace(/ş/g,"s").replace(/ç/g,"c").replace(/ö/g,"o").replace(/ü/g,"u");
  const ED=/yeme bozuklu|anoreksi|bulimi|tikinma|yemeyi birak|ac kal(?=iyor)|kus(?=ma|uyor|tur|ar|tu)/g,PREG=/hamile|gebe(?!r)|bebek bekl(?=iyor|eyen)|bebegim olacak|dogum yapaca|anne adayi/g,NURS=/emzir|lohusa/g,KIDNEY=/bobrek|diyaliz|karaciger|siroz/g,
    CHRONIC=/diyabet|seker hasta|insulin|bobrek|diyaliz|karaciger|siroz|kalp|tiroid|guatr|epilep|kanser|kemoterapi|tansiyon/g;
  function said(t,re){
    for(const m of t.matchAll(re)){
      const rest=t.slice(m.index+m[0].length),suf=rest.match(/^[^\s,.;:!?]*/)[0];
      const next=rest.slice(suf.length).split(/[,.;:!?\n]/)[0].trim().split(/\s+/).slice(0,2);
      if(!/^(m[iu]yor|m[ae](d[iu]|z|m[iu]s|y[ae]c))/.test(suf)&&!(/^(degil|yok|olmayan|olmad|hayir|m[iu]yor|m[ae]d[iu])/.test(next[0]||"")||/^(degil|yok)/.test(next[1]||"")))return true;
    }
    return false;
  }
  function riskFlags({age,cm,kg,goalKg,healthNote,meds,glucoseCount90d,bpCount90d,edFlag,pregnant:pf,nursing:nf,off,clearedAt,today}){
    const t=low(healthNote).trim(),bmi=x=>x>0&&cm>0?x/Math.pow(cm/100,2):null,n=Array.isArray(meds)?meds.length:meds>0?meds:0;
    const lifted=String(off||""),ed=!!edFlag||said(t,ED),hard=[],soft=[];
    /* A lifted flag also silences the note text, so "hamileyim" in an old note does not bring it back. */
    const pregnant=!lifted.includes("preg")&&(!!pf||said(t,PREG)),nursing=!lifted.includes("nurs")&&(!!nf||said(t,NURS));
    if(age>0&&age<18)hard.push("18 yaş altındasın");
    if(ed)hard.push("Yeme düzeniyle ilgili bir işaret var");
    if(pregnant)hard.push("Hamilelik işareti var");
    if(nursing)hard.push("Emzirme işareti var");
    if(bmi(kg)!=null&&bmi(kg)<18.5)hard.push("Kilon boyuna göre düşük (BMI 18,5 altı)");
    if(goalKg>0&&bmi(goalKg)!=null&&bmi(goalKg)<18.5)hard.push("Hedef kilo boyuna göre çok düşük (BMI 18,5 altı)");
    if(t)soft.push(said(t,CHRONIC)?"Sağlık notunda hekim takibi gerektiren bir durum geçiyor":"Sağlık notun var");
    if(n)soft.push("İlaç kaydın var");
    if(glucoseCount90d>0)soft.push("Son 90 günde şeker ölçümün var");
    if(bpCount90d>0)soft.push("Son 90 günde tansiyon ölçümün var");
    const d=dayOk(clearedAt)&&dayOk(today)?dayNum(today)-dayNum(clearedAt):-1,cleared=d>=0&&d<30;
    return {hard,soft,cleared,kidney:said(t,KIDNEY),pregnant,nursing,ed,meds:n,block:hard[0]||(!cleared&&soft[0])||""};
  }
  /* Why a calorie deficit is unsafe, or "". */
  const lossBlock=o=>riskFlags(o).block;

  /* Safe daily floor: 1200 only when the sex is known to be female, 1500 otherwise (men, unspecified); the BMR when it is higher. */
  const kcalFloor=(sex,bmr)=>Math.max(sex==="f"?1200:1500,bmr||0);
  /* Why a hand-entered daily target is rejected, or "". Never for under 18; below maintenance (when tdee is known) under a hard block or an unconfirmed
     soft one; below the sex-based floor always. */
  function manualKcal({kcal,sex,bmr,tdee,age,block}){
    if(age>0&&age<18)return "18 yaş altına kalori hedefi belirlenmez";
    const keep=Math.round(tdee/10)*10;
    if(block&&keep>0&&kcal<keep)return `${block}. Kalori açığı hedefi koymuyorum; en az ${keep} kcal (bakım düzeyi) gir ya da hekimine danış`;
    const fl=Math.round(kcalFloor(sex,bmr)/10)*10;
    return kcal<fl?`Günlük hedef en az ${fl} kcal olabilir; daha düşüğü için hekimine danış`:"";
  }
  /* The trend falls faster than 1% of body weight per week (21-day slope). */
  function fastLoss(w,today){
    const s=slopePerWeek(w,21,4,7,today),ks=Object.keys(w).sort();
    return s!=null&&ks.length>0&&-s>0.01*trend(w)[ks[ks.length-1]];
  }
  /* Why a goal weight is not accepted or shown, or "". The BMI check needs the height. Below BMI 18.5 only a gain from the current weight passes. */
  function goalWhy(goalKg,cm,kg){
    if(!(goalKg>0))return "";
    if(!(cm>0))return "Hedef kilo için önce boyunu gir; boy-kilo oranı (BMI) buna göre kontrol edilir";
    return goalKg/Math.pow(cm/100,2)<18.5&&!(kg>0&&goalKg>=kg)?"Bu hedef kilo boyuna göre çok düşük (BMI 18,5 altı). Hekimine ya da diyetisyenine danış":"";
  }
  /* Pound/kilogram mix-up on the first weigh-in: suspicious above BMI 45 when the height is known, above 160 kg otherwise. */
  const lbSuspect=(kg,cm)=>cm>0?kg/Math.pow(cm/100,2)>=45:kg>=160;
  /* Target suggestion, never applied without the user's confirmation. o: riskFlags input + tdee, bmr, sex. */
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
  /* Step statistics. vals: daily totals, oldest first. The average uses logged (>0) days only; the streak is consecutive days at or above the goal,
     and a today still below the goal does not break it (counting starts from yesterday). */
  function stepStats(vals,goal){
    const rec=vals.filter(v=>v>0);
    let best=-1;vals.forEach((v,i)=>{if(v>0&&(best<0||v>vals[best]))best=i});
    let i=vals.length-1;if(i>=0&&vals[i]<goal)i--;
    let streak=0;while(i>=0&&vals[i]>=goal){streak++;i--}
    return {n:rec.length,avg:rec.length?rec.reduce((a,b)=>a+b,0)/rec.length:0,best,hit:vals.filter(v=>v>=goal).length,streak};
  }
  /* Body measurements (cm): drops invalid ones, keeps the last per day+site, newest 20,000. Does not mutate the input. */
  const MEASURES=["waist","hip","chest","arm","thigh","fat"],MEASURES_MAX=20000;
  /* Allowed value per measure: centimetres 20-250, body fat percent 3-70. */
  const measureRange=k=>k==="fat"?[3,70]:[20,250];
  function cleanMeasures(raw){
    const m=new Map();
    for(const x of Array.isArray(raw)?raw:[])
      if(x&&MEASURES.includes(x.k)&&dayOk(x.day)&&typeof x.v==="number"&&x.v>=measureRange(x.k)[0]&&x.v<=measureRange(x.k)[1])m.set(x.day+x.k,{day:x.day,k:x.k,v:Math.round(x.v*10)/10});
    return [...m.values()].sort((a,b)=>a.day<b.day?-1:a.day>b.day?1:0).slice(-MEASURES_MAX);
  }
  const whtr=(waist,cm)=>waist>0&&cm>0?waist/cm:null;
  /* Net activity energy (resting excluded): (MET-1) x kg x hours. Same definition as MotionMath.kcal; the BMR is already in the TDEE. Null without kg or with 0 minutes. */
  const netKcal=(met,kg,min)=>kg>0&&min>0?Math.round(Math.max(0,met-1)*kg*min/60):null;
  /* Weight training: intensity in sets/min. Duration counts at most sets x 4 min so a forgotten session does not inflate; MET 3.5 / 5 / 6. */
  function gymKcal({min,sets,kg}){
    if(!(sets>0&&min>0))return null;
    const eff=Math.min(min,sets*4),rate=sets/eff;
    return netKcal(rate<0.3?3.5:rate<0.4?5:6,kg,eff);
  }
  /* Manual movement (walk w / run r / bike b): distance from MotionMath's stride model: height prior x the personal scale f learned from GPS
     (MotionPlugin.status fw/fr; 1 when absent or outside 0.7-1.3); MET from the Compendium table by speed. Steps mean nothing on a bike, so no distance.
     A cadence outside 40-220 steps/min makes the step count untrustworthy. */
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
  /* An unfinished walk is kept if its start is valid and under 24 hours old. */
  function cleanWalk(raw,now){
    const n=(v,lo,hi)=>typeof v==="number"&&isFinite(v)&&v>=lo&&v<=hi;
    if(!raw||!n(raw.t0,1,now+6e4)||now-raw.t0>864e5)return null;
    return {t0:raw.t0,s0:n(raw.s0,0,2e5)?raw.s0:null,t1:n(raw.t1,raw.t0+1,now+6e4)?raw.t1:null,s1:n(raw.s1,0,2e5)?raw.s1:null};
  }
  /* Recorded movement energy of one day (net kcal), steps excluded: the activity-level multiplier already contains daily steps.
     exercise: {day, time: end "HH:MM", v: min, kcal, text, bt}; moves: {day, k, t0: start, min, kcal}. An exercise spans [end - duration, end]; an automatic move
     inside the same span is the same outing and is not counted twice. Spans are compared in absolute minutes because a walk past midnight is stored on its
     start day when automatic and on its end day when manual: both lists may hold neighbouring days, only those on `day` are summed. For a bt entry (logged
     for a past day) the time is the logging moment and the span is unknown: automatic moves of the same kind (Yürüyüş/Koşu) that day are skipped. */
  function exerciseKcal(exercise,moves,day){
    const at=(d,t)=>dayNum(d||day||"1970-01-01")*1440+ +t.slice(0,2)*60+ +t.slice(3),own=x=>!day||!x.day||x.day===day;
    const iv=exercise.filter(s=>s.v>0&&!s.bt).map(s=>{const e=at(s.day,s.time);return [e-s.v,e]});
    const kinds=new Set(exercise.filter(s=>s.bt&&own(s)).map(s=>/^Yürüyüş/.test(s.text)?"w":/^Koşu/.test(s.text)?"r":""));
    let k=exercise.reduce((a,s)=>a+(own(s)&&s.kcal>0?s.kcal:0),0);
    for(const m of moves){
      if(!own(m)||!(m.kcal>0)||kinds.has(m.k))continue;
      const a=at(m.day,m.t0),b=a+m.min;
      if(!iv.some(([c,d])=>a<d&&c<b))k+=m.kcal;
    }
    return k;
  }
  /* Added to the target: half of what was burned (estimates are rough and the TDEE already holds average movement), at most 800, never negative, so it only raises the target. */
  const moveBonus=kcal=>kcal>0?Math.min(800,Math.round(kcal*0.5)):0;
  /* Protein 1.6-2.2 g/kg: at BMI>=30 on an adjusted weight (the BMI 25 weight + 25% of the excess), 2.0 g/kg upper bound without a height, 200 g at most.
     No range with a kidney/liver keyword, a hard block, or at 65+ with medication or a soft block: the doctor sets it. o: riskFlags input. */
  const PROTEIN_NOTE="Böbrek ya da karaciğer sorunun varsa hekimine danış.";
  function protein(o){
    if(!(o.kg>0))return {range:null,doc:false};
    const r=riskFlags(o),{kg,cm}=o;
    if(r.kidney||r.hard.length||o.age>=65&&(r.meds||r.soft.length))return {range:null,doc:true};
    const w25=cm>0?25*Math.pow(cm/100,2):0,b=w25&&kg>=w25*1.2?w25+0.25*(kg-w25):kg;
    const hi=Math.min(Math.round(2.2*b),cm>0?200:Math.min(Math.round(2*kg),200));
    return {range:[Math.min(Math.round(1.6*b),Math.round(0.8*hi)),hi],doc:false};
  }

  /* Gym */
  function est1RM(kg,reps){
    if(!(reps>0)||reps>20)return 0;
    if(!(kg>0))return 0;
    return reps===1?kg:kg*(1+reps/30); // Epley
  }
  function volume(sets){return sets.reduce((s,x)=>s+(x.done!==false&&!x.w&&x.reps>0?(x.kg||0)*x.reps:0),0)}
  const PLATES=[25,20,15,10,5,2.5,1.25];
  /* Fewest plates per side; when the target is not exact, made is the nearest achievable weight below it. inv is sorted largest first.
     With a custom plate set (such as [15,10]) the greedy method cannot make 20, hence a small DP in 0.25 kg units. */
  function plates(total,bar=20,inv=PLATES){
    const rest=(total-bar)/2,side=[];
    if(!(rest>=0))return {side,made:bar};
    const U=p=>Math.round(p*4),cap=Math.floor(rest*4+1e-9),best=[0];
    for(let u=1;u<=cap;u++){best[u]=Infinity;for(const p of inv)if(U(p)<=u&&best[u-U(p)]+1<best[u])best[u]=best[u-U(p)]+1}
    let u=cap;while(best[u]===Infinity)u--;
    for(let r=u;r>0;){const p=inv.find(x=>U(x)<=r&&best[r-U(x)]===best[r]-1);side.push(p);r-=U(p)}
    return {side,made:bar+2*side.reduce((a,b)=>a+b,0)};
  }
  /* Empty bar x 10, then 40/60/80% of the target, rounded to achievable plates; sets below the bar and duplicates are dropped. */
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
  /* Double progression: raise the weight once all sets reach the upper reps, otherwise +1 rep at the same weight.
     prev: sets of earlier sessions, newest first. Two sessions in a row below the lower reps at the same weight suggest a 10% drop;
     after a break of LONG_BREAK_DAYS or more the first sets start 10% lighter instead of progressing;
     with hard=true (the user rated a top set 9.5 or harder) reaching the upper reps keeps the weight instead of raising it;
     a deload note is added when the estimated 1RM did not improve over the last 3 sessions (only when the weight is not being raised). Warm-up sets never count. */
  const LONG_BREAK_DAYS=14;
  function nextTarget(sets,{lo=8,hi=12,inc=2.5,prev=[],gapDays=0,hard=false}={}){
    const work=a=>a.filter(x=>x.reps>0&&!x.w),top=a=>{const kg=Math.max(...a.map(x=>x.kg||0));return {kg,min:Math.min(...a.filter(x=>(x.kg||0)===kg).map(x=>x.reps))}};
    const s=work(sets);if(!s.length)return null;
    const {kg,min:minReps}=top(s);
    if(kg===0)return {kg:0,reps:minReps+1,why:"Bir tekrar fazla dene"};
    if(gapDays>=LONG_BREAK_DAYS){
      const d=roundTo(kg*0.9,inc);
      return {kg:d<kg?d:Math.max(0,kg-inc),reps:Math.min(hi,Math.max(lo,minReps)),why:`Uzun ara verdin (${gapDays} gün), ilk setlerde %10 hafif başla`};
    }
    if(minReps>=hi&&hard)return {kg,reps:hi,why:"Üst tekrara ulaştın ama zorlandın, bu sefer aynı ağırlıkta kal"};
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
  /* A4 page in pixels at 150 dpi, with its margin: the canvas size of every PDF report. */
  const PAGE={w:1240,h:1754,m:70};
  return {PAGE,dayOk,timeOk,KCAL_PER_KG,ACT,actFromTriage,dayNum,fdate,trend,slopePerWeek,setClock,fullKcal,LOW_LOG_KCAL,MIN_AVG_DAYS,kcalFloor,manualKcal,goalWhy,fastLoss,lbSuspect,bmrMifflin,formulaTdee,adaptiveTdee,suggestTarget,riskFlags,lossBlock,etaWeeks,lossSlope,isLosing,lossKnown,goalEta,protein,PROTEIN_NOTE,exerciseKcal,moveBonus,moveSummary,cleanWalk,netKcal,gymKcal,MEASURES,measureRange,cleanMeasures,whtr,stepStats,est1RM,volume,nextTarget,roundTo,plates,warmup};
})();
if(typeof module!=="undefined")module.exports=Algo;
