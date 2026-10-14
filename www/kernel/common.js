"use strict";
/* Small helpers several modules need: lower-case text without accents or Turkish dotless i, and a row of the day/summary lists. */
const foldTr=s=>String(s||"").toLowerCase().normalize("NFD").replace(/\p{M}/gu,"").replace(/ı/g,"i");
/* A day-screen row; with `act` (attributes of an existing edit action) the whole row is a button that opens that record's edit sheet. */
const hgRow=(ic,l,v,act)=>{const c=`<span>${Icons.svg(ic)} ${l}</span><b class="num">${v}</b>`;return act?`<button class="row" ${act}>${c}${Icons.svg("chev")}</button>`:`<div class="row">${c}</div>`};
if(typeof module!=="undefined")module.exports={foldTr};
