"use strict";
/* Strong and Hevy CSV import (no DOM, never touches S). read: text -> raw workouts; plan: raw workouts + library matcher -> workouts and new exercises in the shape cleanGym accepts.
   No text from the file is interpreted as HTML or a formula: names and notes only lose control characters and get truncated, and the UI writes them through esc(). */
const ImportLib=(()=>{
  const LB=0.45359237,MAX_NEW=100,MAX_ROWS=200000,KG_MAX=1000,REPS_MAX=200,SEC_MAX=7200;
  const clean=(s,n)=>String(s==null?"":s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,"").trim().slice(0,n);
  const hnorm=h=>String(h).toLowerCase().replace(/[^a-z0-9]/g,"");
  /* The delimiter is the most frequent one outside quotes in the first record. An unclosed quote means a corrupt file. */
  function parse(text){
    text=text.replace(/^\uFEFF/,"");
    if(text.slice(0,4096).includes("\0"))throw new Error("Dosya metin değil");
    const cnt={",":0,";":0,"\t":0};let q=false;
    for(let i=0;i<text.length;i++){const c=text[i];if(c==='"')q=!q;else if(!q){if(c==="\n")break;if(c in cnt)cnt[c]++}}
    const d=Object.keys(cnt).reduce((a,b)=>cnt[b]>cnt[a]?b:a,",");
    const rows=[];let row=[],f="",inQ=false,any=false;
    const end=()=>{row.push(f);f="";if(row.length>1||row[0].trim()!=="")rows.push(row);row=[];any=false};
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(inQ){if(c==='"'){if(text[i+1]==='"'){f+='"';i++}else inQ=false}else f+=c}
      else if(c==='"'&&f==="")inQ=true,any=true;
      else if(c===d){row.push(f);f="";any=true}
      else if(c==="\n"||c==="\r"){if(c==="\r"&&text[i+1]==="\n")i++;end()}
      else{f+=c;any=true}
      if(rows.length>MAX_ROWS)throw new Error("Dosya çok büyük");
    }
    if(inQ)throw new Error("Tırnak kapanmıyor, dosya bozuk");
    if(any||f!==""||row.length)end();
    return rows;
  }
  /* With both separators the last one is the decimal ("1.234,5" TR, "1,234.5" EN); a repeated single separator is a thousands mark; a single comma is a decimal. */
  const num=v=>{
    if(v==null)return null;let s=String(v).trim();if(!s)return null;
    const c=s.lastIndexOf(","),d=s.lastIndexOf(".");
    if(c>=0&&d>=0)s=c>d?s.replace(/\./g,"").replace(",","."):s.replace(/,/g,"");
    else if(c>=0)s=s.indexOf(",")===c?s.replace(",","."):s.replace(/,/g,"");
    else if(s.indexOf(".")!==d)s=s.replace(/\./g,"");
    return /^-?(\d+\.?\d*|\.\d+)$/.test(s)?Number(s):null;
  };
  const MON={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
  /* Local time: the workout day comes from the local calendar, like the app's dayKey. */
  function stamp(s){
    s=String(s||"").trim();let m,y,mo,d,H=0,M=0,S=0;
    if((m=/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(s))){y=+m[1];mo=+m[2]-1;d=+m[3];H=+(m[4]||0);M=+m[5]||0;S=+m[6]||0}
    else if((m=/^(\d{1,2}) ([A-Za-z]{3})[A-Za-z]* (\d{4}),? (\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(s))&&m[2].toLowerCase()in MON){d=+m[1];mo=MON[m[2].toLowerCase()];y=+m[3];H=+m[4];M=+m[5];S=+m[6]||0}
    else return null;
    const t=new Date(y,mo,d,H,M,S);
    if(t.getFullYear()!==y||t.getMonth()!==mo||t.getDate()!==d||y<1990||y>2100||H>23||M>59)return null;
    const p=n=>String(n).padStart(2,"0");
    return {t:t.getTime(),day:`${y}-${p(mo+1)}-${p(d)}`};
  }
  /* "1h 5m", "45m", "1h 5m 30s", "01:05:00" or plain seconds. */
  function duration(s){
    s=String(s||"").trim();if(!s)return null;
    if(/^\d+$/.test(s))return +s*1000;
    let m=/^(\d+):(\d{2})(?::(\d{2}))?$/.exec(s);
    if(m)return m[3]!=null?((+m[1]*60+ +m[2])*60+ +m[3])*1000:(+m[1]*60+ +m[2])*1000;
    m=/^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m(?:in)?)?\s*(?:(\d+)\s*s)?$/i.exec(s);
    return m&&(m[1]||m[2]||m[3])?((+m[1]||0)*3600+(+m[2]||0)*60+(+m[3]||0))*1000:null;
  }
  const idx=head=>{const m={};head.forEach((h,i)=>{const k=hnorm(h);if(!(k in m))m[k]=i});return m};
  const col=(m,...ks)=>{for(const k of ks)if(k in m)return m[k];return -1};
  /* Raw workout: {day,t0,t1,name,ex:[{name,note,sets:[{kg,reps,sec,dist,w,rpe}]}]}. unit is asked only for Strong files whose header has no unit. */
  function read(text,{unit="kg"}={}){
    const rows=parse(text);
    if(rows.length<2)throw new Error("Dosyada başlık ve veri satırı yok");
    const m=idx(rows[0]);
    const hevy=col(m,"exercisetitle")>=0&&col(m,"starttime")>=0,strong=col(m,"exercisename")>=0&&col(m,"date")>=0;
    if(!hevy&&!strong)throw new Error(`Biçim tanınmadı. Strong ya da Hevy CSV dosyası bekleniyor; bulunan sütunlar: ${rows[0].slice(0,8).map(h=>clean(h,20)).join(", ")}`);
    const c=hevy?{
      date:col(m,"starttime"),end:col(m,"endtime"),name:col(m,"title"),dur:-1,ex:col(m,"exercisetitle"),ord:col(m,"settype"),
      w:col(m,"weightkg","weightlbs","weightlb"),reps:col(m,"reps"),dist:col(m,"distancekm","distancemiles","distancemi"),sec:col(m,"durationseconds"),
      note:col(m,"exercisenotes"),rpe:col(m,"rpe"),ss:col(m,"supersetid")
    }:{
      date:col(m,"date"),end:-1,name:col(m,"workoutname"),dur:col(m,"duration"),ex:col(m,"exercisename"),ord:col(m,"setorder"),
      w:col(m,"weightkg","weightlbs","weightlb","weight"),reps:col(m,"reps"),dist:col(m,"distance"),sec:col(m,"seconds"),
      note:col(m,"notes"),rpe:col(m,"rpe")
    };
    if(c.reps<0&&c.sec<0)throw new Error("Biçim tanınmadı: tekrar ve süre sütunu yok");
    const wh=c.w>=0?hnorm(rows[0][c.w]):"",fixed=/lbs?$/.test(wh)?"lbs":/kg$/.test(wh)?"kg":null;
    const unitAsk=!hevy&&!fixed,u=fixed||(hevy?"kg":unit==="lbs"?"lbs":"kg"),f=u==="lbs"?LB:1;
    const get=(r,i)=>i>=0&&r[i]!=null?r[i]:"";
    const ws=new Map();let skipped=0,badDate=0;
    for(let i=1;i<rows.length;i++){
      const r=rows[i],dt=get(r,c.date),key=dt+"\u0001"+get(r,c.name);
      const ord=clean(get(r,c.ord),20).toLowerCase(),exn=clean(get(r,c.ex),60);
      if(!hevy&&/rest|timer/.test(ord))continue;
      let w=ws.get(key);
      if(!w){
        const st=stamp(dt);if(!st){badDate++;skipped++;continue}
        let t1=null;
        if(hevy){const e=stamp(get(r,c.end));if(e&&e.t>st.t)t1=e.t}else{const ms=duration(get(r,c.dur));if(ms)t1=st.t+Math.min(ms,864e5)}
        w={day:st.day,t0:st.t,t1:Math.max(t1||0,st.t+6e4),name:clean(get(r,c.name),60)||"Antrenman",ex:[],by:new Map()};ws.set(key,w);
      }
      const warm=hevy?ord==="warmup":ord==="w",ty=ord==="d"||ord==="dropset"?"d":ord==="f"||ord==="failure"?"f":null;
      if(!exn||(!hevy&&!warm&&!/^(\d+|d|f)$/.test(ord))){skipped++;continue}
      let x=w.by.get(exn);if(!x){x={name:exn,note:"",sets:[],ss:hevy?clean(get(r,c.ss),40):""};w.by.set(exn,x);w.ex.push(x)}
      if(!x.note)x.note=clean(get(r,c.note),300);
      const kg=num(get(r,c.w)),rpe=num(get(r,c.rpe)),s={kg:kg==null?null:Math.round(kg*f*100)/100,reps:num(get(r,c.reps)),sec:num(get(r,c.sec)),dist:num(get(r,c.dist)),w:warm};if(ty)s.t=ty;
      if(rpe>=6&&rpe<=10)s.rpe=Math.round(rpe*2)/2;
      x.sets.push(s);
    }
    const workouts=[...ws.values()].map(({by,...w})=>w);
    if(!workouts.length)throw new Error(badDate?"Tarih sütunu okunamadı (beklenen: 2024-03-15 18:30 ya da 15 Mar 2024, 18:30)":"Dosyada okunabilir antrenman yok");
    return {format:hevy?"Hevy":"Strong",unit:u,unitAsk,workouts,skipped};
  }

  /* A short, deliberately rough table: the most common Strong/Hevy names (normalized, equipment attached) -> library id. A miss becomes a custom exercise. */
  const MAP={};
  for(const [id,names] of Object.entries({
    bench:"bench press barbell|bench press",dbbench:"bench press dumbbell|dumbbell bench press",incbench:"incline bench press barbell|incline bench press",incdb:"incline bench press dumbbell|incline dumbbell press",
    decbench:"decline bench press barbell|decline bench press",machbench:"chest press machine|chest press",dbfly:"chest fly dumbbell|chest fly|dumbbell fly",butterfly:"pec deck|butterfly pec deck|chest fly machine",
    crossover:"cable crossover|cable fly crossover",pushup:"push up|push ups|pushup",dipschest:"chest dip",paralleldip:"dip|dips|parallel bar dip",dipstri:"triceps dip|tricep dip",
    squat:"squat barbell|squat|back squat",frontsquat:"front squat barbell|front squat",goblet:"goblet squat|goblet squat kettlebell",hacksquat:"hack squat machine|hack squat",
    legpress:"leg press machine|leg press|leg press horizontal",legext:"leg extension machine|leg extension",legcurl:"lying leg curl machine|lying leg curl|leg curl",seatedcurl:"seated leg curl machine|seated leg curl",
    calf:"standing calf raise machine|standing calf raise|calf raise",seatedcalf:"seated calf raise machine|seated calf raise",dblunge:"lunge dumbbell|lunge",bblunge:"lunge barbell",walklunge:"walking lunge|walking lunge dumbbell",
    splitsquat:"bulgarian split squat dumbbell|bulgarian split squat|split squat dumbbell",hipthrust:"hip thrust barbell|hip thrust",bridge:"glute bridge|glute bridge bodyweight",
    rdl:"romanian deadlift barbell|romanian deadlift",dbstiffdl:"romanian deadlift dumbbell|stiff leg deadlift dumbbell",stiffdl:"stiff leg deadlift barbell|stiff leg deadlift|stiff legged deadlift",
    deadlift:"deadlift barbell|deadlift",sumodl:"sumo deadlift barbell|sumo deadlift",trapdl:"trap bar deadlift",rackpull:"rack pull",goodmorning:"good morning barbell|good morning",
    bbohp:"overhead press barbell|overhead press|military press|shoulder press barbell|standing military press barbell",ohp:"overhead press dumbbell|shoulder press dumbbell|seated overhead press dumbbell|shoulder press",
    levohp:"shoulder press machine|shoulder press machine plates",arnold:"arnold press dumbbell|arnold press",pushpress:"push press",
    lat:"lateral raise dumbbell|lateral raise|side lateral raise",cablelat:"lateral raise cable",frontraise:"front raise dumbbell|front raise",
    reardelt:"rear delt reverse fly dumbbell|reverse fly dumbbell|rear delt fly dumbbell|rear delt fly",facepull:"face pull cable|face pull|face pull rope",
    dbupright:"upright row dumbbell",bbshrug:"shrug barbell",shrug:"shrug dumbbell|shrug",
    pullup:"pull up|pull up weighted|pull up bodyweight|pullup",bandpullup:"pull up assisted|assisted pull up",chinup:"chin up|chin up weighted",
    pulldown:"lat pulldown cable|lat pulldown|lat pulldown wide grip",closepulldown:"lat pulldown close grip|close grip lat pulldown",straightarm:"straight arm lat pulldown cable|straight arm lat pulldown",
    row:"bent over row barbell|bent over row|barbell row|pendlay row barbell",dbrow:"bent over row dumbbell",dbrow1:"dumbbell row|one arm dumbbell row|single arm dumbbell row",
    seatedrow:"seated row cable|seated cable row|seated row|cable row",levrow:"seated row machine|iso lateral row machine",tbar:"t bar row|t bar row barbell",invrow:"inverted row",
    backext:"back extension|hyperextension|back extension hyperextension",
    curl:"bicep curl dumbbell|biceps curl dumbbell|dumbbell curl|bicep curl|biceps curl",bbcurl:"bicep curl barbell|biceps curl barbell|barbell curl|curl barbell",cablecurl:"bicep curl cable|cable curl",
    ezcurl:"ez bar biceps curl|ez bar curl|bicep curl ez bar",hammer:"hammer curl dumbbell|hammer curl",preacher:"preacher curl barbell|preacher curl dumbbell|preacher curl machine|preacher curl",
    inccurl:"incline curl dumbbell|incline dumbbell curl",concurl:"concentration curl|concentration curl dumbbell",
    tri:"triceps pushdown cable|triceps pushdown|tricep pushdown",ropepushdown:"triceps rope pushdown|triceps pushdown rope|tricep rope pushdown",
    dboverhead:"triceps extension dumbbell|overhead triceps extension dumbbell|triceps extension",cableoverhead:"triceps extension cable|overhead triceps extension cable",
    skull:"skullcrusher barbell|skullcrusher|skull crusher|skullcrusher ez bar",kickback:"triceps kickback dumbbell|triceps kickback",closebench:"close grip bench press barbell|close grip bench press",
    crunch:"crunch|crunch bodyweight",cablecrunch:"cable crunch",hangingraise:"hanging leg raise",kneehipraise:"hanging knee raise|knee raise",plank:"plank",abroller:"ab wheel|ab wheel rollout",
    russiantwist:"russian twist|russian twist bodyweight",climber:"mountain climber",
    treadrun:"running|running treadmill|treadmill|run",treadwalk:"walking|walking treadmill|walk",bike:"cycling|cycling outdoor|bicycling",statbike:"cycling indoor|stationary bike|exercise bike",
    elliptical:"elliptical trainer|elliptical",rower:"rowing machine|rowing",jumprope:"jump rope|skipping rope",stairs:"stair climber|stairmaster",kbswing:"kettlebell swing",farmer:"farmer s walk|farmers walk"
  }))for(const n of names.split("|"))MAP[n]=id;
  const norm=s=>String(s).replace(/İ/g,"i").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim();
  const base=s=>norm(String(s).replace(/\([^)]*\)/g,"").split(" - ")[0]);
  /* all: [{id,n,k}] library and custom exercises. Order: table (full name), name (full), table (without equipment), name (without equipment). */
  function matcher(all){
    const ids=new Map(all.map(e=>[e.id,e])),full=new Map(),bs=new Map();
    for(const e of all){const f=norm(e.n),b=base(e.n);if(!full.has(f))full.set(f,e);if(!bs.has(b))bs.set(b,e)}
    return name=>{
      const f=norm(name),b=base(name);
      return ids.get(MAP[f])||full.get(f)||ids.get(MAP[b])||bs.get(b)||null;
    };
  }

  const KEY=(w,ids)=>`${w.day}|${Math.floor(w.t0/60000)}|${ids.slice().sort().join(",")}`;
  const summary=(workouts,newEx)=>({workouts:workouts.length,sets:workouts.reduce((a,w)=>a+w.ex.reduce((b,x)=>b+x.sets.length,0),0),created:newEx.length,
    from:workouts.reduce((a,w)=>a&&a<w.day?a:w.day,""),to:workouts.reduce((a,w)=>w.day>a?w.day:a,"")});
  /* ctx: {find, existing:[workout], gid}. The counter advances from gid; the caller sets S.gid to plan.gid. */
  function plan(raw,{find,existing,gid}){
    const have=new Set(existing.map(w=>KEY(w,w.ex.map(x=>x.id)))),newEx=[],local=new Map(),out=[],matched=new Set();
    let dup=0,skippedSets=0;const over=new Set();
    const resolve=x=>{
      const hit=find(x.name);if(hit){matched.add(hit.id);return {id:hit.id,k:hit.k||"w"}}
      const f=norm(x.name);let e=local.get(f);
      if(!e){
        if(newEx.length>=MAX_NEW){over.add(x.name);return null}
        const cardio=x.sets.some(s=>s.dist>0),timed=!cardio&&x.sets.some(s=>s.sec>0)&&!x.sets.some(s=>s.reps>0),k=cardio?"c":timed?"t":"w";
        const ex={id:"c"+gid++,n:x.name,g:"Bacak",inc:2.5,r:"Tüm vücut",k,c:k==="c"?"k":"g"};
        newEx.push(ex);e={id:ex.id,k};local.set(f,e);
      }
      return e;
    };
    for(const w of raw){
      const ex=[],ssOf=[];
      for(const x of w.ex){
        const e=resolve(x);if(!e){skippedSets+=x.sets.length;continue}
        const timed="tic".includes(e.k),kept=[];
        for(const s of x.sets){
          const kg=s.kg==null?0:s.kg;let o=null;
          if(timed){const sec=Math.round(s.sec);if(sec>=1&&sec<=SEC_MAX)o={kg:null,reps:null,sec,done:true}}
          else if(s.reps>=1&&s.reps<=REPS_MAX&&kg>=0&&kg<=KG_MAX&&Number.isInteger(s.reps))o={kg,reps:s.reps,done:true};
          if(!o){skippedSets++;continue}
          if(s.w&&!timed)o.w=true;
          if(s.rpe&&!timed&&!s.w)o.rpe=s.rpe;
          if(s.t&&!timed&&!s.w)o.t=s.t;
          kept.push(o);
        }
        if(kept.length){ex.push({id:e.id,note:x.note,sets:kept});ssOf.push(x.ss)}
      }
      const gr=new Map();for(const s of ssOf)if(s)gr.set(s,(gr.get(s)||0)+1);
      const nums=[...gr.keys()];ex.forEach((x,i)=>{if(ssOf[i]&&gr.get(ssOf[i])>1)x.ss=nums.indexOf(ssOf[i])+1});
      if(!ex.length)continue;
      const k=KEY(w,ex.map(x=>x.id));
      if(have.has(k)){dup++;continue}
      have.add(k);
      out.push({id:gid++,day:w.day,t0:w.t0,t1:w.t1,name:w.name,tpl:null,ex});
    }
    return {workouts:out,newEx,gid,stats:{...summary(out,newEx),dup,skippedSets,over:[...over],matched:matched.size}};
  }
  const bytes=p=>(JSON.stringify(p.workouts).length+JSON.stringify(p.newEx).length)*2;
  /* How many of the newest workouts fit the byte budget. */
  function fit(p,budget){
    let b=JSON.stringify(p.newEx).length*2,n=0;
    for(const w of p.workouts.slice().sort((x,y)=>y.t0-x.t0)){b+=JSON.stringify(w).length*2;if(b>budget)break;n++}
    return n;
  }
  /* Keeps the newest n workouts and only the new exercises they use; the stats follow the kept set. */
  function cut(p,n){
    const keep=p.workouts.slice().sort((a,b)=>b.t0-a.t0).slice(0,n),used=new Set(keep.flatMap(w=>w.ex.map(x=>x.id))),newEx=p.newEx.filter(e=>used.has(e.id));
    return {...p,workouts:keep.sort((a,b)=>a.id-b.id),newEx,stats:{...p.stats,...summary(keep,newEx)}};
  }
  return {read,num,matcher,plan,bytes,fit,cut,MAP,MAX_NEW};
})();
if(typeof module!=="undefined")module.exports=ImportLib;
