/* ---------- ekranlar ---------- */
/* Dokunma/sürükleme: en yakın noktanın değeri balonda. data-tip: [[x,y,metin]...] (viewBox birimi). */
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
/* Bir günün kayıt listesi (öğün grupları, su özeti, diğer kayıtlar): Bugün ve Gün ekranı ortak kullanır. */
function dayLogHtml(lk){
  const items=S.entries.filter(e=>e.day===lk&&e.type!=="adim");
  const vtxt=e=>e.type==="kilo"?`${dw(e.v)} ${wlab()}`:e.type==="yemek"?(e.v?e.lo!=null?`~${Math.round(e.v)} kcal<small class="db mut sm">${e.lo}-${e.hi}</small>`:`${Math.round(e.v)} kcal`:""):e.type==="spor"?`${Math.round(e.v)} dk`:"";
  const ttx=e=>e.type==="kilo"?"Tartı":esc(e.text||(e.type==="yemek"?"Öğün":"Antrenman"))+(e.kcal?` · ~${e.kcal} kcal tahmini`:"");
  const li=(e,tx)=>`<li class="row"><span class="t num">${e.time}</span><span class="ic">${Icons.svg(e.type)}</span>${tx}<span class="vl num">${vtxt(e)}</span><button class="del" data-del="${e.id}" aria-label="Kaydı sil">✕</button></li>`;
  const dl=LogLib.dayLog(items);
  const suTxt=dl.suMl<1000?`${Math.round(dl.suMl)} ml`:`${fmt(dl.suMl/1000,1)} L`;
  const log=items.length?`<ul class="log">${dl.groups.map(g=>`<li class="gh"><b>${g.n}</b><span class="num">${Math.round(g.kcal)} kcal</span></li>`+g.items.map(e=>li(e,`<button class="tx" data-meal="${e.id}" aria-label="${esc(ttx(e))}, öğünü değiştir">${ttx(e)}</button>`)).join("")).join("")}${dl.su.length?`<li class="row"><span class="t num">${dl.su[dl.su.length-1].time}</span><span class="ic">${Icons.svg("su")}</span><button class="tx" data-suall="1">Su: ${suTxt}, ${dl.su.length} kez</button><span class="vl" aria-hidden="true">›</span></li>`:""}${dl.dr.length?`<li class="row"><span class="t num">${dl.dr[dl.dr.length-1].time}</span><span class="ic">${Icons.svg("su")}</span><button class="tx" data-suall="1">Diğer içecekler: ${Math.round(dl.drMl)} ml, ${dl.dr.length} kez</button><span class="vl" aria-hidden="true">›</span></li>`:""}${dl.rest.sort((a,b)=>b.id-a.id).map(e=>li(e,`<span class="tx">${ttx(e)}</span>`)).join("")}</ul>`:`<div class="empty">${Icons.svg(lk===dayKey()?"su":"not")}<p class="mut">${lk===dayKey()?"Bugün henüz bir şey eklemedin. Bir bardak suyla başlayabilirsin.":"Bu güne ait bir şey yok."}</p></div>`;
  return {items,log};
}
/* Spor halkası günlüktür: haftalık hedefin (varsayılan 150 dk) günlük payı. Haftalık toplam Trend ve Salon'da. */
const sportDay=()=>Math.max(1,Math.round(S.settings.sportWeek/7));
/* Halka bir düğmedir: Bugün'ün ayrıntısı ve son 14 günün grafiği Gün ekranında, takvim oradan. */
const rb=(k,ad,inner)=>`<button class="rbtn" data-hg="focus:${k}" aria-label="${ad}, ayrıntı ve geçmiş">${inner}</button>`;
function viewBugun(){
  const t=dayKey(),st=S.settings;
  const wAll=weights(),days=Object.keys(wAll).sort();
  const cur=days.length?wAll[days[days.length-1]]:null,prev=days.length>1?wAll[days[days.length-2]]:null;
  const curDay=days[days.length-1];
  /* Kilo kartı Trend kısayolu: tek satır özet, grafik ve ayrıntı Trend'de. */
  let weight;
  if(cur==null){
    weight=`<button class="stepcard" data-act="kilo"><div class="scr"><span class="mut">${Icons.svg("kilo")} Kilo</span><span class="mut sm">Ekle ›</span></div><div class="mut sm">İlk tartını ekle; ilerlemen buradan başlar.</div></button>`;
  }else{
    const gi=goalInfo(cur,wAll[days[0]]),sl=Algo.slopePerWeek(wAll);
    const bits=[sl!=null?`${dwS(sl,2)} ${wlab()}/hafta`:prev!=null?`öncekine göre ${dwS(cur-prev)} ${wlab()}`:"",gi?(gi.done?"Hedefe ulaştın":`hedefe ${dw(gi.left)} ${wlab()}`):""].filter(Boolean);
    weight=`<button class="stepcard" data-tab="trend" aria-label="Kilo grafiğini Trend'de aç"><div class="scr"><span class="mut">${Icons.svg("kilo")} ${curDay===t?"Bugünkü tartı":"Son tartı, "+fd(curDay)}</span><span class="mut sm">Trend ›</span></div><div class="scr"><span class="big num wv">${dw(cur)} <small>${wlab()}</small></span><span class="mut sm num ws">${bits.join(" · ")}</span></div></button>`;
  }
  const su=sum("su",t,t),sh=st.waterMl,kc=sum("yemek",t,t),sw=sum("spor",t,t),sg=sportDay();
  const kgl=kcalGoal(t),kcP=kgl>0?kc/kgl:0;
  const sOn=S.settings.stepsOn&&isNative();
  /* Halka ortası kalanı gösterir; yapılan / hedef altta birimle. */
  const left=(v,g,u)=>v<g?[null,`${u} kaldı`]:["✓","Hedef tamam"];
  const [suC,suU]=left(su,sh,"L"),[spC,spU]=left(sw,sg,"dk");
  const kcC=kgl>0?Math.round(Math.abs(kgl-kc)):Math.round(kc),kcU=kgl>0?(kc>kgl?"kcal fazla":"kcal kaldı"):"kcal";
  const meals=S.entries.filter(e=>e.type==="yemek"&&e.day===t),mac=k=>meals.reduce((s,e)=>s+(e[k]||0),0);
  const pr=cur!=null?Algo.protein(riskInput(cur)):{};
  const macro=meals.some(e=>e.p||e.c||e.f)?`<div class="macro num">Protein <b>${Math.round(mac("p"))}</b>${pr.range?` / ${pr.range[0]}–${pr.range[1]}`:""} g${pr.doc?" (hedefi hekiminle belirle)":""}${meals.some(e=>e.c!=null||e.f!=null)?` · Karbonhidrat <b>${Math.round(mac("c"))}</b> g · Yağ <b>${Math.round(mac("f"))}</b> g`:""}</div>${pr.range||pr.doc?`<div class="mut sm macro">${Algo.PROTEIN_NOTE}</div>`:""}`:"";
  const mi=["fb","sg","na"].map(k=>[k,meals.filter(e=>e[k]!=null).length]).filter(x=>x[1]).map(([k,n])=>`${NLBL[k][0].toUpperCase()+NLBL[k].slice(1)} <b>${Math.round(mac(k))}</b> ${NUNIT(k)} (${n}/${meals.length})`);
  const nc=meals.filter(e=>e.c!=null).length,nf=meals.filter(e=>e.f!=null).length;
  const macroNote=macro&&meals.some(e=>e.c!=null||e.f!=null)&&(nc<meals.length||nf<meals.length)?`<div class="mut sm macro">Karbonhidrat ${nc}/${meals.length}, yağ ${nf}/${meals.length} öğünde veri var; toplam eksik olabilir.</div>`:"";
  const micro=mi.length?`<div class="macro num">${mi.join(" · ")} <span class="mut sm">öğünde veri var</span></div>`:"";
  /* Özet kartı: büyük kalori halkası ve kalan; su, spor ve adım küçük halkalarda; makrolar altında. */
  const rings=`<div class="card"><div class="rings">
    ${rb("kcal","Kalori",ring(kcP,"var(--kcal)",kcC,"Kalori",kgl>0?`${Math.round(kc)} / ${kgl} kcal`:"hedef yok",kcU,"main"))}
    <div class="rmini">${rb("su","Su",ring(su/sh,"var(--su)",suC||fmt((sh-su)/1000,1),"Su",`${fmt(su/1000,1)} / ${fmt(sh/1000,1)} L`,suU,"mini"+(suC?" done":"")))}
    ${rb("spor","Spor",ring(sw/sg,"color-mix(in srgb,var(--spor) 80%,var(--card))",spC||Math.round(sg-sw),"Spor",`${Math.round(sw)} / ${sg} dk`,spU,"mini"+(spC?" done":"")))}${sOn?stepCard():""}</div>
  </div>${macro}${macroNote}${micro}${moveAdd(t)?`<p class="pt-2 hint">Hedefe hareketten +${moveAdd(t)} kcal eklendi (kayıtlı antrenman ve yürüyüşün yarısı, tahmindir).</p>`:""}</div>`;
  const actions=`<div class="actions"><button class="btn act" data-act="yemek">${Icons.svg("plus")} Yemek ekle</button><div class="qa">
    <button class="chip act" data-act="su" aria-label="${st.glass} ml su ekle">${Icons.svg("su")} +${st.glass} ml</button><button class="chip" data-dk="open">${Icons.svg("su")} Başka içecek</button>
    <button class="chip act" data-act="kilo">${Icons.svg("kilo")} Kilo</button><button class="chip act" data-act="spor">${Icons.svg("spor")} Spor</button>
    <button class="chip act" data-act="not">${Icons.svg("not")} Not</button></div></div>`;
  const lk=keyOff(-logOff);
  const {items,log}=dayLogHtml(lk);
  const lname=logOff===0?"Bugün":logOff===1?"Dün":fd(lk);
  const dnav=dayNav("lo",lname,logOff===0);
  const lb=st.lastBackup,old=lb?Algo.dayNum(t)-Algo.dayNum(lb):null;
  const a7=(a,b)=>sum("adim",keyOff(a),keyOff(b));
  const row=(ic,b,sub,btns)=>`<div class="row"><span>${Icons.svg(ic)} ${b}<small class="mut sm">${sub}</small></span><div class="acts">${btns.map(([a,l])=>`<button class="chip" data-act="${a}">${l}</button>`).join("")}</div></div>`;
  /* Ayrı kartlar yerine tek liste: yalnız açık modülün bugün bekleyen işi; boşsa kart yok. */
  const todo=[storeMsg()?row("save",storeMsg()[0],storeMsg()[1],[["veriyedek","Yedek al"]]):"",
    abErr?row("cloud","Otomatik yedek alınamadı",abErr,[["abfix","Düzelt"]]):"",
    ...medTodo(),...fastTodo(),...vTodo(),
    S.walk?row("adim",S.walk.t1?"Yürüyüş kaydedilmedi":"Yürüyüş sürüyor","Adım raporunda bitir ya da kaydet.",[["walkgo","Aç"]]):"",
    sOn&&stepsRead&&st.stepWarnDay!==t&&LogLib.stalled(stepSnapAt,Date.now(),a7(-1,-1),a7(-8,-2)/7)?row("adim","Adım sayımı durmuş olabilir","Pil ayarında NeoWell'e kısıtlama koyma.",[["adimduz","Ayarla"],["adimgizle","Kapat"]]):"",
    isNative()&&!exactOk&&st.medOn&&S.meds.length?row("clock","İlaç alarmı birkaç dakika gecikebilir","Tam saat alarm izni kapalı. İzin verirsen tam saatinde çalar.",[["tamalarm","İzin ver"]]):"",
    isNative()&&!fsiOk&&st.medOn&&S.meds.length?row("clock","İlaç alarmı kilitli ekranı açmayabilir","Tam ekran bildirim izni kapalı. İzin verirsen alarm ekranı yakar.",[["tamekran","İzin ver"]]):"",
    isNative()&&oemXiaomi()&&!st.oemDone?row("bell","Hatırlatmalar için bir kez ayar gerekli","İki izin verince hatırlatmalar kaçmaz.",[["oem","Ayarla"]]):"",
    isNative()&&SC()&&!st.stepsOn&&!st.stepsAsked?row("adim","Adım sayarı aç","Telefonun sensörü sayar, hesap gerekmez.",[["adimac","Aç"],["adimdegil","Şimdi değil"]]):"",
    S.entries.length>=10&&(old==null||old>14)?row("cloud","Verilerini yedekle",old==null?"Henüz yedek dosyası almadın.":`Son yedek dosyası ${old} gün önce.`,[["drive","Yedekle"]]):""].filter(Boolean);
  /* İlk 3 iş görünür (veri kaybı uyarısı hep önde); kalanı katlanır, günlüğü aşağı itmez. */
  const todoCard=todo.length?`<div class="card todo"><h2 class="grp">Bugün yapılacaklar</h2>${todo.slice(0,3).join("")}${todo.length>3?`<details class="acc" ${keepOpen("todo")}><summary>${todo.length-3} iş daha</summary>${todo.slice(3).join("")}</details>`:""}</div>`:"";
  const minor=S.settings.age>0&&S.settings.age<18?`<div class="banner"><b>NeoWell 18 yaş ve üzeri için</b><p>Profilindeki yaş 18'in altında. Kalori açığı, oruç önerisi ve Koç kapalı. Beslenme ve kilo konusunda bir yetişkinle ve hekiminle ya da diyetisyeninle konuş. Yaş yanlışsa Ayarlar > Profil'den düzelt.</p></div>`:"";
  /* .bg2 dik ekranda görünmez; telefon yatayında sol sütun halkalar ve özet, sağ sütun yapılacaklar ve kayıtlar. */
  return `<div class="bg2"><div class="bgL">${minor}${rings}${actions}${habitRow()}</div><div class="bgR">${todoCard}${gTodayCard()}${weight}<div class="card coachc"><button class="coach" data-tab="koc">${esc(coach())} <b>Koç ›</b></button></div>${hasKey()?`<div class="btns">${cCommentBtn("plan")}</div>`:""}<div class="card">${dnav}${log}${items.some(e=>e.type==="yemek")?`<button class="lnk" data-act="tplyeni">Bu günün yemeklerinden şablon yap</button>`:""}<button class="lnk" data-tab="gecmis">Geçmiş ve takvim</button></div></div></div>`;
}

