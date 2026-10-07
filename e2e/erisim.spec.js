"use strict";
const {test,expect,state}=require("./fixtures");
const AxeBuilder=require("@axe-core/playwright").default;

const KOC=state({consent:true,consentV:2,consentAt:"2026-10-06",consentP:"gemini,groq,nvidia,openrouter",medOn:true,bpOn:true,bsOn:true,fastOn:true,stepsOn:true},{meds:[{id:1,n:"A",t:["09:00"],on:true}]});
const SCREENS=["bugun","koc","salon","trend","daha","ayar","ayar-profil","ayar-modul","ayar-veri","egz","adim","tahlil","tansiyon","seker","ilac"];
const SHEETS=['.act[data-act="yemek"]','.act[data-act="kilo"]','[data-hb="more"]'];
/* Android yazı ölçeği WebView'da yalnız metni büyütür: piksel font-size bildirimleri ve tüm --fs-* değişkenleri ikiye katlanır.
   min()/clamp() içindeki üst sınırlar (alt menü etiketi, halka rakamı, SVG ekseni) bilinçli tasarım sınırıdır, katlanmaz. */
const scaleText=(page,k)=>page.evaluate(k=>{
  const m=v=>v.replace(/([\d.]+)px/,(a,b)=>b*k+"px");
  const walk=rs=>{for(const r of rs){if(r.cssRules&&!r.style)walk(r.cssRules);else if(r.style&&/^[\d.]+px$/.test(r.style.fontSize))r.style.fontSize=m(r.style.fontSize)}};
  for(const s of document.styleSheets)walk(s.cssRules);
  const de=document.documentElement,cs=getComputedStyle(de),names=new Set();
  for(const s of document.styleSheets)for(const r of s.cssRules)if(r.style)for(const p of r.style)if(p.startsWith("--fs-"))names.add(p);
  for(const p of names)de.style.setProperty(p,m(cs.getPropertyValue(p).trim()));
  if(Math.abs(parseFloat(getComputedStyle(document.body).fontSize)-16*k)>.5)throw new Error("gövde yazısı ölçeklenmedi");
},k);
const axe=async page=>(await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations.map(v=>v.id+": "+v.nodes.slice(0,3).map(n=>n.target.join(" ")).join("; "));
const openSheet=async(app,page,a)=>{await app.go("bugun");await page.click(a);await expect(page.locator("#sheet.on")).toBeVisible()};

test.describe("Erişilebilirlik ve düzen",()=>{
  test("sheet: odak içeride döner, arka plan inert, adı var, Escape odağı tetikleyiciye döndürür",async({app,page})=>{
    await app.open({seed:state()});
    await page.focus('.act[data-act="yemek"]');
    await page.click('.act[data-act="yemek"]');
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
    expect(await page.evaluate(()=>document.activeElement.dataset.act)).toBe("yemek");
  });

  test("dokunma hedefleri: kas haritası düğmeleri ve Ayarlar onay satırları en az 44 px",async({app,page})=>{
    await app.open({seed:state()});
    await app.tab("salon");
    const small=async sel=>page.evaluate(s=>[...document.querySelectorAll(s)].map(e=>e.getBoundingClientRect()).filter(r=>r.height<43.5||r.width<43.5).length,sel);
    expect(await small(".mmp .chip")).toBe(0);
    expect(await small(".mmwrap [role=button],.mmwrap [tabindex]")).toBe(0);
    await app.go("ayar-modul");await expect(page.locator(".chkrow").first()).toBeVisible();
    expect(await small(".chkrow .sw input,.chkrow")).toBe(0);
    await app.go("ayar-profil");
    expect(await small(".chkrow .sw input,.chkrow")).toBe(0);
  });

  test("onay penceresi: odak İptal'de ve içeride döner, Escape iptal eder, yıkıcı düğme danger, onay işi yapar",async({app,page})=>{
    await app.open({seed:state({},{entries:[{day:"2026-10-06",time:"09:00",type:"su",v:250,text:""}]}),dialogs:false});
    await app.go("ayar-veri");
    const cfm=page.locator("#cfm");
    await page.click('[data-act="sifirla"]');
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
    await page.click('[data-act="sifirla"]');await page.click('#cfm [data-cf="1"]');
    await expect(cfm).toBeHidden();await expect(app.toast).toHaveText("Tüm veriler silindi");
    expect((await app.state()).entries.length).toBe(0);
  });

  test("veri yokken kas çiplerinde sıfır sayacı yok",async({app,page})=>{
    await app.open({seed:state()});await app.tab("salon");
    await expect(page.locator(".mmp .chip",{hasText:/\d/})).toHaveCount(0);
  });

  test("Koç boş durumu: üç örnek, dokununca mesaj gider",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Tamam."});
    await app.open({seed:state({consent:true,consentV:2,consentAt:"2026-10-06",consentP:"gemini,groq,nvidia,openrouter"}),keys:{groq:"gsk_test"}});
    await app.tab("koc");
    await expect(page.locator('[data-c^="ask:"]')).toHaveCount(3);
    await page.click('[data-c="ask:1"]');
    await expect(page.locator(".ub")).toHaveText("Bugün ne yapmalıyım?");
  });
});

