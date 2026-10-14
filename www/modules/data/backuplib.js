"use strict";
/* Password-protected backup: PBKDF2 (SHA-256) derives the key, AES-GCM encrypts and authenticates. Every encryption draws a fresh salt (so a fresh key) and a fresh IV. */
const BackupLib=(()=>{
  const ITER=600000,ITER_RANGE=[1e5,1e6],te=new TextEncoder(),td=new TextDecoder();
  const b64=u=>{let s="";for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)};
  const unb64=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0));
  async function derive(pw,salt,iter){
    const m=await crypto.subtle.importKey("raw",te.encode(pw),"PBKDF2",false,["deriveKey"]);
    return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:iter,hash:"SHA-256"},m,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
  }
  async function encrypt(obj,pw){
    const pt=te.encode(JSON.stringify(obj)); // the data is frozen now; changes while the key derives do not enter the backup
    const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
    const ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},await derive(pw,salt,ITER),pt));
    return {neowell:1,enc:"aes-gcm-pbkdf2",iter:ITER,salt:b64(salt),iv:b64(iv),data:b64(ct)};
  }
  /* Throws "version" for a file made by a newer envelope format and "format" for an unknown one; any other error means a wrong password or changed data.
     The iteration count comes from the file, so it is bounded: a crafted file cannot stall the app. */
  async function decrypt(env,pw){
    if(env?.neowell>1)throw new Error("version");
    if(env?.enc!=="aes-gcm-pbkdf2"||!(env.iter>=ITER_RANGE[0]&&env.iter<=ITER_RANGE[1]))throw new Error("format");
    const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(env.iv)},await derive(pw,unb64(env.salt),env.iter),unb64(env.data));
    return JSON.parse(td.decode(pt));
  }
  /* Automatic backup: the same format as the manual one under a separate prefix (pruning never touches manual "neowell-yedek-" files, which the user may have taken);
     the folder keeps the file just written (cur) and the newest KEEP-1 automatic files.
     cur is kept apart: when the phone clock is set back, the new file name sorts below the old ones and would be deleted. */
  const KEEP=4,NAME=/^neowell-oto-\d{4}-\d{2}-\d{2}\.json$/;
  const manualName=day=>`neowell-yedek-${day}.json`,autoName=day=>`neowell-oto-${day}.json`;
  const autoPrune=(names,cur)=>names.filter(n=>NAME.test(n)&&n!==cur).sort().slice(0,-(KEEP-1));
  const autoDue=(last,today)=>{const d=(Date.parse(today)-Date.parse(last))/864e5;return !(d>=0&&d<7)}; // a clock set back (last date in the future) also triggers a backup
  /* Backup password rule (only where a new password is typed; stored passwords and restore are not checked): at least 10 characters; digits only, one repeated character
     and common passwords (after trailing digits or symbols are stripped) are rejected. Returns "" when fine. */
  const MINPW=10,COMMON=["password","parola","sifre","qwerty","qwertyuiop","abcdefgh","abcdefghij","neowell","iloveyou","welcome","admin","letmein","istanbul","ankara","galatasaray","fenerbahce","besiktas","trabzonspor","merhaba","bismillah"];
  const pwCheck=pw=>pw.length<MINPW?`Parola en az ${MINPW} karakter olmalı`
    :/^\d+$/.test(pw)||/^(.)\1+$/.test(pw)||COMMON.includes(pw.toLowerCase().replace(/[\d\W_]+$/,""))?"Bu parola çok kolay tahmin edilir. Harf ve rakam karıştır ya da birkaç kelime yaz":"";
  return {b64,unb64,encrypt,decrypt,pwCheck,MINPW,manualName,autoName,autoPrune,autoDue};
})();
if(typeof module!=="undefined")module.exports=BackupLib;
