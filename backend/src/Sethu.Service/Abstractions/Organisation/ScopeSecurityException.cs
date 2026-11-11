using System;

namespace Sethu.Service.Abstractions.Organisation;

public class ScopeSecurityException : Exception
{
    public string? ScopeId { get; }
    public string? RequestedScope => ScopeId;

    public ScopeSecurityException(string message, string? scopeId = null) 
        : base(message)
    {
        ScopeId = scopeId;
    }
}
