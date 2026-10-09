/* API anahtarı kasası: sahte KeyVault eklentisiyle taşıma, kalıcılık ve hata yolları. */
const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const www=f=>path.join(__dirname,"../www",f);
const html=require("./html").build();
const vault=(broken)=>({encrypt:async({text})=>{if(broken)throw new Error("keystore");return {data:Buffer.from("ENC:"+text).toString("base64")}},
  decrypt:async({data})=>{const t=Buffer.from(data,"base64").toString();if(broken||!t.startsWith("ENC:"))throw new Error("bad");return {text:t.slice(4)}}});
const open=(seed,v)=>new Promise(res=>{
  const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://localhost/",beforeParse(w){
    Object.assign(w,{structuredClone,TextEncoder,TextDecoder});w.scrollTo=()=>{};
    if(v)w.Capacitor={Plugins:{KeyVault:v}};
    for(const k in seed)w.localStorage.setItem(k,seed[k]);
  }});
  setTimeout(()=>res(dom.window),150);
});
(async()=>{
  let w=await open({nw_keys:JSON.stringify({groq:"SIRRI-1"})},vault());
  const ls=k=>w.localStorage.getItem(k),ev=s=>w.eval(s);
  ok("eski düz metin anahtar kasaya taşınır",ls("nw_keys")===null&&ls("nw_keys_enc")&&ev("getKeys().groq")==="SIRRI-1");
  ok("düz metin kalmaz",!Object.keys(w.localStorage).some(k=>String(ls(k)).includes("SIRRI-1")&&k!=="nw_keys_enc"));
  await ev("setKey('nvidia','SIRRI-2')");
  ok("yeni anahtar şifreli yazılır",ls("nw_keys")===null&&Buffer.from(ls("nw_keys_enc"),"base64").toString().includes("SIRRI-2"));
  const seed={nw_keys_enc:ls("nw_keys_enc")};
  w=await open(seed,vault());
  ok("yeniden açılışta şifreli anahtarlar okunur",w.eval("getKeys().groq")==="SIRRI-1"&&w.eval("getKeys().nvidia")==="SIRRI-2");
  let reset=0;w=await open(seed,{encrypt:vault().encrypt,resetKey:async()=>{reset++},decrypt:async()=>{throw Object.assign(new Error("decrypt: KEY_INVALIDATED"),{code:"KEY_INVALIDATED"})}});
  ok("kasa anahtarı geçersizleştiyse (KEY_INVALIDATED) kayıt silinir, resetKey çağrılır, temiz başlar",reset===1&&Object.keys(w.eval("getKeys()")).length===0&&!/SIRRI/.test(String(w.localStorage.getItem("nw_keys"))));
  w=await open(seed,{encrypt:vault().encrypt,decrypt:async()=>{throw new Error("decrypt: geçici")}});
  ok("geçici decrypt hatasında şifreli kayıt silinmez, düz metne de yazılmaz",w.localStorage.getItem("nw_keys_enc")===seed.nw_keys_enc&&w.localStorage.getItem("nw_keys")===null);
  await w.eval("setKey('openai','YENI')");
  ok("kilitliyken yeni anahtar şifreli kaydı ezmez",w.localStorage.getItem("nw_keys_enc")===seed.nw_keys_enc&&w.localStorage.getItem("nw_keys")===null);
  w=await open({nw_keys:JSON.stringify({groq:"SIRRI-3"})},vault(true));
  ok("kasa bozuksa anahtar kaybolmaz",w.eval("getKeys().groq")==="SIRRI-3"&&w.localStorage.getItem("nw_keys")!==null);
  w=await open({nw_keys:JSON.stringify({groq:"SIRRI-5"})},{encrypt:vault().encrypt,decrypt:async()=>{throw new Error("decrypt: geri okuma")}});
  ok("kasaya yazıldı ama geri okuma hata verdi: kullanıcıya sorulmadan düz metin yazılmaz, anahtar bellekte kalır",w.localStorage.getItem("nw_keys")===null&&!Object.keys(w.localStorage).some(k=>k!=="nw_keys_enc"&&String(w.localStorage.getItem(k)).includes("SIRRI-5"))&&w.eval("getKeys().groq")==="SIRRI-5");
  w=await open({nw_keys:JSON.stringify({groq:"SIRRI-6"}),nw_keys_plain:"1"},{encrypt:vault().encrypt,decrypt:async()=>{throw new Error("decrypt: geri okuma")}});
  ok("kullanıcı düz saklamayı daha önce onayladıysa geri okuma hatasında düz kopya korunur",w.localStorage.getItem("nw_keys")!==null&&w.eval("getKeys().groq")==="SIRRI-6");
  w=await open({nw_keys:JSON.stringify({groq:"SIRRI-4"})},null);
  ok("kasa yoksa (tarayıcı) düz metin çalışır",w.eval("getKeys().groq")==="SIRRI-4");
  process.exit(bad?1:0);
})();
