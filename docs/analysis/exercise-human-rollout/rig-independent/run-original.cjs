'use strict';
// Run unchanged assertions; redirect evidence writes only, without product edits.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),cp=require('node:child_process');
const base=path.resolve(__dirname,'../../../..'),source=path.join(base,'scripts/gym-human-rig.test.js');
if(process.argv.includes('--child')){
 const out=process.env.INDEPENDENT_OUT;fs.mkdirSync(out,{recursive:true});
 const text=fs.readFileSync(source,'utf8');
 const seam="evidence=path.join(base,'docs/analysis/exercise-human-rollout/rig-core')";
 if(!text.includes(seam))throw Error('evidence redirect seam missing');
 const m=new Module(source,module);m.filename=source;m.paths=Module._nodeModulePaths(path.dirname(source));
 m._compile(text.replace(seam,'evidence='+JSON.stringify(out)),source);
}else{
 const mode=process.argv[2]||'baseline',out=path.join(__dirname,mode);
 const env={...process.env,INDEPENDENT_OUT:out};
 if(mode!=='baseline')env.HUMAN_RIG_MUTATION=mode;else delete env.HUMAN_RIG_MUTATION;
 const started=Date.now(),r=cp.spawnSync(process.execPath,[__filename,'--child'],{cwd:base,env,encoding:'utf8',timeout:600000,maxBuffer:10000000});
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'output.txt'),r.stdout+'\n'+r.stderr);
 fs.writeFileSync(path.join(out,'execution.json'),JSON.stringify({command:'node docs/analysis/exercise-human-rollout/rig-independent/run-original.cjs '+mode,exit:r.status,signal:r.signal,error:r.error?.message||null,ms:Date.now()-started,stdout:r.stdout,stderr:r.stderr},null,2));
 console.log(r.stdout,r.stderr,'EXIT',r.status,'MS',Date.now()-started);process.exitCode=r.status??1;
}
