const {ok,finish}=require("./ok");
const B=require("../www/modules/data/backuplib.js");
(async()=>{
  const obj={S:{entries:[{v:1}],note:"çğş 🙂"},keys:{groq:"K"}};
  const e=await B.encrypt(obj,"parola");
  ok("round trip",JSON.stringify(await B.decrypt(e,"parola"))===JSON.stringify(obj));
  ok("the envelope contains no plain text",!JSON.stringify(e).includes("çğş")&&!JSON.stringify(e).includes('"K"'));
  ok("wrong password throws",await B.decrypt(e,"yanlis").then(()=>false,()=>true));
  const t=Object.assign({},e,{data:e.data.slice(0,-4)+(e.data.slice(-4)==="AAAA"?"BBBB":"AAAA")});
  ok("tampered data throws",await B.decrypt(t,"parola").then(()=>false,()=>true));
  ok("excessive iteration count is rejected",await B.decrypt(Object.assign({},e,{iter:1e9}),"parola").then(()=>false,()=>true));
  ok("two encryptions differ",(await B.encrypt(obj,"parola")).data!==e.data);
  {const e2=await B.encrypt(obj,"parola");ok("every encryption draws a fresh salt and IV",e2.salt!==e.salt&&e2.iv!==e.iv&&B.unb64(e.salt).length===16&&B.unb64(e.iv).length===12)}
  {const big=Uint8Array.from({length:100003},(_,i)=>i*7%256);ok("b64/unb64 round trip over the chunk size",B.unb64(B.b64(big)).every((v,i)=>v===big[i])&&B.b64(new Uint8Array([37,80,68,70]))==="JVBERg==")}
  ok("manual and auto file names",B.manualName("2026-10-01")==="neowell-yedek-2026-10-01.json"&&B.autoName("2026-10-01")==="neowell-oto-2026-10-01.json")
  ok("auto backup: newest 4 are kept, only backup file names are deleted",JSON.stringify(B.autoPrune(["neowell-oto-2026-09-04.json","neowell-oto-2026-09-25.json","not.txt","neowell-oto-2026-08-28.json","neowell-oto-2026-09-11.json","neowell-oto-2026-09-18.json","neowell-oto-x.json"],"neowell-oto-2026-09-25.json"))===JSON.stringify(["neowell-oto-2026-08-28.json"])&&B.autoPrune(["neowell-oto-2026-09-04.json"],"neowell-oto-2026-09-04.json").length===0);
  ok("auto backup: manual backups and old neowell-yedek- files (same day included) are never pruned",JSON.stringify(B.autoPrune(["neowell-yedek-2026-08-01.json","neowell-yedek-2026-10-02.json","neowell-oto-2026-09-11.json","neowell-oto-2026-09-18.json","neowell-oto-2026-09-25.json","neowell-oto-2026-10-02.json","neowell-yedek-2026-09-04.json"],"neowell-oto-2026-10-02.json"))===JSON.stringify([]));
  ok("auto backup: when the clock goes back, the just written (oldest-named) file is kept and the newest 3 others stay",JSON.stringify(B.autoPrune(["neowell-oto-2026-09-11.json","neowell-oto-2026-09-18.json","neowell-oto-2026-09-25.json","neowell-oto-2026-10-02.json","neowell-oto-2026-09-01.json"],"neowell-oto-2026-09-01.json"))===JSON.stringify(["neowell-oto-2026-09-11.json"]));
  ok("auto backup is due after 7 days or when none exists",B.autoDue("","2026-10-02")&&B.autoDue("2026-09-25","2026-10-02")&&!B.autoDue("2026-09-26","2026-10-02")&&!B.autoDue("2026-10-02","2026-10-02")&&B.autoDue("2026-10-05","2026-10-02"));
  ok("password rule: empty, short, digits only, repeated and easy passwords are rejected",["","abc","1234567","12345678","aaaaaaaaaa","PASSWORD","abcdefgh1","Parola123","password1234","Parola123!","Neowell2026","1234567890"].every(p=>B.pwCheck(p)!==""));
  ok("password rule: a mixed password of 10+ characters is accepted",B.pwCheck("mavi bulut 7")===""&&B.pwCheck("kedi-masa-1905")===""&&B.MINPW===10);
  ok("new backups use 600k iterations",e.iter===600000);
  const nc=require("node:crypto"),old=async(iter,pw)=>{const salt=nc.randomBytes(16),iv=nc.randomBytes(12),k=nc.pbkdf2Sync(pw,salt,iter,32,"sha256"),c=nc.createCipheriv("aes-256-gcm",k,iv),ct=Buffer.concat([c.update(JSON.stringify(obj)),c.final(),c.getAuthTag()]);return {neowell:1,enc:"aes-gcm-pbkdf2",iter,salt:salt.toString("base64"),iv:iv.toString("base64"),data:ct.toString("base64")}};
  ok("decrypt uses the iteration count stored in the envelope (100k and 250k) and does not apply the password rule",JSON.stringify(await B.decrypt(await old(250000,"abc123"),"abc123"))===JSON.stringify(obj)&&JSON.stringify(await B.decrypt(await old(100000,"parola"),"parola"))===JSON.stringify(obj));
  finish();
})();
