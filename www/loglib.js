const LogLib=(()=>{
  const MAX={p:500,c:2000,f:1000},NUTR=Object.keys(MAX);
  const copyNutr=(src,dst)=>{for(const k of NUTR)if(Number.isFinite(src[k]))dst[k]=src[k];return dst};
  return {NUTR,MAX,copyNutr};
})();
if(typeof module!=="undefined")module.exports=LogLib;
