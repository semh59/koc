/* No developer words reach the screen: every tab, with some data of each kind, shows no undefined, NaN, [object Object] or Infinity. */
const {ok,finish}=require("./ok");
const {boot}=require("./html");
const L=n=>{const d=new Date(Date.now()-n*864e5),p=x=>String(x).padStart(2,"0");return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`};
(async()=>{
  const entries=[
    {id:1,day:L(0),time:"08:00",type:"food",v:350,text:"Yumurta",meal:"breakfast",p:12,c:2,f:9},
    {id:2,day:L(0),time:"09:00",type:"water",v:250,text:""},
    {id:3,day:L(1),time:"07:30",type:"weight",v:80,text:""},{id:4,day:L(0),time:"07:30",type:"weight",v:79.5,text:""},
    {id:5,day:L(0),time:"18:00",type:"exercise",v:30,text:"Yürüyüş"},{id:6,day:L(0),time:"12:00",type:"steps",v:3000,text:"manual"},
    {id:7,day:L(0),time:"20:00",type:"note",v:null,text:"Not"}];
  const seed={entries,nextId:50,settings:{obDone:true,noticeOk:true,age:30,sex:"m",heightCm:178,goalKg:75,kcal:2200,waterMl:2000,bpOn:true,bsOn:true,medOn:true,cycleOn:true},
    vitals:[{id:1,k:"t",day:L(1),time:"08:15",sys:120,dia:80,ctx:"rest",session:"morning",sid:"a"},{id:2,k:"s",day:L(1),time:"07:00",g:95,ctx:"fasting"}],
    measures:[{day:L(5),k:"waist",v:90},{day:L(1),k:"waist",v:88}],
    workouts:[{id:1,day:L(2),t0:1,t1:2,name:"A",ex:[{id:"bench",sets:[{kg:50,reps:8,done:true}]}]}],
    meds:[{id:1,n:"Vitamin D",d:"1000 IU",t:["09:00"],on:true}],cycle:[{id:1,s:L(20)}],sleep:[{day:L(1),min:420,q:3}],mood:[{day:L(1),v:4}],
    labs:[{id:1,day:L(3),n:"LDL",v:3.2,u:"mmol/L"}]};
  const w=await boot(w=>w.localStorage.setItem("nw_state",JSON.stringify(seed)));
  const tabs=w.eval("[...new Set(['today','gym','trend','coach','more',...Object.keys(PARENT)])]");
  const bad=[];
  for(const t of tabs){
    try{w.eval(`tab=${JSON.stringify(t)};render()`)}catch(e){bad.push(t+": throws "+e.message);continue}
    const txt=w.document.querySelector("#view").textContent,m=txt.match(/.{0,30}(undefined|NaN|\[object Object\]|Infinity|\bnull\b).{0,30}/);
    if(m)bad.push(t+": "+m[0]);
  }
  ok(`no leaked developer word on ${tabs.length} screens`,bad.length===0,bad);
  finish();
})();
