"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
async function main(){
const THREE=await import('three');
const modulePath=path.resolve(__dirname,'../www/modules/gym/human-equipment.js');
assert(fs.existsSync(modulePath),'HumanEquipment production module exists');
const API=require(modulePath);
assert.equal(typeof API.create,'function');
function fixture(){
 const root=new THREE.Group(),bones={};
 for(const [name,p]of Object.entries({pelvis:[0,.85,0],spine:[0,1,0],upperarm_l:[.2,1.4,0],upperarm_r:[-.2,1.4,0],lowerarm_l:[.3,1.2,0],lowerarm_r:[-.3,1.2,0],hand_l:[.35,1,.15],hand_r:[-.35,1,.15],thigh_l:[.1,.8,0],calf_l:[.1,.4,0],foot_l:[.1,0,0],ball_l:[.1,0,.15],thigh_r:[-.1,.8,0],calf_r:[-.1,.4,0],foot_r:[-.1,0,0],ball_r:[-.1,0,.15]})){
  const b=new THREE.Bone();b.name=name;b.position.fromArray(p);root.add(b);bones[name]=b;
 }root.updateMatrixWorld(true);return {root,bones};
}
const rig=fixture(),eq=API.create(THREE);
assert(eq.group.isGroup);assert.equal(typeof eq.update,'function');assert.equal(typeof eq.dispose,'function');
eq.update(null,{prop:{k:'bar',at:'wrist'}},rig);
const bar=eq.group.getObjectByName('bar');assert(bar&&bar.children.some(c=>c.isMesh),'bar contains rendered meshes');
const shaft=bar.getObjectByName('shaft'),a=rig.bones.hand_l.getWorldPosition(new THREE.Vector3()),b=rig.bones.hand_r.getWorldPosition(new THREE.Vector3());
assert(shaft.getWorldPosition(new THREE.Vector3()).distanceTo(a.clone().add(b).multiplyScalar(.5))<1e-9,'bar midpoint follows both hand bones');
for(const plate of ['plate-left','plate-right'])assert(Math.abs(bar.getObjectByName(plate).position.y)>a.distanceTo(b)/2+.1,'plates outside hands');
const bounds=new THREE.Box3().setFromObject(eq.group);assert(bounds.min.toArray().concat(bounds.max.toArray()).every(Number.isFinite));assert(bounds.getSize(new THREE.Vector3()).x>1,'meter-scale geometry');
console.log('PASS real THREE factory / visible bar / both-hand anchor / external plates / meter bounds');
for(const kind of ['db','kb','ball']){
 eq.update(null,{prop:{k:kind,at:'wrist'}},rig);
 const prop=eq.group.getObjectByName(kind);assert(prop,'visible '+kind+' geometry');
 if(kind==='db')for(const s of ['l','r'])assert(prop.getObjectByName('db-'+s).getWorldPosition(new THREE.Vector3()).distanceTo(rig.bones['hand_'+s].getWorldPosition(new THREE.Vector3()))<1e-9,'db anchor '+s);
 const box=new THREE.Box3().setFromObject(eq.group);assert(box.min.toArray().concat(box.max.toArray()).every(Number.isFinite),kind+' finite bounds');
}
eq.update(null,{prop:{k:'bar',at:'shoulder'}},rig);
assert(eq.group.getObjectByName('bar').getWorldPosition(new THREE.Vector3()).distanceTo(new THREE.Vector3(0,1.4,0))<1e-9,'shoulder bar follows shoulder bones not wrist');
rig.bones.hand_l.position.set(.6,1.7,.2);rig.root.updateMatrixWorld(true);
eq.update(null,{prop:{k:'db',at:'wrist'}},rig);
assert(eq.group.getObjectByName('db-l').getWorldPosition(new THREE.Vector3()).distanceTo(new THREE.Vector3(.6,1.7,.2))<1e-9,'moving bone updates attachment');
eq.update(null,{},rig);assert.equal(eq.group.children.length,0,'definition switch clears old equipment');
console.log('PASS db / kb / ball / shoulder / moving bones / reset');
const FigLib=require('../www/modules/gym/figlib.js'),FigTpl=require('../www/modules/gym/figtpl.js');
for(const scene of ['bench','incbench','pullbar','dipbar','box','seat','cable','rack','deficit']){
 const def={...(FigTpl[scene]||FigTpl[scene==='incbench'?'incline':scene==='pullbar'?'pullup':scene==='dipbar'?'dips':scene==='box'?'stepup':scene==='seat'?'legext':scene==='cable'?'pushdown':scene==='rack'?'rackpull':'defdl']),scene};
 const J=FigLib.frame(def,FigLib.sample(def,4)[0]).J;eq.update(J,def,rig);
 const support=eq.group.getObjectByName('support-'+scene);assert(support,'support '+scene+' contains geometry');
 let count=0;support.traverse(o=>{if(o.isMesh)count++;});assert(count>=2,scene+' visible structure');
 const bb=new THREE.Box3().setFromObject(support);assert(bb.min.toArray().concat(bb.max.toArray()).every(Number.isFinite));assert(bb.min.y>=-1e-6,scene+' grounded');
 const before=support.position.clone();rig.bones.pelvis.position.y+=.05;eq.update(J,def,rig);assert(support.position.distanceTo(before)<1e-9,scene+' static not riding pelvis');
 if(scene==='bench'){const pad=support.getObjectByName('pad'),box=new THREE.Box3().setFromObject(pad);assert(Math.abs(box.max.y-(26-3)*(.8/48))<1e-6,'bench top normalized actual leg length not legacy .045');}
 if(scene==='incbench'){const back=support.getObjectByName('back');assert(back.position.z<0,'incline back rises behind hip, not toward feet');}
 if(scene==='cable'){const cable=support.getObjectByName('cable'),anchor=new THREE.Vector3().fromArray(cable.userData.anchor),end=rig.bones.hand_l.getWorldPosition(new THREE.Vector3()).add(rig.bones.hand_r.getWorldPosition(new THREE.Vector3())).multiplyScalar(.5);assert(cable.getWorldPosition(new THREE.Vector3()).distanceTo(anchor.add(end).multiplyScalar(.5))<1e-9,'cable endpoint follows both hands');}
}
// In-family changes reset support instead of retaining prior exercise anchor.
const d1={...FigTpl.pullup,_template:'pullup'},j1=FigLib.frame(d1,FigLib.sample(d1,2)[0]).J;eq.update(j1,d1,rig);const prior=eq.group.getObjectByName('support-pullbar');
const d2={...d1,o:{a1:100}};eq.update(j1,d2,rig);assert.notEqual(eq.group.getObjectByName('support-pullbar'),prior,'new override resets static support');
const oldGeos=[];eq.group.traverse(o=>{if(o.geometry)oldGeos.push(o.geometry);});let resetDisposals=0;for(const g of oldGeos)g.addEventListener('dispose',()=>resetDisposals++);eq.update(null,{},rig);assert.equal(resetDisposals,oldGeos.length,'switch disposes every old geometry');
eq.update(null,{prop:{k:'bar'}},{root:rig.root,bones:{}});assert.equal(eq.group.getObjectByName('bar').visible,false,'missing bones hide load');
eq.update(null,{prop:{k:'bar'}},null);assert.equal(eq.group.visible,false,'missing rig hides all');
// Same scene with changed per-exercise placement must rebuild support.
let def={scene:'seat',fix:{y:['hip',24]}};eq.update(null,def,rig);let top=new THREE.Box3().setFromObject(eq.group.getObjectByName('pad')).max.y;
def={scene:'seat',fix:{y:['hip',32]}};eq.update(null,def,rig);assert(new THREE.Box3().setFromObject(eq.group.getObjectByName('pad')).max.y>top+.1,'changed fix changes support');
let disposedGeometry=0,disposedMaterial=0;eq.group.traverse(o=>{if(o.geometry)o.geometry.addEventListener('dispose',()=>disposedGeometry++);if(o.material)o.material.addEventListener('dispose',()=>disposedMaterial++);});
eq.dispose();assert(disposedGeometry>0);assert(disposedMaterial>0);assert.equal(eq.group.children.length,0);eq.dispose();eq.update(null,{prop:{k:'bar'}},rig);assert.equal(eq.group.children.length,0,'disposed factory stays inert');
console.log('PASS nine static supports / metric scale / incline direction / per-definition fix / disposal');
const vm=require('node:vm'),base=path.resolve(__dirname,'..'),out=path.join(base,'docs/analysis/exercise-human-rollout/equipment');fs.mkdirSync(out,{recursive:true});
const ctx={console,setInterval:()=>0,clearInterval:()=>{},document:{addEventListener:()=>{}},S:{customEx:[]}};vm.createContext(ctx);
for(const f of ['exlib','balance','figlib','figtpl','excues','gym','exui'])vm.runInContext(fs.readFileSync(path.join(base,'www/modules/gym/'+f+'.js'),'utf8'),ctx);
const catalog=JSON.parse(vm.runInContext('JSON.stringify(EXDB.map(e=>({exercise:e,def:exDef(e)})))',ctx));
assert.equal(catalog.length,332,'current shipping catalog count');
const cjs=require('../www/modules/gym/exlib.js');require('../www/modules/gym/balance.js');assert.deepEqual(catalog.map(x=>x.exercise),JSON.parse(JSON.stringify(cjs)),'VM catalog equals CommonJS append');
global.self=globalThis;global.createImageBitmap=async()=>({width:1,height:1,close(){}});
const {GLTFLoader}=await import('three/examples/jsm/loaders/GLTFLoader.js');
const model=process.env.HUMAN_RIG_MODEL||'D:/PROJECT/NeoWell-exercise-pilot/neutral/neutral-human-viewer.glb',bytes=fs.readFileSync(model);
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const realRig=require('../www/modules/gym/human-rig.js').create(THREE,gltf.scene,JSON.parse(fs.readFileSync(path.join(base,'www/modules/gym/human-hand-support.json'),'utf8')));
const real=API.create(THREE),records=[];
for(const {exercise:e,def:d}of catalog){
 const def={...d,_template:e.tp},poses=FigLib.sample(def,2),samples=[];
 for(let i=0;i<poses.length;i++){
  const J=FigLib.frame(def,poses[i]).J;realRig.pose(J,def,i/2);real.update(J,def,realRig);
  let meshes=0;real.group.traverse(o=>{if(o.isMesh){meshes++;assert(o.matrixWorld.elements.every(Number.isFinite),e.id+' matrix');}});
  const bounds=new THREE.Box3().setFromObject(real.group);if(meshes)assert(bounds.min.toArray().concat(bounds.max.toArray()).every(Number.isFinite),e.id+' actual skin equipment bounds');
  if(d.prop){assert(real.group.getObjectByName(d.prop.k),e.id+' effective prop');
   if(d.prop.k==='bar'){const a=realRig.bones[d.prop.at==='shoulder'?'upperarm_l':'hand_l'].getWorldPosition(new THREE.Vector3()),b=realRig.bones[d.prop.at==='shoulder'?'upperarm_r':'hand_r'].getWorldPosition(new THREE.Vector3());assert(real.group.getObjectByName('shaft').getWorldPosition(new THREE.Vector3()).distanceTo(a.add(b).multiplyScalar(.5))<1e-8,e.id+' actual bar bones');}
  }
  samples.push({phase:i/2,meshes,bounds:meshes?[bounds.min.toArray(),bounds.max.toArray()]:null,floorCorrection:realRig.status.floorCorrection||0});
 }
 const reasons=['Katalogda kesin ekipman/grip ve biomekanik kimlik metadatası yok; ad eşlemesi inceleme adayıdır.'];
 if(d.scene&&['bench','incbench','seat','box','rack','deficit'].includes(d.scene))reasons.push('Sabit destek ile deforme deri teması/penetrasyonu ve rig floorCorrection farkı görsel/skin incelemesi gerektirir.');
 if(d.scene&&['pullbar','dipbar'].includes(d.scene))reasons.push('Destek ilk örnekte sabitlenir; tüm fazlarda gerçek el yüzeyi temas çözümü yok.');
 if(d.prop&&['kb','ball'].includes(d.prop.k))reasons.push('Tek ortak nesne iki bilek ortalamasında; iki avuç yüzeyi/grip mesafesi doğrulanmadı.');
 if(/tek|single|one.arm|alternat|dönüşümlü/i.test(e.n)&&d.prop&&d.prop.k==='db')reasons.push('İki dambıl üretilir; unilateral/alternating ekipman sayısı katalogda açık değil.');
 if(/makine|machine|smith|kablo|cable|bant|band|bisiklet|cycling/i.test(e.n))reasons.push('Ad özel makine/bant/cable mekanizması adayını gösteriyor; template ekipmanı tam cihaz simülasyonu değil.');
 if(/front|ön squat|zercher/i.test(e.n)&&d.prop&&d.prop.at==='shoulder')reasons.push('Ön/arka rack ayrımı yok; omuz kemiği ortalaması grip/yük yerleşimi kabulü değil.');
 records.push({id:e.id,name:e.n,template:e.tp,rawProp:e.pr||null,effectiveProp:d.prop||null,scene:d.scene||null,reviewStatus:'candidate-not-anatomical-acceptance',reasons,samples});
}
assert.equal(new Set(records.map(x=>x.id)).size,catalog.length);
const report={count:records.length,phases:3,model,modelSha256:require('node:crypto').createHash('sha256').update(bytes).digest('hex'),records};
fs.writeFileSync(path.join(out,'catalog-review.json'),JSON.stringify(report,null,2)+'\n');real.dispose();
console.log('PASS '+records.length+' shipping IDs / actual approved GLB / 3 phases / finite geometry / exact bar anchor; semantic review candidates persisted');
// Browser script contract, independent from CommonJS.
const browser={};vm.createContext(browser);vm.runInContext(fs.readFileSync(modulePath,'utf8'),browser);assert.equal(typeof browser.HumanEquipment.create,'function');
console.log('PASS browser UMD export');
// Behavioral mutation: obsolete .045 support scale must fail metric bench gate.
const source=fs.readFileSync(modulePath,'utf8');assert(source.includes('return length>1e-5?length/48:.8/48;'),'mutation seam exists');
const mutated={module:{exports:{}}};vm.createContext(mutated);vm.runInContext(source.replace('return length>1e-5?length/48:.8/48;','return .045;'),mutated);
const bad=mutated.module.exports.create(THREE);bad.update(null,{scene:'bench',fix:{y:['hip',26]}},fixture());
const badTop=new THREE.Box3().setFromObject(bad.group.getObjectByName('pad')).max.y;assert(Math.abs(badTop-23*(.8/48))>.5,'legacy-scale mutation rejected by actual bench bounds');bad.dispose();
console.log('PASS legacy-scale behavioral mutation rejected');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
