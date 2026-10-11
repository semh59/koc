"use strict";
/* Balance and functional strength: six hand-written exercises (no photos; the stick figure shows them) added to the library after exlib.js, which is generated.
   General movement practice, not treatment: no text here claims a health effect. */
const EXBAL=[
  {id:"onefoot",n:"Tek ayak üstünde duruş",tp:"onefoot",k:"t"},
  {id:"heeltoe",n:"Topuk-parmak yürüyüşü",tp:"balwalk",k:"t"},
  {id:"chairstand",n:"Sandalyeden kalkma (süreli)",tp:"chairstand",k:"t"},
  {id:"sidestep",n:"Yan adım",tp:"sidestep",k:"t"},
  {id:"tandem",n:"Tandem duruş (ayaklar art arda)",tp:"tandem",k:"t"},
  {id:"armswalk",n:"Kollar yanda yürüyüş",tp:"balwalk2",k:"t"}
].map(e=>({id:e.id,n:e.n,r:"Tüm vücut",g:"Bacak",k:e.k,q:"Ağırlıksız",l:"Başlangıç",c:"d",inc:1,tp:e.tp,pr:"-"}));
/* Two walking paces for the interval-walking flow (guidelib.js). */
const EXWALK=[{id:"fastwalk",n:"Hızlı yürüyüş"},{id:"slowwalk",n:"Yavaş yürüyüş"}].map(e=>({...e,r:"Tüm vücut",g:"Bacak",k:"t",q:"Ağırlıksız",l:"Başlangıç",c:"k",inc:1,tp:"walk",pr:"-"}));
(typeof EXDB!=="undefined"?EXDB:require("./exlib.js")).push(...EXBAL,...EXWALK);
if(typeof module!=="undefined")module.exports=EXBAL;
