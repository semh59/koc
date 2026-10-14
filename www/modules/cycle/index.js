"use strict";
Data.privacy.push(["Döngü kayıtları",()=>S.cycle.length+S.cycleSym.length,()=>{S.cycle=[];S.cycleSym=[]},14]);
const Cycle={report:()=>S.settings.cycleOn&&S.cycle.length?CycleLib.report(S.cycle):null};
