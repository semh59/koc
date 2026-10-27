const {ok,finish}=require("./ok");
const P=require("../www/kernel/piilib.js");
const masked=P.mask("Ben qerim, 14 gül sokak no: 7");
ok("lowercase name and prose address are masked",!masked.text.includes("qerim")&&!masked.text.includes("gül sokak")&&/\[AD\d+\]/.test(masked.text));
finish();
