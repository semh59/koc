const {ok,finish}=require("./ok");
// Design system rules (docs/design-language.md): type scale, radius, confirmation sheet, heading order, dark theme, inline style.
const fs=require("fs"),path=require("path");
const www=path.join(__dirname,"..","www");
const html=require("./html").full();
const css=fs.readFileSync(path.join(www,"app.css"),"utf8");
const src=Object.fromEntries(["index.html",...require("./html").listJs()].map(f=>[f,fs.readFileSync(path.join(www,f),"utf8")]));src["index.html"]=html;
const all=Object.values(src).join("\n");
const block=re=>Object.fromEntries([...(html.match(re)||[,""])[1].matchAll(/--([\w-]+):\s*([^;]+);/g)].map(m=>[m[1],m[2].trim()]));
const root=block(/:root\{([^}]*)\}/),dark=block(/prefers-color-scheme:dark\)\{\s*:root:not\(\[data-theme="light"\]\)\{([^}]*)\}/),forced=block(/:root\[data-theme="dark"\]\{([^}]*)\}/);

// Type scale: only these px values, none under 12. SVG text is in viewBox units: at least 12 units (no exemption for the muscle map).
const SCALE=[14,15,16,18,20,24,34],SVGSEL=[".mmt",".mmf","--fs-svg"];
const px=v=>[...v.matchAll(/([\d.]+)px/g)].map(m=>+m[1]);
const fsTok=Object.entries(root).filter(([k])=>k.startsWith("fs-"));
ok("--fs-* tokens are on the scale (--fs-svg is in SVG units, at least 12)",fsTok.every(([k,v])=>SVGSEL.includes("--"+k)?px(v)[0]>=12:SCALE.includes(px(v)[0])),fsTok);
const decl=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap(m=>[...m[2].matchAll(/font-size:([^;]+)/g)].map(f=>[m[1].trim(),f[1].trim()]));
const badCss=decl.filter(([sel,v])=>{if(SVGSEL.includes(sel))return px(v)[0]<12;
  if(/^min\(|^max\(|^clamp\(/.test(v))return px(v).some(n=>n<12);return px(v).some(n=>!SCALE.includes(n))});
ok("CSS font-size: no value off the scale or under 12 px/units (floors inside min/max included)",badCss.length===0,badCss);
ok("muscle map labels are at least 12 viewBox units",decl.filter(([s])=>s===".mmt"||s===".mmf").length===2);
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
// Shared components: one hit-size token, helper classes instead of fixed inline values, one empty-state component, one button grid.
ok("--hit token is 48 px and no control size is hard-coded to 44 px",root.hit==="48px"&&!/(?<!--rs:)44px/.test(css.replace(/header\{[^}]*\}/g,"")),root.hit);
const staticInl=inl.filter(v=>!v.includes("${")&&!/^(background|fill|stroke):var\(--[\w-]+\)(;opacity:[.\d]+)?$/.test(v));
ok("a fixed inline style is only a colour token; sizes and spacing use helper classes",staticInl.length===0,staticInl);
const offScale=[...css.matchAll(/(?:margin|padding|gap)[a-z-]*:([^;}]*)/g)].map(m=>m[1]).filter(v=>/(?<![\d.\-])(6|10|14)px/.test(v));
ok("margin, padding and gap use the 4/8/12/16/24/32 scale (no 6, 10 or 14 px)",offScale.length===0,offScale);
ok("empty states come from emptyCard(); no hand-written card empty or bare .empty block outside the Day list",(Object.entries(src).filter(([f])=>f!=="index.html").map(e=>e[1]).join("").match(/class="card empty"/g)||[]).length===1&&!/<div class="empty">\$\{Icons\.svg\("note"\)\}<p class="mut">"/.test(all));
ok("one button grid: .bgrid replaces .lbtns, .cfbtns and .hrow",!/lbtns|cfbtns|\.hrow|class="hrow/.test(all)&&/\.bgrid\{/.test(css));
ok("one check mark glyph (no heavy check mark)",!all.includes("✔"));
// Accessibility and visual rules added with the UI audit (P9.1, P9.2).
const jsAll=Object.entries(src).filter(([f])=>f!=="index.html").map(([f,t])=>[f,t]);
const hexJs=jsAll.filter(([f,t])=>f!=="kernel/algo.js"&&/["'`]#[0-9a-fA-F]{6}/.test(t)).map(([f])=>f);
ok("canvas report colors live only in Algo.PAGE.c (no hex literal in any module or main script)",hexJs.length===0&&/PAGE=\{[^}]*c:\{bg:/.test(src["kernel/algo.js"]),hexJs);
ok("toast: plain message 6 s, undo 10 s, undo of a deletion 30 s",/UNDO_MS=10000,DEL_UNDO_MS=30000,TOAST_MS=6000/.test(all)&&/undoable\?\(del\?DEL_UNDO_MS:UNDO_MS\):TOAST_MS/.test(all));
ok("first-run welcome asks \"Yazıyı büyüt?\" with the comfort switch",/swRow\("data-comfy",S\.settings\.comfy,"Yazıyı büyüt\?"/.test(src["modules/data/onboardui.js"]));
const medui=src["modules/meds/medui.js"];
ok("repeated dose buttons carry the medication name in their accessible name",["take","skip"].every(a=>[...medui.matchAll(new RegExp(`data-md="${a}:[^"]*"([^>]*)>`,"g"))].every(m=>/aria-label="[^>]*\$\{esc\(m\.n\)\}/.test(m[1]))));
ok("lab row switch and Today vitals chip have their own names",/id="lc\$\{i\}" aria-label="Satırı kaydet: /.test(src["modules/labs/labui.js"])&&/data-vt="\$\{act\}" aria-label="\$\{label\} ölçümü ekle"/.test(src["modules/vitals/vitalsui.js"]));
ok("one button family: no .sbtn, .rbtn and .lnk share one rule",!/sbtn/.test(all)&&/\.rbtn,\.lnk\{[^}]*min-height:var\(--hit\)/.test(css)&&/\.btn\.info\{/.test(css));
const sqr=[...css.matchAll(/([^{}]+)\{[^{}]*[^-]height:var\(--hit\)/g)].map(m=>m[1].trim().split(",").pop().trim().replace(/^.*\}/,"")).filter(x=>!/^(#back|\.del|\.dnav button|#csend|\.gdx|\.shx|\.sw|\.sw input)$/.test(x));
ok("fixed height:var(--hit) only on icon-only squares; text controls use min-height",sqr.length===0,sqr);
ok("section label .grp is an h2 on screens and an h4 in sheets (no div.grp)",!/<div class="grp"/.test(all)&&!/<h3 class="grp">(?!\$1)/.test(all.replace(/<h3 class="grp">\$1<\/h3>/,"")));
ok("every switch has its own 48 px touch area, also when it is not the whole row (reminders)",/\.sw\{[^}]*height:var\(--hit\)/.test(css)&&/\.sw span\{[^}]*inset:calc\(\(var\(--hit\) - 32px\)\/2\) 0/.test(css));
const bk=src["modules/data/backupui.js"];
ok("backup and password texts: one visible sentence with an info button, the rest folded",/helpBtn\("bkh"/.test(bk)&&/helpBtn\("abh"/.test(bk)&&/helpBtn\("obh"/.test(src["modules/data/onboardui.js"]));
finish();
