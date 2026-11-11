import { localStorageService } from '@/services/storage/localStorage';
import { sessionStorageService } from '@/services/storage/sessionStorage';
import { STORAGE_KEYS } from '@/utils/constants';
import { migrateToV6Baseline } from './v6Baseline';
import { CURRENT_SCHEMA_VERSION } from './v6BaselineCore';
import type { MigrationMetadata } from './v6BaselineCore';
import { V6_BASELINE_RELEASE_VERSION } from './types';
import type { PersistenceEnvelope } from './types';

const LEGACY_STORAGE_KEYS = {
  redux: ['sethu:safe-preferences:v7'],
  session: ['sethu:runtime-session:v7'],
  visitorDraft: ['sethu:visitor-draft:v4'],
} as const;

function firstDefined<T>(values:Array<T|undefined>){return values.find(v=>v!==undefined);}

export function createPersistenceEnvelope<T>(value:T,meta?:MigrationMetadata):PersistenceEnvelope<T>{
 return {schemaVersion:CURRENT_SCHEMA_VERSION,releaseVersion:V6_BASELINE_RELEASE_VERSION,data:value,...(meta?{migration:meta}:{})};
}

export function unwrapPersistence<T>(value:PersistenceEnvelope<T>|T|undefined):T|undefined{
 if(value===undefined)return undefined;
 if(value&&typeof value==='object'&&!Array.isArray(value)&&'data' in (value as Record<string,unknown>)&&'schemaVersion' in (value as Record<string,unknown>)){
   return (value as PersistenceEnvelope<T>).data;
 }
 return value as T;
}

export function readRuntimeState<T>():T|undefined{
 const current=sessionStorageService.get<PersistenceEnvelope<T>|T>(STORAGE_KEYS.session);
 const legacy=firstDefined(LEGACY_STORAGE_KEYS.session.map(k=>sessionStorageService.get<PersistenceEnvelope<T>|T>(k)));
 return unwrapPersistence(current??legacy);
}
export function readSafePreferences<T>():T|undefined{
 const current=localStorageService.get<PersistenceEnvelope<T>|T>(STORAGE_KEYS.redux);
 const legacy=firstDefined(LEGACY_STORAGE_KEYS.redux.map(k=>localStorageService.get<PersistenceEnvelope<T>|T>(k)));
 return unwrapPersistence(current??legacy);
}
export function writeRuntimeState<T>(value:T,meta?:MigrationMetadata){sessionStorageService.set(STORAGE_KEYS.session,createPersistenceEnvelope(value,meta));}
export function writeSafePreferences<T>(value:T,meta?:MigrationMetadata){localStorageService.set(STORAGE_KEYS.redux,createPersistenceEnvelope(value,meta));}
export function writeMigrationMarker(meta:MigrationMetadata){localStorageService.set(STORAGE_KEYS.migrationMarker,meta);}
export function readVisitorDraft<T>():T|undefined{
 const current=sessionStorageService.get<T|{schemaVersion:number;screenId:string;payload:T}>(STORAGE_KEYS.visitorDraft);
 if(current!==undefined){
   if(current&&typeof current==='object'&&!Array.isArray(current)&&'payload' in current&&'screenId' in current)return (current as {payload:T}).payload;
   return current as T;
 }
 return firstDefined(LEGACY_STORAGE_KEYS.visitorDraft.map(k=>sessionStorageService.get<T>(k)));
}
export function migrateStoredRoot(input:Parameters<typeof migrateToV6Baseline>[0]){return migrateToV6Baseline(input);}
