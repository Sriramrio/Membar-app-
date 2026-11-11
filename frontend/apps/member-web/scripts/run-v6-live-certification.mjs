import fs from 'node:fs';
const missing=[];if(!fs.existsSync('dist/index.html'))missing.push('current Vite production build (dist/index.html)');if(!fs.existsSync('node_modules/.bin/vite'))missing.push('restored locked dependencies');
if(missing.length){console.error(`BLOCKED: live certification requires ${missing.join(' and ')}.`);process.exit(2)}
console.error('BLOCKED: live certification additionally requires browser automation/Lighthouse/accessibility/load/security tooling and a deployed backend target.');process.exit(2);
