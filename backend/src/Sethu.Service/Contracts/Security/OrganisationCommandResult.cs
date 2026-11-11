using System.Security.Claims;
using System.Text.Json;
using System.Security.Cryptography;
using System.Text;
using Sethu.Domain.Organisation;
using Sethu.Domain.Security;

namespace Sethu.Service.Security;

public sealed record OrganisationCommandResult(bool Accepted, string Code, Guid? ResourceId, long? Version);
