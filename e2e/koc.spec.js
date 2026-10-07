"use strict";
const {test,expect,state,entry}=require("./fixtures");

const LOG=JSON.stringify({reply:"Not aldım.",log:[{type:"yemek",text:"2 yumurta",kcal:150,protein:12,carbs:1,fat:10,meal:"kah"}]});
const open=app=>app.open({seed:state({consent:true,consentV:2,consentAt:"2026-10-06",consentP:"gemini,groq,nvidia,openrouter"}),keys:{groq:"gsk_test"}});
const send=async(app,page,t)=>{await app.tab("koc");await page.fill("#cmsg",t);await page.click("#csend")};

test.describe("Koç kayıt kartı",()=>{
  test("model düz metinle cevap verirse bir kez daha sorulur ve kart çıkar",async({app,page,fake})=>{
    let n=0;fake.st.reply=()=>++n===1?"Afiyet olsun, güzel bir kahvaltı.":LOG;
    await open(app);await send(app,page,"Kahvaltıda 2 yumurta yedim");
    await expect(page.locator(".lcard")).toContainText("Öğüne ekle");
    expect(n).toBe(2);
  });
  test("model kayıt listesini boş bırakırsa bir kez daha sorulur",async({app,page,fake})=>{
    let n=0;fake.st.reply=()=>++n===1?JSON.stringify({reply:"Güzel.",log:[]}):LOG;
    await open(app);await send(app,page,"Kahvaltıda 2 yumurta yedim");
    await expect(page.locator(".lcard")).toContainText("Öğüne ekle");
    expect(n).toBe(2);
  });
  test("sohbet geçmişi modele JSON biçiminde gider, model biçimi bozmaz",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Merhaba."});
    await open(app);await send(app,page,"Selam");
    await expect(page.locator("#view")).toContainText("Merhaba.");
    await page.fill("#cmsg","Nasılsın");await page.click("#csend");
    await expect.poll(()=>fake.chats().length).toBe(2);
    const m=fake.chats()[1].body.messages.filter(x=>x.role==="assistant");
    expect(JSON.parse(m[0].content).reply).toBe("Merhaba.");
  });
  test("kayıt bildirmeyen mesajda gereksiz ikinci istek gitmez",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Su içmeyi unutma.",log:[]});
    await open(app);await send(app,page,"Bugün hava nasıl olur");
    await expect(page.locator("#view")).toContainText("Su içmeyi unutma.");
    expect(fake.chats().length).toBe(1);
  });

  test("yeni sohbet eskisini geçmişe alır; model eski mesajları görmez; geçmişten açılıp devam edilir",async({app,page,fake})=>{
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
    await page.reload();await app.tab("koc");
    await page.click('[data-c="chats"]');
    await expect(page.locator("#sheet")).toContainText("Birinci sohbet mesajı");
    await page.click('[data-c^="openchat:"]');
    await expect(page.locator(".ub")).toHaveText("Birinci sohbet mesajı");
    await expect(page.locator('[data-c="chats"]')).toHaveText("Geçmiş");
  });
  test("geçmiş sohbet silinir ve Geri al ile geri gelir; silme düğmesi sohbet başlığını taşır",async({app,page,fake})=>{
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
  test("Koç yanıt beklerken sohbet değişmez, yanıt gelince değişir",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Tamam."});fake.st.delay=800;
    await open(app);await send(app,page,"Bekleyen mesaj");
    await page.click('[data-c="newchat"]');
    await expect(app.toast).toContainText("sohbet değişmez");
    await expect(page.locator(".ub")).toHaveText("Bekleyen mesaj");
    await expect(page.locator("#view")).toContainText("Tamam.");
    await page.click('[data-c="newchat"]');
    await expect(page.locator(".ub")).toHaveCount(0);
  });
  test("yatay kısa ekranda Koç yazma alanı görünür, hızlı düğme sırası gizlenir",async({app,page,fake})=>{
    await page.setViewportSize({width:800,height:360});
    await open(app);await app.tab("koc");
    await expect(page.locator("#cmsg")).toBeVisible();
    await expect(page.locator("#composer .chiprow")).toBeHidden();
    const [h,c]=await Promise.all([page.locator("header").boundingBox(),page.locator("#composer").boundingBox()]);
    expect(c.y-(h.y+h.height)).toBeGreaterThan(150);
  });
});

