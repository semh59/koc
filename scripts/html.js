/* Testler için index.html: <script src> ve ana betik parçaları (data-src) gömülür. */
const fs=require("fs"),path=require("path");
const www=f=>path.join(__dirname,"../www",f);
const read=f=>fs.readFileSync(www(f),"utf8");
const inline=h=>h.replace(/<link rel="stylesheet" href="([^"]+)">/g,(_,f)=>"<style>"+read(f)+"</style>").replace(/<script src="([^"]+)"><\/script>/g,(_,f)=>"<script>"+read(f)+"</script>")
  .replace(/<script type="text\/x-main" data-src="([^"]+)"><\/script>/g,(_,f)=>'<script type="text/x-main" data-src="'+f+'">'+read(f)+"</script>");
module.exports={www,read,inline,build:()=>inline(read("index.html"))};
module.exports.full=()=>read("index.html")+read("app.css")+fs.readdirSync(www("main")).sort().map(f=>read("main/"+f)).join("");
/* www altındaki tüm uygulama betikleri (www'ye göre yol); vendor ve ex hariç. */
module.exports.listJs=(dir="")=>fs.readdirSync(www(dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?(["vendor","ex"].includes(e.name)?[]:module.exports.listJs(dir?dir+"/"+e.name:e.name)):e.name.endsWith(".js")?[dir?dir+"/"+e.name:e.name]:[]);