/* PDF raporlar tek yerde; paylaşım işleyicileri belgede dinlediği için ekrandan bağımsız çalışır. */
function reportRows(){
  const st=S.settings,r=(a,ic,t,sub)=>navRow(a,ic,t,sub);
  return `${r('data-wk="pdf"',"share","Son 7 gün raporu","Bugün dahil 7 gün, PDF")}${st.bpOn?r('data-vt="pdfmenu:t"',"heart","Tansiyon doktor raporu","Dönem seç, PDF"):""}${st.bsOn?r('data-vt="pdfmenu:s"',"su","Şeker doktor raporu","Dönem seç, PDF"):""}${LabLib.series(S.labs).length?r('data-lab="pdf"',"file","Tahlil raporu","Tüm sonuçlar, PDF"):""}`;
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
    stats=`<div class="stats kp">${cells.map(c=>`<div class="stat"><div class="k">${c[0]}</div><div class="v num">${c[1].replace(/ ((?:kg|lb)\/hafta|kg|lb)$/," <small>$1</small>")}</div></div>`).join("")}</div>${eta?`<p class="pt-2 hint">Son 3 haftanın eğimi sürerse ~${eta} hafta.</p>`:""}`;
  }
  let rows="",hasWeek=false;const hasSteps=st.stepsOn||sum("adim",keyOff(-6),t)>0;
  for(let i=6;i>=0;i--){
    const d=addDays(-i),k=dayKey(d),w=weights(k,k)[k],su=sum("su",k,k),kc=sum("yemek",k,k),sp=sum("spor",k,k),as=sum("adim",k,k);
    if(w!=null||su||kc||sp||as)hasWeek=true;
    rows+=`<tr><td class="${i==0?"today":""}">${GUNK[d.getDay()]} ${d.getDate()}</td><td class="num">${w!=null?dw(w):"–"}</td><td class="num">${su?fmt(su/1000,1):"–"}</td><td class="num">${kc?Math.round(kc):"–"}</td><td class="num">${sp?Math.round(sp):"–"}</td>${hasSteps?`<td class="num">${as?Math.round(as).toLocaleString("tr-TR"):"–"}</td>`:""}</tr>`;
  }
  const sw=sum("spor",keyOff(-6),t);
  const sd=new Set(S.entries.filter(e=>e.type==="spor"&&e.day>=keyOff(-6)).map(e=>e.day)).size;
  const empty=`${emptyCard("kilo","İlk tartını ekle","Grafik ikinci tartıdan sonra çizilir. Su, yemek, spor ve adımların da burada haftalık tabloda görünür.",`<button class="btn" data-act="kilo">${Icons.svg("kilo")} Kilo ekle</button>`)}`;
  /* Hiyerarşi: dönem seçici ve kilo grafiği üstte, özet altında; ayrıntı sekmelerde (hepsi DOM'da, yalnız seçili görünür). */
  const N=days.length?(range===0?trendAll():range):30,day=k=>sum("yemek",k,k),bag=baglantiCard();
  const tabs=[["kilo","Kilo",`${measureCard()}${photoCard()}${hasWeek?`<h2>Son 7 gün</h2><div class="card"><table><thead><tr><th>Gün</th><th>Kilo</th><th>Su (L)</th><th>kcal</th><th>Spor (dk)</th>${hasSteps?"<th>Adım</th>":""}</tr></thead><tbody>${rows}</tbody></table></div>`:""}`],
    ["bes","Beslenme",`<div class="card">${miniBars(N,day,"var(--kcal)",kcalGoal(t),"Kalori","kcal")}${miniBars(N,k=>sum("su",k,k),"var(--su)",st.waterMl,"Su","L",x=>fmt(x/1000,1))}</div>${gEnergy()}`],
    ["har","Hareket",`<div class="card">${miniBars(N,k=>sum("spor",k,k),"var(--spor)",0,"Spor","dk")}${hasSteps?miniBars(N,k=>sum("adim",k,k),"var(--prim)",st.stepGoal,"Adım","adım",x=>Math.round(x).toLocaleString("tr-TR")):""}</div>${cardioCard()}`],
    ...bag?[["bag","Bağlantılar",bag]]:[]];
  if(!tabs.some(x=>x[0]===tSec))tSec="kilo";
  const sub=h=>h.replace(/<h2>(.*?)<\/h2>/g,'<h3 class="grp">$1</h3>');
  const tabBar=`<div class="seg tabs" role="tablist" aria-label="Trend bölümleri">${tabs.map(([k,l])=>`<button role="tab" id="tt-${k}" data-tsec="${k}" aria-controls="tp-${k}" aria-selected="${k===tSec}">${l}</button>`).join("")}</div>${tabs.map(([k,,h])=>`<div class="tpan" role="tabpanel" id="tp-${k}" aria-labelledby="tt-${k}"${k===tSec?"":" hidden"}>${sub(h)}</div>`).join("")}`;
  return `${days.length?`<div class="seg" role="group" aria-label="Aralık"><button data-range="30" aria-pressed="${range==30}">30 gün</button><button data-range="90" aria-pressed="${range==90}">90 gün</button><button data-range="365" aria-pressed="${range==365}">1 yıl</button><button data-range="0" aria-pressed="${range==0}">Tümü</button></div>
  <div class="card">${chart(N)}${stats}</div>`:empty}${goalCard()}
  ${hasKey()?`<div class="btns">${cCommentBtn("weekly")}</div>`:""}
  ${lossAsk()?`<div class="btns"><button class="btn ghost" data-c="why">Bu hafta neden kilo vermedim?</button></div>`:""}
  ${tabBar}
  <h2>Daha fazla ölçüm</h2><div class="card">${vTrendCards()}${labTrendCard()}${navRow('data-tab="salon"',"spor","Haftalık spor",`${Math.round(sw)} / ${st.sportWeek} dk, ${sd} gün aktif`)}${reportRows()}</div>`;
}

