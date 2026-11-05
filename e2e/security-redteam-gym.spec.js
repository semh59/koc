"use strict";
const {test,expect,state}=require("./fixtures");

test("custom exercise name cannot execute through figure SVG aria label",async({app,page,errs})=>{
  errs.allow(/Failed to load resource/);
  const hostile='"/><img src=x onerror="window.__gymProbe=1">';
  await app.open({seed:state({},{customEx:[{id:"c900",n:hostile,g:"Bacak",inc:2.5,r:"Ön bacak",k:"w",c:"g",q:"Salon",tp:"squat"}]})});
  await app.tab("gym");await page.click('[data-g="lib"]');await page.fill("#glq","img");
  await page.click('[data-g="exinfo:c900"]');
  const observed=await page.evaluate(()=>({dangerous:document.querySelectorAll('#sheet img[onerror],#sheet [onerror]').length,marker:window.__gymProbe||null}));
  console.log("GYM_XSS_REGRESSION="+JSON.stringify(observed));
  expect(observed.dangerous).toBe(0);expect(observed.marker).toBeNull();
});
