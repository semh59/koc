"use strict";
const {test,expect,state}=require("./fixtures");

const LOG=JSON.stringify({reply:"Not aldım.",log:[{type:"yemek",text:"2 yumurta",kcal:150,protein:12,carbs:1,fat:10,meal:"kah"}]});
const open=app=>app.open({seed:state({consent:true,consentV:2,consentAt:"2026-10-06"}),keys:{groq:"gsk_test"}});
const send=async(app,page,t)=>{await app.tab("koc");await page.fill("#cmsg",t);await page.click("#csend")};

test.describe("Koç kayıt kartı",()=>{
  test("model düz metinle cevap verirse bir kez daha sorulur ve kart çıkar",async({app,page,fake})=>{
    let n=0;fake.st.reply=()=>++n===1?"Afiyet olsun, güzel bir kahvaltı.":LOG;
    await open(app);await send(app,page,"Kahvaltıda 2 yumurta yedim");
    await expect(page.locator(".lcard")).toContainText("Öğüne ekle");
    expect(n).toBe(2);
  });
  test("model kayıt listesini boş bırakırsa bir kez daha sorulur",async({app,page,fake})=>{
    let n=0;fake.st.reply=()=>++n===1?JSON.stringify({reply:"Güzel.",log:[]}):LOG;
    await open(app);await send(app,page,"Kahvaltıda 2 yumurta yedim");
    await expect(page.locator(".lcard")).toContainText("Öğüne ekle");
    expect(n).toBe(2);
  });
  test("sohbet geçmişi modele JSON biçiminde gider, model biçimi bozmaz",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Merhaba."});
    await open(app);await send(app,page,"Selam");
    await expect(page.locator("#view")).toContainText("Merhaba.");
    await page.fill("#cmsg","Nasılsın");await page.click("#csend");
    await expect.poll(()=>fake.chats().length).toBe(2);
    const m=fake.chats()[1].body.messages.filter(x=>x.role==="assistant");
    expect(JSON.parse(m[0].content).reply).toBe("Merhaba.");
  });
  test("kayıt bildirmeyen mesajda gereksiz ikinci istek gitmez",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Su içmeyi unutma.",log:[]});
    await open(app);await send(app,page,"Bugün hava nasıl olur");
    await expect(page.locator("#view")).toContainText("Su içmeyi unutma.");
    expect(fake.chats().length).toBe(1);
  });
});
