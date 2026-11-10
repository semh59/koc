"use strict";
// Real approved GLB boundary. Only image bitmap decoding stubbed; geometry/skin untouched.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const base=path.resolve(__dirname,'..'),evidence=path.join(base,'docs/analysis/exercise-human-rollout/rig-core');
const model=process.env.HUMAN_RIG_MODEL||'D:/PROJECT/NeoWell-exercise-pilot/neutral/neutral-human-viewer.glb';
const support=JSON.parse(fs.readFileSync(process.env.HUMAN_RIG_SUPPORT||'D:/PROJECT/NeoWell-exercise-pilot/viewer/hand-support.json','utf8'));
const lib=require('../www/modules/gym/figlib.js'),tpl=require('../www/modules/gym/figtpl.js');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function main(){
 global.self=globalThis;global.createImageBitmap=async()=>({width:1,height:1,close(){}});
 const THREE=await import('three'),{GLTFLoader}=await import('three/examples/jsm/loaders/GLTFLoader.js');
 const bytes=fs.readFileSync(model);assert.equal(sha(bytes),'947f9b100d6fc5130ad264b895d3b824a2bc5a917ba271cf0a51a41133c63b21','approved GLB hash');
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 assert(gltf.scene.getObjectByName('AthleticMaleBody')?.isSkinnedMesh,'actual body parsed');
 console.log('GLB parsed:',sha(bytes));
 const core=path.join(base,'www/modules/gym/human-rig.js');
 assert(fs.existsSync(core),'HumanRig core missing after actual GLB parse');
 const mutation=process.env.HUMAN_RIG_MUTATION;
 let api;
 if(mutation){const vm=require('node:vm');let text=fs.readFileSync(core,'utf8');const seam=mutation==='frozen-pushup'?'approvedPushup(phase);':"aimDirection('foot_'+s,'ball_'+s,dir(l[2],l[3]));";assert(text.includes(seam),'mutation seam');text=text.replace(seam,mutation==='frozen-pushup'?'approvedPushup(0);':'/* mutation: omitted foot orientation */');const context={module:{exports:{}}};vm.createContext(context);vm.runInContext(text,context);api=context.module.exports;}else api=require(core);
 assert.equal(typeof api.create,'function');
 const rig=api.create(THREE,gltf.scene,support);
 for(const name of ['root','body','bones','rest','pose','snapshot','metrics','status'])assert(rig[name],`contract ${name}`);
 assert.deepEqual(rig.root.scale.toArray(),[1,1,1],'physical model scale');
 console.log('PASS factory contract / actual GLB');
 const pos=n=>rig.bones[n].getWorldPosition(new THREE.Vector3()),angle=(a,b,c)=>a.clone().sub(b).angleTo(c.clone().sub(b))*180/Math.PI;
 const sceneScale=pos('thigh_l').distanceTo(pos('calf_l'))/48+pos('calf_l').distanceTo(pos('foot_l'))/48;
 const bind=rig.rest.map(([o,p,q,s])=>[o,p.clone(),s.clone()]);
 const plain={...tpl.pushup,_template:'pushup'},frames=[];
 for(let i=0;i<=24;i++){
   const phase=i/24,J=lib.frame(plain,lib.sample(plain,24)[i]).J;
   rig.pose(J,plain,phase);assert.equal(rig.status.solver,'approved-pushup','plain pushup dispatch');
   const m=rig.metrics();assert(m.finite);assert(m.contactError<1e-6,'approved planted contact');
   for(const s of ['l','r']){const knee=180-angle(pos('thigh_'+s),pos('calf_'+s),pos('foot_'+s));assert(Math.abs(knee-3)<.02,'approved knee flexion');}
   const snap=rig.snapshot();rig.pose(J,plain,phase);assert(Math.max(...snap.map((x,i)=>Math.abs(x-rig.snapshot()[i])))<1e-10,'pushup frame idempotency');
   for(const [o,p,s] of bind){if(o!==rig.root)assert(o.position.distanceTo(p)<1e-12,'child bind translation');assert(o.scale.distanceTo(s)<1e-12,'bind scale');}
   frames.push({phase,elbow:angle(pos('upperarm_l'),pos('lowerarm_l'),pos('hand_l')),pelvis:pos('pelvis').toArray(),...m});
 }
 assert(Math.abs(frames[0].elbow-172)<.02);assert(Math.abs(frames[12].elbow-95)<.02);
 assert(frames[0].pelvis[1]-frames[12].pelvis[1]>.08,'actual descent');
 fs.writeFileSync(path.join(evidence,'pushup-frames.json'),JSON.stringify(frames,null,2));
 console.log('PASS approved pushup contacts / knees / elbows / reset / bind');
 const catalog=[];
 for(const [name,template] of Object.entries(tpl)){
   const def={...template,_template:name},poses=lib.sample(def,8),samples=[];
   for(let i=0;i<poses.length;i++){
     const J=lib.frame(def,poses[i]).J;rig.pose(J,def,i/8);
     const snap=rig.snapshot();assert(snap.every(Number.isFinite),name+' finite');
     if(name!=='pushup')assert.equal(rig.status.solver,'generic',name+' generic dispatch');
     rig.pose(J,def,i/8);const again=rig.snapshot();assert(Math.max(...snap.map((x,j)=>Math.abs(x-again[j])))<1e-10,name+' idempotent');
     for(const [o,p,s]of bind){if(o!==rig.root)assert(o.position.distanceTo(p)<1e-12,name+' child translations');assert(o.scale.distanceTo(s)<1e-12,name+' child scale');}
     samples.push(snap);
   }
   const motion=Math.max(...samples.map(s=>Math.max(...s.map((v,i)=>Math.abs(v-samples[0][i])))));
   assert(motion>1e-4,name+' real phase motion');catalog.push({name,motion,frames:samples.length});
 }
 const direction=(a,b)=>pos(b).sub(pos(a)).normalize();
 for(const name of ['squat','latraise','run','bench','neckstretch','shrug','cycle']){
   const def={...tpl[name],_template:name},J=lib.frame(def,lib.sample(def,8)[4]).J;rig.pose(J,def,.5);
   const source=(a,b)=>{const dx=b[0]-a[0],dy=a[1]-b[1];return new THREE.Vector3(def.view==='f'?dx:0,dy,def.view==='f'?0:dx).normalize();};
   for(const [s,A,L]of [['l',J.limbs.nA,J.limbs.nL],['r',J.limbs.fA,J.limbs.fL]]){
     assert(direction('upperarm_'+s,'lowerarm_'+s).dot(source(A[0],A[1]))>.999,name+' upper arm direction '+s);
     assert(direction('lowerarm_'+s,'hand_'+s).dot(source(A[1],A[2]))>.999,name+' lower arm direction '+s);
     assert(direction('foot_'+s,'ball_'+s).dot(source(L[2],L[3]))>.999,name+' source foot orientation '+s);
   }
 }
 const variant={...plain,o:{t:25,a1:80}},VJ=lib.frame(variant,lib.sample(variant,8)[4]).J;
 rig.pose(VJ,variant,.5);assert.equal(rig.status.solver,'generic','pushup override not discarded');
 const runtimeOverride=lib.frame(plain,lib.sample(plain,8)[4]).J;runtimeOverride.pose.t=25;runtimeOverride.limbs.nA[1][0]+=5;
 rig.pose(runtimeOverride,plain,.5);assert.equal(rig.status.solver,'generic','runtime J override not discarded');
 fs.writeFileSync(path.join(evidence,'template-coverage.json'),JSON.stringify(catalog,null,2));
 console.log('PASS all '+catalog.length+' templates / actual frames / independent directions / override dispatch');
 const floorFrames=[];
 for(const name of ['squat','run','walk','bridge','bench','crunch','situp','legraise','legext','legpress','pullup','balwalk']){
   const def={...tpl[name],_template:name},poses=lib.sample(def,4);
   for(let i=0;i<poses.length;i++){
     rig.pose(lib.frame(def,poses[i]).J,def,i/4);const m=rig.metrics();
     assert(m.minY>=-1e-8,name+' actual skin does not penetrate scene floor');
     if(!def.fix||def.fix.y?.[0]==='floor')assert(Math.abs(m.minY)<1e-8,name+' planted skin floor');
     assert.equal(m.contactError,null,'no misleading generic pushup contact metric');
     if(def.fix?.y?.[0]==='wrist')assert(Math.abs(pos('hand_l').y-def.fix.y[1]*sceneScale)<1e-8,'real hanging hand support uses bind lengths');
     floorFrames.push({name,phase:i/4,minY:m.minY,status:JSON.parse(JSON.stringify(rig.status))});
   }
 }
 const baseJ=lib.frame(tpl.curl,lib.sample(tpl.curl,8)[4]).J;
 rig.pose(baseJ,{...tpl.curl,_template:'curl'},.5);const before=direction('upperarm_l','lowerarm_l').toArray();
 const independent=JSON.parse(JSON.stringify(baseJ));independent.limbs.fA[1][0]+=12;independent.limbs.fA[2][0]-=8;
 rig.pose(independent,{...tpl.curl,_template:'curl'},.5);assert.deepEqual(direction('upperarm_l','lowerarm_l').toArray(),before,'far input cannot change near rotation');
 const once={...tpl.balwalk,_template:'balwalk'};rig.pose(lib.frame(once,lib.sample(once,8)[0]).J,once,0);const start=pos('pelvis');rig.pose(lib.frame(once,lib.sample(once,8)[8]).J,once,1);assert(pos('pelvis').distanceTo(start)>.2,'one-shot endpoint not looped by core');
 fs.writeFileSync(path.join(evidence,'floor-family-frames.json'),JSON.stringify(floorFrames,null,2));
 console.log('PASS skin floor / scene families / independent sides / one-shot endpoint');
 const vm=require('node:vm'),{clone}=await import('three/examples/jsm/utils/SkeletonUtils.js');
 const pilotSource=fs.readFileSync('D:/PROJECT/NeoWell-exercise-pilot/viewer/pilot.js','utf8'),pl=pilotSource.split(/\r?\n/);
 assert.equal(sha(pilotSource),'f51a86e680fcd145c7acdd41525d0212200213e27e447204a7ae9b3e7cb3d44d','approved pilot source pin');
 const referenceRoot=clone(gltf.scene);for(const [o,p,q,s]of rig.rest){const ref=referenceRoot.getObjectByName(o.name);if(ref){ref.position.copy(p);ref.quaternion.copy(q);ref.scale.copy(s);}}
 const fixture=[pl[4],"const root=referenceRoot;",pl[13],pl[14],"const body=root.getObjectByName('AthleticMaleBody');",...pl.slice(32,53),"reference={pose,snapshot};"].join('\n');
 const context={THREE,referenceRoot,handSupport:support};vm.createContext(context);vm.runInContext(fixture,context);
 const toes={};for(const s of ['l','r']){toes[s]={toe:[],heel:[],all:[]};const a=rig.body.geometry.attributes.position,sign=s==='l'?1:-1;for(let i=0;i<a.count;i++){const x=a.getX(i)*sign,y=a.getY(i),z=a.getZ(i);if(x>.13&&x<.28&&y<.09){toes[s].all.push(i);if(z>.17&&y<.012)toes[s].toe.push(i);if(z<.015&&y<.04)toes[s].heel.push(i);}}}
 for(const phase of [0,.125,.25,.5,.75,1]){
   rig.pose(lib.frame(plain,lib.sample(plain,8)[Math.round(phase*8)]).J,plain,phase);context.reference.pose(phase);
   const a=rig.snapshot(),b=context.reference.snapshot();assert.equal(a.length,b.length);assert(Math.max(...a.map((x,i)=>Math.abs(x-b[i])))<1e-12,'exact original pilot snapshot '+phase);
   for(const s of ['l','r']){const min=ids=>Math.min(...ids.map(i=>rig.body.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(rig.body.matrixWorld).y));assert(min(toes[s].all)>=-.00001,'foot skin penetration');assert(min(toes[s].toe)>=0&&min(toes[s].toe)<.003,'distal plantar contact');assert(min(toes[s].heel)>.08,'heel rise');}
 }
 console.log('PASS exact pilot source equivalence / independent skin toe and heel regions');
 assert.throws(()=>api.create(THREE,new THREE.Group(),support),/AthleticMaleBody/);
 const invalid=JSON.parse(JSON.stringify(baseJ));invalid.hip[0]=NaN;
 assert.throws(()=>rig.pose(invalid,tpl.curl,.5),/finite/,'non-finite torso must fail clearly');
 const scaled=clone(referenceRoot);scaled.scale.setScalar(1.5);
 assert.throws(()=>api.create(THREE,scaled,support),/scale/,'old renderer 1.5 scale must not silently deform calibrated solver');
 console.log('PASS invalid rig / finite input / physical scale guards');
 fs.writeFileSync(path.join(evidence,'source-pins.json'),JSON.stringify({glb:sha(bytes),pilot:sha(pilotSource),handSupport:sha(JSON.stringify(support)),core:sha(fs.readFileSync(core)),templates:sha(fs.readFileSync(path.join(base,'www/modules/gym/figtpl.js'))),templatesCount:catalog.length},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
