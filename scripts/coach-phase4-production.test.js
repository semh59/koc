const {ok,finish}=require("./ok");
const {boot}=require("./html");

boot().then(w=>{
  const result=JSON.parse(w.eval(`(()=>{S=structuredClone(DEF);S.coachMemories=[{id:"memory-1",kind:"preference",value:"Akşam yürüyüşü",source:"user_note",sourceLabel:"Kullanıcı notu",confidence:"high",lastVerifiedAt:"2026-10-20",reason:"Kullanıcı tercihi"}];return JSON.stringify({api:[typeof Coach.memories,typeof Coach.memoryList,typeof Coach.memoryEdit,typeof Coach.memoryDelete,typeof Coach.memoryExport].join(","),context:Coach.memoryContext(),list:Coach.memoryList()})})()`));
  ok("production Coach exposes memory controls",result.api==="function,function,function,function,function",result);
  ok("production memory list is persisted state",result.list.length===1&&result.list[0].source==="user_note"&&result.context.facts[0].reason==="Kullanıcı tercihi",result);
  const edit=JSON.parse(w.eval(`(()=>JSON.stringify(Coach.memoryEdit("memory-1",{value:"Sabah yürüyüşü",confidence:"medium"})))()`));
  ok("production memory edit keeps provenance",edit.value==="Sabah yürüyüşü"&&edit.source==="user_note",edit);
  const deleted=JSON.parse(w.eval(`(()=>JSON.stringify({ok:Coach.memoryDelete("memory-1"),list:Coach.memoryList(),facts:Coach.memoryContext().facts}))()`));
  ok("production deleted memory is absent from provider context",deleted.ok&&deleted.list.length===0&&!deleted.facts.some(f=>f.name==="memory:memory-1"),deleted);
  const created=JSON.parse(w.eval(`(()=>{S.settings.obDone=true;S.coachMemories=[];const x=Coach.memoryCreate({kind:"preference",value:"Yeni bilgi",source:"user_note",sourceLabel:"Kullanıcı notu",confidence:"medium",lastVerifiedAt:"2026-10-28",reason:"Açık kullanıcı bilgisi",retentionUntil:"2027-10-28"});tab="settings-coach";render();return JSON.stringify(x)})()`));
  const createState=JSON.parse(w.eval(`(()=>JSON.stringify(Coach.memoryList()))()`));
  ok("production memory create validates and persists",created&&created.value==="Yeni bilgi"&&createState.some(x=>x.id===created.id),created);
  const invalidDate=w.eval(`(()=>Coach.memoryCreate({value:"bad",source:"x",confidence:"low",lastVerifiedAt:"2026-02-31",reason:"x"}))()`);
  ok("production memory create rejects invalid date",invalidDate===null,invalidDate);
  w.eval(`(()=>{Coach.memoryEdit("${created.id}",{value:"<script>alert(1)</script>"});tab="settings-coach";render()})()`);

  const ui=w.document.body.innerHTML;
  ok("memory settings UI lists provenance fields and escapes values",ui.includes("Hafıza")&&ui.includes("Kaynak")&&ui.includes("Belirsizlik")&&ui.includes("Son doğrulama")&&ui.includes("Saklama")&&!ui.includes("<script>alert(1)</script>"),ui);
  ok("memory settings UI offers create and edit controls",ui.includes("Yeni hafıza")&&ui.includes(`memoryedit:${created.id}`),ui);
  w.eval(`(()=>{memoryOpen("${created.id}");})()`);
  ok("memory edit starts explicit preview flow",w.document.body.innerHTML.includes("Önizle")&&w.document.body.innerHTML.includes("Vazgeç"),w.document.body.innerHTML);
  finish();
}).catch(e=>{console.error(e);process.exit(1)});
