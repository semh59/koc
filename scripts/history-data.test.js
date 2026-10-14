/* History data coverage: old walks/runs, lab results, wider search with type and day filters, the full camera pulse list. */
const {ok,finish}=require("./ok");
const {boot,flush}=require("./html");
const L=n=>{const d=new Date(Date.now()-n*864e5),p=x=>String(x).padStart(2,"0");return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`};
async function open(){
  const old=L(12),older=L(30);
  const w=await boot(w=>{
    w.localStorage.setItem("nw_state",JSON.stringify({entries:[{id:1,day:older,time:"12:00",type:"note",v:null,text:"kafa karışık not"}],settings:{obDone:true,noticeOk:true,age:30},
      moves:[{day:old,t0:"07:30",min:25,k:"w",steps:2800,km:2.1,kmh:5,kcal:90,gps:false},{day:old,t0:"18:00",min:12,k:"r",steps:1900,km:2,kmh:10,kcal:120,gps:false}],
      labs:[{id:1,day:old,k:"ldl",n:"LDL kolesterol",v:3.2,u:"mmol/L"}],
      vitals:[{id:1,k:"t",day:older,time:"08:00",sys:120,dia:80,note:"kafa ağrısı vardı",ctx:"rest",session:"morning",sid:"a"}],
      mood:[{day:old,v:3,t:"kafam dolu"}],
      pulse:Array.from({length:12},(_,i)=>({id:i+1,day:L(i+1),time:"09:00",bpm:60+i}))}));
  });
  return {w,old,older};
}
(async()=>{
  const {w,old,older}=await open();
  const go=k=>{w.eval(`hgGoDay("${k}")`)},T=()=>w.document.body.textContent;
  go(old);
  ok("day screen lists an old detected walk and run with delete buttons",/07:30 Yürüyüş/.test(T())&&/18:00 Koşu/.test(T())&&w.document.querySelectorAll("[data-mo^='del:']").length===2);
  ok("day screen shows the lab result",/LDL kolesterol/.test(T())&&/3,2 mmol\/L/.test(T()));
  w.document.querySelector("[data-mo^='del:']").click();await flush();
  ok("deleting one movement removes only that record and offers undo",w.eval("S.moves.length")===1&&w.eval("S.moves[0].k")==="r"&&!w.document.querySelector("#tundo").hidden);
  w.document.querySelector("#tundo").click();await flush();
  ok("undo brings the movement back",w.eval("S.moves.length")===2);
  const search=q=>{w.eval(`hg.seg="search";hg.q=${JSON.stringify(q)};hg.type="";hg.from="";hg.to="";tab="history";render()`);return w.document.querySelector("#hgres").textContent};
  ok("search finds the lab name, the movement kind, the mood note and the glucose/blood pressure note",/LDL kolesterol/.test(search("ldl"))&&/Koşu/.test(search("koşu"))&&/kafam dolu/.test(search("dolu"))&&/kafa ağrısı/.test(search("ağrı")));
  ok("search still needs 2 letters",/En az 2 harf/.test(search("k")));
  search("kafa");
  ok("without a filter both the note and the blood pressure note match",w.document.querySelectorAll("#hgres .rrow").length===3);
  w.document.querySelector('[data-hg="type:vitals"]').click();await flush();
  ok("type filter keeps only that type",w.document.querySelectorAll("#hgres .rrow").length===1&&/kafa ağrısı/.test(w.document.querySelector("#hgres").textContent));
  w.eval(`hg.type="";hg.from="${L(20)}";hg.to="${L(5)}";render()`);
  ok("day range filter drops records outside it",w.document.querySelectorAll("#hgres .rrow").length===1&&/kafam dolu/.test(w.document.querySelector("#hgres").textContent));
  w.eval("plSheet()");
  ok("camera pulse list shows all records, not the last 8",w.document.querySelectorAll("#sheet [data-pl^='del:']").length===12);
  ok("calendar marks the day as having other records",w.eval(`HistoryLib.marks(hgIndex().get("${old}")).other`)===true);
  finish();
})();
