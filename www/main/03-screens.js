/* ---------- screens ---------- */
/* Touch/drag: the nearest point's value in a bubble. data-tip: [[x,y,text]...] (viewBox units). */
function chartTip(svg,cx){
  const P=JSON.parse(svg.dataset.tip),[,,W]=svg.getAttribute("viewBox").split(" ").map(Number),r=svg.getBoundingClientRect(),x=(cx-r.left)*W/(r.width||W);
  const b=P.reduce((m,p)=>Math.abs(p[0]-x)<Math.abs(m[0]-x)?p:m);
  const w=b[2].length*6.6+14,bx=Math.min(Math.max(b[0]-w/2,2),W-w-2),by=b[1]>40?b[1]-34:b[1]+10;
  svg.querySelector(".tip")?.remove();
  svg.insertAdjacentHTML("beforeend",`<g class="tip" pointer-events="none"><circle cx="${b[0]}" cy="${b[1]}" r="5" fill="none" stroke="var(--ink)" stroke-width="2"/><rect x="${bx.toFixed(1)}" y="${by}" width="${w.toFixed(1)}" height="24" rx="6" fill="var(--card)" stroke="var(--mut)"/><text x="${(bx+7).toFixed(1)}" y="${by+16}">${esc(b[2])}</text></g>`);
}
for(const t of ["pointerdown","pointermove"])document.addEventListener(t,ev=>{
  const s=ev.target.closest&&ev.target.closest("svg[data-tip]");
  if(s&&(t==="pointerdown"||ev.buttons||ev.pointerType==="mouse"))chartTip(s,ev.clientX);
  else if(t==="pointerdown")document.querySelectorAll(".tip").forEach(n=>n.remove());
});
/* One day's entry list (meal groups, water summary, other entries): shared by Today and the Day screen. */
function dayLogHtml(lk){
  const items=Log.where(e=>e.day===lk&&e.type!=="steps");
  const vtxt=e=>e.type==="weight"?`${dw(e.v)} ${wlab()}`:e.type==="food"?(e.v?e.lo!=null?`~${Math.round(e.v)} kcal<small class="db mut sm">${e.lo}-${e.hi}</small>`:`${Math.round(e.v)} kcal`:""):e.type==="exercise"?`${Math.round(e.v)} dk`:"";
  const ttx=e=>e.type==="weight"?"Tartı":esc(e.text||(e.type==="food"?"Öğün":"Antrenman"))+(e.kcal?` · ~${e.kcal} kcal tahmini`:"");
  const li=(e,tx)=>`<li class="row"><span class="t num">${e.time}</span><span class="ic">${Icons.svg(e.type)}</span>${tx}<span class="vl num">${vtxt(e)}</span><button class="del" data-del="${e.id}" aria-label="Kaydı sil">✕</button></li>`;
  const dl=LogLib.dayLog(items);
  const waterTxt=dl.waterTotal<1000?`${Math.round(dl.waterTotal)} ml`:`${fmt(dl.waterTotal/1000,1)} L`;
  const log=items.length?`<ul class="log">${dl.groups.map(g=>`<li class="gh"><b>${g.n}</b><span class="num">${Math.round(g.kcal)} kcal</span></li>`+g.items.map(e=>li(e,`<button class="tx" data-meal="${e.id}" aria-label="${esc(ttx(e))}, öğünü değiştir">${ttx(e)}</button>`)).join("")).join("")}${dl.water.length?`<li class="row"><span class="t num">${dl.water[dl.water.length-1].time}</span><span class="ic">${Icons.svg("water")}</span><button class="tx" data-waterall="1">Su: ${waterTxt}, ${dl.water.length} kez</button><span class="vl" aria-hidden="true">›</span></li>`:""}${dl.dr.length?`<li class="row"><span class="t num">${dl.dr[dl.dr.length-1].time}</span><span class="ic">${Icons.svg("water")}</span><button class="tx" data-waterall="1">Diğer içecekler: ${Math.round(dl.drMl)} ml, ${dl.dr.length} kez</button><span class="vl" aria-hidden="true">›</span></li>`:""}${dl.rest.sort((a,b)=>b.id-a.id).map(e=>li(e,`<span class="tx">${ttx(e)}</span>`)).join("")}</ul>`:`<div class="empty">${Icons.svg(lk===dayKey()?"water":"note")}<p class="mut">${lk===dayKey()?"Bugün henüz bir şey eklemedin. Bir bardak suyla başlayabilirsin.":"Bu güne ait bir şey yok."}</p></div>`;
  return {items,log};
}
/* The sport ring is daily: the day's share of the weekly goal (default 150 min). The weekly total is in Trend and Gym. */
const sportDay=()=>Math.max(1,Math.round(S.settings.sportWeek/7));
/* A ring is a button: today's detail and the last 14 days' chart are on the Day screen, the calendar from there. */
const rb=(k,ad,inner)=>`<button class="rbtn" data-hg="focus:${k}" aria-label="${ad}, ayrıntı ve geçmiş">${inner}</button>`;
function viewToday(){
  const t=dayKey(),st=S.settings;
  const wAll=weights(),days=Object.keys(wAll).sort();
  const cur=days.length?wAll[days[days.length-1]]:null,prev=days.length>1?wAll[days[days.length-2]]:null;
  const curDay=days[days.length-1];
  /* The weight card is a shortcut to Trend: a one-line summary, chart and detail live in Trend. */
  let weight;
  if(cur==null){
    weight=`<button class="stepcard" data-act="weight"><div class="scr"><span class="mut">${Icons.svg("weight")} Kilo</span><span class="mut sm">Ekle ›</span></div><div class="mut sm">İlk tartını ekle; ilerlemen buradan başlar.</div></button>`;
  }else{
    const gi=goalInfo(cur,wAll[days[0]]),sl=Algo.slopePerWeek(wAll);
    const bits=[sl!=null?`${dwS(sl,2)} ${wlab()}/hafta`:prev!=null?`öncekine göre ${dwS(cur-prev)} ${wlab()}`:"",gi?(gi.done?"Hedefe ulaştın":`hedefe ${dw(gi.left)} ${wlab()}`):""].filter(Boolean);
    weight=`<button class="stepcard" data-tab="trend" aria-label="Kilo grafiğini Trend'de aç"><div class="scr"><span class="mut">${Icons.svg("weight")} ${curDay===t?"Bugünkü tartı":"Son tartı, "+fd(curDay)}</span><span class="mut sm">Trend ›</span></div><div class="scr"><span class="big num wv">${dw(cur)} <small>${wlab()}</small></span><span class="mut sm num ws">${bits.join(" · ")}</span></div></button>`;
  }
  const water=sum("water",t,t),sh=st.waterMl,kc=sum("food",t,t),sw=sum("exercise",t,t),sg=sportDay();
  const kgl=kcalGoal(t),kcP=kgl>0?kc/kgl:0;
  const sOn=S.settings.stepsOn&&isNative();
  /* The ring centre shows what is left; done / goal below with the unit. */
  const left=(v,g,u)=>v<g?[null,`${u} kaldı`]:["✓","Hedef tamam"];
  const [waterC,waterU]=left(water,sh,"L"),[spC,spU]=left(sw,sg,"dk");
  const kcC=kgl>0?Math.round(Math.abs(kgl-kc)):Math.round(kc),kcU=kgl>0?(kc>kgl?"kcal fazla":"kcal kaldı"):"kcal";
  const meals=Log.where(e=>e.type==="food"&&e.day===t),mac=k=>meals.reduce((s,e)=>s+(e[k]||0),0);
  const pr=cur!=null?Algo.protein(riskInput(cur)):{};
  const macro=meals.some(e=>e.p||e.c||e.f)?`<div class="macro num">Protein <b>${Math.round(mac("p"))}</b>${pr.range?` / ${pr.range[0]}–${pr.range[1]}`:""} g${pr.doc?" (hedefi hekiminle belirle)":""}${meals.some(e=>e.c!=null||e.f!=null)?` · Karbonhidrat <b>${Math.round(mac("c"))}</b> g · Yağ <b>${Math.round(mac("f"))}</b> g`:""}</div>${pr.range||pr.doc?`<div class="mut sm macro">${Algo.PROTEIN_NOTE}</div>`:""}`:"";
  const mi=["fb","sg","na"].map(k=>[k,meals.filter(e=>e[k]!=null).length]).filter(x=>x[1]).map(([k,n])=>`${NLBL[k][0].toUpperCase()+NLBL[k].slice(1)} <b>${Math.round(mac(k))}</b> ${NUNIT(k)} (${n}/${meals.length})`);
  const nc=meals.filter(e=>e.c!=null).length,nf=meals.filter(e=>e.f!=null).length;
  const macroNote=macro&&meals.some(e=>e.c!=null||e.f!=null)&&(nc<meals.length||nf<meals.length)?`<div class="mut sm macro">Karbonhidrat ${nc}/${meals.length}, yağ ${nf}/${meals.length} öğünde veri var; toplam eksik olabilir.</div>`:"";
  const dr=LogLib.dayRange(meals),rangeNote=dr?`<p class="pt-2 hint">Tarif farkına göre bugün ~${fint(dr.lo)}–${fint(dr.hi)} kcal olabilir.</p>`:"";
  const micro=mi.length?`<div class="macro num">${mi.join(" · ")} <span class="mut sm">öğünde veri var</span></div>`:"";
  /* Summary card: big calorie ring and the remainder; water, sport and steps in small rings; macros below. */
  const rings=`<div class="card"><div class="rings">
    ${rb("kcal","Kalori",ring(kcP,"var(--kcal)",kcC,"Kalori",kgl>0?`${Math.round(kc)} / ${kgl} kcal`:"hedef yok",kcU,"main"))}
    <div class="rmini">${rb("water","Su",ring(water/sh,"var(--water)",waterC||fmt((sh-water)/1000,1),"Su",`${fmt(water/1000,1)} / ${fmt(sh/1000,1)} L`,waterU,"mini"+(waterC?" done":"")))}
    ${rb("exercise","Spor",ring(sw/sg,"color-mix(in srgb,var(--exercise) 80%,var(--card))",spC||Math.round(sg-sw),"Spor",`${Math.round(sw)} / ${sg} dk`,spU,"mini"+(spC?" done":"")))}${sOn?stepCard():""}</div>
  </div>${macro}${macroNote}${micro}${rangeNote}${moveAdd(t)?`<p class="pt-2 hint">Hedefe hareketten +${moveAdd(t)} kcal eklendi (kayıtlı antrenman ve yürüyüşün yarısı, tahmindir).</p>`:""}</div>`;
  const actions=`<div class="actions"><button class="btn act" data-act="food">${Icons.svg("plus")} Yemek ekle</button><div class="qa">
    <button class="chip act" data-act="water" aria-label="${st.glass} ml su ekle">${Icons.svg("water")} +${st.glass} ml</button><button class="chip" data-dk="open">${Icons.svg("water")} Başka içecek</button>
    <button class="chip act" data-act="weight">${Icons.svg("weight")} Kilo</button><button class="chip act" data-act="exercise">${Icons.svg("exercise")} Spor</button>
    <button class="chip act" data-act="note">${Icons.svg("note")} Not</button></div></div>`;
  const lk=keyOff(-logOff);
  const {items,log}=dayLogHtml(lk);
  const lname=logOff===0?"Bugün":logOff===1?"Dün":fd(lk);
  const dnav=dayNav("lo",lname,logOff===0);
  const lb=st.lastBackup,old=lb?Algo.dayNum(t)-Algo.dayNum(lb):null;
  const a7=(a,b)=>sum("steps",keyOff(a),keyOff(b));
  const row=(ic,b,sub,btns)=>`<div class="row"><span>${Icons.svg(ic)} ${b}<small class="mut sm">${sub}</small></span><div class="acts">${btns.map(([a,l])=>`<button class="chip" data-act="${a}">${l}</button>`).join("")}</div></div>`;
  /* One list instead of separate cards: only pending jobs of enabled modules; no card when empty. */
  const todo=[storeMsg()?row("save",storeMsg()[0],storeMsg()[1],[["databackup","Yedek al"]]):"",
    abErr?row("cloud","Otomatik yedek alınamadı",abErr,[["abfix","Düzelt"]]):"",
    ...medTodo(),...fastTodo(),...vTodo(),
    Motion.walk()?row("steps",Motion.walk().t1?"Yürüyüş kaydedilmedi":"Yürüyüş sürüyor","Adım raporunda bitir ya da kaydet.",[["walkgo","Aç"]]):"",
    sOn&&stepsRead&&st.stepWarnDay!==t&&LogLib.stalled(stepSnapAt,Date.now(),a7(-1,-1),a7(-8,-2)/7)?row("steps","Adım sayımı durmuş olabilir","Pil ayarında NeoWell'e kısıtlama koyma.",[["stepsfix","Ayarla"],["stepshide","Kapat"]]):"",
    isNative()&&!exactOk&&st.medOn&&Meds.count()?row("clock","İlaç alarmı birkaç dakika gecikebilir","Tam saat alarm izni kapalı. İzin verirsen tam saatinde çalar.",[["fullalarm","İzin ver"]]):"",
    isNative()&&!fsiOk&&st.medOn&&Meds.count()?row("clock","İlaç alarmı kilitli ekranı açmayabilir","Tam ekran bildirim izni kapalı. İzin verirsen alarm ekranı yakar.",[["fullscreen","İzin ver"]]):"",
    isNative()&&oemXiaomi()&&!st.oemDone?row("bell","Hatırlatmalar için bir kez ayar gerekli","İki izin verince hatırlatmalar kaçmaz.",[["oem","Ayarla"]]):"",
    isNative()&&SC()&&!st.stepsOn&&!st.stepsAsked?row("steps","Adım sayarı aç","Telefonun sensörü sayar, hesap gerekmez.",[["stepsopen","Aç"],["stepsno","Şimdi değil"]]):"",
    Log.all().length>=10&&(old==null||old>14)?row("cloud","Verilerini yedekle",old==null?"Henüz yedek dosyası almadın.":`Son yedek dosyası ${old} gün önce.`,[["drive","Yedekle"]]):""].filter(Boolean);
  /* The first 3 jobs are visible (a data-loss warning is always first); the rest folds so it does not push the log down. */
  const todoCard=todo.length?`<div class="card todo"><h2 class="grp">Bugün yapılacaklar</h2>${todo.slice(0,3).join("")}${todo.length>3?`<details class="acc" ${keepOpen("todo")}><summary>${todo.length-3} iş daha</summary>${todo.slice(3).join("")}</details>`:""}</div>`:"";
  const minor=S.settings.age>0&&S.settings.age<18?`<div class="banner"><b>NeoWell 18 yaş ve üzeri için</b><p>Profilindeki yaş 18'in altında. Kalori açığı, oruç önerisi ve Rehber kapalı. Beslenme ve kilo konusunda bir yetişkinle ve hekiminle ya da diyetisyeninle konuş. Yaş yanlışsa Ayarlar > Profil'den düzelt.</p></div>`:"";
  /* .bg2 has no effect in portrait; in landscape the left column holds rings and summary, the right one jobs and entries. */
  return `<div class="bg2"><div class="bgL">${minor}${rings}${actions}${habitRow()}</div><div class="bgR">${todoCard}${gTodayCard()}${weight}<div class="card coachc"><button class="coach" data-tab="coach">${esc(dailyTip())} <b>Rehber ›</b></button></div><div class="card">${dnav}${log}${items.some(e=>e.type==="food")?`<button class="lnk" data-act="tplnew">Bu günün yemeklerinden şablon yap</button>`:""}<button class="lnk" data-tab="history">Geçmiş ve takvim</button></div></div></div>`;
}