test.describe("Koç güvenilirlik",()=>{
  const view=page=>page.locator("#view");
  test("kırpık JSON ham sızmaz; bir kez yeniden sorulur, ikisi de kırpıksa kapanmış reply gösterilir",async({app,page,fake})=>{
    fake.st.reply=()=>'{"reply":"Güzel bir gün.","log":[{"type":"su","ml":2';
    await open(app);await send(app,page,"Selam");
    await expect(view(page)).toContainText("Güzel bir gün.");
    await expect(view(page)).not.toContainText('"log"');
    expect(fake.chats().length).toBe(2);
  });
  test("reply çıkarılamayan kırpık yanıtta genel 'yanıt eksik' iletisi gösterilir",async({app,page,fake})=>{
    fake.st.reply=()=>'{"log":[{"type":"su","ml":2';
    await open(app);await send(app,page,"Selam");
    await expect(view(page)).toContainText("Yanıt eksik geldi");
    await expect(view(page)).not.toContainText('"type"');
  });
  test("uzunluk sınırında kırpılan JSON bir kez daha, daha büyük sınırla denenir",async({app,page,fake})=>{
    let n=0;fake.st.reply=()=>++n===1?'{"reply":"Yarım kal':'{"reply":"Tam yanıt.","log":[]}';fake.st.finish=()=>n===1?"length":"stop";
    await open(app);await send(app,page,"Selam");
    await expect(view(page)).toContainText("Tam yanıt.");
    expect(fake.chats().length).toBe(2);
    expect(fake.chats()[1].body.max_tokens).toBe(fake.chats()[0].body.max_tokens*3);
  });
  test("çift JSON: reply'lı ilk nesne kullanılır, ek istek gitmez",async({app,page,fake})=>{
    fake.st.reply=()=>'{"reply":"Birinci","log":[]}{"reply":"İkinci","log":[]}';
    await open(app);await send(app,page,"Selam");
    await expect(view(page)).toContainText("Birinci");
    await expect(view(page)).not.toContainText("İkinci");
    expect(fake.chats().length).toBe(1);
  });
  test("yeniden sormada da düz yanıt gelirse tek yeniden sorma yapılır, yanıt kaybolmaz",async({app,page,fake})=>{
    fake.st.reply=()=>"Afiyet olsun, güzel öğün.";
    await open(app);await send(app,page,"Kahvaltıda 2 yumurta yedim");
    await expect(view(page)).toContainText("Afiyet olsun");
    expect(fake.chats().length).toBe(2);
    await expect(page.locator(".pendl")).toHaveCount(0);
  });
  test("yeniden sormada doğru JSON gelirse kayıt olmasa da kabul edilir",async({app,page,fake})=>{
    let n=0;fake.st.reply=()=>++n===1?"düz metin":JSON.stringify({reply:"Düzgün yanıt.",log:[]});
    await open(app);await send(app,page,"Selam");
    await expect(view(page)).toContainText("Düzgün yanıt.");
    expect(n).toBe(2);
  });
  test("'constructor' ve 'toString' menü kimlikleri kalem sayılmaz",async({app,page,fake})=>{
    const meal=m=>({m,i:[["constructor",1],["toString",1]]});
    fake.st.reply=()=>JSON.stringify({reply:"Menü",menu:{days:[{n:"Pzt",meals:[meal("kah"),meal("ogl"),meal("aks")]}]}});
    await open(app);await app.tab("koc");
    await page.click('[data-c="menu"]');await page.click('[data-c="menuask"]');
    await expect(app.toast).toContainText("Menü okunamadı");
    await expect(page.locator(".lcard")).toHaveCount(0);
  });
  test("sohbette görülen yeme düzeni işareti kalıcı frendir: yeni sohbette de kalori önerisi çıkmaz",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Tamam.",propose:{kcal:1500,why:"x"}});
    await open(app);await send(app,page,"yedikten sonra kusuyorum");
    await expect(view(page)).toContainText("Tamam.");
    expect((await app.state()).settings.chatRisk).toContain("ed");
    await page.click('[data-c="newchat"]');
    await page.fill("#cmsg","kilo vermek istiyorum");await page.click("#csend");
    await expect(view(page)).toContainText("Tamam.");
    await expect(page.locator('[data-c^="applyk"]')).toHaveCount(0);
    expect(fake.chats().length).toBe(2);
  });
  test("hamilelik ifadesi kalıcı fren olur",async({app,page,fake})=>{
    await open(app);await send(app,page,"hamileyim, ne yapmalıyım");
    await expect(view(page)).toContainText("Merhaba, buradayım.");
    expect((await app.state()).settings.chatRisk).toContain("preg");
  });
  test("deyimsel 'bayılıyorum' modele gider, gerçek bayılma acil kartı açar ve gitmez",async({app,page,fake})=>{
    await open(app);await send(app,page,"baklavaya bayılıyorum");
    await expect(view(page)).toContainText("Merhaba, buradayım.");
    expect(fake.chats().length).toBe(1);
    await page.fill("#cmsg","bayılacak gibiyim");await page.click("#csend");
    await expect(page.locator(".scard")).toContainText("Hemen yardım al");
    expect(fake.chats().length).toBe(1);
  });
  test("hazır sağlayıcının adresi kayıtta değiştirilmiş olsa da kodlu adrese gider",async({app,page,fake})=>{
    const groq={id:"groq",name:"Groq",base:"https://evil.example/v1",model:"llama-3.3-70b-versatile",on:true,health:true,confirm:false};
    await app.open({seed:state({consent:true,consentV:2,consentAt:"2026-10-06",consentP:"gemini,groq,nvidia,openrouter"},{providers:[groq]}),keys:{groq:"gsk_test"}});
    await send(app,page,"Selam");
    await expect(view(page)).toContainText("Merhaba, buradayım.");
    expect(fake.chats().length).toBe(1);
    expect((await app.state()).providers.find(p=>p.id==="groq").base).toBe("https://api.groq.com/openai/v1");
  });
  test("özel sağlayıcı: kullanıcının adresi kullanılır, veri gitmeden önce açık uyarı çıkar",async({app,page,fake})=>{
    const u1={id:"u1",name:"Benimki",base:"https://custom.example/v1",model:"m",on:true,health:true,confirm:false};
    await app.open({seed:state({consent:true,consentV:2,consentAt:"2026-10-06",consentP:"u1"},{providers:[u1]}),keys:{u1:"k1"}});
    await send(app,page,"Selam");
    await expect(view(page)).toContainText("Merhaba, buradayım.");
    expect(fake.chats().length).toBe(1);
    expect(fake.chats()[0].host).toBe("custom.example");
    expect(app.dialogs.join(" ")).toContain("özel bir sağlayıcı (custom.example)");
  });
  test("rıza anında olmayan ücretli sağlayıcıya anahtar girilince Koç yeniden onay ister, veri gitmez",async({app,page,fake})=>{
    const oa={id:"openai",name:"OpenAI",base:"https://api.openai.com/v1",model:"gpt-6-luna",on:true,health:true,confirm:false};
    await app.open({seed:state({consent:true,consentV:2,consentAt:"2026-10-06",consentP:"groq,nvidia,openrouter"},{providers:[oa]}),keys:{openai:"sk-x"}});
    await app.tab("koc");
    await expect(page.locator('[data-c="consent"]')).toBeVisible();
    await expect(view(page)).toContainText("Sağlayıcı listen değişti");
    await page.fill("#cmsg","Selam");await page.click("#csend");
    expect(fake.chats().length).toBe(0);
  });
  test("yaş girilmemişse Koç açılmaz ve yaş girmeye yönlendirir",async({app,page,fake})=>{
    await app.open({seed:state({consent:true,consentV:2,consentAt:"2026-10-06",consentP:"gemini,groq,nvidia,openrouter",age:0}),keys:{groq:"gsk_test"}});
    await app.tab("koc");
    await expect(view(page)).toContainText("önce yaşını gir");
    await expect(page.locator('[data-c="consent"]')).toHaveCount(0);
    expect(fake.chats().length).toBe(0);
  });
  test("Gemini onayı bir gönderimde yalnız bir kez sorulur (yeniden sorma dahil)",async({app,page,fake})=>{
    let n=0;fake.st.reply=()=>++n===1?"düz":JSON.stringify({reply:"Tamam.",log:[]});
    const gm={id:"gemini",name:"Google Gemini",base:"https://generativelanguage.googleapis.com/v1beta/openai",model:"gemini-3.5-flash-lite",on:true,health:true,confirm:true};
    await app.open({seed:state({consent:true,consentV:2,consentAt:"2026-10-06",consentP:"gemini,groq,nvidia,openrouter"},{providers:[gm]}),keys:{gemini:"AIzaTest"}});
    await send(app,page,"Selam");
    await expect(view(page)).toContainText("Tamam.");
    expect(n).toBe(2);
    expect(app.dialogs.length).toBe(1);
  });
  test("yanıt beklerken yazılan ikinci mesaj kendiliğinden gönderilir",async({app,page,fake})=>{
    fake.st.delay=400;
    await open(app);await send(app,page,"Birinci");
    await page.fill("#cmsg","İkinci");await page.click("#csend");
    await expect.poll(()=>fake.chats().length).toBe(2);
    await expect(page.locator(".pendl")).toHaveCount(0);
  });
});

