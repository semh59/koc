"use strict";
const Motion={walk:()=>S.walk,moves:()=>S.moves};
Data.privacy.push(["Adım ve hareket",()=>S.moves.length+Log.count("steps"),()=>chain(nativeWipe(["Motion"]),ok=>{if(!ok)return toast(NATIVE_FAIL),false;S.moves=[];S.walk=null;S.settings.stepsFrom=keyOff(1);Log.drop("steps")}),3]);
