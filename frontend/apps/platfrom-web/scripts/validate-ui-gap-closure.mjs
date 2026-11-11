import fs from'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const files={table:read('src/components/EnterpriseDataTable.tsx'),grid:read('src/components/TabulatorGridAdapter.tsx'),ui:read('src/components/Ui.tsx'),css:read('src/shared/styles.css'),routes:read('src/routes/routeManifest.ts'),pkg:read('package.json')};
const checks=[
 ['45+ route manifest entries',(files.routes.match(/path:'\/platform-admin\//g)||[]).length>=45],
 ['table local search',files.table.includes('Filter ${label.toLocaleLowerCase()}')],
 ['table pagination',files.table.includes('Rows per page')&&files.table.includes('Previous page')],
 ['table CSV export',files.table.includes('downloadCsv')&&files.table.includes('text/csv')],
 ['keyboard row activation',files.table.includes("e.key==='Enter'||e.key===' '")],
 ['aria sort',files.table.includes('aria-sort=')],
 ['tabulator progressive fallback',files.grid.includes('if(!enhanced)return <EnterpriseDataTable')],
 ['tabulator data refresh',files.grid.includes('replaceData')],
 ['modal escape/focus trap',files.ui.includes("e.key==='Escape'")&&files.ui.includes("e.key==='Tab'")],
 ['responsive 430 breakpoint',files.css.includes('@media(max-width:430px)')],
 ['no CDN dependency',!files.grid.includes('https://')&&!files.ui.includes('https://')],
 ['React remains package-managed',JSON.parse(files.pkg).dependencies?.react!==undefined]
];
let fail=0;for(const[c,ok]of checks){console.log(`${ok?'PASS':'FAIL'} ${c}`);if(!ok)fail++}console.log(`UI GAP CLOSURE ${checks.length-fail} PASS / ${fail} FAIL`);if(fail)process.exit(1);
