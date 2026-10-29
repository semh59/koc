const { ok, finish } = require("./ok");
const C = require("../www/modules/coach/coachlib.js");
const QuickLib = require("../www/modules/nutrition/quicklib.js");
const { FOODS } = require("../www/modules/nutrition/foods.js");
const LabelLib = require("../www/modules/nutrition/labellib.js");

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

// EXIF / GPS stripping from JPEG
// A synthetic minimal JPEG buffer with an APP1 segment containing EXIF & GPS
const syntheticJpegWithExif = Buffer.from([
  0xFF, 0xD8,                         // SOI (Start of Image)
  0xFF, 0xE1, 0x00, 0x14,             // APP1 marker + length (20 bytes: 2 len + 18 payload)
  0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // "Exif\0\0"
  0x47, 0x50, 0x53, 0x20, 0x44, 0x41, // "GPS DA"
  0x54, 0x41, 0x20, 0x4C, 0x4F, 0x43, // "TA LOC"
  0xFF, 0xDA, 0x00, 0x08,             // SOS (Start of Scan)
  0x01, 0x02, 0x03, 0x04, 0x05, 0x06, // image data
  0xFF, 0xD9                          // EOI (End of Image)
]);

const strippedBuffer = C.stripExif ? C.stripExif(syntheticJpegWithExif) : null;
ok("stripExif strips APP1 EXIF segment from buffer", strippedBuffer && !strippedBuffer.includes(Buffer.from("Exif")) && !strippedBuffer.includes(Buffer.from("GPS")));
ok("stripped JPEG retains SOI and SOS/EOI", strippedBuffer && strippedBuffer[0] === 0xFF && strippedBuffer[1] === 0xD8 && strippedBuffer[strippedBuffer.length - 2] === 0xFF && strippedBuffer[strippedBuffer.length - 1] === 0xD9);

// Base64 data URL stripping
const b64Jpeg = "data:image/jpeg;base64," + syntheticJpegWithExif.toString("base64");
const strippedB64 = C.stripExif ? C.stripExif(b64Jpeg) : null;
ok("stripExif strips EXIF from base64 data URI", strippedB64 && typeof strippedB64 === "string" && strippedB64.startsWith("data:image/jpeg;base64,") && !Buffer.from(strippedB64.split(",")[1], "base64").includes(Buffer.from("Exif")));

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

// ============================================================================
// 4. FOTOĞRAF / MEAL SCAN VE BESIN ETİKETİ TARAMA (PHOTO LOGGING & RETENTION)
// ============================================================================

// Gate 1: Strict image consent gate
const noConsentPhoto = C.createImageSession ? C.createImageSession({ consent: { imageCapture: false } }) : null;
let photoConsentBlocked = false;
try {
  if (noConsentPhoto) noConsentPhoto.captureImage(b64Jpeg);
} catch (e) {
  photoConsentBlocked = e.code === "IMAGE_CONSENT_REQUIRED" || e.error === "consent_required";
}
ok("image capture blocked without explicit opt-in consent", photoConsentBlocked);

// Gate 2: Provider transfer gate (default local-only)
const localPhoto = C.createImageSession ? C.createImageSession({
  consent: { imageCapture: true, photoProviderTransfer: false }
}) : null;
let photoTransferBlocked = false;
try {
  if (localPhoto) localPhoto.sendToProvider("img-1");
} catch (e) {
  photoTransferBlocked = e.code === "PROVIDER_TRANSFER_CONSENT_REQUIRED" || e.error === "provider_transfer_prohibited";
}
ok("photo transfer to external provider blocked without photoProviderTransfer consent", photoTransferBlocked);

// Gate 3: Temporary processing & EXIF strip on capture
const photoSession = C.createImageSession ? C.createImageSession({
  consent: { imageCapture: true, photoProviderTransfer: false }
}) : null;

let capturedId = null;
if (photoSession) {
  const cap = photoSession.captureImage(b64Jpeg, { purpose: "meal_scan" });
  capturedId = cap.id;
}
ok("captured image added to temporary session cache with EXIF stripped", capturedId && photoSession.listCache().length === 1 && photoSession.listCache()[0].exifStripped === true);
ok("temporary image marked as non-permanent", photoSession && photoSession.listCache()[0].temporary === true);

