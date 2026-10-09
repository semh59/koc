/* Kamerayla nabız: sentetik ışık dalgasından atım sayısı, belirsiz ölçümde sayı vermeme, kayıt temizliği. */
const P=require("../www/modules/nabiz/pulselib.js");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
function rng(seed){let s=seed>>>0||1;return ()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}}
const gauss=r=>Math.sqrt(-2*Math.log(r()||1e-9))*Math.cos(2*Math.PI*r());
/* Gerçekçi dalga: atım aralığı biraz oynar (HRV), ikinci harmonik, ışık kayması, kare zamanı sapması, gürültü. */
function sig({bpm=72,sec=30,amp=1.5,noise=0.3,drift=true,seed=1,r=210,g=60,fps=30,hrv=0.04}){
  const rn=rng(seed),out=[];let phase=0,t=0;
  while(t<sec*1000){
    const f=bpm/60*(1+hrv*Math.sin(t/1000*0.6283)+hrv*0.5*gauss(rn)*0.2);
    phase+=f/fps;
    const w=-Math.cos(2*Math.PI*phase)-0.3*Math.cos(4*Math.PI*phase+0.6);
    out.push({t:Math.round(t),r:r+amp*w+noise*gauss(rn)+(drift?3*Math.sin(t/1000*0.15):0),g});
    t+=1000/fps+(rn()-0.5)*8;
  }
  return out;
}
for(const b of [48,60,72,90,110,140,170]){
  const a=P.analyze(sig({bpm:b,seed:b}));
  ok(`${b} atım/dk: sonuç ±2 içinde`,a.ok&&Math.abs(a.bpm-b)<=2,a);
}
ok("zayıf sinyal (genlik 0,6, gürültü 0,3) yine doğru okunur",(a=>a.ok&&Math.abs(a.bpm-80)<=2)(P.analyze(sig({bpm:80,amp:0.6,seed:5}))));
ok("20 fps kamerada da okunur",(a=>a.ok&&Math.abs(a.bpm-66)<=2)(P.analyze(sig({bpm:66,fps:20,seed:6}))));
let wrong=0,total=0;
for(let s=1;s<=40;s++){const a=P.analyze(sig({bpm:50+(s*7)%120,seed:s*13,noise:0.35}));total++;if(a.ok&&Math.abs(a.bpm-(50+(s*7)%120))>3)wrong++}
ok("40 farklı ölçümde yanlış sayı verilmez (okunursa ±3 içinde)",wrong===0,wrong+"/"+total);

ok("parmak yoksa (kırmızı düşük) ölçüm reddedilir",P.analyze(sig({r:40,g:38})).reason==="finger");
ok("dalga yoksa (sabit parlaklık) reddedilir",!P.analyze(sig({amp:0,noise:0,drift:false})).ok);
ok("çok kısa kayıt reddedilir",P.analyze(sig({sec:8})).reason==="short");
let acc=0;
for(let s=1;s<=30;s++){const rn=rng(s*7),o=[];let t=0,v=210;while(t<30000){v+=gauss(rn)*0.6;o.push({t,r:v,g:60});t+=33}if(P.analyze(o).ok)acc++}
ok("rastgele gürültü ve yürüyen taban sayı üretmez (30 denemede 0)",acc===0,acc);
const two=sig({bpm:70,seed:3}).map((s,i,a)=>({...s,r:s.r+1.5*Math.sin(2*Math.PI*(a[i].t/1000)*(120/60))}));
/* Telefonda görülen durum: ~17 kare/sn'de özilinti yarım periyodu (2T) seçip doğru ölçümü reddediyordu. */
for(const sd of [3,15,25])ok(`17 kare/sn, 86 atım/dk (özilinti oktav hatası yok, tohum ${sd})`,(a=>a.ok&&Math.abs(a.bpm-86)<=3)(P.analyze(sig({bpm:86,fps:17,noise:0.6,amp:1.2,hrv:0.03,seed:sd}))));
/* Atım aralıkları çok oynuyorsa (±%45) düzenli sayılmaz, sayı verilmez. */
function beats(jit,seed){const rn=rng(seed),o=[],T=[];let x=500,t=0;while(x<30000){T.push(x);x+=700*(1+(rn()-0.5)*2*jit)}
  while(t<30000){let v=0;for(const tb of T){const d=(t-tb)/1000;if(Math.abs(d)<0.6)v+=Math.exp(-d*d/(2*0.07*0.07))}o.push({t:Math.round(t),r:210+1.5*v+0.2*gauss(rn),g:60});t+=33}return o}
