let offset=0; export const serverClock={now:()=>new Date(Date.now()+offset),sync:(iso:string)=>{const n=Date.parse(iso);if(Number.isFinite(n))offset=n-Date.now();},offset:()=>offset};
