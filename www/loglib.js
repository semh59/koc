const LogLib=(()=>{
  const MAX={p:500,c:2000,f:1000,fb:500,sg:2000,na:50000},NUTR=Object.keys(MAX);
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
  function cleanTpl(arr){
    const out=[],ids=new Set();
    for(const t of Array.isArray(arr)?arr:[]){
      if(!t||typeof t.n!=="string"||!t.n.trim()||!Array.isArray(t.items))continue;
      const items=t.items.map(item).filter(Boolean).slice(0,15);
      if(!items.length)continue;
      const id=Number.isInteger(t.id)&&t.id>0&&!ids.has(t.id)?t.id:Math.max(0,...ids)+1;
      ids.add(id);out.push({id,n:t.n.trim().slice(0,40),items});
      if(out.length===20)break;
    }
    return out;
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
  const stalled=(snapAt,now,yest,prev7)=>(snapAt>0&&now-snapAt>26*36e5)||(yest===0&&prev7>1000);
  return {stalled,NUTR,MAX,copyNutr,key,cleanFav,cleanTpl,recents};
})();
if(typeof module!=="undefined")module.exports=LogLib;
