export type PlatformActorRole='Platform Administrator'|'Platform Reviewer'|'Super Administrator'|string|undefined;

export function canProposePlatformConfiguration(role:PlatformActorRole){return role==='Platform Administrator'||role==='Super Administrator';}
export function canReviewPlatformConfiguration(role:PlatformActorRole){return role==='Platform Reviewer'||role==='Super Administrator';}
export function canActivatePlatformConfiguration(role:PlatformActorRole){return canReviewPlatformConfiguration(role);}
export function canRollbackPlatformConfiguration(role:PlatformActorRole){return canProposePlatformConfiguration(role);}
export function canOperatePlatformIdentity(role:PlatformActorRole){return role==='Platform Administrator'||role==='Super Administrator';}
export function canManagePlatformAssignments(role:PlatformActorRole){return role==='Platform Administrator'||role==='Super Administrator';}
export function canOperatePlatformRuntime(role:PlatformActorRole){return role==='Platform Administrator'||role==='Super Administrator';}

export function canMakeImportOperation(role:PlatformActorRole){return role==='Platform Administrator'||role==='Super Administrator';}
export function canReviewImportOperation(role:PlatformActorRole){return role==='Platform Reviewer'||role==='Super Administrator';}
export function canTestPlatformIntegration(role:PlatformActorRole){return role==='Platform Administrator'||role==='Platform Reviewer'||role==='Super Administrator';}
export function canModeratePlatform(role:PlatformActorRole){return role==='Platform Administrator'||role==='Platform Reviewer'||role==='Super Administrator';}
export function canRemediateDataQuality(role:PlatformActorRole){return role==='Platform Administrator'||role==='Super Administrator';}
export function canReviewDataQuality(role:PlatformActorRole){return role==='Platform Reviewer'||role==='Super Administrator';}
