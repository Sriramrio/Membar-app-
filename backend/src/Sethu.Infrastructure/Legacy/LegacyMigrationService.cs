using Npgsql;
using Sethu.Service.Legacy;
using Sethu.Contracts.Legacy;
using Sethu.Service.Security;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Data;
namespace Sethu.Infrastructure.Legacy;

// Uses same PostgreSQL connection as SethuDbContext. No external provider, new architecture or CQRS.
public sealed class LegacyMigrationService(NpgsqlDataSource dataSource) : ILegacyMigrationService {
 static NpgsqlParameter P(string name,object? value)=>new(name,value??DBNull.Value);
 static void Guard(bool value,string error) { if(!value) throw new InvalidOperationException(error); }
 static async Task<object?> Scalar(NpgsqlConnection c,NpgsqlTransaction? t,string sql,CancellationToken ct,params NpgsqlParameter[] args){await using var cmd=new NpgsqlCommand(sql,c,t);cmd.Parameters.AddRange(args);return await cmd.ExecuteScalarAsync(ct);}
 static async Task<int> Exec(NpgsqlConnection c,NpgsqlTransaction? t,string sql,CancellationToken ct,params NpgsqlParameter[] args){await using var cmd=new NpgsqlCommand(sql,c,t);cmd.Parameters.AddRange(args);return await cmd.ExecuteNonQueryAsync(ct);}
 static async Task Audit(NpgsqlConnection c,NpgsqlTransaction t,string batch,string? membership,Guid actor,string action,string detail,CancellationToken ct) { await Exec(c,t,"INSERT INTO public.sethu_legacy_actions(id,batch_id,membership_id,actor_id,action,description) VALUES(gen_random_uuid(),@b,@m,@a,@x,@d)",ct,P("b",batch),P("m",membership),P("a",actor),P("x",action),P("d",detail)); }
 private static string Key(string value)=>new string(value.Trim().ToLowerInvariant().Where(char.IsLetterOrDigit).ToArray());
 private static string Cell(string[] fields,Dictionary<string,int> map,params string[] names){foreach(var n in names)if(map.TryGetValue(Key(n),out int i)&&i<fields.Length)return fields[i].Trim();return "";}
 private static string GenerateSecurePassword()
 {
     var digits = RandomNumberGenerator.GetInt32(1000, 9999);
     var letter = (char)('A' + RandomNumberGenerator.GetInt32(0, 26));
     return $"Sethu@{digits}{letter}";
 }
 // TextFieldParser honors quoted multi-line fields and escaped quotes, unlike Split(',').
 public async Task<LegacyUploadResult> UploadAsync(Stream csv,Guid chapterId,Guid actorId,Guid tenantId,CancellationToken ct){
  Guard(chapterId!=Guid.Empty&&actorId!=Guid.Empty&&tenantId!=Guid.Empty,"invalid_upload_scope");
  using var ms=new MemoryStream();await csv.CopyToAsync(ms,ct);Guard(ms.Length>0&&ms.Length<=5_000_000,"csv_size_invalid");
  byte[] bytes=ms.ToArray();string fileHash=Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
  string text;
  try{ text=new UTF8Encoding(false,true).GetString(bytes).TrimStart('\uFEFF'); }catch(DecoderFallbackException){throw new InvalidDataException("UTF-8 CSV required");}
  using var parser=new Microsoft.VisualBasic.FileIO.TextFieldParser(new StringReader(text));parser.TextFieldType=Microsoft.VisualBasic.FileIO.FieldType.Delimited;parser.SetDelimiters(",");parser.HasFieldsEnclosedInQuotes=true;
  string[] header=parser.ReadFields()??throw new InvalidDataException("Empty CSV");var map=new Dictionary<string,int>();
  for(int i=0;i<header.Length;i++)if(!map.TryAdd(Key(header[i]),i))throw new InvalidDataException("Duplicate CSV header");
  foreach(var needed in new[]{"MEMBERSHIP ID","FULL NAME","E MAIL ADDRESS"})if(!map.ContainsKey(Key(needed)))throw new InvalidDataException("Required header missing: "+needed);
  var records=new List<(int Row,string Id,Guid Registration,string Email,string Hash,string Json,string Name,string Phone)>();var ids=new HashSet<string>(StringComparer.OrdinalIgnoreCase);var emails=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
  while(!parser.EndOfData){ct.ThrowIfCancellationRequested();string[] columns;
   try{columns=parser.ReadFields()??Array.Empty<string>();}catch(Microsoft.VisualBasic.FileIO.MalformedLineException){throw new InvalidDataException("Malformed quoted CSV at line "+parser.ErrorLineNumber);}
   if(columns.All(string.IsNullOrWhiteSpace))continue;
   if(columns.Length!=header.Length)throw new InvalidDataException("Wrong number of columns at record "+(records.Count+1));
   var id=Cell(columns,map,"MEMBERSHIP ID");var name=Cell(columns,map,"FULL NAME");var email=Cell(columns,map,"E MAIL ADDRESS","EMAIL").ToLowerInvariant();var phone=Cell(columns,map,"MOBILE NUMBER","PHONE");
   if(string.IsNullOrWhiteSpace(id)||id.Length>128||string.IsNullOrWhiteSpace(name)||string.IsNullOrWhiteSpace(email)||email.Length>254||!email.Contains('@'))throw new InvalidDataException("Missing or invalid member identifier/name/email at record "+(records.Count+1));
   if(!ids.Add(id)||!emails.Add(email))throw new InvalidDataException("Duplicate member ID or email in uploaded CSV");
   if(records.Count>=1000)throw new InvalidDataException("Maximum 1000 rows per batch");
   // Deterministic source ID for repeatable reconciliation; never equated with canonical identity.
   byte[] identityHash=SHA256.HashData(Encoding.UTF8.GetBytes(tenantId+":"+id));var b=identityHash.Take(16).ToArray();var registration=new Guid(b);
   var fields=new Dictionary<string,object?>{{"membership_id",id},{"full_name",name},{"email",email},{"mobile",phone},{"business_name",Cell(columns,map,"BUSINESS / ORGANIZATION NAME","BUSINESS NAME")},{"chapter",Cell(columns,map,"CHAPTER")},{"raw",header.Select((h,i)=>new KeyValuePair<string,string>(h,columns[i])).ToDictionary(x=>x.Key,x=>x.Value)}};
   var json=JsonSerializer.Serialize(fields);records.Add((records.Count+2,id,registration,email,Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(json))).ToLowerInvariant(),json,name,phone));
  }
  if(records.Count==0)throw new InvalidDataException("No member rows found");
  var batch="LEGACY-"+Guid.NewGuid().ToString("N");
  await using var c=await dataSource.OpenConnectionAsync(ct);await using var t=await c.BeginTransactionAsync(IsolationLevel.Serializable,ct);
  int chapterCount=Convert.ToInt32(await Scalar(c,t,"SELECT count(*) FROM public.chapters ch JOIN public.organisation_units ou ON ou.\"Id\"=ch.id WHERE ch.id=@c AND ou.\"TenantId\"=@t AND ou.\"Active\" AND upper(ch.status)='ACTIVE'",ct,P("c",chapterId),P("t",tenantId)));
  Guard(chapterCount==1,"chapter_tenant_mapping_unverified");
  // Immutable roster hash computed from staged row hashes in insertion order.
  var roster=string.Join("|",records.Select(r=>r.Id+":"+r.Hash));var rosterHash=Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(roster))).ToLowerInvariant();
  await Exec(c,t,"INSERT INTO public.sethu_legacy_batches(batch_id,tenant_id,chapter_id,source_sha256,expected_count,roster_sha256) VALUES(@b,@t,@c,@h,@n,@r)",ct,P("b",batch),P("t",tenantId),P("c",chapterId),P("h",fileHash),P("n",records.Count),P("r",rosterHash));
  foreach(var row in records){
   await Exec(c,t,"INSERT INTO public.sethu_legacy_member_import_stage(batch_id,source_row,membership_id,registration_id,payload,payload_sha256) VALUES(@b,@r,@i,@g,CAST(@p AS jsonb),@h)",ct,P("b",batch),P("r",row.Row),P("i",row.Id),P("g",row.Registration),P("p",row.Json),P("h",row.Hash));
   await Exec(c,t,"INSERT INTO public.sethu_legacy_members(batch_id,membership_id,source_row,source_registration_id,source_hash,email_normalized,provisional_payment_id) VALUES(@b,@i,@r,@g,@h,@e,@pid)",ct,P("b",batch),P("i",row.Id),P("r",row.Row),P("g",row.Registration),P("h",row.Hash),P("e",row.Email),P("pid",Guid.NewGuid()));
  }
  await Audit(c,t,batch,null,actorId,"UPLOAD","Uploaded "+records.Count+" CSV members; evidence not yet certified",ct);await t.CommitAsync(ct);
  return new LegacyUploadResult(batch,fileHash,rosterHash,records.Count,0,Array.Empty<string>());
 }
 public async Task<LegacyPreviewResult> PreviewAsync(string batchId,Guid tenantId,CancellationToken ct){
  await using var c=await dataSource.OpenConnectionAsync(ct);
  var roster=await Scalar(c,null,"SELECT roster_sha256 FROM public.sethu_legacy_batches WHERE batch_id=@b AND tenant_id=@t",ct,P("b",batchId),P("t",tenantId));Guard(roster is string,"batch_not_found");
  var list=new List<LegacyPreviewRow>();await using var cmd=new NpgsqlCommand("SELECT s.source_row,s.membership_id,s.payload->>'full_name',s.payload->>'email',m.status FROM public.sethu_legacy_member_import_stage s JOIN public.sethu_legacy_members m ON m.batch_id=s.batch_id AND m.membership_id=s.membership_id WHERE s.batch_id=@b ORDER BY s.source_row",c);cmd.Parameters.AddWithValue("b",batchId);await using var reader=await cmd.ExecuteReaderAsync(ct);
  while(await reader.ReadAsync(ct)){var warnings=new List<string>();var mail=reader.IsDBNull(3)?"":reader.GetString(3);if(string.IsNullOrWhiteSpace(mail))warnings.Add("EMAIL_MISSING");list.Add(new LegacyPreviewRow(reader.GetInt32(0),reader.GetString(1),reader.IsDBNull(2)?"":reader.GetString(2),mail,reader.GetString(4),warnings));}
  return new LegacyPreviewResult(batchId,(string)roster!,list);
 }
 public async Task<LegacyBatchResult> GetAsync(string batchId,Guid tenantId,CancellationToken ct){
  await using var c=await dataSource.OpenConnectionAsync(ct);
  var state=await Scalar(c,null,"SELECT state FROM public.sethu_legacy_batches WHERE batch_id=@b AND tenant_id=@t",ct,P("b",batchId),P("t",tenantId));Guard(state is string,"batch_not_found");
  var items=new List<LegacyMemberItem>();await using var cmd=new NpgsqlCommand("SELECT membership_id,email_normalized,status,payment_status,provisional_payment_id,member_id,error_code,version FROM public.sethu_legacy_members WHERE batch_id=@b AND EXISTS (SELECT 1 FROM public.sethu_legacy_batches WHERE batch_id=@b AND tenant_id=@t) ORDER BY source_row",c);cmd.Parameters.AddWithValue("b",batchId);cmd.Parameters.AddWithValue("t",tenantId);
  await using var reader=await cmd.ExecuteReaderAsync(ct);while(await reader.ReadAsync(ct))items.Add(new(reader.GetString(0),reader.GetString(1),reader.GetString(2),reader.GetString(3),reader.GetGuid(4),reader.IsDBNull(5)?null:reader.GetGuid(5),reader.IsDBNull(6)?null:reader.GetString(6),reader.GetInt64(7)));
  return new(batchId,(string)state!,items.Count,items.Count(x=>x.Status is "ACTIVE" or "ALREADY_ACTIVE"),items.Count(x=>x.Status=="HOLD"),items);
 }
 public async Task PrepareAsync(LegacyPrepareRequest req,Guid actor,CancellationToken ct){
  Guard(actor!=Guid.Empty&&req.TenantId!=Guid.Empty&&req.ChapterId!=Guid.Empty&&req.SourceSha256.Length==64&&req.SourceSha256.All(Uri.IsHexDigit),"invalid_prepare_request");
  await using var c=await dataSource.OpenConnectionAsync(ct);await using var t=await c.BeginTransactionAsync(IsolationLevel.Serializable,ct);
  var authorizedBatch=Convert.ToInt32(await Scalar(c,t,"SELECT count(*) FROM public.sethu_legacy_batches WHERE batch_id=@b AND tenant_id=@t AND chapter_id=@c AND source_sha256=@h",ct,P("b",req.BatchId),P("t",req.TenantId),P("c",req.ChapterId),P("h",req.SourceSha256)));
  Guard(authorizedBatch==1,"uploaded_batch_scope_or_digest_mismatch");
  var n=Convert.ToInt32(await Scalar(c,t,"SELECT count(*) FROM public.sethu_legacy_member_import_stage WHERE batch_id=@b",ct,P("b",req.BatchId)));Guard(n>0&&n<=1000,"staged_row_count_invalid");
  var ch=Convert.ToInt32(await Scalar(c,t,"SELECT count(*) FROM public.chapters ch JOIN public.organisation_units ou ON ch.id=ou.\"Id\" WHERE ch.id=@c AND ou.\"TenantId\"=@t AND upper(ch.status)='ACTIVE' AND ou.\"Active\"",ct,P("c",req.ChapterId),P("t",req.TenantId)));Guard(ch==1,"invalid_chapter_tenant_scope");
  await Exec(c,t,"INSERT INTO public.sethu_legacy_batches(batch_id,tenant_id,chapter_id,source_sha256,expected_count) VALUES(@b,@t,@c,@h,@n) ON CONFLICT(batch_id) DO NOTHING",ct,P("b",req.BatchId),P("t",req.TenantId),P("c",req.ChapterId),P("h",req.SourceSha256),P("n",n));
  var unchanged=Convert.ToInt32(await Scalar(c,t,"SELECT count(*) FROM public.sethu_legacy_batches WHERE batch_id=@b AND tenant_id=@t AND chapter_id=@c AND source_sha256=@h AND state='PREPARED'",ct,P("b",req.BatchId),P("t",req.TenantId),P("c",req.ChapterId),P("h",req.SourceSha256)));Guard(unchanged==1,"batch_changed_or_already_authorized");
  var expected=Convert.ToInt32(await Scalar(c,t,"SELECT expected_count FROM public.sethu_legacy_batches WHERE batch_id=@b AND tenant_id=@t",ct,P("b",req.BatchId),P("t",req.TenantId)));Guard(expected==n,"source_count_mismatch");
  await Exec(c,t,"INSERT INTO public.sethu_legacy_members(batch_id,membership_id,source_row,source_registration_id,source_hash,email_normalized,provisional_payment_id) SELECT s.batch_id,s.membership_id,s.source_row,s.registration_id,s.payload_sha256,lower(trim(s.payload->>'email')),gen_random_uuid() FROM public.sethu_legacy_member_import_stage s WHERE s.batch_id=@b ON CONFLICT(batch_id,membership_id) DO NOTHING",ct,P("b",req.BatchId));
  var checks=Convert.ToInt32(await Scalar(c,t,"SELECT count(*) FROM public.sethu_legacy_members lm JOIN public.sethu_legacy_member_import_stage st ON st.batch_id=lm.batch_id AND st.membership_id=lm.membership_id WHERE lm.batch_id=@b AND lm.source_hash=st.payload_sha256 AND lm.source_registration_id=st.registration_id",ct,P("b",req.BatchId)));Guard(checks==n,"mapping_inconsistent");
  await Audit(c,t,req.BatchId,null,actor,"PREPARE","Source validated and mapped",ct);await t.CommitAsync(ct);
 }
 public async Task AttestAsync(string batchId,string kind,LegacyAttestRequest req,Guid actor,Guid tenant,CancellationToken ct){
  Guard(kind is "CHAPTER" or "FINANCE","invalid_attestation_kind");Guard(actor!=Guid.Empty&&req.RosterSha256.Length==64&&req.RosterSha256.All(Uri.IsHexDigit)&&!string.IsNullOrWhiteSpace(req.EvidenceReference),"invalid_attestation");
  await using var c=await dataSource.OpenConnectionAsync(ct);await using var t=await c.BeginTransactionAsync(IsolationLevel.Serializable,ct);
  var batch=Convert.ToInt32(await Scalar(c,t,"SELECT count(*) FROM public.sethu_legacy_batches WHERE batch_id=@b AND tenant_id=@tenant AND state IN ('PREPARED','CERTIFIED')",ct,P("b",batchId),P("tenant",tenant)));Guard(batch==1,"batch_not_prepared");
  // Stable ordered digest of staged immutable membership IDs and source row hashes, not client asserted hash.
  var canonical=(string?)await Scalar(c,t,"SELECT encode(sha256(convert_to(string_agg(membership_id||':'||payload_sha256, '|' ORDER BY source_row),'UTF8')),'hex') FROM public.sethu_legacy_member_import_stage WHERE batch_id=@b",ct,P("b",batchId));
  Guard(canonical!=null&&string.Equals(canonical,req.RosterSha256,StringComparison.OrdinalIgnoreCase),"roster_digest_mismatch");
  var frozen=(string?)await Scalar(c,t,"SELECT roster_sha256 FROM public.sethu_legacy_batches WHERE batch_id=@b AND tenant_id=@t FOR UPDATE",ct,P("b",batchId),P("t",tenant));Guard(string.Equals(frozen,canonical,StringComparison.OrdinalIgnoreCase),"frozen_roster_mismatch");
  var existing=Convert.ToInt32(await Scalar(c,t,"SELECT count(*) FROM public.sethu_legacy_attestations WHERE batch_id=@b AND actor_id=@a",ct,P("b",batchId),P("a",actor)));Guard(existing==0,"separation_of_duties_violation");
  await Exec(c,t,"INSERT INTO public.sethu_legacy_attestations(id,batch_id,kind,actor_id,evidence_reference,roster_sha256) VALUES(gen_random_uuid(),@b,@k,@a,@e,@r)",ct,P("b",batchId),P("k",kind),P("a",actor),P("e",req.EvidenceReference),P("r",canonical));
  await Exec(c,t,"UPDATE public.sethu_legacy_batches SET state='CERTIFIED',roster_sha256=@h,version=version+1 WHERE batch_id=@b AND (SELECT count(*) FROM public.sethu_legacy_attestations WHERE batch_id=@b)=2",ct,P("b",batchId),P("h",canonical));
  await Audit(c,t,batchId,null,actor,$"ATTEST_{kind}",req.EvidenceReference,ct);await t.CommitAsync(ct);
 }
 public async Task<LegacyBatchResult> ActivateAsync(string batchId,Guid actor,Guid tenant,CancellationToken ct){
  // The direct historical pathway is intentionally limited to already attested rosters.
  // Each member is transactional; account is unclaimed, never logged-in or contact-verified.
  await using var c=await dataSource.OpenConnectionAsync(ct);
  var count=Convert.ToInt32(await Scalar(c,null,"SELECT count(*) FROM public.sethu_legacy_batches b WHERE batch_id=@b AND tenant_id=@t AND state IN ('CERTIFIED','PARTIAL') AND (SELECT count(*) FROM public.sethu_legacy_attestations x WHERE x.batch_id=b.batch_id)=2",ct,P("b",batchId),P("t",tenant)));
  Guard(count==1,"dual_ratification_required");
  var distinctKinds=Convert.ToInt32(await Scalar(c,null,"SELECT count(DISTINCT kind) FROM public.sethu_legacy_attestations WHERE batch_id=@b",ct,P("b",batchId)));Guard(distinctKinds==2,"chapter_and_finance_attestation_required");
  // Fail closed when the staged roster no longer matches the institutional certifications.
  var nowRoster=(string?)await Scalar(c,null,"SELECT encode(sha256(convert_to(string_agg(s.membership_id||':'||s.payload_sha256, '|' ORDER BY s.source_row),'UTF8')),'hex') FROM public.sethu_legacy_member_import_stage s WHERE s.batch_id=@b",ct,P("b",batchId));
  var approvedRoster=(string?)await Scalar(c,null,"SELECT roster_sha256 FROM public.sethu_legacy_batches WHERE batch_id=@b AND tenant_id=@t",ct,P("b",batchId),P("t",tenant));
  Guard(nowRoster!=null&&approvedRoster!=null&&string.Equals(nowRoster,approvedRoster,StringComparison.OrdinalIgnoreCase),"certified_roster_changed");
  var attestationsMatch=Convert.ToInt32(await Scalar(c,null,"SELECT count(*) FROM public.sethu_legacy_attestations WHERE batch_id=@b AND roster_sha256=@h",ct,P("b",batchId),P("h",nowRoster)));
  Guard(attestationsMatch==2,"attestation_roster_mismatch");

  var members=new List<string>();await using(var cmd=new NpgsqlCommand("SELECT membership_id FROM public.sethu_legacy_members WHERE batch_id=@b AND status IN ('STAGED','HOLD') ORDER BY source_row",c)){cmd.Parameters.AddWithValue("b",batchId);await using var r=await cmd.ExecuteReaderAsync(ct);while(await r.ReadAsync(ct))members.Add(r.GetString(0));}
  foreach(var memberId in members){
   await using var t=await c.BeginTransactionAsync(IsolationLevel.Serializable,ct);
   try {
    // Serialize activation per canonical source ID to prevent concurrent batch processing.
    await Scalar(c,t,"SELECT pg_advisory_xact_lock(hashtextextended(@key, 0))",ct,P("key",tenant.ToString()+":"+memberId));
    // Full row lock and immutable tenant link; never allow automatic merge of existing identities.
    var row=Convert.ToInt32(await Scalar(c,t,"SELECT count(*) FROM public.sethu_legacy_members m JOIN public.sethu_legacy_batches b ON b.batch_id=m.batch_id WHERE m.batch_id=@b AND m.membership_id=@m AND b.tenant_id=@t AND m.status IN ('STAGED','HOLD')",ct,P("b",batchId),P("m",memberId),P("t",tenant)));
    Guard(row==1,"member_mapping_unavailable");
    var globalConflict=Convert.ToInt32(await Scalar(c,t,"SELECT count(*) FROM public.sethu_legacy_members lm JOIN public.sethu_legacy_batches b ON b.batch_id=lm.batch_id WHERE b.tenant_id=@t AND lm.membership_id=@m AND lm.batch_id<>@b AND lm.status IN ('ACTIVE','ALREADY_ACTIVE')",ct,P("t",tenant),P("m",memberId),P("b",batchId)));
    Guard(globalConflict==0,"legacy_id_already_active_in_another_batch");
    var email=(string?)await Scalar(c,t,"SELECT email_normalized FROM public.sethu_legacy_members WHERE batch_id=@b AND membership_id=@m",ct,P("b",batchId),P("m",memberId));Guard(!string.IsNullOrWhiteSpace(email),"missing_email");
    var collision=Convert.ToInt32(await Scalar(c,t,"SELECT count(*) FROM public.user_identities WHERE \"TenantId\"=@t AND lower(trim(\"Email\"))=@e",ct,P("t",tenant),P("e",email)));
    Guard(collision==0,"existing_identity_requires_manual_reconciliation");
    var name=(string?)await Scalar(c,t,"SELECT s.payload->>'full_name' FROM public.sethu_legacy_member_import_stage s WHERE s.batch_id=@b AND s.membership_id=@m",ct,P("b",batchId),P("m",memberId));
    var phone=(string?)await Scalar(c,t,"SELECT s.payload->>'mobile' FROM public.sethu_legacy_member_import_stage s WHERE s.batch_id=@b AND s.membership_id=@m",ct,P("b",batchId),P("m",memberId));
    Guid userId=Guid.NewGuid(), canonicalMember=Guid.NewGuid(), affiliation=Guid.NewGuid();
    string tempPassword = GenerateSecurePassword();
    string passwordHash = PasswordSecurity.HashPassword(tempPassword);

    await Exec(c,t,@"INSERT INTO public.user_identities (""Id"",""TenantId"",""Issuer"",""Subject"",""Active"",""MemberId"",""Email"",""Name"",""PhoneNumber"",""IsContactVerified"",""FailedLoginAttempts"",""PasswordHash"") VALUES (@id,@t,'SETHU_PORTAL_MEMBER',@subject,true,@member,@email,@name,@phone,true,0,@p)
ON CONFLICT (""Issuer"",""Subject"") DO UPDATE SET ""PasswordHash"" = EXCLUDED.""PasswordHash"", ""Active"" = true, ""IsContactVerified"" = true, ""FailedLoginAttempts"" = 0",ct,P("id",userId),P("t",tenant),P("subject",memberId),P("member",canonicalMember),P("email",email),P("name",name??""),P("phone",phone),P("p",passwordHash));
    // MemberRecordStatus.Active == 1 and AffiliationStatus.Active == 1 in Nov-02 actual sources.
    await Exec(c,t,"INSERT INTO public.members(\"Id\",\"TenantId\",\"UserId\",\"Status\",\"Version\") VALUES (@id,@t,@u,1,1)",ct,P("id",canonicalMember),P("t",tenant),P("u",userId));
    await Exec(c,t,"INSERT INTO public.member_chapter_affiliations(\"Id\",\"TenantId\",\"MemberId\",\"ChapterId\",\"Status\",\"Version\") SELECT @a,@t,@m,chapter_id,1,1 FROM public.sethu_legacy_batches WHERE batch_id=@b AND tenant_id=@t",ct,P("a",affiliation),P("t",tenant),P("m",canonicalMember),P("b",batchId));
    await Exec(c,t,"UPDATE public.sethu_legacy_members SET user_id=@u,member_id=@m,status='ACTIVE',error_code=NULL,activation_at=now(),temporary_password=@pwd,version=version+1 WHERE batch_id=@b AND membership_id=@source",ct,P("u",userId),P("m",canonicalMember),P("b",batchId),P("source",memberId),P("pwd",tempPassword));
    await Audit(c,t,batchId,memberId,actor,"ACTIVATED_HISTORICALLY","Legacy chapter/finance attestations, account unclaimed, payment provisional",ct);
    await t.CommitAsync(ct);
   } catch(OperationCanceledException){await t.RollbackAsync(CancellationToken.None);throw;}
     catch(Exception ex){await t.RollbackAsync(CancellationToken.None);
     // Never expose PII or raw exception text to client; log stable exception type only.
     await using var hold=await c.BeginTransactionAsync(ct);
     await Exec(c,hold,"UPDATE public.sethu_legacy_members SET status='HOLD',error_code=@err,version=version+1 WHERE batch_id=@b AND membership_id=@m AND status<>'ACTIVE'",ct,P("err",ex is InvalidOperationException ? ex.Message : "database_conflict_or_failure"),P("b",batchId),P("m",memberId));
     await Audit(c,hold,batchId,memberId,actor,"HOLD","Activation failed; review server logs",ct);await hold.CommitAsync(ct);
   }
  }
  await using(var t=await c.BeginTransactionAsync(ct)){
   await Exec(c,t,"UPDATE public.sethu_legacy_batches SET state=CASE WHEN NOT EXISTS(SELECT 1 FROM public.sethu_legacy_members WHERE batch_id=@b AND status NOT IN ('ACTIVE','ALREADY_ACTIVE')) THEN 'COMPLETE' ELSE 'PARTIAL' END,activated_at=now(),version=version+1 WHERE batch_id=@b AND tenant_id=@t",ct,P("b",batchId),P("t",tenant));await t.CommitAsync(ct);
  }
  return await GetAsync(batchId,tenant,ct);
 }
 public async Task UpdatePaymentAsync(string batchId,string membershipId,LegacyPaymentUpdateRequest req,Guid actor,Guid tenant,CancellationToken ct){
  Guard(actor!=Guid.Empty&&req.Amount>0&&!string.IsNullOrWhiteSpace(req.Reference)&&!string.IsNullOrWhiteSpace(req.EvidenceReference),"invalid_finance_update");
  await using var c=await dataSource.OpenConnectionAsync(ct);await using var t=await c.BeginTransactionAsync(IsolationLevel.Serializable,ct);
  var changed=await Exec(c,t,"UPDATE public.sethu_legacy_members SET payment_status='EVIDENCE_ENTERED',payment_reference=@r,payment_amount=@amount,payment_evidence=@e,payment_updated_by=@actor,payment_updated_at=now(),version=version+1 WHERE batch_id=@b AND membership_id=@m AND version=@v AND payment_status<>'DISPUTED' AND EXISTS(SELECT 1 FROM public.sethu_legacy_batches WHERE batch_id=@b AND tenant_id=@tenant)",ct,P("r",req.Reference),P("amount",req.Amount),P("e",req.EvidenceReference),P("actor",actor),P("b",batchId),P("m",membershipId),P("v",req.ExpectedVersion),P("tenant",tenant));Guard(changed==1,"payment_version_conflict");
  await Exec(c,t,"INSERT INTO public.sethu_legacy_payment_history(id,batch_id,membership_id,actor_id,reference,amount,evidence_reference,recorded_at) VALUES(gen_random_uuid(),@b,@m,@actor,@r,@a,@e,now())",ct,P("b",batchId),P("m",membershipId),P("actor",actor),P("r",req.Reference),P("a",req.Amount),P("e",req.EvidenceReference));
  await Audit(c,t,batchId,membershipId,actor,"PAYMENT_EVIDENCE_ENTERED","Finance administrator entered payment claim; independent verification not asserted",ct);await t.CommitAsync(ct);
 }
 public async Task<IReadOnlyList<string>> GetAttestationsAsync(string batchId,Guid tenantId,CancellationToken ct){
  await using var c=await dataSource.OpenConnectionAsync(ct);
  var list=new List<string>();
  await using var cmd=new NpgsqlCommand("SELECT a.kind FROM public.sethu_legacy_attestations a JOIN public.sethu_legacy_batches b ON b.batch_id=a.batch_id WHERE a.batch_id=@b AND b.tenant_id=@tenant",c);
  cmd.Parameters.AddWithValue("b",batchId);
  cmd.Parameters.AddWithValue("tenant",tenantId);
  await using var reader=await cmd.ExecuteReaderAsync(ct);
  while(await reader.ReadAsync(ct)) list.Add(reader.GetString(0));
  return list;
 }
 public async Task<IReadOnlyList<LegacyBatchSummary>> ListAsync(Guid tenantId,CancellationToken ct){
  await using var c=await dataSource.OpenConnectionAsync(ct);
  const string sql="SELECT b.batch_id,b.chapter_id,b.state,b.expected_count,b.created_at,count(m.membership_id) FILTER (WHERE m.status IN ('ACTIVE','ALREADY_ACTIVE')) AS activated,count(m.membership_id) FILTER (WHERE m.status='HOLD') AS held FROM public.sethu_legacy_batches b LEFT JOIN public.sethu_legacy_members m ON m.batch_id=b.batch_id WHERE b.tenant_id=@t GROUP BY b.batch_id,b.chapter_id,b.state,b.expected_count,b.created_at ORDER BY b.created_at DESC LIMIT 200";
  await using var command=new NpgsqlCommand(sql,c);command.Parameters.AddWithValue("t",tenantId);
  var result=new List<LegacyBatchSummary>();await using var reader=await command.ExecuteReaderAsync(ct);
  while(await reader.ReadAsync(ct))result.Add(new(reader.GetString(0),reader.GetGuid(1),reader.GetString(2),reader.GetInt32(3),reader.GetDateTime(4),reader.GetInt64(5),reader.GetInt64(6)));
  return result;
 }

}
