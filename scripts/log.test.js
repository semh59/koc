const L=require("../www/modules/log/loglib.js");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
ok("copyNutr yalnız sayısal makroları taşır",JSON.stringify(L.copyNutr({p:5,c:null,f:0,text:"x"},{}))==='{"p":5,"f":0}');
ok("copyNutr: öğün başı sodyum 100.000 mg sınırına kadar korunur (100 g başı 40.000 sınırı ayrı)",L.copyNutr({na:60000},{}).na===60000&&L.copyNutr({na:100001},{}).na===undefined);
const e=(day,id,text,v,x)=>Object.assign({type:"food",day,id,text,v},x);
let r=L.recents([e("2026-10-01",1,"Menemen",200),e("2026-10-01",2,"menemen",210,{p:9}),e("2026-09-30",3,"Ekmek",90),e("2026-08-01",4,"Eski",50),e("2026-10-03",5,"Gelecek",5),{type:"water",day:"2026-10-01",id:6,text:"x",v:250}],"2026-10-02");
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
const H=36e5,now=1e12;
ok("stalled: 26 saatten uzun kapanışsızlık uyarır, 26 saat altı ve snapAt 0 uyarmaz",L.stalled(now-27*H,now,100,0)&&!L.stalled(now-25*H,now,100,0)&&!L.stalled(0,now,100,0));
ok("stalled: dün 0 ve önceki ortalama 1000 üstü uyarır, sınırda ve dün adım varsa uyarmaz",L.stalled(0,now,0,1001)&&!L.stalled(0,now,0,1000)&&!L.stalled(0,now,10,5000));
{ // meal groups
  const y=(id,time,v,meal)=>({id,type:"food",time,v,text:"x",...(meal?{meal}:{})});
  ok("mealOf: meal yoksa saatten (05-11 kahvaltı, 11-16 öğle, 16-21 akşam, kalan atıştırmalık), geçersiz meal yok sayılır",["04:59","05:00","10:59","11:00","15:59","16:00","20:59","21:00","00:00"].map(t=>L.mealOf({time:t})).join()==="snack,breakfast,breakfast,lunch,lunch,dinner,dinner,snack,snack"&&L.mealOf({time:"08:00",meal:"zz"})==="breakfast");
  ok("mealOf: kullanıcının seçtiği öğün saate üstün gelir",L.mealOf({time:"08:00",meal:"dinner"})==="dinner");
  const d=L.dayLog([y(1,"13:00",300),y(2,"08:30",200),y(3,"08:10",50),y(4,"19:00",null,"snack"),{id:5,type:"water",time:"09:00",v:250},{id:6,type:"water",time:"10:00",v:250},{id:7,type:"weight",time:"07:00",v:80}]);
  ok("dayLog: boş grup yok, grup içi saat sırası, alt toplam kcal (kcal'siz 0)",d.groups.map(g=>g.k+":"+g.kcal+":"+g.items.map(e=>e.id)).join()==="breakfast:250:3,2,lunch:300:1,snack:0:4");
  ok("dayLog: su tek toplamda birleşir, kilo yemek grubuna girmez",d.water.length===2&&d.waterTotal===500&&d.rest.length===1&&d.rest[0].id===7);
}
{ // recipes
  const it=(n,g,k,x)=>Object.assign({n,g,k},x),R=(n,items,x)=>Object.assign({id:1,n,s:2,items},x);
  const rc=L.cleanRecipes([R("Mercimek köftesi",[it("Mercimek",200,119,{p:9,c:20,f:0.4}),it("Zeytinyağı",20,884,{p:0,c:0,f:100})])])[0];
  const c=L.recipeCalc(rc);
  ok("tarif toplamı: gram ve kcal malzemeden hesaplanır",c.g===220&&Math.round(c.tot.k)===415&&Math.round(c.tot.p)===18&&c.part.length===0,c);
  const f=L.recipeFood(rc);
  ok("tarif yemek listesinde 100 g başına değer, porsiyon başı gram (toplam gram / porsiyon), kaynak tarif",Math.round(f.k)===189&&f.u[0][1]===110&&f.u[0][0]==="1 porsiyon (110 g)"&&f.src==="recipe"&&f.rec===1&&Math.round(f.k*f.u[0][1]/100)===207);
  const part=L.cleanRecipes([R("Eksik",[it("A",100,100,{p:10,fb:5}),it("B",100,200,{p:4})])])[0],pc=L.recipeCalc(part),pf=L.recipeFood(part);
  ok("veri eksik kalemde kısmi toplam yazılmaz: lif 1/2 notla, kalori ve protein tam",pc.tot.fb===undefined&&pc.tot.p===14&&pc.tot.c===undefined&&pf.fb===null&&pf.p!==null&&pc.part.some(x=>x[0]==="fb"&&x[1]===1)&&L.recipeNote(pc).includes("Lif: 1/2 malzemede veri var"),[pc,pf]);
  ok("pişme notu her tarifte",L.recipeNote(c).includes("Çiğ ağırlıklarla hesaplandı, pişince değişir; tahmindir."));
  const bad=L.cleanRecipes([null,{n:"",items:[it("A",1,1)]},R("A",[]),R("B",[it("x",0,5),it("y",5001,5),it("z",5,-1),{n:" ",g:5,k:5}]),R("Ç",[it("a",5,5,{p:301,c:-1,fb:50})],{s:99,id:"x"}),R("ç",[it("a",5,5)]),R("D",[it("a",5,5)],{id:3}),R("E",[it("a",5,5)],{id:3})]);
  ok("temizleyici: geçersiz kalem/ad/boş tarif atılır, aynı ad (İ/I duyarsız) tekilleşir, porsiyon 1-50, kimlik benzersiz, sınır dışı değer atılır",bad.length===3&&bad[0].n==="Ç"&&bad[0].s===1&&bad[0].items[0].p===undefined&&bad[0].items[0].c===undefined&&bad[0].items[0].fb===50&&new Set(bad.map(x=>x.id)).size===3,bad);
  ok("en çok 50 tarif, tarifte en çok 30 kalem",L.cleanRecipes(Array.from({length:60},(_,i)=>R("t"+i,[it("a",1,1)],{id:i+1}))).length===50&&L.cleanRecipes([R("U",Array.from({length:40},(_,i)=>it("m"+i,1,1)))])[0].items.length===30);
  const tiny=L.cleanRecipes([R("T",[it("a",0.04,5),it("b",0.05,5)])])[0];
  ok("tarif kalemi gramı 0,1'e yuvarlanır: 0,04 g atılır (0 g olarak saklanmaz), 0,05 g 0,1 olur",tiny.items.length===1&&tiny.items[0].n==="b"&&tiny.items[0].g===0.1,tiny);
  const src=[R("Z",[it("a",5,5)])];L.cleanRecipes(src);
  ok("temizleyici girdiye dokunmaz, eski yedekte (recipes yok) boş",src[0].items[0].g===5&&L.cleanRecipes(undefined).length===0&&L.cleanRecipes("x").length===0);
}
if(bad){console.log(bad+" test başarısız");process.exit(1)}
