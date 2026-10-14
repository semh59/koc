/* ---------- UI state ---------- */
let tab="today",via=null,range=30,toastTimer=null,logOff=0,recList=[],lastDay=dayKey();
/* The goal weight shown on screens: 0 when it is off or fails the BMI check (a stored goal is still seen by the brakes). */
const goalWeight=cur=>{const st=S.settings;return st.goalKg>0&&!Algo.goalWhy(st.goalKg,st.heightCm,cur)?st.goalKg:0};
function goalInfo(cur,first){
  const g=goalWeight(cur);if(!(g>0))return null;
  const f=first==null?cur:first,dir=f>=g?-1:1;
  return {done:dir<0?cur<=g:cur>=g,left:Math.abs(cur-g),dir};
}
const QUOTES=[
  "Mükemmel gün yok, tutarlı hafta var.",
  "Terazi günlük dalgalanır, alışkanlık kalıcıdır.",
  "Bir öğünü kaçırmak günü bozmaz. Devam.",
  "Bugün sadece bir sonraki doğru seçimi yap.",
  "Yavaş ilerlemek de ilerlemektir.",
  "Kayıt tutmak farkındalıktır.",
  "Su iç, yürü, uyu. Temeller işe yarar.",
  "Bugün yaptığın 20 dakika, yapmadığın 60 dakikadan iyidir."
];
function dailyTip(){
  const t=dayKey(),h=new Date().getHours();
  const sh=S.settings.waterMl,water=sum("water",t,t);
  if(Algo.dayNum(t)%7===0&&!Object.keys(weights(t,t)).length&&h<12)return "Sabah tartısını gir. Tuvaletten sonra, kahvaltıdan önce en tutarlısı.";
  const exp=sh*Math.min(Math.max((h-8)/14,0),1);
  if(water<exp-250)return `Su biraz geride: ${Math.round(water)} ml içtin, şu an ${Math.round(exp)} ml civarı olmalı.`;
  if(!of("exercise",t).length&&h>=17)return "Bugün hareket yok. 20 dakikalık tempolu yürüyüş de sayılır.";
  return QUOTES[Algo.dayNum(t)%QUOTES.length];
}

