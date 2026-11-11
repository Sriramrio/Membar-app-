import { initialNetworkState } from '@/features/network/networkSlice';
import { initialOperationsState } from '@/features/operations/operationsSlice';
import { initialLegacyEnterpriseOperationalState,fromLegacyEnterpriseState,type LegacyEnterpriseOperationalState } from './legacyEnterpriseOperational';
import { initialPlatformControlState } from '@/features/control-plane/data';
import type { PlatformControlState } from '@/features/control-plane/types';
import { mergePlatformRuntimeState,initialPlatformRuntimeState } from '@/features/platform-runtime/platformRuntimeState';
import type { PlatformRuntimeState } from '@/features/platform-runtime/platformRuntimeState';
import { hydrateV4PlatformState } from './legacyV4ControlPlane';
import { canonicalizeRootState,detectLegacySchemaVersion,buildMigrationMetadata,CURRENT_SCHEMA_VERSION,V6_BASELINE_RELEASE_VERSION,migrateLegacyNetworkDomain,validateReferenceIntegrity,type MigrationMetadata } from './v6BaselineCore';

export interface V6SafePersisted {
 network?:Partial<typeof initialNetworkState>;
 enterprise?:Partial<LegacyEnterpriseOperationalState & import('./legacyV4ControlPlane').LegacyV4EnterpriseConfiguration>;
 platformRuntime?:Partial<PlatformRuntimeState>;
 controlPlane?:Partial<PlatformControlState>;
}
export interface V6MigrationInput {runtime?:Record<string,any>;safe?:V6SafePersisted;baseState:Record<string,any>}
export interface V6MigrationResult {state:Record<string,any>;metadata:MigrationMetadata}

const arrays=<T extends Record<string,any>>(base:T,incoming:Partial<T>|undefined,keys:string[])=>{
 const out:any={...base,...(incoming??{})};for(const key of keys)out[key]=Array.isArray((incoming as any)?.[key])?(incoming as any)[key]:(base as any)[key];return out as T;
};
const mergeNetwork=(n:Partial<typeof initialNetworkState>|undefined)=>arrays(initialNetworkState,n,['categories','businesses','members','connections','promotions','opportunities','responses','conversations','messages','meetings','events','announcements','references','transactions','notifications','payments','attendance','affiliations','businessRelationships','certificationRecords','thankYouNotes','importLedger','opportunityQuestions','supportRequests']);
const mergeEnterprise=(e:Partial<LegacyEnterpriseOperationalState>|undefined)=>arrays(initialLegacyEnterpriseOperationalState,e,['visitors','workflowTasks','imports','roleAssignments','policies','policyExceptions','boardPacks','strategyOutcomes','moderationCases','dataQualityIssues','identityRecords','governanceDecisions','sessions','audit']);



export function migrateToV6Baseline(input:V6MigrationInput):V6MigrationResult{
 const combined={...(input.safe??{}),...(input.runtime??{}),network:{...(input.safe?.network??{}),...(input.runtime?.network??{})},enterprise:{...(input.safe?.enterprise??{}),...(input.runtime?.enterprise??{})},controlPlane:{...(input.safe?.controlPlane??{}),...(input.runtime?.controlPlane??{})}};
 const sourceSchema=detectLegacySchemaVersion(combined);
 let network=mergeNetwork(combined.network as Partial<typeof initialNetworkState>);
 const domainMigration=sourceSchema<CURRENT_SCHEMA_VERSION?migrateLegacyNetworkDomain(network):{network,stats:{migratedAffiliations:0,migratedCertifications:0,manualReview:0}};
 network=domainMigration.network as typeof initialNetworkState;
 const operations={...initialOperationsState,...(input.runtime?.operations??{})};
 const enterprise=mergeEnterprise(combined.enterprise as Partial<LegacyEnterpriseOperationalState>);
 const migratedRuntime=fromLegacyEnterpriseState(enterprise);
 const currentRuntime=(input.runtime?.platformRuntime??input.safe?.platformRuntime) as Partial<PlatformRuntimeState>|undefined;
 const platformRuntime=mergePlatformRuntimeState(currentRuntime,migratedRuntime??initialPlatformRuntimeState);
 let controlPlane:PlatformControlState;
 if(sourceSchema<CURRENT_SCHEMA_VERSION){
   controlPlane=hydrateV4PlatformState((combined.enterprise??{}) as any,combined.controlPlane as Partial<PlatformControlState>);
 }else{
   controlPlane={...initialPlatformControlState,...(combined.controlPlane??{})} as PlatformControlState;
 }
 controlPlane={...initialPlatformControlState,...controlPlane,formDrafts:Array.isArray(controlPlane.formDrafts)?controlPlane.formDrafts:[],formHistory:Array.isArray(controlPlane.formHistory)?controlPlane.formHistory:[],schemaVersion:CURRENT_SCHEMA_VERSION,releaseVersion:V6_BASELINE_RELEASE_VERSION};
 const candidate=canonicalizeRootState({...input.runtime,network,operations,platformRuntime,controlPlane},input.baseState);
 const warnings=[] as Array<{code:string;message:string}>;
 if(domainMigration.stats.manualReview)warnings.push({code:'MANUAL_DOMAIN_REVIEW',message:`${domainMigration.stats.manualReview} migrated relationship/certification records require verification review.`});
 if(sourceSchema>CURRENT_SCHEMA_VERSION)warnings.push({code:'FUTURE_SCHEMA',message:`Persisted schema ${sourceSchema} is newer than supported schema ${CURRENT_SCHEMA_VERSION}; sensitive operations should fail closed until reviewed.`});
 const metadata=buildMigrationMetadata(sourceSchema,warnings,new Date().toISOString());
 metadata.repairedReferences=domainMigration.stats.migratedAffiliations+domainMigration.stats.migratedCertifications;metadata.deprecatedDataFound=metadata.repairedReferences;
 const refs=validateReferenceIntegrity(candidate.network);if(!refs.valid)warnings.push({code:'REFERENCE_INTEGRITY',message:refs.errors.join('; ')});
 metadata.validated=Boolean(candidate.network&&candidate.platformRuntime&&candidate.controlPlane&&candidate.controlPlane.schemaVersion===CURRENT_SCHEMA_VERSION&&refs.valid);
 return {state:candidate,metadata};
}
