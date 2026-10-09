"use strict";
/* Keyless local weekly menu: rule-based, on device, built from the ready-made meals in the food database. Needs no network, key or consent.
   The output is the schema CoachLib.cleanMenu accepts (without cat): {days:[{meals:[{m,items:[{n,q,k,p,c,f,g,a}]}]}]}. */
const MenuLocal=(()=>{
  const {FOODS:DB,foldTr:fold}=typeof FOODS!=="undefined"?{FOODS,foldTr}:require("./foods.js");
  const BY=new Map(DB.map(f=>[f.n,f]));
  const MAIN={
    breakfast:["Hafif kahvaltı (yumurta, peynir, tam buğday ekmeği)","Haşlanmış yumurta, ekmek ve domates","Sahanda yumurta ve ekmek","Çırpılmış yumurta, peynir ve ekmek","Peynirli omlet, ekmek ve salata","Sebzeli omlet ve tam buğday ekmeği","Menemen ve ekmek","Menemen, peynir ve ekmek","Muzlu cevizli yulaf lapası","Elmalı sütlü yulaf lapası","Yulaflı müsli kasesi","Süzme yoğurt, bal ve ceviz","Lor peynirli sebze kahvaltısı","Çılbır ve ekmek","Yumurtalı ekmek ve salatalık","Patatesli yumurta ve ekmek","Kaşarlı tost","Sade kahvaltı tabağı","Serpme kahvaltı (1 kişilik)","Beyaz peynir, domates ve ekmek"],
    lunch:["Kuru fasulye, pilav ve turşu","Etli nohut, pilav ve cacık","Mercimek yemeği, bulgur pilavı ve salata","Zeytinyağlı barbunya, pilav ve salata","Izgara tavuk, bulgur pilavı ve salata","Tavuk şiş, bulgur pilavı ve cacık","Izgara köfte, pilav ve salata","Hindi köfte, bulgur pilavı ve salata","İzmir köfte ve pilav","Tavuk salatası ve ekmek","Etli taze fasulye ve pilav","Etli bamya ve pilav","Etli ıspanak ve bulgur pilavı","Tas kebabı ve pilav","Tavuk sote ve pilav","Mantarlı tavuk sote ve bulgur pilavı","Mücver ve cacık","Mercimek çorbası, yeşil salata ve ekmek","Ton balıklı salata ve tam buğday ekmeği","Falafel, humus ve salata","Tavuk, pirinç ve brokoli","Hindi, bulgur ve sebze","Nohutlu salata","Kuru fasulye pilaki, pilav ve soğan"],
    dinner:["Fırında levrek, fırın patates ve salata","Izgara somon, bulgur ve salata","Izgara somon, patates ve brokoli","Patlıcan musakka ve pilav","Patlıcan kebabı ve bulgur pilavı","Lahana dolması ve yoğurt","Etli biber dolması ve cacık","Zeytinyağlı türlü, yoğurt ve ekmek","Kıymalı ıspanak ve yoğurt","Fırında tavuk, patates ve salata","Tavuk güveç ve pilav","Yoğurtlu tavuk göğsü, bulgur ve salata","Spagetti napoliten ve yeşil salata","Kıymalı makarna ve cacık","Fırın makarna ve salata","Orman kebabı ve pilav","Kuzu güveç ve salata","Tavuk but, pilav ve salata","Somon, kinoa ve ıspanak","Sebzeli mercimek çorbası ve ekmek","Düğün çorbası ve ekmek","Terbiyeli tavuk çorbası ve ekmek","Zeytinyağlı biber dolması ve yoğurt","Etli bezelye ve pilav","Etli türlü, pilav ve cacık"],
    snack:["Yoğurt ve muz","Yoğurt ve elma","Yoğurt, bal ve ceviz","Yoğurt, çilek ve granola","Yoğurt ve kuru kayısı","Süzme yoğurt ve meyve","Badem ve kuru kayısı","Fındık ve kuru incir","Karışık kuruyemiş (badem, ceviz, fındık, kuru üzüm)","Fıstık ezmeli elma","Havuç ve humus","Havuç, salatalık ve haydari","Ayran ve kraker","Süt ve muz","Karışık meyve tabağı","Çilek, kivi ve muz","Haşlanmış yumurta, havuç ve salatalık","Meyve salatası ve yoğurt","Hurma ve ceviz","Kraker ve beyaz peynir"]
  };
  const FRUIT=["Elma","Muz","Portakal","Mandalina","Armut","Kivi","Çilek","Şeftali","Üzüm","Nar","Kayısı","Erik","Ananas","Greyfurt"],LIGHT=["Çoban salatası","Yeşil salata","Ayran","Yoğurt (yarım yağlı)","Kefir"];
  const SIDE={breakfast:FRUIT,lunch:[...LIGHT,...FRUIT],dinner:[...LIGHT,...FRUIT]},SLOTS=["breakfast","lunch","dinner","snack"];
  const MEAT=/tavuk|hindi|etli|kofte|kebab|kiyma|somon|levrek|balik|karides|kuzu|dana|doner|jambon|sucuk/;
  const NUT=/fistik|fistig|findik|ceviz|badem|kuruyemis|kaju/,DAIRY=/sut|yogurt|peynir|ayran|kefir|kaymak|\blor\b|kasar|tereyag|cacik|haydari|muhallebi|sutlac|granola|krep|kuymak|tost/,EGG=/yumurta|omlet|menemen|cilbir|mucver|krep|pankek|waffle/;
  /* [pattern in the note, pattern of the food names to drop]; names and note are compared accent-folded. A restriction no rule recognizes is not applied (unk). */
  const RULES=[[/fistik|fistig|ant?ep/,/fistik|fistig/],[/findik/,/findik/],[/ceviz/,/ceviz/],[/badem/,/badem/],[/kuruyemi|kaju/,NUT],
    [/\bsut\b|laktoz|sut urun/,DAIRY],[/yumurta/,EGG],[/gluten|bugday|colyak/,/ekmek|makarna|bulgur|tost|simit|borek|pogaca|lavas|yulaf|granola|kraker|spagetti|krep|pankek|musli|gozleme|eriste|pide|kuskus|cavdar/],
    [/balik|deniz/,/balik|somon|levrek|ton |karides|hamsi|midye/],[/vejetaryen|vejeteryan|et yemem|et yemiyorum/,MEAT]];
  // An item's quantity multiplier moves in STEP between QLO and QHI. KCAL_MIN..KCAL_MAX is the target range with enough food variety to hit.
  const r1=x=>Math.round(x*10)/10,STEP=0.25,QLO=0.5,QHI=3,KCAL_MIN=800,KCAL_MAX=5000,TRIES=30,MAX_STEPS=120;
  function filters(note){
    const t=fold(note),out=[];
    for(const [k,ban] of RULES){const m=k.exec(t);if(m&&!/^[^,.;]{0,20}\b(yok|degil|olmayan)/.test(t.slice(m.index+m[0].length)))out.push(ban)}
    return out;
  }
  function make({kcal,protein,note="",rng=Math.random}={}){
    if(!(kcal>=KCAL_MIN&&kcal<=KCAL_MAX))return null;
    const bans=filters(note),pool=L=>L.filter(n=>!bans.some(b=>b.test(fold(n))));
    const mains={},sides={};for(const s of SLOTS){mains[s]=pool(MAIN[s]);sides[s]=pool(SIDE[s]||[]);if(mains[s].length<4)return null}
    const pr=Array.isArray(protein)&&protein[0]>0?protein:null,use={},prev={};
    const pick=(L,own,n)=>{const c=L.filter(x=>(use[x]||0)<2&&!own.has(x));const f=c.filter(x=>x!==prev[n]);const a=f.length?f:c;return a.length?a[Math.floor(rng()*a.length)]:null};
    // Plan cost: kcal deviation (penalized extra beyond 3%) plus half the relative deviation outside the protein range.
    const cost=(k,p)=>{const e=Math.abs(k-kcal)/kcal,pp=pr?(p<pr[0]?(pr[0]-p)/pr[0]:p>pr[1]?(p-pr[1])/pr[1]:0):0;return Math.max(0,e-0.03)*20+e+pp*0.5};
    const days=[];
    for(let d=0;d<7;d++){
      let best=null;
      for(let tries=0;tries<TRIES;tries++){
        const own=new Set(),rows=[];
        for(const s of SLOTS){
          const n=pick(mains[s],own,s);if(!n){rows.length=0;break}
          own.add(n);const its=[n];
          const sd=sides[s].length?pick(sides[s],own,s+"s"):null;if(sd){own.add(sd);its.push(sd)}
          rows.push({m:s,its:its.map(x=>{const f=BY.get(x),g=f.u[0][1];return {f,g,q:1,k:f.k*g/100,p:(f.p||0)*g/100}})});
        }
        if(!rows.length)continue;
        const all=rows.flatMap(r=>r.its),sum=key=>all.reduce((s,i)=>s+i.q*i[key],0);
        const s0=kcal/sum("k");for(const i of all)i.q=Math.min(QHI,Math.max(QLO,Math.round(s0/STEP)*STEP));
        for(let step=0;step<MAX_STEPS;step++){
          let bi=null,bd=0,bc=cost(sum("k"),sum("p"));
          for(const i of all)for(const dq of [-STEP,STEP]){
            const q=i.q+dq;if(q<QLO||q>QHI)continue;
            i.q=q;const c=cost(sum("k"),sum("p"));i.q-=dq;
            if(c<bc-1e-9){bc=c;bi=i;bd=dq}
          }
          if(!bi)break;bi.q+=bd;
        }
        const sc=cost(sum("k"),sum("p"))+0.03*all.reduce((s,i)=>s+(use[i.f.n]||0),0);
        if(!best||sc<best.sc)best={sc,rows};
      }
      if(!best)return null;
      days.push({meals:best.rows.map(r=>({m:r.m,items:r.its.map(i=>{
        const {f,g,q}=i,x=v=>v==null?null:r1(v*g/100*q),m=f.u[0][0].match(/^(\d+(?:[.,]\d+)?)\s*adet/);
        use[f.n]=(use[f.n]||0)+1;
        return {n:f.n,q,k:Math.round(f.k*g/100*q),p:x(f.p),c:x(f.c),f:x(f.f),g:Math.round(g*q),a:m?r1(+m[1].replace(",",".")*q):null};
      })}))});
      for(const r of best.rows)for(const [j,i] of r.its.entries())prev[r.m+(j?"s":"")]=i.f.n;
    }
    return {days,unk:!!String(note).trim()&&!bans.length};
  }
  return {make,filters,MAIN,FRUIT,LIGHT};
})();
if(typeof module!=="undefined")module.exports=MenuLocal;
