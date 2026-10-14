/* Charts: the touch bubble carries the time, every chart has an "all points" table and a screen reader value. */
const {ok,finish}=require("./ok");
const {boot}=require("./html");
const L=n=>{const d=new Date(Date.now()-n*864e5),p=x=>String(x).padStart(2,"0");return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`};
(async()=>{
  const entries=[3,2,1].map((n,i)=>({id:i+1,day:L(n),time:`0${6+i}:30`,type:"weight",v:80-i,text:""}))
    .concat([{id:9,day:L(1),time:"19:00",type:"water",v:500,text:""}]);
  const w=await boot(w=>{w.localStorage.setItem("nw_state",JSON.stringify({entries,nextId:20,settings:{obDone:true,noticeOk:true,age:30,waterMl:2000,bpOn:true},
    vitals:[{id:1,k:"t",day:L(1),time:"08:15",sys:120,dia:80,ctx:"rest",session:"morning",sid:"a"},{id:2,k:"t",day:L(2),time:"20:40",sys:130,dia:85,ctx:"rest",session:"evening",sid:"b"}],
    measures:[{day:L(5),k:"waist",v:90},{day:L(1),k:"waist",v:88}]}))});
  const q=s=>w.document.querySelector(s),qa=s=>[...w.document.querySelectorAll(s)];
  w.eval("tab='trend';render()");
  const wc=q("svg.chart[aria-label^='Kilo grafiği']");
  ok("weight chart: the bubble text has the time of the weigh-in",wc&&JSON.parse(wc.dataset.tip).some(p=>/07:30/.test(p[2])));
  ok("weight chart: the screen reader label gives the first and last value",/ölçüm, .* 80,0 kg, .* 78,0 kg/.test(wc.getAttribute("aria-label")),wc.getAttribute("aria-label"));
  const tb=wc.parentElement.querySelector("details table");
  ok("weight chart: an all points table with one row per point",tb&&tb.rows.length===3&&/06:30/.test(tb.rows[0].textContent)&&/78,0 kg/.test(tb.textContent),tb&&tb.textContent);
  const bars=q("svg.bars");
  ok("bar chart: the label points to the table and the table lists only days with data",/grafiğin altındaki tabloda/.test(bars.getAttribute("aria-label"))&&bars.parentElement.querySelector("details table").rows.length===1);
  w.eval("tab='bp';render()");
  const vs=q("#view svg.chart");
  ok("blood pressure chart: label and table",vs&&/tabloda/.test(vs.getAttribute("aria-label"))&&vs.parentElement.querySelectorAll("details table tr").length>=2);
  const h=w.document.createElement("div");
  h.innerHTML=w.eval("msel='waist';mChart(S.measures.slice().sort((a,b)=>a.day<b.day?-1:1))");
  ok("measure chart: value in the label and a table with both points",/son değer 88,0 cm/.test(h.querySelector("svg").getAttribute("aria-label"))&&h.querySelectorAll("details table tr").length===2,h.innerHTML.slice(0,300));
  finish();
})();
