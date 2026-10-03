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
  ok("otomatik yedek: ayrı önekli ad (elle yedekle çakışmaz)",B.autoName("2026-10-02")==="neowell-oto-2026-10-02.json");
  ok("otomatik yedek: en yeni 4 kalır, yalnız yedek adları silinir",JSON.stringify(B.autoPrune(["neowell-oto-2026-09-04.json","neowell-oto-2026-09-25.json","not.txt","neowell-oto-2026-08-28.json","neowell-oto-2026-09-11.json","neowell-oto-2026-09-18.json","neowell-oto-x.json"],"neowell-oto-2026-09-25.json"))===JSON.stringify(["neowell-oto-2026-08-28.json"])&&B.autoPrune(["neowell-oto-2026-09-04.json"],"neowell-oto-2026-09-04.json").length===0);
  ok("otomatik yedek: elle yedekler ve eski 'neowell-yedek-' adlı dosyalar (aynı gün dahil) hiç budanmaz",JSON.stringify(B.autoPrune(["neowell-yedek-2026-08-01.json","neowell-yedek-2026-10-02.json","neowell-oto-2026-09-11.json","neowell-oto-2026-09-18.json","neowell-oto-2026-09-25.json","neowell-oto-2026-10-02.json","neowell-yedek-2026-09-04.json"],"neowell-oto-2026-10-02.json"))===JSON.stringify([]));
  ok("otomatik yedek: saat geri alınınca az önce yazılan (en eski adlı) dosya silinmez, en yeni 3 diğeriyle 4 kalır",JSON.stringify(B.autoPrune(["neowell-oto-2026-09-11.json","neowell-oto-2026-09-18.json","neowell-oto-2026-09-25.json","neowell-oto-2026-10-02.json","neowell-oto-2026-09-01.json"],"neowell-oto-2026-09-01.json"))===JSON.stringify(["neowell-oto-2026-09-11.json"]));
  ok("otomatik yedek: 7 gün dolunca ya da hiç yokken zamanı gelir",B.autoDue("","2026-10-02")&&B.autoDue("2026-09-25","2026-10-02")&&!B.autoDue("2026-09-26","2026-10-02")&&!B.autoDue("2026-10-02","2026-10-02")&&B.autoDue("2026-10-05","2026-10-02"));
  process.exit(bad?1:0);
})();
