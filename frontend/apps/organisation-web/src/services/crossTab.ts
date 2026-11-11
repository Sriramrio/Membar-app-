export type CrossTabEvent={type:'LOGOUT'|'SESSION_REVOKED'|'ROLE_CHANGED'|'ASSIGNMENT_CHANGED'|'SCOPE_CHANGED';payload?:unknown};

type Listener=(event:CrossTabEvent)=>void;
const listeners=new Set<Listener>();
const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('sethu-org-runtime'):undefined;

channel?.addEventListener('message',(message:MessageEvent<CrossTabEvent>)=>{
  for(const listener of listeners)listener(message.data);
});

export const crossTab={
  publish(event:CrossTabEvent){
    // BroadcastChannel does not deliver a posted message back to its sender.
    // Deliver locally first so session revocation / scope changes take effect in
    // the tab that detected them, then notify sibling tabs.
    for(const listener of listeners)listener(event);
    channel?.postMessage(event);
  },
  subscribe(listener:Listener){listeners.add(listener);return()=>listeners.delete(listener)}
};
