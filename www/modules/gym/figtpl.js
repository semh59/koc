"use strict";
/* Movement templates: each gives the stick-figure engine (figlib.js) its key poses. An exercise is a template plus small overrides (o).
   Side view: faces right, 0 down, +90 forward, 180 up. Front view (view:"f"): + points outward. fix: placement; scene: fixed prop. */
const FigTpl={
  /* ---- legs ---- */
  squat:{frames:[{t:2,a1:90,a2:90},{t:40,l1:92,l2:-12,a1:90,a2:90}]},
  hinge:{frames:[{t:0},{t:72,l1:14,l2:-4}],prop:{k:"bar",at:"wrist"}},
  lunge:{frames:[{t:2},{t:6,l1:86,l2:-4,m1:-22,m2:-100,m3:50}]},
  stepup:{frames:[{t:4,l1:24,l2:-8,m1:0,m2:0},{t:2,l1:2,l2:2,m1:60,m2:-30}],scene:"box",fix:{x:["ankle",0],y:["floor"]}},
  legext:{frames:[{t:-4,l1:90,l2:2},{t:-4,l1:90,l2:88}],fix:{x:["hip",0],y:["hip",26]},scene:"seat"},
  legcurl:{frames:[{t:0,a1:0,a2:0},{t:0,l1:0,l2:-110,a1:0,a2:0}]},
  legpress:{frames:[{t:-52,hh:0,l1:128,l2:30,foot:[22,52],a1:60,a2:60},{t:-52,hh:0,l1:100,l2:84,foot:[48,60],a1:60,a2:60}],fix:{x:["hip",-24],y:["hip",16]}},
  bridge:{frames:[{hh:2,t:-90,hd:-88,a1:90,a2:90,l1:132,l2:14},{hh:22,t:-52,hd:-80,a1:90,a2:90,l1:100,l2:14}],fix:{x:["hip",0],y:["hip",3]}},
  calf:{frames:[{t:0,l3:90},{t:0,l1:-4,l2:-4,l3:150}]},
  legspread:{view:"f",frames:[{t:0,l1:3,l2:3,m1:3,m2:3},{t:0,l1:40,l2:40,m1:40,m2:40}]},
  /* ---- push ---- */
  pushup:{frames:[{t:74,l1:-74,l2:-74,l3:20,a1:0,a2:0,hand:[21,0]},{t:84,l1:-84,l2:-84,l3:20,hand:[21,0]}],fix:{x:["toe",-58],y:["floor"]}},
  bench:{frames:[{hh:0,t:-90,hd:-88,a1:180,a2:180,l1:120,l2:10,foot:[34,0]},{hh:0,t:-90,hd:-88,a1:100,a2:150,l1:120,l2:10,foot:[34,0]}],fix:{x:["hip",0],y:["hip",26]},scene:"bench",prop:{k:"bar",at:"wrist"}},
  incline:{frames:[{hh:0,t:-52,hd:-52,a1:172,a2:176,l1:110,l2:6,foot:[26,0]},{hh:0,t:-52,hd:-52,a1:96,a2:146,l1:110,l2:6,foot:[26,0]}],fix:{x:["hip",0],y:["hip",24]},scene:"incbench",prop:{k:"db",at:"wrist"}},
  fly:{view:"f",frames:[{t:0,a1:84,a2:90,l1:2,l2:2},{t:0,a1:22,a2:26,l1:2,l2:2}],prop:{k:"db",at:"wrist"}},
  dips:{frames:[{t:6,a1:2,a2:2,l1:8,l2:-30},{t:16,a1:-66,a2:18,l1:20,l2:-50}],fix:{x:["wrist",0],y:["wrist",56]},scene:"dipbar"},
  ohp:{frames:[{t:0,a1:100,a2:190},{t:0,a1:178,a2:180}],prop:{k:"db",at:"wrist"}},
  latraise:{view:"f",frames:[{t:0,a1:6,a2:6,l1:2,l2:2},{t:0,a1:84,a2:86,l1:2,l2:2}],prop:{k:"db",at:"wrist"}},
  frontraise:{frames:[{t:0,a1:4,a2:4},{t:0,a1:92,a2:92}],prop:{k:"db",at:"wrist"}},
  skull:{frames:[{hh:0,t:-90,hd:-88,a1:180,a2:180,l1:120,l2:10,foot:[34,0]},{hh:0,t:-90,hd:-88,a1:180,a2:262,l1:120,l2:10,foot:[34,0]}],fix:{x:["hip",0],y:["hip",26]},scene:"bench",prop:{k:"bar",at:"wrist"}},
  /* ---- pull ---- */
  row:{frames:[{t:62,l1:20,l2:-6,a1:2,a2:2},{t:62,l1:20,l2:-6,a1:-62,a2:-6}],prop:{k:"db",at:"wrist"}},
  pullup:{frames:[{t:0,a1:180,a2:180,l1:6,l2:-10},{t:0,a1:12,a2:172,l1:6,l2:-30}],fix:{x:["wrist",0],y:["wrist",110]},scene:"pullbar"},
  pulldown:{frames:[{t:-4,a1:176,a2:176,l1:90,l2:2},{t:-12,a1:30,a2:40,l1:90,l2:2}],fix:{x:["hip",0],y:["hip",26]},scene:"seat"},
  seatedrow:{frames:[{t:4,a1:86,a2:88,l1:88,l2:88},{t:-8,a1:-30,a2:10,l1:88,l2:88}],fix:{x:["hip",0],y:["hip",4]}},
  backext:{frames:[{t:112,l1:-48,l2:-48,a1:100,a2:140},{t:48,l1:-48,l2:-48,a1:100,a2:140}],fix:{x:["hip",0],y:["hip",34]}},
  shrug:{frames:[{t:0,a1:2,a2:2,sy:0},{t:0,a1:2,a2:2,sy:5}],prop:{k:"db",at:"wrist"}},
  /* ---- arms ---- */
  curl:{frames:[{t:0,a1:0,a2:5},{t:0,a1:4,a2:140}],prop:{k:"db",at:"wrist"}},
  pushdown:{frames:[{t:8,a1:20,a2:150},{t:8,a1:6,a2:8}],scene:"cable",cableY:20},
  kickback:{frames:[{t:70,l1:16,l2:-4,a1:-70,a2:20},{t:70,l1:16,l2:-4,a1:-72,a2:-74}],prop:{k:"db",at:"wrist"}},
  overheadext:{frames:[{t:0,a1:178,a2:268},{t:0,a1:178,a2:180}],prop:{k:"db",at:"wrist"}},
  /* ---- abs ---- */
  crunch:{frames:[{t:-90,hd:-88,a1:100,a2:150,l1:120,l2:10,foot:[34,0]},{t:-62,hd:-50,a1:100,a2:150,l1:120,l2:10,foot:[34,0]}],fix:{x:["hip",0],y:["hip",2]}},
  situp:{frames:[{t:-90,hd:-88,a1:100,a2:150,l1:120,l2:10,foot:[34,0]},{t:-4,hd:-4,a1:90,a2:90,l1:120,l2:10,foot:[34,0]}],fix:{x:["hip",0],y:["hip",2]}},
  legraise:{frames:[{t:-90,hd:-88,a1:90,a2:90,l1:92,l2:92},{t:-90,hd:-88,a1:90,a2:90,l1:176,l2:176}],fix:{x:["hip",0],y:["hip",2]}},
  hangraise:{frames:[{t:0,a1:180,a2:180,l1:4,l2:2},{t:0,a1:178,a2:178,l1:90,l2:84}],fix:{x:["wrist",0],y:["wrist",112]},scene:"pullbar"},
  plank:{frames:[{t:74,l1:-74,l2:-74,l3:20,a1:0,a2:0,hand:[21,0]},{t:76,l1:-76,l2:-76,l3:20,a1:0,a2:0,hand:[21,0]}],fix:{x:["toe",-58],y:["floor"]}},
  climber:{frames:[{t:74,l1:-74,l2:-74,l3:20,m1:30,m2:-20,m3:60,hand:[21,0]},{t:74,l1:-74,l2:-74,l3:20,m1:-74,m2:-74,m3:20,hand:[21,0]}],fix:{x:["toe",-58],y:["floor"]}},
  sidebend:{view:"f",frames:[{t:-14,a1:2,a2:2,l1:2,l2:2},{t:14,a1:2,a2:2,l1:2,l2:2}],prop:{k:"db",at:"wrist"}},
  woodchop:{view:"f",frames:[{t:-10,a1:150,a2:154,l1:6,l2:6},{t:12,a1:20,a2:24,l1:6,l2:6}]},
  /* ---- cardio ---- */
  jack:{view:"f",frames:[{t:0,a1:8,a2:8,l1:4,l2:4},{t:0,a1:165,a2:170,l1:24,l2:24}]},
  run:{frames:[{t:12,l1:52,l2:12,m1:-34,m2:-96,m3:30,a1:-44,a2:30,b1:50,b2:120},{t:12,l1:-34,l2:-96,l3:30,m1:52,m2:12,m3:90,a1:50,a2:120,b1:-44,b2:30}],fix:{x:["hip",0],y:["floor"]}},
  highknees:{frames:[{t:4,l1:92,l2:4,m1:0,m2:0,a1:-30,a2:60,b1:50,b2:120},{t:4,l1:0,l2:0,m1:92,m2:4,m3:90,a1:50,a2:120,b1:-30,b2:60}],fix:{x:["hip",0],y:["floor"]}},
  walk:{frames:[{t:3,l1:24,l2:12,m1:-18,m2:-32,m3:60,a1:-20,a2:-10,b1:24,b2:32},{t:3,l1:-18,l2:-32,l3:60,m1:24,m2:12,m3:90,a1:24,a2:32,b1:-20,b2:-10}],fix:{x:["hip",0],y:["floor"]}},
  jumprope:{view:"f",frames:[{hh:0,t:0,a1:30,a2:70,l1:2,l2:2},{hh:6,t:0,a1:30,a2:70,l1:10,l2:2}],fix:{y:["hip",50]}},
  cycle:{frames:[{t:20,hd:20,a1:60,a2:80,l1:100,l2:30,m1:30,m2:-10,m3:30},{t:20,hd:20,a1:60,a2:80,l1:30,l2:-10,l3:30,m1:100,m2:30,m3:90}],fix:{x:["hip",0],y:["hip",50]},scene:"seat"},
  /* ---- stretching ---- */
  qstretch:{frames:[{t:0,a1:-30,a2:-10,m1:0,m2:0},{t:2,a1:-40,a2:-30,m1:4,m2:-132,m3:160}]},
  hamstretch:{frames:[{t:6,a1:92,a2:92,l1:90,l2:90,l3:90},{t:62,a1:90,a2:100,l1:90,l2:90,l3:90}],fix:{x:["hip",0],y:["hip",3]}},
  armstretch:{view:"f",frames:[{t:0,a1:40,a2:40,l1:3,l2:3},{t:0,a1:150,a2:150,l1:3,l2:3}]},
  neckstretch:{view:"f",frames:[{t:0,hd:0,a1:4,a2:4,l1:3,l2:3},{t:0,hd:34,a1:4,a2:4,l1:3,l2:3}]},
  twiststretch:{view:"f",frames:[{t:0,a1:84,a2:86,l1:3,l2:3},{t:12,a1:70,a2:76,l1:3,l2:3}]}
};
if(typeof module!=="undefined")module.exports=FigTpl;
