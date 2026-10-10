const {ok,finish}=require("./ok");
const M=require("../www/modules/motion/motionlib.js");
const now=new Date(2026,8,10,12,0,0).getTime(),t0=new Date(2026,8,10,7,40,0).getTime();
const it=(o)=>({t0,t1:t0+22*60000,k:"w",steps:2400,km:2.1,kmh:5.7,kcal:110,gps:true,...o});

const f=M.fromNative(it({}),now);
ok("record: fields are converted (day, time, duration, type, distance)",f&&f.day==="2026-09-10"&&f.t0==="07:40"&&f.min===22&&f.k==="w"&&f.steps===2400&&f.km===2.1&&f.kmh===5.7&&f.kcal===110&&f.gps===true,f);
ok("record: calories are null without a weight (native -1)",M.fromNative(it({kcal:-1}),now).kcal===null);
ok("record: gps is false when missing",M.fromNative(it({gps:undefined}),now).gps===false);
ok("record: malformed input is dropped",[null,{},it({k:"x"}),it({steps:100}),it({steps:70000}),it({km:-1}),it({kmh:30}),it({t1:t0}),it({t1:t0+5*3600*1000}),it({t0:now+10*60000,t1:now+30*60000}),it({steps:"2400"}),it({km:NaN})].every(x=>M.fromNative(x,now)===null));
ok("record: run type is kept",M.fromNative(it({k:"r"}),now).k==="r");

const moves=[];
ok("ingest: two different records are added",M.ingest(moves,[it({}),it({t0:t0+3600000,t1:t0+3600000+10*60000,k:"r",steps:1700})],now)===2&&moves.length===2);
ok("ingest: the same day-time-type is not added twice",M.ingest(moves,[it({})],now)===0&&moves.length===2);
ok("ingest: a different type at the same time is added",M.ingest(moves,[it({k:"r"})],now)===1&&moves.length===3);
ok("ingest: invalid records are not counted",M.ingest(moves,[null,it({steps:5})],now)===0);
ok("ingest: sorted by day and time",moves.every((m,i)=>i===0||moves[i-1].day+moves[i-1].t0<=m.day+m.t0));

const c=M.clean([...moves,{day:"2026-9-1",t0:"07:00",min:5,k:"w",steps:500,km:1,kmh:3},{day:"2026-09-01",t0:"25:00",min:5,k:"w",steps:500,km:1,kmh:3},{...moves[0]}]);
ok("clean: bad day/time dropped, duplicates removed",c.length===3,c);
ok("clean: non-array input gives empty",M.clean(null).length===0&&M.clean({}).length===0&&M.clean("x").length===0);
const big=Array.from({length:500},(_,i)=>({day:"2026-01-"+String(1+i%28).padStart(2,"0"),t0:String(Math.floor(i/28)%24).padStart(2,"0")+":"+String(i%60).padStart(2,"0"),min:10,k:i%2?"w":"r",steps:1000,km:1,kmh:5}));
ok("clean: more than 400 movements are not truncated",M.clean(big).length>400);
const tt=M.totals([{min:20,km:2,steps:2000,kcal:100},{min:10,km:1,steps:1000,kcal:null}]);
ok("totals: a record without calories adds nothing to calories",tt.min===30&&tt.km===3&&tt.steps===3000&&tt.kcal===100&&tt.kcalN===1);
const src=require("fs").readFileSync(require("path").join(__dirname,"../www/modules/motion/motionlib.js"),"utf8");
ok("no route or coordinate fields",!/lat|lon|coord|route/i.test(src.replace(/\/\*[\s\S]*?\*\//g,"")));
ok("movement day: 2026-02-31 is rejected",M.clean([{day:"2026-02-31",t0:"08:00",min:20,k:"w",steps:2400,km:2,kmh:5,kcal:null,gps:false}]).length===0&&M.clean([{day:"2026-02-28",t0:"08:00",min:20,k:"w",steps:2400,km:2,kmh:5,kcal:null,gps:false}]).length===1);
finish();
