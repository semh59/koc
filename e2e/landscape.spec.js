"use strict";
const {test,expect,state,offscreen,CONSENT}=require("./fixtures");

const seed=()=>state(CONSENT);
/* Landscape: the page does not scroll sideways and no interactive element leaves the screen. */
const noOverflow=async(page,what)=>{
  const o=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,bw:document.body.scrollWidth,w:innerWidth}));
  expect(o.sw,what+": page scrolls sideways").toBeLessThanOrEqual(o.w);expect(o.bw,what+": body overflows").toBeLessThanOrEqual(o.w);
  expect(await offscreen(page),what+": element off screen").toEqual([]);
};
const rotate=async page=>{const v=page.viewportSize();await page.setViewportSize({width:v.height,height:v.width})};

test.describe("Landscape (rotating from portrait)",()=>{
  test("Today and Coach: no shift or overflow after rotating, nor after rotating back",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Tamam, not aldım. ".repeat(8)});
    await app.open({seed:seed(),keys:{groq:"gsk_test"}});
    await noOverflow(page,"portrait Today");
    await rotate(page);
    expect(await page.evaluate(()=>innerWidth>innerHeight)).toBe(true);
    await noOverflow(page,"landscape Today");
    await app.tab("coach");
    for(let i=0;i<3;i++){await page.fill("#cmsg","Mesaj "+i);await page.click("#csend");await expect(page.locator(".cm").nth(i)).toBeVisible()}
    await app.settled();
    await noOverflow(page,"landscape Coach");
    const g=await page.evaluate(()=>{const m=[...document.querySelectorAll(".cm,.ub")].pop().getBoundingClientRect();return [m.bottom,document.querySelector("#composer").getBoundingClientRect().top]});
    expect(g[0]).toBeLessThanOrEqual(g[1]+1);
    await rotate(page);
    await noOverflow(page,"portrait Coach");
    await app.tab("today");await noOverflow(page,"portrait Today (after rotating back)");
  });
  test("the top safe-area veil covers scrolling chat content and the sticky bar sits below the veil",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Uzun yanıt satırı. ".repeat(12)});
    await app.open({seed:seed(),keys:{groq:"gsk_test"}});
    await rotate(page);
    await app.tab("coach");
    for(let i=0;i<4;i++){await page.fill("#cmsg","Mesaj "+i);await page.click("#csend");await expect(page.locator(".cm").nth(i)).toBeVisible()}
    await page.evaluate(()=>document.documentElement.style.setProperty("--safe-area-inset-top","28px"));
    await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight/2));
    await app.settled();
    const r=await page.evaluate(()=>{
      const cs=getComputedStyle(document.body,"::before"),bar=document.querySelector(".cbar").getBoundingClientRect();
      const under=[...document.querySelectorAll(".cm,.ub")].filter(e=>{const b=e.getBoundingClientRect();return b.top<28&&b.bottom>0});
      return {pos:cs.position,h:cs.height,top:cs.top,z:+cs.zIndex,bg:cs.backgroundColor,bodyBg:getComputedStyle(document.body).backgroundColor,under:under.length,underZ:under.map(e=>getComputedStyle(e).zIndex),barTop:bar.top,sy:scrollY};
    });
    expect(r.sy).toBeGreaterThan(100);
    expect(r).toMatchObject({pos:"fixed",h:"28px",top:"0px"});
    expect(r.bg).toBe(r.bodyBg);expect(r.bg).not.toMatch(/rgba\(.*, 0\)|transparent/);
    expect(r.under,"no chat element passes under the veil: the test proves nothing").toBeGreaterThan(0);
    expect(r.underZ.every(z=>z==="auto"||+z<r.z)).toBe(true);
    expect(r.barTop).toBeGreaterThanOrEqual(28);
  });
});
