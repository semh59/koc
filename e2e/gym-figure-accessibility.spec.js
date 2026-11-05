"use strict";
const {test,expect,state}=require("./fixtures");
test("gym figures expose accessible labels and honor reduced motion",async({app,page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await app.open({seed:state()});await app.tab("gym");await page.click('[data-g="lib"]');
  await page.fill("#glq","Squat");await page.click('[data-g="exinfo:squat"]');
  const normal=await page.locator("#sheet svg.fig").evaluate(svg=>({label:svg.getAttribute("aria-label"),role:svg.getAttribute("role"),focusable:svg.getAttribute("focusable"),motion:svg.dataset.figMotion,animate:svg.querySelectorAll("animate").length}));
  expect(normal.label).toBeTruthy();expect(normal.role).toBe("img");expect(normal.focusable).toBe("false");expect(normal.motion).toBe("animated");expect(normal.animate).toBeGreaterThan(0);
  await page.locator('#sheet [data-g="closesheet"]').click();
  await page.emulateMedia({reducedMotion:"reduce"});await page.click('[data-g="exinfo:squat"]');
  const reduced=await page.locator("#sheet svg.fig").evaluate(svg=>({motion:svg.dataset.figMotion,animate:svg.querySelectorAll("animate").length}));
  console.log("GYM_A11Y_MOTION="+JSON.stringify({normal,reduced}));
  expect(reduced.motion).toBe("static");expect(reduced.animate).toBe(0);
});
