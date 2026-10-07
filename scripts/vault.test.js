/* API anahtarı kasası: sahte KeyVault eklentisiyle taşıma, kalıcılık ve hata yolları. */
const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const www=f=>path.join(__dirname,"../www",f);
const html=fs.readFileSync(www("index.html"),"utf8").replace(/<script src="([^"]+)"><\/script>/g,(_,f)=>"<script>"+fs.readFileSync(www(f),"utf8")+"</script>");
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
  let w=await open({koc_keys:JSON.stringify({groq:"SIRRI-1"})},vault());
  const ls=k=>w.localStorage.getItem(k),ev=s=>w.eval(s);
  ok("eski düz metin anahtar kasaya taşınır",ls("koc_keys")===null&&ls("koc_keys_enc")&&ev("getKeys().groq")==="SIRRI-1");
  ok("düz metin kalmaz",!Object.keys(w.localStorage).some(k=>String(ls(k)).includes("SIRRI-1")&&k!=="koc_keys_enc"));
  await ev("setKey('nvidia','SIRRI-2')");
  ok("yeni anahtar şifreli yazılır",ls("koc_keys")===null&&Buffer.from(ls("koc_keys_enc"),"base64").toString().includes("SIRRI-2"));
  const seed={koc_keys_enc:ls("koc_keys_enc")};
  w=await open(seed,vault());
  ok("yeniden açılışta şifreli anahtarlar okunur",w.eval("getKeys().groq")==="SIRRI-1"&&w.eval("getKeys().nvidia")==="SIRRI-2");
  let reset=0;w=await open(seed,{encrypt:vault().encrypt,resetKey:async()=>{reset++},decrypt:async()=>{throw Object.assign(new Error("decrypt: KEY_INVALIDATED"),{code:"KEY_INVALIDATED"})}});
  ok("kasa anahtarı geçersizleştiyse (KEY_INVALIDATED) kayıt silinir, resetKey çağrılır, temiz başlar",reset===1&&Object.keys(w.eval("getKeys()")).length===0&&w.localStorage.getItem("koc_keys")!==null&&!/SIRRI/.test(w.localStorage.getItem("koc_keys")));
  w=await open(seed,{encrypt:vault().encrypt,decrypt:async()=>{throw new Error("decrypt: geçici")}});
  ok("geçici decrypt hatasında şifreli kayıt silinmez, düz metne de yazılmaz",w.localStorage.getItem("koc_keys_enc")===seed.koc_keys_enc&&w.localStorage.getItem("koc_keys")===null);
  await w.eval("setKey('openai','YENI')");
  ok("kilitliyken yeni anahtar şifreli kaydı ezmez",w.localStorage.getItem("koc_keys_enc")===seed.koc_keys_enc&&w.localStorage.getItem("koc_keys")===null);
  w=await open({koc_keys:JSON.stringify({groq:"SIRRI-3"})},vault(true));
  ok("kasa bozuksa anahtar kaybolmaz",w.eval("getKeys().groq")==="SIRRI-3"&&w.localStorage.getItem("koc_keys")!==null);
  w=await open({koc_keys:JSON.stringify({groq:"SIRRI-4"})},null);
  ok("kasa yoksa (tarayıcı) düz metin çalışır",w.eval("getKeys().groq")==="SIRRI-4");
  process.exit(bad?1:0);
})();
