"use strict";
const {test,expect,state,CONSENT}=require("./fixtures");
const {axe,targets,scaleText}=require("./a11y");

const COACH=state({...CONSENT,medOn:true,bpOn:true,bsOn:true,fastOn:true,stepsOn:true},{meds:[{id:1,n:"A",t:["09:00"],on:true}]});
const SCREENS=["today","coach","gym","trend","more","settings","settings-profile","settings-modules","settings-data","exlib","steps","labs","bp","glucose","meds"];
const SHEETS=['.act[data-act="food"]','.act[data-act="weight"]','#view [data-hb="mood"]'];
const openSheet=async(app,page,a)=>{await app.go("today");await page.click(a);await expect(page.locator("#sheet.on")).toBeVisible()};

test.describe("Accessibility and layout",()=>{
  test("sheet: focus stays inside, background is inert, it has a name, Escape returns focus to the trigger",async({app,page})=>{
    await app.open({seed:state()});
    await page.focus('.act[data-act="food"]');
    await page.click('.act[data-act="food"]');
    await expect(page.locator("#sheet")).toHaveAttribute("aria-labelledby","sht");
    await expect(page.locator("#sht")).toHaveText("Yemek ekle");
    await expect(page.locator("#app")).toHaveJSProperty("inert",true);
    for(let i=0;i<40;i++){
      await page.keyboard.press(i%2?"Tab":"Shift+Tab");
      expect(await page.evaluate(()=>!!document.activeElement.closest("#sheet"))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(page.locator("#sheet")).not.toHaveClass(/\bon\b/);
    await expect(page.locator("#app")).toHaveJSProperty("inert",false);
    expect(await page.evaluate(()=>document.activeElement.dataset.act)).toBe("food");
  });

  test("touch targets: muscle map buttons and Settings check rows are at least 44 px",async({app,page})=>{
    await app.open({seed:state()});
    await app.tab("gym");
    const small=async sel=>page.evaluate(s=>[...document.querySelectorAll(s)].map(e=>e.getBoundingClientRect()).filter(r=>r.height<43.5||r.width<43.5).length,sel);
    await page.click("summary:has-text(\"Rekorlar ve haftalık dağılım\")");await page.click("#mmacc summary");
    expect(await small(".mmp .chip")).toBe(0);
    expect(await small(".mmwrap [role=button],.mmwrap [tabindex]")).toBe(0);
    await app.go("settings-modules");await expect(page.locator(".chkrow").first()).toBeVisible();
    expect(await small(".chkrow .sw input,.chkrow")).toBe(0);
    await app.go("settings-profile");
    expect(await small(".chkrow .sw input,.chkrow")).toBe(0);
  });

  test("confirm dialog: focus starts on Cancel and stays inside, Escape cancels, the destructive button is danger, confirming acts",async({app,page})=>{
    await app.open({seed:state({},{entries:[{day:"2026-10-06",time:"09:00",type:"water",v:250,text:""}]}),dialogs:false});
    await app.go("settings-data");
    const cfm=page.locator("#cfm");
    await page.click('[data-act="reset"]');
    await expect(cfm).toBeVisible();await expect(cfm).toHaveAttribute("role","alertdialog");
    await expect(page.locator("#cfmt")).toHaveText("Tüm veriler silinsin mi?");
    expect(await page.evaluate(()=>document.activeElement.dataset.cf)).toBe("0");
    await expect(page.locator('#cfm [data-cf="1"]')).toHaveClass(/\bdanger\b/);
    await expect(page.locator("#app")).toHaveJSProperty("inert",true);
    for(let i=0;i<6;i++){await page.keyboard.press("Tab");expect(await page.evaluate(()=>!!document.activeElement.closest("#cfm"))).toBe(true)}
    expect(await axe(page)).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(cfm).toBeHidden();
    expect((await app.state()).entries.length).toBe(1);
    await page.click('[data-act="reset"]');await page.click('#cfm [data-cf="1"]');
    await expect(cfm).toBeHidden();await expect(app.toast).toHaveText("Tüm veriler silindi");
    expect((await app.state()).entries.length).toBe(0);
  });

  test("no zero counters on muscle chips without data",async({app,page})=>{
    await app.open({seed:state()});await app.tab("gym");
    await expect(page.locator(".mmp .chip",{hasText:/\d/})).toHaveCount(0);
  });

  test("Coach empty state: two examples, tapping one fills the box for the user to finish",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Tamam."});
    await app.open({seed:state(CONSENT),keys:{groq:"gsk_test"}});
    await app.tab("coach");
    await expect(page.locator('[data-c^="ask:"]')).toHaveCount(2);
    await page.click('[data-c="ask:1"]');
    await expect(page.locator("#cmsg")).toHaveValue("Kaç kalori yakar: ");
  });
});

test.describe("Automated audit (axe, WCAG 2.1 AA)",()=>{
  for(const theme of ["light","dark"])test(`main screens and sheets, ${theme} theme: no violations`,async({app,page})=>{
    await app.open({seed:{...COACH,settings:{...COACH.settings,theme}}});
    for(const t of SCREENS){await app.go(t);expect(await axe(page),t).toEqual([])}
    for(const a of SHEETS){await openSheet(app,page,a);expect(await axe(page),"sheet "+a).toEqual([]);await app.closeSheet()}
  });
  test("toast has role=status, error fields role=alert, reduced motion turns transitions off",async({app,page})=>{
    await app.open({seed:COACH});
    await expect(page.locator("#toast")).toHaveAttribute("role","status");
    await openSheet(app,page,SHEETS[0]);
    for(const sel of ["#berr","#bkw"])if(await page.locator(sel).count())await expect(page.locator(sel)).toHaveAttribute("role","alert");
    await app.closeSheet();
    expect(await page.evaluate(()=>[...document.querySelectorAll("button,.card,.chip")].every(e=>parseFloat(getComputedStyle(e).transitionDuration)===0))).toBe(true);
  });
  test("44 px touch target on every screen and sheet: buttons, fields, switches",async({app,page})=>{
    await app.open({seed:COACH});
    const small=()=>targets(page);
    for(const t of SCREENS){await app.go(t);const r=await small();expect(r.n,t).toBeGreaterThan(3);expect(r.o,t).toEqual([])}
    for(const a of SHEETS){await openSheet(app,page,a);expect((await small()).o,"sheet "+a).toEqual([]);await app.closeSheet()}
  });
});

test.describe("Large text (200%) and narrow screen (320 px)",()=>{
  test.use({viewport:{width:320,height:640}});
  test("no horizontal scroll, no clipped text, nothing overflows the screen",async({app,page})=>{
    await app.open({seed:COACH});
    await scaleText(page,2);
    const bad=()=>page.evaluate(()=>{const o=[];if(document.documentElement.scrollWidth>innerWidth)o.push("page scrolls horizontally");
      for(const e of document.querySelectorAll("body *")){const c=getComputedStyle(e);if(c.display==="none"||e.closest("svg,.chiprow,[hidden]")||!e.getClientRects().length)continue;
        const r=e.getBoundingClientRect(),id=e.tagName+"."+e.className+" "+(e.textContent||"").trim().slice(0,20);
        if(r.width&&r.right>innerWidth+1)o.push("overflows: "+id);
        if(c.overflowY==="hidden"&&e.scrollHeight>e.clientHeight+2&&e.clientHeight)o.push("clipped vertically: "+id);
        if(c.overflowX==="hidden"&&e.scrollWidth>e.clientWidth+2&&e.clientWidth)o.push("clipped horizontally: "+id)}return [...new Set(o)]});
    for(const t of SCREENS){await app.go(t);expect(await bad(),t).toEqual([])}
    for(const a of SHEETS){await openSheet(app,page,a);expect(await bad(),"sheet "+a).toEqual([]);await app.closeSheet()}
  });
  test("Today scrolled to the bottom with large text: no content overlaps the menu",async({app,page})=>{
    await app.open({seed:COACH});await scaleText(page,2);await app.settled();
    await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await app.settled();
    const r=await page.evaluate(()=>{const n=document.querySelector("nav").getBoundingClientRect(),hit=(x,y)=>document.elementFromPoint(x,y)?.closest("nav")!==null;
      const pts=[...document.querySelectorAll("nav button")].map(b=>{const q=b.getBoundingClientRect();return hit(q.left+q.width/2,q.top+q.height/2)});
      const last=[...document.querySelectorAll("#app button,#app .card")].pop().getBoundingClientRect().bottom;
      return {pts,gap:n.top-last,center:hit(n.left+n.width/2,n.top+n.height/2)}});
    expect(r.center).toBe(true);expect(r.pts.every(Boolean)).toBe(true);expect(r.gap).toBeGreaterThanOrEqual(-1);
  });
  test("bottom menu labels never split mid-word and fit the button; ring numbers stay inside the ring; to-do text does not collapse into a column",async({app,page})=>{
    await app.open({seed:COACH});await scaleText(page,2);await app.settled();
    const r=await page.evaluate(()=>{
      const o=[],rng=document.createRange();
      for(const b of document.querySelectorAll("nav button")){
        const t=[...b.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());rng.selectNodeContents(t);const w=rng.getBoundingClientRect().width;
        if(w>b.clientWidth+1)o.push("overflows: "+t.textContent.trim());
        let i=0;for(const word of t.textContent.trim().split(/\s+/)){const s=t.textContent.indexOf(word,i);i=s+word.length;rng.setStart(t,s);rng.setEnd(t,i);
          if(new Set([...rng.getClientRects()].map(q=>Math.round(q.top))).size>1)o.push("splits: "+word)}
      }
      for(const g of document.querySelectorAll(".ring:not(.mini)")){const sv=g.querySelector("svg").getBoundingClientRect(),rc=g.querySelector(".rc");rng.selectNodeContents(rc);const q=rng.getBoundingClientRect();
        if(q.left<sv.left-1||q.right>sv.right+1||q.top<sv.top-1||q.bottom>sv.bottom+1)o.push("ring overflows: "+rc.textContent.trim())}
      for(const s of document.querySelectorAll(".todo .row>span"))if(s.getBoundingClientRect().width<100)o.push("narrow column: "+s.textContent.trim().slice(0,20));
      const tops=[...document.querySelectorAll("nav button .ic")].map(i=>Math.round(i.getBoundingClientRect().top));if(new Set(tops).size>1)o.push("icon alignment: "+tops.join());
      return {o,fs:parseFloat(getComputedStyle(document.querySelector("nav button")).fontSize)}});
    expect(r.o).toEqual([]);
    expect(r.fs).toBeGreaterThanOrEqual(12);
    await app.go("coach");
    expect(await page.evaluate(()=>[...document.querySelectorAll(".chiprow .chip")].filter(c=>c.scrollWidth>c.clientWidth+1).map(c=>c.textContent.trim()))).toEqual([]);
  });
  test("menu grows with large text, the Coach composer does not collide with it",async({app,page})=>{
    await app.open({seed:COACH});await scaleText(page,2);
    const diag=await page.evaluate(()=>{const nv=document.querySelector("nav"),bt=nv.querySelector('button[data-tab="coach"]').getBoundingClientRect(),n=nv.getBoundingClientRect(),el=document.elementFromPoint(bt.x+bt.width/2,bt.y+bt.height/2);return {ok:!!el&&nv.contains(el),vp:[innerWidth,innerHeight],btn:[bt.x,bt.y,bt.width,bt.height].map(Math.round),nav:[n.x,n.y,n.width,n.height].map(Math.round),pos:getComputedStyle(nv).position,z:getComputedStyle(nv).zIndex,vis:getComputedStyle(nv).visibility,docH:document.documentElement.scrollHeight,sy:scrollY,hit:el?el.tagName+"."+el.className+"@"+Math.round(el.getBoundingClientRect().y):null}});
    expect(diag.ok,"DIAG "+JSON.stringify(diag)).toBe(true);
    await app.go("coach");
    const g=await page.evaluate(()=>[document.querySelector("#composer").getBoundingClientRect().bottom,document.querySelector("nav").getBoundingClientRect().top]);
    expect(g[0]).toBeLessThanOrEqual(g[1]+1);
  });
});

test.describe("Landscape phone",()=>{
  test.use({viewport:{width:800,height:360}});
  test("Today has two columns: rings on the left, to-dos on the right",async({app,page})=>{
    await app.open({seed:state({medOn:true},{meds:[{id:1,n:"A",t:["00:00"],on:true}]})});
    const r=await page.evaluate(()=>{const a=document.querySelector(".rings").getBoundingClientRect(),b=document.querySelector(".todo").getBoundingClientRect();return {ax:a.left,bx:b.left,at:a.top,bt:b.top}});
    expect(r.bx).toBeGreaterThan(r.ax+300);
    expect(Math.abs(r.at-r.bt)).toBeLessThan(40);
  });
  test("Coach: the last message is not hidden behind the composer, the top bar is sticky",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Tamam, not aldım. ".repeat(6)});
    await app.open({seed:state(CONSENT),keys:{groq:"gsk_test"}});
    await app.tab("coach");
    for(let i=0;i<3;i++){await page.fill("#cmsg","Mesaj "+i);await page.click("#csend");await expect(page.locator(".cm").nth(i)).toBeVisible()}
    await app.settled();
    const g=await page.evaluate(()=>{const m=[...document.querySelectorAll(".cm,.ub")].pop().getBoundingClientRect();return [m.bottom,document.querySelector("#composer").getBoundingClientRect().top]});
    expect(g[0]).toBeLessThanOrEqual(g[1]+1);
    expect(await page.evaluate(()=>getComputedStyle(document.querySelector(".cbar")).position)).toBe("sticky");
  });
});