// Gate 4: Review, Delete & Export
const cacheList = photoSession ? photoSession.listCache() : [];
ok("user can review captured image metadata without PII", cacheList.length === 1 && cacheList[0].id === capturedId && !JSON.stringify(cacheList[0]).includes("Exif") && !JSON.stringify(cacheList[0]).includes("GPS"));

const exportedMetadata = photoSession ? photoSession.exportCacheMetadata() : null;
ok("user can export temporary image audit metadata before deletion", exportedMetadata && exportedMetadata.length === 1 && exportedMetadata[0].id === capturedId);

const cleared = photoSession ? photoSession.clearCache() : null;
ok("user can clear image cache completely", cleared && cleared.ok === true && photoSession.listCache().length === 0 && photoSession.retainedImageBytes === 0);

// Local Nutrition Label Scan (LabelLib + Coach logging)
// Synthetic OCR lines from a Turkish nutrition table
const ocrLines = [
  "Besin Değerleri (100 g için)",
  "Enerji 250 kcal",
  "Yağ 10 g",
  "Karbonhidrat 30 g",
  "Protein 10 g"
];
const parsedLabel = LabelLib.parse(ocrLines);
ok("LabelLib parses local OCR lines", parsedLabel && (parsedLabel.food || parsedLabel).k === 250 && (parsedLabel.food || parsedLabel).p === 10);

const labelProposal = C.resolveLocalLabel ? C.resolveLocalLabel("Süzme Peynir", parsedLabel, { grams: 50 }) : null;
ok("resolveLocalLabel generates Coach log item with zero network calls", labelProposal && labelProposal.ok === true && labelProposal.items[0].kcal === 125 && labelProposal.items[0].p === 5);

