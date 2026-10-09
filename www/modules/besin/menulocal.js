"use strict";
/* Anahtarsız yerel haftalık menü: besin veritabanındaki hazır öğünlerden, kurallı ve cihazda. Ağ, anahtar ya da rıza gerekmez.
   Çıktı CoachLib.cleanMenu'nün (cat olmadan) kabul ettiği şemadır: {days:[{meals:[{m,items:[{n,q,k,p,c,f,g,a}]}]}]}. */
const MenuLocal=(()=>{
  const FOODS_=typeof FOODS!=="undefined"?FOODS:require("./foods.js").FOODS;
  const MAIN={
    kah:["Hafif kahvaltı (yumurta, peynir, tam buğday ekmeği)","Haşlanmış yumurta, ekmek ve domates","Sahanda yumurta ve ekmek","Çırpılmış yumurta, peynir ve ekmek","Peynirli omlet, ekmek ve salata","Sebzeli omlet ve tam buğday ekmeği","Menemen ve ekmek","Menemen, peynir ve ekmek","Muzlu cevizli yulaf lapası","Elmalı sütlü yulaf lapası","Yulaflı müsli kasesi","Süzme yoğurt, bal ve ceviz","Lor peynirli sebze kahvaltısı","Çılbır ve ekmek","Yumurtalı ekmek ve salatalık","Patatesli yumurta ve ekmek","Kaşarlı tost","Sade kahvaltı tabağı","Serpme kahvaltı (1 kişilik)","Beyaz peynir, domates ve ekmek"],
    ogl:["Kuru fasulye, pilav ve turşu","Etli nohut, pilav ve cacık","Mercimek yemeği, bulgur pilavı ve salata","Zeytinyağlı barbunya, pilav ve salata","Izgara tavuk, bulgur pilavı ve salata","Tavuk şiş, bulgur pilavı ve cacık","Izgara köfte, pilav ve salata","Hindi köfte, bulgur pilavı ve salata","İzmir köfte ve pilav","Tavuk salatası ve ekmek","Etli taze fasulye ve pilav","Etli bamya ve pilav","Etli ıspanak ve bulgur pilavı","Tas kebabı ve pilav","Tavuk sote ve pilav","Mantarlı tavuk sote ve bulgur pilavı","Mücver ve cacık","Mercimek çorbası, yeşil salata ve ekmek","Ton balıklı salata ve tam buğday ekmeği","Falafel, humus ve salata","Tavuk, pirinç ve brokoli","Hindi, bulgur ve sebze","Nohutlu salata","Kuru fasulye pilaki, pilav ve soğan"],
    aks:["Fırında levrek, fırın patates ve salata","Izgara somon, bulgur ve salata","Izgara somon, patates ve brokoli","Patlıcan musakka ve pilav","Patlıcan kebabı ve bulgur pilavı","Lahana dolması ve yoğurt","Etli biber dolması ve cacık","Zeytinyağlı türlü, yoğurt ve ekmek","Kıymalı ıspanak ve yoğurt","Fırında tavuk, patates ve salata","Tavuk güveç ve pilav","Yoğurtlu tavuk göğsü, bulgur ve salata","Spagetti napoliten ve yeşil salata","Kıymalı makarna ve cacık","Fırın makarna ve salata","Orman kebabı ve pilav","Kuzu güveç ve salata","Tavuk but, pilav ve salata","Somon, kinoa ve ıspanak","Sebzeli mercimek çorbası ve ekmek","Düğün çorbası ve ekmek","Terbiyeli tavuk çorbası ve ekmek","Zeytinyağlı biber dolması ve yoğurt","Etli bezelye ve pilav","Etli türlü, pilav ve cacık"],
    atis:["Yoğurt ve muz","Yoğurt ve elma","Yoğurt, bal ve ceviz","Yoğurt, çilek ve granola","Yoğurt ve kuru kayısı","Süzme yoğurt ve meyve","Badem ve kuru kayısı","Fındık ve kuru incir","Karışık kuruyemiş (badem, ceviz, fındık, kuru üzüm)","Fıstık ezmeli elma","Havuç ve humus","Havuç, salatalık ve haydari","Ayran ve kraker","Süt ve muz","Karışık meyve tabağı","Çilek, kivi ve muz","Haşlanmış yumurta, havuç ve salatalık","Meyve salatası ve yoğurt","Hurma ve ceviz","Kraker ve beyaz peynir"]
  };
  const FRUIT=["Elma","Muz","Portakal","Mandalina","Armut","Kivi","Çilek","Şeftali","Üzüm","Nar","Kayısı","Erik","Ananas","Greyfurt"],LIGHT=["Çoban salatası","Yeşil salata","Ayran","Yoğurt (yarım yağlı)","Kefir"];
  const SIDE={kah:FRUIT,ogl:[...LIGHT,...FRUIT],aks:[...LIGHT,...FRUIT]},SLOTS=["kah","ogl","aks","atis"];
  const MEAT=/tavuk|hindi|etli|kofte|kebab|kiyma|somon|levrek|balik|karides|kuzu|dana|doner|jambon|sucuk/;
  const NUT=/fistik|fistig|findik|ceviz|badem|kuruyemis|kaju/,DAIRY=/sut|yogurt|peynir|ayran|kefir|kaymak|\blor\b|kasar|tereyag|cacik|haydari|muhallebi|sutlac|granola|krep|kuymak|tost/,EGG=/yumurta|omlet|menemen|cilbir|mucver|krep|pankek|waffle/;
  /* [nottaki kalıp, elenen besin adı kalıbı]; ad ve not ASCII'ye indirilmiş karşılaştırılır. Tanınmayan kısıt uygulanmaz (unk). */
  const RULES=[[/f[iı]st[iı][kg]|ant?ep/,/fistik|fistig/],[/f[iı]nd[iı]k/,/findik/],[/ceviz/,/ceviz/],[/badem/,/badem/],[/kuruyemi|kaju/,NUT],
    [/\bsut\b|laktoz|sut urun/,DAIRY],[/yumurta/,EGG],[/gluten|bugday|colyak/,/ekmek|makarna|bulgur|tost|simit|borek|pogaca|lavas|yulaf|granola|kraker|spagetti|krep|pankek|musli|gozleme|eriste|pide|kuskus|cavdar/],
    [/balik|deniz/,/balik|somon|levrek|ton |karides|hamsi|midye/],[/vejetaryen|vejeteryan|et yemem|et yemiyorum/,MEAT]];
  const norm=s=>String(s||"").replace(/İ/g,"i").replace(/I/g,"ı").toLowerCase().replace(/ı/g,"i").replace(/ğ/g,"g").replace(/ş/g,"s").replace(/ç/g,"c").replace(/ö/g,"o").replace(/ü/g,"u");
  const r1=x=>Math.round(x*10)/10,STEP=0.25,QLO=0.5,QHI=3;
  function filters(note){
    const t=norm(note),out=[];
    for(const [k,ban] of RULES){const m=k.exec(t);if(m&&!/^[^,.;]{0,20}\b(yok|degil|olmayan)/.test(t.slice(m.index+m[0].length)))out.push(ban)}
    return out;
  }
  function make({foods=FOODS_,kcal,protein,note="",rng=Math.random}={}){
    if(!(kcal>=800&&kcal<=5000))return null;
    const by=new Map();for(const f of foods)if(!by.has(f.n))by.set(f.n,f);
    const bans=filters(note),ok=n=>by.has(n)&&!bans.some(b=>b.test(norm(n))),pool=(L)=>L.filter(ok);
    const P={},S={};for(const s of SLOTS){P[s]=pool(MAIN[s]);S[s]=pool(SIDE[s]||[]);if(P[s].length<4)return null}
    const pr=Array.isArray(protein)&&protein[0]>0?protein:null,use={},prev={};
    const pick=(L,own,n)=>{const c=L.filter(x=>(use[x]||0)+(own.has(x)?1:0)<2&&!own.has(x));const f=c.filter(x=>x!==prev[n]);const a=f.length?f:c;return a.length?a[Math.floor(rng()*a.length)]:null};
    const cost=(k,p)=>{const e=Math.abs(k-kcal)/kcal,pp=pr?(p<pr[0]?(pr[0]-p)/pr[0]:p>pr[1]?(p-pr[1])/pr[1]:0):0;return Math.max(0,e-0.03)*20+e+pp*0.5};
    const days=[];
    for(let d=0;d<7;d++){
      let best=null;
      for(let tries=0;tries<30;tries++){
        const own=new Set(),rows=[];
        for(const s of SLOTS){
          const n=pick(P[s],own,s);if(!n){rows.length=0;break}
          own.add(n);const its=[n];
          const sd=S[s].length?pick(S[s],own,s+"s"):null;if(sd){own.add(sd);its.push(sd)}
          rows.push({m:s,its:its.map(x=>{const f=by.get(x),g=f.u[0][1];return {f,g,q:1,k:f.k*g/100,p:(f.p||0)*g/100}})});
        }
        if(!rows.length)continue;
        const all=rows.flatMap(r=>r.its),sum=key=>all.reduce((s,i)=>s+i.q*i[key],0);
        const s0=kcal/sum("k");for(const i of all)i.q=Math.min(QHI,Math.max(QLO,Math.round(s0/STEP)*STEP));
        for(let n=0;n<120;n++){
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
  return {make,filters,MAIN,SIDE,FRUIT,LIGHT};
})();
if(typeof module!=="undefined")module.exports=MenuLocal;
