"use strict";
/* Small helpers several modules need: lower-case text without accents or Turkish dotless i, and a row of the day/summary lists. */
const foldTr=s=>String(s||"").toLowerCase().normalize("NFD").replace(/\p{M}/gu,"").replace(/ı/g,"i");
const hgRow=(ic,l,v)=>`<div class="row"><span>${Icons.svg(ic)} ${l}</span><b class="num">${v}</b></div>`;
if(typeof module!=="undefined")module.exports={foldTr};
