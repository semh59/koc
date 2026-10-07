// Testlerde geri yükleme yalnız parolalı yedeği kabul eder: #bk düz yedekse test parolasıyla şifrelenip goYukle çağrılır.
const B=require("../www/backuplib.js"),PW="mavi-bulut-77";
module.exports=getW=>async()=>{
  const w=getW(),d=w.document,bk=d.querySelector("#bk");let r;
  try{r=JSON.parse(bk.value)}catch(e){return w.eval("goYukle()")}
  if(r&&!r.enc)bk.value=JSON.stringify(await B.encrypt({v:1,S:r,keys:{}},PW));
  let pw=d.querySelector("#bkpw");if(!pw){d.body.insertAdjacentHTML("beforeend",'<input id="bkpw" hidden>');pw=d.querySelector("#bkpw")}
  pw.value=PW;return w.eval("goYukle()");
};
