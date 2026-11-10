"use strict";
/* Rotation-only adapter for approved 1.7m AthleticMaleBody rig. No renderer ownership. */
const HumanRig = (() => {
  function create(THREE, root, handSupport) {
    const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),Q=()=>new THREE.Quaternion();
    const bones={},rest=[];
    if(root.scale.distanceTo(V(1,1,1))>1e-10)throw new Error('HumanRig: physical root scale 1 required');
    root.updateMatrixWorld(true);
    root.traverse(o=>{if(o.isBone)bones[o.name]=o;rest.push([o,o.position.clone(),o.quaternion.clone(),o.scale.clone()]);});
    const body=root.getObjectByName('AthleticMaleBody');
    if(!body||!body.isSkinnedMesh)throw new Error('HumanRig: AthleticMaleBody skinned mesh required');
    const geom=body.geometry,points=geom.attributes.position;
    const status={solver:'bind',limitations:['Generic retarget is not anatomical or equipment-contact approval.']};
    function snapshot(){const a=[];root.traverse(o=>{if(o.isBone)a.push(...o.matrixWorld.elements);});for(let i=0;i<body.geometry.attributes.position.count;i+=97)a.push(...body.getVertexPosition(i,V()).applyMatrix4(body.matrixWorld).toArray());return a;}
    const pos=n=>bones[n].getWorldPosition(V()),restWorld={};for(const n in bones)restWorld[n]=bones[n].getWorldQuaternion(Q());
 function orient(n,world){const b=bones[n];b.quaternion.copy(b.parent.getWorldQuaternion(Q()).invert().multiply(world));root.updateMatrixWorld(true);}
 function aim(n,child,target){const b=bones[n],at=pos(n),dir=pos(child).sub(at).normalize(),wanted=target.clone().sub(at).normalize();orient(n,Q().setFromUnitVectors(dir,wanted).multiply(b.getWorldQuaternion(Q())));}
 function ik(a,b,c,target,pole){const p=pos(a),l1=p.distanceTo(pos(b)),l2=pos(b).distanceTo(pos(c)),delta=target.clone().sub(p),d=delta.length(),u=delta.normalize();const safe=Math.max(Math.abs(l1-l2)+1e-6,Math.min(d,l1+l2-1e-6));const along=(l1*l1-l2*l2+safe*safe)/(2*safe),height=Math.sqrt(Math.max(0,l1*l1-along*along));const bend=pole.clone().addScaledVector(u,-pole.dot(u)).normalize();const mid=p.clone().addScaledVector(u,along).addScaledVector(bend,height);aim(a,b,mid);aim(b,c,target);}
 const targets={};const footRot={},footOffset={};for(const s of ['l','r']){const x=s==='l'?1:-1,heelRise=Q().setFromAxisAngle(V(1,0,0),THREE.MathUtils.degToRad(60));targets['hand_'+s]=V(x*.24,.0225,.56);targets['ball_'+s]=V(x*.14,.0158,-.70);footRot[s]=heelRise.clone().multiply(restWorld['foot_'+s]);footOffset[s]=pos('ball_'+s).sub(pos('foot_'+s)).applyQuaternion(heelRise);}
 // Solve the rigid torso / almost-straight leg chain around the planted ankle.
 const hipRest=pos('thigh_l').add(pos('thigh_r')).multiplyScalar(.5),pelvisRest=pos('pelvis'),shoulderRest=pos('upperarm_l').add(pos('upperarm_r')).multiplyScalar(.5);
 const hipOffset=hipRest.clone().sub(pelvisRest),torsoAxis=shoulderRest.clone().sub(hipRest).normalize(),ankle=targets.ball_l.clone().sub(footOffset.l),ankleMid=ankle.clone().add(targets.ball_r.clone().sub(footOffset.r)).multiplyScalar(.5);
 const leg1=pos('thigh_l').distanceTo(pos('calf_l')),leg2=pos('calf_l').distanceTo(pos('foot_l')),legReach=Math.sqrt(leg1*leg1+leg2*leg2+2*leg1*leg2*Math.cos(THREE.MathUtils.degToRad(3))),legYZ=Math.sqrt(legReach*legReach-(pos('thigh_l').x-ankle.x)**2);
 function bodyPath(y){let lo=.5,hi=1.7;for(let i=0;i<40;i++){const pitch=(lo+hi)/2,q=Q().setFromAxisAngle(V(1,0,0),pitch),h=ankleMid.y+legYZ*torsoAxis.clone().applyQuaternion(q).y-hipOffset.clone().applyQuaternion(q).y;if(h>y)lo=pitch;else hi=pitch;}const pitch=(lo+hi)/2,q=Q().setFromAxisAngle(V(1,0,0),pitch),p=ankleMid.clone().addScaledVector(torsoAxis.clone().applyQuaternion(q),legYZ).sub(hipOffset.clone().applyQuaternion(q));return {pitch,p};}
 const shoulderOffset=pos('upperarm_l').sub(pelvisRest),arm1=pos('upperarm_l').distanceTo(pos('lowerarm_l')),arm2=pos('lowerarm_l').distanceTo(pos('hand_l'));
 function heightForElbow(degrees){const reach=Math.sqrt(arm1*arm1+arm2*arm2-2*arm1*arm2*Math.cos(THREE.MathUtils.degToRad(degrees)));let lo=.15,hi=.45;for(let i=0;i<40;i++){const y=(lo+hi)/2,path=bodyPath(y),shoulder=shoulderOffset.clone().applyAxisAngle(V(1,0,0),path.pitch).add(path.p);if(shoulder.distanceTo(targets.hand_l)>reach)hi=y;else lo=y;}return (lo+hi)/2;}
 const topHeight=heightForElbow(172),bottomHeight=heightForElbow(95);
 function approvedPushup(t){const f=(1-Math.cos(t*Math.PI*2))/2,path=bodyPath(topHeight+(bottomHeight-topHeight)*f);root.quaternion.setFromAxisAngle(V(1,0,0),path.pitch);root.updateMatrixWorld(true);root.position.add(path.p.clone().sub(pos('pelvis')));root.updateMatrixWorld(true);
 for(const s of ['l','r']){const sign=s==='l'?1:-1;ik('thigh_'+s,'calf_'+s,'foot_'+s,targets['ball_'+s].clone().sub(footOffset[s]),V(0,1,0));orient('foot_'+s,footRot[s]);orient('ball_'+s,Q().setFromAxisAngle(V(1,0,0),THREE.MathUtils.degToRad(8)).multiply(restWorld['ball_'+s]));const caudal=pos('thigh_l').add(pos('thigh_r')).sub(pos('upperarm_l')).sub(pos('upperarm_r')).normalize(),lateral=pos('upperarm_l').sub(pos('upperarm_r')).normalize();ik('upperarm_'+s,'lowerarm_'+s,'hand_'+s,targets['hand_'+s],caudal.clone().addScaledVector(lateral,sign));orient('hand_'+s,Q().fromArray(handSupport.handWorld[s]));
 // Fixed rig-specific rotations, calibrated against real deformed skin.
 // No geometry edits, child translations, scale changes, or runtime fitting.
 for(const [name,rotation]of Object.entries(handSupport.fingers))if(name.endsWith('_'+s))bones[name].quaternion.fromArray(rotation);
 root.updateMatrixWorld(true);}

 root.updateMatrixWorld(true);root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});return t;}
