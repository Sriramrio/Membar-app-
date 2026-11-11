import fs from 'node:fs';let p=0,f=0;const c=(x,m)=>{console.log(`${x?'PASS':'FAIL'}: ${m}`);x?p++:f++};const m=fs.readFileSync('V6_LIVE_CERTIFICATION_MATRIX.md','utf8');
for(const w of ['320','360','390','430','768','1024','1280','1440','1920'])c(m.includes(w),`Responsive matrix includes ${w}px`);
for(const s of ['Accessibility','PWA/offline','Performance','Load/concurrency','Security','Acceptance'])c(m.includes(`## ${s}`),`Live matrix includes ${s}`);
c(m.includes('screen-reader')&&m.includes('Keyboard-only'),'Accessibility matrix includes manual keyboard/screen-reader checks');
c(m.includes('Lighthouse')&&m.includes('Core Web Vitals'),'Performance matrix includes Lighthouse/Core Web Vitals');
c(m.includes('OWASP ZAP')&&m.includes('privilege-escalation'),'Security matrix includes DAST and privilege escalation');
c(m.includes('cannot be certified from the browser package alone'),'Backend load/concurrency boundary is explicit');
console.log(`Live certification readiness validation: ${p} passed, ${f} failed.`);if(f)process.exit(1);
