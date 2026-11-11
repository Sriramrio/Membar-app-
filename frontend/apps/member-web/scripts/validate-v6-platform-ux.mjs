import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
let failures=0;
let passes=0;
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pass=(name,condition,detail='')=>{if(condition){passes++;console.log(`PASS: ${name}`)}else{failures++;console.error(`FAIL: ${name}${detail?` — ${detail}`:''}`)}};
const walk=(dir,files=[])=>{const abs=path.join(root,dir);if(!fs.existsSync(abs))return files;for(const e of fs.readdirSync(abs,{withFileTypes:true})){const rel=path.join(dir,e.name);if(e.isDirectory())walk(rel,files);else if(/\.(ts|tsx)$/.test(e.name))files.push(rel)}return files};

const css=read('src/styles/index.css');
const main=read('src/layouts/MainLayout.tsx');
const authLayout=read('src/layouts/AuthLayout.tsx');
const button=read('src/components/ui/Button.tsx');
const dialog=read('src/components/ui/ActionDialog.tsx');
const header=read('src/components/layout/Header.tsx');
const ui=read('src/features/network/components/NetworkUI.tsx');

pass('Authenticated non-Member workspaces receive readable shell contract',main.includes("workspace === 'Member' ? 'member-readable' : ''")&&main.includes("workspace !== 'Member' ? 'workspace-readable' : ''"));
pass('Public/Auth shell receives readable shell contract',authLayout.includes('workspace-readable min-h-screen'));
pass('Workspace body typography is at least 16px with readable line height',css.includes('.workspace-readable{font-size:1rem;line-height:1.55'));
pass('Workspace metadata normalizes text-xs to at least 14px',css.includes('.workspace-readable small,.workspace-readable .text-xs{font-size:.875rem'));
pass('Workspace interactive controls enforce 44px minimum height',css.includes('.workspace-readable button,.workspace-readable input,.workspace-readable select{min-height:44px'));
pass('Workspace form controls use 16px text to avoid mobile zoom/readability issues',css.includes('.workspace-readable input,.workspace-readable select,.workspace-readable textarea{font-size:1rem'));
pass('Dense Tabulator grids use at least 14px base text',css.includes('.tabulator{border:0!important;background:#fff!important;font-size:.875rem'));
pass('Tabulator header filters use at least 14px text',css.includes('font-size:.875rem}'));
pass('Reduced-motion preference is honored globally',css.includes('@media(prefers-reduced-motion:reduce)'));
pass('Shared Button uses 44px minimum height and base text',button.includes('min-h-11')&&button.includes('text-base')&&button.includes('focus-visible:ring-3'));
pass('Action dialog is short-viewport safe',dialog.includes('max-h-[calc(100dvh-2rem)]')&&dialog.includes('overflow-y-auto'));
pass('Action dialog close control is 44px and labelled',dialog.includes('size-11')&&dialog.includes('aria-label="Close dialog"'));
pass('Action dialog traps keyboard focus and supports Escape',dialog.includes("e.key==='Escape'")&&dialog.includes("e.key!=='Tab'")&&dialog.includes('aria-modal="true"'));
pass('Header search uses readable base text',header.includes('pr-3 text-base outline-none'));
pass('Header icon controls use 44px targets',header.includes('size-11 shrink-0 place-items-center'));
pass('Shared PageHead uses readable body text and scalable titles',ui.includes('text-[28px]')&&ui.includes('sm:text-[32px]')&&ui.includes('text-base leading-7'));

const readableRoots=['src/features/platform-admin','src/features/governance','src/features/management','src/features/public','src/features/auth'];
const tiny=[];
for(const r of readableRoots){for(const f of walk(r,[])){const s=read(f);if(s.includes('text-xs'))tiny.push(f)}}
pass('Primary Platform Admin/Governance/Management/Public/Auth source has no explicit 12px text utilities',tiny.length===0,tiny.join(', '));

const tableFiles=[];
for(const r of readableRoots){for(const f of walk(r,[])){const s=read(f);if(s.includes('<table'))tableFiles.push({f,s})}}
const uncontained=tableFiles.filter(({s})=>!s.includes('overflow-x-auto')&&!s.includes('overflow-auto')).map(x=>x.f);
pass('Operational HTML tables have horizontal overflow containment',uncontained.length===0,uncontained.join(', '));

const decision=read('src/features/governance/pages/DecisionRegisterPage.tsx');
const tenure=read('src/features/governance/pages/RoleTenureOversightPage.tsx');
const workflow=read('src/features/management/pages/WorkflowInboxPage.tsx');
const visitor=read('src/features/management/pages/VisitorManagementPage.tsx');
pass('Governance decision register has explicit empty state',decision.includes('No governance decisions'));
pass('Role tenure oversight has explicit empty state',tenure.includes('No role assignments'));
pass('Workflow inbox has explicit filtered empty state',workflow.includes('No workflow cases match this view'));
pass('Visitor management has explicit filtered empty state',visitor.includes('No visitors match this view'));

const login=read('src/features/auth/components/LoginForm.tsx');
pass('Authentication tabs and password visibility control meet 44px target',login.includes('min-h-11')&&login.includes('size-11'));
pass('Authentication preview details avoid tiny typography',!login.includes('text-xs'));

if(failures){console.error(`\nSETHU V6 Platform Canonical UX validation: FAIL (${failures} failed, ${passes} passed).`);process.exit(1)}
console.log(`\nSETHU V6 Platform Canonical UX validation: PASS (${passes}/${passes} checks).`);
