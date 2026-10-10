"use strict";
/* Usability audit for an older user (about 60): how many controls compete on each screen, how small the smallest text is, and how many taps the daily tasks take. */
const {test,expect,state,entry}=require("./fixtures");

const SCREENS=["today","coach","gym","trend","more","settings"];
const measure=page=>page.evaluate(()=>{
  const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&!e.closest("[hidden],[inert]")&&getComputedStyle(e).visibility!=="hidden"};
  const controls=[...document.querySelectorAll("#view button,#view a[href],#view input:not([type=hidden]),#view select,#view textarea,#view summary")].filter(vis).length;
  let min=99,minText="",words=0,n=0;
  const w=document.createTreeWalker(document.querySelector("#view"),NodeFilter.SHOW_TEXT);
  for(let t;t=w.nextNode();){
    const s=t.textContent.trim();if(!s||!vis(t.parentElement)||t.parentElement.closest("svg"))continue;
    const px=parseFloat(getComputedStyle(t.parentElement).fontSize);if(px<min){min=px;minText=s.slice(0,30)}
    words+=s.split(/\s+/).length;n++;
  }
  return {controls,min:Math.round(min*10)/10,minText,words,height:Math.round(document.querySelector("#view").scrollHeight/innerHeight*10)/10};
});

test.describe("Senior usability audit",()=>{
  test("per-screen complexity and smallest text",async({app,page})=>{
    await app.open({seed:state({stepsOn:true,medOn:true},{entries:[entry("food",420,"Çorba"),entry("weight",81)],meds:[{id:1,n:"A",t:["09:00"],on:true}]})});
    const rows=[];
    for(const s of SCREENS){await app.go(s);rows.push({screen:s,...await measure(page)})}
    console.log("SENIOR-AUDIT\n"+rows.map(r=>`${r.screen.padEnd(9)} controls=${String(r.controls).padStart(2)} minFont=${r.min}px ("${r.minText}") words=${r.words} pages=${r.height}`).join("\n"));
    for(const r of rows){
      expect(r.min,`${r.screen}: smallest text`).toBeGreaterThanOrEqual(14);
      expect(r.controls,`${r.screen}: controls on screen`).toBeLessThanOrEqual(45);
    }
  });

  test("daily tasks take few taps",async({app,page})=>{
    await app.open({seed:state()});
    const taps={};
    let n=0;const tap=async sel=>{n++;await page.click(sel)};
    await app.go("today");
    n=0;await tap('.act[data-act="water"]');taps.water=n;
    n=0;await tap('.act[data-act="weight"]');await page.fill("#fv","80");await tap('[data-go="weight"]');taps.weight=n;
    n=0;await tap('.act[data-act="food"]');await tap('[data-act="own"]');await page.fill("#ft","Ekmek");await page.fill("#fv","200");await tap('[data-go="food"]');taps.food=n;
    await app.go("more");
    n=0;await tap('#view [data-hb="more"]');await tap('#sheet [data-hb="sleep"]');taps.sleepOpen=n;
    console.log("SENIOR-TAPS "+JSON.stringify(taps));
    expect(taps.water).toBeLessThanOrEqual(1);
    expect(taps.weight).toBeLessThanOrEqual(2);
    expect(taps.food).toBeLessThanOrEqual(4);
    expect(taps.sleepOpen).toBeLessThanOrEqual(2);
  });
});
