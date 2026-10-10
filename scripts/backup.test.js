const B=require("../www/modules/data/backuplib.js");let bad=0;
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
  {const e2=await B.encrypt(obj,"parola");ok("every encryption draws a fresh salt and IV",e2.salt!==e.salt&&e2.iv!==e.iv&&B.unb64(e.salt).length===16&&B.unb64(e.iv).length===12)}
  {const big=Uint8Array.from({length:100003},(_,i)=>i*7%256);ok("b64/unb64 round trip over the chunk size",B.unb64(B.b64(big)).every((v,i)=>v===big[i])&&B.b64(new Uint8Array([37,80,68,70]))==="JVBERg==")}
  ok("manual and auto file names",B.manualName("2026-10-01")==="neowell-yedek-2026-10-01.json"&&B.autoName("2026-10-01")==="neowell-oto-2026-10-01.json")
  ok("otomatik yedek: ayrı önekli ad (elle yedekle çakışmaz)",B.autoName("2026-10-02")==="neowell-oto-2026-10-02.json");
  ok("otomatik yedek: en yeni 4 kalır, yalnız yedek adları silinir",JSON.stringify(B.autoPrune(["neowell-oto-2026-09-04.json","neowell-oto-2026-09-25.json","not.txt","neowell-oto-2026-08-28.json","neowell-oto-2026-09-11.json","neowell-oto-2026-09-18.json","neowell-oto-x.json"],"neowell-oto-2026-09-25.json"))===JSON.stringify(["neowell-oto-2026-08-28.json"])&&B.autoPrune(["neowell-oto-2026-09-04.json"],"neowell-oto-2026-09-04.json").length===0);
  ok("otomatik yedek: elle yedekler ve eski 'neowell-yedek-' adlı dosyalar (aynı gün dahil) hiç budanmaz",JSON.stringify(B.autoPrune(["neowell-yedek-2026-08-01.json","neowell-yedek-2026-10-02.json","neowell-oto-2026-09-11.json","neowell-oto-2026-09-18.json","neowell-oto-2026-09-25.json","neowell-oto-2026-10-02.json","neowell-yedek-2026-09-04.json"],"neowell-oto-2026-10-02.json"))===JSON.stringify([]));
  ok("otomatik yedek: saat geri alınınca az önce yazılan (en eski adlı) dosya silinmez, en yeni 3 diğeriyle 4 kalır",JSON.stringify(B.autoPrune(["neowell-oto-2026-09-11.json","neowell-oto-2026-09-18.json","neowell-oto-2026-09-25.json","neowell-oto-2026-10-02.json","neowell-oto-2026-09-01.json"],"neowell-oto-2026-09-01.json"))===JSON.stringify(["neowell-oto-2026-09-11.json"]));
  ok("otomatik yedek: 7 gün dolunca ya da hiç yokken zamanı gelir",B.autoDue("","2026-10-02")&&B.autoDue("2026-09-25","2026-10-02")&&!B.autoDue("2026-09-26","2026-10-02")&&!B.autoDue("2026-10-02","2026-10-02")&&B.autoDue("2026-10-05","2026-10-02"));
  ok("parola kuralı: boş, kısa, yalnız rakam, tekrar ve kolay parola reddedilir",["","abc","1234567","12345678","aaaaaaaaaa","PASSWORD","abcdefgh1","Parola123","password1234","Parola123!","Neowell2026","1234567890"].every(p=>B.pwCheck(p)!==""));
  ok("parola kuralı: 10+ karakterli karışık parola kabul edilir",B.pwCheck("mavi bulut 7")===""&&B.pwCheck("kedi-masa-1905")===""&&B.MINPW===10);
  ok("yeni yedek 600 bin tur yazar",e.iter===600000);
  const nc=require("node:crypto"),old=async(iter,pw)=>{const salt=nc.randomBytes(16),iv=nc.randomBytes(12),k=nc.pbkdf2Sync(pw,salt,iter,32,"sha256"),c=nc.createCipheriv("aes-256-gcm",k,iv),ct=Buffer.concat([c.update(JSON.stringify(obj)),c.final(),c.getAuthTag()]);return {neowell:1,enc:"aes-gcm-pbkdf2",iter,salt:salt.toString("base64"),iv:iv.toString("base64"),data:ct.toString("base64")}};
  ok("eski yedekler (100 bin ve 250 bin tur) ve 6 karakterli eski parola hâlâ açılır",JSON.stringify(await B.decrypt(await old(250000,"abc123"),"abc123"))===JSON.stringify(obj)&&JSON.stringify(await B.decrypt(await old(100000,"parola"),"parola"))===JSON.stringify(obj));
  process.exit(bad?1:0);
})();
