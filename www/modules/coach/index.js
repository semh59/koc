"use strict";
Data.privacy.push(["Rehber sohbeti",()=>S.chat.length+S.chats.length,()=>cClearChat(),8]);
const Coach={providers:()=>S.providers,chats:()=>S.chats,chatCount:()=>S.chat.length,chatEd:()=>S.chat.some(m=>m.fl==="ed"||(m.card&&m.card.kind==="safety"&&m.card.level==="ed")),keys:()=>KEYS,vaultOn:()=>vaultOn};
