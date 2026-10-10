const H=require("../www/modules/history/historylib.js");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const dk=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const E=(type,day,v,text="",o={})=>({id:1,day,time:"12:00",type,v,text,...o});
const S={entries:[
  E("food","2026-10-01",900,"Tavuk pilav"),E("food","2026-10-01",1200,"Yoğurt"),E("food","2026-10-02",500,"Çorba"),
  E("water","2026-10-01",750),E("water","2026-10-01",330,"",{dr:"coffee"}),E("exercise","2026-10-02",40,"Yürüyüş"),
  E("weight","2026-10-01",82),E("weight","2026-10-20",80.5),E("steps","2026-10-02",7000),E("note","2026-10-03",null,"Baş ağrısı vardı"),
  E("food","2024-03-05",2000,"Izgara ÇİĞKÖFTE")
],workouts:[{id:5,day:"2026-10-02",t0:1,t1:2,name:"Göğüs günü",ex:[]},{id:6,day:"2026-10-04",t0:1,t1:null,name:"Bitmedi",ex:[]}],
sleep:[{day:"2026-10-01",min:420}],mood:[{day:"2026-10-01",v:4}],vitals:[{day:"2026-10-05",k:"t"},{day:"2026-10-05",k:"s"}],
pulse:[{day:"2026-10-06"}],hr:[{day:"2026-10-07",a:60}],medLog:[{day:"2026-10-08",st:"t"},{day:"2026-10-08",st:"s"}],measures:[{day:"2026-10-09"}],
fast:{log:[{t0:0,t1:new Date(2026,9,10,12).getTime()}]}};
const ix=H.index(S,dk),g=d=>ix.get(d);
ok("gün özeti: yemek sayısı ve kalori, su yalnız su (kahve sayılmaz)",g("2026-10-01").food===2&&g("2026-10-01").kcal===2100&&g("2026-10-01").water===750&&g("2026-10-01").drink===1,g("2026-10-01"));
ok("spor dakikası, adım, not, kilo",g("2026-10-02").exercise===40&&g("2026-10-02").steps===7000&&g("2026-10-03").note===1&&g("2026-10-01").weight===82);
ok("yalnız biten antrenman sayılır",g("2026-10-02").wo===1&&!g("2026-10-04"));
ok("uyku, ruh hali, tansiyon, şeker, nabız, saat nabzı, ilaç (yalnız alınan), ölçü, oruç",g("2026-10-01").sleep===420&&g("2026-10-01").mood===4&&g("2026-10-05").bp===1&&g("2026-10-05").glucose===1&&g("2026-10-06").pulse===1&&g("2026-10-07").hr===60&&g("2026-10-08").meds===1&&g("2026-10-09").measures===1&&g("2026-10-10").fast===1,[...ix.keys()]);
ok("işaretler: kayıt günü ana türler, yalnız adım 'diğer', boş gün boş",JSON.stringify(H.marks(g("2026-10-01")).main)==='["food","water","weight"]'&&H.marks(g("2026-10-01")).other&&H.marks(g("2026-10-02")).main.includes("exercise")&&H.marks(g("2026-10-03")).other&&H.marks(g("2026-10-03")).main.length===0&&!H.marks(undefined).other);
{const m=H.month(ix,"2026-10");
 ok("ay özeti: kayıt günü, kalori ortalaması yalnız 800 üstü günler, su, spor, kilo ilk-son",m.days===10&&m.kcalAvg===2100&&m.waterAvg===750&&m.exercise===40&&m.wo===1&&m.weightFirst===82&&m.weightLast===80.5&&m.weightN===2,m);}
ok("aylar: yeniden eskiye, 2 yıl önceki ay da listelenir",H.months(ix).map(x=>x.ym).join()==="2026-10,2024-03");
ok("en eski ve en yeni gün",H.span(ix).first==="2024-03-05"&&H.span(ix).last==="2026-10-20");
{const r=H.search(S,"cigkofte");ok("arama: büyük harf ve Türkçe harf farkı gözetmez, 2 yıl öncesini bulur",r.total===1&&r.items[0].day==="2024-03-05",r);
 ok("arama: not ve antrenman adı, yeniden eskiye",H.search(S,"agri").total===1&&H.search(S,"GÖĞÜS").items[0].type==="wo"&&H.search(S,"pil").items[0].text==="Tavuk pilav");
 ok("arama: 2 harften kısa boş, sonuç yoksa 0",H.search(S,"a").total===0&&H.search(S,"zzzz").total===0);
 const big=Array.from({length:500},(_,i)=>E("food","2025-01-01",300,"tavuk"+i));ok("arama: sonuç sınırı, toplam doğru",H.search({entries:big,workouts:[],vitals:[],medLog:[],measures:[]},"tavuk",300).items.length===300&&H.search({entries:big,workouts:[],vitals:[],medLog:[],measures:[]},"tavuk",300).total===500);}
{const many=[];for(let i=0;i<1100*8;i++){const d=new Date(2023,0,1+Math.floor(i/8));many.push(E(i%3?"food":"water",dk(d),i%3?400:250,"x"+i))}
 const t=Date.now(),i2=H.index({entries:many,workouts:[],vitals:[],medLog:[],measures:[]},dk);H.months(i2);ok("3 yıl x 8 kayıt/gün: dizin ve aylar < 300 ms",Date.now()-t<300&&i2.size===1100,[Date.now()-t,i2.size]);}
console.log(bad?bad+" başarısız":"Tüm geçmiş testleri geçti");process.exit(bad?1:0);
