using System;
using System.Collections.Generic;
using System.Text.Json;

namespace Sethu.Service.DTOs.Organisation;

public record OrgQueryFilterDto(string? field, string? @operator, object? value);

public record OrgQueryRequestDto(
    string? queryId = null,
    string? search = null,
    string? cursor = null,
    int? pageSize = null,
    string? organisationScope = null,
    Dictionary<string, object>? parameters = null,
    List<OrgQueryFilterDto>? filters = null
);

public record OrgCommandRequestDto(
    string commandId = "",
    string commandType = "",
    string aggregateType = "",
    string? aggregateId = null,
    long? expectedVersion = null,
    string organisationScope = "",
    JsonElement payload = default,
    string? reason = null
);

public record OrgCommandResultDto(
    bool success,
    string? code,
    long? newVersion,
    object? details
);
