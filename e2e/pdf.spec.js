"use strict";
/* pdf.js (www/vendor/pdfjs) runs in real Chromium with a web worker: a lab PDF is read, and an exported report reopens. */
const {test,expect}=require("./fixtures");
const {textPdf}=require("../scripts/pdfmaker.js");

test("a lab PDF is read in the browser by pdf.js and its worker; rows and date come out",async({app,page})=>{
  await app.open({});
  const data=Array.from(textPdf([
    [["Numune Alim Tarihi: 12.09.2026",40]],
    [["Test",40],["Sonuc",200],["Birim",260],["Referans",340]],
    [["Glukoz (Aclik)",40],["98",200],["mg/dL",260],["70 - 100",340]],
    [["HbA1c",40],["5,4",200],["%",260],["4,0-5,6",340]]
  ]));
  const r=await page.evaluate(async d=>{
    const lib=await labLoadPdf(),ex=await LabLib.extract(lib,new Uint8Array(d));
    const p=LabLib.parseLines(ex.lines,"2026-10-01");
    return {date:p.date,keys:p.rows.map(x=>x.k).join(),lines:ex.lines.length,workerOk:!!lib.GlobalWorkerOptions.workerSrc};
  },data);
  expect(r.workerOk).toBe(true);
  expect(r.date).toBe("2026-09-12");
  expect(r.keys).toBe("glukoz,hba1c");
});

test("doctor report: the medication list is one extra page, the cycle lines alone are one extra page",async({app,page})=>{
  const {state}=require("./fixtures");
  const meds=Array.from({length:3},(_,i)=>({id:i+1,n:"İlaç "+(i+1),t:["08:00"],on:true}));
  await app.open({seed:state({medOn:true,cycleOn:true},{meds,cycle:[{id:1,s:"2026-09-01"}]})});
  const pages=async(cycle)=>{
    await page.evaluate(()=>{docSt={days:7,seal:false,cycle:false,q:["","","","",""]};docSheet()});
    if(cycle)await app.sheet.locator('[data-doc="cycle"]').click();
    const dl=page.waitForEvent("download");
    await app.sheet.getByRole("button",{name:"PDF hazırla"}).click();
    const buf=await require("fs").promises.readFile(await (await dl).path());
    expect(buf.subarray(0,4).toString()).toBe("%PDF");
    return (buf.toString("latin1").match(/\/Type\s*\/Page\b/g)||[]).length;
  };
  expect(await pages(false)).toBe(2);
  await page.evaluate(()=>{S.settings.medOn=false});
  expect(await pages(true)).toBe(2);
});
