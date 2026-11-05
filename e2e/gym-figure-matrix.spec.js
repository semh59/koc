"use strict";
const {test,expect,state}=require("./fixtures");
const reps=[
  ["squat","Squat"],["bench","Bench press"],["row","Kürek çekme"],["rdl","Romanian deadlift"],
  ["dblunge","Dumbbell hamle"],["farmer","Çiftçi yürüyüşü"],["jumprope","İp atlama"],["quadstretch","Ön bacak esnetme"],["onefoot","Tek ayak üstünde duruş"]
];
test("representative exercise figures fit viewport across movement families",async({app,page})=>{
  await app.open({seed:state()});await app.tab("gym");await page.click('[data-g="lib"]');
  const results=[];
  for(const [id,name] of reps){
    await page.fill("#glq",name);await page.click(`[data-g="exinfo:${id}"]`);
    const r=await page.locator("#sheet svg.fig").evaluate(svg=>{const box=svg.getBoundingClientRect();return {box:[box.x,box.y,box.right,box.bottom],width:box.width,height:box.height,paths:svg.querySelectorAll("path").length,head:svg.querySelectorAll("circle.fg-head").length,view:svg.dataset.figView}});
    results.push({id,...r});await page.click('#sheet [data-g="closesheet"]');
  }
  console.log("GYM_FIGURE_MATRIX="+JSON.stringify(results));
  for(const r of results){expect(r.width).toBeGreaterThan(0);expect(r.height).toBeGreaterThan(0);expect(r.paths).toBeGreaterThan(3);expect(r.head).toBe(1);expect(r.box[0]).toBeGreaterThanOrEqual(-1);expect(r.box[1]).toBeGreaterThanOrEqual(-1)}
});
