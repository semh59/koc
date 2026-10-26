"use strict";
const {test,expect,state,entry,CONSENT}=require("./fixtures");

const LOG=JSON.stringify({reply:"Not aldım.",log:[{type:"food",text:"2 yumurta",kcal:150,protein:12,carbs:1,fat:10,meal:"breakfast"}]});
const open=app=>app.open({seed:state(CONSENT),keys:{groq:"gsk_test"}});
const send=async(app,page,t)=>{await app.tab("coach");await page.fill("#cmsg",t);await page.click("#csend")};

test.describe("Coach log card",()=>{
  test("a plain-text model reply is asked again once and the card appears",async({app,page,fake})=>{
    let n=0;fake.st.reply=()=>++n===1?"Afiyet olsun, güzel bir kahvaltı.":LOG;
    await open(app);await send(app,page,"Kahvaltıda 2 yumurta yedim");
    await expect(page.locator(".lcard")).toContainText("Öğüne ekle");
    expect(n).toBe(2);
  });
  test("an empty log list from the model is asked again once",async({app,page,fake})=>{
    let n=0;fake.st.reply=()=>++n===1?JSON.stringify({reply:"Güzel.",log:[]}):LOG;
    await open(app);await send(app,page,"Kahvaltıda 2 yumurta yedim");
    await expect(page.locator(".lcard")).toContainText("Öğüne ekle");
    expect(n).toBe(2);
  });
  test("chat history goes to the model as JSON and the model keeps the format",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Merhaba."});
    await open(app);await send(app,page,"Selam");
    await expect(page.locator("#view")).toContainText("Merhaba.");
    await page.fill("#cmsg","Nasılsın");await page.click("#csend");
    await expect.poll(()=>fake.chats().length).toBe(2);
    const m=fake.chats()[1].body.messages.filter(x=>x.role==="assistant");
    expect(JSON.parse(m[0].content).reply).toBe("Merhaba.");
  });
  test("a message with nothing to log sends no needless second request",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Su içmeyi unutma.",log:[]});
    await open(app);await send(app,page,"Bugün hava nasıl olur");
    await expect(page.locator("#view")).toContainText("Su içmeyi unutma.");
    expect(fake.chats().length).toBe(1);
  });

  test("a new chat archives the old one; the model does not see old messages; an archived chat can be reopened and continued",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Tamam."});
    await open(app);await send(app,page,"Birinci sohbet mesajı");
    await expect(page.locator("#view")).toContainText("Tamam.");
    await page.click('[data-c="newchat"]');
    await expect(page.locator(".ub")).toHaveCount(0);
    await expect(page.locator('[data-c="chats"]')).toHaveText("Geçmiş");
    await page.fill("#cmsg","İkinci sohbet mesajı");await page.click("#csend");
    await expect(page.locator("#view")).toContainText("Tamam.");
    const sent=JSON.stringify(fake.chats().at(-1).body.messages);
    expect(sent).toContain("İkinci sohbet mesajı");expect(sent).not.toContain("Birinci sohbet mesajı");
    await page.reload();await app.tab("coach");
    await page.click('[data-c="chats"]');
    await expect(page.locator("#sheet")).toContainText("Birinci sohbet mesajı");
    await page.click('[data-c^="openchat:"]');
    await expect(page.locator(".ub")).toHaveText("Birinci sohbet mesajı");
    await expect(page.locator('[data-c="chats"]')).toHaveText("Geçmiş");
  });
  test("an archived chat is deleted and Undo restores it; the delete button carries the chat title",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Tamam."});
    await open(app);await send(app,page,"Eski mesaj");
    await expect(page.locator("#view")).toContainText("Tamam.");
    await page.click('[data-c="newchat"]');
    await page.click('[data-c="chats"]');
    await expect(page.locator('[data-c^="delchat:"]')).toHaveAttribute("aria-label","Sohbeti sil: Eski mesaj");
    await page.click('[data-c^="delchat:"]');
    await expect(app.toast).toHaveText("Sohbet silindi");
    expect((await app.state()).chats).toEqual([]);
    await page.click("#tundo");
    await expect(page.locator('[data-c^="delchat:"]')).toHaveCount(1);
    expect((await app.state()).chats.length).toBe(1);
  });
  test("the chat cannot be switched while Coach awaits a reply, but can once it arrives",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Tamam."});fake.st.delay=800;
    await open(app);await send(app,page,"Bekleyen mesaj");
    await page.click('[data-c="newchat"]');
    await expect(app.toast).toContainText("sohbet değişmez");
    await expect(page.locator(".ub")).toHaveText("Bekleyen mesaj");
    await expect(page.locator("#view")).toContainText("Tamam.");
    await page.click('[data-c="newchat"]');
    await expect(page.locator(".ub")).toHaveCount(0);
  });
  test("on a short landscape screen the Coach composer is visible and the quick-button row is hidden",async({app,page,fake})=>{
    await page.setViewportSize({width:800,height:360});
    await open(app);await app.tab("coach");
    await expect(page.locator("#cmsg")).toBeVisible();
    await expect(page.locator("#composer .chiprow")).toBeHidden();
    const [h,c]=await Promise.all([page.locator("header").boundingBox(),page.locator("#composer").boundingBox()]);
    expect(c.y-(h.y+h.height)).toBeGreaterThan(150);
  });
});

