const {ok,finish}=require("./ok");
const R=require("../www/modules/habits/ramadanlib.js"),fx=require("./fixtures/ramadan.json"),tr=require("./fixtures/ramadan-tr.json");
const ank=fx.cities.Ankara,days=Object.keys(ank.days).sort();
const D0=days[0],[im0,ft0]=ank.days[D0],[im1]=ank.days[days[1]];
const m=t=>+t.slice(0,2)*60+ +t.slice(3,5);
/* Turkish local time h:mm on a day -> ms. */
const at=(day,t)=>Date.parse(day+"T00:00:00Z")+m(t)*6e4-3*36e5;
const get=d=>ank.days[d]||null;

ok("parse: the real service rows give day -> [imsak, iftar] and match the saved table",(p=>days.slice(0,3).every(d=>p[d]&&p[d][0]===ank.days[d][0]&&p[d][1]===ank.days[d][1]))(R.parse(ank.raw)));
ok("parse: bad dates, bad times, imsak after iftar and garbage rows are dropped",Object.keys(R.parse([{MiladiTarihUzunIso8601:"2026-10-06T00:00:00",Imsak:"05:30",Aksam:"18:00"},{MiladiTarihUzunIso8601:"x",Imsak:"05:30",Aksam:"18:00"},{MiladiTarihUzunIso8601:"2026-10-07T00:00:00",Imsak:"25:30",Aksam:"18:00"},{MiladiTarihUzunIso8601:"2026-10-08T00:00:00",Imsak:"19:00",Aksam:"18:00"},null,5])).join()==="2026-10-06"&&Object.keys(R.parse("x")).length===0);
{
  const n1=R.now(get,at(D0,im0)-90*6e4),n2=R.now(get,at(D0,im0)+30*6e4),n3=R.now(get,at(D0,ft0)-130*6e4);
  ok("countdown before imsak: sahur with the minutes left",n1.kind==="sahur"&&n1.left===90&&n1.text==="Sahura 1 sa 30 dk",n1);
  ok("countdown in the daytime: iftar",n2.kind==="iftar"&&n2.left===m(ft0)-m(im0)-30&&/^İftara /.test(n2.text)&&n3.text==="İftara 2 sa 10 dk",[n2,n3]);
  const n4=R.now(get,at(D0,ft0)+60*6e4),want=1440-(m(ft0)+60)+m(im1);
  ok("after iftar the countdown runs to the next day's imsak across midnight",n4.kind==="sahur"&&n4.left===want,[n4,want]);
  ok("the exact iftar minute counts as night, the exact imsak minute as day",R.now(get,at(D0,ft0)).kind==="sahur"&&R.now(get,at(D0,im0)).kind==="iftar");
  ok("the card carries imsak and iftar of the day, 'long' stays off in autumn",n2.imsak===im0&&n2.iftar===ft0&&n2.long===false);
}
ok("the day follows Turkish time, not the phone's: 23:30 UTC on the 6th is already the 7th at 02:30",R.tr(Date.UTC(2026,9,6,23,30)).day==="2026-10-07"&&R.tr(Date.UTC(2026,9,6,23,30)).min===150);
ok("no times for today gives null; the last day without a next day says tomorrow is missing",R.now(get,at("2027-01-01","12:00"))===null&&/Yarının/.test(R.now(get,at(days[days.length-1],ank.days[days[days.length-1]][1])+6e4).text));
ok("a daytime over 16 hours is flagged long (summer)",R.now(()=>["03:00","20:30"],at(D0,"10:00")).long===true);
{
  const rem=R.reminders(get,{sahur:true,iftar:true},at(D0,"00:10"),6e4,days.length);
  ok("reminders: sahur 45 min before imsak, iftar 5 min before, unique ids, two per day",rem[0].at===at(D0,im0)-45*6e4&&rem[1].at===at(D0,ft0)-5*6e4&&rem.length===2*days.length&&new Set(rem.map(r=>r.id)).size===rem.length);
  ok("reminders: past ones and switched-off kinds are left out",R.reminders(get,{sahur:true,iftar:false},at(D0,"12:00"),6e4,30).every(r=>/Sahur/.test(r.title)&&r.at>at(D0,"12:00"))&&R.reminders(get,{},at(D0,"00:10"),6e4,30).length===0);
  ok("reminders: only the requested number of days",R.reminders(get,{sahur:true,iftar:true},at(D0,"00:10"),6e4,2).length===4);
  ok("reminder wording says approximate, no ruling words",rem.every(r=>/yaklaşık/.test(r.body))&&!/vakti girdi|oruç aç|oruç tut/i.test(JSON.stringify(rem)));
}
{ // the calculation against the Diyanet table: October 2026 only (other seasons are covered at run time by the comparison)
  let worst=0,exact=0,n=0;
  R.CITIES.forEach(([name,lat,lon,id])=>{
    const c=tr.cities[id];
    if(!c)return ok("fixture has "+name,false);
    for(const [d,v] of Object.entries(c.days)){
      const t=R.times(d,lat,lon);
      const e=Math.max(Math.abs(m(t[0])-m(v[0])),Math.abs(m(t[1])-m(v[1])));
      worst=Math.max(worst,e);if(e===0)exact++;n++;
    }
  });
  ok("calculation vs Diyanet: 81 provinces x every day of October 2026 within 1 minute",R.CITIES.length===81&&n>=81*30&&worst<=1,{worst,n});
  ok("calculation vs Diyanet: most minutes are exact",exact/n>0.85,exact/n);
}
{
  const v=R.verify(R.CITIES.findIndex(c=>c[0]==="Ankara"),Object.fromEntries(Object.entries(tr.cities[9206].days)),1000);
  ok("verify: Ankara's own table agrees within the tolerance",v&&v.max<=R.TOL&&v.n>=30&&v.il>=0,v&&v.max);
  const bad=R.verify(0,Object.fromEntries(Object.entries(tr.cities[9206].days)),1);
  ok("verify: another province's table is a real difference, too few days give null",bad&&bad.max>R.TOL&&R.verify(0,{"2026-10-06":["05:00","18:00"]},1)===null&&R.verify(999,{},1)===null);
}
{
  const ai=R.CITIES.findIndex(c=>c[0]==="Ankara"),ii=R.CITIES.findIndex(c=>c[0]==="İstanbul");
  ok("nearest: a point in Çankaya is Ankara, one in Kadıköy is İstanbul, the list is the 81 centres",R.nearest(39.9,32.85).i===ai&&R.nearest(40.99,29.03).i===ii&&R.CITIES.length===81);
  ok("times: outside Turkey, garbage and bad days give null",R.times("2026-10-06",48.8,2.3)===null&&R.times("2026-10-06",NaN,32)===null&&R.times("bad",39.9,32.8)===null&&R.inTurkey(39.9,32.8)&&!R.inTurkey(0,0));
  ok("times: a place east of Ankara has an earlier iftar than one in the west",R.times("2026-10-06",39.9,40)[1]<R.times("2026-10-06",39.9,27)[1]);
  const here={lat:39.93,lon:32.86},t=at(D0,"06:00"),good=R.verify(ai,ank.days,t),far=R.verify(ai,{...ank.days},t);
  const fresh=R.source(here,good,t+864e5);
  ok("source: a recent agreeing comparison is 'verified' and the times are calculated",fresh.mode==="verified"&&fresh.get(D0).length===2&&fresh.max===good.max);
  ok("source: no comparison, or one older than 45 days, or one for another province is 'calc'",R.source(here,null,t).mode==="calc"&&R.source(here,good,t+46*864e5).mode==="calc"&&R.source({lat:41,lon:29},good,t).mode==="calc");
  const off=Object.fromEntries(Object.entries(ank.days).map(([d,v])=>[d,[v[0],"23:00"]])),bad=R.verify(ai,off,t),tab=R.source(here,bad,t);
  ok("source: a comparison that disagrees falls back to the table's own days, nothing for other days",tab.mode==="table"&&tab.get(D0)[1]==="23:00"&&tab.get("2027-03-01")===null&&far.max<=R.TOL);
}
{
  const ai=0,c=R.verify(ai,ank.days,5),back=R.clean(JSON.parse(JSON.stringify(c)));
  ok("clean: a valid record survives, garbage becomes null",JSON.stringify(back)===JSON.stringify(c)&&R.clean(null)===null&&R.clean({il:"x",days:{}})===null&&R.clean({il:999,max:0,days:{}})===null&&Object.keys(R.clean({il:1,max:0,days:{bad:["05:00","18:00"],"2026-10-06":["05:00","18:00"]}}).days).join()==="2026-10-06");
}
finish();
