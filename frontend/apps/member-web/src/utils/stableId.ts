let fallbackCounter=0;

function fallbackUuid(){
  const bytes=new Uint8Array(16);
  if(typeof crypto!=='undefined'&&typeof crypto.getRandomValues==='function')crypto.getRandomValues(bytes);
  else {
    // Last-resort non-cryptographic uniqueness for legacy/private browser contexts only.
    // Production-capable browsers use crypto.randomUUID/getRandomValues; canonical server IDs remain backend-owned.
    fallbackCounter=(fallbackCounter+1)>>>0;
    const seed=`${Date.now().toString(36)}-${fallbackCounter.toString(36)}-${typeof performance!=='undefined'?Math.floor(performance.now()*1000).toString(36):'0'}`;
    for(let i=0;i<bytes.length;i+=1){
      let value=2166136261;
      for(let j=0;j<seed.length;j+=1)value=Math.imul(value^seed.charCodeAt(j),16777619);
      bytes[i]=(value>>>((i%4)*8))&0xff;
    }
  }
  bytes[6]=(bytes[6]&0x0f)|0x40;
  bytes[8]=(bytes[8]&0x3f)|0x80;
  const hex=[...bytes].map(v=>v.toString(16).padStart(2,'0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

export function stableClientId(prefix='client'){
  const id=typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function'?crypto.randomUUID():fallbackUuid();
  return `${prefix}-${id}`;
}