test.describe("Koç kimlik maskeleme",()=>{
  const openPrev=(app,on=true)=>app.open({seed:state({consent:true,consentV:2,consentAt:"2026-10-06",consentP:"gemini,groq,nvidia,openrouter",piiPrev:on}),keys:{groq:"gsk_test"}});
  const MSG="Ben Ahmet, tel 0532 123 45 67, a.b@posta.com";
  test("önizleme kapalıyken pencere çıkmaz; giden gövdede kimlik yok, yanıt yerelde geri çevrilir",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Selam [AD1]."});
    await openPrev(app,false);await send(app,page,MSG);
    await expect(page.locator("#view")).toContainText("Selam Ahmet.");
    await expect(page.locator(".ub").first()).toContainText("0532 123 45 67");
    const body=JSON.stringify(fake.chats()[0].body);
    expect(body).not.toMatch(/Ahmet|0532|posta\.com/);expect(body).toContain("[TELEFON1]");
    await expect(page.locator("#toast")).toContainText("maskelendi");
  });
  test("önizleme açıkken tam giden metin gösterilir, Gönder'e kadar istek gitmez",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Selam [AD1]."});
    await openPrev(app);await send(app,page,MSG);
    await expect(page.locator("#sheet")).toContainText("Koç'a giden metin");
    await expect(page.locator("#sheet pre")).toContainText("[AD1]");
    await expect(page.locator("#sheet pre")).not.toContainText("0532");
    expect(fake.chats().length).toBe(0);
    await page.click('[data-c="pvok"]');
    await expect(page.locator("#view")).toContainText("Selam Ahmet.");
    expect(fake.chats().length).toBe(1);expect(app.dialogs.length).toBe(0);
  });
  test("önizlemede İptal göndermez, mesaj telefonda kalır",async({app,page,fake})=>{
    await openPrev(app);await send(app,page,MSG);
    await page.click('[data-c="pvno"]');
    await expect(page.locator("#sheet")).not.toHaveClass(/on/);
    await expect(page.locator(".pendl")).toHaveCount(0);
    await expect(page.locator(".ub")).toContainText("Ahmet");
    expect(fake.chats().length).toBe(0);
  });
  test("Gemini onayı önizleme penceresine katılır: tek pencere, ayrı confirm yok",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Tamam."});
    await app.open({seed:state({consent:true,consentV:2,consentAt:"2026-10-06",consentP:"gemini,groq,nvidia,openrouter",piiPrev:true},{providers:[{id:"gemini",name:"Google Gemini",base:"https://generativelanguage.googleapis.com/v1beta/openai",model:"gemini-3.5-flash-lite",on:true,health:true,confirm:true}]}),keys:{gemini:"AIzaTest"}});
    await send(app,page,"Merhaba");
    await expect(page.locator("#sheet")).toContainText("ücretsiz katmanında");
    await page.click('[data-c="pvok"]');
    await expect(page.locator("#view")).toContainText("Tamam.");
    expect(app.dialogs.length).toBe(0);
  });
  test("son kapı: sohbet, yeniden sorma, yorum, program, menü ve doğrudan çağrıda giden gövdede ham kimlik yok",async({app,page,fake})=>{
    const RAW=/0532|123 45 67|a\.b@posta|12345678901|Ahmet|TR33/;
    let n=0;fake.st.reply=()=>++n===1?"düz yanıt":JSON.stringify({reply:"Selam [AD1].",log:[]});
    await app.open({seed:state({consent:true,consentV:2,consentAt:"2026-10-06",consentP:"gemini,groq,nvidia,openrouter",healthNote:"Tel 0532 123 45 67, TC 12345678901"},{entries:[entry("not",0,"Ahmet aradı a.b@posta.com"),...[0,1,2,3,4,5,6].map(i=>entry("kilo",80-i/10,"",{d:-i}))]}),keys:{groq:"gsk_test"}});
    await app.tab("koc");
    const paths={};
    const hit=async(name,run)=>{const k=fake.st.log.length;await run();await expect.poll(()=>fake.st.log.length).toBeGreaterThan(k);paths[name]=fake.st.log.slice(k).filter(x=>x.method==="POST").map(x=>JSON.stringify(x.body));expect(paths[name].length,name).toBeGreaterThan(0);paths[name].forEach(b=>expect(b,name).not.toMatch(RAW))};
    await hit("sohbet+yeniden sorma",async()=>{await page.fill("#cmsg","Ben Ahmet, 0532 123 45 67, TC 12345678901, IBAN TR33 0006 1005 1978 6457 8413 26");await page.click("#csend");await expect(page.locator("#view")).toContainText("Selam Ahmet")});
    expect(paths["sohbet+yeniden sorma"].length).toBe(2);
    await hit("yorum",()=>page.evaluate("cComment('daily')"));
    await hit("program",()=>page.evaluate("cProgram({d:3,m:45,q:'Salon',l:'Orta'})"));
    await hit("menü",()=>page.evaluate("menuNote='Ahmet için, a.b@posta.com';cMenu()"));
    await hit("doğrudan çağrı (probe/test)",()=>page.evaluate("callProvider(S.providers.find(p=>p.id==='groq'),'gsk_test',[{role:'system',content:'kural Ahmet 0532 123 45 67'},{role:'user',content:'Ahmet a.b@posta.com 12345678901 TR33 0006 1005 1978 6457 8413 26'}],50)"));
    console.log("giden gövde yolları:",Object.entries(paths).map(([k,v])=>k+"="+v.length).join(", "));
  });
  test("ilaç kaydı olan kullanıcıda her istekte ad ve doz satırı gider (sohbet, menü, program, yorum)",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Tamam.",log:[]});
    await app.open({seed:state({consent:true,consentV:2,consentAt:"2026-10-06",consentP:"gemini,groq,nvidia,openrouter",medOn:true},{entries:[...[0,1,2,3,4,5,6].map(i=>entry("kilo",80-i/10,"",{d:-i}))],meds:[{id:1,n:"Metformin",d:"500 mg",t:["08:00"],on:true}]}),keys:{groq:"gsk_test"}});
    await app.tab("koc");
    const sysOf=async run=>{const k=fake.chats().length;await run();await expect.poll(()=>fake.chats().length).toBeGreaterThan(k);return fake.chats().at(-1).body.messages[0].content};
    const all={sohbet:await sysOf(async()=>{await page.fill("#cmsg","Bugün kaç ml su içtim");await page.click("#csend")}),yorum:await sysOf(()=>page.evaluate("cComment('weekly')")),program:await sysOf(()=>page.evaluate("cProgram({d:3,m:45,q:'Salon',l:'Orta'})")),menü:await sysOf(()=>page.evaluate("cMenu()"))};
    for(const [k,t] of Object.entries(all)){expect(t,k).toContain("KULLANDIĞI İLAÇLAR (yalnız ad ve doz");expect(t,k).toContain("Metformin 500 mg");expect(t,k).toContain("KISIT:");if(k!=="yorum")expect(t,k).not.toContain("saatler 08:00")}
  });
  test("Gizlilik ve veri: anahtar varsayılan kapalı, açılınca kalıcı",async({app,page})=>{
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

test.describe("Koç bağlam bölümleri soruya göre gider",()=>{
  const sys=fake=>fake.chats().at(-1).body.messages[0].content;
  const openMed=app=>app.open({seed:state({consent:true,consentV:2,consentAt:"2026-10-06",consentP:"gemini,groq,nvidia,openrouter",medOn:true},{meds:[{id:1,n:"Metformin",t:["08:00"],on:true}]}),keys:{groq:"gsk_test"}});
  test("ilaç sorusu ilaç bölümünü gönderir, su sorusu göndermez; güvenlik bölümleri her ikisinde var",async({app,page,fake})=>{
    fake.st.reply=()=>JSON.stringify({reply:"Tamam.",log:[]});
    await openMed(app);
    await send(app,page,"Bugün kaç ml su içtim");
    await expect(page.locator("#view")).toContainText("Tamam.");
    expect(sys(fake)).not.toContain("İLAÇLAR (kullanıcının");expect(sys(fake)).toContain("HESAPLANAN");expect(sys(fake)).toContain("SON 14 GÜN");
    await page.fill("#cmsg","İlacımı unuttum ne yapayım");await page.click("#csend");
    await expect.poll(()=>fake.chats().length).toBe(2);
    expect(sys(fake)).toContain("İLAÇLAR");expect(sys(fake)).toContain("Metformin");expect(sys(fake)).toContain("HESAPLANAN");
  });
});
