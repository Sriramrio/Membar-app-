namespace Sethu.Service.MemberNetwork;

public sealed record DirectoryEntry(Guid MemberId, Guid BusinessId, string BusinessName, Guid SpecialisationId, Guid ChapterId);
