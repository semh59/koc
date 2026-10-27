"use strict";
Data.privacy.push(["Rehber sohbeti",()=>S.chat.length+S.chats.length,()=>cClearChat(),8]);
let CoachRepo=null;
const coachRepository=()=>CoachRepo||(CoachRepo=CoachLib.createRepository({chat:S.chat,chats:S.chats,cid:S.cid,providers:S.providers}));
const Coach={providers:()=>S.providers,chats:()=>S.chats,chatCount:()=>S.chat.length,chatEd:()=>S.chat.some(m=>m.fl==="ed"||(m.card&&m.card.kind==="safety"&&m.card.level==="ed")),keys:()=>KEYS,vaultOn:()=>vaultOn,repository:coachRepository};