let notifStatus="";
const fld=(id,label,val,small,mode)=>`<div class="field"><label for="${id}">${label}${small?`<small>${small}</small>`:""}</label><input id="${id}" type="text" inputmode="${mode||"decimal"}" value="${val}" data-set="${id}"></div>`;
const segb=(attr,opts,sel)=>`<div class="seg2" role="group">${opts.map(([v,l])=>`<button data-${attr}="${v}" aria-pressed="${sel===v}">${l}</button>`).join("")}</div>`;
/* Kapalı modülün hatırlatması listede görünmez. */
const remShown=r=>{const st=S.settings;return !((r.id===7||r.id===8)&&!st.bpOn)&&!(r.id===9&&!st.bsOn)&&!(r.id===11&&!st.fastOn)};
/* Liste satırı: Daha fazla, Ayarlar, Salon ve Veri ekranlarının ortak satırı. */
/* Onay satırı: etiket ve anahtar tek 48 px'lik dokunma alanı. */
const swRow=(attrs,on,label,sub="")=>`<label class="chkrow"><span class="nm">${label}${sub?`<small>${sub}</small>`:""}</span><span class="sw"><input type="checkbox" ${attrs}${on?" checked":""}><span></span></span></label>`;
const navRow=(attr,ic,t,sub,cls="")=>`<button class="prow${cls}" ${attr}><span class="aic">${Icons.svg(ic)}</span><span class="grow"><b>${t}</b>${sub?`<span class="mut sm">${sub}</span>`:""}</span><span class="plus" aria-hidden="true">›</span></button>`;
/* Ayrıntı (ⓘ): düğme kartın içinde, açıklama hemen altında açılır. swHelp anahtar satırının yanına koyar. */
const helpBtn=(id,name)=>`<button class="help" data-help="${id}" aria-expanded="false" aria-controls="${id}" aria-label="${name}: ayrıntı">${Icons.svg("info")}</button>`;
const helpBox=(id,html)=>`<div class="helpx" id="${id}" hidden>${html}</div>`;
const swHelp=(attrs,on,label,sub,id,help)=>`<div class="row">${swRow(attrs,on,label,sub)}${helpBtn(id,label)}</div>${helpBox(id,help)}`;
/* Modül satırı: anahtar, tek cümle, ⓘ ayrıntı; açıkken ek ayarları altında. Anahtar durumu yalnız ayardan gelir:
   açma bir onay penceresi ya da izin bekleyebilir, bu yüzden tarayıcının kendi işaretlemesi iptal edilir ve render çizer. */
