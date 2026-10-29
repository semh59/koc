const { ok, finish } = require("./ok");
const { boot } = require("./html");

boot().then(w => {
  w.eval("S=structuredClone(DEF);S.settings.obDone=true;tab='coach';render();");

  // 1. Coach low-friction entry chips exist
  ok("coach renders low-friction entry controls",
    w.document.querySelector('[data-c="entryvoice"]') !== null &&
    w.document.querySelector('[data-c="entryphoto"]') !== null &&
    w.document.querySelector('[data-c="entrylocal"]') !== null
  );

  // 2. Voice consent gate
  w.document.querySelector('[data-c="entryvoice"]').click();
  ok("voice entry prompts for explicit consent if not granted",
    w.document.body.textContent.includes("Sesle kayıt") &&
    w.document.body.textContent.includes("açık rıza") ||
    w.document.body.textContent.includes("onay")
  );

  // 3. Photo consent gate
  w.eval("closeSheet();");
  w.document.querySelector('[data-c="entryphoto"]').click();
  ok("photo entry prompts for explicit consent if not granted",
    w.document.body.textContent.includes("Fotoğraf") &&
    w.document.body.textContent.includes("onay") ||
    w.document.body.textContent.includes("rıza")
  );

  // 4. Local food resolution directly opens food card
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

  // 6. Coach API exposes phase 6 methods
  ok("Coach API exposes Phase 6 resolution and session helpers",
    typeof w.eval("Coach.resolveLocalFood") === "function" &&
    typeof w.eval("Coach.createVoiceSession") === "function" &&
    typeof w.eval("Coach.createImageSession") === "function" &&
    typeof w.eval("Coach.clearImageCache") === "function"
  );

  // 7. A visible privacy action revokes both low-friction entry consents.
  w.eval("S.settings.voiceConsent=true;S.settings.photoConsent=true;render();");
  ok("voice/photo revoke control is visible when either consent is active",w.document.querySelector('[data-c="revoke-entry-consent"]') !== null);
  w.document.querySelector('[data-c="revoke-entry-consent"]').click();
  ok("revoking entry consents clears both flags and cached session state",w.eval("S.settings.voiceConsent===false&&S.settings.photoConsent===false&&Coach.imageSession().listCache().length===0"));

  // 8. Consent grant rerenders revoke control and local chat never stores raw prose.
  w.eval("S.settings.voiceConsent=true;S.settings.photoConsent=false;render();");
  ok("consent grant immediately exposes revoke control",w.document.querySelector('[data-c="revoke-entry-consent"]') !== null);
  w.eval("S.settings.voiceConsent=false;S.settings.photoConsent=false;cSend(\"Zeynep, Beşiktaş'taki evimde 2 dilim ekmek\");");
  ok("local chat does not persist raw prose PII",!w.eval("S.chat.map(m=>m.text||'').join(' ')").match(/Zeynep|Beşiktaş|evimde/i));

  // 9. FileReader failure triggers user-visible toast
  let toastMsg = "";
  const origToast = w.toast;
  w.toast = m => { toastMsg = m; if (origToast) origToast(m); };
  const origFR = w.FileReader;
  w.FileReader = function() {
    this.readAsDataURL = () => { if (this.onerror) this.onerror(new Error("read failed")); };
  };
  w.cPhotoPick("meal_scan");
  const fileInput = w.document.querySelector('input[type="file"]');
  if (fileInput) {
    Object.defineProperty(fileInput, "files", { value: [{ name: "photo.jpg" }] });
    fileInput.dispatchEvent(new w.Event("change"));
  }
  ok("FileReader error shows user-visible toast", toastMsg.includes("Görsel okunamadı"));
  w.FileReader = origFR;

  finish();
}).catch(e => {
  console.error(e);
  process.exit(1);
});
