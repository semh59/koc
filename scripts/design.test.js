const {ok,finish}=require("./ok");
// Design system rules (docs/tasarim-dili.md): type scale, radius, confirmation sheet, heading order, dark theme, inline style.
const fs=require("fs"),path=require("path");
const www=path.join(__dirname,"..","www");
const html=require("./html").full();
const css=fs.readFileSync(path.join(www,"app.css"),"utf8");
const src=Object.fromEntries(["index.html",...require("./html").listJs()].map(f=>[f,fs.readFileSync(path.join(www,f),"utf8")]));src["index.html"]=html;
const all=Object.values(src).join("\n");
const block=re=>Object.fromEntries([...(html.match(re)||[,""])[1].matchAll(/--([\w-]+):\s*([^;]+);/g)].map(m=>[m[1],m[2].trim()]));
const root=block(/:root\{([^}]*)\}/),dark=block(/prefers-color-scheme:dark\)\{\s*:root:not\(\[data-theme="light"\]\)\{([^}]*)\}/),forced=block(/:root\[data-theme="dark"\]\{([^}]*)\}/);

// Type scale: only these px values, none under 12. SVG text is in viewBox units: in the narrowest card (296 px) the drawn height must be at least 12 px.
const SCALE=[12,13,15,16,18,20,24,34],SVG={".mmt":220,".mmf":220,"--fs-svg":340},CARD=296;
const px=v=>[...v.matchAll(/([\d.]+)px/g)].map(m=>+m[1]);
const fsTok=Object.entries(root).filter(([k])=>k.startsWith("fs-"));
ok("--fs-* tokens are on the scale (--fs-svg is in SVG units, drawn height at least 12 px)",fsTok.every(([k,v])=>SVG["--"+k]?px(v)[0]*CARD/SVG["--"+k]>=12:SCALE.includes(px(v)[0])),fsTok);
const decl=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap(m=>[...m[2].matchAll(/font-size:([^;]+)/g)].map(f=>[m[1].trim(),f[1].trim()]));
const badCss=decl.filter(([sel,v])=>{const s=Object.keys(SVG).find(k=>sel===k);if(s)return px(v)[0]*CARD/SVG[s]<12;
  if(/^min\(|^max\(|^clamp\(/.test(v))return px(v).some(n=>n<12);return px(v).some(n=>!SCALE.includes(n))});
ok("CSS font-size: no value off the scale or under 12 px (floors inside min/max included)",badCss.length===0,badCss);
const inl=[...all.matchAll(/style="([^"]*)"/g)].map(m=>m[1]),badInl=inl.flatMap(s=>px((s.match(/font-size:([^;"]+)/)||[,""])[1])).filter(n=>!SCALE.includes(n));
ok("inline font-size is on the scale (nothing under 12 px)",badInl.length===0,badInl);
ok("heading order: h1 > h2 > h3 > body",px(root["fs-h1"])[0]>px(root["fs-h2"])[0]&&px(root["fs-h2"])[0]>px(root["fs-h3"])[0]&&px(root["fs-h3"])[0]>px(root["fs-1"])[0]);

// Radius: only tokens (8/12/16/24/pill) or a circle.
const R={"r-xs":8,"r-s":12,"r":16,"r-xl":24,"r-pill":999};
ok("radius tokens are 8/12/16/24/999",Object.entries(R).every(([k,v])=>px(root[k]||"")[0]===v));
const rad=[...all.matchAll(/border-radius:([^;}"]+)/g)].map(m=>m[1].trim()),okRad=v=>v.split(/\s+/).every(p=>/^var\(--r(-xs|-s|-xl|-pill)?\)$/.test(p)||p==="50%"||p==="0");
ok("border-radius is only an --r* token or 50%",rad.every(okRad),[...new Set(rad.filter(v=>!okRad(v)))]);

// Shadow and motion
ok("shadow tokens: --sh-1 card, --sh-2 toast/sheet; no card shadow in dark mode",!!root["sh-1"]&&!!root["sh-2"]&&dark["sh-1"]==="none"&&!/var\(--sh\)/.test(all));
ok("motion tokens 120/200/320 ms, no transition:all, reduced-motion disables everything",root["dur-1"]===".12s"&&root["dur"]===".2s"&&root["dur-3"]===".32s"&&!/transition:all/.test(all)&&/prefers-reduced-motion:reduce\)\{\*\{transition:none!important;animation:none!important\}/.test(css));

// Confirmation: no browser confirm() call is left; everything uses confirmSheet.
const conf=Object.entries(src).flatMap(([f,s])=>s.split("\n").map((l,i)=>[f+":"+(i+1),l]).filter(([,l])=>/(^|[^.\w$])confirm\s*\(/.test(l)));
ok("no browser confirm() call",conf.length===0,conf.map(c=>c[0]));
ok("confirmSheet is defined, used at least 20 times, destructive ones are danger",/function confirmSheet\(/.test(html)&&(all.match(/confirmSheet\(\{/g)||[]).length>=20&&(all.match(/danger:true/g)||[]).length>=12);

// Dark theme: both blocks are identical; every color token of the light theme has a dark counterpart.
const colors=Object.keys(root).filter(k=>/^#[0-9a-f]{6}$/i.test(root[k])||/^rgb\(/.test(root[k]));
ok("dark theme is identical in both blocks (system and data-theme=dark)",JSON.stringify(dark)===JSON.stringify(forced));
ok("every color token has a dark counterpart",colors.every(k=>k in dark),colors.filter(k=>!(k in dark)));
ok("status colors are --ok and --info, no old --sbtn",!!root.ok&&!!root.info&&!/--sbtn/.test(all));

// Inline style and class markup
const nInl=inl.length;
ok("fewer than 80 inline styles",nInl<80,nInl);
const dup=Object.entries(src).flatMap(([f,s])=>[...s.matchAll(/<[a-z][\w-]*\s[^<>]*?\bclass="[^"]*"[^<>]*?\sclass="/g)].map(m=>f+": "+m[0].slice(0,60)));
ok("no element has two class attributes",dup.length===0,dup);
// Every CSS variable in use is defined (runtime-set ones excluded)
const RUNTIME=["nx","kb","vh","cmp","rs","safe-area-inset-top","safe-area-inset-bottom","safe-area-inset-left","safe-area-inset-right"];
const defd=new Set([...all.matchAll(/--([\w-]+):/g)].map(m=>m[1]).concat(RUNTIME)),used=[...new Set([...all.matchAll(/var\(--([\w-]+)/g)].map(m=>m[1]))];
ok("every var(--x) in use is defined",used.every(v=>defd.has(v)),used.filter(v=>!defd.has(v)));
// Components have a single definition
ok("common row: .row and its modifiers share one rule, at least 56 px",/\.row,\.prow,\.rrow,\.lrow,\.chkrow,\.rem,\.trow,\.field\{[^}]*min-height:56px/.test(css));
ok("the bottom tab label never breaks mid-word, height uses min-height",/nav button\{[^}]*min-height:var\(--nav-h\)[^}]*overflow-wrap:normal;word-break:keep-all/.test(css)&&!/nav button\{[^}]*overflow-wrap:anywhere/.test(css));
ok("toast position comes only from the --toast-b token",/#toast\{[^}]*bottom:var\(--toast-b\)/.test(css)&&!/#toast\{bottom:/.test(css));
finish();
