"use strict";
const fs=require("fs"),path=require("path");
const datasetIds=new Set(fs.readFileSync(path.join(__dirname,"exlib-src.txt"),"utf8").split(/\r?\n/).filter(line=>line&&!line.startsWith("#")).map(line=>line.split("|")[1]));
const localIds=new Set(["onefoot","heeltoe","chairstand","sidestep","tandem","armswalk","fastwalk","slowwalk"]);

const SOURCES={
  "neowell-data":{
    name:"NeoWell hand-written supplemental exercises",
    repository:"local",
    sourcePath:"www/modules/gym/balance.js",
    license:"NeoWell internal content",
    licenseStatus:"internal"
  },
  "free-exercise-db-data":{
    name:"free-exercise-db dataset JSON",
    repository:"https://github.com/yuhonas/free-exercise-db",
    commit:"f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5",
    sourcePath:"dist/exercises.json",
    license:"Unlicense",
    licensePath:"LICENSE.md",
    licenseUrl:"https://raw.githubusercontent.com/yuhonas/free-exercise-db/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/LICENSE.md",
    licenseStatus:"verified",
    attribution:"Data adapted from yuhonas/free-exercise-db at commit f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5 (Unlicense).",
    transformation:"Selected using scripts/exlib-src.txt; NeoWell names, figure mapping and cues maintained separately.",
    evidence:"Pinned LICENSE.md states public-domain dedication for the software/data source."
  },
  "free-exercise-db-images":{
    name:"free-exercise-db exercise images",
    repository:"https://github.com/yuhonas/free-exercise-db",
    commit:"f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5",
    sourcePath:"exercises/*/*.jpg",
    license:"unknown",
    licensePath:"",
    licenseUrl:"https://github.com/yuhonas/free-exercise-db/issues/2",
    licenseStatus:"unverified",
    useStatus:"blocked",
    evidence:"Upstream maintainer states image origin/licensing is unknown; do not treat repository data license as image license."
  },
  "neowell-figure":{
    name:"NeoWell generated figure",
    repository:"local",
    commit:"",
    sourcePath:"www/modules/gym/figtpl.js",
    license:"NeoWell-owned generated asset",
    licensePath:"",
    licenseStatus:"internal",
    useStatus:"eligible",
    evidence:"Generated in repository; no third-party image asset claim."
  }
};

function recordManifest(records){
  return (Array.isArray(records)?records:[]).map(e=>{
    const hasPhoto=Number(e&&e.im)>0;
    const assetStatus=hasPhoto?SOURCES["free-exercise-db-images"].licenseStatus:"not_applicable";
    const dataSource=datasetIds.has(e&&e.id)?"free-exercise-db-data":localIds.has(e&&e.id)?"neowell-data":"unknown";
    const dataLicenseStatus=SOURCES[dataSource]?.licenseStatus||"unverified";
    const decision=assetStatus==="unverified"||dataLicenseStatus==="unverified"?"review":"eligible";
    return {id:e&&e.id||"",dataSource,dataLicenseStatus,assetStatus,assetSource:hasPhoto?"free-exercise-db-images":"neowell-figure",decision};
  });
}
module.exports={SOURCES,recordManifest};
