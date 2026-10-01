const L=require("../www/loglib.js");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
ok("copyNutr yalnız sayısal makroları taşır",JSON.stringify(L.copyNutr({p:5,c:null,f:0,text:"x"},{}))==='{"p":5,"f":0}');
const e=(day,id,text,v,x)=>Object.assign({type:"yemek",day,id,text,v},x);
let r=L.recents([e("2026-10-01",1,"Menemen",200),e("2026-10-01",2,"menemen",210,{p:9}),e("2026-09-30",3,"Ekmek",90),e("2026-08-01",4,"Eski",50),e("2026-10-03",5,"Gelecek",5),{type:"su",day:"2026-10-01",id:6,text:"x",v:250}],"2026-10-02");
ok("recents metne göre tekilleştirir, en yeniyi tutar, sıralar, 30 günden eskiyi ve geleceği almaz",JSON.stringify(r.map(x=>[x.text,x.v]))==='[["menemen",210],["Ekmek",90]]'&&r[0].p===9,r);
ok("recents en çok 8 satır",L.recents(Array.from({length:12},(_,i)=>e("2026-10-01",i+1,"y"+i,10)),"2026-10-02").length===8);
r=L.cleanFav([{text:"A",v:100,p:5},{text:"a",v:1},{text:"B",v:-3},{text:"C",v:"abc"},{text:"  "},null,{text:"D",v:null,c:9999}]);
ok("cleanFav geçersiz kcal'i ve yinelenenleri atar, makroyu sınırlar",JSON.stringify(r)==='[{"text":"A","v":100,"p":5},{"text":"D","v":null}]',r);
ok("cleanFav en çok 20 ve dizi olmayan girdide boş",L.cleanFav(Array.from({length:30},(_,i)=>({text:"f"+i,v:1}))).length===20&&L.cleanFav("x").length===0);
if(bad){console.log(bad+" test başarısız");process.exit(1)}
