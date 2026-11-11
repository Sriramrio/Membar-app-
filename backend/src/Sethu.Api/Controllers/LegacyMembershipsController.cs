using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sethu.Contracts.Legacy;
using Sethu.Service.Legacy;
using Sethu.Service.Security;
namespace Sethu.Api.Controllers;
[ApiController,Authorize,Route("api/platform/historical-members")]
public sealed class LegacyMembershipsController(ILegacyMigrationService service,IAuthenticatedActorResolver identities,ITrustedPermissionStore permissions) : ControllerBase {
 private async Task<(Guid UserId,Guid TenantId,bool Allowed)> Verify(string permission,CancellationToken ct){
  var resolved=await identities.ResolveAsync(User,ct);
  if(!resolved.Succeeded||resolved.Actor is null)return (Guid.Empty,Guid.Empty,false);
  var actor=resolved.Actor; var now=DateTimeOffset.UtcNow;
  var grants=await permissions.ReadGrantsAsync(actor.UserId,actor.TenantId,ct);
  bool allowed=grants?.Any(g=>g.UserId==actor.UserId&&g.TenantId==actor.TenantId&&g.Permission==permission&&!g.Revoked&&g.StartsAt<=now&&(!g.EndsAt.HasValue||g.EndsAt.Value>now)&&g.ChapterId is null)??false;
  return (actor.UserId,actor.TenantId,allowed);
 }
 [HttpGet("batches")]
 public async Task<IActionResult> Batches(CancellationToken ct){var a=await Verify("platform.legacy_members.read",ct);return a.Allowed?Ok(await service.ListAsync(a.TenantId,ct)):Forbid();}
 [HttpGet("template")]
 public async Task<IActionResult> Template(CancellationToken ct){var a=await Verify("platform.legacy_members.read",ct);if(!a.Allowed)return Forbid();const string header="MEMBERSHIP ID,FULL NAME,E MAIL ADDRESS,MOBILE NUMBER,BUSINESS / ORGANIZATION NAME,CHAPTER";return File(System.Text.Encoding.UTF8.GetBytes(header+"\r\n"),"text/csv","sethu_historical_member_template.csv");}
 [HttpPost("upload")]
 [RequestSizeLimit(5_242_880)]
 [Consumes("multipart/form-data")]
 public async Task<IActionResult> Upload([FromForm] LegacyCsvUploadForm form,CancellationToken ct){
  var a=await Verify("platform.legacy_members.prepare",ct);if(!a.Allowed)return Forbid();
  if(form.File is null||form.File.Length==0||form.File.Length>5_000_000)return BadRequest(new{code="csv_file_size_invalid"});
  if(!string.Equals(System.IO.Path.GetExtension(form.File.FileName),".csv",StringComparison.OrdinalIgnoreCase))return BadRequest(new{code="csv_extension_required"});
  await using var stream=form.File.OpenReadStream();
  try{return Ok(await service.UploadAsync(stream,form.ChapterId,a.UserId,a.TenantId,ct));}
  catch(InvalidDataException e){return BadRequest(new{code="invalid_csv",detail=e.Message});}
 }
 [HttpGet("{batchId}/preview")]
 public async Task<IActionResult> Preview(string batchId,CancellationToken ct){
  var a=await Verify("platform.legacy_members.read",ct);if(!a.Allowed)return Forbid();
  try{return Ok(await service.PreviewAsync(batchId,a.TenantId,ct));}
  catch(InvalidOperationException e){return NotFound(new{code=e.Message});}
 }
 [HttpGet("{batchId}")]
 public async Task<IActionResult> Get(string batchId,CancellationToken ct){
  var a=await Verify("platform.legacy_members.read",ct);if(!a.Allowed)return Forbid();
  try{return Ok(await service.GetAsync(batchId,a.TenantId,ct));}
  catch(InvalidOperationException e){return NotFound(new{code=e.Message});}
 }
 [HttpGet("{batchId}/attestations")]
 public async Task<IActionResult> Attestations(string batchId,CancellationToken ct){
  var a=await Verify("platform.legacy_members.read",ct);if(!a.Allowed)return Forbid();
  return Ok(await service.GetAttestationsAsync(batchId,a.TenantId,ct));
 }
 [HttpPost("prepare")]
 public async Task<IActionResult> Prepare(LegacyPrepareRequest req,CancellationToken ct){
  var a=await Verify("platform.legacy_members.prepare",ct);if(!a.Allowed||a.TenantId!=req.TenantId)return Forbid();
  try{await service.PrepareAsync(req,a.UserId,ct);return Ok(await service.GetAsync(req.BatchId,a.TenantId,ct));}
  catch(InvalidOperationException e){return BadRequest(new{code=e.Message});}
 }
 [HttpPost("{batchId}/chapter-attest")]
 public async Task<IActionResult> ChapterAttest(string batchId,LegacyAttestRequest req,CancellationToken ct){
  var a=await Verify("platform.legacy_members.chapter_attest",ct);if(!a.Allowed)return Forbid();
  try{await service.AttestAsync(batchId,"CHAPTER",req,a.UserId,a.TenantId,ct);return Ok(await service.GetAsync(batchId,a.TenantId,ct));}
  catch(InvalidOperationException e){return BadRequest(new{code=e.Message});}
 }
 [HttpPost("{batchId}/finance-attest")]
 public async Task<IActionResult> FinanceAttest(string batchId,LegacyAttestRequest req,CancellationToken ct){
  var a=await Verify("platform.legacy_members.finance_attest",ct);if(!a.Allowed)return Forbid();
  try{await service.AttestAsync(batchId,"FINANCE",req,a.UserId,a.TenantId,ct);return Ok(await service.GetAsync(batchId,a.TenantId,ct));}
  catch(InvalidOperationException e){return BadRequest(new{code=e.Message});}
 }
 [HttpPost("{batchId}/activate")]
 public async Task<IActionResult> Activate(string batchId,CancellationToken ct){
  var a=await Verify("platform.legacy_members.activate",ct);if(!a.Allowed)return Forbid();
  try{return Ok(await service.ActivateAsync(batchId,a.UserId,a.TenantId,ct));}
  catch(InvalidOperationException e){return BadRequest(new{code=e.Message});}
 }
 [HttpPut("{batchId}/members/{membershipId}/payment")]
 public async Task<IActionResult> Payment(string batchId,string membershipId,LegacyPaymentUpdateRequest req,CancellationToken ct){
  var a=await Verify("platform.legacy_members.finance_reconcile",ct);if(!a.Allowed)return Forbid();
  try{await service.UpdatePaymentAsync(batchId,membershipId,req,a.UserId,a.TenantId,ct);return NoContent();}
  catch(InvalidOperationException e){return BadRequest(new{code=e.Message});}
 }
}

public sealed class LegacyCsvUploadForm { public IFormFile? File {get;set;} public Guid ChapterId {get;set;} }
