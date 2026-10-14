/* Barcode search failures: timeout, offline and plain failure all end in the own-food form with "Elle yaz" and "Sonra dene". */
const {ok,finish}=require("./ok");
const {boot,flush}=require("./html");
(async()=>{
  const w=await boot(w=>{w.localStorage.setItem("nw_state",JSON.stringify({entries:[],settings:{obDone:true,noticeOk:true,age:30}}))});
  const ev=s=>w.eval(s),q=s=>w.document.querySelector(s);
  const run=async()=>{ev("sheetFood()");await ev("barcodeFind('8690526010113')");await flush()};
  w.fetch=async()=>{throw new w.DOMException("timeout","TimeoutError")};
  await run();
  ok("timeout: says it did not answer in 10 seconds and offers both buttons",q("#fown .banner").textContent.includes("10 saniyede cevap vermedi")&&!!q('[data-bc="manual"]')&&!!q('[data-bc="later"]'));
  q('[data-bc="manual"]').click();
  ok("Elle yaz puts the cursor in the food name field",w.document.activeElement.id==="ft");
  q('[data-bc="later"]').click();
  ok("Sonra dene closes the sheet",!q("#sheet").classList.contains("on"));
  w.fetch=async()=>{throw new TypeError("net")};
  await run();
  ok("plain failure keeps the no-internet text and the buttons",q("#fown .banner").textContent.includes("İnternete ulaşılamadı, barkod aranamadı")&&!!q('[data-bc="later"]'));
  let called=0;w.fetch=async()=>{called++;return {ok:true,json:async()=>({status:0})}};
  Object.defineProperty(w.navigator,"onLine",{value:false,configurable:true});
  await run();
  ok("offline: no request is made and the message says the phone is offline",called===0&&q("#fown .banner").textContent.includes("çevrimdışı görünüyor")&&!!q('[data-bc="manual"]'));
  finish();
})();
