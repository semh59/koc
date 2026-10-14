"use strict";
Data.privacy.push(["Döngü kayıtları",()=>S.cycle.length,()=>{S.cycle=[]},14]);
const Cycle={report:()=>S.settings.cycleOn&&S.cycle.length?CycleLib.report(S.cycle):null};
