// Tasarım sistemi kuralları (docs/tasarim-dili.md): tip ölçeği, yarıçap, onay penceresi, başlık sırası, koyu tema, satır içi stil.
const fs=require("fs"),path=require("path");
const www=path.join(__dirname,"..","www");
const html=require("./html").full();
const css=fs.readFileSync(path.join(www,"app.css"),"utf8");
const src=Object.fromEntries(["index.html",...fs.readdirSync(www).filter(f=>f.endsWith(".js"))].map(f=>[f,fs.readFileSync(path.join(www,f),"utf8")]));src["index.html"]=html;
const all=Object.values(src).join("\n");
let bad=0;const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const block=re=>Object.fromEntries([...(html.match(re)||[,""])[1].matchAll(/--([\w-]+):\s*([^;]+);/g)].map(m=>[m[1],m[2].trim()]));
const root=block(/:root\{([^}]*)\}/),dark=block(/prefers-color-scheme:dark\)\{\s*:root:not\(\[data-theme="light"\]\)\{([^}]*)\}/),forced=block(/:root\[data-theme="dark"\]\{([^}]*)\}/);

// Tip ölçeği: yalnız bu px değerleri; 12 altı yok. SVG metinleri viewBox biriminde: en dar kartta (296 px) çizilen boy ≥ 12 px olmalı.
const SCALE=[12,13,15,16,18,20,24,34],SVG={".mmt":220,".mmf":220,"--fs-svg":340},CARD=296;
const px=v=>[...v.matchAll(/([\d.]+)px/g)].map(m=>+m[1]);
const fsTok=Object.entries(root).filter(([k])=>k.startsWith("fs-"));
ok("--fs-* token'ları ölçekte (--fs-svg SVG biriminde, çizilen boy ≥ 12 px)",fsTok.every(([k,v])=>SVG["--"+k]?px(v)[0]*CARD/SVG["--"+k]>=12:SCALE.includes(px(v)[0])),fsTok);
const decl=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap(m=>[...m[2].matchAll(/font-size:([^;]+)/g)].map(f=>[m[1].trim(),f[1].trim()]));
const badCss=decl.filter(([sel,v])=>{const s=Object.keys(SVG).find(k=>sel===k);if(s)return px(v)[0]*CARD/SVG[s]<12;
  if(/^min\(|^max\(|^clamp\(/.test(v))return px(v).some(n=>n<12);return px(v).some(n=>!SCALE.includes(n))});
ok("CSS'te font-size: ölçek dışı ya da 12 px altı değer yok (min/max içindeki taban dahil)",badCss.length===0,badCss);
const inl=[...all.matchAll(/style="([^"]*)"/g)].map(m=>m[1]),badInl=inl.flatMap(s=>px((s.match(/font-size:([^;"]+)/)||[,""])[1])).filter(n=>!SCALE.includes(n));
ok("satır içi stilde font-size ölçekte (11 px altı yok)",badInl.length===0,badInl);
ok("başlık sırası: h1 > h2 > h3 > gövde",px(root["fs-h1"])[0]>px(root["fs-h2"])[0]&&px(root["fs-h2"])[0]>px(root["fs-h3"])[0]&&px(root["fs-h3"])[0]>px(root["fs-1"])[0]);

