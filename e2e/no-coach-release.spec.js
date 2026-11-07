"use strict";
const {test,expect,state}=require("./fixtures");

test.describe("No-Coach release",()=>{
  test("boots without Coach UI, provider globals or console errors",async({app,page})=>{
    await app.open({seed:state()});
    await expect(page.locator("html[data-boot]")).toBeAttached();
    await expect(page.locator('nav button[data-tab="coach"]')).toHaveCount(0);
    await expect(page.locator("#composer,#cmsg,#cvoice,#csend")).toHaveCount(0);
    expect(await page.evaluate(()=>[typeof callProvider,typeof fetchModels,typeof viewCoach])).toEqual(["undefined","undefined","undefined"]);
    await expect(page.locator("#view")).not.toBeEmpty();
  });

  test("exercise details show NeoWell figures without unverified photos",async({app,page})=>{
    await app.open({seed:state()});
    await app.tab("gym");
    for(const id of ["squat","onefoot","fastwalk"]){
      await page.evaluate(id=>exSheet(id),id);
      await expect(page.locator("#sheet .exfig svg")).toHaveCount(1);
      await expect(page.locator("#sheet img,#sheet .exph")).toHaveCount(0);
      await expect(page.locator("#sheet")).not.toContainText("kamu malı");
    }
    expect(await page.evaluate(()=>performance.getEntriesByType("resource").some(x=>/\/ex\/[^/]+\/\d+\.webp/.test(x.name)))).toBe(false);
  });

  test("single-leg hold keeps support planted in real exercise detail",async({app,page})=>{
    await page.emulateMedia({reducedMotion:"no-preference"});
    await app.open({seed:state()});await app.tab("gym");
    await page.evaluate(()=>exSheet("onefoot"));
    const svg=page.locator("#sheet .exfig svg");await expect(svg).toBeVisible();
    const observation=await svg.evaluate(el=>{
      el.pauseAnimations();
      const legs=el.querySelectorAll("path.fg-near"),support=legs[0],toe=legs[1],free=el.querySelectorAll("path.fg-far")[1];
      const anchor=support.getPointAtLength(support.getTotalLength()),samples=[];
      for(let i=0;i<=12;i++){
        el.setCurrentTime(i*2.6/12);
        const a=support.getPointAtLength(support.getTotalLength()),t=toe.getPointAtLength(toe.getTotalLength()),f=free.getPointAtLength(free.getTotalLength());
        samples.push({drift:Math.hypot(a.x-anchor.x,a.y-anchor.y),y:a.y,toeY:t.y,freeY:f.y});
      }
      el.setCurrentTime(0);return samples;
    });
    expect(observation.every(x=>x.drift<.01&&Math.abs(x.y-136)<.01&&Math.abs(x.toeY-136)<.01&&x.freeY<128)).toBe(true);
    await page.emulateMedia({reducedMotion:"reduce"});await page.evaluate(()=>exSheet("onefoot"));
    await expect(svg).toHaveAttribute("data-fig-motion","static");await expect(svg.locator("animate")).toHaveCount(0);
    await page.screenshot({path:test.info().outputPath("onefoot.png")});
  });

  test("arms-at-sides walking alternates feet in exercise detail",async({app,page})=>{
    await page.emulateMedia({reducedMotion:"no-preference"});
    await app.open({seed:state()});await app.tab("gym");await page.evaluate(()=>exSheet("armswalk"));
    const svg=page.locator("#sheet .exfig svg");await expect(svg).toBeVisible();
    const steps=await svg.evaluate(el=>{
      el.pauseAnimations();const out=[];
      for(const t of [0,1.3,2.6]){
        el.setCurrentTime(t);
        const near=el.querySelectorAll("path.fg-near"),far=el.querySelectorAll("path.fg-far");
        const end=p=>p.getPointAtLength(p.getTotalLength());
        const arm=near[2],s=arm.getPointAtLength(0),w=end(arm);
        out.push({order:end(near[0]).x-end(far[1]).x,armDown:w.y-s.y,armSide:Math.abs(w.x-s.x)});
      }return out;
    });
    expect(steps[0].order*steps[1].order).toBeLessThan(0);
    expect(Math.abs(steps[0].order-steps[2].order)).toBeLessThan(.01);
    expect(steps.every(s=>s.armDown>30&&s.armSide<4)).toBe(true);
    await page.emulateMedia({reducedMotion:"reduce"});await page.evaluate(()=>exSheet("armswalk"));
    await expect(svg).toHaveAttribute("data-fig-motion","static");await expect(svg.locator("animate")).toHaveCount(0);
  });

  test("tandem detail shows stationary heel-to-toe feet",async({app,page})=>{
    await page.emulateMedia({reducedMotion:"no-preference"});await app.open({seed:state()});await app.tab("gym");
    await page.evaluate(()=>exSheet("tandem"));const svg=page.locator("#sheet .exfig svg");await expect(svg).toBeVisible();
    await expect(svg).toHaveAttribute("data-fig-view","side");
    const samples=await svg.evaluate(el=>{
      el.pauseAnimations();const foot=el.querySelectorAll("path.fg-near")[1],rear=el.querySelectorAll("path.fg-far")[2],out=[];
      for(const t of [0,.65,1.3,1.95,2.6]){el.setCurrentTime(t);const heel=foot.getPointAtLength(0),toe=rear.getPointAtLength(rear.getTotalLength());out.push({x:heel.x,y:heel.y,gap:Math.hypot(heel.x-toe.x,heel.y-toe.y)});}return out;
    });
    expect(samples.every(s=>s.gap<.11&&Math.abs(s.y-136)<.01&&Math.abs(s.x-samples[0].x)<.01)).toBe(true);
    await page.emulateMedia({reducedMotion:"reduce"});await page.evaluate(()=>exSheet("tandem"));
    await expect(svg.locator("animate")).toHaveCount(0);await expect(svg).toHaveAttribute("data-fig-motion","static");
  });

  test("chair stand detail rises from fixed chair with planted feet",async({app,page})=>{
    await page.emulateMedia({reducedMotion:"no-preference"});await app.open({seed:state()});await app.tab("gym");
    await page.evaluate(()=>exSheet("chairstand"));const svg=page.locator("#sheet .exfig svg");await expect(svg).toBeVisible();
    const samples=await svg.evaluate(el=>{
      el.pauseAnimations();const parts=el.querySelectorAll("path.fg-prop"),seat=parts[0],body=el.querySelector("path.fg-body"),leg=el.querySelector("path.fg-near"),out=[];
      for(const t of [0,.65,1.3,1.95,2.6]){el.setCurrentTime(t);const hip=body.getPointAtLength(0),a=leg.getPointAtLength(leg.getTotalLength()),left=seat.getPointAtLength(0),right=seat.getPointAtLength(seat.getTotalLength());out.push({hipX:hip.x,hipY:hip.y,ankleX:a.x,ankleY:a.y,seatX:left.x,seatY:left.y,seatRight:right.x});}return out;
    });
    expect(Math.abs(samples[0].hipY-samples[0].seatY)).toBeLessThan(.01);
    expect(samples[0].hipX>=samples[0].seatX&&samples[0].hipX<=samples[0].seatRight).toBe(true);
    expect(samples[2].hipY).toBeLessThan(samples[0].seatY-20);
    expect(samples.every(s=>s.seatY===samples[0].seatY&&s.seatX===samples[0].seatX&&Math.abs(s.ankleY-136)<.01&&Math.abs(s.ankleX-samples[0].ankleX)<.01)).toBe(true);
    await page.emulateMedia({reducedMotion:"reduce"});await page.evaluate(()=>exSheet("chairstand"));
    await expect(svg.locator("animate")).toHaveCount(0);await expect(svg).toHaveAttribute("data-fig-motion","static");
  });

  test("rack pull shaft contacts fixed pins then lifts in detail and guide",async({app,page})=>{
    await page.emulateMedia({reducedMotion:"no-preference"});await app.open({seed:state()});await app.tab("gym");
    for(const mode of ["detail","guide"]){
      if(mode==="detail")await page.evaluate(()=>exSheet("rackpull"));
      else await page.evaluate(()=>{closeSheet();S.templates=[{id:908,name:"Rack figür testi",ex:["rackpull"],tg:{rackpull:{sets:1,reps:5}}}];gdStart("t:908")});
      const svg=page.locator(mode==="detail"?"#sheet .exfig svg":"#guide .gdfig svg");await expect(svg).toBeVisible();
      const samples=await svg.evaluate(el=>{
        el.pauseAnimations();const pin=el.querySelector("path.fg-prop"),shaft=el.querySelector("path.fg-barshaft"),plate=el.querySelector("circle.fg-plate"),leg=el.querySelector("path.fg-near"),out=[];
        for(let i=0;i<=64;i++){
          el.setCurrentTime(i*2.6/64);const p=pin.getPointAtLength(0),pe=pin.getPointAtLength(pin.getTotalLength()),b=shaft.getPointAtLength(0),be=shaft.getPointAtLength(shaft.getTotalLength()),a=leg.getPointAtLength(leg.getTotalLength());
          const pw=Number(pin.getAttribute("stroke-width")),bw=Number(shaft.getAttribute("stroke-width")),cx=plate.cx.animVal.value,cy=plate.cy.animVal.value,r=plate.r.baseVal.value+parseFloat(getComputedStyle(plate).strokeWidth)/2;
          out.push({pinX:p.x,pinY:p.y,barY:b.y,gap:p.y-pw/2-Math.max(b.y,be.y)-bw/2,tilt:Math.abs(b.y-be.y),inner:Math.min(be.x,pe.x,cx-r)-Math.max(b.x,p.x),plateClear:Math.hypot(cx-Math.max(p.x,Math.min(pe.x,cx)),cy-p.y)-r-pw/2,x:a.x,y:a.y});
        }return {out,stroke:getComputedStyle(shaft).stroke};
      });
      expect(samples.stroke).not.toBe("none");const s=samples.out;
      for(const i of [0,64])expect(s[i].inner).toBeGreaterThan(3);expect(s.every(f=>f.tilt<.02&&f.plateClear>0)).toBe(true);
      expect(Math.abs(s[0].gap)).toBeLessThan(.06);expect(Math.abs(s[64].gap)).toBeLessThan(.06);expect(s[32].gap).toBeGreaterThan(8);
      expect(s.every(f=>f.gap>-.06&&Math.abs(f.x-80)<.02&&Math.abs(f.y-136)<.02&&Math.abs(f.pinY-s[0].pinY)<.02&&Math.abs(f.pinX-s[0].pinX)<.02)).toBe(true);
    }
    await page.evaluate(()=>{gdEnd();gdClose()});await page.emulateMedia({reducedMotion:"reduce"});await page.evaluate(()=>exSheet("rackpull"));
    const svg=page.locator("#sheet .exfig svg");await expect(svg.locator("animate")).toHaveCount(0);await expect(svg).toHaveAttribute("data-fig-motion","static");
  });

  test("rack pull explains raised support and schematic drawing in detail and guide",async({app,page})=>{
    await app.open({seed:state()});await app.tab("gym");await page.evaluate(()=>exSheet("rackpull"));
    await expect(page.locator("#sheet .cues")).toContainText("yükseltilmiş desteklerden");
    await expect(page.locator("#sheet .cues")).toContainText("Çizim şematik bir yükseklik örneğidir; kişisel ayar önerisi değildir");
    await page.evaluate(()=>{closeSheet();S.templates=[{id:907,name:"Destekli çekiş testi",ex:["rackpull"],tg:{rackpull:{sets:1,reps:5}}}];gdStart("t:907")});
    await expect(page.locator("#guide .gdc").first()).toContainText("yükseltilmiş desteklerden");
    await expect(page.locator("#guide .gdc").first()).toContainText("kişisel ayar önerisi değildir");
    for(const clause of ["kontrollü kaldır","kalça ve dizlerini açarak doğrul","desteklere kontrollü geri bırak"])await expect(page.locator("#guide .gdc").first()).toContainText(clause);
    await page.evaluate(()=>{gdEnd();gdClose()});
  });

  test("ordinary deadlift keeps painted feet on floor and lifts grounded bar in detail and guide",async({app,page})=>{
    await app.open({seed:state()});await app.tab("gym");
    expect(await page.evaluate(()=>({template:gEx("deadlift").tp,scene:exDef(gEx("deadlift")).scene,rest:gRestDef("deadlift")}))).toEqual({template:"deadlift",scene:"floorpull",rest:150});
    for(const motion of ["no-preference","reduce"]){
      await page.emulateMedia({reducedMotion:motion});
      for(const mode of ["detail","guide"]){
        if(mode==="detail")await page.evaluate(()=>exSheet("deadlift"));
        else await page.evaluate(()=>{closeSheet();S.templates=[{id:911,name:"Zeminden çekiş testi",ex:["deadlift"],tg:{deadlift:{sets:1,reps:5}}}];gdStart("t:911")});
        const svg=page.locator(mode==="detail"?"#sheet .exfig svg":"#guide .gdfig svg"),label=`${motion} ${mode}`;
        await expect(svg).toBeVisible();await expect(svg).toHaveAttribute("data-fig-view","side");
        await expect(svg).toHaveAttribute("data-fig-motion",motion==="reduce"?"static":"animated");
        await expect(svg.locator("rect.fg-prop")).toHaveCount(0);
        if(motion==="reduce")await expect(svg.locator("animate")).toHaveCount(0);
        else expect(await svg.locator("animate").count()).toBeGreaterThan(0);
        const cue=page.locator(mode==="detail"?"#sheet .cues li":"#guide .gdc").first();
        for(const clause of ["Ayaklarını yere sağlam bas","barı zeminden kontrollü kaldır","kalça ve dizlerini açarak doğrul","barı kontrollü zemine geri indir","Çizim şematiktir","açık izdüşüm","yatay bar konumu ve hareket açıları kişisel kurulum önerisi değildir"])await expect(cue).toContainText(clause);
        const samples=await svg.evaluate((el,animated)=>{
          el.pauseAnimations();
          const floor=el.querySelector("path.fg-floor"),shaft=el.querySelector("path.fg-barshaft"),plate=el.querySelector("circle.fg-plate"),body=el.querySelector("path.fg-body"),near=el.querySelectorAll("path.fg-near"),far=el.querySelectorAll("path.fg-far"),out=[];
          const pt=(p,d)=>{const q=p.getPointAtLength(d);return [q.x,q.y]},end=p=>pt(p,p.getTotalLength()),width=p=>parseFloat(getComputedStyle(p).strokeWidth);
          const angle=(a,b,c)=>{const u=a.map((v,i)=>v-b[i]),v=c.map((n,i)=>n-b[i]);return Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/Math.hypot(...u)/Math.hypot(...v))))*180/Math.PI};
          const painted=p=>{const s=getComputedStyle(p);return s.stroke!=="none"&&s.visibility==="visible"&&+s.opacity>0&&width(p)>0};
          for(let i=0;i<=(animated?128:0);i++){
            el.setCurrentTime(i*2.6/128);
            const a=pt(shaft,0),b=end(shaft),hip=pt(body,0),neck=end(body),ground=pt(floor,0)[1]-width(floor)/2;
            out.push({floor:[pt(floor,0),end(floor)],ground,a,b,wrist:end(near[2]),plate:[plate.cx.animVal.value,plate.cy.animVal.value,plate.r.animVal.value+width(plate)/2],length:shaft.getTotalLength(),shaftHalf:width(shaft)/2,limbBottom:Math.max(...[...el.querySelectorAll("path")].filter(p=>p!==floor).map(p=>Math.max(...Array.from({length:33},(_,j)=>pt(p,p.getTotalLength()*j/32)[1]))+width(p)/2)),
              feet:[near[1],far[2]].map(p=>({points:[pt(p,0),pt(p,p.getTotalLength()/2),end(p)],half:width(p)/2,length:p.getTotalLength()})),
              angles:[near[0],far[1]].map(p=>{const h=pt(p,0),k=pt(p,24);return [angle(neck,hip,k),angle(h,k,end(p))]})});
          }
          return {out,painted:[floor,shaft,plate,near[1],far[2]].every(painted),caps:[shaft,near[1],far[2]].map(p=>getComputedStyle(p).strokeLinecap)};
        },motion!=="reduce");
        const s=samples.out,gap=f=>f.ground-f.plate[1]-f.plate[2];
        expect(samples.painted,label).toBe(true);expect(samples.caps,label).toEqual(["round","round","round"]);
        expect(s,label).toHaveLength(motion==="reduce"?1:129);
        for(const [i,f] of s.entries()){
          const frame=`${label} frame ${i}`;
          expect(f.floor,frame).toEqual(s[0].floor);expect(f.ground,frame).toBeCloseTo(137.3,2);expect(f.limbBottom,frame).toBeLessThanOrEqual(f.ground+.02);
          expect(Math.abs(f.a[1]-f.b[1]),frame).toBeLessThan(.02);expect(f.length,frame).toBeCloseTo(31,1);expect(f.shaftHalf,frame).toBeCloseTo(1,2);
          expect(f.a[0]-f.wrist[0],frame).toBeCloseTo(-3,1);expect(f.b[0]-f.wrist[0],frame).toBeCloseTo(28,1);expect(Math.abs(f.a[1]-f.wrist[1]),frame).toBeLessThan(.02);
          expect(Math.hypot(f.b[0]-f.plate[0],f.b[1]-f.plate[1]),frame).toBeLessThan(.02);expect(f.plate[2],frame).toBeCloseTo(9.3,2);
          expect(gap(f),frame).toBeGreaterThan(-.06);expect(f.ground-Math.max(f.a[1],f.b[1])-f.shaftHalf,frame).toBeGreaterThan(0);
          for(let foot=0;foot<2;foot++){
            expect(f.feet[foot].length,frame).toBeCloseTo(9,2);expect(f.feet[foot].half,frame).toBeCloseTo(1.7,2);
            for(let point=0;point<3;point++){
              const p=f.feet[foot].points[point],anchor=s[0].feet[foot].points[point];
              expect(Math.hypot(p[0]-anchor[0],p[1]-anchor[1]),frame).toBeLessThan(.02);
              expect(p[1],frame).toBeCloseTo(135.6,2);expect(p[1]+f.feet[foot].half,frame).toBeCloseTo(f.ground,2);
            }
          }
          if(i>0&&i<=64){
            expect(gap(f),frame).toBeGreaterThanOrEqual(gap(s[i-1])-.02);
            for(let leg=0;leg<2;leg++)for(let joint=0;joint<2;joint++)expect(f.angles[leg][joint],frame).toBeGreaterThanOrEqual(s[i-1].angles[leg][joint]-.3);
          }
          if(i>64)expect(gap(f),frame).toBeLessThanOrEqual(gap(s[i-1])+.02);
        }
        for(const f of [s[0],s[s.length-1]]){expect(Math.abs(gap(f)),label).toBeLessThan(.06);expect(f.plate[1],label).toBeCloseTo(128,1)}
        if(motion!=="reduce"){
          expect(s[64].plate[1],label).toBeCloseTo(88.6,1);
          for(let leg=0;leg<2;leg++)for(let joint=0;joint<2;joint++){
            expect(s[64].angles[leg][joint]-s[0].angles[leg][joint],label).toBeGreaterThan(joint===0?20:10);
            expect(s[128].angles[leg][joint],label).toBeCloseTo(s[0].angles[leg][joint],2);
          }
          for(const key of ["a","b","wrist","plate"])for(let axis=0;axis<s[0][key].length;axis++)expect(s[128][key][axis],label).toBeCloseTo(s[0][key][axis],2);
        }
        if(mode==="guide")await page.evaluate(()=>{gdEnd();gdClose()});
      }
    }
  });

  for(const motion of ["no-preference","reduce"])for(const mode of ["detail","guide"])
  test(`Romanian deadlift hinges from top with planted painted feet and rigid load (${motion} ${mode})`,async({app,page})=>{
    await app.open({seed:state()});await app.tab("gym");
    expect(await page.evaluate(()=>({template:gEx("rdl").tp,scene:exDef(gEx("rdl")).scene,rest:gRestDef("rdl")}))).toEqual({template:"rdl",scene:"rdl",rest:150});
    await page.emulateMedia({reducedMotion:motion});
        if(mode==="detail")await page.evaluate(()=>exSheet("rdl"));
        else await page.evaluate(()=>{closeSheet();S.templates=[{id:912,name:"RDL figür testi",ex:["rdl"],tg:{rdl:{sets:1,reps:5}}}];gdStart("t:912")});
        const svg=page.locator(mode==="detail"?"#sheet .exfig svg":"#guide .gdfig svg"),label=`${motion} ${mode}`;
        await expect(svg).toBeVisible();await expect(svg).toHaveAttribute("data-fig-view","side");
        await expect(svg).toHaveAttribute("data-fig-motion",motion==="reduce"?"static":"animated");
        await expect(svg.locator("rect,path.fg-prop")).toHaveCount(0);
        await expect(svg.locator("path.fg-floor,path.fg-barshaft,circle.fg-plate")).toHaveCount(3);
        if(motion==="reduce")await expect(svg.locator("animate")).toHaveCount(0);
        else expect(await svg.locator("animate").count()).toBeGreaterThan(0);
        const samples=await svg.evaluate(el=>{
          el.pauseAnimations();
          const floor=el.querySelector("path.fg-floor"),shaft=el.querySelector("path.fg-barshaft"),plate=el.querySelector("circle.fg-plate"),body=el.querySelector("path.fg-body"),near=el.querySelectorAll("path.fg-near"),far=el.querySelectorAll("path.fg-far"),out=[];
          const pt=(p,d)=>{const q=p.getPointAtLength(d);return [q.x,q.y]},end=p=>pt(p,p.getTotalLength()),width=p=>parseFloat(getComputedStyle(p).strokeWidth);
          const angle=(a,b,c)=>{const u=a.map((v,i)=>v-b[i]),v=c.map((n,i)=>n-b[i]);return Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/Math.hypot(...u)/Math.hypot(...v))))*180/Math.PI};
          for(let i=0;i<=128;i++){
            el.setCurrentTime(i*2.6/128);
            const hip=pt(body,0),neck=end(body),a=pt(shaft,0),b=end(shaft),legs=[near[0],far[1]];
            out.push({floor:[pt(floor,0),end(floor)],ground:pt(floor,0)[1]-width(floor)/2,hip,neck,a,b,wrist:end(near[2]),plate:[plate.cx.animVal.value,plate.cy.animVal.value,plate.r.animVal.value],length:shaft.getTotalLength(),finite:[...a,...b,...end(near[2]),plate.cx.animVal.value,plate.cy.animVal.value,plate.r.animVal.value,shaft.getTotalLength()].every(Number.isFinite),
              paths:[...el.querySelectorAll("path")].filter(p=>p!==floor).map(p=>{const box=p.getBBox();return {part:p.getAttribute("class"),box:[box.x,box.y,box.width,box.height],half:width(p)/2,bottom:box.y+box.height+width(p)/2}}),
              feet:[near[1],far[2]].map(p=>[pt(p,0),pt(p,p.getTotalLength()/2),end(p)]),
              legs:legs.map((p,j)=>{const h=pt(p,0),k=pt(p,24),ankle=end(p);return {hipAngle:angle(neck,hip,k),flex:180-angle(h,k,ankle),hipGap:Math.hypot(h[0]-hip[0],h[1]-hip[1]),footGap:Math.hypot(ankle[0]-pt([near[1],far[2]][j],0)[0],ankle[1]-pt([near[1],far[2]][j],0)[1])}}),
              shoulderGaps:[near[2],far[0]].map(p=>{const q=pt(p,0);return Math.hypot(q[0]-neck[0],q[1]-neck[1]-2)}),farWrist:end(far[0])});
          }
          const parts=[floor,...el.querySelectorAll("path:not(.fg-floor),circle.fg-plate")];
          return {out,visible:parts.every(p=>{const s=getComputedStyle(p);return s.stroke!=="none"&&s.visibility==="visible"&&+s.opacity>0&&+s.strokeOpacity>0&&Number.isFinite(width(p))&&width(p)>0}),legWidths:[near[0],near[1],far[1],far[2]].map(width),shaftWidth:width(shaft),plateWidth:width(plate),caps:[...el.querySelectorAll("path")].map(p=>getComputedStyle(p).strokeLinecap)};
        });
        const s=samples.out,gap=f=>f.ground-f.plate[1]-f.plate[2]-samples.plateWidth/2;
        expect(s,label).toHaveLength(129);expect(samples.visible,label).toBe(true);
        expect(samples.legWidths,label).toEqual([3.4,3.4,3.4,3.4]);expect(samples.shaftWidth,label).toBe(2);expect(samples.plateWidth,label).toBe(1.6);
        expect(samples.caps.every(c=>c==="round"),label).toBe(true);
        for(const [i,f] of s.entries()){
          const frame=`${label} frame ${i}`;
          expect(f.finite,`${frame} finite shaft and load`).toBe(true);
          expect(f.floor,frame).toEqual([[8,138],[152,138]]);expect(f.ground,frame).toBeCloseTo(137.3,2);
          // Exact path bounds include every calf/arm/shaft, plus painted round-cap radius.
          for(const p of f.paths)expect(p.bottom,`${frame} ${p.part}`).toBeLessThanOrEqual(f.ground+.02);
          expect(f.length,frame).toBeCloseTo(31,2);expect(Math.abs(f.a[1]-f.b[1]),frame).toBeLessThan(.02);
          expect(f.a[0]-f.wrist[0],frame).toBeCloseTo(-3,2);expect(f.b[0]-f.wrist[0],frame).toBeCloseTo(28,2);
          expect(Math.abs(f.a[1]-f.wrist[1]),frame).toBeLessThan(.02);expect(f.farWrist,frame).toEqual(f.wrist);
          expect(Math.hypot(f.b[0]-f.plate[0],f.b[1]-f.plate[1]),frame).toBeLessThan(.02);expect(f.plate[2],frame).toBe(8.5);
          expect(gap(f),frame).toBeGreaterThanOrEqual(-.02);expect(f.ground-Math.max(f.a[1],f.b[1])-samples.shaftWidth/2,frame).toBeGreaterThanOrEqual(-.02);
          for(let leg=0;leg<2;leg++){
            // Schematic regression bounds, not clinical knee-angle or setup advice.
            expect(f.legs[leg].flex,frame).toBeGreaterThan(1);expect(f.legs[leg].flex,frame).toBeLessThan(35);
            expect(f.legs[leg].hipGap,frame).toBeLessThan(.02);expect(f.legs[leg].footGap,frame).toBeLessThan(.02);expect(f.shoulderGaps[leg],frame).toBeLessThan(.12);
            for(let point=0;point<3;point++){
              const p=f.feet[leg][point];expect(p,frame).toEqual(s[0].feet[leg][point]);expect(p[1],frame).toBeCloseTo(135.6,2);expect(p[1]+samples.legWidths[leg]/2,frame).toBeCloseTo(f.ground,2);
            }
          }
          if(motion==="reduce")expect(f,frame).toEqual(s[0]);
          else if(i){
            const lower=i<=64,prev=s[i-1];
            expect((f.plate[1]-prev.plate[1])*(lower?1:-1),frame).toBeGreaterThanOrEqual(-.02);
            expect((f.hip[0]-prev.hip[0])*(lower?-1:1),frame).toBeGreaterThanOrEqual(-.02);
            for(let leg=0;leg<2;leg++)expect((f.legs[leg].hipAngle-prev.legs[leg].hipAngle)*(lower?-1:1),frame).toBeGreaterThanOrEqual(-.3);
          }
        }
        expect(Math.abs(s[0].neck[0]-s[0].hip[0]),label).toBeLessThan(.02);expect(s[0].neck[1],label).toBeLessThan(s[0].hip[1]-35);
        expect(gap(s[0]),`${label} top load stays off floor`).toBeGreaterThan(20);
        // SMIL's loop boundary can retain ~8e-6 coordinate interpolation residue.
        for(const key of ["hip","neck","a","b","wrist","farWrist","plate"])for(let axis=0;axis<s[0][key].length;axis++)expect(s[128][key][axis],`${label} top return ${key}`).toBeCloseTo(s[0][key][axis],3);
        for(let leg=0;leg<2;leg++)for(const key of ["hipAngle","flex"])expect(s[128].legs[leg][key],`${label} top return ${key}`).toBeCloseTo(s[0].legs[leg][key],3);
        for(let p=0;p<s[0].paths.length;p++)for(let axis=0;axis<4;axis++)expect(s[128].paths[p].box[axis],`${label} path return ${p}`).toBeCloseTo(s[0].paths[p].box[axis],3);
        if(motion!=="reduce"){
          expect(s[64].hip[0],label).toBeLessThan(s[0].hip[0]-9);expect(s[64].neck[0],label).toBeGreaterThan(s[64].hip[0]+30);
          expect(s[64].plate[1]-s[0].plate[1],label).toBeGreaterThan(15);
          for(let leg=0;leg<2;leg++)expect(s[0].legs[leg].hipAngle-s[64].legs[leg].hipAngle,label).toBeGreaterThan(20);
        }
        if(mode==="guide")await page.evaluate(()=>{gdEnd();gdClose()});
  });

  test("Romanian deadlift first cue explains lowering, return and schematic limits in detail and guide",async({app,page})=>{
    await app.open({seed:state()});await app.tab("gym");
    for(const mode of ["detail","guide"]){
      if(mode==="detail")await page.evaluate(()=>exSheet("rdl"));
      else await page.evaluate(()=>{closeSheet();S.templates=[{id:913,name:"RDL ipucu testi",ex:["rdl"],tg:{rdl:{sets:1,reps:5}}}];gdStart("t:913")});
      const cue=page.locator(mode==="detail"?"#sheet .cues li":"#guide .gdc").first();
      for(const clause of ["Ayakta üst konumda ayaklarını yere sağlam bas","dizlerini hafif bükük tut","sırtını doğal konumunda tutarak kalçanı geriye it","barı bacaklarına yakın kontrollü indir","kalçanı açarak üst konuma dön","ilk yerden alış kurulumunu göstermez","her tekrarda zemine temas şart değildir","Çizim şematiktir","açık izdüşüm","yatay bar konumu ve hareket açıları kişisel kurulum önerisi değildir"])await expect(cue).toContainText(clause);
      if(mode==="guide")await page.evaluate(()=>{gdEnd();gdClose()});
    }
  });

  for(const motion of ["no-preference","reduce"])for(const mode of ["detail","guide"])
  test(`single-leg kettlebell deadlift hinges on support leg with raised free leg (${motion} ${mode})`,async({app,page})=>{
    await app.open({seed:state()});await app.tab("gym");
    expect(await page.evaluate(()=>({template:gEx("kbdl1").tp,scene:exDef(gEx("kbdl1")).scene,rest:gRestDef("kbdl1")}))).toEqual({template:"kbdl1",scene:"kbdl1",rest:150});
    await page.emulateMedia({reducedMotion:motion});
    if(mode==="detail")await page.evaluate(()=>exSheet("kbdl1"));
    else await page.evaluate(()=>{closeSheet();S.templates=[{id:914,name:"Kettlebell tek bacak testi",ex:["kbdl1"],tg:{kbdl1:{sets:1,reps:5}}}];gdStart("t:914")});
    const svg=page.locator(mode==="detail"?"#sheet .exfig svg":"#guide .gdfig svg"),label=`${motion} ${mode}`;
    await expect(svg).toBeVisible();await expect(svg).toHaveAttribute("data-fig-view","side");
    await expect(svg).toHaveAttribute("data-fig-motion",motion==="reduce"?"static":"animated");
    await expect(svg.locator("rect.fg-prop")).toHaveCount(0);
    await expect(svg.locator("circle.fg-plate")).toHaveCount(1);
    await expect(svg.locator("path.fg-prop")).toHaveCount(1);
    if(motion==="reduce")await expect(svg.locator("animate")).toHaveCount(0);
    else expect(await svg.locator("animate").count()).toBeGreaterThan(0);
    const samples=await svg.evaluate(el=>{
      el.pauseAnimations();
      const floor=el.querySelector("path.fg-floor"),handle=el.querySelector("path.fg-prop"),plate=el.querySelector("circle.fg-plate"),body=el.querySelector("path.fg-body"),near=el.querySelectorAll("path.fg-near"),far=el.querySelectorAll("path.fg-far"),out=[];
      const pt=(p,d)=>{const q=p.getPointAtLength(d);return [q.x,q.y]},end=p=>pt(p,p.getTotalLength()),width=p=>parseFloat(getComputedStyle(p).strokeWidth);
      const angle=(a,b,c)=>{const u=a.map((v,i)=>v-b[i]),v=c.map((n,i)=>n-b[i]);return Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/Math.hypot(...u)/Math.hypot(...v))))*180/Math.PI};
      for(let i=0;i<=128;i++){
        el.setCurrentTime(i*2.6/128);
        const hip=pt(body,0),neck=end(body),wrist=end(near[2]);
        const sLeg=near[0],sFoot=near[1],fLeg=far[1],fFoot=far[2];
        const sHip=pt(sLeg,0),sKnee=pt(sLeg,24),sAnkle=end(sLeg);
        const fAnkle=end(fLeg);
        const flex=180-angle(sHip,sKnee,sAnkle);
        const ground=pt(floor,0)[1]-width(floor)/2;
        const cx=plate.cx.animVal.value,cy=plate.cy.animVal.value,r=plate.r.animVal.value;
        const footPts=[pt(sFoot,0),pt(sFoot,sFoot.getTotalLength()/2),end(sFoot)];
        const paths=[...el.querySelectorAll("path")].filter(p=>p!==floor).map(p=>{const box=p.getBBox();return {part:p.getAttribute("class"),box:[box.x,box.y,box.width,box.height],half:width(p)/2,bottom:box.y+box.height+width(p)/2}});
        out.push({floor:[pt(floor,0),end(floor)],ground,hip,neck,wrist,plate:[cx,cy,r],supportAnkle:sAnkle,supportFootPts:footPts,supportFlex:flex,freeAnkle:fAnkle,paths,finite:[...wrist,cx,cy,r,...sAnkle,...fAnkle].every(Number.isFinite)});
      }
      const parts=[floor,handle,plate,...el.querySelectorAll("path:not(.fg-floor)")];
      return {out,visible:parts.every(p=>{const s=getComputedStyle(p);return s.stroke!=="none"&&s.visibility==="visible"&&+s.opacity>0&&+s.strokeOpacity>0&&Number.isFinite(width(p))&&width(p)>0}),legWidths:[near[0],near[1],far[1],far[2]].map(width),handleWidth:width(handle),plateWidth:width(plate),caps:[...el.querySelectorAll("path")].map(p=>getComputedStyle(p).strokeLinecap)};
    });
    const s=samples.out,gap=f=>f.ground-f.plate[1]-f.plate[2]-samples.plateWidth/2;
    expect(s,label).toHaveLength(129);expect(samples.visible,label).toBe(true);
    expect(samples.handleWidth,label).toBe(1.6);expect(samples.legWidths,label).toEqual([3.4,3.4,3.4,3.4]);expect(samples.plateWidth,label).toBe(1.6);
    expect(samples.caps.every(c=>c==="round"),label).toBe(true);
    for(const [i,f] of s.entries()){
      const frame=`${label} frame ${i}`;
      expect(f.finite,frame).toBe(true);
      expect(f.floor,frame).toEqual([[8,138],[152,138]]);expect(f.ground,frame).toBeCloseTo(137.3,2);
      for(const p of f.paths)expect(p.bottom,`${frame} ${p.part}`).toBeLessThanOrEqual(f.ground+.02);
      expect(f.plate[2],frame).toBe(5.5);
      expect(f.plate[0]-f.wrist[0],frame).toBeCloseTo(0,2);
      expect(f.plate[1]-(f.wrist[1]+4),frame).toBeCloseTo(0,2);
      expect(gap(f),frame).toBeGreaterThan(0);
      expect(f.supportAnkle[1],frame).toBeCloseTo(135.6,2);
      expect(f.supportAnkle[1]+samples.legWidths[0]/2,frame).toBeCloseTo(137.3,2);
      for(const p of f.supportFootPts){
        expect(p[1],frame).toBeCloseTo(135.6,2);
        expect(p[1]+samples.legWidths[1]/2,frame).toBeCloseTo(137.3,2);
      }
      for(let point=0;point<3;point++)expect(f.supportFootPts[point],frame).toEqual(s[0].supportFootPts[point]);
      expect(f.supportAnkle,frame).toEqual(s[0].supportAnkle);
      expect(f.supportFlex,frame).toBeGreaterThan(1);expect(f.supportFlex,frame).toBeLessThan(35);
      expect(f.freeAnkle[1]+samples.legWidths[2]/2,frame).toBeLessThan(f.ground-2);
      if(motion==="reduce")expect(f,frame).toEqual(s[0]);
      else if(i){
        const lower=i<=64,prev=s[i-1];
        expect((f.plate[1]-prev.plate[1])*(lower?1:-1),frame).toBeGreaterThanOrEqual(-.02);
      }
    }
    for(const key of ["hip","neck","wrist","plate"])for(let axis=0;axis<s[0][key].length;axis++)expect(s[128][key][axis],`${label} top return ${key}`).toBeCloseTo(s[0][key][axis],2);
    expect(s[128].supportFlex,`${label} top return supportFlex`).toBeCloseTo(s[0].supportFlex,2);
    expect(s[128].freeAnkle[0],`${label} top return freeAnkle x`).toBeCloseTo(s[0].freeAnkle[0],2);
    expect(s[128].freeAnkle[1],`${label} top return freeAnkle y`).toBeCloseTo(s[0].freeAnkle[1],2);
    for(let p=0;p<s[0].paths.length;p++)for(let axis=0;axis<4;axis++)expect(s[128].paths[p].box[axis],`${label} path return ${p}`).toBeCloseTo(s[0].paths[p].box[axis],2);
    if(motion!=="reduce"){
      expect(s[64].hip[0]-s[64].freeAnkle[0],label).toBeGreaterThan(15);
      expect(s[64].plate[1]-s[0].plate[1],label).toBeGreaterThan(15);
    }
    if(mode==="guide")await page.evaluate(()=>{gdEnd();gdClose()});
  });

  test("single-leg kettlebell deadlift first cue in detail and guide checking clauses",async({app,page})=>{
    await app.open({seed:state()});await app.tab("gym");
    for(const mode of ["detail","guide"]){
      if(mode==="detail")await page.evaluate(()=>exSheet("kbdl1"));
      else await page.evaluate(()=>{closeSheet();S.templates=[{id:914,name:"Kettlebell tek bacak testi",ex:["kbdl1"],tg:{kbdl1:{sets:1,reps:5}}}];gdStart("t:914")});
      const cue=page.locator(mode==="detail"?"#sheet .cues li":"#guide .gdc").first();
      for(const clause of ["Tek bacak üzerinde dur","aynı taraftaki elinde kettlebell tut","destek dizini hafif bükük tut","serbest bacağını denge için geriye uzat","kontrollü üst konuma dön","Çizim şematiktir","kişisel denge önerisi değildir"])await expect(cue).toContainText(clause);
      if(mode==="guide")await page.evaluate(()=>{gdEnd();gdClose()});
    }
  });

  test("deficit deadlift keeps painted feet planted and grounded load clear in detail and guide",async({app,page})=>{
    await app.open({seed:state()});await app.tab("gym");
    for(const motion of ["no-preference","reduce"]){
      await page.emulateMedia({reducedMotion:motion});
      for(const mode of ["detail","guide"]){
        if(mode==="detail")await page.evaluate(()=>exSheet("defdl"));
        else await page.evaluate(()=>{closeSheet();S.templates=[{id:909,name:"Defisit figür testi",ex:["defdl"],tg:{defdl:{sets:1,reps:5}}}];gdStart("t:909")});
        const svg=page.locator(mode==="detail"?"#sheet .exfig svg":"#guide .gdfig svg");await expect(svg).toBeVisible();
        await expect(svg).toHaveAttribute("data-fig-view","side");
        await expect(svg).toHaveAttribute("data-fig-motion",motion==="reduce"?"static":"animated");
        if(motion==="reduce")await expect(svg.locator("animate")).toHaveCount(0);
        else expect(await svg.locator("animate").count()).toBeGreaterThan(0);
        const samples=await svg.evaluate((el,animated)=>{
          el.pauseAnimations();
          const platform=el.querySelector("rect.fg-prop"),floor=el.querySelector("path.fg-floor"),shaft=el.querySelector("path.fg-barshaft"),plate=el.querySelector("circle.fg-plate"),body=el.querySelector("path.fg-body"),near=el.querySelectorAll("path.fg-near"),far=el.querySelectorAll("path.fg-far"),out=[];
          const pt=(p,d)=>{const q=p.getPointAtLength(d);return [q.x,q.y]},end=p=>pt(p,p.getTotalLength()),width=p=>parseFloat(getComputedStyle(p).strokeWidth);
          const angle=(a,b,c)=>{const u=a.map((v,i)=>v-b[i]),v=c.map((n,i)=>n-b[i]);return Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/Math.hypot(...u)/Math.hypot(...v))))*180/Math.PI};
          const painted=p=>{const s=getComputedStyle(p);return s.stroke!=="none"&&s.visibility==="visible"&&+s.opacity>0&&width(p)>0};
          for(let i=0;i<=(animated?128:0);i++){
            el.setCurrentTime(i*2.6/128);
            const half=width(platform)/2,box=[platform.x.animVal.value-half,platform.y.animVal.value-half,platform.x.animVal.value+platform.width.animVal.value+half,platform.y.animVal.value+platform.height.animVal.value+half];
            const a=pt(shaft,0),b=end(shaft),wrist=end(near[2]),cx=plate.cx.animVal.value,cy=plate.cy.animVal.value,r=plate.r.animVal.value+width(plate)/2,ground=pt(floor,0)[1]-width(floor)/2;
            const dx=Math.max(box[0]-cx,cx-box[2],0),dy=Math.max(box[1]-cy,cy-box[3],0);
            // Full painted rectangle over-approximates rounded corners: positive gaps prove no overlap.
            const sx=Math.max(box[0]-Math.max(a[0],b[0]),Math.min(a[0],b[0])-box[2],0),sy=Math.max(box[1]-a[1],a[1]-box[3],0);
            const feet=[near[1],far[2]].map(p=>({points:[pt(p,0),pt(p,p.getTotalLength()/2),end(p)],half:width(p)/2,length:p.getTotalLength()}));
            const hip=pt(body,0),neck=end(body),legs=[near[0],far[1]];
            out.push({box,ground,a,b,wrist,plate:[cx,cy,r],gap:ground-cy-r,tilt:Math.abs(a[1]-b[1]),length:shaft.getTotalLength(),shaftHalf:width(shaft)/2,plateClear:Math.hypot(dx,dy)-r,shaftClear:Math.hypot(sx,sy)-width(shaft)/2,feet,angles:legs.map(p=>{const h=pt(p,0),k=pt(p,24),ankle=end(p);return [angle(neck,hip,k),angle(h,k,ankle)]})});
          }
          return {out,painted:[platform,floor,shaft,plate,near[1],far[2]].every(painted),caps:[shaft,near[1],far[2]].map(p=>getComputedStyle(p).strokeLinecap)};
        },motion!=="reduce");
        const s=samples.out,label=`${motion} ${mode}`;
        expect(samples.painted,label).toBe(true);expect(samples.caps,label).toEqual(["round","round","round"]);
        expect(s,label).toHaveLength(motion==="reduce"?1:129);
        expect(s[0].box[1],label).toBeCloseTo(125,2);expect(s[0].box[3],label).toBeCloseTo(137.3,2);
        expect(s[0].ground,label).toBeCloseTo(137.3,2);
        for(const [i,f] of s.entries()){
          const frame=`${label} frame ${i}`;
          expect(f.box,frame).toEqual(s[0].box);expect(f.ground,frame).toBeCloseTo(137.3,2);
          expect(f.tilt,frame).toBeLessThan(.02);expect(f.length,frame).toBeCloseTo(31,1);expect(f.shaftHalf,frame).toBeCloseTo(1,2);
          expect(f.a[0]-f.wrist[0],frame).toBeCloseTo(-3,1);expect(f.b[0]-f.wrist[0],frame).toBeCloseTo(28,1);
          expect(Math.abs(f.a[1]-f.wrist[1]),frame).toBeLessThan(.02);
          expect(Math.hypot(f.b[0]-f.plate[0],f.b[1]-f.plate[1]),frame).toBeLessThan(.02);expect(f.plate[2],frame).toBeCloseTo(9.3,2);
          expect(f.plateClear,frame).toBeGreaterThan(0);expect(f.shaftClear,frame).toBeGreaterThan(0);expect(f.gap,frame).toBeGreaterThan(-.06);
          for(let foot=0;foot<2;foot++){
            expect(f.feet[foot].length,frame).toBeCloseTo(9,2);expect(f.feet[foot].half,frame).toBeCloseTo(1.7,2);
            for(let point=0;point<3;point++){
              const p=f.feet[foot].points[point],anchor=s[0].feet[foot].points[point];
              expect(Math.hypot(p[0]-anchor[0],p[1]-anchor[1]),frame).toBeLessThan(.02);
              expect(p[1]+f.feet[foot].half,frame).toBeCloseTo(125,2);
              expect(p[0]-f.feet[foot].half,frame).toBeGreaterThanOrEqual(f.box[0]+3);expect(p[0]+f.feet[foot].half,frame).toBeLessThanOrEqual(f.box[2]-3);
            }
          }
          if(i>0&&i<=64){
            expect(f.gap,frame).toBeGreaterThanOrEqual(s[i-1].gap-.02);
            for(let leg=0;leg<2;leg++)for(let joint=0;joint<2;joint++)expect(f.angles[leg][joint],frame).toBeGreaterThanOrEqual(s[i-1].angles[leg][joint]-.3);
          }
          if(i>64)expect(f.gap,frame).toBeLessThanOrEqual(s[i-1].gap+.02);
        }
        for(const f of [s[0],s[s.length-1]]){
          expect(Math.abs(f.gap),label).toBeLessThan(.06);expect(f.a[1],label).toBeCloseTo(128,1);expect(f.a[1]-f.shaftHalf,label).toBeGreaterThan(f.box[1]);
          for(const foot of f.feet)for(const p of foot.points)expect(p[1],label).toBeCloseTo(123.3,2);
        }
        if(motion!=="reduce"){
          expect(s[64].gap,label).toBeGreaterThan(15);
          for(let leg=0;leg<2;leg++)for(let joint=0;joint<2;joint++)expect(s[64].angles[leg][joint]-s[0].angles[leg][joint],label).toBeGreaterThan(20);
          for(const key of ["a","b","wrist","plate"])for(let axis=0;axis<s[0][key].length;axis++)expect(s[128][key][axis],label).toBeCloseTo(s[0][key][axis],2);
          for(let leg=0;leg<2;leg++)for(let joint=0;joint<2;joint++)expect(s[128].angles[leg][joint],label).toBeCloseTo(s[0].angles[leg][joint],2);
        }
        if(mode==="guide")await page.evaluate(()=>{gdEnd();gdClose()});
      }
    }
  });

  test("deficit deadlift first cue explains platform, controlled lift, extension and floor return in detail and guide",async({app,page})=>{
    await app.open({seed:state()});await app.tab("gym");
    for(const mode of ["detail","guide"]){
      if(mode==="detail")await page.evaluate(()=>exSheet("defdl"));
      else await page.evaluate(()=>{closeSheet();S.templates=[{id:910,name:"Defisit ipucu testi",ex:["defdl"],tg:{defdl:{sets:1,reps:5}}}];gdStart("t:910")});
      const cue=page.locator(mode==="detail"?"#sheet .cues li":"#guide .gdc").first();
      for(const clause of ["Sağlam ve kaymayan yükseltilmiş platform", "ayaklarını sabitle", "barı zeminden kontrollü kaldır", "kalça ve dizlerini açarak doğrul", "barı kontrollü zemine indir", "Çizim şematiktir", "platform yüksekliği kişisel ayar önerisi değildir", "açık bir izdüşüm", "yatay bar konumu kişisel kurulum önerisi değildir"])await expect(cue).toContainText(clause);
      if(mode==="guide")await page.evaluate(()=>{gdEnd();gdClose()});
    }
  });

  test("heeltoe detail and guide take two forward contact steps then freeze",async({app,page})=>{
    await page.emulateMedia({reducedMotion:"no-preference"});await app.open({seed:state()});await app.tab("gym");
    for(const mode of ["detail","guide"]){
      if(mode==="detail")await page.evaluate(()=>exSheet("heeltoe"));
      else await page.evaluate(()=>{closeSheet();S.templates=[{id:906,name:"Temas testi",ex:["heeltoe"],tg:{heeltoe:{sets:1,reps:5}}}];gdStart("t:906")});
      const svg=page.locator(mode==="detail"?"#sheet .exfig svg":"#guide svg").first();await expect(svg).toBeVisible();
      await expect(page.locator(mode==="detail"?"#sheet .cues":"#guide .gdc").first()).toContainText("İki ileri adım gösterilir, sonra durur");
      const samples=await svg.evaluate(el=>{
        el.pauseAnimations();const n=el.querySelectorAll("path.fg-near"),f=el.querySelectorAll("path.fg-far"),body=el.querySelector("path.fg-body"),out=[];
        const end=p=>{const q=p.getPointAtLength(p.getTotalLength());return [q.x,q.y]};
        for(let i=0;i<=128;i++){
          el.setCurrentTime(i*2.6/128);const hip=body.getPointAtLength(0);
          out.push({n:end(n[0]),nt:end(n[1]),f:end(f[1]),ft:end(f[2]),hip:hip.x});
        }
        const frozen=[];for(const t of [2.7,5.2,7.8]){el.setCurrentTime(t);frozen.push({n:end(n[0]),nt:end(n[1]),f:end(f[1]),ft:end(f[2]),hip:body.getPointAtLength(0).x})}
        return {out,frozen,channels:[...el.querySelectorAll("animate")].map(a=>[a.getAttribute("repeatCount"),a.getAttribute("fill")])};
      });
      const s=samples.out;
      for(let i=0;i<=128;i++)for(const key of i<=64?["f","ft"]:["n","nt"]){
        const anchor=i<=64?s[0]:s[64];expect(Math.abs(s[i][key][0]-anchor[key][0])).toBeLessThan(.02);expect(Math.abs(s[i][key][1]-136)).toBeLessThan(.02);
      }
      for(const i of [0,64,128]){
        const front=s[i].n[0]>s[i].f[0]?"n":"f",rear=front==="n"?"f":"n";
        expect(Math.hypot(s[i][front][0]-s[i][rear+"t"][0],s[i][front][1]-s[i][rear+"t"][1])).toBeLessThan(.02);
      }
      expect(s[32].n[1]).toBeLessThan(129);expect(s[96].f[1]).toBeLessThan(129);
      expect(s[128].hip-s[0].hip).toBeCloseTo(18,1);
      for(const frame of samples.frozen)for(const key of ["n","nt","f","ft"])for(let axis=0;axis<2;axis++)expect(Math.abs(frame[key][axis]-s[128][key][axis])).toBeLessThan(.02);
      expect(samples.channels.length).toBeGreaterThan(0);expect(samples.channels.every(c=>c[0]==="1"&&c[1]==="freeze")).toBe(true);
    }
    await page.evaluate(()=>{gdEnd();gdClose()});
    await page.emulateMedia({reducedMotion:"reduce"});await page.evaluate(()=>exSheet("heeltoe"));
    const still=page.locator("#sheet .exfig svg");await expect(still).toHaveAttribute("data-fig-motion","static");await expect(still.locator("animate")).toHaveCount(0);
    await page.emulateMedia({reducedMotion:"no-preference"});await page.evaluate(()=>{closeSheet();exSheet("heeltoe")});
    const replay=await still.evaluate(el=>{el.pauseAnimations();el.setCurrentTime(0);return el.querySelector("path.fg-body").getPointAtLength(0).x});expect(replay).toBeCloseTo(80,1);
  });

  test("side step detail and guide alternate planted support without sliding",async({app,page})=>{
    await page.emulateMedia({reducedMotion:"no-preference"});await app.open({seed:state()});await app.tab("gym");
    for(const mode of ["detail","guide"]){
      if(mode==="detail")await page.evaluate(()=>exSheet("sidestep"));
      else await page.evaluate(()=>{closeSheet();S.templates=[{id:905,name:"Yana adım testi",ex:["sidestep"],tg:{sidestep:{sets:1,reps:5}}}];gdStart("t:905")});
      const svg=page.locator(mode==="detail"?"#sheet .exfig svg":"#guide svg").first();await expect(svg).toBeVisible();
      await expect(svg).toHaveAttribute("data-fig-view","front");
      const samples=await svg.evaluate(el=>{
        el.pauseAnimations();const n=el.querySelectorAll("path.fg-near"),f=el.querySelectorAll("path.fg-far"),body=el.querySelector("path.fg-body"),out=[];
        const end=p=>{const q=p.getPointAtLength(p.getTotalLength());return [q.x,q.y]};
        for(let i=0;i<=128;i++){
          el.setCurrentTime(i*2.6/128);const hip=body.getPointAtLength(0);
          out.push({n:end(n[0]),f:end(f[1]),nt:end(n[1]),ft:end(f[2]),hip:[hip.x,hip.y]});
        }return out;
      });
      for(let i=0;i<samples.length;i++){
        const s=samples[i],phase=Math.min(3,Math.floor(i/32)),support=["f","n","n","f"][phase];
        expect(Math.abs(s[support][0]-[75,95,95,75][phase])).toBeLessThan(.02);
        expect(Math.abs(s[support][1]-136)).toBeLessThan(.02);expect(Math.abs(s[support+"t"][1]-136)).toBeLessThan(.02);
      }
      for(const [i,swing] of [[16,"n"],[48,"f"],[80,"f"],[112,"n"]])expect(samples[i][swing][1]).toBeLessThan(132);
      expect(samples[32].n[0]).toBeCloseTo(95,1);expect(samples[32].f[0]).toBeCloseTo(75,1);
      expect(samples[64].f[0]).toBeCloseTo(85,1);expect(samples[64].hip[0]-samples[0].hip[0]).toBeCloseTo(10,1);
      for(const key of Object.keys(samples[0]))for(let axis=0;axis<2;axis++)expect(Math.abs(samples[128][key][axis]-samples[0][key][axis])).toBeLessThan(.02);
    }
    await page.evaluate(()=>{gdEnd();gdClose()});await page.emulateMedia({reducedMotion:"reduce"});
    await page.evaluate(()=>exSheet("sidestep"));const still=page.locator("#sheet .exfig svg");
    await expect(still).toHaveAttribute("data-fig-motion","static");await expect(still.locator("animate")).toHaveCount(0);
  });

  test("wide and narrow squat cues match across detail and guided mode",async({app,page})=>{
    await app.open({seed:state()});await app.tab("gym");
    for(const [id,phrase] of [["widesquat","omuz genişliğinden daha geniş"],["narrowsquat","omuz genişliğinden daha dar"]]){
      await page.evaluate(id=>exSheet(id),id);
      await expect(page.locator("#sheet .cues")).toContainText(phrase);
      await expect(page.locator("#sheet .cues")).toContainText("genel squat");
      await expect(page.locator("#sheet .cues")).not.toContainText("Ayaklar omuz genişliğinde,");
      await page.evaluate(id=>{closeSheet();S.templates=[{id:901,name:"Duruş testi",ex:[id],tg:{[id]:{sets:1,reps:5}}}];gdStart("t:901")},id);
      await expect(page.locator("#guide .gdc").first()).toContainText(phrase);
      await page.evaluate(()=>{gdEnd();gdClose()});
    }
  });

  test("shoulder-loaded good morning cues match detail and guided mode",async({app,page})=>{
    await app.open({seed:state()});await app.tab("gym");
    for(const id of ["goodmorning","stiffgm"]){
      await page.evaluate(id=>exSheet(id),id);
      await expect(page.locator("#sheet .cues")).toContainText("Barı üst sırtta");
      await expect(page.locator("#sheet .cues")).not.toContainText("ağırlığı bacaklara yakın");
      await page.evaluate(id=>{closeSheet();S.templates=[{id:902,name:"Menteşe testi",ex:[id],tg:{[id]:{sets:1,reps:5}}}];gdStart("t:902")},id);
      await expect(page.locator("#guide .gdc").first()).toContainText("Barı üst sırtta");
      await page.evaluate(()=>{gdEnd();gdClose()});
    }
    await page.evaluate(()=>exSheet("deadlift"));await expect(page.locator("#sheet .cues")).toContainText("ağırlığı bacaklara yakın");
  });

  test("seated good morning keeps hip on seat and feet planted while hinging",async({app,page})=>{
    await page.emulateMedia({reducedMotion:"no-preference"});await app.open({seed:state()});await app.tab("gym");
    await page.evaluate(()=>exSheet("seatedgm"));const svg=page.locator("#sheet .exfig svg");await expect(svg).toBeVisible();
    await expect(page.locator("#sheet .cues")).toContainText("Oturarak");await expect(page.locator("#sheet .cues")).toContainText("Barı üst sırtta");
    const samples=await svg.evaluate(el=>{
      el.pauseAnimations();const body=el.querySelector("path.fg-body"),seat=el.querySelector("path.fg-prop"),near=el.querySelectorAll("path.fg-near"),far=el.querySelectorAll("path.fg-far"),plate=el.querySelector("circle.fg-plate");
      const pt=(p,end)=>{const q=p.getPointAtLength(end?p.getTotalLength():0);return [q.x,q.y]};
      return [0,.65,1.3,1.95,2.6].map(t=>{el.setCurrentTime(t);return {hip:pt(body,false),neck:pt(body,true),seat:[pt(seat,false),pt(seat,true)],feet:[pt(near[0],true),pt(near[1],true),pt(far[1],true),pt(far[2],true)],plate:[plate.cx.animVal.value,plate.cy.animVal.value]}});
    });
    expect(samples[2].neck[0]).toBeGreaterThan(samples[0].neck[0]+15);expect(samples[2].neck[1]).toBeGreaterThan(samples[0].neck[1]+5);
    for(const s of samples){
      expect(s.seat).toEqual(samples[0].seat);expect(s.hip).toEqual(samples[0].hip);
      expect(Math.abs(s.hip[1]-s.seat[0][1])).toBeLessThan(.01);expect(s.hip[0]>=s.seat[0][0]&&s.hip[0]<=s.seat[1][0]).toBe(true);
      for(let i=0;i<4;i++){expect(s.feet[i]).toEqual(samples[0].feet[i]);expect(Math.abs(s.feet[i][1]-136)).toBeLessThan(.01);}
      expect(Math.hypot(s.plate[0]-s.neck[0],s.plate[1]-s.neck[1]-1)).toBeLessThan(.11);
    }
    await page.emulateMedia({reducedMotion:"reduce"});await page.evaluate(()=>exSheet("seatedgm"));await expect(svg.locator("animate")).toHaveCount(0);await expect(svg).toHaveAttribute("data-fig-motion","static");
    await page.evaluate(()=>{closeSheet();S.templates=[{id:903,name:"Oturarak menteşe",ex:["seatedgm"],tg:{seatedgm:{sets:1,reps:5}}}];gdStart("t:903")});
    await expect(page.locator("#guide .gdc").first()).toContainText("Oturarak");await page.evaluate(()=>{gdEnd();gdClose()});
  });

  test("fast and slow walking explain tempo without presenting animation as target cadence",async({app,page})=>{
    await app.open({seed:state()});await app.tab("gym");
    for(const [id,phrase] of [["fastwalk","Tempolu yürü"],["slowwalk","Yavaş ve rahat yürü"]]){
      await page.evaluate(id=>exSheet(id),id);
      await expect(page.locator("#sheet .cues")).toContainText(phrase);await expect(page.locator("#sheet .cues")).toContainText("Animasyon hız hedefi göstermez");
      await page.evaluate(id=>{closeSheet();S.templates=[{id:904,name:"Yürüyüş testi",ex:[id],tg:{[id]:{sets:1,reps:5}}}];gdStart("t:904")},id);
      await expect(page.locator("#guide .gdc").first()).toContainText(phrase);await expect(page.locator("#guide .gdc").first()).toContainText("Animasyon hız hedefi göstermez");
      await page.evaluate(()=>{gdEnd();gdClose()});
    }
  });

  test("figure pilot gallery renders 9 families cleanly with opt-in volume and ghost",async({page})=>{
    await page.goto("/figure-pilot.html");
    await expect(page.locator("h1")).toContainText("NeoWell Çöp Adam 2.5D Görsel Pilot Matrisi");
    const cards=page.locator("section.card");
    await expect(cards).toHaveCount(9);
    const volSvgs=page.locator('svg[data-fig-variant="volume"]');
    await expect(volSvgs).toHaveCount(9);
    for(let i=0;i<9;i++){
      const s=volSvgs.nth(i);
      await expect(s.locator('[data-ground-shadow="fixed"]')).toBeVisible();
      await expect(s.locator('[data-ghost="start"]')).toBeAttached();
      await expect(s.locator('[data-ghost="end"]')).toBeAttached();
    }
  });

  test("all shipped navigation tabs open real screens",async({app,page})=>{
    await app.open({seed:state()});
    for(const tab of ["today","gym","trend","more"]){
      await app.tab(tab);
      await expect(page.locator("#view")).not.toBeEmpty();
    }
    for(const tab of ["settings-profile","settings-modules","settings-data"]){
      await app.go(tab);
      await expect(page.locator("#view")).not.toBeEmpty();
    }
  });

  test("food search stays local and selecting food keeps explicit save flow",async({app,page})=>{
    await app.open({seed:state({kcal:2200})});
    await page.click('.act[data-act="food"]');
    await page.fill("#fq","mercimek corbasi");
    await expect(page.locator("#flist [data-food]").first()).toContainText("Mercimek çorbası");
    await page.locator("#flist [data-food]").first().click();
    await expect(page.locator("#sheet h3")).toHaveText("Mercimek çorbası");
    expect(await page.evaluate(()=>performance.getEntriesByType("resource").some(x=>/^https?:\/\/(?!127\.0\.0\.1)/.test(x.name)))).toBe(false);
  });

  test("Food voice writes only local search text, never auto-saves",async({app,page})=>{
    await page.addInitScript(()=>{window.Capacitor={Plugins:{Speech:{addListener:async()=>({remove(){}}),removeAllListeners:async()=>{},listen:async()=>({started:true}),stopListening:async()=>{}}}}});
    await app.open({seed:state()});await page.click('.act[data-act="food"]');
    await page.click('[data-fvoice="start"]');
    if(await page.locator('[data-fvoice="consent"]').count())await page.click('[data-fvoice="consent"]');
    await page.evaluate(()=>foodVoiceHandleTranscript("mercimek corbasi"));
    await expect(page.locator("#fq")).toHaveValue("mercimek corbasi");
    expect((await app.state()).entries.filter(e=>e.type==="food")).toHaveLength(0);
  });

  test("OCR and local menu assets are loaded in shipped page",async({app,page})=>{
    await app.open({seed:state()});
    expect(await page.evaluate(()=>[typeof MenuLocal,typeof ocrBtn,typeof LABEL_FIELDS])).toEqual(["object","function","object"]);
    await app.tab("today");await page.click('.act[data-act="food"]');
    await expect(page.locator("#sheet")).toContainText("Yemek ekle");
  });

  test("data and privacy screens contain no provider or Coach controls",async({app,page})=>{
    await app.open({seed:state()});await app.go("settings-data");
    await expect(page.locator("#view")).toContainText("Yedek al");
    await expect(page.locator("#view")).not.toContainText(/Coach|Rehber anahtar|sağlayıcı|model seç/);
    await page.evaluate(()=>sheetPrivacy());
    await expect(page.locator("#sheet")).not.toContainText(/Coach|sağlayıcı|model seç/);
  });

  test("reset deletes local records and returns to empty Today",async({app,page})=>{
    await app.open({seed:state({},{entries:[{id:1,day:"2026-10-06",time:"09:00",type:"water",v:250,text:""}]}),dialogs:false});
    await app.go("settings-data");await page.click('[data-act="reset"]');await page.click('#cfm [data-cf="1"]');
    await expect(app.toast).toContainText("Tüm veriler silindi");
    expect((await app.state()).entries).toEqual([]);
  });
});
