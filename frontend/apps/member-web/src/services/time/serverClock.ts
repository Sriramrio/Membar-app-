let serverOffsetMs=0;
let synchronized=false;

export const serverClock={
  sync(serverDate:string|Date|undefined){
    if(!serverDate)return;
    const at=serverDate instanceof Date?serverDate.getTime():Date.parse(serverDate);
    if(!Number.isFinite(at))return;
    serverOffsetMs=at-Date.now();
    synchronized=true;
  },
  nowMs(){return Date.now()+serverOffsetMs;},
  now(){return new Date(Date.now()+serverOffsetMs);},
  isoNow(){return new Date(Date.now()+serverOffsetMs).toISOString();},
  todayIso(){return new Date(Date.now()+serverOffsetMs).toISOString().slice(0,10);},
  addMs(deltaMs:number){return new Date(Date.now()+serverOffsetMs+deltaMs);},
  isSynchronized(){return synchronized;},
  offsetMs(){return serverOffsetMs;},
};
