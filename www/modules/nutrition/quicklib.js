"use strict";
/* Quick text entry: "2 dilim ekmek, yarım simit, 200 g tavuk" -> rows to preview (pure, no DOM, no S). A measure is matched only against the food's own portion labels;
   when it does not fit, the row says so and falls back to the food's first portion. Nothing is saved from here. */
const QuickLib=(()=>{
  const search=typeof foodSearch!=="undefined"?foodSearch:require("./foods.js").foodSearch;
  const fold=typeof foldTr!=="undefined"?foldTr:require("../../kernel/common.js").foldTr;
  const MAX_LINES=15,MAX_Q=20;
  const WORDS={yarim:0.5,ceyrek:0.25,bir:1,iki:2,uc:3,dort:4,bes:5,alti:6,yedi:7,sekiz:8,dokuz:9,on:10};
  /* Longest first so "yemek kaşığı" wins over "kaşık". */
  const UNITS=["yemek kasigi","tatli kasigi","cay bardagi","su bardagi","porsiyon","dilim","adet","tabak","kase","avuc","bardak","fincan","durum","kepce","kutu","somun","demet","kare","top"];
  const tok=s=>fold(s).replace(/[^\p{L}\p{N}.,/½¼ ]+/gu," ").replace(/\s+/g," ").trim();
  const numOf=t=>{
    if(/^\d+[.,]?\d*$/.test(t))return Number(t.replace(",","."));
    if(t==="½")return 0.5;if(t==="¼")return 0.25;
    const m=/^(\d+)\/(\d+)$/.exec(t);if(m&&+m[2])return +m[1]/+m[2];
    return t in WORDS?WORDS[t]:null;
  };
  /* "bir buçuk" / "1 buçuk" = 1.5; "yarım" = 0.5. Returns [quantity|null, rest]. */
  function lead(s){
    const p=s.split(" "),a=numOf(p[0]);
    if(a==null)return [null,s];
    if(p[1]==="bucuk")return [a+0.5,p.slice(2).join(" ")];
    return [a,p.slice(1).join(" ")];
  }
  const labelWords=l=>" "+tok(l).replace(/^[\d.,/½¼]+ /,"").replace(/ \(.*$/,"")+" ";
  /* A piece -> {q, name, unit|null, grams|null}. */
  function piece(s){
    let [q,rest]=lead(tok(s));
    let g=null,unit=null;
    const gm=/^(g|gr|gram|kg)( |$)/.exec(rest);
    if(gm&&q!=null){if(gm[1]!=="kg"&&/^\d{1,3}\.\d{3}$/.test(tok(s).split(" ")[0]))q*=1000; // "1.500 g" is 1500 g in Turkish
      g=gm[1]==="kg"?q*1000:q;rest=rest.slice(gm[0].length)}
    else for(const u of UNITS)if(rest===u||rest.startsWith(u+" ")){unit=u;rest=rest.slice(u.length).trim();break}
    return {q:g!=null?1:q,name:rest,unit,grams:g};
  }
  /* The segments of a line: the whole line first when it is a food name on its own, else split on commas, semicolons and " ve ". */
  function segments(line,list){
    const whole=tok(line);if(!whole)return [];
    if(!/^[\d½¼]/.test(whole)&&!(whole.split(" ")[0] in WORDS)){const h=search(line,1,list)[0];if(h!=null&&tok(list[h].n)===whole)return [line]}
    return line.split(/(?<!\d),|,(?!\d)|;|\s+ve\s+/i).map(x=>x.trim()).filter(Boolean);
  }
  function row(seg,list){
    const p=piece(seg);
    if(!p.name)return {text:seg,miss:true};
    const hits=search(p.name,4,list);
    if(!hits.length)return {text:seg,miss:true};
    return pick(seg,p,hits,0,list);
  }
  /* Chooses food hits[k] and a portion for the piece. flag: "unit" when the written measure fits none of the food's labels. */
  function pick(text,p,hits,k,list){
    const f=list[hits[k]];let por=0,q=p.q==null?1:p.q,flag=null;
    if(p.grams!=null){por=-1}
    else if(p.unit){
      const i=f.u.findIndex(u=>labelWords(u[0]).includes(" "+p.unit+" "));
      if(i>=0)por=i;else{flag="unit";q=1}
    }
    if(!(q>0)||q>MAX_Q){q=1;flag=flag||"qty"}
    return {text,hits,k,f:hits[k],por,q,grams:p.grams,flag,p};
  }
  /* The calories and nutrients of a row: grams = portion grams x quantity, or the written grams. */
  function calc(f,r,nutr){
    const g=r.grams!=null?r.grams:f.u[r.por][1]*r.q,s=x=>x==null?null:x*g/100;
    const o={g,k:s(f.k),lo:s(f.lo),hi:s(f.hi)};
    for(const k of nutr)o[k]=s(f[k]);
    return o;
  }
  /* The label written into the entry: "Beyaz ekmek, 2 × 1 dilim (30 g)" (like a food added by hand), or "200 g". */
  function label(f,r){
    if(r.grams!=null)return `${f.n}, ${String(Math.round(r.grams*10)/10).replace(".",",")} g`;
    return `${f.n}, ${r.q===1?"":String(r.q%1?Math.round(r.q*10)/10:r.q).replace(".",",")+" × "}${f.u[r.por][0]}`;
  }
  function parse(text,list){
    const lines=String(text||"").split("\n").map(x=>x.trim()).filter(Boolean).slice(0,MAX_LINES);
    const rows=[];
    for(const l of lines)for(const s of segments(l,list))if(rows.length<MAX_LINES)rows.push(row(s,list));
    return rows;
  }
  return {parse,pick,calc,label,piece,MAX_LINES,MAX_Q};
})();
if(typeof module!=="undefined")module.exports=QuickLib;
