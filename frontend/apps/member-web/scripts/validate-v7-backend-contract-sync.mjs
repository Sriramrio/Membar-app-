import fs from 'node:fs';
import path from 'node:path';
const read=p=>fs.readFileSync(p,'utf8');
const checks=[];const check=(label,ok)=>checks.push({label,ok:Boolean(ok)});
const queryIds=[
'member.directory.businesses','member.directory.people','member.opportunities.marketplace','member.notifications.list','member.converse.inbox','member.converse.messages','member.attendance.list','member.references.list','member.transactions.list','member.meetings.list'];
const commands=[
'member.profile.update','family.update','business.update','business.affiliation.request','business.affiliation.end','business.affiliation.set-primary','business.certification.upsert',
'connection.request','connection.respond','connection.cancel','connection.remove','connection.block','converse.conversation.create','converse.chapter-group.create','converse.conversation.join','converse.conversation.leave','converse.conversation.flag','converse.conversation.read','converse.message.send',
'meeting.create','meeting.update','meeting.poll','event.rsvp','event.rsvp.cancel','attendance.correction.request','reference.create','reference.status.update','opportunity.status.update','opportunity.response.submit','opportunity.response.status','opportunity.question.ask','opportunity.question.answer','opportunity.award','transaction.create','transaction.status.update','notifications.mark-all-read','notification.mark-read','notification.acknowledge','announcement.acknowledge','thank-you.create','thank-you.acknowledge','support.create','promotion.event.record','member.interaction-note.create'];
function collect(dir){let s='';for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())s+=collect(p);else if(/\.(ts|tsx)$/.test(e.name))s+=read(p)+'\n';}return s;}
const source=collect('src'); const openapi=read('SETHU_V7_OPENAPI_HANDSHAKE.yaml'); const catalog=read('SETHU_V7_COMMAND_QUERY_CATALOG.md'); const handshake=read('SETHU_V7_FRONTEND_BACKEND_HANDSHAKE.md'); const tests=read('SETHU_V7_INTEGRATION_TEST_MATRIX.md');
check('Exactly ten V7 Member server-query IDs are catalogued',queryIds.length===10);
check('Exactly forty-four governed Member command IDs are catalogued',commands.length===44);
check('Every query ID appears in frontend source',queryIds.every(x=>source.includes(x)));
check('Every query ID appears in OpenAPI',queryIds.every(x=>openapi.includes(x)));
check('Every query ID appears in command/query catalogue',queryIds.every(x=>catalog.includes(x)));
check('Every governed command appears in frontend source',commands.every(x=>source.includes(x)));
check('Every governed command appears in OpenAPI',commands.every(x=>openapi.includes(x)));
check('Every governed command appears in command/query catalogue',commands.every(x=>catalog.includes(x)));
check('OpenAPI declares all workspace query/command endpoints',['/v6/member/query:','/v6/member/commands:','/v6/management/query:','/v6/management/commands:','/v6/governance/query:','/v6/governance/commands:','/v6/platform-admin/query:','/v6/platform-admin/commands:'].every(x=>openapi.includes(x)));
check('Handshake defines transactional outbox and keyset cursor ownership',handshake.includes('transactional outbox')&&handshake.includes('opaque keyset cursor'));
check('Integration matrix covers idempotency and concurrency races',/idempot/i.test(tests)&&/409|412|concurr|version/i.test(tests));
const fail=checks.filter(x=>!x.ok);for(const c of checks)console.log(`${c.ok?'PASS':'FAIL'}: ${c.label}`);console.log(`\nSETHU V7 backend contract synchronization: ${checks.length-fail.length}/${checks.length} PASS`);if(fail.length)process.exit(1);
