import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const src = resolve('src');
const files = [];
function walk(p) {
  for (const n of readdirSync(p)) {
    const x = join(p, n);
    if (statSync(x).isDirectory()) walk(x);
    else if (/\.(ts|tsx)$/.test(n)) files.push(x);
  }
}
walk(src);

const fail = [];
const banned = [
  [/\bTODO\b/, 'TODO'],
  [/\bFIXME\b/, 'FIXME'],
  [/javascript:void/, 'javascript:void'],
  [/href=["']#["']/, 'href=#'],
  [/catch\(error\)\{void error\}/, 'swallowed error'],
  [/catch\{\/\* structured error rendered \*\/\}/, 'swallowed structured error'],
  [/role\s*===\s*['"]/, 'role-name authorization']
];
for (const f of files) {
  const t = readFileSync(f, 'utf8');
  for (const [r, label] of banned) if (r.test(t)) fail.push(`${relative(src, f)}: ${label}`);
}
if (existsSync(join(src, 'routes/NotImplementedPage.tsx'))) fail.push('dead NotImplementedPage still exists');
const route = readFileSync(join(src, 'routes/routeManifest.ts'), 'utf8');
if (route.includes("'DESIGNED_NOT_IMPLEMENTED'")) fail.push('dead route status remains');
const app = readFileSync(join(src, 'app/PlatformAdminApp.tsx'), 'utf8');
const routeIds = [...route.matchAll(/id:'([^']+)'/g)].map(x => x[1]);
const mapped = [...app.matchAll(/(?:^|[,{])\s*(?:'([^']+)'|([a-z0-9-]+))\s*:\s*lazyNamed/g)].map(x => x[1] || x[2]);
const missing = routeIds.filter(id => !mapped.includes(id));
const extra = mapped.filter(id => !routeIds.includes(id));
if (missing.length) fail.push(`routes without lazy component mapping: ${missing.join(', ')}`);
if (extra.length) fail.push(`component mappings without route: ${extra.join(', ')}`);
if (new Set(mapped).size !== mapped.length) fail.push('duplicate component mapping ids');
if (fail.length) {
  console.error(fail.join('\n'));
  process.exit(1);
}
console.log(`PA-S52 PASS: ${files.length} TS/TSX files scanned; zero stale markers, swallowed errors, dead fallback routes or route/component drift.`);
