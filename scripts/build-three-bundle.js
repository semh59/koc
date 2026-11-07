"use strict";
const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "www", "vendor", "three");
fs.mkdirSync(outDir, { recursive: true });

const outFile = path.join(outDir, "three.bundle.js");

const entryCode = `
export * from "three";
export { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
`;

async function main() {
  await esbuild.build({
    stdin: {
      contents: entryCode,
      resolveDir: path.join(__dirname, ".."),
      sourcefile: "three-entry.js",
      loader: "js"
    },
    bundle: true,
    minify: true,
    format: "iife",
    globalName: "THREE",
    target: ["chrome80", "es2018"],
    footer: {
      js: 'if(typeof window!=="undefined")window.THREE=THREE;if(typeof globalThis!=="undefined")globalThis.THREE=THREE;'
    },
    outfile: outFile
  });

  const kb = (fs.statSync(outFile).size / 1024).toFixed(1);
  console.log(`PASS Three.js bundle created at ${outFile} (${kb} KB)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
