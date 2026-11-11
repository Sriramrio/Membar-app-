import type { MigrationMetadata } from './v6BaselineCore';
export { V6_BASELINE_RELEASE_VERSION } from './v6BaselineCore';

export const V6_BASELINE_SCHEMA_VERSION = 6 as const;
export type SupportedSourceSchema = 3 | 4 | 5 | 6 | 'unknown';
export interface PersistenceEnvelope<T=unknown>{schemaVersion:number;releaseVersion?:string;data:T;migration?:MigrationMetadata;}
export interface MigrationResult<T>{state:T;sourceSchema:SupportedSourceSchema;targetSchema:6;metadata:MigrationMetadata;valid:boolean;}
