/* Geliştirme aracı: şablonların birkaç karesini JSON olarak yazar (Python ile temas kâğıdına çizilir). */
const F=require("../www/modules/salon/figlib.js"),T=require("../www/modules/salon/figtpl.js");
const out={};
for(const k of Object.keys(T)){const d=T[k];out[k]=F.sample(d,4).map(p=>F.frame(d,p).parts)}
require("fs").writeFileSync(process.argv[2],JSON.stringify({W:F.W,H:F.H,t:out}));
