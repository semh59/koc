const { ok, finish } = require("./ok");
const C = require("../www/modules/coach/coachlib.js");
const QuickLib = require("../www/modules/nutrition/quicklib.js");
const { FOODS } = require("../www/modules/nutrition/foods.js");

console.log("--- FAZ 6 TEST SUITE: DÜŞÜK SÜRTÜNMELİ GİRİŞ (VOICE / PHOTO / LOCAL RESOLUTION) ---");

// ============================================================================
// 1. PII VE SAĞLIK SINIRI (PII & METADATA BOUNDARY)
// ============================================================================

// PII: Turkish phone numbers, TC Kimlik, email, GPS coordinates
const piiSample = "Ahmet Yılmaz, Tel: 0532 123 45 67, TCKN: 12345678901, e-posta: ahmet@example.com, konum: 41.0082, 28.9784.";
const sanitized = C.sanitizePii ? C.sanitizePii(piiSample) : null;
ok("sanitizePii exists and identifies PII", sanitized && sanitized.piiFound === true);
ok("Turkish phone number masked", sanitized && !sanitized.text.includes("0532 123 45 67") && sanitized.text.includes("[TELEFON]"));
ok("Turkish TC Kimlik number masked", sanitized && !sanitized.text.includes("12345678901") && sanitized.text.includes("[TCKN]"));
ok("Email address masked", sanitized && !sanitized.text.includes("ahmet@example.com") && sanitized.text.includes("[E-POSTA]"));
ok("GPS coordinates masked", sanitized && !sanitized.text.includes("41.0082, 28.9784") && sanitized.text.includes("[KONUM]"));

const cleanSample = "2 dilim tam buğday ekmeği ve 1 yumurta";
const sanitizedClean = C.sanitizePii ? C.sanitizePii(cleanSample) : null;
ok("clean text without PII is unchanged", sanitizedClean && sanitizedClean.piiFound === false && sanitizedClean.text === cleanSample);

// ============================================================================
// 2. YEREL YEMEK VE PORSİYON ÇÖZÜMÜ (LOCAL FOOD & PORTION RESOLUTION)
// ============================================================================

// Resolving Turkish food text locally with QuickLib & FOODS catalog without provider call
const resolved = C.resolveLocalFood ? C.resolveLocalFood("2 dilim ekmek, 200 g tavuk göğsü", { foods: FOODS }) : null;
ok("resolveLocalFood produces structured log proposal without network", resolved && resolved.ok === true && resolved.resolvedLocally === true && resolved.networkCalls === 0);
ok("resolved items have valid Coach food structures", resolved && Array.isArray(resolved.items) && resolved.items.length === 2 && resolved.items[0].type === "food");
ok("food portions and grams are calculated correctly", resolved && resolved.items[0].g === 60 && resolved.items[1].g === 200);
ok("food calories and macros are non-zero numbers", resolved && resolved.items[0].kcal > 0 && resolved.items[0].p > 0 && resolved.items[1].kcal > 0 && resolved.items[1].p > 0);
ok("resolved items pass CoachLib.cleanItems check", resolved && C.cleanItems(resolved.items).length === 2);

// Turkish fractional words (yarım, çeyrek, bir buçuk)
const fractional = C.resolveLocalFood ? C.resolveLocalFood("yarım simit", { foods: FOODS }) : null;
ok("fractional Turkish quantities resolved locally", fractional && fractional.ok === true && fractional.items.length === 1 && fractional.items[0].text.toLowerCase().includes("simit"));

// PII stripping during local food resolution
const foodWithPii = C.resolveLocalFood ? C.resolveLocalFood("Kadıköy'deki evimde 05321234567 aradıktan sonra 2 dilim ekmek yedim", { foods: FOODS }) : null;
ok("PII stripped from food input before resolving", foodWithPii && foodWithPii.ok === true && !foodWithPii.sanitizedText.includes("05321234567") && foodWithPii.items.length >= 1);

// Non-matching food returns empty proposal gracefully
const unknownFood = C.resolveLocalFood ? C.resolveLocalFood("xyzabc123bilinmeyenbirsey", { foods: FOODS }) : null;
ok("unmatched text returns graceful empty proposal", unknownFood && unknownFood.ok === false && unknownFood.items.length === 0);

// ============================================================================
// 3. TÜRKÇE SESLE KAYIT VE SES OTURUMU (VOICE LOGGING & AUDIO RETENTION)
// ============================================================================

// Gate 1: Strict consent gate
const noConsentVoice = C.createVoiceSession ? C.createVoiceSession({ consent: { voiceInput: false } }) : null;
let consentBlocked = false;
try {
  if (noConsentVoice) noConsentVoice.start();
} catch (e) {
  consentBlocked = e.code === "VOICE_CONSENT_REQUIRED" || e.error === "consent_required";
}
ok("voice recording blocked without explicit opt-in consent", consentBlocked);

// Gate 2: Provider transfer gate (default local-only)
const localVoice = C.createVoiceSession ? C.createVoiceSession({
  consent: { voiceInput: true, audioTransfer: false }
}) : null;
let transferBlocked = false;
try {
  if (localVoice) localVoice.sendToProvider(Buffer.from([0, 1, 2]));
} catch (e) {
  transferBlocked = e.code === "AUDIO_TRANSFER_CONSENT_REQUIRED" || e.error === "provider_transfer_prohibited";
}
ok("voice transfer to external provider blocked without audioTransfer consent", transferBlocked);

// Gate 3: Audio retention rule (Zero persistent raw audio retention)
const voiceSession = C.createVoiceSession ? C.createVoiceSession({
  consent: { voiceInput: true, audioTransfer: false },
  allowAudioRetention: false // default policy
}) : null;

