const {ok,finish}=require("./ok");
const F=require("../www/modules/gym/figlib.js"),T=require("../www/modules/gym/figtpl.js"),X=require("../www/modules/gym/exlib.js");
const B=F.B,d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),near=(a,b,t)=>Math.abs(a-b)<=t;
const fs=require("fs"),path=require("path");
const names=Object.keys(T);
const issues={nan:[],bone:[],knee:[],elbow:[],box:[],ground:[]};
for(const k of names){
  const def=T[k],ps=F.sample(def,24);
  for(const p of ps){
    const fr=F.frame(def,p),J=fr.J,L=J.limbs,q=F.full(p);
    const pts=[J.hip,J.neck,J.head].concat(L.nA,L.fA,L.nL,L.fL);
    if(pts.some(v=>!isFinite(v[0])||!isFinite(v[1])))issues.nan.push(k);
    for(const a of [L.nA,L.fA]){if(!near(d(a[0],a[1]),B.ua,0.05)||!near(d(a[1],a[2]),B.fa,0.05))issues.bone.push(k)}
    for(const l of [L.nL,L.fL]){if(!near(d(l[0],l[1]),B.th,0.05)||!near(d(l[1],l[2]),B.sh,0.05))issues.bone.push(k)}
    if(!q.foot){if(q.l1-q.l2<-10||q.m1-q.m2<-10)issues.knee.push(k)}
    if(!q.hand){if(q.a2-q.a1<-10||q.b2-q.b1<-10)issues.elbow.push(k)}
    for(const v of pts)if(v[0]<3||v[0]>F.W-3||v[1]<3||v[1]>F.H-3)issues.box.push(k+":"+v.map(Math.round));
    const fy=def.fix&&def.fix.y&&def.fix.y[0]||"floor";
    if(fy==="floor"){const low=Math.max(...pts.map(v=>v[1]));if(!near(low,F.FLOOR,0.5)&&!near(J.head[1]+B.head,F.FLOOR,0.5))issues.ground.push(k)}
  }
  const a=ps[0],z=ps[ps.length-1];
  if(!F.KEYS.every(x=>near(a[x],z[x],1e-6)))issues.nan.push(k+":loop");
}
const u=a=>[...new Set(a)];
ok("templates: at least 40",names.length>=40,names.length);
ok("numbers are valid in every frame and the loop closes",u(issues.nan).length===0,u(issues.nan));
ok("bone lengths are constant in every frame (including inverse kinematics)",u(issues.bone).length===0,u(issues.bone));
ok("knees do not bend backwards (free legs)",u(issues.knee).length===0,u(issues.knee));
ok("elbows do not bend backwards (free arms)",u(issues.elbow).length===0,u(issues.elbow));
ok("the figure stays inside the view box",u(issues.box.map(s=>s.split(":")[0])).length===0,u(issues.box).slice(0,12));
ok("for floor-standing templates the lowest point is on the floor line",u(issues.ground).length===0,u(issues.ground));

ok("library: at least 200 exercises, unique ids",X.length>=200&&new Set(X.map(e=>e.id)).size===X.length,X.length);
ok("library: every row has a template",X.every(e=>T[e.tp]),X.filter(e=>!T[e.tp]).map(e=>e.id));
ok("library: type, region, group and equipment fields are valid",X.every(e=>"wbtci".includes(e.k)&&e.r&&e.g&&["Ağırlıksız","Ev tipi","Salon"].includes(e.q)&&e.n.length>1&&e.n.length<60),X.filter(e=>!("wbtci".includes(e.k))).map(e=>e.id));
ok("library: at least 14 regions",new Set(X.map(e=>e.r)).size>=14,[...new Set(X.map(e=>e.r))]);
ok("library: at least 4 exercises per region",(m=>Object.values(m).every(n=>n>=4))(X.reduce((m,e)=>(m[e.r]=(m[e.r]||0)+1,m),{})),X.reduce((m,e)=>(m[e.r]=(m[e.r]||0)+1,m),{}));
ok("library: image files exist on disk, at least 95% have images",X.every(e=>[0,1,2].includes(e.im)&&Array.from({length:e.im},(_,i)=>fs.existsSync(path.join(__dirname,"../www/ex",e.id,i+".webp"))).every(Boolean))&&X.filter(e=>e.im>0).length>=X.length*0.95,X.filter(e=>!(e.im>=1)).map(e=>e.id));
ok("image size: total at most 12 MB",(()=>{let s=0;for(const e of X)for(let i=0;i<e.im;i++)s+=fs.statSync(path.join(__dirname,"../www/ex",e.id,i+".webp")).size;return s<12e6})());
const svg=F.svg(Object.assign({},T.squat,{o:{}}),{label:"Squat"}),st=F.svg(T.squat,{anim:false});
ok("svg: animated and static output are produced without number errors",svg.startsWith("<svg")&&svg.includes("<animate")&&!st.includes("<animate")&&!/NaN|undefined/.test(svg+st));
ok("svg: every exercise renders",X.every(e=>{const s=F.svg(Object.assign({},T[e.tp],e.o?{o:e.o}:{},e.pr&&e.pr!=="-"?{prop:{k:e.pr.split("@")[0],at:e.pr.split("@")[1]==="sh"?"shoulder":"wrist"}}:{}),{});return !/NaN|undefined/.test(s)}));
finish();