test.describe("Otomatik denetim (axe, WCAG 2.1 AA)",()=>{
  for(const theme of ["light","dark"])test(`ana ekranlar ve sheet'ler, ${theme} tema: ihlal yok`,async({app,page})=>{
    await app.open({seed:{...KOC,settings:{...KOC.settings,theme}}});
    for(const t of SCREENS){await app.go(t);await page.waitForTimeout(100);expect(await axe(page),t).toEqual([])}
    for(const a of SHEETS){await openSheet(app,page,a);expect(await axe(page),"sheet "+a).toEqual([]);await app.closeSheet()}
  });
  test("toast role=status, hata alanları role=alert, hareket azaltma geçişleri kapatır",async({app,page})=>{
    await app.open({seed:KOC});
    await expect(page.locator("#toast")).toHaveAttribute("role","status");
    await openSheet(app,page,SHEETS[0]);
    for(const sel of ["#berr","#bkw"])if(await page.locator(sel).count())await expect(page.locator(sel)).toHaveAttribute("role","alert");
    await app.closeSheet();
    expect(await page.evaluate(()=>[...document.querySelectorAll("button,.card,.chip")].every(e=>parseFloat(getComputedStyle(e).transitionDuration)===0))).toBe(true);
  });
  test("dokunma hedefi 44 px: tüm ekranlarda ve sheet'lerde düğme, alan, anahtar",async({app,page})=>{
    await app.open({seed:KOC});
    const small=()=>page.evaluate(()=>{const o=[];let n=0;for(const e of document.querySelectorAll("button,a[href],input:not([type=hidden]):not([type=file]),select,textarea,[role=button],[role=tab],summary")){
      const r=e.getBoundingClientRect();if(!r.width||getComputedStyle(e).visibility==="hidden"||e.closest("[hidden],[inert]"))continue;n++;
      const b=e.matches("input[type=checkbox],input[type=radio]")?(e.closest("label,.chkrow")||e).getBoundingClientRect():r;
      if(b.height<43.5||b.width<43.5)o.push((e.getAttribute("aria-label")||e.textContent||e.id||e.className).trim().slice(0,25)+" "+Math.round(b.width)+"x"+Math.round(b.height))}return {o,n}});
    for(const t of SCREENS){await app.go(t);await page.waitForTimeout(100);const r=await small();expect(r.n,t).toBeGreaterThan(3);expect(r.o,t).toEqual([])}
    for(const a of SHEETS){await openSheet(app,page,a);expect((await small()).o,"sheet "+a).toEqual([]);await app.closeSheet()}
  });
});

