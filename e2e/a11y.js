"use strict";
/* Ortak erişilebilirlik denetimleri: axe, dokunma hedefi, yazı büyütme ve taşma. */
const AxeBuilder=require("@axe-core/playwright").default;
const axe=async page=>(await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations.map(v=>v.id+": "+v.nodes.slice(0,3).map(n=>n.target.join(" ")).join("; "));
const small=page=>page.evaluate(()=>{const o=[];for(const e of document.querySelectorAll("button,a[href],input:not([type=hidden]):not([type=file]),select,textarea,[role=button]")){
  const r=e.getBoundingClientRect();if(!r.width||getComputedStyle(e).visibility==="hidden"||e.closest("[hidden],[inert]"))continue;
  const b=e.matches("input[type=checkbox],input[type=radio]")?(e.closest("label,.chkrow")||e).getBoundingClientRect():r;
  if(b.height<43.5||b.width<43.5)o.push((e.getAttribute("aria-label")||e.textContent||e.id).trim().slice(0,25)+" "+Math.round(b.width)+"x"+Math.round(b.height))}return o});
const scaleText=(page,k)=>page.evaluate(k=>{const m=v=>v.replace(/([\d.]+)px/,(a,b)=>b*k+"px");
  const walk=rs=>{for(const r of rs){if(r.cssRules&&!r.style)walk(r.cssRules);else if(r.style&&/^[\d.]+px$/.test(r.style.fontSize))r.style.fontSize=m(r.style.fontSize)}};
  for(const s of document.styleSheets)walk(s.cssRules);
  const de=document.documentElement,cs=getComputedStyle(de),names=new Set();
  for(const s of document.styleSheets)for(const r of s.cssRules)if(r.style)for(const p of r.style)if(p.startsWith("--fs-"))names.add(p);
  for(const p of names)de.style.setProperty(p,m(cs.getPropertyValue(p).trim()))},k);
const overflow=page=>page.evaluate(()=>{const o=[];if(document.documentElement.scrollWidth>innerWidth)o.push("sayfa yatay kayıyor");
  for(const e of document.querySelectorAll("#sheet *,#view *,#lock *")){const c=getComputedStyle(e);if(c.display==="none"||e.closest("svg,.chiprow,[hidden]")||!e.getClientRects().length)continue;
    const r=e.getBoundingClientRect();if(r.width&&r.right>innerWidth+1)o.push("taşar: "+e.tagName+"."+e.className+" "+(e.textContent||"").trim().slice(0,20))}return [...new Set(o)]});
module.exports={axe,small,scaleText,overflow};