test.describe("Coach reliability",()=>{
  const view=page=>page.locator("#view");
  test("truncated JSON never leaks raw; asked again once, and if both are truncated the closed reply is shown",async({app,page,fake})=>{
    fake.st.reply=()=>'{"reply":"Güzel bir gün.","log":[{"type":"water","ml":2';
    await open(app);await send(app,page,"Selam");
    await expect(view(page)).toContainText("Güzel bir gün.");
    await expect(view(page)).not.toContainText('"log"');
    expect(fake.chats().length).toBe(2);
  });
  test("a truncated reply with no extractable reply field shows the generic 'incomplete reply' message",async({app,page,fake})=>{
    fake.st.reply=()=>'{"log":[{"type":"water","ml":2';
    await open(app);await send(app,page,"Selam");
    await expect(view(page)).toContainText("Yanıt eksik geldi");
    await expect(view(page)).not.toContainText('"type"');
  });
  test("JSON cut at the length limit is retried once with a larger limit",async({app,page,fake})=>{
    let n=0;fake.st.reply=()=>++n===1?'{"reply":"Yarım kal':'{"reply":"Tam yanıt.","log":[]}';fake.st.finish=()=>n===1?"length":"stop";
    await open(app);await send(app,page,"Selam");
    await expect(view(page)).toContainText("Tam yanıt.");
    expect(fake.chats().length).toBe(2);
    expect(fake.chats()[1].body.max_tokens).toBe(fake.chats()[0].body.max_tokens*3);
  });
  test("double JSON: the first object with a reply is used, no extra request",async({app,page,fake})=>{
    fake.st.reply=()=>'{"reply":"Birinci","log":[]}{"reply":"İkinci","log":[]}';
    await open(app);await send(app,page,"Selam");
    await expect(view(page)).toContainText("Birinci");
    await expect(view(page)).not.toContainText("İkinci");
    expect(fake.chats().length).toBe(1);
  });
  test("if the retry also returns plain text there is only one retry and the reply is not lost",async({app,page,fake})=>{
    fake.st.reply=()=>"Afiyet olsun, güzel öğün.";
    await open(app);await send(app,page,"Kahvaltıda 2 yumurta yedim");
    await expect(view(page)).toContainText("Afiyet olsun");
    expect(fake.chats().length).toBe(2);
    await expect(page.locator(".pendl")).toHaveCount(0);
  });
  test("valid JSON on the retry is accepted even without log entries",async({app,page,fake})=>{
    let n=0;fake.st.reply=()=>++n===1?"düz metin":JSON.stringify({reply:"Düzgün yanıt.",log:[]});
    await open(app);await send(app,page,"Selam");
    await expect(view(page)).toContainText("Düzgün yanıt.");
    expect(n).toBe(2);
  });
  test("menu ids 'constructor' and 'toString' do not count as items",async({app,page,fake})=>{
    const meal=m=>({m,i:[["constructor",1],["toString",1]]});
    fake.st.reply=()=>JSON.stringify({reply:"Menü",menu:{days:[{n:"Pzt",meals:[meal("breakfast"),meal("lunch"),meal("dinner")]}]}});
    await open(app);await app.tab("coach");
    await page.click('[data-c="menu"]');await page.click('[data-c="menuask"]');
    await expect(app.toast).toContainText("Menü okunamadı");
    await expect(page.locator(".lcard")).toHaveCount(0);
  });
  test("an eating-disorder signal seen in chat is a lasting brake: no calorie proposal in a new chat either",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Tamam.",propose:{kcal:1500,why:"x"}});
    await open(app);await send(app,page,"yedikten sonra kusuyorum");
    await expect(view(page)).toContainText("Tamam.");
    expect((await app.state()).settings.edFlag).toBe(true);
    await page.click('[data-c="newchat"]');
    await page.fill("#cmsg","kilo vermek istiyorum");await page.click("#csend");
    await expect(view(page)).toContainText("Tamam.");
    await expect(page.locator('[data-c^="applyk"]')).toHaveCount(0);
    expect(fake.chats().length).toBe(2);
  });
  test("a pregnancy statement becomes a lasting brake",async({app,page,fake})=>{
    await open(app);await send(app,page,"hamileyim, ne yapmalıyım");
    await expect(view(page)).toContainText("Merhaba, buradayım.");
    expect((await app.state()).settings.pregnant).toBe(true);
  });
  test("the idiom 'bayılıyorum' goes to the model, a real faint opens the emergency card and is not sent",async({app,page,fake})=>{
    await open(app);await send(app,page,"baklavaya bayılıyorum");
    await expect(view(page)).toContainText("Merhaba, buradayım.");
    expect(fake.chats().length).toBe(1);
    await page.fill("#cmsg","bayılacak gibiyim");await page.click("#csend");
    await expect(page.locator(".scard")).toContainText("Hemen yardım al");
    expect(fake.chats().length).toBe(1);
  });
  test("a built-in provider goes to its coded address even if the stored address was altered",async({app,page,fake})=>{
    const groq={id:"groq",name:"Groq",base:"https://evil.example/v1",model:"llama-3.3-70b-versatile",on:true,health:true,confirm:false};
    await app.open({seed:state({...CONSENT},{providers:[groq]}),keys:{groq:"gsk_test"}});
    await send(app,page,"Selam");
    await expect(view(page)).toContainText("Merhaba, buradayım.");
    expect(fake.chats().length).toBe(1);
    expect((await app.state()).providers.find(p=>p.id==="groq").base).toBe("https://api.groq.com/openai/v1");
  });
  test("custom provider: the user's address is used and a clear warning appears before data is sent",async({app,page,fake})=>{
    const u1={id:"u1",name:"Benimki",base:"https://custom.example/v1",model:"m",on:true,health:true,confirm:false};
    await app.open({seed:state({consent:true,consentV:3,consentAt:"2026-10-06",consentP:"u1"},{providers:[u1]}),keys:{u1:"k1"}});
    await send(app,page,"Selam");
    await expect(view(page)).toContainText("Merhaba, buradayım.");
    expect(fake.chats().length).toBe(1);
    expect(fake.chats()[0].host).toBe("custom.example");
    expect(app.dialogs.join(" ")).toContain("özel bir sağlayıcı (custom.example)");
  });
  test("entering a key for a paid provider that was not part of the consent makes Coach ask again; no data is sent",async({app,page,fake})=>{
    const oa={id:"openai",name:"OpenAI",base:"https://api.openai.com/v1",model:"gpt-6-luna",on:true,health:true,confirm:false};
    await app.open({seed:state({consent:true,consentV:3,consentAt:"2026-10-06",consentP:"groq,nvidia,openrouter"},{providers:[oa]}),keys:{openai:"sk-x"}});
    await app.tab("coach");
    await expect(page.locator('[data-c="consent"]')).toBeVisible();
    await expect(view(page)).toContainText("Sağlayıcı listen değişti");
    await page.fill("#cmsg","Selam");await page.click("#csend");
    expect(fake.chats().length).toBe(0);
  });
  test("without an age Coach stays closed and points to entering it",async({app,page,fake})=>{
    await app.open({seed:state({...CONSENT,age:0}),keys:{groq:"gsk_test"}});
    await app.tab("coach");
    await expect(view(page)).toContainText("önce yaşını gir");
    await expect(page.locator('[data-c="consent"]')).toHaveCount(0);
    expect(fake.chats().length).toBe(0);
  });
  test("the Gemini confirmation is asked once per send (retry included)",async({app,page,fake})=>{
    let n=0;fake.st.reply=()=>++n===1?"düz":JSON.stringify({reply:"Tamam.",log:[]});
    const gm={id:"gemini",name:"Google Gemini",base:"https://generativelanguage.googleapis.com/v1beta/openai",model:"gemini-3.5-flash-lite",on:true,health:true,confirm:true};
    await app.open({seed:state({...CONSENT},{providers:[gm]}),keys:{gemini:"AIzaTest"}});
    await send(app,page,"Selam");
    await expect(view(page)).toContainText("Tamam.");
    expect(n).toBe(2);
    expect(app.dialogs.length).toBeGreaterThanOrEqual(1);
  });
  test("a second message typed while awaiting a reply is sent automatically",async({app,page,fake})=>{
    fake.st.delay=400;
    await open(app);await send(app,page,"Birinci");
    await page.fill("#cmsg","İkinci");await page.click("#csend");
    await expect.poll(()=>fake.chats().length).toBe(2);
    await expect(page.locator(".pendl")).toHaveCount(0);
  });
});