/* PDF reports in one place; the share handlers listen on the document, so they work from any screen. */
function reportRows(){
  const st=S.settings,r=(a,ic,t,sub)=>navRow(a,ic,t,sub);
  return `${r('data-doc="open"',"share","Hekime hazırlan","Tek PDF, yorum içermez")}${r('data-wk="pdf"',"share","Son 7 gün raporu","Bugün dahil 7 gün, PDF")}${st.bpOn?r('data-vt="pdfmenu:t"',"heart","Tansiyon doktor raporu","Dönem seç, PDF"):""}${st.bsOn?r('data-vt="pdfmenu:s"',"water","Şeker doktor raporu","Dönem seç, PDF"):""}${LabLib.series(Labs.all()).length?r('data-lab="pdf"',"file","Tahlil raporu","Tüm sonuçlar, PDF"):""}`;
}
function viewTrend(){
  const t=dayKey(),st=S.settings;
  const wAll=weights(),days=Object.keys(wAll).sort();
  let stats="";
  if(days.length){
    const cur=wAll[days[days.length-1]],first=wAll[days[0]];
    const ge=Algo.goalEta(wAll,st.goalKg),cells=[["Başlangıç",`${dw(first)} ${wlab()}`],["Şimdi",`${dw(cur)} ${wlab()}`],["Toplam değişim",`${dwS(cur-first)} ${wlab()}`]];
    if(ge.slope!=null)cells.push(["Kilo hızı",`${dwS(ge.slope,2)} ${wlab()}/hafta`]);
    const gi=goalInfo(cur,first);
    if(gi)cells.push(["Hedefe kalan",gi.done?"Ulaştın":`${dw(gi.left)} ${wlab()}`]);
    const eta=gi&&!gi.done&&!(gi.dir<0&&risk(cur).block)?ge.weeks:null;
    const etaTxt=!eta?"":ge.range?(ge.range[0]===ge.range[1]?`Son 3 haftanın eğimi sürerse ~${ge.range[0]} hafta.`:`Son 3 haftanın eğimi sürerse ${ge.range[0]}–${ge.range[1]} hafta arası.`):"Hızın değişken olduğu için hedef tarihi kestirilemiyor.";
    stats=`<div class="stats kp">${cells.map(c=>`<div class="stat"><div class="k">${c[0]}</div><div class="v num">${c[1].replace(/ ((?:kg|lb)\/hafta|kg|lb)$/," <small>$1</small>")}</div></div>`).join("")}</div>${etaTxt?`<p class="pt-2 hint">${etaTxt}</p>`:""}`;
  }
  const waterOf=dayTotal("water"),foodOf=dayTotal("food"),sportOf=dayTotal("exercise"),stepsOf=dayTotal("steps"),wkW=weights(keyOff(-6),t);
  let rows="",hasWeek=false;const hasSteps=st.stepsOn||sum("steps",keyOff(-6),t)>0;
  for(let i=6;i>=0;i--){
    const d=addDays(-i),k=dayKey(d),w=wkW[k],water=waterOf(k),kc=foodOf(k),sp=sportOf(k),as=stepsOf(k);
    if(w!=null||water||kc||sp||as)hasWeek=true;
    rows+=`<tr><td class="${i==0?"today":""}">${WEEKDAYS_SHORT[d.getDay()]} ${d.getDate()}</td><td class="num">${w!=null?dw(w):"–"}</td><td class="num">${water?fmt(water/1000,1):"–"}</td><td class="num">${kc?Math.round(kc):"–"}</td><td class="num">${sp?Math.round(sp):"–"}</td>${hasSteps?`<td class="num">${as?fint(as):"–"}</td>`:""}</tr>`;
  }
  const sw=sum("exercise",keyOff(-6),t);
  const sd=new Set(Log.where(e=>e.type==="exercise"&&e.day>=keyOff(-6)).map(e=>e.day)).size;
  const empty=`${emptyCard("weight","İlk tartını ekle","Grafik ikinci tartıdan sonra çizilir. Su, yemek, spor ve adımların da burada haftalık tabloda görünür.",`<button class="btn" data-act="weight">${Icons.svg("weight")} Kilo ekle</button>`)}`;
  /* Hierarchy: range picker and weight chart on top, summary below; detail in tabs (all in the DOM, only the selected one visible). */
  const N=days.length?(range===0?trendAll():range):30,bag=linksCard();
  const tabs=[["weight","Kilo",`${measureCard()}${photoCard()}${hasWeek?`<h2>Son 7 gün</h2><div class="card"><table><thead><tr><th>Gün</th><th>Kilo</th><th>Su (L)</th><th>kcal</th><th>Spor (dk)</th>${hasSteps?"<th>Adım</th>":""}</tr></thead><tbody>${rows}</tbody></table></div>`:""}`],
    ["nutrition","Beslenme",`<div class="card">${miniBars(N,foodOf,"var(--kcal)",kcalGoal(t),"Kalori","kcal")}${miniBars(N,waterOf,"var(--water)",st.waterMl,"Su","L",x=>fmt(x/1000,1))}</div>${gEnergy()}`],
    ["motion","Hareket",`<div class="card">${miniBars(N,sportOf,"var(--exercise)",0,"Spor","dk")}${hasSteps?miniBars(N,stepsOf,"var(--prim)",st.stepGoal,"Adım","adım",fint):""}</div>${activityCard()}${cardioCard()}`],
    ...bag?[["bag","Bağlantılar",bag]]:[]];
  if(!tabs.some(x=>x[0]===tSec))tSec="weight";
  const sub=h=>h.replace(/<h2>(.*?)<\/h2>/g,'<h3 class="grp">$1</h3>');
  const tabBar=`<div class="seg tabs" role="tablist" aria-label="Trend bölümleri">${tabs.map(([k,l])=>`<button role="tab" id="tt-${k}" data-tsec="${k}" aria-controls="tp-${k}" aria-selected="${k===tSec}">${l}</button>`).join("")}</div>${tabs.map(([k,,h])=>`<div class="tpan" role="tabpanel" id="tp-${k}" aria-labelledby="tt-${k}"${k===tSec?"":" hidden"}>${sub(h)}</div>`).join("")}`;
  return `${days.length?`<div class="seg" role="group" aria-label="Aralık"><button data-range="30" aria-pressed="${range==30}">30 gün</button><button data-range="90" aria-pressed="${range==90}">90 gün</button><button data-range="365" aria-pressed="${range==365}">1 yıl</button><button data-range="0" aria-pressed="${range==0}">Tümü</button></div>
  <div class="card">${chart(N)}${stats}</div>`:empty}${goalCard()}
  ${lossAsk()?`<div class="btns"><button class="btn ghost" data-c="why">Bu hafta neden kilo vermedim?</button></div>`:""}
  ${tabBar}
  <details class="acc more"><summary>Daha fazla ölçüm</summary><div class="card">${vTrendCards()}${labTrendCard()}${navRow('data-tab="gym"',"exercise","Haftalık spor",`${Math.round(sw)} / ${st.sportWeek} dk, ${sd} gün aktif`)}${reportRows()}</div></details>`;
}

