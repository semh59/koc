// D-Ant15: rehberli mod akış motoru (saf mantık).
const G=require("../www/guidelib.js"),EXDB=require("../www/exlib.js"),fs=require("fs"),path=require("path");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const load=(f,name)=>{const m=new module.constructor();m._compile(fs.readFileSync(path.join(__dirname,"../www",f),"utf8")+`;module.exports=${name}`,f);return m.exports};
const FigTpl=load("figtpl.js","FigTpl"),EXCUE=load("excues.js","EXCUE");
const T0=1e6,P=G.PREP*1000;

{ // evreler ve zaman
  const st=G.start([{ex:"plank",sec:30,rest:10,n:2},{ex:"pushup",reps:10,rest:0,n:1}],T0);
  ok("evreler: hazırlık, çalışma/dinlenme turları, son dinlenme yok, tekrarlıda kılavuz süre",JSON.stringify(st.ph.map(p=>p.k+(p.sec)))==='["r5","w30","r10","w30","r10","w30"]'&&st.ph[5].reps===10&&st.ph[5].sec===10*G.TEMPO);
  ok("toplam süre ve kalan adım",G.total(st.ph)===5+30+10+30+10+30&&G.stepsLeft(st)===3&&G.works(st)===3);
  ok("kalan süre başta toplam",G.remain(st,T0)===115);
  G.tick(st,T0+P+12000);
  ok("tick: hazırlık biter, çalışmada 18 sn kalır",st.i===1&&G.left(st,T0+P+12000)===18000);
  // arka plan: uzun aradan sonra birden çok evre, bitişler öncekine eklenir
  G.tick(st,T0+P+30000+10000+30000+10000+4000);
  ok("arka planda kaymaz: üç evre birden geçilir, bitiş = önceki bitiş + süre",st.i===5&&st.at===T0+P+80000&&st.end===null&&st.done[1]===30&&st.done[3]===30);
  ok("tekrarlı evre zamanla geçmez, Bitti bekler",(G.tick(st,T0+9e6),st.i===5));
  G.finish(st,T0+P+80000+25000);
  ok("Bitti: geçen süre kaydedilir, akış biter",G.over(st)&&st.done[5]===25&&G.remain(st,T0)===0&&G.stepsLeft(st)===0);
  ok("sonuç: egzersize göre setler (süre ve tekrar)",JSON.stringify(G.result(st))==='[{"ex":"plank","sets":[{"sec":30},{"sec":30}]},{"ex":"pushup","sets":[{"sec":25,"reps":10}]}]');
}
{ // duraklat, devam, geç, geri
  const st=G.start([{ex:"a",sec:20,rest:10,n:3}],T0);G.tick(st,T0+P+5000);
  G.pause(st,T0+P+5000);
  ok("duraklat: zaman donar",G.left(st,T0+P+60000)===15000&&!G.tick(st,T0+P+60000)&&st.i===1);
  G.resume(st,T0+P+65000);
  ok("devam: bitiş duraklama kadar ileri kayar",st.end===T0+P+20000+60000&&G.left(st,T0+P+65000)===15000);
  ok("duraklıyken Geç ve Bitti çalışmaz",(G.pause(st,T0+P+70000),!G.skip(st,T0+P+70000)&&!G.finish(st,T0+P+70000)));
  G.resume(st,T0+P+70000);
  G.skip(st,T0+P+70000);
  ok("geç: sayılmaz, dinlenme tam süreyle başlar",st.i===2&&st.done[1]==null&&st.end===T0+P+80000);
  G.skip(st,T0+P+71000);G.tick(st,T0+P+71000+20000);
  ok("ikinci tur tamamlanır",st.done[3]===20&&st.i===4);
  G.back(st,T0+P+100000);
  ok("geri: önceki çalışmaya döner, onun kaydı silinir, süre baştan",st.i===3&&st.done[3]==null&&st.end===T0+P+120000);
  G.back(st,T0+P+100000);G.back(st,T0+P+100000);
  ok("geri en başta ilk evrede kalır",st.i===0&&Object.keys(st.done).length===0);
}
{ // hazır kalıplar
  const ids=["a","b","c","d"];
  const tb=G.phases(G.tabata(ids)),hi=G.phases(G.hiit(ids)),es=G.phases(G.stretch(["x","y"]));
  ok("Tabata: 8 × 20/10, egzersizler sırayla döner",tb.filter(p=>p.k==="w").length===8&&tb.filter(p=>p.k==="w").every(p=>p.sec===20)&&tb.filter(p=>p.k==="r").slice(1).every(p=>p.sec===10)&&tb[1].ex==="a"&&tb[9].ex==="a"&&tb[3].ex==="b");
  ok("HIIT: 40/20",hi.filter(p=>p.k==="w").every(p=>p.sec===40)&&hi.filter(p=>p.k==="r").slice(1).every(p=>p.sec===20));
  ok("esneme: hareket başına 30 sn",es.filter(p=>p.k==="w").every(p=>p.sec===30));
  const t={ex:["squat","plank","bench"],tg:{squat:{sets:4,reps:6},plank:{sets:2,sec:45}}};
  ok("şablondan: süreli/tekrarlı, set sayısı ve set arası dinlenme",JSON.stringify(G.fromTpl(t,id=>id==="plank",id=>id==="squat"?150:30))==='[{"ex":"squat","reps":6,"rest":150,"n":4},{"ex":"plank","sec":45,"rest":30,"n":2},{"ex":"bench","reps":10,"rest":30,"n":3}]');
}
{ // hazır akışlar
  const F=G.FLOWS,by=id=>F.find(f=>f.id===id),ex=id=>EXDB.find(e=>e.id===id);
  ok("en az 3 akış: 5 dk ısınma, 10 dk esneme, 4 dk Tabata",F.length>=3&&by("isinma5")&&by("esneme10")&&by("tabata4"));
  const all=F.flatMap(f=>f.steps.map(s=>s.ex)),miss=all.filter(id=>!ex(id));
  ok("akış egzersizleri kütüphanede var (EXMERGED, uygulamada da denetlenir)",!miss.length,miss);
  ok("akış egzersizleri süreli ya da aralıklı tür (kayıtta tekrar boş kalmaz)",all.every(id=>"ti".includes(ex(id).k)),all.filter(id=>!"ti".includes(ex(id).k)));
  ok("akış egzersizlerinin figürü ve form ipucu var",all.every(id=>FigTpl[ex(id).tp]&&FigTpl[ex(id).tp].frames&&EXCUE[ex(id).tp]&&EXCUE[ex(id).tp].length));
  const min=id=>G.total(G.phases(by(id).steps))/60;
  ok("süreler: ısınma ~5, esneme ~10, Tabata ~4 dk",Math.abs(min("isinma5")-5)<=0.75&&Math.abs(min("esneme10")-10)<=0.75&&Math.abs(min("tabata4")-4)<=0.5,[min("isinma5"),min("esneme10"),min("tabata4")]);
  ok("ısınma ve esneme warm işaretli, Tabata değil",by("isinma5").warm&&by("esneme10").warm&&!by("tabata4").warm);
}
{ // sesli komut metinleri
  const nm=id=>({plank:"Plank",pushup:"Şınav"})[id];
  const st=G.start([{ex:"plank",sec:30,rest:10,n:1},{ex:"pushup",reps:12,rest:0,n:1}],T0);
  ok("hazırlık (5 sn, kısa): yalnız sıradaki egzersiz, geri sayıma yetişir",G.cue(st,nm)==="Sıradaki: Plank");
  G.tick(st,T0+P);
  ok("geri sayım söylendiyse çalışmada tekrar söylenmez, söylenmediyse ad ve başla",G.cue(st,nm,true)===""&&G.cue(st,nm,false)==="Plank, 30 saniye. Başla");
  G.tick(st,T0+P+30000);
  ok("dinlenme: dinlen ve sıradaki (tekrarlı)",G.cue(st,nm)==="Dinlen. Sıradaki: Şınav, 12 tekrar");
  ok("geri sayım metni ve bitiş",G.SAY.go==="3, 2, 1, başla"&&(G.tick(st,T0+P+40000),G.finish(st,T0+P+70000),G.cue(st,nm)===G.SAY.end));
  ok("metinler kısa (sesli komut)",[G.SAY.go,G.SAY.rest,G.SAY.end,G.SAY.pause].every(s=>s.length<=20));
  const s5=G.start([{ex:"plank",sec:30,rest:5,n:1},{ex:"pushup",reps:12,rest:0,n:1}],T0);G.tick(s5,T0+P+30000);
  ok("5 sn dinlenme: 'Dinlen' ve süre söylenmez, yalnız sıradaki",s5.ph[s5.i].k==="r"&&G.cue(s5,nm)==="Sıradaki: Şınav");
}
process.exit(bad?1:0);