const modRow=(attrs,on,name,line,id,help,extra="")=>swHelp(attrs+" data-mod",on,name,line,id,help)+(on&&extra?`<div class="pv-2">${extra}</div>`:"");
document.addEventListener("click",ev=>{if(ev.target.matches?.("input[data-mod]"))ev.preventDefault()},true);
document.addEventListener("click",ev=>{const b=ev.target.closest("[data-help]"),x=b&&document.getElementById(b.dataset.help);if(x){x.hidden=!x.hidden;b.setAttribute("aria-expanded",!x.hidden)}});
const AYAR=[["profil","Profil ve hedefler","user"],["hatir","Hatırlatmalar","bell"],["koc","Koç","koc"],["modul","Modüller","grid"],["veri","Veri ve yedek","data"],["hak","Hakkında","info"]];
/* Alt ekranın üst ekranı: başlıktaki ‹, Android ve tarayıcı geri tuşu buna döner. */
const PARENT={adim:"bugun",tahlil:"trend",tansiyon:"trend",seker:"trend",egz:"salon",ilac:"daha",dongu:"daha",gecmis:"daha",gun:"gecmis",ayar:"daha",...Object.fromEntries(AYAR.map(([k])=>["ayar-"+k,"ayar"]))};
/* Bir alt ekran başka bir sekmeden açıldıysa (Bugün'den İlaç, Daha fazla'dan Adım) ‹ ve etkin sekme oraya döner; derin bağlantıda sabit üst ekran geçerli. */
const UP=t=>via&&via.t===t?via.p:PARENT[t];
const topTab=t=>{for(let p;(p=UP(t));)t=p;return t};
/* Etkin sekme: İlaç, Adım ve Ayarlar hangi ekrandan açılırsa açılsın Daha fazla'da durur; ‹ ise açıldığı yere döner. */
const navTab=()=>/^(ilac|adim|ayar|gecmis|gun)/.test(tab)?"daha":topTab(tab);
/* Daha fazla: gruplu liste. Satırın dördüncü alanı ayar adıdır; kapalı modül listede görünmez, Modüller satırından açılır. */
const DAHA=[["Geçmiş",[['data-tab="gecmis"',"Geçmiş ve takvim","trend",0,"Her günün kaydı, aylık özet, arama"]]],["Sağlık takibi",[['data-tab="ilac"',"İlaçlar","ilac","medOn","İlaç saatleri ve bugünkü dozlar"],['data-tab="tansiyon"',"Tansiyon","heart","bpOn","Ev ölçümleri ve ortalama"],['data-tab="seker"',"Şeker","su","bsOn","Ölçümler ve ortalama"],['data-tab="tahlil"',"Tahlil takibi","file",0,"Sonuçlar ve değişim"],['data-tab="dongu"',"Döngü","moon","cycleOn","Dönem günleri ve tahmin"],['data-hb="more"',"Uyku ve ruh hali","smile",0,"Bugünkü uykun ve nasıl hissettiğin"]]],
  ["Beslenme ve hareket",[['data-tab="adim"',"Adım raporu","adim","stepsOn","Günlük adım ve yürüyüş"],['data-pl="open"',"Nabız","heart",0,"Kamerayla ölç, saatten günlük nabız"],['data-tab="egz"',"Egzersiz kütüphanesi","salon",0,"Hareketler, kaslar, ekipman"],['data-ckg="open"',"Kardiyo","spor",0,"Koşu, yürüyüş, bisiklet ve yüzme ekle"],['data-ms="open"',"Vücut ölçüleri","kilo",0,"Bel, kalça, göğüs, kol ve uyluk"],['data-ph="add"',"İlerleme fotoğrafı","camera","ph","Yalnız bu telefonda saklanır"]]],
  ["Veri",[['data-tab="ayar-veri"',"Uygulama kilidi","lock",0,"Açılışta telefonun ekran kilidini iste"],['data-tab="ayar-veri"',"Veri ve yedek","data",0,"Yedek, tabloya aktarma, silme"],['data-pv="open"',"Gizlilik ve veri","lock",0,"Veriler nerede durur, Koç'a ne gider"]]],
  ["Uygulama",[['data-tab="ayar"',"Ayarlar","ayar",0,"Profil, hatırlatmalar, Koç, görünüm"],['data-tab="ayar-modul"',"Modüller","grid",0,"Takipleri aç ya da kapat"],['data-tab="ayar-hak"',"Hakkında","info",0,"Sürüm, kaynaklar ve tıbbi uyarı"]]]];
