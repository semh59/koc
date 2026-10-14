const {ok,finish}=require("./ok");
const html=require("./html").full();
const vars=s=>Object.fromEntries([...s.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map(m=>[m[1],m[2]]));
const light=vars(html.match(/:root\{([^}]*)\}/)[1]);
const dark={...light,...vars(html.match(/prefers-color-scheme:dark\)\{\s*:root:not\(\[data-theme="light"\]\)\{([^}]*)\}/)[1])};
const lum=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const cr=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+.05)/(y+.05)};
const hex=(t,v)=>v[0]==="#"?v:t[v];
/* [foreground, background, minimum ratio, description]; a variable name or a literal color. 4.5 for text, 3 for large text and graphics. */
const PAIRS=[
 ["ink","bg",4.5,"body text"],["ink","card",4.5,"card text"],["mut","bg",4.5,"muted text (page)"],["mut","card",4.5,"muted text (card)"],
 ["mut","soft",4.5,"inactive segment / muted text on soft"],["prim","card",4.5,"link and button text"],["prim","bg",4.5,"primary text on the page"],
 ["prim-ink","prim",4.5,"primary button"],["prim-ink","prim-btn",4.5,"primary button background"],["prim-btn","card",3,"button on a card"],["prim","prim-ink",4.5,"weight card button"],["warn","card",4.5,"warning text (card)"],["warn","bg",4.5,"warning text (page)"],
 ["exercise","card",4.5,"exercise accent text"],["exercise","bg",4.5,"exercise accent text (page)"],["exercise-ink","exercise",4.5,"selected exercise button"],
 ["tact","tbg",4.5,"toast undo button"],["tfg","tbg",4.5,"toast text"],
 ["water","card",4.5,"water text (card)"],["water","bg",4.5,"water text (page)"],["water","soft",4.5,"water text (tonal)"],["kcal","card",4.5,"calorie text (card)"],["kcal","bg",4.5,"calorie text (page)"],["kcal","soft",4.5,"calorie text (tonal)"],
 ["water","card",3,"water chart"],["kcal","card",3,"calorie ring and goal line"],["prim","card",3,"chart line"],["exercise","card",3,"exercise chart"],["warn","card",3,"warning chart"],
 ["mut","card",3,"input border and faint lines"],
 ["prim","soft",4.5,"secondary (tonal) button text"],["prim","prim-soft",3,"active tab icon"],["ink","field",4.5,"input text"],["mut","field",4.5,"input placeholder"],["fbd","card",3,"input border (on a card)"],["fbd","bg",3,"input border (on the page)"],
 ["ban-ink","ban-bg",4.5,"warning box"],["inf-ink","inf-bg",4.5,"info box"],["ink","inf-bg",4.5,"info card"],["forecast-ink","forecast-bg",4.5,"forecast badge"],["info-ink","info",4.5,"blue button"],["ok","card",4.5,"success text (card)"],["ok","bg",4.5,"success text (page)"],
];
const DARK_ONLY=[["card-bd","bg",3,"card border on the page (no shadow in dark mode)"],["card-bd","card",3,"card border on the card"]];
for(const [name,t] of [["light",light],["dark",dark]]){
  for(const [f,b,min,d] of [...PAIRS,...(name==="dark"?DARK_ONLY:[])]){
    const fh=hex(t,f),bh=hex(t,b);if(!fh||!bh){ok(`${name}: ${d} (${f}/${b}) color is defined`,false,"yok");continue}
    const r=cr(fh,bh);ok(`${name}: ${d} ${f} ${fh} / ${b} ${bh} >= ${min}`,r>=min,r.toFixed(2));
  }
}
const forced=vars(html.match(/:root\[data-theme="dark"\]\{([^}]*)\}/)[1]),mediaDark=vars(html.match(/prefers-color-scheme:dark\)\{\s*:root:not\(\[data-theme="light"\]\)\{([^}]*)\}/)[1]);
const ovr=re=>[...html.matchAll(re)].map(m=>m[1]+m[2]);
ok("forcing dark (data-theme=dark) gives the same colors as the system dark mode: variables and the banner/info card",JSON.stringify(forced)===JSON.stringify(mediaDark)&&Object.keys(forced).length>=16&&JSON.stringify(ovr(/:root:not\(\[data-theme="light"\]\) (\.[\w.]+)(\{[^}]*\})/g))===JSON.stringify(ovr(/:root\[data-theme="dark"\] (\.[\w.]+)(\{[^}]*\})/g))&&/:root\[data-theme="dark"\]\{color-scheme:dark/.test(html)&&/:root\[data-theme="light"\]\{color-scheme:light\}/.test(html));
ok("toast and selected exercise button in index.html use theme variables",/#toast button\{[^}]*color:var\(--tact\)/.test(html)&&/#toast\{[^}]*background:var\(--tbg\);color:var\(--tfg\)/.test(html)&&/\.ok\.on\{[^}]*color:var\(--exercise-ink\)/.test(html));
finish();
