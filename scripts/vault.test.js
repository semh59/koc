/* API key vault: transfer, persistence and error paths with a fake KeyVault plugin. */
const {ok,finish}=require("./ok");
const {boot}=require("./html");
const vault=(broken)=>({encrypt:async({text})=>{if(broken)throw new Error("keystore");return {data:Buffer.from("ENC:"+text).toString("base64")}},
  decrypt:async({data})=>{const t=Buffer.from(data,"base64").toString();if(broken||!t.startsWith("ENC:"))throw new Error("bad");return {text:t.slice(4)}}});
const failingRead=message=>({encrypt:vault().encrypt,decrypt:async()=>{throw new Error(message)}});
const open=async(seed,v)=>{
  const w=await boot(w=>{
    if(v)w.Capacitor={Plugins:{KeyVault:v}};
    for(const k in seed)w.localStorage.setItem(k,seed[k]);
  });
  await w.eval("keysP");
  return w;
};
(async()=>{
  let w=await open({nw_keys:JSON.stringify({groq:"SIRRI-1"})},vault());
  const ls=k=>w.localStorage.getItem(k),ev=s=>w.eval(s);
  ok("a plain-text key is moved into the vault",ls("nw_keys")===null&&ls("nw_keys_enc")&&ev("getKeys().groq")==="SIRRI-1");
  ok("no plain text is left",!Object.keys(w.localStorage).some(k=>String(ls(k)).includes("SIRRI-1")&&k!=="nw_keys_enc"));
  await ev("setKey('openrouter','SIRRI-2')");
  ok("a new key is written encrypted",ls("nw_keys")===null&&Buffer.from(ls("nw_keys_enc"),"base64").toString().includes("SIRRI-2"));
  const seed={nw_keys_enc:ls("nw_keys_enc")};
  w=await open(seed,vault());
  ok("encrypted keys are read on reopen",w.eval("getKeys().groq")==="SIRRI-1"&&w.eval("getKeys().openrouter")==="SIRRI-2");
  let reset=0;w=await open(seed,{encrypt:vault().encrypt,resetKey:async()=>{reset++},decrypt:async()=>{throw Object.assign(new Error("decrypt: KEY_INVALIDATED"),{code:"KEY_INVALIDATED"})}});
  ok("an invalidated vault key (KEY_INVALIDATED) deletes the record, calls resetKey and starts clean",reset===1&&Object.keys(w.eval("getKeys()")).length===0&&!/SIRRI/.test(String(w.localStorage.getItem("nw_keys"))));
  w=await open(seed,failingRead("decrypt: temporary"));
  ok("a temporary decrypt error keeps the encrypted record and writes no plain text",w.localStorage.getItem("nw_keys_enc")===seed.nw_keys_enc&&w.localStorage.getItem("nw_keys")===null);
  await w.eval("setKey('openai','YENI')");
  ok("while locked, a new key does not overwrite the encrypted record",w.localStorage.getItem("nw_keys_enc")===seed.nw_keys_enc&&w.localStorage.getItem("nw_keys")===null);
  w=await open({nw_keys:JSON.stringify({groq:"SIRRI-3"})},vault(true));
  ok("a broken vault does not lose the key",w.eval("getKeys().groq")==="SIRRI-3"&&w.localStorage.getItem("nw_keys")!==null);
  w=await open({nw_keys:JSON.stringify({groq:"SIRRI-5"})},failingRead("decrypt: read back"));
  ok("written to the vault but the read-back failed: no plain text without asking the user, the key stays in memory",w.localStorage.getItem("nw_keys")===null&&!Object.keys(w.localStorage).some(k=>k!=="nw_keys_enc"&&String(w.localStorage.getItem(k)).includes("SIRRI-5"))&&w.eval("getKeys().groq")==="SIRRI-5");
  w=await open({nw_keys:JSON.stringify({groq:"SIRRI-6"}),nw_keys_plain:"1"},failingRead("decrypt: read back"));
  ok("if the user already agreed to plain storage, the plain copy is kept when the read-back fails",w.localStorage.getItem("nw_keys")!==null&&w.eval("getKeys().groq")==="SIRRI-6");
  w=await open({nw_keys:JSON.stringify({groq:"SIRRI-4"})},null);
  ok("without a vault (browser) plain text works",w.eval("getKeys().groq")==="SIRRI-4");
  w=await open({nw_keys:JSON.stringify({groq:"SIRRI-BROWSER"})},null);const ev2=s=>w.eval(s);
  ok("browser plaintext keys load only through the explicit fallback consent path",ev2("getKeys().groq")==="SIRRI-BROWSER"&&w.localStorage.getItem("nw_keys_plain")==="1");
  await ev2("wipeKeys()");
  ok("wipeKeys clears browser key storage and consent marker",w.localStorage.getItem("nw_keys")===null&&w.localStorage.getItem("nw_keys_enc")===null&&w.localStorage.getItem("nw_keys_plain")===null&&Object.keys(ev2("getKeys()")).length===0);
  let reset2=0;w=await open({nw_keys_enc:"x"},{encrypt:vault().encrypt,decrypt:async()=>({text:JSON.stringify({groq:"SIRRI-WIPE"})}),resetKey:async()=>{reset2++}});const ev3=s=>w.eval(s);
    await ev3("wipeKeys()");
    ok("wipeKeys resets native vault and all local key copies",reset2===1&&!["nw_keys","nw_keys_enc","nw_keys_plain"].some(k=>w.localStorage.getItem(k))&&Object.keys(ev3("getKeys()")).length===0);
  finish();
})();
