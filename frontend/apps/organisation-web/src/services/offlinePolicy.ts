export type OfflinePolicy='offline-safe'|'draft-only'|'queued'|'online-required'|'forbidden-offline';
export const offlinePolicy=(commandId:string):OfflinePolicy=>commandId.includes('draft')?'draft-only':commandId.startsWith('org.converse.message.send')?'queued':'online-required';
