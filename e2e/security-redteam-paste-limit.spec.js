"use strict";
const {test,expect,state}=require("./fixtures");

test("paste restore rejects a backup text above 20 MB before decrypt",async({app,page})=>{
  await app.open({seed:state(),dialogs:false});
  const oversized=JSON.stringify({neowell:1,enc:"aes-gcm-pbkdf2",iter:600000,salt:"AAAAAAAAAAAAAAAAAAAAAA==",iv:"AAAAAAAAAAAAAAAA",data:"A".repeat(20_000_000)});
  expect(Buffer.byteLength(oversized)).toBeGreaterThan(20_000_000);
  await app.go("settings-data");await page.click('[data-obr="open"]');
  await page.fill("#obt",oversized);await page.fill("#obpw","Probe-Large-2026");await page.click('[data-obr="go"]');
  await expect(app.toast).toContainText("20 MB'tan büyük");
});
