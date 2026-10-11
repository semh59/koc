const {ok,finish}=require("./ok");
const T=require("../www/modules/insights/triallib.js");
const day=(s,n)=>T.addDay(s,n),S0="2026-10-01";
let seed=7;const rng=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};
{
  let good=true;for(let k=0;k<300;k++){const p=T.plan(rng);if(!/^[AB]{14}$/.test(p)||[...p].filter(c=>c==="A").length!==7||/AAA|BBB/.test(p))good=false}
  ok("plan: 300 random plans are 14 nights, 7 and 7, never three in a row",good);
  ok("plan: a broken random source still gives a valid plan (fixed fallback)",(p=>/^[AB]{14}$/.test(p)&&!/AAA|BBB/.test(p))(T.plan(()=>0.999999)));
  ok("plan: not always the same order",new Set(Array.from({length:20},()=>T.plan(rng))).size>5);
}
{
  const p="ABBAABABBABAAB",t={start:S0,plan:p,ans:{}};
  ok("clean: a valid trial survives, junk (bad plan, bad start, out-of-range or non-y/n answers) is dropped",JSON.stringify(T.clean({...t,ans:{[S0]:"y",[day(S0,3)]:"n",[day(S0,14)]:"y",[day(S0,2)]:"x",bad:"y"}}))===JSON.stringify({start:S0,plan:p,ans:{[S0]:"y",[day(S0,3)]:"n"}})&&T.clean(null)===null&&T.clean({...t,plan:"AAAAAAABBBBBBB"})===null&&T.clean({...t,plan:"AAAAAAAAAAAAAA"})===null&&T.clean({...t,start:"x"})===null);
  const s0=T.status(t,S0),s1=T.status(t,day(S0,1)),s13=T.status(t,day(S0,13)),s14=T.status(t,day(S0,14)),s15=T.status(t,day(S0,15));
  ok("status: the first day gives tonight's plan and no question; the next day asks about the night before",s0.tonight==="A"&&s0.ask===null&&s1.tonight==="B"&&s1.ask===S0&&T.status({...t,ans:{[S0]:"y"}},day(S0,1)).ask===null);
  ok("status: the last night has a plan; the morning after asks about it; the trial is done a day later",s13.tonight===p[13]&&s14.tonight===null&&s14.ask===day(S0,13)&&!s14.done&&s15.done&&s15.ask===null);
  ok("status: before the start day nothing is due",T.status(t,day(S0,-3)).tonight===null&&T.status(t,day(S0,-3)).ask===null);
}
{
  const p="ABBAABABBABAAB",ans={},sleep=[];
  for(let i=0;i<14;i++){const d=day(S0,i);ans[d]="y";sleep.push({day:day(d,1),min:p[i]==="B"?450:400})}
  const t={start:S0,plan:p,ans},r=T.summarize(t,sleep);
  ok("summary: averages of the sleep after answered nights, by group, with counts",r.a.n===7&&r.b.n===7&&r.a.avg===400&&r.b.avg===450,r);
  ok("summary: a 'no' night and a night without a sleep record are left out",(x=>x.a.n+x.b.n)(T.summarize({...t,ans:{...ans,[S0]:"n"}},sleep.slice(2)))===12);
  const few=T.summarize({...t,ans:Object.fromEntries(Object.entries(ans).slice(0,9))},sleep);
  ok("summary: under 10 answered nights gives no result",few===null);
  const lop=Object.fromEntries(Object.entries(ans).map(([d,v],i)=>[d,p[i]==="B"&&i>3?"n":v]));
  ok("summary: fewer than 4 nights in a group gives no result",T.summarize({...t,ans:lop},sleep)===null);
  ok("summary: no sleep records, or none at all, give no result",T.summarize(t,[])===null&&T.summarize(t,null)===null);
}
{
  const src=require("fs").readFileSync(__dirname+"/../www/modules/insights/trialui.js","utf8")+require("fs").readFileSync(__dirname+"/../www/modules/insights/triallib.js","utf8");
  ok("wording: no cause, cure or advice words in the trial texts",!/düzelt|tedavi|iyileş|etkiler|neden olur|sağlıklı|hastalık|ilaç/i.test(src));
}
finish();
