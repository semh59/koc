"use strict";
/* Stick-figure motion engine (no DOM): skeleton, forward kinematics, two-bone IK, looping templates and SVG output.
   Angles are degrees measured from straight down: 0 down, +90 forward (right), 180 up. The torso angle is measured from straight up (+ leans forward).
   Elbow flexion = forearm - upper arm >= 0, knee flexion = thigh - shin >= 0. */
const FigLib=(()=>{
  const B={torso:36,neck:3,head:7,ua:17,fa:16,th:24,sh:24,ft:9,shw:8,hpw:5};
  const FLOOR=136,X0=80,W=160,H=150;
  const rad=d=>d*Math.PI/180,sn=a=>Math.sin(rad(a)),cs=a=>Math.cos(rad(a));
  const dn=(a,l)=>[sn(a)*l,cs(a)*l],upv=(a,l)=>[sn(a)*l,-cs(a)*l];
  const add=(p,q)=>[p[0]+q[0],p[1]+q[1]];
  const DEF={sy:0,hh:0,t:0,hd:null,a1:0,a2:0,b1:null,b2:null,l1:0,l2:0,l3:90,m1:null,m2:null,m3:null,hand:null,foot:null,eb:1};
  const KEYS=["sy","hh","t","hd","a1","a2","b1","b2","l1","l2","l3","m1","m2","m3"];
  const full=p=>{
    const q=Object.assign({},DEF,p);
    if(q.hd==null)q.hd=q.t*0.6;
    for(const [f,n] of [["b1","a1"],["b2","a2"],["m1","l1"],["m2","l2"],["m3","l3"]])if(q[f]==null)q[f]=q[n];
    return q;
  };

  /* Two-bone IK: root r, target t, lengths a,b. Returns the joint point and the reachable end. bend +1/-1 is the bend side (left/right of the root->target vector). */
  function ik2(r,t,a,b,bend){
    let dx=t[0]-r[0],dy=t[1]-r[1],d=Math.hypot(dx,dy);
    const max=a+b-0.01,min=Math.abs(a-b)+0.01;
    if(d>max)d=max;else if(d<min)d=min;
    const ang=Math.atan2(dy,dx),c=(a*a+d*d-b*b)/(2*a*d),al=Math.acos(Math.max(-1,Math.min(1,c)))*bend;
    const j=[r[0]+Math.cos(ang+al)*a,r[1]+Math.sin(ang+al)*a];
    const e=[r[0]+Math.cos(ang)*d,r[1]+Math.sin(ang)*d];
    return {joint:j,end:e};
  }

  /* Joints of a pose in scene coordinates. view: "s" side, "f" front. */
  function joints(pose,view,fix){
    const p=full(pose),fr=view==="f";
    const hip=[0,0],neck=upv(p.t,B.torso),head=add(neck,upv(p.hd,B.neck+B.head));
    const sh=neck.slice();
    const limbs={};
    const arm=(a1,a2,off,sgn)=>{
      const s=[sh[0]+off,sh[1]+2-p.sy],e=add(s,dn(sgn*a1,B.ua)),w=add(e,dn(sgn*a2,B.fa));return [s,e,w];
    };
    const leg=(l1,l2,l3,off,sgn)=>{
      const h=[off,0],k=add(h,dn(sgn*l1,B.th)),a=add(k,dn(sgn*l2,B.sh)),t=add(a,dn(sgn*l3,B.ft));return [h,k,a,t];
    };
    if(fr){
      limbs.nA=arm(p.a1,p.a2,B.shw,1);limbs.fA=arm(p.b1,p.b2,-B.shw,-1);
      limbs.nL=leg(p.l1,p.l2,p.l3,B.hpw,1);limbs.fL=leg(p.m1,p.m2,p.m3,-B.hpw,-1);
    }else{
      limbs.nA=arm(p.a1,p.a2,0,1);limbs.fA=arm(p.b1,p.b2,0,1);
      limbs.nL=leg(p.l1,p.l2,p.l3,0,1);limbs.fL=leg(p.m1,p.m2,p.m3,0,1);
    }
    const J={hip,neck,head,limbs,pose:p,view};
    place(J,fix);
    return J;
  }

  function shift(J,dx,dy){
    const m=p=>[p[0]+dx,p[1]+dy];
    J.hip=m(J.hip);J.neck=m(J.neck);J.head=m(J.head);
    for(const k in J.limbs)J.limbs[k]=J.limbs[k].map(m);
  }
  const pick=(J,name)=>({ankle:J.limbs.nL[2],toe:J.limbs.nL[3],hip:J.hip,wrist:J.limbs.nA[2],knee:J.limbs.nL[1],neck:J.neck}[name]);

  /* Placement: fix.x=[joint, relative x], fix.y=["floor"] lowest point on the floor | ["hip",height] hip fixed | ["wrist",height] hand fixed (hanging).
     Then, if pose.hand/foot targets exist, the arm/leg reaches them by IK (target: [relative x, height above the floor]). */
  function place(J,fix){
    fix=fix||{};const fx=fix.x||[J.view==="f"?"hip":"ankle",0],fy=fix.y||["floor"];
    let dy=0;
    if(fy[0]==="floor"){
      let low=-1e9;
      for(const k of ["nL","fL"])for(const q of J.limbs[k])low=Math.max(low,q[1]);
      for(const q of J.limbs.nA.concat(J.limbs.fA))low=Math.max(low,q[1]);
      low=Math.max(low,J.hip[1],J.neck[1],J.head[1]+B.head);
      dy=FLOOR-low;
    }else if(fy[0]==="hip"){dy=FLOOR-(fy[1]||0)-J.pose.hh-J.hip[1]}
    else if(fy[0]==="wrist"){dy=FLOOR-(fy[1]||0)-J.limbs.nA[2][1]}
    const ref=pick(J,fx[0]);
    shift(J,X0+(fx[1]||0)-ref[0],dy);
    const p=J.pose,fr=J.view==="f";
    if(p.hand){
      const [hx,hh]=p.hand;
      for(const [k,sg] of [["nA",1],["fA",-1]]){
        const s=J.limbs[k][0],t=[X0+(fr?sg:1)*hx,FLOOR-hh],r=ik2(s,t,B.ua,B.fa,-p.eb*(fr?sg:1));
        J.limbs[k]=[s,r.joint,r.end];
      }
    }
    if(p.foot){
      const [fxx,fh]=p.foot,tgt=[X0+fxx,FLOOR-fh];
      for(const [k,sg] of [["nL",1],["fL",-1]]){
        const h=J.limbs[k][0],t=fr?[X0+sg*Math.abs(fxx),tgt[1]]:tgt,r=ik2(h,t,B.th,B.sh,fr?sg:-1);
        J.limbs[k]=[h,r.joint,r.end,add(r.end,dn(sg*p.l3,B.ft))];
      }
    }
  }

  /* Template: frames = key poses (loop A->B->...->A). o: values overriding the pose. */
  const ease=t=>t*t*(3-2*t);
  function lerpPose(a,b,t){
    const o={};
    for(const k of KEYS)o[k]=a[k]+(b[k]-a[k])*t;
    o.hand=t<0.5?a.hand:b.hand;o.foot=t<0.5?a.foot:b.foot;o.eb=a.eb;
    if(a.hand&&b.hand)o.hand=[a.hand[0]+(b.hand[0]-a.hand[0])*t,a.hand[1]+(b.hand[1]-a.hand[1])*t];
    if(a.foot&&b.foot)o.foot=[a.foot[0]+(b.foot[0]-a.foot[0])*t,a.foot[1]+(b.foot[1]-a.foot[1])*t];
    return o;
  }
  /* n+1 samples of the loop (0..1), ping-pong with easing. */
  function sample(def,n){
    const fr=def.frames.map(f=>full(Object.assign({},f,def.o||{},f.o||{})));
    const path=fr.length===2?[fr[0],fr[1],fr[0]]:fr.concat(fr.slice(0,-1).reverse());
    const segs=path.length-1,out=[];
    for(let i=0;i<=n;i++){
      const u=i/n*segs,si=Math.min(segs-1,Math.floor(u));
      out.push(lerpPose(path[si],path[si+1],ease(u-si)));
    }
    return out;
  }

  /* Parts to draw for one frame: {k:"line"|"circle"|"rect", ...}, floor and fixed props included. */
  function props(J,def){
    const pr=def.prop,out=[];if(!pr)return out;
    const wr=J.limbs.nA[2],wl=J.limbs.fA[2],sh=J.neck;
    const at=pr.at==="shoulder"?[sh[0],sh[1]+1]:wr;
    const fr=J.view==="f";
    if(pr.k==="bar"){
      if(fr){const a=pr.at==="shoulder"?[sh[0]-B.shw*1.6,sh[1]+2]:wl,b=pr.at==="shoulder"?[sh[0]+B.shw*1.6,sh[1]+2]:wr;
        out.push({k:"line",c:"prop",w:2.4,pts:[[a[0]-8,a[1]],[b[0]+8,b[1]]]},{k:"circle",c:"plate",p:[a[0]-8,a[1]],r:6},{k:"circle",c:"plate",p:[b[0]+8,b[1]],r:6});}
      else out.push({k:"circle",c:"plate",p:at,r:8.5});
    }else if(pr.k==="db"){
      if(fr)for(const w of [wl,wr])out.push({k:"line",c:"prop",w:2.4,pts:[[w[0]-5,w[1]],[w[0]+5,w[1]]]},{k:"circle",c:"plate",p:[w[0]-5,w[1]],r:3.6},{k:"circle",c:"plate",p:[w[0]+5,w[1]],r:3.6});
      else out.push({k:"circle",c:"plate",p:wr,r:4.4});
    }else if(pr.k==="kb"){
      out.push({k:"circle",c:"plate",p:[wr[0],wr[1]+4],r:5.5},{k:"line",c:"prop",w:1.6,pts:[[wr[0]-3,wr[1]+1],[wr[0],wr[1]-1],[wr[0]+3,wr[1]+1]]});
    }else if(pr.k==="ball"){
      out.push({k:"circle",c:"plate",p:[wr[0],wr[1]-3],r:7});
    }
    return out;
  }

  /* Fixed scene: floor line, bench/bar/box (independent of the body or relative to the hip). */
  function scene(def,J){
    const out=[{k:"line",c:"floor",w:1.4,pts:[[8,FLOOR+2],[W-8,FLOOR+2]]}];
    const sc=def.scene;if(!sc)return out;
    const hipH=def.fix&&def.fix.y&&def.fix.y[0]==="hip"?def.fix.y[1]:0;
    if(sc==="bench"){
      const top=FLOOR-hipH+3;
      out.push({k:"line",c:"prop",w:5,pts:[[X0-38,top],[X0+30,top]]},{k:"line",c:"prop",w:2,pts:[[X0-30,top],[X0-30,FLOOR+2]]},{k:"line",c:"prop",w:2,pts:[[X0+22,top],[X0+22,FLOOR+2]]});
    }else if(sc==="incbench"){
      const top=FLOOR-hipH+3;
      out.push({k:"line",c:"prop",w:5,pts:[[X0-22,top],[X0+4,top]]},{k:"line",c:"prop",w:5,pts:[[X0+4,top],[X0+34,top-26]]},{k:"line",c:"prop",w:2,pts:[[X0-18,top],[X0-18,FLOOR+2]]},{k:"line",c:"prop",w:2,pts:[[X0+12,top-6],[X0+12,FLOOR+2]]});
    }else if(sc==="pullbar"){
      const y=FLOOR-(def.fix.y[1]||0);
      out.push({k:"line",c:"prop",w:2.6,pts:[[X0-26,y-1],[X0+26,y-1]]},{k:"line",c:"prop",w:1.4,pts:[[X0-26,y-1],[X0-26,10]]},{k:"line",c:"prop",w:1.4,pts:[[X0+26,y-1],[X0+26,10]]});
    }else if(sc==="dipbar"){
      const y=FLOOR-(def.fix.y[1]||0);
      out.push({k:"line",c:"prop",w:2.6,pts:[[X0-22,y+1],[X0+22,y+1]]},{k:"line",c:"prop",w:2,pts:[[X0+22,y+1],[X0+22,FLOOR+2]]});
    }else if(sc==="box"){
      out.push({k:"rect",c:"prop",x:X0+6,y:FLOOR-22,w:34,h:24});
    }else if(sc==="seat"){
      out.push({k:"line",c:"prop",w:4,pts:[[X0-20,FLOOR-24],[X0+4,FLOOR-24]]},{k:"line",c:"prop",w:4,pts:[[X0-20,FLOOR-24],[X0-22,FLOOR-70]]},{k:"line",c:"prop",w:2,pts:[[X0-14,FLOOR-24],[X0-14,FLOOR+2]]});
    }else if(sc==="cable"){
      out.push({k:"line",c:"prop",w:3,pts:[[X0+46,10],[X0+46,FLOOR+2]]},{k:"line",c:"prop",w:1,pts:[[X0+46,def.cableY||24],[J.limbs.nA[2][0],J.limbs.nA[2][1]]]});
    }
    return out;
  }

  /* One frame: part list (far limbs first). */
  function frame(def,pose){
    const J=joints(pose,def.view||"s",def.fix);
    const L=J.limbs,out=scene(def,J);
    const line=(c,w,pts)=>out.push({k:"line",c,w,pts});
    line("far",4.2,L.fA);line("far",4.6,L.fL.slice(0,3));line("far",3.4,L.fL.slice(2));
    if(def.view==="f"){line("body",5.6,[J.hip,J.neck]);line("body",5.6,[[J.hip[0]-B.hpw,J.hip[1]],[J.hip[0]+B.hpw,J.hip[1]]]);line("body",5.6,[[J.neck[0]-B.shw,J.neck[1]+2],[J.neck[0]+B.shw,J.neck[1]+2]]);}
    else line("body",6,[J.hip,J.neck]);
    line("near",4.2,L.nL.slice(0,3));line("near",3.4,L.nL.slice(2));
    for(const q of props(J,def))out.push(q);
    line("near",4.2,L.nA);
    out.push({k:"circle",c:"head",p:J.head,r:B.head});
    return {parts:out,J};
  }

  const f1=x=>(Math.round(x*10)/10);
  /* SVG: with anim, a SMIL loop (detail sheet only); otherwise a single pose (list thumbnail). */
  function svg(def,{anim=true,label="Egzersiz"}={}){
    const dur=2.6,N=anim?14:0;
    const poses=N?sample(def,N):[full(Object.assign({},def.frames[0],def.o||{}))];
    const fs=poses.map(p=>frame(def,p).parts);
    let h=`<svg class="fig" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">`;
    const n0=fs[0].length;
    for(let i=0;i<n0;i++){
      const p0=fs[0][i];
      if(p0.k==="line"){
        const ds=fs.map(f=>"M"+f[i].pts.map(q=>f1(q[0])+" "+f1(q[1])).join("L"));
        h+=`<path class="fg-${p0.c}" stroke-width="${p0.w}" fill="none" stroke-linecap="round" stroke-linejoin="round" d="${ds[0]}">${N?`<animate attributeName="d" dur="${dur}s" repeatCount="indefinite" values="${ds.join(";")}"/>`:""}</path>`;
      }else if(p0.k==="circle"){
        const cx=fs.map(f=>f1(f[i].p[0])).join(";"),cy=fs.map(f=>f1(f[i].p[1])).join(";");
        h+=`<circle class="fg-${p0.c}" r="${p0.r}" cx="${f1(p0.p[0])}" cy="${f1(p0.p[1])}">${N?`<animate attributeName="cx" dur="${dur}s" repeatCount="indefinite" values="${cx}"/><animate attributeName="cy" dur="${dur}s" repeatCount="indefinite" values="${cy}"/>`:""}</circle>`;
      }else if(p0.k==="rect"){
        h+=`<rect class="fg-${p0.c}" x="${p0.x}" y="${p0.y}" width="${p0.w}" height="${p0.h}" rx="2" fill="none" stroke-width="2"/>`;
      }
    }
    return h+"</svg>";
  }

  return {B,FLOOR,W,H,KEYS,full,frame,sample,svg};
})();
if(typeof module!=="undefined")module.exports=FigLib;
