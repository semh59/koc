"use strict";
const fs=require("fs"),path=require("path"),{SOURCES,recordManifest}=require("./gym-provenance");
const records=require("../www/modules/gym/exlib");
require("../www/modules/gym/balance");
const manifest={
  batch:"B-2-baseline",status:"review",sources:SOURCES,
  counts:{source:324,local:8,runtime:records.length,accepted_new_records:0},
  openReview:"Legacy photos remain packaged but are not rendered in exercise detail; image license remains unverified. No new records accepted.",
  records:recordManifest(records)
};
fs.writeFileSync(path.join(__dirname,"../docs/analysis/gym-phase-b-provenance.json"),JSON.stringify(manifest,null,2)+"\n");
console.log(`Provenance manifest: ${manifest.records.length} records`);
