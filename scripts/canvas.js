/* Fake 2D canvas context: records the fillText strings (drawn) and every other method name called (calls). */
module.exports=(textWidth=()=>100)=>{
  const drawn=[],calls=[];
  const ctx=new Proxy({},{get:(_,k)=>k==="measureText"?s=>({width:textWidth(s)}):k==="fillText"?s=>drawn.push(s):()=>{calls.push(k)},set:()=>true});
  return {ctx,drawn,calls};
};
