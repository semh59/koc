'use strict';
// App-caller boundary tests. Controlled async Fig3D != real renderer/GPU E2E.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {boot,build,flush}=require('./html');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),web=path.join(root,'www'),out=path.join(root,'docs/analysis/exercise-human-rollout/ui-review');
fs.mkdirSync(out,{recursive:true});
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('www/modules/gym/exui.js'),html=build();
const guard='if(generation!==g3DGeneration||!box.isConnected){viewer.dispose();return;}';
const results=[],lines=[];
function log(s){lines.push(s);console.log(s);}
async function test(name,fn){try{await fn();results.push({name,pass:true});log('PASS '+name);}catch(e){results.push({name,pass:false,error:e.stack});log('FAIL '+name+'\n'+e.stack);}}
async function app({reduced=false,mutation=false,playError=false}={}){
 const errors=[];
 const w=await boot(w=>{
  w.matchMedia=()=>({matches:reduced});
  w.console.error=(...x)=>errors.push(x.map(String).join(' '));
  w.localStorage.setItem('nw_state',JSON.stringify({entries:[],settings:{obDone:true,noticeOk:true,age:30}}));
 },mutation?html.replace(guard,'/* mutation: remove only post-await generation/connectivity guard */'):html);
 assert.equal(w.document.documentElement.dataset.boot,'1','actual app bootstrap completed');
 const jobs=[],pending=[],viewers=[],plays=[],highlights=[],raf=new Set();let counter=0;
 const oldTimeout=w.setTimeout.bind(w);
 w.setTimeout=(fn,ms,...args)=>ms===60?(jobs.push(()=>fn(...args)),jobs.length):oldTimeout(fn,ms,...args);
 const fig=w.eval('Fig3D');fig.isSupported=()=>true;
 fig.createViewer=(box,opts)=>new Promise((resolve,reject)=>{
  const canvas=w.document.createElement('canvas');box.replaceChildren(canvas);
  const v={canvas,box,opts,_paused:true,disposed:0,renders:0,mannequin:{body:{}},
   pause(){this._paused=true;raf.delete(this);},resume(){this._paused=false;raf.add(this);},render(){this.renders++;},
   dispose(){this.disposed++;this.pause();canvas.remove();}};
  v.id=++counter;viewers.push(v);pending.push({v,resolve:()=>resolve(v),reject});
 });
 fig.play=(v,def)=>{plays.push({v,def});if(playError)throw new Error('injected play failure');v.resume();};
 fig.highlightRegions=(m,e)=>{highlights.push({m,e});return {primary:['chest'],secondary:['triceps','frontDeltoid'],warnings:[],illustrative:true,validatedAnatomy:false};};
 function click(s){const el=w.document.querySelector(s);assert.ok(el,'app element '+s);el.click();}
 function open(id='pushup'){w.eval(`gClick('exinfo:${id}',document.body)`);click(`[data-g="open3d:${id}"]`);}
 async function start(){const batch=jobs.splice(0);for(const fn of batch)fn();await flush();}
 async function resolve(i=0){pending[i].resolve();await flush();}
 return {w,errors,jobs,pending,viewers,plays,highlights,raf,fig,click,open,start,resolve,close(){w.eval('g3DStop()');w.close();}};
}
async function rendererFailure({calibration=false,fetchReject=false}={}){
 const dom=new JSDOM('<div id="box"></div>',{url:'https://localhost/'}),document=dom.window.document;
 const ctx=vm.createContext({window:{},console,document,ResizeObserver:class{observe(){}disconnect(){}},requestAnimationFrame(){throw Error('must not schedule');},cancelAnimationFrame(){},fetch:async()=>{if(fetchReject)throw Error('injected calibration fetch failure');return {ok:false};},HumanRig:{create(){throw Error('must not create rig');}}});
 vm.runInContext(read('www/vendor/three/three.bundle.js'),ctx);const THREE={...ctx.window.THREE};ctx.window.THREE=THREE;ctx.THREE=THREE;
 const disposed={renderer:0,controls:0,geometry:0,material:0,loadedGeometry:0,loadedMaterial:0},urls=[];
 const loaded=new THREE.Group(),geo=new THREE.BoxGeometry(),mat=new THREE.MeshStandardMaterial();loaded.add(new THREE.Mesh(geo,mat));
 geo.dispose=()=>disposed.loadedGeometry++;mat.dispose=()=>disposed.loadedMaterial++;
 THREE.WebGLRenderer=class{constructor(){this.domElement=document.createElement('canvas');this.shadowMap={};}setPixelRatio(){}dispose(){disposed.renderer++;}};
 THREE.OrbitControls=class{dispose(){disposed.controls++;}};
 THREE.GLTFLoader=class{async loadAsync(url){urls.push(url);if(!calibration&&!fetchReject)throw Error('injected GLB failure');return {scene:loaded};}};
 const gd=THREE.BufferGeometry.prototype.dispose,md=THREE.Material.prototype.dispose;
 THREE.BufferGeometry.prototype.dispose=function(){disposed.geometry++;return gd.call(this);};THREE.Material.prototype.dispose=function(){disposed.material++;return md.call(this);};
 vm.runInContext(read('www/modules/gym/fig3d.js'),ctx);
 await assert.rejects(vm.runInContext('Fig3D.createViewer(document.querySelector("#box"))',ctx));
 await new Promise(resolve=>setTimeout(resolve,250));
 assert.deepEqual(urls,['models/athletic-human.glb'],'approved GLB URL');
 assert.equal(disposed.renderer,1);assert.equal(disposed.controls,1);assert.equal(document.querySelectorAll('canvas').length,0);
 assert.ok(disposed.geometry>=2&&disposed.material>=2,'floor/grid geometries and materials released');dom.window.close();return disposed;
}
(async()=>{
 await test('actual app click -> gClick -> exSheet3D passes full catalog metadata and _template',async()=>{const a=await app();try{a.open();await a.start();await a.resolve();assert.equal(a.viewers.length,1);assert.equal(a.plays.length,1);assert.equal(a.plays[0].def._template,'pushup');assert.equal(a.highlights[0].e,a.w.eval('gEx("pushup")'),'not just region string');assert.equal(a.highlights[0].e.tp,'pushup');assert.equal(a.viewers[0].renders,1);assert.equal(a.w.document.querySelectorAll('#ex3d-box canvas').length,1);assert.equal(a.raf.size,1);}finally{a.close();}});
 await test('reduced-motion starts paused and pause/resume button stays synchronized',async()=>{const a=await app({reduced:true});try{a.open();await a.start();await a.resolve();const v=a.viewers[0],b=a.w.document.querySelector('#g3d-playbtn');assert.equal(v._paused,true);assert.equal(a.raf.size,0);assert.equal(b.textContent,'▶');b.click();assert.equal(v._paused,false);assert.equal(b.textContent,'⏸');b.click();assert.equal(v._paused,true);assert.equal(b.textContent,'▶');}finally{a.close();}});
 await test('actual closeSheet disposes active viewer and clears canvas/scheduled playback',async()=>{const a=await app();try{a.open();await a.start();await a.resolve();a.click('[data-g="closesheet"]');assert.equal(a.viewers[0].disposed,1);assert.equal(a.raf.size,0);assert.equal(a.w.eval('gActive3DViewer'),null);assert.equal(a.w.document.querySelectorAll('canvas').length,0);}finally{a.close();}});
 async function closePending(mutation=false){const a=await app({mutation});try{a.open();await a.start();a.click('[data-g="closesheet"]');assert.equal(a.pending.length,1,'async loader already entered');assert.equal(a.viewers[0].box.isConnected,true,'closeSheet hides, does not disconnect DOM');await a.resolve();assert.equal(a.viewers[0].disposed,1,'late viewer must be disposed after real app close');assert.equal(a.raf.size,0,'closed sheet must not start playback');assert.equal(a.plays.length,0,'closed sheet must not play');}finally{a.close();}}
 await test('close during async load disposes late viewer even though hidden box stays connected',()=>closePending());
 await test('mutation proof removes only generation guard and fails intended late-disposal assertion',async()=>{assert.equal(source.split(guard).length,2,'mutation target occurs exactly once');await assert.rejects(closePending(true),e=>{const intended=e.code==='ERR_ASSERTION'&&/late viewer must be disposed/.test(e.message);if(intended)log('MUTATION RED (expected): '+e.message.replace(/\n/g,' '));return intended;});});
 await test('quick switch after loader starts leaves only newest viewer playback and canvas',async()=>{const a=await app();try{a.open();await a.start();a.open('squat');await a.start();await a.resolve(1);await a.resolve(0);assert.equal(a.viewers[0].disposed,1);assert.equal(a.viewers[1].disposed,0);assert.equal(a.raf.size,1);assert.ok(a.raf.has(a.viewers[1]));assert.equal(a.w.document.querySelectorAll('canvas').length,1);assert.equal(a.plays.length,1);assert.equal(a.plays[0].def._template,a.w.eval('gEx("squat").tp'));}finally{a.close();}});
 await test('quick switch before 60ms callbacks creates no redundant/orphan pending viewer',async()=>{const a=await app();try{a.open();a.open('squat');await a.start();assert.equal(a.pending.length,1,'stale timer must not enter loader for newest sheet');await a.resolve();assert.equal(a.viewers.length,1);assert.equal(a.raf.size,1);assert.equal(a.w.document.querySelectorAll('canvas').length,1);}finally{for(const p of a.pending)p.resolve();await flush();a.close();}});
 await test('load rejection shows fallback and actual detail can reopen usable 2D',async()=>{const a=await app();try{a.open();await a.start();a.pending[0].v.dispose();a.pending[0].reject(new Error('controlled load failure'));await flush();assert.match(a.w.document.querySelector('#ex3d-box').textContent,/2D/);assert.equal(a.w.eval('gActive3DViewer'),null);assert.equal(a.raf.size,0);assert.equal(a.errors.length,1);a.click('[data-g="closesheet"]');a.w.eval('gClick("exinfo:pushup",document.body)');assert.ok(a.w.document.querySelector('.exfig svg'));}finally{a.close();}});
 await test('post-create play failure disposes acquired viewer rather than holding GPU until close',async()=>{const a=await app({playError:true});try{a.open();await a.start();await a.resolve();assert.equal(a.errors.length,1);assert.equal(a.viewers[0].disposed,1,'acquired viewer must dispose on caller setup failure');assert.equal(a.w.eval('gActive3DViewer'),null);}finally{a.close();}});
 await test('normal exercise sheet/3D contains no pilot/developer labels and marks masks schematic',async()=>{const a=await app();try{a.open();await a.start();await a.resolve();const text=a.w.document.querySelector('#sheet').textContent;assert.doesNotMatch(text,/pilot|geliştirici|debug|dev\s*mode|serbest\s*(pilot|test)/i);assert.match(text,/şematik/);assert.doesNotMatch(text,/anatomik olarak doğrulan/);}finally{a.close();}});
 await test('primary/secondary returned muscle identifiers are displayed as readable text',async()=>{const a=await app();try{a.open();await a.start();await a.resolve();const text=a.w.document.querySelector('#sheet').textContent;assert.ok(/chest|pektoral|göğüs/i.test(text)&&/triceps|triseps/i.test(text)&&/frontDeltoid|ön deltoid|ön omuz/i.test(text),'resolved primary and secondary names must be visible, not color-only generic legend');}finally{a.close();}});
 await test('real Fig3D GLB rejection releases renderer/controls/scene and removes canvas (VM instrumented)',async()=>{await rendererFailure();});
 await test('real Fig3D calibration fetch rejection releases already-loaded GLB resources (VM instrumented)',async()=>{const d=await rendererFailure({fetchReject:true});assert.equal(d.loadedGeometry,1,`loaded GLB geometry must dispose when calibration fetch rejects (${JSON.stringify(d)})`);assert.equal(d.loadedMaterial,1,`loaded GLB material must dispose when calibration fetch rejects (${JSON.stringify(d)})`);});
 await test('standalone figure-3d.html shows fallback when viewer load fails',async()=>{const entry=read('www/figure-3d.html');const dom=new JSDOM(entry.replace(/<script[^>]*>[\s\S]*?<\/script>/g,''),{runScripts:'outside-only',url:'https://localhost/'});const w=dom.window;try{w.FigTpl={pushup:{},squat:{}};w.Fig3D={createViewer:async()=>{throw Error('injected viewer load failure');},play(){},setViewAngle(){}};const inline=[...entry.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');w.eval(inline);w.dispatchEvent(new w.Event('DOMContentLoaded'));await flush();assert.match(w.document.querySelector('#view3d').textContent,/3D görünüm yüklenemedi/i);}finally{w.close();}});
 await test('HTML entries load human dependencies before Fig3D; approved GLB and calibration ship under webDir',async()=>{for(const entry of ['www/index.html','www/figure-3d.html']){const text=read(entry),refs=[...text.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);for(const f of ['human-rig','human-muscles','human-equipment'])assert.ok(refs.indexOf('modules/gym/'+f+'.js')<refs.indexOf('modules/gym/fig3d.js'));for(const f of refs)assert.ok(fs.existsSync(path.join(web,f)),entry+' '+f);}assert.equal(JSON.parse(read('capacitor.config.json')).webDir,'www');for(const f of ['models/athletic-human.glb','modules/gym/human-hand-support.json'])assert.ok(fs.existsSync(path.join(web,f)));});
 await test('standalone figure-3d.html pause uses current viewer pause API, not removed interval field',async()=>{const entry=read('www/figure-3d.html');const dom=new JSDOM(entry.replace(/<script[^>]*>[\s\S]*?<\/script>/g,''),{runScripts:'outside-only',url:'https://localhost/'});const w=dom.window;try{const v={_paused:true,pause(){this._paused=true;},resume(){this._paused=false;}};w.FigTpl={pushup:{},squat:{}};w.Fig3D={createViewer:async()=>v,play(viewer){viewer.resume();},setViewAngle(){}};const inline=[...entry.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');w.eval(inline);w.dispatchEvent(new w.Event('DOMContentLoaded'));await flush();assert.equal(v._paused,false);w.document.querySelector('#btn-pause').click();assert.equal(v._paused,true,'standalone pause must stop current RAF viewer');}finally{w.close();}});
 const report={time:new Date().toISOString(),tier:'jsdom actual-app caller with controlled async Fig3D; real Fig3D VM instrumented WebGLRenderer (not real GPU)',sourceSha256:require('node:crypto').createHash('sha256').update(source).digest('hex'),passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length,results};
 log(`SUMMARY PASS ${report.passed} FAIL ${report.failed}`);fs.writeFileSync(path.join(out,'ui-test-results.json'),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(out,'ui-test-output.log'),lines.join('\n')+'\n');if(report.failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
