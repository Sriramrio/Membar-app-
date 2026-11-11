import {serverClock} from '@/services/serverClock';
export function businessDateOnly(offsetDays=0){const d=serverClock.now();d.setUTCDate(d.getUTCDate()+offsetDays);return d.toISOString().slice(0,10)}
