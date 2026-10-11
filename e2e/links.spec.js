"use strict";
const {test,expect,state,day}=require("./fixtures");

const seed=(n,gap=2)=>{const sleep=[],mood=[];for(let i=1;i<=n;i++){sleep.push({day:day(-i),min:i%2?480:360});mood.push({day:day(-i),v:gap===0?(i%4<2?2:4):Math.max(1,Math.min(5,Math.round(3+(i%2?gap/2:-gap/2)+(i%5===0?(i%2?-1:1):0))))})}return state({},{sleep,mood})};

test.describe("Trend > Connections",()=>{
  test("enough paired data shows the card in cautious wording; it stays out of the Coach context",async({app,page})=>{
    await app.open({seed:seed(20)});await app.tab("trend");
    const card=page.locator(".bgl");
    await expect(card).toContainText("7 sa ve üstü uyuduğun gecelerin ertesi günü ruh halin ortalama 3,8");
    await expect(card).toContainText("(belirgin ipucu), 20 günlük kayıttan");
    await expect(page.locator("#view")).toContainText("neden-sonuç göstermez, tesadüf de olabilir");
    await expect(page.locator("#view")).toContainText("Rehber'e gönderilmez");
    expect(await page.locator("#view").innerText()).not.toMatch(/depresyon|bozukluk|skor|teşhis|tedavi/i);
  });
  test("no difference shows one quiet line instead of a sentence",async({app,page})=>{
    await app.open({seed:seed(20,0)});await app.tab("trend");
    await expect(page.locator(".bgl")).toContainText("Henüz belirgin bir bağ görünmüyor.");
    await expect(page.locator(".bgl")).not.toContainText("ruh halin");
  });
  test("fewer than 14 paired days show no card",async({app,page})=>{
    await app.open({seed:seed(10)});await app.tab("trend");
    await expect(page.locator(".bgl")).toHaveCount(0);
    await expect(page.locator("#view")).not.toContainText("Henüz belirgin bir bağ");
    await expect(page.locator("#view")).toContainText("Kendi deneyin");
  });
});
