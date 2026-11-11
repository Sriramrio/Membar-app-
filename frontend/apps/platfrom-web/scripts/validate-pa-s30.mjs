import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
let pass=0;
const check=(name,ok)=>{if(!ok){console.error('FAIL',name);process.exitCode=1}else{console.log('PASS',name);pass++}};
check("Calendar page", read('src/features/calendars/CalendarsPage.tsx').includes('working days'));
check("Calendar contract", read('src/contracts/platform.ts').includes('interface BusinessCalendar'));
check("Calendar route", read('src/routes/routeManifest.ts').includes('PERMISSIONS.calendarRead'));
if(!process.exitCode)console.log('PA-S30: '+pass+' checks PASS');
