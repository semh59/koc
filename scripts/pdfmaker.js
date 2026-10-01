/* Testler için elle yazılmış, metin içeren küçük PDF üretir (Helvetica, WinAnsi). */
function textPdf(lines){
  const esc=s=>s.replace(/[\\()]/g,"\\$&").replace(/ö/g,"\\366").replace(/Ö/g,"\\326").replace(/ü/g,"\\374").replace(/ç/g,"\\347");
  let y=780,ops="BT /F1 10 Tf\n";
  for(const l of lines){
    for(const [txt,x] of l)ops+=`1 0 0 1 ${x} ${y} Tm (${esc(txt)}) Tj\n`;
    y-=16;
  }
  ops+="ET";
  const objs=["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>","<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",`<< /Length ${ops.length} >>\nstream\n${ops}\nendstream`,"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"];
  let out="%PDF-1.4\n";const off=[];
  objs.forEach((o,i)=>{off.push(out.length);out+=`${i+1} 0 obj\n${o}\nendobj\n`});
  const xr=out.length;out+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`+off.map(o=>String(o).padStart(10,"0")+" 00000 n \n").join("")+`trailer\n<< /Size ${objs.length+1} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`;
  return new Uint8Array(Buffer.from(out,"latin1"));
}
module.exports={textPdf};
