const LogLib=(()=>{
  const MAX={p:500,c:2000,f:1000},NUTR=Object.keys(MAX);
  const copyNutr=(src,dst)=>{for(const k of NUTR)if(Number.isFinite(src[k])&&src[k]>=0&&src[k]<=MAX[k])dst[k]=src[k];return dst};
  const key=s=>s.trim().replace(/İ/g,"i").replace(/I/g,"ı").toLowerCase();
  function item(x){
    if(!x||typeof x.text!=="string"||!x.text.trim())return null;
    const v=x.v==null?null:Number(x.v);
    if(v!=null&&!(v>=0&&v<=20000))return null;
    return copyNutr(x,{text:x.text.trim().slice(0,100),v});
  }
  function cleanFav(arr){
    const out=[],seen=new Set();
    for(const x of Array.isArray(arr)?arr:[]){
      const it=item(x);if(!it||seen.has(key(it.text)))continue;
      seen.add(key(it.text));out.push(it);
    }
    return out.slice(0,20);
  }
  function recents(entries,today){
    const out=[],seen=new Set(),t=Date.parse(today);
    const src=entries.filter(e=>e.type==="yemek"&&e.day<=today&&(t-Date.parse(e.day))/864e5<=30).sort((a,b)=>b.day.localeCompare(a.day)||b.id-a.id);
    for(const e of src){
      const it=item(e);if(!it||seen.has(key(it.text)))continue;
      seen.add(key(it.text));out.push(it);if(out.length===8)break;
    }
    return out;
  }
  return {NUTR,MAX,copyNutr,key,cleanFav,recents};
})();
if(typeof module!=="undefined")module.exports=LogLib;
