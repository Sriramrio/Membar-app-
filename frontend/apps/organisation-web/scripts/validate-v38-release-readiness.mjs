import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const failures=[];const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const css=read('src/styles/global.css');
const shell=read('src/components/ResponsiveShell.tsx');
const pkg=JSON.parse(read('package.json'));
check(css.includes('--focus:#f2b84b'),'Platform-aligned amber focus token must remain present.');
check(/:focus-visible\{outline:3px solid var\(--focus\)/.test(css),'Visible keyboard focus ring must remain present.');
check(/min-height:44px/.test(css),'Interactive controls must retain >=44px touch target baseline.');
check(/prefers-reduced-motion:reduce/.test(css),'Reduced-motion support must remain present.');
check(/@media\(min-width:760px\)/.test(css)&&/@media\(min-width:1100px\)/.test(css),'Responsive tablet/desktop breakpoints must remain present.');
check(/className="bottom-nav"/.test(shell),'Mobile bottom navigation must remain present.');
check(/Today/.test(shell)&&/Actions/.test(shell)&&/Converse/.test(shell)&&/Calendar/.test(shell)&&/More/.test(shell),'Five-position mobile operating model must remain Today/Actions/Converse/Calendar/More.');
check(pkg.scripts?.build?.includes('tsc -b')&&pkg.scripts?.build?.includes('vite build'),'Production build script must perform TypeScript build plus Vite bundle.');
for(const dir of ['node_modules','.vite','dist','coverage','.git'])check(!fs.existsSync(path.join(root,dir)),`Authoritative source must stay dependency/build clean: ${dir}`);
if(failures.length){console.error('V3.8 release readiness FAILED');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('PASS V3.8 release readiness static gates: responsive shell, focus, touch targets, reduced motion, build contract and clean source.');