const LOCK_LABEL={30:"30 saniyeden",120:"2 dakikadan",300:"5 dakikadan"};
let notifStatus="";
const fld=(id,label,val,small,mode)=>`<div class="field"><label for="${id}">${label}${small?`<small>${small}</small>`:""}</label><input id="${id}" type="text" inputmode="${mode||"decimal"}" value="${val}" data-set="${id}"></div>`;
const segb=(attr,opts,sel)=>`<div class="seg2" role="group">${opts.map(([v,l])=>`<button data-${attr}="${v}" aria-pressed="${sel===v}">${l}</button>`).join("")}</div>`;
/* A reminder of a disabled module is not listed. */
const remShown=r=>{const st=S.settings;return !((r.id===7||r.id===8)&&!st.bpOn)&&!(r.id===9&&!st.bsOn)&&!(r.id===11&&!st.fastOn)};
/* Checkbox row: label and switch form one 48 px touch target. */
const swRow=(attrs,on,label,sub="")=>`<label class="chkrow"><span class="nm">${label}${sub?`<small>${sub}</small>`:""}</span><span class="sw"><input type="checkbox" ${attrs}${on?" checked":""}><span></span></span></label>`;
/* List row: shared by the More, Settings, Gym and Data screens. */
const navRow=(attr,ic,t,sub,cls="")=>`<button class="prow${cls}" ${attr}><span class="aic">${Icons.svg(ic)}</span><span class="grow"><b>${t}</b>${sub?`<span class="mut sm">${sub}</span>`:""}</span><span class="plus" aria-hidden="true">›</span></button>`;
/* Detail (ⓘ): the button sits inside the card, the explanation opens right below it. swHelp puts it beside a switch row. */
const helpBtn=(id,name)=>`<button class="help" data-help="${id}" aria-expanded="false" aria-controls="${id}" aria-label="${name}: ayrıntı">${Icons.svg("info")}</button>`;
const helpBox=(id,html)=>`<div class="helpx" id="${id}" hidden>${html}</div>`;
const swHelp=(attrs,on,label,sub,id,help)=>`<div class="row">${swRow(attrs,on,label,sub)}${helpBtn(id,label)}</div>${helpBox(id,help)}`;
/* Module row: switch, one sentence, ⓘ detail; extra settings below when on. The switch state comes only from the setting:
   turning on may wait for a confirmation or a permission, so the browser's own toggling is cancelled and render draws it. */
