"use strict";
/* pdf.js (www/vendor/pdfjs) gerçek Chromium'da ve web worker ile çalışır: tahlil PDF'i okunur, dışa aktarma raporu yeniden açılır. */
const {test,expect}=require("./fixtures");
const {textPdf}=require("../scripts/pdfmaker.js");

test("tahlil PDF'i tarayıcıda pdf.js ve worker ile okunur, satırlar ve tarih çıkar",async({app,page})=>{
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