test.describe("Büyük yazı (%200) ve dar ekran (320 px)",()=>{
  test.use({viewport:{width:320,height:640}});
  test("yatay kaydırma yok, metin kırpılmıyor, öğe ekran dışına taşmıyor",async({app,page})=>{
    await app.open({seed:KOC});
    await scaleText(page,2);
    const bad=()=>page.evaluate(()=>{const o=[];if(document.documentElement.scrollWidth>innerWidth)o.push("sayfa yatay kayıyor");
      for(const e of document.querySelectorAll("body *")){const c=getComputedStyle(e);if(c.display==="none"||e.closest("svg,.chiprow,[hidden]")||!e.getClientRects().length)continue;
        const r=e.getBoundingClientRect(),id=e.tagName+"."+e.className+" "+(e.textContent||"").trim().slice(0,20);
        if(r.width&&r.right>innerWidth+1)o.push("taşar: "+id);
        if(c.overflowY==="hidden"&&e.scrollHeight>e.clientHeight+2&&e.clientHeight)o.push("dikey kırpılır: "+id);
        if(c.overflowX==="hidden"&&e.scrollWidth>e.clientWidth+2&&e.clientWidth)o.push("yatay kırpılır: "+id)}return [...new Set(o)]});
    for(const t of SCREENS){await app.go(t);await page.waitForTimeout(100);expect(await bad(),t).toEqual([])}
    for(const a of SHEETS){await openSheet(app,page,a);expect(await bad(),"sheet "+a).toEqual([]);await app.closeSheet()}
  });
  test("Bugün en altta, büyük yazıda hiçbir içerik menüyle kesişmez",async({app,page})=>{
    await app.open({seed:KOC});await scaleText(page,2);await page.waitForTimeout(200);
    await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await page.waitForTimeout(200);
    const r=await page.evaluate(()=>{const n=document.querySelector("nav").getBoundingClientRect(),hit=(x,y)=>document.elementFromPoint(x,y)?.closest("nav")!==null;
      const pts=[...document.querySelectorAll("nav button")].map(b=>{const q=b.getBoundingClientRect();return hit(q.left+q.width/2,q.top+q.height/2)});
      const last=[...document.querySelectorAll("#app button,#app .card")].pop().getBoundingClientRect().bottom;
      return {pts,gap:n.top-last,center:hit(n.left+n.width/2,n.top+n.height/2)}});
    expect(r.center).toBe(true);expect(r.pts.every(Boolean)).toBe(true);expect(r.gap).toBeGreaterThanOrEqual(-1);
  });
  test("alt menü etiketleri harf ortasından bölünmez, düğmeye sığar; halka rakamları halkanın içinde; yapılacaklar metni sütuna dönmez",async({app,page})=>{
    await app.open({seed:KOC});await scaleText(page,2);await page.waitForTimeout(200);
    const r=await page.evaluate(()=>{
      const o=[],rng=document.createRange();
      for(const b of document.querySelectorAll("nav button")){
        const t=[...b.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());rng.selectNodeContents(t);const w=rng.getBoundingClientRect().width;
        if(w>b.clientWidth+1)o.push("taşar: "+t.textContent.trim());
        let i=0;for(const word of t.textContent.trim().split(/\s+/)){const s=t.textContent.indexOf(word,i);i=s+word.length;rng.setStart(t,s);rng.setEnd(t,i);
          if(new Set([...rng.getClientRects()].map(q=>Math.round(q.top))).size>1)o.push("bölünür: "+word)}
      }
      for(const g of document.querySelectorAll(".ring")){const sv=g.querySelector("svg").getBoundingClientRect(),rc=g.querySelector(".rc");rng.selectNodeContents(rc);const q=rng.getBoundingClientRect();
        if(q.left<sv.left-1||q.right>sv.right+1||q.top<sv.top-1||q.bottom>sv.bottom+1)o.push("halka taşar: "+rc.textContent.trim())}
      for(const s of document.querySelectorAll(".todo .row>span"))if(s.getBoundingClientRect().width<100)o.push("dar sütun: "+s.textContent.trim().slice(0,20));
      return {o,fs:parseFloat(getComputedStyle(document.querySelector("nav button")).fontSize)}});
    expect(r.o).toEqual([]);
    expect(r.fs).toBeGreaterThanOrEqual(12);
    await app.go("koc");await page.waitForTimeout(150);
    expect(await page.evaluate(()=>[...document.querySelectorAll(".chiprow .chip")].filter(c=>c.scrollWidth>c.clientWidth+1).map(c=>c.textContent.trim()))).toEqual([]);
  });
  test("menü büyük yazıda uzar, Koç yazma alanı menüyle çakışmaz",async({app,page})=>{
    await app.open({seed:KOC});await scaleText(page,2);
    const tani=await page.evaluate(()=>{const nv=document.querySelector("nav"),bt=nv.querySelector('button[data-tab="koc"]').getBoundingClientRect(),n=nv.getBoundingClientRect(),el=document.elementFromPoint(bt.x+bt.width/2,bt.y+bt.height/2);return {ok:!!el&&nv.contains(el),vp:[innerWidth,innerHeight],btn:[bt.x,bt.y,bt.width,bt.height].map(Math.round),nav:[n.x,n.y,n.width,n.height].map(Math.round),pos:getComputedStyle(nv).position,z:getComputedStyle(nv).zIndex,vis:getComputedStyle(nv).visibility,docH:document.documentElement.scrollHeight,sy:scrollY,hit:el?el.tagName+"."+el.className+"@"+Math.round(el.getBoundingClientRect().y):null}});
    expect(tani.ok,"TANI "+JSON.stringify(tani)).toBe(true);
    await app.go("koc");await page.waitForTimeout(200);
    const g=await page.evaluate(()=>[document.querySelector("#composer").getBoundingClientRect().bottom,document.querySelector("nav").getBoundingClientRect().top]);
    expect(g[0]).toBeLessThanOrEqual(g[1]+1);
  });
});