const modRow=(attrs,on,name,line,id,help,extra="")=>swHelp(attrs+" data-mod",on,name,line,id,help)+(on&&extra?`<div class="pv-2">${extra}</div>`:"");
document.addEventListener("click",ev=>{if(ev.target.matches?.("input[data-mod]"))ev.preventDefault()},true);
document.addEventListener("click",ev=>{const b=ev.target.closest("[data-help]"),x=b&&document.getElementById(b.dataset.help);if(x){x.hidden=!x.hidden;b.setAttribute("aria-expanded",!x.hidden)}});
const SETTINGS_TABS=[["profile","Profil ve hedefler","user"],["reminders","Hatırlatmalar","bell"],["coach","Rehber","coach"],["modules","Modüller","grid"],["data","Veri ve yedek","data"],["about","Hakkında","info"]];
/* Parent of a sub-screen: the ‹ in the header and the Android and browser back keys return to it. */
const PARENT={steps:"today",labs:"trend",bp:"trend",glucose:"trend",exlib:"gym",meds:"more",cycle:"more",history:"more",day:"history",settings:"more",...Object.fromEntries(SETTINGS_TABS.map(([k])=>["settings-"+k,"settings"]))};
/* A sub-screen opened from another tab (Meds from Today, Steps from More) returns to and highlights that tab; for a deep link the fixed parent applies. */
const UP=t=>via&&via.t===t?via.p:PARENT[t];
const topTab=t=>{for(let p;(p=UP(t));)t=p;return t};
/* Active tab: Meds, Steps and Settings stay under More whichever screen opened them; ‹ still returns to where they were opened from. */
const navTab=()=>/^(meds|steps|settings|history|day)/.test(tab)?"more":topTab(tab);
/* More: a grouped list. A row's fourth field is the setting name; a disabled module is not listed and is enabled from the Modules row. */
const MORE_GROUPS=[["Geçmiş",[['data-tab="history"',"Geçmiş ve takvim","trend",0,"Her günün kaydı, aylık özet, arama"]]],["Sağlık takibi",[['data-tab="meds"',"İlaçlar","meds","medOn","İlaç saatleri ve bugünkü dozlar"],['data-tab="bp"',"Tansiyon","heart","bpOn","Ev ölçümleri ve ortalama"],['data-tab="glucose"',"Şeker","water","bsOn","Ölçümler ve ortalama"],['data-tab="labs"',"Tahlil takibi","file",0,"Sonuçlar ve değişim"],['data-tab="cycle"',"Döngü","moon","cycleOn","Dönem günleri ve tahmin"],['data-hb="more"',"Uyku ve ruh hali","smile",0,"Bugünkü uykun ve nasıl hissettiğin"]]],
  ["Beslenme ve hareket",[['data-tab="steps"',"Adım raporu","steps","stepsOn","Günlük adım ve yürüyüş"],['data-pl="open"',"Nabız","heart",0,"Kamerayla ölç, saatten günlük nabız"],['data-tab="exlib"',"Egzersiz kütüphanesi","gym",0,"Hareketler, kaslar, ekipman"],['data-ckg="open"',"Kardiyo","exercise",0,"Koşu, yürüyüş, bisiklet ve yüzme ekle"],['data-ms="open"',"Vücut ölçüleri","weight",0,"Bel, kalça, göğüs, kol ve uyluk"],['data-ph="add"',"İlerleme fotoğrafı","camera","ph","Yalnız bu telefonda saklanır"]]],
  ["Veri",[['data-tab="settings-data"',"Uygulama kilidi","lock",0,"Açılışta telefonun ekran kilidini iste"],['data-tab="settings-data"',"Veri ve yedek","data",0,"Yedek, tabloya aktarma, silme"],['data-pv="open"',"Gizlilik ve veri","lock",0,"Veriler nerede durur, Rehber'e ne gider"]]],
  ["Uygulama",[['data-tab="settings"',"Ayarlar","settings",0,"Profil, hatırlatmalar, Rehber, görünüm"],['data-tab="settings-modules"',"Modüller","grid",0,"Takipleri aç ya da kapat"],['data-tab="settings-about"',"Hakkında","info",0,"Sürüm, kaynaklar ve tıbbi uyarı"]]]];