ok("düzenli atım (±%10 oynama) okunur, çok düzensiz (±%45) reddedilir",P.analyze(beats(0.1,9)).ok&&P.analyze(beats(0.45,9)).reason==="noisy");
ok("başarısız ve başarılı sonuçta teknik ayrıntı (fps, r, g, sd, pk) döner",(a=>a.dg&&a.dg.fps>0&&a.dg.r>0&&"sd" in a.dg&&"pk" in a.dg)(P.analyze(beats(0.45,9)))&&!!P.analyze(beats(0.1,9)).dg);
ok("iki farklı ritim üst üste ise (hareket, çift kaynak) sayı vermez ya da doğruyu verir",(a=>!a.ok||Math.abs(a.bpm-70)<=3||Math.abs(a.bpm-120)<=3)(P.analyze(two)));
const half=sig({bpm:72,seed:2}).map((s,i,a)=>i>a.length/2&&i%7<3?{...s,r:s.r+40}:s);
ok("yarı yolda parmak kayarsa yanlış sayı verilmez",(a=>!a.ok||Math.abs(a.bpm-72)<=3)(P.analyze(half)));

const c=P.clean([{day:"2026-10-09",time:"08:10",bpm:72.4},{day:"2026-10-09",time:"08:10",bpm:72},{day:"2026-10-08",time:"23:59",bpm:60},{day:"2026-13-01",time:"08:10",bpm:70},{day:"2026-10-09",time:"25:00",bpm:70},{day:"2026-10-09",time:"09:00",bpm:300},{day:"2026-10-09",time:"09:01",bpm:30},null,{day:"2026-10-09",time:"09:02",bpm:"x"}]);
ok("kayıt temizliği: bozuk ve aralık dışı atılır, yinelenen birleşir, sıralı ve kimlikli",c.length===2&&c[0].day==="2026-10-08"&&c[1].bpm===72&&c[0].id===1&&c[1].id===2,c);
ok("500'ü aşan nabız kaydı kaybolmaz",P.clean(Array.from({length:700},(_,i)=>({day:"2026-01-01",time:`${String(i%24).padStart(2,"0")}:${String(Math.floor(i/24)%60).padStart(2,"0")}`,bpm:60+i%100}))).length===700);
const h=P.cleanHr([{day:"2026-10-08",a:64.6,m:50},{day:"2026-10-08",a:66,m:51},{day:"2026-10-09",a:400},{day:"2026-10-07",a:70,m:5},{day:"x",a:60}]);
ok("saat nabzı: günde bir kayıt (sonuncu), bozuk atılır, en düşük geçersizse alınmaz",h.length===2&&h[0].day==="2026-10-07"&&h[0].m===undefined&&h[1].a===66&&h[1].m===51,h);
/* Flaş seçici: birden fazla arka kamerada flaş yalnız birindedir. */
(async()=>{
  const mk=(id,torch,label)=>({id,label,open:0,stopped:0,
    stream(){const me=this,tr={getCapabilities:()=>torch?{torch:true}:{},getSettings:()=>({deviceId:id}),stop(){me.stopped++}};me.open++;return {getVideoTracks:()=>[tr],getTracks:()=>[tr]}}});
  const rig=cams=>({getUserMedia:async c=>{const ex=c.video.deviceId&&c.video.deviceId.exact,cam=ex?cams.find(x=>x.id===ex):cams[0];if(!cam)throw new Error("yok");return cam.stream()},
    enumerateDevices:async()=>cams.map(c=>({kind:"videoinput",deviceId:c.id,label:c.label}))});
  {const cams=[mk("w",false,"camera2 0, facing back"),mk("f",false,"camera2 1, facing front"),mk("u",false,"camera2 2, facing back"),mk("m",true,"camera2 3, facing back")];
   const r=await P.pickTorchCamera(rig(cams),{});
   ok("flaş seçici: varsayılan kamerada flaş yoksa flaşlı arka kamera bulunur, ön kamera denenmez",r.track.getSettings().deviceId==="m"&&!r.noTorch&&r.tried===3&&cams[1].open===0,[r.tried,cams[1].open]);
   ok("flaş seçici: flaşsız akışlar kapatılır",cams[0].stopped===1&&cams[2].stopped===1);}
  {const cams=[mk("w",true,"camera2 0, facing back"),mk("m",true,"camera2 3, facing back")];
   const r=await P.pickTorchCamera(rig(cams),{});
   ok("flaş seçici: varsayılan kamerada flaş varsa başka kamera açılmaz",r.track.getSettings().deviceId==="w"&&r.tried===1&&cams[1].open===0);}
  {const cams=[mk("w",false,"camera2 0, facing back"),mk("u",false,"camera2 2, facing back")];
   const r=await P.pickTorchCamera(rig(cams),{});
   ok("flaş seçici: hiçbirinde flaş yoksa varsayılan kamera açık döner, noTorch işaretli",r.noTorch===true&&r.tried===2&&!!r.stream);}
  console.log(bad?"Başarısız: "+bad:"Tüm nabız testleri geçti");process.exit(bad?1:0);
})();
