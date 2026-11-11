import fs from 'node:fs';let p=0,f=0;const c=(x,m)=>{console.log(`${x?'PASS':'FAIL'}: ${m}`);x?p++:f++};const m=fs.readFileSync('V6_NAVIGATION_BROWSER_E2E_MATRIX.md','utf8'),r=fs.readFileSync('e2e/run-navigation-e2e.mjs','utf8');
for(const x of ['Breadcrumb hierarchy','Back / forward','Dirty navigation','Navigation surfaces','Acceptance'])c(m.includes(x),`Navigation matrix covers ${x}`);
for(const x of ['Action Centre','Chapter Insights','?focus=<id>&kind=<kind>','Role/workspace switch while dirty','browser history'])c(m.includes(x),`Navigation matrix includes ${x}`);
c(r.includes("await import('playwright')")&&r.includes('BLOCKED: Playwright is not installed'),'Navigation runner fails explicitly without browser dependency');
c(r.includes('page.goBack()')&&r.includes('page.goForward()'),'Navigation runner exercises browser Back/Forward');
c(r.includes('focus=audit-1')&&r.includes('page.reload()'),'Navigation runner exercises focused deep-link refresh');
c(r.includes('/app/activity?view=actions')&&r.includes('/app/dashboard?view=chapter'),'Navigation runner covers canonical query views');
console.log(`Navigation browser harness validation: ${p} passed, ${f} failed.`);if(f)process.exit(1);
