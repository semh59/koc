"use strict";
/* Parola korumalı yedek: PBKDF2 (SHA-256) ile anahtar türetir, AES-GCM ile şifreler. */
const BackupLib=(()=>{
  const ITER=250000,te=new TextEncoder(),td=new TextDecoder();
  const b64=u=>{let s="";u.forEach(c=>{s+=String.fromCharCode(c)});return btoa(s)};
  const unb64=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0));
  async function derive(pw,salt,iter){
    const m=await crypto.subtle.importKey("raw",te.encode(pw),"PBKDF2",false,["deriveKey"]);
    return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:iter,hash:"SHA-256"},m,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
  }
  async function encrypt(obj,pw){
    const pt=te.encode(JSON.stringify(obj)); // veri şimdi sabitlenir, beklerken değişse de yedeğe girmez
    const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
    const ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},await derive(pw,salt,ITER),pt));
    return {neowell:1,enc:"aes-gcm-pbkdf2",iter:ITER,salt:b64(salt),iv:b64(iv),data:b64(ct)};
  }
  /* Parola yanlışsa ya da veri değişmişse hata fırlatır. */
  async function decrypt(env,pw){
    if(!env||env.enc!=="aes-gcm-pbkdf2"||!(env.iter>=1e5&&env.iter<=1e6))throw new Error("biçim");
    const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(env.iv)},await derive(pw,unb64(env.salt),env.iter),unb64(env.data));
    return JSON.parse(td.decode(pt));
  }
  /* Otomatik yedek: elle paylaşılan yedekle aynı ad ve biçim; klasörde az önce yazılan (cur) ve en yeni KEEP-1 dosya kalır.
     cur ayrı tutulur: telefon saati geri alınınca yeni dosya adı eskilerden küçük kalır ve silinirdi. */
  const KEEP=4,NAME=/^neowell-yedek-\d{4}-\d{2}-\d{2}\.json$/;
  const autoName=day=>`neowell-yedek-${day}.json`;
  const autoPrune=(names,cur)=>names.filter(n=>NAME.test(n)&&n!==cur).sort().slice(0,-(KEEP-1));
  const autoDue=(last,today)=>{const d=(Date.parse(today)-Date.parse(last))/864e5;return !(d>=0&&d<7)}; // saat geri alınıp son tarih ileride kalırsa da yedeklenir
  return {encrypt,decrypt,autoName,autoPrune,autoDue};
})();
if(typeof module!=="undefined")module.exports=BackupLib;