function viewMore(){
  const st=S.settings,on=k=>!k||(k==="ph"?phOk():st[k]);
  return MORE_GROUPS.map(([g,rows])=>`<h2 class="grp">${g}</h2><div class="card">${rows.filter(r=>on(r[3])).map(([a,t,i,,sub])=>navRow(a,i,t,sub)).join("")}</div>`).join("");
}
function viewSettings(){
  const st=S.settings,sub=tab.slice(9);
  if(!sub){
    const on=[st.medOn&&"İlaç",st.fastOn&&"Oruç",st.stepsOn&&"Adım",st.bpOn&&"Tansiyon",st.bsOn&&"Şeker",st.cycleOn&&"Döngü"].filter(Boolean);
    const d={profile:[st.heightCm&&st.heightCm+" cm",st.age&&st.age+" yaş",st.goalKg&&"hedef "+dw(st.goalKg)+" "+wlab()].filter(Boolean).join(" · ")||"Boy, yaş ve hedefler",
      modules:on.length?on.join(", ")+" açık":"Hepsi kapalı",reminders:st.reminders.filter(r=>r.on&&remShown(r)).length+" hatırlatma açık",
      coach:keysStored()?"Anahtar kayıtlı":"Anahtar yok",data:storeMsg()?storeMsg()[0]:st.lastBackup?"Son yedek "+fd(st.lastBackup):"Henüz yedek dosyası yok",about:appVer?"Sürüm "+appVer:"Sürüm, kaynaklar ve tıbbi uyarı"};
    const grp=(g,ks)=>`<h2 class="grp">${g}</h2><div class="card">${SETTINGS_TABS.filter(([k])=>ks.includes(k)).map(([k,t,ic])=>navRow(`data-tab="settings-${k}"`,ic,t,esc(d[k]))).join("")}</div>`;
    return `${grp("Kişisel",["profile","reminders"])}${grp("Rehber ve modüller",["coach","modules"])}
    <h2 class="grp">Görünüm ve erişilebilirlik</h2><div class="card"><div class="lbl" id="thml">Tema</div>${segb("thm",[["","Sistem"],["light","Açık"],["dark","Koyu"]],st.theme).replace('role="group"','role="group" aria-labelledby="thml"')}<p class="hint">Yazı boyutu telefonun yazı boyutu ayarını izler.</p></div>
    ${grp("Veri ve uygulama",["data","about"])}`;
  }
  if(sub==="profile")return `<p class="hint">Kalori, su ve protein hedeflerin bu bilgilerle hesaplanır.</p><h2>Profil</h2><div class="card">
    ${fld("heightCm","Boy (cm)",st.heightCm||"","Enerji hesabı için","numeric")}
    ${fld("age","Yaş",st.age||"","","numeric")}
    <div class="mt-3 lbl">Cinsiyet (isteğe bağlı)</div>${segb("sex",[["m","Erkek"],["f","Kadın"],["","Belirtmem"]],st.sex)}
    <div class="mt-3 lbl">Günlük hareket düzeyi</div>${segb("actl",[["0","Az"],["1","Orta"],["2","Çok"]],String(st.act))}
    <p class="hint">Az: çoğunlukla oturarak, günde 5 bin adımdan az. Orta: ayakta çalışıyor ya da 5-9 bin adım atıyorsun. Çok: fiziksel iş ya da 10 bin+ adım. Planlı antrenmanı sayma, onu ayrıca kaydedersin.</p>
    ${unitsHtml()}
    <div class="row"><button class="btn ghost grow" data-act="health">Sağlık notların${st.healthNote?" (var)":""}</button>${helpBtn("hlpsn","Sağlık notların")}</div>
    ${helpBox("hlpsn","Hamilelik, yeme bozukluğu geçmişi, hastalık ya da ilaç varsa buraya yaz. Öneriler bunlara göre ihtiyatlı olmalı, hekim kontrolü gerekebilir.")}${st.chatRisk||chatEd()?`<div class="row"><span>Sohbetten bir sağlık işareti algılandı: kalori açığı, oruç ve program önerileri kapalı. Bu işareti uygulamadan kaldıramazsın; sağlık durumunu bir hekimle konuşmanı öneririz.</span></div>`:""}</div>
  <h2>Hedefler</h2><div class="card">
    ${fld("goalKg",`Hedef kilo (${wlab()})`,st.goalKg?dw(st.goalKg).replace(/,0$/,""):"","Boş bırakırsan kapalı")}
    ${fld("kcal","Günlük kalori (kcal)",st.kcal||"","Boş bırakırsan kapalı","numeric")}
    ${fld("waterMl","Günlük su (ml)",st.waterMl,"","numeric")}
    ${fld("glass","Bir bardak (ml)",st.glass,"Su düğmesinin eklediği miktar","numeric")}
    ${fld("sportWeek","Haftalık spor (dk)",st.sportWeek,"","numeric")}
    ${fld("stepGoal","Günlük adım",st.stepGoal,"Adım sayar açıksa","numeric")}
    ${swHelp("data-mk",st.moveKcalOn,"Hareket kalorisini hedefe ekle","Kilo vermek istiyorsan kapalı bırak.","hlpmk","Açıkken günlük kalori hedefine, kayıtlı antrenman, yürüyüş ve koşuların tahmini enerjisinin %50'si eklenir. Adımlar sayılmaz: hareket düzeyin ve kilo trendin günlük adımı zaten içerir, bu yüzden yarısı eklenir; yine de tahmin hatalıdır ve fazla yemene yol açabilir. Hedefi yalnız artırır, azaltmaz. Kilo vermek istiyorsan kapalı bırakman daha güvenlidir.")}
  </div>`;
  if(sub==="modules")return `<p class="hint">Açtığın takipler ilgili ekranlarda görünür. Kapatınca kayıtların silinmez.</p>
  <h2 class="grp">Takipler</h2><div class="card">${medSettingsHtml()}${vitalsSettingsHtml()}${cycSettingsHtml()}${fastSettingsHtml()}
  ${isNative()&&SC()?modRow(`data-act="${st.stepsOn?"stepsoff":"stepsopen"}"`,st.stepsOn,"Adım sayar","Günlük adımını telefon sayar.","hlpst","Telefonun adım sayacını kullanır; ilk açılışta fiziksel aktivite izni istenir. Adımlar yalnız bu telefonda durur."):""}
  ${motionSettingsHtml()}</div>
  <h2 class="grp">Salon antrenmanı</h2><div class="card">${swHelp("data-aw",st.awakeOn,"Antrenmanda ekranı açık tut","","hlpaw","Antrenman sürerken Salon açıkken ekran kararmaz. Başka sekmeye geçince, uygulamadan çıkınca ya da antrenman bitince normale döner.")}${swHelp("data-rpe",st.rpeOn,"Zorluk (RPE) alanı","","hlprpe","Set satırına isteğe bağlı 6-10 zorluk alanı ekler (10 en zor). Çok zorlandığın seanslarda (9,5 ve üstü) öneri ağırlığı artırmaz.")}${swHelp("data-gdv",st.gdVoice,"Rehberli modda sesli komut","","hlpgdv","Sesli komut telefonun metin okuma (TTS) sesiyle çalışır; Türkçe ses yoksa telefonun varsayılan dili kullanılır, ses hiç yoksa sessiz devam eder. Müzik çalarken kısa süre kısılır.")}${swRow("data-gdb",st.gdVib,"Rehberli modda titreşim")}
  <details class="acc"><summary>Dambıl ve plakalar</summary>${gGearHtml()}</details></div>`;
  if(sub==="coach")return viewProviders();
  if(sub==="reminders"){
    const nf={web:"Bildirimler yalnızca telefondaki uygulamada çalışır.",ok:"Hatırlatmalar açık.",denied:"Bildirim izni kapalı. Telefon ayarlarından Rehber için bildirimleri aç.","":""}[notifStatus]||notifStatus;
    return `<div class="card"><div class="status">${esc(nf)}</div>${isNative()&&!exactOk?`<p class="flush hint">Tam saat alarm izni kapalı: hatırlatmalar birkaç dakika gecikebilir.</p><div class="btns"><button class="btn ghost" data-act="fullalarm">Tam saat alarm iznini aç</button></div>`:""}${notifDiag?`<p class="flush hint">${esc(notifDiag)}</p>`:""}${isNative()?`<div class="btns"><button class="btn ghost" data-act="notiftest">Test bildirimi gönder</button>${oemXiaomi()?`<button class="btn ghost" data-act="oem">Xiaomi hatırlatma ayarları</button>`:""}</div>`:""}
    ${st.reminders.filter(remShown).map(r=>`<div class="rem"><span class="nm">${esc(r.name)}</span><input type="time" value="${r.t}" data-rt="${r.id}" aria-label="${esc(r.name)} saati"><label class="sw"><input type="checkbox" ${r.on?"checked":""} data-ro="${r.id}" aria-label="${esc(r.name)} açık"><span></span></label></div>`).join("")}
    <p class="hint">Bildirim metinleri sabittir; Rehber onları değiştirmez.</p></div>`;
  }
  if(sub==="data")return `<div class="card">${swRow('data-lk="toggle"',st.lockOn,"Uygulama kilidi",`Açarken ve ${LOCK_LABEL[st.lockGrace]} uzun aradan dönünce telefonun ekran kilidi (parmak izi, yüz, PIN, desen) sorulur`)}${st.lockOn?`<div class="lbl">Kilit ne zaman yeniden sorulsun?</div>${segb("lg",[[30,"30 saniye"],[120,"2 dakika"],[300,"5 dakika"]],st.lockGrace)}${st.lockGrace===300?`<p class="hint">Telefonu başkası alırsa 5 dakika boyunca açık kalabilir.</p>`:""}`:""}</div>
    <button class="mt-3 btn" data-act="drive">${Icons.svg("cloud")} Yedeği Drive'a gönder</button>
    <div class="mt-3 card">${navRow('data-act="backup"',"save","Yedekle veya geri yükle","Şifreli yedek dosyası oluştur ya da yükle")}${navRow('data-pv="csv"',"file","Tabloya aktar (CSV)","Excel ya da Sheets'te açılır")}${navRow('data-ci="open"',"file","Tablodan kayıt ekle (CSV)","Kilo, tansiyon ve şeker; önce önizleme gösterilir")}${navRow('data-imp="open"',"gym","Antrenman geçmişini içe aktar","Başka bir uygulamadan dışa aktardığın dosya")}${navRow('data-pv="open"',"lock","Gizlilik ve veri","Verilerin nerede durduğu")}${navRow('data-act="reset"',"trash","Tüm verileri sil","Geri alınamaz","  dng")}</div>
    <div class="card">${storeMsg()?`<p class="status" role="alert"><b>${storeMsg()[0]}.</b> ${storeMsg()[1]}</p>`:""}${loadNote?`<p class="status" role="status">${esc(loadNote)}</p>`:""}${COPIES.filter(([k])=>Store.get(k)!=null).map(([k,n])=>`<div class="row"><span class="grow"><b>${n}</b><small class="db mut sm">${fmt(Store.get(k).length*2/1e6)} MB</small></span>${k==="nw_state_previous"&&copyHeld()?`<button class="chip" data-act="copyseen">Gördüm</button>`:""}<button class="chip" data-act="copy:${k}">Dışa aktar</button><button class="chip" data-act="copydel:${k}">Sil</button></div>`).join("")}<p class="hint">${storeMsg()?`Kullanılan alan: yaklaşık ${fmt(storeBytes/1e6)} MB, sınır telefona göre 5-10 MB.`:"Alan yeterli."}</p>
    <p class="hint">Veriler yalnızca bu telefonda durur. Google otomatik yedeğine ve telefondan telefona aktarıma bilerek dahil edilmez. Uygulamayı silersen ya da telefon değiştirirsen kaybolur; yeni telefona geçmeden önce yedek dosyanı al.</p></div>${abHtml()}`;
  return `<div class="about"><img src="logo.png" alt="NeoWell logosu" width="72" height="72"><b>NeoWell</b><span class="mut sm">Sağlığın yeni kaynağı</span></div>
  <div class="card"><div class="lrow"><span>Sürüm</span><b class="num">${appVer?esc(appVer):"Tarayıcı"}</b></div>${appBuild?`<div class="lrow"><span>Derleme</span><b class="num">${esc(appBuild)}</b></div>`:""}</div>
  <div class="banner"><p class="m0">${MED_NOTE}</p></div>
  <div class="card">${navRow('data-pv="open"',"lock","Gizlilik ve veri","Veriler nerede durur, Rehber'e ne gider")}</div>
  <div class="card"><details class="acc"><summary>Besin verisi kaynakları ve lisanslar</summary><p class="hint">Genel besinlerin değerleri ABD Tarım Bakanlığı FoodData Central (SR Legacy) verisidir, CC0 kamu malı: fdc.nal.usda.gov. Türk ev yemekleri bu değerlerden tarifle hesaplanmış tahminlerdir. Sucuk, pastırma, hellim ve karşılaştırma değerlerinde Fransa ANSES Ciqual 2025 tablosu (Etalab Açık Lisans 2.0, ciqual.anses.fr) ile İngiltere McCance and Widdowson CoFID 2021 verisi (Public Health England, Open Government Licence v3.0, gov.uk) kullanıldı; her vekil kayıt kendi notunda belirtilir. Barkoddan gelen ürünler Open Food Facts verisini içerir, Open Database License (ODbL) ile sunulur: world.openfoodfacts.org. Tablo ve paket etiketi değerleri yaklaşık olup ±%20 sapabilir.</p></details></div>`;
}

