"use strict";
// Real GLTFLoader/geometry/material boundary. Only bitmap decoding is stubbed (no WebGL).
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),evidence=path.join(root,'docs/analysis/exercise-human-rollout/muscles');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const approvedHash='947f9b100d6fc5130ad264b895d3b824a2bc5a917ba271cf0a51a41133c63b21';
function pilotRegion(p,n,i){
 const x=Math.abs(p.getX(i)),y=p.getY(i),z=p.getZ(i),nz=n.getZ(i);
 const chest=((x-.105)/.105)**2+((y-1.355)/.115)**2<1&&z>.085&&nz>.05;
 const deltoid=((x-.205)/.065)**2+((y-1.39)/.095)**2<1&&z>.045&&nz>.05;
 const triceps=((x-(.22+(1.34-y)*.72))/.073)**2+((y-1.26)/.135)**2<1&&z<.045&&nz<-.08;
 return deltoid?'frontDeltoid':chest?'chest':triceps?'triceps':null;
}
async function main(){
 fs.mkdirSync(evidence,{recursive:true});
 const model=process.env.HUMAN_MUSCLES_MODEL||[path.join(root,'www/models/athletic-human.glb'),'D:/PROJECT/NeoWell-exercise-pilot/neutral/neutral-human-viewer.glb'].find(fs.existsSync);
 global.self=globalThis;global.createImageBitmap=async()=>({width:1,height:1,close(){}});
 const THREE=await import('three'),{GLTFLoader}=await import('three/examples/jsm/loaders/GLTFLoader.js');
 const bytes=fs.readFileSync(model);assert.equal(hash(bytes),approvedHash,'approved GLB hash');
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const body=gltf.scene.getObjectByName('AthleticMaleBody');assert(body?.isSkinnedMesh,'actual approved body');
 const p=body.geometry.attributes.position,n=body.geometry.attributes.normal;
 const expected=Array.from({length:p.count},(_,i)=>pilotRegion(p,n,i));
 const counts={chest:0,triceps:0,frontDeltoid:0};expected.forEach(r=>{if(r)counts[r]++;});
 console.log('Actual GLB',approvedHash,'vertices',p.count,'pilot masks',counts);
 const modulePath=path.join(root,'www/modules/gym/human-muscles.js');
 assert(fs.existsSync(modulePath),'HumanMuscles feature must exist after real approved GLB parse');
 let source=fs.readFileSync(modulePath,'utf8');
 const mutations={
  'pilot':['(x-.105)/.105','(x-.105)/.05'],
  'biceps-chest':["'Biseps':['biceps']","'Biseps':['chest']"],
  'composite':['text.split(/[,;+\\/|&]+/)','text.split(/[,;+\\/|&]+/).slice(0,1)'],
  'whole-body':["else warnings.push('UNSUPPORTED_REGION:'+region);","else primary.push('chest');"],
  'forearm-hand-leak':['x>.37&&x<.465&&y>1.12&&z>.07&&z<.195','x>.37&&z>.07'],
  'no-reset':['else body.geometry.deleteAttribute(\'color\');','else {}']
 };
 if(process.env.HUMAN_MUSCLES_MUTATION){const pair=mutations[process.env.HUMAN_MUSCLES_MUTATION];assert(pair&&source.includes(pair[0]),'exact mutation seam');source=source.replace(pair[0],pair[1]);}
 const compiled=new module.constructor();compiled._compile(source,modulePath);
 const api=process.env.HUMAN_MUSCLES_MUTATION?compiled.exports:require(modulePath);assert.equal(typeof api.apply,'function');assert.equal(typeof api.describe,'function');
 const attributes={...body.geometry.attributes},attributeHashes=Object.fromEntries(Object.entries(body.geometry.attributes).map(([k,a])=>[k,hash(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength))])),material=body.material,color=material.color.clone(),map=material.map;
 const materialProperties={emissive:material.emissive.toArray(),roughness:material.roughness,metalness:material.metalness,normalMap:material.normalMap,side:material.side};
 const otherMaterials=[];gltf.scene.traverse(o=>{if(o.isMesh&&o!==body)otherMaterials.push([o,o.material,o.material.opacity,o.material.transparent,o.material.depthWrite]);});
 const stats=api.apply(THREE,body,{id:'pushup',tp:'pushup',r:'Göğüs',g:'İtiş'});
 assert.deepEqual(stats.counts,counts,'exact approved pilot region counts');
 const red=new THREE.Color('#ff202d'),orange=new THREE.Color('#ff8a16'),white=new THREE.Color('#ffffff');
 for(let i=0;i<p.count;i++){
  const c=expected[i]?(expected[i]==='chest'?red:orange):white;
  assert(Math.abs(body.geometry.attributes.color.getX(i)-c.r)<1e-7&&Math.abs(body.geometry.attributes.color.getY(i)-c.g)<1e-7&&Math.abs(body.geometry.attributes.color.getZ(i)-c.b)<1e-7,`exact pilot color ${i}`);
 }
 for(const k of Object.keys(attributes))assert.equal(body.geometry.attributes[k],attributes[k],`original ${k} accessor retained`);
 assert.equal(body.material,material);assert(material.color.equals(color),'baseColor retained without double skin tint');assert.equal(material.map,map,'original skin texture retained');
 assert.equal(material.transparent,false);assert.equal(material.opacity,1);assert.equal(material.depthWrite,true);
 console.log('PASS exact pilot masks/colors, original GLB accessors/material/baseColor/map, opaque body');
 // Execute shipping script order + actual exDef, rather than a copied catalog fixture.
 const context={setInterval(){}};vm.createContext(context);
 for(const file of ['exlib','balance','figtpl','exui'])vm.runInContext(fs.readFileSync(path.join(root,'www/modules/gym',file+'.js'),'utf8'),context,{filename:file+'.js'});
 const rows=JSON.parse(vm.runInContext('JSON.stringify(EXDB.map(e=>({exercise:e,definition:exDef(e)})))',context));
 assert.equal(rows.length,332);assert.equal(new Set(rows.map(r=>r.exercise.id)).size,rows.length);
 const coverage=[];
 for(const {exercise:e,definition} of rows){
  assert(definition?.frames?.length,`actual exDef ${e.id}`);
  const result=api.apply(THREE,body,e);
  if(e.r==='Tüm vücut'){
   assert.equal(result.total,0,`broad metadata is not anatomical recruitment: ${e.id}`);
   assert(result.warnings.includes('UNSUPPORTED_REGION:Tüm vücut'));
  }else{
   assert(result.total>10,`known catalog region meaningful mask: ${e.id} ${e.r}`);
   assert.equal(result.warnings.length,0,`supported ${e.id}: ${result.warnings}`);
   for(const r of result.primary){
    assert(result.counts[r]>10,`nonzero individual mask ${e.id}/${r}`);
    assert(result.sides[r].left>3&&result.sides[r].right>3,`bilateral ${e.id}/${r}`);
   }
   if(e.id!=='pushup')assert.equal(result.secondary.length,0,`do not invent secondary recruitment ${e.id}`);
  }
  coverage.push({id:e.id,r:e.r,g:e.g,tp:e.tp,primary:result.primary,secondary:result.secondary,counts:result.counts,sides:result.sides,total:result.total,warnings:result.warnings});
 }
 // Independent coarse engineering envelopes, not copied ellipse predicates.
 // Verify selected rendered vertices, never trusting the reported counts alone.
 const envelopes={
  'Göğüs':(x,y,z,nx,nz)=>x<.21&&y>1.24&&y<1.47&&z>.085&&nz>.05,
  'Biseps':(x,y,z,nx,nz)=>x>.245&&x<.40&&y>1.15&&y<1.38&&nz>.15,
  'Triseps':(x,y,z,nx,nz)=>x>.15&&x<.46&&y>1.12&&y<1.40&&nz<-.08,
  'Ön kol':(x,y,z,nx,nz)=>x>.37&&x<.465&&y>1.12&&y<1.22&&Math.abs(nz)>.15,
  'Ön bacak':(x,y,z,nx,nz)=>x>.035&&x<.23&&y>.47&&y<.85&&nz>.15,
  'Arka bacak':(x,y,z,nx,nz)=>x>.035&&x<.23&&y>.50&&y<.85&&nz<-.15,
  'Kalça':(x,y,z,nx,nz)=>x<.22&&y>.78&&y<1.01&&nz<-.15,
  'Baldır':(x,y,z,nx,nz)=>x>.095&&x<.25&&y>.19&&y<.50&&nz<-.15,
  'İç-dış bacak':(x,y,z,nx,nz)=>x<.23&&y>.62&&y<.96,
  'Omuz':(x,y,z,nx,nz)=>x>.14&&x<.30&&y>1.29&&y<1.52&&(Math.abs(nz)>.08||Math.abs(nx)>.4),
  'Karın':(x,y,z,nx,nz)=>x<.10&&y>1.00&&y<1.29&&nz>.3,
  'Sırt':(x,y,z,nx,nz)=>x<.19&&y>1.09&&y<1.48&&nz<-.2,
  'Bel':(x,y,z,nx,nz)=>x<.115&&y>.96&&y<1.20&&nz<-.2,
  'Trapez':(x,y,z,nx,nz)=>x<.17&&y>1.37&&y<1.55&&nz<-.15,
  'Boyun':(x,y,z,nx,nz)=>x<.06&&y>1.46&&y<1.57&&nz>.1
 };
 for(const [region,inside] of Object.entries(envelopes)){
  const s=api.apply(THREE,body,{r:region}),a=body.geometry.attributes.color;let selected=0,left=0,right=0;
  for(let i=0;i<p.count;i++)if(a.getY(i)<.9){
   selected++;if(p.getX(i)>0)left++;else right++;
   assert(inside(Math.abs(p.getX(i)),p.getY(i),p.getZ(i),n.getX(i),n.getZ(i)),`independent local envelope / no limb leak ${region} vertex ${i}`);
  }
  assert.equal(selected,s.total,`reported count equals actual colors ${region}`);assert(left>3&&right>3);
 }
 console.log('PASS all 15 named catalog regions actual colors / bilateral / normals / no limb leaks');
 // Changes must clear prior colors, preserve all other mesh accessors and never touch accessories.
 const originalVertexColors=attributes.color?true:false;
 api.apply(THREE,body,{r:'Biseps'});const firstColors=body.geometry.attributes.color;
 const firstBytes=Buffer.from(firstColors.array.buffer).toString('hex');
 api.apply(THREE,body,{r:'Biseps'});
 assert.equal(body.geometry.attributes.color,firstColors,'stable color attribute reused on repeated application');
 assert.equal(Buffer.from(firstColors.array.buffer).toString('hex'),firstBytes,'same exercise idempotent values');
 assert.equal(api.describe({r:'Biseps'}).primary.includes('chest'),false);
 const highlighted=[];for(let i=0;i<p.count;i++)if(firstColors.getY(i)<.9)highlighted.push(i);
 assert(highlighted.length>10);assert(highlighted.every(i=>Math.abs(p.getX(i))>.245&&p.getY(i)>1.15&&p.getY(i)<1.38&&n.getZ(i)>.15),'biceps never chest, legs, back arm');
 for(const e of [{},{r:'unknown'},{r:'Tüm vücut',g:'Bacak'},{r:'constructor'},{r:'__proto__'}]){
  const s=api.apply(THREE,body,e);assert.equal(s.total,0);assert(s.warnings.length);
  assert(Array.from(body.geometry.attributes.color.array).every(v=>v===1),'unknown clears every old highlight');
 }
 for(const separator of [',',';','+','/','|','&']){
  const s=api.apply(THREE,body,{r:'Göğüs'+separator+'Biseps'+separator+'Arka bacak'});
  assert.deepEqual(s.primary,['chest','biceps','hamstrings']);assert(s.counts.chest>10&&s.counts.biceps>10&&s.counts.hamstrings>10,'composites not else-if');
 }
 assert.deepEqual(api.describe({g:'Biseps'}).primary,['biceps'],'explicit region-valued legacy g fallback');
 assert.deepEqual(api.describe({r:'Nope',g:'Biseps'}).primary,[],'unknown r never broadened by g fallback');
 assert.equal(typeof api.reset,'function');api.reset(THREE,body);
 assert.equal(body.geometry.attributes.color,attributes.color,'reset restores exact original color accessor / absence');
 assert.equal(body.material.vertexColors,originalVertexColors,'reset restores original vertexColors');
 for(const [k,a] of Object.entries(attributes)){assert.equal(body.geometry.attributes[k],a);assert.equal(hash(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength)),attributeHashes[k],`accessor bytes unchanged ${k}`);}
 assert.deepEqual({emissive:material.emissive.toArray(),roughness:material.roughness,metalness:material.metalness,normalMap:material.normalMap,side:material.side},materialProperties,'no emissive/material replacement');
 assert.equal(api.reset(THREE,body),false,'reset twice harmless');
 for(const [o,m,opacity,transparent,depthWrite] of otherMaterials){assert.equal(o.material,m);assert.equal(m.opacity,opacity);assert.equal(m.transparent,transparent);assert.equal(m.depthWrite,depthWrite);}
 const plain=body.clone();plain.geometry=body.geometry.clone();
 const shifted=plain.geometry.attributes.position.clone();for(let i=0;i<shifted.count;i++)shifted.setY(i,shifted.getY(i)+10);plain.geometry.setAttribute('position',shifted);
 const empty=api.apply(THREE,plain,{r:'Göğüs'});assert.equal(empty.total,0);assert(empty.warnings.includes('EMPTY_MASK:chest'),'unsupported body ranges explicit, not silently successful');api.reset(THREE,plain);
 const browserContext={};vm.createContext(browserContext);vm.runInContext(fs.readFileSync(modulePath,'utf8'),browserContext);assert.equal(typeof browserContext.HumanMuscles.apply,'function','standalone UMD browser global');
 assert(api.apply(THREE,null,{r:'Göğüs'}).warnings.includes('UNSUPPORTED_BODY'));
 console.log('PASS UMD / composite / unknown / reset / idempotency / base attrs / accessories unchanged');
 console.log('PASS runtime catalog',rows.length,'actual exDef + region coverage; explicit unsupported broad metadata');
 fs.writeFileSync(path.join(evidence,'catalog-coverage.json'),JSON.stringify(coverage,null,2));
 fs.writeFileSync(path.join(evidence,'result.json'),JSON.stringify({model,hash:approvedHash,vertices:p.count,pilot:counts,runtimeCount:rows.length,supported:coverage.filter(r=>r.total>0).length,unsupported:coverage.filter(r=>!r.total).length},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