function viewDaha(){
  const st=S.settings,on=k=>!k||(k==="ph"?phOk():st[k]);
  return DAHA.map(([g,rows])=>`<h2 class="grp">${g}</h2><div class="card">${rows.filter(r=>on(r[3])).map(([a,t,i,,sub])=>navRow(a,i,t,sub)).join("")}</div>`).join("");
}
function viewAyar(){
  const st=S.settings,sub=tab.slice(5);
  if(!sub){
    const on=[st.medOn&&"İlaç",st.fastOn&&"Oruç",st.stepsOn&&"Adım",st.bpOn&&"Tansiyon",st.bsOn&&"Şeker",st.cycleOn&&"Döngü"].filter(Boolean);
    const d={profil:[st.heightCm&&st.heightCm+" cm",st.age&&st.age+" yaş",st.goalKg&&"hedef "+dw(st.goalKg)+" "+wlab()].filter(Boolean).join(" · ")||"Boy, yaş ve hedefler",
      modul:on.length?on.join(", ")+" açık":"Hepsi kapalı",hatir:st.reminders.filter(r=>r.on&&remShown(r)).length+" hatırlatma açık",
      koc:keysStored()?"Anahtar kayıtlı":"Anahtar yok",veri:storeMsg()?storeMsg()[0]:st.lastBackup?"Son yedek "+fd(st.lastBackup):"Henüz yedek dosyası yok",hak:appVer?"Sürüm "+appVer:"Sürüm, kaynaklar ve tıbbi uyarı"};
    const grp=(g,ks)=>`<h2 class="grp">${g}</h2><div class="card">${AYAR.filter(([k])=>ks.includes(k)).map(([k,t,ic])=>navRow(`data-tab="ayar-${k}"`,ic,t,esc(d[k]))).join("")}</div>`;
    return `${grp("Kişisel",["profil","hatir"])}${grp("Koç ve modüller",["koc","modul"])}
    <h2 class="grp">Görünüm ve erişilebilirlik</h2><div class="card"><div class="lbl" id="thml">Tema</div>${segb("thm",[["","Sistem"],["light","Açık"],["dark","Koyu"]],st.theme).replace('role="group"','role="group" aria-labelledby="thml"')}<p class="hint">Yazı boyutu telefonun yazı boyutu ayarını izler.</p></div>
    ${grp("Veri ve uygulama",["veri","hak"])}`;
  }
  if(sub==="profil")return `<p class="hint">Kalori, su ve protein hedeflerin bu bilgilerle hesaplanır.</p><h2>Profil</h2><div class="card">
    ${fld("heightCm","Boy (cm)",st.heightCm||"","Enerji hesabı için","numeric")}
    ${fld("age","Yaş",st.age||"","","numeric")}
    <div class="mt-3 lbl">Cinsiyet (isteğe bağlı)</div>${segb("sex",[["m","Erkek"],["f","Kadın"],["","Belirtmem"]],st.sex)}
    <div class="mt-3 lbl">Günlük hareket düzeyi</div>${segb("actl",[["0","Az"],["1","Orta"],["2","Çok"]],String(st.act))}
    ${unitsHtml()}
    <div class="row"><button class="btn ghost grow" data-act="saglik">Sağlık notların${st.healthNote?" (var)":""}</button>${helpBtn("hlpsn","Sağlık notların")}</div>
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
  if(sub==="modul")return `<p class="hint">Açtığın takipler ilgili ekranlarda görünür. Kapatınca kayıtların silinmez.</p>
  <h2 class="grp">Takipler</h2><div class="card">${medSettingsHtml()}${vitalsSettingsHtml()}${cycSettingsHtml()}${fastSettingsHtml()}
  ${isNative()&&SC()?modRow(`data-act="${st.stepsOn?"adimkapat":"adimac"}"`,st.stepsOn,"Adım sayar","Günlük adımını telefon sayar.","hlpst","Telefonun adım sayacını kullanır; ilk açılışta fiziksel aktivite izni istenir. Adımlar yalnız bu telefonda durur."):""}
  ${motionSettingsHtml()}</div>
  <h2 class="grp">Salon antrenmanı</h2><div class="card">${swHelp("data-aw",st.awakeOn,"Antrenmanda ekranı açık tut","","hlpaw","Antrenman sürerken Salon açıkken ekran kararmaz. Başka sekmeye geçince, uygulamadan çıkınca ya da antrenman bitince normale döner.")}${swHelp("data-rpe",st.rpeOn,"Zorluk (RPE) alanı","","hlprpe","Set satırına isteğe bağlı 6-10 zorluk alanı ekler (10 en zor). Yalnız kayıt içindir, önerileri ve hesapları değiştirmez.")}${swHelp("data-gdv",st.gdVoice,"Rehberli modda sesli komut","","hlpgdv","Sesli komut telefonun metin okuma (TTS) sesiyle çalışır; Türkçe ses yoksa telefonun varsayılan dili kullanılır, ses hiç yoksa sessiz devam eder. Müzik çalarken kısa süre kısılır.")}${swRow("data-gdb",st.gdVib,"Rehberli modda titreşim")}
  <details class="acc"><summary>Dambıl ve plakalar</summary>${gGearHtml()}</details></div>`;
  if(sub==="koc")return viewProviders();
  if(sub==="hatir"){
    const nf={web:"Bildirimler yalnızca telefondaki uygulamada çalışır.",ok:"Hatırlatmalar açık.",denied:"Bildirim izni kapalı. Telefon ayarlarından Koç için bildirimleri aç.","":""}[notifStatus]||notifStatus;
    return `<div class="card"><div class="status">${esc(nf)}</div>${isNative()&&!exactOk?`<p class="flush hint">Tam saat alarm izni kapalı: hatırlatmalar birkaç dakika gecikebilir.</p><div class="btns"><button class="btn ghost" data-act="tamalarm">Tam saat alarm iznini aç</button></div>`:""}${notifDiag?`<p class="flush hint">${esc(notifDiag)}</p>`:""}${isNative()?`<div class="btns"><button class="btn ghost" data-act="bildirimtest">Test bildirimi gönder</button>${oemXiaomi()?`<button class="btn ghost" data-act="oem">Xiaomi hatırlatma ayarları</button>`:""}</div>`:""}
    ${st.reminders.filter(remShown).map(r=>`<div class="rem"><span class="nm">${esc(r.name)}</span><input type="time" value="${r.t}" data-rt="${r.id}" aria-label="${esc(r.name)} saati"><label class="sw"><input type="checkbox" ${r.on?"checked":""} data-ro="${r.id}" aria-label="${esc(r.name)} açık"><span></span></label></div>`).join("")}
    <p class="hint">Koç bağlıysa sabah, öğleden sonra ve akşam bildirim metinlerini her gün yeniden yazar. Bağlı değilse sabit metinler kullanılır.</p></div>`;
  }
  if(sub==="veri")return `<div class="card">${swRow('data-lk="toggle"',st.lockOn,"Uygulama kilidi","Açarken ve 30 saniyeden uzun aradan dönünce telefonun ekran kilidi (parmak izi, yüz, PIN, desen) sorulur")}</div>
    <button class="mt-3 btn" data-act="drive">${Icons.svg("cloud")} Yedeği Drive'a gönder</button>
    <div class="mt-3 card">${navRow('data-act="yedek"',"save","Yedekle veya geri yükle","Şifreli yedek dosyası oluştur ya da yükle")}${navRow('data-pv="csv"',"file","Tabloya aktar (CSV)","Excel ya da Sheets'te açılır")}${navRow('data-imp="open"',"salon","Antrenman geçmişini içe aktar","Başka bir uygulamadan dışa aktardığın dosya")}${navRow('data-pv="open"',"lock","Gizlilik ve veri","Verilerin nerede durduğu")}${navRow('data-act="sifirla"',"trash","Tüm verileri sil","Geri alınamaz","  dng")}</div>
    <div class="card">${storeMsg()?`<p class="status" role="alert"><b>${storeMsg()[0]}.</b> ${storeMsg()[1]}</p>`:""}${loadNote?`<p class="status" role="status">${esc(loadNote)}</p>`:""}${COPIES.filter(([k])=>Store.get(k)!=null).map(([k,n])=>`<div class="row"><span class="grow"><b>${n}</b><small class="db mut sm">${fmt(Store.get(k).length*2/1e6)} MB</small></span>${k==="koc_v1_onceki"&&copyHeld()?`<button class="chip" data-act="kopyagordum">Gördüm</button>`:""}<button class="chip" data-act="kopya:${k}">Dışa aktar</button><button class="chip" data-act="kopyasil:${k}">Sil</button></div>`).join("")}<p class="hint">${storeMsg()?`Kullanılan alan: yaklaşık ${fmt(storeBytes/1e6)} MB, sınır telefona göre 5-10 MB.`:"Alan yeterli."}</p>
    <p class="hint">Veriler yalnızca bu telefonda durur. Google otomatik yedeğine ve telefondan telefona aktarıma bilerek dahil edilmez. Uygulamayı silersen ya da telefon değiştirirsen kaybolur; yeni telefona geçmeden önce yedek dosyanı al.</p></div>${abHtml()}`;
  return `<div class="about"><img src="logo.png" alt="NeoWell logosu" width="72" height="72"><b>NeoWell</b><span class="mut sm">Sağlığın yeni kaynağı</span></div>
  <div class="card"><div class="lrow"><span>Sürüm</span><b class="num">${appVer?esc(appVer):"Tarayıcı"}</b></div>${appBuild?`<div class="lrow"><span>Derleme</span><b class="num">${esc(appBuild)}</b></div>`:""}</div>
  <div class="banner"><p class="m0">${MED_NOTE}</p></div>
  <div class="card">${navRow('data-pv="open"',"lock","Gizlilik ve veri","Veriler nerede durur, Koç'a ne gider")}</div>
  <div class="card"><details class="acc"><summary>Besin verisi kaynakları ve lisanslar</summary><p class="hint">Genel besinlerin değerleri ABD Tarım Bakanlığı FoodData Central (SR Legacy) verisidir, CC0 kamu malı: fdc.nal.usda.gov. Türk ev yemekleri bu değerlerden tarifle hesaplanmış tahminlerdir. Sucuk, pastırma, hellim ve karşılaştırma değerlerinde Fransa ANSES Ciqual 2025 tablosu (Etalab Açık Lisans 2.0, ciqual.anses.fr) ile İngiltere McCance and Widdowson CoFID 2021 verisi (Public Health England, Open Government Licence v3.0, gov.uk) kullanıldı; her vekil kayıt kendi notunda belirtilir. Barkoddan gelen ürünler Open Food Facts verisini içerir, Open Database License (ODbL) ile sunulur: world.openfoodfacts.org. Tablo ve paket etiketi değerleri yaklaşık olup ±%20 sapabilir.</p></details></div>`;
}

const COPIES=[["koc_v1_bozuk","Okunamayan eski kayıt kopyası"],["koc_v1_onceki","Geri yüklemeden önceki güvenlik kopyası"],["koc_v1_catisma","Çakışan eski kayıt kopyası (iki depodan eski olanı)"]];
const recView=()=>`<div class="card todo" role="alert"><h3>Kayıtların okunamadı</h3><p class="hint">Telefondaki kayıt bozuk görünüyor. Hiçbir şey silinmedi ve yeni kayıt yazılmıyor. Önce ham veriyi dışa aktar; sonra yeniden dene ya da boş başla.</p><div class="btns"><button class="btn" data-act="recexp">Ham veriyi dışa aktar</button><button class="btn ghost" data-act="rectry">Yeniden dene</button><button class="btn ghost" data-act="recnew">Boş başla</button></div></div>`;
function render(){
  const v=$("#view"),onb=obNeeded()||!!recovery;
  const de=document.documentElement;if(S.settings.theme)de.dataset.theme=S.settings.theme;else delete de.dataset.theme;
  $('meta[name="theme-color"]').content=getComputedStyle(de).getPropertyValue("--bg").trim();
  // Android 15+ durum çubuğu saydam: simge rengi sistemin değil uygulamanın temasına uymalı.
  const sb=window.Capacitor?.Plugins?.SystemBars,st={dark:"DARK",light:"LIGHT"}[S.settings.theme]||"DEFAULT";
  if(sb&&render.sb!==st){render.sb=st;sb.setStyle({style:st}).catch(()=>{})}
  document.body.classList.toggle("ob",onb);$("#back").hidden=onb||!UP(tab);
  if(onb){$("#ttl").innerHTML='<img class="brand" src="logo.svg" alt="" width="28" height="28">NeoWell';$("#streak").innerHTML="";$("#composer").hidden=true;v.innerHTML=recovery?recView():obView();widgetPush();return}
  const ttl={bugun:`${fd(dayKey())}, ${GUN[new Date().getDay()]}`,koc:"Koç",salon:"Salon",trend:"Trend",daha:"Daha fazla",ayar:"Ayarlar",egz:"Egzersiz kütüphanesi",adim:"Adım raporu",tahlil:"Tahlil takibi",tansiyon:"Tansiyon",seker:"Şeker",ilac:"İlaçlar",dongu:"Döngü",gecmis:"Geçmiş",gun:"Gün",...Object.fromEntries(AYAR.map(([k,t])=>["ayar-"+k,t]))}[tab];
  $("#ttl").textContent=ttl;
  const n=streak();$("#streak").innerHTML=n>0&&tab==="bugun"?`${Icons.svg("flame")}<b class="num">${n}</b> gün`:"";$("#streak").setAttribute("aria-label",n+" günlük seri");
  v.innerHTML=(saveFail&&tab!=="bugun"&&tab!=="ayar-veri"?`<div class="card todo" role="alert"><div class="row"><span>${Icons.svg("save")} <b>${storeMsg()[0]}</b><small class="mut sm">${storeMsg()[1]}</small></span><button class="chip" data-act="veriyedek">Yedek al</button></div></div>`:"")+(tab==="koc"?viewKoc():tab==="bugun"?viewBugun():tab==="salon"?viewSalon():tab==="trend"?viewTrend():tab==="adim"?viewAdim():tab==="tahlil"?viewTahlil():tab==="tansiyon"?viewTansiyon():tab==="seker"?viewSeker():tab==="egz"?viewEgz():tab==="ilac"?viewIlac():tab==="dongu"?viewDongu():tab==="gecmis"?viewGecmis():tab==="gun"?viewGun():tab==="daha"?viewDaha():viewAyar());
  document.body.classList.toggle("koc",tab==="koc");document.body.classList.toggle("bg",tab==="bugun");$("#composer").hidden=tab!=="koc";cmpSet();
  if(tab==="koc")cScroll();
  phGuard();
  document.querySelectorAll("nav button").forEach(b=>{if(b.dataset.tab===navTab())b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});
  /* Tarayıcıda alt ekran için bir geçmiş kaydı: geri tuşu popstate ile üst ekrana döner. */
  if(UP(tab)&&!history.state)history.pushState({sub:1},"");else if(!UP(tab)&&history.state)history.replaceState(null,"");
  widgetPush();
}
/* Sayfada odaktaki ya da doldurulmuş (varsayılandan farklı) bir form alanı varken kendiliğinden yenileme onu silmesin. */
const viewBusy=()=>!!document.activeElement?.matches("#view input,#view textarea")||[...document.querySelectorAll("#view input:not([type=checkbox]):not([type=radio]),#view textarea")].some(e=>e.value!==e.defaultValue);
const renderSoft=()=>{if(viewBusy())widgetPush();else render()};
function goBack(){tab=UP(tab);via=null;render();window.scrollTo(0,0)}
/* Uygulama sürümü (CI her derlemede 1.0.<numara> yapar); yalnız telefonda bilinir. */
let appVer="",appBuild="";
try{const a=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.App;if(a&&a.getInfo)a.getInfo().then(i=>{appVer=String(i.version||"").slice(0,20);appBuild=String(i.build||"").slice(0,20);if(tab==="ayar-hak")render()}).catch(()=>{})}catch(e){}
const MW=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.MedWake;
const WG=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Widget;
let widgetLast="";
/* null değerler bilinçli: Java tarafı anahtar varsa ama null ise "hedef yok"/adım gizli, anahtar yoksa "–" gösterir. */
function widgetPush(){
  if(!WG())return;
  const t=dayKey(),st=S.settings,d={day:t,water:sum("su",t,t),waterGoal:st.waterMl,glass:st.glass,kcalLeft:st.kcal>0?Math.round(kcalGoal(t)-sum("yemek",t,t)):null,steps:st.stepsOn||st.hcOn?stepsShown():null};
  const j=JSON.stringify(d);if(j===widgetLast)return;
  widgetLast=j;try{WG().update(d).catch(()=>{})}catch(e){}
}

