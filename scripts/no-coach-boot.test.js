"use strict";
const {ok,finish}=require("./ok");
const {boot,flush}=require("./html");
const errors=[];
boot(w=>w.addEventListener("error",e=>errors.push(e.message))).then(async w=>{
  await flush();
  const text=w.document.querySelector("#view").textContent;
  ok("no-Coach release boots without runtime errors",errors.length===0,errors);
  ok("boot lands on a real screen",w.document.querySelector("#view").innerHTML.length>100&&text.length>20);
  ok("Coach tab and composer are absent",!w.document.querySelector('[data-tab="coach"]')&&!w.document.querySelector("#composer")&&!w.document.querySelector("#cmsg"));
  const lex=t=>w.eval(`typeof ${t}`);
  ok("local food and OCR modules remain loaded",lex("MenuLocal")==="object"&&lex("ocrBtn")==="function"&&lex("LABEL_FIELDS")==="object");
  ok("provider/network globals are absent",typeof w.callProvider==="undefined"&&typeof w.fetchModels==="undefined"&&typeof w.viewCoach==="undefined");
  finish();
}).catch(e=>{console.error(e);process.exit(1)});
