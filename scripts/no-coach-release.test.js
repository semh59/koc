"use strict";
const assert=require("assert"),fs=require("fs"),path=require("path");
const root=path.join(__dirname,"..","www");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const index=read("index.html");
const manifest=read("kernel/modules.js");
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.(?:js|html)$/.test(e.name))files.push(p)}}
walk(root);
const text=files.map(f=>fs.readFileSync(f,"utf8")).join("\n");
const shipped=text;
const forbidden=[
  "modules/coach/", "data-tab=\"coach\"", "id=\"composer\"", "id=\"cmsg\"", "coachVoice", "coachVoiceConsent",
  "Coach.providers", "Coach.chats", "Coach.memory", "CoachLib", "callProvider", "fetchModels", "api.groq.com", "api.openai.com", "api.anthropic.com",
  "data-c=\"askfood\"", "Rehber'e sor", "Yapay zekâ tahmin eder", "--coach-", "body.coach", "#composer", "#cmsg", "#cvoice", "#csend"
];
for(const hit of forbidden)assert(!shipped.includes(hit),`Coach release residue: ${hit}`);
assert(!manifest.includes("coach:"),"Coach module remains in manifest");
assert(!fs.existsSync(path.join(root,"modules/coach")),"Coach module directory remains in shipped web tree");
assert(index.includes("modules/nutrition/ocrui.js"),"nutrition label OCR script missing");
assert(index.includes("modules/nutrition/menulocal.js"),"local nutrition search script missing");
assert(read("main/04-sheets.js").includes("foodVoiceStart"),"food local voice search missing");
assert(read("main/04-sheets.js").includes("foodListHtml"),"local food search missing");
console.log("No-Coach release contract passed");
