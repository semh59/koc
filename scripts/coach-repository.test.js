const {ok,finish}=require("./ok");
const C=require("../www/modules/coach/coachlib.js");
const {boot}=require("./html");

boot().then(w=>{
  const r=JSON.parse(w.eval(`(()=>{
    const state=structuredClone(DEF);
    state.chat=[{id:1,role:"user",text:"merhaba",t:1}];
    state.chats=[{id:2,title:"Eski",t:2,msgs:[{id:3,role:"coach",text:"eski",t:2}]}];
    state.cid=9;
    state.providers=state.providers.map(p=>({...p,on:p.id==="groq",health:p.id==="groq"}));
    const m=shardOf(state),back=assemble(m);
    return JSON.stringify({chat:back.chat,chats:back.chats,cid:back.cid,providers:back.providers,hasCoach:!!m.coach,hasOther:!!m.other})
  })()`));
  ok("Coach legacy fields belong to the coach shard",r.hasCoach&&!r.hasOther);
  ok("Coach legacy chat survives shard round trip",r.chat.length===1&&r.chat[0].text==="merhaba");
  ok("Coach archive survives shard round trip",r.chats.length===1&&r.chats[0].msgs[0].text==="eski");
  ok("Coach cid and providers survive shard round trip",r.cid===9&&r.providers.some(p=>p.id==="groq"&&p.on));
  ok("legacy migration API exists",typeof C.migrateLegacy==="function");
  const migrated=C.migrateLegacy({chat:[{id:1,role:"user",text:"aktif",t:1}],chats:[{id:2,title:"eski",t:2,msgs:[{id:3,role:"coach",text:"arşiv",t:2}]}],cid:9,providers:[{id:"groq",model:"m",on:true,health:true}]});
  ok("legacy migration keeps active and archived messages",migrated&&migrated.version===1&&migrated.conversations.length===2&&migrated.conversations[0].messages[0].text==="aktif"&&migrated.conversations[1].messages[0].text==="arşiv");
  ok("legacy migration keeps provider metadata without secrets",migrated&&migrated.providers[0].id==="groq"&&migrated.providers[0].model==="m"&&!Object.hasOwn(migrated.providers[0],"key"));
  ok("legacy migration is deterministic",JSON.stringify(C.migrateLegacy({chat:[],chats:[],cid:1,providers:[]}))===JSON.stringify(C.migrateLegacy({chat:[],chats:[],cid:1,providers:[]})));
  const many={chat:[],chats:Array.from({length:21},(_,i)=>({id:i+1,title:"s"+i,t:i,msgs:[{id:i+1,role:"coach",text:"m"+i,t:i}]})),cid:22,providers:[{id:"u1",name:"x",base:"https://user:secret@example.test/v1?api_key=leak",model:"m",on:true,health:true}],unknown:{secret:"drop"}};
  const m2=C.migrateLegacy(many);
  ok("migration does not silently drop archived conversations",m2.conversations.length===21&&m2.dropped.includes("unknown"));
  ok("migration deep-copies messages",m2.conversations.length===21&&m2.conversations[0].messages!==many.chats[0].msgs&&m2.conversations[0].messages[0]!==many.chats[0].msgs[0]);
  ok("migration strips provider credentials from URL",m2.providers[0].base==="https://example.test/v1"&&!m2.providers[0].base.includes("secret")&&!m2.providers[0].base.includes("api_key"));
  const repo=C.createRepository({chat:[],chats:[],cid:1,providers:[]});
  const c={id:1,title:"T",createdAt:1,updatedAt:1,messages:[]};
  ok("repository upsert/read uses copies",repo.upsertConversation(c)&&repo.conversation(1)!==c&&repo.conversation(1).title==="T");
  c.title="changed";ok("repository snapshot is isolated",repo.conversation(1).title==="T");
  let writes=0;const atomic=C.migrateLegacyAtomic({chat:[]},next=>{writes++;return next.version===1});
  ok("atomic migration commits once",atomic.ok&&writes===1);
  const failed=C.migrateLegacyAtomic({chat:[{id:1,role:"user",text:"old",t:1}]},()=>false);
  ok("failed migration preserves old state",!failed.ok&&failed.state.chat[0].text==="old");
  finish();
});