// Mock raw audio ingestion
const dummyAudio = Buffer.from(new Uint8Array(4096)); // 4KB of raw PCM/audio
if (voiceSession) {
  voiceSession.ingestAudioChunk(dummyAudio);
}
ok("raw audio chunks held only during active recording", voiceSession && voiceSession.isRecording() === true && voiceSession.bufferedBytes > 0);

// Instant transcription then purge
let transcribedText = "";
if (voiceSession) {
  // Simulate transcription completion
  const res = voiceSession.finishTranscription("2 dilim ekmek bir bardak süt");
  transcribedText = res.transcript;
}
ok("transcription succeeds with Turkish text", transcribedText === "2 dilim ekmek bir bardak süt");
ok("zero persistent raw audio retention: raw audio purged immediately", voiceSession && voiceSession.getRawAudio() === null && voiceSession.retainedAudioBytes === 0);

// SpeechRecognition abstraction with keyboard fallback
const speechAbst = C.createVoiceSession ? C.createVoiceSession({
  consent: { voiceInput: true },
  recognitionEngine: null // simulate missing browser SpeechRecognition
}) : null;
ok("fallback to keyboard dictation when SpeechRecognition unavailable", speechAbst && speechAbst.mode === "keyboard_dictation");

// Speech transcription directly resolves local food proposal
const voiceFoodProposal = C.resolveLocalFood ? C.resolveLocalFood(transcribedText, { foods: FOODS }) : null;
ok("transcribed voice input directly resolves to Coach log proposal", voiceFoodProposal && voiceFoodProposal.ok === true && voiceFoodProposal.items.length >= 1);

// Phase 6 regressions: PII boundaries and live speech controls.
const piiCases=[
  "Ara: (0212) 555 12 34",
  "Ara: +90 532 123 45 67",
  "Koordinat 41,0082; 28,9784",
  "x12345678901y",
  "TCKN 12345678901 telefon 05321234567",
  "Sabit hat: 02125551234",
  "Kurumsal: 444 1 444 ve (0216) 444 0 444",
  "Santral: 0850 123 45 67",
  "GPS: 41.0082° N, 28.9784° E"
];
ok("PII corpus masks landline, comma GPS, and boundary TCKN", piiCases.every(x=>{const r=C.sanitizePii(x);return r.piiFound&&!/0212|532|41,0082|28,9784|41\.0082|28\.9784|12345678901|05321234567|444|0850/.test(r.text)}));
ok("local resolution has no raw PII field", (()=>{const r=C.resolveLocalFood("05321234567 aradı, 2 dilim ekmek",{foods:FOODS});return r.ok&&!("rawText" in r)&&!("raw" in r)&&!Object.values(r).some(v=>typeof v==="string"&&v.includes("05321234567"))})());

const speech=C.createVoiceSession({consent:{voiceInput:true},recognitionEngine:"web_speech"});speech.start();ok("speech session exposes stop and cancel without retaining audio", typeof speech.stop==="function"&&typeof speech.cancel==="function"&&speech.stop().retainedAudioBytes===0);
const liveConsent={voiceInput:true};const liveSpeech=C.createVoiceSession({consent:()=>liveConsent});liveSpeech.start();liveConsent.voiceInput=false;let liveBlocked=false;try{liveSpeech.ingestAudioChunk(Buffer.from([1]))}catch(e){liveBlocked=e.code==="VOICE_CONSENT_REQUIRED"}ok("voice consent is read live after revoke",liveBlocked);

// Independent REJECT regressions: stop must purge, signatures need structure, and prose privacy must hold.
const stopped=C.createVoiceSession({consent:{voiceInput:true},allowAudioRetention:false});
stopped.start();stopped.ingestAudioChunk(Buffer.from([1,2,3,4]));
const stoppedResult=stopped.stop();
ok("stop purges raw audio when retention is disabled",stoppedResult.retainedAudioBytes===0&&stopped.bufferedBytes===0&&stopped.getRawAudio()===null&&stopped.retainedAudioBytes===0);
const prosePii=C.sanitizePii("Zeynep, Beşiktaş'taki evimde 2 dilim ekmek yedim");
ok("local privacy projection masks arbitrary prose name and address",prosePii.piiFound&&!/Zeynep|Beşiktaş|evimde/i.test(prosePii.text));
const proseFood=C.resolveLocalFood("Zeynep, Beşiktaş'taki evimde 2 dilim ekmek yedim",{foods:FOODS});
ok("local food resolution preserves food while returning no arbitrary raw prose PII",proseFood.ok&&proseFood.items.length===1&&!/Zeynep|Beşiktaş|evimde/i.test(proseFood.sanitizedText));

// Local chat never stores raw prose (regression for REJECT 2/3).
function cSendLocal(text){
  const resolved=C.resolveLocalFood(text,{foods:FOODS});
  return resolved.ok?resolved.items.map(i=>i.text).join(", "):"[yerel giriş]";
}
const chat1=cSendLocal("Zeynep, 2 elma yedim");
ok("local chat stores only food items, not raw prose names",chat1.includes("Elma")&&!chat1.match(/Zeynep/i));
const chat2=cSendLocal("Fatma, ekmek yedim");
ok("local chat stores only food items, not health prose",chat2.includes("ekmek")&&!chat2.match(/Fatma/i));
const chat3=cSendLocal("Ahmet, 2 yumurta yedim");
ok("local chat stores only food items, not street address",chat3.includes("yumurta")&&!chat3.match(/Ahmet/i));

finish();
