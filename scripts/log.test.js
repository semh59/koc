const L=require("../www/loglib.js");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
ok("copyNutr yalnız sayısal makroları taşır",JSON.stringify(L.copyNutr({p:5,c:null,f:0,text:"x"},{}))==='{"p":5,"f":0}');
if(bad){console.log(bad+" test başarısız");process.exit(1)}
