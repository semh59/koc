"use strict";
const {test,expect,state,offscreen}=require("./fixtures");

const seed=()=>state({consent:true,consentV:2,consentAt:"2026-10-06",consentP:"gemini,groq,nvidia,openrouter"});
/* Yatay mod: sayfa yana kaymaz, hiçbir etkileşimli öğe ekran dışına taşmaz. */
const noOverflow=async(page,what)=>{
  const o=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,bw:document.body.scrollWidth,w:innerWidth}));
  expect(o.sw,what+": sayfa yana kayıyor").toBeLessThanOrEqual(o.w);expect(o.bw,what+": gövde taşıyor").toBeLessThanOrEqual(o.w);
  expect(await offscreen(page),what+": ekran dışı öğe").toEqual([]);
};
const rotate=async page=>{const v=page.viewportSize();await page.setViewportSize({width:v.height,height:v.width})};

test.describe("Yatay mod (dikten döndürme)",()=>{
  test("Bugün ve Koç: döndürünce kayma ya da taşma yok, geri dönünce de",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Tamam, not aldım. ".repeat(8)});
    await app.open({seed:seed(),keys:{groq:"gsk_test"}});
    await noOverflow(page,"dikey Bugün");
    await rotate(page);
    expect(await page.evaluate(()=>innerWidth>innerHeight)).toBe(true);
    await noOverflow(page,"yatay Bugün");
    await app.tab("koc");
    for(let i=0;i<3;i++){await page.fill("#cmsg","Mesaj "+i);await page.click("#csend");await expect(page.locator(".cm").nth(i)).toBeVisible()}
    await page.waitForTimeout(300);
    await noOverflow(page,"yatay Koç");
    const g=await page.evaluate(()=>{const m=[...document.querySelectorAll(".cm,.ub")].pop().getBoundingClientRect();return [m.bottom,document.querySelector("#composer").getBoundingClientRect().top]});
    expect(g[0]).toBeLessThanOrEqual(g[1]+1);
    await rotate(page);
    await noOverflow(page,"dikey Koç");
    await app.tab("bugun");await noOverflow(page,"dikey Bugün (dönüş)");
  });
  test("üst güvenli alan örtüsü kayan sohbet içeriğini örter, yapışkan çubuk örtünün altında durur",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Uzun yanıt satırı. ".repeat(12)});
    await app.open({seed:seed(),keys:{groq:"gsk_test"}});
    await rotate(page);
    await app.tab("koc");
    for(let i=0;i<4;i++){await page.fill("#cmsg","Mesaj "+i);await page.click("#csend");await expect(page.locator(".cm").nth(i)).toBeVisible()}
    await page.evaluate(()=>document.documentElement.style.setProperty("--safe-area-inset-top","28px"));
    await page.evaluate(()=>window.scrollTo(0,0));await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight/2));
    await page.waitForTimeout(200);
    const r=await page.evaluate(()=>{
      const cs=getComputedStyle(document.body,"::before"),bar=document.querySelector(".cbar").getBoundingClientRect();
      const under=[...document.querySelectorAll(".cm,.ub")].filter(e=>{const b=e.getBoundingClientRect();return b.top<28&&b.bottom>0});
      return {pos:cs.position,h:cs.height,top:cs.top,z:+cs.zIndex,bg:cs.backgroundColor,bodyBg:getComputedStyle(document.body).backgroundColor,under:under.length,underZ:under.map(e=>getComputedStyle(e).zIndex),barTop:bar.top,sy:scrollY};
    });
    expect(r.sy).toBeGreaterThan(100);
    expect(r).toMatchObject({pos:"fixed",h:"28px",top:"0px"});
    expect(r.bg).toBe(r.bodyBg);expect(r.bg).not.toMatch(/rgba\(.*, 0\)|transparent/);
    expect(r.under,"örtünün altından geçen sohbet öğesi yok: test bir şey kanıtlamıyor").toBeGreaterThan(0);
    expect(r.underZ.every(z=>z==="auto"||+z<r.z)).toBe(true);
    expect(r.barTop).toBeGreaterThanOrEqual(28);
  });
});
