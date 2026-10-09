"use strict";
/* Offline ready-made programs, using exlib.js ids only. Row: [id, sets, "reps" or "low-high" reps or "45s" (seconds)].
   General information, not a personal training program. */
const PrgLib=(()=>{
  const PROGRAMS=[
    {id:"home3",n:"Evde tüm vücut, ekipmansız",q:"Ağırlıksız",lv:"Başlangıç",d:[3,3],about:"Alet gerekmez. Haftada 3 gün, arada en az bir gün dinlen.",days:[
      {n:"Gün A",ex:[["bwsquat",3,"10-15"],["pushup",3,"8-12"],["invrow",3,"8-12"],["bridge",3,"12-15"],["deadbug",3,"10-12"],["plank",3,"30s"]]},
      {n:"Gün B",ex:[["walklunge",3,"10-12"],["pushupinc",3,"8-12"],["backextfloor",3,"12-15"],["benchdips",3,"8-12"],["kickbackglute",3,"12-15"],["revcrunch",3,"12-15"]]},
      {n:"Gün C",ex:[["bwsquat",4,"12-15"],["pushupwide",3,"8-12"],["invrow",3,"10-12"],["bridge",3,"15-20"],["scappull",3,"12-15"],["flutter",3,"15-20"],["plank",3,"40s"]]}]},
    {id:"home4",n:"Ekipmansız üst/alt",q:"Ağırlıksız",lv:"Orta",d:[4,4],about:"Haftada 4 gün: üst, alt, üst, alt.",days:[
      {n:"Üst A",ex:[["pushup",4,"8-12"],["invrow",4,"8-12"],["pushupinc",3,"8-12"],["scappull",3,"12-15"],["benchdips",3,"10-12"],["plank",3,"40s"]]},
      {n:"Alt A",ex:[["bwsquat",4,"12-15"],["walklunge",3,"10-12"],["bridge",4,"12-15"],["kickbackglute",3,"12-15"],["crunch",3,"12-15"],["deadbug",3,"10-12"]]},
      {n:"Üst B",ex:[["pushupfeet",4,"8-12"],["invrow",3,"10-12"],["pushupwide",3,"8-12"],["dipstri",3,"8-12"],["scappull",3,"12-15"],["backextfloor",3,"12-15"],["revcrunch",3,"12-15"]]},
      {n:"Alt B",ex:[["bwsquat",3,"15-20"],["jumpsquat",3,"8-10"],["bridge1",3,"8-10"],["latbound",3,"10-12"],["flutter",3,"15-20"],["plank",3,"45s"]]}]},
    {id:"gym3",n:"Salon tüm vücut",q:"Salon",lv:"Başlangıç",d:[3,3],about:"Bileşik hareketlerle haftada 3 gün: ağır günlerde 5×5, diğerlerinde 3×8.",days:[
      {n:"Gün A",ex:[["squat",5,"5"],["bench",5,"5"],["row",5,"5"],["bbohp",3,"8-10"],["tri",3,"10-12"],["crunch",3,"12-15"]]},
      {n:"Gün B",ex:[["rdl",3,"8"],["incbench",3,"8"],["pulldown",3,"8-10"],["legpress",3,"10-12"],["lat",3,"12-15"],["plank",3,"40s"]]},
      {n:"Gün C",ex:[["squat",3,"8"],["bench",3,"8"],["seatedrow",3,"8-10"],["bbohp",3,"8"],["legcurl",3,"10-12"],["cablecrunch",3,"12-15"]]}]},
    {id:"gym4",n:"Salon üst/alt",q:"Salon",lv:"Orta",d:[4,4],about:"Haftada 4 gün: üst, alt, üst, alt.",days:[
      {n:"Üst A",ex:[["bench",4,"6-8"],["row",4,"6-8"],["bbohp",3,"8-10"],["pulldown",3,"8-10"],["tri",3,"10-12"],["bbcurl",3,"10-12"]]},
      {n:"Alt A",ex:[["squat",4,"6-8"],["rdl",3,"8-10"],["legpress",3,"10-12"],["legcurl",3,"10-12"],["calf",4,"12-15"],["cablecrunch",3,"12-15"]]},
      {n:"Üst B",ex:[["incbench",4,"8-10"],["seatedrow",4,"8-10"],["incdb",3,"10-12"],["lat",3,"12-15"],["facepull",3,"12-15"],["ropepushdown",3,"10-12"],["cablecurl",3,"10-12"]]},
      {n:"Alt B",ex:[["hacksquat",4,"8-10"],["hipthrust",3,"8-10"],["legext",3,"12-15"],["seatedcurl",3,"10-12"],["seatedcalf",4,"12-15"],["plank",3,"45s"]]}]},
    {id:"ppl",n:"Salon itiş-çekiş-bacak",q:"Salon",lv:"Orta",d:[3,6],about:"3 günde her bölge bir kez, 6 günde iki kez. Gün sayısını seç, ilk günler alınır.",days:[
      {n:"İtiş A",ex:[["bench",4,"6-8"],["bbohp",3,"8-10"],["incdb",3,"10-12"],["lat",4,"12-15"],["ropepushdown",3,"10-12"]]},
      {n:"Çekiş A",ex:[["row",4,"6-8"],["pulldown",4,"8-10"],["facepull",3,"12-15"],["bbcurl",3,"8-12"],["cablehammer",3,"10-12"]]},
      {n:"Bacak A",ex:[["squat",4,"6-8"],["rdl",3,"8-10"],["legpress",3,"10-12"],["legcurl",3,"10-12"],["calf",4,"12-15"],["cablecrunch",3,"12-15"]]},
      {n:"İtiş B",ex:[["incbench",4,"8-10"],["cableohp",3,"10-12"],["crossover",3,"12-15"],["cablelat",3,"12-15"],["vbarpushdown",3,"10-12"]]},
      {n:"Çekiş B",ex:[["closepulldown",4,"8-10"],["seatedrow",4,"8-10"],["straightarm",3,"12-15"],["cablerear",3,"12-15"],["cablecurl",3,"10-12"]]},
      {n:"Bacak B",ex:[["hacksquat",4,"8-10"],["hipthrust",3,"8-10"],["legext",3,"12-15"],["seatedcurl",3,"10-12"],["seatedcalf",4,"12-15"],["plank",3,"45s"]]}]}
  ];
  /* Template target from a row (the gym.js tg shape). */
  const tg=([,sets,r])=>{
    if(r.endsWith("s"))return {sets,sec:parseInt(r)};
    const [lo,hi]=r.split("-").map(Number);return hi?{sets,reps:lo,hi}:{sets,reps:lo};
  };
  const days=(p,d)=>p.days.slice(0,Math.min(p.days.length,Math.max(p.d[0],Math.min(p.d[1],d||p.d[0]))));
  const toTpl=day=>({n:day.n,ex:day.ex.map(r=>r[0]),tg:Object.fromEntries(day.ex.map(r=>[r[0],tg(r)]))});
  return {PROGRAMS,tg,days,toTpl};
})();
if(typeof module!=="undefined")module.exports=PrgLib;
