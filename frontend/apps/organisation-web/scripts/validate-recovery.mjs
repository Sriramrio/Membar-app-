import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const errorMapper=read('src/services/errorMapper.ts');
const asyncState=read('src/components/AsyncState.tsx');
const commandFeedback=read('src/components/CommandFeedback.tsx');
const command=read('src/services/commandGateway.ts');
const query=read('src/services/queryGateway.ts');
const checks=[
  ['offline mapping',errorMapper.includes("e.code==='OFFLINE'")],
  ['query timeout mapping',errorMapper.includes("e.code==='QUERY_TIMEOUT'")],
  ['unknown command outcome',errorMapper.includes("e.code==='COMMAND_TIMEOUT'")&&errorMapper.includes('unknownOutcome:true')],
  ['conflict recovery',errorMapper.includes("status===409||status===412")],
  ['safe retry only',commandFeedback.includes('error?.retryable&&!error.unknownOutcome')],
  ['unknown outcome warning',commandFeedback.includes('Do not retry blindly')],
  ['correlation reference',asyncState.includes('structured?.correlationId')&&commandFeedback.includes('error?.correlationId')],
  ['query safe retry/backoff',query.includes('retryableStatus')&&query.includes('Retry-After')],
  ['mutation no auto retry',!command.includes('while(true)')&&!command.includes('retryDelay(')]
];
const failed=checks.filter(([,ok])=>!ok);if(failed.length){for(const [name] of failed)console.error(`FAIL ${name}`);process.exit(1)}console.log(`PASS recovery/error gates ${checks.length}/${checks.length}`);