// Yarıçap: yalnız token (8/12/16/24/hap) ya da daire.
const R={"r-xs":8,"r-s":12,"r":16,"r-xl":24,"r-pill":999};
ok("yarıçap token'ları 8/12/16/24/999",Object.entries(R).every(([k,v])=>px(root[k]||"")[0]===v));
const rad=[...all.matchAll(/border-radius:([^;}"]+)/g)].map(m=>m[1].trim()),okRad=v=>v.split(/\s+/).every(p=>/^var\(--r(-xs|-s|-xl|-pill)?\)$/.test(p)||p==="50%"||p==="0");
ok("border-radius yalnız --r* token'ı ya da 50%",rad.every(okRad),[...new Set(rad.filter(v=>!okRad(v)))]);

// Gölge ve hareket
ok("gölge token'ları: --sh-1 kart, --sh-2 toast/sheet; koyuda kart gölgesi yok",!!root["sh-1"]&&!!root["sh-2"]&&dark["sh-1"]==="none"&&!/var\(--sh\)/.test(all));
ok("hareket token'ları 120/200/320 ms, transition:all yok, reduced-motion hepsini kapatır",root["dur-1"]===".12s"&&root["dur"]===".2s"&&root["dur-3"]===".32s"&&!/transition:all/.test(all)&&/prefers-reduced-motion:reduce\)\{\*\{transition:none!important;animation:none!important\}/.test(css));

// Onay penceresi: tarayıcı confirm() çağrısı kalmadı; hepsi confirmSheet.
const conf=Object.entries(src).flatMap(([f,s])=>s.split("\n").map((l,i)=>[f+":"+(i+1),l]).filter(([,l])=>/(^|[^.\w$])confirm\s*\(/.test(l)));
ok("tarayıcı confirm() çağrısı yok",conf.length===0,conf.map(c=>c[0]));
ok("confirmSheet tanımlı, en az 20 kullanım, yıkıcı olanlar danger",/function confirmSheet\(/.test(html)&&(all.match(/confirmSheet\(\{/g)||[]).length>=20&&(all.match(/danger:true/g)||[]).length>=12);

// Koyu tema: iki blok aynı; açık temadaki her renk token'ının koyu karşılığı var.
const colors=Object.keys(root).filter(k=>/^#[0-9a-f]{6}$/i.test(root[k])||/^rgb\(/.test(root[k]));
ok("koyu tema iki blokta aynı (sistem ve data-theme=dark)",JSON.stringify(dark)===JSON.stringify(forced));
ok("her renk token'ının koyu karşılığı var",colors.every(k=>k in dark),colors.filter(k=>!(k in dark)));
ok("durum renkleri --ok ve --info, eski --sbtn yok",!!root.ok&&!!root.info&&!/--sbtn/.test(all));

// Satır içi stil ve sınıf yazımı
const nInl=inl.length;console.log("satır içi stil: "+nInl);
ok("satır içi stil 80'den az",nInl<80,nInl);
const dup=Object.entries(src).flatMap(([f,s])=>[...s.matchAll(/<[a-z][\w-]*\s[^<>]*?\bclass="[^"]*"[^<>]*?\sclass="/g)].map(m=>f+": "+m[0].slice(0,60)));
ok("bir etikette iki class özniteliği yok",dup.length===0,dup);
// Kullanılan her CSS değişkeni tanımlı (çalışmada yazılanlar hariç)
const RUNTIME=["nx","kb","vh","cmp","rs","safe-area-inset-top","safe-area-inset-bottom","safe-area-inset-left","safe-area-inset-right"];
const defd=new Set([...all.matchAll(/--([\w-]+):/g)].map(m=>m[1]).concat(RUNTIME)),used=[...new Set([...all.matchAll(/var\(--([\w-]+)/g)].map(m=>m[1]))];
ok("kullanılan her var(--x) tanımlı",used.every(v=>defd.has(v)),used.filter(v=>!defd.has(v)));
// Bileşenler tek tanım
ok("ortak satır: .row ve değiştiricileri tek kuralda, en az 56 px",/\.row,\.prow,\.rrow,\.lrow,\.chkrow,\.rem,\.trow,\.field\{[^}]*min-height:56px/.test(css));
ok("alt menü etiketi harf ortasından bölünmez, yükseklik min-height",/nav button\{[^}]*min-height:var\(--nav-h\)[^}]*overflow-wrap:normal;word-break:keep-all/.test(css)&&!/nav button\{[^}]*overflow-wrap:anywhere/.test(css));
ok("toast konumu yalnız --toast-b token'ından",/#toast\{[^}]*bottom:var\(--toast-b\)/.test(css)&&!/#toast\{bottom:/.test(css));
if(bad){console.log(bad+" HATA");process.exit(1)}console.log("Tüm tasarım sistemi testleri geçti");
