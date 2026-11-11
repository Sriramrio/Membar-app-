import {env} from '@/config/env';
import {realtimeGateway} from './realtimeGateway';
import {assertRealtimeEvent} from '@/contracts/runtimeContracts';
import {telemetry} from './telemetry';
import {invalidateQueryMemoryCache} from './queryGateway';
import {authStorage} from '@/utils/authStorage';

class OrgRealtimeTransport{
  private source?:EventSource;
  private key='';
  start(scopeId:string,sessionRevision:string){
    if(env.useMocks||typeof EventSource==='undefined')return;
    const key=`${scopeId}:${sessionRevision}`;
    if(this.source&&this.key===key)return;
    this.stop();this.key=key;
    const realtimeEndpoint=env.realtimeUrl.trim()||`${env.apiBaseUrl}/v3/organisational/stream`;
    const url=new URL(realtimeEndpoint,window.location.origin);
    url.searchParams.set('scope',scopeId);
    url.searchParams.set('sessionRevision',sessionRevision);
    const token = authStorage.getToken();
    if(token) url.searchParams.set('token', token);
    const source=new EventSource(url.toString(),{withCredentials:true});this.source=source;
    source.onopen=()=>telemetry.emit({level:'info',category:'realtime',name:'realtime.connected',data:{scopeId}});
    source.onmessage=(message)=>{try{const event=assertRealtimeEvent(JSON.parse(message.data));invalidateQueryMemoryCache();realtimeGateway.accept(event)}catch{telemetry.emit({level:'error',category:'realtime',name:'realtime.invalid-event',data:{scopeId}})}};
    source.onerror=()=>telemetry.emit({level:'error',category:'realtime',name:'realtime.disconnected',data:{scopeId,readyState:source.readyState}});
  }
  stop(){this.source?.close();this.source=undefined;this.key=''}
}
export const realtimeTransport=new OrgRealtimeTransport();
