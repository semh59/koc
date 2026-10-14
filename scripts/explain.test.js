/* Energy formula explanation, week comparison card and barcode-not-found guidance. */
const {ok,finish}=require("./ok");
const {boot}=require("./html");
(async()=>{
  const w=await boot(),ev=s=>w.eval(s),q=s=>w.document.querySelector(s);
  const reset=x=>ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;${x||""}`);
  reset("Object.assign(S.settings,{heightCm:170,age:30,sex:'f',act:1,kcal:1800});S.entries=[];add('weight',70);tab='trend';tSec='nutrition';render()");
  const acc=[...w.document.querySelectorAll("details.acc")].find(d=>d.textContent.includes("Nasıl hesaplandı"));
  const t=acc&&acc.textContent;
  ok("the energy card explains Mifflin-St Jeor with the user's own numbers",t&&t.includes("Mifflin-St Jeor")&&t.includes("10 × 70,0 kg + 6,25 × 170 cm − 5 × 30 yaş − 161")&&t.includes("1.452"),t);
  ok("it names the activity multiplier and 7700 kcal/kg",t.includes("× 1,45")&&t.includes("7700 kcal/kg"),t);

  /* week comparison: 7 days now, 7 days before */
  reset(`S.settings.stepsOn=false;S.entries=[];
    for(let i=0;i<7;i++){for(const [o,k,wm] of [[-i,2000,2000],[-i-7,1500,1000]]){const d=keyOff(o);S.entries.push({id:S.nextId++,day:d,time:"12:00",type:"food",v:k,text:"x"},{id:S.nextId++,day:d,time:"13:00",type:"water",v:wm,text:""})}}
    add('weight',70);tab='trend';tSec='weight';render()`);
  const card=[...w.document.querySelectorAll("#view h2,#view h3")].find(h=>h.textContent==="Bu hafta ve geçen hafta");
  const tb=card&&card.nextElementSibling.textContent;
  ok("Trend shows this week beside last week with daily averages",!!tb&&tb.includes("2000")&&tb.includes("1500")&&tb.includes("2,0")&&tb.includes("1,0"),tb);
  reset("S.entries=[];add('weight',70);for(let i=0;i<3;i++)S.entries.push({id:S.nextId++,day:keyOff(-i),time:'12:00',type:'food',v:1800,text:'x'});tab='trend';tSec='weight';render()");
  ok("without a previous week there is no comparison card",![...w.document.querySelectorAll("#view h2,#view h3")].some(h=>h.textContent==="Bu hafta ve geçen hafta"));

  /* barcode */
  reset();
  w.fetch=async()=>({ok:true,json:async()=>({status:0})});
  await ev("barcodeFind('8690526010113')");
  const b=q("#fown .banner");
  ok("an unknown barcode opens the own-food form with the next step written in it",b&&b.textContent.includes("Open Food Facts'te yok")&&b.textContent.includes("elle yazabilirsin")&&!q("#fown").hidden,b&&b.textContent);
  w.fetch=async()=>{throw new Error("off")};
  await ev("barcodeFind('8690526010113')");
  ok("offline: the form says there is no internet and what to do",q("#fown .banner").textContent.includes("İnternete ulaşılamadı")&&q("#fown .banner").textContent.includes("tekrar okutabilirsin"));
  finish();
})();
