const B=require("../www/backuplib.js");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
(async()=>{
  const obj={S:{entries:[{v:1}],note:"çğş 🙂"},keys:{groq:"K"}};
  const e=await B.encrypt(obj,"parola");
  ok("gidiş dönüş",JSON.stringify(await B.decrypt(e,"parola"))===JSON.stringify(obj));
  ok("zarf düz metin içermez",!JSON.stringify(e).includes("çğş")&&!JSON.stringify(e).includes('"K"'));
  ok("yanlış parola hata verir",await B.decrypt(e,"yanlis").then(()=>false,()=>true));
  const t=Object.assign({},e,{data:e.data.slice(0,-4)+(e.data.slice(-4)==="AAAA"?"BBBB":"AAAA")});
  ok("değiştirilmiş veri hata verir",await B.decrypt(t,"parola").then(()=>false,()=>true));
  ok("aşırı yineleme sayısı reddedilir",await B.decrypt(Object.assign({},e,{iter:1e9}),"parola").then(()=>false,()=>true));
  ok("iki şifreleme farklı",(await B.encrypt(obj,"parola")).data!==e.data);
  process.exit(bad?1:0);
})();
