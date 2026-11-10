/* Illustrative, hand-authored bind-local surface patches; NOT anatomical segmentation.
 * Preserves approved pilot skin/material and push-up masks. See analysis/muscles README.
 */
(function(root,factory){
 'use strict';
 var api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HumanMuscles=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 var COLORS={primary:'#ff202d',secondary:'#ff8a16'},states=new WeakMap();
 function reset(THREE,body){
  var state=body&&states.get(body);
  if(!state)return false;
  if(state.originalColor)body.geometry.setAttribute('color',state.originalColor);else body.geometry.deleteAttribute('color');
  state.material.vertexColors=state.vertexColors;
  state.material.transparent=state.transparent;state.material.opacity=state.opacity;state.material.depthWrite=state.depthWrite;state.material.needsUpdate=true;
  states.delete(body);return true;
 }
 function pilotRegion(x,y,z,nz){
  var chest=((x-.105)/.105)**2+((y-1.355)/.115)**2<1&&z>.085&&nz>.05;
  var deltoid=((x-.205)/.065)**2+((y-1.39)/.095)**2<1&&z>.045&&nz>.05;
  var triceps=((x-(.22+(1.34-y)*.72))/.073)**2+((y-1.26)/.135)**2<1&&z<.045&&nz<-.08;
  return deltoid?'frontDeltoid':chest?'chest':triceps?'triceps':null;
 }
 // Bind-local metres for the pinned neutral model only. No skinWeight/bone input.
 function ellipse(x,y,cx,cy,rx,ry){return ((x-cx)/rx)**2+((y-cy)/ry)**2<1;}
 var masks={
  chest:function(x,y,z,nx,ny,nz){return pilotRegion(x,y,z,nz)==='chest';},
  triceps:function(x,y,z,nx,ny,nz){return pilotRegion(x,y,z,nz)==='triceps';},
  frontDeltoid:function(x,y,z,nx,ny,nz){return pilotRegion(x,y,z,nz)==='frontDeltoid';},
  deltoids:function(x,y,z,nx,ny,nz){return ellipse(x,y,.218,1.405,.072,.105)&&z>-.055&&z<.105&&(Math.abs(nz)>.08||Math.abs(nx)>.4);},
  biceps:function(x,y,z,nx,ny,nz){return ellipse(x,y,.22+(1.34-y)*.72,1.265,.065,.105)&&x>.245&&z>.035&&nz>.15;},
  forearms:function(x,y,z,nx,ny,nz){return ellipse(x,y,.425,1.16,.065,.065)&&x>.37&&x<.465&&y>1.12&&z>.07&&z<.195&&Math.abs(nz)>.15;},
  quadriceps:function(x,y,z,nx,ny,nz){return ellipse(x,y,.128,.655,.089,.185)&&x>.035&&z>.035&&nz>.15;},
  hamstrings:function(x,y,z,nx,ny,nz){return ellipse(x,y,.128,.675,.084,.165)&&x>.035&&z<.035&&nz<-.15;},
  glutes:function(x,y,z,nx,ny,nz){return ellipse(x,y,.103,.895,.105,.108)&&x>.01&&z<-.015&&nz<-.15;},
  calves:function(x,y,z,nx,ny,nz){return ellipse(x,y,.17,.345,.069,.145)&&x>.095&&z<.035&&nz<-.15;},
  adductors:function(x,y,z,nx,ny,nz){return ellipse(x,y,.06,.745,.045,.12)&&x>.015&&z>-.025&&z<.11&&(nx<-.1||nz>.3);},
  abductors:function(x,y,z,nx,ny,nz){return ellipse(x,y,.18,.845,.045,.105)&&x>.15&&z>-.045&&z<.105&&nx>.25;},
  abdominals:function(x,y,z,nx,ny,nz){return ellipse(x,y,.035,1.14,.085,.14)&&x<.10&&z>.10&&nz>.3;},
  lats:function(x,y,z,nx,ny,nz){return ellipse(x,y,.115,1.24,.065,.145)&&x>.065&&z<.015&&nz<-.2;},
  upperBack:function(x,y,z,nx,ny,nz){return ellipse(x,y,.065,1.37,.09,.105)&&z<-.015&&nz<-.2;},
  lowerBack:function(x,y,z,nx,ny,nz){return ellipse(x,y,.05,1.08,.075,.12)&&x<.115&&z<.015&&nz<-.2;},
  trapezius:function(x,y,z,nx,ny,nz){return ellipse(x,y,.055,1.46,.105,.085)&&z<.015&&nz<-.15;},
  neck:function(x,y,z,nx,ny,nz){return ellipse(x,y,.025,1.515,.04,.047)&&x<.06&&z>.015&&nz>.1;}
 };
 var regionMap={
  'Göğüs':['chest'],'Omuz':['deltoids'],'Biseps':['biceps'],'Triseps':['triceps'],
  'Ön kol':['forearms'],'Ön bacak':['quadriceps'],'Arka bacak':['hamstrings'],
  'Kalça':['glutes'],'Baldır':['calves'],'İç-dış bacak':['adductors','abductors'],
  'Karın':['abdominals'],'Sırt':['lats','upperBack'],'Bel':['lowerBack'],
  'Trapez':['trapezius'],'Boyun':['neck']
 };
 function describe(exercise){
  var e=exercise||{},primary=[],secondary=[],warnings=[];
  // Only exact approved pilot has explicit secondary role evidence. Template reuse
  // alone does NOT establish exercise-specific recruitment for the other records.
  if(e.id==='pushup'&&e.tp==='pushup'&&e.r==='Göğüs'){
   primary=['chest'];secondary=['triceps','frontDeltoid'];
  }else{
   var text=typeof e.r==='string'&&e.r.trim()?e.r:typeof e.g==='string'?e.g:'';
   if(!text.trim())warnings.push('MISSING_MUSCLE_METADATA');
   text.split(/[,;+\/|&]+/).map(function(s){return s.trim();}).filter(Boolean).forEach(function(region){
    if(Object.prototype.hasOwnProperty.call(regionMap,region))regionMap[region].forEach(function(r){if(primary.indexOf(r)<0)primary.push(r);});
    else warnings.push('UNSUPPORTED_REGION:'+region);
   });
  }
  return {primary:primary,secondary:secondary,warnings:warnings,illustrative:true,source:secondary.length?'approved-pushup-pilot':'catalog-region',validatedAnatomy:false};
 }
 function apply(THREE,body,exercise){
  var info=describe(exercise),counts={},sides={},warnings=info.warnings.slice();
  if(!body||!body.geometry||!body.geometry.attributes.position||!body.geometry.attributes.normal||!body.material||Array.isArray(body.material)){
   warnings.push('UNSUPPORTED_BODY');return Object.assign({},info,{counts:counts,sides:sides,total:0,warnings:warnings});
  }
  var p=body.geometry.attributes.position,n=body.geometry.attributes.normal,state=states.get(body);
  if(!state){
   state={originalColor:body.geometry.attributes.color,material:body.material,vertexColors:body.material.vertexColors,transparent:body.material.transparent,opacity:body.material.opacity,depthWrite:body.material.depthWrite,attribute:new THREE.BufferAttribute(new Float32Array(p.count*3),3)};
   states.set(body,state);
  }
  var colors=state.attribute.array;
  var primary=new THREE.Color(COLORS.primary),secondary=new THREE.Color(COLORS.secondary),white=new THREE.Color('#ffffff'),total=0;
  info.primary.concat(info.secondary).forEach(function(r){counts[r]=0;sides[r]={left:0,right:0};});
  for(var i=0;i<p.count;i++){
   var x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=n.getX(i)*(x>=0?1:-1),ny=n.getY(i),nz=n.getZ(i),r=null,role=null;
   var roleNames=['primary','secondary'];
   for(var a=0;a<roleNames.length&&!r;a++)for(var b=0;b<info[roleNames[a]].length;b++){
    var candidate=info[roleNames[a]][b];
    if(masks[candidate](Math.abs(x),y,z,nx,ny,nz)){r=candidate;role=roleNames[a];break;}
   }
   var c=role?(role==='primary'?primary:secondary):white;
   if(role){counts[r]++;sides[r][x>=0?'left':'right']++;total++;}
   colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;
  }
  Object.keys(counts).forEach(function(r){if(!counts[r])warnings.push('EMPTY_MASK:'+r);});
  body.geometry.setAttribute('color',state.attribute);state.attribute.needsUpdate=true;
  body.material.vertexColors=true;body.material.transparent=false;body.material.opacity=1;body.material.depthWrite=true;body.material.needsUpdate=true;
  return Object.assign({},info,{counts:counts,sides:sides,total:total,warnings:warnings});
 }
 return {apply:apply,describe:describe,reset:reset,colors:COLORS};
});
