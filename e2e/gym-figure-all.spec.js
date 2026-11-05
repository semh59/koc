"use strict";
const {test,expect,state}=require("./fixtures");
test("all exercise figure thumbnails render inside their cards",async({app,page})=>{
  await app.open({seed:state()});await app.tab("gym");await page.click('[data-g="lib"]');
  const all=[];
  for(let pageNo=0;pageNo<12;pageNo++){
    const rows=await page.locator("#gllist .exrow").evaluateAll(xs=>xs.map(x=>({id:x.dataset.g?.split(":")[1],svg:x.querySelector("svg.fig")?.getBoundingClientRect().toJSON(),paths:x.querySelectorAll("svg.fig path").length})));all.push(...rows);
    const more=page.locator('#gllist [data-g="lmore"]');if(!await more.count())break;await more.click();
  }
  const unique=[...new Map(all.map(x=>[x.id,x])).values()];
  console.log("GYM_ALL_FIGURES="+JSON.stringify({count:unique.length,rawCount:all.length,minPaths:Math.min(...unique.map(x=>x.paths)),zero:unique.filter(x=>!x.svg||x.svg.width<=0||x.svg.height<=0).map(x=>x.id)}));
  expect(unique.length).toBe(332);expect(unique.every(x=>x.svg&&x.svg.width>0&&x.svg.height>0&&x.paths>3)).toBe(true);
});