/* ---------- components ---------- */
/* A round-capped ring looks closed at 93%: an incomplete ring is drawn at 92% at most so it is not mistaken for full. */
function ring(p,color,center,label,sub,unit,cls=""){
  const r=34,c=2*Math.PI*r,f=p>=1?1:Math.min(Math.max(p,0),.92);
  return `<div class="ring ${cls}"><svg viewBox="0 0 84 84" aria-hidden="true"><circle class="rt" cx="42" cy="42" r="${r}"/>${f>0?`<circle class="rp" cx="42" cy="42" r="${r}" style="stroke:${color}" stroke-dasharray="${(c*f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 42 42)"/>`:""}</svg><div class="rc num">${center}<small>${unit}</small></div><div class="rl">${label}</div><div class="rs num">${sub}</div></div>`;
}
/* "All": days from the first entry to today (at least 30). */
const trendAll=()=>Math.max(30,Algo.dayNum(dayKey())-Algo.dayNum(Log.all().reduce((m,x)=>x.day<m?x.day:m,dayKey()))+1);
function trendSeries(N){
  const keys=[];for(let i=N-1;i>=0;i--)keys.push(keyOff(-i));
  const w=weights(keys[0],keys[N-1]);
  const tr=Algo.trend(weights("0000",keys[N-1])); // the exponential average includes the history before the range
  const pts=[],ma=[];
  keys.forEach((k,i)=>{
    if(w[k]!=null){pts.push({i,v:w[k],k});ma.push({i,v:tr[k],k})}
  });
  return {keys,pts,ma};
}
function chart(N){
  const {keys,pts,ma}=trendSeries(N);
  if(pts.length<2)return `<p class="hint">Grafik için en az iki gün kilo gir.</p>`;
  const W=340,H=180,pl=52,pr=10,pt=10,pb=24;
  let lo=Math.min(...pts.map(p=>p.v)),hi=Math.max(...pts.map(p=>p.v));
  const g=goalWeight(pts[pts.length-1].v);
  /* The axis follows the data only: a far goal must not flatten the slope, it is shown at the edge with an arrow. */
  const pay=Math.max((hi-lo)*.15,.4);lo-=pay;hi+=pay;if(hi-lo<2){const m=(hi+lo)/2;lo=m-1;hi=m+1}
  const X=i=>pl+(W-pl-pr)*(N<=1?0:i/(N-1)),Y=v=>pt+(H-pt-pb)*(1-(v-lo)/(hi-lo));
  let grid="";
  for(let t=0;t<=3;t++){const v=lo+(hi-lo)*t/3,y=Y(v);grid+=`<line x1="${pl}" x2="${W-pr}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)" stroke-width="1"/><text x="${pl-6}" y="${(y+3.5).toFixed(1)}" text-anchor="end">${dw(v)}</text>`}
  const line=ma.map((p,k)=>(k?"L":"M")+X(p.i).toFixed(1)+" "+Y(p.v).toFixed(1)).join("");
  const dots=pts.map(p=>`<circle cx="${X(p.i).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="${N>120?1.6:3}" fill="var(--mut)" opacity=".55"/>`).join("");
  const goal=(g>0&&g>=lo&&g<=hi)?`<line x1="${pl}" x2="${W-pr}" y1="${Y(g).toFixed(1)}" y2="${Y(g).toFixed(1)}" stroke="var(--kcal)" stroke-width="1.6" stroke-dasharray="5 4"/>`:"";
  const edge=g>0&&!goal?`<text x="${W-pr}" y="${g>hi?pt+10:H-pb-4}" text-anchor="end">${g>hi?"▲":"▼"} Hedef ${dw(g)} ${wlab()}</text>`:"";
  const tip=esc(JSON.stringify(pts.map((p,k)=>[+X(p.i).toFixed(1),+Y(p.v).toFixed(1),`${fd(p.k)} · ${dw(p.v)} ${wlab()} · trend ${dw(ma[k].v)}`])));
  const xl=[0,Math.floor((N-1)/2),N-1].map((i,k)=>`<text x="${X(i).toFixed(1)}" y="${H-6}" text-anchor="${k==0?"start":k==2?"end":"middle"}">${fd(keys[i])}</text>`).join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Kilo grafiği" data-tip="${tip}">${grid}${goal}${edge}${dots}<path d="${line}" fill="none" stroke="var(--prim)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${xl}</svg>
  <div class="legend"><span><i style="background:var(--prim)"></i>Trend çizgisi</span><span><i style="background:var(--mut);opacity:.6"></i>Günlük tartı</span>${goal?`<span><i style="background:var(--kcal)"></i>Hedef</span>`:""}</div>`;
}

/* Small bar chart for Trend: the last N days, dashed line = daily goal; touching shows a value bubble (chartTip). */
/* Beyond 120 days the bars are weekly averages (monthly beyond 400): a daily bar would be thinner than a pixel. */
function miniBars(N,val,color,goal,name,unit,f=Math.round){
  const W=340,H=110,pt=6,pb=22,keys=[];for(let i=N-1;i>=0;i--)keys.push(keyOff(-i));
  const v=keys.map(val),has=v.filter(x=>x>0);
  if(!has.length)return `<p class="hint">${name}: bu aralıkta kayıt yok.</p>`;
  const step=N>400?30:N>120?7:1,B=Math.ceil(N/step),bk=Array.from({length:B},(_,j)=>{const a=v.slice(j*step,j*step+step).filter(x=>x>0);return a.length?a.reduce((s,x)=>s+x,0)/a.length:0});
  const max=Math.max(goal||0,...bk)*1.08,bw=W/B,Y=x=>pt+(H-pt-pb)*(1-x/max),avg=has.reduce((a,b)=>a+b,0)/has.length;
  const first=j=>keys[j*step],last=j=>keys[Math.min(N-1,j*step+step-1)];
  const bars=bk.map((x,i)=>x>0?`<rect x="${(i*bw+bw*.15).toFixed(1)}" y="${Y(x).toFixed(1)}" width="${(bw*.7).toFixed(1)}" height="${(H-pb-Y(x)).toFixed(1)}" rx="${bw>8?3:1}" fill="${color}"/>`:"").join("");
  const gl=goal>0?`<line x1="0" x2="${W}" y1="${Y(goal).toFixed(1)}" y2="${Y(goal).toFixed(1)}" stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="4 3" opacity=".6"/>`:"";
  const xl=[0,Math.floor((B-1)/2),B-1].map((i,k)=>`<text x="${k==0?0:k==2?W:((i+.5)*bw).toFixed(1)}" y="${H-5}" text-anchor="${k==0?"start":k==2?"end":"middle"}">${fd(k==2?last(i):first(i))}</text>`).join("");
  const tip=esc(JSON.stringify(bk.map((x,i)=>[+((i+.5)*bw).toFixed(1),+Y(x).toFixed(1),step>1?`${fd(first(i))} - ${fd(last(i))} · ort. ${f(x)} ${unit}`:`${fd(keys[i])} · ${f(x)} ${unit}`])));
  return `<div class="mb-3"><div class="lhead"><b>${name}</b><span class="mut sm num">kayıtlı gün ort. ${f(avg)} ${unit}${goal>0?` · hedef ${f(goal)}`:""}</span></div><svg class="bars w100" viewBox="0 0 ${W} ${H}" role="img" aria-label="${name}, son ${N} gün${step>1?`, ${step==7?"haftalık":"aylık"} ortalamalar`:""}, kayıtlı gün ortalaması ${f(avg)} ${unit}" data-tip="${tip}">${gl}${bars}${xl}</svg></div>`;
}
let tSec="weight";
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-tsec]");if(!b)return;tSec=b.dataset.tsec;
  document.querySelectorAll("[data-tsec]").forEach(x=>x.setAttribute("aria-selected",x===b));document.querySelectorAll(".tpan").forEach(p=>p.hidden=p.id!=="tp-"+tSec)});

