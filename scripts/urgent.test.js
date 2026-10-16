/* Urgent texts: dizziness card has no eating/cause advice, high/low readings name the value and 112, 140-179 / 250-400 get the neutral line, own limits. */
const {ok,finish}=require("./ok");
const {boot}=require("./html");
(async()=>{
  const w=await boot(),ev=s=>w.eval(s),q=s=>w.document.querySelector(s),sheet=()=>q("#sheet").textContent;
  ev("S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.settings.bpOn=true;S.settings.bsOn=true;tab='today';render()");
  const msg=()=>q("#tmsg").textContent;
  const sv=a=>{q(`[data-vt="${a}"]`).click();if(/Yanlış yazmış/.test(q("#vwarn")?.textContent||""))q(`[data-vt="${a}"]`).click()};
  const bp=(s,d)=>{ev("closeSheet();sheetBp()");q("#bs1").value=s;q("#bd1").value=d;sv('savebp')};
  const bs=g=>{ev("closeSheet();sheetBs()");q("#gv").value=g;sv('savebs')};

  const card=ev("cSafety('check')");
  ok("dizziness card: no food/drink instruction or cause guess, says 112 for fainting/chest pain/breathlessness",!/yiyip|su iç|az yemek|nedeni az/.test(card)&&/Bayılma, göğüs ağrısı veya nefes darlığında hemen 112/.test(card)&&/hekime/.test(card),card);

  bp(150,95);
  ok("blood pressure 140-179: neutral line, no emergency sheet",/Hekimine danış; bu bir tanı değildir/.test(msg())&&!q("#sheet.on"),msg());
  bp(120,80);
  ok("normal blood pressure: no extra line",!/tanı değildir/.test(msg()),msg());
  bp(185,100);
  ok("blood pressure 180+: box names the value and has the 112 call",/Yüksek tansiyon ölçümü: 185\/100 mmHg/.test(sheet())&&/112/.test(sheet())&&q('#sheet a[href="tel:112"]')!=null,sheet());
  bs(40);
  ok("glucose below 54: box says low and names the value",/Düşük şeker ölçümü: 40 mg\/dL/.test(sheet())&&/112/.test(sheet())&&!/Yüksek/.test(sheet()),sheet());
  bs(450);
  ok("glucose above 400: box says high and names the value",/Yüksek şeker ölçümü: 450 mg\/dL/.test(sheet())&&/112/.test(sheet()),sheet());
  ev("closeSheet()");bs(300);
  ok("glucose 250-400: neutral line, no emergency sheet",/Hekimine danış; bu bir tanı değildir/.test(msg())&&!q("#sheet.on"),msg());
  bs(60);
  ok("glucose 54-69: neutral line, no emergency sheet",/Hekimine danış; bu bir tanı değildir/.test(msg())&&!q("#sheet.on"),msg());
  bp(85,55);
  ok("low blood pressure: neutral line, no emergency sheet",/Hekimine danış; bu bir tanı değildir/.test(msg())&&!q("#sheet.on"),msg());
  bs(100);
  ok("normal glucose: no extra line",!/tanı değildir/.test(msg()),msg());

  const L=ev("VitalsLib"),t="2026-10-01",T=o=>({k:"t",day:t,sys:120,dia:80,...o}),G=o=>({k:"s",day:t,g:100,...o});
  ok("level: bands and boundaries",L.level(T({sys:139,dia:89}),t)===null&&L.level(T({sys:140}),t)==="ask"&&L.level(T({dia:90}),t)==="ask"&&L.level(T({sys:180}),t)==="high"&&L.level(G({g:249}),t)===null&&L.level(G({g:250}),t)==="ask"&&L.level(G({g:400}),t)==="ask"&&L.level(G({g:401}),t)==="high"&&L.level(G({g:53}),t)==="low"&&L.level(G({g:54}),t)==="ask"&&L.level(G({g:69}),t)==="ask"&&L.level(G({g:70}),t)===null&&L.level(T({sys:89}),t)==="ask"&&L.level(T({sys:80,dia:50}),t)==="ask"&&L.level(T({sys:90,dia:60}),t)===null);
  ok("level: own low limit replaces the default low line",L.level(T({sys:100}),t,{sysLo:105})==="ask"&&L.level(T({sys:85}),t,{sysLo:80})===null&&L.level(G({g:75}),t,{gLo:80})==="ask"&&L.level(G({g:65}),t,{gLo:60})===null);
  ok("level: a past day gives nothing",L.level(T({sys:190,day:"2026-09-01"}),t)===null);
  ok("level: own limit replaces the default",L.level(T({sys:132}),t,{sys:130})==="ask"&&L.level(T({sys:132}),t)===null&&L.level(G({g:160}),t,{g:150})==="ask");

  ev("closeSheet();sheetLimits()");
  q("#vlsys").value="130";q("#vldia").value="";q("#vlg").value="abc";q('[data-vt="savelimits"]').click();
  ok("limits: an invalid value is refused and nothing is saved",/geçerli değil/.test(q("#vwarn").textContent)&&ev("S.settings.bpSysHi")===0);
  q("#vlg").value="";q('[data-vt="savelimits"]').click();
  ok("limits: saved, empty fields stay off",ev("S.settings.bpSysHi")===130&&ev("S.settings.bpDiaHi")===0&&ev("S.settings.gFastHi")===0);
  bp(135,80);
  ok("own blood pressure limit triggers the neutral line",/Hekimine danış; bu bir tanı değildir/.test(msg()),msg());
  ev("S.vitals=[];S.settings.bpOn=true;tab='today';const d=dayKey();S.vitals.push({id:901,k:'t',day:d,time:'08:00',sys:128,dia:82,sid:'s1',i:1,session:'morning'},{id:902,k:'t',day:d,time:'08:00',sys:140,dia:90,sid:'s1',i:2,session:'morning'});render()");
  ok("the blood pressure chip shows the session mean (134/86), the same figure as the save message",q('[data-chip="bp"]').textContent.includes("134/86"),q('[data-chip="bp"]').textContent);
  ev("S.vitals=[];render()");
  /* mmol/L: the lower glucose limit shows as typed after reopening; a lower limit at or above the upper one is refused */
  ev("S.settings.gUnit='mmol';S.settings.gFastHi=0;S.settings.gFastLo=0;S.settings.bpSysHi=0;closeSheet();sheetLimits()");
  q("#vlglo").value="3,9";q('[data-vt="savelimits"]').click();
  ev("sheetLimits()");
  ok("limits: a lower glucose limit in mmol/L is saved and shown as 3,9",ev("S.settings.gFastLo")>0&&q("#vlglo").value==="3,9"&&/açık/.test(ev("vitalsSettingsHtml()")),q("#vlglo").value);
  q("#vlg").value="5";q("#vlglo").value="9";q('[data-vt="savelimits"]').click();
  ok("limits: a lower limit above the upper one is refused",/alt sınır üst sınırdan küçük olmalı/.test(q("#vwarn").textContent));
  ev("S.settings.gUnit='mgdl'");
  finish();
})();
