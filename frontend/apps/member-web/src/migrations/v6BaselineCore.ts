export const CURRENT_SCHEMA_VERSION=6;
export const V6_BASELINE_RELEASE_VERSION='6.1.0';
export const V6_BASELINE_SCHEMA='sethu-v6';

export type MigrationWarning={code:string;message:string};
export type MigrationMetadata={migrationId:string;sourceSchema:number;targetSchema:number;migrationsApplied:string[];warnings:MigrationWarning[];repairedReferences:number;deprecatedDataFound:number;unsupportedData:number;dataLossCount:number;validated:boolean;completedAt:string};

const record=(v:unknown):Record<string,any>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
const clone=<T,>(v:T):T=>JSON.parse(JSON.stringify(v)) as T;

export function detectLegacySchemaVersion(input:unknown):number{
 const root=record(input);const cp=record(root.controlPlane);
 const explicit=Number(cp.schemaVersion??root.schemaVersion??0);
 if(Number.isFinite(explicit)&&explicit>0)return Math.trunc(explicit);
 const release=String(cp.releaseVersion??root.releaseVersion??'');const major=Number(release.split('.')[0]);
 if(Number.isFinite(major)&&major>=3&&major<=6)return major;
 if(root.memberNavigation)return 6;
 if(cp.modules||cp.permissions||cp.configurationVersions)return 5;
 if(root.enterprise||root.network?.affiliations||root.network?.certificationRecords)return 4;
 return 3;
}

function mergeObject(base:unknown,incoming:unknown){return {...record(base),...record(incoming)}}

export function canonicalizeRootState(input:unknown,base:unknown){
 const source=record(input),defaults=record(base);const out:any={...clone(defaults),...clone(source)};
 delete out.enterprise;for(const slice of ['auth','network','operations','platformRuntime','controlPlane','memberNavigation'])out[slice]=mergeObject(defaults[slice],source[slice]);
 out.controlPlane={...out.controlPlane,schemaVersion:CURRENT_SCHEMA_VERSION,releaseVersion:V6_BASELINE_RELEASE_VERSION};
 return out;
}


export function migrateLegacyNetworkDomain(networkInput:unknown,today='2026-09-24'){
 const network:any=clone(record(networkInput));
 network.members=Array.isArray(network.members)?network.members:[];network.businesses=Array.isArray(network.businesses)?network.businesses:[];
 network.affiliations=Array.isArray(network.affiliations)?network.affiliations:[];network.certificationRecords=Array.isArray(network.certificationRecords)?network.certificationRecords:[];
 let migratedAffiliations=0,migratedCertifications=0,manualReview=0;
 const affKey=(memberId:string,businessId:string)=>`${memberId}::${businessId}`;const existing=new Set(network.affiliations.map((a:any)=>affKey(a.memberId,a.businessId)));
 for(const member of network.members){const businessId=String(member.businessId??'');if(!businessId||existing.has(affKey(member.id,businessId)))continue;const business=network.businesses.find((b:any)=>b.id===businessId);if(!business)continue;const owner=Array.isArray(business.ownerMemberIds)&&business.ownerMemberIds.includes(member.id);const primary=business.primaryRepresentativeId===member.id;const relationshipType=owner?'Owner':primary?'Representative':'Unspecified';const verified=owner||primary;network.affiliations.push({id:`MIG-AFF-${member.id}-${businessId}`,memberId:member.id,businessId,relationshipType,designation:member.designation??'',primaryRepresentative:primary,authorisedRepresentative:verified,authorityLevel:owner?'Administer':primary?'Represent':'View',startsAt:today,verificationStatus:verified?'Verified':'Pending',visibility:verified?'Network':'Private',active:true,migrationSource:'legacy-member-business'});existing.add(affKey(member.id,businessId));migratedAffiliations++;if(!verified)manualReview++;}
 for(const business of network.businesses){for(const standard of Array.isArray(business.certifications)?business.certifications:[]){if(network.certificationRecords.some((c:any)=>c.businessId===business.id&&String(c.standard).toLowerCase()===String(standard).toLowerCase()))continue;network.certificationRecords.push({id:`MIG-CERT-${business.id}-${String(standard).replace(/[^A-Za-z0-9]+/g,'-')}`,businessId:business.id,standard:String(standard),verificationStatus:'Pending',migrationSource:'legacy-certification-string'});migratedCertifications++;manualReview++;}}
 return {network,stats:{migratedAffiliations,migratedCertifications,manualReview}};
}

export function validateReferenceIntegrity(networkInput:unknown){
 const n:any=record(networkInput);const members=new Set((Array.isArray(n.members)?n.members:[]).map((x:any)=>x.id));const businesses=new Set((Array.isArray(n.businesses)?n.businesses:[]).map((x:any)=>x.id));const errors:string[]=[];
 for(const a of Array.isArray(n.affiliations)?n.affiliations:[]){if(!members.has(a.memberId))errors.push(`Affiliation ${a.id} missing member ${a.memberId}`);if(!businesses.has(a.businessId))errors.push(`Affiliation ${a.id} missing business ${a.businessId}`)}
 for(const c of Array.isArray(n.certificationRecords)?n.certificationRecords:[])if(!businesses.has(c.businessId))errors.push(`Certification ${c.id} missing business ${c.businessId}`);
 return {valid:errors.length===0,errors};
}

export function migrationPlanFor(sourceSchema:number){
 const steps:string[]=[];
 if(sourceSchema<=3)steps.push('v3-account-domain-normalisation');
 if(sourceSchema<=4)steps.push('v4-enterprise-control-plane-migration');
 if(sourceSchema<=5)steps.push('v5-control-plane-canonicalisation');
 if(sourceSchema<=6)steps.push('v6-member-navigation-dashboard-normalisation');
 return steps;
}

export function buildMigrationMetadata(sourceSchema:number,warnings:MigrationWarning[]=[],now='2026-09-24T00:00:00.000Z'):MigrationMetadata{
 return {migrationId:`v6-baseline-${sourceSchema}-to-${CURRENT_SCHEMA_VERSION}`,sourceSchema,targetSchema:CURRENT_SCHEMA_VERSION,migrationsApplied:migrationPlanFor(sourceSchema),warnings,repairedReferences:0,deprecatedDataFound:0,unsupportedData:0,dataLossCount:0,validated:true,completedAt:now};
}
