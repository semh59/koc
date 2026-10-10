"use strict";
const {test,expect,state,day}=require("./fixtures");

const seed=n=>{const sleep=[],mood=[];for(let i=1;i<=n;i++){sleep.push({day:day(-i),min:i%2?480:360});mood.push({day:day(-i),v:i%2?4:2})}return state({},{sleep,mood})};

test.describe("Trend > Bağlantılar",()=>{
  test("yeterli çift veride kart, ihtiyatlı dil; Koç bağlamına girmez",async({app,page})=>{
    await app.open({seed:seed(20)});await app.tab("trend");
    const card=page.locator(".bgl");
    await expect(card).toContainText("7 sa ve üstü uyuduğun gecelerin ertesi günü ruh halin ortalama 4,0");
    await expect(page.locator("#view")).toContainText("neden-sonuç değildir");
    await expect(page.locator("#view")).toContainText("Koç'a gönderilmez");
    expect(await page.locator("#view").innerText()).not.toMatch(/depresyon|bozukluk|skor|teşhis|tedavi/i);
  });
  test("14 günden az çift veride kart yok",async({app,page})=>{
    await app.open({seed:seed(10)});await app.tab("trend");
    await expect(page.locator(".bgl")).toHaveCount(0);
    await expect(page.locator("#view")).not.toContainText("Bağlantılar");
  });
});
