import {readFile} from 'node:fs/promises';
const detail=await readFile(new URL('../src/pages/OperationalRecordDetailPage.tsx',import.meta.url),'utf8');
const routes=await readFile(new URL('../src/routes/routeRegistry.tsx',import.meta.url),'utf8');
const required=[
 ['Task','/org/tasks/:id'],['Action','/org/actions/:id'],['Approval','/org/approvals/:id'],['MemberCase','/org/member-cases/:id'],['Committee','/org/committees/:id'],['Programme','/org/programmes/:id'],['Event','/org/events/:id'],['Support','/org/support/:id'],['Escalation','/org/escalations/:id'],['Handoff','/org/handoffs/:id'],['Exception','/org/exceptions/:id'],['Risk','/org/risks/:id'],['Issue','/org/issues/:id'],['Decision','/org/decisions/:id'],['Job','/org/jobs/:id'],['Document','/org/documents/:id'],['Communication','/org/communications/:id'],['Feedback','/org/polls/:id'],['Goal','/org/goals/:id'],['DataQuality','/org/data-quality/:id'],['Notification','/org/notifications/:id'],['Alert','/org/alerts/:id']
];
const failures=[];for(const [name,path] of required){if(!routes.includes(`path:'${path}'`))failures.push(`missing route ${path}`);if(!detail.includes(`export const ${name}DetailPage`))failures.push(`missing detail export ${name}`)}
for(const token of ['MEMBER_CASE','SUPPORT','EXCEPTION','COMMUNICATION','FEEDBACK','DATA_QUALITY','NOTIFICATION','ALERT'])if(!detail.includes(`'${token}'`))failures.push(`detail kind ${token} missing`);
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log(`PASS detail/cross-link static integrity ${required.length} detail route families`);
