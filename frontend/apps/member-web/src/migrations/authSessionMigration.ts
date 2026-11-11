import { sessionStorageService } from '@/services/storage/sessionStorage';

/** Migration-only compatibility for preview/session credentials created by the historical V4 prototype. */
const mappings=[
 ['sethu:v6-baseline:session-member-accounts','sethu:session-member-accounts:v4'],
 ['sethu:v6-baseline:session-preview-password','sethu:session-preview-password:v4'],
 ['sethu:v6-baseline:session-password-overrides','sethu:session-password-overrides:v4'],
 ['sethu:v6-baseline:otp-challenges','sethu:otp-challenges:v4'],
] as const;
export function migrateLegacyPreviewAuthSession(){
 for(const [currentKey,legacyKey] of mappings){
   const current=sessionStorageService.rawGetResult(currentKey);
   if(!current.ok||current.value!==undefined)continue;
   const legacy=sessionStorageService.rawGetResult(legacyKey);
   if(legacy.ok&&legacy.value!==undefined)sessionStorageService.rawSetResult(currentKey,legacy.value);
 }
}
