"use strict";
const {test,expect,state}=require("./fixtures");

test.describe("Erişilebilirlik ve düzen",()=>{
  test("sheet: odak içeride döner, arka plan inert, adı var, Escape odağı tetikleyiciye döndürür",async({app,page})=>{
    await app.open({seed:state()});
    await page.focus('.act[data-act="yemek"]');
    await page.click('.act[data-act="yemek"]');
    await expect(page.locator("#sheet")).toHaveAttribute("aria-labelledby","sht");
    await expect(page.locator("#sht")).toHaveText("Yemek ekle");
    await expect(page.locator("#app")).toHaveJSProperty("inert",true);
    for(let i=0;i<40;i++){
      await page.keyboard.press(i%2?"Tab":"Shift+Tab");
      expect(await page.evaluate(()=>!!document.activeElement.closest("#sheet"))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(page.locator("#sheet")).not.toHaveClass(/\bon\b/);
    await expect(page.locator("#app")).toHaveJSProperty("inert",false);
    expect(await page.evaluate(()=>document.activeElement.dataset.act)).toBe("yemek");
  });

  test("dokunma hedefleri: kas haritası düğmeleri ve Ayarlar onay satırları en az 44 px",async({app,page})=>{
    await app.open({seed:state()});
    await app.tab("salon");
    const small=async sel=>page.evaluate(s=>[...document.querySelectorAll(s)].map(e=>e.getBoundingClientRect()).filter(r=>r.height<43.5||r.width<43.5).length,sel);
    expect(await small(".mmp .chip")).toBe(0);
    expect(await small(".mmwrap [role=button],.mmwrap [tabindex]")).toBe(0);
    await app.go("ayar-modul");await expect(page.locator(".chkrow").first()).toBeVisible();
    expect(await small(".chkrow .sw input,.chkrow")).toBe(0);
    await app.go("ayar-profil");
    expect(await small(".chkrow .sw input,.chkrow")).toBe(0);
  });

  test("veri yokken kas çiplerinde sıfır sayacı yok",async({app,page})=>{
    await app.open({seed:state()});await app.tab("salon");
    await expect(page.locator(".mmp .chip",{hasText:/\d/})).toHaveCount(0);
  });

  test("Koç boş durumu: üç örnek, dokununca mesaj gider",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Tamam."});
    await app.open({seed:state({consent:true,consentV:2,consentAt:"2026-10-06",consentP:"gemini,groq,nvidia,openrouter"}),keys:{groq:"gsk_test"}});
    await app.tab("koc");
    await expect(page.locator('[data-c^="ask:"]')).toHaveCount(3);
    await page.click('[data-c="ask:1"]');
    await expect(page.locator(".ub")).toHaveText("Bugün ne yapmalıyım?");
  });
});

test.describe("Yatay telefon",()=>{
  test.use({viewport:{width:800,height:360}});
  test("Bugün iki sütun: halkalar solda, yapılacaklar sağda",async({app,page})=>{
    await app.open({seed:state({medOn:true},{meds:[{id:1,n:"A",t:["00:00"],on:true}]})});
    const r=await page.evaluate(()=>{const a=document.querySelector(".rings").getBoundingClientRect(),b=document.querySelector(".todo").getBoundingClientRect();return {ax:a.left,bx:b.left,at:a.top,bt:b.top}});
    expect(r.bx).toBeGreaterThan(r.ax+300);
    expect(Math.abs(r.at-r.bt)).toBeLessThan(40);
  });
  test("Koç: son mesaj yazma alanının arkasında kalmaz, üst çubuk sabit",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Tamam, not aldım. ".repeat(6)});
    await app.open({seed:state({consent:true,consentV:2,consentAt:"2026-10-06",consentP:"gemini,groq,nvidia,openrouter"}),keys:{groq:"gsk_test"}});
    await app.tab("koc");
    for(let i=0;i<3;i++){await page.fill("#cmsg","Mesaj "+i);await page.click("#csend");await expect(page.locator(".cm").nth(i)).toBeVisible()}
    await page.waitForTimeout(300);
    const g=await page.evaluate(()=>{const m=[...document.querySelectorAll(".cm,.ub")].pop().getBoundingClientRect();return [m.bottom,document.querySelector("#composer").getBoundingClientRect().top]});
    expect(g[0]).toBeLessThanOrEqual(g[1]+1);
    expect(await page.evaluate(()=>getComputedStyle(document.querySelector(".cbar")).position)).toBe("sticky");
  });
});
