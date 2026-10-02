const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path");let bad=0;
const www=f=>path.join(__dirname,"../www",f);
/* D-Ant4, D-Ant7, D-Ant9: içe aktarma, set türü/süperset, kas haritası arayüzü. Ayrı süreçte.*/
const html=fs.readFileSync(www("index.html"),"utf8").replace(/<script src="([^"]+)"><\/script>/g,(_,f)=>"<script>"+fs.readFileSync(www(f),"utf8")+"</script>");
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const errs=[];
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://localhost/",
  beforeParse(w){Object.assign(w,{structuredClone,TextEncoder,TextDecoder,__noSelfTest:true});Object.defineProperty(w,"crypto",{value:require("node:crypto").webcrypto});w.confirm=()=>true;w.scrollTo=()=>{};w.addEventListener("error",e=>errs.push(e.message))}
});
setTimeout(async()=>{
  const w=dom.window,ev=s=>w.eval(s),$q=s=>w.document.querySelector(s);
  w.HTMLElement.prototype.scrollIntoView=function(){};

  const q=$q,click=s=>q(s).click(),sh=()=>q("#sheet").textContent;
  ev("S=structuredClone(DEF);S.settings.obDone=true;tab='ayar-veri';render()");
  ok("Veri ve yedek: içe aktarma düğmesi",!!q('[data-imp="open"]'));
  { // D-Ant4
    const F='Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE\n2024-03-15 18:30:00,A,1h 5m,Bench Press (Barbell),1,135,5,0,0,,,\n2024-03-15 18:30:00,A,1h 5m,Zarp Zurp,1,50,12,0,0,,,\n';
    ev("impText("+JSON.stringify("x")+")");
    ok("bozuk dosya: net hata, sayfa açılmaz",q("#tmsg").textContent.includes("Biçim")||q("#tmsg").textContent.includes("başlık"),q("#tmsg").textContent);
    ev("impText("+JSON.stringify(F)+",'strong.csv')");
    ok("önizleme: antrenman, set, tarih, eşleşen/yeni, birim sorusu, spor kaydı notu",sh().includes("Strong dosyası: strong.csv")&&sh().includes("1 kütüphanede eşleşti, 1 yeni")&&sh().includes("Ağırlık birimi")&&sh().includes("kalori kaydı oluşturulmaz")&&sh().includes("15 Mar 2024"),sh());
    click('[data-imp="unit:lbs"]');
    click('[data-imp="go"]');
    ok("onay: antrenman, kendi egzersizi, lbs->kg eklendi; spor kaydı yok",ev("S.workouts.length")===1&&ev("S.customEx.length")===1&&Math.abs(ev("S.workouts[0].ex[0].sets[0].kg")-61.23)<1e-9&&ev("S.entries.length")===0&&ev("S.gid")===3);
    ok("cleanGym turu: içe aktarılan antrenman aynen yaşar (set sayısı dahil)",JSON.stringify(ev("cleanGym(JSON.parse(JSON.stringify(S))).workouts"))===JSON.stringify(ev("S.workouts"))&&ev("cleanGym(JSON.parse(JSON.stringify(S))).customEx.length")===1);
    ok("içe aktarılan antrenman geçmişte görünür ve önceki seans olur",ev("gHistory('bench').length")===1);
    ev("impText("+JSON.stringify(F)+")");click('[data-imp="go"]');
    ok("aynı dosya tekrar: atlanır, düğme pasif",ev("S.workouts.length")===1&&sh().includes("zaten kayıtlı")&&q('[data-imp="go"]').disabled);
    ev("closeSheet()");
    ev("S.workouts=[];S.customEx=[];S.gid=1");
    ev("impText("+JSON.stringify(F)+")");click('[data-imp="go"]');
    q("#tundo").click();
    ok("geri al çalışır",ev("S.workouts.length")===0&&ev("S.customEx.length")===0);
    ev("storeBytes=STORE_WARN-100;impText("+JSON.stringify(F)+")");
    ok("depolama sınırı: uyarı ve kısmi içe aktarım önerisi / sığmıyorsa onay yok",sh().includes("Depolama uyarısı")&&!q('[data-imp="go"]'),sh());
    ev("closeSheet();storeBytes=0");
  }
  ok("sayfa hatasız çalıştı",errs.length===0,errs);
  console.log(bad?bad+" test başarısız":"TAMAM");process.exit(bad?1:0);
},100);
