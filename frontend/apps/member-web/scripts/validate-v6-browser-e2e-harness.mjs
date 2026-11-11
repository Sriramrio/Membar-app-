import fs from 'node:fs';let p=0,f=0;const c=(x,m)=>{console.log(`${x?'PASS':'FAIL'}: ${m}`);x?p++:f++};const matrix=fs.readFileSync('V6_BROWSER_E2E_MATRIX.md','utf8');const runner=fs.readFileSync('e2e/run-browser-e2e.mjs','utf8');
for(const u of ['member','secretary','treasurer','regional','board','statereviewer','governancereviewer','platform','platformreviewer','superadmin','qa'])c(matrix.includes(`\`${u}\``)&&runner.includes(`'${u}'`),`Browser matrix covers ${u}`);
for(const area of ['Member','Management','Governance','Platform Admin','Cross-resource/deep-link checks'])c(matrix.includes(area),`Browser matrix covers ${area}`);
c(runner.includes("await import('playwright')")&&runner.includes('BLOCKED: Playwright is not installed'),'Runner fails explicitly when browser dependency is unavailable');
c(runner.includes("page.on('pageerror'")&&runner.includes("m.type()==='error'"),'Runner collects page and console errors');
c(matrix.includes('denied routes remain denied')&&matrix.includes('visible actions match role responsibility'),'Matrix covers authorization and responsibility visibility');
console.log(`Browser E2E harness validation: ${p} passed, ${f} failed.`);if(f)process.exit(1);
