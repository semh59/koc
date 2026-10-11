const {ok,finish}=require("./ok");
const R=require("../www/modules/habits/ramadanlib.js"),fx=require("./fixtures/ramadan.json");
const ank=fx.cities.Ankara,days=Object.keys(ank.days).sort();
const D0=days[0],[im0,ft0]=ank.days[D0],[im1]=ank.days[days[1]];
const m=t=>+t.slice(0,2)*60+ +t.slice(3,5);
/* Turkish local time h:mm on a day -> ms. */
const at=(day,t)=>Date.parse(day+"T00:00:00Z")+m(t)*6e4-3*36e5;
const cache=R.merge(null,ank.id,ank.days,at(D0,"06:00"));

ok("parse: the real service rows give day -> [imsak, iftar] and match the saved table",(p=>days.slice(0,3).every(d=>p[d]&&p[d][0]===ank.days[d][0]&&p[d][1]===ank.days[d][1]))(R.parse(ank.raw)));
ok("parse: bad dates, bad times, imsak after iftar and garbage rows are dropped",Object.keys(R.parse([{MiladiTarihUzunIso8601:"2026-10-06T00:00:00",Imsak:"05:30",Aksam:"18:00"},{MiladiTarihUzunIso8601:"x",Imsak:"05:30",Aksam:"18:00"},{MiladiTarihUzunIso8601:"2026-10-07T00:00:00",Imsak:"25:30",Aksam:"18:00"},{MiladiTarihUzunIso8601:"2026-10-08T00:00:00",Imsak:"19:00",Aksam:"18:00"},null,"x"])).join()==="2026-10-06"&&Object.keys(R.parse(null)).length===0);
{
  const n1=R.now(cache,at(D0,im0)-90*6e4),n2=R.now(cache,at(D0,im0)+30*6e4),n3=R.now(cache,at(D0,ft0)-130*6e4);
  ok("countdown before imsak: sahur with the minutes left",n1.kind==="sahur"&&n1.left===90&&n1.text==="Sahura 1 sa 30 dk",n1);
  ok("countdown in the daytime: iftar",n2.kind==="iftar"&&n2.left===m(ft0)-m(im0)-30&&/^İftara /.test(n2.text)&&n3.text==="İftara 2 sa 10 dk",[n2,n3]);
  const n4=R.now(cache,at(D0,ft0)+60*6e4),want=1440-(m(ft0)+60)+m(im1);
  ok("after iftar the countdown runs to the next day's imsak across midnight",n4.kind==="sahur"&&n4.left===want,[n4,want]);
  ok("the exact iftar minute counts as night, the exact imsak minute as day",R.now(cache,at(D0,ft0)).kind==="sahur"&&R.now(cache,at(D0,im0)).kind==="iftar");
  ok("the card carries imsak and iftar of the day, 'long' stays off in autumn",n2.imsak===im0&&n2.iftar===ft0&&n2.long===false);
}
ok("the day follows Turkish time, not the phone's: 23:30 UTC on the 6th is already the 7th at 02:30",R.tr(Date.UTC(2026,9,6,23,30)).day==="2026-10-07"&&R.tr(Date.UTC(2026,9,6,23,30)).min===150);
ok("no table for today gives null; the last day without a next day says tomorrow is missing",R.now(cache,at("2027-01-01","12:00"))===null&&R.now(null,1)===null&&/Yarının/.test(R.now(cache,at(days[days.length-1],ank.days[days[days.length-1]][1])+6e4).text));
ok("a daytime over 16 hours is flagged long (summer)",R.now(R.merge(null,1,{[D0]:["03:00","20:30"]},at(D0,"01:00")),at(D0,"10:00")).long===true);
ok("coverage: days from today on that the table has",R.ahead(cache,at(D0,"10:00"))===days.length&&R.ahead(cache,at(days[days.length-1],"10:00"))===1&&R.ahead(null,1)===0&&R.ahead(cache,at("2030-01-01","10:00"))===0);
{
  const rem=R.reminders(cache,{sahur:true,iftar:true},at(D0,"00:10"),6e4,days.length);
  ok("reminders: sahur 45 min before imsak, iftar 5 min before, unique ids, two per day",rem[0].at===at(D0,im0)-45*6e4&&rem[1].at===at(D0,ft0)-5*6e4&&rem.length===2*days.length&&new Set(rem.map(r=>r.id)).size===rem.length);
  ok("reminders: past ones and switched-off kinds are left out",R.reminders(cache,{sahur:true,iftar:false},at(D0,"12:00"),6e4,30).every(r=>/Sahur/.test(r.title)&&r.at>at(D0,"12:00"))&&R.reminders(cache,{},at(D0,"00:10"),6e4,30).length===0);
  ok("reminders: only the requested number of days",R.reminders(cache,{sahur:true,iftar:true},at(D0,"00:10"),6e4,2).length===4);
  ok("reminder wording says approximate, no ruling words",rem.every(r=>/yaklaşık/.test(r.body))&&!/vakti girdi|oruç aç|oruç tut/i.test(JSON.stringify(rem)));
}
{
  const old=R.merge(cache,ank.id,{"2026-01-01":["06:00","17:00"]},at(D0,"06:00")),other=R.merge(cache,999,{[D0]:["04:00","19:00"]},at(D0,"06:00"));
  ok("merge: the same place keeps its days and drops far past ones; another place replaces the table",!old.days["2026-01-01"]&&Object.keys(old.days).length===days.length&&other.id===999&&Object.keys(other.days).join()===D0);
  ok("clean: a valid cache survives, garbage becomes null",JSON.stringify(R.clean(cache))===JSON.stringify(cache)&&R.clean(null)===null&&R.clean({id:"x",days:{}})===null&&Object.keys(R.clean({id:1,days:{bad:["05:00","18:00"],"2026-10-06":["99:00","18:00"]}}).days).length===0);
}
finish();
