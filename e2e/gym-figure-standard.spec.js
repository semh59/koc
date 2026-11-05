"use strict";
const {test,expect,state}=require("./fixtures");

test("exercise figures follow the shared visual standard",async({app,page})=>{
  await app.open({seed:state()});await app.tab("gym");await page.click('[data-g="lib"]');
  const figures=await page.locator("#gllist svg.fig").evaluateAll(xs=>xs.slice(0,12).map(x=>({view:x.dataset.figView,motion:x.dataset.figMotion,box:x.getAttribute("viewBox"),fit:x.getAttribute("preserveAspectRatio"),focus:x.getAttribute("focusable"),label:x.getAttribute("aria-label")})));
  expect(figures.length).toBeGreaterThan(0);
  for(const f of figures){expect(f.box).toBe("0 0 160 150");expect(f.fit).toBe("xMidYMid meet");expect(f.focus).toBe("false");expect(["front","side"]).toContain(f.view);expect(f.motion).toBe("static");expect(f.label).toBeTruthy()}
});