test.describe("Yatay telefon",()=>{
  test.use({viewport:{width:800,height:360}});
  test("Bugün iki sütun: halkalar solda, yapılacaklar sağda",async({app,page})=>{
    await app.open({seed:state({medOn:true},{meds:[{id:1,n:"A",t:["00:00"],on:true}]})});
    const r=await page.evaluate(()=>{const a=document.querySelector(".rings").getBoundingClientRect(),b=document.querySelector(".todo").getBoundingClientRect();return {ax:a.left,bx:b.left,at:a.top,bt:b.top}});
    expect(r.bx).toBeGreaterThan(r.ax+300);
    expect(Math.abs(r.at-r.bt)).toBeLessThan(40);
  });
  test("Koç: son mesaj yazma alanının arkasında kalmaz, üst çubuk sabit",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Tamam, not aldım. ".repeat(6)});
    await app.open({seed:state({consent:true,consentV:2,consentAt:"2026-10-06",consentP:"gemini,groq,nvidia,openrouter"}),keys:{groq:"gsk_test"}});
    await app.tab("koc");
    for(let i=0;i<3;i++){await page.fill("#cmsg","Mesaj "+i);await page.click("#csend");await expect(page.locator(".cm").nth(i)).toBeVisible()}
    await page.waitForTimeout(300);
    const g=await page.evaluate(()=>{const m=[...document.querySelectorAll(".cm,.ub")].pop().getBoundingClientRect();return [m.bottom,document.querySelector("#composer").getBoundingClientRect().top]});
    expect(g[0]).toBeLessThanOrEqual(g[1]+1);
    expect(await page.evaluate(()=>getComputedStyle(document.querySelector(".cbar")).position)).toBe("sticky");
  });
});
