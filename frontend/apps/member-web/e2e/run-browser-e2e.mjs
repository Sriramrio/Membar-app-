import fs from 'node:fs';

const baseURL=process.env.SETHU_E2E_BASE_URL||'http://127.0.0.1:4173';
let chromium;try{({chromium}=await import('playwright'));}catch{console.error('BLOCKED: Playwright is not installed in the locked project dependency tree.');process.exit(2)}
const password=process.env.SETHU_E2E_PASSWORD||'Sethu@123456';
const routeText=fs.readFileSync(new URL('../src/routes/routeConfig.tsx',import.meta.url),'utf8');
const canonicalRoutes=[...routeText.matchAll(/\{ id:(\d+), path:"([^"]+)", workspace:"([^"]+)"/g)].map(m=>({id:Number(m[1]),path:m[2],workspace:m[3]}));
const sampleFor=(path)=>path
 .replace('/app/members/:id','/app/members/member-007')
 .replace('/app/businesses/:id','/app/businesses/business-007')
 .replace('/app/opportunities/:id/respond','/app/opportunities/opp-001/respond')
 .replace('/app/opportunities/:id','/app/opportunities/opp-001')
 .replace('/app/messages/:conversationId','/app/messages/conversation-001')
 .replace('/app/meetings/:id','/app/meetings/meeting-001')
 .replace('/app/events/:id','/app/events/event-001')
 .replace('/app/promotions/:id','/app/promotions/promo-001');

const users=['member','secretary','treasurer','regional','board','statereviewer','governancereviewer','platform','platformreviewer','superadmin','qa'];
const workspaces=['Member','Management','Governance','Platform Admin'];
const browser=await chromium.launch({headless:true});let failures=0;const page=await browser.newPage();
async function login(){await page.goto(`${baseURL}/login`,{waitUntil:'networkidle'});await page.getByLabel(/email|account/i).fill('qa');await page.getByLabel(/^password$/i).fill(password);await page.getByRole('button',{name:/sign in|login/i}).click();await page.waitForURL(u=>!u.pathname.includes('/login'),{timeout:10000});}
async function check(name,fn){try{await fn();console.log(`PASS: ${name}`)}catch(error){failures++;console.error(`FAIL: ${name}: ${error}`)}}
for(const user of users){await check(`identity ${user}`,async()=>{const smoke=await browser.newPage();const errors=[];smoke.on('pageerror',e=>errors.push(String(e)));smoke.on('console',m=>{if(m.type()==='error')errors.push(m.text())});try{await smoke.goto(`${baseURL}/login`,{waitUntil:'networkidle'});await smoke.getByLabel(/email|account/i).fill(user);await smoke.getByLabel(/^password$/i).fill(password);await smoke.getByRole('button',{name:/sign in|login/i}).click();await smoke.waitForURL(u=>!u.pathname.includes('/login'),{timeout:10000});if(errors.length)throw new Error(`browser errors: ${errors.join(' | ')}`)}finally{await smoke.close()}})}
void workspaces;
await login();
for(const route of canonicalRoutes){
 await check(`route ${route.id} ${route.path}`,async()=>{
   const errors=[];const pageError=e=>errors.push(String(e));const consoleError=m=>{if(m.type()==='error')errors.push(m.text())};
   page.on('pageerror',pageError);page.on('console',consoleError);
   try{
     const target=sampleFor(route.path);await page.goto(`${baseURL}${target}`,{waitUntil:'networkidle'});
     const current=new URL(page.url()).pathname;
     if(current==='/unauthorized'||current==='/access-status'||current==='/login')throw new Error(`unexpected access redirect to ${current}`);
     const body=(await page.locator('body').innerText()).trim();if(!body)throw new Error('blank document');
     if(body.includes('This screen could not be completed'))throw new Error('RouteErrorBoundary rendered');
     if(errors.length)throw new Error(`browser errors: ${errors.join(' | ')}`);
   }finally{page.off('pageerror',pageError);page.off('console',consoleError)}
 });
}
await check('Browser Back/Forward preserves URL state',async()=>{await page.goto(`${baseURL}/app/directory?mode=businesses`);const first=page.url();await page.goto(`${baseURL}/app/activity?view=actions`);await page.goBack({waitUntil:'networkidle'});if(page.url()!==first)throw new Error(`expected ${first}, got ${page.url()}`);await page.goForward({waitUntil:'networkidle'});if(!page.url().includes('/app/activity?view=actions'))throw new Error('forward state not restored')});
await check('Deep-link focus survives refresh',async()=>{await page.goto(`${baseURL}/platform-admin/audit?focus=audit-1&kind=audit`);await page.reload({waitUntil:'networkidle'});if(!page.url().includes('focus=audit-1'))throw new Error('focus query lost')});
await browser.close();process.exit(failures?1:0);
