"use strict";
const {test,expect,state,CONSENT}=require("./fixtures");

const open=app=>app.open({seed:state(CONSENT),keys:{groq:"gsk_test"}});
/* Ids from the CATALOG ("KATALOG") lines of the request's system message; the model may use only these. */
const catalog=b=>{const t=b.messages.map(m=>m.content).join("\n"),i=t.indexOf("KATALOG");return t.slice(i).split("\n").slice(1).flatMap(l=>/^[^|:]+: /.test(l)?l.replace(/^[^|:]+: /,"").split(", "):[l]).map(l=>l.split("|")).filter(p=>p.length>=2&&/^[a-z0-9_]+$/.test(p[0]))};
const DAYS=["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];

test.describe("Coach menu card",()=>{
  /* Item count and portion are chosen so the day total stays near the target (2200); the same three meals every day. */
  const menuReply=b=>{
    const c=catalog(b).filter(p=>+p[2]>=50&&+p[2]<=400);let sum=0;const pick=[];
    for(const p of c){if(sum>=700)break;pick.push(p);sum+=+p[2]}
    const q=Math.round(2200/sum*4)/4,meals=["breakfast","lunch","dinner"].map((m,j)=>({m,i:pick.filter((_,k)=>k%3===j).map(p=>[p[0],q])}));
    return JSON.stringify({reply:"Menün hazır.",menu:{days:DAYS.map(n=>({n,meals}))}});
  };
  test("a menu request yields a card; Add to today, Make template and Shopping list work",async({app,page,fake})=>{
    fake.st.reply=menuReply;
    await open(app);await app.tab("coach");
    await page.click('[data-c="menu"]');
    await page.fill("#mnote","fıstık alerjisi");
    await page.click('[data-c="menuask"]');
    const card=page.locator("[data-mid] .lcard").filter({hasText:"Haftalık menü"});
    await expect(card).toBeVisible();
    await expect(card.locator(".lhead b")).toHaveText(["Haftalık menü",...DAYS]);
    // Only today's day (Tuesday) starts open
    await expect(card.locator("details.mday[open] summary b")).toHaveText(["Salı"]);
    expect(fake.chats().length).toBe(1);
    expect(JSON.stringify(fake.chats()[0].body)).toContain("fıstık alerjisi");
    const mc=(await app.state()).chat.find(m=>m.card&&m.card.kind==="menu").card;
    expect(mc.days.every(d=>!d.off)).toBe(true);
    const items=mc.days[0].meals.flatMap(b=>b.items.map(i=>({text:i.n+(i.q===1?"":" × "+String(i.q).replace(".",",")),v:i.k,meal:b.m})));

    // Add to today: every item of the chosen day becomes a food entry for today
    await card.locator("details.mday summary").first().click();
    await card.locator('[data-c^="menuday:"]').first().click();
    await page.click('#sheet [data-c^="menuadd:"]');
    await expect(app.toast).toContainText(`Pazartesi: ${items.length} yemek bugüne eklendi`);
    const ys=(await app.state()).entries.filter(e=>e.type==="food");
    expect(ys.map(e=>[e.text,e.v,e.meal]).sort()).toEqual(items.map(i=>[i.text,i.v,i.meal]).sort());
    expect(ys.every(e=>e.day==="2026-10-06")).toBe(true);

    // Make template
    await card.locator('[data-c^="menuday:"]').nth(1).click();
    await page.click('#sheet [data-c^="menutpl:"]');
    await expect(app.toast).toContainText("Şablon kaydedildi");
    const tp=(await app.state()).mealTpl;
    expect(tp.map(t=>t.n)).toEqual(["Menü: Salı"]);expect(tp[0].items.length).toBe(items.length);

    // Shopping list: identical foods are summed, ticking persists, Share yields a file
    await card.locator('[data-c^="shop:"]').click();
    const rows=page.locator("#sheet .prow");
    // Meals are split into products and grouped by category
    const shop=await page.evaluate(()=>shopOf(S.chat.find(m=>m.card&&m.card.kind==="menu").card).map(x=>x.c));
    await expect(rows).toHaveCount(shop.length);
    await expect(page.locator("#sheet .grp")).toHaveCount(new Set(shop).size);
    await expect(rows.first()).toHaveAttribute("aria-pressed","false");
    await rows.first().click();
    await expect(rows.first()).toHaveAttribute("aria-pressed","true");
    expect((await app.state()).chat.find(m=>m.card&&m.card.kind==="menu").card.chk.length).toBe(1);
    const dl=page.waitForEvent("download");
    await page.click('#sheet [data-c^="shopshare:"]');
    expect((await dl).suggestedFilename()).toBe("neowell-alisveris-2026-10-06.txt");
  });
  test("a day far off the calorie target asks for confirmation before Add to today; declining adds nothing",async({app,page,fake})=>{
    fake.st.reply=b=>{const p=catalog(b).filter(x=>+x[2]>=50)[0];return JSON.stringify({reply:"x",menu:{days:[{n:"Pazartesi",meals:["breakfast","lunch","dinner"].map(m=>({m,i:[[p[0],0.25]]}))}]}})};
    await open(app);await app.tab("coach");
    await page.click('[data-c="menu"]');await page.click('[data-c="menuask"]');
    const card=page.locator("[data-mid] .lcard").filter({hasText:"Haftalık menü"});
    await expect(card).toContainText("Hedefin %15'inden fazla sapıyor");
    app.onDialog=d=>d.dismiss();
    await card.locator('[data-c^="menuday:"]').click();
    await page.click('#sheet [data-c^="menuadd:"]');
    await expect.poll(()=>app.dialogs.length).toBe(1);
    expect(app.dialogs[0]).toContain("%15'inden fazla sapıyor");
    expect((await app.state()).entries.filter(e=>e.type==="food")).toEqual([]);
  });
});

test.describe("Coach program card",()=>{
  test("a program request yields a card; saving adds one template per day to Gym",async({app,page,fake})=>{
    fake.st.reply=b=>{
      const ids=catalog(b).map(p=>p[0]);
      /* The first day falls to a single exercise because of an invalid id (dropped); 5 valid days are capped at the requested 4. */
      const day=(n,i)=>({n,ex:[ids[i],ids[i+1]]});
      return JSON.stringify({reply:"Programın hazır.",program:{name:"Test programı",days:[{n:"X",ex:[ids[0],"yok_boyle_id"]},day("A",0),day("B",2),day("C",4),day("D",6),day("E",8)]}});
    };
    await open(app);await app.tab("gym");
    await page.click('[data-c="prog"]');
    await page.click('[data-c="po:d:4"]');
    await expect(page.locator('[data-c="po:d:4"]')).toHaveAttribute("aria-pressed","true");
    await page.click('[data-c="po:q:Ev tipi"]');
    await page.click('[data-c="progask"]');
    const card=page.locator("[data-mid] .lcard").filter({hasText:"Test programı"});
    await expect(card).toBeVisible();
    expect(JSON.stringify(fake.chats()[0].body)).toContain("Haftada 4 gün, seans 45 dakika, ekipman Ev tipi");
    await expect(card.locator(".lrow b")).toHaveText(["A","B","C","D"]);
    expect((await app.state()).templates).toEqual([]);
    await card.locator('[data-c^="progadd:"]').click();
    await expect(app.toast).toHaveText("4 şablon eklendi");
    await expect(card).toContainText("4 şablon Salon'a eklendi");
    await expect(card.locator('[data-c^="progadd:"]')).toHaveCount(0);
    const t=(await app.state()).templates;
    expect(t.map(x=>x.name)).toEqual(["A","B","C","D"].map(n=>`Test programı – ${n}`));
    expect(t.every(x=>x.ex.length===2)).toBe(true);
    await app.tab("gym");
    await expect(page.locator(".trow")).toHaveCount(4);
  });
});
