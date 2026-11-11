const baseURL=process.env.SETHU_E2E_BASE_URL||'http://127.0.0.1:4173';
let chromium;try{({chromium}=await import('playwright'));}catch{console.error('BLOCKED: Playwright is not installed; navigation browser E2E cannot execute.');process.exit(2)}
const password=process.env.SETHU_E2E_PASSWORD||'Sethu@123456';
const browser=await chromium.launch({headless:true});const page=await browser.newPage();let failures=0;
page.on('console', m => console.log('PAGE CONSOLE:', m.type(), m.text()));
page.on('pageerror', e => console.error('PAGE ERROR:', e));
async function check(name,fn){try{await fn();console.log(`PASS: ${name}`)}catch(e){failures++;console.error(`FAIL: ${name}: ${e}`)}}
async function login(user='member'){
  await page.goto(`${baseURL}/login`);
  await page.getByLabel(/email|account/i).fill(user);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole('button',{name:/sign in|login/i}).click();
  await page.waitForLoadState('networkidle');
  console.log('URL after login:', page.url());
  if (page.url().includes('/login')) {
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 });
    console.log('URL after leaving login:', page.url());
  }
}
await login();
await check('Action Centre query-view breadcrumb',async()=>{await page.goto(`${baseURL}/app/activity?view=actions`);await page.getByText('Action Centre',{exact:true}).first().waitFor()});
await check('Chapter Insights query-view breadcrumb',async()=>{await page.goto(`${baseURL}/app/dashboard?view=chapter`);await page.getByText('Chapter Insights',{exact:true}).first().waitFor()});
await check('Browser Back/Forward preserves URL state',async()=>{await page.goto(`${baseURL}/app/directory?mode=members`);const first=page.url();await page.goto(`${baseURL}/app/activity?view=actions`);await page.goBack({waitUntil:'networkidle'});if(page.url()!==first)throw new Error(`expected ${first}, got ${page.url()}`);await page.goForward({waitUntil:'networkidle'});if(!page.url().includes('/app/activity?view=actions'))throw new Error('forward state not restored')});
await check('Deep-link focus survives refresh',async()=>{await page.goto(`${baseURL}/platform-admin/audit?focus=audit-1&kind=audit`);await page.reload();if(!page.url().includes('focus=audit-1'))throw new Error('focus query lost')});
await browser.close();process.exit(failures?1:0);
