/* Depo parçaları: her S alanı tam bir parçaya aittir (veri sessizce düşmez), bölüp birleştirmek veriyi değiştirmez. */
const {JSDOM}=require("jsdom");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const dom=new JSDOM(require("./html").build(),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://localhost/",beforeParse(w){Object.assign(w,{structuredClone,TextEncoder,TextDecoder,__noSelfTest:true});w.scrollTo=()=>{};w.confirm=()=>true;w.Element.prototype.scrollIntoView=function(){}}});
setTimeout(()=>{
  const r=JSON.parse(dom.window.eval(`(()=>{
    const d=structuredClone(DEF),m=shardOf(d),owned=Object.values(Shards).flat(),seen={},dup=[];
    for(const k of owned){if(seen[k])dup.push(k);seen[k]=1}
    const rich=structuredClone(DEF);rich.entries.push({id:1,day:"2026-10-01",time:"09:00",type:"su",v:250,text:""},{id:2,day:"2025-01-05",time:"09:00",type:"kilo",v:80,text:""},{id:3,day:"2026-10-09",time:"09:00",type:"su",v:100,text:""});rich.sleep.push({day:"2026-10-01",min:400});rich.futureKey={a:1};
    const back=assemble(shardOf(rich));
    return JSON.stringify({missing:Object.keys(d).filter(k=>!seen[k]),dup,diger:!!m.diger,same:JSON.stringify(back,Object.keys(back).sort())===JSON.stringify(rich,Object.keys(rich).sort()),extra:!!shardOf(rich).diger,ay:Object.keys(shardOf(rich)).filter(k=>k.startsWith('kayit/')).sort()})
  })()`));
  ok("her varsayılan S alanı bir parçaya ait",r.missing.length===0,r.missing);
  ok("hiçbir alan iki parçada değil",r.dup.length===0,r.dup);
  ok("varsayılan durumda 'diger' parçası oluşmaz",!r.diger);
  ok("bölüp birleştirmek durumu değiştirmez; bilinmeyen alan 'diger' parçasına gider, düşmez",r.same&&r.extra);
  ok("kayıtlar ay ay ayrı parçada: eklenen ay yalnız kendi parçasını değiştirir",JSON.stringify(r.ay)===JSON.stringify(["kayit/2025-01","kayit/2026-10"]),r.ay);
  console.log(bad?bad+" başarısız":"Tüm parça testleri geçti");process.exit(bad?1:0);
},300);