function metrics(){let finite=true,minY=Infinity,maxY=-Infinity;const surface={hand_l:Infinity,hand_r:Infinity,toe_l:Infinity,toe_r:Infinity};const ids=geom.attributes.skinIndex,weights=geom.attributes.skinWeight;for(let i=0;i<points.count;i++){const p=body.getVertexPosition(i,V()).applyMatrix4(body.matrixWorld);finite=finite&&p.toArray().every(Number.isFinite);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);for(let j=0;j<4;j++){if(weights.getComponent(i,j)<=.7)continue;const name=body.skeleton.bones[ids.getComponent(i,j)].name;for(const s of ['l','r']){if(new RegExp('^(hand|thumb|index|middle|ring|pinky).*_'+s+'$').test(name))surface['hand_'+s]=Math.min(surface['hand_'+s],p.y);if(name==='ball_'+s)surface['toe_'+s]=Math.min(surface['toe_'+s],p.y);}}}let contactError=0;for(const n in targets)contactError=Math.max(contactError,pos(n).distanceTo(targets[n]));return {finite,minY,maxY,contactError:status.solver==='approved-pushup'?contactError:null,surface,contacts:Object.fromEntries(Object.keys(targets).map(n=>[n,pos(n).toArray()]))};}
    // Generic swing retarget: source lengths never become child offsets. Each
    // chain retains real bind lengths; source directions and independent sides drive rotations.
    const sceneScale=(leg1+leg2)/48;
    const plainFrames=[{t:74,l1:-74,l2:-74,l3:20,a1:0,a2:0,hand:[21,0]},{t:84,l1:-84,l2:-84,l3:20,hand:[21,0]}];
    function plainPushup(def,J){
      const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),p=J&&J.pose;
      const unchanged=p&&J.view!=='f'&&p.t>=74-1e-6&&p.t<=84+1e-6&&Math.abs(p.l1+p.t)<1e-6&&Math.abs(p.l2+p.t)<1e-6&&p.l3===20&&p.m1===p.l1&&p.m2===p.l2&&p.m3===p.l3&&p.a1===p.b1&&p.a2===p.b2&&p.dx===0&&p.sy===0&&p.hh===0&&same(p.hand,[21,0])&&!p.foot&&!p.feet&&same(J.limbs.nA,J.limbs.fA)&&same(J.limbs.nL,J.limbs.fL);
      return unchanged&&def._template==='pushup'&&!def.scene&&!def.playback&&(!def.view||def.view==='s')&&(!def.o||Object.keys(def.o).length===0)&&same(def.frames,plainFrames)&&same(def.fix,{x:['toe',-58],y:['toe',0]});
    }
    function generic(J,def){
      if(!J||!J.limbs||!J.hip||!J.neck||!J.head)throw new Error('HumanRig: complete FigLib J required');
      if(![J.hip,J.neck,J.head].every(p=>Array.isArray(p)&&p.length>=2&&p.every(Number.isFinite)))throw new Error('HumanRig: finite torso points required');
      const front=(J.view||def.view)==='f';
      const dir=(a,b)=>{const dx=b[0]-a[0],dy=a[1]-b[1],d=front?V(dx,dy,0):V(0,dy,dx);return d.lengthSq()>1e-12?d.normalize():V(0,1,0);};
      const point=p=>front?V((p[0]-80)*sceneScale,(136-p[1])*sceneScale,0):V(0,(136-p[1])*sceneScale,(p[0]-80)*sceneScale);
      const aimDirection=(n,child,d)=>aim(n,child,pos(n).add(d));
      const torso=dir(J.hip,J.neck);
      // Tilt whole pelvis/rig, retain original spine offsets, rotate head independently.
      root.quaternion.copy(Q().setFromUnitVectors(torsoAxis,torso));root.updateMatrixWorld(true);
      aimDirection('neck_01','head',dir(J.neck,J.head));
      // FigLib head is a circle centre, not bone. Orient Head using its bind up axis.
      const headWorld=Q().setFromUnitVectors(V(0,1,0),dir(J.neck,J.head)).multiply(restWorld.head);
      orient('head',headWorld);
      for(const [s,a,l]of [['l',J.limbs.nA,J.limbs.nL],['r',J.limbs.fA,J.limbs.fL]]){
        if(!a||!l||a.length<3||l.length<4||![...a,...l].every(p=>p.length>=2&&p.every(Number.isFinite)))throw new Error('HumanRig: finite independent limb points required');
        // Shrug from clavicle rotation, never shoulder translations or doubled 2D shoulder width.
        const sy=J.pose&&Number.isFinite(J.pose.sy)?J.pose.sy:0;
        if(sy){const c='clavicle_'+s,u='upperarm_'+s,d=pos(u).sub(pos(c)),raise=V(0,sy*sceneScale,0);aim(c,u,pos(c).add(d).add(raise));}
        aimDirection('upperarm_'+s,'lowerarm_'+s,dir(a[0],a[1]));
        aimDirection('lowerarm_'+s,'hand_'+s,dir(a[1],a[2]));
        // Preserve palm/finger bind pose; hand follows forearm, no pushup calibration leakage.
        aimDirection('thigh_'+s,'calf_'+s,dir(l[0],l[1]));
        aimDirection('calf_'+s,'foot_'+s,dir(l[1],l[2]));
        aimDirection('foot_'+s,'ball_'+s,dir(l[2],l[3]));
      }
      root.position.add(point(J.hip).sub(pos('pelvis')));root.updateMatrixWorld(true);
      const fy=def.fix&&def.fix.y||['floor'];
      if(fy[0]==='wrist'){
        // Hanging root height uses real arm reach, not source arm lengths.
        root.position.y+=(fy[1]||0)*sceneScale-pos('hand_l').y;
      }else if(fy[0]==='floor'||fy[0]==='toe'||fy[0]==='ankle'||fy[0]==='knee'){
        // Lowest actual deformed skin supports floor; avoids anchoring shorter 2D chains.
        let low=Infinity;for(let i=0;i<points.count;i++)low=Math.min(low,body.getVertexPosition(i,V()).applyMatrix4(body.matrixWorld).y);
        root.position.y+=(fy[1]||0)*sceneScale-low;
      }
      root.updateMatrixWorld(true);
      // Collision-only correction for hip-supported/supine poses: source hip height
      // may be lower than real torso thickness. Lift root, never deform mesh.
      status.floorCorrection=0;
      if(fy[0]==='hip'){
        let low=Infinity;for(let i=0;i<points.count;i++)low=Math.min(low,body.getVertexPosition(i,V()).applyMatrix4(body.matrixWorld).y);
        if(low<0){status.floorCorrection=-low;root.position.y-=low;root.updateMatrixWorld(true);}
      }
      status.solver='generic';status.family=fy[0]==='wrist'?'hanging':def.scene==='seat'?'sitting':torso.y<.35?'horizontal':'standing';
      status.limitations=['Direction retarget preserves bind lengths; 2D targets are not exact 3D end-effector contacts.','Generic palm, toe, joint twist and equipment contacts require family-specific skin/visual qualification.'];
      if(fy[0]==='hip')status.limitations.push('Hip support height follows scene units; bench/seat and floor collisions are not IK constrained.');
    }
    function pose(J,def={},phase=0){
      if(!Number.isFinite(phase))throw new Error('HumanRig: finite phase required');
      for(const [o,p,q,s]of rest){o.position.copy(p);o.quaternion.copy(q);o.scale.copy(s);}root.updateMatrixWorld(true);
      if(plainPushup(def,J)){
        if(!handSupport||!handSupport.handWorld||!handSupport.fingers)throw new Error('HumanRig: approved hand support calibration required');
        approvedPushup(phase);status.solver='approved-pushup';status.family='prone';status.limitations=['Approved pilot motion only; no clinical anatomy or variant approval.'];
      }else generic(J,def);
      root.updateMatrixWorld(true);root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});return status;
    }
    return {root,body,bones,rest,pose,snapshot,metrics,status};
  }
  return {create};
})();
if(typeof module!=='undefined')module.exports=HumanRig;
