using Sethu.TrackA.SourceTests;
using Sethu.Domain.Organisation;
using Sethu.Domain.Security;

// Authored test source only; NOT EXECUTED in Track A. No external test-package stub.
var failures = new List<string>();
void Expect(bool predicate, string name) { if (!predicate) failures.Add(name); }
var tenant = Guid.NewGuid(); var chapter = Guid.NewGuid(); var user = Guid.NewGuid();
var now = new DateTimeOffset(2026, 10, 12, 0, 0, 0, TimeSpan.Zero);
var actor = new TrustedActor(user, tenant, true, false);
var grant = new RoleGrant(user, tenant, chapter, "onboarding.committee.approve", now.AddDays(-1), now.AddDays(1), false, false);
var scope = new ScopedResource(tenant, chapter, Guid.NewGuid());
var request = new PermissionRequest("onboarding.committee.approve");
Expect(RoleScopePolicy.Evaluate(actor, scope, request, new[] { grant }, now).Allowed, "matching grant");
Expect(!RoleScopePolicy.Evaluate(actor with { SessionRevoked = true },scope,request,new[]{grant},now).Allowed,"revoked session");
Expect(!RoleScopePolicy.Evaluate(actor,scope with { TenantId = Guid.NewGuid() },request,new[]{grant},now).Allowed,"wrong tenant");
Expect(!RoleScopePolicy.Evaluate(actor,scope with { ChapterId = Guid.NewGuid() },request,new[]{grant},now).Allowed,"wrong chapter");
Expect(!RoleScopePolicy.Evaluate(actor,scope,request,new[]{grant},now.AddDays(1)).Allowed,"exclusive tenure expiry");
Expect(!RoleScopePolicy.Evaluate(actor,scope,new PermissionRequest("governance.decision.approve",true),new[]{grant},now).Allowed,"governance isolation");
var countryId=Guid.NewGuid();var stateId=Guid.NewGuid();
var country=new OrganisationUnit(countryId,tenant,UnitLevel.Country,null,"IN",true);
var state=new OrganisationUnit(stateId,tenant,UnitLevel.State,countryId,"TN",true);
var units=new Dictionary<Guid,OrganisationUnit>{{countryId,country},{stateId,state}};
Expect(OrganisationHierarchy.Validate(state,units).Allowed,"valid hierarchy");
Expect(!OrganisationHierarchy.Validate(state with {ParentId=stateId},units).Allowed,"self parent");
Expect(!OrganisationHierarchy.Validate(state with {ParentId=Guid.NewGuid()},units).Allowed,"missing parent");
var app = new CommitteeAppointment(Guid.NewGuid(),tenant,chapter,user,"secretary",now.AddDays(-1),now.AddDays(1),AppointmentStatus.Active,true);
Expect(AppointmentAuthority.CheckAppointment(app,now).Allowed,"active appointment");
Expect(!AppointmentAuthority.CheckAppointment(app,now.AddDays(1)).Allowed,"tenure expiry");
var delegation = new DelegationGrant(Guid.NewGuid(),user,Guid.NewGuid(),tenant,chapter,"onboarding.committee.approve",now.AddHours(-1),now.AddHours(1),false);
Expect(AppointmentAuthority.CheckDelegation(delegation,app,"onboarding.committee.approve",now,new[]{"onboarding.committee.approve"}).Allowed,"bounded delegation");
Expect(!AppointmentAuthority.CheckDelegation(delegation with{Revoked=true},app,"onboarding.committee.approve",now,new[]{"onboarding.committee.approve"}).Allowed,"revoked delegation");
try { B02CAppointmentDelegationTests.Validate(); } catch(Exception ex) { failures.Add(ex.Message); }
try { OrganisationCommandTests.ValidateDomainRules(); } catch(Exception ex) { failures.Add(ex.Message); }
try { B02EAuthorityBoundaryTests.Validate(); } catch(Exception ex) { failures.Add(ex.Message); }
try { B03RFinanceAndCommitteeCases.Validate(); } catch(Exception ex) { failures.Add(ex.Message); }
try { B03RFFinanceLifecycleCases.Validate(); } catch(Exception ex) { failures.Add(ex.Message); }
try { B03RGFinanceCompletionCases.Validate(); } catch(Exception ex) { failures.Add(ex.Message); }
try { B03REFinanceOwnershipCases.Validate(); } catch(Exception ex) { failures.Add(ex.Message); }
try { B03IntakeTests.Run(); } catch(Exception ex) { failures.Add(ex.Message); }
try { B0303MemberNetworkCases.Validate(); } catch(Exception ex) { failures.Add(ex.Message); }
try { B0303ReferenceCases.Validate(); } catch(Exception ex) { failures.Add(ex.Message); }
try { B0303WorkspaceCases.Validate(); } catch(Exception ex) { failures.Add(ex.Message); }
if(failures.Count>0) { Console.Error.WriteLine(string.Join("; ",failures)); Environment.ExitCode=1; }
else Console.WriteLine("Source tests passed (when executed with genuine .NET SDK).");
