"use strict";
Data.privacy.push(["Rehber sohbeti",()=>S.chat.length+S.chats.length,()=>cClearChat(),8]);
let CoachRepo=null;
const coachRepository=()=>CoachRepo||(CoachRepo=CoachLib.createRepository({chat:S.chat,chats:S.chats,cid:S.cid,providers:S.providers}));
let CoachPlanner=null,CoachPlannerState=null;
const coachPlanner=()=>{if(CoachPlanner&&CoachPlannerState===S)return CoachPlanner;CoachPlanner=CoachLib.createPlanner({plans:S.coachPlans,checkins:S.coachCheckins,actions:S.coachActions});CoachPlannerState=S;return CoachPlanner};
const coachMemories=()=>CoachLib.createMemoryRepository(S.coachMemories);
const memoryContext=()=>CoachLib.compileContext({consent:true,purpose:"conversation",memories:coachMemories().list(),missingData:[]});
const memorySync=(repo,before)=>{const next=repo.snapshot();S.coachMemories=next;const durable=typeof saveDurable==="function"?saveDurable():save();if(durable&&typeof durable.then==="function")return durable.then(ok=>ok||((S.coachMemories=before),false));if(durable===true)return true;S.coachMemories=before;return false};
const memoryList=()=>coachMemories().list();
const memoryCreate=patch=>{const now=dayKey(),id="memory-"+Date.now()+"-"+Math.random().toString(36).slice(2,8),before=structuredClone(S.coachMemories),base={id,kind:"fact",sourceLabel:patch.source||"Kullanıcı notu",...patch,lastVerifiedAt:patch.lastVerifiedAt||now},clean=CoachLib.createMemoryRepository([base]).list()[0];if(!clean)return null;S.coachMemories=[...S.coachMemories,clean];const durable=typeof saveDurable==="function"?saveDurable():save();if(durable&&typeof durable.then==="function")return durable.then(ok=>ok?clean:(S.coachMemories=before,null));if(durable!==true){S.coachMemories=before;return null}return clean};
const memoryEdit=(id,patch)=>{const before=structuredClone(S.coachMemories),repo=coachMemories(),out=repo.edit(id,patch);return out&&memorySync(repo,before)?out:null};
const memoryDelete=id=>{const before=structuredClone(S.coachMemories),repo=coachMemories();if(!repo.delete(id))return false;return memorySync(repo,before)};
const memoryExport=()=>coachMemories().exportBeforeDelete();
  const memoryDeleteAll=async()=>{
    const repo=coachMemories(),backup=repo.exportBeforeDelete();
    if(!backup||!backup.length)return null;
    const before=structuredClone(S.coachMemories);
    let handed;
    try{handed=await shareOut(false,`neowell-memory-${dayKey()}.json`,"Rehber hafızası","application/json",JSON.stringify(backup),true)}catch(e){handed=false}
    if(handed!==true||!repo.deleteAfterExport(()=>true)||!(await memorySync(repo,before))){S.coachMemories=before;return null}
    return backup;
  };
const Coach={memories:coachMemories,memoryContext,memoryList,memoryCreate,memoryEdit,memoryDelete,memoryExport,memoryDeleteAll,providers:()=>S.providers,chats:()=>S.chats,chatCount:()=>S.chat.length,chatEd:()=>S.chat.some(m=>m.fl==="ed"||(m.card&&m.card.kind==="safety"&&m.card.level==="ed")),keys:()=>KEYS,vaultOn:()=>vaultOn,repository:coachRepository,planner:()=>{const p=coachPlanner(),rollback=before=>{p.restore(before);S.coachPlans=before.plans;S.coachCheckins=before.checkins;S.coachActions=before.actions;CoachPlanner=null;CoachPlannerState=null;return false},sync=before=>{const x=p.snapshot();S.coachPlans=x.plans;S.coachCheckins=x.checkins;S.coachActions=x.actions;const durable=typeof saveDurable==="function"?saveDurable():save();if(durable&&typeof durable.then==="function")return durable.then(ok=>ok||rollback(before));return durable===true?true:rollback(before)},commit=(r,before)=>{if(!r.ok||r.duplicate)return r;const done=sync(before);return done&&typeof done.then==="function"?done.then(ok=>ok?r:{ok:false,error:"persistence"}):done?r:{ok:false,error:"persistence"}};return {snapshot:p.snapshot,plan:p.plan,dailyPriority:p.dailyPriority,adapt:p.adapt,upsertPlan:x=>{const b=p.snapshot(),r=p.upsertPlan(x);return commit(r,b)},checkIn:x=>{const b=p.snapshot(),r=p.checkIn(x);return commit(r,b)},confirmAction:x=>{const b=p.snapshot(),r=p.confirmAction(x);return commit(r,b)},undoAction:(id,key)=>{const b=p.snapshot(),r=p.undoAction(id,key);return commit(r,b)}}}};