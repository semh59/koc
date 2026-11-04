const { ok, finish } = require("./ok");
const { boot } = require("./html");

boot().then(async w => {
  ok("consent cleaner rejects incomplete tuple and preserves canonical ISO instant",
    w.eval("(()=>{const at='2026-10-06T07:00:00.000Z',good=cleanSettings({entryConsentSeen:true,entryConsentVersion:1,entryConsentAt:at,entryConsentChoice:'text_only'}),bad=cleanSettings({entryConsentSeen:true,entryConsentVersion:1,entryConsentAt:'2026-10-06',entryConsentChoice:'text_only',voiceConsent:true});return good.entryConsentAt===at&&good.entryConsentSeen===true&&good.voiceConsent===false&&bad.entryConsentSeen===false&&bad.entryConsentAt===''})()")
  );
  w.eval("S=structuredClone(DEF);S.settings.obDone=true;Object.assign(S.settings,{entryConsentSeen:true,entryConsentVersion:1,entryConsentAt:'',entryConsentChoice:'text_only'});tab='coach';render();");
  ok("incomplete saved consent cannot bypass first-use draft notice",
    w.document.body.textContent.includes("Yayın öncesi hukuki inceleme gerektirir") &&
    w.document.querySelector('[data-c="entryconsenttextonly"]') !== null &&
    w.document.querySelector('[data-c="entryvoice"]') === null
  );
  w.eval("S=structuredClone(DEF);S.settings.obDone=true;tab='coach';render();");

  // 0. First Coach use shows draft privacy notice and records an explicit choice.
  ok("first Coach use shows the legal draft notice before entry controls",
    w.document.body.textContent.includes("Yayın öncesi hukuki inceleme gerektirir") &&
    w.document.body.textContent.includes("Veri sorumlusu henüz atanmadı") &&
    w.document.querySelector('[data-c="entryconsenttextonly"]') !== null
  );
  w.document.querySelector('[data-c="entryconsenttextonly"]').click();
  ok("text-only choice records version, timestamp and scope without enabling capture",
    w.eval("S.settings.entryConsentSeen===true&&S.settings.entryConsentVersion===1&&typeof S.settings.entryConsentAt==='string'&&S.settings.entryConsentChoice==='text_only'&&!S.settings.voiceConsent")
  );

  // 1. Coach low-friction entry chips exist
  ok("coach renders local entry controls",
    w.document.querySelector('[data-c="entryvoice"]') !== null &&
    w.document.querySelector('[data-c="entrylocal"]') !== null &&
    w.document.querySelector('[data-c="entryphoto"]') === null
  );

  // 2. Voice consent gate
  w.document.querySelector('[data-c="entryvoice"]').click();
  ok("voice entry prompts for explicit consent if not granted",
    w.document.body.textContent.includes("Sesle kayıt") &&
    w.document.body.textContent.includes("açık rıza") ||
    w.document.body.textContent.includes("onay")
  );

  // 3. Local food resolution directly opens food card
  w.eval("closeSheet();");
  w.document.querySelector('[data-c="entrylocal"]').click();
  ok("local food entry modal opens", w.document.getElementById("local-food-input") !== null);

  w.document.getElementById("local-food-input").value = "2 dilim ekmek, 200 g tavuk göğsü";
  w.document.querySelector('[data-c="localfoodresolve"]').click();

  ok("local food resolution creates coach pending log card without provider",
    w.document.body.textContent.includes("Beyaz ekmek") &&
    w.document.body.textContent.includes("tavuk göğsü") &&
    w.document.querySelector('[data-c^="ok:"]') !== null
  );

  // 5. Confirming log card adds foods to Log
  ok("confirm button text on local food card is exactly 'Öğüne ekle'",
    w.document.querySelector('[data-c^="ok:"]').textContent.trim() === "Öğüne ekle"
  );
  const logCountBefore = w.eval("Log.all().length");
  w.document.querySelector('[data-c^="ok:"]').click();
  const logCountAfter = w.eval("Log.all().length");
  ok("confirming local card adds items to Log", logCountAfter >= logCountBefore + 2);

  ok("Coach API exposes local food and voice helpers",
    typeof w.eval("Coach.resolveLocalFood") === "function" &&
    typeof w.eval("Coach.createVoiceSession") === "function"
  );

  // 6. Visible privacy action revokes voice consent.
    w.eval("S.settings.voiceConsent=true;render();");
    ok("voice consent exposes revoke control", w.document.querySelector('[data-c="revoke-entry-consent"]') !== null);
    w.document.querySelector('[data-c="revoke-entry-consent"]').click();
    ok("revoking voice consent clears voice state",w.eval("S.settings.voiceConsent===false&&S.settings.entryConsentSeen===false"));
    ok("after revoke, consent screen shows again",
      w.document.body.textContent.includes("Yayın öncesi hukuki inceleme gerektirir") &&
      w.document.querySelector('[data-c="entryconsenttextonly"]') !== null
    );
    w.document.querySelector('[data-c="entryconsenttextonly"]').click();
    ok("text-only consent does not enable voice; no revoke control", w.document.querySelector('[data-c="revoke-entry-consent"]') === null);
    w.eval("cSend(\"Zeynep, Beşiktaş'taki evimde 2 dilim ekmek\");");
    ok("local chat does not persist raw prose PII",!w.eval("S.chat.map(m=>m.text||'').join(' ')").match(/Zeynep|Beşiktaş|evimde/i));

  finish();
}).catch(e => {
  console.error(e);
  process.exit(1);
});
