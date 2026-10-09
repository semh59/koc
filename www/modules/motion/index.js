"use strict";
Data.privacy.push(["Adım ve hareket",()=>S.moves.length+Log.count("steps"),()=>{S.moves=[];S.walk=null;S.settings.stepsFrom=keyOff(1);Log.drop("steps")},3]);
