const fs=require("fs");
const html=fs.readFileSync(__dirname+"/../www/index.html","utf8");
let bad=0;const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+(typeof x==="string"?x:JSON.stringify(x))));if(!c)bad++};
const vars=s=>Object.fromEntries([...s.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map(m=>[m[1],m[2]]));
const light=vars(html.match(/:root\{([^}]*)\}/)[1]);
const dark={...light,...vars(html.match(/prefers-color-scheme:dark\)\{\s*:root:not\(\[data-theme="light"\]\)\{([^}]*)\}/)[1])};
const lum=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const cr=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+.05)/(y+.05)};
const hex=(t,v)=>v[0]==="#"?v:t[v];
/* [ön plan, zemin, en az oran, açıklama]; değişken adı ya da sabit renk. 4,5 metin, 3 büyük metin ve grafik. */
const PAIRS=[
 ["ink","bg",4.5,"gövde metni"],["ink","card",4.5,"kart metni"],["mut","bg",4.5,"gri metin (sayfa)"],["mut","card",4.5,"gri metin (kart)"],
 ["mut","soft",4.5,"pasif segment / gri metin soft üstünde"],["prim","card",4.5,"bağlantı ve düğme metni"],["prim","bg",4.5,"birincil metin sayfada"],
 ["prim-ink","prim",4.5,"birincil düğme"],["prim","prim-ink",4.5,"kilo kartı düğmesi"],["warn","card",4.5,"uyarı metni (kart)"],["warn","bg",4.5,"uyarı metni (sayfa)"],
 ["spor","card",4.5,"spor vurgu metni"],["spor","bg",4.5,"spor vurgu metni (sayfa)"],["spor-ink","spor",4.5,"seçili spor düğmesi"],
 ["tact","tbg",4.5,"toast 'Geri al' düğmesi"],["tfg","tbg",4.5,"toast metni"],
 ["su","card",3,"su grafiği"],["kcal","card",3,"kalori halkası ve hedef çizgisi"],["prim","card",3,"grafik çizgisi"],["spor","card",3,"spor grafiği"],["warn","card",3,"uyarı grafiği"],
 ["mut","card",3,"giriş kenarlığı ve soluk çizgiler"],
 ["prim","soft",4.5,"ikincil (tonlu) düğme metni"],["prim","prim-soft",3,"etkin sekme ikonu"],["ink","field",4.5,"giriş alanı metni"],["mut","field",4.5,"giriş alanı yer tutucusu"],
 ["ban-ink","ban-bg",4.5,"uyarı kutusu"],["inf-ink","inf-bg",4.5,"bilgi kutusu"],["ink","inf-bg",4.5,"bilgi kartı"],["tah-ink","tah-bg",4.5,"tahmin rozeti"],["#ffffff","sbtn",4.5,"mavi düğme"],
];
for(const [name,t] of [["açık",light],["koyu",dark]]){
  for(const [f,b,min,d] of PAIRS){
    const fh=hex(t,f),bh=hex(t,b);if(!fh||!bh){ok(`${name}: ${d} (${f}/${b}) renk tanımlı`,false,"yok");continue}
    const r=cr(fh,bh);ok(`${name}: ${d} ${f} ${fh} / ${b} ${bh} ≥ ${min}`,r>=min,r.toFixed(2));
  }
}
const forced=vars(html.match(/:root\[data-theme="dark"\]\{([^}]*)\}/)[1]),mediaDark=vars(html.match(/prefers-color-scheme:dark\)\{\s*:root:not\(\[data-theme="light"\]\)\{([^}]*)\}/)[1]);
const ovr=re=>[...html.matchAll(re)].map(m=>m[1]+m[2]);
ok("Koyu seçimi (data-theme=dark) sistem koyusuyla aynı renkler: değişkenler ve banner/bilgi kartı",JSON.stringify(forced)===JSON.stringify(mediaDark)&&Object.keys(forced).length>=16&&JSON.stringify(ovr(/:root:not\(\[data-theme="light"\]\) (\.[\w.]+)(\{[^}]*\})/g))===JSON.stringify(ovr(/:root\[data-theme="dark"\] (\.[\w.]+)(\{[^}]*\})/g))&&/:root\[data-theme="dark"\]\{color-scheme:dark/.test(html)&&/:root\[data-theme="light"\]\{color-scheme:light\}/.test(html));
ok("index.html'de toast ve seçili spor düğmesi tema değişkenlerini kullanır",/#toast button\{[^}]*color:var\(--tact\)/.test(html)&&/#toast\{[^}]*background:var\(--tbg\);color:var\(--tfg\)/.test(html)&&/\.ok\.on\{[^}]*color:var\(--spor-ink\)/.test(html));
if(bad){console.log(bad+" HATA");process.exit(1)}console.log("TAMAM");
