/* Storage shards: every S field belongs to exactly one shard (no data is dropped silently); split and reassemble leave the state unchanged. */
const {ok,finish}=require("./ok");
require("./html").boot().then(w=>{
  const r=JSON.parse(w.eval(`(()=>{
    const d=structuredClone(DEF),m=shardOf(d),owned=Object.values(Shards).flat(),seen={},dup=[];
    for(const k of owned){if(seen[k])dup.push(k);seen[k]=1}
    const rich=structuredClone(DEF);rich.entries.push({id:1,day:"2026-10-01",time:"09:00",type:"water",v:250,text:""},{id:2,day:"2025-01-05",time:"09:00",type:"weight",v:80,text:""},{id:3,day:"2026-10-09",time:"09:00",type:"water",v:100,text:""});rich.sleep.push({day:"2026-10-01",min:400});rich.futureKey={a:1};
    const back=assemble(shardOf(rich));
    return JSON.stringify({missing:Object.keys(d).filter(k=>!seen[k]),dup,other:!!m.other,same:JSON.stringify(back,Object.keys(back).sort())===JSON.stringify(rich,Object.keys(rich).sort()),extra:!!shardOf(rich).other,ay:Object.keys(shardOf(rich)).filter(k=>k.startsWith('log/')).sort()})
  })()`));
  ok("every default S field belongs to a shard",r.missing.length===0,r.missing);
  ok("no field is in two shards",r.dup.length===0,r.dup);
  ok("the default state creates no 'other' shard",!r.other);
  ok("split and reassemble keep the state; an unknown field goes to the 'other' shard instead of being dropped",r.same&&r.extra);
  ok("entries are sharded per month: a new month changes only its own shard",JSON.stringify(r.ay)===JSON.stringify(["log/2025-01","log/2026-10"]),r.ay);
  finish();
});
