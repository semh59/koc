"use strict";
const {defineConfig}=require("@playwright/test");
const CI=!!process.env.CI,port=+process.env.E2E_PORT||4173;
/* Yerelde kurulu Chrome (indirme yok); CI'da `npx playwright install chromium` ile gelen Chromium. */
const channel=process.env.E2E_CHANNEL??(CI?undefined:"chrome");
const phone=(name,width,height)=>({name,use:{viewport:{width,height},isMobile:true,hasTouch:true}});
module.exports=defineConfig({
  testDir:__dirname,
  testMatch:/.*\.spec\.js$/,
  fullyParallel:true,
  forbidOnly:CI,
  retries:CI?1:0,
  workers:CI?2:4,
  timeout:45000,
  expect:{timeout:5000},
  outputDir:"../test-results/e2e",
  reporter:CI?[["list"],["html",{open:"never",outputFolder:"../e2e-report"}]]:[["list"]],
  use:{
    baseURL:`http://127.0.0.1:${port}`,
    channel,
    locale:"tr-TR",
    timezoneId:"Europe/Istanbul",
    reducedMotion:"reduce",
    serviceWorkers:"block",
    trace:"retain-on-failure",
    screenshot:"only-on-failure"
  },
  projects:[phone("telefon-360",360,640),phone("telefon-412",412,915)],
  webServer:{command:"node e2e/serve.js",url:`http://127.0.0.1:${port}/index.html`,reuseExistingServer:!CI,cwd:require("path").join(__dirname,".."),env:{E2E_PORT:String(port)}}
});
