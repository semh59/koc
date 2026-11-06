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