const COPIES=[["nw_state_corrupt","Okunamayan eski kayıt kopyası"],["nw_state_previous","Geri yüklemeden önceki güvenlik kopyası"]];
const recView=()=>`<div class="card todo" role="alert"><h3>Kayıtların okunamadı</h3><p class="hint">Telefondaki kayıt bozuk görünüyor. Hiçbir şey silinmedi ve yeni kayıt yazılmıyor. Önce ham veriyi dışa aktar; sonra yeniden dene ya da boş başla.</p><div class="btns"><button class="btn" data-act="recexp">Ham veriyi dışa aktar</button><button class="btn ghost" data-act="rectry">Yeniden dene</button><button class="btn ghost" data-act="recnew">Boş başla</button></div></div>`;
function render(){
  const v=$("#view"),onb=obNeeded()||!!recovery;
  const de=document.documentElement;if(S.settings.theme)de.dataset.theme=S.settings.theme;else delete de.dataset.theme;
  $('meta[name="theme-color"]').content=getComputedStyle(de).getPropertyValue("--bg").trim();
  // Android 15+ status bar is transparent: the icon colour must follow the app theme, not the system's.
  const sb=plugin("SystemBars"),st={dark:"DARK",light:"LIGHT"}[S.settings.theme]||"DEFAULT";
  if(sb&&render.sb!==st){render.sb=st;sb.setStyle({style:st}).catch(()=>{})}
  document.body.classList.toggle("ob",onb);$("#back").hidden=onb||!UP(tab);
  if(onb){$("#ttl").innerHTML='<img class="brand" src="logo.svg" alt="" width="28" height="28">NeoWell';$("#streak").innerHTML="";$("#composer").hidden=true;v.innerHTML=recovery?recView():obView();widgetPush();return}
  const ttl={today:`${fd(dayKey())}, ${WEEKDAYS[new Date().getDay()]}`,coach:"Rehber",gym:"Salon",trend:"Trend",more:"Daha fazla",settings:"Ayarlar",exlib:"Egzersiz kütüphanesi",steps:"Adım raporu",labs:"Tahlil takibi",bp:"Tansiyon",glucose:"Şeker",meds:"İlaçlar",cycle:"Döngü",history:"Geçmiş",day:"Gün",...Object.fromEntries(SETTINGS_TABS.map(([k,t])=>["settings-"+k,t]))}[tab];
  $("#ttl").textContent=ttl;
  const n=streak();$("#streak").innerHTML=n>0&&tab==="today"?`${Icons.svg("flame")}<b class="num">${n}</b> gün`:"";$("#streak").setAttribute("aria-label",n+" günlük seri");
  v.innerHTML=(saveFail&&tab!=="today"&&tab!=="settings-data"?`<div class="card todo" role="alert"><div class="row"><span>${Icons.svg("save")} <b>${storeMsg()[0]}</b><small class="mut sm">${storeMsg()[1]}</small></span><button class="chip" data-act="databackup">Yedek al</button></div></div>`:"")+(tab==="coach"?viewCoach():tab==="today"?viewToday():tab==="gym"?viewGym():tab==="trend"?viewTrend():tab==="steps"?viewSteps():tab==="labs"?viewLabs():tab==="bp"?viewBp():tab==="glucose"?viewGlucose():tab==="exlib"?viewExlib():tab==="meds"?viewMeds():tab==="cycle"?viewCycle():tab==="history"?viewHistory():tab==="day"?viewDay():tab==="more"?viewMore():viewSettings());
  document.body.classList.toggle("coach",tab==="coach");document.body.classList.toggle("bg",tab==="today");$("#composer").hidden=tab!=="coach";cmpSet();
  if(tab==="coach")cScroll();
  phGuard();
  document.querySelectorAll("nav button").forEach(b=>{if(b.dataset.tab===navTab())b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});
  /* In the browser a sub-screen gets one history entry: the back key returns to the parent through popstate. */
  if(UP(tab)&&!history.state)history.pushState({sub:1},"");else if(!UP(tab)&&history.state)history.replaceState(null,"");
  widgetPush();
}
/* An automatic refresh must not wipe a form field that has focus or was filled in (differs from its default). */
const viewBusy=()=>!!document.activeElement?.matches("#view input,#view textarea")||[...document.querySelectorAll("#view input:not([type=checkbox]):not([type=radio]),#view textarea")].some(e=>e.value!==e.defaultValue);
const renderSoft=()=>{if(viewBusy())widgetPush();else render()};
function goBack(){tab=UP(tab);via=null;render();window.scrollTo(0,0)}
/* App version (CI sets 1.0.<number> on every build); known only on the phone. */
let appVer="",appBuild="";
plugin("App")?.getInfo?.().then(i=>{appVer=String(i.version||"").slice(0,20);appBuild=String(i.build||"").slice(0,20);if(tab==="settings-about")render()},()=>{});
const MW=()=>plugin("MedWake");
const WG=()=>plugin("Widget");
let widgetLast="";
/* The null values are intentional: the Java side shows "no goal" / hides steps when the key exists but is null, and "–" when the key is missing. */
function widgetPush(){
  if(!WG())return;
  const t=dayKey(),st=S.settings,d={day:t,water:sum("water",t,t),waterGoal:st.waterMl,glass:st.glass,kcalLeft:st.kcal>0?Math.round(kcalGoal(t)-sum("food",t,t)):null,steps:st.stepsOn||st.hcOn?stepsShown():null};
  const j=JSON.stringify(d);if(j===widgetLast)return;
  widgetLast=j;try{WG().update(d).catch(()=>{})}catch{}
}

