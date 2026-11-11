type DraftSaver=()=>boolean|Promise<boolean>;
const savers=new Map<string,DraftSaver>();
export function registerNavigationDraftSaver(key:string,saver:DraftSaver){savers.set(key,saver);return()=>{if(savers.get(key)===saver)savers.delete(key)}}
export async function saveRegisteredNavigationDraft(key?:string){if(!key)return false;const saver=savers.get(key);if(!saver)return false;return Boolean(await saver())}
