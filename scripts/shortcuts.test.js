/* Widget food/weight buttons and launcher long-press shortcuts: they only open entry sheets. */
const {ok,finish}=require("./ok");
const {boot}=require("./html");
const fs=require("fs"),path=require("path");
const rd=f=>fs.readFileSync(path.join(__dirname,"..",f),"utf8");
(async()=>{
  const sc=rd("assets/android/res/xml/nw_shortcuts.xml"),str=rd("assets/android/res/values/nw_strings.xml");
  const ids=[...sc.matchAll(/android:value="(\w+)"/g)].map(m=>m[1]);
  ok("four launcher shortcuts: water, food, weight, exercise",ids.join()==="water,food,weight,exercise",ids);
  ok("every shortcut label has a string resource",ids.every(k=>str.includes(`name="nw_sc_${k}"`)&&str.includes(`name="nw_sc_${k}_long"`)&&sc.includes(`@string/nw_sc_${k}_long`)));
  ok("shortcuts target the app's own activity",sc.split("com.neowell.app.MainActivity").length===5);
  ok("the manifest patch registers the shortcut file once, inside MainActivity",/android\.app\.shortcuts[\s\S]*@xml\/nw_shortcuts/.test(rd("scripts/patch-android.js"))&&rd("scripts/patch-android.js").includes('!manifest.includes("android.app.shortcuts")'));
  const lay=rd("assets/android/res/layout/nw_widget.xml"),nw=rd("assets/android/NeoWidget.java"),wp=rd("assets/android/WidgetPlugin.java");
  ok("the widget layout has Yemek and Kilo buttons next to +water",lay.includes('@+id/nw_food')&&lay.includes('@+id/nw_weight')&&lay.includes('@+id/nw_add'));
  ok("the widget buttons are activity intents with their own request codes and write nothing",/getActivity\(c, 7203, go\(c, "food"\)/.test(nw)&&/getActivity\(c, 7204, go\(c, "weight"\)/.test(nw)&&!/QuickLogPlugin\.ACTION_KEY[^;]*"food"/.test(nw));
  ok("the plugin forwards the go extra with the open event and clears it",/getStringExtra\(NeoWidget\.GO\)/.test(wp)&&/removeExtra\(NeoWidget\.GO\)/.test(wp)&&/o\.put\("go", go\)/.test(wp));
  const w=await boot(),ev=s=>w.eval(s),q=s=>w.document.querySelector(s);
  ev("S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.entries=[];tab='settings';render()");
  const sheet=()=>q("#sheet h3")?.textContent;
  ev("widgetOpen({go:'food'})");
  ok("go=food opens the food sheet on Today",ev("tab")==="today"&&sheet()==="Yemek ekle",sheet());
  ev("widgetOpen({go:'weight'})");ok("go=weight opens the weight sheet",sheet()==="Kilo ekle",sheet());
  ev("widgetOpen({go:'exercise'})");ok("go=exercise opens the exercise sheet",!!sheet()&&/antrenman|spor|egzersiz/i.test(sheet()),sheet());
  ev("widgetOpen({go:'water'})");ok("go=water opens the drink sheet, no record is written",sheet()==="İçecek ekle"&&ev("S.entries.length")===0,sheet());
  ev("closeSheet()");
  ev("widgetOpen({go:'__proto__'})");ev("widgetOpen({go:'constructor'})");ev("widgetOpen({})");ev("widgetOpen()");
  ok("an unknown or missing go only goes to Today",!q("#sheet.on")&&ev("tab")==="today"&&ev("S.entries.length")===0);
  finish();
})();
