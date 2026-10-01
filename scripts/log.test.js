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
const it=n=>({text:"y"+n,v:1});
r=L.cleanTpl([{id:1,n:"A",items:[it(1)]},{id:1,n:"B",items:[it(2),{text:"",v:1},{text:"x",v:-5}]},{id:5,n:"Boş",items:[{text:""}]},{id:9,n:" ",items:[it(3)]},{n:"C",items:"x"},null,{id:"z",n:"D",items:[it(4)]}]);
ok("cleanTpl boş kalemli ve adsız şablonu atar, çakışan kimliği yeniden numaralar",JSON.stringify(r.map(t=>[t.id,t.n,t.items.length]))==='[[1,"A",1],[2,"B",1],[3,"D",1]]',r);
r=L.cleanTpl(Array.from({length:25},(_,i)=>({id:i+1,n:"s"+i,items:Array.from({length:20},(_,j)=>it(j))})));
ok("cleanTpl en çok 20 şablon ve şablon başına 15 kalem",r.length===20&&r.every(t=>t.items.length===15));
ok("cleanTpl dizi olmayan girdide boş, uzun adı keser",L.cleanTpl({}).length===0&&L.cleanTpl([{n:"x".repeat(80),items:[it(1)]}])[0].n.length===40);
if(bad){console.log(bad+" test başarısız");process.exit(1)}
