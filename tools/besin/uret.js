// www/foods.js dosyasını üretir: node tools/besin/uret.js [--kontrol]. Kaynaklar: genel.tsv, malzeme.tsv, tarif.txt, esad.tsv, mevcut.txt, usda-altkume.json.
const fs=require("fs"),path=require("path");
const H=__dirname+"/",OUT=path.join(H,"../../www/foods.js");
const rf=f=>fs.readFileSync(H+f,"utf8").replace(/\r/g,"");
const rd=f=>rf(f).split("\n").filter(l=>l.trim()&&!l.startsWith("#"));
const U=JSON.parse(rd("usda-altkume.json").join(""));
const YAG=new Set(["Zeytinyağı","Tereyağı","Ayçiçek yağı","Margarin","Mısırözü yağı"]);
const VERIM={cig:1,corba:.9,yemek:.85,pilav:.94,firin:.8,kizart:.85,hamur:.88,tatli:.9};
const r1=x=>Math.round(x*10)/10,q=x=>JSON.stringify(x);
const por=s=>s.split(";").map(x=>{const[l,g]=x.split("=");return[l.trim(),parseFloat(g)]});
const rows=[],ad={},alt={};const veri={};
const hata=m=>{console.error("HATA: "+m);process.exit(2)};
for(const l of rd("genel.tsv")){
  const[n,kw,p,e]=l.split("\t"),u=U[kw];if(!u)hata("altkümede yok: "+kw);
  veri[n]=u;rows.push([n,u.k,u.p,u.c,u.f,por(p),1]);if(e)alt[n]=e.trim();
}
for(const l of rd("malzeme.tsv")){const[n,kw]=l.split("\t");if(!U[kw])hata("altkümede yok: "+kw);veri[n]=U[kw]}
for(const l of rd("esad.tsv"))alt[l.split("\t")[0]]=l.split("\t")[1].trim();
const tarif=[];
for(const l of rd("tarif.txt")){
  const[n,y,p,m,e]=l.split(" | ").map(s=>s.trim()),yv=VERIM[y]??parseFloat(y);
  if(!(yv>0))hata("verim: "+n);
  const ing=m.split(";").map(s=>{const i=s.lastIndexOf(" ");return[s.slice(0,i).trim(),+s.slice(i+1)]});
  ing.forEach(([a])=>{if(!veri[a]&&a!=="Su")hata(n+": malzeme yok: "+a)});
  const hesap=sc=>{
    let yag=0,sade=0;const t={k:0,p:0,c:0,f:0};
    for(const[a,g]of ing){const v=veri[a],m=YAG.has(a)?sc:1;if(YAG.has(a))yag+=g*m;else sade+=g;for(const k in t)t[k]+=g*m*v[k]/100}
    const w=sade*yv+yag;return Object.fromEntries(Object.entries(t).map(([k,x])=>[k,x*100/w]));
  };
  const b=hesap(1),lo=Math.round(hesap(.6).k),hi=Math.round(hesap(1.5).k),k=Math.round(b.k);
  if(b.k>900)hata(n+": kcal>900");
  tarif.push([n,k,r1(b.p),r1(b.c),r1(b.f),por(p),0,...(lo<k&&k<hi?[[lo,hi]]:[])]);
  if(e)alt[n]=e;
}
const mevcut=rf("mevcut.txt").replace(/\s+$/,"");
const adlar=[...mevcut.matchAll(/^\s*\["([^"]+)"/gm)].map(m=>m[1]).concat(rows.map(r=>r[0]),tarif.map(r=>r[0]));
const t=new Set();adlar.forEach(a=>{const k=a.toLowerCase();if(t.has(k))hata("yinelenen ad: "+a);t.add(k)});
const satir=a=>"    ["+a.map(x=>q(x)).join(",")+"]";
const esad=Object.keys(alt).filter(n=>t.has(n.toLowerCase()));
Object.keys(alt).forEach(n=>{if(!t.has(n.toLowerCase()))hata("eş ad için kayıt yok: "+n)});
const body=mevcut+",\n    /* USDA SR Legacy genel besinler (değerler birebir) */\n"+rows.map(satir).join(",\n")+",\n    /* Türk ev yemekleri (tarif hesaplı) */\n"+tarif.map(satir).join(",\n");
const altS="const ALT="+q(Object.fromEntries(esad.map(n=>[n,alt[n]])))+";";
const out=rf("sablon.js").replace("/*SATIRLAR*/",()=>body).replace("/*CORE*/",()=>(mevcut.match(/^\s*\["/gm)||[]).length).replace("/*ALT*/",()=>"  "+altS);
if(process.argv[2]==="--kontrol"){if(fs.readFileSync(OUT,"utf8").replace(/\r/g,"")!==out){console.error("www/foods.js üretilen çıktıyla uyuşmuyor: node tools/besin/uret.js");process.exit(1)}process.exit(0)}
fs.writeFileSync(OUT,out);console.log(adlar.length+" kayıt ("+rows.length+" USDA, "+tarif.length+" tarif), "+Buffer.byteLength(out)+" bayt");
