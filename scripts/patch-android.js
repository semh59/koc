// Bildirim izinlerini Android manifest'ine ekler ve NeoWell simgelerini yerleştirir (tekrar çalıştırılırsa bir şey bozmaz).
const fs = require("fs");
const p = "android/app/src/main/AndroidManifest.xml";
let x = fs.readFileSync(p, "utf8");
for (const perm of ["POST_NOTIFICATIONS", "RECEIVE_BOOT_COMPLETED", "VIBRATE", "SCHEDULE_EXACT_ALARM", "USE_EXACT_ALARM"]) {
  if (!x.includes(`android.permission.${perm}`)) {
    x = x.replace("</manifest>", `    <uses-permission android:name="android.permission.${perm}" />\n</manifest>`);
  }
}
fs.writeFileSync(p, x);
console.log("Manifest güncellendi.");
const res="android/app/src/main/res";
fs.cpSync("assets/android/res",res,{recursive:true});
console.log("Simgeler yerleştirildi.");
