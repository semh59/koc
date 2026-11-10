/* Meter-space equipment. Call update AFTER rig.pose; add group beside rig.root. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.HumanEquipment=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function create(THREE){
  const group=new THREE.Group();group.name='human-equipment';
  const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),up=V(0,1,0);
  const steel=new THREE.MeshStandardMaterial({color:0xabb8c9,metalness:.8,roughness:.28});
  const rubber=new THREE.MeshStandardMaterial({color:0x263341,metalness:.15,roughness:.72});
  const geometries=new Set(),materials=new Set([steel,rubber]);let key='',disposed=false;
  function mesh(parent,name,geometry,material){geometries.add(geometry);const m=new THREE.Mesh(geometry,material);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function cylinder(parent,name,radius,length,material){return mesh(parent,name,new THREE.CylinderGeometry(radius,radius,length,20),material);}
  function makeBar(){const g=new THREE.Group();g.name='bar';group.add(g);cylinder(g,'shaft',.014,1,steel);for(const sign of [-1,1])cylinder(g,sign<0?'plate-left':'plate-right',.19,.065,rubber);return g;}
  let bar,load,support,cable;
  function box(parent,name,width,height,depth,material,x=0,y=0,z=0){const m=mesh(parent,name,new THREE.BoxGeometry(width,height,depth),material);m.position.set(x,y,z);return m;}
  function rod(parent,name,a,b,radius=.022,material=steel){const d=b.clone().sub(a),length=d.length();const m=cylinder(parent,name,radius,Math.max(length,1e-6),material);m.position.copy(a).add(b).multiplyScalar(.5);if(length>1e-8)m.quaternion.setFromUnitVectors(up,d.normalize());return m;}
  function metricScale(rig){const a=point(rig,'thigh_l'),b=point(rig,'calf_l'),c=point(rig,'foot_l');const length=a&&b&&c?a.distanceTo(b)+b.distanceTo(c):.8;return length>1e-5?length/48:.8/48;}
  function makeSupport(J,def,rig,s){
   const sc=def.scene;if(!['bench','incbench','pullbar','dipbar','box','seat','cable','rack','deficit'].includes(sc))return null;
   const g=new THREE.Group();g.name='support-'+sc;group.add(g);
   const hipH=def.fix&&def.fix.y&&def.fix.y[0]==='hip'?def.fix.y[1]:sc==='seat'?27:26;
   const top=Math.max(.10,(hipH-3)*s),pad=.055,width=.32;
   function legs(z1,z2,h){for(const z of [z1,z2]){box(g,'leg',.055,Math.max(.01,h-pad),.055,steel,0,(h-pad)/2,z);box(g,'foot',.46,.035,.09,steel,0,.0175,z);}}
   if(sc==='bench'){box(g,'pad',width,pad,68*s,rubber,0,top-pad/2,-4*s);legs(-28*s,22*s,top);}
   if(sc==='seat'||sc==='incbench'){
    box(g,'pad',width,pad,(sc==='seat'?24:26)*s,rubber,0,top-pad/2,-8*s);legs(-16*s,2*s,top);
    // Backrest rises posteriorly in sagittal world Z; schematic's +Z would face knees.
    const a=V(0,top-pad/2,-18*s),b=V(0,top+(sc==='seat'?42:30)*s,-(sc==='seat'?20:44)*s),d=b.clone().sub(a);
    const back=box(g,'back',width,d.length(),pad,rubber);back.position.copy(a).add(b).multiplyScalar(.5);back.quaternion.setFromUnitVectors(up,d.normalize());
   }
   if(sc==='pullbar'||sc==='dipbar'){
    const a=point(rig,'hand_l'),b=point(rig,'hand_r'),height=a&&b?(a.y+b.y)/2:((def.fix&&def.fix.y&&def.fix.y[1])||110)*s;
    const z=a&&b?(a.z+b.z)/2:0,span=Math.max(.55,a&&b?Math.abs(a.x-b.x):.55);
    if(sc==='pullbar'){
     rod(g,'grip',V(-span/2-.18,height,z),V(span/2+.18,height,z),.015);
     for(const sign of [-1,1]){rod(g,'upright',V(sign*(span/2+.18),.025,z+.18),V(sign*(span/2+.18),height,z+.18));rod(g,'cross-arm',V(sign*(span/2+.18),height,z+.18),V(sign*(span/2+.18),height,z));box(g,'base',.12,.05,.75,steel,sign*(span/2+.18),.025,z+.18);}
    }else for(const sign of [-1,1]){const x=sign*span/2;rod(g,'grip-'+sign,V(x,height,z-.32),V(x,height,z+.32),.018);for(const zz of [z-.25,z+.25])rod(g,'upright',V(x,.025,zz),V(x,height,zz));box(g,'base',.22,.05,.8,steel,x,.025,z);}
   }
   if(sc==='box'||sc==='deficit'){
    const footH=def.frames&&def.frames[0]&&def.frames[0].feet&&def.frames[0].feet[0][1];
    const h=(sc==='box'?22:Number.isFinite(footH)?footH:10.3)*s,depth=(sc==='box'?34:22)*s,z=sc==='box'?23*s:4*s;
    box(g,'platform',.50,Math.max(.01,h-.025),depth,steel,0,Math.max(.01,h-.025)/2,z);box(g,'pad',.50,.025,depth,rubber,0,h-.0125,z);
   }
   if(sc==='rack'){
    const h=(136-(Number.isFinite(def.rackY)?def.rackY:104))*s,z=38*s;
    for(const sign of [-1,1]){box(g,'upright',.05,1.7,.05,steel,sign*.65,.85,z);box(g,'base',.18,.04,.8,steel,sign*.65,.02,z);box(g,'cup',.07,.045,.24,steel,sign*.65,Math.max(.06,h)-.0225,z-.10);}
    rod(g,'crossbar',V(-.65,1.65,z),V(.65,1.65,z));
   }
   if(sc==='cable'){
    const z=46*s,h=126*s,y=Math.max(.08,(136-(Number.isFinite(def.cableY)?def.cableY:24))*s);
    box(g,'tower',.10,h,.10,steel,0,h/2,z);box(g,'weight-stack',.25,.65,.24,rubber,0,.325,z);box(g,'base',.65,.05,.55,steel,0,.025,z);
    const wheel=cylinder(g,'pulley',.065,.04,steel);wheel.position.set(0,y,z);wheel.rotation.z=Math.PI/2;
    cable=rod(g,'cable',V(0,y,z),V(0,y,z-.2),.005,rubber);cable.userData.anchor=[0,y,z];
   }
   return g;
  }
  function makeLoad(kind){
   const g=new THREE.Group();g.name=kind;group.add(g);
   if(kind==='db')for(const s of ['l','r']){const d=new THREE.Group();d.name='db-'+s;g.add(d);cylinder(d,'handle',.014,.26,steel);for(const sign of [-1,1]){const p=cylinder(d,'head-'+sign,.075,.075,rubber);p.position.y=sign*.14;}}
   if(kind==='kb'){const handle=mesh(g,'handle',new THREE.TorusGeometry(.055,.012,10,24),steel);handle.position.y=-.035;const bell=mesh(g,'bell',new THREE.SphereGeometry(.085,20,14),rubber);bell.position.y=-.145;}
   if(kind==='ball')mesh(g,'ball-surface',new THREE.SphereGeometry(.135,24,16),rubber);
   return g;
  }
  function clear(){group.clear();for(const geo of geometries)geo.dispose();geometries.clear();bar=null;load=null;support=null;cable=null;}
  function point(rig,name){const bone=rig&&rig.bones&&rig.bones[name];if(!bone)return null;const p=bone.getWorldPosition(V());return p.toArray().every(Number.isFinite)?p:null;}
  function update(J,def,rig){
   if(disposed)return;def=def||{};if(rig&&rig.root)rig.root.updateMatrixWorld(true);
   const s=metricScale(rig),next=JSON.stringify([def.prop||null,def.scene||null,def.fix||null,def.rackY,def.cableY,def.frames,def.o,def.view,def._template,Math.round(s*1e8)]);
   if(next!==key){clear();key=next;if(def.prop&&def.prop.k==='bar')bar=makeBar();else if(def.prop&&['db','kb','ball'].includes(def.prop.k))load=makeLoad(def.prop.k);support=makeSupport(J,def,rig,s);}
   group.visible=!!rig;
   if(cable){const a=V().fromArray(cable.userData.anchor),l=point(rig,'hand_l'),r=point(rig,'hand_r');if(l&&r){const b=l.add(r).multiplyScalar(.5),d=b.clone().sub(a),len=d.length();cable.position.copy(a).add(b).multiplyScalar(.5);if(len>1e-8)cable.quaternion.setFromUnitVectors(up,d.normalize());if(!cable.userData.baseLength)cable.userData.baseLength=cable.geometry.parameters.height;cable.scale.y=len/cable.userData.baseLength;}}
   if(load){
    const shoulder=def.prop.at==='shoulder',a=point(rig,shoulder?'upperarm_l':'hand_l'),b=point(rig,shoulder?'upperarm_r':'hand_r');load.visible=!!(a&&b);
    if(a&&b){if(def.prop.k==='db'){for(const [s,p]of [['l',a],['r',b]]){const d=load.getObjectByName('db-'+s);d.position.copy(p);const bone=rig.bones[(shoulder?'upperarm_':'hand_')+s];d.quaternion.copy(bone.getWorldQuaternion(new THREE.Quaternion())).multiply(new THREE.Quaternion().setFromUnitVectors(up,V(1,0,0)));}}
     else {load.position.copy(a).add(b).multiplyScalar(.5);if(def.prop.k==='ball')load.position.y+=.09;}
    }
   }
   if(bar){const shoulder=def.prop.at==='shoulder',a=point(rig,shoulder?'upperarm_l':'hand_l'),b=point(rig,shoulder?'upperarm_r':'hand_r');
    bar.visible=!!(a&&b);if(a&&b){const delta=a.clone().sub(b),span=delta.length(),axis=span>1e-6?delta.normalize():V(1,0,0);bar.position.copy(a).add(b).multiplyScalar(.5);bar.quaternion.setFromUnitVectors(up,axis);
     const length=Math.max(1.6,span+.65);bar.getObjectByName('shaft').scale.y=length;
     bar.getObjectByName('plate-left').position.y=-length/2+.1;bar.getObjectByName('plate-right').position.y=length/2-.1;
    }
   }group.updateMatrixWorld(true);
  }
  function dispose(){if(disposed)return;clear();for(const mat of materials)mat.dispose();materials.clear();disposed=true;group.visible=false;}
  return {group,update,dispose};
 }
 return {create};
});