test.describe("Coach identity masking",()=>{
  const openPrev=(app,on=true)=>app.open({seed:state({...CONSENT,piiPrev:on}),keys:{groq:"gsk_test"}});
  const MSG="Ben Ahmet, tel 0532 123 45 67, a.b@posta.com";
  test("with preview off no sheet appears; the outgoing body has no identity and the reply is unmasked locally",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Selam [AD1]."});
    await openPrev(app,false);await send(app,page,MSG);
    await expect(page.locator("#view")).toContainText("Selam Ahmet.");
    await expect(page.locator(".ub").first()).toContainText("0532 123 45 67");
    const body=JSON.stringify(fake.chats()[0].body);
    expect(body).not.toMatch(/Ahmet|0532|posta\.com/);expect(body).toContain("[TELEFON1]");
    await expect(page.locator("#toast")).toContainText("maskelendi");
  });
  test("with preview on the full outgoing text is shown and nothing is sent until Send",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Selam [AD1]."});
    await openPrev(app);await send(app,page,MSG);
    await expect(page.locator("#sheet")).toContainText("Rehber'e giden metin");
    await expect(page.locator("#sheet pre")).toContainText("[AD1]");
    await expect(page.locator("#sheet pre")).not.toContainText("0532");
    expect(fake.chats().length).toBe(0);
    await page.click('[data-c="pvok"]');
    await expect(page.locator("#view")).toContainText("Selam Ahmet.");
    expect(fake.chats().length).toBe(1);expect(app.dialogs.length).toBe(0);
  });
  test("Cancel in the preview sends nothing and the message stays on the phone",async({app,page,fake})=>{
    await openPrev(app);await send(app,page,MSG);
    await page.click('[data-c="pvno"]');
    await expect(page.locator("#sheet")).not.toHaveClass(/on/);
    await expect(page.locator(".pendl")).toHaveCount(0);
    await expect(page.locator(".ub")).toContainText("Ahmet");
    expect(fake.chats().length).toBe(0);
  });
  test("the Gemini confirmation merges into the preview sheet: one sheet, no separate confirm",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Tamam."});
    await app.open({seed:state({...CONSENT,piiPrev:true},{providers:[{id:"gemini",name:"Google Gemini",base:"https://generativelanguage.googleapis.com/v1beta/openai",model:"gemini-3.5-flash-lite",on:true,health:true,confirm:true}]}),keys:{gemini:"AIzaTest"}});
    await send(app,page,"Merhaba");
    await expect(page.locator("#sheet")).toContainText("ücretsiz katmanında");
    await page.click('[data-c="pvok"]');
    await expect(page.locator("#view")).toContainText("Tamam.");
    expect(app.dialogs.length).toBe(0);
  });
  test("final gate: the outgoing body has no raw identity in chat, retry, program, menu and direct call",async({app,page,fake})=>{
    const RAW=/0532|123 45 67|a\.b@posta|12345678901|Ahmet|TR33/;
    let n=0;fake.st.reply=()=>++n===1?"düz yanıt":JSON.stringify({reply:"Selam [AD1].",log:[]});
    await app.open({seed:state({...CONSENT,healthNote:"Tel 0532 123 45 67, TC 12345678901"},{entries:[entry("note",0,"Ahmet aradı a.b@posta.com"),...[0,1,2,3,4,5,6].map(i=>entry("weight",80-i/10,"",{d:-i}))]}),keys:{groq:"gsk_test"}});
    await app.tab("coach");
    const paths={};
    const hit=async(name,run)=>{const k=fake.st.log.length;await run();await expect.poll(()=>fake.st.log.length).toBeGreaterThan(k);paths[name]=fake.st.log.slice(k).filter(x=>x.method==="POST").map(x=>JSON.stringify(x.body));expect(paths[name].length,name).toBeGreaterThan(0);paths[name].forEach(b=>expect(b,name).not.toMatch(RAW))};
    await hit("chat+retry",async()=>{await page.fill("#cmsg","Ben Ahmet, 0532 123 45 67, TC 12345678901, IBAN TR33 0006 1005 1978 6457 8413 26");await page.click("#csend");await expect(page.locator("#view")).toContainText("Selam Ahmet")});
    expect(paths["chat+retry"].length).toBe(2);
    await hit("program",()=>page.evaluate("cProgram({d:3,m:45,q:'Salon',l:'Orta'})"));
    await hit("menu",()=>page.evaluate("menuNote='Ahmet için, a.b@posta.com';cMenu()"));
    await hit("direct call (probe/test)",()=>page.evaluate("callProvider(S.providers.find(p=>p.id==='groq'),'gsk_test',[{role:'system',content:'kural Ahmet 0532 123 45 67'},{role:'user',content:'Ahmet a.b@posta.com 12345678901 TR33 0006 1005 1978 6457 8413 26'}],50)"));
  });
  test("every request carries only the profile line: no medication, weight, notes or health note",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Tamam.",log:[]});
    await app.open({seed:state({...CONSENT,medOn:true,healthNote:"Sağ dizim ağrıyor",heightCm:170,age:34,sex:"m",kcal:1900},{entries:[...[0,1,2,3,4,5,6].map(i=>entry("weight",80-i/10,"",{d:-i})),entry("note",0,"gizli not")],meds:[{id:1,n:"Metformin",d:"500 mg",t:["08:00"],on:true}]}),keys:{groq:"gsk_test"}});
    await app.tab("coach");
    const sysOf=async run=>{await expect.poll(()=>page.evaluate("!busy")).toBe(true);const k=fake.chats().length;await run();await expect.poll(()=>fake.chats().length).toBeGreaterThan(k);return fake.chats().at(-1).body.messages[0].content};
    const all={chat:await sysOf(async()=>{await page.fill("#cmsg","Bir elma kaç kalori");await page.click("#csend")}),program:await sysOf(()=>page.evaluate("cProgram({d:3,m:45,q:'Salon',l:'Orta'})")),menu:await sysOf(()=>page.evaluate("cMenu()"))};
    for(const [k,t] of Object.entries(all)){expect(t,k).toContain("PROFİL: 170 cm, 30-34 yaş, erkek");expect(t,k).toContain("günlük kalori hedefi 1900");expect(t,k).not.toMatch(/Metformin|Sağ dizim|gizli not|SON 14 GÜN|BUGÜN:|HESAPLANAN|KISIT|İLAÇ|SAĞLIK NOTU/)}
  });
  test("protected health fields never enter actual provider body",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Tamam.",log:[]});
    await app.open({seed:state({...CONSENT,medOn:true,healthNote:"Sağ dizim ağrıyor",preg:true,nurs:true,ed:true,heightCm:170,age:34,sex:"m",kcal:1900},{entries:[entry("note",0,"gizli not")],meds:[{id:1,n:"Metformin",d:"500 mg",t:["08:00"],on:true}]}),keys:{groq:"gsk_test"}});
    await app.tab("coach");
    await page.fill("#cmsg","Ben Ahmet, 0532 123 45 67, TC 12345678901");await page.click("#csend");
    await expect.poll(()=>fake.chats().length).toBeGreaterThan(0);
    const body=fake.chats().at(-1).body,wire=JSON.stringify(body.messages.filter(m=>m.role!=="system"))+body.messages.find(m=>m.role==="system").content.slice(body.messages.find(m=>m.role==="system").content.indexOf("PROFİL:"));
    expect(wire).not.toMatch(/Sağ dizim|Metformin|gizli not|Ahmet|0532|12345678901/);
    expect(wire).toMatch(/\[TELEFON1\]|\[TC1\]|\[AD1\]/);
  });
  test("a program request goes with short context: no 14-day table, catalog ids present, a program card appears",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Program hazır.",log:[],program:{name:"3 gün",days:[{n:"A",ex:["squat","bench","row"]},{n:"B",ex:["squat","ohp","pulldown"]},{n:"C",ex:["legpress","incdb","curl"]}]}});
    await app.open({seed:state({...CONSENT,healthNote:"Sağ dizim ağrıyor",medOn:true},{entries:[...[0,1,2,3,4,5,6].map(i=>entry("weight",80-i/10,"",{d:-i}))],meds:[{id:1,n:"Metformin",d:"500 mg",t:["08:00"],on:true}]}),keys:{groq:"gsk_test"}});
    await app.tab("coach");
    const k=fake.chats().length;
    await page.evaluate("cProgram({d:3,m:45,q:'Salon',l:'Başlangıç'})");
    await expect.poll(()=>fake.chats().length).toBeGreaterThan(k);
    const b=fake.chats().at(-1).body,t=b.messages[0].content,ctx=t.slice(t.indexOf("PROFİL:"));
    expect(ctx).not.toMatch(/SON 14 GÜN|BUGÜN:|SON NOTLAR|SAĞLIK NOTU|Metformin/);
    expect(t).toMatch(/KATALOG \(bölge: kimlik\|ad, \.\.\.\):\n/);expect(t).toContain("squat|Squat");expect(t).toContain("bench|");
    expect(b.max_tokens).toBe(900);
    await expect(page.locator("#view")).toContainText("Program hazır");
    expect(await page.evaluate("S.chat.some(m=>m.card&&m.card.kind==='program'&&m.card.days.length===3)")).toBe(true);
  });


  test("Privacy and data: the switch is off by default and persists once on",async({app,page})=>{
    await openPrev(app,false);
    await page.evaluate("sheetPrivacy()");
    const sw=page.locator('#sheet [data-pv="prev"]');
    await expect(sw).not.toBeChecked();
    await expect(page.locator("#sheet")).toContainText("%100 garanti değildir");
    await sw.check();
    expect(await page.evaluate("S.settings.piiPrev")).toBe(true);
    await page.reload();expect(await page.evaluate("S.settings.piiPrev")).toBe(true);
  });
});

test.describe("Coach context sections follow the question",()=>{
  const sys=fake=>fake.chats().at(-1).body.messages[0].content;
  const openMed=app=>app.open({seed:state({...CONSENT,medOn:true},{meds:[{id:1,n:"Metformin",t:["08:00"],on:true}]}),keys:{groq:"gsk_test"}});
  test("a medication question sends no medication section: the context is the profile line only",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Tamam.",log:[]});
    await openMed(app);
    await send(app,page,"İlacımı unuttum ne yapayım");
    await expect(page.locator("#view")).toContainText("Tamam.");
    expect(sys(fake)).not.toContain("İLAÇ");expect(sys(fake)).not.toContain("Metformin");expect(sys(fake)).toContain("PROFİL");
  });
});