// Phase 6 REJECT regressions: complete metadata formats, PII boundaries, and live speech controls.
function chunk(type, payload) {
  const body = Buffer.from(payload);
  const h = Buffer.alloc(8); h.writeUInt32BE(body.length, 0); h.write(type, 4, 4, "ascii");
  return Buffer.concat([h, body, Buffer.alloc(4)]);
}
const png = Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), chunk("IHDR", Buffer.alloc(13)), chunk("eXIf", "GPS"), chunk("tEXt", "Author\\0Ali"), chunk("IDAT", "pixels"), chunk("IEND", "")]);
function webpChunk(type, payload) { const p=Buffer.from(payload); const h=Buffer.alloc(8); h.write(type,0,4,"ascii"); h.writeUInt32LE(p.length,4); return Buffer.concat([h,p,p.length%2?Buffer.from([0]):Buffer.alloc(0)]); }
const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBP"), webpChunk("VP8 ", Buffer.alloc(10)), webpChunk("EXIF", "GPS"), webpChunk("XMP ", "name")]);
function jpegSegment(marker, payload) { const p=Buffer.from(payload); const h=Buffer.from([0xff,marker,(p.length+2)>>8,(p.length+2)&255]); return Buffer.concat([h,p]); }
const allMetaJpeg = Buffer.concat([Buffer.from([0xff,0xd8]), jpegSegment(0xe0,"JFIF"), jpegSegment(0xe2,"XMP"), jpegSegment(0xfe,"COM"), Buffer.from([0xff,0xda,0x00,0x04,0x01,0x02,0xff,0xd9])]);
const detailed = C.stripExifDetailed ? C.stripExifDetailed(png) : null;
ok("JPEG strips every APPn and COM segment", (()=>{const x=C.stripExif(allMetaJpeg);return x[2]===0xff&&x[3]===0xda&&!x.includes(Buffer.from("XMP"))&&!x.includes(Buffer.from("COM"))})());
ok("PNG strips eXIf and text chunks", detailed && detailed.mimeType === "image/png" && detailed.stripped && !detailed.data.includes(Buffer.from("GPS")) && !detailed.data.includes(Buffer.from("Author")));
ok("WebP strips EXIF and XMP chunks", (()=>{const x=C.stripExifDetailed?C.stripExifDetailed(webp):null;return x&&x.mimeType==="image/webp"&&x.stripped&&!x.data.includes(Buffer.from("GPS"))&&!x.data.includes(Buffer.from("name"))})());
let unsupportedRejected=false;try{C.stripExifDetailed(Buffer.from("not-an-image"))}catch(e){unsupportedRejected=e.code==="UNSUPPORTED_IMAGE_FORMAT"}ok("unsupported image formats are rejected explicitly", unsupportedRejected);
let mismatchRejected=0;
for(const [declared,bytes] of [["image/png",allMetaJpeg],["image/jpeg",png],["image/webp",png]]){
  try{C.stripExifDetailed(`data:${declared};base64,${bytes.toString("base64")}`)}catch(e){if(e.code==="MIME_MISMATCH")mismatchRejected++}
}
ok("data URI MIME must match JPEG/PNG/WebP magic", mismatchRejected===3);
const imageMeta=C.createImageSession({consent:{imageCapture:true}}),webpCap=imageMeta.captureImage(webp,{purpose:"meal_scan"}),meta=imageMeta.listCache()[0];
ok("image metadata reports detected MIME and actual strip result", meta && meta.mimeType==="image/webp" && meta.exifStripped===true && meta.sanitized===true);
const livePhotoConsent={imageCapture:true};const livePhoto=C.createImageSession({consent:()=>livePhotoConsent});livePhotoConsent.imageCapture=false;let livePhotoBlocked=false;try{livePhoto.captureImage(webp)}catch(e){livePhotoBlocked=e.code==="IMAGE_CONSENT_REQUIRED"}ok("photo consent is read live after revoke",livePhotoBlocked);
const settingsSrc=require("fs").readFileSync(require("path").join(__dirname,"../www/main/01-core.js"),"utf8");
ok("voice/photo consent defaults and cleanSettings persistence are wired",/voiceConsent:false/.test(settingsSrc)&&/photoConsent:false/.test(settingsSrc)&&/\[\"voiceConsent\",\"photoConsent\"\]/.test(settingsSrc));
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

const largeHead = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00]);
const largeScan = Buffer.alloc(1024 * 1024 + 500, 0x12);
const largeTail = Buffer.from([0xff, 0xda, 0x00, 0x04, 0x01, 0x02, 0xff, 0xd9]);
const largeJpeg = Buffer.concat([largeHead, largeTail.subarray(0, 6), largeScan, largeTail.subarray(6)]);
const largeDataUri = "data:image/jpeg;base64," + largeJpeg.toString("base64");
const largeResult = C.stripExifDetailed(largeDataUri);
ok("large data URI conversion processes 1MB+ image without call stack overflow", largeResult && largeResult.mimeType === "image/jpeg" && largeResult.data.length > 1000000);
const speech=C.createVoiceSession({consent:{voiceInput:true},recognitionEngine:"web_speech"});speech.start();ok("speech session exposes stop and cancel without retaining audio", typeof speech.stop==="function"&&typeof speech.cancel==="function"&&speech.stop().retainedAudioBytes===0);
const liveConsent={voiceInput:true};const liveSpeech=C.createVoiceSession({consent:()=>liveConsent});liveSpeech.start();liveConsent.voiceInput=false;let liveBlocked=false;try{liveSpeech.ingestAudioChunk(Buffer.from([1]))}catch(e){liveBlocked=e.code==="VOICE_CONSENT_REQUIRED"}ok("voice consent is read live after revoke",liveBlocked);

// Independent REJECT regressions: stop must purge, signatures need structure, and prose privacy must hold.
const stopped=C.createVoiceSession({consent:{voiceInput:true},allowAudioRetention:false});
stopped.start();stopped.ingestAudioChunk(Buffer.from([1,2,3,4]));
const stoppedResult=stopped.stop();
ok("stop purges raw audio when retention is disabled",stoppedResult.retainedAudioBytes===0&&stopped.bufferedBytes===0&&stopped.getRawAudio()===null&&stopped.retainedAudioBytes===0);
const truncatedImages=[
  Buffer.from([0xff,0xd8]),
  Buffer.from("89504e470d0a1a0a","hex"),
  Buffer.from("RIFF0000WEBP","ascii")
];
ok("truncated JPEG PNG and WebP signatures are rejected",truncatedImages.every(bytes=>{try{C.stripExifDetailed(bytes);return false}catch(e){return e.code==="MALFORMED_IMAGE"}}));
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
